import { SOCIAL_LINKS } from '../legal/publicSite';
import { AppLocale, SUPPORTED_LOCALES } from './locale';

export interface NewsLocaleContent {
  title: string;
  content: string;
}

export type NewsTranslations = Partial<Record<AppLocale, NewsLocaleContent>>;

export const createEmptyNewsTranslations = (): Record<AppLocale, NewsLocaleContent> =>
  Object.fromEntries(
    SUPPORTED_LOCALES.map((locale) => [locale, { title: '', content: '' }])
  ) as Record<AppLocale, NewsLocaleContent>;

export const normalizeNewsTranslations = (
  item: {
    title?: string;
    content?: string;
    translations?: NewsTranslations | null;
  }
): Record<AppLocale, NewsLocaleContent> => {
  const empty = createEmptyNewsTranslations();
  const source = item.translations ?? {};

  for (const locale of SUPPORTED_LOCALES) {
    const entry = source[locale];
    if (entry) {
      empty[locale] = {
        title: entry.title ?? '',
        content: entry.content ?? '',
      };
    }
  }

  if (!empty.ru.title.trim() && item.title?.trim()) {
    empty.ru = {
      title: item.title.trim(),
      content: item.content ?? '',
    };
  }

  return empty;
};

const INSTAGRAM_URL = SOCIAL_LINKS.instagram;
const TIKTOK_URL = SOCIAL_LINKS.tiktok;
const YOUTUBE_URL = SOCIAL_LINKS.youtube;

export const SOCIAL_PRESENCE_NEWS_PRESET: {
  category: 'announcement';
  translations: Record<AppLocale, NewsLocaleContent>;
} = {
  category: 'announcement',
  translations: {
    ru: {
      title: 'Amorely теперь в Instagram, TikTok и на YouTube!',
      content: `У Amorely появились свои страницы в соцсетях — и вышло видео о том, как создавался проект.

Instagram: amorely.love
${INSTAGRAM_URL}

TikTok: amorely.love
${TIKTOK_URL}

Там я публикую дополнительный контент, новости Amorely, куда мы движемся и как с моей второй половиной используем функции сайта.

На YouTube-канале kaif life dev вышло видео о том, как я создавал Amorely:
${YOUTUBE_URL}

Загляните и подпишитесь — так вы будете ближе к развитию Amorely.`,
    },
    en: {
      title: 'Amorely is now on Instagram, TikTok, and YouTube!',
      content: `Amorely now has its own social pages — and a video about how the project was built is out.

Instagram: amorely.love
${INSTAGRAM_URL}

TikTok: amorely.love
${TIKTOK_URL}

That’s where I post extra content, Amorely news, where we’re heading, and how my partner and I use the site.

On the kaif life dev YouTube channel, there’s a video about how I created Amorely:
${YOUTUBE_URL}

Come take a look and subscribe — you’ll stay closer to how Amorely grows.`,
    },
    es: {
      title: '¡Amorely ya está en Instagram, TikTok y YouTube!',
      content: `Amorely ya tiene sus propias páginas en redes — y salió un vídeo sobre cómo se creó el proyecto.

Instagram: amorely.love
${INSTAGRAM_URL}

TikTok: amorely.love
${TIKTOK_URL}

Ahí publico contenido extra, noticias de Amorely, hacia dónde vamos y cómo usamos las funciones del sitio con mi pareja.

En el canal de YouTube kaif life dev hay un vídeo sobre cómo creé Amorely:
${YOUTUBE_URL}

¡Entrad y suscribíos para estar más cerca del crecimiento de Amorely!`,
    },
    de: {
      title: 'Amorely ist jetzt auf Instagram, TikTok und YouTube!',
      content: `Amorely hat jetzt eigene Social-Media-Seiten — und es gibt ein Video darüber, wie das Projekt entstanden ist.

Instagram: amorely.love
${INSTAGRAM_URL}

TikTok: amorely.love
${TIKTOK_URL}

Dort poste ich Extra-Inhalte, Amorely-News, wohin wir uns entwickeln und wie meine Partnerin und ich die Funktionen der Seite nutzen.

Auf dem YouTube-Kanal kaif life dev gibt es ein Video darüber, wie ich Amorely erstellt habe:
${YOUTUBE_URL}

Schaut vorbei und abonniert — so bleibt ihr näher an der Entwicklung von Amorely.`,
    },
    fr: {
      title: 'Amorely est maintenant sur Instagram, TikTok et YouTube !',
      content: `Amorely a désormais ses propres pages sur les réseaux — et une vidéo sur la création du projet est sortie.

Instagram: amorely.love
${INSTAGRAM_URL}

TikTok: amorely.love
${TIKTOK_URL}

J’y publie du contenu en plus, les actualités d’Amorely, la direction que nous prenons, et comment ma moitié et moi utilisons les fonctions du site.

Sur la chaîne YouTube kaif life dev, il y a une vidéo sur la façon dont j’ai créé Amorely :
${YOUTUBE_URL}

Venez voir et abonnez-vous — vous serez plus proches de l’évolution d’Amorely.`,
    },
    pt: {
      title: 'O Amorely agora está no Instagram, TikTok e YouTube!',
      content: `O Amorely agora tem as próprias páginas nas redes — e saiu um vídeo sobre como o projeto foi criado.

Instagram: amorely.love
${INSTAGRAM_URL}

TikTok: amorely.love
${TIKTOK_URL}

Lá eu publico conteúdo extra, novidades do Amorely, para onde estamos indo e como eu e minha cara-metade usamos as funções do site.

No canal do YouTube kaif life dev saiu um vídeo sobre como eu criei o Amorely:
${YOUTUBE_URL}

Deem uma olhada e se inscrevam — assim vocês ficam mais perto do crescimento do Amorely.`,
    },
    uk: {
      title: 'Amorely тепер в Instagram, TikTok і на YouTube!',
      content: `У Amorely з’явилися свої сторінки в соцмережах — і вийшло відео про те, як створювався проєкт.

Instagram: amorely.love
${INSTAGRAM_URL}

TikTok: amorely.love
${TIKTOK_URL}

Там я публікую додатковий контент, новини Amorely, куди ми рухаємося і як із моєю другою половинкою використовуємо функції сайту.

На YouTube-каналі kaif life dev вийшло відео про те, як я створював Amorely:
${YOUTUBE_URL}

Загляньте й підпишіться — так ви будете ближче до розвитку Amorely.`,
    },
    by: {
      title: 'Amorely цяпер у Instagram, TikTok і на YouTube!',
      content: `У Amorely з’явіліся свае старонкі ў сацсетках — і выйшла відэа пра тое, як ствараўся праект.

Instagram: amorely.love
${INSTAGRAM_URL}

TikTok: amorely.love
${TIKTOK_URL}

Там я публікую дадатковы кантэнт, навіны Amorely, куды мы рухаемся і як з маёй другой палоўкай выкарыстоўваем функцыі сайта.

На YouTube-канале kaif life dev выйшла відэа пра тое, як я ствараў Amorely:
${YOUTUBE_URL}

Зазірніце і падпішыцеся — так вы будзеце бліжэй да развіцця Amorely.`,
    },
  },
};
