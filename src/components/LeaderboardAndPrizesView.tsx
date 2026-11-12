import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import {
  MONTHLY_PRIZES,
  REALISTIC_HUMAN_LEADERBOARD_SEED,
  VIP_PACKAGES,
} from '../data/constants';
import { CloudLeaderboardEntry, fetchCloudLeaderboard } from '../services/firebase';
import { loadOwnerPlayerOverrides } from '../services/storage';
import { PlayerAccount } from '../types';
import { getViewTranslations } from '../utils/i18n';
import { soundFX } from '../utils/sound';
import { ArrowDown, ArrowUp, RefreshCw } from 'lucide-react';

interface LeaderboardAndPrizesViewProps {
  account: PlayerAccount;
}

export const LeaderboardAndPrizesView: React.FC<LeaderboardAndPrizesViewProps> = ({
  account,
}) => {
  const vt = getViewTranslations(account.language);
  const [cloudEntries, setCloudEntries] = useState<CloudLeaderboardEntry[]>([]);
  const [livePointBoosts, setLivePointBoosts] = useState<Record<string, number>>({});
  const [rankDeltas, setRankDeltas] = useState<Record<string, number>>({});
  const [pointGainBadges, setPointGainBadges] = useState<Record<string, number>>({});
  const [isUpdatingLive, setIsUpdatingLive] = useState<boolean>(false);
  const clearHighlightTimerRef = useRef<number | null>(null);

  const [timeRemaining, setTimeRemaining] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  // Real-time countdown to the end of the current month
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const endOfMonth = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        1,
        0,
        0,
        0
      );
      const diffMs = Math.max(0, endOfMonth.getTime() - now.getTime());
      const totalSeconds = Math.floor(diffMs / 1000);
      const days = Math.floor(totalSeconds / 86400);
      const hours = Math.floor((totalSeconds % 86400) / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      setTimeRemaining({ days, hours, minutes, seconds });
    };
    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchCloudLeaderboard()
      .then(list => {
        if (list.length > 0) setCloudEntries(list);
      })
      .catch(() => {});
  }, []);

  // Build sorted leaderboard given any point boosts and owner overrides/bans
  const buildSortedBoard = useCallback(
    (boostsMap: Record<string, number>): CloudLeaderboardEntry[] => {
      const overrides = loadOwnerPlayerOverrides();
      const map = new Map<string, CloudLeaderboardEntry>();

      for (const item of REALISTIC_HUMAN_LEADERBOARD_SEED) {
        const ov = overrides[item.playerId] || overrides[item.uid];
        if (ov?.isBanned) continue;
        const basePts = ov ? ov.monthlyPoints : item.monthlyPoints;
        const baseRating = ov ? ov.rating : item.rating;
        map.set(item.playerId, {
          ...item,
          username: ov?.username ?? item.username,
          countryFlag: ov?.countryFlag ?? item.countryFlag,
          vipTier: ov?.vipTier ?? item.vipTier,
          level: ov?.level ?? item.level,
          monthlyPoints: basePts + (boostsMap[item.playerId] || 0),
          rating: baseRating + (boostsMap[item.playerId] || 0) * 3,
          isBanned: Boolean(ov?.isBanned),
        });
      }

      for (const c of cloudEntries) {
        if (c.playerId && c.playerId.startsWith('#')) {
          const ov = overrides[c.playerId] || overrides[c.uid];
          if (c.isBanned || ov?.isBanned) {
            map.delete(c.playerId);
            continue;
          }
          const basePts = ov ? ov.monthlyPoints : c.monthlyPoints;
          const baseRating = ov ? ov.rating : c.rating;
          map.set(c.playerId, {
            ...c,
            username: ov?.username ?? c.username,
            countryFlag: ov?.countryFlag ?? c.countryFlag,
            vipTier: ov?.vipTier ?? c.vipTier,
            level: ov?.level ?? c.level,
            monthlyPoints: basePts + (boostsMap[c.playerId] || 0),
            rating: baseRating,
            isBanned: false,
          });
        }
      }

      // Include current human player unless banned
      if (!account.isBanned) {
        map.set(account.playerId, {
          uid: account.uid,
          playerId: account.playerId,
          username: account.username,
          countryFlag: account.countryFlag,
          monthlyPoints: account.monthlyPoints,
          rating: account.rating,
          vipTier: account.vipTier,
          level: account.level,
          isBanned: false,
        });
      } else {
        map.delete(account.playerId);
      }

      return Array.from(map.values())
        .filter(item => !item.isBanned)
        .sort(
          (a, b) => b.monthlyPoints - a.monthlyPoints || b.rating - a.rating
        );
    },
    [cloudEntries, account]
  );

  const mergedLeaderboard = React.useMemo(
    () => buildSortedBoard(livePointBoosts),
    [buildSortedBoard, livePointBoosts]
  );

  // Trigger a live Top-5 rank shift with smooth sliding animation
  const triggerLiveTop5Update = useCallback(
    (playAudio: boolean = false) => {
      if (playAudio) soundFX.playClick();
      setIsUpdatingLive(true);

      // Refresh cloud data in background
      fetchCloudLeaderboard()
        .then(list => {
          if (list.length > 0) setCloudEntries(list);
        })
        .catch(() => {});

      setLivePointBoosts(prevBoosts => {
        const beforeBoard = buildSortedBoard(prevBoosts);
        const oldRanks: Record<string, number> = {};
        beforeBoard.forEach((entry, idx) => {
          oldRanks[entry.playerId] = idx + 1;
        });

        // Pick two Top-5 contenders (ranks 2..5) so one overtakes the player directly above them!
        const topFiveCandidates = beforeBoard
          .slice(0, 5)
          .filter(e => e.playerId !== account.playerId);

        const nextBoosts = { ...prevBoosts };
        const newGains: Record<string, number> = {};

        if (topFiveCandidates.length >= 2) {
          // Choose a contender in position 2..5 to surge ahead of the contender above them
          const challengerIdx =
            1 + Math.floor(Math.random() * (topFiveCandidates.length - 1));
          const challenger = topFiveCandidates[challengerIdx];
          const targetAbove = topFiveCandidates[challengerIdx - 1];
          const gap = Math.max(
            1,
            targetAbove.monthlyPoints - challenger.monthlyPoints
          );
          const surgePts = gap + 2 + Math.floor(Math.random() * 3);

          nextBoosts[challenger.playerId] =
            (nextBoosts[challenger.playerId] || 0) + surgePts;
          newGains[challenger.playerId] = surgePts;

          // Also give another Top-5 contender a smaller +2 point update
          const otherIdx =
            challengerIdx === topFiveCandidates.length - 1
              ? 1
              : topFiveCandidates.length - 1;
          const secondMover = topFiveCandidates[otherIdx];
          if (secondMover && secondMover.playerId !== challenger.playerId) {
            nextBoosts[secondMover.playerId] =
              (nextBoosts[secondMover.playerId] || 0) + 2;
            newGains[secondMover.playerId] = 2;
          }
        }

        const afterBoard = buildSortedBoard(nextBoosts);
        const deltas: Record<string, number> = {};
        afterBoard.forEach((entry, idx) => {
          const newRank = idx + 1;
          const prevRank = oldRanks[entry.playerId] || newRank;
          if (prevRank !== newRank) {
            deltas[entry.playerId] = prevRank - newRank; // Positive = moved UP, Negative = moved DOWN
          }
        });

        setRankDeltas(deltas);
        setPointGainBadges(newGains);

        if (clearHighlightTimerRef.current) {
          window.clearTimeout(clearHighlightTimerRef.current);
        }
        clearHighlightTimerRef.current = window.setTimeout(() => {
          setRankDeltas({});
          setPointGainBadges({});
          setIsUpdatingLive(false);
        }, 4200);

        return nextBoosts;
      });
    },
    [buildSortedBoard, account.playerId]
  );

  // Automatically trigger the Top-5 rank shift animation shortly after the user enters the Tournament screen
  useEffect(() => {
    const enterTimer = window.setTimeout(() => {
      triggerLiveTop5Update(false);
    }, 850);

    return () => {
      window.clearTimeout(enterTimer);
      if (clearHighlightTimerRef.current) {
        window.clearTimeout(clearHighlightTimerRef.current);
      }
    };
  }, [triggerLiveTop5Update]);

  return (
    <div className="space-y-8 pb-10">
      {/* Real-Time Monthly Countdown Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-[#111827] via-[#1B253B] to-[#111827] border border-[#FFD166]/50 p-6 flex flex-wrap items-center justify-between gap-6">
        <div>
          <div className="text-xs font-extrabold text-[#FFD166] mb-1">
            {vt.tournamentTopBadge}
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white mb-1">
            {vt.tournamentTitle}
          </h2>
          <p className="text-xs text-slate-400">
            {vt.tournamentSubtitle}
          </p>
        </div>

        {/* Countdown Boxes */}
        <div className="flex items-center gap-2.5">
          {[
            { label: vt.daysLabel, val: timeRemaining.days },
            { label: vt.hoursLabel, val: timeRemaining.hours },
            { label: vt.minutesLabel, val: timeRemaining.minutes },
            { label: vt.secondsLabel, val: timeRemaining.seconds },
          ].map((unit, i) => (
            <div
              key={i}
              className="w-16 h-16 rounded-2xl bg-[#070A12] border border-[#28354E] flex flex-col items-center justify-center"
            >
              <span className="text-xl font-extrabold font-mono-num text-[#4FF5D2]">
                {String(unit.val).padStart(2, '0')}
              </span>
              <span className="text-[10px] text-slate-400">{unit.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Top 5 Monthly Prizes Showcase */}
      <div>
        <h3 className="text-base font-extrabold text-white mb-3">
          {vt.top5PrizesHeader}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {MONTHLY_PRIZES.map(prize => {
            const currentHolder = mergedLeaderboard[prize.rank - 1];
            const holderChanged =
              currentHolder && (rankDeltas[currentHolder.playerId] || 0) !== 0;

            return (
              <div
                key={prize.rank}
                className={`rounded-3xl p-4 border text-center transition-all duration-300 ${
                  holderChanged
                    ? 'bg-[#1B253B] border-[#38D9A9] shadow-[0_0_25px_rgba(56,217,169,0.22)] scale-[1.02]'
                    : prize.rank === 1
                    ? 'bg-gradient-to-b from-[#1B253B] to-[#111827] border-[#FFD166]'
                    : 'bg-[#111827] border-[#28354E]'
                }`}
              >
                <div className="text-4xl mb-2">{prize.icon}</div>
                <div className="text-xs font-extrabold text-white leading-snug mb-2">
                  {prize.titleAr}
                </div>
                {currentHolder && (
                  <div className="pt-2 border-t border-[#28354E] text-[11px] text-slate-300 leading-snug">
                    {vt.currentLeaderLabel}{' '}
                    <span className="font-bold text-[#4FF5D2] break-words">
                      {currentHolder.countryFlag} {currentHolder.username}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bot-Free Human Leaderboard Table with Live Top-5 Animation */}
      <div className="rounded-3xl bg-[#111827] border border-[#28354E] p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div>
            <h3 className="text-base font-extrabold text-white">
              {vt.liveStandingsTitle}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {vt.liveStandingsSub}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-mono-num text-[#FFD166] font-bold">
              {vt.yourPointsLabel} {account.monthlyPoints} {vt.pointsUnit}
            </span>

            <button
              type="button"
              onClick={() => triggerLiveTop5Update(true)}
              className="min-h-[38px] px-3.5 rounded-xl bg-[#1B253B] hover:bg-[#28354E] border border-[#4FF5D2]/50 text-xs font-extrabold text-[#4FF5D2] flex items-center gap-1.5 transition-colors whitespace-nowrap"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isUpdatingLive ? 'animate-spin' : ''}`}
              />
              <span>{vt.liveRefreshBtn}</span>
            </button>
          </div>
        </div>

        <div className="space-y-2.5 relative">
          {mergedLeaderboard.map((entry, idx) => {
            const rank = idx + 1;
            const isMe = entry.playerId === account.playerId;
            const vipMeta =
              VIP_PACKAGES.find(v => v.id === entry.vipTier) || VIP_PACKAGES[0];
            const prizeForRank = MONTHLY_PRIZES.find(p => p.rank === rank);
            const delta = rankDeltas[entry.playerId] || 0;
            const gainedPts = pointGainBadges[entry.playerId] || 0;

            return (
              <motion.div
                layout
                transition={{
                  type: 'spring',
                  stiffness: 320,
                  damping: 28,
                }}
                key={entry.playerId}
                className={`flex items-center justify-between gap-2 sm:gap-3 px-3 sm:px-4 py-3 rounded-2xl border transition-colors duration-300 ${
                  delta > 0
                    ? 'bg-[#10B981]/15 border-[#38D9A9] shadow-[0_0_24px_rgba(16,185,129,0.22)]'
                    : delta < 0
                    ? 'bg-[#FF6B81]/10 border-[#FF6B81]/60'
                    : isMe
                    ? 'bg-[#1B253B] border-[#4FF5D2] shadow-[0_0_20px_rgba(79,245,210,0.15)]'
                    : rank <= 5
                    ? 'bg-[#1B253B]/60 border-[#FFD166]/40'
                    : 'bg-[#070A12] border-[#28354E]'
                }`}
              >
                <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                  {/* Rank Badge */}
                  <div
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center font-mono-num font-extrabold text-xs shrink-0 ${
                      rank === 1
                        ? 'bg-[#FFD166] text-[#070A12]'
                        : rank === 2
                        ? 'bg-slate-200 text-[#070A12]'
                        : rank === 3
                        ? 'bg-amber-600 text-white'
                        : 'bg-[#111827] text-slate-300'
                    }`}
                  >
                    {rank}
                  </div>

                  {/* Rank Movement Indicator (Up / Down) */}
                  {delta !== 0 && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.7 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={`flex items-center gap-0.5 text-[11px] font-mono-num font-extrabold shrink-0 ${
                        delta > 0 ? 'text-[#38D9A9]' : 'text-[#FF6B81]'
                      }`}
                    >
                      {delta > 0 ? (
                        <>
                          <ArrowUp className="w-3 h-3" />
                          <span dir="ltr">+{delta}</span>
                        </>
                      ) : (
                        <>
                          <ArrowDown className="w-3 h-3" />
                          <span dir="ltr">{delta}</span>
                        </>
                      )}
                    </motion.div>
                  )}

                  <span className="text-xl sm:text-2xl shrink-0">{entry.countryFlag}</span>

                  <div className="flex-1 min-w-[130px] sm:min-w-[180px]">
                    <div className="flex flex-wrap items-center gap-1.5 text-xs sm:text-sm font-extrabold text-white leading-snug">
                      <span className="break-words">{entry.username}</span>
                      <span className="shrink-0">{vipMeta.badge}</span>
                      {isMe && (
                        <span className="text-[11px] text-[#4FF5D2] shrink-0">{vt.youTag}</span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-[10px] sm:text-[11px] text-slate-400 font-mono-num mt-0.5">
                      <span dir="ltr">{entry.playerId}</span>
                      <span aria-hidden="true">·</span>
                      <span className="whitespace-nowrap">
                        {vt.ratingTag} <span dir="ltr">{entry.rating}</span>
                      </span>
                      {prizeForRank && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="text-[#FFD166] whitespace-nowrap">
                            {vt.prizeCandidateTag} {prizeForRank.icon}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Monthly Points & Live Point Gain Animation */}
                <div className="text-end font-mono-num shrink-0">
                  <div className="flex items-center justify-end gap-1.5">
                    {gainedPts > 0 && (
                      <motion.span
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        dir="ltr"
                        className="text-[11px] font-extrabold text-[#38D9A9] whitespace-nowrap"
                      >
                        +{gainedPts} 🔥
                      </motion.span>
                    )}
                    <span className="text-sm sm:text-base font-extrabold text-[#FFD166] whitespace-nowrap">
                      {entry.monthlyPoints} {vt.pointsUnit}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 whitespace-nowrap">{vt.monthlyPointsSub}</div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

