# Baize (白泽) Browser Agent

Baize is an intelligent browser agent powered by Gemini AI, designed to help you interact with web pages, summarize content, and automate tasks directly from your browser's side panel.

This project is built using [WXT](https://wxt.dev/) (Web Extension Framework) with React and TypeScript, ensuring cross-browser compatibility (Chrome, Firefox, Safari) and a modern development experience.

## ✨ Features

- **Gemini Integration**: Chat with the current page content using Google's Gemini API.
- **Cross-Browser Support**: Runs on Chrome, Firefox, and Safari.
- **Side Panel Interface**: seamless interaction without leaving the current tab.
- **Page Context Awareness**: Automatically extracts content from the active tab for context-aware responses.

## 🛠️ Development Setup

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [pnpm](https://pnpm.io/) (Package manager)

### Installation

1.  Clone the repository:

    ```bash
    git clone <repository-url>
    cd BaizeBrowserAgent
    ```

2.  Install dependencies:
    ```bash
    pnpm install
    ```

### Running the Development Server

Start the hot-reload development server for your target browser:

- **Chrome** (Default):

  ```bash
  pnpm dev
  ```

  This will open a new Chrome instance with the extension loaded.

- **Firefox**:

  ```bash
  pnpm dev:firefox
  ```

- **Safari**:
  ```bash
  pnpm dev:safari
  ```

### Building for Production

To create optimized production builds:

```bash
pnpm build
```

This commands builds for Chrome (MV3), Firefox (MV2), and Safari (MV2).
Artifacts are generated in the `output/` directory:

- `output/chrome-mv3`
- `output/firefox-mv2`
- `output/safari-mv2`

### Packaging (Zip)

To create zip files for store submission:

```bash
pnpm zip
```

## 📂 Project Structure

```text
src/
├── assets/          # Static assets (images, css)
├── components/      # Shared React components
├── entrypoints/     # Extension entry points (background, content, sidepanel)
│   ├── background.ts
│   ├── content.ts
│   └── sidepanel/   # Side Panel React App
├── services/        # API services (Gemini, etc.)
├── utils/           # Utility functions (storage, i18n)
└── wxt.config.ts    # WXT Configuration
```

## 🔑 Configuration

To use the AI features, you will need to configure your Gemini API Key in the extension settings panel after installation.

## License

[MIT](LICENSE)
