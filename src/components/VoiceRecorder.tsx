import { Loader2, Mic, Square } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type State = "idle" | "recording" | "transcribing";

export function VoiceRecorder({ onText, disabled }: { onText: (t: string) => void; disabled?: boolean }) {
  const [state, setState] = useState<State>("idle");
  const [secs, setSecs] = useState(0);
  const rec = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);

  useEffect(() => {
    if (state !== "recording") return undefined;
    const t = setInterval(() => setSecs((s) => (s >= 59 ? (rec.current?.stop(), s) : s + 1)), 1000);
    return () => clearInterval(t);
  }, [state]);

  const start = async () => {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined")
      return toast.error("Seu navegador não suporta gravação de áudio.");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = ["audio/webm", "audio/mp4", "audio/ogg"].find((m) => MediaRecorder.isTypeSupported(m)) ?? "";
      const r = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      chunks.current = [];
      r.ondataavailable = (e) => e.data.size && chunks.current.push(e.data);
      r.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunks.current, { type: r.mimeType || "audio/webm" });
        if (blob.size < 1000) {
          setState("idle");
          return toast.error("Gravação muito curta. Tente de novo.");
        }
        setState("transcribing");
        try {
          const ext = blob.type.includes("mp4") ? "m4a" : blob.type.includes("ogg") ? "ogg" : "webm";
          const fd = new FormData();
          fd.append("file", blob, `speech.${ext}`);
          const res = await fetch("/api/transcribe", { method: "POST", body: fd });
          const data = (await res.json()) as { text?: string; error?: string };
          if (!res.ok) throw new Error(data.error ?? "Falha na transcrição");
          if (!data.text) throw new Error("Não entendi o áudio. Tente falar mais perto do microfone.");
          onText(data.text);
          toast.success("Áudio transcrito — revise e envie!");
        } catch (e) {
          toast.error((e as Error).message);
        } finally {
          setState("idle");
        }
      };
      rec.current = r;
      r.start();
      setSecs(0);
      setState("recording");
    } catch {
      toast.error("Permissão do microfone negada. Libere o acesso nas configurações do navegador.");
    }
  };

  return (
    <div className="flex items-center gap-2">
      {state === "recording" && (
        <span className="flex items-center gap-1.5 text-xs font-medium text-destructive">
          <span className="h-2 w-2 animate-pulse rounded-full bg-destructive" /> Gravando 0:{String(secs).padStart(2, "0")}
        </span>
      )}
      {state === "transcribing" && <span className="text-xs text-muted-foreground">Transcrevendo…</span>}
      <Button
        type="button"
        size="icon"
        variant={state === "recording" ? "destructive" : "ghost"}
        disabled={disabled || state === "transcribing"}
        onClick={() => (state === "recording" ? rec.current?.stop() : start())}
        aria-label={state === "recording" ? "Parar gravação" : "Gravar voz"}
        title={state === "recording" ? "Parar gravação" : "Falar em inglês"}
        className={cn("rounded-full", state === "recording" && "animate-pulse")}
      >
        {state === "transcribing" ? <Loader2 className="animate-spin" /> : state === "recording" ? <Square /> : <Mic />}
      </Button>
    </div>
  );
}
