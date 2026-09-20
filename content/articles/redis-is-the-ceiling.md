---
title: "Redis Is the Ceiling: Why I Built bullmq-outbox"
date: "2026-09-20"
description: "I went out for lunch and came back to a full Redis. Every job that failed to enqueue was gone, not delayed. Here's the fallback that turned data loss into latency."
tags: ["bullmq", "redis", "nodejs", "architecture"]
image: "/images/bullmq-outbox-cover.png"
originalUrl: "https://dev.to/madmorett/redis-is-the-ceiling-why-i-built-bullmq-outbox-3llj"
slug: "redis-is-the-ceiling"
---

In April 2025 I went out for a barbecue lunch. I came back, opened the dashboard, and something had degraded in production.

I am the CTO of [Monest](https://monest.com.br), a debt collection company built on AI. The shape of our business is simple. A debtor sends a message saying they want to negotiate, we queue it, an agent drafts a response, we reply. Messages come in through a webhook. Everything after the webhook is BullMQ.

That afternoon we were processing messages far slower than they were arriving. The queue backed up. Waiting jobs piled up in Redis. And Redis filled.

A full Redis does not slow down. It refuses. `queue.add()` rejected, the webhook returned an error, and the message was gone. Not delayed. Gone. There was nothing to retry, because nothing had ever been written down.

We were losing negotiations. That is the part that matters. We were not dropping jobs. We were dropping people who were trying to pay us.

## The flaw is not a bug

I like BullMQ a lot. We run it in production and we are not moving off it. But it has one property you have to design around.

**Redis is the ceiling.**

Every job you have not processed yet lives in RAM. Your backlog and your memory limit are the same number. So anything that widens the gap between arrival rate and processing rate walks you toward that limit:

- A slow downstream dependency. Consumers get slower, `waiting` grows, memory grows.
- One oversized payload. Someone ships a job carrying a whole document instead of an id, and a queue that used to cost kilobytes now costs megabytes.
- A traffic spike you did not plan for.

Payload guards catch the cases you thought of. Alerts tell you after `waiting` is already large, which is exactly when you have the fewest options.

And the obvious answer, "put it on a cluster", does not do what people assume it does.

## Redis Cluster does not split a queue

This is worth spelling out, because it is the most common reply to this problem and it is wrong in a specific way.

BullMQ lays a queue out as a set of keys sharing one qualified name: `bull:orders:wait`, `bull:orders:meta`, `bull:orders:id`, `bull:orders:<jobId>`, and so on. Its operations are Lua scripts, and a single `add` touches several of those keys at once. The wait list, the counter, the job hash, the marker.

In Redis Cluster, a Lua script may only touch keys that live in the same hash slot. So every BullMQ-on-Cluster setup gives the queue a hash tag. You name it `{orders}` instead of `orders`, which forces all of its keys onto one slot.

That is what makes it work. It is also what caps it.

**A hash slot is not divisible.** It lives on exactly one node, in that node's memory. So Cluster distributes *queues* across nodes. It never distributes *one queue* across nodes.

The consequence is not that you have a bigger ceiling. It is that you have several smaller ones, and a queue is bound to whichever one it landed on:

- The limit for a queue is the memory of the single node holding its slot, not the memory of the cluster.
- One hot queue can fill its node while the rest of the cluster sits nearly empty. The cluster is fine. Your queue is not.
- Adding nodes does not help the queue that is in trouble. Resharding moves whole slots. It cannot move half of one, so the queue lands somewhere else, intact, with the same problem.

Cluster raises your total capacity and changes nothing about the failure you actually hit. The ceiling for any given queue is still a single machine's RAM. When you reach it, the enqueue fails and the job disappears, because the queue is the only place that job ever existed.

That is the part worth fixing.

## What I built that afternoon

The fix is old and boring, which is why it works. An **outbox**.

If the write to the queue fails, write the job somewhere else, somewhere with a different failure domain, and put it back when the queue recovers.

I wrapped our queues so that every `add()` had a `catch`. On failure, the job went to DynamoDB: queue name, job name, payload, options, status `PENDING`. A cron ran every 15 minutes, read the pending rows, and re-enqueued them through the real queue.

Three details decided whether this actually worked.

**The original error is still thrown.** The outbox buys you a replay, not a lie. The caller still finds out the enqueue failed and still decides what to tell the user.

**Job options are preserved.** `jobId`, `attempts`, `backoff`, all serialized and restored on replay. Without `jobId`, replay is not idempotent and you trade lost jobs for duplicated ones.

**The recovery loop does not share the failure it is recovering from.** This is the one people get wrong. Our scheduler runs on a separate, dedicated Redis. A drain loop living inside the Redis that just died never fires, and you find out on Monday.

One more thing, learned the hard way. Set `reserved-memory-percent` on your Redis parameter group. A Redis at 100% of `maxmemory` does not fail cleanly. It hangs, and BullMQ hangs with it, because `maxRetriesPerRequest: null` is required by the framework and ioredis will retry forever. Reserving a slice makes the OOM arrive as an error you can actually catch. An outbox that never receives an error is not an outbox.

Also, not every queue should be captured. We excluded the real-time conversation queues. A chat turn replayed fifteen minutes later is worse than one never sent.

## Then it paid for itself

Some time later, a regression shipped. One specific queue started writing payloads larger than planned, past the payload guards we already had. Those guards existed. It happened anyway.

The Redis backing that queue hit its limit again.

And nothing happened.

Everything that failed to enqueue went to DynamoDB. The cron picked it up and replayed it. No lost jobs, no lost negotiations, no incident call.

The difference between April and that day was not that we had gotten better at preventing a full Redis. We had not. The difference was that hitting the ceiling stopped being a data-loss event and became a latency event.

That is the whole argument. You will not prevent every one of these. You can decide what one costs you.

## Why it is a package now

The Monest version was tied to things you do not have: NestJS, DynamoDB, our module structure. So I rewrote it as [**bullmq-outbox**](https://github.com/madmorett/bullmq-outbox).

```ts
import { createOutbox } from 'bullmq-outbox';
import { Queue } from 'bullmq';

const outbox = createOutbox({ store: myStore });
const emails = outbox.wrapQueue(new Queue('emails'));

// Behaves exactly like the queue you passed in, until Redis says no.
await emails.add('welcome', { userId: 1 });
```

Then drain from somewhere with its own failure domain:

```ts
const result = await outbox.flush(50);
// { requeued: 12, failed: 0, skipped: 3, expired: 0 }
```

Design decisions worth stating, because they are the opinionated part.

**Zero dependencies. It does not even import `bullmq`.** The wrapper is structural, so v5, v6 and BullMQ Pro all work from one build. `wrapQueue` is a Proxy, not a subclass, for the same reason: groups, batches and every other method pass straight through.

**No storage adapters ship with it.** Your outbox belongs in a database you already operate and already back up. You write four functions: `save`, `loadPending`, `markProcessed`, `markFailed`. Working Postgres, Redis, MongoDB and DynamoDB implementations live in `examples/` as files to copy, each with its schema.

**It is not a broker.** Redis stays the queue. This is a fallback, and it should stay boring.

The integration tests break a real Redis for real. `maxmemory` is set just above current usage, so writes are rejected with the same `OOM command not allowed` error ElastiCache throws. A fake queue can prove the logic. It cannot prove the package survives the thing it exists for.

## The number to watch

Not the count of replayed jobs. The **age**.

`onJobRequeued` gives you `ageMs`, how long that job sat in the outbox before it made it back. That is your real recovery time, and it is the number that tells you whether the fallback is working or quietly filling up. A count of 40 tells you nothing. Forty jobs with an average age of four hours tells you your drain is broken.

Which, of course, is easier to see when you can actually see your queues. If you want the best tool on the market to watch BullMQ jobs, use [**Bullpane**](https://bullpane.com). Self-hosted, and the free edition has no login at all.

---

`npm install bullmq-outbox` · [GitHub](https://github.com/madmorett/bullmq-outbox)

If you fan one event out to many queues, [**bullmq-fanout**](https://github.com/madmorett/bullmq-fanout) composes with it. Wrap your queues first and the fan-out inherits the durability.
