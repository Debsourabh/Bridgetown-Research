## The product, in short

Teamroom is a workspace where consultants and investors run expert interviews. An AI interviewer talks to experts (former distributors, operators, executives) and the platform turns the calls into transcripts and findings. The quality of the guide, meaning the questions the AI interviewer asks, decides the quality of everything that follows.

## How the user gets to this screen

*You don't design any of this. It's context.*

1. A consultant is helping a grocery delivery company, FreshCart, understand why customers cancel its paid membership. They already have a **discussion guide** in a Google Doc, written for human interviewers in live calls.
2. They upload that doc to Teamroom and start a new interview.
3. The AI converts it into a structured interview guide: sections, questions, and a moderator note per question. It keeps the user's questions as written.
4. The user lands on the **guide editor** (attached). This is where they review the guide before publishing it to the AI interviewer.

## Why suggestions at all

A guide written for a human is not always a good guide for an AI interviewer who will run it dozens of times with strangers. Common problems:

- **Bundled questions.** Three questions in one, and participants answer only the last.
- **Hidden dependencies.** A question refers to "that" answer, so it breaks if the order changes.
- **Instructions written as questions.** Moderator notes sitting in the list as if they were questions.
- **Gaps against the project brief.** The guide never asks something the brief says it needs.
- **Length.** The guide would run well over the time participants agreed to.

We don't want the AI to silently rewrite the user's guide. It's their research, and they know their client. So the AI imports the guide faithfully, then proposes **suggestions** that the user can accept or dismiss.

## The problem to design

**Design how suggestions appear on the guide editor and how the user reviews and resolves them.**

The user should quickly understand that suggestions exist, which ones matter most, and what each would change. They should be able to resolve them confidently without losing control of their own guide.

### Rules of the product

- The guide stays the author's. **Nothing changes until the user accepts**, and accepting can be **undone**.
- Every suggestion must give a reason the user can check.
- Suggestions are ready when the user lands. They can refresh as the user edits.
- Suggestions can be about one question, several questions

### In scope and out of scope

- **In scope:** the center canvas (the question list) and the right panel of the attached screen, plus any entry points on that screen.
- **Out of scope:** the upload flow, how suggestions are detected, other tabs, the sidebar, and publishing.

## The sample project

**Brief:** *"Understand why FreshCart customers cancel the paid membership in their first three months, which apps they switch to, and whether a discount or free month would have kept them."*

**Participants:** former members. **Agreed call length:** 25 minutes.

**Section: Why members cancel**

| # | Question | Moderator note |
| --- | --- | --- |
| 1 | What first made you sign up for the membership? |  |
| 2 | How many orders did you place in a typical month while you were a member? |  |
| 3 | In your last full month as a member, roughly how many orders did you place, and what share were groceries? | Ask for a rough number. Don't ask them to check their order history. |
| 4 | How does that compare with your first month after joining? |  |
| 5 | Did you try other delivery apps while you were a member? Which ones, and why? |  |
| 6 | When did you decide to cancel: after one bad order, or after a gradual build-up? | Get a date. Ask when their last order was. |
| 7 | How did the membership feel on weekdays compared with busy weekend evenings? |  |
| 8 | Would you say the membership fee felt cheap, fair, or expensive for how much you used it? | Always get a clear answer so findings can be compared. |
| 9 | Did you ever consider cancelling and then stay? What changed your mind? |  |
| 10 | Do not stop at "I just got busy." Probe for the order, the price, or the fee that changed their mind. |  |
| 11 | What would need to change for you to rejoin? |  |
| 12 | Is there anything else about the membership you'd like to tell us? |  |

## The seven suggestion types

| # | Type | Severity | Applies to | Current | Suggested | Why shown |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Reword for clarity | Medium | Q4 | "How does **that** compare with your first month after joining?" | "Compared with your first month as a member, did you order more, fewer, or about the same in your last month?" | Refers to the previous answer, so it breaks if reordered or skipped. |
| 2 | Split a bundled question | High | Q5 | "Did you try other delivery apps…? Which ones, and why?" | Three questions: did you try others, which ones, why. | Three asks in one. Participants usually answer only the last. |
| 3 | Convert to moderator note | Medium | Q10 | "Do not stop at 'I just got busy.' Probe for the order, the price, or the fee…" | Move into Q9's moderator notes and remove Q10. | It's an instruction, not a question. The AI would read it out loud to the participant. |
| 4 | Change the answer format | Low | Q8 | Open text: "cheap, fair, or expensive?" | Single choice: Cheap, Fair, Expensive. | Three expected answers. A choice makes responses countable. |
| 5 | Add a missing question | High | After Q9 | No question on discounts | "If you'd been offered a discount or a free month when you went to cancel, would you have stayed?" | The brief asks about discounts and free months, but no question covers it. |
| 6 | Reorder | Low | Q9 | After Q6 | Move to just before Q6. | Q9 is about earlier doubts, so asking it after the decision to cancel confuses the story. |
| 7 | Guide-level | High | Whole guide (12 questions) | Estimated 38 min | Target 25 min. Suggests which 3 questions to cut or shorten. | Participants agreed to a 25-minute call. |

Types 1 to 6 target specific questions. Type 7 touches the whole guide, and some suggestions will affect several questions at once. How you handle that is part of the problem.

## What to submit

1. Framing note (max 1 page)**.** Who the user is and what they are trying to do at this screen. Your main assumptions and how you'd test them. What you chose not to design, and why.
2. High-fidelity screens for your chosen direction, using the current UI:
    - The guide as the user first lands with suggestions present.
    - Reviewing one suggestion in detail.

## **What we'll look at**

1. **Problem framing:** what you decided the real problem is, and what you chose to leave out.
2. **Decisions and trade-offs:** the choices you made on how suggestions appear and how they're reviewed, and why. Show the alternatives you considered, even briefly.
3. **Craft:** a high-fidelity result that fits the UI.

## How we'll talk about it

In the walkthrough, take us through your framing, exploration and the choice you made, then the screens. Expect questions about what you'd do with another week, and what could go wrong with your design.

---

## My walkthrough

### 1. Framing

**Who is at this screen.** A consultant or investor who has just uploaded a guide they wrote for human interviewers. They know the client and the research question better than the AI does. They are about to hand the guide to an interviewer that will run it dozens of times with strangers, and they can't step in mid-call.

**What they are trying to do.** Get to "safe to publish" quickly, without the guide stopping being theirs. They aren't trying to learn about interview craft. They want to know three things: what's wrong, how much it matters, and what the fix would cost them.

**The real problem.** This isn't "show seven suggestions." It's **earning trust in the AI's suggestions without taking authorship away**. Done badly, it goes one of two ways. If users accept everything blindly, the guide stops being theirs. If they dismiss everything, the AI interviewer reads instructions out loud and runs 13 minutes over. So every decision is about:

- **Visibility:** the user knows suggestions exist and which ones matter, within seconds.
- **Checkability:** every suggestion carries evidence the user can verify, not only a claim.
- **Reversibility:** nothing changes until they accept, and any accepted change can be undone on its own.

**Main assumptions, and how I'd test them**

| Assumption | Test |
| --- | --- |
| Users will review the high-priority suggestions and skim the rest | Five moderated sessions with consultants on their own guides; watch the order they open suggestions and where they stop |
| "Check it yourself" evidence makes users accept more correct suggestions and fewer wrong ones | A/B the evidence block on vs off; measure accept rate on deliberately planted wrong suggestions |
| Minute estimates are trusted enough to drive cuts | Ask users to predict the call length before and after seeing the estimates, then compare with real call lengths |
| A guide-level suggestion is understood as several separate choices, not one take-it-or-leave-it package | Track how often people untick individual changes in "Fit to 25 min" |

**What I chose not to design, and why**

- How suggestions are detected (out of scope, and a model problem rather than a UI one).
- Bulk "accept all". It works against the goal of authorship, and with seven suggestions it isn't needed.
- Multi-section guides and dozens of suggestions. The sample has one section; I name it as a risk below instead of designing for it blind.
- Commenting on or arguing with a suggestion ("why not X?"). Valuable, but it's a conversation feature.

### 2. Exploration: alternatives I considered

*(Swap in the explorations you actually did if they differ.)*

| Question | Options | Chose | Why |
| --- | --- | --- | --- |
| How suggestions appear on arrival | Open list of all seven · inline rewrites in the guide · **summary bar + a chip on each affected question** | Summary bar + chips | A list on arrival feels like homework. Inline rewrites feel like the AI already edited the guide. The bar answers "how much, and how bad", and the chips answer "where", without touching the guide. |
| Where reviewing happens | Modal diff · inline accept in the guide · **right panel + preview inside the guide** | Panel + preview | A modal hides the context the user needs to judge the change. Accepting inline is too easy to do by accident. The panel holds the reasoning; the guide shows the result where it would live. |
| Guide-level length problem | Seven independent "cut Qn" suggestions · one opaque "shorten guide" button · **one suggestion with checkable parts** | One suggestion, choose any | The user sees the goal (25 min), the maths, and keeps the decision about each question. Each change lands as its own History step. |
| Suggestions that touch two questions (Q9 + Q10) | Two suggestions · **one suggestion, one step** | One step | Accepting half of it would leave the guide broken: a note with no question, or a question that's still an instruction. |
| Undo | Only a global ⌘Z · **⌘Z + Undo chip on the changed question + per-step History** | All three | Undo has to be reachable from wherever the user is looking when they regret a change. |

### 3. The screens: demo only the core path

**Two entry points, each with one job.** The **summary bar** is for the first pass ("Start with high priority"). **Chips** are for "this question". The other ways in (the ✨ toolbar button, the Suggestions tab, the card in Details, the length card button) exist for people who arrive differently. I don't present them as equals.

**Demo script (about 4 minutes)**

1. **Landing.** The summary bar shows 7 suggestions: 3 high, 2 medium, 2 low, and "Nothing changes until you accept". The header always shows "12 questions · ~38 min". Chips mark where each suggestion applies.
2. **"Start with high priority" → split Q5 (1 of 3 high).** The change is previewed inside the guide. The panel leads with the reason, the change (editable) and the buttons. "Check it yourself" is always open, on every suggestion: here, the three asks highlighted in the original wording. Accept, with the undo route spelled out.
3. **Add the missing question (2 of 3 high).** The draft is tied to a sentence in the brief, and editable before accepting.
4. **Fit to 25 min (3 of 3 high).** It comes last on purpose: length depends on content, so the plan is calculated on the guide the user ends up with. One block per question, sized by minutes, with the cut rows struck through in the guide. Changes are ticked but any can be unticked, and the result updates. A single line notes what the other suggestions would add.
5. **"High priority done."** A checkpoint, not a drift into Medium: what was accepted, where the length stands against 25, and what's left.
6. **One Medium suggestion (e.g. Reword Q4).** The evidence is still open, but "What else changes" is collapsed; this shows the review scales down for less important suggestions without hiding the proof.

**Hold back, use as answers to "what about…?"**

| If they ask… | Show |
| --- | --- |
| "What if the user edits a question first?" | Screen 6: Q9 edited, and the moderator-note suggestion says "Updated after your edit" and keeps their wording. Q9 + Q10 change as one step. |
| "Do suggestions conflict?" | If Q9 is moved before Q6, the discount question anchors after Q6 so it stays with the decision to cancel, in either order. Only relations that change the outcome are shown. |
| "What if accepting things makes it longer?" | The live 25-minute plan: after the split and the new question, Fit adds cuts and still reaches 25, and says why. |
| "Can I undo just one of the Fit changes?" | History: each change is its own step, and undoing one leaves the others. |
| "What about the other ways in?" | The ✨ button, the Suggestions tab, the length card, and the card in Details. |

### 4. What I'd do with another week

1. **Run the five sessions above** before polishing anything. The riskiest assumption is that users read the evidence instead of pattern-matching on severity.
2. **Real refresh as the user edits.** Today only one case (Q9) is shown. A general rule would be that editing a question with a pending suggestion re-checks that suggestion, and drops it if the problem is gone (Q4 without "that", Q5 no longer bundled).
3. **Show the brief in the panel**, so "not linked to your brief" can be verified in one glance.
4. **Scale:** multi-section guides with 30+ suggestions. Filtering by section and severity, and grouping repeated issues ("6 questions refer back to the previous answer").
5. **Learning from dismissals:** ask "why?" in one tap on dismiss, so the same false positive isn't shown next time.
6. **Accessibility pass:** screen-reader labels for chips inside rows, single-key shortcuts that can be turned off, keyboard-only review.

### 5. What could go wrong

| Risk | Why it matters | Mitigation in the design | What I'd still worry about |
| --- | --- | --- | --- |
| Rubber-stamping | Users accept everything because it's quick, and the guide stops being theirs | Evidence before the buttons, one suggestion at a time, no "accept all" | The A shortcut and auto-advance make fast acceptance easy |
| Wrong minute estimates | The whole 25-min plan depends on them | Estimates are labelled with "~", shown per question, and every cut is optional | If the estimates are systematically off, users cut good questions |
| False positives | e.g. a real question flagged as an instruction | "Check it yourself" lets the user see the AI's reasoning and dismiss | Repeated false positives erode trust in the correct ones |
| Stale suggestions | The user fixes a problem by hand and the suggestion still claims it exists | One case handled (Q9) | Not general yet; see "another week" |
| Renumbering | After a merge or move, "Q7" means a different question | Past actions say "Q9 (now Q6)" | Still cognitive load in longer guides |
| Interacting suggestions | Accepting one changes whether another still applies | The cases above are handled and explained | With more suggestion types, combinations grow fast |
| Losing the author's voice | Rewrites drift from how the consultant talks to experts | Every suggested wording is editable before accepting | No signal yet on how often users edit vs accept as-is |

---

## Hard questions to prepare for

Each one targets a gap between what the walkthrough claims and what the design does. Write your answer under each one.

### Trust and authorship

1. Your core claim is "earning trust without taking authorship away", yet all three "Fit to 25 min" changes come pre-ticked. Isn't that the AI deciding and the user merely not objecting? Why opt-out rather than opt-in?

   **Answer:** The three ticked cuts are a complete plan that reaches a target the user already agreed to: 25 minutes. With everything unticked, the user would start from a plan that doesn't work and have to do the arithmetic themselves. Pre-ticking shows one working answer they can take apart. It's still a proposal: nothing applies until they press Apply, each cut is struck through in their own guide first, the result updates as they untick, and each change lands as its own History step. That said, defaults steer, and I won't pretend otherwise. I'd test opt-in against opt-out. If the opt-out version leads to many cuts being undone later, that tells me the default is doing the deciding, and I'd switch.

2. "Add a missing question" has the AI write a brand-new question in its own words. How is that different from the AI silently rewriting the guide, which the brief explicitly rules out?

   **Answer:** The difference is consent and visibility, not who wrote the words. Silent rewriting changes the guide without asking. Here, the question appears as a dashed "+ New" row clearly marked as a suggestion. It isn't added until the user accepts, the wording can be edited before accepting, and it's tied to a sentence in their own brief. The alternative was to flag the gap without drafting anything ("no question covers discounts"). That respects authorship more, but leaves the user with a blank page in the middle of a review. I chose a draft they own once they accept it. What I'd measure is how often people edit the draft before accepting. If almost nobody does, the AI's voice is slipping into their guide unexamined.

3. You list rubber-stamping as risk #1. Yet one key accepts and the panel auto-advances to the next suggestion. Haven't you designed the fastest path to exactly that risk?

   **Answer:** That's a fair hit, and the honest answer is partly yes. What pushes back is order: the reason and the evidence sit above the buttons, the change is previewed in the guide, and the A key only works with a suggestion open, so the user has at least seen it. But auto-advance plus one key is optimised for speed, and speed is the risk. If testing shows rubber-stamping, the first thing I'd remove is auto-advance for High suggestions: after accepting, you'd see the result in your guide before moving on. I'd also track time-to-accept: a High suggestion accepted in under two seconds is a signal, not a success.

### Evidence

4. For "Fit to 25 min", the evidence is the AI's own minute estimates. What is the user actually checking? Isn't "Check it yourself" circular when the AI provides both the claim and the proof?

   **Answer:** For this suggestion, yes, partly. That's why it doesn't get a "Check it yourself" box like the others. For split Q5, the user can see the three asks in their own wording: that's proof. For length, what they can check is judgment, not proof: the 25-minute target is theirs, each question shows its estimate, and the cuts are named, so they can ask "does Q7 matter to my client?" The estimates are labelled "~" and "estimated" so they don't read as fact. Real evidence would be where the numbers come from, e.g. "based on how long similar questions ran in past calls". That needs data I don't have in this exercise, so I'd say plainly that this one rests on judgment.

5. If a consultant thinks Q7 takes 2 minutes, not 5, what do they do? If they can't correct an estimate, why should they trust a plan built on it?

   **Answer:** Today they can't correct it. They can only untick the cut. That's a gap. The fix is to make each question's minutes editable right in the fit preview, so the plan recalculates against their number. It also does two other jobs: users trust a plan they can adjust, and every correction is the best data we could get to improve the estimates. It would be my first change to screen 5.

6. Who decides that "split Q5" is High and "reword Q4" is Medium? What happens when the user disagrees with the severity, and does the design even let them say so?

   **Answer:** Severity means "how much data you lose if the AI runs the guide as it is". High means answers are lost or the call breaks: a bundled question, a gap against the brief, running 13 minutes over. Medium means answers become harder to interpret. Low means cleaner data. The AI assigns it, and it only decides the order and the colour. Nothing is hidden or forced because of it; all seven are visible and can be reviewed in any order. I deliberately don't let users re-rank: severity is a pointer, not a decision, and adding re-ranking is more interface for little gain. Disagreement should go somewhere, though. A one-tap reason on Dismiss ("not important for this client") is the right place to capture it.

### Clarity of state

7. On screen 5, red struck-through previews sit next to "Reworded by suggestion · Undo" chips for accepted changes. At a glance, how does someone tell "will change" from "has changed"?

   **Answer:** There are two visual languages. Previews belong to the suggestion that's open: coloured rows, strikethrough, red chips, and a header that says "Previewing … Not applied yet". They disappear the moment you leave the review. Accepted changes look like the normal guide plus a quiet grey "✓ … · Undo" chip. On screen 5 they do sit side by side, and both are small chips, so the difference depends on colour and context more than I'd like. I'd test it directly: show the screen and ask "which of these has already changed?" If people hesitate, I'd add a "Not applied" label on each preview row rather than relying on the header alone.

8. After a merge, questions renumber: History says "Remove Q7" while the guide's Q7 is now a different question. Isn't the "Q9 (now Q6)" wording a sign the numbering model itself is wrong?

   **Answer:** Partly, yes. Numbers are positions, and positions change when the guide changes, like in any document. The alternative, numbers that never change, leaves gaps ("Q1, Q3, Q4") that make no sense to the author or the participant. The real fix is to stop leaning on numbers in history and messages: refer to questions by their text first ("Removed 'How did the membership feel on weekdays…'"), with the number second. "(now Q6)" is a patch; text-first references are the model.

9. A user dismisses three suggestions and comes back tomorrow. What do they see? Is a dismissal a decision you keep, or are those problems quietly forgotten?

   **Answer:** A dismissal is a decision, so it's kept. Dismissed suggestions leave the count, stay visible under "Reviewed" and in History, and can be restored. Tomorrow the summary shows only what's still open, so the author isn't nagged about something they've already ruled out. The one exception: if the question changes enough that the reason no longer applies (they rewrite it, or the guide grows past the agreed length again), the AI can raise it again as a new suggestion that says why it's back. The prototype doesn't save between sessions; this is the intended behaviour, not something you can click through today.

### Scale and edge cases

10. Your design works with 7 suggestions on 12 questions. A real guide has 4 sections, 40 questions and 30 suggestions. Do the summary bar and chips survive, or does the guide turn into a wall of chips?

   **Answer:** Not as it is, and I didn't design for that because the sample has one section. The chips mostly hold up, since there's still at most one or two per question and they answer "where". What breaks is the summary and the list. At 30 suggestions I'd:
   - group by type ("6 questions refer back to an earlier answer"), so repeated issues are reviewed together;
   - show the count per section in each section header;
   - show only High chips by default, with a toggle for the rest.

   I'd validate this with a real 40-question guide before designing it, because I suspect the problem changes shape at that size.

11. Q9 + Q10 is "one suggestion, one step". What if the user wants Q10 removed but the note reworded, or wants the note on Q6 instead?

   **Answer:** Rewording is covered. In the design, "The change · 2 questions" is marked editable, so the note can be reworded before accepting. (The prototype shows it read-only; there, you reword it after accepting.) Once accepted, it's an ordinary moderator note they can edit in Details. Moving the note to Q6 isn't supported in one step: they'd dismiss and move the text themselves. That's the trade-off of "one step". It guarantees the guide never ends up half-applied (a note with no question, or an instruction still being read out), at the cost of flexibility. If testing showed people want a different target often, I'd add a small "Attach note to: Q9 ▾" choice inside the same suggestion rather than splitting it into two.

12. Publishing is out of scope, but: can the user publish with a High suggestion still pending? Is there any friction, and should there be?

   **Answer:** Yes, they can publish. It's their guide, and blocking would contradict the whole stance. I'd add one light check at Publish, not a gate: "2 High suggestions not reviewed: Split Q5, Fit to 25 min" with "Review" and "Publish anyway". The length suggestion deserves the clearest warning, because it isn't only about data quality: participants agreed to 25 minutes, and running 38 affects real people's time.

### Layout

13. The panel takes 420px. On a 1280px laptop the guide drops to about 640px wide. Your key idea is "see the change in place". Does it survive at that width, or does the guide become a narrow column of wrapped text?

   **Answer:** It survives, but it gets tighter. At 640px, questions wrap to two or three lines; still readable, since each preview sits directly under its question rather than beside it. The guide also scrolls to the affected question when a review opens, so the change is in view even when the column is narrow. The part that suffers is the fit preview's bar of blocks, which shrinks with the width. Two things help: the sidebar already has a collapse button (that gives back 220px), and the panel could be resizable. I'd check both widths in testing rather than assume, since 1280 is a common consultant laptop.

### Success

14. How will you know this works after launch? Name the metric, and the number that would make you abandon this direction.

   **Answer:** The primary metric is the share of guides published with every High suggestion decided, whether accepted or dismissed. That measures whether the design gets attention onto what matters, not whether people agree with the AI. Downstream, I'd watch whether calls finish within the agreed length and whether transcripts show fewer half-answered bundled questions. The guardrail is the undo rate after accepting: if a lot of accepted changes get undone, either the suggestions or the way they're presented is misleading. My starting thresholds, to revisit once there's real data: if fewer than half of High suggestions get a decision before publishing, the entry points aren't working; if more than about one in five accepted changes is undone, the review isn't helping people decide well. Either would make me rethink the direction, not just tweak it.

15. A high acceptance rate could mean great suggestions or blind trust. How would you tell the difference?

   **Answer:** Acceptance alone can't tell you, so I'd look at what happens around it:
   - **Before accepting:** time spent on the review, and whether people edit the suggested wording. Thoughtful use looks like some edits and longer looks at High suggestions.
   - **After accepting:** undo rate, and whether people come back later to change what they accepted.
   - **In research:** plant a deliberately wrong suggestion. If people accept it about as often as the good ones, that's blind trust, whatever the overall acceptance rate says.
   - **Dismiss reasons:** if nobody ever dismisses anything, I'd worry more, not less.