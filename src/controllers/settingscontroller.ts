import { Context } from "hono";
import { db } from "../lib/db";
import { userSettings } from "../db/schema";
import { eq } from "drizzle-orm";

const DEFAULT_SYSTEM_PROMPT = `You are a helpful, knowledgeable study assistant built into pslmp — a note-taking and learning platform. Your goal is to help the user study effectively, understand complex topics, prepare for exams, and organize their knowledge.

Guidelines:
- Be clear, concise, and educational in your responses
- Use examples and analogies to explain difficult concepts
- When asked about a topic, provide structured explanations with key points
- Help with homework by guiding the user through the solution process rather than just giving answers
- If the user shares notes or content, help them review, summarize, or create study materials from it
- Use markdown formatting for better readability (headers, lists, code blocks, etc.)
- Be encouraging and supportive of the user's learning journey`;

export { DEFAULT_SYSTEM_PROMPT };

/** Get user settings */
export const getSettings = async (c: Context) => {
    try {
        const user = c.get("user");
        const [settings] = await db.select()
            .from(userSettings)
            .where(eq(userSettings.userId, user.id));

        return c.json({
            systemPrompt: settings?.systemPrompt || null,
            defaultSystemPrompt: DEFAULT_SYSTEM_PROMPT,
        }, 200);
    } catch (error) {
        console.error("Error getting settings:", error);
        return c.json({ error: "Failed to get settings" }, 500);
    }
};

/** Update user settings */
export const updateSettings = async (c: Context) => {
    try {
        const user = c.get("user");
        const body = await c.req.json();

        const [existing] = await db.select()
            .from(userSettings)
            .where(eq(userSettings.userId, user.id));

        if (existing) {
            const [updated] = await db.update(userSettings).set({
                systemPrompt: body.systemPrompt !== undefined ? body.systemPrompt : existing.systemPrompt,
                updatedAt: new Date(),
            }).where(eq(userSettings.id, existing.id)).returning();

            return c.json({
                systemPrompt: updated.systemPrompt,
            }, 200);
        }

        const [created] = await db.insert(userSettings).values({
            userId: user.id,
            systemPrompt: body.systemPrompt || null,
        }).returning();

        return c.json({
            systemPrompt: created.systemPrompt,
        }, 201);
    } catch (error) {
        console.error("Error updating settings:", error);
        return c.json({ error: "Failed to update settings" }, 500);
    }
};

/** Get the effective system prompt for a user (for AI route) */
export async function getEffectiveSystemPrompt(userId: string): Promise<string> {
    const [settings] = await db.select()
        .from(userSettings)
        .where(eq(userSettings.userId, userId));

    return settings?.systemPrompt || DEFAULT_SYSTEM_PROMPT;
}
