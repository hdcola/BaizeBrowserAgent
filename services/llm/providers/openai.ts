import OpenAI from "openai";
import type {
  LLMConfig,
  LLMProvider,
  LLMRequest,
  LLMResponse,
  LLMResponseChunk,
  Message,
} from "../types";

export class OpenAIProvider implements LLMProvider {
  private client: OpenAI;
  private modelName: string;

  constructor(config: LLMConfig) {
    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseUrl,
      dangerouslyAllowBrowser: true,
    });
    this.modelName = config.modelName;
  }

  private mapMessages(
    messages: Message[]
  ): OpenAI.Chat.ChatCompletionMessageParam[] {
    return messages.map((m) => {
      const msg: any = { role: m.role, content: m.content };
      if (m.toolCalls) {
        msg.tool_calls = m.toolCalls.map((tc) => ({
          id: tc.id,
          type: "function",
          function: { name: tc.name, arguments: JSON.stringify(tc.args) },
        }));
      }
      if (m.toolCallId) {
        msg.tool_call_id = m.toolCallId;
      }
      if (m.name) {
        msg.name = m.name;
      }
      return msg;
    });
  }

  private mapTools(
    tools?: any[]
  ): OpenAI.Chat.ChatCompletionTool[] | undefined {
    if (!tools || tools.length === 0) return undefined;
    return tools.map((t) => ({
      type: "function",
      function: {
        name: t.name,
        description: t.description,
        parameters: t.parameters,
      },
    }));
  }

  async chat(request: LLMRequest): Promise<LLMResponse> {
    const response = await this.client.chat.completions.create({
      model: this.modelName,
      messages: this.mapMessages(request.messages),
      temperature: request.temperature,
      max_tokens: request.maxTokens,
      tools: this.mapTools(request.tools),
    });

    const choice = response.choices[0];
    const message = choice.message;

    return {
      content: message.content || "",
      toolCalls: message.tool_calls?.map((tc) => ({
        id: tc.id,
        name: (tc as any).function.name,
        args: JSON.parse((tc as any).function.arguments),
      })),
      usage: response.usage
        ? {
            promptTokens: response.usage.prompt_tokens,
            completionTokens: response.usage.completion_tokens,
            totalTokens: response.usage.total_tokens,
          }
        : undefined,
    };
  }

  async *stream(request: LLMRequest): AsyncGenerator<LLMResponseChunk> {
    const stream = await this.client.chat.completions.create({
      model: this.modelName,
      messages: this.mapMessages(request.messages),
      temperature: request.temperature,
      max_tokens: request.maxTokens,
      tools: this.mapTools(request.tools),
      stream: true,
    });

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta;
      if (delta) {
        // OpenAI tool calls in stream are partials, handling them perfectly requires accumulation
        // For now, we pass simple content updates.
        // NOTE: complex tool delta handling might need a state machine if we want "real-time" tool parsing
        // or just wait for the end.
        // Simplified: if there's content, yield it. Tool calls logic for stream usually handled by UI or accumulator.
        // We will pass partial tool calls if present, but consumer needs to handle accumulation.

        let toolCalls = undefined;
        if (delta.tool_calls) {
          toolCalls = delta.tool_calls.map((tc) => ({
            id: tc.id || "",
            name: (tc as any).function?.name || "",
            args: (tc as any).function?.arguments, // kept as string fragment
          }));
        }

        yield {
          content: delta.content || "",
          toolCalls: toolCalls,
          done: false,
        };
      }
    }
    yield { content: "", done: true };
  }
}
