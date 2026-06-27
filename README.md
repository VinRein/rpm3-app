# RPM³ — Outcome Operating System

**Result → Purpose → Method → Milestones → Massive Actions → Focus 3**

## Quick Start

```bash
cd rpm3-app
npm install

# Optional: enable the AI assistant
cp .env.local.example .env.local
# then add your ANTHROPIC_API_KEY to .env.local

npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## What's built

- **Dashboard** — Create and manage Results (outcomes, not tasks)
- **Purpose panel** — Attach motivating purposes to each Result
- **Method panel** — Define and select the smartest strategic path
- **Milestones** — Sequential completed outcomes (not tasks) with active tracking
- **Massive Actions** — Brain dump + categorization per milestone, assign A/B/C focus
- **Focus 3** — Daily A/B/C priority output with reflection log
- **AI Assistant** — Context-aware coach at every level (requires API key)

## Stack

- Next.js 14 (App Router) · TypeScript · Tailwind CSS
- Zustand + localStorage persistence
- Claude API (claude-opus-4-8) for AI coaching
