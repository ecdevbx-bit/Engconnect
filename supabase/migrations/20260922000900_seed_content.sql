-- ════════════════════════════════════════════════════════════════════
-- Seed: starter learning content for English Connection (tutor K.AI).
--
-- Fills public.problems with the launch set of practice items:
--   jumble        easy 40 · medium 30 · hard 20 · progressive 12 sets x 3
--   pronunciation easy 20 · medium 15 · hard 12
--
-- Notes
--   * `initial` is '' everywhere: the server shuffles `final` for jumble
--     and speaks/compares `final` for pronunciation.
--   * Tokens are compared exactly after splitting on single spaces, so
--     sentences avoid numerals, hyphens, quotes and apostrophes.
--   * Progressive rows use sort_order = base * 10 + variant; variant 1 is
--     easy, 2 is medium, 3 is hard, each growing the previous sentence.
--   * Every insert ends with `on conflict do nothing`, so re-running is
--     harmless and rows edited by admins are never overwritten.
--   * This is only a starting point: admins can edit, deactivate and
--     extend content at /v3/admin/problems.
-- ════════════════════════════════════════════════════════════════════

-- ────────────────────────────────────────────────────────────────────
-- Jumble · easy (40 sentences, 4–6 words)
-- ────────────────────────────────────────────────────────────────────
insert into public.problems (category, difficulty, sort_order, initial, final) values
  ('jumble', 'easy',  1, '', 'I love eating spicy samosas.'),
  ('jumble', 'easy',  2, '', 'Cricket is a religion here.'),
  ('jumble', 'easy',  3, '', 'The Taj Mahal is beautiful.'),
  ('jumble', 'easy',  4, '', 'Let us drink ginger tea.'),
  ('jumble', 'easy',  5, '', 'Mango is the king fruit.'),
  ('jumble', 'easy',  6, '', 'Peacock is our national bird.'),
  ('jumble', 'easy',  7, '', 'Always wear a helmet.'),
  ('jumble', 'easy',  8, '', 'Diwali is the light festival.'),
  ('jumble', 'easy',  9, '', 'Auto rickshaws are everywhere.'),
  ('jumble', 'easy', 10, '', 'Train journeys are very long.'),
  ('jumble', 'easy', 11, '', 'Mother makes the best rotis.'),
  ('jumble', 'easy', 12, '', 'Yoga keeps the mind calm.'),
  ('jumble', 'easy', 13, '', 'My father reads the newspaper.'),
  ('jumble', 'easy', 14, '', 'We eat idli for breakfast.'),
  ('jumble', 'easy', 15, '', 'The train is running late.'),
  ('jumble', 'easy', 16, '', 'Please close the door.'),
  ('jumble', 'easy', 17, '', 'Holi is a joyful spring festival.'),
  ('jumble', 'easy', 18, '', 'My sister studies in college.'),
  ('jumble', 'easy', 19, '', 'The chai stall opens early.'),
  ('jumble', 'easy', 20, '', 'Grandmother tells us bedtime stories.'),
  ('jumble', 'easy', 21, '', 'Kerala has beautiful green backwaters.'),
  ('jumble', 'easy', 22, '', 'The market is very crowded.'),
  ('jumble', 'easy', 23, '', 'He plays cricket every evening.'),
  ('jumble', 'easy', 24, '', 'Mumbai is a busy city.'),
  ('jumble', 'easy', 25, '', 'We visited Jaipur last winter.'),
  ('jumble', 'easy', 26, '', 'The office bus leaves at eight.'),
  ('jumble', 'easy', 27, '', 'Please drink more water daily.'),
  ('jumble', 'easy', 28, '', 'The jalebis are hot and sweet.'),
  ('jumble', 'easy', 29, '', 'My brother loves playing chess.'),
  ('jumble', 'easy', 30, '', 'The teacher praised my work.'),
  ('jumble', 'easy', 31, '', 'Children fly kites in January.'),
  ('jumble', 'easy', 32, '', 'The watchman guards our building.'),
  ('jumble', 'easy', 33, '', 'The bus stop is nearby.'),
  ('jumble', 'easy', 34, '', 'I take the metro daily.'),
  ('jumble', 'easy', 35, '', 'Rain makes the roads muddy.'),
  ('jumble', 'easy', 36, '', 'She wears a silk saree.'),
  ('jumble', 'easy', 37, '', 'Dosa tastes best with chutney.'),
  ('jumble', 'easy', 38, '', 'The exam starts at ten.'),
  ('jumble', 'easy', 39, '', 'Wash your hands before eating.'),
  ('jumble', 'easy', 40, '', 'We celebrate Pongal with family.')
on conflict do nothing;

-- ────────────────────────────────────────────────────────────────────
-- Jumble · medium (30 sentences, 7–10 words)
-- ────────────────────────────────────────────────────────────────────
insert into public.problems (category, difficulty, sort_order, initial, final) values
  ('jumble', 'medium',  1, '', 'Street food in Mumbai is very famous.'),
  ('jumble', 'medium',  2, '', 'Please provide change for two thousand rupees.'),
  ('jumble', 'medium',  3, '', 'The monsoon rains bring relief from heat.'),
  ('jumble', 'medium',  4, '', 'Indian weddings often last for many nights.'),
  ('jumble', 'medium',  5, '', 'Every Indian home has a spice box.'),
  ('jumble', 'medium',  6, '', 'We must keep our neighborhood very clean.'),
  ('jumble', 'medium',  7, '', 'Unity in diversity is our greatest strength.'),
  ('jumble', 'medium',  8, '', 'My grandmother makes mango pickle every summer.'),
  ('jumble', 'medium',  9, '', 'The local train was crowded this morning.'),
  ('jumble', 'medium', 10, '', 'We are going to Goa for the holidays.'),
  ('jumble', 'medium', 11, '', 'Please switch off the fan before leaving.'),
  ('jumble', 'medium', 12, '', 'The cricket match was stopped because of rain.'),
  ('jumble', 'medium', 13, '', 'My cousin is studying engineering in Pune.'),
  ('jumble', 'medium', 14, '', 'Our college fest starts next Friday evening.'),
  ('jumble', 'medium', 15, '', 'The vegetable vendor comes to our street daily.'),
  ('jumble', 'medium', 16, '', 'I usually drink filter coffee in the morning.'),
  ('jumble', 'medium', 17, '', 'The doctor advised me to walk every day.'),
  ('jumble', 'medium', 18, '', 'Farmers wait eagerly for the monsoon every year.'),
  ('jumble', 'medium', 19, '', 'The auto driver asked for fifty rupees extra.'),
  ('jumble', 'medium', 20, '', 'My mother packs a lunch box for me.'),
  ('jumble', 'medium', 21, '', 'We lit many lamps on the terrace yesterday.'),
  ('jumble', 'medium', 22, '', 'The manager has called a meeting at noon.'),
  ('jumble', 'medium', 23, '', 'Kolkata is famous for its delicious sweets.'),
  ('jumble', 'medium', 24, '', 'Our train reached Chennai two hours late.'),
  ('jumble', 'medium', 25, '', 'Children play cricket in the park after school.'),
  ('jumble', 'medium', 26, '', 'The bank remains closed on the second Saturday.'),
  ('jumble', 'medium', 27, '', 'Please book two tickets for the evening show.'),
  ('jumble', 'medium', 28, '', 'My father repairs old radios in his free time.'),
  ('jumble', 'medium', 29, '', 'The Himalayas look beautiful in the early morning.'),
  ('jumble', 'medium', 30, '', 'We should respect our elders and help them.')
on conflict do nothing;

-- ────────────────────────────────────────────────────────────────────
-- Jumble · hard (20 sentences, 11–16 words, subordinate clauses /
-- inverted or tricky word order)
-- ────────────────────────────────────────────────────────────────────
insert into public.problems (category, difficulty, sort_order, initial, final) values
  ('jumble', 'hard',  1, '', 'Although the traffic was heavy, we reached the office before the meeting started.'),
  ('jumble', 'hard',  2, '', 'If it rains tomorrow, the cricket match will be shifted to Sunday.'),
  ('jumble', 'hard',  3, '', 'The book that my teacher recommended is available in the college library.'),
  ('jumble', 'hard',  4, '', 'Because the train was delayed, my uncle missed his connecting bus to Shimla.'),
  ('jumble', 'hard',  5, '', 'Only after finishing her homework did my sister go out to play.'),
  ('jumble', 'hard',  6, '', 'While my mother was cooking dinner, the guests arrived from Hyderabad.'),
  ('jumble', 'hard',  7, '', 'The man who sells vegetables near our gate never forgets a face.'),
  ('jumble', 'hard',  8, '', 'Unless you book the tickets early, you will not get a seat during Diwali.'),
  ('jumble', 'hard',  9, '', 'Never have I seen such a crowd at the railway station before.'),
  ('jumble', 'hard', 10, '', 'Even though she was tired, my aunt helped my brother with his school project.'),
  ('jumble', 'hard', 11, '', 'The students, who had prepared well, answered every question with confidence.'),
  ('jumble', 'hard', 12, '', 'As soon as the monsoon arrives, the farmers begin sowing rice in their fields.'),
  ('jumble', 'hard', 13, '', 'What surprised me most was how quickly the stadium filled with cheering fans.'),
  ('jumble', 'hard', 14, '', 'Since the power had gone out, we studied by candlelight for the whole evening.'),
  ('jumble', 'hard', 15, '', 'The fort that we visited in Rajasthan was built more than five hundred years ago.'),
  ('jumble', 'hard', 16, '', 'Had we left home earlier, we would have caught the morning flight to Delhi.'),
  ('jumble', 'hard', 17, '', 'Whenever guests visit our home, my mother insists on serving them sweets and tea.'),
  ('jumble', 'hard', 18, '', 'The report which the manager asked for must be submitted before Friday evening.'),
  ('jumble', 'hard', 19, '', 'Not only did our team win the match, but they also broke the college record.'),
  ('jumble', 'hard', 20, '', 'After the festival lights were switched off, the quiet street looked almost unfamiliar.')
on conflict do nothing;

-- ────────────────────────────────────────────────────────────────────
-- Jumble · progressive (12 sets; each set grows one sentence)
--   variant 1 = 4–5 words (easy), 2 = 7–9 words (medium),
--   variant 3 = 11–14 words (hard); sort_order = base * 10 + variant
-- ────────────────────────────────────────────────────────────────────
insert into public.problems (category, difficulty, sort_order, base, variant, initial, final) values
  ('jumble', 'progressive',  11,  1, 1, '', 'The dog barks loudly.'),
  ('jumble', 'progressive',  12,  1, 2, '', 'The dog barks loudly at the postman.'),
  ('jumble', 'progressive',  13,  1, 3, '', 'Every morning, the dog barks loudly at the postman near our gate.'),

  ('jumble', 'progressive',  21,  2, 1, '', 'My mother cooks biryani.'),
  ('jumble', 'progressive',  22,  2, 2, '', 'My mother cooks biryani for the whole family.'),
  ('jumble', 'progressive',  23,  2, 3, '', 'On Sundays, my mother cooks biryani for the whole family with fresh spices.'),

  ('jumble', 'progressive',  31,  3, 1, '', 'The train arrived late.'),
  ('jumble', 'progressive',  32,  3, 2, '', 'The train arrived late at Howrah station.'),
  ('jumble', 'progressive',  33,  3, 3, '', 'Due to thick winter fog, the train arrived late at Howrah station.'),

  ('jumble', 'progressive',  41,  4, 1, '', 'We played cricket together.'),
  ('jumble', 'progressive',  42,  4, 2, '', 'We played cricket together in the school ground.'),
  ('jumble', 'progressive',  43,  4, 3, '', 'After the exams were over, we played cricket together in the school ground.'),

  ('jumble', 'progressive',  51,  5, 1, '', 'My grandmother sings folk songs.'),
  ('jumble', 'progressive',  52,  5, 2, '', 'My grandmother sings folk songs at every family wedding.'),
  ('jumble', 'progressive',  53,  5, 3, '', 'In her sweet voice, my grandmother sings old folk songs at every family wedding.'),

  ('jumble', 'progressive',  61,  6, 1, '', 'The shop opens early.'),
  ('jumble', 'progressive',  62,  6, 2, '', 'The sweet shop opens early during Diwali week.'),
  ('jumble', 'progressive',  63,  6, 3, '', 'Since everyone wants fresh sweets, the sweet shop opens early during Diwali week.'),

  ('jumble', 'progressive',  71,  7, 1, '', 'I am learning English.'),
  ('jumble', 'progressive',  72,  7, 2, '', 'I am learning English to get a better job.'),
  ('jumble', 'progressive',  73,  7, 3, '', 'These days, I am learning English online to get a better job in Bengaluru.'),

  ('jumble', 'progressive',  81,  8, 1, '', 'The children flew kites.'),
  ('jumble', 'progressive',  82,  8, 2, '', 'The children flew kites from the rooftop.'),
  ('jumble', 'progressive',  83,  8, 3, '', 'During the Sankranti festival, the children flew kites from the rooftop all day.'),

  ('jumble', 'progressive',  91,  9, 1, '', 'My brother cleared the exam.'),
  ('jumble', 'progressive',  92,  9, 2, '', 'My brother cleared the entrance exam this year.'),
  ('jumble', 'progressive',  93,  9, 3, '', 'After two years of hard work, my brother cleared the entrance exam this year.'),

  ('jumble', 'progressive', 101, 10, 1, '', 'The bus was crowded.'),
  ('jumble', 'progressive', 102, 10, 2, '', 'The city bus was crowded with office workers.'),
  ('jumble', 'progressive', 103, 10, 3, '', 'At nine in the morning, the city bus was crowded with sleepy office workers.'),

  ('jumble', 'progressive', 111, 11, 1, '', 'We visited the beach.'),
  ('jumble', 'progressive', 112, 11, 2, '', 'We visited the beach in Goa last December.'),
  ('jumble', 'progressive', 113, 11, 3, '', 'To celebrate my birthday, we visited the beach in Goa last December.'),

  ('jumble', 'progressive', 121, 12, 1, '', 'The manager approved my leave.'),
  ('jumble', 'progressive', 122, 12, 2, '', 'The manager approved my leave for the family wedding.'),
  ('jumble', 'progressive', 123, 12, 3, '', 'Although the office was busy, the manager approved my leave for the family wedding.')
on conflict do nothing;

-- ────────────────────────────────────────────────────────────────────
-- Pronunciation · easy (20 phrases, 3–6 words: greetings, requests,
-- shopping)
-- ────────────────────────────────────────────────────────────────────
insert into public.problems (category, difficulty, sort_order, initial, final) values
  ('pronunciation', 'easy',  1, '', 'Good morning, how are you?'),
  ('pronunciation', 'easy',  2, '', 'Thank you very much.'),
  ('pronunciation', 'easy',  3, '', 'Please pass the salt.'),
  ('pronunciation', 'easy',  4, '', 'How much does this cost?'),
  ('pronunciation', 'easy',  5, '', 'Could I have the bill, please?'),
  ('pronunciation', 'easy',  6, '', 'Nice to meet you.'),
  ('pronunciation', 'easy',  7, '', 'Where is the railway station?'),
  ('pronunciation', 'easy',  8, '', 'Please speak a little slowly.'),
  ('pronunciation', 'easy',  9, '', 'I am sorry for the delay.'),
  ('pronunciation', 'easy', 10, '', 'Can you help me, please?'),
  ('pronunciation', 'easy', 11, '', 'What time is it now?'),
  ('pronunciation', 'easy', 12, '', 'Please weigh one kilo of tomatoes.'),
  ('pronunciation', 'easy', 13, '', 'Have a nice day!'),
  ('pronunciation', 'easy', 14, '', 'See you tomorrow evening.'),
  ('pronunciation', 'easy', 15, '', 'Is this seat taken?'),
  ('pronunciation', 'easy', 16, '', 'I would like some water.'),
  ('pronunciation', 'easy', 17, '', 'Do you have change for this?'),
  ('pronunciation', 'easy', 18, '', 'Welcome to our home!'),
  ('pronunciation', 'easy', 19, '', 'Excuse me, where is the market?'),
  ('pronunciation', 'easy', 20, '', 'Congratulations on your new job!')
on conflict do nothing;

-- ────────────────────────────────────────────────────────────────────
-- Pronunciation · medium (15 sentences, 7–11 words). Targets common
-- Indian-English traps: v/w, th, silent letters and word stress.
-- ────────────────────────────────────────────────────────────────────
insert into public.problems (category, difficulty, sort_order, initial, final) values
  ('pronunciation', 'medium',  1, '', 'We will visit the village on Wednesday evening.'),
  ('pronunciation', 'medium',  2, '', 'I paid three thousand rupees for the new washing machine.'),
  ('pronunciation', 'medium',  3, '', 'This comfortable sofa is perfect for watching cricket.'),
  ('pronunciation', 'medium',  4, '', 'We buy fresh vegetables from the weekly market on Thursday.'),
  ('pronunciation', 'medium',  5, '', 'The weather was very warm in Vijayawada last week.'),
  ('pronunciation', 'medium',  6, '', 'My brother turns thirty on the third of this month.'),
  ('pronunciation', 'medium',  7, '', 'The honest clerk returned my receipt within an hour.'),
  ('pronunciation', 'medium',  8, '', 'I doubt we can climb the hill before sunset.'),
  ('pronunciation', 'medium',  9, '', 'Listen carefully and answer the question in a calm voice.'),
  ('pronunciation', 'medium', 10, '', 'Every winter, we visit our relatives in Varanasi and Vellore.'),
  ('pronunciation', 'medium', 11, '', 'The chemistry lecture about the environment was really interesting.'),
  ('pronunciation', 'medium', 12, '', 'My cousin loves photography and takes photographs everywhere.'),
  ('pronunciation', 'medium', 13, '', 'My father thinks this path is faster than the highway.'),
  ('pronunciation', 'medium', 14, '', 'The hotel manager has a very good idea for the event.'),
  ('pronunciation', 'medium', 15, '', 'The women bought new clothes for the wedding in October.')
on conflict do nothing;

-- ────────────────────────────────────────────────────────────────────
-- Pronunciation · hard (12 sentences, 12–18 words): tongue-twister-ish
-- but natural lines from job interviews, the office and travel.
-- ────────────────────────────────────────────────────────────────────
insert into public.problems (category, difficulty, sort_order, initial, final) values
  ('pronunciation', 'hard',  1, '', 'I believe my strong communication skills and willingness to learn make me the right candidate for this role.'),
  ('pronunciation', 'hard',  2, '', 'Three thoughtful team leaders thoroughly checked the thick monthly report before Thursday afternoon.'),
  ('pronunciation', 'hard',  3, '', 'Our vice president visited the Vadodara warehouse on Wednesday to review the very valuable inventory.'),
  ('pronunciation', 'hard',  4, '', 'Could you please confirm whether the flight to Thiruvananthapuram leaves from terminal three or terminal two?'),
  ('pronunciation', 'hard',  5, '', 'In my previous job, I worked with vendors, vehicles, and warehouses across several western states.'),
  ('pronunciation', 'hard',  6, '', 'The staff asked whether we would prefer a window seat or an aisle seat on the evening flight.'),
  ('pronunciation', 'hard',  7, '', 'Although the schedule was tight, the software team delivered the whole project three weeks ahead of the deadline.'),
  ('pronunciation', 'hard',  8, '', 'Please share the revised presentation with the whole team before the client call on Wednesday.'),
  ('pronunciation', 'hard',  9, '', 'She sells silk sarees and cotton shawls at the station shop near the city square.'),
  ('pronunciation', 'hard', 10, '', 'My greatest strength is that I stay calm, think clearly, and work well under pressure.'),
  ('pronunciation', 'hard', 11, '', 'The travel agent thought three thousand three hundred rupees was a fair price for the trip.'),
  ('pronunciation', 'hard', 12, '', 'While waiting for the delayed train, we watched the vendors weigh vegetables and wrap warm samosas.')
on conflict do nothing;
