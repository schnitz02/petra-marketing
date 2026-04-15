import json
import logging
import os
from anthropic import Anthropic
from src.agents.base import BaseAgent, parse_claude_json
from src.db.models import Idea, ResearchItem

logger = logging.getLogger(__name__)

COMPANY_NAME = "Petra Industries"
INDUSTRY = "carpentry_and_tiling"


class StrategyAgent(BaseAgent):
    name = "strategy"

    async def run(self):
        api_key = os.getenv("ANTHROPIC_API_KEY")
        if not api_key:
            raise RuntimeError("ANTHROPIC_API_KEY not set")

        # Gather recent research for context
        recent_research = (
            self.db.query(ResearchItem)
            .order_by(ResearchItem.created_at.desc())
            .limit(10)
            .all()
        )

        research_context = ""
        for item in recent_research:
            try:
                content = json.loads(item.content) if isinstance(item.content, str) else item.content
                insights = content.get("insights", []) if isinstance(content, dict) else []
                for ins in insights[:2]:
                    research_context += f"- {item.competitor}: {ins.get('insight', '')}\n"
            except (json.JSONDecodeError, TypeError):
                pass

        prompt = (
            f"You are a marketing strategist for {COMPANY_NAME}, "
            f"an Australian {INDUSTRY} brand specialising in premium porcelain, "
            f"natural stone, tiles, and engineered timber flooring.\n\n"
            f"Recent competitive intelligence:\n{research_context or 'No recent research available.'}\n\n"
            f"Generate 5 creative marketing ideas that {COMPANY_NAME} could execute. "
            f"Each idea should be specific, actionable, and suitable for an Australian audience. "
            f"Consider website content, social media campaigns, partnerships, events, or thought leadership.\n\n"
            f"Return ONLY valid JSON:\n"
            f'{{"ideas": [{{"title": "short title", "body": "2-3 sentence description", '
            f'"evidence": "why this would work based on research or industry trends"}}]}}'
        )

        client = Anthropic(api_key=api_key)
        response = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=1500,
            messages=[{"role": "user", "content": prompt}],
        )
        raw = response.content[0].text
        parsed = parse_claude_json(raw)

        ideas = parsed.get("ideas", []) if isinstance(parsed, dict) else []
        created = []

        for idea_data in ideas:
            idea = Idea(
                title=idea_data.get("title", "Untitled"),
                body=idea_data.get("body", ""),
                evidence=idea_data.get("evidence", ""),
                status="pending",
            )
            self.db.add(idea)
            self.db.commit()
            created.append({"id": idea.id, "title": idea.title})
            logger.info(f"Created idea: {idea.title}")

        return {"ideas_created": len(created), "ideas": created}
