---
title: "Why You Shouldn't Use 'as' in TypeScript"
date: "2024-11-03"
description: "Type assertions feel safe but hide runtime errors. Here's why zod is almost always the better choice."
tags: ["typescript", "engineering", "dx"]
image: "https://dev-to-uploads.s3.amazonaws.com/uploads/articles/zncmicygnyq2l5akx598.png"
originalUrl: "https://dev.to/madmorett/why-you-shouldnt-use-as-in-typescript-3e5i"
slug: "why-you-shouldnt-use-as-in-typescript"
---

## The Problem With `as`

TypeScript's `as` operator lets you tell the compiler "trust me, I know what this is." It's powerful — and dangerously easy to misuse.

```typescript
const value: unknown = getValueFromSomewhere();
const valueAsString = value as string;
```

This compiles without errors. But if `value` isn't actually a string? Silent runtime failure.

## Where It Goes Wrong

### With Fetch

```typescript
async function fetchData() {
  const response = await fetch('https://api.example.com/data');
  const data = await response.json() as MyDataType;
  return data;
}
```

`fetch` doesn't guarantee the shape of returned data. The API could change, return an error object, or send malformed JSON. Your `as` assertion silently accepts all of it.

### With JSON.parse

```typescript
const jsonString = '{"name": "John", "age": 30}';
const parsedData = JSON.parse(jsonString) as MyDataType;
```

Same problem. No runtime validation. If the string doesn't match your type, you won't know until something breaks downstream.

## The Solution: Runtime Validation with Zod

`zod` validates data at runtime, ensuring it matches your expected shape before your code touches it.

### With Fetch

```typescript
import { z } from 'zod';

const MyDataType = z.object({
  name: z.string(),
  age: z.number(),
});

async function fetchData() {
  const response = await fetch('https://api.example.com/data');
  const json = await response.json();

  const result = MyDataType.safeParse(json);
  if (!result.success) {
    throw new Error('Invalid data');
  }

  return result.data;
}
```

### With JSON.parse

```typescript
const jsonString = '{"name": "John", "age": 30}';
const json = JSON.parse(jsonString);

const result = MyDataType.safeParse(json);
if (!result.success) {
  console.error(result.error);
} else {
  console.log('Valid data:', result.data);
}
```

Now you get a clear error at the boundary — not a mysterious `undefined is not a function` three layers deep.

## When `as` Is Acceptable

**Gradual TypeScript migration.** When converting a large JavaScript codebase, temporary `as` usage maintains compatibility while you incrementally add proper types:

```typescript
function processData(data: any) {
  const typedData = data as MyDataType;
  // Processing logic
}
```

This should be temporary. Replace it with proper validation as migration progresses.

## The Takeaway

`as` tells the compiler to stop helping you. In most cases, that's the opposite of what you want. Use runtime validation at system boundaries — API responses, user input, parsed data — and let TypeScript do its job everywhere else.
