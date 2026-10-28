import { Bookmark, Check, Lightbulb, PenLine, Sparkle, Target } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { Correction } from "@/lib/store";

export function CorrectionCard({ c, onSave }: { c: Correction; onSave: () => void }) {
  const [saved, setSaved] = useState(false);
  const Row = ({ icon: Icon, label, children, tone }: { icon: typeof Check; label: string; children: string; tone: string }) => (
    <div className="flex gap-3">
      <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${tone}`} />
      <div className="min-w-0">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className="text-sm">{children}</div>
      </div>
    </div>
  );
  return (
    <div className="w-full max-w-xl rounded-2xl border border-border bg-card p-4 shadow-soft">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="rounded-full bg-warning-soft px-2.5 py-0.5 text-xs font-semibold text-foreground">
          ✏️ Correção · {c.category}
        </span>
        <Button
          size="sm"
          variant={saved ? "secondary" : "outline"}
          disabled={saved}
          onClick={() => {
            onSave();
            setSaved(true);
          }}
        >
          {saved ? <Check /> : <Bookmark />} {saved ? "Salva" : "Salvar frase"}
        </Button>
      </div>
      <div className="grid gap-3">
        <Row icon={PenLine} label="O que você escreveu" tone="text-destructive">{c.original}</Row>
        <Row icon={Check} label="Correção" tone="text-success">{c.correction}</Row>
        {c.natural && <Row icon={Sparkle} label="Forma mais natural" tone="text-primary">{c.natural}</Row>}
        <Row icon={Lightbulb} label="Explicação" tone="text-warning">{c.explanation}</Row>
        <div className="rounded-xl bg-primary-soft p-3">
          <Row icon={Target} label="Prática" tone="text-primary">{c.practice}</Row>
        </div>
      </div>
    </div>
  );
}
