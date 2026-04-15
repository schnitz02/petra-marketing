import json
import logging
import os
from anthropic import Anthropic
from src.agents.base import BaseAgent, parse_claude_json
from src.db.models import ResearchItem

logger = logging.getLogger(__name__)

COMPANY_NAME = "Petra Industries"
INDUSTRY = "carpentry_and_tiling"
COMPETITORS = [
    "CDK Stone",
    "Metz Group",
    "Stone Alliance",
    "National Tiles",
    "Beaumont Tiles",
]


class ResearchAgent(BaseAgent):
    name = "research"

    async def run(self):
        api_key = os.getenv("ANTHROPIC_API_KEY")
        if not api_key:
            raise RuntimeError("ANTHROPIC_API_KEY not set")

        client = Anthropic(api_key=api_key)
        results = []

        for competitor in COMPETITORS:
            prompt = (
                f"You are a marketing research agent for {COMPANY_NAME}, "
                f"an Australian {INDUSTRY} brand.\n"
                f"Based on your knowledge of {competitor}'s marketing strategy, "
                f"social media presence, and recent campaigns, provide 3 key insights "
                f"that {COMPANY_NAME} could learn from or respond to.\n\n"
                f'Return ONLY valid JSON:\n'
                f'{{"insights": [{{"insight": "str", "platform": "str", "actionable": "str"}}]}}'
            )

            try:
                response = client.messages.create(
                    model="claude-sonnet-4-6",
                    max_tokens=1024,
                    messages=[{"role": "user", "content": prompt}],
                )
                raw = response.content[0].text
                parsed = parse_claude_json(raw)

                item = ResearchItem(
                    source="claude_research",
                    competitor=competitor,
                    content=json.dumps(parsed),
                    raw_data=parsed,
                )
                self.db.add(item)
                self.db.commit()
                results.append({"competitor": competitor, "status": "ok"})
                logger.info(f"Research completed for {competitor}")

            except Exception as e:
                logger.error(f"Research failed for {competitor}: {e}")
                results.append({"competitor": competitor, "status": "failed", "error": str(e)})

        return results
