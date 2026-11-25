import {
  DEFAULT_SPLIT,
  FitKey,
  FitOverrides,
  fitPlan,
  NEW_QUESTION_TEXT,
  Op,
  REWORD_Q4_TEXT,
  SUGGESTIONS,
  SuggId,
  BASE_QUESTIONS,
  applyOps,
  newOpId,
  suggById,
} from "./guide";

export type Tab = "details" | "preview" | "history" | "suggestions";

export type Toast = { id: number; msg: string; undo: boolean };

export type State = {
  ops: Op[];
  redo: Op[];
  panelOpen: boolean;
  tab: Tab;
  reviewId: SuggId | null;
  selectedId: string | null;
  /** Only what the user ticked/unticked. Everything else follows the live plan. */
  fitChoices: FitOverrides;
  /** Shown once every High suggestion is decided, before moving on to Medium. */
  checkpoint: boolean;
  splitDraft: string[];
  rewordDraft: string;
  addDraft: string;
  noteUpdated: boolean;
  toast: Toast | null;
  /** Ops from the latest accept, so the guide can celebrate the rows they changed. */
  celebrate: { opIds: string[]; tick: number } | null;
};

export const initialState: State = {
  ops: [],
  redo: [],
  panelOpen: false,
  tab: "suggestions",
  reviewId: null,
  selectedId: null,
  fitChoices: {},
  checkpoint: false,
  splitDraft: [...DEFAULT_SPLIT],
  rewordDraft: REWORD_Q4_TEXT,
  addDraft: NEW_QUESTION_TEXT,
  noteUpdated: false,
  toast: null,
  celebrate: null,
};

export type Preset = 1 | 2 | 3 | 4 | 5 | 6;

export type Action =
  | { type: "select"; id: string | null }
  | { type: "closePanel" }
  | { type: "setTab"; tab: Tab }
  | { type: "openList" }
  | { type: "review"; id: SuggId }
  | { type: "nav"; dir: 1 | -1 }
  | { type: "accept"; id: SuggId }
  | { type: "dismiss"; id: SuggId }
  | { type: "undo" }
  | { type: "redo" }
  | { type: "undoOp"; opId: string }
  | { type: "editQ"; id: string; text: string }
  | { type: "editNote"; id: string; text: string }
  | { type: "toggleFit"; key: FitKey }
  | { type: "showMoreCut" }
  | { type: "splitDraft"; index: number; text: string }
  | { type: "rewordDraft"; text: string }
  | { type: "addDraft"; text: string }
  | { type: "toastClear"; id: number }
  | { type: "preset"; n: Preset };

// ── derived helpers ──────────────────────────────────────────────────────
export type Status = "pending" | "accepted" | "dismissed";

export function statusOf(ops: Op[], id: SuggId): Status {
  let s: Status = "pending";
  for (const op of ops) {
    if (op.suggestionId !== id) continue;
    s = op.kind === "dismiss" ? "dismissed" : "accepted";
  }
  return s;
}

export const pendingIds = (ops: Op[]) =>
  SUGGESTIONS.filter((s) => statusOf(ops, s.id) === "pending").map((s) => s.id);

let toastSeq = 1;
const toast = (msg: string, undo = true): Toast => ({ id: toastSeq++, msg, undo });

/** Next suggestion to review: same priority first (wrapping), then the overall order. */
function nextPending(ops: Op[], from: SuggId | null): SuggId | null {
  const order = SUGGESTIONS.map((s) => s.id);
  const pend = pendingIds(ops);
  if (!pend.length) return null;
  const start = from ? order.indexOf(from) : -1;
  const prio = from ? suggById(from).priority : null;
  const walk = (match: (id: SuggId) => boolean) => {
    for (let k = 1; k <= order.length; k++) {
      const id = order[(start + k + order.length) % order.length];
      if (pend.includes(id) && match(id)) return id;
    }
    return null;
  };
  return (prio && walk((id) => suggById(id).priority === prio)) || walk(() => true);
}

/** After deciding a suggestion: where to go next, and whether High is now finished. */
function afterDecision(ops: Op[], decided: SuggId): Pick<State, "reviewId" | "checkpoint"> {
  const next = nextPending(ops, decided);
  const highLeft = pendingIds(ops).some((id) => suggById(id).priority === "high");
  if (suggById(decided).priority === "high" && !highLeft && next) return { reviewId: null, checkpoint: true };
  return { reviewId: next, checkpoint: false };
}

function opsForAccept(s: State, id: SuggId): Op[] {
  const at = Date.now();
  const sugg = suggById(id);
  switch (id) {
    case "fit":
      return fitPlan(applyOps(BASE_QUESTIONS, s.ops), s.fitChoices).checked.map((c) => ({
        id: newOpId(),
        kind: c.key,
        suggestionId: "fit",
        label: c.title((qid) => `Q${qid.slice(1)}`),
        at,
      }));
    case "split":
      return [{ id: newOpId(), kind: "split", suggestionId: id, label: "Split Q5 into 3 questions", texts: s.splitDraft, at }];
    case "note": {
      const q10 = applyOps(BASE_QUESTIONS, s.ops).find((q) => q.id === "q10");
      return [{ id: newOpId(), kind: "note", suggestionId: id, label: "Moved Q10 into Q9’s moderator note", text: q10?.text, at }];
    }
    case "reword":
      return [{ id: newOpId(), kind: "reword", suggestionId: id, label: "Reworded Q4", text: s.rewordDraft, at }];
    case "add":
      return [{ id: newOpId(), kind: "add", suggestionId: id, label: "Added the discount question", text: s.addDraft, at }];
    case "format":
      return [{ id: newOpId(), kind: "format", suggestionId: id, label: "Made Q8 single choice", at }];
    case "reorder":
      return [{ id: newOpId(), kind: "reorder", suggestionId: id, label: "Moved Q9 before Q6", at }];
    default:
      return [{ id: newOpId(), kind: "dismiss", suggestionId: id, label: sugg.title, at }];
  }
}

const acceptToast: Record<SuggId, (n: number) => string> = {
  fit: (n) => `${n} change${n === 1 ? "" : "s"} applied`,
  split: () => "Q5 split into 3",
  add: () => "Question added",
  reword: () => "Q4 reworded",
  note: () => "Q10 moved into a note",
  format: () => "Q8 is now single choice",
  reorder: () => "Q9 moved before Q6",
};

// ── reducer ──────────────────────────────────────────────────────────────
export function reducer(s: State, a: Action): State {
  switch (a.type) {
    case "select": {
      if (a.id === null) return { ...s, selectedId: null };
      // Panel closed or on Details: open this question's details.
      if (!s.panelOpen || s.tab === "details")
        return { ...s, selectedId: a.id, panelOpen: true, tab: "details", reviewId: null, checkpoint: false };
      // On Suggestions: stay there. Jump to this question's open suggestion if it
      // has one; otherwise keep the current list/review and just mark the row.
      if (s.tab === "suggestions") {
        const qid = a.id;
        const sugg = SUGGESTIONS.find((x) => x.targets.includes(qid) && statusOf(s.ops, x.id) === "pending");
        return sugg ? { ...s, selectedId: qid, reviewId: sugg.id, checkpoint: false } : { ...s, selectedId: qid };
      }
      // Preview / History: stay on the tab, just mark the row.
      return { ...s, selectedId: a.id };
    }
    case "closePanel":
      return { ...s, panelOpen: false, reviewId: null, selectedId: null, checkpoint: false };
    case "setTab":
      return { ...s, tab: a.tab, panelOpen: true, reviewId: a.tab === "suggestions" ? s.reviewId : null, checkpoint: false };
    case "openList":
      return { ...s, panelOpen: true, tab: "suggestions", reviewId: null, checkpoint: false };
    case "review":
      return { ...s, panelOpen: true, tab: "suggestions", reviewId: a.id, selectedId: null, checkpoint: false };
    case "nav": {
      const pend = pendingIds(s.ops);
      if (!pend.length) return s;
      const i = s.reviewId ? pend.indexOf(s.reviewId) : -1;
      const j = (i + a.dir + pend.length) % pend.length;
      return { ...s, reviewId: pend[j], tab: "suggestions", panelOpen: true, checkpoint: false };
    }
    case "accept": {
      if (statusOf(s.ops, a.id) !== "pending") return s;
      const newOps = opsForAccept(s, a.id);
      if (!newOps.length) return s;
      const ops = [...s.ops, ...newOps];
      return {
        ...s,
        ops,
        redo: [],
        ...afterDecision(ops, a.id),
        toast: toast(acceptToast[a.id](newOps.length)),
        celebrate: { opIds: newOps.map((o) => o.id), tick: Date.now() },
      };
    }
    case "dismiss": {
      if (statusOf(s.ops, a.id) !== "pending") return s;
      const ops = [
        ...s.ops,
        { id: newOpId(), kind: "dismiss" as const, suggestionId: a.id, label: `Dismissed: ${suggById(a.id).title}`, at: Date.now() },
      ];
      return { ...s, ops, redo: [], ...afterDecision(ops, a.id), toast: toast("Suggestion dismissed") };
    }
    case "undo": {
      if (!s.ops.length) return s;
      const last = s.ops[s.ops.length - 1];
      // a multi-op accept (fit) undoes as separate steps by design (5.5)
      return { ...s, ops: s.ops.slice(0, -1), redo: [...s.redo, last], toast: toast(`Undone: ${last.label}`, false) };
    }
    case "redo": {
      if (!s.redo.length) return s;
      const op = s.redo[s.redo.length - 1];
      return { ...s, ops: [...s.ops, op], redo: s.redo.slice(0, -1), toast: toast(`Redone: ${op.label}`, false) };
    }
    case "undoOp": {
      const op = s.ops.find((o) => o.id === a.opId);
      if (!op) return s;
      return { ...s, ops: s.ops.filter((o) => o.id !== a.opId), redo: [], toast: toast(`Undone: ${op.label}`, false) };
    }
    case "editQ": {
      const last = s.ops[s.ops.length - 1];
      const label = `Edited ${a.id.toUpperCase()}`;
      const ops =
        last && last.kind === "edit" && last.qid === a.id
          ? [...s.ops.slice(0, -1), { ...last, text: a.text, at: Date.now() }]
          : [...s.ops, { id: newOpId(), kind: "edit" as const, qid: a.id, text: a.text, label, at: Date.now() }];
      const noteUpdated = s.noteUpdated || (a.id === "q9" && statusOf(s.ops, "note") === "pending");
      return { ...s, ops, redo: [], noteUpdated };
    }
    case "editNote": {
      const last = s.ops[s.ops.length - 1];
      const ops =
        last && last.kind === "modnote" && last.qid === a.id
          ? [...s.ops.slice(0, -1), { ...last, text: a.text, at: Date.now() }]
          : [...s.ops, { id: newOpId(), kind: "modnote" as const, qid: a.id, text: a.text, label: `Edited the note on ${a.id.toUpperCase()}`, at: Date.now() }];
      return { ...s, ops, redo: [] };
    }
    case "toggleFit": {
      const plan = fitPlan(applyOps(BASE_QUESTIONS, s.ops), s.fitChoices);
      const on = plan.checked.some((c) => c.key === a.key);
      return { ...s, fitChoices: { ...s.fitChoices, [a.key]: !on } };
    }
    case "showMoreCut": {
      const next = fitPlan(applyOps(BASE_QUESTIONS, s.ops), s.fitChoices).next;
      return next ? { ...s, fitChoices: { ...s.fitChoices, [next.key]: true } } : s;
    }
    case "splitDraft": {
      const d = [...s.splitDraft];
      d[a.index] = a.text;
      return { ...s, splitDraft: d };
    }
    case "rewordDraft":
      return { ...s, rewordDraft: a.text };
    case "addDraft":
      return { ...s, addDraft: a.text };
    case "toastClear":
      return s.toast?.id === a.id ? { ...s, toast: null } : s;
    case "preset":
      return preset(a.n);
  }
}

// Walkthrough presets: put the app into each of the six designed screens.
function preset(n: Preset): State {
  const base: State = { ...initialState, splitDraft: [...DEFAULT_SPLIT] };
  const at = Date.now();
  switch (n) {
    case 1:
      return base;
    case 2:
      return { ...base, panelOpen: true, tab: "details", selectedId: "q5" };
    case 3:
      return { ...base, panelOpen: true, tab: "suggestions" };
    case 4:
      return { ...base, panelOpen: true, tab: "suggestions", reviewId: "split" };
    case 5: {
      const ops: Op[] = [
        { id: newOpId(), kind: "reword", suggestionId: "reword", label: "Reworded Q4", text: REWORD_Q4_TEXT, at },
        { id: newOpId(), kind: "split", suggestionId: "split", label: "Split Q5 into 3 questions", texts: [...DEFAULT_SPLIT], at },
      ];
      return { ...base, ops, panelOpen: true, tab: "suggestions", reviewId: "fit" };
    }
    case 6: {
      const ops: Op[] = [
        { id: newOpId(), kind: "edit", qid: "q9", label: "Edited Q9", text: "Did you ever think about cancelling, but stayed? What changed your mind?", at },
      ];
      return { ...base, ops, noteUpdated: true, panelOpen: true, tab: "suggestions", reviewId: "note" };
    }
  }
}
