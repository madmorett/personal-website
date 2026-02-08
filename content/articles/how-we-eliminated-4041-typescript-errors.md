---
title: "How We Eliminated 4,041 TypeScript Errors in 6 Months"
date: "2025-11-10"
description: "We enabled strict mode and found 4,041 errors. Here's the incremental strategy that got us to zero without breaking production."
tags: ["typescript", "engineering", "dx"]
image: "https://dev-to-uploads.s3.amazonaws.com/uploads/articles/m1x4z1ph9tqlr8fqijkf.png"
originalUrl: "https://dev.to/monest/como-eliminamos-4041-erros-de-typescript-em-6-meses-320a"
slug: "how-we-eliminated-4041-typescript-errors"
---

## 4,041 Errors at Once

When I became Head of Technology at Monest in January 2025, I found a familiar scenario: TypeScript configured with `strict: false`. The codebase was essentially JavaScript with `.ts` extensions — lacking all the type safety benefits TypeScript should provide.

I enabled `strict: true` to assess the damage. **4,041 errors.**

Fixing them all at once was impossible. The risk to production — especially for an AI-powered fintech startup — was unacceptable. We needed a strategy.

## The Strategy: Gradual, Sustainable Migration

### 1. Strict in Dev, Permissive in Prod

We ran two configurations:
- **Development:** `strict: true` — full error visibility
- **Production builds:** `strict: false` — no deployment blocking

This gave us awareness without stopping delivery.

### 2. GitHub Action for Accountability

We built a GitHub Action that counted TypeScript errors per pull request. The rule was simple: **each PR must reduce at least one error.** No exceptions — whether you're shipping a feature or fixing a bug.

This turned debt reduction from a "someday" task into an everyday habit.

![GitHub Action comment showing TypeScript error count per PR](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/d4vkvbkq6vwkz7izfkx2.png)

### 3. The Golden Rule: Production First

Our guiding principle: *"The system works in production. When choosing between changing code or types, change the types."*

We adjusted type definitions to match working code, not the other way around. Refactoring would come later, with deeper understanding of each component.

One production incident occurred when we violated this principle — trusting incorrect type definitions over functioning code. The lesson stuck.

### 4. Celebrate Progress

Error reduction metrics were part of our monthly engineering all-hands. Watching the number drop from 4,041 to 3,200 to 2,100 to 800... it turned tedious work into a shared achievement.

### 5. Special Care for Critical Code

Sensitive files — like our agreement generation logic — got dedicated tickets and careful review. Not every file should be treated as a routine fix.

## Results

**800 errors eliminated per month**, reaching **zero in 6 months.**

![Error reduction graph over 6 months](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/yb20yyy3plroi79hgzcg.png)

What we gained:
- **Confidence:** Refactoring became significantly less risky
- **Productivity:** Autocomplete actually worked
- **Quality:** Errors caught in development, not production
- **Onboarding:** New engineers could understand the codebase faster

## Key Lessons

1. **Technical debt requires consistency, not heroics.** Incremental progress beats one-time sprints.
2. **Automation enforces discipline.** The GitHub Action made debt reduction mandatory, not optional.
3. **Public visibility drives engagement.** Sharing progress created collective ownership.
4. **Production cannot await perfection.** The hybrid config gave us the best of both worlds.
5. **Types serve code, not vice versa.** When types contradict working code, question the types first.
