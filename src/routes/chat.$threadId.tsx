import { createFileRoute, Link } from "@tanstack/react-router";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { ArrowLeft, Bookmark, Loader2, SendHorizontal, Square, Volume2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CorrectionCard } from "@/components/CorrectionCard";
import { PhraseDialog, type PhraseDraft } from "@/components/PhraseDialog";
import { VoiceRecorder } from "@/components/VoiceRecorder";
import { addPhrase, getThread, updateThread, type Correction } from "@/lib/store";
import { topicById } from "@/lib/topics";

export const Route = createFileRoute("/chat/$threadId")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Conversação — SpeakFlow English" },
      { name: "description", content: "Converse em inglês com o professor Flow e receba correções." },
      { property: "og:title", content: "Conversação — SpeakFlow English" },
      { property: "og:description", content: "Converse em inglês com o professor Flow e receba correções." },
    ],
  }),
  component: ChatPage,
});

function ChatPage() {
  const { threadId } = Route.useParams();
  const thread = useMemo(() => getThread(threadId), [threadId]);
  if (!thread)
    return (
      <div className="p-10 text-center">
        <p className="text-muted-foreground">Conversa não encontrada.</p>
        <Button asChild className="mt-4"><Link to="/">Nova conversa</Link></Button>
      </div>
    );
  return <ChatWindow key={threadId} threadId={threadId} topic={thread.topic} initial={thread.messages} />;
}

function textOf(m: UIMessage) {
  return m.parts.map((p) => (p.type === "text" ? p.text : "")).join("").trim();
}

function speak(text: string) {
  if (!("speechSynthesis" in window)) {
    toast.error("Seu navegador não suporta leitura em voz alta.");
    return;
  }
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text.replace(/[*_#`]/g, ""));
  u.lang = "en-US";
  u.rate = 0.92;
  speechSynthesis.speak(u);
}

function ChatWindow({ threadId, topic, initial }: { threadId: string; topic: string; initial: UIMessage[] }) {
  const t = topicById(topic);
  const [input, setInput] = useState("");
  const [draft, setDraft] = useState<PhraseDraft | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const transport = useMemo(() => new DefaultChatTransport({ api: "/api/chat", body: { topic } }), [topic]);
  const { messages, sendMessage, status, stop } = useChat({
    id: threadId,
    messages: initial,
    transport,
    onError: (e) => toast.error(e.message || "Falha de conexão. Tente novamente."),
  });
  const busy = status === "submitted" || status === "streaming";

  useEffect(() => {
    if (busy) return;
    const firstUser = messages.find((m) => m.role === "user");
    updateThread(threadId, { messages, ...(firstUser ? { title: textOf(firstUser).slice(0, 60) } : {}) });
    inputRef.current?.focus();
  }, [messages, busy, threadId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, status]);

  const send = () => {
    const text = input.trim();
    if (!text || busy) return;
    sendMessage({ text });
    setInput("");
  };

  const saveCorrection = (c: Correction) => {
    addPhrase({
      original: c.original,
      learned: c.natural || c.correction,
      translation: "",
      explanation: c.explanation,
      topic,
      source: "correção",
      needsPractice: true,
    });
    toast.success("Correção salva em Minhas Frases");
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-border bg-card/70 px-4 py-3 backdrop-blur md:px-8">
        <Button asChild variant="ghost" size="icon" aria-label="Voltar"><Link to="/"><ArrowLeft /></Link></Button>
        <div className="bg-brand grid h-10 w-10 place-items-center rounded-full text-lg">🦉</div>
        <div className="min-w-0">
          <div className="font-semibold">Flow · seu professor</div>
          <div className="truncate text-xs text-muted-foreground">{t.emoji} {t.label}</div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 md:px-8">
        <div className="mx-auto flex max-w-3xl flex-col gap-5">
          {messages.map((m) => (
            <div key={m.id} className={m.role === "user" ? "flex flex-col items-end gap-1" : "flex flex-col items-start gap-3"}>
              {m.parts.map((p, i) => {
                if (p.type === "text" && p.text.trim()) {
                  return m.role === "user" ? (
                    <div key={i} className="max-w-[85%] rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-primary-foreground shadow-soft">
                      {p.text}
                    </div>
                  ) : (
                    <div key={i} className="prose-sm max-w-[90%] text-[15px] leading-relaxed [&_p]:my-1">
                      <ReactMarkdown>{p.text}</ReactMarkdown>
                    </div>
                  );
                }
                if (p.type === "tool-corrigir" && "input" in p && p.input && p.state !== "input-streaming") {
                  const c = p.input as Correction;
                  return <CorrectionCard key={i} c={c} onSave={() => saveCorrection(c)} />;
                }
                return null;
              })}
              {(() => {
                const text = textOf(m);
                if (!text || (m.role === "assistant" && busy && m.id === messages.at(-1)?.id)) return null;
                return (
                  <div className="flex gap-1 text-muted-foreground">
                    {m.role === "assistant" && (
                      <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => speak(text)}>
                        <Volume2 className="h-3.5 w-3.5" /> Ouvir
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      onClick={() => setDraft({ learned: text.slice(0, 300), topic, source: "conversa" })}
                    >
                      <Bookmark className="h-3.5 w-3.5" /> Salvar
                    </Button>
                  </div>
                );
              })()}
            </div>
          ))}
          {status === "submitted" && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="flex gap-1">
                {[0, 150, 300].map((d) => (
                  <span key={d} className="h-2 w-2 animate-bounce rounded-full bg-primary/60" style={{ animationDelay: `${d}ms` }} />
                ))}
              </span>
              Flow está pensando…
            </div>
          )}
          <div ref={endRef} />
        </div>
      </div>

      <div className="border-t border-border bg-card/80 px-4 py-3 backdrop-blur md:px-8">
        <form
          className="mx-auto flex max-w-3xl items-end gap-2 rounded-2xl border border-input bg-background p-2 shadow-soft focus-within:ring-2 focus-within:ring-ring/40"
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
        >
          <Textarea
            ref={inputRef}
            autoFocus
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder="Write in English…"
            className="max-h-40 min-h-10 resize-none border-0 bg-transparent shadow-none focus-visible:ring-0"
          />
          <VoiceRecorder disabled={busy} onText={(txt) => { setInput((v) => (v ? v + " " : "") + txt); inputRef.current?.focus(); }} />
          {busy ? (
            <Button type="button" size="icon" variant="secondary" className="shrink-0 rounded-full" onClick={() => stop()} aria-label="Parar">
              {status === "submitted" ? <Loader2 className="animate-spin" /> : <Square />}
            </Button>
          ) : (
            <Button type="submit" size="icon" className="shrink-0 rounded-full" disabled={!input.trim()} aria-label="Enviar">
              <SendHorizontal />
            </Button>
          )}
        </form>
        <p className="mx-auto mt-2 max-w-3xl text-center text-[11px] text-muted-foreground">
          🎙️ Grave sua voz para transformar fala em texto. Análise detalhada de pronúncia: <span className="font-medium">em breve</span>.
        </p>
      </div>
      <PhraseDialog draft={draft} onClose={() => setDraft(null)} />
    </div>
  );
}
