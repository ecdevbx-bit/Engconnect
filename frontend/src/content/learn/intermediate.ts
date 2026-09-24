import "server-only";

import { blocks, ex, f, formula, peer, pt, q, scale, span, table, timeline, transform } from "./build";
import type { Lesson } from "./types";

// Intermediate track (B1–B2) — free except the last two (Pro).
export const INTERMEDIATE: Lesson[] = [
  {
    track: "intermediate",
    slug: "present-perfect-vs-simple-past",
    title: "Present perfect vs simple past",
    summary: "“Have done” connects the past to now; “did” stays in finished time.",
    pro: false,
    minutes: 6,
    sections: [
      {
        heading: "Same action, different focus",
        visual: timeline(
          [
            span(30, 70, "present perfect — the result matters now", { side: "top" }),
            pt(30, "simple past — when it happened", { tone: "violet", side: "bottom" }),
          ],
          { now: 70 },
        ),
        examples: [
          ex("I've lost my keys.", undefined, "I still can't find them — focus on now."),
          ex("I lost my keys yesterday.", undefined, "A finished time — just the story."),
        ],
      },
      {
        heading: "The time words decide",
        visual: peer(
          ["Present perfect: have / has + V3", "Simple past: V2"],
          [
            ["ever, never", "yesterday, last week"],
            ["already, yet, just", "in 2020, two days ago"],
            ["so far, recently", "when I was a child"],
            ["this week (not over yet)", "on Monday (over)"],
          ],
        ),
        examples: [
          ex("I saw him yesterday.", "I have seen him yesterday."),
          ex("Have you ever been to Goa?"),
          ex("She has just left."),
        ],
        tip: "Indian English often uses *have + V3* for any past: *I have met him yesterday*. With a finished time, say *I met him*.",
      },
      {
        heading: "The pattern",
        visual: formula([
          f("S:subject|H:have / has|V:past participle (V3)", "Rahul **has finished** his project."),
          f("S:subject|H:haven't / hasn't|V:V3|T:yet", "I **haven't eaten** yet.", "Negative"),
          f("H:have / has|S:subject|X:ever|V:V3", "**Have** you ever **been** to Ladakh?", "Question"),
        ]),
        examples: [
          ex("She has written three books."),
          ex("They've gone to Kochi.", undefined, "*gone* = still there. *been* = went and came back."),
        ],
      },
    ],
    quiz: [
      q("I ___ him last Monday.", ["have met", "met", "have meet"], 1, "*last Monday* is a finished time → simple past."),
      q("___ you ever ___ a Marathi film?", ["Did / see", "Have / seen", "Have / saw"], 1, "*ever* (at any time up to now) → present perfect: have + V3."),
      q("Priya isn't here — she ___ to the bank.", ["has gone", "has been", "goes"], 0, "*has gone* = she went and is still there."),
    ],
  },
  {
    track: "intermediate",
    slug: "present-perfect-continuous",
    title: "Present perfect continuous: for / since",
    summary: "“Have been doing”: something that started in the past and is still going.",
    pro: false,
    minutes: 5,
    seoTitle: "Present perfect continuous with for and since: rules and examples",
    sections: [
      {
        heading: "Started then, still going",
        visual: timeline(
          [span(25, 70, "has been working here", { side: "top", arrow: true }), pt(25, "since 2021", { tone: "violet", side: "bottom" })],
          { now: 70, caption: "It began in the past and continues now." },
        ),
        examples: [ex("Priya has been working here since 2021."), ex("It's been raining all morning.")],
      },
      {
        heading: "for or since?",
        visual: peer(
          ["for + length of time", "since + starting point"],
          [
            ["for two years", "since 2023"],
            ["for three hours", "since 9 am"],
            ["for a long time", "since Monday"],
            ["for ages", "since I was a child"],
          ],
        ),
        examples: [
          ex("I've been waiting for 20 minutes.", "I'm waiting since 20 minutes."),
          ex("He's been studying since this morning."),
        ],
        tip: "Hindi *se* covers both: *do saal se* = **for** two years, *2023 se* = **since** 2023.",
      },
      {
        heading: "The pattern",
        visual: formula([
          f("S:subject|H:have / has been|V:verb + -ing|T:for / since …", "We **have been living** in Pune **for** five years."),
          f("Q:How long|H:have / has|S:subject|H:been|V:verb + -ing", "**How long have** you **been learning** English?", "Question"),
        ]),
        examples: [
          ex("I've known her for years.", "I've been knowing her for years.", "State verbs (know, like, own) use *have + V3* instead."),
        ],
      },
    ],
    quiz: [
      q("I ___ here since 2020.", ["am living", "have been living", "live"], 1, "Started in 2020 and still true → *have been living*."),
      q("She's been studying ___ three hours.", ["since", "for", "from"], 1, "Length of time → *for*."),
      q("Which is correct?", ["I've been knowing him for years.", "I've known him for years.", "I know him since years."], 1, "*know* is a state verb → present perfect simple, with *for*."),
    ],
  },
  {
    track: "intermediate",
    slug: "past-continuous-and-past-perfect",
    title: "Past continuous and past perfect",
    summary: "“Was doing” sets the scene; “had done” shows what happened even earlier.",
    pro: false,
    minutes: 6,
    sections: [
      {
        heading: "Past continuous: the background",
        text: "**was / were + -ing** — a longer action in progress, often cut by a short one.",
        visual: timeline(
          [span(15, 58, "was cooking", { tone: "violet", side: "top" }), pt(38, "the phone rang", { side: "bottom" })],
          { now: 88 },
        ),
        examples: [
          ex("I was cooking when the phone rang."),
          ex("While we were watching the match, the power went off."),
          ex("At 8 pm yesterday, she was driving home."),
        ],
      },
      {
        heading: "Past perfect: the earlier past",
        text: "**had + V3** — of two past events, the one that happened first.",
        visual: timeline(
          [pt(22, "the train had left", { tone: "violet", side: "top" }), pt(55, "we reached the station", { side: "bottom" })],
          { now: 88 },
        ),
        examples: [
          ex("When we reached the station, the train had left."),
          ex("She had already eaten, so she didn't join us."),
          ex("I had never seen snow before I went to Manali."),
        ],
      },
      {
        heading: "Side by side",
        visual: formula([
          f("S:subject|H:was / were|V:verb + -ing", "They **were playing** cricket.", "Past continuous"),
          f("S:subject|H:had|V:past participle (V3)", "He **had finished** the report.", "Past perfect"),
        ]),
        examples: [
          ex("When I arrived, they had started the meeting.", undefined, "They started first; I arrived later."),
          ex("When I arrived, they started the meeting.", undefined, "I arrived first; then they started."),
        ],
        tip: "Indian English often uses *had* for a simple past: *I had gone to Delhi last week*. With one past event, say *I went*.",
      },
    ],
    quiz: [
      q("I ___ a shower when you called.", ["had", "was having", "have had"], 1, "An action in progress, interrupted → past continuous."),
      q("When we got to the cinema, the film ___.", ["already started", "had already started", "has already started"], 1, "It started before we got there → past perfect."),
      q("Which sentence means the meeting began *before* I arrived?", ["When I arrived, they started the meeting.", "When I arrived, they had started the meeting."], 1, "*had started* = earlier than my arrival."),
    ],
  },
  {
    track: "intermediate",
    slug: "modals",
    title: "Modals: can, could, may, might, must, should",
    summary: "Small helpers for ability, permission, advice, rules — and how sure you are.",
    pro: false,
    minutes: 6,
    seoTitle: "Modal verbs (can, could, may, might, must, should): rules and examples",
    sections: [
      {
        heading: "One shape for all",
        text: "Modal + **base verb**. No -s, no *to*, and it never changes.",
        visual: formula([
          f("S:subject|H:modal|V:base verb", "She **can speak** four languages."),
          f("S:subject|H:modal + not|V:base verb", "You **shouldn't worry**.", "Negative"),
          f("H:modal|S:subject|V:base verb", "**Could** you **help** me?", "Question"),
        ]),
        examples: [ex("He can drive.", "He can drives."), ex("You must wear a helmet.", "You must to wear a helmet.")],
      },
      {
        heading: "What each one does",
        visual: table(
          ["Modal", "Job", "Example"],
          [
            ["can", "ability, permission", "I **can** swim."],
            ["could", "past ability, polite request", "**Could** you open the window?"],
            ["may", "formal permission, possibility", "**May** I come in?"],
            ["might", "small possibility", "It **might** rain."],
            ["must", "strong rule, being sure", "You **must** carry ID."],
            ["should", "advice", "You **should** rest."],
          ],
        ),
        tip: "*You may send the file* sounds like you're giving permission. To ask, say *Could you send the file?*",
      },
      {
        heading: "How sure are you?",
        visual: scale("not sure", "very sure", [
          ["It must be Rahul.", 95, "almost certain"],
          ["It may be Rahul.", 50, "maybe"],
          ["It might / could be Rahul.", 35, "possible"],
          ["It can't be Rahul.", 4, "sure it's not him"],
        ]),
        examples: [
          ex("Someone's at the door. It might be the courier."),
          ex("He can't be at home — I just saw him at the office."),
        ],
      },
    ],
    quiz: [
      q("You ___ smoke here. It's against the rules.", ["mustn't", "might not", "could"], 0, "*mustn't* = it is not allowed."),
      q("She can ___ three languages.", ["speaks", "speak", "to speak"], 1, "Modal + base verb."),
      q("Take an umbrella. It ___ rain later.", ["must", "might", "can't"], 1, "A possibility, not a certainty → *might*."),
    ],
  },
  {
    track: "intermediate",
    slug: "conditionals",
    title: "Conditionals: zero, first, second",
    summary: "If + result: facts, real future chances and imaginary situations.",
    pro: false,
    minutes: 6,
    seoTitle: "Zero, first and second conditionals: rules and examples",
    sections: [
      {
        heading: "Three patterns",
        visual: formula(
          [
            f("L:If + present|X(result):present", "If you heat ice, it melts.", "Zero — always true"),
            f("L:If + present|H(result):will + verb", "If it rains, we'll stay home.", "First — real future chance"),
            f("L:If + past|H(result):would + verb", "If I had a car, I'd drive to work.", "Second — imaginary / unlikely"),
          ],
          { join: "→" },
        ),
      },
      {
        heading: "How likely is it?",
        visual: scale("imaginary", "always true", [
          ["If you heat ice, it melts.", 100, "zero"],
          ["If it rains, we'll stay home.", 60, "first"],
          ["If I won the lottery, I'd travel the world.", 8, "second"],
        ]),
        examples: [ex("If I were you, I'd apply.", undefined, "*If I were you* = friendly advice (second conditional).")],
      },
      {
        heading: "No will after if",
        visual: transform("✗ Common slip", "✓ Correct", [
          ["If it **will rain**, we'll cancel.", "If it **rains**, we'll cancel."],
          ["If I **would have** time, I'd learn music.", "If I **had** time, I'd learn music."],
        ]),
        tip: "Hindi *agar … toh* → English needs no *toh*: *If you call, I'll come.*",
      },
    ],
    quiz: [
      q("If you ___ water to 100 °C, it boils.", ["heat", "will heat", "heated"], 0, "A fact → zero conditional: present + present."),
      q("If it ___ tomorrow, we'll stay at home.", ["will rain", "rains", "rained"], 1, "First conditional: *if* + present, then *will*."),
      q("If I ___ rich, I would buy a farm.", ["am", "were", "will be"], 1, "Imaginary → *if* + past (*were*)."),
    ],
  },
  {
    track: "intermediate",
    slug: "passive-voice",
    title: "Passive voice",
    summary: "When the action matters more than who did it: be + past participle.",
    pro: false,
    minutes: 5,
    sections: [
      {
        heading: "Active → passive",
        text: "The object moves to the front, and the verb becomes **be + V3**.",
        visual: transform("Active", "Passive", [
          ["Rahul **wrote** the report.", "The report **was written** by Rahul."],
          ["They **built** this temple in 1100.", "This temple **was built** in 1100."],
          ["Someone **stole** my bike.", "My bike **was stolen**."],
        ]),
      },
      {
        heading: "Every tense, same idea",
        visual: table(
          ["Tense", "Passive"],
          [
            ["present", "English **is spoken** here."],
            ["past", "The match **was cancelled**."],
            ["present perfect", "Your order **has been shipped**."],
            ["future", "Results **will be announced** on Friday."],
            ["modal", "Forms **must be submitted** by 5 pm."],
          ],
        ),
        examples: [ex("The bridge was built in 2010.", "The bridge was build in 2010.", "Use the past participle (V3).")],
      },
      {
        heading: "When to use it",
        visual: blocks(["S(new subject):The results|H:will be|V:announced|T:tomorrow", "S(new subject):Tea|H:is|V:grown|P:in Assam"]),
        examples: [
          ex("Tea is grown in Assam.", undefined, "Who grows it doesn't matter."),
          ex("I made a mistake.", undefined, "Owning it? Active is clearer and more honest."),
        ],
        tip: "Office emails often overuse passive (*It is requested that…*). Active is friendlier: *Please send…*",
      },
    ],
    quiz: [
      q("Passive of *They clean the rooms daily*:", ["The rooms are cleaned daily.", "The rooms is cleaned daily.", "The rooms cleaned daily."], 0, "*rooms* (plural) + *are* + V3."),
      q("The results ___ next week.", ["will announce", "will be announced", "will announced"], 1, "Future passive: *will be* + V3."),
      q("This bridge ___ in 1990.", ["built", "was built", "was build"], 1, "Past passive: *was* + V3 (*built*)."),
    ],
  },
  {
    track: "intermediate",
    slug: "reported-speech",
    title: "Reported speech",
    summary: "Tell someone what another person said: shift tense, pronouns and time words.",
    pro: false,
    minutes: 6,
    sections: [
      {
        heading: "Step back one tense",
        text: "After a past reporting verb (*said, told*), move the tense one step back.",
        visual: transform("Direct", "Reported", [
          ["Priya: “I **am** tired.”", "Priya said she **was** tired."],
          ["Rahul: “I **will** call you.”", "Rahul said he **would** call me."],
          ["Mum: “I **have** finished.”", "Mum said she **had** finished."],
          ["He: “I **can** help.”", "He said he **could** help."],
        ]),
        examples: [ex("He said he is from Surat.", undefined, "Still true now? You may keep the present tense.")],
      },
      {
        heading: "Time and place words move too",
        visual: table(
          ["Direct", "Reported (later)"],
          [
            ["today", "that day"],
            ["tomorrow", "the next day"],
            ["yesterday", "the day before"],
            ["now", "then"],
            ["here", "there"],
          ],
        ),
        examples: [ex("She said she would come the next day.", "She said she will come tomorrow.", "Reporting on a later day? Shift *tomorrow* too.")],
      },
      {
        heading: "say vs tell · reported questions",
        visual: peer(
          ["say", "tell"],
          [
            ["say **something**", "tell **someone** something"],
            ["She said (that) she was busy.", "She told **me** (that) she was busy."],
          ],
        ),
        examples: [
          ex("He asked where I lived.", "He asked where did I live.", "Reported questions use statement order."),
          ex("She asked if I was free.", undefined, "Yes/no question → *if* or *whether*."),
        ],
        tip: "*He told that…* is a common slip — *tell* needs a person: *He told **me** that…*",
      },
    ],
    quiz: [
      q("“I am busy,” she said. → She said she ___ busy.", ["is", "was", "were"], 1, "Step back one tense: *am* → *was*."),
      q("Pick the correct sentence.", ["He said me he was late.", "He told me he was late.", "He told he was late."], 1, "*tell* + person; *say* has no person after it."),
      q("“Where do you work?” → She asked me where ___.", ["did I work", "I worked", "do I work"], 1, "Reported questions use statement order."),
    ],
  },
  {
    track: "intermediate",
    slug: "gerund-vs-infinitive",
    title: "Gerund vs infinitive",
    summary: "“Enjoy doing” or “want to do”? The first verb decides.",
    pro: false,
    minutes: 5,
    seoTitle: "Gerund vs infinitive (-ing or to): rules and examples",
    sections: [
      {
        heading: "Which verbs take which",
        visual: peer(
          ["verb + -ing", "verb + to + verb"],
          [
            ["enjoy, finish, avoid", "want, need, decide"],
            ["mind, suggest, keep", "hope, plan, agree"],
            ["practise, consider, miss", "promise, refuse, learn"],
          ],
        ),
        examples: [
          ex("I enjoy cooking.", "I enjoy to cook."),
          ex("She decided to leave.", "She decided leaving."),
          ex("Would you mind waiting?", "Would you mind to wait?"),
        ],
      },
      {
        heading: "After a preposition: always -ing",
        visual: blocks([
          "S:She|V:is good|L(preposition):at|V(-ing):solving|O:puzzles",
          "S:Thanks|L(preposition):for|V(-ing):helping|O:me",
          "S:I|V:look forward|L(preposition):to|V(-ing):meeting|O:you",
        ]),
        examples: [ex("I look forward to meeting you.", "I look forward to meet you.", "Here *to* is a preposition, so -ing follows.")],
        tip: "*Looking forward to hear from you* is common in Indian emails — it should be *to hearing*.",
      },
      {
        heading: "Same verb, new meaning",
        visual: peer(
          ["+ -ing", "+ to"],
          [
            ["I stopped **smoking**. (quit)", "I stopped **to buy** chai. (paused in order to)"],
            ["I remember **locking** the door. (a memory)", "Remember **to lock** the door. (a task)"],
            ["**Try restarting** it. (an experiment)", "I tried **to lift** it. (an effort)"],
          ],
        ),
      },
    ],
    quiz: [
      q("I enjoy ___ cricket.", ["to play", "playing", "play"], 1, "*enjoy* + -ing."),
      q("We decided ___ a taxi.", ["taking", "to take", "take"], 1, "*decide* + to + verb."),
      q("I'm looking forward to ___ you.", ["see", "seeing", "saw"], 1, "*to* is a preposition here → -ing."),
    ],
  },
  {
    track: "intermediate",
    slug: "relative-clauses",
    title: "Relative clauses: who, which, that, whose",
    summary: "Join two sentences by describing a noun with who, which, that or whose.",
    pro: false,
    minutes: 5,
    sections: [
      {
        heading: "Two sentences → one",
        visual: transform("Two sentences", "One sentence", [
          ["I have a friend. **She** lives in Goa.", "I have a friend **who** lives in Goa."],
          ["This is the phone. I bought **it** yesterday.", "This is the phone **(that)** I bought yesterday."],
          ["That's the man. **His** car was stolen.", "That's the man **whose** car was stolen."],
        ]),
      },
      {
        heading: "Which word?",
        visual: table(
          ["Word", "For", "Example"],
          [
            ["who", "people", "the doctor **who** helped me"],
            ["which", "things, animals", "the train **which** leaves at 6"],
            ["that", "people or things", "the book **that** I lent you"],
            ["whose", "belonging", "the girl **whose** bag is missing"],
            ["where", "places", "the café **where** we met"],
          ],
        ),
        examples: [
          ex("The man who called you is my uncle.", "The man which called you is my uncle."),
          ex("The laptop that I use is old.", "The laptop that I use it is old.", "*that* already replaces *it*."),
        ],
        tip: "Hindi *jo … vo* needs both words; English doesn't — so no extra *it*: *the book which I bought*.",
      },
      {
        heading: "Commas = extra information",
        text: "With commas, the clause is a bonus fact — and you can't use *that*.",
        visual: blocks(["S:Mumbai|X(extra info):, which is on the coast,|V:is|C:humid"]),
        examples: [
          ex("My brother, who lives in Dubai, is visiting.", undefined, "I have one brother; the clause is extra."),
          ex("My brother who lives in Dubai is visiting.", undefined, "No commas: I have more than one — this one."),
          ex("Mumbai, which is on the coast, is humid.", "Mumbai, that is on the coast, is humid."),
        ],
      },
    ],
    quiz: [
      q("The woman ___ lives next door is a pilot.", ["which", "who", "whose"], 1, "A person → *who* (or *that*)."),
      q("That's the student ___ laptop was stolen.", ["who", "whose", "which"], 1, "Belonging → *whose*."),
      q("Pick the correct sentence.", ["This is the phone which I bought it.", "This is the phone which I bought.", "This is the phone who I bought."], 1, "*which* replaces *it*, and phones take *which/that*."),
    ],
  },
  {
    track: "intermediate",
    slug: "comparatives-and-superlatives",
    title: "Comparatives and superlatives",
    summary: "Bigger, more careful, the best: compare two things or pick the top one.",
    pro: false,
    minutes: 5,
    sections: [
      {
        heading: "Build the forms",
        visual: table(
          ["Adjective", "Compare two", "The top"],
          [
            ["tall (short word)", "tall**er** than", "the tall**est**"],
            ["busy (-y)", "bus**ier** than", "the bus**iest**"],
            ["big (double the last letter)", "bi**gger** than", "the bi**ggest**"],
            ["expensive (long)", "**more** expensive than", "the **most** expensive"],
            ["good / bad", "**better / worse** than", "the **best / worst**"],
          ],
        ),
        examples: [ex("She is taller than me.", "She is more taller than me.", "Never *more* + -er.")],
      },
      {
        heading: "See the comparison",
        visual: scale("cheap", "expensive", [
          ["Roadside chai — ₹15", 12],
          ["Café chai — ₹120", 55, "more expensive than roadside chai"],
          ["Hotel chai — ₹250", 100, "the most expensive"],
        ]),
        examples: [ex("Café chai is more expensive than roadside chai."), ex("Hotel chai is the most expensive.")],
        tip: "Hindi *mujhse bada* → *older **than** me* — not *older from me* or *older to me*.",
      },
      {
        heading: "Equal or not: as … as",
        visual: formula([
          f("S:A|V:is|X:as + adjective + as|O:B", "My phone is **as fast as** yours.", "Equal"),
          f("S:A|V:isn't|X:as + adjective + as|O:B", "The test **wasn't as hard as** I expected.", "Less"),
        ]),
        examples: [ex("Rahul is as tall as his father.", "Rahul is as taller as his father.")],
      },
    ],
    quiz: [
      q("Delhi is ___ than Shimla in June.", ["hot", "hotter", "hottest"], 1, "Two places → comparative + *than*."),
      q("This is ___ film I've ever seen.", ["the better", "the best", "the most good"], 1, "The top of all → superlative *the best*."),
      q("Pick the correct sentence.", ["She is more smarter than me.", "She is smarter than me.", "She is smarter from me."], 1, "Short adjective + -er, then *than*."),
    ],
  },
  {
    track: "intermediate",
    slug: "phrasal-verbs",
    title: "Phrasal verbs for daily life",
    summary: "Verb + small word = new meaning. The ones you hear every day.",
    pro: true,
    minutes: 6,
    sections: [
      {
        heading: "Verb + particle = new meaning",
        text: "The small word changes the meaning — learn each one as a single unit.",
        visual: blocks([
          "V:look|L(particle):after|X(means):take care of",
          "V:give|L(particle):up|X(means):stop trying",
          "V:run|L(particle):out of|X(means):have none left",
        ]),
        examples: [ex("Who looks after your grandmother?"), ex("We ran out of milk.")],
      },
      {
        heading: "Morning to night",
        visual: table(
          ["Phrasal verb", "Means", "Example"],
          [
            ["wake up", "stop sleeping", "I **wake up** at 6."],
            ["get up", "get out of bed", "I **get up** at 6:15."],
            ["put on", "start wearing", "**Put on** a jacket."],
            ["take off", "remove (clothes)", "**Take off** your shoes."],
            ["turn on / off", "start / stop a device", "**Turn off** the AC."],
            ["pick up", "collect", "I'll **pick** you **up** at 8."],
            ["set off", "start a journey", "We **set off** early."],
          ],
        ),
      },
      {
        heading: "Where does the object go?",
        text: "A noun can go before or after the particle. A pronoun (*it, him, her*) must go in the middle.",
        visual: transform("Noun", "Pronoun", [
          ["Turn off **the light**. / Turn **the light** off.", "Turn **it** off."],
          ["Pick up **Priya**. / Pick **Priya** up.", "Pick **her** up."],
        ]),
        examples: [ex("Turn it off.", "Turn off it.")],
      },
      {
        heading: "Office favourites",
        visual: table(
          ["Phrasal verb", "Means", "Example"],
          [
            ["follow up (on)", "check again later", "I'll **follow up** on Friday."],
            ["set up", "arrange, create", "Let's **set up** a call."],
            ["carry on", "continue", "Please **carry on**."],
            ["put off", "postpone", "They **put off** the launch."],
            ["figure out", "understand, solve", "We'll **figure** it **out**."],
            ["back up", "copy data; support", "**Back up** your files."],
          ],
        ),
        tip: "Instead of *prepone*, say *bring forward*: *Can we bring the meeting forward to 3?*",
      },
    ],
    quiz: [
      q("We've ___ sugar. Can you buy some?", ["run out of", "run over", "run into"], 0, "*run out of* = have none left."),
      q("Please ___ the fan; it's cold.", ["turn off", "turn out", "turn up"], 0, "*turn off* = stop a device."),
      q("Pick the correct sentence.", ["Pick up her at 8.", "Pick her up at 8.", "Pick up at 8 her."], 1, "Pronouns go between the verb and the particle."),
    ],
  },
  {
    track: "intermediate",
    slug: "linking-words",
    title: "Linking words: however, although, despite, therefore",
    summary: "Join ideas smoothly — with the right grammar and commas for each linker.",
    pro: true,
    minutes: 6,
    seoTitle: "Linking words (however, although, despite, therefore): rules and examples",
    sections: [
      {
        heading: "Four jobs",
        visual: table(
          ["Job", "Linkers"],
          [
            ["add", "and, also, in addition, moreover"],
            ["contrast", "but, however, although, despite"],
            ["result", "so, therefore, as a result"],
            ["reason", "because, since, due to"],
          ],
        ),
        examples: [ex("It was raining, so we stayed in."), ex("The flight was late; however, we made the meeting.")],
      },
      {
        heading: "although vs despite",
        visual: formula([
          f("L:Although|S:subject|V:verb …", "**Although** it was raining, we played.", "Although + clause"),
          f("L:Despite|O:noun / -ing …", "**Despite** the rain, we played.", "Despite + noun"),
        ]),
        examples: [
          ex("Despite the traffic, she arrived on time.", "Despite of the traffic, she arrived on time.", "No *of* after *despite* (but: *in spite of*)."),
          ex("Although he was tired, he finished.", "Although he was tired, but he finished.", "One linker is enough — drop *but*."),
        ],
        tip: "Hindi *halaanki … lekin* uses two words; English uses one: *Although it's late, we'll go.*",
      },
      {
        heading: "however and therefore: the commas",
        text: "They start a new sentence (or follow a semicolon), with a comma after.",
        visual: blocks([
          "X(sentence 1):Sales fell.|L:However,|X(sentence 2):profits rose.",
          "X(sentence 1):The road was closed;|L:therefore,|X(sentence 2):we took the highway.",
        ]),
        examples: [ex("The plan is good. However, it's expensive.", "The plan is good, however it's expensive.")],
      },
      {
        heading: "Formal or everyday?",
        visual: scale("chat", "formal writing", [
          ["but · so · also", 15, "messages, conversation"],
          ["however · therefore", 60, "emails, reports"],
          ["nevertheless · consequently · moreover", 92, "formal reports, essays"],
        ]),
      },
    ],
    quiz: [
      q("___ the heat, the players kept going.", ["Although", "Despite", "However"], 1, "*despite* + noun (*the heat*)."),
      q("Pick the correct sentence.", ["Although she was ill, but she came.", "Although she was ill, she came.", "Despite she was ill, she came."], 1, "*although* + clause, and no extra *but*."),
      q("The shop was closed. ___, we ordered online.", ["Therefore", "Although", "Despite"], 0, "A result → *therefore*."),
    ],
  },
];
