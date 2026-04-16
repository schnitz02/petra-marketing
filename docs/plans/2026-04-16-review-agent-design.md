# Review Agent Design

**Date:** 2026-04-16
**Status:** Approved

## Purpose

Daily agent that analyses Petra's brand performance and competitor activity for the previous day, generating a structured review with a performance score, insights, and actionable recommendations.

## Schedule

Runs daily at 21:00 UTC, after the Research agent (06:00) and Analytics agent (20:00) so it has fresh data from both. Also triggerable manually from the Agents page.

## Database Model

New `DailyReview` table:

| Column | Type | Purpose |
|--------|------|---------|
| id | Integer PK | Auto-increment |
| review_date | Date, unique | The day being reviewed (yesterday) |
| score | Integer (0-100) | Overall performance score |
| sentiment | String | "positive" / "neutral" / "negative" |
| sections | JSON | Structured sections |
| created_at | DateTime | When the review was generated |

### Sections JSON Structure

```json
{
  "petra_performance": {
    "title": "Petra Performance",
    "summary": "...",
    "metrics": {
      "follower_change": 3,
      "new_posts": 1,
      "total_engagement": 24
    },
    "highlights": ["..."]
  },
  "competitor_activity": {
    "title": "Competitor Activity",
    "summary": "...",
    "competitors": [
      { "name": "CDK Stone", "activity": "...", "threat_level": "low" }
    ]
  },
  "key_takeaways": {
    "title": "Key Takeaways",
    "items": ["...", "..."]
  },
  "recommended_actions": {
    "title": "Recommended Actions",
    "items": [
      { "action": "...", "priority": "high", "context": "..." }
    ]
  }
}
```

## Backend Agent

**File:** `src/agents/review.py`

Inherits from `BaseAgent`, name = `"review"`.

### Data Gathering

- `SocialSnapshot`: Last 2 days for follower delta, engagement changes
- `SocialPostCache`: Posts from last 24h with likes/comments
- `ResearchItem`: Most recent competitor insights (last 24h)
- `AgentRun`: Yesterday's agent execution results
- `Idea`: New/approved/rejected ideas from yesterday
- GA4 data if connected

### Claude Prompt

- Model: `claude-sonnet-4-6`
- Input: All gathered data as context
- Output: Structured JSON matching sections schema
- Includes performance score (0-100) and sentiment
- Uses existing `parse_claude_json()` utility

### Storage

- Upsert on `review_date` (allows re-triggering to overwrite)
- Writes `DailyReview` row with score, sentiment, sections

### Registration

- Add `"review": ReviewAgent` to `AGENT_REGISTRY` in `orchestrator.py`
- Add cron schedule at 21:00 UTC daily in `scheduler.py`

## API Routes

**File:** `src/api/routes/review.py`

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/review/latest` | Most recent review |
| GET | `/api/review/history` | Last 30 reviews (id, date, score, sentiment) |
| GET | `/api/review/{id}` | Full review by ID |
| POST | `/api/review/create-idea` | Create pending Idea from a recommendation |

## Frontend

### New Page: `dashboard/src/pages/Review.jsx`

Top to bottom:
1. Header with "DAILY REVIEW" label, date selector for browsing past reviews
2. Score card — large score (0-100), sentiment colour (green/amber/red), timestamp
3. Petra Performance — slab card with metric pills and highlights
4. Competitor Activity — slab cards per competitor with threat-level badges
5. Key Takeaways — numbered items in a slab card
6. Recommended Actions — slab cards with priority badges and "Create Idea" buttons

### Overview Page Addition

New section between LinkedIn/Research and Agent Schedule:
- Slab card showing today's score, sentiment badge, 2-3 key takeaways
- Clickable, navigates to `/review`
- Empty state if no review exists

### App.jsx Changes

- Import Review page, add route `/review`
- Add nav item after Overview: `{ path: '/review', label: 'Review', icon: ReviewIcon }`
- New ReviewIcon SVG component

### Overview Agent Schedule

- Add 6th TimeCard: `time="21:00" period="Daily" agent="Review"`

### Agents Page

- Add `review` entry to `AGENT_META` with label, description, schedule, color, icon

## Design System

All new UI uses the Material Warmth design system:
- `.slab` / `.slab-dark` for cards
- `.btn-warm` for primary actions
- `.chip` for filter pills
- `.label-upper` for section labels
- `.warm-divider` for separators
- Palette: #2C2420 text, #F7F3EE background, #C8956C copper accents, #DDD7CE borders
