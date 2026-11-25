"use client";

import { createContext, useContext, useRef, useState } from "react";
import {
  AGREED_MIN,
  BASE_TOTAL,
  FitKey,
  fitPlan,
  Priority,
  SUGGESTIONS,
  SuggId,
  addAnchor,
  suggById,
} from "@/lib/guide";
import { Tab, pendingIds, statusOf } from "@/lib/store";
import { isUpdated, relationsFor } from "@/lib/relations";
import { gsap, useGSAP } from "@/lib/gsap";
import { Icon, useApp } from "./ctx";
import { TweenNumber } from "./TweenNumber";

const DOT = { high: "dot-high", medium: "dot-medium", low: "dot-low" } as const;
const PRIO_LABEL = { high: "High", medium: "Medium", low: "Low" } as const;
const PRIO_GROUP = { high: "High priority", medium: "Medium", low: "Low" } as const;
const fmtDelta = (d: number) => (d > 0 ? `+${d} min` : d < 0 ? `−${-d} min` : "0 min");

export function Panel() {
  const { s, dispatch, pending } = useApp();
  const bodyRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLElement>(null);
  const viewKey = s.tab === "suggestions" ? `sugg-${s.reviewId ?? "list"}` : s.tab === "details" ? `det-${s.selectedId}` : s.tab;

  // Between views (list → review, review → next…): sections build in one after
  // another instead of the whole panel swapping at once.
  useGSAP(
    () => {
      const body = bodyRef.current;
      if (!body) return;
      body.closest(".panel__scroll")?.scrollTo({ top: 0 });
      const parts = Array.from(body.children);
      gsap.fromTo(
        parts,
        { autoAlpha: 0, y: 8 },
        { autoAlpha: 1, y: 0, duration: 0.5, ease: "power3.out", stagger: { each: 0.045, ease: "power1.in" }, clearProps: "opacity,visibility,transform" }
      );
      const foot = rootRef.current?.querySelector(".panel__foot");
      if (foot) gsap.fromTo(foot, { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.45, delay: 0.12, ease: "power3.out", clearProps: "opacity,visibility,transform" });
    },
    { dependencies: [viewKey] }
  );

  const tabs: { id: Tab; label: string }[] = [
    { id: "details", label: "Details" },
    { id: "preview", label: "Preview" },
    { id: "history", label: "History" },
    { id: "suggestions", label: "Suggestions" },
  ];

  let body: React.ReactNode;
  let foot: React.ReactNode = null;
  if (s.tab === "suggestions") {
    if (s.reviewId) {
      const r = <Review id={s.reviewId} />;
      body = r;
      foot = <ReviewFoot id={s.reviewId} />;
    } else if (s.checkpoint) body = <Checkpoint />;
    else body = <SuggestionList />;
  } else if (s.tab === "details") body = <DetailsTab />;
  else if (s.tab === "preview") body = <PreviewTab />;
  else body = <HistoryTab />;

  return (
    <aside className="panel" aria-label="Details panel" ref={rootRef}>
      <div className="panel__tabs" role="tablist">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={s.tab === t.id}
            className={`ptab ${s.tab === t.id ? "ptab--active" : ""}`}
            onClick={() => (t.id === "suggestions" ? dispatch({ type: "openList" }) : dispatch({ type: "setTab", tab: t.id }))}
          >
            {t.label}
            {t.id === "suggestions" && pending.length > 0 && (
              <span className="count">
                <TweenNumber value={pending.length} duration={0.3} />
              </span>
            )}
          </button>
        ))}
        <button className="panel__close" aria-label="Close panel (Esc)" title="Close · Esc" onClick={() => dispatch({ type: "closePanel" })}>
          ×
        </button>
      </div>
      <div className="panel__scroll">
        <div className="panel__body" ref={bodyRef}>
          {body}
        </div>
      </div>
      {foot}
    </aside>
  );
}

// ── Suggestions list (Screen 3) ──────────────────────────────────────────
function LengthCard() {
  const { s, total, dispatch, questions, ql } = useApp();
  const fitPending = statusOf(s.ops, "fit") === "pending";
  // same live plan the Fit review uses, so the numbers always agree
  const fp = fitPlan(questions, s.fitChoices);
  const plan = fitPending ? fp.result : total;
  const scale = Math.max(total, AGREED_MIN);
  const over = total > AGREED_MIN;
  const names = fp.checked.map((c) =>
    c.key === "remove-q7" ? `remove ${ql("q7")}` : c.key === "merge-q2" ? `merge ${ql("q2")} into ${ql("q3")}` : `shorten ${ql(c.target)}`
  );

  return (
    <div className="lencard">
      <div className="lencard__top">
        <p className="lencard__big">
          ~<TweenNumber value={total} /> min
        </p>
        <p className="lencard__est">estimated</p>
        <p className="lencard__agreed">{AGREED_MIN} min agreed</p>
      </div>
      <div className="lenrow">
        <p className="lenrow__label">Now</p>
        <div className="lenrow__track">
          <i style={{ width: `${(Math.min(total, AGREED_MIN) / scale) * 100}%`, background: "#0a0a0a", borderRadius: over ? "3px 0 0 3px" : 3 }} />
          {over && <i style={{ width: `${((total - AGREED_MIN) / scale) * 100}%`, background: "#dc2626", borderRadius: "0 3px 3px 0" }} />}
        </div>
        <p className="lenrow__val" style={{ color: over ? "#b91c1c" : "#3f6212" }}>{total}</p>
      </div>
      {fitPending && (
        <div className="lenrow">
          <p className="lenrow__label">With plan</p>
          <div className="lenrow__track">
            <i style={{ width: `${(plan / scale) * 100}%`, background: "#99e635", borderRadius: 3 }} />
          </div>
          <p className="lenrow__val" style={{ color: plan > AGREED_MIN ? "#b91c1c" : "#3f6212" }}>{plan}</p>
        </div>
      )}
      {over ? (
        fitPending ? (
          <>
            <p className="lencard__msg" style={{ color: "#b91c1c" }}>
              {names.length} change{names.length === 1 ? "" : "s"} to {plan <= AGREED_MIN ? `${AGREED_MIN} min` : `${plan} min`}: {names.join(", ")}.
            </p>
            <div className="lencard__actions">
              <button className="btn-primary" onClick={() => dispatch({ type: "review", id: "fit" })}>
                Fit to {AGREED_MIN} min →
              </button>
              <span>Nothing changes until you accept</span>
            </div>
          </>
        ) : (
          <p className="lencard__msg" style={{ color: "#b91c1c" }}>
            Still {total - AGREED_MIN} min over. Undo a change in History or cut another question.
          </p>
        )
      ) : (
        <p className="lencard__msg" style={{ color: "#3f6212" }}>Fits the {AGREED_MIN}-min call.</p>
      )}
    </div>
  );
}

function SuggestionCard({ id }: { id: SuggId }) {
  const { s, dispatch, ql, questions, total } = useApp();
  const sg = suggById(id);
  const st = statusOf(s.ops, id);
  let summary = sg.summary;
  if (id === "fit") {
    const n = fitPlan(questions, s.fitChoices).recommended.length;
    summary = total > AGREED_MIN ? `Runs ~${total} min. Cut or shorten ${n} question${n === 1 ? "" : "s"}.` : `Runs ~${total} min. Already fits.`;
  }
  return (
    <button className={`scard ${st !== "pending" ? "scard--done" : ""}`} onClick={() => dispatch({ type: "review", id })}>
      <span className="scard__row">
        <p>{sg.title}</p>
        {st === "pending" && isUpdated(id, s.ops, ql) && <span className="tag tag--blue">↻ Updated</span>}
        <span className="tag tag--grey">{st === "pending" ? sg.tag(ql) : st === "accepted" ? "Accepted" : "Dismissed"}</span>
      </span>
      <span className="sub-text">{summary}</span>
    </button>
  );
}

function SuggestionList() {
  const { s } = useApp();
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(
    () => gsap.fromTo(".scard, .lencard", { autoAlpha: 0, y: 6 }, { autoAlpha: 1, y: 0, stagger: 0.035, duration: 0.5, delay: 0.05, ease: "power3.out", clearProps: "opacity,visibility,transform" }),
    { scope: ref }
  );
  const groups: Priority[] = ["high", "medium", "low"];
  const done = SUGGESTIONS.filter((x) => statusOf(s.ops, x.id) !== "pending");
  return (
    <div className="stack8" style={{ gap: 16 }} ref={ref}>
      <div className="stack4">
        <div className="slist-head">
          <p>Suggestions</p>
          <p className="small-muted">Updated just now</p>
        </div>
        <p className="sub-text">Checked against your brief and the {AGREED_MIN}-min call. Your guide stays as written until you accept.</p>
      </div>
      <LengthCard />
      {groups.map((p) => {
        const items = SUGGESTIONS.filter((x) => x.priority === p && statusOf(s.ops, x.id) === "pending");
        if (!items.length) return null;
        return (
          <div className="sgroup" key={p}>
            <div className="sgroup__head">
              <Icon name={DOT[p]} />
              <span>{PRIO_GROUP[p]}</span>
              <span>{items.length}</span>
            </div>
            {items.map((x) => (
              <SuggestionCard key={x.id} id={x.id} />
            ))}
          </div>
        );
      })}
      {!pendingIds(s.ops).length && <div className="alldone">You’ve been through every suggestion. Each change you made is its own step in History.</div>}
      {done.length > 0 && (
        <div className="sgroup">
          <div className="sgroup__head">
            <span>Reviewed</span>
            <span>{done.length}</span>
          </div>
          {done.map((x) => (
            <SuggestionCard key={x.id} id={x.id} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Checkpoint: "Start with high priority" ends here, it doesn't drift on ──
function Checkpoint() {
  const { s, dispatch, pending, total } = useApp();
  const highs = SUGGESTIONS.filter((x) => x.priority === "high");
  const accepted = highs.filter((x) => statusOf(s.ops, x.id) === "accepted").length;
  const dismissed = highs.filter((x) => statusOf(s.ops, x.id) === "dismissed").length;
  const left = { medium: 0, low: 0 };
  for (const id of pending) {
    const p = suggById(id as SuggId).priority;
    if (p !== "high") left[p]++;
  }
  const next = pending[0] as SuggId | undefined;
  const fits = total <= AGREED_MIN;
  return (
    <div className="checkpoint">
      <div className="checkpoint__icon">✓</div>
      <p className="rtitle">High priority done</p>
      <p className="body-text">
        {accepted} accepted{dismissed ? ` · ${dismissed} dismissed` : ""}. The guide now runs ~{total} min,{" "}
        <span style={{ color: fits ? "#3f6212" : "#b91c1c", fontWeight: 500 }}>
          {fits ? `within the ${AGREED_MIN} agreed` : `${total - AGREED_MIN} over the ${AGREED_MIN} agreed`}
        </span>
        .
      </p>
      <p className="sub-text">
        {pending.length} left: {[left.medium && `${left.medium} medium`, left.low && `${left.low} low`].filter(Boolean).join(", ")}. They’re about clarity, not
        lost data, so they can wait.
      </p>
      <div className="panel__footrow" style={{ marginTop: 4 }}>
        {next && (
          <button className="btn-primary" onClick={() => dispatch({ type: "review", id: next })}>
            Continue with {suggById(next).priority}
          </button>
        )}
        <button className="btn-secondary" onClick={() => dispatch({ type: "closePanel" })}>
          Back to guide
        </button>
      </div>
    </div>
  );
}

// ── Review (Screens 4–6) ─────────────────────────────────────────────────
function ReviewNav() {
  const { s, dispatch } = useApp();
  // Progress within the current priority ("2 of 3 high"): finishing High feels
  // like a task you can complete, not 1 step of 7.
  const prio = s.reviewId ? suggById(s.reviewId).priority : null;
  const group = prio ? SUGGESTIONS.filter((x) => x.priority === prio).map((x) => x.id) : [];
  const idx = s.reviewId ? group.indexOf(s.reviewId) : -1;
  return (
    <div className="rnav">
      <button className="rnav__back" onClick={() => dispatch({ type: "openList" })}>
        {"←  All suggestions"}
      </button>
      {idx >= 0 && prio && (
        <p className="rnav__pos">
          {idx + 1} of {group.length} {prio}
        </p>
      )}
      <button className="arrowbtn" aria-label="Previous suggestion (↑)" onClick={() => dispatch({ type: "nav", dir: -1 })}>↑</button>
      <button className="arrowbtn" aria-label="Next suggestion (↓)" onClick={() => dispatch({ type: "nav", dir: 1 })}>↓</button>
    </div>
  );
}

function ReviewMeta({ id, scope, delta }: { id: SuggId; scope: string; delta: string }) {
  const sg = suggById(id);
  return (
    <div className="stack6">
      <div className="rmeta">
        <Icon name={DOT[sg.priority]} />
        <span className={`prio prio--${sg.priority}`}>{PRIO_LABEL[sg.priority]}</span>
        <span className="sep">·</span>
        <span>{scope}</span>
        <span className="sep">·</span>
        <span>{delta}</span>
      </div>
      <p className="rtitle">{sg.reviewTitle ?? sg.title}</p>
    </div>
  );
}

// "What else changes" is open for High suggestions and one click away for
// Medium/Low. "Check it yourself" is always open: the evidence is what makes a
// suggestion checkable, whatever its priority.
const FoldDefault = createContext(true);

function Fold({ title, className = "", defaultOpen, children }: { title: string; className?: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const byPriority = useContext(FoldDefault);
  const [open, setOpen] = useState(defaultOpen ?? byPriority);
  const body = useRef<HTMLDivElement>(null);
  const first = useRef(true);
  useGSAP(
    () => {
      if (first.current) {
        first.current = false;
        return;
      }
      if (open && body.current)
        gsap.fromTo(body.current, { height: 0, autoAlpha: 0 }, { height: "auto", autoAlpha: 1, duration: 0.35, ease: "power2.out", clearProps: "height,opacity,visibility" });
    },
    { dependencies: [open] }
  );
  return (
    <div className={`fold ${open ? "fold--open" : ""} ${className}`}>
      <button className="fold__head" aria-expanded={open} onClick={() => setOpen(!open)}>
        <span>{title}</span>
        <span className="fold__chev" aria-hidden>›</span>
      </button>
      {open && (
        <div className="fold__body" ref={body}>
          {children}
        </div>
      )}
    </div>
  );
}

function Why({ children, check }: { children: React.ReactNode; check?: { title: string; items: string[] } }) {
  return (
    <div className="stack8">
      <p className="h-sec">Why this is suggested</p>
      <p className="body-text">{children}</p>
      {check && (
        // The evidence is the point of every suggestion, so it's always open by default
        <Fold title={check.title} className="checkbox" defaultOpen>
          {check.items.map((t, i) => (
            <div className="checkbox__item" key={i}>
              <span className="checkbox__num">{i + 1}</span>
              <p>{t}</p>
            </div>
          ))}
        </Fold>
      )}
    </div>
  );
}

function Else({ items }: { items: string[] }) {
  return (
    <Fold title="What else changes" className="fold--plain">
      <div className="bullets">
        {items.map((t) => (
          <p className="bullet" key={t}>{t}</p>
        ))}
      </div>
    </Fold>
  );
}

function Status({ id }: { id: SuggId }) {
  const { s } = useApp();
  const st = statusOf(s.ops, id);
  if (st === "pending") return null;
  return (
    <div className={st === "accepted" ? "alldone" : "updated"} style={st === "dismissed" ? { background: "#fafafa", borderColor: "#e5e5e5", color: "#525252" } : undefined}>
      {st === "accepted" ? "Accepted. Undo it from the chip in the guide, ⌘Z, or History." : "Dismissed. Undo with ⌘Z or from History."}
    </div>
  );
}

function Relations({ id }: { id: SuggId }) {
  const { s, ql, dispatch } = useApp();
  if (statusOf(s.ops, id) !== "pending") return null;
  const rels = relationsFor(id, s.ops, ql);
  if (!rels.length) return null;
  return (
    <div className="stack8">
      {rels.map((r, i) =>
        r.tone === "updated" ? (
          <div className="updated" key={i}>
            ↻ {r.text}
          </div>
        ) : (
          <div className="relnote" key={i}>
            <p className="relnote__title">Linked suggestion</p>
            <p>{r.text}</p>
            {r.link && statusOf(s.ops, r.link) === "pending" && (
              <button className="link" onClick={() => dispatch({ type: "review", id: r.link! })}>
                Review “{suggById(r.link).title}” →
              </button>
            )}
          </div>
        )
      )}
    </div>
  );
}

function Review({ id }: { id: SuggId }) {
  return (
    <FoldDefault.Provider value={suggById(id).priority === "high"}>
      <ReviewNav />
      <Status id={id} />
      {id === "split" && <ReviewSplit />}
      {id === "fit" && <ReviewFit />}
      {id === "note" && <ReviewNote />}
      {id === "reword" && <ReviewReword />}
      {id === "add" && <ReviewAdd />}
      {id === "format" && <ReviewFormat />}
      {id === "reorder" && <ReviewReorder />}
      {/* after the reason and the change: context, not the headline */}
      <Relations id={id} />
    </FoldDefault.Provider>
  );
}

function ReviewSplit() {
  const { s, dispatch, ql, total } = useApp();
  const n = ql("q5").slice(1);
  return (
    <>
      <ReviewMeta id="split" scope={`Applies to ${ql("q5")}`} delta="+1 min" />
      <Why
        check={{
          title: `Check it yourself: 3 asks found in ${ql("q5")}`,
          items: ["Did you try other delivery apps while you were a member?", "Which ones,", "and why?"],
        }}
      >
        {ql("q5")} asks three things at once. With an AI interviewer, participants usually answer only the last part, so you lose which apps they tried.
      </Why>
      <div className="stack8">
        <p className="h-sec">Suggested questions · editable</p>
        {s.splitDraft.map((t, k) => (
          <label className="editbox" key={k}>
            <span className="editbox__row">
              <span className="editbox__lab">{`${n}${"abc"[k]}.`}</span>
              <textarea rows={1} value={t} onChange={(e) => dispatch({ type: "splitDraft", index: k, text: e.target.value })} />
            </span>
            {k > 0 && <span className="editbox__note">Note: Skip if they tried none.</span>}
          </label>
        ))}
      </div>
      <Else items={[`${ql("q5")} becomes ${n}a, ${n}b and ${n}c. Nothing else moves.`, `Adds ~1 min (${total} → ${total + 1}). Counted in “Fit the guide to 25 min”.`]} />
    </>
  );
}

function ReviewFit() {
  const { s, dispatch, questions, total, ql } = useApp();
  const [showAddsUp, setShowAddsUp] = useState(false);
  const fp = fitPlan(questions, s.fitChoices);
  const { options, saved, result } = fp;
  const isOn = (k: FitKey) => fp.checked.some((c) => c.key === k);
  // cuts the plan added beyond the usual three, because accepted changes made the guide longer
  const addedCuts = fp.recommended.filter((c) => !c.always);
  const grewBy = total - BASE_TOTAL;
  const others = SUGGESTIONS.filter((x) => x.id !== "fit");
  const pendingOthers = others.filter((x) => statusOf(s.ops, x.id) === "pending");
  const withAll = result + pendingOthers.reduce((a, x) => a + x.delta, 0);
  const labels: Record<string, string> = {
    split: `Split ${ql("q5")}`,
    add: "Add the discount question",
    note: `Move ${ql("q10")} into moderator notes`,
    reword: `Reword ${ql("q4")}`,
    format: `${ql("q8")} as single choice`,
    reorder: `${ql("q9")} before ${ql("q6")}`,
  };
  return (
    <>
      <ReviewMeta id="fit" scope="Whole guide" delta={`−${saved} min`} />
      <div className="stack8">
        <p className="h-sec">Why this is suggested</p>
        <p className="body-text">
          Participants agreed to {AGREED_MIN} minutes. At ~{total}, the AI would rush or skip the last questions, which are about rejoining.
        </p>
        <p className="small-muted">Per-question estimates are shown in the guide.</p>
      </div>
      {addedCuts.length > 0 && grewBy > 0 && (
        <div className="updated">
          ↻ Updated for your accepted changes. They added ~{grewBy} min, so the plan now also {addedCuts.map((c) => c.title(ql).replace(/^Shorten/, "shortens")).join(" and ")} to still reach {AGREED_MIN} min.
        </div>
      )}
      <div className="stack8">
        <p className="h-sec">Proposed changes · choose any</p>
        {options.map((c) => {
          const on = isOn(c.key);
          return (
            <button
              key={c.key}
              className={`fitopt ${on ? "" : "fitopt--off"}`}
              role="checkbox"
              aria-checked={on}
              onClick={() => dispatch({ type: "toggleFit", key: c.key })}
            >
              <span className={`cbox ${on ? "cbox--on" : ""}`}>
                <Icon name="checkbox-check" />
              </span>
              <span className="fitopt__body">
                <span className="fitopt__title">{c.title(ql)}</span>
                <span className="sub-text">{c.desc}</span>
              </span>
              <span className="fitopt__delta">{fmtDelta(c.delta)}</span>
            </button>
          );
        })}
        <div className={`result ${result > AGREED_MIN ? "result--over" : ""}`}>
          <p>Result</p>
          <p>
            {total} → <TweenNumber value={result} duration={0.35} /> min
          </p>
        </div>
      </div>
      {pendingOthers.length > 0 && (
        <div className="stack8">
          {/* one line by default; the breakdown is there for whoever asks */}
          <p className="sub-text">
            Your other suggestions would bring it to{" "}
            <b style={{ fontWeight: 500, color: withAll > AGREED_MIN ? "#b91c1c" : "#3f6212" }}>~{withAll} min</b>
            {" · "}
            <button className="link" onClick={() => setShowAddsUp(!showAddsUp)} aria-expanded={showAddsUp}>
              {showAddsUp ? "Hide" : "Details"}
            </button>
          </p>
          {showAddsUp && (
            <div className="stack8 addsup">
              {others.map((x) => {
                const st = statusOf(s.ops, x.id);
                if (st === "dismissed") return null;
                return (
                  <div className="addrow" key={x.id}>
                    <p>
                      {labels[x.id]}
                      {st === "accepted" ? " · accepted" : ""}
                    </p>
                    <p>{fmtDelta(x.delta)}</p>
                  </div>
                );
              })}
              {withAll > AGREED_MIN && fp.next && (
                <button className="link" style={{ alignSelf: "flex-start", fontSize: 13 }} onClick={() => dispatch({ type: "showMoreCut" })}>
                  Show one more question to cut
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
}

function ReviewNote() {
  const { s, ql, total, questions } = useApp();
  const q10 = questions.find((q) => q.id === "q10");
  const q9 = questions.find((q) => q.id === "q9");
  return (
    <>
      <div className="stack6">
        <div className="rmeta">
          <Icon name="dot-medium" />
          <span className="prio prio--medium">Medium</span>
          <span className="sep">·</span>
          <span>
            Applies to {ql("q9")} + {ql("q10")}
          </span>
          <span className="sep">·</span>
          <span>−1 min</span>
        </div>
        <p className="rtitle">Convert to moderator note</p>
        {s.noteUpdated && q9?.editedByUser && (
          <div className="updated">
            ↻ Updated after your edit to {ql("q9")}. The note still fits, and the change now keeps your new wording. Nothing was applied.
          </div>
        )}
      </div>
      <Why
        check={{
          title: `Check it yourself: ${ql("q10")} reads as an instruction`,
          items: ["Starts with “Do not”, telling the interviewer what to do", "Has no question mark", `Probes the answer to ${ql("q9")}: what changed their mind`],
        }}
      >
        {ql("q10")} is an instruction to the interviewer, not a question. The AI would read it out loud to the participant. It is about {ql("q9")}, so it belongs in {ql("q9")}’s notes.
      </Why>
      <div className="stack8">
        <p className="h-sec">The change · 2 questions · editable</p>
        <div className="editbox">
          <p>
            <b style={{ fontWeight: 500 }}>{ql("q9")}</b>
            {"  "}
            {q9?.editedByUser ? "Keeps your wording. Adds a moderator note." : "Stays as written. Adds a moderator note."}
          </p>
        </div>
        <div className="editbox">
          <p>
            <b style={{ fontWeight: 500 }}>{ql("q9")} note</b>
            {"  "}
            {q10?.text}
          </p>
          <p className="editbox__note">Seen by the AI interviewer only, never read out.</p>
        </div>
        <div className="editbox">
          <p>
            <b style={{ fontWeight: 500 }}>{ql("q10")}</b>
            {"  "}Removed from the question list.
          </p>
          <p className="editbox__note">
            The guide goes from {questions.length} to {questions.length - 1} questions.
          </p>
        </div>
      </div>
      <Else items={[`Questions after ${ql("q10")} move up one. Nothing else moves.`, `Saves ~1 min (${total} → ${total - 1}). Counted in “Fit the guide to 25 min”.`]} />
    </>
  );
}

function ReviewReword() {
  const { s, dispatch, ql, questions } = useApp();
  const prev = questions.find((q) => q.id === "q3");
  return (
    <>
      <ReviewMeta id="reword" scope={`Applies to ${ql("q4")}`} delta="0 min" />
      <Why
        check={{
          title: `Check it yourself: ${ql("q4")} leans on the question before it`,
          items: [`Starts with “How does that compare”`, `“That” points back at ${prev ? ql("q3") : "an earlier question"}`, "Breaks if that question is skipped, moved or answered loosely"],
        }}
      >
        {ql("q4")} says “that”, so it only works straight after {ql("q3")}. The AI can skip or reorder questions as the conversation goes, and then “that” has nothing to point to.
      </Why>
      <div className="stack8">
        <p className="h-sec">Suggested wording · editable</p>
        <label className="editbox">
          <span className="editbox__row">
            <span className="editbox__lab">{ql("q4").slice(1)}.</span>
            <textarea rows={1} value={s.rewordDraft} onChange={(e) => dispatch({ type: "rewordDraft", text: e.target.value })} />
          </span>
        </label>
      </div>
      <Else items={["Wording only. Timing stays ~2 min.", "Nothing else moves."]} />
    </>
  );
}

function ReviewAdd() {
  const { s, dispatch, ql, total, questions } = useApp();
  const anchor = addAnchor(questions);
  return (
    <>
      <ReviewMeta id="add" scope={`After ${ql(anchor)}`} delta="+2 min" />
      <Why
        check={{
          title: "Check it yourself: your brief vs. the guide",
          items: ["Brief: “…and whether a discount or free month would have kept them.”", "No question mentions a discount, an offer or a free month"],
        }}
      >
        Your brief asks whether a discount or a free month would have kept members. No question covers it, so the report would have nothing to say about it.
      </Why>
      <div className="stack8">
        <p className="h-sec">Suggested question · editable</p>
        <label className="editbox">
          <span className="editbox__row">
            <span className="editbox__lab">New.</span>
            <textarea rows={2} value={s.addDraft} onChange={(e) => dispatch({ type: "addDraft", text: e.target.value })} />
          </span>
          <span className="editbox__note">
            {anchor === "q9"
              ? `Goes after ${ql("q9")}, where cancelling is already on their mind.`
              : `Goes after ${ql("q6")}, right after they describe deciding to cancel.`}
          </span>
        </label>
      </div>
      <Else items={["Questions after it move down one.", `Adds ~2 min (${total} → ${total + 2}). Counted in “Fit the guide to 25 min”.`]} />
    </>
  );
}

function ReviewFormat() {
  const { ql } = useApp();
  return (
    <>
      <ReviewMeta id="format" scope={`Applies to ${ql("q8")}`} delta="0 min" />
      <Why check={{ title: `Check it yourself: ${ql("q8")}’s own note`, items: ["“Always get a clear answer so findings can be compared.”", "The question already lists three answers: cheap, fair, expensive"] }}>
        {ql("q8")}’s note asks for a clear answer. A single choice gives exactly one per person, so findings compare cleanly across interviews.
      </Why>
      <div className="stack8">
        <p className="h-sec">The change</p>
        <div className="editbox">
          <p>Answer format: single choice</p>
          <div className="choices" style={{ marginTop: 6 }}>
            {["Cheap", "Fair", "Expensive"].map((c) => (
              <span className="choice" key={c}>{c}</span>
            ))}
          </div>
          <p className="editbox__note" style={{ marginTop: 6 }}>The AI still asks a short “why” after the choice.</p>
        </div>
      </div>
      <Else items={["Timing stays ~2 min.", "Nothing else moves."]} />
    </>
  );
}

function ReviewReorder() {
  const { ql } = useApp();
  return (
    <>
      <ReviewMeta id="reorder" scope={`Applies to ${ql("q9")}`} delta="0 min" />
      <Why check={{ title: "Check it yourself: the order of the story", items: [`${ql("q6")} asks when they decided to cancel`, `${ql("q9")} asks about doubts before that decision`] }}>
        {ql("q9")} is about earlier doubts. Asked after the decision, people tell the end of the story first and shorten the part about their doubts.
      </Why>
      <div className="stack8">
        <p className="h-sec">The change</p>
        <div className="editbox">
          <p>
            {ql("q9")} moves before {ql("q6")}.
          </p>
        </div>
      </div>
      <Else items={[`${ql("q6")} to ${ql("q8")} move down one.`, "Timing unchanged."]} />
    </>
  );
}

function ReviewFoot({ id }: { id: SuggId }) {
  const { s, dispatch, questions, ql } = useApp();
  const st = statusOf(s.ops, id);
  if (st !== "pending") return null;
  let accept = "Accept";
  let note = "Accepting is a normal edit. Undo it with ⌘Z or from History.";
  if (id === "split") accept = "Accept split";
  if (id === "note") {
    accept = "Accept both changes";
    note = `One step. Undo restores ${ql("q10")} and removes the note.`;
  }
  if (id === "fit") {
    const n = fitPlan(questions, s.fitChoices).checked.length;
    accept = `Apply ${n} change${n === 1 ? "" : "s"}`;
    note = "Each change is its own step in History, so you can undo one without the others.";
    return (
      <div className="panel__foot">
        <div className="panel__footrow">
          <button className="btn-primary" disabled={!n} onClick={() => dispatch({ type: "accept", id })}>{accept}</button>
          <button className="btn-secondary" onClick={() => dispatch({ type: "dismiss", id })}>Dismiss</button>
          <span className="spacer" />
          <span className="kbd-hint">A · D</span>
        </div>
        <p className="foot-note">{note}</p>
      </div>
    );
  }
  return (
    <div className="panel__foot">
      <div className="panel__footrow">
        <button className="btn-primary" onClick={() => dispatch({ type: "accept", id })}>{accept}</button>
        <button className="btn-secondary" onClick={() => dispatch({ type: "dismiss", id })}>Dismiss</button>
        <span className="spacer" />
        <span className="kbd-hint">A · D</span>
      </div>
      <p className="foot-note">{note}</p>
    </div>
  );
}

// ── Details tab (Screen 2) ───────────────────────────────────────────────
function DetailsTab() {
  const { s, dispatch, questions, ql } = useApp();
  const q = questions.find((x) => x.id === s.selectedId);
  const [settings, setSettings] = useState<Record<string, boolean>>({ Required: true, "Allow rephrasing by AI": true, "Ask per selection": false, "Attach image and video": false });
  if (!q) return <p className="empty">Select a question in the guide to see its details.</p>;
  const related = SUGGESTIONS.filter((x) => x.targets.includes(q.id) && statusOf(s.ops, x.id) === "pending");
  return (
    <>
      {related.length > 0 && (
        <button className="qsugg" onClick={() => dispatch({ type: "review", id: related[0].id })}>
          <span className="qsugg__head">
            <span>✦</span>
            <span>
              {related.length} suggestion{related.length > 1 ? "s" : ""} for this question
            </span>
          </span>
          {related.map((x) => (
            <span
              className="scard"
              key={x.id}
              onClick={(e) => {
                e.stopPropagation();
                dispatch({ type: "review", id: x.id });
              }}
            >
              <span className="scard__row">
                <p>{x.title}</p>
                <span className="tag tag--grey">{x.tag(ql)}</span>
              </span>
              <span className="sub-text">{x.summary}</span>
            </span>
          ))}
          <span className="qsugg__cta">
            <span>Review suggestion →</span>
            <span>or press S</span>
          </span>
        </button>
      )}
      <div className="field">
        <p className="h-sec">Question</p>
        <label className="field__box">
          <textarea rows={2} value={q.text} onChange={(e) => dispatch({ type: "editQ", id: q.id, text: e.target.value })} aria-label="Question text" />
        </label>
      </div>
      <div className="field">
        <p className="h-sec">AI moderator notes</p>
        <label className="field__box">
          <textarea rows={1} value={q.modNote ?? ""} placeholder="Add a note for the AI interviewer" onChange={(e) => dispatch({ type: "editNote", id: q.id, text: e.target.value })} aria-label="AI moderator notes" />
        </label>
      </div>
      <div className="settings">
        <p className="settings__title">Settings</p>
        <div className="stack8">
          {Object.entries(settings).map(([k, v]) => (
            <button key={k} className="setrow" role="switch" aria-checked={v} onClick={() => setSettings({ ...settings, [k]: !v })}>
              {k}
              <span className={`switch ${v ? "switch--on" : ""}`} />
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

// ── Preview tab ──────────────────────────────────────────────────────────
function PreviewTab() {
  const { questions, nums, total } = useApp();
  return (
    <>
      <div className="stack4">
        <p className="h-sec">What the participant hears</p>
        <p className="sub-text">
          {questions.length} questions · ~{total} min. Moderator notes stay hidden from participants.
        </p>
      </div>
      <div className="prev-list">
        {questions.map((q) => (
          <div className="prev-q" key={q.id}>
            <span>{nums[q.id]}.</span>
            <p>
              {q.text}
              {q.choices && <span className="small-muted"> ({q.choices.join(" · ")})</span>}
            </p>
          </div>
        ))}
      </div>
    </>
  );
}

// ── History tab (Decision 5.5) ───────────────────────────────────────────
function HistoryTab() {
  const { s, dispatch } = useApp();
  const items = [...s.ops].reverse();
  if (!items.length)
    return <p className="empty">No changes yet. Accepted suggestions and your own edits show up here, one step each.</p>;
  return (
    <>
      <div className="stack4">
        <p className="h-sec">History</p>
        <p className="sub-text">Undo any step on its own. The others stay.</p>
      </div>
      <div className="hist">
        {items.map((op) => (
          <div className="hist__item" key={op.id}>
            <span className={`hist__dot ${op.kind === "dismiss" ? "hist__dot--grey" : ""}`} />
            <div className="hist__body">
              <p className="hist__label">{op.label}</p>
              <p className="small-muted">
                {op.suggestionId ? (op.kind === "dismiss" ? "Suggestion" : `From “${suggById(op.suggestionId).title}”`) : "Your edit"} · {ago(op.at)}
              </p>
            </div>
            <button className="btn-secondary" style={{ padding: "3px 10px", fontSize: 13 }} onClick={() => dispatch({ type: "undoOp", opId: op.id })}>
              Undo
            </button>
          </div>
        ))}
      </div>
    </>
  );
}

const ago = (t: number) => {
  const m = Math.round((Date.now() - t) / 60000);
  return m < 1 ? "just now" : `${m} min ago`;
};
