# Baize (白泽) - Development Rules & Guidelines

## 1. Project Overview & Tech Stack

**Baize** is an AI-powered browser agent extension built with:

- **Core Framework**: [WXT](https://wxt.dev) (Web Extension Tools)
- **UI Framework**: React 19 + TypeScript
- **Styling**: Vanilla CSS (Premium, Glassmorphism, Dynamic) - _No Tailwind_
- **State/AI UI**: [assistant-ui](https://github.com/assistant-ui/assistant-ui) for chat interface
- **Package Manager**: pnpm

## 2. Directory Structure

```text
/
├── entrypoints/
│   ├── background.ts      # Service Worker (LLM calls, Tab management)
│   ├── content.ts         # Page Analysis, DOM Actions (Scroll, Click, Screenshot)
│   └── sidepanel/         # Main Chat UI (Recommended over popup for persistent chat)
│       ├── App.tsx
│       └── index.html
├── components/            # Shared React Components (Visuals, Layouts)
├── services/              # Core Business Logic
│   ├── llm/               # LLM Provider Adapters (Gemini, OpenAI, Ollama)
│   ├── storage/           # Chrome Storage Wrappers
│   └── dom/               # Complex DOM analysis logic
├── utils/                 # Helpers (i18n, formatting)
├── tests/                 # Test Suites
│   ├── unit/              # Vitest Unit Tests
│   └── e2e/               # Playwright E2E Tests
├── assets/                # Static Assets
└── public/
    └── _locales/          # i18n JSON files
```

## 3. Core Implementation Rules

### 3.1 LLM Service & Configuration

- **Unified Interface**: All LLM calls must go through a unified `LLMService`.
- **Provider Pattern**: Implement separate adapters for `GeminiProvider`, `OpenAIProvider`, `OllamaProvider`.
- **Configuration**:
  - Model configs must be **data-driven** (loaded from a user-editable or extensible JSON structure).
  - Support `Base URL`, `API Key`, `Model Name` for all providers.
  - **Local Models**: Allow empty API keys for local endpoints (e.g., Ollama).

### 3.2 Data Management (wxt/storage)

- **Privacy First**: All user data resides in `local` storage.
- **Keys Hierarchy**:
  - `user:settings`: Language, Quick Prompts, Theme.
  - `user:models`: List of configured model providers.
  - `chat:history`: Persisted conversation logs.
- **Export**: Implement export logic in `utils/export.ts` (Markdown, HTML, PDF).

### 3.3 DOM Interactions (Content Script)

- **Separation of Concerns**:
  - **Read**: Extract text, analyzing DOM structure.
  - **Action**: `scrollPage`, `clickElement`, `captureScreen`.
- **Visual Understanding**:
  - Use `html2canvas` or Extension API `captureVisibleTab` for screenshots.
  - Pass screenshots to Multimodal LLMs when visual analysis is needed.
- **Robust Selectors**: When generating selectors for AI to click, prefer semantic attributes (`id`, `aria-label`, `role`) over fragile XPath or CSS chains.

### 3.4 UI & Styling (Premium Vanilla CSS)

- **Aesthetics**:
  - Use **Glassmorphism** (backdrop-filter: blur).
  - Smooth transitions (cubic-bezier) for opening/closing/expanding.
  - System font stack (Inter, SF Pro).
- **Isolation**:
  - All Content DOM UI must be inside a **Shadow DOM** to prevent style leakage from the host page.
  - Sidepanel/Popup UI uses standard CSS.

### 3.5 i18n (Internationalization)

- **Mandatory**: No hardcoded strings in UI components.
- **Library**: Use `wxt/i18n` or a lightweight utility wrapping `chrome.i18n`.
- **Structure**:
  - `public/_locales/en/messages.json`
  - `public/_locales/zh_CN/messages.json`

## 4. Coding Standards

### TypeScript

- **Strict Mode**: Enabled.
- **No Any**: Use specific types or Generics.
- **Interfaces**: Define strictly typed interfaces for all LLM responses (Function Calls).

### React

- **Hooks**: Use custom hooks for logic encapsulations (e.g., `useChat`, `useScroll`).
- **Components**: Functional components only.

## 5. Security

- **Content Security Policy (CSP)**: Ensure WXT config allows connection to user-defined LLM Base URLs (may need optional permissions or specific manifest adjustments).
- **API Keys**: stored in `chrome.storage.local`, never logged to console/telemetry.

## 6. Workflow

- **Lint**: Run `eslint` before commit.
- **Build**: `pnpm build` should generate valid Manifest V3 output.

## 7. Testing Strategy

### 7.1 Unit Testing (Vitest)

- **Framework**: Use `vitest` for fast, lightweight unit testing.
- **Scope**:
  - **Shared Utils**: Test all helper functions in `utils/`.
  - **Business Logic**: Test `LLMService`, `StorageService` (mocking browser APIs).
  - **React Components**: Test isolated components using `@testing-library/react`.
- **Mocking**: Use `vi.mock` for external dependencies and `wxt/testing` helpers if available.

### 7.2 E2E Testing (Playwright)

- **Framework**: Use `Playwright` for robust browser automation testing.
- **Scope**:
  - **Extension Loading**: Verify the extension loads correctly in Chrome/Safari.
  - **User Flows**: Test critical paths (e.g., Open Sidepanel -> Send "Summarize" -> Verify Output).
  - **Settings Persistence**: Change settings in UI -> Reload -> Verify state.
- **Environment**: CI pipeline should run E2E tests in a headless browser environment.

## 8. Reference

- [Gemini API Reference](https://github.com/googleapis/js-genai/blob/main/codegen_instructions.md)
