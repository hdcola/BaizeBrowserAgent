---
trigger: always_on
---

## Project Overview

Baize (白泽) is a browser extension agent built with WXT (Web Extension Tools), React, and TypeScript. It leverages AI to interact with web pages.

## Technology Stack

- **Framework**: [WXT](https://wxt.dev)
- **UI Library**: React 19
- **Aesthetic**: Vanilla CSS (Rich, Premium, Dynamic)
- **Language**: TypeScript
- **Package Manager**: pnpm

## Directory Structure

- `entrypoints/`: Contains the entry points for the extension.
  - `background.ts`: The background service worker.
  - `content.ts`: Content scripts matching patterns.
  - `popup/`: The popup UI entry point (React App).
- `assets/`: Static assets like icons and images.
- `components/`: (Recommended) Shared React components.
- `utils/`: (Recommended) Shared utility functions.

## Coding Guidelines

### WXT & Extension APIs

1. **Imports**: Always import `browser` from `wxt/browser` for cross-browser compatibility (uses `webextension-polyfill`).
   ```typescript
   import { browser } from "wxt/browser";
   ```
2. **Entry Points**: Use the `define*` helpers for type-safe entry point definitions.
   ```typescript
   export default defineBackground(() => { ... });
   export default defineContentScript({ ... });
   ```
3. **Storage**: Prefer `wxt/storage` for typed storage items, or `browser.storage.local`.

### React & UI

1. **Components**: Use Functional Components with Hooks.
2. **State**: Use appropriate state management (local state for UI, extension storage for persistent data).
3. **Styling**:
   - Use **Vanilla CSS**.
   - Focus on **Premium Aesthetics**: Smooth gradients, glassmorphism, micro-animations, and modern typography.
   - Avoid generic/default browser styles.
   - Ensure specific styles for the extension to avoid conflicts with host pages (using Shadow DOM or high-specificity selectors for content scripts).

### TypeScript

1. **Strict Typing**: No explicit `any`. Define interfaces for props and data structures.
2. **Async/Await**: Use async/await for asynchronous operations, especially browser API calls.

### Internationalization (i18n)

1.  **API**: Use the standard Web Extension `browser.i18n` API.
2.  **Helper**: Use the `i18n` helper from `@/utils/i18n` in React components for type safety and cleaner code.
    ```typescript
    import { i18n } from "@/utils/i18n";
    // ...
    {
      i18n("messageKey");
    }
    ```
3.  **Locale Files**:
    - English: `public/_locales/en/messages.json`
    - Simplified Chinese: `public/_locales/zh_CN/messages.json`
4.  **Workflow**: When adding new text, add entries to both locale files and use the key in the code.

### AI Context

- The agent interacts with the DOM. Ensure generic selectors are robust.
- Separate "Reading" logic (getting text) from "Action" logic (clicking, typing).

## Workflow

1. **Modifying Config**: Check `wxt.config.ts`.
2. **Adding Assets**: Place in `assets/` and reference correctly.
3. **Building**: Use `pnpm wxt build`.
