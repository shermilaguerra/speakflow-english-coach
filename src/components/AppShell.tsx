import { Link, useRouterState } from "@tanstack/react-router";
import { BarChart3, BookMarked, History, Menu, MessagesSquare } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Conversação", icon: MessagesSquare, match: (p: string) => p === "/" || p.startsWith("/chat") },
  { to: "/frases", label: "Minhas Frases", icon: BookMarked, match: (p: string) => p.startsWith("/frases") },
  { to: "/historico", label: "Histórico", icon: History, match: (p: string) => p.startsWith("/historico") },
  { to: "/progresso", label: "Progresso", icon: BarChart3, match: (p: string) => p.startsWith("/progresso") },
] as const;

export function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="bg-brand grid h-9 w-9 place-items-center rounded-xl font-display text-lg font-semibold text-primary-foreground shadow-soft">
        S
      </div>
      <div className="leading-tight">
        <div className="font-display text-lg font-semibold">SpeakFlow</div>
        <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">English</div>
      </div>
    </div>
  );
}

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="flex flex-col gap-1">
      {NAV.map((n) => {
        const active = n.match(path);
        return (
          <Link
            key={n.to}
            to={n.to}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
              active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground/75 hover:bg-sidebar-accent/60",
            )}
          >
            <n.icon className={cn("h-4 w-4", active && "text-primary")} />
            {n.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex h-dvh bg-background">
      <aside className="hidden w-64 shrink-0 flex-col gap-8 border-r border-sidebar-border bg-sidebar p-5 md:flex">
        <Logo />
        <NavList />
        <div className="mt-auto rounded-2xl bg-primary-soft p-4 text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">Fase 1 · Conversação</span>
          <p className="mt-1">Pratique todo dia um pouquinho. Consistência vence intensidade!</p>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border bg-sidebar px-4 py-3 md:hidden">
          <Logo />
          <Button variant="ghost" size="icon" onClick={() => setOpen(true)} aria-label="Abrir menu">
            <Menu />
          </Button>
        </header>
        <main className="min-h-0 flex-1 overflow-y-auto">{children}</main>
      </div>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-72 bg-sidebar p-5">
          <SheetTitle className="sr-only">Menu</SheetTitle>
          <div className="mb-8">
            <Logo />
          </div>
          <NavList onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
    </div>
  );
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">{title}</h1>
        {subtitle && <p className="mt-1.5 text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
