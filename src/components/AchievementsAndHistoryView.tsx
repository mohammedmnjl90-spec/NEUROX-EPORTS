import React, { useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ACHIEVEMENTS_LIST, QUIZ_CATEGORIES } from '../data/constants';
import { PlayerAccount } from '../types';
import { getLocalizedCategory, getViewTranslations } from '../utils/i18n';
import { soundFX } from '../utils/sound';
import { BarChart3, Flame, Percent, ShieldAlert, TrendingUp, Trophy } from 'lucide-react';

interface AchievementsAndHistoryViewProps {
  account: PlayerAccount;
}

type ChartStyleMode = 'area' | 'bar';
type DataGroupMode = 'timeline' | 'categories';

interface ChartDataPoint {
  name: string;
  subtitle?: string;
  wins: number;
  losses: number;
  rating?: number;
  winRate?: number;
}

export const AchievementsAndHistoryView: React.FC<AchievementsAndHistoryViewProps> = ({
  account,
}) => {
  const vt = getViewTranslations(account.language);
  const [chartStyle, setChartStyle] = useState<ChartStyleMode>('area');
  const [groupMode, setGroupMode] = useState<DataGroupMode>('timeline');

  // Compute overall Wins, Losses, Win Rate %, and chart datasets
  const analytics = useMemo(() => {
    const history = account.matchHistory || [];
    const chronological = [...history].reverse();

    let recordedWins = 0;
    let recordedLosses = 0;

    chronological.forEach(item => {
      if (item.outcome === 'win' || item.outcome === 'forfeit_win') {
        recordedWins += 1;
      } else {
        recordedLosses += 1;
      }
    });

    const totalWins = Math.max(account.onlineWins, recordedWins);
    const totalMatches = Math.max(account.totalMatches, chronological.length);
    const totalLosses = Math.max(0, totalMatches - totalWins);
    const winRate =
      totalMatches > 0 ? Math.round((totalWins / totalMatches) * 100) : 0;

    // 1. Timeline Progression Dataset (Cumulative Wins vs Losses across matches)
    const timelineData: ChartDataPoint[] = [];
    if (chronological.length > 0) {
      let cumWins = 0;
      let cumLosses = 0;
      let runningRating = 1200;

      chronological.slice(-20).forEach((m, idx) => {
        const isWin = m.outcome === 'win' || m.outcome === 'forfeit_win';
        if (isWin) cumWins += 1;
        else cumLosses += 1;
        runningRating = Math.max(800, runningRating + m.ratingDelta);

        const catMeta =
          QUIZ_CATEGORIES.find(c => c.id === m.category) || QUIZ_CATEGORIES[0];
        const locCat = getLocalizedCategory(catMeta, account.language);

        timelineData.push({
          name: `#${idx + 1}`,
          subtitle: `${catMeta.icon} ${locCat.name} ${vt.againstLabel} ${m.opponentName}`,
          wins: cumWins,
          losses: cumLosses,
          rating: runningRating,
          winRate: Math.round((cumWins / (cumWins + cumLosses)) * 100),
        });
      });
    } else {
      const previewSteps = [
        { name: '#1', wins: 1, losses: 0, rating: 1225, subtitle: vt.previewBadge },
        { name: '#2', wins: 2, losses: 0, rating: 1250, subtitle: vt.previewBadge },
        { name: '#3', wins: 2, losses: 1, rating: 1232, subtitle: vt.previewBadge },
        { name: '#4', wins: 3, losses: 1, rating: 1257, subtitle: vt.previewBadge },
        { name: '#5', wins: 4, losses: 1, rating: 1282, subtitle: vt.previewBadge },
        { name: '#6', wins: 5, losses: 2, rating: 1264, subtitle: vt.previewBadge },
      ];
      timelineData.push(...previewSteps);
    }

    // 2. Category Breakdown Dataset (Wins vs Losses per Quiz Category)
    const categoryData: ChartDataPoint[] = QUIZ_CATEGORIES.map((cat, idx) => {
      const locCat = getLocalizedCategory(cat, account.language);
      const catMatches = history.filter(m => m.category === cat.id);
      const catWins = catMatches.filter(
        m => m.outcome === 'win' || m.outcome === 'forfeit_win'
      ).length;
      const catLosses = catMatches.length - catWins;

      if (history.length === 0) {
        const demoWins = (idx % 3) + 2;
        const demoLosses = idx % 2;
        return {
          name: locCat.name.slice(0, 12),
          subtitle: `${cat.icon} ${locCat.name}`,
          wins: demoWins,
          losses: demoLosses,
          winRate: Math.round((demoWins / (demoWins + demoLosses)) * 100),
        };
      }

      const totalCat = catWins + catLosses;
      return {
        name: locCat.name.slice(0, 12),
        subtitle: `${cat.icon} ${locCat.name}`,
        wins: catWins,
        losses: catLosses,
        winRate: totalCat > 0 ? Math.round((catWins / totalCat) * 100) : 0,
      };
    });

    return {
      totalWins,
      totalLosses,
      totalMatches,
      winRate,
      timelineData,
      categoryData,
      isPreviewMode: history.length === 0,
    };
  }, [account.matchHistory, account.onlineWins, account.totalMatches, account.language, vt]);

  const activeData =
    groupMode === 'timeline' ? analytics.timelineData : analytics.categoryData;

  const renderCustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || payload.length === 0) return null;
    const row: ChartDataPoint = payload[0]?.payload;
    const isRtl = account.language === 'ar' || account.language === 'ur';
    return (
      <div
        dir={isRtl ? 'rtl' : 'ltr'}
        className="rounded-2xl bg-[#070A12]/95 border border-[#4FF5D2] p-3.5 shadow-2xl text-start text-xs min-w-[195px]"
      >
        <div className="font-extrabold text-white mb-1.5">{row?.subtitle || label}</div>
        <div className="space-y-1 font-mono-num">
          <div className="flex items-center justify-between gap-4 text-[#38D9A9]">
            <span>{vt.winsSeriesName} 🏆:</span>
            <span dir="ltr" className="font-extrabold">{row?.wins ?? 0}</span>
          </div>
          <div className="flex items-center justify-between gap-4 text-[#FF6B81]">
            <span>{vt.lossesSeriesName} ⚔️:</span>
            <span dir="ltr" className="font-extrabold">{row?.losses ?? 0}</span>
          </div>
          {row?.winRate !== undefined && (
            <div className="flex items-center justify-between gap-4 text-[#FFD166] pt-1 border-t border-[#28354E]">
              <span>{vt.winRateCard}:</span>
              <span dir="ltr" className="font-extrabold">{row.winRate}%</span>
            </div>
          )}
          {row?.rating !== undefined && (
            <div className="flex items-center justify-between gap-4 text-[#4FF5D2]">
              <span>{vt.ratingTag}:</span>
              <span dir="ltr" className="font-extrabold">{row.rating}</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 pb-10">
      {/* Interactive Recharts Performance Analytics Section */}
      <div className="rounded-3xl bg-[#111827] border border-[#28354E] p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-extrabold text-white">
                📊 {vt.analyticsChartTitle}
              </h2>
              {analytics.isPreviewMode && (
                <span className="px-2.5 py-0.5 rounded-md bg-[#FFD166]/15 border border-[#FFD166]/40 text-[10px] font-bold text-[#FFD166]">
                  {vt.previewBadge}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {vt.analyticsChartSub}
            </p>
          </div>

          {/* Toggle Controls: Data Grouping + Chart Style */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Grouping Toggle */}
            <div className="inline-flex rounded-xl bg-[#070A12] border border-[#28354E] p-1">
              <button
                type="button"
                onClick={() => {
                  soundFX.playClick();
                  setGroupMode('timeline');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-colors ${
                  groupMode === 'timeline'
                    ? 'bg-[#4FF5D2] text-[#070A12]'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {vt.recentMatchesTab}
              </button>
              <button
                type="button"
                onClick={() => {
                  soundFX.playClick();
                  setGroupMode('categories');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-colors ${
                  groupMode === 'categories'
                    ? 'bg-[#4FF5D2] text-[#070A12]'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {vt.byCategoriesTab}
              </button>
            </div>

            {/* Chart Style Toggle */}
            <div className="inline-flex rounded-xl bg-[#070A12] border border-[#28354E] p-1">
              <button
                type="button"
                onClick={() => {
                  soundFX.playClick();
                  setChartStyle('area');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1 transition-colors ${
                  chartStyle === 'area'
                    ? 'bg-[#A78BFA] text-[#070A12]'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>{vt.areaChartTab}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  soundFX.playClick();
                  setChartStyle('bar');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1 transition-colors ${
                  chartStyle === 'bar'
                    ? 'bg-[#A78BFA] text-[#070A12]'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>{vt.barChartTab}</span>
              </button>
            </div>
          </div>
        </div>

        {/* 4 Summary KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="p-3.5 rounded-2xl bg-[#070A12] border border-[#38D9A9]/40 flex items-center justify-between">
            <div>
              <div className="text-[11px] text-slate-400">{vt.totalWinsCard}</div>
              <div className="text-xl font-extrabold font-mono-num text-[#38D9A9] mt-0.5">
                {analytics.totalWins}
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#38D9A9]/15 flex items-center justify-center text-[#38D9A9]">
              <Trophy className="w-5 h-5" />
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#070A12] border border-[#FF6B81]/40 flex items-center justify-between">
            <div>
              <div className="text-[11px] text-slate-400">{vt.totalLossesCard}</div>
              <div className="text-xl font-extrabold font-mono-num text-[#FF6B81] mt-0.5">
                {analytics.totalLosses}
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#FF6B81]/15 flex items-center justify-center text-[#FF6B81]">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#070A12] border border-[#FFD166]/40 flex items-center justify-between">
            <div>
              <div className="text-[11px] text-slate-400">{vt.winRateCard}</div>
              <div className="text-xl font-extrabold font-mono-num text-[#FFD166] mt-0.5">
                {analytics.winRate}%
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#FFD166]/15 flex items-center justify-center text-[#FFD166]">
              <Percent className="w-5 h-5" />
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#070A12] border border-[#4FF5D2]/40 flex items-center justify-between">
            <div>
              <div className="text-[11px] text-slate-400">{vt.maxComboCard}</div>
              <div className="text-xl font-extrabold font-mono-num text-[#4FF5D2] mt-0.5">
                {account.maxComboReached}x 🔥
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#4FF5D2]/15 flex items-center justify-center text-[#4FF5D2]">
              <Flame className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Recharts Interactive Container */}
        <div className="w-full h-[300px] sm:h-[340px] rounded-2xl bg-[#070A12] border border-[#28354E] p-3 sm:p-4" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            {chartStyle === 'area' ? (
              <AreaChart
                data={activeData}
                margin={{ top: 12, right: 16, left: -12, bottom: 8 }}
              >
                <defs>
                  <linearGradient id="winsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38D9A9" stopOpacity={0.55} />
                    <stop offset="95%" stopColor="#38D9A9" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="lossesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF6B81" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#FF6B81" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis
                  dataKey="name"
                  stroke="#94A3B8"
                  tick={{ fill: '#CBD5E1', fontSize: 11, fontWeight: 700 }}
                />
                <YAxis
                  allowDecimals={false}
                  stroke="#94A3B8"
                  tick={{ fill: '#CBD5E1', fontSize: 11 }}
                />
                <Tooltip content={renderCustomTooltip} />
                <Legend
                  wrapperStyle={{ fontSize: '12px', fontWeight: 700, paddingTop: '8px' }}
                />
                <Area
                  type="monotone"
                  dataKey="wins"
                  name={vt.winsSeriesName}
                  stroke="#38D9A9"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#winsGradient)"
                  activeDot={{ r: 6, strokeWidth: 2, stroke: '#070A12' }}
                />
                <Area
                  type="monotone"
                  dataKey="losses"
                  name={vt.lossesSeriesName}
                  stroke="#FF6B81"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#lossesGradient)"
                  activeDot={{ r: 6, strokeWidth: 2, stroke: '#070A12' }}
                />
              </AreaChart>
            ) : (
              <BarChart
                data={activeData}
                margin={{ top: 12, right: 16, left: -12, bottom: 8 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis
                  dataKey="name"
                  stroke="#94A3B8"
                  tick={{ fill: '#CBD5E1', fontSize: 11, fontWeight: 700 }}
                />
                <YAxis
                  allowDecimals={false}
                  stroke="#94A3B8"
                  tick={{ fill: '#CBD5E1', fontSize: 11 }}
                />
                <Tooltip content={renderCustomTooltip} />
                <Legend
                  wrapperStyle={{ fontSize: '12px', fontWeight: 700, paddingTop: '8px' }}
                />
                <Bar
                  dataKey="wins"
                  name={vt.winsSeriesName}
                  fill="#38D9A9"
                  radius={[6, 6, 0, 0]}
                />
                <Bar
                  dataKey="losses"
                  name={vt.lossesSeriesName}
                  fill="#FF6B81"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* 8 Achievements Grid */}
      <div className="rounded-3xl bg-[#111827] border border-[#28354E] p-6">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-white flex flex-wrap items-center gap-1.5">
              <span className="whitespace-nowrap">🏅 {vt.achievementsHeader}</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {vt.achievementsSub}
            </p>
          </div>
          <div className="text-xs font-mono-num font-bold text-[#FFD166] whitespace-nowrap">
            {vt.unlockedCountLabel}{' '}
            <span dir="ltr">
              {account.unlockedAchievements.length} / {ACHIEVEMENTS_LIST.length}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {ACHIEVEMENTS_LIST.map(ach => {
            const unlocked = account.unlockedAchievements.includes(ach.id);
            return (
              <div
                key={ach.id}
                className={`rounded-2xl p-4 border transition-all ${
                  unlocked
                    ? 'bg-gradient-to-br from-[#1B253B] to-[#111827] border-[#FFD166]'
                    : 'bg-[#070A12] border-[#28354E] opacity-65'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-3xl">{ach.icon}</span>
                  <span
                    className={`text-xs font-mono-num font-bold ${
                      unlocked ? 'text-[#38D9A9]' : 'text-[#FFD166]'
                    }`}
                  >
                    {unlocked ? vt.completedBadgeText : '+15 🪙'}
                  </span>
                </div>
                <h3 className="text-sm font-extrabold text-white mb-1">
                  {ach.titleAr}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {ach.descAr}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Match History (Last 50 Matches) */}
      <div className="rounded-3xl bg-[#111827] border border-[#28354E] p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-extrabold text-white whitespace-nowrap">
            📜 {vt.matchHistoryHeader}
          </h3>
          <span className="text-xs font-mono-num text-[#4FF5D2] whitespace-nowrap">
            {vt.totalMatchesLabel} {account.totalMatches}
          </span>
        </div>

        {account.matchHistory.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500">
            {vt.noMatchesYetText}
          </div>
        ) : (
          <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
            {account.matchHistory.slice(0, 50).map(item => {
              const catMeta =
                QUIZ_CATEGORIES.find(c => c.id === item.category) ||
                QUIZ_CATEGORIES[0];
              const locCat = getLocalizedCategory(catMeta, account.language);
              const isWin =
                item.outcome === 'win' || item.outcome === 'forfeit_win';

              return (
                <div
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-[#070A12] border border-[#28354E]"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-2xl shrink-0">{catMeta.icon}</span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 text-xs font-extrabold text-white">
                        <span>
                          {vt.againstLabel} {item.opponentFlag} {item.opponentName}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span
                          className={`whitespace-nowrap ${
                            isWin ? 'text-[#38D9A9]' : 'text-[#FF6B81]'
                          }`}
                        >
                          {item.outcome === 'forfeit_win'
                            ? vt.forfeitWinText
                            : isWin
                            ? vt.victoryText
                            : item.outcome === 'forfeit_loss'
                            ? vt.forfeitLossText
                            : vt.defeatText}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-slate-300 mt-1">
                        <span className="whitespace-nowrap font-bold text-slate-300">
                          {locCat.name}
                        </span>
                        <span aria-hidden="true">•</span>
                        <span className="whitespace-nowrap inline-flex items-center gap-1">
                          <span>{vt.roundsWord}</span>
                          <span
                            dir="ltr"
                            className="font-mono-num font-bold text-white whitespace-nowrap"
                          >
                            ({item.playerRoundsWon}-{item.opponentRoundsWon})
                          </span>
                        </span>
                        <span aria-hidden="true">•</span>
                        <span className="whitespace-nowrap inline-flex items-center gap-1">
                          <span>{vt.pointsWord}</span>
                          <span
                            dir="ltr"
                            className="font-mono-num font-bold text-white whitespace-nowrap"
                          >
                            ({item.playerTotalPoints}-{item.opponentTotalPoints})
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 font-mono-num text-xs shrink-0">
                    {item.sportsmanshipStarsGiven && (
                      <span className="px-2 py-0.5 rounded-lg bg-[#FFD166]/15 border border-[#FFD166]/40 text-[#FFD166] font-bold whitespace-nowrap">
                        {vt.yourRatingBadge}{' '}
                        <span dir="ltr">{item.sportsmanshipStarsGiven} ⭐</span>
                      </span>
                    )}
                    {item.tournamentPointsEarned > 0 && (
                      <span
                        dir="ltr"
                        className="text-[#FFD166] font-bold whitespace-nowrap"
                      >
                        +{item.tournamentPointsEarned} 🏆
                      </span>
                    )}
                    <span
                      className={`font-extrabold whitespace-nowrap inline-flex items-center gap-1 ${
                        item.ratingDelta >= 0
                          ? 'text-[#38D9A9]'
                          : 'text-[#FF6B81]'
                      }`}
                    >
                      <span dir="ltr">
                        {item.ratingDelta >= 0
                          ? `+${item.ratingDelta}`
                          : item.ratingDelta}
                      </span>
                      <span>{vt.ratingTag}</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

