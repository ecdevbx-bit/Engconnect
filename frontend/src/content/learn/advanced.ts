import "server-only";

import { blocks, ex, f, formula, peer, pt, q, scale, span, table, timeline, transform } from "./build";
import type { Lesson } from "./types";

// Advanced track (C1) — every lesson is Pro (first section is a free preview).
export const ADVANCED: Lesson[] = [
  {
    track: "advanced",
    slug: "third-and-mixed-conditionals",
    title: "Third and mixed conditionals",
    summary: "Imagine a different past — and what would be different now.",
    pro: true,
    minutes: 6,
    sections: [
      {
        heading: "Third conditional: a past that didn't happen",
        text: "Both halves are in the past, and both are imaginary.",
        visual: timeline(
          [
            pt(22, "If I had left earlier… (I didn't)", { tone: "violet", side: "top" }),
            pt(42, "…I would have caught the train. (I missed it)", { side: "bottom" }),
          ],
          { now: 82 },
        ),
        examples: [
          ex("If I had left earlier, I would have caught the train."),
          ex("If she hadn't called, I'd have forgotten.", undefined, "*I'd have* = I would have."),
        ],
      },
      {
        heading: "The pattern",
        visual: formula(
          [
            f("L(if part):If + had + V3|H(result):would / could / might have + V3", "If we **had known**, we **would have come**.", "Third"),
            f("L(if part):If + had + V3|H(result):would + verb", "If I **had slept** more, I **wouldn't be** so tired now.", "Mixed: past → now"),
            f("L(if part):If + past|H(result):would have + V3", "If he **weren't** so shy, he **would have spoken** up.", "Mixed: now → past"),
          ],
          { join: "→" },
        ),
        examples: [
          ex("If I had studied, I would have passed.", "If I would have studied, I would have passed.", "No *would* in the *if* half."),
          ex("We could have won if we had practised more."),
        ],
        tip: "Indian speech often says *if I would have known*. In careful English the *if* half takes *had*: *if I had known*.",
      },
      {
        heading: "Mixed: past cause, present result",
        visual: timeline(
          [pt(24, "didn't take the job", { tone: "violet", side: "top" }), span(60, 86, "would be in Dubai now", { side: "bottom" })],
          { now: 72 },
        ),
        examples: [
          ex("If I had taken that job, I would be in Dubai now."),
          ex("If she hadn't missed the flight, she would be here by now."),
        ],
      },
    ],
    quiz: [
      q("If we ___ the map, we wouldn't have got lost.", ["checked", "had checked", "would check"], 1, "Third conditional: *if* + had + V3."),
      q("If she had taken the job, she ___ in London now.", ["would be", "would have been", "will be"], 0, "Past cause, present result → *would* + verb."),
      q("Which sentence talks about an imaginary past?", ["If it rains, I'll stay in.", "If I had seen you, I'd have waved.", "If I were you, I'd ask."], 1, "*had seen … would have waved* = the past, imagined differently."),
    ],
  },
  {
    track: "advanced",
    slug: "future-continuous-and-future-perfect",
    title: "Future continuous and future perfect",
    summary: "“Will be doing” at a future moment; “will have done” before a deadline.",
    pro: true,
    minutes: 5,
    sections: [
      {
        heading: "Future continuous: in the middle of it",
        text: "At that future moment, the action is in progress.",
        visual: timeline(
          [span(48, 84, "will be flying to Delhi", { tone: "violet", side: "top" }), pt(64, "8 pm tomorrow", { side: "bottom" })],
          { now: 20 },
        ),
        examples: [
          ex("This time tomorrow, I'll be flying to Delhi."),
          ex("Don't call at 7 — we'll be having dinner."),
        ],
      },
      {
        heading: "Future perfect: done by a deadline",
        text: "Finished before a point in the future.",
        visual: timeline(
          [span(30, 62, "writing the report", { side: "top" }), pt(80, "Friday — already done", { tone: "violet", side: "bottom" })],
          { now: 20 },
        ),
        examples: [
          ex("I'll have finished the report by Friday."),
          ex("By 2030, she will have worked here for ten years."),
        ],
      },
      {
        heading: "Patterns and polite questions",
        visual: formula([
          f("S:subject|H:will be|V:verb + -ing", "We **will be waiting** outside.", "Future continuous"),
          f("S:subject|H:will have|V:past participle (V3)", "They **will have left** by then.", "Future perfect"),
        ]),
        examples: [
          ex("Will you be using the car tonight?", undefined, "Asks about plans — softer than *Will you use…?*"),
          ex("By the time you arrive, we'll have eaten.", "By the time you will arrive, we'll have eaten.", "No *will* after *by the time / when*."),
        ],
        tip: "Office emails in India overuse *I will be sending*. For a promise, *I'll send it today* is clearer.",
      },
    ],
    quiz: [
      q("Don't call at 9 — I ___ the match.", ["will be watching", "will have watched", "watch"], 0, "In progress at 9 → future continuous."),
      q("By Friday, I ___ all ten chapters.", ["will have read", "will be reading", "read"], 0, "Completed before a future point → future perfect."),
      q("Which sentence is correct?", ["By the time you will call, I'll have left.", "By the time you call, I'll have left.", "By the time you call, I'll leave."], 1, "Present after *by the time*; future perfect for the earlier action."),
    ],
  },
  {
    track: "advanced",
    slug: "inversion-and-emphasis",
    title: "Inversion and emphasis",
    summary: "Never have I…, What I need is…: structures that add weight.",
    pro: true,
    minutes: 6,
    sections: [
      {
        heading: "Negative word first → question order",
        text: "Put a negative or limiting word first, then swap helper and subject — like a question.",
        visual: transform("Normal", "Emphatic", [
          ["I have **never** seen such a crowd.", "**Never have I** seen such a crowd."],
          ["I **rarely** eat out.", "**Rarely do I** eat out."],
          ["We had **no sooner** sat down than the lights went out.", "**No sooner had we** sat down than the lights went out."],
          ["You shouldn't open this **under any circumstances**.", "**Under no circumstances should you** open this."],
        ]),
      },
      {
        heading: "The pattern",
        visual: blocks([
          "X(limiting word):Never|H:have|S:I|V:seen|O:such a crowd",
          "X(limiting word):Only then|H:did|S:we|V:understand",
          "X(limiting word):Not only|H:did|S:she|V:win|L:— she also set a record",
        ]),
        examples: [
          ex("Not only did she win, she also set a record.", "Not only she won, she also set a record."),
          ex("Only later did I realise my mistake.", "Only later I realised my mistake."),
        ],
        tip: "Great in IELTS Part 3 or a speech — one inversion shows range; five sound rehearsed.",
      },
      {
        heading: "Cleft sentences: It was … who / What … is",
        visual: transform("Plain", "Focused", [
          ["Rahul broke the window.", "**It was Rahul who** broke the window.", "not someone else"],
          ["I need a break.", "**What I need is** a break."],
          ["The price worries me.", "**What worries me is** the price."],
        ]),
        examples: [ex("It was in Chennai that we first met."), ex("What I love about Kerala is the food.")],
        tip: "Hindi stresses with *hi* (*Rahul ne hi…*). English uses a cleft: *It was Rahul who…*",
      },
    ],
    quiz: [
      q("___ have I felt so proud.", ["Never", "Ever", "Always"], 0, "Negative word first → inversion (*have I*)."),
      q("Not only ___ late, he also forgot the file.", ["he was", "was he", "he is"], 1, "After *Not only* at the start, swap: *was he*."),
      q("Stress the person: *Priya found the mistake.*", ["It was Priya who found the mistake.", "It was Priya found the mistake who.", "Priya it was found the mistake."], 0, "Cleft: *It was* + focus + *who* + rest."),
    ],
  },
  {
    track: "advanced",
    slug: "collocations",
    title: "Collocations that sound natural",
    summary: "Words that belong together: make a decision, heavy rain, highly recommend.",
    pro: true,
    minutes: 5,
    sections: [
      {
        heading: "make or do?",
        visual: peer(
          ["make (create, result)", "do (task, activity)"],
          [
            ["make a decision", "do homework"],
            ["make a mistake", "do business"],
            ["make money", "do your best"],
            ["make a call", "do the dishes"],
            ["make progress", "do research"],
          ],
        ),
        examples: [ex("I made a mistake.", "I did a mistake."), ex("Let's make a plan.", "Let's do a plan.")],
        tip: "Hindi *karna* covers both: *galti karna* → **make** a mistake, *kaam karna* → **do** work.",
      },
      {
        heading: "Adjective + noun",
        visual: peer(
          ["✓ Natural", "✗ Sounds odd"],
          [
            ["heavy rain", "strong rain"],
            ["strong coffee", "powerful coffee"],
            ["a high price", "an expensive price"],
            ["a big mistake", "a large mistake"],
            ["heavy traffic", "big traffic"],
          ],
        ),
        examples: [ex("The price is too high.", "The price is too expensive.", "Things are expensive; prices are high.")],
      },
      {
        heading: "Verb + noun · adverb + adjective",
        visual: table(
          ["Pair", "Example"],
          [
            ["take a photo", "Can you **take a photo** of us?"],
            ["catch a cold", "I've **caught a cold**."],
            ["pay attention", "Please **pay attention**."],
            ["deeply sorry", "I'm **deeply sorry**."],
            ["highly recommend", "I **highly recommend** it."],
            ["fully aware", "We're **fully aware** of it."],
          ],
        ),
        examples: [ex("Can you take a photo of us?", "Can you click a photo of us?", "*click a photo* is Indian English; *take* works everywhere.")],
      },
    ],
    quiz: [
      q("I ___ a big mistake.", ["did", "made", "took"], 1, "*make a mistake*."),
      q("Which sounds natural?", ["strong rain", "heavy rain", "big rain"], 1, "Rain is *heavy*."),
      q("We ___ some research on the market.", ["made", "did", "took"], 1, "*do research*."),
    ],
  },
  {
    track: "advanced",
    slug: "idioms-at-work",
    title: "Idioms at work",
    summary: "Common workplace idioms — what they mean and where they fit.",
    pro: true,
    minutes: 5,
    seoTitle: "Workplace idioms with meanings and register",
    sections: [
      {
        heading: "Everyday office idioms",
        visual: table(
          ["Idiom", "Means", "Register"],
          [
            ["on the same page", "agree, understand alike", "neutral"],
            ["touch base", "check in briefly", "casual"],
            ["the ball is in your court", "it's your decision now", "neutral"],
            ["a ballpark figure", "a rough estimate", "neutral"],
            ["cut corners", "do it cheaply and badly", "neutral"],
            ["back to square one", "start again", "casual"],
          ],
        ),
        examples: [
          ex("Let's make sure we're on the same page before the client call."),
          ex("Can you give me a ballpark figure?"),
        ],
      },
      {
        heading: "Same meaning, three registers",
        visual: scale("casual", "formal", [
          ["Let's call it a day.", 20, "team chat, stand-ups"],
          ["Let's wrap up for today.", 50, "most meetings"],
          ["We'll conclude here and continue tomorrow.", 88, "client meetings, formal email"],
        ]),
        tip: "In client emails, plain words beat idioms — many readers use English as a second language too.",
      },
      {
        heading: "Time and progress",
        visual: table(
          ["Idiom", "Means"],
          [
            ["on track", "going as planned"],
            ["behind schedule", "late"],
            ["up to speed", "fully informed"],
            ["at the eleventh hour", "at the last moment"],
            ["ahead of the curve", "earlier than others"],
          ],
        ),
        examples: [
          ex("The project is on track for the March launch."),
          ex("Could someone bring me up to speed on the client's feedback?"),
        ],
      },
    ],
    quiz: [
      q("*Let's touch base next week* means…", ["Let's meet at the office base.", "Let's check in briefly.", "Let's end the project."], 1, "*touch base* = a short check-in."),
      q("Which is best for a formal client email?", ["Let's call it a day.", "The ball's in your court, mate.", "We look forward to your decision."], 2, "Formal writing prefers plain, polite wording."),
      q("*A ballpark figure* is…", ["an exact number", "a rough estimate", "a sports score"], 1, "It's an approximate number."),
    ],
  },
  {
    track: "advanced",
    slug: "hedging-and-softening",
    title: "Hedging and softening",
    summary: "Sound careful and polite: seems, might, a bit, I was wondering…",
    pro: true,
    minutes: 5,
    sections: [
      {
        heading: "From blunt to soft",
        text: "Softer isn't weaker — the message stays the same.",
        visual: scale("blunt", "soft", [
          ["Your report is wrong.", 5],
          ["Your report has a mistake.", 30],
          ["There seems to be a small mistake in the report.", 70],
          ["I might be wrong, but I think there's a small error on page 3.", 94],
        ]),
      },
      {
        heading: "Hedging tools",
        visual: table(
          ["Tool", "Example"],
          [
            ["seem / appear", "The data **seems to** show a drop."],
            ["might / could", "This **could** be a problem."],
            ["a bit / slightly", "It's **a bit** late for a call."],
            ["I think / I feel", "**I feel** we need more time."],
            ["quite / fairly", "The results are **fairly** good."],
            ["tend to", "Clients **tend to** prefer calls."],
          ],
        ),
        examples: [ex("It seems we're a little behind schedule.")],
      },
      {
        heading: "Softer requests",
        visual: transform("Direct", "Softer", [
          ["Send me the file.", "Could you send me the file when you get a chance?"],
          ["I want Friday off.", "I was wondering if I could take Friday off."],
          ["You're wrong.", "I see it a bit differently."],
          ["No.", "I'm afraid that won't be possible."],
        ]),
        tip: "A word-for-word translation from Hindi can sound blunt (*Send the file*). *Could you… please* is simply professional.",
      },
      {
        heading: "Don't over-hedge",
        text: "One or two softeners are enough — more sounds unsure.",
        examples: [
          ex(
            "I think we should delay the launch by a week.",
            "I was just maybe thinking that possibly we might perhaps delay it?",
            "Clear and polite beats vague.",
          ),
        ],
      },
    ],
    quiz: [
      q("Which is softest?", ["Give me the report.", "I want the report.", "Could you send me the report when you get a chance?"], 2, "A question with *could* + a flexible time softens the request."),
      q("There ___ to be a problem with the payment.", ["seems", "is seeming", "seem"], 0, "*There seems to be…* — a classic hedge."),
      q("Which says no politely?", ["No, impossible.", "I'm afraid that won't be possible.", "Never."], 1, "*I'm afraid…* softens bad news."),
    ],
  },
];
