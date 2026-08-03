import News from '../models/news';
import { AppLocale, SUPPORTED_LOCALES } from '../i18n/locales';
import { NewsLocaleContent, syncLegacyNewsFields } from '../i18n/newsContent';

type FeatureNewsSeed = {
  seedKey: string;
  category: 'update' | 'event' | 'announcement';
  translations: Record<AppLocale, NewsLocaleContent>;
};

const FEATURE_NEWS: FeatureNewsSeed[] = [
  {
    seedKey: 'feature-daily-questions-v1',
    category: 'announcement',
    translations: {
      ru: {
        title: 'Вопросы дня уже на главной!',
        content: `На главной появился блок «Вопросы дня» — короткие категории, которые вы проходите вместе с партнёром.

• Отвечайте по очереди и сравнивайте ответы
• Смотрите схожесть ваших ответов в результатах
• За завершённую категорию — +10 Аморок (до 2 категорий в день)
• Новые категории обновляются каждый день

Загляните на главную и узнайте друг друга ещё лучше!`,
      },
      en: {
        title: 'Questions of the day are on the home screen!',
        content: `There’s a new “Questions of the day” block on the home screen — short categories you complete with your partner.

• Answer in turn and compare your replies
• See how similar your answers are in the results
• Finish a category for +10 AmoreCoins (up to 2 categories per day)
• New categories refresh every day

Open the home screen and get to know each other even better!`,
      },
      es: {
        title: '¡Las preguntas del día ya están en inicio!',
        content: `En la pantalla de inicio hay un nuevo bloque «Preguntas del día»: categorías cortas que completáis en pareja.

• Responded por turnos y comparad vuestras respuestas
• Ved qué tan parecidas son en los resultados
• Completar una categoría da +10 AmoreCoins (hasta 2 categorías al día)
• Las categorías nuevas se renuevan cada día

¡Abrid inicio y conocedos todavía mejor!`,
      },
      de: {
        title: 'Fragen des Tages jetzt auf dem Startbildschirm!',
        content: `Auf dem Startbildschirm gibt es den neuen Block „Fragen des Tages“ — kurze Kategorien, die ihr zusammen mit eurem Partner durchspielt.

• Abwechselnd antworten und Antworten vergleichen
• Ähnlichkeit eurer Antworten in den Ergebnissen sehen
• Abgeschlossene Kategorie: +10 AmoreCoins (bis zu 2 Kategorien pro Tag)
• Neue Kategorien jeden Tag

Schaut auf den Startbildschirm und lernt euch noch besser kennen!`,
      },
      fr: {
        title: 'Les questions du jour sont sur l’accueil !',
        content: `Un nouveau bloc « Questions du jour » est apparu sur l’accueil — de courtes catégories à parcourir ensemble.

• Répondez à tour de rôle et comparez vos réponses
• Voyez le degré de similarité dans les résultats
• Terminer une catégorie : +10 AmoreCoins (jusqu’à 2 catégories par jour)
• De nouvelles catégories chaque jour

Ouvrez l’accueil et apprenez encore mieux à vous connaître !`,
      },
      pt: {
        title: 'Perguntas do dia já na tela inicial!',
        content: `Na tela inicial há o bloco «Perguntas do dia» — categorias curtas que vocês fazem juntos.

• Respondam na vez e comparem as respostas
• Vejam a similaridade nos resultados
• Completar uma categoria dá +10 AmoreCoins (até 2 categorias por dia)
• Novas categorias todos os dias

Abram a tela inicial e conheçam-se ainda melhor!`,
      },
      uk: {
        title: 'Питання дня вже на головній!',
        content: `На головній з’явився блок «Питання дня» — короткі категорії, які ви проходите разом із партнером.

• Відповідайте по черзі й порівнюйте відповіді
• Дивіться схожість відповідей у результатах
• За завершену категорію — +10 Аморок (до 2 категорій на день)
• Нові категорії оновлюються щодня

Загляньте на головну та дізнайтеся одне про одного ще більше!`,
      },
    },
  },
  {
    seedKey: 'feature-pets-v1',
    category: 'announcement',
    translations: {
      ru: {
        title: 'Питомцы в Amorely!',
        content: `Теперь у вас может быть свой питомец на главной — выбирайте вид, цвет и имя, растите его и заботьтесь вместе с партнёром.

• Покупка питомца — 100 Аморок
• Прокачка уровней за Аморки и анимация «вылупления»
• Кормление: 2 Аморки, +10–20 сытости; полная сытость — +5 Аморок
• Можно заглянуть к питомцам партнёра и помочь с прокачкой
• Подарите питомца партнёру — приятный сюрприз

Откройте блок «Питомцы» на главной и заведите первого друга!`,
      },
      en: {
        title: 'Pets are in Amorely!',
        content: `You can now have a pet on the home screen — pick a species, color, and name, level it up, and care for it with your partner.

• Buying a pet costs 100 AmoreCoins
• Level up with AmoreCoins and enjoy the hatch animation
• Feeding: 2 AmoreCoins, +10–20 satiety; full satiety awards +5 AmoreCoins
• Visit your partner’s pets and help upgrade them
• Gift a pet to your partner — a sweet surprise

Open the Pets section on the home screen and get your first friend!`,
      },
      es: {
        title: '¡Mascotas en Amorely!',
        content: `Ya podéis tener una mascota en inicio: elegid especie, color y nombre, subid de nivel y cuidádla en pareja.

• Comprar una mascota cuesta 100 AmoreCoins
• Subid de nivel con AmoreCoins y disfrutad la animación de eclosión
• Alimentar: 2 AmoreCoins, +10–20 de saciedad; saciedad completa: +5 AmoreCoins
• Visitad las mascotas de vuestra pareja y ayudad a mejorarlas
• Regalad una mascota a vuestra pareja — una linda sorpresa

¡Abrid «Mascotas» en inicio y adoptad a vuestro primer amigo!`,
      },
      de: {
        title: 'Haustiere in Amorely!',
        content: `Jetzt könnt ihr ein Haustier auf dem Startbildschirm haben — Art, Farbe und Name wählen, leveln und gemeinsam pflegen.

• Kauf eines Haustiers: 100 AmoreCoins
• Level mit AmoreCoins steigern und die Schlüpf-Animation genießen
• Füttern: 2 AmoreCoins, +10–20 Sättigung; volle Sättigung: +5 AmoreCoins
• Haustiere des Partners ansehen und beim Leveln helfen
• Verschenkt ein Haustier an euren Partner — eine süße Überraschung

Öffnet „Haustiere“ auf dem Startbildschirm und holt euch den ersten Freund!`,
      },
      fr: {
        title: 'Des animaux dans Amorely !',
        content: `Vous pouvez maintenant avoir un animal sur l’accueil — choisissez l’espèce, la couleur et le nom, faites-le grandir et prenez-en soin à deux.

• Acheter un animal coûte 100 AmoreCoins
• Montez de niveau avec des AmoreCoins et profitez de l’animation d’éclosion
• Nourrir : 2 AmoreCoins, +10–20 de satiété ; satiété pleine : +5 AmoreCoins
• Visitez les animaux de votre partenaire et aidez à les améliorer
• Offrez un animal à votre partenaire — une belle surprise

Ouvrez « Animaux » sur l’accueil et adoptez votre premier ami !`,
      },
      pt: {
        title: 'Pets no Amorely!',
        content: `Agora vocês podem ter um pet na tela inicial — escolham espécie, cor e nome, evoluam e cuidem juntos.

• Comprar um pet custa 100 AmoreCoins
• Subam de nível com AmoreCoins e vejam a animação de eclosão
• Alimentar: 2 AmoreCoins, +10–20 de saciedade; saciedade cheia: +5 AmoreCoins
• Visitem os pets do parceiro e ajudem a evoluir
• Presenteiem um pet ao parceiro — uma surpresa carinhosa

Abram «Pets» na tela inicial e ganhem o primeiro amigo!`,
      },
      uk: {
        title: 'Улюбленці в Amorely!',
        content: `Тепер у вас може бути свій улюбленець на головній — обирайте вид, колір і ім’я, розвивайте його та дбайте разом із партнером.

• Купівля улюбленця — 100 Аморок
• Прокачування рівнів за Аморки та анімація «вилуплення»
• Годування: 2 Аморки, +10–20 ситості; повна ситість — +5 Аморок
• Можна заглянути до улюбленців партнера й допомогти з прокачкою
• Подаруйте улюбленця партнеру — приємний сюрприз

Відкрийте блок «Улюбленці» на головній і заведіть першого друга!`,
      },
    },
  },
  {
    seedKey: 'feature-dating-ideas-v1',
    category: 'announcement',
    translations: {
      ru: {
        title: 'Идеи для свиданий!',
        content: `На главной появился раздел «Идеи для свиданий» — вдохновение для особенных моментов вдвоём.

• Сгенерируйте идею за 100 Аморок
• Выполните или пропустите — история сохранится
• Добавьте свидание в календарь пары
• За событие из идеи — +25 Аморок
• Доступно после привязки партнёра

Откройте идеи на главной и запланируйте следующий тёплый вечер!`,
      },
      en: {
        title: 'Date ideas are here!',
        content: `There’s a new “Date ideas” section on the home screen — inspiration for special moments together.

• Generate an idea for 100 AmoreCoins
• Complete or skip — your history is saved
• Add the date to your couple calendar
• Creating an event from an idea awards +25 AmoreCoins
• Available after linking a partner

Open Date ideas on the home screen and plan your next cozy evening!`,
      },
      es: {
        title: '¡Ideas para citas!',
        content: `En inicio hay una nueva sección «Ideas para citas»: inspiración para momentos especiales en pareja.

• Generad una idea por 100 AmoreCoins
• Completad o saltad — el historial se guarda
• Añadid la cita al calendario de pareja
• Crear un evento desde una idea da +25 AmoreCoins
• Disponible tras vincular a vuestra pareja

¡Abrid las ideas en inicio y planead vuestra próxima noche especial!`,
      },
      de: {
        title: 'Date-Ideen sind da!',
        content: `Auf dem Startbildschirm gibt es den neuen Bereich „Date-Ideen“ — Inspiration für besondere Momente zu zweit.

• Idee für 100 AmoreCoins generieren
• Erledigen oder überspringen — der Verlauf wird gespeichert
• Date in den Paar-Kalender eintragen
• Event aus einer Idee: +25 AmoreCoins
• Verfügbar nach Verknüpfung mit dem Partner

Öffnet die Ideen auf dem Startbildschirm und plant euren nächsten gemütlichen Abend!`,
      },
      fr: {
        title: 'Des idées de rendez-vous !',
        content: `Une nouvelle section « Idées de rendez-vous » est sur l’accueil — de l’inspiration pour vos moments à deux.

• Générez une idée pour 100 AmoreCoins
• Terminez ou ignorez — l’historique est conservé
• Ajoutez le rendez-vous au calendrier du couple
• Créer un événement depuis une idée : +25 AmoreCoins
• Disponible après avoir lié votre partenaire

Ouvrez les idées sur l’accueil et planifiez votre prochaine soirée cocooning !`,
      },
      pt: {
        title: 'Ideias para encontros!',
        content: `Na tela inicial há a seção «Ideias para encontros» — inspiração para momentos especiais a dois.

• Gerem uma ideia por 100 AmoreCoins
• Concluam ou pulem — o histórico fica salvo
• Adicionem o encontro ao calendário do casal
• Criar um evento a partir de uma ideia dá +25 AmoreCoins
• Disponível após vincular o parceiro

Abram as ideias na tela inicial e planejem a próxima noite especial!`,
      },
      uk: {
        title: 'Ідеї для побачень!',
        content: `На головній з’явився розділ «Ідеї для побачень» — натхнення для особливих моментів удвох.

• Згенеруйте ідею за 100 Аморок
• Виконайте або пропустіть — історія збережеться
• Додайте побачення до календаря пари
• За подію з ідеї — +25 Аморок
• Доступно після прив’язки партнера

Відкрийте ідеї на головній і заплануйте наступний теплий вечір!`,
      },
    },
  },
];

const assertAllLocales = (translations: Record<AppLocale, NewsLocaleContent>, seedKey: string) => {
  for (const locale of SUPPORTED_LOCALES) {
    const entry = translations[locale];
    if (!entry?.title?.trim() || !entry.content?.trim()) {
      throw new Error(`Feature news "${seedKey}" is missing content for locale "${locale}"`);
    }
  }
};

/** Creates feature announcement news on startup when missing (idempotent by seedKey). */
export const ensureFeatureNews = async (): Promise<void> => {
  let created = 0;

  for (const article of FEATURE_NEWS) {
    assertAllLocales(article.translations, article.seedKey);

    const existing = await News.findOne({ seedKey: article.seedKey }).select('_id').lean();
    if (existing) {
      continue;
    }

    const ru = article.translations.ru;
    const doc = new News({
      seedKey: article.seedKey,
      title: ru.title,
      content: ru.content,
      translations: article.translations,
      category: article.category,
      isPublished: true,
      publishDate: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    syncLegacyNewsFields(doc);
    await doc.save();
    created += 1;
    console.log(`Создана новость: ${article.seedKey} (${doc._id.toString()})`);
  }

  if (created === 0) {
    console.log('Новости о функциях уже есть — пропуск');
  } else {
    console.log(`Добавлено новостей о функциях: ${created}`);
  }
};

export const FEATURE_NEWS_SEED_KEYS = FEATURE_NEWS.map((item) => item.seedKey);
