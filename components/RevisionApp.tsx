"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useLayoutEffect, useMemo, useReducer, useRef, useState } from "react";
import { BASE_QUESTIONS, SuggId, applyOps, baseNumber, numberMap, totalMinutes } from "@/lib/guide";
import { Action, Preset, initialState, pendingIds, reducer } from "@/lib/store";
import { Flip, gsap, prefersReducedMotion, useGSAP } from "@/lib/gsap";
import { AppCtx, Ctx } from "./ctx";
import { Nav, TopBar, Toolbar } from "./Shell";
import { Guide } from "./Guide";
import { Panel } from "./Panel";
import { Toast, Walkthrough } from "./Overlays";

const IntroScene = dynamic(() => import("./IntroScene"), { ssr: false, loading: () => <div className="intro" /> });

// Actions that move rows around and should FLIP-animate. Typing never does.
const FLIP = new Set<Action["type"]>(["accept", "dismiss", "undo", "redo", "undoOp", "review", "nav", "openList", "closePanel", "toggleFit", "showMoreCut", "preset", "setTab"]);

const REVIEW_TARGET: Partial<Record<SuggId, string>> = {
  split: "q5",
  reword: "q4",
  format: "q8",
  note: "q9",
  reorder: "q6",
  add: "qnew-pending",
};

export default function RevisionApp() {
  const [s, raw] = useReducer(reducer, initialState);
  const [intro, setIntro] = useState(true);
  const [activePreset, setActivePreset] = useState<Preset | null>(1);
  const flipState = useRef<Flip.FlipState | null>(null);
  const panelWrap = useRef<HTMLDivElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const appRef = useRef<HTMLDivElement>(null);
  const lastPanelOpen = useRef(s.panelOpen);

  const dispatch = useCallback((a: Action) => {
    if (FLIP.has(a.type) && !prefersReducedMotion()) {
      flipState.current = Flip.getState(".q-flip");
    }
    if (a.type !== "preset" && a.type !== "toastClear") setActivePreset(null);
    raw(a);
  }, []);

  // Derived guide
  const questions = useMemo(() => applyOps(BASE_QUESTIONS, s.ops), [s.ops]);
  const nums = useMemo(() => numberMap(questions), [questions]);
  const ctx: Ctx = useMemo(
    () => ({
      s,
      dispatch,
      questions,
      nums,
      ql: (id: string) => `Q${nums[id] ?? baseNumber(id)}`,
      total: totalMinutes(questions),
      pending: pendingIds(s.ops),
    }),
    [s, dispatch, questions, nums]
  );

  // ── intro (three.js) on every page load ──
  useEffect(() => {
    if (prefersReducedMotion()) setIntro(false);
  }, []);
  const endIntro = useCallback(() => setIntro(false), []);
  const [revealTick, setRevealTick] = useState(0);
  const revealApp = useCallback(() => setRevealTick((n) => n + 1), []);

  // Entrance runs as the loader *starts* to dissolve, while it still covers the
  // screen, so the hidden start state is never visible (this was the flicker).
  useGSAP(
    () => {
      if (!revealTick || prefersReducedMotion()) return;
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.fromTo(".nav, .topbar, .toolbar", { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.6, ease: "power1.out", clearProps: "opacity,visibility" }, 0)
        .fromTo(
          ".ghead, .summary, .section__title, .qlist > *",
          { autoAlpha: 0, y: 14 },
          { autoAlpha: 1, y: 0, duration: 0.7, stagger: { each: 0.035, ease: "power1.in" }, clearProps: "opacity,visibility,transform" },
          0.08
        );
    },
    { dependencies: [revealTick], scope: appRef }
  );

  // ── FLIP the question list after structural changes ──
  useLayoutEffect(() => {
    const st = flipState.current;
    flipState.current = null;
    const panelChanged = lastPanelOpen.current !== s.panelOpen;
    lastPanelOpen.current = s.panelOpen;
    if (!st || panelChanged) return;
    Flip.from(st, {
      targets: ".q-flip",
      duration: 0.6,
      ease: "power2.inOut",
      nested: true,
      prune: true,
      onEnter: (els) => gsap.fromTo(els, { autoAlpha: 0, y: -6 }, { autoAlpha: 1, y: 0, duration: 0.5, delay: 0.18, ease: "power2.out", clearProps: "opacity,visibility,transform" }),
    });
  });

  // ── panel open / close ──
  useGSAP(
    () => {
      const el = panelWrap.current;
      if (!el) return;
      const w = Math.min(420, window.innerWidth);
      if (prefersReducedMotion()) {
        gsap.set(el, { width: s.panelOpen ? w : 0 });
        return;
      }
      const inner = el.querySelector(".panel");
      gsap.killTweensOf([el, inner]);
      if (s.panelOpen) {
        // width eases out (fast start, long soft settle); content fades in once there's room
        gsap.to(el, { width: w, duration: 0.6, ease: "expo.out" });
        gsap.fromTo(inner, { autoAlpha: 0, x: 16 }, { autoAlpha: 1, x: 0, duration: 0.45, delay: 0.12, ease: "power2.out" });
      } else {
        gsap.to(inner, { autoAlpha: 0, x: 12, duration: 0.18, ease: "power1.in" });
        gsap.to(el, { width: 0, duration: 0.45, delay: 0.06, ease: "power3.inOut" });
      }
    },
    { dependencies: [s.panelOpen] }
  );

  // ── keep the reviewed question in view (Decision 4.1: change shown in the guide) ──
  useEffect(() => {
    const sc = scroller.current;
    if (!sc || !s.panelOpen) return;
    let y: number | Element | null = null;
    if (s.tab === "suggestions" && s.reviewId) {
      if (s.reviewId === "fit") y = 0;
      else {
        const id = REVIEW_TARGET[s.reviewId];
        y = (id && sc.querySelector(`[data-flip-id="${id}"]`)) || null;
      }
    } else if (s.tab === "details" && s.selectedId) {
      const el = sc.querySelector(`[data-qid="${s.selectedId}"]`);
      if (el) {
        const r = el.getBoundingClientRect();
        const sr = sc.getBoundingClientRect();
        if (r.top > sr.top + 40 && r.bottom < sr.bottom - 40) return; // already visible
      }
      y = el;
    }
    if (y === null) return;
    // Right after an accept, let the celebration on the changed rows play before
    // moving the guide to the next suggestion.
    const justAccepted = !!s.celebrate && Date.now() - s.celebrate.tick < 600;
    gsap.to(sc, { scrollTo: { y, offsetY: 140, autoKill: true }, duration: prefersReducedMotion() ? 0 : 0.7, delay: justAccepted && !prefersReducedMotion() ? 1 : 0.15, ease: "power2.inOut" });
  }, [s.reviewId, s.tab, s.selectedId, s.panelOpen]);

  // ── keyboard ──
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      const typing = t.tagName === "TEXTAREA" || t.tagName === "INPUT" || t.isContentEditable;
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === "z" && !typing) {
        e.preventDefault();
        dispatch({ type: e.shiftKey ? "redo" : "undo" });
        return;
      }
      if (e.key === "Escape") {
        if (typing) return (t as HTMLElement).blur();
        if (s.reviewId && s.tab === "suggestions") dispatch({ type: "openList" });
        else if (s.panelOpen) dispatch({ type: "closePanel" });
        return;
      }
      if (typing || mod || e.altKey) return;
      const k = e.key.toLowerCase();
      const reviewing = s.panelOpen && s.tab === "suggestions" && s.reviewId;
      if (reviewing && k === "a") dispatch({ type: "accept", id: s.reviewId! });
      else if (reviewing && k === "d") dispatch({ type: "dismiss", id: s.reviewId! });
      else if (reviewing && (e.key === "ArrowDown" || k === "j")) {
        e.preventDefault();
        dispatch({ type: "nav", dir: 1 });
      } else if (reviewing && (e.key === "ArrowUp" || k === "k")) {
        e.preventDefault();
        dispatch({ type: "nav", dir: -1 });
      } else if (k === "s" && s.selectedId) {
        const id = ctx.pending.find((p) => ["split", "reword", "note", "format", "reorder"].includes(p) && REVIEW_TARGET[p as SuggId] === s.selectedId) as SuggId | undefined;
        const direct = id ?? (s.selectedId === "q10" && ctx.pending.includes("note") ? "note" : undefined);
        if (direct) dispatch({ type: "review", id: direct });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [s, dispatch, ctx.pending]);

  const jump = (n: Preset) => {
    setActivePreset(n);
    dispatch({ type: "preset", n });
  };

  return (
    <AppCtx.Provider value={ctx}>
      <div className="app" ref={appRef}>
        <Nav />
        <main className="main">
          <TopBar />
          <div className="workspace">
            <div className="guidecol">
              <Toolbar />
              <div className="guide-scroll" ref={scroller}>
                <Guide />
              </div>
            </div>
            <div className="panel-wrap" ref={panelWrap} inert={!s.panelOpen}>
              <Panel />
            </div>
          </div>
        </main>
      </div>
      <Toast />
      <Walkthrough
        active={activePreset}
        onJump={jump}
        onReplayIntro={() => {
          jump(1);
          setIntro(true);
        }}
      />
      {intro && <IntroScene onReveal={revealApp} onDone={endIntro} />}
    </AppCtx.Provider>
  );
}
