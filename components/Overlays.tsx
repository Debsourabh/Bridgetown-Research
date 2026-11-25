"use client";

import { useEffect, useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import type { Preset } from "@/lib/store";
import { useApp } from "./ctx";

export function Toast() {
  const { s, dispatch } = useApp();
  const ref = useRef<HTMLDivElement>(null);
  const t = s.toast;

  useGSAP(
    () => {
      if (!t || !ref.current) return;
      gsap.fromTo(ref.current, { y: 16, opacity: 0, scale: 0.97 }, { y: 0, opacity: 1, scale: 1, duration: 0.35, ease: "back.out(1.7)" });
    },
    { dependencies: [t?.id] }
  );

  useEffect(() => {
    if (!t) return;
    const timer = setTimeout(() => {
      if (!ref.current) return dispatch({ type: "toastClear", id: t.id });
      gsap.to(ref.current, { y: 12, opacity: 0, duration: 0.25, ease: "power2.in", onComplete: () => dispatch({ type: "toastClear", id: t.id }) });
    }, 4200);
    return () => clearTimeout(timer);
  }, [t, dispatch]);

  if (!t) return null;
  return (
    <div className="toast-wrap">
      <div className="toast" ref={ref} role="status" aria-live="polite">
        <span>{t.msg}</span>
        {t.undo && <button onClick={() => dispatch({ type: "undo" })}>Undo</button>}
        {t.undo && <kbd>⌘Z</kbd>}
      </div>
    </div>
  );
}

const STEPS: { n: Preset; title: string }[] = [
  { n: 1, title: "Landing · suggestions ready" },
  { n: 2, title: "Question selected · Details" },
  { n: 3, title: "Length card · fit to 25 min" },
  { n: 4, title: "Reviewing · split Q5" },
  { n: 5, title: "Guide-level · fit to 25 min" },
  { n: 6, title: "Updated after your edit" },
];

/** Jumps straight to any of the six designed screens. */
export function Walkthrough({ active, onJump, onReplayIntro }: { active: Preset | null; onJump: (n: Preset) => void; onReplayIntro: () => void }) {
  const { s } = useApp();
  return (
    <div className={`walk ${s.panelOpen ? "walk--panel" : ""}`} role="toolbar" aria-label="Design walkthrough">
      <span className="walk__label">Demo screens</span>
      {STEPS.map((st) => (
        <button key={st.n} className={`walk__step ${active === st.n ? "walk__step--on" : ""}`} onClick={() => onJump(st.n)} aria-label={`Screen ${st.n}: ${st.title}`}>
          {st.n}
          <span className="walk__tip">{st.title}</span>
        </button>
      ))}
      <button className="walk__min" onClick={onReplayIntro} title="Replay the intro" aria-label="Replay the intro">↺</button>
    </div>
  );
}
