import type { TFunction } from 'i18next';
import type { SharedGameRef } from '../components/Chat/ChatDialog';
import { getGameById } from '../components/Chat/gamesData';
import socketService from './socketService';

export const buildSharedGameRef = (gameId: string, title: string): SharedGameRef | null => {
  const game = getGameById(gameId);
  if (!game) {
    return null;
  }

  return {
    gameId,
    title,
    imageUrl: game.imageUrl,
  };
};

export const sendGameLobbyInvite = (
  partnerId: string,
  sharedGame: SharedGameRef,
  t: TFunction
): void => {
  const clientTempId = `client-temp-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const pushPreview = t('chat.message.gameInvite', { title: sharedGame.title });

  socketService.sendMessage(
    partnerId,
    '',
    undefined,
    [],
    null,
    null,
    null,
    clientTempId,
    pushPreview,
    null,
    sharedGame
  );
};
