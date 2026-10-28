import { createFileRoute } from "@tanstack/react-router";
import { createOpenAI } from "@ai-sdk/openai";
import { convertToModelMessages, stepCountIs, streamText, tool, type UIMessage } from "ai";
import { z } from "zod";
import { topicById } from "@/lib/topics";
import {
  createLovableAiGatewayRunIdFetch,
  getLovableAiGatewayRunId,
  withLovableAiGatewayRunIdHeader,
} from "@/lib/server/run-id";

const MODEL = "openai/gpt-6-astra";

function systemPrompt(topic: string) {
  return `You are "Flow", the SpeakFlow English teacher: charismatic, funny, patient, encouraging and respectful.
The student is a Brazilian Portuguese speaker at level A2–B1. Practice context: ${topicById(topic).prompt}.

CONVERSATION RULES
- Prioritize conversation. Reply in natural, simple B1 English, 1–3 short sentences, and almost always end with a question that invites the student to produce their own sentences.
- Do not give ready-made answers before the student has a chance to try. No long grammar lectures.
- Adapt to the student's difficulties; reuse structures they got wrong so they practice them.
- If the student writes in Portuguese, gently help them say it in English and encourage them to try.

CORRECTION RULES
- Check the student's LATEST message. If (and only if) it contains a real grammar, vocabulary or word-order error, call the tool "corrigir" exactly once BEFORE your conversational reply, then continue the chat normally (do not repeat the correction in your text).
- Never invent errors. Never correct sentences that are already correct. Capitalization, missing final punctuation and casual chat style are NOT errors.
- Style-only improvements (correct but unnatural) may be shown with "natural" set and "category" = "Naturalidade"; say in the explanation that it was not an error.
- If the sentence is correct, briefly acknowledge it now and then (e.g., "Perfect sentence!") and keep the conversation going.
- Explanations must be short and simple, in Brazilian Portuguese.`;
}

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env.LOVABLE_API_KEY;
        if (!apiKey) return Response.json({ error: "AI não configurada." }, { status: 500 });

        const body = (await request.json()) as { messages?: UIMessage[]; topic?: string };
        if (!Array.isArray(body.messages)) return Response.json({ error: "Mensagens inválidas." }, { status: 400 });
        const messages = body.messages.slice(-40);

        const runIdFetch = createLovableAiGatewayRunIdFetch(getLovableAiGatewayRunId(request));
        const provider = createOpenAI({
          baseURL: "https://ai.gateway.lovable.dev/v1",
          apiKey,
          headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
          fetch: runIdFetch.fetch,
        });

        const result = streamText({
          model: provider.responses(MODEL),
          instructions: systemPrompt(body.topic ?? "livre"),
          messages: await convertToModelMessages(messages),
          abortSignal: request.signal,
          stopWhen: stepCountIs(3),
          tools: {
            corrigir: tool({
              description: "Show a structured correction card for an error in the student's latest message.",
              inputSchema: z.object({
                original: z.string().describe("Exactly what the student wrote (the wrong sentence)"),
                correction: z.string().describe("Minimal grammatical correction in English"),
                natural: z.string().nullable().describe("A more natural native-like alternative, or null"),
                explanation: z.string().describe("Short simple explanation in Brazilian Portuguese"),
                practice: z.string().describe("A short question in English that makes the student use the structure correctly"),
                category: z
                  .string()
                  .describe("Error type in Portuguese, e.g. Tempo verbal, Preposição, Artigo, Ordem das palavras, Vocabulário, Concordância, Naturalidade"),
              }),
              execute: async () => ({ shown: true }),
            }),
          },
          providerOptions: {
            openai: {
              store: false,
              forceReasoning: true,
              reasoningEffort: "low",
              reasoningSummary: "auto",
              include: ["reasoning.encrypted_content"],
            },
          },
        });

        return withLovableAiGatewayRunIdHeader(
          result.toUIMessageStreamResponse({
            originalMessages: messages,
            onError: (e) => {
              console.error(e);
              const msg = String((e as Error)?.message ?? e);
              if (msg.includes("429")) return "Muitas mensagens seguidas. Aguarde um instante e tente de novo.";
              if (msg.includes("402")) return "Os créditos de IA acabaram. Adicione créditos ao workspace para continuar.";
              return "O professor não conseguiu responder agora. Tente novamente.";
            },
          }),
          runIdFetch,
        );
      },
    },
  },
});
