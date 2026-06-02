import { Server as SocketIOServer, Socket } from 'socket.io';
import DrawGameState from '../models/drawGameState';
import QuizGameState from '../models/quizGameState';
import {
  GeoGameError,
  advanceGeoRound,
  expireGeoRound,
  formatGeoGameState,
  getGeoGameParticipantIds,
  getOrCreateGeoGameState,
  resolveGeoGameContext,
  setGeoPlayerReady,
  submitGeoGuess,
  updateGeoGameBadges,
} from './geoGameService';
import {
  DrawGameError,
  advanceDrawRound,
  appendDrawStroke,
  clearDrawGuessAttempts,
  clearDrawStrokes,
  formatDrawGameState,
  getDrawGameParticipantIds,
  getOrCreateDrawGameState,
  resolveDrawGameContext,
  setDrawPlayerReady,
  submitDrawGuess,
  updateDrawGameBadges,
} from './drawGameService';
import {
  TapGameError,
  formatTapGameState,
  getOrCreateTapGameState,
  getTapGameParticipantIds,
  processTap,
  resolveTapGameContext,
  updateTapGameBadges,
} from './tapGameService';
import {
  QuizGameError,
  dismissQuizReveal,
  formatQuizGameState,
  getOrCreateQuizGameState,
  getQuizGameParticipantIds,
  pickQuizQuestion,
  resolveQuizGameContext,
  setQuizPlayerReady,
  submitQuizAnswer,
  syncQuizGameState,
  updateQuizGameBadges,
} from './quizGameService';

interface ConnectedUser {
  userId: string;
  socketId: string;
}

export const attachGameSocketHandlers = (
  socket: Socket,
  io: SocketIOServer,
  connectedUsers: ConnectedUser[]
) => {
  socket.on('tap_game_subscribe', async () => {
    try {
      const senderSocketData = connectedUsers.find((user) => user.socketId === socket.id);
      if (!senderSocketData) {
        return;
      }

      const context = await resolveTapGameContext(senderSocketData.userId);
      const state = await getOrCreateTapGameState(senderSocketData.userId, context);

      socket.emit('tap_game_state', {
        state: formatTapGameState(state, senderSocketData.userId, context),
      });
    } catch (error) {
      if (error instanceof TapGameError) {
        socket.emit('tap_game_error', { message: error.message, code: error.code });
        return;
      }
      console.error('tap_game_subscribe error:', error);
    }
  });

  socket.on('tap_game_tap', async () => {
    try {
      const senderSocketData = connectedUsers.find((user) => user.socketId === socket.id);
      if (!senderSocketData) {
        socket.emit('tap_game_error', { message: 'Пользователь не авторизован' });
        return;
      }

      const context = await resolveTapGameContext(senderSocketData.userId);
      const { state, roundCompletionBonus } = await processTap(senderSocketData.userId, context);

      await updateTapGameBadges();

      const participantUserIds = getTapGameParticipantIds(context);
      await Promise.all(
        participantUserIds.map(async (uid) => {
          const socketData = connectedUsers.find((user) => user.userId === uid);
          if (!socketData) {
            return;
          }
          const userContext = await resolveTapGameContext(uid);
          io.to(socketData.socketId).emit('tap_game_state', {
            state: formatTapGameState(state, uid, userContext),
            ...(roundCompletionBonus > 0 ? { roundCompletionBonus } : {}),
          });
        })
      );
    } catch (error) {
      if (error instanceof TapGameError) {
        socket.emit('tap_game_error', { message: error.message, code: error.code });
        return;
      }
      console.error('tap_game_tap error:', error);
      socket.emit('tap_game_error', { message: 'Не удалось обработать нажатие' });
    }
  });

  const emitGeoStateToPartners = async (
    state: any,
    participantUserIds: string[]
  ) => {
    await Promise.all(
      participantUserIds.map(async (uid) => {
        const socketData = connectedUsers.find((user) => user.userId === uid);
        if (!socketData) {
          return;
        }
        io.to(socketData.socketId).emit('geo_game_state', {
          state: formatGeoGameState(state, uid),
        });
      })
    );
  };

  const emitGeoStateToUser = (state: any, userId: string) => {
    const socketData = connectedUsers.find((user) => user.userId === userId);
    if (!socketData) {
      return;
    }
    io.to(socketData.socketId).emit('geo_game_state', {
      state: formatGeoGameState(state, userId),
    });
  };

  socket.on('geo_game_subscribe', async () => {
    try {
      const senderSocketData = connectedUsers.find((user) => user.socketId === socket.id);
      if (!senderSocketData) {
        return;
      }

      const context = await resolveGeoGameContext(senderSocketData.userId);
      const state = await getOrCreateGeoGameState(context);

      await emitGeoStateToPartners(state, getGeoGameParticipantIds(context));
    } catch (error) {
      if (error instanceof GeoGameError) {
        socket.emit('geo_game_error', { message: error.message, code: error.code });
        return;
      }
      console.error('geo_game_subscribe error:', error);
    }
  });

  socket.on('geo_game_ready', async () => {
    try {
      const senderSocketData = connectedUsers.find((user) => user.socketId === socket.id);
      if (!senderSocketData) {
        socket.emit('geo_game_error', { message: 'Пользователь не авторизован' });
        return;
      }

      const context = await resolveGeoGameContext(senderSocketData.userId);
      const state = await setGeoPlayerReady(senderSocketData.userId, context);

      await emitGeoStateToPartners(state, getGeoGameParticipantIds(context));
    } catch (error) {
      if (error instanceof GeoGameError) {
        socket.emit('geo_game_error', { message: error.message, code: error.code });
        return;
      }
      console.error('geo_game_ready error:', error);
      socket.emit('geo_game_error', { message: 'Не удалось подтвердить готовность' });
    }
  });

  socket.on('geo_game_sync', async () => {
    try {
      const senderSocketData = connectedUsers.find((user) => user.socketId === socket.id);
      if (!senderSocketData) {
        return;
      }

      const context = await resolveGeoGameContext(senderSocketData.userId);
      const state = await getOrCreateGeoGameState(context);

      await emitGeoStateToPartners(state, getGeoGameParticipantIds(context));
    } catch (error) {
      if (error instanceof GeoGameError) {
        socket.emit('geo_game_error', { message: error.message, code: error.code });
        return;
      }
      console.error('geo_game_sync error:', error);
    }
  });

  socket.on('geo_game_guess', async (payload: { lat?: number; lng?: number }) => {
    try {
      const senderSocketData = connectedUsers.find((user) => user.socketId === socket.id);
      if (!senderSocketData) {
        socket.emit('geo_game_error', { message: 'Пользователь не авторизован' });
        return;
      }

      const context = await resolveGeoGameContext(senderSocketData.userId);
      const { state } = await submitGeoGuess(
        senderSocketData.userId,
        context,
        Number(payload?.lat),
        Number(payload?.lng)
      );

      await updateGeoGameBadges();
      await emitGeoStateToPartners(state, getGeoGameParticipantIds(context));
    } catch (error) {
      if (error instanceof GeoGameError) {
        socket.emit('geo_game_error', { message: error.message, code: error.code });
        return;
      }
      console.error('geo_game_guess error:', error);
      socket.emit('geo_game_error', { message: 'Не удалось отправить ответ' });
    }
  });

  socket.on('geo_game_next_round', async () => {
    try {
      const senderSocketData = connectedUsers.find((user) => user.socketId === socket.id);
      if (!senderSocketData) {
        socket.emit('geo_game_error', { message: 'Пользователь не авторизован' });
        return;
      }

      const context = await resolveGeoGameContext(senderSocketData.userId);
      const { state, allPartnersDismissed } = await advanceGeoRound(
        senderSocketData.userId,
        context
      );
      const participantUserIds = getGeoGameParticipantIds(context);

      if (allPartnersDismissed) {
        await emitGeoStateToPartners(state, participantUserIds);
      } else {
        emitGeoStateToUser(state, senderSocketData.userId);
      }
    } catch (error) {
      if (error instanceof GeoGameError) {
        socket.emit('geo_game_error', { message: error.message, code: error.code });
        return;
      }
      console.error('geo_game_next_round error:', error);
      socket.emit('geo_game_error', { message: 'Не удалось начать раунд' });
    }
  });

  socket.on('geo_game_expire', async () => {
    try {
      const senderSocketData = connectedUsers.find((user) => user.socketId === socket.id);
      if (!senderSocketData) {
        socket.emit('geo_game_error', { message: 'Пользователь не авторизован' });
        return;
      }

      const context = await resolveGeoGameContext(senderSocketData.userId);
      const state = await expireGeoRound(context);

      await emitGeoStateToPartners(state, getGeoGameParticipantIds(context));
    } catch (error) {
      if (error instanceof GeoGameError && error.code === 'ROUND_NOT_EXPIRED') {
        return;
      }
      if (error instanceof GeoGameError) {
        socket.emit('geo_game_error', { message: error.message, code: error.code });
        return;
      }
      console.error('geo_game_expire error:', error);
    }
  });

  const emitDrawStateToPartners = async (
    state: any,
    context: Awaited<ReturnType<typeof resolveDrawGameContext>>
  ) => {
    const participantUserIds = getDrawGameParticipantIds(context);
    const stateDoc = state?._id ? await DrawGameState.findById(state._id) : state;

    await Promise.all(
      participantUserIds.map(async (uid) => {
        const socketData = connectedUsers.find((user) => user.userId === uid);
        if (!socketData || !stateDoc) {
          return;
        }
        io.to(socketData.socketId).emit('draw_game_state', {
          state: formatDrawGameState(stateDoc, uid),
        });
      })
    );
  };

  const emitDrawStateToUser = async (
    state: any,
    userId: string,
    context: Awaited<ReturnType<typeof resolveDrawGameContext>>
  ) => {
    const stateDoc = state?._id ? await DrawGameState.findById(state._id) : state;
    const socketData = connectedUsers.find((user) => user.userId === userId);
    if (!socketData || !stateDoc) {
      return;
    }
    io.to(socketData.socketId).emit('draw_game_state', {
      state: formatDrawGameState(stateDoc, userId),
    });
  };

  socket.on('draw_game_subscribe', async () => {
    try {
      const senderSocketData = connectedUsers.find((user) => user.socketId === socket.id);
      if (!senderSocketData) {
        return;
      }

      const context = await resolveDrawGameContext(senderSocketData.userId);
      const { state: gameState } = await getOrCreateDrawGameState(context, senderSocketData.userId);
      await emitDrawStateToPartners(gameState, context);
    } catch (error) {
      if (error instanceof DrawGameError) {
        socket.emit('draw_game_error', { message: error.message, code: error.code });
        return;
      }
      console.error('draw_game_subscribe error:', error);
    }
  });

  socket.on('draw_game_ready', async () => {
    try {
      const senderSocketData = connectedUsers.find((user) => user.socketId === socket.id);
      if (!senderSocketData) {
        socket.emit('draw_game_error', { message: 'Пользователь не авторизован' });
        return;
      }

      const context = await resolveDrawGameContext(senderSocketData.userId);
      const { state } = await setDrawPlayerReady(senderSocketData.userId, context);

      await emitDrawStateToPartners(state, context);
    } catch (error) {
      if (error instanceof DrawGameError) {
        socket.emit('draw_game_error', { message: error.message, code: error.code });
        return;
      }
      console.error('draw_game_ready error:', error);
    }
  });

  socket.on('draw_game_sync', async () => {
    try {
      const senderSocketData = connectedUsers.find((user) => user.socketId === socket.id);
      if (!senderSocketData) {
        return;
      }

      const context = await resolveDrawGameContext(senderSocketData.userId);
      const { state } = await getOrCreateDrawGameState(context, senderSocketData.userId);

      await emitDrawStateToPartners(state, context);
    } catch (error) {
      if (error instanceof DrawGameError) {
        socket.emit('draw_game_error', { message: error.message, code: error.code });
      }
    }
  });

  socket.on(
    'draw_game_stroke',
    async (payload: {
      points?: { x: number; y: number }[];
      color?: string;
      width?: number;
      isEraser?: boolean;
    }) => {
    try {
      const senderSocketData = connectedUsers.find((user) => user.socketId === socket.id);
      if (!senderSocketData) {
        return;
      }

      const context = await resolveDrawGameContext(senderSocketData.userId);
      const points = payload?.points || [];
      if (points.length < 2) {
        return;
      }

      const stroke = {
        points,
        color: payload?.color || '#111111',
        width: payload?.width || 4,
        isEraser: Boolean(payload?.isEraser),
      };

      const state = await appendDrawStroke(senderSocketData.userId, context, stroke);
      await emitDrawStateToPartners(state, context);
    } catch (error) {
      if (error instanceof DrawGameError) {
        socket.emit('draw_game_error', { message: error.message, code: error.code });
      }
    }
  });

  socket.on('draw_game_clear_strokes', async () => {
    try {
      const senderSocketData = connectedUsers.find((user) => user.socketId === socket.id);
      if (!senderSocketData) {
        return;
      }

      const context = await resolveDrawGameContext(senderSocketData.userId);
      const state = await clearDrawStrokes(senderSocketData.userId, context);
      await emitDrawStateToPartners(state, context);
    } catch (error) {
      if (error instanceof DrawGameError) {
        socket.emit('draw_game_error', { message: error.message, code: error.code });
      }
    }
  });

  socket.on('draw_game_guess', async (payload: { guess?: string }) => {
    try {
      const senderSocketData = connectedUsers.find((user) => user.socketId === socket.id);
      if (!senderSocketData) {
        return;
      }

      const context = await resolveDrawGameContext(senderSocketData.userId);
      const state = await submitDrawGuess(senderSocketData.userId, context, String(payload?.guess || ''));

      await updateDrawGameBadges();
      await emitDrawStateToPartners(state, context);
    } catch (error) {
      if (error instanceof DrawGameError) {
        socket.emit('draw_game_error', { message: error.message, code: error.code });
      }
    }
  });

  socket.on('draw_game_leave', async () => {
    try {
      const senderSocketData = connectedUsers.find((user) => user.socketId === socket.id);
      if (!senderSocketData) {
        return;
      }

      const context = await resolveDrawGameContext(senderSocketData.userId);
      const state = await clearDrawGuessAttempts(context);
      await emitDrawStateToPartners(state, context);
    } catch (error) {
      if (error instanceof DrawGameError) {
        socket.emit('draw_game_error', { message: error.message, code: error.code });
      }
    }
  });

  socket.on('draw_game_next_round', async () => {
    try {
      const senderSocketData = connectedUsers.find((user) => user.socketId === socket.id);
      if (!senderSocketData) {
        return;
      }

      const context = await resolveDrawGameContext(senderSocketData.userId);
      const { state, allPartnersDismissed } = await advanceDrawRound(
        senderSocketData.userId,
        context
      );

      if (allPartnersDismissed) {
        await emitDrawStateToPartners(state, context);
      } else {
        await emitDrawStateToUser(state, senderSocketData.userId, context);
      }
    } catch (error) {
      if (error instanceof DrawGameError) {
        socket.emit('draw_game_error', { message: error.message, code: error.code });
      }
    }
  });

  const emitQuizStateToPartners = async (
    state: any,
    participantUserIds: string[]
  ) => {
    if (!state) {
      return;
    }

    await Promise.all(
      participantUserIds.map(async (uid) => {
        const socketData = connectedUsers.find((user) => user.userId === uid);
        if (!socketData) {
          return;
        }
        io.to(socketData.socketId).emit('quiz_game_state', {
          state: formatQuizGameState(state, uid),
        });
      })
    );
  };

  socket.on('quiz_game_subscribe', async () => {
    try {
      const senderSocketData = connectedUsers.find((user) => user.socketId === socket.id);
      if (!senderSocketData) {
        return;
      }

      const context = await resolveQuizGameContext(senderSocketData.userId);
      const state = await getOrCreateQuizGameState(context);

      await emitQuizStateToPartners(state, getQuizGameParticipantIds(context));
    } catch (error) {
      if (error instanceof QuizGameError) {
        socket.emit('quiz_game_error', { message: error.message, code: error.code });
        return;
      }
      console.error('quiz_game_subscribe error:', error);
    }
  });

  socket.on('quiz_game_ready', async () => {
    try {
      const senderSocketData = connectedUsers.find((user) => user.socketId === socket.id);
      if (!senderSocketData) {
        socket.emit('quiz_game_error', { message: 'Пользователь не авторизован' });
        return;
      }

      const context = await resolveQuizGameContext(senderSocketData.userId);
      const state = await setQuizPlayerReady(senderSocketData.userId, context);

      await emitQuizStateToPartners(state, getQuizGameParticipantIds(context));
    } catch (error) {
      if (error instanceof QuizGameError) {
        socket.emit('quiz_game_error', { message: error.message, code: error.code });
        return;
      }
      console.error('quiz_game_ready error:', error);
    }
  });

  socket.on('quiz_game_sync', async () => {
    try {
      const senderSocketData = connectedUsers.find((user) => user.socketId === socket.id);
      if (!senderSocketData) {
        return;
      }

      const context = await resolveQuizGameContext(senderSocketData.userId);
      const state = await syncQuizGameState(context);

      await emitQuizStateToPartners(state, getQuizGameParticipantIds(context));
    } catch (error) {
      if (error instanceof QuizGameError) {
        socket.emit('quiz_game_error', { message: error.message, code: error.code });
      }
    }
  });

  socket.on(
    'quiz_game_pick',
    async (payload: { categoryId?: string; points?: number }) => {
      try {
        const senderSocketData = connectedUsers.find((user) => user.socketId === socket.id);
        if (!senderSocketData) {
          return;
        }

        const context = await resolveQuizGameContext(senderSocketData.userId);
        const state = await pickQuizQuestion(
          senderSocketData.userId,
          context,
          String(payload?.categoryId ?? ''),
          Number(payload?.points)
        );

        await updateQuizGameBadges();
        await emitQuizStateToPartners(state, getQuizGameParticipantIds(context));
      } catch (error) {
        if (error instanceof QuizGameError) {
          socket.emit('quiz_game_error', { message: error.message, code: error.code });
        }
      }
    }
  );

  socket.on('quiz_game_answer', async (payload: { answer?: string }) => {
    try {
      const senderSocketData = connectedUsers.find((user) => user.socketId === socket.id);
      if (!senderSocketData) {
        return;
      }

      const context = await resolveQuizGameContext(senderSocketData.userId);
      const state = await submitQuizAnswer(
        senderSocketData.userId,
        context,
        String(payload?.answer ?? '')
      );

      await updateQuizGameBadges();
      await emitQuizStateToPartners(state!, getQuizGameParticipantIds(context));
    } catch (error) {
      if (error instanceof QuizGameError) {
        socket.emit('quiz_game_error', { message: error.message, code: error.code });
      }
    }
  });

  socket.on('quiz_game_dismiss_reveal', async () => {
    try {
      const senderSocketData = connectedUsers.find((user) => user.socketId === socket.id);
      if (!senderSocketData) {
        return;
      }

      const context = await resolveQuizGameContext(senderSocketData.userId);
      const state = await dismissQuizReveal(senderSocketData.userId, context);

      await emitQuizStateToPartners(state, getQuizGameParticipantIds(context));
    } catch (error) {
      if (error instanceof QuizGameError) {
        socket.emit('quiz_game_error', { message: error.message, code: error.code });
      }
    }
  });
};
