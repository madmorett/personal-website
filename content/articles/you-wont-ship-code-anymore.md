---
title: "You Won't Ship Code Anymore. You'll Ship Teams That Ship Code."
date: "2026-02-22"
description: "The hardest part of becoming Head of Engineering: watching PRs you'd have written differently — and learning when not to touch them."
tags: ["leadership", "cto", "engineering-management"]
image: ""
originalUrl: "https://dev.to/madmorett/voce-nao-vai-entregar-mais-codigo-19nl"
slug: "you-wont-ship-code-anymore"
---

When you're a dev, you control the quality of what leaves your hands. If something goes to production with your name on it, you make sure it's the way you want it.

When you become Head, that changes. You don't ship code anymore. You ship teams that ship code.

And it hurts.

## The despair of seeing "different"

In the beginning, I'd look at what was being delivered and panic. I'd see a PR and think "I would have done this differently". I'd see an architecture and think "that's not how I'd do it".

The temptation was to stick my finger in everything. Micromanage every decision, every IF, every variable name.

I actually did that. It doesn't scale. You become the bottleneck, the team stops thinking for itself, and you can't do your real job.

## Letting the team learn

There was a PR where I saw technical debt. Nothing critical, but clear debt. I let it go. I wanted to see if the team would notice on its own.

They did. Fixed it the following sprint. Without me saying a word.

Of course, there's debt and there's debt. If it had been critical, I would have stepped in. But part of scaling is knowing where you can let the team learn by itself.

Your role is to build the system. Not to operate the system.

## How we did it at Monest 💜

To scale quality without micromanaging, we built layers of protection:

**Automation.** Lint, typing, code standards. If it can be automated, the machine enforces it.

**AI as a guardian.** Dozens of guidelines feed an internal agent. That same AI reviews PRs, and its approval is mandatory. If you code with AI, it already follows the Monest standard.

**RFC before, ADR after.** Big features go through an RFC on GitHub, approved by a Tech Lead. After delivery, an ADR documents the decisions. The AI has context from start to finish.

**Documentation that breathes.** Engineering pillars in Notion. And one document everybody knows: "What does a good dev do here?". Soft skills, hard skills, clear expectations. Dev, Tech Lead, Data Engineer — each role has its own.

**Rituals and culture.** Engineering All-Hands, Post-Mortems, internal Tech Talks. None of it works if the team doesn't buy in. Culture is the last line of defense.

## The surprise

When you build that system and that culture, something unexpected happens.

You stop seeing "different" deliveries. You start seeing deliveries that are better than what you would have done.

Today I have tech leads and engineers shipping far better than I would.

Your role is to make sure the quality bar is high. The team does the rest. And outgrows you.

## The lesson

My job is no longer to ship code. It's to build the system that lets 40+ people ship at the level Monest needs.

If I still wanted to control every line, we'd still be 12.

---

*This is the sixth post in a series about lessons from my first year as Head of Technology.*
