# FreshCart · Revision flow (v1)

An interactive build of the **Revision** section of the Bridgetown Figma file: a researcher reviews AI suggestions on an interview guide. It covers the six designed screens as one working flow.

Stack: **Next.js 16 (App Router) · React 19 · GSAP 3 (Flip, ScrollTo) · three.js**. Plain CSS with design tokens, no UI library.

## Run

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build (what Vercel runs)
```

## Deploy to Vercel

Nothing to configure. The page is fully static (`○ /` in the build output).

- **Dashboard:** push this folder to a Git repo, then *Add New → Project → Import*. Vercel detects Next.js automatically.
- **CLI:** `npx vercel` (preview) or `npx vercel --prod`.

## What's interactive

| Screen | What you can do |
| --- | --- |
| 1 · Landing | The summary bar counts pending suggestions by priority. Chips under questions open that suggestion. *Start with high priority* opens the first one. |
| 2 · Question selected | Click any question. Details shows its suggestion(s); press **S** to review. The question text and moderator notes are editable (edits go to History). |
| 3 · Length card | ✨ in the toolbar, or the Suggestions tab. The Now / With plan bars and the minutes all update live as you accept things. |
| 4 · Split Q5 | The change is previewed inside the guide. Suggested questions are editable before you accept. |
| 5 · Fit to 25 min | The guide shows one block per question and the cut rows. Tick or untick changes and the result recomputes. *Show one more question to cut* adds an option. Each change is a separate History step. |
| 6 · Updated after your edit | Edit Q9 in Details, then open *Convert to moderator note*: it shows the "Updated after your edit" banner and keeps your wording. Q9 + Q10 move as one step. |

**Keyboard:** `A` accept · `D` dismiss · `↑/↓` (or `J/K`) previous/next suggestion · `Esc` back/close · `⌘Z` / `⇧⌘Z` undo/redo.

**Screens 1–6** (bottom-left) jumps straight to each designed state. *↺ Intro* replays the three.js intro.

## How it's built

- `lib/guide.ts`: base guide, the 7 suggestions, and **ops**. The visible guide is always `applyOps(base, ops)`, so any single step in History can be undone without touching the others. Numbering (incl. 5a/5b/5c) and minutes are derived from it.
- `lib/store.ts`: one reducer for the flow (selection, panel, review, accept/dismiss, undo/redo, walkthrough presets).
- `components/RevisionApp.tsx`: GSAP **Flip** animates the question list on every accept, undo or reorder. GSAP also tweens the panel open/close and scrolls to the reviewed question.
- `components/IntroScene.tsx`: **three.js** intro. The 12 questions are blocks sized by minutes, and they settle into the 38-min timeline with the 25-min mark. It's loaded with `next/dynamic` (`ssr: false`), so three.js stays out of the main bundle. It plays once per session, can be skipped, is skipped entirely with `prefers-reduced-motion`, and falls back silently without WebGL.
- `public/icons/`: SVGs exported from the Figma file.

## Notes

- **Font:** the design uses *Kalice* (licensed) for display text. If it's installed locally it's used; otherwise the page falls back to Newsreader (Google Fonts). To ship Kalice, add the `.woff2` and load it with `next/font/local` in `app/layout.tsx`.
- Data is in-memory (no backend). Refreshing resets the guide.
