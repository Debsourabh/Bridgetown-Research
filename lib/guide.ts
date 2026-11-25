// Domain model for the revision flow: base guide, suggestions, and the ops
// that accepting a suggestion (or editing) produces. The guide shown on screen
// is always `applyOps(BASE_QUESTIONS, ops)`, so any single op can be undone
// without touching the others.

export type Priority = "high" | "medium" | "low";

export type Origin = { label: string; opId: string };

export type Question = {
  id: string;
  text: string;
  hint?: string;
  minutes: number;
  splitGroup?: string;
  modNote?: string;
  choices?: string[];
  editedByUser?: boolean;
  origins: Origin[];
};

export const AGREED_MIN = 25;

export const BASE_QUESTIONS: Question[] = [
  { id: "q1", text: "What first made you sign up for the membership?", minutes: 3, origins: [] },
  { id: "q2", text: "How many orders did you place in a typical month while you were a member?", minutes: 4, origins: [] },
  {
    id: "q3",
    text: "In your last full month as a member, roughly how many orders did you place, and what share were groceries?",
    hint: "Ask for a rough number. Don't ask them to check their order history.",
    minutes: 3,
    origins: [],
  },
  { id: "q4", text: "How does that compare with your first month after joining?", minutes: 2, origins: [] },
  { id: "q5", text: "Did you try other delivery apps while you were a member? Which ones, and why?", minutes: 3, origins: [] },
  {
    id: "q6",
    text: "When did you decide to cancel: after one bad order, or after a gradual build-up?",
    hint: "Get a date. Ask when their last order was.",
    minutes: 4,
    origins: [],
  },
  { id: "q7", text: "How did the membership feel on weekdays compared with busy weekend evenings?", minutes: 5, origins: [] },
  {
    id: "q8",
    text: "Would you say the membership fee felt cheap, fair, or expensive for how much you used it?",
    hint: "Always get a clear answer so findings can be compared.",
    minutes: 2,
    origins: [],
  },
  { id: "q9", text: "Did you ever consider cancelling and then stay? What changed your mind?", minutes: 3, origins: [] },
  {
    id: "q10",
    text: "Do not stop at “I just got busy.” Probe for the order, the price, or the fee that changed their mind.",
    minutes: 1,
    origins: [],
  },
  { id: "q11", text: "What would need to change for you to rejoin?", minutes: 3, origins: [] },
  { id: "q12", text: "Is there anything else about the membership you'd like to tell us?", minutes: 5, origins: [] },
];

export const BASE_TOTAL = BASE_QUESTIONS.reduce((s, q) => s + q.minutes, 0); // 38

export const NEW_QUESTION_TEXT =
  "If you’d been offered a discount or a free month when you went to cancel, would you have stayed?";
export const REWORD_Q4_TEXT =
  "Compared with your first month as a member, did you order more, fewer, or about the same in your last month?";
export const SHORT_Q12_TEXT = "Before we finish, is there one last thing you’d like to add?";
export const SHORT_Q11_TEXT = "What one change would bring you back?";
export const SHORT_Q1_TEXT = "To start, what made you sign up?";
export const DEFAULT_SPLIT: [string, string, string] = [
  "Did you try other delivery apps while you were a member?",
  "Which ones did you try?",
  "Why did you try them?",
];

export type SuggId = "fit" | "split" | "add" | "reword" | "note" | "format" | "reorder";

export type Suggestion = {
  id: SuggId;
  priority: Priority;
  title: string; // card title
  reviewTitle?: string;
  summary: string; // one line on the card
  tag: (ql: QL) => string; // "Q5", "Whole guide", "After Q9"
  chip?: string; // chip under the question in the guide
  targets: string[]; // question ids it touches
  delta: number; // minutes
};

export type QL = (id: string) => string;

// Review order. Within High, content comes before length: split and the missing
// question change how long the guide runs, so "Fit to 25" goes last and is
// calculated on the guide the user actually ends up with.
export const SUGGESTIONS: Suggestion[] = [
  {
    id: "split",
    priority: "high",
    title: "Split a bundled question",
    summary: "Three asks in one. People answer only the last.",
    tag: (ql) => ql("q5"),
    chip: "Split into 3 questions",
    targets: ["q5"],
    delta: 1,
  },
  {
    id: "add",
    priority: "high",
    title: "Add a missing question",
    summary: "Your brief asks about discounts. No question does.",
    tag: (ql) => `After ${ql(addAnchorFromLabels(ql))}`,
    chip: "Suggested: covers a gap in your brief",
    targets: ["new"],
    delta: 2,
  },
  {
    id: "fit",
    priority: "high",
    title: "Fit the guide to 25 min",
    reviewTitle: "Fit the guide to 25 minutes",
    summary: "Runs over the agreed length. Cut or shorten a few questions.", // live text is built in the UI
    tag: () => "Whole guide",
    targets: [],
    delta: -13,
  },
  {
    id: "reword",
    priority: "medium",
    title: "Reword for clarity",
    summary: "Says “that”, so it breaks if moved or skipped.",
    tag: (ql) => ql("q4"),
    chip: "Reword: refers to “that”",
    targets: ["q4"],
    delta: 0,
  },
  {
    id: "note",
    priority: "medium",
    title: "Convert to moderator note",
    summary: "An instruction. The AI would read it out loud.",
    tag: (ql) => ql("q10"),
    chip: "Looks like a moderator note",
    targets: ["q10", "q9"],
    delta: -1,
  },
  {
    id: "format",
    priority: "low",
    title: "Change the answer format",
    summary: "Your note wants a clear answer. A choice gives one.",
    tag: (ql) => ql("q8"),
    chip: "Make it single choice",
    targets: ["q8"],
    delta: 0,
  },
  {
    id: "reorder",
    priority: "low",
    title: "Reorder",
    summary: "About earlier doubts. Ask it before the decision.",
    tag: (ql) => ql("q9"),
    chip: "Move before Q6",
    targets: ["q9"],
    delta: 0,
  },
];

export const suggById = (id: SuggId) => SUGGESTIONS.find((s) => s.id === id)!;

// The discount question belongs with the decision to cancel. It normally sits
// after Q9, but once Q9 has been moved before Q6 it anchors to Q6 instead, so
// accepting "Reorder" never drags it in front of the decision.
export function addAnchor(qs: Question[]): "q6" | "q9" {
  const i6 = qs.findIndex((q) => q.id === "q6");
  const i9 = qs.findIndex((q) => q.id === "q9");
  return i9 >= 0 && i6 >= 0 && i9 < i6 ? "q6" : "q9";
}
const addAnchorFromLabels = (ql: QL) =>
  parseInt(ql("q9").slice(1), 10) < parseInt(ql("q6").slice(1), 10) ? "q6" : "q9";

// ── Fit-to-25 sub changes ────────────────────────────────────────────────
// Candidates in the order they should be cut: least useful to the brief first.
// The plan ticks just enough of them to reach 25 min for the guide *as it is
// now*, so accepting the split (+1) or the discount question (+2) first never
// leaves "Fit to 25" short.
export type FitKey = "remove-q7" | "merge-q2" | "shorten-q12" | "shorten-q11" | "shorten-q1";

export type FitChange = {
  key: FitKey;
  target: string;
  title: (ql: QL) => string;
  desc: string;
  delta: number;
  chip: string;
  always?: boolean; // shown even when not needed, so the plan's shape stays familiar
};

export const FIT_CHANGES: FitChange[] = [
  { key: "remove-q7", target: "q7", title: (ql) => `Remove ${ql("q7")}`, desc: "Not linked to anything in your brief.", delta: -5, chip: "Remove: not linked to your brief", always: true },
  { key: "merge-q2", target: "q2", title: (ql) => `Merge ${ql("q2")} into ${ql("q3")}`, desc: "Both ask how often they ordered.", delta: -4, chip: "Merge into Q3", always: true },
  { key: "shorten-q12", target: "q12", title: (ql) => `Shorten ${ql("q12")} to a quick wrap-up`, desc: "Open catch-alls run long with follow-ups.", delta: -4, chip: "Shorten to a quick wrap-up", always: true },
  { key: "shorten-q11", target: "q11", title: (ql) => `Shorten ${ql("q11")} to one quick ask`, desc: "Rejoining isn’t part of your brief, so one quick ask is enough.", delta: -2, chip: "Shorten to one quick ask" },
  { key: "shorten-q1", target: "q1", title: (ql) => `Shorten ${ql("q1")} to a one-line warm-up`, desc: "It’s a warm-up. The brief doesn’t need the full sign-up story.", delta: -2, chip: "Shorten to a one-line warm-up" },
];

const fitCandidates = (qs: Question[]) => FIT_CHANGES.filter((c) => qs.some((q) => q.id === c.target));

/** Smallest set of cuts, in candidate order, that brings the current guide to 25 min. */
export function recommendedFit(qs: Question[]): Set<FitKey> {
  let total = totalMinutes(qs);
  const rec = new Set<FitKey>();
  for (const c of fitCandidates(qs)) {
    if (total <= AGREED_MIN) break;
    rec.add(c.key);
    total += c.delta;
  }
  return rec;
}

export type FitOverrides = Partial<Record<FitKey, boolean>>;

/**
 * What the Fit review shows: the options, which are ticked (the user's choice
 * wins over the recommendation), and the next cut to offer if they want more.
 */
export function fitPlan(qs: Question[], overrides: FitOverrides) {
  const rec = recommendedFit(qs);
  const cands = fitCandidates(qs);
  const options = cands.filter((c) => c.always || rec.has(c.key) || overrides[c.key] !== undefined);
  const checked = options.filter((c) => overrides[c.key] ?? rec.has(c.key));
  const saved = checked.reduce((a, c) => a + -c.delta, 0);
  const total = totalMinutes(qs);
  const next = cands.find((c) => !options.includes(c));
  const recSaved = cands.filter((c) => rec.has(c.key)).reduce((a, c) => a + -c.delta, 0);
  return { rec, options, checked, saved, result: total - saved, next, recommended: cands.filter((c) => rec.has(c.key)), recResult: total - recSaved };
}

// ── Ops ──────────────────────────────────────────────────────────────────
export type OpKind =
  | FitKey
  | "split"
  | "add"
  | "reword"
  | "note"
  | "format"
  | "reorder"
  | "edit"
  | "modnote"
  | "dismiss";

export type Op = {
  id: string;
  kind: OpKind;
  label: string;
  suggestionId?: SuggId;
  qid?: string;
  text?: string;
  texts?: string[];
  at: number;
};

let opSeq = 0;
export const newOpId = () => `op${Date.now().toString(36)}${(opSeq++).toString(36)}`;

const clone = (qs: Question[]) => qs.map((q) => ({ ...q, origins: [...q.origins] }));

export function applyOps(base: Question[], ops: Op[]): Question[] {
  let qs = clone(base);
  const find = (id: string) => qs.find((q) => q.id === id);
  for (const op of ops) {
    switch (op.kind) {
      case "split": {
        const i = qs.findIndex((q) => q.id === "q5");
        if (i < 0) break;
        const t = op.texts ?? DEFAULT_SPLIT;
        const mins = [2, 1, 1];
        const kids: Question[] = t.map((text, k) => ({
          id: `q5${"abc"[k]}`,
          text,
          hint: k > 0 ? "Skip if they tried none." : undefined,
          minutes: mins[k],
          splitGroup: "q5",
          origins: k === 0 ? [{ label: "Split by suggestion", opId: op.id }] : [],
        }));
        qs.splice(i, 1, ...kids);
        break;
      }
      case "merge-q2": {
        const q3 = find("q3");
        if (!find("q2") || !q3) break;
        qs = qs.filter((q) => q.id !== "q2");
        q3.origins.push({ label: "Also asks about a typical month (from Q2)", opId: op.id });
        break;
      }
      case "remove-q7":
        qs = qs.filter((q) => q.id !== "q7");
        break;
      case "shorten-q12": {
        const q = find("q12");
        if (!q) break;
        q.text = SHORT_Q12_TEXT;
        q.minutes = 1;
        q.origins.push({ label: "Shortened by suggestion", opId: op.id });
        break;
      }
      case "shorten-q11": {
        const q = find("q11");
        if (!q) break;
        q.text = SHORT_Q11_TEXT;
        q.minutes = 1;
        q.origins.push({ label: "Shortened by suggestion", opId: op.id });
        break;
      }
      case "shorten-q1": {
        const q = find("q1");
        if (!q) break;
        q.text = SHORT_Q1_TEXT;
        q.minutes = 1;
        q.origins.push({ label: "Shortened by suggestion", opId: op.id });
        break;
      }
      case "reword": {
        const q = find("q4");
        if (!q) break;
        q.text = op.text ?? REWORD_Q4_TEXT;
        q.origins.push({ label: "Reworded by suggestion", opId: op.id });
        break;
      }
      case "add": {
        const anchor = addAnchor(qs);
        const i = qs.findIndex((q) => q.id === anchor);
        const nq: Question = {
          id: "qnew",
          text: op.text ?? NEW_QUESTION_TEXT,
          minutes: 2,
          origins: [{ label: "Added by suggestion", opId: op.id }],
        };
        qs.splice(i < 0 ? qs.length : i + 1, 0, nq);
        break;
      }
      case "format": {
        const q = find("q8");
        if (!q) break;
        q.choices = ["Cheap", "Fair", "Expensive"];
        q.origins.push({ label: "Single choice by suggestion", opId: op.id });
        break;
      }
      case "reorder": {
        const i9 = qs.findIndex((q) => q.id === "q9");
        const i6 = qs.findIndex((q) => q.id === "q6");
        if (i9 < 0 || i6 < 0 || i9 < i6) break;
        const [q9] = qs.splice(i9, 1);
        q9.origins.push({ label: "Moved by suggestion", opId: op.id });
        qs.splice(i6, 0, q9);
        break;
      }
      case "note": {
        const q9 = find("q9");
        if (!find("q10") || !q9) break;
        qs = qs.filter((q) => q.id !== "q10");
        q9.modNote = op.text;
        q9.origins.push({ label: "Note added by suggestion", opId: op.id });
        break;
      }
      case "edit": {
        const q = op.qid ? find(op.qid) : undefined;
        if (!q || op.text === undefined) break;
        q.text = op.text;
        q.editedByUser = true;
        break;
      }
      case "modnote": {
        const q = op.qid ? find(op.qid) : undefined;
        if (!q) break;
        q.modNote = op.text || undefined;
        break;
      }
      case "dismiss":
        break;
    }
  }
  return qs;
}

// Numbering: split children share their parent's number (5a, 5b, 5c).
export function numberMap(qs: Question[]) {
  const map: Record<string, string> = {};
  let n = 0;
  let group: string | undefined;
  let letter = 0;
  for (const q of qs) {
    if (q.splitGroup) {
      if (q.splitGroup !== group) {
        n++;
        group = q.splitGroup;
        letter = 0;
        map[q.splitGroup] = String(n);
      }
      map[q.id] = `${n}${"abc"[letter++]}`;
    } else {
      group = undefined;
      n++;
      map[q.id] = String(n);
    }
  }
  return map;
}

export const baseNumber = (id: string) => {
  const i = BASE_QUESTIONS.findIndex((q) => q.id === id);
  return i < 0 ? "?" : String(i + 1);
};

export const totalMinutes = (qs: Question[]) => qs.reduce((s, q) => s + q.minutes, 0);
