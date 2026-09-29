---
title: "100 million BullMQ jobs a day, and the dashboard we needed to watch them"
date: "2026-09-29"
description: "bull-board behind a VPN worked until the team grew and we needed to know who deleted a job. Taskforce gave us alerts. Neither fit, so I built Bullpane: a self-hosted BullMQ dashboard with job search, roles, an audit log, and reads that never hurt production Redis."
tags: ["bullmq", "nodejs", "redis", "opensource"]
image: "/images/bullpane-cover.png"
slug: "best-bullmq-dashboard"
---

At [Monest](https://monest.com.br) we run everything after the webhook on BullMQ. Messages come in, get queued, an agent drafts a reply, we send it. Today that is more than 100 million jobs a day.

At some point somebody said the obvious thing: we need to *see* these jobs.

## bull-board: good, until the team grew

We installed bull-board. It was nice. It worked. It did exactly what it says.

The first problem showed up on day one: it had no login. Easy fix. We put it behind the VPN and added a user and a password in front of it.

Then the team grew, and the questions changed:

- What if someone deletes a job? How do we find out who?
- Who paused this queue, and why?
- Can devs look, and only tech leads retry or remove?

None of that was possible. One shared password means everyone is everyone.

## Taskforce: alerts, and a UI that got in the way

So we moved to Taskforce, the dashboard from the BullMQ team. The alerts were genuinely useful. Day to day, though, the UI felt slow and clunky to the people who lived in it.

## So I built the one I wanted

That is [Bullpane](https://bullpane.com).

![Bullpane Overview: the queues breaking an alert rule are at the top, with the value, the window and the threshold](/images/bullpane/01-overview-needs-attention.png)

What it does:

- **The queues that need you are at the top.** Open it and you see which queues are breaking a rule (`25% failed · 15m > 3%`, `780 waiting > 200`) before anything else.
- **⌘K to jump to any queue** on any connection.
- **Search inside job data.** "Which job had order 81723?" In bull-board, search matches queue names. Here you search the payload, bounded and resumable, so it never blocks Redis.
- **BullMQ Pro groups** shown as groups: waiting, limited, maxed, paused, with concurrency and rate limit per group.

![Searching inside job payloads: 43 matches, whole state scanned](/images/bullpane/02-search-inside-job-data.png)

And for the team problems that started all this (Pro):

- **Roles.** Devs get viewer, tech leads get operator, and the server enforces it on every API call, not just by hiding buttons.
- **Audit log.** Who paused the queue, who removed the job, who hit retry-all, from which IP. Append-only, CSV export.
- **SSO** over OIDC or SAML, so you stop sending invites one by one.
- **Alerts** per queue, per folder or per whole connection, to Slack or a webhook.
- **Folders** to group queues the way the team thinks about them.

![Audit log: every action with who, what, the result and the IP. A viewer's retry-all shows up as refused](/images/bullpane/05-audit-log.png)

![Users and roles: admin, operator, viewer](/images/bullpane/04-roles.png)

## The part I cared about most: not hurting Redis

A dashboard that slows down the workload it watches is worse than no dashboard. At 100M jobs a day, the dashboard is a guest in a very busy Redis. So:

- No `KEYS`, ever. Discovery is a bounded `SCAN`, cached.
- One round trip per read: counts and pages are Lua scripts over `EVALSHA`.
- Payloads are truncated **inside Redis**. A page of 200 jobs with 1 MB payloads costs 7 ms; a search over 1,000 of them, 8 ms.
- Writes go through the official `bullmq` client. I never reimplemented its Lua.
- A read-only mode for the first days on production.

The numbers and the hostile-load test are in the repo: [STRESS-TEST.md](https://github.com/madmorett/bullpane/blob/main/docs/STRESS-TEST.md).

## Try it

- **Live demo, no login:** [demo.bullpane.com](https://demo.bullpane.com) (read-only, a simulated busy company)
- **Run it next to your stack:**

```sh
git clone https://github.com/madmorett/bullpane && cd bullpane
docker compose up -d
```

Then add your Redis URL. Start with `BULLPANE_READ_ONLY=true`.

The core is free and MIT, with no account and no login. Pro (roles, audit, SSO, alerts, folders) is USD 39/month per installation, unlimited users.

It is what we run at Monest today. If you try it on your queues, tell me what broke: hello@bullpane.com or an issue on [GitHub](https://github.com/madmorett/bullpane).
