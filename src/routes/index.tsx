import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/AppShell";
import { createThread, useThreads } from "@/lib/store";
import { TOPICS, topicById } from "@/lib/topics";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SpeakFlow English — Pratique conversação em inglês" },
      { name: "description", content: "Converse com um professor de inglês com IA, receba correções e salve suas frases." },
      { property: "og:title", content: "SpeakFlow English — Pratique conversação em inglês" },
      { property: "og:description", content: "Converse com um professor de inglês com IA, receba correções e salve suas frases." },
    ],
  }),
  component: Index,
});

function Index() {
  const navigate = useNavigate();
  const threads = useThreads();
  const start = (id: string) => {
    const t = createThread(id, topicById(id).greeting);
    navigate({ to: "/chat/$threadId", params: { threadId: t.id } });
  };
  const free = TOPICS[0]!;
  const topics = TOPICS.slice(1);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:px-8 md:py-12">
      <PageHeader title="Let's talk! 👋" subtitle="Escolha uma situação da vida real ou comece uma conversa livre com o Flow." />

      <button
        onClick={() => start(free.id)}
        className="bg-brand group mb-6 flex w-full items-center justify-between gap-4 rounded-3xl p-6 text-left text-primary-foreground shadow-soft transition-transform hover:-translate-y-0.5 md:p-8"
      >
        <div>
          <div className="text-3xl">{free.emoji}</div>
          <div className="mt-2 font-display text-2xl font-semibold md:text-3xl">{free.label}</div>
          <p className="mt-1 opacity-90">Fale sobre qualquer assunto — o Flow corrige com carinho.</p>
        </div>
        <ArrowRight className="h-7 w-7 shrink-0 transition-transform group-hover:translate-x-1" />
      </button>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
        {topics.map((t) => (
          <button
            key={t.id}
            onClick={() => start(t.id)}
            className="rounded-2xl border border-border bg-card p-5 text-left transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-soft"
          >
            <div className="text-2xl">{t.emoji}</div>
            <div className="mt-2 font-semibold">{t.label}</div>
            <div className="text-sm text-muted-foreground">{t.desc}</div>
          </button>
        ))}
      </div>

      {threads.length > 0 && (
        <div className="mt-10">
          <h2 className="mb-3 font-display text-xl font-semibold">Continuar conversando</h2>
          <div className="grid gap-2">
            {threads.slice(0, 3).map((th) => (
              <Link
                key={th.id}
                to="/chat/$threadId"
                params={{ threadId: th.id }}
                className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3 hover:border-primary/40"
              >
                <span className="truncate">{topicById(th.topic).emoji} {th.title}</span>
                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
