# Review Agent Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a daily Review Agent that analyses Petra's brand performance and competitor activity, generating structured insights with a performance score and actionable recommendations viewable in the dashboard.

**Architecture:** New `DailyReview` model stores one review per day with structured JSON sections. `ReviewAgent` inherits from `BaseAgent`, gathers data from social snapshots, research items, and agent runs, then calls Claude to synthesise a review. New API routes serve the data. New frontend page with summary card on Overview.

**Tech Stack:** FastAPI, SQLAlchemy, Anthropic SDK (claude-sonnet-4-6), React, Tailwind CSS v4, Recharts (existing)

---

### Task 1: Add DailyReview database model

**Files:**
- Modify: `src/db/models.py` (append after WebsiteChange class, ~line 93)

**Step 1: Add the DailyReview model**

Add this class at the bottom of `src/db/models.py`, after the `WebsiteChange` class:

```python
class DailyReview(Base):
    __tablename__ = "daily_reviews"
    id = Column(Integer, primary_key=True)
    review_date = Column(DateTime, unique=True, nullable=False)
    score = Column(Integer, default=50)
    sentiment = Column(String(20), default="neutral")
    sections = Column(JSON)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
```

**Step 2: Verify the app starts**

Run: `cd src && python -c "from db.models import DailyReview; print('OK')"`
Expected: `OK`

**Step 3: Commit**

```bash
git add src/db/models.py
git commit -m "feat: add DailyReview database model"
```

---

### Task 2: Create the Review Agent

**Files:**
- Create: `src/agents/review.py`

**Step 1: Create the agent file**

Create `src/agents/review.py` with this content:

```python
import json
import logging
import os
from datetime import datetime, timedelta, timezone

from anthropic import Anthropic
from sqlalchemy import func

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
            f'  "score": <0-100 integer performance score>,\n'
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
            f'      "competitors": [{{"name": "<name>", "activity": "<what they did>", "threat_level": "<low|medium|high>"}}]\n'
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
```

**Step 2: Verify the import works**

Run: `cd src && python -c "from agents.review import ReviewAgent; print('OK')"`
Expected: `OK`

**Step 3: Commit**

```bash
git add src/agents/review.py
git commit -m "feat: create ReviewAgent with data gathering and Claude synthesis"
```

---

### Task 3: Register agent in orchestrator and scheduler

**Files:**
- Modify: `src/agents/orchestrator.py` (add import + registry entry)
- Modify: `src/core/scheduler.py` (add cron job)

**Step 1: Add to orchestrator.py**

Add import at line 7 (after WebsiteAgent import):
```python
from src.agents.review import ReviewAgent
```

Add to `AGENT_REGISTRY` dict:
```python
    "review": ReviewAgent,
```

**Step 2: Add to scheduler.py**

Add after the website agent cron job (after line 53):
```python
        # Review agent — daily at 21:00 UTC
        self.scheduler.add_job(
            _run_sync, CronTrigger(hour=21, minute=0),
            args=["review"], id="review_daily", replace_existing=True,
        )
```

**Step 3: Verify app starts**

Run: `cd src && python -c "from agents.orchestrator import AGENT_REGISTRY; print(list(AGENT_REGISTRY.keys()))"`
Expected: List includes `"review"`

**Step 4: Commit**

```bash
git add src/agents/orchestrator.py src/core/scheduler.py
git commit -m "feat: register ReviewAgent in orchestrator and scheduler (21:00 UTC)"
```

---

### Task 4: Create API routes for review data

**Files:**
- Create: `src/api/routes/review.py`
- Modify: `src/main.py` (mount router)

**Step 1: Create the review routes file**

Create `src/api/routes/review.py`:

```python
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from src.db.database import get_db
from src.db.models import DailyReview, Idea

router = APIRouter()


@router.get("/latest")
def get_latest_review(db: Session = Depends(get_db)):
    review = (
        db.query(DailyReview)
        .order_by(DailyReview.review_date.desc())
        .first()
    )
    if not review:
        return None
    return {
        "id": review.id,
        "review_date": review.review_date.isoformat() if review.review_date else None,
        "score": review.score,
        "sentiment": review.sentiment,
        "sections": review.sections,
        "created_at": review.created_at.isoformat() if review.created_at else None,
    }


@router.get("/history")
def get_review_history(db: Session = Depends(get_db)):
    reviews = (
        db.query(DailyReview)
        .order_by(DailyReview.review_date.desc())
        .limit(30)
        .all()
    )
    return [
        {
            "id": r.id,
            "review_date": r.review_date.isoformat() if r.review_date else None,
            "score": r.score,
            "sentiment": r.sentiment,
        }
        for r in reviews
    ]


@router.get("/{review_id}")
def get_review_by_id(review_id: int, db: Session = Depends(get_db)):
    review = db.query(DailyReview).filter(DailyReview.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    return {
        "id": review.id,
        "review_date": review.review_date.isoformat() if review.review_date else None,
        "score": review.score,
        "sentiment": review.sentiment,
        "sections": review.sections,
        "created_at": review.created_at.isoformat() if review.created_at else None,
    }


class CreateIdeaRequest(BaseModel):
    action: str
    context: str = ""


@router.post("/create-idea")
def create_idea_from_review(req: CreateIdeaRequest, db: Session = Depends(get_db)):
    idea = Idea(
        title=req.action[:200],
        body=req.action,
        evidence=req.context or "Generated from Daily Review recommendation",
        status="pending",
    )
    db.add(idea)
    db.commit()
    return {"id": idea.id, "title": idea.title, "status": "pending"}
```

**Step 2: Mount the router in main.py**

Add import in `src/main.py` after the existing route imports (~line 59):
```python
    from src.api.routes.review import router as review_router
```

Add router registration after the approvals router (~line 69):
```python
    app.include_router(review_router, prefix="/api/review")
```

**Step 3: Verify the server starts**

Run: `python -m src.main` (briefly, then Ctrl+C)
Expected: No import errors

**Step 4: Commit**

```bash
git add src/api/routes/review.py src/main.py
git commit -m "feat: add review API routes (latest, history, by-id, create-idea)"
```

---

### Task 5: Add DailyReview to dashboard reset endpoint

**Files:**
- Modify: `src/api/routes/dashboard.py` (~line 9 import, ~line 64 delete list)

**Step 1: Add DailyReview import**

In `src/api/routes/dashboard.py`, add `DailyReview` to the imports from `src.db.models` (line 9):

```python
from src.db.models import (
    SocialSnapshot, AgentRun, Idea, WebsiteChange,
    ResearchItem, SocialPostCache, SocialAnalysis, Approval,
    DailyReview,
)
```

**Step 2: Add to reset endpoint**

Add `DailyReview` to the model list in the `reset_all_data` function (line 64):

```python
    for model in [ResearchItem, SocialSnapshot, SocialPostCache, SocialAnalysis,
                  AgentRun, Idea, Approval, WebsiteChange, DailyReview]:
```

**Step 3: Commit**

```bash
git add src/api/routes/dashboard.py
git commit -m "feat: include DailyReview in dashboard reset endpoint"
```

---

### Task 6: Add Review page to frontend (Review.jsx)

**Files:**
- Create: `dashboard/src/pages/Review.jsx`

**Step 1: Create the Review page component**

Create `dashboard/src/pages/Review.jsx` — a full page with:
- Header: "DAILY REVIEW" label-upper, "Review" h1, warm-divider
- Date navigation: left/right arrows to browse past reviews, fetches from `/api/review/history`
- Score card: large score number (0-100) coloured by sentiment (green >= 60, amber 40-59, red < 40), sentiment badge
- Petra Performance section: slab card with metric pills (follower change, new posts, engagement) and bullet highlights
- Competitor Activity section: slab cards per competitor with threat-level badges (coloured: low=green, medium=amber, high=red)
- Key Takeaways: slab card with numbered items
- Recommended Actions: slab cards with priority badges and "Create Idea" btn-warm button that POSTs to `/api/review/create-idea`
- Loading skeleton state
- Empty state when no reviews exist

Uses: `api` from `../api`, `formatDateTime` from `../utils/date`, Material Warmth classes (`.slab`, `.slab-dark`, `.btn-warm`, `.label-upper`, `.warm-divider`)

**Step 2: Verify no syntax errors**

Run: `cd dashboard && npx vite build 2>&1 | tail -5`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add dashboard/src/pages/Review.jsx
git commit -m "feat: add Review page with score card, sections, and create-idea flow"
```

---

### Task 7: Wire Review page into App.jsx

**Files:**
- Modify: `dashboard/src/App.jsx`

**Step 1: Add import, route, and nav item**

In `dashboard/src/App.jsx`:

1. Add import at line 5 (after Overview import):
```javascript
import Review from './pages/Review'
```

2. Add nav item to `NAV_ITEMS` array, as the second item (after Overview, before Social Stats):
```javascript
  { path: '/review', label: 'Review', icon: ReviewIcon },
```

3. Add route inside `<Routes>` after the Overview route:
```jsx
<Route path="/review" element={<Review />} />
```

4. Add ReviewIcon function (after OverviewIcon, before SocialIcon):
```jsx
function ReviewIcon({ active }) {
  return (
    <svg className="w-[18px] h-[18px] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  )
}
```

**Step 2: Verify build**

Run: `cd dashboard && npx vite build 2>&1 | tail -5`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add dashboard/src/App.jsx
git commit -m "feat: wire Review page into routing and sidebar navigation"
```

---

### Task 8: Add review summary card to Overview page

**Files:**
- Modify: `dashboard/src/pages/Overview.jsx`

**Step 1: Add review data fetching and summary card**

In `dashboard/src/pages/Overview.jsx`:

1. Add a new state for review data and fetch it alongside the overview data
2. Add a new section between the LinkedIn/Research two-up grid and the Agent Schedule section
3. The card should be a clickable `.slab` that navigates to `/review` and shows:
   - Score (large number, coloured by sentiment)
   - Sentiment badge
   - 2-3 key takeaway lines from `sections.key_takeaways.items`
   - "View full review" link
4. Show empty state if no review exists yet

Also update the Agent Schedule to include a 6th TimeCard:
```jsx
<TimeCard time="21:00" period="Daily" agent="Review" color="#C8956C" />
```

And update the grid from `lg:grid-cols-5` to `lg:grid-cols-6` for the Agent Schedule.

**Step 2: Verify build**

Run: `cd dashboard && npx vite build 2>&1 | tail -5`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add dashboard/src/pages/Overview.jsx
git commit -m "feat: add review summary card and Review TimeCard to Overview"
```

---

### Task 9: Add review agent to Agents page

**Files:**
- Modify: `dashboard/src/pages/Agents.jsx`

**Step 1: Add review to AGENT_META**

Add after the `website` entry in `AGENT_META`:

```javascript
  review: {
    label: 'Review Agent',
    description: 'Analyses daily brand and competitor performance via Claude AI',
    schedule: 'Daily at 21:00 UTC',
    color: '#C8956C',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
```

**Step 2: Verify build**

Run: `cd dashboard && npx vite build 2>&1 | tail -5`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add dashboard/src/pages/Agents.jsx
git commit -m "feat: add Review Agent to Agents page meta"
```

---

### Task 10: Final build, verify, and push

**Step 1: Full build**

Run: `cd dashboard && npm run build`
Expected: Build succeeds with no errors

**Step 2: Preview all pages**

Start the dev server and visually verify:
- `/review` page renders with empty/loading state
- `/` Overview shows the review summary card (empty state) and Review TimeCard
- `/agents` shows the Review Agent card
- Sidebar shows Review nav item under Overview

**Step 3: Push to GitHub**

```bash
git push origin main
```
