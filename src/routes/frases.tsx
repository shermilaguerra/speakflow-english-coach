import { createFileRoute } from "@tanstack/react-router";
import { BookMarked, Pencil, Plus, RotateCcw, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/AppShell";
import { PhraseDialog, type PhraseDraft } from "@/components/PhraseDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { deletePhrase, updatePhrase, usePhrases } from "@/lib/store";
import { TOPICS, topicById } from "@/lib/topics";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/frases")({
  head: () => ({
    meta: [
      { title: "Minhas Frases — SpeakFlow English" },
      { name: "description", content: "Seu banco de frases e correções salvas para revisar." },
      { property: "og:title", content: "Minhas Frases — SpeakFlow English" },
      { property: "og:description", content: "Seu banco de frases e correções salvas para revisar." },
    ],
  }),
  component: Frases,
});

function Frases() {
  const phrases = usePhrases();
  const [q, setQ] = useState("");
  const [topic, setTopic] = useState("all");
  const [source, setSource] = useState("all");
  const [draft, setDraft] = useState<PhraseDraft | null>(null);

  const list = useMemo(() => {
    const s = q.toLowerCase();
    return phrases.filter(
      (p) =>
        (topic === "all" || p.topic === topic) &&
        (source === "all" || (source === "practice" ? p.needsPractice : p.source === source)) &&
        (!s || [p.original, p.learned, p.translation, p.explanation].some((x) => x.toLowerCase().includes(s))),
    );
  }, [phrases, q, topic, source]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:px-8 md:py-12">
      <PageHeader
        title="Minhas Frases"
        subtitle={`${phrases.length} frase${phrases.length === 1 ? "" : "s"} salva${phrases.length === 1 ? "" : "s"}`}
        action={<Button onClick={() => setDraft({ source: "manual" })}><Plus /> Nova frase</Button>}
      />
      <div className="mb-6 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Buscar frase, tradução…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Select value={topic} onValueChange={setTopic}>
          <SelectTrigger className="sm:w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os temas</SelectItem>
            {TOPICS.map((t) => <SelectItem key={t.id} value={t.id}>{t.emoji} {t.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={source} onValueChange={setSource}>
          <SelectTrigger className="sm:w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as origens</SelectItem>
            <SelectItem value="correção">Correções</SelectItem>
            <SelectItem value="conversa">Conversa</SelectItem>
            <SelectItem value="manual">Manual</SelectItem>
            <SelectItem value="practice">Para praticar</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {list.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border p-12 text-center">
          <BookMarked className="mx-auto h-8 w-8 text-primary" />
          <p className="mt-3 font-medium">{phrases.length ? "Nenhuma frase encontrada" : "Nenhuma frase salva ainda"}</p>
          <p className="text-sm text-muted-foreground">Salve correções direto do chat ou adicione manualmente.</p>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {list.map((p) => (
            <div key={p.id} className="flex flex-col rounded-2xl border border-border bg-card p-5">
              <div className="mb-2 flex flex-wrap gap-1.5 text-xs">
                <span className="rounded-full bg-secondary px-2 py-0.5">{topicById(p.topic).emoji} {topicById(p.topic).label}</span>
                <span className="rounded-full bg-primary-soft px-2 py-0.5 capitalize">{p.source}</span>
                <span className="ml-auto text-muted-foreground">{new Date(p.createdAt).toLocaleDateString("pt-BR")}</span>
              </div>
              {p.original && <p className="text-sm text-muted-foreground line-through decoration-destructive/60">{p.original}</p>}
              <p className="font-semibold">{p.learned}</p>
              {p.translation && <p className="text-sm text-primary">{p.translation}</p>}
              {p.explanation && <p className="mt-2 text-sm text-muted-foreground">{p.explanation}</p>}
              <div className="mt-auto flex items-center gap-1 pt-3">
                <Button
                  size="sm"
                  variant="ghost"
                  className={cn("text-xs", p.needsPractice && "text-warning")}
                  onClick={() => updatePhrase(p.id, { needsPractice: !p.needsPractice })}
                >
                  <RotateCcw /> {p.needsPractice ? "Praticar de novo" : "Dominada ✓"}
                </Button>
                <Button size="icon" variant="ghost" className="ml-auto" aria-label="Editar" onClick={() => setDraft(p)}><Pencil /></Button>
                <Button size="icon" variant="ghost" aria-label="Excluir" onClick={() => confirm("Excluir esta frase?") && deletePhrase(p.id)}>
                  <Trash2 />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
      <PhraseDialog draft={draft} onClose={() => setDraft(null)} />
    </div>
  );
}
