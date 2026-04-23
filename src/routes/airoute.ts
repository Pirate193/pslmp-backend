import { Hono } from "hono";
import { requireauth } from "../middleware/requireauth";
import { getDecryptedKey } from "../controllers/apikeycontroller";
import { getEffectiveSystemPrompt } from "../controllers/settingscontroller";
import { createOpenAI, openai } from "@ai-sdk/openai";
import { anthropic, createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI, google } from "@ai-sdk/google";
import { createXai, xai } from "@ai-sdk/xai";
import type { Appvariables } from "../index";

import {
  streamText,
  UIMessage,
  convertToModelMessages,
  tool,
  stepCountIs,
} from "ai";
import { createTools } from "../lib/tools";
import { createDeepSeek } from "@ai-sdk/deepseek";
import { createMoonshotAI } from "@ai-sdk/moonshotai";

const aiRouter = new Hono<{ Variables: Appvariables }>();

// Map model IDs to their provider
const MODEL_PROVIDER_MAP: Record<string, string> = {
    // OpenAI
    "gpt-5.4-pro": "openai",
    "gpt-5.4-nano": "openai",
    "gpt-5.4-mini": "openai",
    "gpt-5.4": "openai",
    "gpt-5.3-chat-latest": "openai",
    "gpt-5.2-pro": "openai",
    "gpt-5.2": "openai",
    "gpt-5.1-chat-latest": "openai",
    // Anthropic
    "claude-opus-4-7": "anthropic",
    "claude-opus-4-6": "anthropic",
    "claude-opus-4-5": "anthropic",
    "claude-sonnet-4-6":"anthropic",
    "claude-sonnet-4-5":"anthropic",
    "claude-haiku-4-5":"anthropic",
    // Google
    "gemini-3.1-pro-preview": "google",
    "gemini-3.1-flash-lite-preview": "google",
    "gemini-3-pro-preview": "google",
    "gemini-3-flash-preview": "google",
    // DeepSeek (OpenAI-compatible)
    "deepseek-chat": "deepseek",
    "deepseek-reasoner": "deepseek",
    // xAI
    "grok-4-1-fast-reasoning": "xai",
    "grok-4.1-fast-non-reasoning": "xai",
    "grok-4-fast-reasoning": "xai",
    "grok-4-fast-non-reasoning": "xai",
    "grok-4": "xai",
    "grok-3": "xai",
    // Moonshot (OpenAI-compatible)
    "kimi-k2.5": "moonshot",
    "kimi-k2": "moonshot",
};

function getProviderForModel(modelId: string): string | null {
    return MODEL_PROVIDER_MAP[modelId] || null;
}

function createProviderInstance(provider: string, apiKey: string) {
    switch (provider) {
        case "openai":
            return createOpenAI({ apiKey });
        case "anthropic":
            return createAnthropic({ apiKey });
        case "google":
            return createGoogleGenerativeAI({ apiKey });
        case "deepseek":
            return createDeepSeek({ apiKey });
        case "xai":
            return createXai({ apiKey });
        case "moonshot":
            return createMoonshotAI({apiKey});
        default:
            throw new Error(`Unsupported provider: ${provider}`);
    }
}

function parseProviderError(error: any, providerName: string): { status: number; message: string } {
    const status = error?.status || error?.statusCode || 500;
    const rawMessage = error?.message || error?.error?.message || "Unknown error";

    if (status === 401 || status === 403) {
        return { status: 401, message: `Your ${providerName} API key is invalid or expired. Update it in Settings.` };
    }
    if (status === 402 || rawMessage.toLowerCase().includes("insufficient") || rawMessage.toLowerCase().includes("quota")) {
        return { status: 402, message: `Your ${providerName} account has insufficient credits. Please add credits and try again.` };
    }
    if (status === 429) {
        return { status: 429, message: `Rate limited by ${providerName}. Please try again in a moment.` };
    }
    return { status: 500, message: `Error from ${providerName}: ${rawMessage}` };
}

aiRouter.post("/chat", requireauth, async (c) => {
    try {
        const user = c.get("user");
        const {
    messages,
    webSearch,
    model:modelId,
    contextFolder,
    contextNote
  }: {
    messages: UIMessage[];
    webSearch?: boolean;
    model: string;
    contextFolder?: { id: string, name: string }[];
    contextNote?: { id: string, title: string }[];
  } = await c.req.json();

        if (!modelId || !messages) {
            return c.json({ error: "model and messages are required" }, 400);
        }

        // 1. Determine provider from model
        const provider = getProviderForModel(modelId);
        if (!provider) {
            return c.json({ error: `Unknown model: ${modelId}. Please select a valid model.` }, 400);
        }

        // 2. Get decrypted API key
        const apiKey = await getDecryptedKey(user.id, provider);
        if (!apiKey) {
            return c.json({
                error: `No API key configured for ${provider}. Add one in Settings → API Keys.`
            }, 400);
        }

        // 3. Get system prompt with context
        const systemPrompt = await getEffectiveSystemPrompt(user.id, user.name, contextFolder, contextNote);

        
        if (webSearch) {
            const tavilyKey = await getDecryptedKey(user.id, "tavily");
            if (!tavilyKey) {
                return c.json({
                    error: "Web search requires a Tavily API key. Add one in Settings → API Keys."
                }, 400);
            }
        }

        // 5. Create provider + stream
        const providerInstance = createProviderInstance(provider, apiKey);
        const modelInstance = providerInstance(modelId);
        const result = streamText({
            model: modelInstance,
            system: systemPrompt,
            tools: createTools(c, modelInstance),
            messages:await convertToModelMessages(messages),
            stopWhen:stepCountIs(10)
        });

        // 6. Return streaming response
        return c.body(result.toUIMessageStreamResponse({
            sendReasoning:true,
            sendSources:true
        }).body as ReadableStream);
    } catch (error: any) {
        console.error("AI streaming error:", error);

        // Try to extract provider-specific error
        const modelId = (await c.req.json().catch(() => ({}))).model;
        const provider = modelId ? getProviderForModel(modelId) : "provider";
        const parsed = parseProviderError(error, provider || "provider");

        return c.json({ error: parsed.message }, parsed.status as any);
    }
});

export default aiRouter;
