<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- SpeakFlow data (conversations, saved phrases) lives in browser localStorage via `src/lib/store.ts`; why: Phase 1 has no login, so no backend storage yet.
- Teacher corrections are a `corrigir` tool call in `/api/chat`, rendered as cards and counted for Progress; why: keeps corrections structured and metrics real.
