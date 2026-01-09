# Baize (白泽) - Product Requirements Document (PRD)

## 1. 产品概述 (Product Overview)

**Baize (白泽)** 是一个基于 AI 的智能浏览器助手插件。它能够深入理解当前网页的内容，并通过自然语言与用户交互，协助用户完成信息获取、内容分析以及自动化操作任务。

**核心价值**：让 AI 成为用户的“网页副驾驶”，不仅能“读”懂网页，还能“看”懂页面，并帮用户“动手”操作。

## 2. 核心功能 (Core Features)

### 2.1 网页感知与分析

- **DOM 解析**：提取当前网页的文本内容、链接结构和表单信息。
- **智能滚动 (Auto-Scrolling)**：
  - 支持自动滚动页面以触发懒加载内容（Lazy Loading）。
  - 解决长页面、新闻流、评论区等内容无法一次性获取的问题。
- **视觉理解 (Visual Understanding)**：
  - **截图能力**：支持对当前视口或全页进行截图。
  - **多模态分析**：利用 AI 模型的视觉能力解析图表、Canvas 元素或复杂的 UI 布局（如辅助定位难以通过 DOM 识别的按钮）。

### 2.2 自动化操作 (Browser Actions)

- **点击交互 (Click)**：根据用户指令准确点击页面上的链接、按钮或其他交互元素。
- **表单填写 (Form Filling)**：智能识别表单项含义，根据用户提供的上下文自动填写表单（如搜索框、注册表）。

### 2.3 自然语言交互

- **多模型支持**：支持接入 Gemini, OpenAI, Claude 等主流 LLM。
- **意图识别**：自动判断用户意图是需要“回答问题”、“操作页面”还是“提取数据”。

## 3. 用户设置 (User Settings)

### 3.1 AI 模型配置 (Model Configuration)

用户可以通过统一的设置面板管理接入的 AI 模型。配置界面应简洁直观，并支持详细的自定义。

- **配置管理逻辑 (Configuration Logic)**：

  - **预设驱动 (Preset Driven)**：模型配置基于预设模板（Presets），预设列表存储在 `config/model_presets.json` 中，方便扩展。
  - **动态缺省值**：选择预设后，自动填充通用的缺省参数（Base URL, Model Name 等）。
  - **映射关系**：
    - 选择 **OpenAI** -> Provider: `openai`, Default SDK/Protocol: OpenAI Standard.
    - 选择 **Gemini** -> Provider: `gemini`, Default SDK/Protocol: Google GenAI.
    - 选择 **Ollama** -> Provider: `openai`, Default SDK/Protocol: OpenAI Compatible (Base URL: `http://localhost:11434/v1`).

- **设置面板 UI (Settings UI)**：
  - **列表管理**：展示已配置的模型卡片，支持新增、编辑和删除。
  - **添加/编辑模型表单**：
    - **预设选择 (Provider Preset)**：下拉框选择（OpenAI / Gemini / Ollama / ...）。
    - **参数配置**：
      - `Model Name` (e.g., `gpt-4o`, `llama3`) - 根据预设提供默认值。
      - `API Key` (认证密钥) - 本地模型可选。
      - `Base URL` (API 端点) - 根据预设自动填充，支持修改。
      - `Provider` (协议) - 根据预设自动选定 (e.g. Ollama 也是 `openai` 协议)。
  - **保存功能 (Save Action)**：表单底部提供明确的 **“保存 (Save)”** 和 **“取消 (Cancel)”** 按钮。仅点击保存时才将更改写入存储。

### 3.2 偏好设置

- **语言**：支持 简体中文 (zh_CN) 和 英文 (en)。
- **快捷指令 (Quick Prompts)**：用户可自定义常用的 Prompt 快捷键。
  - 预设示例：“总结当前网页”、“翻译全文”、“解释选中内容”。

## 4. 用户界面 (UI/UX)

### 4.1 对话交互界面

- **框架**：基于 `assistant-ui` 构建，确保现代化的聊天体验。
- **输入体验**：
  - 支持快捷指令气泡 (Chips) 快速发送。
  - 键盘操作：`Enter` 发送，`Shift + Enter` 换行。
- **输出体验**：
  - **流式响应 (Streaming)**：逐字显示 AI 回复，减少等待焦虑。
  - **Markdown 渲染**：完美支持代码块（带复制按钮）、表格、列表和链接。

### 4.2 工具调用可视化 (Tool UI)

为了让 AI 的操作透明化：

- **状态指示**：当 AI 正在执行工具（如“正在滚动页面”、“正在分析截图”）时，显示动态状态条。
- **详情折叠**：
  - 默认展示简洁信息（如：`调用工具: scroll_page`）。
  - 点击可展开查看详细参数和返回值，方便调试和确认。

### 4.3 会话管理

- **历史记录**：支持清空当前会话或删除特定历史记录。
- **会话导出**：支持将会话记录导出保存，方便归档或分享。
  - 支持格式：Markdown (.md), HTML (.html), PDF (.pdf)。
- **隐私优先**：聊天记录和设置默认存储在浏览器本地 (`chrome.storage.local`)，不上传至第三方服务器（除 AI 模型请求外）。

## 5. 技术约束与规划 (Constraints & Scope)

### 5.1 V1 范围限制 (MVP)

- **仅限当前标签页 (Active Tab Only)**：助手仅能读取和操作当前激活的标签页，暂不支持跨标签页操作（保护隐私并降低复杂度）。
- **权限管理**：按需申请浏览器权限，确保用户知情。

### 5.2 未来规划 (Future V2)

- 跨标签页协作 (Cross-tab workflows)。
- 浏览器历史记录语义搜索。
