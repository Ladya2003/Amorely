import { GEO_MAP_ATTRIBUTION, GEO_PHOTOS_ATTRIBUTION } from '../../config/geoMapTiles';

export interface GameCatalogEntry {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  requiresPartner: boolean;
  available: boolean;
  rulesImages: string[];
  rules: string[];
}

export const GAMES: GameCatalogEntry[] = [
  {
    id: 'tap',
    name: 'Тыкалка',
    description:
      'Нажимайте на блок вместе с партнёром: проходите раунды и зарабатывайте баллы на улучшения в магазине.',
    imageUrl: 'https://res.cloudinary.com/dlbrkdlco/image/upload/v1779967133/tikalka_ha1xkg.jpg',
    requiresPartner: true,
    available: true,
    rulesImages: [],
    rules: [
      'Игра доступна только парам с привязанным партнёром в настройках.',
      'В начале раунда оба могут нажимать сразу — ждать партнёра не нужно.',
      'Следующий раунд начнётся, когда оба завершат свою часть (например, 15/15).',
      'С каждым новым раундом требуется в 3 раза больше нажатий.',
      'За каждое нажатие и за прохождение раунда начисляются баллы — награда за раунд растёт вместе с его сложностью.',
      'Баллы можно тратить в магазине на инструменты, которые ускоряют прогресс.',
      'Четверной и мега-тык открываются после прохождения 5-го раунда — по 15 усиленных нажатий (×4 и ×10).',
      'Рейтинг строится по общему числу нажатий пары.',
    ],
  },
  {
    id: 'geo',
    name: 'Угадай локацию',
    description: 'Угадайте, где на карте находится загаданное место, и соревнуйтесь с другими парами.',
    imageUrl: 'https://res.cloudinary.com/dlbrkdlco/image/upload/v1779967133/geofinder_n8kzj2.jpg',
    requiresPartner: true,
    available: true,
    rulesImages: [],
    rules: [
      'Игра доступна только парам с привязанным партнёром.',
      'Перед раундом оба партнёра нажимают «Готов» — затем 3 секунды отсчёта и старт одного раунда.',
      'На каждый раунд даётся ограниченное время — каждый партнёр ставит свою метку на карте.',
      'Чем ближе метка к реальной точке, тем больше очков получает партнёр; очки обоих суммируются.',
      'Каждый подтверждает только свою метку — у пары две независимые догадки за раунд.',
      'Каждый день — до 5 мест для угадывания; на следующий день лимит обновляется.',
      'Когда все 200 локаций пройдены, пул начинается сначала.',
      'Рейтинг строится по суммарному счёту пары за все раунды.',
      GEO_MAP_ATTRIBUTION,
      GEO_PHOTOS_ATTRIBUTION,
    ],
  },
  {
    id: 'draw',
    name: 'Угадай рисунок',
    description: 'Один рисует, другой угадывает — как Gartic, но для вашей пары.',
    imageUrl: 'https://res.cloudinary.com/dlbrkdlco/image/upload/v1779967133/paintguesser_ml5qjl.jpg',
    requiresPartner: true,
    available: true,
    rulesImages: [],
    rules: [
      'Игра доступна только парам с привязанным партнёром.',
      'Перед раундом оба нажимают «Готов» — затем 3 секунды отсчёта и старт.',
      'Художник и угадывающий меняются каждый раунд.',
      'На раунд — 90 секунд: один рисует, другой может угадывать сразу, пока идёт рисунок.',
      'Чем быстрее угадали, тем больше очков.',
      'В рейтинг засчитываются до 10 угаданных раундов в день — дальше можно играть за интерес.',
    ],
  },
  {
    id: 'quiz',
    name: 'Своя игра',
    description: 'Игровое поле с категориями и вопросами — отвечайте вместе и набирайте баллы.',
    imageUrl: 'https://res.cloudinary.com/dlbrkdlco/image/upload/v1779967133/amorelyquestions_nobsog.jpg',
    requiresPartner: true,
    available: true,
    rulesImages: [],
    rules: [
      'Игра доступна только парам с привязанным партнёром.',
      'Перед полем оба нажимают «Готов» — затем 3 секунды отсчёта и старт.',
      'Первый ход случайно определяется между партнёрами, дальше ходы чередуются.',
      'На своём ходу выберите любую ячейку: категория и стоимость. На ответ — 30 секунд.',
      'Каждый вводит один ответ. За верный ответ начисляются очки ячейки (100, 200 или 300).',
      'Если оба угадали — очки суммируются. Сыгранную ячейку нельзя выбрать снова.',
      'Каждый день — 5 случайных категорий и новый набор вопросов (15 ячеек).',
      'После всех вопросов поле обновится на следующий день.',
      'Рейтинг строится по суммарному счёту пары.',
    ],
  },
];

export type Game = GameCatalogEntry;

export const getGameById = (gameId: string): GameCatalogEntry | undefined =>
  GAMES.find((game) => game.id === gameId);

export const GAME_BADGE_ICONS: Record<string, string> = {
  tap: 'https://res.cloudinary.com/dlbrkdlco/image/upload/v1779967133/tikalka-badge_vgchxc.jpg',
  geo: 'https://res.cloudinary.com/dlbrkdlco/image/upload/v1779967132/geofinder-badge_mbxrks.jpg',
  draw: 'https://res.cloudinary.com/dlbrkdlco/image/upload/v1779967132/paintguesser-badge_gp6lvr.jpg',
  quiz: 'https://res.cloudinary.com/dlbrkdlco/image/upload/v1779967132/amorelyquestions-badge_nknj08.jpg',
};
