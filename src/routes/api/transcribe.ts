import { createFileRoute } from "@tanstack/react-router";

const MAX_BYTES = 20 * 1024 * 1024;

export const Route = createFileRoute("/api/transcribe")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env.LOVABLE_API_KEY;
        if (!apiKey) return Response.json({ error: "AI não configurada." }, { status: 500 });
        const form = await request.formData();
        const file = form.get("file");
        if (!(file instanceof File) || file.size === 0) return Response.json({ error: "Áudio vazio." }, { status: 400 });
        if (file.size > MAX_BYTES) return Response.json({ error: "Gravação muito longa." }, { status: 413 });

        const out = new FormData();
        out.append("file", file, file.name || "audio.webm");
        out.append("model", "openai/gpt-transcribe");
        out.append("language", "en");
        const res = await fetch("https://ai.gateway.lovable.dev/v1/audio/transcriptions", {
          method: "POST",
          headers: { "Lovable-API-Key": apiKey, Authorization: `Bearer ${apiKey}`, "X-Lovable-AIG-SDK": "fetch" },
          body: out,
        });
        if (!res.ok) {
          const text = await res.text();
          console.error("transcribe", res.status, text);
          const msg =
            res.status === 429
              ? "Muitas tentativas. Aguarde um instante."
              : res.status === 402
                ? "Os créditos de IA acabaram."
                : "Não foi possível transcrever o áudio.";
          return Response.json({ error: msg }, { status: res.status });
        }
        const data = (await res.json()) as { text?: string };
        return Response.json({ text: (data.text ?? "").trim() });
      },
    },
  },
});
