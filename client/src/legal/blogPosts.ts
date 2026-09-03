import type { LegalLocale } from './legalLocale';

export type BlogCategoryId = 'product' | 'tips' | 'updates';

export type BlogPost = {
  slug: string;
  category: BlogCategoryId;
  publishedAt: string;
  imageFile: string;
  title: Record<LegalLocale, string>;
  excerpt: Record<LegalLocale, string>;
  paragraphs: Record<LegalLocale, string[]>;
};

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: 'private-space-for-two',
    category: 'product',
    publishedAt: '2026-08-20',
    imageFile: '1. avatars, feed light.PNG',
    title: {
      ru: 'Amorely — личное пространство только для двоих',
      en: 'Amorely — a private space just for the two of you',
    },
    excerpt: {
      ru: 'Общая лента, аватары рядом и воспоминания, которые не растворяются в обычном мессенджере.',
      en: 'A shared feed, avatars side by side, and memories that do not disappear into a regular messenger.',
    },
    paragraphs: {
      ru: [
        'Amorely задуман как закрытое пространство пары, а не как ещё одна лента для друзей и сторис. Здесь вы видите друг друга: аватары, расстояние, общие фото и важные дни — без посторонней аудитории.',
        'Лента собирает моменты, которые вы сами добавляете. Это не публичный профиль и не соцсеть «для всех». Большинство функций открывается после того, как вы свяжете аккаунты как партнёры.',
        'Если вы давно искали место, где переписка, фото и планы живут вместе, а не в пяти разных приложениях — начните с бесплатной регистрации и пригласите вторую половину.',
      ],
      en: [
        'Amorely is a closed space for a couple, not another feed for friends and stories. You see each other: avatars, distance, shared photos, and important days — without an outside audience.',
        'The feed collects moments you add yourselves. It is not a public profile or a social network “for everyone”. Most features unlock after you link accounts as partners.',
        'If you have been looking for one place where chat, photos, and plans live together instead of across five apps, start with a free account and invite your partner.',
      ],
    },
  },
  {
    slug: 'encrypted-chat-and-games',
    category: 'product',
    publishedAt: '2026-08-21',
    imageFile: '6. chat light.PNG',
    title: {
      ru: 'Зашифрованный чат и игры, которые имеют смысл вдвоём',
      en: 'Encrypted chat and games that only make sense together',
    },
    excerpt: {
      ru: 'Переписка остаётся между вами. Рядом — угадай место, рисунок и другие игры для пары.',
      en: 'Messages stay between you. Nearby: guess the location, draw & guess, and other couple games.',
    },
    paragraphs: {
      ru: [
        'Чат в Amorely использует сквозное шифрование: содержимое сообщений рассчитано на то, чтобы его читали только вы двое, а не администрация сервиса.',
        'Из чата можно перейти в игры: угадать место на карте, сравнить точки, нарисовать загадку партнёру. Это короткий ритуал на вечер, а не бесконечная лента рекомендаций.',
        'Правила простые: чат для добровольного общения пары, без угроз, спама и запрещённого законом контента. Пользуйтесь им так, как пользовались бы личным дневником на двоих.',
      ],
      en: [
        'Amorely chat uses end-to-end encryption: message contents are meant to be read only by the two of you, not by the service administration.',
        'From chat you can jump into games: guess a place on the map, compare pins, or sketch a prompt for your partner. It is a short evening ritual, not an infinite recommendation feed.',
        'The rules are simple: chat is for a couple’s voluntary conversation — no threats, spam, or illegal content. Use it the way you would use a private journal for two.',
      ],
    },
  },
  {
    slug: 'calendar-and-free-forever-for-now',
    category: 'tips',
    publishedAt: '2026-08-22',
    imageFile: '10. calendar light.PNG',
    title: {
      ru: 'Календарь воспоминаний — и почему сейчас всё бесплатно',
      en: 'A memory calendar — and why everything is free right now',
    },
    excerpt: {
      ru: 'Откройте месяц и сразу увидите, как вы жили. Подписок и скрытых платежей нет.',
      en: 'Open a month and see how you have been living. No subscriptions and no hidden fees.',
    },
    paragraphs: {
      ru: [
        'Общий календарь превращает даты в фотодневник: события, особенные дни и галерея месяцев. Это удобно и тем, кто рядом, и тем, кто живёт в разных часовых поясах.',
        'Рядом с календарём — вопрос дня, питомец, идеи свиданий и счётчик дней вместе. Всё это уже доступно без оплаты.',
        'На этом этапе Amorely полностью бесплатен: нет премиума и нет страницы оплаты. Если когда-нибудь появятся платные функции, мы опишем их в оферте заранее — а не «на третьем экране после регистрации».',
      ],
      en: [
        'The shared calendar turns dates into a photo diary: events, special days, and a gallery of months. It works whether you share a city or live across time zones.',
        'Beside the calendar you get questions of the day, a shared pet, dating ideas, and a days-together counter. All of that is already available without paying.',
        'At this stage Amorely is completely free: no premium tier and no checkout. If paid features ever appear, we will describe them in the offer first — not on the third screen after sign-up.',
      ],
    },
  },
  {
    slug: 'questions-of-the-day',
    category: 'tips',
    publishedAt: '2026-08-23',
    imageFile: '2. question of the day light.PNG',
    title: {
      ru: 'Вопросы дня: короткий ритуал, который сближает',
      en: 'Questions of the day: a short ritual that brings you closer',
    },
    excerpt: {
      ru: 'Ответьте на один вопрос вдвоём, сравните ответы и узнайте то, о чём обычно не спрашивают в мессенджере.',
      en: 'Answer one prompt together, compare notes, and learn what a regular messenger never asks.',
    },
    paragraphs: {
      ru: [
        'Вопросы дня в Amorely — это не тест «на совместимость» и не бесконечная анкета. Каждый день появляется новый промпт: лёгкий, игровой или чуть глубже обычного «как дела». Вы отвечаете по отдельности, а потом видите ответы друг друга.',
        'Так проще говорить о привычках, вкусах и мелочах, которые теряются в рабочей переписке. История вопросов остаётся в приложении: можно вернуться к старым ответам и вспомнить, как вы отвечали месяц назад.',
        'Формат короткий — пара минут вечером. Это удобно и тем, кто живёт вместе, и парам на расстоянии: один ритуал, который не зависит от часового пояса и не требует «давай созвонимся прямо сейчас».',
        'Если вы давно хотели больше разговоров не про быт, начните с вопросов дня. Регистрация бесплатная: пригласите партнёра и отвечайте вдвоём в закрытом пространстве Amorely.',
      ],
      en: [
        'Questions of the day in Amorely are not a compatibility quiz or an endless survey. Each day brings a new prompt: light, playful, or a little deeper than “how was your day”. You answer separately, then see each other’s replies.',
        'That makes it easier to talk about habits, tastes, and small things that disappear into work chat. Prompt history stays in the app, so you can reopen older answers and see how you replied a month ago.',
        'The format is short — a couple of minutes in the evening. It works for couples who live together and for long-distance pairs: one ritual that does not depend on a time zone or a “can you call right now”.',
        'If you have wanted more conversation that is not about errands, start with questions of the day. Sign-up is free: invite your partner and answer together in Amorely’s private space.',
      ],
    },
  },
  {
    slug: 'grow-a-pet-together',
    category: 'product',
    publishedAt: '2026-08-24',
    imageFile: '3. pet light.PNG',
    title: {
      ru: 'Общий питомец: забота, которая становится вашей привычкой',
      en: 'A shared pet: care that becomes your habit',
    },
    excerpt: {
      ru: 'Кормите компаньона вдвоём, поднимайте привязанность и смотрите, как он растёт вместе с вами.',
      en: 'Feed a companion together, raise affection, and watch it grow with you.',
    },
    paragraphs: {
      ru: [
        'Виртуальный питомец в Amorely — общий, а не «мой» и «твой». Сытость, привязанность и уровень видны обоим: забота становится маленьким совместным делом, а не ещё одной одиночной игрой в телефоне.',
        'Заглянуть покормить — проще, чем придумать длинный разговор после работы. Для пар на расстоянии это тёплая точка возвращения: вы оба видите, что питомца не забыли, и что второй человек тоже зашёл.',
        'По мере роста открываются новые состояния и уровни. Это не гонка и не донат-магазин: сейчас всё доступно бесплатно, как и остальные функции Amorely.',
        'Питомец живёт рядом с лентой, вопросами дня и календарём — в одном закрытом пространстве пары. Создайте аккаунт, свяжите партнёра и заведите компаньона, за которым будете ухаживать вдвоём.',
      ],
      en: [
        'The virtual pet in Amorely is shared, not “mine” and “yours”. Satiety, affection, and level are visible to both of you: care becomes a small joint task, not another solo phone game.',
        'Stopping in to feed it is easier than inventing a long conversation after work. For long-distance couples it is a warm return point: you both see that the pet was not forgotten, and that the other person showed up too.',
        'As it grows, new states and levels unlock. This is not a grind and not a donation shop: everything is free right now, like the rest of Amorely.',
        'The pet lives next to the feed, questions of the day, and the calendar — in one private space for the pair. Create an account, link your partner, and raise a companion you care for together.',
      ],
    },
  },
  {
    slug: 'date-ideas-for-two',
    category: 'tips',
    publishedAt: '2026-08-25',
    imageFile: '4. date ideas light.PNG',
    title: {
      ru: 'Идеи свиданий: когда «куда сходить» уже надоело',
      en: 'Date ideas: when “where should we go” gets old',
    },
    excerpt: {
      ru: 'Готовые идеи для двоих, отметки «сделали» и место, где планы не теряются в чате.',
      en: 'Ready-made ideas for two, a “we did this” mark, and a place where plans do not vanish in chat.',
    },
    paragraphs: {
      ru: [
        'Идеи свиданий в Amorely собраны для пары, а не для ленты рекомендаций. Карточки подсказывают формат: мастерская, прогулка, домашний вечер — без рекламы ресторанов и без чужих сторис.',
        'Отметьте, что уже попробовали, и держите следующие идеи под рукой. Так проще не повторять одно и то же «ну давай как обычно» и не забывать то, что один из вас кинул голосовым месяц назад.',
        'Раздел работает и когда вы в одном городе, и когда встречаетесь реже. Можно выбрать что-то на ближайшие выходные или сохранить идею «когда снова будем рядом».',
        'Amorely бесплатен: идеи свиданий открываются вместе с календарём, чатом и лентой после того, как вы свяжете аккаунты как партнёры. Зарегистрируйтесь и начните планировать вдвоём.',
      ],
      en: [
        'Date ideas in Amorely are collected for a couple, not for a recommendation feed. Cards suggest a format: a workshop, a walk, an evening at home — without restaurant ads or other people’s stories.',
        'Mark what you already tried and keep the next ideas close. That makes it easier to skip another “the usual” and not lose something one of you sent as a voice note a month ago.',
        'The section works when you share a city and when you meet less often. Pick something for the coming weekend, or save an idea for “when we are together again”.',
        'Amorely is free: date ideas unlock with the calendar, chat, and feed after you link accounts as partners. Sign up and start planning together.',
      ],
    },
  },
  {
    slug: 'days-together-milestones',
    category: 'product',
    publishedAt: '2026-08-26',
    imageFile: '5. days together light.PNG',
    title: {
      ru: 'Счётчик дней вместе и отметки, которые видно только вам',
      en: 'A days-together counter and milestones only you can see',
    },
    excerpt: {
      ru: 'Сколько вы уже вместе, какие рубежи впереди и рисунки, которые остаются в вашей истории.',
      en: 'How long you have been a couple, which milestones are next, and drawings that stay in your story.',
    },
    paragraphs: {
      ru: [
        'Счётчик дней вместе в Amorely показывает не абстрактную «статистику отношений», а вашу шкалу: сколько дней уже прошло и сколько осталось до следующей отметки — недели, месяцев, года.',
        'Рядом открываются достижения. Это не публичные награды для ленты друзей, а тихие рубежи пары. Можно добавить рисунок: подпись, домик, шутку — то, что увидите только вы двое.',
        'Для пар на расстоянии цифра на экране часто значит больше, чем кажется. Она не заменяет встречи, но держит общую точку: «мы всё ещё считаем эти дни вместе».',
        'Счётчик живёт на главном экране рядом с лентой и аватарами. Чтобы он заработал, свяжите аккаунты как партнёры — регистрация и все функции сейчас бесплатны.',
      ],
      en: [
        'The days-together counter in Amorely is not abstract “relationship stats”. It is your scale: how many days have passed and how many remain until the next mark — a week, months, a year.',
        'Achievements sit beside it. These are not public badges for a friends feed, but quiet couple milestones. You can add a drawing: a note, a little house, a joke — something only the two of you will see.',
        'For long-distance pairs the number on the screen often matters more than it looks. It does not replace visits, but it keeps a shared point: “we are still counting these days together”.',
        'The counter lives on the home screen next to the feed and avatars. To turn it on, link accounts as partners — sign-up and every feature are free right now.',
      ],
    },
  },
  {
    slug: 'guess-the-location',
    category: 'product',
    publishedAt: '2026-08-27',
    imageFile: '7. game guess location light.png',
    title: {
      ru: 'Угадай место: геоигра, в которую имеет смысл играть вдвоём',
      en: 'Guess the location: a geo game that only works as a pair',
    },
    excerpt: {
      ru: 'Фото места, две метки на карте и общий счёт пары — без чужой аудитории и бесконечной ленты.',
      en: 'A place photo, two pins on the map, and a shared pair score — no outside audience and no infinite feed.',
    },
    paragraphs: {
      ru: [
        '«Угадай локацию» в Amorely — игра только для связанной пары. Вы видите фотографию места, ставите свою метку на карте и сравниваете, кто оказался ближе. Очки обоих складываются в общий счёт.',
        'Перед раундом оба нажимают «Готов»: короткий отсчёт, ограниченное время, две независимые догадки. Это не гонка с незнакомцами и не стрим на зрителей — вы играете друг с другом.',
        'Каждый день есть лимит мест, чтобы вечер не превращался в бесконечный скролл. Есть рейтинг пар по суммарному счёту: можно попробовать побить свой же результат или чужой рекорд.',
        'Игра открывается из чата и каталога игр. Чтобы сыграть, нужны два аккаунта и принятый запрос партнёра. Amorely сейчас полностью бесплатен — включая геоигру.',
      ],
      en: [
        'Guess the location in Amorely is a game only for a linked couple. You see a photo of a place, drop your pin on the map, and compare who landed closer. Both scores add up to a shared pair total.',
        'Before a round you both tap Ready: a short countdown, a time limit, two independent guesses. It is not a race against strangers and not a stream for viewers — you play with each other.',
        'Each day has a place limit so the evening does not turn into an endless scroll. There is a couple leaderboard by total score: try to beat your own result or someone else’s record.',
        'The game opens from chat and the games catalog. To play, you need two accounts and an accepted partner request. Amorely is completely free right now — including this geo game.',
      ],
    },
  },
  {
    slug: 'draw-and-guess',
    category: 'product',
    publishedAt: '2026-08-28',
    imageFile: '9. game guess painting light.png',
    title: {
      ru: 'Нарисуй и угадай: как Gartic, только для вашей пары',
      en: 'Draw & guess: like Gartic, but just for your pair',
    },
    excerpt: {
      ru: 'Один рисует загадку, второй угадывает на ходу — кисти, цвета и смех без посторонних.',
      en: 'One sketches a prompt, the other guesses as you draw — brushes, color, and laughs with no outsiders.',
    },
    paragraphs: {
      ru: [
        '«Угадай рисунок» в Amorely устроен просто: один партнёр рисует слово или образ, второй угадывает, пока штрихи ещё появляются. Роли меняются каждый раунд — не нужно спорить, кто художник.',
        'На раунд около полутора минут. Чем быстрее угадали, тем больше очков. Можно играть дальше «за интерес», даже когда дневной рейтинг уже заполнен: это вечерняя минутка, а не обязательная катка.',
        'Игра доступна только паре с привязанным партнёром. Никакой общей комнаты с случайными людьми: холст, палитра и подсказки остаются между вами.',
        'Зайдите в игры из чата, нажмите «Готов» вдвоём и нарисуйте первую загадку. Регистрация бесплатная, отдельной подписки на игры нет.',
      ],
      en: [
        'Draw & guess in Amorely is simple: one partner sketches a word or image, the other guesses while the strokes are still appearing. Roles swap every round — no argument over who gets to draw.',
        'A round lasts about a minute and a half. Faster guesses score more. You can keep playing for fun after the daily ranked rounds are used up: an evening minute, not a mandatory match.',
        'The game is only for a couple with a linked partner. There is no public room of strangers: the canvas, palette, and clues stay between you.',
        'Open games from chat, tap Ready together, and sketch the first prompt. Sign-up is free, and there is no separate games subscription.',
      ],
    },
  },
  {
    slug: 'couple-quiz-board',
    category: 'product',
    publishedAt: '2026-08-29',
    imageFile: 'https://res.cloudinary.com/dlbrkdlco/image/upload/v1779967133/amorelyquestions_nobsog.jpg',
    title: {
      ru: 'Своя игра: поле с категориями только для вашей пары',
      en: 'Quiz board: categories and points just for your pair',
    },
    excerpt: {
      ru: 'Пять категорий, пятнадцать ячеек и общий счёт. Как телевикторина — без зрителей и без случайной комнаты.',
      en: 'Five categories, fifteen cells, and a shared score. Like a TV quiz — no audience and no random room.',
    },
    paragraphs: {
      ru: [
        '«Своя игра» в Amorely — это поле с категориями и стоимостью ячеек: 100, 200 или 300. Перед стартом оба нажимают «Готов», первый ход выбирается случайно, дальше вы ходите по очереди.',
        'На своём ходу откройте любую клетку. На ответ — 30 секунд, каждый вводит свой вариант. Если угадали оба, очки ячейки складываются в общий счёт пары. Сыгранную клетку открыть снова нельзя.',
        'Каждый день поле новое: пять случайных категорий и пятнадцать вопросов. Когда доска закрыта, следующее поле появится на следующий день. Рейтинг считается по суммарным очкам пары, а не по личным победам.',
        'Игра открывается из чата и каталога игр и доступна только связанным партнёрам. Случайных соперников нет — вы отвечаете вдвоём, в закрытом пространстве Amorely. Сейчас всё бесплатно.',
      ],
      en: [
        'The quiz board in Amorely is a grid of categories and cell values: 100, 200, or 300. You both tap Ready, the first turn is picked at random, then you take turns.',
        'On your turn open any cell. You have 30 seconds; each of you submits an answer. If both are right, the cell points add to the pair score. A played cell cannot be opened again.',
        'The board is new each day: five random categories and fifteen questions. After you clear it, the next board arrives the following day. The leaderboard uses the pair total, not solo wins.',
        'The game opens from chat and the games catalog and is only for linked partners. There are no random opponents — you answer together in Amorely’s private space. Everything is free right now.',
      ],
    },
  },
  {
    slug: 'tap-game-together',
    category: 'product',
    publishedAt: '2026-08-30',
    imageFile: 'https://res.cloudinary.com/dlbrkdlco/image/upload/v1779967133/tikalka_ha1xkg.jpg',
    title: {
      ru: 'Тыкалка: нажимайте вместе и прокачивайте прогресс',
      en: 'Tap game: tap together and spend points on upgrades',
    },
    excerpt: {
      ru: 'Общий блок, раунды всё сложнее и магазин улучшений. Рейтинг — по числу нажатий пары.',
      en: 'A shared block, rounds that get harder, and a shop for upgrades. The ranking is your pair’s tap count.',
    },
    paragraphs: {
      ru: [
        '«Тыкалка» в Amorely — простая игра на двоих: вы нажимаете на один блок. В начале раунда ждать партнёра не нужно — оба могут тыкать сразу. Следующий раунд начнётся, когда каждый закончит свою часть.',
        'С каждым раундом нужно в три раза больше нажатий. За тыки и за закрытый раунд капают баллы: награда растёт вместе со сложностью. Баллы тратятся в магазине на инструменты, которые ускоряют прогресс.',
        'После пятого раунда открываются четверной и мега-тык — пачки усиленных нажатий ×4 и ×10. Рейтинг строится по общему числу нажатий пары, а не по тому, кто кликал чаще в одиночку.',
        'Как и остальные игры, тыкалка доступна только после того, как вы свяжете аккаунты как партнёры. Зайдите из чата, начните раунд и сравните, как далеко уйдёт ваша пара. Подписки нет.',
      ],
      en: [
        'The tap game in Amorely is simple for two: you press one shared block. You do not wait for your partner at the start of a round — both of you can tap immediately. The next round starts when each of you has finished your part.',
        'Every new round needs three times as many taps. Taps and finished rounds earn points, and the reward grows with the difficulty. Spend those points in the shop on tools that speed you up.',
        'After the fifth round, quad and mega taps unlock — bursts of ×4 and ×10. The leaderboard uses the pair’s total tap count, not who clicked more alone.',
        'Like the other games, tap is only available after you link accounts as partners. Open it from chat, start a round, and see how far your pair can go. There is no subscription.',
      ],
    },
  },
  {
    slug: 'shared-plans-for-two',
    category: 'tips',
    publishedAt: '2026-08-31',
    imageFile: '10. calendar light.PNG',
    title: {
      ru: 'Планы: общая записная книжка рядом с календарём',
      en: 'Plans: a shared notebook next to the calendar',
    },
    excerpt: {
      ru: 'Заметки с категориями, дедлайнами и фото — видно обоим, без отдельного чата «не забудь».',
      en: 'Notes with categories, deadlines, and photos — both of you see them, without a separate “don’t forget” chat.',
    },
    paragraphs: {
      ru: [
        'Рядом с календарём в Amorely есть вкладка «Планы». Это общие заметки пары: заголовок, категория, текст и при желании фото или видео. Партнёр видит ту же карточку — не нужно пересылать список в мессенджер.',
        'Категории задаёте сами: путешествия, подарки, мечты, ремонт, выходные. Можно отфильтровать список и найти заметку по описанию, а не листать переписку трёхмесячной давности.',
        'К плану добавляется дедлайн и напоминание — себе, партнёру или обоим. Когда дело сделано, отметьте «Выполнено»: дата и кто закрыл задачу остаются в карточке.',
        'Планы живут в том же закрытом пространстве, что события календаря и лента. Чтобы пользоваться ими, свяжите аккаунты как партнёры. Сейчас раздел бесплатный, как и весь Amorely.',
      ],
      en: [
        'Next to the calendar in Amorely is a Plans tab. These are shared notes for the pair: a title, a category, text, and optional photos or video. Your partner sees the same card — no need to forward a list in a messenger.',
        'You name the categories yourselves: travel, gifts, dreams, repairs, weekends. Filter the list and search by description instead of scrolling a three-month-old chat.',
        'A plan can have a deadline and a reminder — for you, your partner, or both. When it is done, mark it complete: the date and who closed it stay on the card.',
        'Plans live in the same private space as calendar events and the feed. Link accounts as partners to use them. The section is free right now, like the rest of Amorely.',
      ],
    },
  },
];

export const getBlogPostBySlug = (slug: string): BlogPost | undefined =>
  BLOG_POSTS.find((post) => post.slug === slug);

export const filterBlogPosts = (
  query: string,
  category: BlogCategoryId | 'all',
  locale: LegalLocale
): BlogPost[] => {
  const normalized = query.trim().toLowerCase();
  return BLOG_POSTS.filter((post) => {
    if (category !== 'all' && post.category !== category) {
      return false;
    }
    if (!normalized) {
      return true;
    }
    const haystack = `${post.title[locale]} ${post.excerpt[locale]}`.toLowerCase();
    return haystack.includes(normalized);
  }).sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1));
};
