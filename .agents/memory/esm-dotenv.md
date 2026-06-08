---
name: ESM dotenv hoisting
description: In ESM, dotenv.config() called in the module body runs AFTER all imports are evaluated. Use import 'dotenv/config' instead.
---

## The rule
In ESM (`"type":"module"`), `import` statements are hoisted and evaluated before any module body code runs. This means:

```js
// WRONG — authConfig.js (imported above) already ran before this line
import authConfig from './config/authConfig.js'
import dotenv from 'dotenv'
dotenv.config()   // TOO LATE — authConfig.js already read process.env
```

```js
// CORRECT — must be the very FIRST import
import 'dotenv/config'  // loads .env immediately as a side-effect import
import authConfig from './config/authConfig.js'  // now sees the env vars
```

**Why:** ES modules resolve all imports before running any module body code. By the time `dotenv.config()` executes, every imported module has already been initialized — including any that read `process.env` at initialization time (like authConfig.js which calls `Object.freeze({ JWT_SECRET: process.env.JWT_SECRET ... })`).

**How to apply:** In any ESM Express server entry point, `import 'dotenv/config'` must be line 1 before all other imports. This is the only reliable approach for ESM without top-level `await`.
