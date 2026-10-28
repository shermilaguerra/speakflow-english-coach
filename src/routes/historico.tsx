import { createFileRoute, Link } from "@tanstack/react-router";
import { History, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { correctionsOf, deleteThread, useThreads } from "@/lib/store";
import { TOPICS, topicById } from "@/lib/topics";

export const Route = createFileRoute("/historico")({
  head: () => ({
    meta: [
      { title: "Histórico — SpeakFlow English" },
      { name: "description", content: "Suas conversas anteriores organizadas por data e tema." },
      { property: "og:title", content: "Histórico — SpeakFlow English" },
      { property: "og:description", content: "Suas conversas anteriores organizadas por data e tema." },
    ],
  }),
  component: Historico,
});

function Historico() {
  const threads = useThreads();
  const [topic, setTopic] = useState("all");
  const groups = useMemo(() => {
    const g = new Map<string, typeof threads>();
    for (const t of threads.filter((t) => (topic === "all" || t.topic === topic) && t.messages.some((m) => m.role === "user"))) {
      const k = new Date(t.updatedAt).toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
      g.set(k, [...(g.get(k) ?? []), t]);
    }
    return [...g];
  }, [threads, topic]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 md:px-8 md:py-12">
      <PageHeader
        title="Histórico"
        subtitle="Retome qualquer conversa de onde parou."
        action={
          <Select value={topic} onValueChange={setTopic}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os temas</SelectItem>
              {TOPICS.map((t) => <SelectItem key={t.id} value={t.id}>{t.emoji} {t.label}</SelectItem>)}
            </SelectContent>
          </Select>
        }
      />
      {groups.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border p-12 text-center">
          <History className="mx-auto h-8 w-8 text-primary" />
          <p className="mt-3 font-medium">Nenhuma conversa ainda</p>
          <Button asChild className="mt-4"><Link to="/">Começar a conversar</Link></Button>
        </div>
      ) : (
        groups.map(([day, list]) => (
          <section key={day} className="mb-8">
            <h2 className="mb-3 text-sm font-semibold capitalize text-muted-foreground">{day}</h2>
            <div className="grid gap-2">
              {list.map((t) => {
                const tp = topicById(t.topic);
                const n = t.messages.filter((m) => m.role === "user").length;
                const c = correctionsOf(t.messages).length;
                return (
                  <div key={t.id} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 hover:border-primary/40">
                    <Link to="/chat/$threadId" params={{ threadId: t.id }} className="flex min-w-0 flex-1 items-center gap-3">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-xl">{tp.emoji}</span>
                      <span className="min-w-0">
                        <span className="block truncate font-medium">{t.title}</span>
                        <span className="text-xs text-muted-foreground">
                          {tp.label} · {n} mensage{n === 1 ? "m" : "ns"} · {c} correç{c === 1 ? "ão" : "ões"} ·{" "}
                          {new Date(t.updatedAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </span>
                    </Link>
                    <Button size="icon" variant="ghost" aria-label="Excluir conversa" onClick={() => confirm("Excluir esta conversa?") && deleteThread(t.id)}>
                      <Trash2 />
                    </Button>
                  </div>
                );
              })}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
