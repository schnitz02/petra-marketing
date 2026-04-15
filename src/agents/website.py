import json
import logging
import os
from anthropic import Anthropic
from src.agents.base import BaseAgent, parse_claude_json
from src.db.models import Idea, WebsiteChange

logger = logging.getLogger(__name__)

COMPANY_NAME = "Petra Industries"
INDUSTRY = "carpentry_and_tiling"


class WebsiteAgent(BaseAgent):
    name = "website"

    async def run(self):
        api_key = os.getenv("ANTHROPIC_API_KEY")
        if not api_key:
            raise RuntimeError("ANTHROPIC_API_KEY not set")

        # Find approved ideas that don't yet have website changes
        approved_ideas = (
            self.db.query(Idea)
            .filter(Idea.status == "approved")
            .order_by(Idea.created_at.desc())
            .limit(5)
            .all()
        )

        if not approved_ideas:
            logger.info("No approved ideas to generate website changes for")
            return {"changes_created": 0, "message": "No approved ideas"}

        # Check which ideas already have website changes
        existing_idea_ids = {
            row[0] for row in
            self.db.query(WebsiteChange.idea_id)
            .filter(WebsiteChange.idea_id.isnot(None))
            .all()
        }

        new_ideas = [i for i in approved_ideas if i.id not in existing_idea_ids]
        if not new_ideas:
            logger.info("All approved ideas already have website changes")
            return {"changes_created": 0, "message": "All ideas already processed"}

        client = Anthropic(api_key=api_key)
        created = []

        for idea in new_ideas:
            prompt = (
                f"You are a website content strategist for {COMPANY_NAME}, "
                f"an Australian {INDUSTRY} brand.\n\n"
                f"Marketing idea: {idea.title}\n"
                f"Description: {idea.body}\n\n"
                f"Generate a specific website change to support this marketing idea. "
                f"This could be a new blog post, landing page update, banner, "
                f"case study, or content refresh.\n\n"
                f"Return ONLY valid JSON:\n"
                f'{{"change_type": "blog_post|landing_page|banner|case_study|content_update", '
                f'"description": "what to change and why", '
                f'"payload": {{"title": "page/post title", "content_summary": "brief content outline", '
                f'"target_page": "which page to update or new page slug"}}}}'
            )

            try:
                response = client.messages.create(
                    model="claude-sonnet-4-6",
                    max_tokens=800,
                    messages=[{"role": "user", "content": prompt}],
                )
                raw = response.content[0].text
                parsed = parse_claude_json(raw)

                change = WebsiteChange(
                    change_type=parsed.get("change_type", "content_update"),
                    description=parsed.get("description", ""),
                    payload=parsed.get("payload", {}),
                    status="pending",
                    idea_id=idea.id,
                )
                self.db.add(change)
                self.db.commit()
                created.append({"id": change.id, "type": change.change_type})
                logger.info(f"Created website change for idea '{idea.title}'")

            except Exception as e:
                logger.error(f"Website change generation failed for idea {idea.id}: {e}")

        return {"changes_created": len(created), "changes": created}
