---
title: "One Tag, Many Listeners: Fan-out on BullMQ Without a Broker"
date: "2026-09-26"
description: "BullMQ is a job queue, not a message bus: one event, one consumer. When two clients and a few internal teams all needed the same tag, here's why we skipped RabbitMQ and built bullmq-fanout."
tags: ["bullmq", "nodejs", "nestjs", "typescript"]
image: "/images/bullmq-fanout-cover.png"
originalUrl: "https://dev.to/madmorett/one-tag-many-listeners-fan-out-on-bullmq-without-a-broker-2i3j"
slug: "one-tag-many-listeners"
---

I am the CTO of [Monest](https://monest.com.br), a Brazilian startup. We collect debt through conversations: text and voice, mostly automated, on behalf of companies that are themselves regulated and have their own compliance people asking questions.

The backend is NestJS, and NestJS points you at BullMQ for background work. So that is what we run.

BullMQ is excellent. It is fast, it is predictable, and it has survived every load we have thrown at it. We even made it survive Redis going away, which is what [bullmq-outbox](https://github.com/madmorett/bullmq-outbox) does, and I wrote about that one separately.

But BullMQ is a job queue, not a message bus, and a job queue has one rule:

**One event, one consumer.**

A job is taken by exactly one worker. That is the whole point of a work queue. It stops being enough when more than one part of the system needs to react to the same thing.

## The tag that broke it

When one of our conversations gets a tag applied to it, something meaningful just happened. A tag is how the system records what the conversation turned out to be: the debtor agreed to pay, the debtor asked to be left alone, the phone belongs to somebody else, the person says they already paid. A tag is the outcome. It is the most interesting fact our product produces.

For a while, exactly one thing happened when a tag was applied. It was written down. Fine.

Then a client integration needed to know. Their team wanted the outcome of the conversation pushed into their systems, because from their side, that is the answer to "what happened to this debt". And they wanted it in real time. Not a nightly export, not a DAG that ships yesterday's tags to a bucket in the morning. If a debtor says "I already paid" at 10:14, their operation needs to know at 10:14, before someone on their side calls that person again.

Then a second client needed to know, and wanted something completely different done with it. They did not want to be told the outcome. They wanted each tag to open a task in their CRM, so an operator on their side would pick it up and act on it. Same event, a different job, a different system on the other end.

Then internal teams started asking too, always with the same sentence: *when a tag is applied, I need to know*.

Every one of those requests was about the same moment in the system. That is a fan-out, and BullMQ does not do fan-out.

By then the list had two client companies on it, each with its own integration, its own uptime expectations, and its own people who notice when something is late. The rest were internal teams, each with its own priorities and its own tolerance for failure.

## Three obvious answers, and why we said no to all of them

### 1. Bring in a real broker

"Let's put RabbitMQ in front of this. Or Kafka. They do topics, they do fan-out, problem solved."

We took this one seriously, because it is the textbook answer. But the textbook is not paying our infra bill.

A broker is a whole new system to provision, monitor, back up, upgrade, secure, and explain to whoever is on call at 3am. For a lean team with a tight budget, that cost is real and it does not go away.

What settled it was a simple question: what was BullMQ actually failing at? Throughput? No. Reliability? No, we had already closed the one durability hole it had. Retries, backoff, dead letters, observability? All fine.

BullMQ was failing at exactly one thing, delivering one event to many consumers. That is a small hole. You do not replace the house because one window does not close.

### 2. Do everything in one consumer

Keep a single `tag-applied` worker and have it do all of it.

```ts
new Worker('tag-applied', async (job) => {
  await notifyClientOne(job.data);
  await dispatchClientTwoTask(job.data);
  await updateInternalMetrics(job.data);
});
```

It looks simple, and at first it is.

Then the first client's API has a bad ten minutes. The job fails. BullMQ retries it, as it should, and now the second client gets the same task created twice in their CRM, because step two had already succeeded. So you add idempotency everywhere. Then you wrap each step in `try/catch` so one failure does not kill the rest. Then you realize you cannot tell which step failed, because the job either succeeded or it did not.

The retry policy is also one number for three operations that deserve different ones. A client integration is worth many attempts. An internal metric is worth one and a shrug. A single job cannot express that.

What bothered me most was ownership. Every team that cares about tags would be editing the same worker, and a change for one client would go out in the same deploy as a change for another.

### 3. Emit N events from the producer

Have the publisher push to each queue directly.

```ts
await clientOneQueue.add('notify-tag-applied', payload);
await clientTwoQueue.add('dispatch-task', payload);
await metricsQueue.add('track-tag', payload);
```

At runtime, this is exactly what we want.

The problem is where this code lives. Tags get applied from more than one place, and that number only grows. Each of those places now needs the full list of queues.

So when a new consumer wants in, "where do I plug in?" has no single answer. Someone has to find every place a tag can be applied and add a line to each one, hoping they did not miss any. Miss one, and the event reaches three consumers from one code path and two from another. Nothing throws. A client's data is just wrong, and you find out from the client.

## What we needed

1. One event, many consumers, each one isolated, with its own retries, its own backlog and its own failures.
2. Subscribers declared in one readable place, not scattered across producers.
3. Publishers that do not know who is listening.
4. Consumers that are ordinary BullMQ workers, because BullMQ was never the problem.

That last point is what made this a library instead of a migration. Nothing here needs a new runtime. The fan-out can happen at publish time: one `add` per subscriber, each into its own queue.

So we wrote [**bullmq-fanout**](https://github.com/madmorett/bullmq-fanout).

## The library

An event is a declaration. It has a name, a payload schema, and the list of who gets a copy:

```ts
import { z } from 'zod';
import { defineEvent } from 'bullmq-fanout';

export const TAG_APPLIED = defineEvent({
  name: 'conversation.tag-applied',
  payload: z.object({
    conversationId: z.number(),
    tagId: z.number(),
    tagName: z.string(),
    appliedAt: z.string().datetime(),
  }),
  subscribers: [
    // Client-facing. Worth retrying hard.
    { queue: 'integration-client-one-tag-applied', job: 'client-one-notify-tag-applied', attempts: 10 },
    // A different client, a different shape, a different failure budget.
    { queue: 'integration-client-two-task-dispatch', job: 'client-two-dispatch-task' },
    // Internal. Must never slow down the two above.
    { queue: 'tag-metrics', job: 'track-tag', attempts: 1 },
  ],
});
```

Publishing does not name a queue. `eventId` turns into a deterministic job id per subscriber, so publishing the same tag twice does not create a second task in anyone's CRM:

```ts
await publisher.publish(TAG_APPLIED, payload, { eventId: String(conversationTagId) });
// { event: 'conversation.tag-applied', published: [...], failures: [] }
```

Consuming is plain BullMQ. The library is not in the path at consume time:

```ts
new Worker('integration-client-one-tag-applied', async (job) => notifyClientOne(job.data), {
  connection,
  concurrency: 2,
});
```

Under the hood this is option 3, N enqueues, but written once in a place a reviewer can see, instead of copied into every code path that applies a tag.

## Where it is today

The two client integrations run side by side on that event, for two different companies with different rules. Neither can hurt the other, and the answer to "who listens to this?" is one file that shows up in the diff when it changes.

It is not a broker: no ordering across subscribers and no replay for a consumer that joins later. If you need those, use Kafka. If you need a few teams and a couple of client integrations to react to the same moment, this is enough.

Once one event lands in several queues, the question changes from "did it work?" to "which queue is behind?". That is part of the reason I also built [Bullpane](https://bullpane.com), a self-hosted BullMQ dashboard. The free edition does everything bull-board does, with no login.

---

```bash
npm install bullmq-fanout
```

- [github.com/madmorett/bullmq-fanout](https://github.com/madmorett/bullmq-fanout)
- [github.com/madmorett/bullmq-outbox](https://github.com/madmorett/bullmq-outbox)
