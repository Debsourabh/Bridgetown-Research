"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import {
  AGREED_MIN,
  Question,
  fitPlan,
  SUGGESTIONS,
  SuggId,
  addAnchor,
  suggById,
} from "@/lib/guide";
import { statusOf } from "@/lib/store";
import { gsap, prefersReducedMotion, useGSAP } from "@/lib/gsap";
import { Icon, useApp } from "./ctx";
import { TweenNumber } from "./TweenNumber";

const DOT = { high: "dot-high", medium: "dot-medium", low: "dot-low" } as const;
const PRIO_LABEL = { high: "High", medium: "Medium", low: "Low" } as const;

export function Guide() {
  const { s, questions, total } = useApp();
  const reviewing = s.panelOpen && s.tab === "suggestions" ? s.reviewId : null;
  const addPending = statusOf(s.ops, "add") === "pending";
  // the page entrance handles the first paint; after that the summary/preview swap crossfades
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
  }, []);
  useCelebrate();

  return (
    <div className="guide">
      <div className="ghead">
        <span className="pill">
          <TweenNumber value={questions.length} /> questions · 1 section · ~<TweenNumber value={total} /> min
        </span>
        <h1 className="gtitle">FreshCart — Membership cancellation</h1>
      </div>

      {reviewing === "fit" ? <FitPreview /> : <SummaryBar fadeIn={mounted.current} />}

      <section className="section" aria-label="Why members cancel">
        <p className="section__title">Why members cancel</p>
        <div className="qlist">{renderRows(questions, reviewing, addPending)}</div>
      </section>
    </div>
  );
}

// ── Accept feedback ─────────────────────────────────────────────────────
// Quiet by design: the rows an accept changed get a soft lime tint that fades
// away, and the "✓ … by suggestion" chip fades in with a slight rise. It waits
// for the FLIP reflow to settle so the two motions don't fight.
function useCelebrate() {
  const { s, questions } = useApp();
  const tick = s.celebrate?.tick;
  useEffect(() => {
    if (!tick || !s.celebrate || prefersReducedMotion()) return;
    const opIds = new Set(s.celebrate.opIds);
    const hit = questions.filter((q) => q.origins.some((o) => opIds.has(o.opId)));
    // a split celebrates all three new questions, not just the first
    const groups = new Set(hit.map((q) => q.splitGroup).filter(Boolean));
    const ids = new Set([...hit.map((q) => q.id), ...questions.filter((q) => q.splitGroup && groups.has(q.splitGroup)).map((q) => q.id)]);
    if (!ids.size) return;

    const call = gsap.delayedCall(0.4, () => {
      // soft tint in, then a slow fade out
      [...ids].forEach((id, i) => {
        const tint = document.querySelector<HTMLElement>(`.qrow[data-qid="${id}"] .qrow__tint`);
        if (!tint) return;
        gsap.timeline({ delay: i * 0.06 })
          .fromTo(tint, { opacity: 0 }, { opacity: 1, duration: 0.25, ease: "power1.out" })
          .to(tint, { opacity: 0, duration: 1.2, ease: "power1.inOut" }, "+=0.35");
      });
      // the "✓ … by suggestion" chip arrives quietly
      s.celebrate!.opIds.forEach((opId) => {
        const chip = document.querySelector<HTMLElement>(`.chip[data-op="${opId}"]`);
        if (chip) gsap.fromTo(chip, { autoAlpha: 0, y: 3 }, { autoAlpha: 1, y: 0, duration: 0.4, delay: 0.1, ease: "power2.out", clearProps: "opacity,visibility,transform" });
      });
    });
    return () => {
      call.kill();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick]);
}

function renderRows(qs: Question[], reviewing: SuggId | null, addPending: boolean) {
  const out: React.ReactNode[] = [];
  const anchor = addAnchor(qs); // same rule the accepted question uses
  let i = 0;
  while (i < qs.length) {
    const q = qs[i];
    if (q.splitGroup) {
      const group = q.splitGroup;
      const kids: Question[] = [];
      while (i < qs.length && qs[i].splitGroup === group) kids.push(qs[i++]);
      out.push(
        <div className="splitgroup q-flip" data-flip-id={`group-${group}`} key={`g-${group}`}>
          {kids.map((k) => (
            <QuestionRow key={k.id} q={k} reviewing={reviewing} inGroup />
          ))}
        </div>
      );
    } else {
      if (reviewing === "reorder" && q.id === "q6") {
        out.push(<MoveSlot key="moveslot" />);
      }
      if (reviewing === "note" && q.id === "q9") {
        out.push(<PairLabel key="pairlabel" />);
      }
      out.push(<QuestionRow key={q.id} q={q} reviewing={reviewing} />);
      i++;
    }
    if (q.id === anchor && addPending) {
      out.push(<NewQuestionRow key="qnew-pending" reviewing={reviewing} />);
    }
  }
  return out;
}

function MoveSlot() {
  const { ql } = useApp();
  return (
    <div className="moveslot q-flip" data-flip-id="moveslot">
      {ql("q9")} moves here, before the decision question
    </div>
  );
}

function PairLabel() {
  const { ql } = useApp();
  return (
    <div className="pairlabel q-flip" data-flip-id="pairlabel">
      <span className="tag tag--lime">One suggestion · changes 2 questions</span>
      <span>
        {ql("q9")} and {ql("q10")} are accepted or undone together
      </span>
    </div>
  );
}

// ── Summary bar (Decisions 1.1–1.2) ─────────────────────────────────────
function SummaryBar({ fadeIn }: { fadeIn: boolean }) {
  const { s, pending, dispatch } = useApp();
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(() => {
    if (fadeIn) gsap.fromTo(ref.current, { autoAlpha: 0, y: -6 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: "power3.out", clearProps: "opacity,visibility,transform" });
  });
  const counts = { high: 0, medium: 0, low: 0 };
  for (const id of pending) counts[suggById(id as SuggId).priority]++;
  const accepted = SUGGESTIONS.filter((x) => statusOf(s.ops, x.id) === "accepted").length;
  const dismissed = SUGGESTIONS.filter((x) => statusOf(s.ops, x.id) === "dismissed").length;
  const firstHigh = pending.find((id) => suggById(id as SuggId).priority === "high") ?? pending[0];

  if (!pending.length) {
    return (
      <div className="summary" ref={ref}>
        <div className="summary__icon"><Icon name="summary-icon" /></div>
        <div className="summary__body">
          <p className="summary__title">All suggestions reviewed</p>
          <div className="summary__meta">
            <span className="summary__done">{accepted} accepted</span>
            <span className="sep">·</span>
            <span>{dismissed} dismissed</span>
            <span className="sep">·</span>
            <span>Every change is a step in History</span>
          </div>
        </div>
        <button className="btn-outline" onClick={() => dispatch({ type: "setTab", tab: "history" })}>
          Open History
        </button>
      </div>
    );
  }

  return (
    <div className="summary" ref={ref}>
      <div className="summary__icon"><Icon name="summary-icon" /></div>
      <div className="summary__body">
        <p className="summary__title">
          <TweenNumber value={pending.length} /> suggestion{pending.length === 1 ? "" : "s"} to make this guide work for the AI interviewer
        </p>
        <div className="summary__meta">
          {(["high", "medium", "low"] as const).map((p) =>
            counts[p] ? (
              <Fragment key={p}>
                <Icon name={DOT[p]} />
                <span>
                  {counts[p]} {p}
                </span>
              </Fragment>
            ) : null
          )}
          <span className="sep">·</span>
          <span>Nothing changes until you accept</span>
        </div>
      </div>
      <button className="btn-outline" onClick={() => firstHigh && dispatch({ type: "review", id: firstHigh as SuggId })}>
        {counts.high ? "Start with high priority" : "Review suggestions"}
      </button>
    </div>
  );
}

// ── Fit preview (Decisions 5.1) ─────────────────────────────────────────
function useFitPlan() {
  const { s, questions } = useApp();
  const active = fitPlan(questions, s.fitChoices).checked;
  const cutFor = (q: Question) => {
    const c = active.find((x) => x.target === q.id);
    if (!c) return 0;
    return Math.min(q.minutes, -c.delta);
  };
  return { active, cutFor };
}

function FitPreview() {
  const { questions, total } = useApp();
  const { cutFor } = useFitPlan();
  const ref = useRef<HTMLDivElement>(null);
  const rowsRef = useRef<HTMLDivElement>(null);
  const [ppm, setPpm] = useState(13.5); // px per minute, as in the design

  const plan = total - questions.reduce((s, q) => s + cutFor(q), 0);
  const maxMin = Math.max(total, AGREED_MIN);

  useEffect(() => {
    const el = rowsRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const avail = el.clientWidth - 104 - 80;
      setPpm(Math.max(4, Math.min(13.5, avail / maxMin)));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [maxMin]);

  // Not part of the FLIP set: Flip.from would kill this entrance tween mid-way.
  useGSAP(
    () => {
      gsap.fromTo(ref.current, { opacity: 0, y: -8 }, { opacity: 1, y: 0, duration: 0.45, ease: "power3.out" });
      gsap.fromTo(".block", { scaleX: 0 }, { scaleX: 1, transformOrigin: "left center", duration: 0.5, ease: "power3.out", stagger: 0.025, delay: 0.1 });
    },
    { scope: ref }
  );

  const cutIds = questions.filter((q) => cutFor(q) > 0).map((q) => q.id);

  return (
    <div className="fitcard" ref={ref}>
      <div className="fitcard__head">
        <Icon name="preview-sparkle" />
        <p>Previewing: Fit the guide to {AGREED_MIN} min</p>
        <p>Not applied yet</p>
      </div>
      <div className="fitrows" ref={rowsRef}>
        <div className="fitrow">
          <p className="fitrow__label">Now</p>
          <div className="blocks">
            {questions.map((q) => {
              const cut = cutFor(q);
              const keep = q.minutes - cut;
              return (
                <Fragment key={q.id}>
                  {keep > 0 && (
                    <div className="block" style={{ width: keep * ppm }}>
                      <i />
                    </div>
                  )}
                  {cut > 0 && (
                    <div className="block block--cut" style={{ width: cut * ppm }}>
                      <i />
                    </div>
                  )}
                </Fragment>
              );
            })}
          </div>
          <p className={`fitrow__total ${total > AGREED_MIN ? "fitrow__total--over" : "fitrow__total--ok"}`}>
            <TweenNumber value={total} /> min
          </p>
        </div>
        <div className="fitrow">
          <p className="fitrow__label">With this plan</p>
          <div className="blocks">
            {questions.map((q) => {
              const keep = q.minutes - cutFor(q);
              return keep > 0 ? (
                <div className="block" key={q.id} style={{ width: keep * ppm }}>
                  <i />
                </div>
              ) : null;
            })}
          </div>
          <p className={`fitrow__total ${plan > AGREED_MIN ? "fitrow__total--over" : "fitrow__total--ok"}`}>
            <TweenNumber value={plan} /> min
            {plan <= AGREED_MIN && <Icon name="check-green" />}
          </p>
        </div>
        <div className="fitmarker" style={{ left: 104 + AGREED_MIN * ppm }}>
          <span>{AGREED_MIN} min agreed</span>
          <i />
        </div>
      </div>
      <div className="legend">
        <i /> <span>Kept</span>
        <i className="cut" />
        <span>Cut or shortened: {cutIds.length ? cutIds.map((id) => `Q${id.slice(1)}`).join(", ") : "none"}</span>
        <span className="faint">{"·  One block per question, sized by estimated minutes"}</span>
      </div>
    </div>
  );
}

// ── Rows ────────────────────────────────────────────────────────────────
function Chip({ id }: { id: SuggId }) {
  const { dispatch, ql } = useApp();
  const sg = suggById(id);
  const label = id === "reorder" ? `Move before ${ql("q6")}` : sg.chip;
  return (
    <button
      className="chip"
      onClick={(e) => {
        e.stopPropagation();
        dispatch({ type: "review", id });
      }}
      aria-label={`${label}. ${PRIO_LABEL[sg.priority]} priority. Review suggestion`}
    >
      <Icon name="chip-sparkle" />
      <span className="chip__label">{label}</span>
      <span className="sep">·</span>
      <span className={`prio prio--${sg.priority}`}>
        <Icon name={DOT[sg.priority]} />
        {PRIO_LABEL[sg.priority]}
      </span>
    </button>
  );
}

function OriginChip({ label, opId }: { label: string; opId: string }) {
  const { dispatch } = useApp();
  return (
    <span className="chip" data-op={opId}>
      <span className="chip__origin">
        <Icon name="check-small" />
        {label}
      </span>
      <span className="sep">·</span>
      <button
        className="chip__undo"
        onClick={(e) => {
          e.stopPropagation();
          dispatch({ type: "undoOp", opId });
        }}
      >
        Undo
      </button>
    </span>
  );
}

function QuestionRow({ q, reviewing, inGroup }: { q: Question; reviewing: SuggId | null; inGroup?: boolean }) {
  const { s, nums, dispatch, ql, questions } = useApp();
  const { cutFor, active } = useFitPlan();
  const num = nums[q.id];
  const fitMode = reviewing === "fit";

  // pending suggestion chips anchored on this question
  const chips = SUGGESTIONS.filter(
    (x) => x.chip && x.id !== "add" && x.targets[0] === q.id && statusOf(s.ops, x.id) === "pending" && reviewing !== x.id
  ).map((x) => x.id);

  let cls = "qrow q-flip";
  let textCls = "qtext";
  let after: React.ReactNode = null;
  let before: React.ReactNode = null;
  let minsCls = "qmins";

  // selection shows in every tab; preview styles below take over on previewed rows
  if (s.selectedId === q.id) cls += " qrow--selected";

  if (reviewing === "split" && q.id === "q5") {
    cls += " qrow--preview";
    textCls += " qtext--struck";
    after = (
      <Proposal head={`Suggested · replaces Q${num} with 3 questions`} icon="suggested-icon">
        {s.splitDraft.map((t, k) => (
          <div className="proposal__item" key={k}>
            <span className="proposal__badge">{`${num}${"abc"[k]}`}</span>
            <div className="stack4" style={{ gap: 2 }}>
              <p className="proposal__text">{t || <em style={{ color: "#a3a3a3" }}>Empty question</em>}</p>
              {k > 0 && <p className="proposal__hint">Skip if they tried none.</p>}
            </div>
          </div>
        ))}
      </Proposal>
    );
  }
  if (reviewing === "reword" && q.id === "q4") {
    cls += " qrow--preview";
    textCls += " qtext--struck";
    after = (
      <Proposal head={`Suggested · rewords Q${num} so it stands on its own`} icon="suggested-icon">
        <p className="proposal__text">{s.rewordDraft}</p>
      </Proposal>
    );
  }
  if (reviewing === "format" && q.id === "q8") {
    cls += " qrow--preview";
    after = (
      <Proposal head="Suggested · single choice" icon="suggested-icon">
        <div className="choices">
          {["Cheap", "Fair", "Expensive"].map((c) => (
            <span className="choice" key={c}>{c}</span>
          ))}
        </div>
        <p className="proposal__hint">The AI still asks a short “why” after the choice.</p>
      </Proposal>
    );
  }
  if (reviewing === "reorder" && q.id === "q9") cls += " qrow--preview";
  if (reviewing === "note" && (q.id === "q9" || q.id === "q10")) {
    cls += " qrow--paired";
    if (q.id === "q10") {
      textCls += " qtext--removed";
      after = <span className="tag tag--red">Removed · becomes the note on {ql("q9")}</span>;
    } else {
      const q10text = questions.find((x) => x.id === "q10")?.text;
      after = (
        <>
          {q.editedByUser && <span className="tag tag--amber">Edited by you · just now</span>}
          <div className="note-box">
            <span className="tag tag--lime-dark">+ Note</span>
            <p>{q10text}</p>
          </div>
        </>
      );
    }
  }

  // Fit preview: cut / shortened rows
  const cut = fitMode ? cutFor(q) : 0;
  const fitChange = fitMode ? active.find((c) => c.target === q.id) : undefined;
  if (fitMode && fitChange) {
    const removes = cut >= q.minutes;
    if (removes) {
      cls += " qrow--cut";
      textCls += " qtext--struck";
      minsCls += " qmins--cut";
    }
    before = (
      <span className="chip chip--red">
        <Icon name="chip-sparkle-red" />
        <span className="chip__label">{fitChange.key === "merge-q2" ? `Merge into ${ql("q3")}` : fitChange.chip}</span>
        <span className="sep">·</span>
        <span className="chip__val">−{cut} min</span>
      </span>
    );
  }
  const mergePreview =
    fitMode && q.id === "q3" && active.some((c) => c.key === "merge-q2") && !q.origins.some((o) => o.label.includes("from Q2"));

  const showOrigins = q.origins.length > 0;
  const showNote = q.modNote && !(reviewing === "note" && q.id === "q9");

  return (
    <div
      className={cls}
      data-flip-id={q.id}
      data-qid={q.id}
      onClick={() => dispatch({ type: "select", id: q.id })}
      role="button"
      tabIndex={0}
      aria-pressed={s.selectedId === q.id}
      onKeyDown={(e) => {
        if (e.key === "Enter" && e.target === e.currentTarget) dispatch({ type: "select", id: q.id });
      }}
      style={inGroup ? { borderRadius: 12 } : undefined}
    >
      {/* soft tint that fades away when an accept changes this row */}
      <span className="qrow__tint" aria-hidden />
      <div className="qbadge-col">
        <span className="qbadge">
          <Icon name="chatting" />
          {num}
        </span>
      </div>
      <div className="qbody">
        <p className={textCls}>{q.text}</p>
        {q.hint && <p className="qhint">{q.hint}</p>}
        {q.choices && (
          <div className="choices">
            {q.choices.map((c) => (
              <span className="choice" key={c}>{c}</span>
            ))}
          </div>
        )}
        {showNote && (
          <div className="note-box">
            <span className="tag tag--lime-dark">Note</span>
            <p>{q.modNote}</p>
          </div>
        )}
        {q.editedByUser && reviewing !== "note" && <span className="tag tag--amber">Edited by you</span>}
        {after}
        {(chips.length > 0 || showOrigins || before || mergePreview) && (
          <div className="chips">
            {before}
            {mergePreview && (
              <span className="chip">
                <Icon name="chip-sparkle" />
                <span className="chip__label">Also asks about a typical month (from Q2)</span>
              </span>
            )}
            {chips.map((id) => (
              <Chip key={id} id={id} />
            ))}
            {q.origins.map((o) => (
              <OriginChip key={o.opId + o.label} label={o.label} opId={o.opId} />
            ))}
          </div>
        )}
      </div>
      {fitMode && (
        <p className={minsCls}>
          {cut > 0 && cut < q.minutes ? `~${q.minutes} → ${q.minutes - cut} min` : `~${q.minutes} min`}
        </p>
      )}
    </div>
  );
}

function NewQuestionRow({ reviewing }: { reviewing: SuggId | null }) {
  const { s, dispatch } = useApp();
  const preview = reviewing === "add";
  return (
    <div
      className={`qrow qrow--new q-flip ${preview ? "qrow--preview" : ""}`}
      data-flip-id="qnew-pending"
      role="button"
      tabIndex={0}
      onClick={() => dispatch({ type: "review", id: "add" })}
      onKeyDown={(e) => e.key === "Enter" && dispatch({ type: "review", id: "add" })}
    >
      <div>
        <span className="qnew-badge">+ New</span>
      </div>
      <div className="qbody">
        <p className="qtext qtext--muted">“{s.addDraft}”</p>
        {!preview && (
          <div className="chips">
            <span className="chip">
              <Icon name="chip-sparkle" />
              <span className="chip__label">Suggested: covers a gap in your brief</span>
              <span className="sep">·</span>
              <span className="prio prio--high">
                <Icon name="dot-high" />
                High
              </span>
            </span>
          </div>
        )}
      </div>
      {reviewing === "fit" && <p className="qmins">+2 min</p>}
    </div>
  );
}

function Proposal({ head, icon, children }: { head: string; icon: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      gsap.from(ref.current, { height: 0, opacity: 0, paddingTop: 0, paddingBottom: 0, duration: 0.55, ease: "power3.inOut", clearProps: "height,opacity,paddingTop,paddingBottom" });
      gsap.from(".proposal__item, .proposal__text, .choices", { opacity: 0, y: 6, duration: 0.45, stagger: 0.07, delay: 0.22, ease: "power2.out" });
    },
    { scope: ref }
  );
  return (
    <div className="proposal" ref={ref} onClick={(e) => e.stopPropagation()}>
      <div className="proposal__head">
        <Icon name={icon} />
        {head}
      </div>
      {children}
    </div>
  );
}
