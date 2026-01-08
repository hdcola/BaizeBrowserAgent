# Baize (白泽) - Browser Agent

AI-powered browser agent using WXT, React, and TypeScript.

## Tech Stack

- **Core**: [WXT](https://wxt.dev), React 19, TypeScript, pnpm
- **Style**: Vanilla CSS (Premium, Glassmorphism, Dynamic)

## Structure

```text
/
├── entrypoints/        # Extension Entry Points
│   ├── background.ts   # Service Worker
│   ├── content.ts      # Page Interactions
│   └── popup/          # UI (React App)
├── components/         # Shared React Components
├── utils/              # Helper Functions
├── assets/             # Images/Icons
└── public/             # Static Files
    └── _locales/       # i18n (en, zh_CN)
```

## Guidelines

### WXT & APIs

- **Import**: `import { browser } from "wxt/browser";`
- **Define**: Use `defineBackground`, `defineContentScript`.
- **Storage**: Use `wxt/storage`.

### UI & Styling

- **React**: Functional components + Hooks.
- **CSS**: Vanilla only. Aim for "Premium" (gradients, micro-animations).
- **Isolation**: Use specific selectors/shadow DOM to avoid host conflicts.

### TypeScript

- **Strict**: No `any`. Define proper interfaces.
- **Async**: Use `async/await`.

### i18n

- **Usage**: `import { i18n } from "@/utils/i18n";` -> `i18n("key")`
- **Files**: `public/_locales/{en,zh_CN}/messages.json`

### AI Context

- **Selectors**: Use robust, generic selectors that withstand layout changes.
- **Logic**: Separate Reading (DOM analysis) vs Action (Interaction).

## Workflow

- **Dev**: `pnpm dev:chrome` / `pnpm dev:safari`
- **Build**: `pnpm build:chrome` / `pnpm build:safari`
- **Config**: `wxt.config.ts`
