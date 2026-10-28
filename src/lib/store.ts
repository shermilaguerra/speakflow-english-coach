import { useSyncExternalStore } from "react";
import type { UIMessage } from "ai";

export type Thread = {
  id: string;
  title: string;
  topic: string;
  createdAt: number;
  updatedAt: number;
  messages: UIMessage[];
};

export type PhraseSource = "conversa" | "correção" | "manual";

export type Phrase = {
  id: string;
  original: string;
  learned: string;
  translation: string;
  explanation: string;
  topic: string;
  source: PhraseSource;
  createdAt: number;
  needsPractice: boolean;
};

export type Correction = {
  original: string;
  correction: string;
  natural: string | null;
  explanation: string;
  practice: string;
  category: string;
};

const KEYS = { threads: "speakflow.threads", phrases: "speakflow.phrases" } as const;
type Key = keyof typeof KEYS;

const cache: Partial<Record<Key, unknown[]>> = {};
const listeners = new Set<() => void>();
const EMPTY: never[] = [];

function load<T>(key: Key): T[] {
  if (typeof window === "undefined") return EMPTY;
  if (!cache[key]) {
    try {
      cache[key] = JSON.parse(localStorage.getItem(KEYS[key]) ?? "[]");
    } catch {
      cache[key] = [];
    }
  }
  return cache[key] as T[];
}

function save<T>(key: Key, value: T[]) {
  cache[key] = value;
  localStorage.setItem(KEYS[key], JSON.stringify(value));
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export const uid = () => (crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random())).slice(0, 12);

export function useThreads() {
  return useSyncExternalStore(subscribe, () => load<Thread>("threads"), () => EMPTY as Thread[]);
}
export function usePhrases() {
  return useSyncExternalStore(subscribe, () => load<Phrase>("phrases"), () => EMPTY as Phrase[]);
}

export const getThread = (id: string) => load<Thread>("threads").find((t) => t.id === id);

export function createThread(topic: string, greeting: string): Thread {
  const now = Date.now();
  const t: Thread = {
    id: uid(),
    title: "Nova conversa",
    topic,
    createdAt: now,
    updatedAt: now,
    messages: [{ id: uid(), role: "assistant", parts: [{ type: "text", text: greeting }] }],
  };
  save("threads", [t, ...load<Thread>("threads")]);
  return t;
}

export function updateThread(id: string, patch: Partial<Thread>) {
  save(
    "threads",
    load<Thread>("threads").map((t) => (t.id === id ? { ...t, ...patch, updatedAt: Date.now() } : t)),
  );
}

export function deleteThread(id: string) {
  save("threads", load<Thread>("threads").filter((t) => t.id !== id));
}

export function addPhrase(p: Omit<Phrase, "id" | "createdAt">) {
  save("phrases", [{ ...p, id: uid(), createdAt: Date.now() }, ...load<Phrase>("phrases")]);
}
export function updatePhrase(id: string, patch: Partial<Phrase>) {
  save("phrases", load<Phrase>("phrases").map((p) => (p.id === id ? { ...p, ...patch } : p)));
}
export function deletePhrase(id: string) {
  save("phrases", load<Phrase>("phrases").filter((p) => p.id !== id));
}

/** Extract corrections the teacher made in a thread's messages. */
export function correctionsOf(messages: UIMessage[]): Correction[] {
  const out: Correction[] = [];
  for (const m of messages)
    for (const part of m.parts as { type: string; input?: unknown }[])
      if (part.type === "tool-corrigir" && part.input) out.push(part.input as Correction);
  return out;
}
