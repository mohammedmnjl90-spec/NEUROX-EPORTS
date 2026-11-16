import React, { useEffect, useRef, useState } from 'react';
import {
  BotDifficulty,
  BotPersona,
  CategoryId,
  GameMode,
  MatchHistoryItem,
  PlayerAccount,
  QuizQuestion,
  SportsmanshipBadgeId,
  SportsmanshipReview,
} from '../types';
import { QUIZ_CATEGORIES } from '../data/constants';
import {
  getMatchQuestions,
  getMatchQuestionsByIds,
} from '../data/questionBank';
import { soundFX } from '../utils/sound';
import { getLocalizedCategory, getViewTranslations } from '../utils/i18n';
import confetti from 'canvas-confetti';
import { Flag, Lock, Volume2, VolumeX, Star } from 'lucide-react';
import {
  createCloudPrivateRoom,
  findOrCreateOnlineMatchmakingRoom,
  getSafeDocUid,
  joinCloudPrivateRoom,
  subscribeToCloudRoom,
  updateCloudRoomState,
} from '../services/firebase';

interface MatchArenaProps {
  account: PlayerAccount;
  mode: GameMode;
  category: CategoryId;
  roomCode?: string;
  customOpponentName?: string;
  customOpponentFlag?: string;
  customOpponentPlayerId?: string;
  onPersistAccount?: (updatedAccount: PlayerAccount) => void;
  onMatchComplete: (
    updatedAccount: PlayerAccount,
    historyEntry: MatchHistoryItem
  ) => void;
  onCancelLobby: () => void;
}

type MatchPhase =
  | 'MATCHMAKING'
  | 'PLAYING_ROUND'
  | 'ROUND_BREAK'
  | 'SUDDEN_DEATH'
  | 'MATCH_OVER';

const SPORTSMANSHIP_BADGES: Array<{
  id: SportsmanshipBadgeId;
  label: string;
  icon: string;
}> = [
  { id: 'fair_competitor', label: 'منافس شريف', icon: '🤝' },
  { id: 'fast_genius', label: 'سرعة بديهة', icon: '⚡' },
  { id: 'respectful_rival', label: 'أخلاق رفيعة', icon: '👑' },
  { id: 'great_fun', label: 'مواجهة ممتعة', icon: '🔥' },
];

export const MatchArena: React.FC<MatchArenaProps> = ({
  account,
  mode,
  category,
  roomCode,
  customOpponentName,
  customOpponentFlag,
  customOpponentPlayerId,
  onPersistAccount,
  onMatchComplete,
  onCancelLobby,
}) => {
  const vt = getViewTranslations(account.language);
  const baseAccountAtStartRef = useRef<PlayerAccount>(account);
  const matchIdRef = useRef<string>(`mtc_${Date.now()}`);
  const mySafeUid = getSafeDocUid(account);

  // Bots are ONLY permitted in offline `mode === 'solo'`. NEVER in `mode === 'online'`, `'room'`, or `'local'`.
  const [opponentName, setOpponentName] = useState<string>(
    customOpponentName ||
      (mode === 'local'
        ? 'Player 2 👥'
        : mode === 'solo'
        ? 'Solo 🎯'
        : mode === 'room'
        ? 'بانتظار دخول الصديق...'
        : 'جاري البحث عن لاعب حقيقي...')
  );
  const [opponentFlag, setOpponentFlag] = useState<string>(
    customOpponentFlag ||
      (mode === 'local' ? '🎮' : mode === 'solo' ? '🤖' : '⏳')
  );
  const [opponentIsBot, setOpponentIsBot] = useState<boolean>(
    mode === 'solo'
  );
  const [opponentPlayerId, setOpponentPlayerId] = useState<string | null>(
    customOpponentPlayerId ||
      (mode === 'room'
        ? 'غرفة تحدي سحابية'
        : mode === 'online'
        ? 'بحث مباشر في السحابة'
        : null)
  );

  const [phase, setPhase] = useState<MatchPhase>(
    mode === 'online' || mode === 'room' ? 'MATCHMAKING' : 'PLAYING_ROUND'
  );
  const [activeRoomCode, setActiveRoomCode] = useState<string | undefined>(
    roomCode
  );
  const activeRoomCodeRef = useRef<string | undefined>(roomCode);
  activeRoomCodeRef.current = activeRoomCode;
  const [roomCloudStatus, setRoomCloudStatus] = useState<
    'waiting' | 'active' | 'finished'
  >('waiting');
  const [activeTurnUid, setActiveTurnUid] = useState<string>(account.uid || mySafeUid);
  const activeTurnUidRef = useRef<string>(account.uid || mySafeUid);
  activeTurnUidRef.current = activeTurnUid;
  const roomHostUidRef = useRef<string>(account.uid || mySafeUid);
  const roomGuestUidRef = useRef<string>('');
  const [waitingOpponentStep, setWaitingOpponentStep] = useState<boolean>(false);
  const [opponentSelectedOption, setOpponentSelectedOption] =
    useState<number>(-1);
  const opponentSelectedOptionRef = useRef<number>(-1);
  opponentSelectedOptionRef.current = opponentSelectedOption;
  const [cloudRoundWinnerUid, setCloudRoundWinnerUid] = useState<string>('');
  const cloudRoundWinnerUidRef = useRef<string>('');
  cloudRoundWinnerUidRef.current = cloudRoundWinnerUid;

  // Deterministic seed if in 4-digit private room
  const numericSeed = activeRoomCode
    ? activeRoomCode
        .split('')
        .reduce((acc, ch) => acc * 31 + ch.charCodeAt(0), 7)
    : undefined;

  // 25 questions total (3 rounds * 8 questions = 24 + 1 Sudden Death question)
  const [questions, setQuestions] = useState<QuizQuestion[]>(() =>
    getMatchQuestions(category, 25, account.seenQuestionIds, numericSeed)
  );
  const appliedSeedsKeyRef = useRef<string>('');
  const appliedQuestionIdsKeyRef = useRef<string>('');

  // Round & Question indices
  const [currentRound, setCurrentRound] = useState<number>(1); // 1..3
  const [questionInRound, setQuestionInRound] = useState<number>(1); // 1..8

  // Scores per round
  const [playerRoundPoints, setPlayerRoundPoints] = useState<number>(0);
  const [opponentRoundPoints, setOpponentRoundPoints] = useState<number>(0);
  const [roundWinners, setRoundWinners] = useState<Array<'player' | 'opponent' | 'draw'>>([]);
  const [totalPlayerPoints, setTotalPlayerPoints] = useState<number>(0);
  const [totalOpponentPoints, setTotalOpponentPoints] = useState<number>(0);

  // Real-time Room Synchronization Refs (for mode === 'room')
  const isRoomHostRef = useRef<boolean>(true);
  const phaseRef = useRef<MatchPhase>(phase);
  phaseRef.current = phase;
  const currentRoundRef = useRef<number>(currentRound);
  currentRoundRef.current = currentRound;
  const questionInRoundRef = useRef<number>(questionInRound);
  questionInRoundRef.current = questionInRound;
  const playerRoundPointsRef = useRef<number>(playerRoundPoints);
  playerRoundPointsRef.current = playerRoundPoints;
  const opponentRoundPointsRef = useRef<number>(opponentRoundPoints);
  opponentRoundPointsRef.current = opponentRoundPoints;
  const totalPlayerPointsRef = useRef<number>(totalPlayerPoints);
  totalPlayerPointsRef.current = totalPlayerPoints;
  const totalOpponentPointsRef = useRef<number>(totalOpponentPoints);
  totalOpponentPointsRef.current = totalOpponentPoints;
  const roundStartOpponentTotalRef = useRef<number>(0);
  const myAnsweredStepRef = useRef<number>(0);
  const remoteAnsweredStepRef = useRef<number>(0);
  const stepAdvancedRef = useRef<number>(0);

  // Question timer (6 seconds standard) & Hardware Anti-Cheat Lock Ref
  const [timeLeft, setTimeLeft] = useState<number>(6);
  const [isAnswerLocked, setIsAnswerLocked] = useState<boolean>(false);
  const answerLockRef = useRef<boolean>(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [hiddenOptions, setHiddenOptions] = useState<number[]>([]);
  const questionStartMsRef = useRef<number>(Date.now());

  // Combo & Quick Emojis
  const [comboCount, setComboCount] = useState<number>(0);
  const [maxComboThisMatch, setMaxComboThisMatch] = useState<number>(0);
  const [bonusCoinsEarned, setBonusCoinsEarned] = useState<number>(0);
  const [correctCountThisMatch, setCorrectCountThisMatch] = useState<number>(0);
  const [goldenCorrectThisMatch, setGoldenCorrectThisMatch] = useState<number>(0);
  const [activePlayerEmoji, setActivePlayerEmoji] = useState<string | null>(null);
  const [activeOpponentEmoji, setActiveOpponentEmoji] = useState<string | null>(null);

  // Lifelines inventory copy during match
  const [lifelines, setLifelines] = useState({ ...account.lifelines });
  const [fairPlayScore, setFairPlayScore] = useState(account.fairPlayScore);
  const [antiCheatNotice, setAntiCheatNotice] = useState<string | null>(null);

  // 30-second Round Break state
  const [breakTimeLeft, setBreakTimeLeft] = useState<number>(30);
  const [playerReadyBreak, setPlayerReadyBreak] = useState<boolean>(false);
  const [opponentReadyBreak, setOpponentReadyBreak] = useState<boolean>(false);

  // Sudden Death state
  const [sdPlayerTimeMs, setSdPlayerTimeMs] = useState<number | null>(null);
  const [sdPlayerCorrect, setSdPlayerCorrect] = useState<boolean | null>(null);

  // Final Result state
  const [finalOutcome, setFinalOutcome] = useState<
    'win' | 'loss' | 'draw' | 'forfeit_win' | 'forfeit_loss'
  >('win');
  const [forfeitReasonAr, setForfeitReasonAr] = useState<string | null>(null);
  const [showForfeitConfirm, setShowForfeitConfirm] = useState<boolean>(false);

  // Post-Match Sportsmanship Rating state
  const [selectedStars, setSelectedStars] = useState<number>(5);
  const [selectedBadge, setSelectedBadge] = useState<SportsmanshipBadgeId>('fair_competitor');
  const [hasSubmittedRating, setHasSubmittedRating] = useState<boolean>(false);

  // Live SFX Visual Indicator & Quick Mute Toggle State
  const [matchSoundEnabled, setMatchSoundEnabled] = useState<boolean>(
    account.soundEnabled
  );
  const [activeSfxBadge, setActiveSfxBadge] = useState<{
    label: string;
    colorClass: string;
  } | null>(null);
  const sfxBadgeTimeoutRef = useRef<number | null>(null);

  const triggerSfxVisualBadge = (label: string, colorClass: string, durationMs = 1100) => {
    if (!soundFX.soundEnabled) return;
    if (sfxBadgeTimeoutRef.current) {
      window.clearTimeout(sfxBadgeTimeoutRef.current);
    }
    setActiveSfxBadge({ label, colorClass });
    sfxBadgeTimeoutRef.current = window.setTimeout(() => {
      setActiveSfxBadge(null);
    }, durationMs);
  };

  const handleToggleMatchSound = () => {
    const next = !matchSoundEnabled;
    setMatchSoundEnabled(next);
    soundFX.soundEnabled = next;
    if (next) {
      soundFX.playClick();
      triggerSfxVisualBadge('🔊 تم تفعيل الصوت', 'border-[#4FF5D2] text-[#4FF5D2] bg-[#4FF5D2]/15', 900);
    } else {
      setActiveSfxBadge(null);
    }
  };

  // Background 15-second Anti-Cheat monitor for Online mode
  const bgEnteredAtRef = useRef<number | null>(null);

  const isLiveCloudMatch = Boolean(mode === 'room' || mode === 'online');
  const isLiveCloudMatchRef = useRef<boolean>(isLiveCloudMatch);
  isLiveCloudMatchRef.current = isLiveCloudMatch;

  // Strict Turn-Based Locking (`activeTurnUid`):
  // In `online` and `room` modes, ONLY the player whose UID matches `activeTurnUid` can answer!
  // The other player's buttons are locked (`disabled={true}`) with a full waiting overlay until the turn switches in Firestore.
  const isMyTurnInCloud =
    activeTurnUid === account.uid ||
    activeTurnUid === mySafeUid ||
    (isRoomHostRef.current &&
      roomHostUidRef.current.length > 0 &&
      activeTurnUid === roomHostUidRef.current) ||
    (!isRoomHostRef.current &&
      roomGuestUidRef.current.length > 0 &&
      activeTurnUid === roomGuestUidRef.current);

  const isPlayerTurn =
    isLiveCloudMatch
      ? isMyTurnInCloud
      : phase === 'SUDDEN_DEATH' || mode === 'solo'
      ? true
      : questionInRound % 2 === 1; // Local 2-player mode alternates Q1/Q3/Q5/Q7 vs Q2/Q4/Q6/Q8

  const isGoldenQuestion =
    phase === 'PLAYING_ROUND' && (questionInRound === 7 || questionInRound === 8);

  const currentQuestionIndex =
    phase === 'SUDDEN_DEATH'
      ? 24
      : (currentRound - 1) * 8 + (questionInRound - 1);

  const currentStepNumber = currentQuestionIndex + 1; // 1..24 for Rounds 1-3, 25 for Sudden Death

  const currentQuestion: QuizQuestion =
    questions[currentQuestionIndex] || questions[0];

  const categoryMeta =
    QUIZ_CATEGORIES.find(c => c.id === category) || QUIZ_CATEGORIES[0];

  // Keep activeRoomCode in sync if roomCode prop changes
  useEffect(() => {
    if (roomCode && roomCode !== activeRoomCode) {
      setActiveRoomCode(roomCode);
      activeRoomCodeRef.current = roomCode;
    }
  }, [roomCode]);

  // Real online matchmaking in Firestore `global_matchmaking` for `mode === 'online'` (100% Real Players, Zero Bots)
  useEffect(() => {
    if (mode !== 'online' || roomCode || phase !== 'MATCHMAKING') return;
    let cancelled = false;

    const searchOrCreateQueueRoom = async () => {
      const res = await findOrCreateOnlineMatchmakingRoom(account, 'cocktail');
      if (cancelled || !res || !res.roomCode) return;
      if (phaseRef.current !== 'MATCHMAKING') return;
      isRoomHostRef.current = res.role === 'host';
      if (res.hostUid) roomHostUidRef.current = res.hostUid;
      if (res.guestUid) roomGuestUidRef.current = res.guestUid;
      if (res.activeTurnUid) {
        activeTurnUidRef.current = res.activeTurnUid;
        setActiveTurnUid(res.activeTurnUid);
      }
      activeRoomCodeRef.current = res.roomCode;
      setActiveRoomCode(res.roomCode);
      if (res.role === 'guest' && res.hostName) {
        setOpponentName(res.hostName);
        setOpponentFlag(res.hostFlag || '🇸🇦');
        setOpponentIsBot(false);
        if (res.hostPlayerId) {
          setOpponentPlayerId(res.hostPlayerId);
        }
      }
    };

    searchOrCreateQueueRoom().catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [mode, roomCode, category]);

  // 1. Real Cloud Room Subscription (`onSnapshot` on `rooms/{activeRoomCode}` or `global_matchmaking/{activeRoomCode}`)
  useEffect(() => {
    if (!activeRoomCode) return;
    if (mode !== 'room' && mode !== 'online') return;

    let hasReceivedRoomDoc = false;
    let isJoiningGuestInFlight = false;

    const ensureRoomProvisioned = () => {
      if (hasReceivedRoomDoc || mode !== 'room') return;
      createCloudPrivateRoom(
        activeRoomCode,
        account,
        category,
        numericSeed || 7,
        customOpponentPlayerId || ''
      ).catch(() => {});
    };

    const unsub = subscribeToCloudRoom(
      activeRoomCode,
      data => {
        hasReceivedRoomDoc = true;
        const hostUid = String(data.hostUid || '');
        const hostName = String(data.hostName || '');
        const hostFlag = String(data.hostFlag || '🇸🇦');
        const hostPlayerId = String(data.hostPlayerId || '');
        const guestUid = String(data.guestUid || '');
        const guestName = String(data.guestName || '');
        const guestFlag = String(data.guestFlag || '🇸🇦');
        const guestPlayerId = String(data.guestPlayerId || '');
        const cloudActiveTurnUid = String(
          data.activeTurnUid || hostUid || account.uid || mySafeUid
        );
        const status = String(data.status || 'waiting') as
          | 'waiting'
          | 'active'
          | 'finished'
          | 'completed';

        if (hostUid) roomHostUidRef.current = hostUid;
        if (guestUid) roomGuestUidRef.current = guestUid;
        activeTurnUidRef.current = cloudActiveTurnUid;
        setActiveTurnUid(cloudActiveTurnUid);

        setRoomCloudStatus(status === 'completed' ? 'finished' : status);

        // Determine whether this device is the Host or the Guest
        const isHost =
          (hostPlayerId && hostPlayerId === account.playerId) ||
          (hostUid &&
            (hostUid === account.uid || hostUid === mySafeUid) &&
            guestUid !== account.uid &&
            guestUid !== mySafeUid) ||
          (!guestPlayerId && hostName === account.username) ||
          (hostName === account.username && guestName !== account.username);
        isRoomHostRef.current = isHost;

        // If this device is the Guest and the room is still 'waiting' without a guestUid, join immediately
        if (
          !isHost &&
          status === 'waiting' &&
          !guestUid &&
          !isJoiningGuestInFlight
        ) {
          isJoiningGuestInFlight = true;
          joinCloudPrivateRoom(activeRoomCode, account)
            .catch(() => null)
            .finally(() => {
              isJoiningGuestInFlight = false;
            });
        }

        const remoteName = isHost ? guestName : hostName;
        const remoteFlag = isHost ? guestFlag : hostFlag;
        const remotePid = isHost ? guestPlayerId : hostPlayerId;

        if (remoteName && remoteName.trim().length >= 1) {
          setOpponentName(remoteName);
          setOpponentFlag(remoteFlag || '🇸🇦');
          setOpponentIsBot(false);
          if (remotePid) {
            setOpponentPlayerId(remotePid);
          }
        }

        // Synchronize unified questionIds & questionSeeds from Firestore so both phones get the exact same 25 questions
        const cloudCat = (String(data.category || category) || 'cocktail') as CategoryId;
        const qSeed = Number(data.questionSeed || numericSeed || 7);
        const seedsArr = Array.isArray(data.questionSeeds)
          ? data.questionSeeds.map((n: unknown) => Number(n) || 0)
          : undefined;

        if (Array.isArray(data.questionIds) && data.questionIds.length > 0) {
          const qIds = data.questionIds
            .map((id: unknown) => String(id || ''))
            .filter(Boolean);
          const idsKey = `${qIds.join(',')}|${seedsArr ? seedsArr.join(',') : ''}`;
          if (qIds.length > 0 && appliedQuestionIdsKeyRef.current !== idsKey) {
            appliedQuestionIdsKeyRef.current = idsKey;
            setQuestions(
              getMatchQuestionsByIds(cloudCat, qIds, qSeed, seedsArr)
            );
          }
        } else if (seedsArr && seedsArr.length > 0) {
          const key = seedsArr.join(',');
          if (appliedSeedsKeyRef.current !== key) {
            appliedSeedsKeyRef.current = key;
            setQuestions(
              getMatchQuestions(
                cloudCat,
                25,
                account.seenQuestionIds || [],
                qSeed,
                seedsArr
              )
            );
          }
        }

        // Synchronize live scores, selected option, roundWinnerUid, and currentRound (0-indexed question step) from Firestore
        const remoteScore = Number(
          isHost ? data.guestScore ?? 0 : data.hostScore ?? 0
        );
        const remoteAnswered = Number(
          isHost ? data.guestAnsweredRound ?? 0 : data.hostAnsweredRound ?? 0
        );
        const remoteSelectedOpt = Number(
          isHost
            ? data.guestSelectedOption ?? -1
            : data.hostSelectedOption ?? -1
        );
        const remoteReadyBreak = Boolean(
          isHost ? data.guestReadyNextRound : data.hostReadyNextRound
        );
        const cloudQuestionIdx = Number(data.currentRound ?? 0);
        const rWinnerUid = String(data.roundWinnerUid || '');

        remoteAnsweredStepRef.current = remoteAnswered;
        totalOpponentPointsRef.current = remoteScore;
        setTotalOpponentPoints(remoteScore);
        opponentSelectedOptionRef.current = remoteSelectedOpt;
        setOpponentSelectedOption(remoteSelectedOpt);
        cloudRoundWinnerUidRef.current = rWinnerUid;
        setCloudRoundWinnerUid(rWinnerUid);

        const computedOppRoundPts = Math.max(
          0,
          remoteScore - roundStartOpponentTotalRef.current
        );
        opponentRoundPointsRef.current = computedOppRoundPts;
        setOpponentRoundPoints(computedOppRoundPts);

        if (phaseRef.current === 'ROUND_BREAK' && remoteReadyBreak) {
          setOpponentReadyBreak(true);
        }

        // Transition from MATCHMAKING ('waiting') -> PLAYING_ROUND ONLY when a second real human player joins and status === 'active'
        if (
          phaseRef.current === 'MATCHMAKING' &&
          status === 'active' &&
          (guestUid.length > 0 || guestName.length > 0)
        ) {
          soundFX.playCorrect();
          setOpponentIsBot(false);
          answerLockRef.current = false;
          setIsAnswerLocked(false);
          setOpponentSelectedOption(-1);
          setTimeLeft(6);
          questionStartMsRef.current = Date.now();
          setPhase('PLAYING_ROUND');
        }

        const activeStep =
          phaseRef.current === 'SUDDEN_DEATH'
            ? 25
            : (currentRoundRef.current - 1) * 8 + questionInRoundRef.current;

        // Strict Turn-Based Progression:
        // Whenever the active player finishes their turn, they update `currentRound: activeStep` and `activeTurnUid: nextPlayerUid` in Firestore.
        // Both devices immediately advance to the next question and hand over the turn!
        if (
          (phaseRef.current === 'PLAYING_ROUND' ||
            phaseRef.current === 'SUDDEN_DEATH') &&
          cloudQuestionIdx >= activeStep &&
          stepAdvancedRef.current < activeStep
        ) {
          stepAdvancedRef.current = activeStep;
          setWaitingOpponentStep(false);
          window.setTimeout(() => {
            proceedToNextRoomStep(activeStep);
          }, 450);
        }

        // If opponent finished/forfeited early while we are still in an earlier round
        if (
          (status === 'finished' || status === 'completed') &&
          phaseRef.current !== 'MATCH_OVER' &&
          phaseRef.current !== 'MATCHMAKING' &&
          cloudQuestionIdx < 24
        ) {
          triggerMatchEnd(
            'forfeit_win',
            'انسحب الخصم أو غادر الغرفة السحابية، وتم احتساب الفوز لصالحك!'
          );
        }
      },
      () => {
        // Room document not found yet in Firestore -> create it immediately in waiting state
        ensureRoomProvisioned();
      }
    );

    const retryInterval = window.setInterval(() => {
      if (
        mode === 'room' &&
        phaseRef.current === 'MATCHMAKING' &&
        !hasReceivedRoomDoc
      ) {
        ensureRoomProvisioned();
      }
    }, 3000);

    return () => {
      if (unsub) unsub();
      window.clearInterval(retryInterval);
    };
  }, [
    mode,
    activeRoomCode,
    account.playerId,
    account.uid,
    account.username,
    mySafeUid,
    category,
    customOpponentPlayerId,
  ]);

  // 2. Background Visibility Monitor (15s rule in Online mode)
  useEffect(() => {
    if (mode !== 'online' && mode !== 'room') return;
    if (phase === 'MATCH_OVER' || phase === 'MATCHMAKING') return;

    const handleVisibility = () => {
      if (document.hidden) {
        bgEnteredAtRef.current = Date.now();
      } else if (bgEnteredAtRef.current) {
        const awaySeconds = (Date.now() - bgEnteredAtRef.current) / 1000;
        bgEnteredAtRef.current = null;
        if (awaySeconds > 15) {
          // Exceeded 15s in background -> Forfeit loss + coin penalty
          triggerMatchEnd(
            'forfeit_loss',
            `تم احتساب انسحاب وخسارة بسبب مغادرة التطبيق للخلفية لمدة ${Math.round(
              awaySeconds
            )} ثانية (الحد الأقصى 15 ثانية).`
          );
        } else {
          setAntiCheatNotice(
            `تنبيه اللعب النظيف: عدت خلال ${awaySeconds.toFixed(
              1
            )} ثانية. استمرت المباراة تلقائياً.`
          );
          setTimeout(() => setAntiCheatNotice(null), 4000);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [mode, phase]);

  // 3. Question 6-second countdown timer
  // In live cloud matches (`online` / `room`), only the active turn player (`isPlayerTurn`) triggers timeout submission;
  // the waiting player displays the countdown visually while waiting for Firestore `onSnapshot` turn handover.
  useEffect(() => {
    if (phase !== 'PLAYING_ROUND' && phase !== 'SUDDEN_DEATH') return;
    if (isAnswerLocked) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          if (!isLiveCloudMatchRef.current || isPlayerTurn) {
            handleTimeoutAnswer();
          }
          return 0;
        }
        const nextVal = prev - 1;
        if (isPlayerTurn || !isLiveCloudMatchRef.current) {
          if (nextVal <= 2) {
            soundFX.playTick(true);
          } else {
            soundFX.playTick(false);
          }
        }
        return nextVal;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [phase, currentRound, questionInRound, isAnswerLocked, isPlayerTurn]);

  // 4. Smart Bot AI automatic turn execution (STRICTLY RESTRICTED TO OFFLINE `mode === 'solo'` ONLY — NEVER IN ONLINE OR ROOM)
  useEffect(() => {
    if (phase !== 'PLAYING_ROUND') return;
    if (mode !== 'solo' || !opponentIsBot) return;
    if (isPlayerTurn || isAnswerLocked) return;

    // Bot calculates accuracy and delay from difficulty & persona
    const diffAccuracyMap: Record<BotDifficulty, number> = {
      beginner: 0.48,
      medium: 0.68,
      pro: 0.82,
      legendary: 0.94,
    };
    let accuracy = diffAccuracyMap[account.botDifficulty] || 0.68;
    let delayMs = 2400;

    const persona: BotPersona = account.botPersona;
    if (persona === 'hasty') {
      delayMs = 1100 + Math.random() * 900;
      accuracy -= 0.08;
    } else if (persona === 'thinker') {
      delayMs = 3100 + Math.random() * 1400;
      accuracy += 0.06;
    } else if (persona === 'calm') {
      delayMs = 2100 + Math.random() * 1100;
    } else if (persona === 'aggressive') {
      delayMs = 1500 + Math.random() * 1000;
      // Aggressive bot boosts accuracy on Golden questions or when trailing
      if (isGoldenQuestion || opponentRoundPoints < playerRoundPoints) {
        accuracy += 0.1;
      }
    }

    const botTimer = setTimeout(() => {
      if (isAnswerLocked) return;
      const willAnswerCorrectly = Math.random() < accuracy;
      let chosenIdx = currentQuestion.correctIndex;
      if (!willAnswerCorrectly) {
        const wrongChoices = [0, 1, 2, 3].filter(
          i => i !== currentQuestion.correctIndex
        );
        chosenIdx =
          wrongChoices[Math.floor(Math.random() * wrongChoices.length)];
      }
      if (Math.random() < 0.3) {
        setActiveOpponentEmoji(
          willAnswerCorrectly ? '😎' : '🤔'
        );
        setTimeout(() => setActiveOpponentEmoji(null), 1800);
      }
      submitTurnAnswer(chosenIdx, true);
    }, delayMs);

    return () => clearTimeout(botTimer);
  }, [
    phase,
    mode,
    opponentIsBot,
    currentRound,
    questionInRound,
    isPlayerTurn,
    isAnswerLocked,
  ]);

  // 5. 30-second Round Break countdown
  useEffect(() => {
    if (phase !== 'ROUND_BREAK') return;

    // Only auto-ready in Bot/Local mode; in live cloud match (`isLiveCloudMatch`), readiness comes from Firestore `onSnapshot`
    let oppReadyTimer: ReturnType<typeof setTimeout> | null = null;
    if (!isLiveCloudMatch) {
      oppReadyTimer = setTimeout(() => {
        setOpponentReadyBreak(true);
      }, 1800);
    }

    const breakInterval = setInterval(() => {
      setBreakTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(breakInterval);
          if (!playerReadyBreak) {
            triggerMatchEnd(
              'forfeit_loss',
              'انتهت مهلة الاستراحة (30 ثانية) دون الضغط على موافق لبدء الجولة التالية، وتم اعتبارك منسحباً فوراً.'
            );
          } else {
            triggerMatchEnd(
              'forfeit_win',
              'تأخر الخصم عن تأكيد الجاهزية خلال الـ 30 ثانية، وتم اعتباره منسحباً فوراً!'
            );
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (oppReadyTimer) clearTimeout(oppReadyTimer);
      clearInterval(breakInterval);
    };
  }, [phase, isLiveCloudMatch, playerReadyBreak]);

  // Advance from Round Break as soon as both players click Ready
  useEffect(() => {
    if (phase === 'ROUND_BREAK' && playerReadyBreak && opponentReadyBreak) {
      const nextR = currentRound + 1;
      if (isLiveCloudMatch && activeRoomCode) {
        updateCloudRoomState(
          activeRoomCode,
          isRoomHostRef.current
            ? {
                hostReadyNextRound: false,
                hostSelectedOption: -1,
                guestSelectedOption: -1,
              }
            : {
                guestReadyNextRound: false,
                hostSelectedOption: -1,
                guestSelectedOption: -1,
              }
        ).catch(() => {});
      }
      setTimeout(() => {
        roundStartOpponentTotalRef.current = totalOpponentPointsRef.current;
        setCurrentRound(nextR);
        setQuestionInRound(1);
        setPlayerRoundPoints(0);
        playerRoundPointsRef.current = 0;
        setOpponentRoundPoints(0);
        opponentRoundPointsRef.current = 0;
        setHiddenOptions([]);
        setSelectedOption(null);
        setOpponentSelectedOption(-1);
        setIsAnswerLocked(false);
        setWaitingOpponentStep(false);
        answerLockRef.current = false;
        setTimeLeft(6);
        questionStartMsRef.current = Date.now();
        setPhase('PLAYING_ROUND');
      }, 500);
    }
  }, [
    phase,
    isLiveCloudMatch,
    activeRoomCode,
    playerReadyBreak,
    opponentReadyBreak,
    currentRound,
  ]);

  /**
   * Strict Turn-Based Cloud Synchronization (`activeTurnUid`):
   * As soon as the active player answers (or their 6-second timer expires), updates their score,
   * switches `activeTurnUid` to the other player (`hostUid` <-> `guestUid`), and advances `currentRound`
   * to `stepNum` in Firestore so `onSnapshot` immediately unlocks Player 2's screen with the next question
   * and locks Player 1's screen!
   */
  const syncAndCoordinateRoomStep = (
    newTotalPlayerScore: number,
    stepNum: number,
    chosenOptionIdx: number,
    wasCorrect: boolean
  ) => {
    myAnsweredStepRef.current = stepNum;
    const roomIdToUpdate = activeRoomCodeRef.current;
    const nextTurnUid = isRoomHostRef.current
      ? roomGuestUidRef.current || 'plr_guest'
      : roomHostUidRef.current || 'plr_host';

    if (roomIdToUpdate) {
      const winnerPatch =
        wasCorrect && !cloudRoundWinnerUidRef.current
          ? { roundWinnerUid: account.uid || mySafeUid }
          : {};
      const payload = isRoomHostRef.current
        ? {
            hostScore: Math.min(500, newTotalPlayerScore),
            hostAnsweredRound: stepNum,
            hostSelectedOption: chosenOptionIdx,
            activeTurnUid: nextTurnUid,
            currentRound: stepNum,
            ...winnerPatch,
          }
        : {
            guestScore: Math.min(500, newTotalPlayerScore),
            guestAnsweredRound: stepNum,
            guestSelectedOption: chosenOptionIdx,
            activeTurnUid: nextTurnUid,
            currentRound: stepNum,
            ...winnerPatch,
          };
      updateCloudRoomState(roomIdToUpdate, payload).catch(() => {});
    }

    // Advance after brief visual reveal of the chosen answer
    window.setTimeout(() => {
      if (
        stepAdvancedRef.current < stepNum &&
        phaseRef.current !== 'MATCH_OVER'
      ) {
        stepAdvancedRef.current = stepNum;
        setWaitingOpponentStep(false);
        activeTurnUidRef.current = nextTurnUid;
        setActiveTurnUid(nextTurnUid);
        proceedToNextRoomStep(stepNum);
      }
    }, 650);
  };

  const proceedToNextRoomStep = (completedStep: number) => {
    if (phaseRef.current === 'MATCH_OVER') return;

    if (completedStep === 25 || phaseRef.current === 'SUDDEN_DEATH') {
      const myTotal = totalPlayerPointsRef.current;
      const oppTotal = totalOpponentPointsRef.current;
      if (myTotal > oppTotal) {
        triggerMatchEnd(
          'win',
          'حسمت المباراة في السؤال الفاصل الحاسم عبر الغرفة السحابية ⚡!'
        );
      } else if (oppTotal > myTotal) {
        triggerMatchEnd(
          'loss',
          'حسم الخصم السؤال الفاصل الحاسم في الغرفة السحابية.'
        );
      } else {
        triggerMatchEnd(
          'win',
          'تعادل مثير في السؤال الفاصل وتم حسم المواجهة لصالحك بأفضلية الأداء!'
        );
      }
      return;
    }

    const qInR = questionInRoundRef.current;
    const cRound = currentRoundRef.current;

    if (qInR < 8) {
      setQuestionInRound(qInR + 1);
      setHiddenOptions([]);
      setSelectedOption(null);
      setOpponentSelectedOption(-1);
      setCloudRoundWinnerUid('');
      setIsAnswerLocked(false);
      setWaitingOpponentStep(false);
      answerLockRef.current = false;
      setTimeLeft(6);
      questionStartMsRef.current = Date.now();
    } else {
      // Completed 8 questions of the round in `mode === 'room'`
      const myRoundPts = playerRoundPointsRef.current;
      const oppRoundPts = opponentRoundPointsRef.current;
      let rWinner: 'player' | 'opponent' | 'draw' = 'draw';
      if (myRoundPts > oppRoundPts) rWinner = 'player';
      else if (oppRoundPts > myRoundPts) rWinner = 'opponent';

      setRoundWinners(prev => {
        const nextWinners = [...prev, rWinner];
        if (cRound < 3) {
          setBreakTimeLeft(30);
          setPlayerReadyBreak(false);
          setOpponentReadyBreak(false);
          setWaitingOpponentStep(false);
          setPhase('ROUND_BREAK');
        } else {
          const pWins = nextWinners.filter(w => w === 'player').length;
          const oWins = nextWinners.filter(w => w === 'opponent').length;
          if (pWins > oWins) {
            triggerMatchEnd('win', null);
          } else if (oWins > pWins) {
            triggerMatchEnd('loss', null);
          } else if (totalPlayerPointsRef.current > totalOpponentPointsRef.current) {
            triggerMatchEnd('win', null);
          } else if (totalOpponentPointsRef.current > totalPlayerPointsRef.current) {
            triggerMatchEnd('loss', null);
          } else {
            setHiddenOptions([]);
            setSelectedOption(null);
            setIsAnswerLocked(false);
            setWaitingOpponentStep(false);
            answerLockRef.current = false;
            setTimeLeft(6);
            questionStartMsRef.current = Date.now();
            setPhase('SUDDEN_DEATH');
          }
        }
        return nextWinners;
      });
    }
  };

  const handleTimeoutAnswer = () => {
    if (isAnswerLocked || answerLockRef.current) return;
    answerLockRef.current = true;
    setIsAnswerLocked(true);
    setSelectedOption(-1);
    if (isPlayerTurn || mode === 'local') {
      soundFX.playWrong();
      triggerSfxVisualBadge(
        '🎵 إجابة خاطئة (انتهى الوقت)',
        'border-[#FF6B81] text-[#FF6B81] bg-[#FF6B81]/15'
      );
    }
    if (isPlayerTurn) {
      setComboCount(0);
    }
    if (isLiveCloudMatchRef.current) {
      syncAndCoordinateRoomStep(
        totalPlayerPointsRef.current,
        currentStepNumber,
        -2,
        false
      );
      return;
    }
    setTimeout(() => advanceToNextStep(false), 1100);
  };

  const submitTurnAnswer = (optionIdx: number, isBotAction: boolean = false) => {
    if (isAnswerLocked || answerLockRef.current) return;
    if (isBotAction && (mode !== 'solo' || isLiveCloudMatchRef.current)) return; // Strict guard: never accept bot actions outside solo mode
    if (isLiveCloudMatchRef.current && !isPlayerTurn) return; // Strict turn guard: cannot answer during opponent's turn
    answerLockRef.current = true;

    // Anti-Cheat check for human touches (< 120ms impossible reaction speed)
    if (!isBotAction) {
      const reactionMs = Date.now() - questionStartMsRef.current;
      if (reactionMs < 120) {
        setFairPlayScore(prev => Math.max(50, prev - 5));
        setAntiCheatNotice(
          `⚠️ نظام مكافحة الغش: تم رصد نقر آلي سريع جداً (${reactionMs}ms). تأثر مؤشر النزاهة!`
        );
        setTimeout(() => setAntiCheatNotice(null), 3500);
      }
    }

    setIsAnswerLocked(true);
    setSelectedOption(optionIdx);

    const isCorrect = optionIdx === currentQuestion.correctIndex;
    const pts = isGoldenQuestion ? 2 : 1;

    if (phase === 'SUDDEN_DEATH') {
      const elapsed = Date.now() - questionStartMsRef.current;
      setSdPlayerTimeMs(elapsed);
      setSdPlayerCorrect(isCorrect);
      if (isCorrect) {
        soundFX.playCorrect(true, comboCount + 1);
        triggerSfxVisualBadge(
          '🎵 إجابة صحيحة حاسمة ⚡',
          'border-[#38D9A9] text-[#38D9A9] bg-[#38D9A9]/15'
        );
      } else {
        soundFX.playWrong();
        triggerSfxVisualBadge(
          '🎵 إجابة خاطئة ❌',
          'border-[#FF6B81] text-[#FF6B81] bg-[#FF6B81]/15'
        );
      }

      if (isLiveCloudMatchRef.current) {
        const nextTotal = isCorrect
          ? totalPlayerPointsRef.current + 3
          : totalPlayerPointsRef.current;
        totalPlayerPointsRef.current = nextTotal;
        setTotalPlayerPoints(nextTotal);
        syncAndCoordinateRoomStep(nextTotal, 25, optionIdx, isCorrect);
        return;
      }

      // Resolve Sudden Death against opponent in Online/Local mode
      setTimeout(() => {
        const oppCorrect = Math.random() < 0.65;
        const oppTime = 1600 + Math.floor(Math.random() * 2400);
        if (isCorrect && (!oppCorrect || elapsed <= oppTime)) {
          triggerMatchEnd('win', 'حسمت المباراة بالضربة القاضية (السؤال الفاصل ⚡) بفضل سرعتك ودقتك!');
        } else if (!isCorrect && !oppCorrect) {
          triggerMatchEnd('win', 'أخطأ الخصم أيضاً في السؤال الفاصل وتفوقت عليه في مجموع النقاط!');
        } else {
          triggerMatchEnd('loss', `حسم الخصم السؤال الفاصل الحاسم بزمن ${(oppTime / 1000).toFixed(2)} ثانية.`);
        }
      }, 1300);
      return;
    }

    let nextTotalPlayer = totalPlayerPointsRef.current;

    if (isPlayerTurn) {
      if (isCorrect) {
        const nextCombo = comboCount + 1;
        soundFX.playCorrect(isGoldenQuestion, nextCombo);
        triggerSfxVisualBadge(
          isGoldenQuestion
            ? '🎵 إجابة ذهبية صحيحة 🌟'
            : nextCombo >= 2
            ? `🎵 إجابة صحيحة (${nextCombo}x كومبو)`
            : '🎵 إجابة صحيحة ✅',
          'border-[#38D9A9] text-[#38D9A9] bg-[#38D9A9]/15'
        );
        const nextRoundPts = playerRoundPointsRef.current + pts;
        playerRoundPointsRef.current = nextRoundPts;
        setPlayerRoundPoints(nextRoundPts);

        nextTotalPlayer = totalPlayerPointsRef.current + pts;
        totalPlayerPointsRef.current = nextTotalPlayer;
        setTotalPlayerPoints(nextTotalPlayer);

        setCorrectCountThisMatch(prev => prev + 1);
        if (isGoldenQuestion) {
          setGoldenCorrectThisMatch(prev => prev + 1);
        }
        setComboCount(nextCombo);
        if (nextCombo > maxComboThisMatch) {
          setMaxComboThisMatch(nextCombo);
        }
        if (nextCombo % 3 === 0) {
          // 3x Combo bonus coins!
          setBonusCoinsEarned(prev => prev + 5);
          soundFX.playCoin();
        }
      } else {
        soundFX.playWrong();
        triggerSfxVisualBadge(
          '🎵 إجابة خاطئة ❌',
          'border-[#FF6B81] text-[#FF6B81] bg-[#FF6B81]/15'
        );
        setComboCount(0);
      }
    } else {
      // Opponent or Player 2 turn: only play SFX in local 2-player mode, keep silent for Bot/Online opponent turn
      if (isCorrect) {
        if (mode === 'local') {
          soundFX.playCorrect(isGoldenQuestion, 1);
          triggerSfxVisualBadge(
            '🎵 إجابة صحيحة (اللاعب 2) ✅',
            'border-[#38D9A9] text-[#38D9A9] bg-[#38D9A9]/15'
          );
        }
        setOpponentRoundPoints(prev => prev + pts);
        setTotalOpponentPoints(prev => prev + pts);
      } else {
        if (mode === 'local') {
          soundFX.playWrong();
          triggerSfxVisualBadge(
            '🎵 إجابة خاطئة (اللاعب 2) ❌',
            'border-[#FF6B81] text-[#FF6B81] bg-[#FF6B81]/15'
          );
        }
      }
    }

    if (isLiveCloudMatchRef.current) {
      syncAndCoordinateRoomStep(
        nextTotalPlayer,
        currentStepNumber,
        optionIdx,
        isCorrect
      );
      return;
    }

    setTimeout(() => advanceToNextStep(isCorrect), 1150);
  };

  const advanceToNextStep = (wasCorrect: boolean) => {
    const pts = isGoldenQuestion ? 2 : 1;
    const updatedPlayerPts =
      isPlayerTurn && wasCorrect ? playerRoundPoints + pts : playerRoundPoints;
    const updatedOppPts =
      !isPlayerTurn && wasCorrect ? opponentRoundPoints + pts : opponentRoundPoints;

    // In Solo mode, we only play the 4 player questions per round (Q1, Q3, Q5, Q7)
    const nextQ = mode === 'solo' ? questionInRound + 2 : questionInRound + 1;

    if (nextQ <= 8) {
      setQuestionInRound(nextQ);
      setHiddenOptions([]);
      setSelectedOption(null);
      setIsAnswerLocked(false);
      answerLockRef.current = false;
      setTimeLeft(6);
      questionStartMsRef.current = Date.now();
    } else {
      // End of Round (8 questions completed)
      let rWinner: 'player' | 'opponent' | 'draw' = 'draw';
      if (updatedPlayerPts > updatedOppPts) rWinner = 'player';
      else if (updatedOppPts > updatedPlayerPts) rWinner = 'opponent';

      const newRoundWinners = [...roundWinners, rWinner];
      setRoundWinners(newRoundWinners);

      if (currentRound < 3) {
        // Enter 30-second Round Break
        setBreakTimeLeft(30);
        setPlayerReadyBreak(false);
        setOpponentReadyBreak(false);
        setPhase('ROUND_BREAK');
      } else {
        // Completed all 3 rounds! Evaluate match winner or Sudden Death
        const pWins = newRoundWinners.filter(w => w === 'player').length;
        const oWins = newRoundWinners.filter(w => w === 'opponent').length;

        if (mode === 'solo') {
          triggerMatchEnd('win', 'أنهيت جولات التدريب الفردي بنجاح وكسبت نقاط خبرة (XP)!');
        } else if (pWins > oWins) {
          triggerMatchEnd('win', null);
        } else if (oWins > pWins) {
          triggerMatchEnd('loss', null);
        } else {
          // Tie after 3 rounds -> Automatic Sudden Death ⚡!
          setHiddenOptions([]);
          setSelectedOption(null);
          setIsAnswerLocked(false);
          answerLockRef.current = false;
          setTimeLeft(6);
          questionStartMsRef.current = Date.now();
          setPhase('SUDDEN_DEATH');
        }
      }
    }
  };

  const triggerMatchEnd = (
    outcome: 'win' | 'loss' | 'draw' | 'forfeit_win' | 'forfeit_loss',
    reasonAr: string | null
  ) => {
    setFinalOutcome(outcome);
    setForfeitReasonAr(reasonAr);
    setPhase('MATCH_OVER');

    if (isLiveCloudMatchRef.current && activeRoomCodeRef.current) {
      updateCloudRoomState(activeRoomCodeRef.current, {
        status: 'finished',
      }).catch(() => {});
    }

    if (outcome === 'forfeit_win') {
      soundFX.playForfeit();
      triggerSfxVisualBadge(
        '🎵 صافرة انسحاب الخصم 🏳️',
        'border-[#FFD166] text-[#FFD166] bg-[#FFD166]/15',
        1800
      );
      setTimeout(() => {
        soundFX.playVictory();
        triggerSfxVisualBadge(
          '🎵 فانفار الفوز 🏆',
          'border-[#38D9A9] text-[#38D9A9] bg-[#38D9A9]/15',
          1800
        );
      }, 380);
      try {
        confetti({ particleCount: 70, spread: 65, origin: { y: 0.6 } });
      } catch {}
    } else if (outcome === 'forfeit_loss') {
      soundFX.playForfeit();
      triggerSfxVisualBadge(
        '🎵 صافرة الانسحاب 🏳️',
        'border-[#FF6B81] text-[#FF6B81] bg-[#FF6B81]/15',
        1800
      );
      setTimeout(() => {
        soundFX.playLoss();
        triggerSfxVisualBadge(
          '🎵 نغمة الخسارة بالانسحاب 🏳️',
          'border-[#FF6B81] text-[#FF6B81] bg-[#FF6B81]/15',
          1800
        );
      }, 380);
    } else if (outcome === 'win') {
      soundFX.playVictory();
      triggerSfxVisualBadge(
        '🎵 فانفار الانتصار 🏆',
        'border-[#FFD166] text-[#FFD166] bg-[#FFD166]/15',
        1800
      );
      try {
        confetti({ particleCount: 70, spread: 65, origin: { y: 0.6 } });
      } catch {}
    } else {
      soundFX.playLoss();
      triggerSfxVisualBadge(
        '🎵 نغمة الخسارة ⚔️',
        'border-[#FF6B81] text-[#FF6B81] bg-[#FF6B81]/15',
        1800
      );
    }
  };

  // Lifelines Handlers
  const handleUseFiftyFifty = () => {
    if (!isPlayerTurn || isAnswerLocked || lifelines.fiftyFifty <= 0 || hiddenOptions.length > 0)
      return;
    soundFX.playLifeline();
    const wrongIndices = [0, 1, 2, 3].filter(i => i !== currentQuestion.correctIndex);
    const toHide = wrongIndices.slice(0, 2);
    setHiddenOptions(toHide);
    const nextLifelines = { ...lifelines, fiftyFifty: lifelines.fiftyFifty - 1 };
    setLifelines(nextLifelines);
    onPersistAccount?.({
      ...baseAccountAtStartRef.current,
      lifelines: nextLifelines,
    });
  };

  const handleUseFreezeTime = () => {
    if (!isPlayerTurn || isAnswerLocked || lifelines.freezeTime <= 0) return;
    soundFX.playLifeline();
    setTimeLeft(prev => prev + 5); // +5 extra seconds
    const nextLifelines = { ...lifelines, freezeTime: lifelines.freezeTime - 1 };
    setLifelines(nextLifelines);
    onPersistAccount?.({
      ...baseAccountAtStartRef.current,
      lifelines: nextLifelines,
    });
  };

  const handleUseAutoSolve = () => {
    if (!isPlayerTurn || isAnswerLocked || lifelines.autoSolve <= 0) return;
    soundFX.playLifeline();
    const nextLifelines = { ...lifelines, autoSolve: lifelines.autoSolve - 1 };
    setLifelines(nextLifelines);
    onPersistAccount?.({
      ...baseAccountAtStartRef.current,
      lifelines: nextLifelines,
    });
    submitTurnAnswer(currentQuestion.correctIndex, false);
  };

  // Build final match result idempotently from the match's starting baseline account
  const computeFinalMatchResult = (): {
    updatedAccount: PlayerAccount;
    historyItem: MatchHistoryItem;
  } => {
    const baseAcc = baseAccountAtStartRef.current;
    const pRoundsWon = roundWinners.filter(w => w === 'player').length;
    const oRoundsWon = roundWinners.filter(w => w === 'opponent').length;

    let tournamentPtsEarned = 0;
    if (finalOutcome === 'forfeit_win') {
      tournamentPtsEarned = currentRound === 1 ? 1 : 2;
    } else if (finalOutcome === 'win' && (mode === 'online' || mode === 'room')) {
      tournamentPtsEarned = 3;
    }

    const roundPointCoins =
      (mode === 'online' || mode === 'room') &&
      (finalOutcome === 'win' || finalOutcome === 'forfeit_win')
        ? totalPlayerPoints * 5
        : 0;

    const forfeitPenalty = finalOutcome === 'forfeit_loss' ? -15 : 0;
    const totalCoinsDelta = Math.max(
      -baseAcc.coins,
      roundPointCoins + bonusCoinsEarned + forfeitPenalty
    );

    const ratingDelta =
      mode === 'solo'
        ? 0
        : finalOutcome === 'win' || finalOutcome === 'forfeit_win'
        ? 25
        : finalOutcome === 'loss' || finalOutcome === 'forfeit_loss'
        ? -18
        : 5;

    const ratingBonusXp = hasSubmittedRating ? 5 : 0;
    const xpEarned =
      (finalOutcome === 'win' || finalOutcome === 'forfeit_win' ? 85 : 35) +
      ratingBonusXp;

    const matchId = matchIdRef.current;
    const historyItem: MatchHistoryItem = {
      id: matchId,
      timestamp: Date.now(),
      mode,
      category,
      opponentName,
      opponentFlag,
      opponentIsBot,
      playerRoundsWon: pRoundsWon,
      opponentRoundsWon: oRoundsWon,
      playerTotalPoints: totalPlayerPoints,
      opponentTotalPoints: totalOpponentPoints,
      outcome: finalOutcome,
      ratingDelta,
      tournamentPointsEarned: tournamentPtsEarned,
      coinsDelta: totalCoinsDelta,
      sportsmanshipStarsGiven: hasSubmittedRating ? selectedStars : undefined,
      sportsmanshipBadgeGiven: hasSubmittedRating ? selectedBadge : undefined,
    };

    const usedQuestionIds = questions.slice(0, 25).map(q => q.id);
    const updatedSeen = Array.from(
      new Set([...baseAcc.seenQuestionIds, ...usedQuestionIds])
    ).slice(-400);

    const nextMissions = { ...baseAcc.dailyMissions };
    if (
      (mode === 'online' || mode === 'room') &&
      (finalOutcome === 'win' || finalOutcome === 'forfeit_win')
    ) {
      nextMissions.onlineWins += 1;
    }
    nextMissions.correctAnswers += correctCountThisMatch;
    if (category === 'quran') {
      nextMissions.quranCorrect += correctCountThisMatch;
    }

    let updatedFriends = [...baseAcc.friends];
    let nextSportsmanshipAvg = baseAcc.sportsmanshipAvg ?? 5.0;
    let nextSportsmanshipCount = baseAcc.sportsmanshipCount ?? 1;
    const nextBadges = { ...(baseAcc.sportsmanshipBadges || {}) };
    const nextGivenReviews = [...(baseAcc.givenReviews || [])].filter(
      r => r.matchId !== matchId
    );

    if (hasSubmittedRating && mode !== 'solo') {
      const reviewEntry: SportsmanshipReview = {
        id: `rev_${matchId}`,
        matchId,
        targetPlayerId: opponentPlayerId || opponentName,
        targetName: opponentName,
        stars: selectedStars,
        badge: selectedBadge,
        timestamp: Date.now(),
      };
      nextGivenReviews.unshift(reviewEntry);

      updatedFriends = baseAcc.friends.map(f => {
        const matchesFriend =
          (opponentPlayerId && f.playerId === opponentPlayerId) ||
          f.username.toLowerCase() === opponentName.toLowerCase();
        if (!matchesFriend) return f;
        const prevAvg = f.sportsmanshipAvg ?? 5.0;
        const prevCount = f.sportsmanshipCount ?? 1;
        const newCount = prevCount + 1;
        const newAvg = Number(
          ((prevAvg * prevCount + selectedStars) / newCount).toFixed(2)
        );
        return {
          ...f,
          sportsmanshipAvg: newAvg,
          sportsmanshipCount: newCount,
          lastBadge: selectedBadge,
        };
      });

      const incomingHonorStars =
        finalOutcome === 'forfeit_loss'
          ? 3
          : Math.min(5, Math.max(4, selectedStars));
      const newPlayerCount = nextSportsmanshipCount + 1;
      nextSportsmanshipAvg = Number(
        (
          (nextSportsmanshipAvg * nextSportsmanshipCount + incomingHonorStars) /
          newPlayerCount
        ).toFixed(2)
      );
      nextSportsmanshipCount = newPlayerCount;
      nextBadges[selectedBadge] = (nextBadges[selectedBadge] || 0) + 1;
    }

    const filteredPrevHistory = baseAcc.matchHistory.filter(
      h => h.id !== matchId
    );
    const filteredPrevLedger = baseAcc.ledger.filter(
      l => l.id !== `ldg_${matchId}`
    );

    const newCoinsBalance = Math.max(0, baseAcc.coins + totalCoinsDelta);

    const updatedAccount: PlayerAccount = {
      ...baseAcc,
      soundEnabled: matchSoundEnabled,
      xp: baseAcc.xp + xpEarned,
      coins: newCoinsBalance,
      monthlyPoints: baseAcc.monthlyPoints + tournamentPtsEarned,
      rating: Math.max(800, baseAcc.rating + ratingDelta),
      fairPlayScore,
      sportsmanshipAvg: nextSportsmanshipAvg,
      sportsmanshipCount: nextSportsmanshipCount,
      sportsmanshipBadges: nextBadges,
      givenReviews: nextGivenReviews.slice(0, 50),
      friends: updatedFriends,
      lifelines,
      onlineWins:
        (mode === 'online' || mode === 'room') &&
        (finalOutcome === 'win' || finalOutcome === 'forfeit_win')
          ? baseAcc.onlineWins + 1
          : baseAcc.onlineWins,
      totalMatches: baseAcc.totalMatches + 1,
      totalDraws:
        roundWinners.length === 3 && pRoundsWon === oRoundsWon
          ? baseAcc.totalDraws + 1
          : baseAcc.totalDraws,
      totalCorrectAnswers: baseAcc.totalCorrectAnswers + correctCountThisMatch,
      goldenCorrectAnswers:
        baseAcc.goldenCorrectAnswers + goldenCorrectThisMatch,
      maxComboReached: Math.max(baseAcc.maxComboReached, maxComboThisMatch),
      seenQuestionIds: updatedSeen,
      dailyMissions: nextMissions,
      matchHistory: [historyItem, ...filteredPrevHistory.slice(0, 49)],
      ledger:
        totalCoinsDelta !== 0
          ? [
              {
                id: `ldg_${matchId}`,
                timestamp: Date.now(),
                type: totalCoinsDelta >= 0 ? 'credit' : 'debit',
                amount: Math.abs(totalCoinsDelta),
                reason:
                  totalCoinsDelta >= 0
                    ? `مكافأة نقاط جولات وكومبو المباراة (${categoryMeta.nameAr})`
                    : 'خصم عقوبة الانسحاب من المباراة',
                balanceAfter: newCoinsBalance,
              },
              ...filteredPrevLedger.slice(0, 99),
            ]
          : filteredPrevLedger,
    };

    return { updatedAccount, historyItem };
  };

  // Immediately persist match result to localStorage as soon as MATCH_OVER is reached or sportsmanship rating is submitted
  useEffect(() => {
    if (phase !== 'MATCH_OVER') return;
    const { updatedAccount } = computeFinalMatchResult();
    onPersistAccount?.(updatedAccount);
  }, [phase, hasSubmittedRating]);

  const handleFinishAndSave = () => {
    soundFX.playClick();
    const { updatedAccount, historyItem } = computeFinalMatchResult();
    onMatchComplete(updatedAccount, historyItem);
  };

  const locCategory = getLocalizedCategory(categoryMeta, account.language);

  // RENDER 1: Matchmaking Lobby / Real Firestore Waiting Room (`status === 'waiting'`) — 100% Real Players Only
  if (phase === 'MATCHMAKING') {
    const isPrivateWaitingRoom = mode === 'room';
    return (
      <div className="min-h-[82vh] flex flex-col items-center justify-center px-4 text-center">
        <div className="w-full max-w-md rounded-3xl bg-[#111827] border border-[#28354E] p-8 shadow-2xl">
          <div className="text-4xl mb-3">{categoryMeta.icon}</div>
          <h2 className="text-xl font-extrabold text-white mb-1">
            {roomCode
              ? `غرفة التحدي #${roomCode} · ${locCategory.name}`
              : `الأونلاين المباشر · ${locCategory.name}`}
          </h2>
          <p className="text-xs text-[#4FF5D2] font-extrabold mb-3 animate-pulse">
            {isPrivateWaitingRoom
              ? '⏳ شاشة انتظار حقيقية (Cloud Firestore): لن يبدأ السؤال الأول إلا عند دخول اللاعب الثاني فعلياً للغرفة!'
              : '🔍 جاري البحث عن لاعب حقيقي متصل الآن...'}
          </p>

          {activeRoomCode && (
            <div className="mb-4 px-4 py-2.5 rounded-2xl bg-[#070A12] border border-[#FFD166]/60 inline-flex items-center gap-2">
              <span className="text-xs text-slate-400">
                {isPrivateWaitingRoom ? 'كود الغرفة:' : 'غرفة المطابقة السحابية:'}
              </span>
              <span className="text-sm sm:text-base font-mono-num font-extrabold text-[#FFD166] tracking-wider">
                #{activeRoomCode}
              </span>
              <span className="px-2 py-0.5 rounded-lg bg-[#4FF5D2]/15 text-[#4FF5D2] text-[10px] font-extrabold">
                {roomCloudStatus === 'waiting'
                  ? 'بانتظار لاعب حقيقي (waiting)'
                  : 'نشطة (active)'}
              </span>
            </div>
          )}

          <div className="flex items-center justify-around my-6">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-2xl bg-[#1B253B] border border-[#4FF5D2] flex items-center justify-center text-3xl mb-2">
                {account.countryFlag}
              </div>
              <span className="text-sm font-bold text-white">{account.username}</span>
              <span className="text-[11px] font-mono-num text-[#FFD166]">{account.playerId}</span>
            </div>

            <div className="text-2xl font-extrabold text-[#4FF5D2] animate-pulse">VS</div>

            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-2xl bg-[#1B253B] border border-[#28354E] flex items-center justify-center text-3xl mb-2 animate-pulse">
                {isPrivateWaitingRoom ? customOpponentFlag || '⏳' : '🔍'}
              </div>
              <span className="text-sm font-bold text-slate-300">
                {isPrivateWaitingRoom
                  ? customOpponentName
                    ? `بانتظار قبول ${customOpponentName}...`
                    : 'بانتظار انضمام اللاعب الثاني...'
                  : '🔍 جاري البحث عن لاعب حقيقي متصل الآن...'}
              </span>
              <span className="text-[11px] text-[#4FF5D2] font-mono-num mt-0.5">
                {isPrivateWaitingRoom
                  ? customOpponentPlayerId || 'بدون بوت نهائياً (100% Real Player)'
                  : 'بدون بوت نهائياً · 100% لاعب حقيقي'}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              if (activeRoomCodeRef.current) {
                updateCloudRoomState(activeRoomCodeRef.current, {
                  status: 'finished',
                }).catch(() => {});
              }
              onCancelLobby();
            }}
            className="w-full min-h-[44px] rounded-xl bg-[#1B253B] hover:bg-[#28354E] text-xs font-bold text-slate-300"
          >
            {vt.cancelSearchBtn}
          </button>
        </div>
      </div>
    );
  }

  // RENDER 2: 30-Second Round Break
  if (phase === 'ROUND_BREAK') {
    return (
      <div className="min-h-[82vh] flex flex-col items-center justify-center px-4 text-center">
        <div className="w-full max-w-md rounded-3xl bg-[#111827] border border-[#28354E] p-7 shadow-2xl">
          <div className="text-xs font-bold text-[#FFD166] mb-1">
            {vt.roundBreakBadge}
          </div>
          <h2 className="text-2xl font-extrabold text-white mb-2">
            {vt.roundEndedTitle} {currentRound} / 3
          </h2>
          <p className="text-xs text-slate-400 mb-5">
            {vt.roundBreakRuleDesc}
          </p>

          {/* 30s Countdown Ring */}
          <div className="w-24 h-24 rounded-full bg-[#1B253B] border-2 border-[#4FF5D2] flex flex-col items-center justify-center mx-auto mb-6">
            <span className="text-3xl font-extrabold font-mono-num text-[#4FF5D2]">
              {breakTimeLeft}
            </span>
            <span className="text-[10px] text-slate-400">{vt.secondsRemaining}</span>
          </div>

          {/* Readiness Status */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="p-3 rounded-2xl bg-[#1B253B] border border-[#28354E]">
              <div className="text-xs font-bold text-white mb-1">{account.username}</div>
              <div
                className={`text-xs font-bold ${
                  playerReadyBreak ? 'text-[#38D9A9]' : 'text-[#FFD166]'
                }`}
              >
                {playerReadyBreak ? vt.readyForNextRound : vt.waitingYourApproval}
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-[#1B253B] border border-[#28354E]">
              <div className="text-xs font-bold text-white mb-1">{opponentName}</div>
              <div
                className={`text-xs font-bold ${
                  opponentReadyBreak ? 'text-[#38D9A9]' : 'text-[#FFD166]'
                }`}
              >
                {opponentReadyBreak ? vt.readyForNextRound : vt.preparingText}
              </div>
            </div>
          </div>

          <button
            type="button"
            disabled={playerReadyBreak}
            onClick={() => {
              soundFX.playClick();
              setPlayerReadyBreak(true);
              if (isLiveCloudMatch && activeRoomCode) {
                updateCloudRoomState(
                  activeRoomCode,
                  isRoomHostRef.current
                    ? { hostReadyNextRound: true }
                    : { guestReadyNextRound: true }
                ).catch(() => {});
              }
            }}
            className="w-full min-h-[50px] rounded-2xl bg-gradient-to-r from-[#4FF5D2] to-[#38D9A9] text-[#070A12] font-extrabold text-sm shadow-lg disabled:opacity-60"
          >
            {playerReadyBreak ? vt.readyForNextRound : vt.confirmReadyBtn}
          </button>

          <button
            type="button"
            onClick={() => {
              soundFX.playClick();
              if (mode === 'online' || mode === 'room') {
                setFairPlayScore(prev => Math.max(50, prev - 5));
              }
              triggerMatchEnd('forfeit_loss', vt.forfeitLossText);
            }}
            className="mt-3 w-full min-h-[40px] rounded-xl bg-[#FF6B81]/10 hover:bg-[#FF6B81]/20 border border-[#FF6B81]/40 text-xs font-bold text-[#FF6B81] flex items-center justify-center gap-1.5 transition-colors"
          >
            <Flag className="w-3.5 h-3.5" />
            <span>{vt.forfeitMatchBtn}</span>
          </button>
        </div>
      </div>
    );
  }

  // RENDER 3: Match Over Summary
  if (phase === 'MATCH_OVER') {
    const isVictory = finalOutcome === 'win' || finalOutcome === 'forfeit_win';
    const isForfeitWin = finalOutcome === 'forfeit_win';
    const forfeitPts = currentRound === 1 ? 1 : 2;

    return (
      <div className="min-h-[82vh] flex flex-col items-center justify-center px-4 text-center">
        <div className="w-full max-w-lg rounded-3xl bg-[#111827] border border-[#28354E] p-7 shadow-2xl">
          {activeSfxBadge && (
            <div className="mb-3 flex justify-center">
              <span
                className={`px-3 py-1 rounded-full border text-[11px] font-extrabold animate-pulse ${activeSfxBadge.colorClass}`}
              >
                {activeSfxBadge.label}
              </span>
            </div>
          )}
          <div className="text-6xl mb-3">
            {isVictory ? '🏆' : finalOutcome === 'forfeit_loss' ? '🏳️' : '⚔️'}
          </div>
          <h2
            className={`text-2xl font-extrabold mb-2 ${
              isVictory ? 'text-[#38D9A9]' : 'text-[#FF6B81]'
            }`}
          >
            {isForfeitWin
              ? `${vt.forfeitWinText} (+${forfeitPts} 🏆)`
              : isVictory
              ? vt.crushingVictoryTitle
              : finalOutcome === 'forfeit_loss'
              ? vt.forfeitLossText
              : vt.matchOverGoodLuckTitle}
          </h2>

          {forfeitReasonAr && (
            <div className="mb-4 p-3 rounded-xl bg-[#1B253B] border border-[#28354E] text-xs text-slate-200">
              {forfeitReasonAr}
            </div>
          )}

          {/* Scoreboard */}
          <div className="grid grid-cols-3 items-center gap-3 p-4 rounded-2xl bg-[#070A12] border border-[#28354E] mb-6">
            <div>
              <div className="text-2xl mb-1">{account.countryFlag}</div>
              <div className="text-xs font-bold text-white truncate">{account.username}</div>
              <div className="text-2xl font-extrabold font-mono-num text-[#4FF5D2] mt-1">
                {totalPlayerPoints}
              </div>
              <div className="text-[10px] text-slate-400">{vt.totalPointsLabel}</div>
            </div>

            <div className="text-xs font-mono-num text-slate-400">
              <div>{vt.roundsWord}</div>
              <div className="text-lg font-extrabold text-white my-1">
                {roundWinners.filter(w => w === 'player').length} -{' '}
                {roundWinners.filter(w => w === 'opponent').length}
              </div>
              <div className="text-[#FFD166]">3 {vt.roundsWord}</div>
            </div>

            <div>
              <div className="text-2xl mb-1">{opponentFlag}</div>
              <div className="text-xs font-bold text-white truncate">{opponentName}</div>
              <div className="text-2xl font-extrabold font-mono-num text-[#A78BFA] mt-1">
                {totalOpponentPoints}
              </div>
              <div className="text-[10px] text-slate-400">{vt.totalPointsLabel}</div>
            </div>
          </div>

          {/* Rewards breakdown */}
          <div className="grid grid-cols-3 gap-2 mb-6 text-xs">
            <div className="p-3 rounded-xl bg-[#1B253B] border border-[#28354E]">
              <div className="text-slate-400 mb-1">{vt.tournamentPointsLabel}</div>
              <div className="text-sm font-extrabold font-mono-num text-[#FFD166]">
                +{isForfeitWin ? forfeitPts : isVictory && (mode === 'online' || mode === 'room') ? 3 : 0}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-[#1B253B] border border-[#28354E]">
              <div className="text-slate-400 mb-1">{vt.goldCoinsLabel}</div>
              <div className="text-sm font-extrabold font-mono-num text-[#38D9A9]">
                {finalOutcome === 'forfeit_loss'
                  ? '-15 🪙'
                  : `+${
                      ((mode === 'online' || mode === 'room') && isVictory
                        ? totalPlayerPoints * 5
                        : 0) + bonusCoinsEarned
                    } 🪙`}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-[#1B253B] border border-[#28354E]">
              <div className="text-slate-400 mb-1">{vt.xpPointsLabel}</div>
              <div className="text-sm font-extrabold font-mono-num text-[#4FF5D2]">
                +{(isVictory ? 85 : 35) + (hasSubmittedRating ? 5 : 0)} XP
              </div>
            </div>
          </div>

          {/* Post-Match Sportsmanship Rating Panel */}
          {mode !== 'solo' && (
            <div className="mb-5 rounded-2xl bg-[#070A12] border border-[#28354E] p-4 text-start">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                <div>
                  <h3 className="text-xs font-extrabold text-white flex items-center gap-1.5">
                    <span>{vt.postMatchRatingTitle}</span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {vt.postMatchRatingSub} ({opponentName})
                  </p>
                </div>
                {hasSubmittedRating && (
                  <span className="px-2.5 py-1 rounded-full bg-[#38D9A9]/15 border border-[#38D9A9] text-[10px] font-extrabold text-[#38D9A9]">
                    {vt.ratingRecordedBadge}
                  </span>
                )}
              </div>

              {/* 1..5 Star Selector */}
              <div className="flex items-center justify-center gap-2 my-3">
                {[1, 2, 3, 4, 5].map(star => {
                  const active = star <= selectedStars;
                  return (
                    <button
                      key={star}
                      type="button"
                      disabled={hasSubmittedRating}
                      onClick={() => {
                        soundFX.playClick();
                        setSelectedStars(star);
                      }}
                      className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all ${
                        active
                          ? 'bg-[#FFD166]/20 border-[#FFD166] text-[#FFD166] scale-105'
                          : 'bg-[#111827] border-[#28354E] text-slate-500 hover:border-slate-400'
                      }`}
                    >
                      <Star
                        className={`w-5 h-5 ${active ? 'fill-[#FFD166]' : ''}`}
                      />
                    </button>
                  );
                })}
                <span className="text-xs font-mono-num font-extrabold text-[#FFD166] mr-1">
                  {selectedStars}.0 / 5
                </span>
              </div>

              {/* Commendation Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                {SPORTSMANSHIP_BADGES.map(b => {
                  const isSel = selectedBadge === b.id;
                  return (
                    <button
                      key={b.id}
                      type="button"
                      disabled={hasSubmittedRating}
                      onClick={() => {
                        soundFX.playClick();
                        setSelectedBadge(b.id);
                      }}
                      className={`py-2 px-2.5 rounded-xl border text-[11px] font-bold flex items-center justify-center gap-1 transition-all ${
                        isSel
                          ? 'bg-[#4FF5D2]/15 border-[#4FF5D2] text-[#4FF5D2]'
                          : 'bg-[#111827] border-[#28354E] text-slate-300 hover:bg-[#1B253B]'
                      }`}
                    >
                      <span>{b.icon}</span>
                      <span>{b.label}</span>
                    </button>
                  );
                })}
              </div>

              {!hasSubmittedRating && (
                <button
                  type="button"
                  onClick={() => {
                    soundFX.playCorrect(false, 2);
                    setHasSubmittedRating(true);
                  }}
                  className="w-full min-h-[40px] rounded-xl bg-[#1B253B] hover:bg-[#28354E] border border-[#FFD166]/60 text-xs font-extrabold text-[#FFD166] transition-colors"
                >
                  {vt.submitSportsmanshipBtn} ({opponentName})
                </button>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={handleFinishAndSave}
            className="w-full min-h-[50px] rounded-2xl bg-gradient-to-r from-[#4FF5D2] to-[#38D9A9] text-[#070A12] font-extrabold text-sm shadow-lg"
          >
            {vt.saveAndReturnBtn}
          </button>
        </div>
      </div>
    );
  }

  // RENDER 4: Active Playing Round or Sudden Death
  const isUrgentRed = timeLeft <= 2;
  const hasOpponentAnsweredCurrentStep =
    isLiveCloudMatch &&
    (opponentSelectedOption !== -1 ||
      remoteAnsweredStepRef.current >= currentStepNumber);

  return (
    <div className="max-w-3xl mx-auto px-3 sm:px-6 py-4 select-none">
      {antiCheatNotice && (
        <div className="mb-3 rounded-2xl bg-[#FFD166]/15 border border-[#FFD166] px-4 py-2.5 text-xs font-bold text-[#FFD166] flex items-center justify-between">
          <span>{antiCheatNotice}</span>
          <span className="font-mono-num">Fair Play: {fairPlayScore}/100</span>
        </div>
      )}

      {/* Top Match HUD: Round Info + Active SFX Badge + Quick Mute + Compact Forfeit Button + Player vs Opponent Cards */}
      <div className="rounded-3xl bg-[#111827] border border-[#28354E] p-4 mb-4">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 mb-3">
          <div className="flex items-center gap-2">
            <span>{categoryMeta.icon}</span>
            <span className="font-bold text-white">{locCategory.name}</span>
            {activeRoomCode && (
              <span className="font-mono-num text-[#4FF5D2]">· #{activeRoomCode}</span>
            )}
            {activeSfxBadge && (
              <span
                className={`px-2.5 py-0.5 rounded-full border text-[10px] font-extrabold animate-pulse ${activeSfxBadge.colorClass}`}
              >
                {activeSfxBadge.label}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono-num font-bold text-[#FFD166]">
              {phase === 'SUDDEN_DEATH'
                ? '⚡ Sudden Death'
                : `${vt.roundsWord} ${currentRound}/3 · Q ${questionInRound}/8`}
            </span>
            <button
              type="button"
              onClick={handleToggleMatchSound}
              className={`p-1.5 rounded-xl border transition-colors ${
                matchSoundEnabled
                  ? 'bg-[#1B253B] border-[#4FF5D2]/50 text-[#4FF5D2]'
                  : 'bg-[#070A12] border-[#28354E] text-slate-500'
              }`}
            >
              {matchSoundEnabled ? (
                <Volume2 className="w-3.5 h-3.5" />
              ) : (
                <VolumeX className="w-3.5 h-3.5" />
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                soundFX.playClick();
                setShowForfeitConfirm(true);
              }}
              className="px-2.5 py-1 rounded-xl bg-[#FF6B81]/15 hover:bg-[#FF6B81]/25 border border-[#FF6B81]/50 text-[11px] font-extrabold text-[#FF6B81] flex items-center gap-1 transition-colors"
            >
              <Flag className="w-3 h-3" />
              <span>🏳️</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 items-center gap-2">
          {/* Player 1 Card */}
          <div
            className={`relative p-3 rounded-2xl border transition-all ${
              isPlayerTurn
                ? 'bg-[#1B253B] border-[#4FF5D2] shadow-[0_0_18px_rgba(79,245,210,0.2)]'
                : 'bg-[#070A12]/60 border-[#28354E] opacity-75'
            }`}
          >
            {activePlayerEmoji && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-2xl animate-bounce">
                {activePlayerEmoji}
              </div>
            )}
            <div className="flex items-center justify-between mb-1">
              <span className="text-lg">{account.countryFlag}</span>
              <span className="text-xl font-extrabold font-mono-num text-[#4FF5D2]">
                {playerRoundPoints}
              </span>
            </div>
            <div className="text-xs font-bold text-white truncate">{account.username}</div>
            <div className="text-[10px] font-mono-num text-slate-400">
              {account.playerId} · مجموع: {totalPlayerPoints}
            </div>
          </div>

          {/* Center 6-Second Timer & Combo */}
          <div className="flex flex-col items-center justify-center">
            <div
              className={`w-16 h-16 rounded-2xl border-2 flex flex-col items-center justify-center transition-all ${
                isUrgentRed
                  ? 'bg-[#FF6B81]/20 border-[#FF6B81] text-[#FF6B81] animate-pulse scale-105'
                  : 'bg-[#1B253B] border-[#4FF5D2] text-white'
              }`}
            >
              <span className="text-2xl font-extrabold font-mono-num">{timeLeft}</span>
              <span className="text-[9px] text-slate-300">sec</span>
            </div>

            {comboCount >= 2 && (
              <div className="mt-1.5 text-[11px] font-extrabold text-[#FFD166]">
                🔥 {comboCount}x
              </div>
            )}
          </div>

          {/* Opponent Card */}
          <div
            className={`relative p-3 rounded-2xl border transition-all ${
              !isPlayerTurn || isLiveCloudMatch
                ? 'bg-[#1B253B] border-[#A78BFA] shadow-[0_0_18px_rgba(167,139,250,0.25)]'
                : 'bg-[#070A12]/60 border-[#28354E] opacity-75'
            }`}
          >
            {activeOpponentEmoji && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-2xl animate-bounce">
                {activeOpponentEmoji}
              </div>
            )}
            <div className="flex items-center justify-between mb-1">
              <span className="text-lg">{opponentFlag}</span>
              <span className="text-xl font-extrabold font-mono-num text-[#A78BFA]">
                {opponentRoundPoints}
              </span>
            </div>
            <div className="text-xs font-bold text-white truncate">{opponentName}</div>
            <div className="text-[10px] font-mono-num text-slate-400">
              {opponentIsBot ? 'AI Bot' : `${opponentPlayerId || ''} · مجموع: ${totalOpponentPoints}`}
            </div>
            {isLiveCloudMatch && (
              <div className="mt-1">
                {opponentSelectedOption >= 0 || hasOpponentAnsweredCurrentStep ? (
                  <span className="inline-block px-2 py-0.5 rounded-md bg-[#38D9A9]/20 border border-[#38D9A9] text-[10px] font-extrabold text-[#38D9A9] animate-pulse">
                    ⚡ أجاب الخصم الآن!
                  </span>
                ) : opponentSelectedOption === -2 ? (
                  <span className="inline-block px-2 py-0.5 rounded-md bg-[#FF6B81]/20 border border-[#FF6B81] text-[10px] font-extrabold text-[#FF6B81]">
                    ⏱️ انتهى وقت الخصم
                  </span>
                ) : (
                  <span className="inline-block px-2 py-0.5 rounded-md bg-[#070A12] border border-[#28354E] text-[10px] font-bold text-slate-400">
                    🤔 يفكر في الإجابة...
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Countdown Progress Bar (turns red in last 2 seconds) */}
        <div className="w-full h-2.5 rounded-full bg-[#070A12] overflow-hidden mt-3">
          <div
            className={`h-full transition-all duration-300 ${
              isUrgentRed ? 'bg-[#FF6B81] animate-pulse' : 'bg-[#4FF5D2]'
            }`}
            style={{ width: `${Math.min(100, (timeLeft / 6) * 100)}%` }}
          />
        </div>
      </div>

      {/* Turn & Golden Question Banner */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="text-xs font-bold">
          {phase === 'SUDDEN_DEATH' ? (
            <span className="text-[#FFD166]">⚡ Sudden Death!</span>
          ) : isLiveCloudMatch && !isPlayerTurn ? (
            <span className="text-[#FF6B81] animate-pulse">
              🔒 دور خصمك الآن للإجابة... انتظر دورك!
            </span>
          ) : isPlayerTurn ? (
            <span className="text-[#4FF5D2]">{vt.yourTurnBanner}</span>
          ) : mode === 'local' ? (
            <span className="text-[#A78BFA]">{vt.player2TurnBanner}</span>
          ) : (
            <span className="text-[#A78BFA]">{vt.opponentTurnBanner}</span>
          )}
        </div>

        {isGoldenQuestion ? (
          <div className="text-xs font-extrabold text-[#FFD166] animate-pulse">
            {vt.goldenQuestionBadge}
          </div>
        ) : (
          <div className="text-xs text-slate-400">{vt.standardQuestionBadge}</div>
        )}
      </div>

      {/* Question Card */}
      <div
        className={`rounded-3xl p-6 mb-4 border transition-all ${
          isGoldenQuestion
            ? 'bg-gradient-to-br from-[#1B253B] to-[#111827] border-[#FFD166] shadow-[0_0_30px_rgba(255,209,102,0.16)]'
            : 'bg-[#111827] border-[#28354E]'
        }`}
      >
        <h3 className="text-lg sm:text-xl font-extrabold text-white leading-relaxed text-center mb-6">
          {currentQuestion.questionAr}
        </h3>

        {/* 4 Answer Options with Strict Turn-Based Lock Overlay when activeTurnUid !== account.uid */}
        <div className="relative">
          {isLiveCloudMatch && !isPlayerTurn && (
            <div className="absolute inset-0 z-20 rounded-2xl bg-[#070A12]/85 backdrop-blur-[3px] border-2 border-[#FF6B81]/70 flex flex-col items-center justify-center p-4 text-center shadow-2xl">
              <div className="w-12 h-12 rounded-2xl bg-[#FF6B81]/20 border border-[#FF6B81] flex items-center justify-center text-[#FF6B81] mb-2 animate-pulse">
                <Lock className="w-6 h-6" />
              </div>
              <p className="text-sm sm:text-base font-extrabold text-white">
                🔒 دور خصمك الآن للإجابة... انتظر دورك!
              </p>
              <p className="text-[11px] font-bold text-[#4FF5D2] mt-1">
                سيُفتح دورك وسؤالك التالي تلقائياً فور انتهاء {opponentName} من الإجابة
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {currentQuestion.optionsAr.map((optText, idx) => {
              const isHidden = hiddenOptions.includes(idx);
              if (isHidden) {
                return (
                  <div
                    key={idx}
                    className="min-h-[54px] rounded-2xl bg-[#070A12]/40 border border-[#28354E]/40 flex items-center justify-center text-xs text-slate-600"
                  >
                    50:50
                  </div>
                );
              }

              let btnStyle =
                'bg-[#1B253B] hover:bg-[#28354E] border-[#28354E] text-white';
              if (isAnswerLocked) {
                if (idx === currentQuestion.correctIndex) {
                  btnStyle =
                    'bg-[#10B981]/25 border-[#38D9A9] text-[#38D9A9] shadow-[0_0_15px_rgba(16,185,129,0.3)]';
                } else if (idx === selectedOption) {
                  btnStyle = 'bg-[#FF6B81]/25 border-[#FF6B81] text-[#FF6B81]';
                } else {
                  btnStyle = 'bg-[#070A12]/50 border-[#28354E] text-slate-500';
                }
              }

              const canPlayerClick =
                !isAnswerLocked && (isPlayerTurn || mode === 'local');
              const isOpponentPickedThis =
                isLiveCloudMatch &&
                isAnswerLocked &&
                opponentSelectedOption >= 0 &&
                opponentSelectedOption === idx;

              return (
                <button
                  key={idx}
                  type="button"
                  disabled={!canPlayerClick}
                  onClick={() => submitTurnAnswer(idx, false)}
                  className={`min-h-[56px] px-4 py-3 rounded-2xl border font-bold text-sm text-start flex items-center justify-between gap-2 transition-all disabled:cursor-not-allowed ${btnStyle}`}
                >
                  <span className="leading-snug flex-1">{optText}</span>
                  {isOpponentPickedThis && (
                    <span className="px-2 py-0.5 rounded-lg bg-[#A78BFA]/25 border border-[#A78BFA] text-[10px] font-extrabold text-[#A78BFA] shrink-0">
                      {opponentFlag} اختيار الخصم
                    </span>
                  )}
                  <span className="w-7 h-7 rounded-lg bg-[#070A12]/60 flex items-center justify-center text-xs font-mono-num shrink-0 mr-1">
                    {idx + 1}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Lifelines Bar (50:50, Freeze +5s, Auto Solve) */}
      <div className="grid grid-cols-3 gap-2.5">
        <button
          type="button"
          disabled={!isPlayerTurn || isAnswerLocked || lifelines.fiftyFifty <= 0 || hiddenOptions.length > 0}
          onClick={handleUseFiftyFifty}
          className="min-h-[50px] rounded-2xl bg-[#111827] hover:bg-[#1B253B] disabled:opacity-40 border border-[#28354E] px-3.5 py-2.5 flex items-center justify-between text-xs font-extrabold text-white transition-colors"
        >
          <span>🎯 {vt.fiftyFiftyTitle}</span>
          <span className="font-mono-num text-[#4FF5D2]">{lifelines.fiftyFifty}</span>
        </button>

        <button
          type="button"
          disabled={!isPlayerTurn || isAnswerLocked || lifelines.freezeTime <= 0}
          onClick={handleUseFreezeTime}
          className="min-h-[50px] rounded-2xl bg-[#111827] hover:bg-[#1B253B] disabled:opacity-40 border border-[#28354E] px-3.5 py-2.5 flex items-center justify-between text-xs font-extrabold text-white transition-colors"
        >
          <span>❄️ {vt.freezeTimeTitle}</span>
          <span className="font-mono-num text-[#4FF5D2]">{lifelines.freezeTime}</span>
        </button>

        <button
          type="button"
          disabled={!isPlayerTurn || isAnswerLocked || lifelines.autoSolve <= 0}
          onClick={handleUseAutoSolve}
          className="min-h-[50px] rounded-2xl bg-[#111827] hover:bg-[#1B253B] disabled:opacity-40 border border-[#28354E] px-3.5 py-2.5 flex items-center justify-between text-xs font-extrabold text-white transition-colors"
        >
          <span>⚡ {vt.autoSolveTitle}</span>
          <span className="font-mono-num text-[#FFD166]">{lifelines.autoSolve}</span>
        </button>
      </div>

      {/* Quick Forfeit Confirmation Modal */}
      {showForfeitConfirm && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-3xl bg-[#111827] border border-[#FF6B81] p-6 text-center shadow-2xl">
            <div className="w-14 h-14 rounded-2xl bg-[#FF6B81]/15 border border-[#FF6B81]/50 flex items-center justify-center text-3xl mx-auto mb-3">
              🏳️
            </div>
            <h3 className="text-lg font-extrabold text-white mb-2">
              {vt.confirmForfeitModalTitle}
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed mb-5">
              {vt.confirmForfeitModalDesc}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  soundFX.playClick();
                  setShowForfeitConfirm(false);
                }}
                className="min-h-[46px] rounded-xl bg-[#4FF5D2] text-[#070A12] font-extrabold text-xs"
              >
                {vt.continuePlayingBtn}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForfeitConfirm(false);
                  if (mode === 'online' || mode === 'room') {
                    setFairPlayScore(prev => Math.max(50, prev - 5));
                  }
                  triggerMatchEnd('forfeit_loss', vt.forfeitLossText);
                }}
                className="min-h-[46px] rounded-xl bg-[#FF6B81]/20 hover:bg-[#FF6B81]/30 border border-[#FF6B81] text-[#FF6B81] font-extrabold text-xs"
              >
                {vt.forfeitMatchBtn}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

