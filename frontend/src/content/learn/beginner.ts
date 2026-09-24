import "server-only";

import { blocks, ex, f, formula, peer, pt, q, rep, scale, span, table, timeline, transform } from "./build";
import type { Lesson } from "./types";

// Beginner track (A1–A2) — every lesson is free.
export const BEGINNER: Lesson[] = [
  {
    track: "beginner",
    slug: "sentence-order",
    title: "Sentence order: S + V + O",
    summary: "English sentences follow one fixed order: who, does what, to what.",
    pro: false,
    minutes: 4,
    seoTitle: "English sentence order (SVO): rules and examples",
    sections: [
      {
        heading: "The basic order",
        text: "Most English sentences go **Subject → Verb → Object**. Change the order and the meaning changes.",
        visual: blocks(
          ["S:Priya|V:drinks|O:chai", "S:Rahul|V:plays|O:cricket", "S:The dog|V:bit|O:the man", "S:The man|V:bit|O:the dog"],
          "Same words, new order, new meaning.",
        ),
        examples: [ex("I like mangoes.", "I mangoes like.", "The verb comes second, right after the subject.")],
        tip: "Hindi puts the verb last (*Main chai peeta hoon*). English moves it forward: *I drink chai*.",
      },
      {
        heading: "Place first, then time",
        text: "Extra details usually come after the object: **place**, then **time**.",
        visual: blocks([
          "S:We|V:watched|O:a film|P:at Priya's house|T:last night",
          "S:Rahul|V:studies|P:in the library|T:every evening",
        ]),
        examples: [
          ex("She met her friends at the mall on Sunday.", "She met on Sunday her friends at the mall.", "Never put time between the verb and its object."),
          ex("Last night, we watched a film.", undefined, "Time can also open the sentence."),
        ],
      },
      {
        heading: "How-often words",
        text: "*always, usually, often, never* go **before the main verb** — but **after** *am / is / are*.",
        visual: blocks(["S:I|X(how often):always|V:take|O:the bus", "S:She|V:is|X(how often):never|C:late"]),
        examples: [ex("I always take the bus.", "I take always the bus."), ex("He is always on time.", undefined, "After *am / is / are*, the how-often word comes next.")],
      },
    ],
    quiz: [
      q("Which sentence has the right order?", ["Priya chai drinks.", "Drinks Priya chai.", "Priya drinks chai."], 2, "Subject (Priya) → verb (drinks) → object (chai)."),
      q("Pick the natural sentence.", ["I yesterday met Rahul.", "I met Rahul yesterday.", "I met yesterday Rahul."], 1, "Time goes at the end (or the start) — never between the verb and its object."),
      q("Pick the correct sentence.", ["She walks always to college.", "She always walks to college.", "She walks to always college."], 1, "*always* goes before the main verb."),
    ],
  },
  {
    track: "beginner",
    slug: "nouns-and-plurals",
    title: "Nouns and plurals",
    summary: "One book, two books — plus the plurals that break the rule.",
    pro: false,
    minutes: 4,
    sections: [
      {
        heading: "Most nouns: add -s",
        visual: table(
          ["Word ends in", "Do this", "Example"],
          [
            ["most letters", "+ s", "book → book**s**"],
            ["-s, -sh, -ch, -x", "+ es", "bus → bus**es**, box → box**es**"],
            ["consonant + y", "y → ies", "city → cit**ies**"],
            ["vowel + y", "+ s", "boy → boy**s**"],
            ["many -f / -fe", "→ ves", "knife → kni**ves**, leaf → lea**ves**"],
          ],
        ),
        examples: [ex("Two buses were late.", "Two bus were late."), ex("Chennai and Pune are big cities.", "Chennai and Pune are big citys.")],
      },
      {
        heading: "Irregular plurals",
        text: "A few everyday nouns change inside the word. Learn them as pairs.",
        visual: transform("One", "Many", [
          ["man", "men"],
          ["woman", "women"],
          ["child", "children"],
          ["person", "people"],
          ["foot", "feet"],
          ["tooth", "teeth"],
        ]),
        examples: [ex("Three people came.", "Three peoples came.", "*people* is already plural."), ex("The children are playing.", "The childrens are playing.")],
      },
      {
        heading: "Nouns you can't count",
        text: "Some nouns are a mass, not single items: no *a*, no *-s*.",
        visual: peer(
          ["Countable (a / -s ✓)", "Uncountable (a / -s ✗)"],
          [
            ["a suggestion → suggestions", "advice"],
            ["a job → jobs", "work"],
            ["a bag → bags", "luggage"],
            ["a chair → chairs", "furniture"],
            ["a fact → facts", "information"],
          ],
        ),
        examples: [
          ex("She gave me some good advice.", "She gave me some good advices."),
          ex("I have a lot of luggage.", "I have many luggages.", "Need a number? *three bags*, *two pieces of advice*."),
        ],
        tip: "*informations*, *equipments*, *luggages* are common in India — in standard English these never take -s.",
      },
    ],
    quiz: [
      q("What is the plural of *child*?", ["childs", "children", "childrens"], 1, "*child* → *children* is irregular."),
      q("Which is correct?", ["She has many informations.", "She has a lot of information.", "She has an information."], 1, "*information* is uncountable: no *a*, no *-s*."),
      q("What is the plural of *city*?", ["citys", "cities", "cityes"], 1, "Consonant + y → *-ies*."),
    ],
  },
  {
    track: "beginner",
    slug: "articles-a-an-the",
    title: "a / an / the",
    summary: "Choose a, an or the — or nothing — with two quick questions.",
    pro: false,
    minutes: 5,
    seoTitle: "Articles a, an and the: rules and examples",
    sections: [
      {
        heading: "a or an? Listen to the sound",
        text: "Use **an** before a vowel *sound* and **a** before a consonant *sound*. The first letter can trick you.",
        visual: peer(
          ["a + consonant sound", "an + vowel sound"],
          [
            ["a book", "an apple"],
            ["a **u**niversity (*you-*)", "an **h**our (silent h)"],
            ["a **E**uropean trip (*you-*)", "an **M**BA (*em-*)"],
            ["a **o**ne-way ticket (*wun-*)", "an **h**onest answer"],
          ],
        ),
        examples: [
          ex("She is an engineer."),
          ex("He has an MBA.", "He has a MBA.", "M is said *em* — a vowel sound."),
          ex("It's a university.", "It's an university.", "*U* here sounds like *you*."),
        ],
      },
      {
        heading: "a/an or the? New or known",
        text: "**a/an** = one of many, first mention. **the** = we both know which one.",
        visual: transform("First mention", "Next mention", [
          ["I bought **a** phone.", "**The** phone is really fast."],
          ["We saw **a** film.", "**The** film was three hours long."],
        ]),
        examples: [
          ex("Please close the door.", undefined, "There's one door here — we both know it."),
          ex("The sun rises in the east.", "Sun rises in east.", "Only one exists → *the*."),
        ],
      },
      {
        heading: "When there's no article",
        text: "No article for things *in general* (plural or uncountable) and for most names.",
        visual: peer(
          ["General → no article", "Specific → the"],
          [
            ["**Dogs** are loyal.", "**The** dogs next door bark all night."],
            ["I like **music**.", "**The** music at the wedding was loud."],
            ["**India**, **Mumbai**, **Rahul**", "**the** Ganga, **the** Himalayas, **the** USA"],
          ],
        ),
        examples: [ex("I love cricket.", "I love the cricket."), ex("She lives in India.", "She lives in the India.")],
        tip: "Hindi has no *a / an / the*, so they're easy to drop. Read aloud and say them: *a* cup of chai, *the* bus.",
      },
    ],
    quiz: [
      q("I called you ___ hour ago.", ["a", "an", "no article"], 1, "*hour* starts with a vowel sound — the h is silent."),
      q("I bought a phone. ___ phone is very light.", ["A", "The", "An"], 1, "Second mention — we both know which phone."),
      q("Pick the correct sentence.", ["She is a honest person.", "She is an honest person.", "She is honest person."], 1, "*honest* starts with a vowel sound (silent h), and a single person needs an article."),
    ],
  },
  {
    track: "beginner",
    slug: "pronouns",
    title: "Pronouns: I, me, my, mine",
    summary: "Replace names with I, me, my, mine — each form has its own job.",
    pro: false,
    minutes: 4,
    seoTitle: "Pronouns (I, me, my, mine): rules and examples",
    sections: [
      {
        heading: "One table, four jobs",
        visual: table(
          ["Subject", "Object", "Before a noun", "Alone"],
          [
            ["I", "me", "my", "mine"],
            ["you", "you", "your", "yours"],
            ["he", "him", "his", "his"],
            ["she", "her", "her", "hers"],
            ["it", "it", "its", "—"],
            ["we", "us", "our", "ours"],
            ["they", "them", "their", "theirs"],
          ],
        ),
        examples: [ex("This is **my** bag. The bag is **mine**.")],
      },
      {
        heading: "Subject or object?",
        text: "Before the verb: **I, he, she, we, they**. After the verb or a preposition: **me, him, her, us, them**.",
        visual: blocks(["S:She|V:called|O:me", "S:I|V:called|O:her"]),
        examples: [
          ex("Rahul and I went to Pune.", "Me and Rahul went to Pune.", "Test it: *I went* ✓ — *me went* ✗."),
          ex("This gift is for you and me.", "This gift is for you and I.", "After *for*, use the object form."),
        ],
        tip: "Hindi *vo* can mean he or she. English must choose: Rahul → *he*, Priya → *she*.",
      },
      {
        heading: "his / her, its / it's",
        text: "The owner decides the word — not the thing owned.",
        visual: blocks(["S:Rahul|V:lost|O(owner → his):his phone", "S:Priya|V:lost|O(owner → her):her phone"]),
        examples: [
          ex("The company changed its logo.", "The company changed it's logo.", "*it's* = it is."),
          ex("Is this pen yours?", "Is this pen your's?", "No apostrophe in *yours, hers, ours, theirs*."),
        ],
        tip: "Hindi *uska* works for both — in English, Priya's phone is *her* phone, even if you're thinking *uska*.",
      },
    ],
    quiz: [
      q("___ and Rahul are going to the match.", ["Me", "I", "Myself"], 1, "It's the subject: *I am going* → *Rahul and I are going*."),
      q("Priya lost ___ phone.", ["his", "her", "hers"], 1, "Priya is the owner → *her* (before a noun)."),
      q("The dog wagged ___ tail.", ["it's", "its", "it"], 1, "*its* shows ownership; *it's* means *it is*."),
    ],
  },
  {
    track: "beginner",
    slug: "am-is-are",
    title: "am / is / are",
    summary: "Link a person to a name, job, feeling or place with am, is, are.",
    pro: false,
    minutes: 4,
    seoTitle: "Am, is, are (the verb “be”): rules and examples",
    sections: [
      {
        heading: "Match the subject",
        visual: table(
          ["Subject", "be", "Short form"],
          [
            ["I", "am", "I'm"],
            ["he / she / it / Priya", "is", "she's, it's"],
            ["you / we / they", "are", "you're, we're"],
          ],
        ),
        examples: [ex("I am a student.", "I is a student."), ex("They are from Kerala."), ex("Rahul is tired.", "Rahul tired.", "Don't drop *is*.")],
        tip: "Hindi maps neatly: *main hoon* = I **am**, *vo hai* = he/she **is**, *ve hain* = they **are**.",
      },
      {
        heading: "What comes after",
        visual: blocks(
          ["S:Priya|V:is|C(job):a doctor", "S:I|V:am|C(feeling):hungry", "S:We|V:are|P:in Chennai", "S:The meeting|V:is|T:at 10"],
          "be + a job, a feeling, a place or a time.",
        ),
        examples: [ex("My parents are in Delhi."), ex("The shop is open.")],
      },
      {
        heading: "Negatives and questions",
        text: "Negative: add **not** after it. Question: move it to the front.",
        visual: transform("Statement", "Question", [
          ["She **is** at home.", "**Is** she at home?"],
          ["You **are** ready.", "**Are** you ready?"],
          ["I **am** late.", "**Am** I late?"],
        ]),
        examples: [
          ex("He isn't here.", "He not here."),
          ex("I'm not sure.", "I amn't sure.", "There's no *amn't* — say *I'm not*."),
        ],
      },
    ],
    quiz: [
      q("My parents ___ in Delhi.", ["is", "am", "are"], 2, "*parents* = they → *are*."),
      q("Which is correct?", ["She a teacher.", "She is a teacher.", "She are a teacher."], 1, "*she* → *is*, and it can't be dropped."),
      q("Make it a question: *He is busy.*", ["Is he busy?", "He is busy?", "Does he busy?"], 0, "Move *is* to the front."),
    ],
  },
  {
    track: "beginner",
    slug: "simple-present",
    title: "Simple present",
    summary: "Routines, facts and timetables — and don't forget the -s.",
    pro: false,
    minutes: 5,
    seoTitle: "Simple present tense: rules and examples",
    sections: [
      {
        heading: "Habits and facts",
        text: "Use it for things that repeat or are always true.",
        visual: timeline([rep(6, 94, "every day — before, now and after", { count: 9, side: "top" })], {
          now: 50,
          caption: "A habit repeats across time.",
        }),
        examples: [
          ex("Rahul plays cricket every Sunday."),
          ex("Water boils at 100 °C."),
          ex("The train leaves at 6:15.", undefined, "Timetables use it too."),
        ],
      },
      {
        heading: "he / she / it + s",
        visual: formula([
          f("S:I / you / we / they|V:verb", "I **work** in Pune."),
          f("S:he / she / it|V:verb|X(ending):-s / -es", "She **works** in Pune."),
        ]),
        examples: [
          ex("She works in an office.", "She work in an office."),
          ex("He watches the news.", undefined, "-sh, -ch, -x, -o → -es: *watches, goes, does*."),
          ex("My brother has two cars.", "My brother have two cars.", "*have* → *has*."),
        ],
        tip: "The -s is easy to drop in fast speech. Practise *she works*, *he lives* slowly until it's automatic.",
      },
      {
        heading: "Questions and negatives: do / does",
        visual: formula([
          f("H:do / does|S:subject|V:base verb", "**Does** she **work** here?", "Question"),
          f("S:subject|H:don't / doesn't|V:base verb", "He **doesn't eat** meat.", "Negative"),
        ]),
        examples: [ex("Does he like chai?", "Does he likes chai?", "*does* takes the -s, so the verb goes back to base.")],
      },
    ],
    quiz: [
      q("My sister ___ in a bank.", ["work", "works", "working"], 1, "*my sister* = she → verb + s."),
      q("___ your father drive?", ["Do", "Does", "Is"], 1, "*your father* = he → *does*."),
      q("Pick the correct sentence.", ["He don't like tea.", "He doesn't likes tea.", "He doesn't like tea."], 2, "*doesn't* + base verb."),
    ],
  },
  {
    track: "beginner",
    slug: "present-continuous",
    title: "Present continuous",
    summary: "Use am / is / are + -ing for actions happening now or around now.",
    pro: false,
    minutes: 5,
    seoTitle: "Present continuous tense: rules and examples",
    sections: [
      {
        heading: "Happening now",
        text: "It started a moment ago and hasn't finished yet.",
        visual: timeline([span(38, 72, "is talking on the phone", { side: "top" })], { now: 55 }),
        examples: [
          ex("Priya is talking on the phone."),
          ex("Look! It's raining."),
          ex("I'm working from home this week.", undefined, "Around now — not only this second."),
        ],
      },
      {
        heading: "The pattern",
        visual: formula([
          f("S:subject|H:am / is / are|V:verb + -ing", "They **are playing** cricket."),
          f("S:subject|H:am / is / are|N:not|V:verb + -ing", "He **isn't listening**.", "Negative"),
          f("H:am / is / are|S:subject|V:verb + -ing", "**Are** you **coming**?", "Question"),
        ]),
        examples: [
          ex("She is cooking dinner.", "She cooking dinner.", "Don't drop *is*."),
          ex("I'm meeting Rahul tomorrow.", undefined, "A fixed plan can use it too."),
        ],
      },
      {
        heading: "Verbs that stay simple",
        text: "State verbs — *know, want, like, need, believe, have (= own)* — usually don't take -ing.",
        visual: table(
          ["State verb", "✗ Not", "✓ Say"],
          [
            ["know", "I am knowing", "I know"],
            ["have (own)", "I am having a car", "I have a car"],
            ["want", "She is wanting tea", "She wants tea"],
            ["understand", "Are you understanding?", "Do you understand?"],
          ],
        ),
        examples: [ex("I'm having lunch.", undefined, "*have* = eat → -ing is fine.")],
        tip: "*I am knowing him since years* mixes two habits — say *I've known him for years*.",
      },
    ],
    quiz: [
      q("Listen! The baby ___.", ["cries", "is crying", "cry"], 1, "Happening right now → *is crying*."),
      q("Which is correct?", ["I am knowing the answer.", "I know the answer.", "I knowing the answer."], 1, "*know* is a state verb — no -ing."),
      q("___ you listening?", ["Do", "Are", "Is"], 1, "*you* → *are* + -ing."),
    ],
  },
  {
    track: "beginner",
    slug: "simple-past",
    title: "Simple past: regular and irregular",
    summary: "Finished actions at a finished time: walked, went, saw.",
    pro: false,
    minutes: 6,
    seoTitle: "Simple past tense (regular and irregular verbs): rules and examples",
    sections: [
      {
        heading: "Finished and gone",
        text: "The action is over, and so is the time.",
        visual: timeline([pt(25, "watched a match — last Sunday", { side: "top" })], { now: 72 }),
        examples: [
          ex("We watched a match last Sunday."),
          ex("She moved to Bengaluru in 2022."),
          ex("I called you yesterday.", "I have called you yesterday.", "A finished time (*yesterday*) needs the simple past."),
        ],
      },
      {
        heading: "Regular verbs: + ed",
        visual: table(
          ["Verb", "Rule", "Past"],
          [
            ["work", "+ ed", "work**ed**"],
            ["live", "+ d", "live**d**"],
            ["study", "y → ied", "stud**ied**"],
            ["stop", "double + ed", "sto**pped**"],
          ],
        ),
        examples: [ex("I studied late last night."), ex("They stopped the car.")],
        tip: "Say *walked* as one beat — *walkt*, not *walk-ed*. Only after t/d do you add a beat: *want-ed*.",
      },
      {
        heading: "Irregular verbs",
        text: "The most common verbs are irregular. Learn them in pairs.",
        visual: transform("Base", "Past", [
          ["go", "went"],
          ["see", "saw"],
          ["eat", "ate"],
          ["buy", "bought"],
          ["take", "took"],
          ["come", "came"],
          ["think", "thought"],
          ["write", "wrote"],
        ]),
        examples: [ex("I bought a new phone.", "I buyed a new phone."), ex("We went to Goa in May.", "We goed to Goa in May.")],
      },
      {
        heading: "Questions and negatives: did",
        visual: formula([
          f("H:did|S:subject|V:base verb", "**Did** you **see** the match?", "Question"),
          f("S:subject|H:didn't|V:base verb", "I **didn't see** it.", "Negative"),
        ]),
        examples: [ex("Did she call?", "Did she called?", "*did* already shows the past — the verb goes back to base.")],
        tip: "*I didn't went* is a very common slip — *did* carries the past, so say *I didn't go*.",
      },
    ],
    quiz: [
      q("What is the past of *buy*?", ["buyed", "bought", "brought"], 1, "*bought*. (*brought* is the past of *bring*.)"),
      q("We ___ to Ooty last year.", ["go", "went", "have gone"], 1, "*last year* is a finished time → simple past."),
      q("Which is correct?", ["Did you called me?", "Did you call me?", "You did called me?"], 1, "*did* + base verb."),
    ],
  },
  {
    track: "beginner",
    slug: "future-will-going-to",
    title: "Future: will vs going to",
    summary: "“Will” for quick decisions and promises; “going to” for plans and clear signs.",
    pro: false,
    minutes: 5,
    seoTitle: "Will vs going to (future tense): rules and examples",
    sections: [
      {
        heading: "When did you decide?",
        text: "The difference is mostly *when* the decision was made.",
        visual: timeline(
          [
            span(18, 82, "going to — planned before now", { tone: "violet", side: "top", arrow: true }),
            pt(45, "will — decided right now", { side: "bottom" }),
          ],
          { now: 45 },
        ),
        examples: [
          ex("I'm going to do an MBA next year.", undefined, "Planned already."),
          ex("The phone's ringing — I'll get it!", undefined, "Decided this second."),
        ],
      },
      {
        heading: "Which one?",
        visual: peer(
          ["will", "going to"],
          [
            ["Decision now: *I'll have the dosa.*", "Plan: *We're going to visit Jaipur.*"],
            ["Promise / offer: *I'll call you tonight.*", "Sign you can see: *Look at those clouds — it's going to rain.*"],
            ["Opinion: *I think India will win.*", "Intention: *She's going to start a business.*"],
          ],
        ),
        tip: "Hindi *main kal jaaunga* can be either. Ask yourself: did I plan it already? Then *going to*.",
      },
      {
        heading: "The patterns",
        visual: formula([
          f("S:subject|H:will|V:base verb", "I **will help** you."),
          f("S:subject|H:am / is / are|X(fixed):going to|V:base verb", "She **is going to join** us."),
          f("S:subject|H:won't|V:base verb", "It **won't take** long.", "Negative"),
        ]),
        examples: [ex("I'll call you.", "I will calling you."), ex("They're going to buy a flat.", "They going to buy a flat.")],
      },
    ],
    quiz: [
      q("A: We're out of milk. B: Oh, ___ get some. (Which fits best?)", ["I'm going to", "I'll", "I going to"], 1, "Decided at the moment of speaking → *will*."),
      q("Look at that sky! It ___ rain.", ["is going to", "will to", "goes to"], 0, "You can see the sign now → *going to*."),
      q("We booked the tickets. We ___ visit Kerala in May. (Which fits best?)", ["will", "are going to", "go to"], 1, "A plan made earlier → *going to*."),
    ],
  },
  {
    track: "beginner",
    slug: "questions",
    title: "Questions: yes/no and wh-",
    summary: "Put the helper first, or start with a question word.",
    pro: false,
    minutes: 5,
    seoTitle: "How to make questions in English: rules and examples",
    sections: [
      {
        heading: "Yes/no questions: helper first",
        visual: transform("Statement", "Question", [
          ["She **is** a nurse.", "**Is** she a nurse?"],
          ["They **can** swim.", "**Can** they swim?"],
          ["You **have** finished.", "**Have** you finished?"],
          ["He works here.", "**Does** he work here?", "No helper? Add do / does / did."],
        ]),
      },
      {
        heading: "Wh- questions: Q + helper + subject + verb",
        visual: blocks(["Q:Where|H:do|S:you|V:live", "Q:What|H:is|S:Priya|V:cooking", "Q:Why|H:did|S:they|V:leave"]),
        examples: [ex("Where do you work?", "Where you work?"), ex("Why is he late?", "Why he is late?", "Keep the helper before the subject.")],
        tip: "Indian English often keeps statement order: *Why you are late?* Flip it: *Why are you late?*",
      },
      {
        heading: "Which question word?",
        visual: table(
          ["Word", "Asks about", "Example"],
          [
            ["who", "a person", "**Who** is your manager?"],
            ["what", "a thing", "**What** do you do?"],
            ["where", "a place", "**Where** is the station?"],
            ["when", "a time", "**When** does it start?"],
            ["why", "a reason", "**Why** are you smiling?"],
            ["how", "a way / manner", "**How** do you get to work?"],
            ["how much", "amount / price", "**How much** is this?"],
            ["how many", "a number", "**How many** tickets?"],
          ],
        ),
        examples: [ex("Who called you?", "Who did call you?", "When *who* is the subject, there's no *do*.")],
      },
    ],
    quiz: [
      q("Make a question: *She lives in Pune.*", ["Does she live in Pune?", "Does she lives in Pune?", "She lives in Pune?"], 0, "*does* + base verb *live*."),
      q("Pick the correct question.", ["Where you are going?", "Where are you going?", "Where you going are?"], 1, "Question word → helper → subject → verb."),
      q("___ is your birthday? — In March.", ["Where", "When", "Who"], 1, "It asks about a time."),
    ],
  },
  {
    track: "beginner",
    slug: "negatives",
    title: "Negatives: don't, doesn't, didn't",
    summary: "Add not after the helper — or bring in do, does, did.",
    pro: false,
    minutes: 4,
    seoTitle: "Negative sentences (don't, doesn't, didn't): rules and examples",
    sections: [
      {
        heading: "Helper + not",
        text: "If there's a helper (*am, is, are, can, will…*), put **not** right after it.",
        visual: transform("Positive", "Negative", [
          ["I **am** ready.", "I**'m not** ready."],
          ["She **is** coming.", "She **isn't** coming."],
          ["We **can** swim.", "We **can't** swim."],
          ["They **will** agree.", "They **won't** agree."],
        ]),
      },
      {
        heading: "No helper? Use do / does / did",
        visual: formula([
          f("S:I / you / we / they|H:don't|V:base verb", "I **don't eat** meat."),
          f("S:he / she / it|H:doesn't|V:base verb", "He **doesn't drive**."),
          f("S:any subject|H:didn't|V:base verb", "We **didn't win**.", "Past"),
        ]),
        examples: [ex("She doesn't like coffee.", "She doesn't likes coffee."), ex("I didn't see him.", "I didn't saw him.")],
        tip: "*He don't know* and *I didn't went* are common slips — the helper takes the -s or the past; the verb stays plain.",
      },
      {
        heading: "One negative is enough",
        visual: peer(
          ["not + any…", "no / nobody / nothing"],
          [
            ["I don't have **any** money.", "I have **no** money."],
            ["She didn't see **anyone**.", "She saw **no one**."],
            ["We didn't eat **anything**.", "We ate **nothing**."],
          ],
        ),
        examples: [ex("I don't know anything.", "I don't know nothing."), ex("Nobody came.", "Nobody didn't come.")],
      },
    ],
    quiz: [
      q("He ___ like spicy food.", ["don't", "doesn't", "isn't"], 1, "*he* → *doesn't* + base verb."),
      q("Which is correct?", ["I didn't went to college.", "I didn't go to college.", "I not go to college."], 1, "*didn't* + base verb."),
      q("Pick the correct sentence.", ["I don't know nothing.", "I don't know anything.", "I not know anything."], 1, "One negative only: *don't … anything*."),
    ],
  },
  {
    track: "beginner",
    slug: "in-on-at",
    title: "in / on / at: time and place",
    summary: "Big to small: in a month, on a day, at a time.",
    pro: false,
    minutes: 5,
    seoTitle: "In, on, at (prepositions of time and place): rules and examples",
    sections: [
      {
        heading: "Time: big → small",
        visual: peer(
          ["in (longer periods)", "on (days)", "at (exact points)"],
          [
            ["in May", "on Monday", "at 6 pm"],
            ["in 2025", "on 15 August", "at noon"],
            ["in the morning", "on my birthday", "at night"],
            ["in summer", "on Republic Day", "at lunchtime"],
          ],
        ),
        examples: [
          ex("The exam is on Monday at 10 am."),
          ex("I was born in 1999.", "I was born on 1999."),
          ex("See you in the evening.", "See you at evening.", "But: *at night*."),
        ],
      },
      {
        heading: "Place: inside, surface, point",
        visual: peer(
          ["in = inside an area", "on = on a surface / line", "at = at a point"],
          [
            ["in the room", "on the table", "at the door"],
            ["in Chennai", "on the wall", "at the bus stop"],
            ["in a car / taxi", "on a bus / train", "at the station"],
            ["in the photo", "on the screen", "at work"],
          ],
        ),
        examples: [
          ex("I live in Hyderabad.", "I live at Hyderabad.", "A city is an area → *in*."),
          ex("We got on the bus.", "We got in the bus.", "Buses and trains: *on*; cars and taxis: *in*."),
        ],
        tip: "Hindi *mein* isn't always *in*: *Main bus mein hoon* → *I'm **on** the bus*.",
      },
      {
        heading: "No preposition at all",
        text: "Nothing before *today, tomorrow, yesterday, this / next / last …* — and no *to* before *home*.",
        visual: transform("✗ Extra word", "✓ Natural", [
          ["See you **on** tomorrow.", "See you tomorrow."],
          ["I met him **in** last week.", "I met him last week."],
          ["She goes **to** home at 6.", "She goes home at 6."],
        ]),
      },
    ],
    quiz: [
      q("The meeting is ___ Friday.", ["in", "on", "at"], 1, "Days → *on*."),
      q("I'll call you ___ 7 pm.", ["in", "on", "at"], 2, "Clock times → *at*."),
      q("She lives ___ Kolkata.", ["in", "on", "at"], 0, "Cities are areas → *in*."),
    ],
  },
  {
    track: "beginner",
    slug: "adjectives-and-adverbs",
    title: "Adjectives vs adverbs",
    summary: "Adjectives describe things; adverbs describe actions. Quick is not quickly.",
    pro: false,
    minutes: 4,
    sections: [
      {
        heading: "Thing or action?",
        text: "Adjective → describes a noun. Adverb → describes a verb (*how?*).",
        visual: transform("Adjective + thing", "Action + adverb", [
          ["a **quiet** voice", "speak **quietly**"],
          ["a **careful** driver", "drive **carefully**"],
          ["a **good** singer", "sing **well**"],
          ["a **fast** runner", "run **fast**"],
        ]),
      },
      {
        heading: "Making adverbs",
        visual: table(
          ["Adjective", "Adverb", "Rule"],
          [
            ["slow", "slow**ly**", "+ ly"],
            ["easy", "eas**ily**", "y → ily"],
            ["gentle", "gent**ly**", "-le → -ly"],
            ["good", "**well**", "irregular"],
            ["fast / hard / late", "fast / hard / late", "same word"],
          ],
        ),
        examples: [
          ex("He works hard.", "He works hardly.", "*hardly* means *almost not*."),
          ex("She speaks English well.", "She speaks English good."),
        ],
      },
      {
        heading: "After look, feel, seem, taste: adjective",
        visual: blocks(["S:You|V:look|C(adjective):tired", "S:The biryani|V:smells|C(adjective):amazing", "S:I|V:feel|C(adjective):bad"]),
        examples: [ex("I feel bad about it.", "I feel badly about it.")],
        tip: "*too* means *more than you want*. For praise say *It's really good!* — not *It's too good!*",
      },
    ],
    quiz: [
      q("She sings ___.", ["beautiful", "beautifully", "beauty"], 1, "It describes *sings* (an action) → adverb."),
      q("You look ___ today.", ["happily", "happy", "happiness"], 1, "After *look* (= seem), use an adjective."),
      q("He speaks Tamil ___.", ["good", "well", "goodly"], 1, "The adverb of *good* is *well*."),
    ],
  },
  {
    track: "beginner",
    slug: "much-many-some-any",
    title: "much / many / some / any",
    summary: "Countable takes many, uncountable takes much; some says yes, any asks.",
    pro: false,
    minutes: 5,
    seoTitle: "Much, many, some and any: rules and examples",
    sections: [
      {
        heading: "many or much?",
        text: "Can count it → **many**; can't count it → **much**. Either one → **a lot of**.",
        visual: peer(
          ["many (countable)", "much (uncountable)"],
          [
            ["many **friends**", "much **time**"],
            ["many **cups**", "much **tea**"],
            ["How many **rupees**?", "How much **money**?"],
            ["too many **cars**", "too much **traffic**"],
          ],
        ),
        examples: [
          ex("There are many people here.", "There are much people here."),
          ex("I have a lot of work.", "I have much work.", "In positive sentences, *a lot of* sounds natural."),
        ],
        tip: "Hindi *kitna* covers both — English splits it: *kitne log* = how **many** people, *kitna paisa* = how **much** money.",
      },
      {
        heading: "some or any?",
        text: "**some** in positive sentences and offers; **any** in negatives and most questions.",
        visual: transform("Positive", "Negative / question", [
          ["I have **some** questions.", "I don't have **any** questions."],
          ["There's **some** milk.", "Is there **any** milk?"],
        ]),
        examples: [
          ex("Would you like some chai?", undefined, "An offer → *some*, even in a question."),
          ex("We don't have any time.", "We don't have some time."),
        ],
      },
      {
        heading: "How much? A quick scale",
        visual: scale("none", "lots", [
          ["no / none", 2],
          ["few / little — almost none", 18],
          ["a few / a little — some", 38],
          ["some", 52],
          ["many / much / a lot of", 88],
        ]),
        examples: [
          ex("I have a few friends in Delhi.", undefined, "Some — that's nice."),
          ex("Few people came.", undefined, "Almost nobody — a bit sad."),
        ],
      },
    ],
    quiz: [
      q("How ___ brothers do you have?", ["much", "many", "any"], 1, "Brothers can be counted → *many*."),
      q("There isn't ___ water left.", ["some", "any", "many"], 1, "Negative → *any*; water is uncountable."),
      q("We have ___ time before the train.", ["many", "a lot of", "a few"], 1, "*time* is uncountable; *a lot of* works for both."),
    ],
  },
  {
    track: "beginner",
    slug: "common-indian-english-mistakes",
    title: "Common Indian-English mistakes",
    summary: "Friendly fixes for habits that confuse listeners outside India.",
    pro: false,
    minutes: 6,
    seoTitle: "Common Indian English mistakes and what to say instead",
    sections: [
      {
        heading: "Grammar habits",
        text: "Indian English is a real variety of English. These swaps help when you talk to people outside India.",
        visual: transform("Common in India", "Widely understood", [
          ["I am having a car.", "I have a car.", "*have* = own → no -ing"],
          ["I'm here since two years.", "I've been here for two years.", "length of time → *for*"],
          ["Let's discuss about it.", "Let's discuss it.", "*discuss* needs no *about*"],
          ["Please return back the book.", "Please return the book.", "*return* already means *back*"],
        ]),
        tip: "The noun keeps *about*: *a discussion **about** the plan* — only the verb *discuss* drops it.",
      },
      {
        heading: "Word choices",
        text: "Some words carry Indian meanings that others may not know.",
        visual: peer(
          ["You may hear", "Most speakers say"],
          [
            ["my cousin brother / cousin sister", "my cousin"],
            ["I have a doubt.", "I have a question."],
            ["Let's prepone the meeting.", "Let's bring the meeting forward."],
            ["He's out of station.", "He's out of town."],
            ["Please revert.", "Please reply."],
          ],
        ),
        examples: [ex("I have a question about the fees.", "I have a doubt about the fees.", "Outside India, *doubt* suggests you don't believe something.")],
        tip: "Need to say which cousin? Add it: *my cousin — my uncle's son*.",
      },
      {
        heading: "Polite, clear requests",
        text: "Formal Indian phrases can be unclear abroad. Be specific instead.",
        visual: transform("Common in India", "Widely understood", [
          ["What is your good name?", "Could I have your name, please?", "*good name* translates *shubh naam*"],
          ["Please do the needful.", "Could you please sign the form?", "say the exact action"],
          ["Kindly revert at the earliest.", "Could you reply by Friday?", "give a clear time"],
        ]),
      },
      {
        heading: "Question tags",
        text: "The tag copies the helper and subject, and flips positive ↔ negative.",
        visual: formula([
          f("X:positive sentence|H:helper + n't|S:pronoun", "She's a doctor, **isn't she**?"),
          f("X:negative sentence|H:helper|S:pronoun", "You didn't call, **did you**?"),
        ]),
        examples: [
          ex("You're coming, aren't you?", "You're coming, isn't it?", "Match the tag to the subject: *you → aren't you*."),
          ex("She lives in Pune, right?", undefined, "Informal and always safe: *…, right?*"),
        ],
      },
    ],
    quiz: [
      q("Which sounds natural to an international colleague?", ["I have a doubt about the report.", "I have a question about the report.", "I am having a doubt."], 1, "Outside India, *question* is the word for something you want explained."),
      q("Pick the correct sentence.", ["I've lived here since two years.", "I've lived here for two years.", "I'm living here since two years."], 1, "Length of time → *for*, with the present perfect."),
      q("You're from Pune, ___?", ["isn't it", "aren't you", "no"], 1, "*You are* → tag *aren't you*."),
    ],
  },
];
