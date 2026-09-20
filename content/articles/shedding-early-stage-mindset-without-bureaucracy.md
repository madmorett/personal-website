---
title: "Shedding the Early-Stage Mindset Without Creating Bureaucracy"
date: "2026-01-11"
description: "How we scaled from 12 to 35 engineers while cutting support tickets by 50% — without killing startup speed."
tags: ["leadership", "scaling", "engineering"]
image: "https://dev-to-uploads.s3.amazonaws.com/uploads/articles/uhg4udvjc434oz7rt2d4.png"
originalUrl: "https://dev.to/madmorett/como-tirar-o-mindset-de-early-stage-sem-criar-burocracia-3glj"
slug: "shedding-early-stage-mindset-without-bureaucracy"
---

## The Growing Pain

When a team grows from 12 to 35 people, everything that "just worked" starts breaking. Implicit knowledge evaporates. Code that one person understood now confuses three. Deployments that were casual become risky.

But team members resist change. "We've always done it this way." The challenge isn't implementing processes — it's doing it without killing the speed that made the company successful in the first place.

## Four Concrete Changes

### 1. Mandatory End-to-End Testing

Previously, testing was manual or absent. At 12 people, you could hold the whole system in your head. At 35, you can't. E2E tests became the safety net that let us deploy 80+ times per week with confidence.

### 2. Real TypeScript Typing

We had TypeScript, but it was JavaScript with `.ts` extensions. `any` everywhere. When the codebase became too complex for implicit understanding, proper types became essential — not for purity, but for productivity.

### 3. Observability via New Relic

We moved from reproducing errors locally (detective work) to data-driven debugging. When something breaks at scale, you need dashboards, not guesswork.

### 4. RFC Process for Features

We required lightweight documentation for product-changing features. Not for bugfixes. Not a 10-page spec. A short RFC that forces you to think before you build.

## Winning Through Data, Not Authority

The approach that worked: show measurable results rather than impose rules. After one year:

- **50% reduction** in support tickets
- **36% fewer post-mortems** despite 3x team size and 80+ weekly deployments

Numbers speak louder than mandates. When the team sees that proper typing catches bugs before production, they adopt it willingly — not because you told them to.

## Knowing Where NOT to Over-Engineer

Equally important is restraint:

- E2E tests required, not 100% coverage
- RFC for features, not bugfixes
- Gradual type migration rather than forced conversion

The guiding question for every new process: **"Does this help us deliver better, or just add work?"**

## The Lesson

Growth is painful. The processes that protected you at 12 people will strangle you at 35. But the answer isn't "add process everywhere" — it's finding the minimum structure that maximizes quality without sacrificing speed.

---

*This is part of a series about lessons from my first year as Head of Technology.*
