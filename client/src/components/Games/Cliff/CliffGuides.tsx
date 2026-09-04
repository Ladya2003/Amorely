import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Button, Typography } from '@mui/material';
import type {
  CliffGameState,
  CliffGuideCellKind,
  CliffGuideDir,
  CliffGuidePoint,
  CliffLiftPet,
} from '../../../services/gamesService';
import {
  playCliffGuideEscapeSound,
  playCliffGuidePetRunSound,
  playCliffGuidePickSound,
  playCliffGuideResetSound,
  playCliffGuideStepSound,
  playCliffSpeechSound,
} from '../../../utils/gameSounds';
import CliffCharacter from './CliffCharacter';
import {
  getCliffCharacterSlotSx,
  getCliffGuidePadSx,
  getCliffGuidesRootSx,
  getCliffLiftPetPickSx,
  getCliffModalPrimaryButtonSx,
  getCliffParchmentPanelSx,
} from './cliffStyles';

type CliffGuidesProps = {
  state: CliffGameState;
  onPickPet: (petId: string) => void;
  onSendPet: () => void;
  onMove: (dir: CliffGuideDir) => void;
  onNext: () => void;
};

const displayName = (user: CliffGameState['me']) => user.firstName || user.username || '';

const pointKey = (point: CliffGuidePoint) => `${point.x},${point.y}`;

const GUIDE_DELTA: Record<CliffGuideDir, CliffGuidePoint> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

const findGuideStart = (cells: CliffGuideCellKind[][]): CliffGuidePoint => {
  for (let y = 0; y < cells.length; y += 1) {
    const x = cells[y].findIndex((kind) => kind === 'start');
    if (x >= 0) {
      return { x, y };
    }
  }
  return { x: 0, y: 0 };
};

const applyGuideStep = (
  from: CliffGuidePoint,
  dir: CliffGuideDir,
  cells: CliffGuideCellKind[][],
  start: CliffGuidePoint
): { x: number; y: number; reset: boolean; escaped: boolean } => {
  const next = { x: from.x + GUIDE_DELTA[dir].x, y: from.y + GUIDE_DELTA[dir].y };
  const kind = cells[next.y]?.[next.x];
  if (!kind || kind === 'wall' || kind === 'trap') {
    return { x: start.x, y: start.y, reset: true, escaped: false };
  }
  return { x: next.x, y: next.y, reset: false, escaped: kind === 'exit' };
};

const replayGuideSteps = (
  from: CliffGuidePoint,
  dirsToApply: CliffGuideDir[],
  cells: CliffGuideCellKind[][],
  start: CliffGuidePoint
): CliffGuidePoint | null => {
  let pos = from;
  for (const dir of dirsToApply) {
    const next = applyGuideStep(pos, dir, cells, start);
    pos = { x: next.x, y: next.y };
  }
  return pos;
};

const dirs: Array<{ dir: CliffGuideDir; rotate: number; grid: string }> = [
  { dir: 'up', rotate: 0, grid: '1 / 2' },
  { dir: 'left', rotate: -90, grid: '2 / 1' },
  { dir: 'down', rotate: 180, grid: '2 / 2' },
  { dir: 'right', rotate: 90, grid: '2 / 3' },
];

const INTRO_KEYS = ['darkWhat', 'callPet', 'moreRuns', 'whyLantern'] as const;
const INTRO_SPEAKERS: Array<'owner' | 'partner'> = ['owner', 'partner', 'partner', 'partner'];
const GUIDE_TRAIL_FADE_MS = 5000;
const GUIDE_PET_STEP_MS = 80;

const GuideSpeechBubble: React.FC<{ text: string; align: 'left' | 'right'; name?: string; narrow?: boolean }> = ({
  text,
  align,
  name,
  narrow = false,
}) => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: align === 'left' ? 'flex-start' : 'flex-end',
      gap: 0.4,
      pointerEvents: 'none',
    }}
  >
    {name && (
      <Typography sx={{ fontSize: '0.7rem', fontWeight: 800, color: '#ffe8c8', px: 0.5 }}>{name}</Typography>
    )}
    <Box
      sx={{
        px: 1.25,
        py: 0.75,
        boxSizing: 'border-box',
        width: narrow ? 200 : 280,
        maxWidth: narrow ? 'min(200px, 52cqw)' : 'min(280px, 76cqw)',
        borderRadius: 2,
        bgcolor: 'background.paper',
        boxShadow: 1,
        animation: 'cliffSpeechIn 0.3s ease-out',
        '@keyframes cliffSpeechIn': {
          from: { transform: 'translateY(6px)', opacity: 0 },
          to: { transform: 'translateY(0)', opacity: 1 },
        },
      }}
    >
      <Typography variant="caption" sx={{ fontWeight: 600, lineHeight: 1.35 }}>
        {text}
      </Typography>
    </Box>
  </Box>
);

const CliffGuides: React.FC<CliffGuidesProps> = ({ state, onPickPet, onSendPet, onMove, onNext }) => {
  const { t } = useTranslation();
  const guides = state.guides;
  const myName = displayName(state.me) || t('games.common.you');
  const partnerName = displayName(state.partner) || t('games.common.partner');
  const [selectedPetId, setSelectedPetId] = useState<string | null>(null);
  const [trailLeftMs, setTrailLeftMs] = useState(0);
  const [introLine, setIntroLine] = useState(() => (guides.my.pet ? INTRO_KEYS.length : 0));
  const [trapSpeech, setTrapSpeech] = useState(false);
  const [petAnimIndex, setPetAnimIndex] = useState(-1);
  const [stepping, setStepping] = useState(false);
  const [walkPos, setWalkPos] = useState({ x: guides.my.x, y: guides.my.y });
  const trapToldRef = useRef(guides.my.trapTold);
  const posRef = useRef({ x: guides.my.x, y: guides.my.y });
  const pendingDirs = useRef<CliffGuideDir[]>([]);
  const start = useMemo(() => findGuideStart(guides.cells), [guides.cells]);

  const trailIndexByKey = useMemo(() => {
    const map = new Map<string, number>();
    guides.my.trail.forEach((point, index) => map.set(pointKey(point), index));
    return map;
  }, [guides.my.trail]);
  const trailKey = useMemo(() => guides.my.trail.map(pointKey).join('|'), [guides.my.trail]);
  const inMaze = !guides.bothEscaped && !guides.my.escaped;
  const introActive = inMaze && introLine < INTRO_KEYS.length;
  const showMaze = (inMaze || guides.my.escaped) && !introActive;
  const introSpeaker = introActive ? INTRO_SPEAKERS[introLine] : null;
  const introText = introActive ? t(`games.cliff.guides.${INTRO_KEYS[introLine]}`) : null;
  const mySpeech = introSpeaker === guides.role ? introText : null;
  const partnerSpeech = introSpeaker && introSpeaker !== guides.role ? introText : null;
  const petCell = petAnimIndex >= 0 && guides.my.trail[petAnimIndex] ? guides.my.trail[petAnimIndex] : null;

  const cellTrailOpacity = (index: number) => {
    if (petAnimIndex < 0 || index > petAnimIndex) {
      return 0;
    }
    if (trailLeftMs >= GUIDE_TRAIL_FADE_MS) {
      return 1;
    }
    const count = Math.max(1, guides.my.trail.length);
    const fadeT = 1 - trailLeftMs / GUIDE_TRAIL_FADE_MS;
    const window = Math.max(1.4, count * 0.2);
    const front = fadeT * (count + window);
    return Math.max(0, Math.min(1, 1 - (front - index) / window));
  };

  useEffect(() => {
    if (selectedPetId && !guides.eligiblePets.some((pet) => pet.id === selectedPetId)) {
      setSelectedPetId(guides.eligiblePets.length === 1 ? guides.eligiblePets[0].id : null);
      return;
    }
    if (!selectedPetId && guides.eligiblePets.length === 1) {
      setSelectedPetId(guides.eligiblePets[0].id);
    }
  }, [guides.eligiblePets, selectedPetId]);

  useEffect(() => {
    if (!guides.my.trailUntil) {
      setTrailLeftMs(0);
      return undefined;
    }
    const tick = () => setTrailLeftMs(Math.max(0, new Date(guides.my.trailUntil as string).getTime() - Date.now()));
    tick();
    const id = window.setInterval(tick, 50);
    return () => window.clearInterval(id);
  }, [guides.my.trailUntil]);

  useEffect(() => {
    if (guides.my.trail.length === 0) {
      setPetAnimIndex(-1);
      return undefined;
    }
    void playCliffGuidePetRunSound();
    setPetAnimIndex(0);
    let index = 0;
    const id = window.setInterval(() => {
      index += 1;
      if (index >= guides.my.trail.length) {
        window.clearInterval(id);
        setPetAnimIndex(guides.my.trail.length - 1);
        return;
      }
      setPetAnimIndex(index);
    }, GUIDE_PET_STEP_MS);
    return () => window.clearInterval(id);
  }, [guides.my.trailUntil, trailKey, guides.my.trail.length]);

  useEffect(() => {
    if (introActive) {
      void playCliffSpeechSound();
    }
  }, [introActive, introLine]);

  useEffect(() => {
    if (!trapToldRef.current && guides.my.trapTold) {
      setTrapSpeech(true);
      void playCliffSpeechSound();
    }
    trapToldRef.current = guides.my.trapTold;
  }, [guides.my.trapTold]);

  useEffect(() => {
    if (guides.my.lanternWithPet) {
      setTrapSpeech(false);
    }
  }, [guides.my.lanternWithPet]);

  useEffect(() => {
    const prev = posRef.current;
    if (prev.x === walkPos.x && prev.y === walkPos.y) {
      return undefined;
    }
    const jumped = Math.abs(walkPos.x - prev.x) + Math.abs(walkPos.y - prev.y) > 1;
    posRef.current = { x: walkPos.x, y: walkPos.y };
    if (jumped) {
      return undefined;
    }
    setStepping(true);
    const id = window.setTimeout(() => setStepping(false), 280);
    return () => window.clearTimeout(id);
  }, [walkPos.x, walkPos.y]);

  useEffect(() => {
    const server = { x: guides.my.x, y: guides.my.y };
    const pending = pendingDirs.current;
    let keepFrom = -1;
    for (let k = pending.length; k >= 0; k -= 1) {
      const replayed = replayGuideSteps(server, pending.slice(k), guides.cells, start);
      if (replayed && replayed.x === walkPos.x && replayed.y === walkPos.y) {
        keepFrom = k;
        break;
      }
    }
    if (keepFrom < 0) {
      pendingDirs.current = [];
      if (walkPos.x !== server.x || walkPos.y !== server.y) {
        setWalkPos(server);
      }
      return;
    }
    pendingDirs.current = pending.slice(keepFrom);
  }, [guides.cells, guides.my.x, guides.my.y, start, walkPos.x, walkPos.y]);

  const tryWalk = useCallback(
    (dir: CliffGuideDir) => {
      if (!inMaze || introActive) {
        return;
      }
      const hereKind = guides.cells[walkPos.y]?.[walkPos.x];
      if (hereKind === 'exit') {
        return;
      }
      const next = applyGuideStep(walkPos, dir, guides.cells, start);
      if (next.reset) {
        if (!trapToldRef.current) {
          setTrapSpeech(true);
          trapToldRef.current = true;
          void playCliffSpeechSound();
        }
        void playCliffGuideResetSound();
      } else if (trapSpeech) {
        setTrapSpeech(false);
      }
      if (!next.reset) {
        if (next.escaped) {
          void playCliffGuideEscapeSound();
        } else {
          void playCliffGuideStepSound();
        }
      }
      setWalkPos({ x: next.x, y: next.y });
      pendingDirs.current = [...pendingDirs.current, dir];
      onMove(dir);
    },
    [guides.cells, inMaze, introActive, onMove, start, trapSpeech, walkPos]
  );

  useEffect(() => {
    if (!inMaze || introActive) {
      return undefined;
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.repeat) {
        return;
      }
      const map: Record<string, CliffGuideDir> = {
        ArrowUp: 'up',
        ArrowDown: 'down',
        ArrowLeft: 'left',
        ArrowRight: 'right',
        w: 'up',
        s: 'down',
        a: 'left',
        d: 'right',
      };
      const dir = map[event.key];
      if (!dir) {
        return;
      }
      event.preventDefault();
      tryWalk(dir);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [inMaze, introActive, tryWalk]);

  const renderPetCard = (pet: CliffLiftPet, selected: boolean, onClick?: () => void) => (
    <Box
      key={pet.id}
      component={onClick ? 'button' : 'div'}
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      sx={{ ...getCliffLiftPetPickSx(selected), cursor: onClick ? 'pointer' : 'default' }}
    >
      <Box component="img" src={pet.imageUrl} alt="" />
      <Typography sx={{ fontSize: '0.72rem', fontWeight: 800, color: '#5c2618', lineHeight: 1.2 }}>
        {pet.name}
      </Typography>
      <Typography sx={{ fontSize: '0.66rem', fontWeight: 700, color: '#8b4a2b' }}>
        {t(pet.mine ? 'games.cliff.guides.you' : 'games.cliff.guides.partner')} ·{' '}
        {t('games.cliff.guides.level', { level: pet.level })}
      </Typography>
    </Box>
  );

  if (guides.bothEscaped) {
    return (
      <Box sx={getCliffGuidesRootSx()}>
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(ellipse at 50% 70%, rgba(72, 42, 28, 0.45) 0%, rgba(0, 0, 0, 0.2) 42%, #000 78%)',
          }}
        />
        <Box sx={{ position: 'absolute', left: 0, right: 0, bottom: '8%', height: '42%', zIndex: 2 }}>
          <Box sx={getCliffCharacterSlotSx(state.partnerPresent ? '18%' : '38%', true)}>
            <CliffCharacter avatar={state.me.avatar} name={myName} walking={false} from="left" compact motion="idle" />
          </Box>
          {state.partnerPresent && (
            <Box sx={getCliffCharacterSlotSx('58%', true)}>
              <CliffCharacter
                avatar={state.partner.avatar}
                name={partnerName}
                walking={false}
                from="right"
                compact
                motion="idle"
              />
            </Box>
          )}
        </Box>
        <Box sx={{ ...getCliffParchmentPanelSx(), display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 800, color: '#5c2618' }}>
            {t('games.cliff.guides.hall')}
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            {state.partnerPresent ? (
              <Button onClick={onNext} sx={getCliffModalPrimaryButtonSx()}>
                {t('games.cliff.guides.next')}
              </Button>
            ) : (
              <Typography variant="body2" sx={{ fontWeight: 700, color: '#8a3d28' }}>
                {t('games.cliff.waitPartner')}
              </Typography>
            )}
          </Box>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={getCliffGuidesRootSx()}>
      {introActive && (
        <Box
          sx={{
            position: 'absolute',
            left: 0,
            top: '18%',
            bottom: '34%',
            width: { xs: '30%', sm: '26%' },
            zIndex: 3,
            pointerEvents: 'none',
          }}
        >
          <Box sx={{ ...getCliffCharacterSlotSx('8%', true), bottom: 'auto', top: '18%', width: '84%' }}>
            <CliffCharacter
              avatar={state.me.avatar}
              name={myName}
              walking={false}
              from="left"
              compact
              motion="idle"
              speech={mySpeech}
              speechWide
            />
          </Box>
        </Box>
      )}

      {partnerSpeech && (
        <Box
          sx={{
            position: 'absolute',
            right: 12,
            top: '36%',
            zIndex: 4,
            maxWidth: '52%',
          }}
        >
          <GuideSpeechBubble text={partnerSpeech} align="right" name={partnerName} />
        </Box>
      )}

      {showMaze && (
        <Box
          sx={{
            position: 'absolute',
            left: 8,
            right: 8,
            top: 8,
            bottom: guides.my.escaped ? '28%' : '36%',
            zIndex: 2,
          }}
        >
          <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
            <Box
              sx={{
                display: 'grid',
                width: '100%',
                height: '100%',
                gridTemplateColumns: `repeat(${guides.width}, 1fr)`,
                gridTemplateRows: `repeat(${guides.height}, 1fr)`,
                gap: '2px',
              }}
            >
              {guides.cells.flatMap((row, y) =>
                row.map((kind, x) => {
                  const here = pointKey({ x, y });
                  const isPlayer = walkPos.x === x && walkPos.y === y;
                  const trailIndex = trailIndexByKey.get(here);
                  const litOpacity = typeof trailIndex === 'number' ? cellTrailOpacity(trailIndex) : 0;
                  const lit = litOpacity > 0.01;
                  const petHere = Boolean(
                    petCell && petCell.x === x && petCell.y === y && guides.my.pet && litOpacity > 0.08
                  );
                  if (kind === 'wall' && !lit && !isPlayer) {
                    return <Box key={here} />;
                  }
                  return (
                    <Box
                      key={here}
                      sx={{
                        borderRadius: '3px',
                        bgcolor: isPlayer
                          ? 'rgba(255, 214, 150, 0.42)'
                          : lit
                            ? `rgba(255, 176, 72, ${0.22 + 0.5 * litOpacity})`
                            : 'transparent',
                        boxShadow: lit ? `0 0 10px rgba(255, 168, 64, ${0.2 + 0.45 * litOpacity})` : 'none',
                        outline: isPlayer ? '2px solid rgba(255, 232, 200, 0.85)' : 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {petHere && guides.my.pet && (
                        <Box
                          component="img"
                          src={guides.my.pet.imageUrl}
                          alt=""
                          sx={{
                            width: '78%',
                            height: '78%',
                            objectFit: 'contain',
                            filter: 'drop-shadow(0 0 6px #ffb040)',
                            animation: 'cliffGuidePetHop 0.16s ease-in-out',
                            '@keyframes cliffGuidePetHop': {
                              '0%, 100%': { transform: 'translateY(0)' },
                              '50%': { transform: 'translateY(-18%)' },
                            },
                          }}
                        />
                      )}
                    </Box>
                  );
                })
              )}
            </Box>
            <Box
              sx={{
                position: 'absolute',
                left: `${(walkPos.x / Math.max(1, guides.width)) * 100}%`,
                top: `${(walkPos.y / Math.max(1, guides.height)) * 100}%`,
                width: `${(1 / Math.max(1, guides.width)) * 100}%`,
                height: `${(1 / Math.max(1, guides.height)) * 100}%`,
                zIndex: 4,
                pointerEvents: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Box
                sx={{
                  width: '70%',
                  height: '82%',
                  display: 'flex',
                  alignItems: 'flex-end',
                  justifyContent: 'center',
                  overflow: 'hidden',
                }}
              >
                <CliffCharacter
                  avatar={state.me.avatar}
                  name={myName}
                  walking={stepping && inMaze}
                  from="left"
                  maze
                  motion="idle"
                />
              </Box>
            </Box>
            {trapSpeech && inMaze && (
              <Box
                sx={{
                  position: 'absolute',
                  left: walkPos.x > guides.width / 2 ? 'auto' : `${((walkPos.x + 1.08) / Math.max(1, guides.width)) * 100}%`,
                  right:
                    walkPos.x > guides.width / 2
                      ? `${((guides.width - walkPos.x) / Math.max(1, guides.width)) * 100}%`
                      : 'auto',
                  top: `${(walkPos.y / Math.max(1, guides.height)) * 100}%`,
                  zIndex: 5,
                  pointerEvents: 'none',
                }}
              >
                <GuideSpeechBubble text={t('games.cliff.guides.trap')} align="left" narrow />
              </Box>
            )}
          </Box>
        </Box>
      )}

      {guides.my.escaped && (
        <Box sx={{ ...getCliffParchmentPanelSx() }}>
          <Typography variant="body2" sx={{ fontWeight: 800, color: '#5c2618' }}>
            {t('games.cliff.guides.escaped')}
          </Typography>
          <Typography variant="body2" sx={{ color: '#6a3a24', mt: 0.5 }}>
            {t('games.cliff.guides.waitEscape')}
          </Typography>
        </Box>
      )}

      {inMaze && introActive && (
        <Box sx={{ ...getCliffParchmentPanelSx(), display: 'flex', justifyContent: 'flex-end' }}>
          <Button onClick={() => setIntroLine((value) => value + 1)} sx={getCliffModalPrimaryButtonSx()}>
            {t('games.cliff.guides.next')}
          </Button>
        </Box>
      )}

      {inMaze && !introActive && (
        <Box
          sx={{
            ...getCliffParchmentPanelSx(),
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
          }}
        >
          {guides.my.pet ? (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, flexWrap: 'wrap' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {renderPetCard(guides.my.pet, true)}
                <Typography variant="body2" sx={{ fontWeight: 800, color: '#5c2618' }}>
                  {t('games.cliff.guides.runs', { left: guides.my.runsLeft, total: guides.my.runsTotal })}
                </Typography>
              </Box>
              <Button
                onClick={onSendPet}
                disabled={guides.my.runsLeft <= 0 || guides.my.lanternWithPet}
                sx={getCliffModalPrimaryButtonSx()}
              >
                {guides.my.lanternWithPet
                  ? t('games.cliff.guides.lanternWithPet')
                  : t('games.cliff.guides.send')}
              </Button>
            </Box>
          ) : guides.eligiblePets.length === 0 ? (
            <Typography variant="body2" sx={{ color: '#b42318', fontWeight: 700 }}>
              {t('games.cliff.guides.needPets')}
            </Typography>
          ) : (
            <>
              <Typography variant="body2" sx={{ fontWeight: 700, color: '#5c2618' }}>
                {t('games.cliff.guides.pick')}
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(88px, 1fr))', gap: 1 }}>
                {guides.eligiblePets.map((pet) =>
                  renderPetCard(pet, selectedPetId === pet.id, () => setSelectedPetId(pet.id))
                )}
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  disabled={!selectedPetId}
                  onClick={() => {
                    if (!selectedPetId) {
                      return;
                    }
                    void playCliffGuidePickSound();
                    onPickPet(selectedPetId);
                  }}
                  sx={getCliffModalPrimaryButtonSx()}
                >
                  {t('games.cliff.guides.pick')}
                </Button>
              </Box>
            </>
          )}
          <Box
            sx={{
              alignSelf: 'flex-end',
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 52px)',
              gridTemplateRows: 'repeat(2, 52px)',
              gap: 0.75,
            }}
          >
            {dirs.map((item) => (
              <Button
                key={item.dir}
                onClick={() => tryWalk(item.dir)}
                sx={{ ...getCliffGuidePadSx(), gridArea: item.grid }}
              >
                <Box component="span" sx={{ display: 'block', transform: `rotate(${item.rotate}deg)` }}>
                  ↑
                </Box>
              </Button>
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default CliffGuides;
