import "server-only";

import { ex, f, formula, peer, q, scale, table, transform } from "./build";
import type { Lesson } from "./types";

// Speaking & Career track — the first lesson is free, the rest are Pro.
export const CAREER: Lesson[] = [
  {
    track: "career",
    slug: "small-talk",
    title: "Small talk that works",
    summary: "Start, keep and end light conversations — at work, events and on calls.",
    pro: false,
    minutes: 5,
    seoTitle: "Small talk in English: phrases and examples",
    sections: [
      {
        heading: "The 3-step loop",
        text: "Ask, react, share — then repeat. That's a conversation.",
        visual: formula(
          [
            f(
              "Q(1):Ask an open question|C(2):React + follow up|S(3):Share something small",
              "*How was your weekend?* → *Oh, nice! Where did you go?* → *We went to Lonavala last month too.*",
            ),
          ],
          { join: "→" },
        ),
        examples: [ex("How was your weekend?"), ex("Oh, nice! What did you do?"), ex("I did something similar — we went to Lonavala.")],
      },
      {
        heading: "Safe topics",
        visual: peer(
          ["✓ Safe to start", "✗ Wait until they share"],
          [
            ["weather, traffic", "salary"],
            ["the weekend, food", "marriage plans, age"],
            ["travel, films, cricket", "religion, politics"],
            ["work projects", "weight, looks"],
          ],
        ),
        tip: "*Are you married?* and *What's your salary?* are everyday questions in many Indian settings, but feel personal to others.",
      },
      {
        heading: "Open, not closed, questions",
        text: "Yes/no questions stop the talk. Open questions keep it going.",
        visual: transform("Closed (yes/no)", "Open", [
          ["Did you like Goa?", "What did you like most about Goa?"],
          ["Is work busy?", "What are you working on these days?"],
          ["Do you like cricket?", "Who's your favourite player right now?"],
        ]),
      },
      {
        heading: "Leave politely",
        examples: [
          ex("It was great talking to you — I'd better get back to work."),
          ex("I'll let you go. See you at the meeting!"),
          ex("Let's catch up over chai sometime."),
        ],
      },
    ],
    quiz: [
      q("Which question keeps the conversation going?", ["Did you have a good weekend?", "What did you get up to at the weekend?", "Weekend?"], 1, "An open question invites a longer answer."),
      q("Which topic is safest with a new colleague?", ["their salary", "the weekend", "their weight"], 1, "Light, shared topics are safest at first."),
      q("Best way to end small talk?", ["OK, bye.", "It was lovely chatting — I'd better get back to my desk.", "I'm bored now."], 1, "Give a friendly reason to leave."),
    ],
  },
  {
    track: "career",
    slug: "job-interview-star",
    title: "Job interview answers with STAR",
    summary: "Answer “Tell me about a time…” with Situation, Task, Action, Result.",
    pro: true,
    minutes: 7,
    seoTitle: "Job interview answers with the STAR method: phrases and examples",
    sections: [
      {
        heading: "STAR in one line",
        text: "*Tell me about a time…* questions want a short story. STAR keeps it tight.",
        visual: formula(
          [
            f(
              "S(S):Situation|T(T):Task|V(A):Action|C(R):Result",
              "Our app crashed a week before launch → I had to fix it in two days → I split the bugs by priority and ran daily check-ins → We launched on time with 80% fewer crashes.",
            ),
          ],
          { join: "→" },
        ),
        examples: [ex("Tell me about a time you handled pressure.", undefined, "A classic STAR question.")],
      },
      {
        heading: "Phrases for each part",
        visual: table(
          ["Part", "Useful phrases"],
          [
            ["Situation", "*In my last role at…* · *During my final-year project…*"],
            ["Task", "*My job was to…* · *I was responsible for…*"],
            ["Action", "*First, I… Then I…* · *I decided to…*"],
            ["Result", "*As a result, …* · *This cut costs by 20%.*"],
          ],
        ),
        tip: "Say *I*, not only *we* — the interviewer wants your part: *I set up…*, *I spoke to the client…*",
      },
      {
        heading: "Strong openers",
        visual: table(
          ["Question", "Start like this"],
          [
            ["Tell me about yourself.", "*I'm a … with … years in …; most recently I…*"],
            ["Why should we hire you?", "*You need someone who… — I've done exactly that at…*"],
            ["What's your weakness?", "*I used to… so now I…*"],
            ["Where do you see yourself in five years?", "*Growing into… — ideally leading…*"],
          ],
        ),
        examples: [
          ex(
            "I'm Rahul, a software tester with three years' experience in banking apps.",
            "Myself Rahul, I am from Nagpur, I completed my B.Tech in 2021…",
            "Lead with your role and strength, not your biodata. Say *I'm Rahul*, not *Myself Rahul*.",
          ),
        ],
      },
      {
        heading: "Make results concrete",
        visual: transform("Weak", "Strong", [
          ["I worked on sales.", "I **grew** monthly sales **by 15%** in six months."],
          ["I helped the team.", "I **trained** four new joiners and **cut** onboarding time **in half**."],
          ["I did the project.", "I **led** a five-person project that **launched on time**."],
        ]),
      },
    ],
    quiz: [
      q("In STAR, where should you spend the most time?", ["Situation", "Action", "Result"], 1, "The *Action* shows what *you* did — it's the heart of the answer."),
      q("Best way to start *Tell me about yourself*?", ["Myself Priya, from Indore.", "I'm Priya, a chartered accountant with four years in audit.", "I was born in 1998."], 1, "Name, role and strength first."),
      q("Which result sounds strongest?", ["I did the work well.", "I cut report time from three days to one.", "We tried our best."], 1, "Numbers make results real."),
    ],
  },
  {
    track: "career",
    slug: "professional-emails",
    title: "Professional emails",
    summary: "Clear subject, one purpose, polite close — emails people actually answer.",
    pro: true,
    minutes: 6,
    seoTitle: "Professional email phrases and examples",
    sections: [
      {
        heading: "The shape of a good email",
        visual: table(
          ["Part", "Example"],
          [
            ["Subject", "Invoice #214 – payment due 5 May"],
            ["Greeting", "Hi Priya, · Dear Mr Rao,"],
            ["Purpose", "I'm writing about invoice #214."],
            ["Details", "It was due on 30 April, and we haven't received payment yet."],
            ["Ask", "Could you confirm the payment date by Friday?"],
            ["Close", "Thanks, · Best regards, Rahul"],
          ],
        ),
      },
      {
        heading: "Fresh, not old-fashioned",
        visual: transform("Old-fashioned", "Fresh", [
          ["Kindly find attached the file.", "I've attached the file."],
          ["Kindly revert at the earliest.", "Could you reply by Thursday?"],
          ["Please do the needful.", "Could you approve the leave request?"],
          ["PFA.", "I've attached the report."],
        ]),
        tip: "To most readers, *revert* means *go back to an earlier state*. For answers, say *reply*.",
      },
      {
        heading: "Greetings and sign-offs",
        visual: scale("casual", "formal", [
          ["Hi Rahul, … Cheers,", 18],
          ["Hi Rahul, … Thanks,", 38],
          ["Hello Mr Rao, … Best regards,", 64],
          ["Dear Mr Rao, … Yours sincerely,", 94],
        ]),
        tip: "*Respected Sir* is common in India but reads old-fashioned abroad — *Dear Mr Rao* is always safe.",
      },
      {
        heading: "Lines you'll use every week",
        visual: table(
          ["Purpose", "Line"],
          [
            ["follow up", "Just following up on my email from Monday."],
            ["ask", "Could you let me know by Friday?"],
            ["apologise", "Sorry for the late reply."],
            ["need time", "Could I send it by Wednesday instead?"],
            ["close", "Let me know if you have any questions."],
          ],
        ),
      },
    ],
    quiz: [
      q("Which ending is clearest?", ["Kindly revert.", "Could you reply by Friday?", "Do the needful."], 1, "It names the action and the deadline."),
      q("Best formal greeting when you know the name?", ["Respected Sir,", "Dear Ms Iyer,", "Hey Iyer,"], 1, "*Dear* + title + surname."),
      q("Which subject line is best?", ["Hi", "Urgent!!!", "Leave request: 12–14 June"], 2, "It says what the email is about."),
    ],
  },
  {
    track: "career",
    slug: "meetings-and-presentations",
    title: "Meetings and presentations",
    summary: "Open, disagree politely, interrupt and close — the phrases that run a meeting.",
    pro: true,
    minutes: 6,
    seoTitle: "Meeting and presentation phrases in English with examples",
    sections: [
      {
        heading: "Run a meeting",
        visual: table(
          ["Stage", "Phrase"],
          [
            ["open", "Thanks for joining — let's get started."],
            ["agenda", "We've got three things to cover today."],
            ["move on", "Let's move on to the budget."],
            ["actions", "So, Priya will send the draft by Monday."],
            ["close", "Great, that's everything. Thanks, all."],
          ],
        ),
      },
      {
        heading: "Agree and disagree politely",
        visual: scale("disagree", "agree", [
          ["I completely agree.", 96],
          ["That's a good point.", 75],
          ["I see what you mean, but…", 45],
          ["I'm not sure that works, because…", 25],
          ["I'm afraid I disagree.", 8],
        ]),
        tip: "In global meetings, silence can read as agreement — say *Can I add something?* instead of waiting to be asked.",
      },
      {
        heading: "Interrupt, clarify, check",
        visual: table(
          ["Need", "Phrase"],
          [
            ["interrupt", "Sorry to jump in — can I add something?"],
            ["keep your turn", "If I could just finish my point…"],
            ["clarify", "Just to clarify, do you mean…?"],
            ["didn't hear", "Sorry, you cut out — could you repeat that?"],
            ["online", "You're on mute. · Can everyone see my screen?"],
          ],
        ),
      },
      {
        heading: "Presentations: signposts",
        visual: formula(
          [f("X(start):Today I'll cover three things.|L(next):Moving on to…|O(show):As you can see…|C(end):To sum up, …")],
          { join: "→" },
        ),
        examples: [ex("As you can see from this chart, sales doubled in Q3."), ex("Happy to take any questions.")],
      },
    ],
    quiz: [
      q("A polite way to interrupt?", ["Stop, listen to me.", "Sorry to jump in — can I add something?", "Wait wait wait."], 1, "Apologise briefly, then ask."),
      q("Which phrase disagrees politely?", ["You're wrong.", "I see your point, but I'm not sure it works for us.", "No way."], 1, "Acknowledge first, then give your view."),
      q("Best way to move to the next topic?", ["Next.", "Let's move on to the budget.", "Finished, now budget."], 1, "*Let's move on to…* is the standard signpost."),
    ],
  },
  {
    track: "career",
    slug: "ielts-speaking",
    title: "IELTS Speaking: Parts 1–3",
    summary: "What each part tests, how long to speak, and how to extend answers.",
    pro: true,
    minutes: 7,
    seoTitle: "IELTS Speaking Part 1, 2 and 3: strategy and examples",
    sections: [
      {
        heading: "The three parts",
        text: "About 11–14 minutes, face to face with an examiner.",
        visual: table(
          ["Part", "What happens", "Aim for"],
          [
            ["1 · Interview", "questions on familiar topics: home, work, hobbies", "2–3 sentences each"],
            ["2 · Long turn", "a cue card, 1 minute to prepare", "speak up to 2 minutes"],
            ["3 · Discussion", "wider questions linked to Part 2", "4–5 sentences, with reasons"],
          ],
        ),
      },
      {
        heading: "Extend every answer: A → R → E",
        visual: formula(
          [
            f(
              "C(A):Answer|L(R):Reason|O(E):Example",
              "*Do you like cooking?* **Yes, I do** → **it relaxes me after work** → **on Sundays I make biryani for my family.**",
            ),
          ],
          { join: "→" },
        ),
        examples: [ex("Yes, I do — mostly because it helps me relax. On Sundays I usually cook for my family.", "Yes.", "One-word answers can't show your range.")],
        tip: "Don't memorise answers — examiners notice, and a memorised script sounds flat.",
      },
      {
        heading: "Part 2: plan in one minute",
        visual: formula(
          [f("X(1):What it is|T(2):When / where|V(3):What happened|C(4):Why it matters to you")],
          { join: "→", caption: "Jot one or two words for each step — not full sentences." },
        ),
        examples: [ex("I'd like to talk about Marine Drive in Mumbai, which I visit most weekends.", undefined, "A clear first line.")],
      },
      {
        heading: "Part 3: opinions with reasons",
        visual: table(
          ["Move", "Phrase"],
          [
            ["give a view", "I'd say… · In my view, …"],
            ["compare", "Compared to twenty years ago, …"],
            ["balance", "On the other hand, …"],
            ["speculate", "It's likely that… · I suppose…"],
            ["buy time", "That's an interesting question — let me think."],
          ],
        ),
        tip: "*Basically* and *actually* in every sentence hurt fluency — a short, calm pause sounds better.",
      },
    ],
    quiz: [
      q("How long can you speak in Part 2?", ["30 seconds", "up to 2 minutes", "5 minutes"], 1, "One minute to prepare, then up to two minutes."),
      q("Best Part 1 answer to *Do you like reading?*", ["Yes.", "Yes, especially thrillers — they help me switch off after work.", "Reading is the process of understanding text."], 1, "Answer + reason, naturally."),
      q("What does Part 3 test?", ["Reading aloud", "Discussing wider ideas with reasons", "Grammar multiple choice"], 1, "Part 3 is a two-way discussion of abstract questions."),
    ],
  },
  {
    track: "career",
    slug: "pronunciation-for-indian-speakers",
    title: "Pronunciation for Indian speakers",
    summary: "Fix v/w, th, word stress, the schwa and silent letters.",
    pro: true,
    minutes: 7,
    drill: "pronunciation",
    seoTitle: "English pronunciation tips for Indian speakers",
    sections: [
      {
        heading: "v and w are different sounds",
        text: "Hindi *व* sits between them. English keeps them apart.",
        visual: peer(
          ["v — top teeth on bottom lip", "w — round lips, no teeth"],
          [
            ["**v**est", "**w**est"],
            ["**v**ine", "**w**ine"],
            ["**v**et", "**w**et"],
            ["**v**eil", "**w**ail"],
          ],
        ),
        examples: [ex("We went to a very nice village.", undefined, "w · w · v · v — say it slowly.")],
        tip: "Touch your lip: for *v* your teeth press it; for *w* your lips push forward in a circle.",
      },
      {
        heading: "Two th sounds",
        text: "Many Indian speakers say *t / d* (*tink, dis*). Put the tongue tip lightly between the teeth.",
        visual: table(
          ["Sound", "How", "Words"],
          [
            ["th (thin)", "tongue between teeth, blow — no voice", "**th**ink, **th**ree, ba**th**"],
            ["th (this)", "same, with voice", "**th**is, **th**ey, mo**th**er"],
          ],
        ),
        examples: [ex("I think these three are free.", undefined, "Contrast: *three / tree*, *think / tink*.")],
      },
      {
        heading: "Word stress",
        text: "English leans hard on one syllable and squeezes the rest.",
        visual: table(
          ["Word", "Say"],
          [
            ["photograph", "**PHO**-to-graph"],
            ["photographer", "pho-**TO**-gra-pher"],
            ["development", "de-**VEL**-op-ment"],
            ["hotel", "ho-**TEL**"],
            ["career", "ca-**REER**"],
            ["determine", "de-**TER**-mine"],
          ],
        ),
        tip: "Indian English often gives every syllable equal weight — stress one clearly and the word becomes easy to catch.",
      },
      {
        heading: "The schwa: a quick uh",
        text: "Unstressed vowels usually become a short, lazy *uh*.",
        visual: table(
          ["Written", "Said"],
          [
            ["b**a**nan**a**", "buh-NAA-nuh"],
            ["**a**bout", "uh-BOUT"],
            ["doct**or**", "DOC-tuh"],
            ["comf**or**t**a**ble", "KUMF-tuh-bul"],
            ["a cup **of** tea", "uh CUP uhv TEA"],
          ],
        ),
      },
      {
        heading: "Silent letters",
        visual: table(
          ["Word", "Say"],
          [
            ["**w**rite · **k**now", "rite · no"],
            ["i**s**land", "EYE-lund"],
            ["We**d**nesday", "WENZ-day"],
            ["ca**l**m · wa**l**k", "kaam · wawk"],
            ["recei**p**t", "ri-SEET"],
            ["de**b**t", "det"],
          ],
        ),
        examples: [ex("I'll clear the debt on Wednesday.", undefined, "det · WENZ-day")],
      },
    ],
    quiz: [
      q("For *v*, your top teeth…", ["touch your bottom lip", "stay behind your lips", "touch your tongue"], 0, "*v* = top teeth on the bottom lip, with voice."),
      q("Where is the stress in *photographer*?", ["PHO-to-gra-pher", "pho-TO-gra-pher", "pho-to-GRA-pher"], 1, "pho-**TO**-gra-pher — it moves from *PHO-to-graph*."),
      q("Which letter is silent in *Wednesday*?", ["the W", "the first d", "the y"], 1, "It's said *WENZ-day*."),
    ],
  },
];
