import { AppLocale, DEFAULT_LOCALE } from '../i18n/locales';

export type DatingIdeaLocalized = {
  title: string;
  description: string;
};

export type DatingIdeaDefinition = {
  id: string;
  emoji: string;
  locales: Partial<Record<AppLocale, DatingIdeaLocalized>> & { ru: DatingIdeaLocalized; en: DatingIdeaLocalized };
};

export const DATING_IDEA_COST = 100;
/** Reward for creating a calendar event from a dating idea. */
export const DATING_IDEA_EVENT_REWARD = 25;

/** Catalog of dating ideas. Base copy is Russian + English; other locales fall back to en/ru. */
export const DATING_IDEAS: DatingIdeaDefinition[] = [
  {
    id: 'picnic_sunset',
    emoji: '🧺',
    locales: {
      ru: { title: 'Пикник на закате', description: 'Соберите корзину с любимыми закусками, плед и найдите место с красивым закатом. Без телефонов — только вы двое.' },
      en: { title: 'Sunset picnic', description: 'Pack a basket with favorite snacks, a blanket, and find a spot with a beautiful sunset. No phones — just the two of you.' },
      uk: { title: 'Пікнік на заході сонця', description: 'Зберіть кошик з улюбленими закусками, плед і знайдіть місце з гарним заходом сонця. Без телефонів — лише ви двоє.' },
      by: { title: 'Пікнік на захадзе сонца', description: 'Збярыце кошык з любімымі закускамі, плед і знойдзіце месца з прыгожым захадам сонца. Без тэлефонаў — толькі вы двое.' },
      es: { title: 'Picnic al atardecer', description: 'Preparen una cesta con snacks favoritos, una manta y busquen un lugar con un atardecer hermoso. Sin teléfonos — solo ustedes dos.' },
      de: { title: 'Picknick bei Sonnenuntergang', description: 'Packt einen Korb mit Lieblingssnacks, eine Decke und findet einen Platz mit schönem Sonnenuntergang. Ohne Handys — nur ihr zwei.' },
      fr: { title: 'Pique-nique au coucher du soleil', description: 'Préparez un panier avec vos snacks préférés, une couverture et trouvez un endroit avec un beau coucher de soleil. Sans téléphones — juste vous deux.' },
      pt: { title: 'Piquenique ao pôr do sol', description: 'Preparem uma cesta com petiscos favoritos, um cobertor e encontrem um lugar com um belo pôr do sol. Sem celulares — só vocês dois.' },
    },
  },
  {
    id: 'home_cooking',
    emoji: '👨‍🍳',
    locales: {
      ru: { title: 'Готовим вместе дома', description: 'Выберите новый рецепт, купите продукты вместе и приготовьте ужин в четыре руки. Потом ужин при свечах.' },
      en: { title: 'Cook together at home', description: 'Pick a new recipe, shop for ingredients together, and cook dinner side by side. Finish with a candlelit meal.' },
      uk: { title: 'Готуємо разом вдома', description: 'Оберіть новий рецепт, купіть продукти разом і приготуйте вечерю в чотири руки. Потім вечеря при свічках.' },
      by: { title: 'Гатуем разам дома', description: 'Выберыце новы рэцэпт, купіце прадукты разам і прыгатуйце вячэру ў чатыры рукі. Потым вячэра пры свечках.' },
      de: { title: 'Zusammen kochen zu Hause', description: 'Wählt ein neues Rezept, kauft zusammen ein und kocht zu zweit. Danach ein Abendessen bei Kerzenschein.' },
      es: { title: 'Cocinar juntos en casa', description: 'Elijan una receta nueva, compren los ingredientes juntos y cocinen la cena a cuatro manos. Después, cena a la luz de las velas.' },
      fr: { title: 'Cuisiner ensemble à la maison', description: 'Choisissez une nouvelle recette, faites les courses ensemble et cuisinez à quatre mains. Puis un dîner aux chandelles.' },
      pt: { title: 'Cozinhar juntos em casa', description: 'Escolham uma receita nova, comprem os ingredientes juntos e preparem o jantar a quatro mãos. Depois, jantar à luz de velas.' },
    },
  },
  {
    id: 'night_walk',
    emoji: '🌙',
    locales: {
      ru: { title: 'Ночная прогулка', description: 'Выйдите вечером без плана — просто гуляйте по знакомым улицам, разговаривайте и смотрите на огни города.' },
      en: { title: 'Night walk', description: 'Go out in the evening with no plan — wander familiar streets, talk, and watch the city lights.' },
      uk: { title: 'Нічна прогулянка', description: 'Вийдіть увечері без плану — просто гуляйте знайомими вулицями, розмовляйте і дивіться на вогні міста.' },
      by: { title: 'Начная прагулка', description: 'Выйдзіце ўвечары без плана — проста гуляйце знаёмымі вуліцамі, размаўляйце і глядзіце на агні горада.' },
      de: { title: 'Nachtspaziergang', description: 'Geht abends ohne Plan raus — schlendert durch bekannte Straßen, redet und schaut die Stadtlichter an.' },
      es: { title: 'Paseo nocturno', description: 'Salgan por la noche sin plan — caminen por calles conocidas, hablen y miren las luces de la ciudad.' },
      fr: { title: 'Promenade nocturne', description: 'Sortez le soir sans plan — flânez dans des rues familières, parlez et admirez les lumières de la ville.' },
      pt: { title: 'Caminhada noturna', description: 'Saiam à noite sem plano — passeiem por ruas conhecidas, conversem e olhem as luzes da cidade.' },
    },
  },
  {
    id: 'museum_date',
    emoji: '🖼️',
    locales: {
      ru: { title: 'Дата в музее или галерее', description: 'Выберите выставку, которую ещё не видели. После — обсудите любимые работы за кофе.' },
      en: { title: 'Museum or gallery date', description: 'Pick an exhibition you haven’t seen yet. Afterwards, talk about your favorite pieces over coffee.' },
      uk: { title: 'Побачення в музеї чи галереї', description: 'Оберіть виставку, яку ще не бачили. Після — обговоріть улюблені роботи за кавою.' },
      by: { title: 'Спатканне ў музеі ці галерэі', description: 'Выберыце выставу, якую яшчэ не бачылі. Пасля — абмяркуйце любімыя работы за кавай.' },
      de: { title: 'Museum- oder Galerie-Date', description: 'Wählt eine Ausstellung, die ihr noch nicht gesehen habt. Danach besprecht eure Lieblingswerke bei einem Kaffee.' },
      es: { title: 'Cita en museo o galería', description: 'Elijan una exposición que aún no hayan visto. Después, hablen de sus obras favoritas tomando un café.' },
      fr: { title: 'Rendez-vous au musée ou à la galerie', description: 'Choisissez une expo que vous n’avez pas encore vue. Ensuite, parlez de vos œuvres préférées autour d’un café.' },
      pt: { title: 'Encontro no museu ou galeria', description: 'Escolham uma exposição que ainda não viram. Depois, falem das obras favoritas tomando um café.' },
    },
  },
  {
    id: 'board_games',
    emoji: '🎲',
    locales: {
      ru: { title: 'Вечер настольных игр', description: 'Устройте домашний турнир: две-три любимые игры, снеки и немного здоровой конкуренции.' },
      en: { title: 'Board game night', description: 'Host a home tournament: two or three favorite games, snacks, and a bit of friendly competition.' },
      uk: { title: 'Вечір настільних ігор', description: 'Влаштуйте домашній турнір: дві-три улюблені ігри, снеки і трохи здорової конкуренції.' },
      by: { title: 'Вечар настольных гульняў', description: 'Уладкуйце хатні турнір: дзве-тры любімыя гульні, снекі і крыху здаровай канкурэнцыі.' },
      de: { title: 'Brettspielabend', description: 'Veranstaltet ein Heimturnier: zwei bis drei Lieblingsspiele, Snacks und ein bisschen freundlichen Wettbewerb.' },
      es: { title: 'Noche de juegos de mesa', description: 'Organicen un torneo en casa: dos o tres juegos favoritos, snacks y un poco de sana competencia.' },
      fr: { title: 'Soirée jeux de société', description: 'Organisez un tournoi maison : deux ou trois jeux préférés, des snacks et un peu de saine compétition.' },
      pt: { title: 'Noite de jogos de tabuleiro', description: 'Organizem um torneio em casa: dois ou três jogos favoritos, petiscos e um pouco de competição saudável.' },
    },
  },
  {
    id: 'photo_quest',
    emoji: '📷',
    locales: {
      ru: { title: 'Фото-квест по городу', description: 'Составьте список из 8 мест или объектов и найдите их вместе, делая по кадру на каждом.' },
      en: { title: 'City photo quest', description: 'Make a list of 8 places or objects and find them together, taking a shot at each one.' },
      uk: { title: 'Фото-квест містом', description: 'Складіть список із 8 місць або об’єктів і знайдіть їх разом, роблячи кадр на кожному.' },
      by: { title: 'Фота-квест па горадзе', description: 'Складзіце спіс з 8 месцаў ці аб’ектаў і знойдзіце іх разам, робячы кадр на кожным.' },
      de: { title: 'Foto-Quest durch die Stadt', description: 'Macht eine Liste mit 8 Orten oder Objekten und findet sie zusammen — an jedem einen Shot.' },
      es: { title: 'Foto-quest por la ciudad', description: 'Hagan una lista de 8 lugares u objetos y encuéntrenlos juntos, tomando una foto en cada uno.' },
      fr: { title: 'Photo-quête en ville', description: 'Faites une liste de 8 lieux ou objets et trouvez-les ensemble, en prenant une photo à chaque arrêt.' },
      pt: { title: 'Foto-quest pela cidade', description: 'Façam uma lista de 8 lugares ou objetos e encontrem-nos juntos, tirando uma foto em cada um.' },
    },
  },
  {
    id: 'breakfast_in_bed',
    emoji: '🥐',
    locales: {
      ru: { title: 'Завтрак в постель', description: 'Один готовит сюрприз-завтрак, пока второй ещё спит. Потом ленивое утро без спешки.' },
      en: { title: 'Breakfast in bed', description: 'One prepares a surprise breakfast while the other is still asleep. Then enjoy a slow morning.' },
      uk: { title: 'Сніданок у ліжко', description: 'Один готує сюрприз-сніданок, поки другий ще спить. Потім лінивий ранок без поспіху.' },
      by: { title: 'Снеданне ў ложак', description: 'Адзін рыхтуе сюрпрыз-снеданне, пакуль другі яшчэ спіць. Потым лянівая раніца без спяшання.' },
      de: { title: 'Frühstück im Bett', description: 'Einer bereitet ein Überraschungsfrühstück zu, während der andere noch schläft. Danach ein entspanntes Morgen ohne Hetze.' },
      es: { title: 'Desayuno en la cama', description: 'Uno prepara un desayuno sorpresa mientras el otro aún duerme. Luego, una mañana perezosa sin prisas.' },
      fr: { title: 'Petit-déjeuner au lit', description: 'L’un prépare un petit-déj surprise pendant que l’autre dort encore. Puis une matinée lente, sans précipitation.' },
      pt: { title: 'Café da manhã na cama', description: 'Um prepara um café da manhã surpresa enquanto o outro ainda dorme. Depois, uma manhã preguiçosa sem pressa.' },
    },
  },
  {
    id: 'stargazing',
    emoji: '✨',
    locales: {
      ru: { title: 'Смотрим на звёзды', description: 'Уезжайте чуть за город или найдите тёмную крышу/парк. Возьмите плед и тёплый чай.' },
      en: { title: 'Stargazing', description: 'Head a bit outside the city or find a dark rooftop/park. Bring a blanket and warm tea.' },
      uk: { title: 'Дивимося на зорі', description: 'Виїдьте трохи за місто або знайдіть темний дах/парк. Візьміть плед і теплий чай.' },
      by: { title: 'Глядзім на зоркі', description: 'Выездзьце крыху за горад ці знойдзіце цёмны дах/парк. Вазьміце плед і цёплы чай.' },
      de: { title: 'Sterne beobachten', description: 'Fahrt etwas aus der Stadt oder findet ein dunkles Dach/einen Park. Nehmt eine Decke und warmen Tee mit.' },
      es: { title: 'Mirar las estrellas', description: 'Salgan un poco de la ciudad o encuentren una azotea/parque oscuro. Lleven una manta y té caliente.' },
      fr: { title: 'Observer les étoiles', description: 'Sortez un peu de la ville ou trouvez un toit/parc sombre. Emportez une couverture et du thé chaud.' },
      pt: { title: 'Olhar as estrelas', description: 'Saiam um pouco da cidade ou encontrem um terraço/parque escuro. Levem um cobertor e chá quente.' },
    },
  },
  {
    id: 'thrift_challenge',
    emoji: '🛍️',
    locales: {
      ru: { title: 'Челендж секонд-хенда', description: 'У каждого бюджет 500–1000. Найдите друг другу образ и устройте мини-показ дома.' },
      en: { title: 'Thrift shop challenge', description: 'Each gets a small budget. Find an outfit for each other and host a mini fashion show at home.' },
      uk: { title: 'Челендж секонд-хенду', description: 'У кожного невеликий бюджет. Знайдіть одне одному образ і влаштуйте міні-показ удома.' },
      by: { title: 'Чэлендж секанд-хенду', description: 'У кожнага невялікі бюджэт. Знойдзіце адно аднаму вобраз і ўладкуйце міні-паказ дома.' },
      de: { title: 'Secondhand-Challenge', description: 'Jeder bekommt ein kleines Budget. Sucht euch gegenseitig ein Outfit und veranstaltet eine Mini-Modenschau zu Hause.' },
      es: { title: 'Reto de tienda de segunda mano', description: 'Cada uno tiene un presupuesto pequeño. Encuentren un look el uno para el otro y organicen un mini desfile en casa.' },
      fr: { title: 'Défi friperie', description: 'Chacun a un petit budget. Trouvez une tenue l’un pour l’autre et organisez un mini défilé à la maison.' },
      pt: { title: 'Desafio do brechó', description: 'Cada um tem um orçamento pequeno. Encontrem um look um para o outro e façam um mini desfile em casa.' },
    },
  },
  {
    id: 'cinema_home',
    emoji: '🎬',
    locales: {
      ru: { title: 'Домашний кинотеатр', description: 'Выберите фильм, который оба хотели посмотреть. Попкорн, плед, свет приглушён — как в кино.' },
      en: { title: 'Home cinema', description: 'Pick a movie you’ve both wanted to watch. Popcorn, a blanket, dim lights — just like a theater.' },
      uk: { title: 'Домашній кінотеатр', description: 'Оберіть фільм, який обидва хотіли подивитися. Попкорн, плед, приглушене світло — як у кіно.' },
      by: { title: 'Хатні кінатэатр', description: 'Выберыце фільм, які абодва хацелі паглядзець. Папкорн, плед, прыглушанае святло — як у кіно.' },
      de: { title: 'Heimkino', description: 'Wählt einen Film, den ihr beide sehen wolltet. Popcorn, Decke, gedimmtes Licht — wie im Kino.' },
      es: { title: 'Cine en casa', description: 'Elijan una película que ambos querían ver. Palomitas, manta, luces tenues — como en el cine.' },
      fr: { title: 'Cinéma à la maison', description: 'Choisissez un film que vous vouliez tous les deux voir. Pop-corn, couverture, lumière tamisée — comme au cinéma.' },
      pt: { title: 'Cinema em casa', description: 'Escolham um filme que ambos queriam ver. Pipoca, cobertor, luz baixa — como no cinema.' },
    },
  },
  {
    id: 'dance_kitchen',
    emoji: '💃',
    locales: {
      ru: { title: 'Танцы на кухне', description: 'Включите плейлист из любимых песен и танцуйте 30 минут — без стеснения, только веселье.' },
      en: { title: 'Kitchen dance party', description: 'Put on a playlist of favorite songs and dance for 30 minutes — no shame, just fun.' },
      uk: { title: 'Танці на кухні', description: 'Увімкніть плейлист улюблених пісень і танцюйте 30 хвилин — без сорому, лише веселощі.' },
      by: { title: 'Танцы на кухні', description: 'Уключыце плэйліст любімых песень і танцуйце 30 хвілін — без сарамлівасці, толькі веселле.' },
      de: { title: 'Tanzparty in der Küche', description: 'Legt eine Playlist mit Lieblingssongs auf und tanzt 30 Minuten — ohne Scham, nur Spaß.' },
      es: { title: 'Baile en la cocina', description: 'Pongan una playlist de canciones favoritas y bailen 30 minutos — sin vergüenza, solo diversión.' },
      fr: { title: 'Danse dans la cuisine', description: 'Mettez une playlist de chansons préférées et dansez 30 minutes — sans gêne, juste du plaisir.' },
      pt: { title: 'Dança na cozinha', description: 'Coloquem uma playlist de músicas favoritas e dançem 30 minutos — sem vergonha, só diversão.' },
    },
  },
  {
    id: 'bookstore_date',
    emoji: '📚',
    locales: {
      ru: { title: 'Дата в книжном', description: 'Каждый выбирает книгу для партнёра. Потом читайте в кафе первые главы вслух или про себя.' },
      en: { title: 'Bookstore date', description: 'Each picks a book for the other. Then read the first chapters at a café — aloud or quietly.' },
      uk: { title: 'Побачення в книгарні', description: 'Кожен обирає книгу для партнера. Потім читайте в кафе перші розділи вголос або про себе.' },
      by: { title: 'Спатканне ў кнігарні', description: 'Кожны выбірае кнігу для партнёра. Потым чытайце ў кавярні першыя раздзелы ўголас ці пра сябе.' },
      de: { title: 'Buchladen-Date', description: 'Jeder sucht ein Buch für den anderen aus. Danach lest im Café die ersten Kapitel — laut oder still.' },
      es: { title: 'Cita en la librería', description: 'Cada uno elige un libro para el otro. Luego lean en un café los primeros capítulos — en voz alta o en silencio.' },
      fr: { title: 'Rendez-vous en librairie', description: 'Chacun choisit un livre pour l’autre. Puis lisez au café les premiers chapitres — à voix haute ou en silence.' },
      pt: { title: 'Encontro na livraria', description: 'Cada um escolhe um livro para o outro. Depois leiam num café os primeiros capítulos — em voz alta ou em silêncio.' },
    },
  },
  {
    id: 'spa_home',
    emoji: '🛁',
    locales: {
      ru: { title: 'Домашний спа-вечер', description: 'Маски, массаж плеч, чай и спокойная музыка. Забота друг о друге — главный ритуал.' },
      en: { title: 'Home spa evening', description: 'Face masks, shoulder massage, tea, and calm music. Caring for each other is the whole ritual.' },
      uk: { title: 'Домашній спа-вечір', description: 'Маски, масаж плечей, чай і спокійна музика. Турбота одне про одного — головний ритуал.' },
      by: { title: 'Хатні спа-вечар', description: 'Маскі, масаж плячэй, чай і спакойная музыка. Клопат адно пра аднаго — галоўны рытуал.' },
      de: { title: 'Spa-Abend zu Hause', description: 'Masken, Schultermassage, Tee und ruhige Musik. Sich umeinander kümmern ist das ganze Ritual.' },
      es: { title: 'Noche spa en casa', description: 'Mascarillas, masaje de hombros, té y música tranquila. Cuidarse mutuamente es todo el ritual.' },
      fr: { title: 'Soirée spa à la maison', description: 'Masques, massage des épaules, thé et musique douce. Prendre soin l’un de l’autre, c’est tout le rituel.' },
      pt: { title: 'Noite spa em casa', description: 'Máscaras, massagem nos ombros, chá e música calma. Cuidar um do outro é o ritual inteiro.' },
    },
  },
  {
    id: 'letter_exchange',
    emoji: '💌',
    locales: {
      ru: { title: 'Обмен письмами', description: 'Напишите друг другу письмо о том, за что благодарны. Прочитайте вслух за ужином.' },
      en: { title: 'Letter exchange', description: 'Write each other a letter about what you’re grateful for. Read them aloud over dinner.' },
      uk: { title: 'Обмін листами', description: 'Напишіть одне одному листа про те, за що вдячні. Прочитайте вголос за вечерею.' },
      by: { title: 'Абмен лістамі', description: 'Напішыце адно аднаму ліст пра тое, за што ўдзячныя. Прачытайце ўголас за вячэрай.' },
      de: { title: 'Briefaustausch', description: 'Schreibt euch einen Brief darüber, wofür ihr dankbar seid. Lest sie beim Abendessen laut vor.' },
      es: { title: 'Intercambio de cartas', description: 'Escríbanse una carta sobre aquello por lo que están agradecidos. Léanlas en voz alta durante la cena.' },
      fr: { title: 'Échange de lettres', description: 'Écrivez-vous une lettre sur ce pour quoi vous êtes reconnaissants. Lisez-les à voix haute pendant le dîner.' },
      pt: { title: 'Troca de cartas', description: 'Escrevam um para o outro uma carta sobre o que são gratos. Leiam em voz alta durante o jantar.' },
    },
  },
  {
    id: 'bike_ride',
    emoji: '🚲',
    locales: {
      ru: { title: 'Велопрогулка', description: 'Арендуйте или возьмите велосипеды и проедьте новый маршрут. Финиш — мороженое или кофе.' },
      en: { title: 'Bike ride', description: 'Rent or grab bikes and ride a new route. Finish with ice cream or coffee.' },
      uk: { title: 'Велопрогулянка', description: 'Орендуйте або візьміть велосипеди й проїдьте новий маршрут. Фініш — морозиво чи кава.' },
      by: { title: 'Велапрагулка', description: 'Арэндуйце ці вазьміце ровары і праедзьце новы маршрут. Фініш — марозіва ці кава.' },
      de: { title: 'Fahrradausflug', description: 'Mietet oder nehmt Fahrräder und fahrt eine neue Route. Zum Abschluss Eis oder Kaffee.' },
      es: { title: 'Paseo en bici', description: 'Alquilen o tomen bicis y hagan una ruta nueva. Al final, helado o café.' },
      fr: { title: 'Balade à vélo', description: 'Louez ou prenez des vélos et faites un nouvel itinéraire. Finissez par une glace ou un café.' },
      pt: { title: 'Passeio de bicicleta', description: 'Aluguem ou peguem bicicletas e façam um percurso novo. No fim, sorvete ou café.' },
    },
  },
  {
    id: 'farmers_market',
    emoji: '🥕',
    locales: {
      ru: { title: 'Утро на фермерском рынке', description: 'Прогуляйтесь по рынку, купите что-то необычное и приготовьте из этого обед.' },
      en: { title: 'Farmers market morning', description: 'Wander the market, buy something unusual, and cook lunch from it.' },
      uk: { title: 'Ранок на фермерському ринку', description: 'Прогуляйтеся ринком, купіть щось незвичне і приготуйте з цього обід.' },
      by: { title: 'Раніца на фермерскім рынку', description: 'Прагуляйцеся рынкам, купіце штосьці незвычайнае і прыгатуйце з гэтага абед.' },
      de: { title: 'Morgen auf dem Bauernmarkt', description: 'Schlendert über den Markt, kauft etwas Ungewöhnliches und kocht daraus das Mittagessen.' },
      es: { title: 'Mañana en el mercado de agricultores', description: 'Paseen por el mercado, compren algo inusual y preparen el almuerzo con ello.' },
      fr: { title: 'Matinée au marché fermier', description: 'Flânez au marché, achetez quelque chose d’insolite et cuisinez le déjeuner avec.' },
      pt: { title: 'Manhã no mercado de produtores', description: 'Passeiem pelo mercado, comprem algo incomum e preparem o almoço com isso.' },
    },
  },
  {
    id: 'karaoke',
    emoji: '🎤',
    locales: {
      ru: { title: 'Караоке-вечер', description: 'Дома или в караоке-баре спойте любимые хиты — дуэты обязательны.' },
      en: { title: 'Karaoke night', description: 'At home or in a karaoke bar, sing your favorite hits — duets are mandatory.' },
      uk: { title: 'Караоке-вечір', description: 'Вдома чи в караоке-барі заспівайте улюблені хіти — дуети обов’язкові.' },
      by: { title: 'Караоке-вечар', description: 'Дома ці ў караоке-бары заспявайце любімыя хіты — дуэты абавязковыя.' },
      de: { title: 'Karaoke-Abend', description: 'Zu Hause oder in einer Karaoke-Bar: singt eure Lieblingshits — Duette sind Pflicht.' },
      es: { title: 'Noche de karaoke', description: 'En casa o en un bar de karaoke, canten sus éxitos favoritos — los dúos son obligatorios.' },
      fr: { title: 'Soirée karaoké', description: 'À la maison ou dans un bar karaoké, chantez vos tubes préférés — les duos sont obligatoires.' },
      pt: { title: 'Noite de karaokê', description: 'Em casa ou num bar de karaokê, cantem seus hits favoritos — duetos são obrigatórios.' },
    },
  },
  {
    id: 'memory_lane',
    emoji: '🗂️',
    locales: {
      ru: { title: 'Вечер воспоминаний', description: 'Достаньте старые фото и переписки. Вспоминайте первые свидания и смешные моменты.' },
      en: { title: 'Memory lane evening', description: 'Pull out old photos and chats. Relive first dates and funny moments together.' },
      uk: { title: 'Вечір спогадів', description: 'Дістаньте старі фото й листування. Згадуйте перші побачення та смішні моменти.' },
      by: { title: 'Вечар успамінаў', description: 'Дастаньце старыя фота і перапіску. Узгадвайце першыя спатканні і смешныя моманты.' },
      de: { title: 'Abend der Erinnerungen', description: 'Holt alte Fotos und Chats hervor. Erinnert euch an erste Dates und lustige Momente.' },
      es: { title: 'Noche de recuerdos', description: 'Saquen fotos y chats viejos. Recuerden las primeras citas y momentos divertidos.' },
      fr: { title: 'Soirée souvenirs', description: 'Sortez les vieilles photos et conversations. Revivez les premiers rendez-vous et les moments drôles.' },
      pt: { title: 'Noite de memórias', description: 'Tirem fotos e conversas antigas. Relembrem os primeiros encontros e momentos engraçados.' },
    },
  },
  {
    id: 'surprise_route',
    emoji: '🗺️',
    locales: {
      ru: { title: 'Сюрприз-маршрут', description: 'Один планирует 3 точки в городе и ведёт второго, не раскрывая следующий адрес.' },
      en: { title: 'Surprise route', description: 'One person plans 3 spots in the city and leads the other without revealing the next address.' },
      uk: { title: 'Сюрприз-маршрут', description: 'Один планує 3 точки в місті й веде другого, не розкриваючи наступну адресу.' },
      by: { title: 'Сюрпрыз-маршрут', description: 'Адзін плануе 3 пункты ў горадзе і вядзе другога, не раскрываючы наступны адрас.' },
      de: { title: 'Überraschungsroute', description: 'Einer plant 3 Orte in der Stadt und führt den anderen, ohne die nächste Adresse zu verraten.' },
      es: { title: 'Ruta sorpresa', description: 'Uno planifica 3 puntos en la ciudad y guía al otro sin revelar la siguiente dirección.' },
      fr: { title: 'Itinéraire surprise', description: 'L’un planifie 3 arrêts en ville et guide l’autre sans révéler la prochaine adresse.' },
      pt: { title: 'Roteiro surpresa', description: 'Um planeja 3 pontos na cidade e guia o outro sem revelar o próximo endereço.' },
    },
  },
  {
    id: 'pottery_or_craft',
    emoji: '🎨',
    locales: {
      ru: { title: 'Мастер-класс вдвоём', description: 'Гончарка, живопись, свечи — любой творческий воркшоп, где можно творить рядом.' },
      en: { title: 'Creative workshop for two', description: 'Pottery, painting, candles — any creative workshop where you can make something side by side.' },
      uk: { title: 'Майстер-клас удвох', description: 'Гончарка, живопис, свічки — будь-який творчий воркшоп, де можна творити поруч.' },
      by: { title: 'Майстар-клас удваіх', description: 'Ганчарка, жывапіс, свечкі — любы творчы воркшоп, дзе можна тварыць побач.' },
      de: { title: 'Kreativ-Workshop zu zweit', description: 'Töpfern, Malen, Kerzen — jeder kreative Workshop, bei dem ihr nebeneinander etwas schaffen könnt.' },
      es: { title: 'Taller creativo para dos', description: 'Cerámica, pintura, velas — cualquier taller creativo donde puedan crear juntos.' },
      fr: { title: 'Atelier créatif à deux', description: 'Poterie, peinture, bougies — tout atelier créatif où vous pouvez créer côte à côte.' },
      pt: { title: 'Oficina criativa a dois', description: 'Cerâmica, pintura, velas — qualquer workshop criativo onde possam criar lado a lado.' },
    },
  },
  {
    id: 'sunrise_date',
    emoji: '🌅',
    locales: {
      ru: { title: 'Свидание на рассвете', description: 'Встаньте пораньше, возьмите термос и встретьте рассвет в красивом месте.' },
      en: { title: 'Sunrise date', description: 'Wake up early, bring a thermos, and watch the sunrise somewhere beautiful.' },
      uk: { title: 'Побачення на світанку', description: 'Встаньте раніше, візьміть термос і зустріньте світанок у гарному місці.' },
      by: { title: 'Спатканне на світанку', description: 'Устаньце раней, вазьміце тэрмас і сустрэньце світанак у прыгожым месцы.' },
      de: { title: 'Sonnenaufgangs-Date', description: 'Steht früh auf, nehmt eine Thermoskanne mit und begrüßt den Sonnenaufgang an einem schönen Ort.' },
      es: { title: 'Cita al amanecer', description: 'Levántense temprano, lleven un termo y vean el amanecer en un lugar hermoso.' },
      fr: { title: 'Rendez-vous au lever du soleil', description: 'Levez-vous tôt, emportez un thermos et admirez le lever du soleil dans un bel endroit.' },
      pt: { title: 'Encontro ao nascer do sol', description: 'Acordem cedo, levem uma garrafa térmica e vejam o nascer do sol num lugar bonito.' },
    },
  },
  {
    id: 'dessert_tour',
    emoji: '🍰',
    locales: {
      ru: { title: 'Тур по десертам', description: 'Посетите 3 места с разными сладкими специалитетами и выберите победителя.' },
      en: { title: 'Dessert crawl', description: 'Visit 3 places with different sweet specialties and pick a winner.' },
      uk: { title: 'Тур десертами', description: 'Відвідайте 3 місця з різними солодкими спеціалітетами і оберіть переможця.' },
      by: { title: 'Тур па дэсертах', description: 'Наведайце 3 месцы з рознымі салодкімі спецыялітэтамі і выберыце пераможцу.' },
      de: { title: 'Dessert-Tour', description: 'Besucht 3 Orte mit unterschiedlichen süßen Spezialitäten und wählt einen Sieger.' },
      es: { title: 'Ruta de postres', description: 'Visiten 3 lugares con distintas especialidades dulces y elijan un ganador.' },
      fr: { title: 'Tour des desserts', description: 'Visitez 3 endroits avec des spécialités sucrées différentes et désignez un gagnant.' },
      pt: { title: 'Tour de sobremesas', description: 'Visitem 3 lugares com especialidades doces diferentes e escolham um vencedor.' },
    },
  },
  {
    id: 'volunteer_together',
    emoji: '🤝',
    locales: {
      ru: { title: 'Доброе дело вместе', description: 'Пожертвуйте вещи, помогите приюту или посадите дерево — свидание с смыслом.' },
      en: { title: 'Do good together', description: 'Donate clothes, help a shelter, or plant a tree — a date with meaning.' },
      uk: { title: 'Добра справа разом', description: 'Пожертвуйте речі, допоможіть притулку або посадіть дерево — побачення зі змістом.' },
      by: { title: 'Добрая справа разам', description: 'Пахертвуйце рэчы, дапамажыце прытулку ці пасадзіце дрэва — спатканне са сэнсам.' },
      de: { title: 'Gemeinsam Gutes tun', description: 'Spendet Kleidung, helft einem Tierheim oder pflanzt einen Baum — ein Date mit Sinn.' },
      es: { title: 'Hacer el bien juntos', description: 'Donen ropa, ayuden a un refugio o planten un árbol — una cita con sentido.' },
      fr: { title: 'Faire le bien ensemble', description: 'Donnez des vêtements, aidez un refuge ou plantez un arbre — un rendez-vous qui a du sens.' },
      pt: { title: 'Fazer o bem juntos', description: 'Doem roupas, ajudem um abrigo ou plantem uma árvore — um encontro com significado.' },
    },
  },
  {
    id: 'rooftop_coffee',
    emoji: '☕',
    locales: {
      ru: { title: 'Кофе с видом', description: 'Найдите кафе с панорамой или крышу с видом на город и просто будьте рядом.' },
      en: { title: 'Coffee with a view', description: 'Find a café with a panorama or a rooftop overlooking the city and simply be together.' },
      uk: { title: 'Кава з видом', description: 'Знайдіть кав’ярню з панорамою або дах з видом на місто і просто будьте поруч.' },
      by: { title: 'Кава з відам', description: 'Знойдзіце кавярню з панарамай ці дах з відам на горад і проста будзьце побач.' },
      de: { title: 'Kaffee mit Aussicht', description: 'Findet ein Café mit Panorama oder ein Dach mit Blick über die Stadt und seid einfach zusammen.' },
      es: { title: 'Café con vistas', description: 'Encuentren un café con panorama o una azotea con vistas a la ciudad y simplemente estén juntos.' },
      fr: { title: 'Café avec vue', description: 'Trouvez un café panoramique ou un toit avec vue sur la ville et soyez simplement ensemble.' },
      pt: { title: 'Café com vista', description: 'Encontrem um café com panorama ou um terraço com vista para a cidade e simplesmente fiquem juntos.' },
    },
  },
  {
    id: 'playlist_exchange',
    emoji: '🎧',
    locales: {
      ru: { title: 'Обмен плейлистами', description: 'Составьте друг другу плейлист «наш вечер» и слушайте его на прогулке или дома.' },
      en: { title: 'Playlist exchange', description: 'Make each other a “our evening” playlist and listen on a walk or at home.' },
      uk: { title: 'Обмін плейлистами', description: 'Складіть одне одному плейлист «наш вечір» і слухайте його на прогулянці чи вдома.' },
      by: { title: 'Абмен плэйлістамі', description: 'Складзіце адно аднаму плэйліст «наш вечар» і слухайце яго на прагулцы ці дома.' },
      de: { title: 'Playlist-Tausch', description: 'Macht euch gegenseitig eine Playlist „unser Abend“ und hört sie beim Spazierengehen oder zu Hause.' },
      es: { title: 'Intercambio de playlists', description: 'Háganse una playlist «nuestra noche» y escúchenla en un paseo o en casa.' },
      fr: { title: 'Échange de playlists', description: 'Faites-vous une playlist « notre soirée » et écoutez-la en promenade ou à la maison.' },
      pt: { title: 'Troca de playlists', description: 'Façam um para o outro uma playlist “nossa noite” e ouçam num passeio ou em casa.' },
    },
  },
  {
    id: 'boat_or_ferry',
    emoji: '⛵',
    locales: {
      ru: { title: 'Прогулка на воде', description: 'Катер, паром или лодка — любой водный маршрут, где можно побыть вдвоём.' },
      en: { title: 'On the water', description: 'A boat, ferry, or small craft — any water route where you can be just the two of you.' },
      uk: { title: 'Прогулянка на воді', description: 'Катер, пором чи човен — будь-який водний маршрут, де можна побути вдвох.' },
      by: { title: 'Прагулка на вадзе', description: 'Катар, паром ці лодка — любы водны маршрут, дзе можна пабыць удваіх.' },
      de: { title: 'Auf dem Wasser', description: 'Boot, Fähre oder Kahn — jede Wasserroute, wo ihr einfach zu zweit sein könnt.' },
      es: { title: 'Paseo por el agua', description: 'Barco, ferry o lancha — cualquier ruta acuática donde puedan estar solo los dos.' },
      fr: { title: 'Sur l’eau', description: 'Bateau, ferry ou barque — tout trajet sur l’eau où vous pouvez être juste tous les deux.' },
      pt: { title: 'Passeio na água', description: 'Barco, balsa ou lancha — qualquer rota aquática onde possam ficar só vocês dois.' },
    },
  },
  {
    id: 'astro_cafe',
    emoji: '🪐',
    locales: {
      ru: { title: 'Тема вечера: космос', description: 'Документалка про космос, горячий шоколад и разговор «куда бы мы полетели».' },
      en: { title: 'Space-themed evening', description: 'A space documentary, hot chocolate, and a talk about where you’d travel among the stars.' },
      uk: { title: 'Тема вечора: космос', description: 'Документалка про космос, гарячий шоколад і розмова «куди б ми полетіли».' },
      by: { title: 'Тэма вечара: космас', description: 'Дакументалка пра космас, гарачы шакалад і размова «куды б мы паляцелі».' },
      de: { title: 'Abendthema: Weltall', description: 'Eine Doku übers All, heiße Schokolade und ein Gespräch darüber, wohin ihr unter den Sternen reisen würdet.' },
      es: { title: 'Tema de la noche: el espacio', description: 'Un documental del espacio, chocolate caliente y una charla sobre adónde viajarían entre las estrellas.' },
      fr: { title: 'Thème de la soirée : l’espace', description: 'Un documentaire sur l’espace, du chocolat chaud et une discussion sur où vous iriez parmi les étoiles.' },
      pt: { title: 'Tema da noite: espaço', description: 'Um documentário sobre o espaço, chocolate quente e uma conversa sobre aonde viajariam entre as estrelas.' },
    },
  },
  {
    id: 'slow_morning',
    emoji: '🌤️',
    locales: {
      ru: { title: 'Медленное утро', description: 'Никаких планов до обеда: кофе, музыка, объятия и разговоры ни о чём важном.' },
      en: { title: 'Slow morning', description: 'No plans until noon: coffee, music, hugs, and conversations about nothing urgent.' },
      uk: { title: 'Повільний ранок', description: 'Жодних планів до обіду: кава, музика, обійми й розмови ні про що важливе.' },
      by: { title: 'Павольная раніца', description: 'Ніякіх планаў да абеду: кава, музыка, абдымкі і размовы ні пра што важнае.' },
      de: { title: 'Langsamer Morgen', description: 'Keine Pläne bis zum Mittag: Kaffee, Musik, Umarmungen und Gespräche über nichts Wichtiges.' },
      es: { title: 'Mañana lenta', description: 'Sin planes hasta el mediodía: café, música, abrazos y conversaciones sobre nada urgente.' },
      fr: { title: 'Matinée lente', description: 'Aucun plan jusqu’à midi : café, musique, câlins et conversations sur rien d’urgent.' },
      pt: { title: 'Manhã lenta', description: 'Sem planos até o meio-dia: café, música, abraços e conversas sobre nada urgente.' },
    },
  },
  {
    id: 'couple_workout',
    emoji: '🏃',
    locales: {
      ru: { title: 'Тренировка вдвоём', description: 'Йога в парке, пробежка или домашняя зарядка — а после смузи и комплименты.' },
      en: { title: 'Workout for two', description: 'Park yoga, a run, or a home workout — then smoothies and compliments.' },
      uk: { title: 'Тренування вдвох', description: 'Йога в парку, пробіжка чи домашня зарядка — а після смузі та компліменти.' },
      by: { title: 'Трэніроўка ўдваіх', description: 'Йога ў парку, прабежка ці хатняя зарадка — а пасля смузі і кампліменты.' },
      de: { title: 'Training zu zweit', description: 'Yoga im Park, Laufen oder ein Workout zu Hause — danach Smoothies und Komplimente.' },
      es: { title: 'Entrenamiento en pareja', description: 'Yoga en el parque, una carrera o ejercicio en casa — luego smoothies y cumplidos.' },
      fr: { title: 'Entraînement à deux', description: 'Yoga au parc, footing ou séance à la maison — puis smoothies et compliments.' },
      pt: { title: 'Treino a dois', description: 'Yoga no parque, corrida ou treino em casa — depois smoothies e elogios.' },
    },
  },
  {
    id: 'restaurant_blind',
    emoji: '🍽️',
    locales: {
      ru: { title: 'Ресторан вслепую', description: 'Один выбирает место, второй не знает куда идёте до последнего момента.' },
      en: { title: 'Blind restaurant pick', description: 'One chooses the place; the other doesn’t know where you’re going until the last moment.' },
      uk: { title: 'Ресторан наосліп', description: 'Один обирає місце, другий не знає, куди йдете, до останнього моменту.' },
      by: { title: 'Рэстаран наўздагад', description: 'Адзін выбірае месца, другі не ведае, куды ідзяце, да апошняга моманту.' },
      de: { title: 'Blindes Restaurant-Date', description: 'Einer wählt den Ort; der andere weiß bis zum letzten Moment nicht, wohin es geht.' },
      es: { title: 'Restaurante a ciegas', description: 'Uno elige el lugar; el otro no sabe a dónde van hasta el último momento.' },
      fr: { title: 'Restaurant à l’aveugle', description: 'L’un choisit l’endroit ; l’autre ne sait pas où vous allez jusqu’au dernier moment.' },
      pt: { title: 'Restaurante às cegas', description: 'Um escolhe o lugar; o outro não sabe para onde vão até o último momento.' },
    },
  },
];

export const getDatingIdeaLocalized = (
  idea: DatingIdeaDefinition,
  locale: AppLocale
): DatingIdeaLocalized & { id: string; emoji: string } => {
  const copy =
    idea.locales[locale] ||
    idea.locales.en ||
    idea.locales.ru ||
    idea.locales[DEFAULT_LOCALE];

  return {
    id: idea.id,
    emoji: idea.emoji,
    title: copy.title,
    description: copy.description,
  };
};

export const getDatingIdeaById = (id: string): DatingIdeaDefinition | undefined =>
  DATING_IDEAS.find((idea) => idea.id === id);

export const pickRandomDatingIdea = (excludeIds: string[] = []): DatingIdeaDefinition => {
  const available = DATING_IDEAS.filter((idea) => !excludeIds.includes(idea.id));
  const pool = available.length > 0 ? available : DATING_IDEAS;
  return pool[Math.floor(Math.random() * pool.length)];
};
