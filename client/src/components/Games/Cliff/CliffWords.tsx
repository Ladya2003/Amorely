import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Button, Typography } from '@mui/material';
import type { CliffGameState, CliffWordsPhraseId } from '../../../services/gamesService';
import { playCliffBounceSound, playCliffSpeechSound } from '../../../utils/gameSounds';
import CliffCharacter from './CliffCharacter';
import {
  getCliffGuidePadSx,
  getCliffModalGhostButtonSx,
  getCliffModalPrimaryButtonSx,
  getCliffParchmentPanelSx,
  getCliffWordsRootSx,
} from './cliffStyles';

type CliffWordsProps = {
  state: CliffGameState;
  onSync: (x: number, y: number, bounce: boolean, fall?: boolean) => void;
  onPhrase: (phraseId: CliffWordsPhraseId) => void;
  onAckFuelHint: () => void;
  onAckIntro: () => void;
  onNext: () => void;
};

const INTRO_KEYS = ['introBounce', 'introFuel'] as const;
const INTRO_SPEAKERS: Array<'owner' | 'partner'> = ['owner', 'partner'];

type Body = {
  x: number;
  y: number;
  vy: number;
  fuel: number;
};

const GRAVITY = 95;
const JUMP_V = 76;
const MOVE_SPEED = 54;
const PLAYER_W = 8;
const SYNC_MS = 110;
const SPEECH_MS = 4200;
const CAMERA_FOLLOW = 12;
const PARTNER_FOLLOW = 7;
const CAMERA_START = 0;
const CAMERA_KEEP = 30;

const displayName = (user: CliffGameState['me']) => user.firstName || user.username || '';

const overlapsPlatform = (x: number, platform: { x: number; w: number }) =>
  x + PLAYER_W / 2 > platform.x - platform.w / 2 && x - PLAYER_W / 2 < platform.x + platform.w / 2;

const standOnPlatformX = (x: number, platform: { x: number; w: number }, role: 'owner' | 'partner') =>
  overlapsPlatform(x, platform) ? x : platform.x + (role === 'owner' ? -4 : 4);

const isAtWordsStart = (y: number, checkpoint: number, platforms: Array<{ y: number }>) =>
  checkpoint <= 0 && y <= (platforms[0]?.y ?? 0) + 0.8;

const shouldPlayWordsIntro = (words: CliffGameState['words']) =>
  !words.introTold &&
  !words.fuelHint &&
  isAtWordsStart(words.my.y, words.my.checkpoint, words.world.platforms) &&
  words.my.fuel >= words.fuelStart;

const localCameraTarget = (
  standY: number,
  platforms: Array<{ y: number }>,
  finishY: number,
  cameraHeight: number,
  currentCam?: number
) => {
  const unlockY = platforms[2]?.y ?? 0;
  if (standY < unlockY) {
    return CAMERA_START;
  }
  const desired = Math.max(CAMERA_START, Math.min(standY - CAMERA_KEEP, finishY - cameraHeight + 24));
  if (typeof currentCam === 'number') {
    return Math.max(currentCam, desired);
  }
  return desired;
};

const PadArrow: React.FC<{ turn?: number }> = ({ turn = 0 }) => (
  <Box
    component="span"
    sx={{
      display: 'block',
      lineHeight: 1,
      fontSize: '1.35rem',
      fontWeight: 800,
      transform: turn ? `rotate(${turn}deg)` : undefined,
    }}
  >
    ↑
  </Box>
);

const CliffWords: React.FC<CliffWordsProps> = ({
  state,
  onSync,
  onPhrase,
  onAckFuelHint,
  onAckIntro,
  onNext,
}) => {
  const { t } = useTranslation();
  const words = state.words;
  const rootRef = useRef<HTMLDivElement | null>(null);
  const worldRef = useRef<HTMLDivElement | null>(null);
  const meElRef = useRef<HTMLDivElement | null>(null);
  const partnerElRef = useRef<HTMLDivElement | null>(null);
  const [view, setView] = useState({ w: 1, h: 1 });
  const [move, setMove] = useState<-1 | 0 | 1>(0);
  const [walking, setWalking] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [rewoundFlash, setRewoundFlash] = useState(false);
  const [mySpeech, setMySpeech] = useState<string | null>(null);
  const [partnerSpeech, setPartnerSpeech] = useState<string | null>(null);
  const [started, setStarted] = useState(
    () => !isAtWordsStart(words.my.y, words.my.checkpoint, words.world.platforms)
  );
  const [introLine, setIntroLine] = useState(() => (shouldPlayWordsIntro(words) ? 0 : INTRO_KEYS.length));
  const [controlsReady, setControlsReady] = useState(() => !shouldPlayWordsIntro(words));

  const meRef = useRef<Body>({
    x: words.my.x,
    y:
      words.my.checkpoint <= 0
        ? Math.max(words.my.y, words.world.platforms[0]?.y ?? words.my.y)
        : words.my.y,
    vy: 0,
    fuel: words.my.fuel,
  });
  const partnerRef = useRef({ x: words.partner.x, y: words.partner.y });
  const partnerTargetRef = useRef({ x: words.partner.x, y: words.partner.y });
  const cameraRef = useRef(0);
  const moveRef = useRef(move);
  const keysRef = useRef({ left: false, right: false });
  const failSeqRef = useRef(words.failSeq);
  const lastPhraseAtRef = useRef(words.lastPhrase?.at ?? '');
  const fuelHintRef = useRef(words.fuelHint);
  const lastSyncRef = useRef(0);
  const lastStandYRef = useRef(meRef.current.y);
  const groundedRef = useRef(true);
  const startedRef = useRef(started);
  const fallingRef = useRef(false);
  const introActiveRef = useRef(shouldPlayWordsIntro(words) && introLine < INTRO_KEYS.length);
  const walkingRef = useRef(false);
  const onSyncRef = useRef(onSync);
  const wordsRef = useRef(words);
  const viewRef = useRef(view);
  onSyncRef.current = onSync;
  wordsRef.current = words;
  viewRef.current = view;
  moveRef.current = move;
  startedRef.current = started;
  fuelHintRef.current = words.fuelHint;
  introActiveRef.current = shouldPlayWordsIntro(words) && introLine < INTRO_KEYS.length;
  partnerTargetRef.current = { x: words.partner.x, y: words.partner.y };

  useEffect(() => {
    const floor = words.world.platforms[0];
    if (!floor) {
      return;
    }
    if (meRef.current.y < floor.y + 0.8 && words.my.checkpoint <= 0) {
      meRef.current.y = floor.y;
      meRef.current.vy = 0;
    }
    if (Math.abs(meRef.current.y - floor.y) <= 0.8) {
      meRef.current.x = standOnPlatformX(meRef.current.x, floor, words.role);
    }
    if (partnerRef.current.y < floor.y + 0.8 && words.partner.checkpoint <= 0) {
      partnerRef.current.y = floor.y;
    }
    if (Math.abs(partnerRef.current.y - floor.y) <= 0.8) {
      partnerRef.current.x = standOnPlatformX(
        partnerRef.current.x,
        floor,
        words.role === 'owner' ? 'partner' : 'owner'
      );
    }
  }, [words.my.x, words.partner.x, words.role, words.world.platforms]);

  const scale = () => {
    const world = wordsRef.current.world;
    const size = viewRef.current;
    return {
      x: size.w / world.width,
      y: size.h / world.cameraHeight,
    };
  };

  const placeBody = (node: HTMLDivElement | null, x: number, y: number) => {
    if (!node) {
      return;
    }
    const px = scale();
    node.style.left = `${x * px.x}px`;
    node.style.bottom = `${y * px.y}px`;
  };

  const placeWorld = (cameraY: number) => {
    const node = worldRef.current;
    if (!node) {
      return;
    }
    node.style.transform = `translate3d(0, ${cameraY * scale().y}px, 0)`;
  };

  const paint = () => {
    placeWorld(cameraRef.current);
    placeBody(meElRef.current, meRef.current.x, meRef.current.y);
    placeBody(partnerElRef.current, partnerRef.current.x, partnerRef.current.y);
  };

  useEffect(() => {
    const node = rootRef.current;
    if (!node) {
      return;
    }
    const measure = () => {
      const rect = node.getBoundingClientRect();
      setView({ w: Math.max(1, rect.width), h: Math.max(1, rect.height) });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    paint();
  }, [view.w, view.h, words.world.cameraHeight, words.world.width]);

  useEffect(() => {
    if (words.failSeq !== failSeqRef.current) {
      failSeqRef.current = words.failSeq;
      meRef.current = { x: words.my.x, y: words.my.y, vy: 0, fuel: words.my.fuel };
      partnerRef.current = { x: words.partner.x, y: words.partner.y };
      groundedRef.current = true;
      fallingRef.current = false;
      lastStandYRef.current = words.my.y;
      if (isAtWordsStart(words.my.y, words.my.checkpoint, words.world.platforms)) {
        startedRef.current = false;
        setStarted(false);
      }
      cameraRef.current = localCameraTarget(words.my.y, words.world.platforms, words.world.finishY, words.world.cameraHeight);
      setRewoundFlash(true);
      paint();
      window.setTimeout(() => setRewoundFlash(false), 2200);
    }
  }, [words.failSeq, words.my.fuel, words.my.x, words.my.y, words.partner.x, words.partner.y, words.world.cameraHeight, words.world.finishY, words.world.platforms]);

  useEffect(() => {
    if (words.my.fuel > meRef.current.fuel) {
      meRef.current.fuel = words.my.fuel;
    }
  }, [words.my.fuel]);

  useEffect(() => {
    if (!words.fuelHint) {
      return;
    }
    void playCliffSpeechSound();
  }, [words.fuelHint]);

  useEffect(() => {
    if (!introActiveRef.current) {
      return;
    }
    void playCliffSpeechSound();
  }, [introLine]);

  useEffect(() => {
    const last = words.lastPhrase;
    if (!last || last.at === lastPhraseAtRef.current) {
      return;
    }
    lastPhraseAtRef.current = last.at;
    const text = t(`games.cliff.words.phrases.${last.phraseId}`);
    void playCliffSpeechSound();
    if (last.userId === state.userId) {
      setMySpeech(text);
      window.setTimeout(() => setMySpeech(null), SPEECH_MS);
      return;
    }
    setPartnerSpeech(text);
    window.setTimeout(() => setPartnerSpeech(null), SPEECH_MS);
  }, [state.userId, t, words.lastPhrase]);

  const bounce = useCallback((fromY: number) => {
    const current = meRef.current;
    const stage = wordsRef.current;
    if (stage.my.cleared || stage.bothCleared) {
      return;
    }
    if (current.fuel < stage.fuelBounce) {
      onSyncRef.current(current.x, current.y, true);
      return;
    }
    void playCliffBounceSound();
    current.y = fromY;
    current.vy = JUMP_V;
    current.fuel = Math.max(0, current.fuel - stage.fuelBounce);
    lastStandYRef.current = fromY;
    groundedRef.current = false;
    onSyncRef.current(current.x, fromY, true);
    paint();
  }, []);

  useEffect(() => {
    let frame = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.032, (now - last) / 1000);
      last = now;
      const stage = wordsRef.current;
      const current = meRef.current;
      const follow = 1 - Math.exp(-CAMERA_FOLLOW * dt);
      const partnerFollow = 1 - Math.exp(-PARTNER_FOLLOW * dt);

      partnerRef.current.x += (partnerTargetRef.current.x - partnerRef.current.x) * partnerFollow;
      partnerRef.current.y += (partnerTargetRef.current.y - partnerRef.current.y) * partnerFollow;

      if (
        !stage.bothCleared &&
        !stage.my.cleared &&
        !fuelHintRef.current &&
        !introActiveRef.current &&
        !fallingRef.current
      ) {
        const held =
          keysRef.current.left === keysRef.current.right ? moveRef.current : keysRef.current.left ? -1 : 1;
        let nextX = current.x + held * MOVE_SPEED * dt;
        nextX = Math.min(stage.world.width - PLAYER_W / 2, Math.max(PLAYER_W / 2, nextX));
        const floorY = stage.world.platforms[0]?.y ?? 0;
        let nextVy = current.vy;
        let nextY = current.y;
        let landed = false;

        if (startedRef.current) {
          nextVy = current.vy - GRAVITY * dt;
          nextY = current.y + nextVy * dt;
          if (nextVy < 0 && current.fuel >= stage.fuelBounce) {
            for (const platform of stage.world.platforms) {
              if (!overlapsPlatform(nextX, platform)) {
                continue;
              }
              if (current.y >= platform.y && nextY <= platform.y) {
                nextY = platform.y;
                nextVy = JUMP_V;
                landed = true;
                break;
              }
            }
          }
        } else {
          nextY = Math.max(current.y, floorY);
          nextVy = 0;
          groundedRef.current = true;
        }

        current.x = nextX;
        current.y = nextY;
        current.vy = nextVy;

        if (
          startedRef.current &&
          current.y < cameraRef.current
        ) {
          fallingRef.current = true;
          groundedRef.current = true;
          current.vy = 0;
          onSyncRef.current(current.x, current.y, false, true);
          lastSyncRef.current = now;
        } else if (landed) {
          groundedRef.current = false;
          lastStandYRef.current = nextY;
          void playCliffBounceSound();
          current.fuel = Math.max(0, current.fuel - stage.fuelBounce);
          onSyncRef.current(nextX, nextY, true);
          lastSyncRef.current = now;
        } else if (now - lastSyncRef.current >= SYNC_MS) {
          lastSyncRef.current = now;
          onSyncRef.current(nextX, nextY, false);
        }

        const nextWalking = groundedRef.current && held !== 0;
        if (nextWalking !== walkingRef.current) {
          walkingRef.current = nextWalking;
          setWalking(nextWalking);
        }
      }

      const targetCam = localCameraTarget(
        lastStandYRef.current,
        stage.world.platforms,
        stage.world.finishY,
        stage.world.cameraHeight,
        cameraRef.current
      );
      cameraRef.current += (targetCam - cameraRef.current) * follow;
      paint();
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft' || event.key === 'a' || event.key === 'A') {
        keysRef.current.left = true;
        setMove(-1);
      } else if (event.key === 'ArrowRight' || event.key === 'd' || event.key === 'D') {
        keysRef.current.right = true;
        setMove(1);
      }
    };
    const onKeyUp = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft' || event.key === 'a' || event.key === 'A') {
        keysRef.current.left = false;
        setMove(keysRef.current.right ? 1 : 0);
      } else if (event.key === 'ArrowRight' || event.key === 'd' || event.key === 'D') {
        keysRef.current.right = false;
        setMove(keysRef.current.left ? -1 : 0);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  const unusedPhrases = words.phraseIds.filter((id) => !words.my.usedPhrases.includes(id));
  const introActive = shouldPlayWordsIntro(words) && introLine < INTRO_KEYS.length;
  const introSpeaker = introActive ? INTRO_SPEAKERS[introLine] : null;
  const introText = introActive ? t(`games.cliff.words.${INTRO_KEYS[introLine]}`) : null;
  const myLine = words.fuelHint
    ? t('games.cliff.words.fuelHint')
    : introActive
      ? introSpeaker === words.role
        ? introText
        : null
      : mySpeech;
  const partnerLine = words.fuelHint
    ? null
    : introActive
      ? introSpeaker !== words.role
        ? introText
        : null
      : partnerSpeech;
  const px = view.w / words.world.width;
  const py = view.h / words.world.cameraHeight;
  const playerWidth = PLAYER_W * px * 1.35;
  const worldHeight = (words.world.finishY + words.world.cameraHeight) * py;

  const renderPlayer = (
    who: 'me' | 'partner',
    nodeRef: React.Ref<HTMLDivElement>,
    speech: string | null
  ) => (
    <Box
      ref={nodeRef}
      sx={{
        position: 'absolute',
        left: 0,
        bottom: 0,
        width: playerWidth,
        height: playerWidth * 1.15,
        overflow: 'visible',
        transform: 'translate(-50%, 0)',
        zIndex: speech ? 6 : 4,
        pointerEvents: 'none',
        willChange: 'left, bottom',
      }}
    >
      <CliffCharacter
        avatar={who === 'me' ? state.me.avatar : state.partner.avatar}
        name={who === 'me' ? displayName(state.me) : displayName(state.partner)}
        walking={who === 'me' ? walking : false}
        from={who === 'me' ? 'left' : 'right'}
        speech={speech}
        speechWide={Boolean(speech)}
        speechSide={(who === 'me' ? words.my.x : words.partner.x) < 50 ? 'left' : 'right'}
        compact
        motion="idle"
      />
    </Box>
  );

  return (
    <Box ref={rootRef} sx={getCliffWordsRootSx()}>
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          overflow: 'hidden',
        }}
      >
        <Box
          ref={worldRef}
          sx={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: worldHeight,
            willChange: 'transform',
            background:
              'radial-gradient(ellipse at 50% 18%, rgba(255, 196, 120, 0.16) 0%, transparent 42%), repeating-linear-gradient(90deg, rgba(72, 38, 24, 0.18) 0 18px, transparent 18px 46px)',
          }}
        >
          {words.world.platforms.map((platform, index) => {
            const checkpoint = platform.checkpoint > 0;
            const finish = platform.y >= words.world.finishY - 0.5;
            return (
              <Box
                key={`${platform.x}-${platform.y}-${index}`}
                sx={{
                  position: 'absolute',
                  left: platform.x * px,
                  bottom: platform.y * py,
                  width: platform.w * px,
                  height: Math.max(10, px * 2.4),
                  transform: 'translate(-50%, 0)',
                  borderRadius: '8px',
                  background: finish
                    ? 'linear-gradient(180deg, #e8c36a 0%, #8b4a2b 100%)'
                    : checkpoint
                      ? 'linear-gradient(180deg, #ffe8c8 0%, #c47a3a 100%)'
                      : 'linear-gradient(180deg, #c48a58 0%, #6b3a22 100%)',
                  border: '1.5px solid rgba(255, 232, 200, 0.35)',
                  boxShadow: checkpoint
                    ? '0 0 14px rgba(255, 196, 120, 0.45)'
                    : '0 4px 0 rgba(40, 16, 12, 0.45)',
                }}
              />
            );
          })}
          {introActive && renderPlayer('partner', partnerElRef, partnerLine)}
          {renderPlayer('me', meElRef, myLine)}
        </Box>
      </Box>

      {rewoundFlash && (
        <Box sx={{ ...getCliffParchmentPanelSx(), bottom: 'auto', top: 52 }}>
          <Typography variant="body2" sx={{ fontWeight: 800, color: '#5c2618' }}>
            {t('games.cliff.words.rewound')}
          </Typography>
        </Box>
      )}

      {words.bothCleared ? (
        <Box sx={{ ...getCliffParchmentPanelSx(), display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 800, color: '#5c2618' }}>
            {t('games.cliff.words.cleared')}
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            {state.partnerPresent ? (
              <Button onClick={onNext} sx={getCliffModalPrimaryButtonSx()}>
                {t('games.cliff.words.next')}
              </Button>
            ) : (
              <Typography variant="body2" sx={{ fontWeight: 700, color: '#8a3d28' }}>
                {t('games.cliff.waitPartner')}
              </Typography>
            )}
          </Box>
        </Box>
      ) : introActive ? (
        <Box sx={{ ...getCliffParchmentPanelSx(), display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            onClick={() => {
              const next = introLine + 1;
              setIntroLine(next);
              if (next >= INTRO_KEYS.length) {
                startedRef.current = false;
                setStarted(false);
                onAckIntro();
                window.setTimeout(() => setControlsReady(true), 450);
              }
            }}
            sx={getCliffModalPrimaryButtonSx()}
          >
            {t('games.cliff.words.continue')}
          </Button>
        </Box>
      ) : words.fuelHint ? (
        <Box sx={{ ...getCliffParchmentPanelSx(), display: 'flex', justifyContent: 'flex-end' }}>
          <Button onClick={onAckFuelHint} sx={getCliffModalPrimaryButtonSx()}>
            {t('games.cliff.words.continue')}
          </Button>
        </Box>
      ) : (
        <Box
          sx={{
            ...getCliffParchmentPanelSx(),
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
          }}
        >
          {words.my.cleared && (
            <Typography variant="body2" sx={{ fontWeight: 700, color: '#8a3d28' }}>
              {t('games.cliff.waitPartner')}
            </Typography>
          )}
          {pickerOpen ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
              {words.phraseIds.map((phraseId) => {
                const used = words.my.usedPhrases.includes(phraseId);
                return (
                  <Button
                    key={phraseId}
                    disabled={used}
                    onClick={() => {
                      setPickerOpen(false);
                      if (!used) {
                        onPhrase(phraseId);
                      }
                    }}
                    sx={used ? getCliffModalGhostButtonSx() : getCliffModalPrimaryButtonSx()}
                  >
                    {t(`games.cliff.words.phrases.${phraseId}`)}
                  </Button>
                );
              })}
              <Button onClick={() => setPickerOpen(false)} sx={getCliffModalGhostButtonSx()}>
                {t('games.common.close')}
              </Button>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
              <Box sx={{ display: 'flex', gap: 0.75 }}>
                <Button
                  onPointerDown={() => setMove(-1)}
                  onPointerUp={() => setMove(0)}
                  onPointerLeave={() => setMove(0)}
                  sx={getCliffGuidePadSx()}
                >
                  <PadArrow turn={-90} />
                </Button>
                <Button
                  onPointerDown={() => setMove(1)}
                  onPointerUp={() => setMove(0)}
                  onPointerLeave={() => setMove(0)}
                  sx={getCliffGuidePadSx()}
                >
                  <PadArrow turn={90} />
                </Button>
              </Box>
              {started ? (
                <Button
                  disabled={unusedPhrases.length === 0}
                  onClick={() => setPickerOpen(true)}
                  sx={getCliffModalPrimaryButtonSx()}
                >
                  {t('games.cliff.words.encourage')}
                </Button>
              ) : (
                <Button
                  disabled={!controlsReady}
                  onClick={() => {
                    if (!controlsReady) {
                      return;
                    }
                    startedRef.current = true;
                    setStarted(true);
                    bounce(meRef.current.y);
                  }}
                  sx={getCliffModalPrimaryButtonSx()}
                >
                  {t('games.cliff.words.start')}
                </Button>
              )}
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};

export default CliffWords;
