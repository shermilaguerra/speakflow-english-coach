import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { addPhrase, updatePhrase, type Phrase, type PhraseSource } from "@/lib/store";
import { TOPICS } from "@/lib/topics";

export type PhraseDraft = Partial<Omit<Phrase, "id" | "createdAt">> & { id?: string };

export function PhraseDialog({ draft, onClose }: { draft: PhraseDraft | null; onClose: () => void }) {
  const [f, setF] = useState<PhraseDraft>({});
  useEffect(() => {
    setF(draft ?? {});
  }, [draft]);
  const set = (k: keyof PhraseDraft) => (e: { target: { value: string } }) => setF((x) => ({ ...x, [k]: e.target.value }));

  const submit = () => {
    if (!f.learned?.trim()) {
      toast.error("Preencha a frase aprendida.");
      return;
    }
    const data = {
      original: f.original?.trim() ?? "",
      learned: f.learned.trim(),
      translation: f.translation?.trim() ?? "",
      explanation: f.explanation?.trim() ?? "",
      topic: f.topic ?? "livre",
      source: (f.source ?? "manual") as PhraseSource,
      needsPractice: f.needsPractice ?? true,
    };
    if (f.id) updatePhrase(f.id, data);
    else addPhrase(data);
    toast.success(f.id ? "Frase atualizada" : "Frase salva em Minhas Frases");
    onClose();
  };

  return (
    <Dialog open={!!draft} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">{f.id ? "Editar frase" : "Salvar frase"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-1.5">
            <Label>Frase original (opcional)</Label>
            <Input value={f.original ?? ""} onChange={set("original")} placeholder="I have 25 years" />
          </div>
          <div className="grid gap-1.5">
            <Label>Frase corrigida / expressão aprendida</Label>
            <Input value={f.learned ?? ""} onChange={set("learned")} placeholder="I'm 25 years old" />
          </div>
          <div className="grid gap-1.5">
            <Label>Tradução / significado</Label>
            <Input value={f.translation ?? ""} onChange={set("translation")} placeholder="Eu tenho 25 anos" />
          </div>
          <div className="grid gap-1.5">
            <Label>Explicação</Label>
            <Textarea rows={2} value={f.explanation ?? ""} onChange={set("explanation")} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Tema</Label>
              <Select value={f.topic ?? "livre"} onValueChange={(v) => setF((x) => ({ ...x, topic: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TOPICS.map((t) => <SelectItem key={t.id} value={t.id}>{t.emoji} {t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Origem</Label>
              <Select value={f.source ?? "manual"} onValueChange={(v) => setF((x) => ({ ...x, source: v as PhraseSource }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="conversa">Conversa</SelectItem>
                  <SelectItem value="correção">Correção</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={submit}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
