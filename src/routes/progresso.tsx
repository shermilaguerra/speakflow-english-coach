import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, BookMarked, MessagesSquare, RotateCcw, Shapes } from "lucide-react";
import { useMemo } from "react";
import { PageHeader } from "@/components/AppShell";
import { correctionsOf, usePhrases, useThreads } from "@/lib/store";
import { topicById } from "@/lib/topics";

export const Route = createFileRoute("/progresso")({
  head: () => ({
    meta: [
      { title: "Progresso — SpeakFlow English" },
      { name: "description", content: "Acompanhe conversas, frases aprendidas e pontos de atenção." },
      { property: "og:title", content: "Progresso — SpeakFlow English" },
      { property: "og:description", content: "Acompanhe conversas, frases aprendidas e pontos de atenção." },
    ],
  }),
  component: Progresso,
});

function Progresso() {
  const threads = useThreads();
  const phrases = usePhrases();
  const s = useMemo(() => {
    const active = threads.filter((t) => t.messages.some((m) => m.role === "user"));
    const corrections = active.flatMap((t) => correctionsOf(t.messages));
    const cats = new Map<string, number>();
    corrections.forEach((c) => cats.set(c.category, (cats.get(c.category) ?? 0) + 1));
    const topics = new Map<string, number>();
    active.forEach((t) => topics.set(t.topic, (topics.get(t.topic) ?? 0) + 1));
    return {
      conversations: active.length,
      corrections: corrections.length,
      cats: [...cats].sort((a, b) => b[1] - a[1]).slice(0, 6),
      topics: [...topics].sort((a, b) => b[1] - a[1]),
      practice: phrases.filter((p) => p.needsPractice).slice(0, 6),
    };
  }, [threads, phrases]);
  const maxCat = s.cats[0]?.[1] ?? 1;

  const stats = [
    { label: "Conversas realizadas", value: s.conversations, icon: MessagesSquare },
    { label: "Frases salvas", value: phrases.length, icon: BookMarked },
    { label: "Tópicos praticados", value: s.topics.length, icon: Shapes },
    { label: "Correções recebidas", value: s.corrections, icon: AlertTriangle },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:px-8 md:py-12">
      <PageHeader title="Progresso" subtitle="Números reais das suas conversas — nada inventado." />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((x) => (
          <div key={x.label} className="rounded-2xl border border-border bg-card p-5">
            <x.icon className="h-5 w-5 text-primary" />
            <div className="mt-3 font-display text-4xl font-semibold">{x.value}</div>
            <div className="text-sm text-muted-foreground">{x.label}</div>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-card p-6">
          <h2 className="font-display text-xl font-semibold">Pontos de atenção</h2>
          <p className="mb-4 text-sm text-muted-foreground">Tipos de erro mais frequentes nas correções.</p>
          {s.cats.length === 0 ? (
            <p className="text-sm text-muted-foreground">Ainda sem dados. Converse com o Flow para ver suas dificuldades aqui.</p>
          ) : (
            <div className="grid gap-3">
              {s.cats.map(([c, n]) => (
                <div key={c}>
                  <div className="mb-1 flex justify-between text-sm"><span>{c}</span><span className="text-muted-foreground">{n}×</span></div>
                  <div className="h-2 rounded-full bg-muted">
                    <div className="bg-brand h-2 rounded-full" style={{ width: `${(n / maxCat) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-border bg-card p-6">
          <h2 className="font-display text-xl font-semibold">Praticar novamente</h2>
          <p className="mb-4 text-sm text-muted-foreground">Frases marcadas para revisão.</p>
          {s.practice.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma frase pendente de revisão.</p>
          ) : (
            <ul className="grid gap-2">
              {s.practice.map((p) => (
                <li key={p.id} className="flex items-start gap-2 rounded-xl bg-warning-soft p-3 text-sm">
                  <RotateCcw className="mt-0.5 h-4 w-4 shrink-0 text-warning" /> {p.learned}
                </li>
              ))}
            </ul>
          )}
          <Link to="/frases" className="mt-4 inline-block text-sm font-medium text-primary">Ver Minhas Frases →</Link>
        </section>

        <section className="rounded-2xl border border-border bg-card p-6 lg:col-span-2">
          <h2 className="mb-4 font-display text-xl font-semibold">Tópicos praticados</h2>
          {s.topics.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum tópico praticado ainda.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {s.topics.map(([t, n]) => (
                <span key={t} className="rounded-full bg-primary-soft px-3 py-1.5 text-sm">
                  {topicById(t).emoji} {topicById(t).label} · {n}
                </span>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
