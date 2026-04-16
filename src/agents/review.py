import json
import logging
import os
from datetime import datetime, timedelta, timezone

from anthropic import Anthropic

from src.agents.base import BaseAgent, parse_claude_json
from src.db.models import (
    DailyReview, SocialSnapshot, SocialPostCache,
    ResearchItem, AgentRun, Idea,
)

logger = logging.getLogger(__name__)

COMPANY_NAME = "Petra Industries"
COMPETITORS = ["CDK Stone", "Metz Group", "Stone Alliance", "National Tiles", "Beaumont Tiles"]


class ReviewAgent(BaseAgent):
    name = "review"

    async def run(self):
        api_key = os.getenv("ANTHROPIC_API_KEY")
        if not api_key:
            raise RuntimeError("ANTHROPIC_API_KEY not set")

        now = datetime.now(timezone.utc)
        yesterday = now - timedelta(days=1)
        day_start = yesterday.replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day_start + timedelta(days=1)

        # --- Gather data ---
        context = self._gather_context(day_start, day_end)

        # --- Build prompt ---
        prompt = self._build_prompt(context, day_start)

        # --- Call Claude ---
        client = Anthropic(api_key=api_key)
        response = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=2500,
            messages=[{"role": "user", "content": prompt}],
        )
        raw = response.content[0].text
        parsed = parse_claude_json(raw)

        # --- Store review ---
        score = parsed.get("score", 50)
        sentiment = parsed.get("sentiment", "neutral")
        sections = parsed.get("sections", {})
        # Store score reasoning alongside sections for frontend display
        sections["score_reasoning"] = parsed.get("score_reasoning", "")

        existing = (
            self.db.query(DailyReview)
            .filter(DailyReview.review_date == day_start)
            .first()
        )
        if existing:
            existing.score = score
            existing.sentiment = sentiment
            existing.sections = sections
            existing.created_at = now
        else:
            review = DailyReview(
                review_date=day_start,
                score=score,
                sentiment=sentiment,
                sections=sections,
            )
            self.db.add(review)

        self.db.commit()
        logger.info(f"Review for {day_start.date()} saved — score={score}, sentiment={sentiment}")

        return {"review_date": str(day_start.date()), "score": score, "sentiment": sentiment}

    def _gather_context(self, day_start, day_end):
        # Social snapshots: last 2 days
        snapshots = (
            self.db.query(SocialSnapshot)
            .filter(SocialSnapshot.platform == "linkedin")
            .order_by(SocialSnapshot.scraped_at.desc())
            .limit(2)
            .all()
        )
        follower_today = snapshots[0].followers if len(snapshots) > 0 else None
        follower_yesterday = snapshots[1].followers if len(snapshots) > 1 else None
        follower_change = (follower_today - follower_yesterday) if (follower_today and follower_yesterday) else 0

        # Recent posts
        recent_posts = (
            self.db.query(SocialPostCache)
            .filter(SocialPostCache.platform == "linkedin")
            .order_by(SocialPostCache.scraped_at.desc())
            .limit(10)
            .all()
        )
        total_engagement = sum(p.likes + p.comments for p in recent_posts)
        new_posts_count = len([p for p in recent_posts if p.scraped_at and p.scraped_at >= day_start])

        # Research items from the last 24h
        research = (
            self.db.query(ResearchItem)
            .filter(ResearchItem.created_at >= day_start)
            .order_by(ResearchItem.created_at.desc())
            .all()
        )
        research_summaries = []
        for item in research:
            try:
                content = json.loads(item.content) if isinstance(item.content, str) else item.content
                insights = content.get("insights", []) if isinstance(content, dict) else []
                for ins in insights[:3]:
                    research_summaries.append(f"- {item.competitor}: {ins.get('insight', '')}")
            except (json.JSONDecodeError, TypeError):
                pass

        # Agent runs from yesterday
        agent_runs = (
            self.db.query(AgentRun)
            .filter(AgentRun.started_at >= day_start, AgentRun.started_at < day_end)
            .all()
        )
        agent_summary = [
            f"- {r.agent_name}: {r.status}" + (f" (error: {r.log[:100]})" if r.log and r.status == "failed" else "")
            for r in agent_runs
        ]

        # Ideas created/actioned yesterday
        recent_ideas = (
            self.db.query(Idea)
            .filter(Idea.created_at >= day_start, Idea.created_at < day_end)
            .all()
        )
        ideas_summary = [f"- [{i.status}] {i.title}" for i in recent_ideas]

        return {
            "follower_today": follower_today,
            "follower_change": follower_change,
            "new_posts_count": new_posts_count,
            "total_engagement": total_engagement,
            "research_summaries": research_summaries,
            "agent_summary": agent_summary,
            "ideas_summary": ideas_summary,
        }

    def _build_prompt(self, ctx, day_start):
        research_text = "\n".join(ctx["research_summaries"]) or "No competitor research collected today."
        agents_text = "\n".join(ctx["agent_summary"]) or "No agents ran today."
        ideas_text = "\n".join(ctx["ideas_summary"]) or "No new ideas today."

        return (
            f"You are a marketing performance analyst for {COMPANY_NAME}, "
            f"an Australian brand specialising in premium porcelain, natural stone, tiles, "
            f"and engineered timber flooring.\n\n"
            f"Generate a daily performance review for {day_start.strftime('%A, %d %B %Y')}.\n\n"
            f"== PETRA'S METRICS ==\n"
            f"LinkedIn followers: {ctx['follower_today'] or 'unknown'} (change: {ctx['follower_change']:+d})\n"
            f"New posts today: {ctx['new_posts_count']}\n"
            f"Total recent engagement (likes+comments): {ctx['total_engagement']}\n\n"
            f"== COMPETITOR INTELLIGENCE ==\n{research_text}\n\n"
            f"== AGENT RUNS ==\n{agents_text}\n\n"
            f"== MARKETING IDEAS ==\n{ideas_text}\n\n"
            f"Competitors being tracked: {', '.join(COMPETITORS)}\n\n"
            f"Return ONLY valid JSON with this exact structure:\n"
            f'{{\n'
            f'  "score": <0-100 integer, Petra\'s overall performance score>,\n'
            f'  "score_reasoning": "<2-3 sentences explaining WHY this score was given — reference specific metrics, trends, or events that drove it up or down>",\n'
            f'  "sentiment": "<positive|neutral|negative>",\n'
            f'  "sections": {{\n'
            f'    "petra_performance": {{\n'
            f'      "title": "Petra Performance",\n'
            f'      "summary": "<2-3 sentence summary>",\n'
            f'      "metrics": {{"follower_change": <int>, "new_posts": <int>, "total_engagement": <int>}},\n'
            f'      "highlights": ["<highlight 1>", "<highlight 2>"]\n'
            f'    }},\n'
            f'    "competitor_activity": {{\n'
            f'      "title": "Competitor Activity",\n'
            f'      "summary": "<2-3 sentence summary>",\n'
            f'      "competitors": [{{"name": "<name>", "activity": "<what they did>", "threat_level": "<low|medium|high>", "score": <0-100 integer, this competitor\'s estimated performance score based on available intelligence>}}]\n'
            f'    }},\n'
            f'    "key_takeaways": {{\n'
            f'      "title": "Key Takeaways",\n'
            f'      "items": ["<takeaway 1>", "<takeaway 2>", "<takeaway 3>"]\n'
            f'    }},\n'
            f'    "recommended_actions": {{\n'
            f'      "title": "Recommended Actions",\n'
            f'      "items": [{{"action": "<action>", "priority": "<high|medium|low>", "context": "<why>"}}]\n'
            f'    }}\n'
            f'  }}\n'
            f'}}'
        )
