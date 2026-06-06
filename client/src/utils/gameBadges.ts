import { GAMES } from '../components/Chat/gamesData';
import i18n from '../localization';

export interface RelationshipBadge {
  gameId: string;
  rank: number;
}

export const getGameName = (gameId: string): string => {
  const fallback = GAMES.find((game) => game.id === gameId)?.name ?? gameId;
  return i18n.t(`games.${gameId}.name`, { defaultValue: fallback });
};

/** Лучший ранг по каждой игре (только топ-1..3). */
export const getBestBadgesByGame = (badges: RelationshipBadge[]): RelationshipBadge[] =>
  badges
    .filter((badge) => badge.rank >= 1 && badge.rank <= 3)
    .reduce<RelationshipBadge[]>((bestByGame, badge) => {
      const existing = bestByGame.find((item) => item.gameId === badge.gameId);
      if (!existing) {
        bestByGame.push(badge);
        return bestByGame;
      }

      if (badge.rank < existing.rank) {
        const index = bestByGame.indexOf(existing);
        bestByGame[index] = badge;
      }

      return bestByGame;
    }, [])
    .sort((a, b) => a.rank - b.rank || a.gameId.localeCompare(b.gameId));

/** Автовыбор: любая медаль топ-1, иначе топ-2, иначе топ-3. */
export const pickDefaultDisplayBadge = (badges: RelationshipBadge[]): RelationshipBadge | null => {
  const bestByGame = getBestBadgesByGame(badges);
  if (bestByGame.length === 0) {
    return null;
  }

  for (const targetRank of [1, 2, 3]) {
    const match = bestByGame.find((badge) => badge.rank === targetRank);
    if (match) {
      return match;
    }
  }

  return null;
};

export const resolveDisplayBadge = (
  badges: RelationshipBadge[],
  displayGameId?: string | null
): RelationshipBadge | null => {
  const bestByGame = getBestBadgesByGame(badges);
  if (bestByGame.length === 0) {
    return null;
  }

  if (displayGameId) {
    const selected = bestByGame.find((badge) => badge.gameId === displayGameId);
    if (selected) {
      return selected;
    }
  }

  return pickDefaultDisplayBadge(badges);
};
