// How suggestions affect each other. Each suggestion is still accepted on its
// own, but its review explains what another suggestion (accepted or pending)
// changes about it, and the guide applies the rules in `applyOps`.
import { baseNumber, type Op, type QL, type SuggId } from "./guide";
import { statusOf } from "./store";

export type Relation = {
  tone: "updated" | "info"; // updated = this suggestion changed because of another
  text: string;
  link?: SuggId; // the other suggestion, for a "Review →" link
};


export function relationsFor(id: SuggId, ops: Op[], ql: QL): Relation[] {
  const st = (x: SuggId) => statusOf(ops, x);
  const out: Relation[] = [];
  // Past actions use the number the user acted on, plus where it is now if it
  // has since been renumbered: "Q9 (now Q6)".
  const was = (qid: string) => {
    const orig = `Q${baseNumber(qid)}`;
    const now = ql(qid);
    return now === orig ? orig : `${orig} (now ${now})`;
  };

  // Only relations that change the outcome are shown: where the discount
  // question lands depends on Reorder. Informational links (Fit ↔ Reword, a note
  // travelling with Q9) were cut, since they add reading without changing a decision.
  switch (id) {
    case "add":
      if (st("reorder") === "accepted")
        out.push({
          tone: "updated",
          text: `Updated after you moved ${was("q9")} before ${was("q6")}. This question now goes after ${ql("q6")}, so it stays with the decision to cancel instead of landing before it.`,
          link: "reorder",
        });
      else if (st("reorder") === "pending")
        out.push({
          tone: "info",
          text: `If you also accept “Reorder”, this question stays with the decision to cancel (after ${ql("q6")}). It doesn’t move with ${ql("q9")}.`,
          link: "reorder",
        });
      break;

    case "reorder":
      if (st("add") !== "dismissed")
        out.push({
          tone: "info",
          text: `The discount question ${st("add") === "accepted" ? "stays" : "will stay"} after ${ql("q6")}, with the decision to cancel. It doesn’t move with ${ql("q9")}.`,
          link: st("add") === "pending" ? "add" : undefined,
        });
      break;
  }
  return out;
}

export const isUpdated = (id: SuggId, ops: Op[], ql: QL) => relationsFor(id, ops, ql).some((r) => r.tone === "updated");
