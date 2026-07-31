type QuestionOverlay = {
  text?: string;
  options?: Record<string, string>;
  images?: Record<string, string>;
};

type CategoryOverlay = {
  title: string;
  questions: Record<string, QuestionOverlay>;
};

/** English copy for extra daily question categories (base content is Russian). */
export const EXTRA_DAILY_QUESTIONS_EN: Record<string, CategoryOverlay> = {
  childhood_memories: {
    title: 'Childhood memories',
    questions: {
      ch1: { text: 'Which childhood memory would you want to relive with me?' },
      ch2: { text: 'What from your childhood do you still carry with you today?', options: { playful: 'Playfulness and laughter', curious: 'Curiosity about the world', sensitive: 'Sensitivity and dreaminess' } },
      ch3: { text: 'Which family tradition from your childhood could become ours?' },
      ch4: { text: 'If we had met as kids, what would we do together?', options: { playground: 'Play on the playground', adventure: 'Go on an adventure', secret: 'Start a secret club' } },
    },
  },
  family_traditions: {
    title: 'Family traditions',
    questions: {
      fa1: { text: 'How do you feel about family holidays?', options: { love: 'Love them — they connect generations', selective: 'I pick the ones that matter most', create: 'I want to create our own' } },
      fa2: { text: 'Which tradition from your family would you pass on to our children?' },
      fa3: { text: 'How often do you want to see relatives?', options: { often: 'Often — family close by', holidays: 'Holidays are enough', balance: 'Balance — with our own space' } },
      fa4: { text: 'Which family recipe or ritual do you want to keep alive?' },
    },
  },
  trust_foundations: {
    title: 'Trust foundations',
    questions: {
      tr1: { text: 'When did you first feel you could trust me?' },
      tr2: { text: 'What matters most to you in trust?', options: { honesty: 'Honesty, even when it hurts', reliability: 'Reliability and keeping promises', transparency: 'Openness without secrets' } },
      tr3: { text: 'Was there a moment when trust between us grew stronger?' },
      tr4: { text: 'How do you rebuild trust when it\'s shaken?', options: { talk: 'A long honest talk', time: 'Time and consistency', actions: 'Actions, not just words' } },
    },
  },
  conflict_style: {
    title: 'Conflict style',
    questions: {
      co1: { text: 'When we argue, you usually...', options: { withdraw: 'Withdraw and go quiet', express: 'Express emotions right away', analyze: 'Try to analyze logically' } },
      co2: { text: 'What\'s hardest for us to argue about but important to discuss?' },
      co3: { text: 'What helps you not say too much in a fight?', options: { pause: 'A pause and stepping away', breathe: 'Deep breathing', remind: 'Remind myself we\'re a team' } },
      co4: { text: 'What lesson from past conflicts would help us now?' },
    },
  },
  saying_sorry: {
    title: 'Saying sorry',
    questions: {
      so1: { text: 'How do you usually apologize?', options: { words: 'With words — "sorry"', actions: 'Through actions and care', time: 'Need time, then I speak' } },
      so2: { text: 'Which apology from me stuck with you the most?' },
      so3: { text: 'What makes an apology feel genuine to you?', options: { acknowledge: 'Acknowledging the mistake', change: 'Trying to change', patience: 'Patience with my feelings' } },
      so4: { text: 'What would you like to apologize to me for right now?' },
    },
  },
  jealousy_talk: {
    title: 'Jealousy & honesty',
    questions: {
      je1: { text: 'How do you feel about mild jealousy?', options: { normal: 'Normal — it means you care', uncomfortable: 'Uncomfortable, but it happens', avoid: 'I try not to be jealous' } },
      je2: { text: 'What helps you feel secure in our relationship?' },
      je3: { text: 'What\'s the best way to talk about jealousy?', options: { direct: 'Directly, without blame', humor: 'With humor and lightness', later: 'When emotions have settled' } },
      je4: { text: 'Was there a moment when jealousy taught us something important?' },
    },
  },
  personal_space: {
    title: 'Personal space',
    questions: {
      ps1: { text: 'How much alone time do you need per week?', options: { daily: 'At least an hour daily', few: 'A few times a week', little: 'Little — I\'m energized with you' } },
      ps2: { text: 'What do you do when you want to be alone?' },
      ps3: { text: 'How do you react when I ask for alone time?', options: { support: 'Support without taking offense', worry: 'Worry a little', use: 'Use the time for myself too' } },
      ps4: { text: 'How can we balance "together" and "apart"?' },
    },
  },
  couple_rituals: {
    title: 'Couple rituals',
    questions: {
      cr1: { text: 'Which of our rituals do you value most?' },
      cr2: { text: 'What new ritual would you like to start?', options: { weekly: 'A weekly date night', morning: 'A morning ritual', goodnight: 'An evening goodnight ritual' } },
      cr3: { text: 'Is there a ritual we lost that\'s worth bringing back?' },
      cr4: { text: 'Rituals for you are...', options: { anchor: 'An anchor of stability', romance: 'A way to keep romance alive', fun: 'An excuse for joy' } },
    },
  },
  date_night_ideas: {
    title: 'Date night ideas',
    questions: {
      dn1: { text: 'Which date feels more like you?', images: { restaurant_candle: 'Candlelit restaurant', picnic_park: 'Picnic in the park' } },
      dn2: { text: 'How often do you need real date nights?', options: { weekly: 'Once a week', biweekly: 'Every two weeks', monthly: 'Once a month — but special' } },
      dn3: { text: 'Which of our dates would you repeat?' },
      dn4: { text: 'The perfect phone-free date is...', options: { walk: 'A long walk', cook: 'Cooking together', surprise: 'A surprise from my partner' } },
    },
  },
  weekend_vibes: {
    title: 'Weekend vibes',
    questions: {
      wv1: { text: 'Your ideal weekend is...', options: { active: 'Activity and adventure', lazy: 'Laziness and shows', mix: 'A mix of rest and errands' } },
      wv2: { text: 'Which recent weekend with you stood out?' },
      wv3: { text: 'How do you feel about weekend plans?', options: { plan: 'Love planning ahead', spontaneous: 'Spontaneous — see how it goes', flexible: 'One planned day, one free' } },
      wv4: { text: 'What would you like to do this coming weekend?' },
    },
  },
  home_chores: {
    title: 'Home chores',
    questions: {
      hc1: { text: 'Which chore do you actually enjoy most?', options: { cooking: 'Cooking', cleaning: 'Cleaning — it\'s therapeutic', none: 'None of them 😅' } },
      hc2: { text: 'How can we split household duties more fairly?' },
      hc3: { text: 'When your partner does chores without being asked, you...', options: { grateful: 'Feel incredibly grateful', noticed: 'Notice and appreciate it', expected: 'It\'s normal in a couple' } },
      hc4: { text: 'What household life hack do you want us to try together?' },
    },
  },
  cooking_bond: {
    title: 'Cooking together',
    questions: {
      cb1: { text: 'What dish did we cook together best?' },
      cb2: { text: 'Your role in the kitchen as a couple is...', options: { chef: 'Head chef', sous: 'Sous chef', taster: 'Taster and moral support' } },
      cb3: { text: 'What dish do you want to learn to cook with me?' },
      cb4: { text: 'Music in the kitchen is...', options: { must: 'A must!', sometimes: 'Sometimes for the mood', quiet: 'Prefer quiet and conversation' } },
    },
  },
  money_matters: {
    title: 'Money matters',
    questions: {
      mo1: { text: 'How do you feel about shared expenses?', options: { equal: 'Split equally — fair', flexible: 'Flexible — whoever can', separate: 'Part separate, part together' } },
      mo2: { text: 'What financial goals do you dream about with me?' },
      mo3: { text: 'Talking about money for you is...', options: { easy: 'Easy and open', hard: 'Hard, but important', avoid: 'I try to avoid it' } },
      mo4: { text: 'What purchase \'for us\' would bring the most joy?' },
    },
  },
  shared_savings: {
    title: 'Shared savings',
    questions: {
      sa1: { text: 'What would you want to save for together first?' },
      sa2: { text: 'What\'s your saving style?', options: { steady: 'Steady small amounts', goal: 'For a specific goal', spontaneous: 'Whenever we can' } },
      sa3: { text: 'Which money habit from childhood shaped you?' },
      sa4: { text: 'If we had a \'dream piggy bank\', what would be in it?', options: { travel: 'A trip', home: 'Home or renovation', experience: 'An unforgettable experience' } },
    },
  },
  career_cheers: {
    title: 'Career support',
    questions: {
      cc1: { text: 'How can I better support you at work?' },
      cc2: { text: 'When you have a tough day at work, you need...', options: { listen: 'Someone to listen', distraction: 'Distraction and a change of pace', advice: 'Advice or help' } },
      cc3: { text: 'Which professional win do you want to celebrate with me?' },
      cc4: { text: 'Career vs relationship — how do you see the balance?', options: { both: 'Both matter — I seek balance', career: 'Career is the priority now', us: 'Us matters more than any job' } },
    },
  },
  work_balance: {
    title: 'Work-life balance',
    questions: {
      wb1: { text: 'When you \'bring work home\', it\'s...', options: { stress: 'Stress I want to talk about', silence: 'Silence — I don\'t want to burden you', rare: 'Rare — I\'m good at switching off' } },
      wb2: { text: 'How can we protect our time from work calls?' },
      wb3: { text: 'The ideal evening after work is...', options: { talk: 'Tell each other about our day', relax: 'Quietly rest together', activity: 'Something active' } },
      wb4: { text: 'What helps you switch from \'work mode\' to \'home mode\'?' },
    },
  },
  big_dreams: {
    title: 'Big dreams',
    questions: {
      bd1: { text: 'What dream seems crazy but you still think about it?' },
      bd2: { text: 'Dreams for you are...', options: { fuel: 'Fuel for life', guide: 'A compass to goals', fun: 'Just fun to fantasize' } },
      bd3: { text: 'Which dream do you want us to achieve in the next 3 years?' },
      bd4: { text: 'If money weren\'t an issue, what would we do tomorrow?', options: { travel: 'Go on a round-the-world trip', home: 'Build our dream home', help: 'Help loved ones and causes' } },
    },
  },
  hobbies_share: {
    title: 'Hobbies & passions',
    questions: {
      ho1: { text: 'Do you want me to share your hobby?', options: { yes: 'Yes — it brings us closer', partly: 'Sometimes — but I need my own too', no: 'No — let it stay mine' } },
      ho2: { text: 'Which of my hobbies surprised or impressed you?' },
      ho3: { text: 'A shared hobby is...', options: { dream: 'A dream — to find ours', have: 'We already have one!', optional: 'Not necessary' } },
      ho4: { text: 'What new hobby would you like to try together?' },
    },
  },
  learn_together: {
    title: 'Learning together',
    questions: {
      lt1: { text: 'What would you like to learn together with me?' },
      lt2: { text: 'When I\'m learning something new, you...', options: { support: 'Support and show interest', join: 'Join in', space: 'Give me space' } },
      lt3: { text: 'Was there a moment when we taught each other something?' },
      lt4: { text: 'The ideal \'learning\' evening together is...', options: { language: 'Learning a language', skill: 'A new skill — dance, drawing', documentary: 'A documentary and discussion' } },
    },
  },
  reading_pair: {
    title: 'Reading together',
    questions: {
      rd1: { text: 'Reading one book together is...', options: { romantic: 'Romantic and cozy', fun: 'Fun — discussing chapters', hard: 'Hard — different paces' } },
      rd2: { text: 'Which book could become \'ours\'?' },
      rd3: { text: 'Tell me about a book or story that moved you recently' },
      rd4: { text: 'Before bed you prefer...', options: { read: 'Reading', talk: 'Talking', screen: 'A show or phone' } },
    },
  },
  gaming_us: {
    title: 'Gaming together',
    questions: {
      gu1: { text: 'Playing games together is...', options: { love: 'Our way to have fun', sometimes: 'Sometimes — depends on the game', competitive: 'Competition — I want to win!' } },
      gu2: { text: 'Which game or board game best shows our personalities?' },
      gu3: { text: 'When I win, you...', options: { happy: 'Happy for me', rematch: 'Want a rematch', sore: 'A bit sore 😄' } },
      gu4: { text: 'What game would you like to play with me for the first time?' },
    },
  },
  creative_us: {
    title: 'Creating together',
    questions: {
      cu1: { text: 'What creative project together do you imagine?' },
      cu2: { text: 'Creativity as a couple is...', options: { bond: 'A way to bond', separate: 'Each our own, but together', new: 'Want to try it' } },
      cu3: { text: 'What would we create if we had one free day?' },
      cu4: { text: 'When I\'m being creative, you...', options: { watch: 'Love to watch', join: 'Join in', inspire: 'Inspire with ideas' } },
    },
  },
  art_dates: {
    title: 'Art dates',
    questions: {
      ar1: { text: 'Where would you go for a date?', images: { art_studio: 'Art studio', museum_art: 'Art museum' } },
      ar2: { text: 'What artwork would you like to see together?' },
      ar3: { text: 'Drawing or sculpting together is...', options: { fun: 'Fun, even if it\'s messy', romantic: 'Romantic', stress: 'Stressful — I\'m not good at it' } },
      ar4: { text: 'How can art become part of our life together?' },
    },
  },
  fitness_pair: {
    title: 'Fitness together',
    questions: {
      fp1: { text: 'Which activity format feels closer?', images: { gym_couple: 'Gym workout', yoga_calm: 'Yoga and calm' } },
      fp2: { text: 'Working out together is...', options: { motivate: 'Motivation not to quit', fun: 'Another way to spend time', solo: 'Better solo for each of us' } },
      fp3: { text: 'What fitness challenge would you take on together?' },
      fp4: { text: 'After a workout together you...', options: { proud: 'Proud of each other', tired: 'Collapse on the couch', food: 'Go eat!' } },
    },
  },
  wellness_us: {
    title: 'Wellness together',
    questions: {
      we1: { text: 'How do you take care of yourself during stressful times?', options: { rest: 'Rest and sleep', move: 'Movement and exercise', talk: 'Talking to loved ones' } },
      we2: { text: 'How can I help you take care of yourself?' },
      we3: { text: 'Shared self-care practices are...', options: { want: 'Want to try — meditation, walks', have: 'We already have them', personal: 'That\'s personal' } },
      we4: { text: 'What self-care ritual would you add to our life?' },
    },
  },
  mental_health: {
    title: 'Mental health',
    questions: {
      mh1: { text: 'When you\'re emotionally struggling, what helps most?' },
      mh2: { text: 'Talking about mental health as a couple is...', options: { important: 'Very important', learning: 'We\'re learning gradually', hard: 'Hard, but we try' } },
      mh3: { text: 'What sign from you tells me \'I need support\'?' },
      mh4: { text: 'When I\'m sad, you usually...', options: { hold: 'Hug and stay quiet', talk: 'Ask and listen', cheer: 'Try to cheer me up' } },
    },
  },
  stress_support: {
    title: 'Stress support',
    questions: {
      st1: { text: 'Your main source of stress right now is...', options: { work: 'Work', life: 'Life circumstances', relations: 'Relationships or family' } },
      st2: { text: 'What can I do today to lighten your day?' },
      st3: { text: 'When you\'re stressed, you prefer...', options: { alone: 'To be alone', together: 'Be together, even quietly', distraction: 'Distraction — movie, walk' } },
      st4: { text: 'What moment showed we handle stress better together?' },
    },
  },
  pet_lovers: {
    title: 'Pet lovers',
    questions: {
      pl1: { text: 'Which pet is closer to your soul?', images: { puppy_cuddle: 'Dog — loyal friend', cat_lap: 'Cat — cozy on your lap' } },
      pl2: { text: 'What animal would you like to get together?' },
      pl3: { text: 'A pet in our couple is...', options: { dream: 'A dream!', maybe: 'Maybe someday', no: 'Not for us' } },
      pl4: { text: 'What would we name our imaginary pet?' },
    },
  },
  future_pets: {
    title: 'Future pets',
    questions: {
      fpt1: { text: 'When is the best time to get a pet?', options: { now: 'Now — why wait?', stable: 'When life is more stable', never: 'Not planning to' } },
      fpt2: { text: 'Which pet care duties are you ready to take on?' },
      fpt3: { text: 'Dog or cat — or something else?', options: { dog: 'Dog', cat: 'Cat', exotic: 'Something unusual — parrot, rabbit' } },
      fpt4: { text: 'How would a pet change our daily life?' },
    },
  },
  travel_ways: {
    title: 'How we travel',
    questions: {
      tw1: { text: 'What transport for a dream trip?', images: { airplane_window: 'Plane — far and fast', train_travel: 'Train — slow and romantic' } },
      tw2: { text: 'When traveling you are...', options: { planner: 'The route planner', explorer: 'Explorer without a map', follower: 'Following my partner' } },
      tw3: { text: 'Which of our trips would you call perfect?' },
      tw4: { text: 'A souvenir from a trip is...', options: { thing: 'An object to remember', photo: 'Photos and memories', tradition: 'A new tradition' } },
    },
  },
  road_trips: {
    title: 'Road trips',
    questions: {
      rt1: { text: 'The ideal road trip is...', images: { roadtrip_car: 'Car and open road', camping_tent: 'Camping under the stars' } },
      rt2: { text: 'What route do you dream of driving together?' },
      rt3: { text: 'Who drives on couple road trips?', options: { me: 'Me', partner: 'My partner', switch: 'We switch' } },
      rt4: { text: 'What song should play in our dream car?' },
    },
  },
  nature_walks: {
    title: 'Nature walks',
    questions: {
      nw1: { text: 'Where would you go for a walk together?', images: { forest_walk: 'Forest trail', lake_calm: 'Calm lake' } },
      nw2: { text: 'Which nature walk stuck with you most?' },
      nw3: { text: 'Phone-free walks are...', options: { need: 'We need them regularly', nice: 'Nice, but rare', hard: 'Hard — I\'m used to my phone' } },
      nw4: { text: 'What do you notice on walks that I might miss?' },
    },
  },
  city_dates: {
    title: 'City dates',
    questions: {
      cd1: { text: 'The ideal city date is...', options: { cafe: 'Café and long talk', walk: 'Walk through unknown streets', event: 'Concert, exhibition, event' } },
      cd2: { text: 'What place in the city do you want to show me?' },
      cd3: { text: 'Being a tourist in your own city is...', options: { fun: 'Fun — discovering new things', rare: 'Rare, but worth trying', no: 'Not my thing' } },
      cd4: { text: 'Where would you take me if I visited for the first time?' },
    },
  },
  outdoor_fun: {
    title: 'Outdoor fun',
    questions: {
      of1: { text: 'The ideal day outdoors is...', images: { sunset_beach: 'Sunset on the beach', stargazing: 'Stargazing' } },
      of2: { text: 'What outdoor activity do you want to try together?' },
      of3: { text: 'Picnic or barbecue — what\'s closer?', options: { picnic: 'Picnic with a blanket', bbq: 'BBQ with friends', both: 'Both!' } },
      of4: { text: 'Which season is best for adventures together?' },
    },
  },
  seasons_us: {
    title: 'Seasons together',
    questions: {
      se1: { text: 'Your favorite season is...', options: { spring: 'Spring — awakening', summer: 'Summer — energy', autumn: 'Autumn — coziness', winter: 'Winter — warmth at home' } },
      se2: { text: 'Which seasonal memory with you is the warmest?' },
      se3: { text: 'How can we make each season special?', options: { tradition: 'Seasonal traditions', trip: 'Mini trips', home: 'Cozy at home' } },
      se4: { text: 'What are you looking forward to next season together?' },
    },
  },
  weather_mood: {
    title: 'Weather & mood',
    questions: {
      wm1: { text: 'Which weather sets a romantic mood?', images: { rainy_window: 'Rain at the window', snow_couple: 'Snowy walk' } },
      wm2: { text: 'Bad weather is a reason to...', options: { cuddle: 'Cuddle up at home', brave: 'Go out anyway', sleep: 'Sleep and rest' } },
      wm3: { text: 'How does weather affect your mood in the relationship?' },
      wm4: { text: 'The ideal rainy day together is...', options: { movies: 'Movies and a blanket', cook: 'Cooking and tea', walk: 'Walk under an umbrella' } },
    },
  },
  rainy_plans: {
    title: 'Rainy day plans',
    questions: {
      rp1: { text: 'What do we do when it\'s pouring outside?' },
      rp2: { text: 'Rain for you is...', options: { cozy: 'Cozy and romantic', gloomy: 'Gloom and laziness', neutral: 'Nothing special' } },
      rp3: { text: 'What movie or book is perfect for a rainy day together?' },
      rp4: { text: 'If we were stuck home for three days, what would we do?', options: { projects: 'Home projects', games: 'Games and fun', talk: 'Deep conversations' } },
    },
  },
  home_decor: {
    title: 'Home style',
    questions: {
      hd1: { text: 'Which interior feels more like you?', images: { boho_decor: 'Boho and cozy', minimalist_home: 'Minimalism and light' } },
      hd2: { text: 'What interior detail makes a home \'ours\'?' },
      hd3: { text: 'Choosing furniture together is...', options: { fun: 'Exciting', compromise: 'Compromises, but the result delights', stress: 'Stress — different tastes' } },
      hd4: { text: 'Which room do you want to decorate together first?' },
    },
  },
  cozy_home: {
    title: 'Cozy home',
    questions: {
      cy1: { text: 'What makes a home truly cozy for you?', options: { light: 'Soft light and candles', textile: 'Blankets and pillows', smell: 'Scents — baking, coffee' } },
      cy2: { text: 'Which cozy moment at home do you love most?' },
      cy3: { text: 'The ideal evening at home is...', options: { cook: 'Cooking and dinner', couch: 'Couch and a show', bath: 'Bath and relaxation' } },
      cy4: { text: 'What small touch would make our home cozier?' },
    },
  },
  morning_ritual: {
    title: 'Morning rituals',
    questions: {
      mr1: { text: 'The ideal morning together is...', images: { coffee_morning: 'Coffee and conversation', breakfast_bed: 'Breakfast in bed' } },
      mr2: { text: 'Are you the early bird or night owl in the couple?', options: { lark: 'Early bird', owl: 'Night owl', match: 'We match!' } },
      mr3: { text: 'What morning ritual would you like to start?' },
      mr4: { text: 'Waking up together is...', options: { best: 'The best start to the day', rare: 'Rare — different schedules', hard: 'Hard — I need sleep' } },
    },
  },
  coffee_love: {
    title: 'Coffee & talks',
    questions: {
      cl1: { text: 'Coffee or tea — what\'s closer?', options: { coffee: 'Coffee!', tea: 'Tea', both: 'Depends on the mood' } },
      cl2: { text: 'What conversation over coffee stuck with you?' },
      cl3: { text: 'Morning coffee together is...', options: { ritual: 'Our ritual', luxury: 'A luxury — rarely happens', want: 'Want it more often' } },
      cl4: { text: 'Which café would you like to spend more time with me in?' },
    },
  },
  dinner_us: {
    title: 'Dinner together',
    questions: {
      di1: { text: 'Which of our dinners would you call perfect?' },
      di2: { text: 'Cook dinner or order in — what\'s more often?', options: { cook: 'We cook', order: 'We order', mix: 'Depends' } },
      di3: { text: 'What do you dream of talking about at our next dinner?' },
      di4: { text: 'Candlelit dinner is...', options: { often: 'We can do it anytime', special: 'For special occasions', cliche: 'Cliché, but nice' } },
    },
  },
  food_explore: {
    title: 'Food adventures',
    questions: {
      fe1: { text: 'Trying exotic food is...', options: { yes: 'Yes! I love experiments', careful: 'Careful, but I\'ll try', no: 'Prefer familiar' } },
      fe2: { text: 'Which world cuisine do you want to explore together?' },
      fe3: { text: 'What dish would you cook for me even if you\'re not good at it?' },
      fe4: { text: 'The ideal food festival for us is...', options: { street: 'Street food', fine: 'Fine dining', market: 'Market and tastings' } },
    },
  },
  movie_date: {
    title: 'Movie dates',
    questions: {
      md1: { text: 'The ideal movie night is...', images: { cinema_date: 'Trip to the cinema', couch_movie: 'Movie on the couch' } },
      md2: { text: 'What movie would you rewatch with me?' },
      md3: { text: 'Genre for a date — which do you pick?', options: { romcom: 'Romantic comedy', thriller: 'Thriller — holding hands', doc: 'Documentary and discussion' } },
      md4: { text: 'What movie could tell our story?' },
    },
  },
  binge_watch: {
    title: 'Binge watching',
    questions: {
      bw1: { text: 'Watching a series together is...', options: { must: 'Must be in sync!', flexible: 'Different paces OK', solo: 'Sometimes each our own' } },
      bw2: { text: 'What series would you like to start with me?' },
      bw3: { text: 'When I watch \'one more episode\' without you, you...', options: { fine: 'Fine — I\'ll catch up', wait: 'Wait to watch together', spoiler: 'Afraid of spoilers!' } },
      bw4: { text: 'Which TV character is most like us?' },
    },
  },
  playlist_us: {
    title: 'Our playlist',
    questions: {
      pu1: { text: 'What song would you add to \'our\' playlist right now?' },
      pu2: { text: 'Music in the car — who picks?', options: { driver: 'Driver', passenger: 'Passenger', shuffle: 'Shuffle playlist' } },
      pu3: { text: 'Which song instantly takes you back to a moment with me?' },
      pu4: { text: 'A concert together is...', options: { dream: 'A dream!', done: 'Been there — want more', home: 'Prefer home with speakers' } },
    },
  },
  live_music: {
    title: 'Live music',
    questions: {
      lm1: { text: 'Live concert vs recording — which is better?', options: { live: 'Live — the energy!', record: 'Recording — more comfortable', both: 'Depends on the mood' } },
      lm2: { text: 'What concert would you like to attend together?' },
      lm3: { text: 'Which musical moment with you stuck with you most?' },
      lm4: { text: 'If we were in a band, who plays what?', options: { vocal: 'Me vocals, you instrument', both: 'We both sing', dj: 'DJ set together' } },
    },
  },
  dance_us: {
    title: 'Dancing together',
    questions: {
      da1: { text: 'Which dance feels more like us?', images: { dance_floor: 'Dance floor energy', wedding_dance: 'Slow wedding dance' } },
      da2: { text: 'Dancing together is...', options: { love: 'Love it!', shy: 'Shy, but I\'ll try', funny: 'Funny — and that\'s the point' } },
      da3: { text: 'What song would you pick for our slow dance?' },
      da4: { text: 'At a friend\'s wedding we...', options: { dance: 'Dance all night', watch: 'Watch and chat', leave: 'Leave early' } },
    },
  },
  party_mode: {
    title: 'Parties & social life',
    questions: {
      pm1: { text: 'The ideal evening with friends is...', images: { party_friends: 'Party with friends', wine_evening: 'Quiet evening with wine' } },
      pm2: { text: 'At parties we are...', options: { together: 'Always together', social: 'Talk to different people', early: 'Leave early' } },
      pm3: { text: 'Which night out together stuck with you?' },
      pm4: { text: 'Inviting friends over is...', options: { love: 'Love hosting', sometimes: 'Sometimes — not often', no: 'Prefer just us' } },
    },
  },
  friend_circle: {
    title: 'Friend circle',
    questions: {
      fc1: { text: 'Friends in a relationship are...', options: { important: 'An important part of life', few: 'Few but close', us: 'Main thing — us two' } },
      fc2: { text: 'Which friend influenced our relationship most?' },
      fc3: { text: 'Introducing your partner to friends is...', options: { excited: 'Exciting and nice', nervous: 'A bit stressful', natural: 'Natural' } },
      fc4: { text: 'How can we better integrate each other into our circles?' },
    },
  },
  our_friends: {
    title: 'Our friends',
    questions: {
      ouf1: { text: 'Which mutual friend became important to both of us?' },
      ouf2: { text: 'Double dates with friends are...', options: { fun: 'Fun!', ok: 'OK, but rare', prefer: 'Prefer just us' } },
      ouf3: { text: 'Which of my friends would you like to know better?' },
      ouf4: { text: 'If we hosted dinner for friends, what would we cook?', options: { fancy: 'Something impressive', simple: 'Simple and tasty', order: 'Order in — honestly' } },
    },
  },
  meet_family: {
    title: 'Meeting the family',
    questions: {
      mf1: { text: 'How did you feel meeting my family?' },
      mf2: { text: 'Your partner\'s family is...', options: { warm: 'Warm people, part of life', learning: 'Learning to understand', complex: 'Complex, but I try' } },
      mf3: { text: 'Which moment with my family stuck with you?' },
      mf4: { text: 'Family dinners — how often?', options: { monthly: 'Once a month', holidays: 'Holidays only', rare: 'Rare — and that\'s OK' } },
    },
  },
  in_laws: {
    title: 'In-laws & relatives',
    questions: {
      il1: { text: 'Advice from your partner\'s parents is...', options: { welcome: 'Welcome', filter: 'Listen but filter', hard: 'Hard to accept' } },
      il2: { text: 'How can we keep boundaries with relatives?' },
      il3: { text: 'Holidays with both families are...', options: { rotate: 'We rotate', together: 'Gather everyone', separate: 'Celebrate separately' } },
      il4: { text: 'What do you appreciate about my parents or relatives?' },
    },
  },
  kids_talk: {
    title: 'Talking about kids',
    questions: {
      kt1: { text: 'Kids in our plans are...', options: { yes: 'Yes, we want them', maybe: 'Maybe later', no: 'No / not sure' } },
      kt2: { text: 'What kind of parent do you see me as?' },
      kt3: { text: 'How will we split parenting duties?', options: { equal: 'Equally', strengths: 'By strengths', discuss: 'We\'ll discuss when the time comes' } },
      kt4: { text: 'What value do you want to pass on to our children?' },
    },
  },
  family_values: {
    title: 'Family values',
    questions: {
      fv1: { text: 'Which value from your family matters most to you?' },
      fv2: { text: 'Family for you is above all...', options: { support: 'Support', tradition: 'Traditions', love: 'Unconditional love' } },
      fv3: { text: 'Which values do we already share as a couple?' },
      fv4: { text: 'If we wrote a \'family manifesto\', what would come first?', options: { honesty: 'Honesty', fun: 'Joy and laughter', respect: 'Respect' } },
    },
  },
  talk_style: {
    title: 'Communication style',
    questions: {
      ts1: { text: 'Do you prefer to talk or listen?', options: { talk: 'Talk — I need to express', listen: 'Listen — I understand better', both: 'Depends on the topic' } },
      ts2: { text: 'When I\'m quiet, what do you think?' },
      ts3: { text: 'Serious talks are best had...', options: { face: 'Face to face', walk: 'On a walk', evening: 'In the evening, when calm' } },
      ts4: { text: 'Which of my communication styles do you value most?' },
    },
  },
  love_language: {
    title: 'Love languages',
    questions: {
      ll1: { text: 'Your main love language is...', options: { words: 'Words of affirmation', time: 'Quality time', touch: 'Physical touch', gifts: 'Gifts', acts: 'Acts of service' } },
      ll2: { text: 'When did you last feel my love in \'your language\'?' },
      ll3: { text: 'Which of your partner\'s love languages are you learning?', options: { same: 'Ours match!', learning: 'Learning to speak theirs', different: 'Different — and that\'s a challenge' } },
      ll4: { text: 'What can I do tomorrow so you feel loved?' },
    },
  },
  compliments: {
    title: 'Power of compliments',
    questions: {
      cm1: { text: 'Which compliment from me stuck with you most?' },
      cm2: { text: 'Compliments for you are...', options: { need: 'Needed regularly', nice: 'Nice but not essential', shy: 'Embarrassing — but I like them' } },
      cm3: { text: 'What would you like a compliment about right now?' },
      cm4: { text: 'How do you prefer to receive compliments?', options: { public: 'In public — I like it', private: 'In private', text: 'In a message — I can reread' } },
    },
  },
  gratitude: {
    title: 'Gratitude',
    questions: {
      gr1: { text: 'What are you grateful to me for today?' },
      gr2: { text: 'Saying \'thank you\' in a couple is...', options: { daily: 'Every day', when: 'When I truly feel it', actions: 'I show through actions' } },
      gr3: { text: 'Which moment with you brings gratitude when you look back?' },
      gr4: { text: 'How can we practice gratitude together?', options: { journal: 'Gratitude journal', evening: 'Evening \'what I\'m thankful for\'', surprise: 'Random notes' } },
    },
  },
  forgiveness: {
    title: 'Forgiveness',
    questions: {
      fg1: { text: 'Forgiving for you is...', options: { quick: 'Quick — I don\'t hold grudges', time: 'Takes time', hard: 'Hard, but I try' } },
      fg2: { text: 'When I forgive you, what matters most to you?' },
      fg3: { text: 'Is there something you haven\'t forgiven yet — and are ready to discuss?' },
      fg4: { text: 'How can a couple grow through forgiveness?', options: { talk: 'Honest talks', understand: 'Understanding motives', move: 'Let go and move forward' } },
    },
  },
  open_up: {
    title: 'Opening up',
    questions: {
      ou1: { text: 'What have you wanted to talk about but keep putting off?' },
      ou2: { text: 'Opening up to your partner is...', options: { natural: 'Natural', gradual: 'Gradually — trust grows', scary: 'Scary, but important' } },
      ou3: { text: 'When do you feel you can be completely yourself?' },
      ou4: { text: 'What helps you open up?', options: { trust: 'Trust and time', questions: 'The right questions', silence: 'Silence and patience' } },
    },
  },
  emotional_intimacy: {
    title: 'Emotional intimacy',
    questions: {
      ei1: { text: 'When do you feel emotionally closest to me?' },
      ei2: { text: 'Emotional intimacy for you is...', options: { share: 'Sharing feelings', understand: 'Being understood without words', safe: 'Feeling safe' } },
      ei3: { text: 'What keeps you from being emotionally closer — and how can I help?' },
      ei4: { text: 'Deep emotional connection is...', options: { have: 'We already have it', growing: 'Growing every day', want: 'I want more' } },
    },
  },
  physical_affection: {
    title: 'Physical affection',
    questions: {
      pa1: { text: 'What kind of touch do you love most?', options: { hug: 'Long hugs', hand: 'Holding hands', cuddle: 'Cuddle in silence' } },
      pa2: { text: 'When I hug you unexpectedly — what do you feel?' },
      pa3: { text: 'Public affection — for you it\'s...', options: { love: 'I like it', sometimes: 'Depends on the place', private: 'Prefer in private' } },
      pa4: { text: 'How can I show affection more often in a way you enjoy?' },
    },
  },
  secret_wishes: {
    title: 'Secret wishes',
    questions: {
      sw1: { text: 'What do you dream about but haven\'t told me yet?' },
      sw2: { text: 'Sharing secret wishes is...', options: { exciting: 'Exciting and nice', scary: 'A bit scary', ready: 'Ready to try' } },
      sw3: { text: 'What wish could we fulfill for each other this month?' },
      sw4: { text: 'If I fulfilled one wish of yours tomorrow — what would it be?', options: { experience: 'An experience or adventure', comfort: 'Care and coziness', surprise: 'A surprise — guess yourself' } },
    },
  },
  boundaries: {
    title: 'Healthy boundaries',
    questions: {
      bo1: { text: 'Boundaries in a relationship are...', options: { essential: 'Essential', learning: 'Learning together', unclear: 'Still unclear' } },
      bo2: { text: 'Which boundary is especially important to you?' },
      bo3: { text: 'Was there a moment when you needed to set a boundary?' },
      bo4: { text: 'When I respect your boundaries, you...', options: { safe: 'Feel safe', closer: 'We grow closer', grateful: 'Feel grateful' } },
    },
  },
  alone_time: {
    title: 'Alone time',
    questions: {
      at1: { text: 'What do you do in your alone time that I might not know about?' },
      at2: { text: 'Missing each other is...', options: { sweet: 'Sweet and romantic', normal: 'Normal — we\'re not glued together', rare: 'Rare — we\'re together a lot' } },
      at3: { text: 'How can we support each other\'s personal space?' },
      at4: { text: 'After alone time you...', options: { recharged: 'Come back energized', miss: 'Miss me and happy to see me', same: 'Nothing changes' } },
    },
  },
  phone_habits: {
    title: 'Phone habits',
    questions: {
      ph1: { text: 'Phone at dinner is...', options: { no: 'Taboo — we\'re together', sometimes: 'Sometimes — if important', normal: 'Normal' } },
      ph2: { text: 'When your partner\'s phone gets in the way, what do you feel?' },
      ph3: { text: 'How can we distract ourselves less with screens?', options: { box: 'Phone box', rule: 'No-phone evening rule', trust: 'Just agree on it' } },
      ph4: { text: 'What kind of message from me do you love getting most?' },
    },
  },
  screen_time: {
    title: 'Screen time',
    questions: {
      sc1: { text: 'Shows vs real time together — balance is...', options: { us: 'We matter more than screens', share: 'Watch together — that\'s \'us\' too', struggle: 'I struggle with this' } },
      sc2: { text: 'What content would you like to watch or discuss together?' },
      sc3: { text: 'A digital detox together is...', options: { want: 'Want to try', tried: 'Tried it — it helped', hard: 'Too hard' } },
      sc4: { text: 'How do technologies help our relationship?' },
    },
  },
  social_online: {
    title: 'Us on social media',
    questions: {
      soc1: { text: 'Posts about us on social media are...', options: { love: 'Love sharing', private: 'Prefer privacy', sometimes: 'Sometimes — special moments' } },
      soc2: { text: 'How do you feel about what I like or comment online?' },
      soc3: { text: 'Couple online — show or hide?', options: { open: 'Open — nothing to hide', minimal: 'Minimum', none: 'Not our style' } },
      soc4: { text: 'Which moment of ours wouldn\'t you post but is precious?' },
    },
  },
  nostalgia: {
    title: 'Nostalgia',
    questions: {
      no1: { text: 'Which period of our relationship do you look back on warmly?' },
      no2: { text: 'Nostalgia for you is...', options: { sweet: 'Sweet sadness', motivation: 'Motivation for the future', rare: 'Rare — I live in the present' } },
      no3: { text: 'Which \'old\' moment with you would you relive?' },
      no4: { text: 'Photos or things from the past are...', options: { treasure: 'Treasures', sometimes: 'Nice, but I don\'t dwell', forward: 'I look forward' } },
    },
  },
  photo_wall: {
    title: 'Wall of memories',
    questions: {
      pw1: { text: 'How to keep memories?', images: { polaroid_wall: 'Polaroid wall', vintage_room: 'Vintage corner' } },
      pw2: { text: 'Which photo of us is your favorite?' },
      pw3: { text: 'Print photos or keep them on your phone?', options: { print: 'Print — want to see them', digital: 'Phone is enough', both: 'Both' } },
      pw4: { text: 'Which memory would you frame?' },
    },
  },
  anniversaries: {
    title: 'Anniversaries',
    questions: {
      an1: { text: 'Celebrating anniversaries is...', options: { must: 'A must — every year', flexible: 'Main thing is remembering', surprise: 'Love surprises, not dates' } },
      an2: { text: 'Which anniversary are you especially looking forward to?' },
      an3: { text: 'How did we celebrate our best anniversary?' },
      an4: { text: 'The ideal anniversary gift is...', options: { experience: 'An experience together', symbol: 'Something symbolic', letter: 'A letter or words' } },
    },
  },
  milestones: {
    title: 'Milestones',
    questions: {
      mi1: { text: 'Which milestone in our relationship matters most to you?' },
      mi2: { text: 'Celebrating small wins is...', options: { yes: 'Yes — every step matters', sometimes: 'Sometimes we forget', big: 'Only big events' } },
      mi3: { text: 'What next milestone do you want to reach together?' },
      mi4: { text: 'When we reach a goal, you...', options: { celebrate: 'Celebrate!', quiet: 'Quietly rejoice', next: 'Set a new one right away' } },
    },
  },
  love_notes: {
    title: 'Love notes',
    questions: {
      ln1: { text: 'Which romantic gesture feels closer?', images: { handwritten_note: 'Handwritten note', flowers_bouquet: 'Bouquet of flowers' } },
      ln2: { text: 'Have you ever gotten a note from me? What was it like?' },
      ln3: { text: 'Letters and notes are...', options: { romantic: 'Very romantic', cute: 'Cute, but rare', old: 'Old-fashioned — messages are better' } },
      ln4: { text: 'What would you write in a note if you left it for me in the morning?' },
    },
  },
  surprises_us: {
    title: 'Surprises',
    questions: {
      su1: { text: 'Surprises for you are...', options: { love: 'Love them!', mixed: 'Depends — I like nice ones', plan: 'Prefer knowing ahead' } },
      su2: { text: 'Which surprise from me will you never forget?' },
      su3: { text: 'Planning surprises is...', options: { fun: 'Fun — I love planning', stress: 'Stressful — afraid to miss', rare: 'Rare, but from the heart' } },
      su4: { text: 'What surprise would you like to plan for me?' },
    },
  },
  city_nights: {
    title: 'City nights',
    questions: {
      cn1: { text: 'The ideal evening is...', images: { city_night: 'City lights', sunset_beach: 'Sunset by the sea' } },
      cn2: { text: 'Which city do you dream of exploring together at night?' },
      cn3: { text: 'Night walks are...', options: { romantic: 'Romantic!', rare: 'Rare — we get tired', adventure: 'An adventure' } },
      cn4: { text: 'Which city evening with you stuck with you most?' },
    },
  },
  market_stroll: {
    title: 'Market stroll',
    questions: {
      mk1: { text: 'Where to go on Saturday?', images: { farmers_market: 'Farmers market', vintage_room: 'Vintage shop' } },
      mk2: { text: 'Grocery shopping together — date or routine?' },
      mk3: { text: 'Market or supermarket — what\'s closer?', options: { market: 'Market — the atmosphere', super: 'Supermarket — quick', delivery: 'Delivery' } },
      mk4: { text: 'What would we find at the ideal market?' },
    },
  },
  growth_together: {
    title: 'Growing together',
    questions: {
      gt1: { text: 'What have I taught you during our relationship?' },
      gt2: { text: 'Growing as a couple is...', options: { conscious: 'Conscious work', natural: 'Happens naturally', challenge: 'A challenge, but worth it' } },
      gt3: { text: 'What have you become better at thanks to us?' },
      gt4: { text: 'How can we grow together this year?', options: { goals: 'Shared goals', habits: 'New habits', talk: 'More deep talks' } },
    },
  },
  change_adapt: {
    title: 'Change & adaptation',
    questions: {
      ca1: { text: 'When life changes, you...', options: { adapt: 'Adapt quickly', stress: 'Stress, then accept', partner: 'Lean on my partner' } },
      ca2: { text: 'Which big change did we handle best?' },
      ca3: { text: 'What scares you about change — and how can I help?' },
      ca4: { text: 'Changes in a relationship are...', options: { growth: 'Growth', scary: 'Scary', normal: 'A normal part of life' } },
    },
  },
  humor_style: {
    title: 'Humor in the couple',
    questions: {
      hs1: { text: 'Your type of humor is...', options: { sarcasm: 'Sarcasm and irony', silly: 'Silliness and memes', warm: 'Warm and kind' } },
      hs2: { text: 'When we laugh together — at what most often?' },
      hs3: { text: 'Joking during a fight is...', options: { helps: 'Helps defuse', worse: 'Makes it worse', depends: 'Depends on the situation' } },
      hs4: { text: 'Which joke or meme became \'ours\'?' },
    },
  },
  inside_jokes: {
    title: 'Inside jokes',
    questions: {
      ij1: { text: 'Which inside joke instantly makes you smile?' },
      ij2: { text: 'Inside jokes are...', options: { bond: 'Our bond', many: 'Too many to count', building: 'Still building them' } },
      ij3: { text: 'How did our weirdest joke start?' },
      ij4: { text: 'If a stranger heard us, they would...', options: { confused: 'Understand nothing', laugh: 'Laugh too', jealous: 'Envy our connection' } },
    },
  },
  legacy_dreams: {
    title: 'Legacy & meaning',
    questions: {
      ld1: { text: 'What mark do you want to leave together with me?' },
      ld2: { text: 'Meaning of life for you is...', options: { love: 'Love and loved ones', create: 'Creating something', experience: 'Experiencing and feeling' } },
      ld3: { text: 'What do you want us to remember in 20 years?' },
      ld4: { text: 'If we wrote a book about us, the genre would be...', options: { romance: 'Romance', comedy: 'Comedy', adventure: 'Adventure' } },
    },
  },
  adventure_bucket: {
    title: 'Adventure bucket list',
    questions: {
      ab1: { text: 'Which bucket-list adventure do you want to do first?' },
      ab2: { text: 'Adrenaline vs calm — what do you pick?', options: { adrenaline: 'Adrenaline — jump, diving', calm: 'Calm — trekking, camping', mix: 'A mix' } },
      ab3: { text: 'What crazy adventure haven\'t we tried yet?' },
      ab4: { text: 'A bucket list for us is...', options: { have: 'We already have one!', make: 'Time to make one', spontaneous: 'Spontaneous — no lists' } },
    },
  },
  quiet_moments: {
    title: 'Quiet moments',
    questions: {
      qm1: { text: 'Silence together is...', options: { comfort: 'Comfort and closeness', awkward: 'Sometimes awkward', rare: 'Rare — we talk a lot' } },
      qm2: { text: 'Which quiet moment with you would you keep forever?' },
      qm3: { text: 'The ideal quiet evening is...', options: { read: 'Reading side by side', cuddle: 'Just cuddling', nature: 'Looking out the window or at stars' } },
      qm4: { text: 'What do you feel when we\'re just quiet but together?' },
    },
  },
  cozy_evenings: {
    title: 'Cozy evenings',
    questions: {
      ce1: { text: 'How to spend the evening?', images: { wine_evening: 'Glass of wine and talk', couch_movie: 'Blanket and a movie' } },
      ce2: { text: 'Evening at home vs going out — what\'s more often?', options: { home: 'Home — cozy', out: 'We go out', balance: '50/50' } },
      ce3: { text: 'What\'s your ideal cozy evening with me?' },
      ce4: { text: 'What makes an evening \'perfect\'?', options: { presence: 'Full presence with each other', comfort: 'Comfort — food, blanket, quiet', surprise: 'A small surprise' } },
    },
  },
};
