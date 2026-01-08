---
trigger: always_on
---

# Project Context: Baize Browser Agent

## Project Overview

Baize (formerly Gemini Agent) is a Safari/Chrome/Edge browser extension that leverages Google's Gemini AI to interact with web pages. It is built using WXT (Web Extension Tools), React, and TypeScript.

## key Tech Stack

- **Framework**: [WXT](https://wxt.dev/) for cross-browser extension development.
- **Frontend**: React 19, TypeScript, Vanilla CSS/Sass.
- **AI**: `@google/genai` for communicating with Gemini models.
- **Icons**: `lucide-react`.
- **Markdown**: `react-markdown` with `remark-gfm` and `react-syntax-highlighter`.

## Architecture

- **Entrypoints** (`src/entrypoints/`):
  - `popup`: Main UI for the extension action.
  - `sidepanel`: Alternative UI (e.g., chat sidebar).
  - `background.ts`: Service worker logic.
  - `content.ts`: Content scripts for interacting with page DOM (reading content, clicking links).
- **Components** (`src/components/`):
  - `ChatApp`: Core chat interface logic (used in both popup and sidepanel).
- **Services** (`src/services/`):
  - `gemini.ts`: Handles API calls to Gemini, manages streaming responses and function calling.
- **Utils** (`src/utils/`):
  - `i18n.ts`: Custom hook for internationalization (en/zh).
  - `storage.ts`: Typesafe wrapper around `wxt/storage` or `chrome.storage`.

## Coding Guidelines

1.  **Component Structure**:
    - Use functional components with typed props.
    - Keep logic within `src/components` when reusable.
2.  **State Management**:
    - Use React hooks (`useState`, `useEffect`. `useRef`) for UI state.
    - Use `initSettings` / `getSettings` from `utils/storage` for persistent user preferences.
3.  **Chat Interface**:
    - Stream responses using the callback pattern in `gemini.ts` (`onUpdate`).
    - Handle `text`, `tool_call`, `tool_result`, `error` types explicitly.
4.  **Styling**:
    - Import CSS files directly (e.g., `import "./Sidepanel.css"`).
    - Maintain dark mode compatibility (vscDarkPlus for code blocks).
5.  **Internationalization**:
    - Always use the `useTranslation` hook.
    - Add new strings to `translations` object in `src/utils/i18n.ts`.

## Interaction Logic

- The `Chat` component (`src/components/ChatApp/Chat.tsx`) is the central hub for messaging.
- Tool usage (like `get_page_content`, `click_link`) is visualized in the chat stream.
- Messages are stored in local state (check if they persist across re-opens - currently seems ephemeral in the code read).

## Important Files

- `src/wxt.config.ts`: WXT configuration.
- `manifest.json`: (Generated) Extension manifest.
- `src/services/gemini.ts`: AI service implementation.
