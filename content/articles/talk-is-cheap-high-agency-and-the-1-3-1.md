---
title: "Talk Is Cheap: High-Agency and the 1-3-1 Technique"
date: "2026-08-08"
description: "I used to be a complainer who thought he was a problem-solver. Two techniques fixed that — and changed how I design bureaucracy as a leader."
tags: ["leadership", "career", "management"]
image: "https://dev-to-uploads.s3.us-east-2.amazonaws.com/uploads/articles/9j93dvzn8hx9r1uyjnuz.png"
originalUrl: "https://dev.to/madmorett/talk-is-cheap-high-agency-e-a-tecnica-do-1-3-1-15em"
slug: "talk-is-cheap-high-agency-and-the-1-3-1"
---

Since the start of my career I've always been very ambitious. On day one of my first job I was already walking in thinking: *what works well here, what doesn't, and how can I stand out?* That classic intern proactivity of someone who wants to win at life.

The problem is that, as time went by, I noticed something uncomfortable: I was much more of a **complainer** than a **problem-solver**.

Until one day I heard from my boss:

> Talk is cheap.

## What I wasn't seeing

I could see a thousand inefficiencies in the company. And my tunnel vision only knew how to produce one thought: *"my God, I'm going to complain, there's no way nobody sees this"*.

Today, in the position I'm in, leading a technology area with more than 50 people, I know exactly why nobody was "seeing" it.

Everybody saw it. It just wasn't a priority.

You can't guarantee maximum efficiency in everything at the same time. You have to **choose the battles you'll fight**. In the end, what matters is the P&L showing a positive result, controlled margin, costs under control. And, in the priority queue, that inefficiency that intern Matheus and junior Matheus could see was barely relevant against the macro picture.

That doesn't mean it wasn't important. It means that, among all the problems a leadership team has to solve, that one wasn't the priority **at that moment**.

And here's the turning point: leadership didn't need one more person pointing at the problem. It needed someone willing to solve it without consuming their attention.

When I heard "talk is cheap" from my CEO, the message was clear: *you complaining about this to me every week won't change anything. You thinking through and applying a solution is what counts.*

Today, even holding the top technology role, I have to take the same care — not flood the CEO with useless complaints. And for that I keep two techniques in my head at all times.

## Technique 1: the 1-3-1

Instead of showing up complaining about something, you show up with:

- **1 problem** — clear, with measurable impact
- **3 possible solutions** — with honest trade-offs
- **1 recommendation** — the one you'd execute now, with the information and conditions you have

![The 1-3-1 technique](https://dev-to-uploads.s3.us-east-2.amazonaws.com/uploads/articles/9j93dvzn8hx9r1uyjnuz.png)

The effect this has on whoever is listening is huge. You stop sounding like *"there's a problem, fix it for me"* and start sounding like:

> I'm seeing a problem, but you can stay focused on your priorities, because I've already thought it through and I'm going to execute a solution. Do you agree with the direction?

Today, as a director, this is music to my ears. And that person is definitely the one I remember when a leadership role opens up or a new area needs someone to own it.

### A concrete example

Bad:

> "Our CI pipeline is unbearable, it takes 40 minutes, nobody can stand it anymore."

1-3-1:

> **Problem:** CI takes 40min per PR. With ~60 PRs/week, that's ~40h of waiting per week across the team, and people stopped running the suite locally because "let CI catch it" became a habit.
>
> **Options:**
> 1. Parallelize the suite across 4 workers — cuts it to ~12min, runner cost goes up ~R$ 800/month, 2 days of work.
> 2. Run only the tests affected by the PR diff and the full suite on merge — cuts it to ~6min, but requires dependency mapping and carries false-negative risk.
> 3. Upgrade the runner machine — cuts it to ~25min, cost goes up ~R$ 1,500/month, half a day of work.
>
> **Recommendation:** option 1. Best gain/risk ratio, reversible, and doesn't depend on a refactor. I'll start Thursday if there's no objection.

The second version isn't longer on a whim. It transfers the cognitive work from the person deciding to the person proposing, which is exactly the point.

## Technique 2: high-agency culture

The other thing that helped me a lot was understanding the **high-agency pyramid** and where I stood on it.

![High-Agency Pyramid](https://dev-to-uploads.s3.us-east-2.amazonaws.com/uploads/articles/16u7e381rv1kmlt1lw0o.png)

From the bottom up:

1. **Waits to be told.** Executes when asked.
2. **Asks what to do.** Identifies something is wrong and hands the decision back.
3. **Recommends and waits for approval.** This is where the 1-3-1 lives.
4. **Acts and reports immediately.** Decides, executes, communicates right after.
5. **Owner.** Acts within their domain and reports on the normal cadence, because trust is already established.

The top of the pyramid is the **owner**: the person who acts and then reports what the action was and what the result was. It's a bolder step than the 1-3-1, and it's worth a lot more, but it only works if your company actually empowers a culture of *"ask for forgiveness, not permission"*.

If your company has that culture, that's definitely what I recommend.

### How to choose between 1-3-1 and owner

The ruler I use is simple: **what's the cost of being wrong?**

- **Two-way door** (reversible — feature flag, internal refactor, a squad process change): act. Report afterwards. Level 4 or 5.
- **One-way door** (hard or expensive to undo — database migration, contract, change that impacts a client, structural architecture decision): use the 1-3-1. Align first.

Confusing the two is the most common mistake on both sides. Senior people asking permission for reversible things stall the team. People acting alone on one-way doors cause incidents.

## What this changes when you're on the other side of the table

This is where it gets interesting for those who lead.

If you're a director or in leadership, this changes **how you design your company's bureaucracy**.

Leadership will never have eyes on everything. And an inefficiency that looks irrelevant from up top can be a massive bottleneck for day-to-day operations. So what's the worst role you can take on?

**Being the bottleneck that stops high-agency people from shining.**

If every improvement has to go through you, you've just turned your calendar into the company's growth ceiling. Good people will try two or three times, hit the approval queue, and drop back to level 1 of the pyramid. Then you look at the team and think "why does nobody take initiative here?".

Building a culture with **quality controls, but without bureaucracy that discourages action** is fundamental for the team to evolve on its own. In practice, that means replacing prior approval with guardrails:

- Structural decisions become RFC/ADR — public document, async discussion, recorded decision.
- Quality becomes automation — review, tests, lint, PR size limits — not a person on call to say "go ahead".
- Domains have explicit owners, so people know where they have full autonomy and where they need to align.

The rule I try to follow: **control at the exit, not at the entrance.** You don't ask permission to try, you make sure what comes out has quality.

## Why this matters even more in a growing company

For a growing company this is vital, because it's exactly through these movements that **new leaders emerge**.

A new area being created needs someone to guide it. And guess who you pick? Not the one who complained the loudest. The one who was already operating as an owner without anyone telling them to.

At Monest we went from a technology team of 10 people in January 2025 to more than 50 in June 2026. Building a data-driven culture, with quality control and without bureaucracy, was essential for us to grow while optimizing efficiency instead of turning into an approval-meeting machine.

## Closing

If you're early in your career and see a thousand things wrong where you work: congratulations, you have the eye. You're missing the second half.

Pick **one**. The one that hurts the most. Build the 1-3-1. Take it.

And if you lead: look at your process and honestly ask how many reversible decisions are still going through you. Each one of them is a high-agency person waiting in line.

Talk is cheap. It always was.
