import React, { useEffect, useMemo, useState } from 'react';
import {
  computeLevelInfo,
  PROFILE_BORDERS_CATALOG,
  UI_THEMES_CATALOG,
  VIP_PACKAGES,
} from '../data/constants';
import {
  ownerMutatePlayerInFirestore,
  seedOwnerFirestoreUsers,
  subscribeToOwnerAllPlayers,
  syncPlayerToCloud,
} from '../services/firebase';
import {
  loadOwnerPlayerOverrides,
  saveOwnerPlayerOverride,
} from '../services/storage';
import { CloudManagedPlayer, EconomyLedgerEntry, PlayerAccount } from '../types';
import { soundFX } from '../utils/sound';
import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  Coins,
  Crown,
  Flame,
  Radar,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Trophy,
  Unlock,
  Users,
  X,
  Zap,
} from 'lucide-react';

interface StealthOwnerPanelModalProps {
  account: PlayerAccount;
  onUpdateAccount: (updated: PlayerAccount, toastMsg?: string) => void;
  onClose: () => void;
}

type OwnerSectionTab = 'my_boost' | 'radar' | 'players';

export const StealthOwnerPanelModal: React.FC<StealthOwnerPanelModalProps> = ({
  account,
  onUpdateAccount,
  onClose,
}) => {
  const [activeSection, setActiveSection] =
    useState<OwnerSectionTab>('my_boost');
  const [players, setPlayers] = useState<CloudManagedPlayer[]>([]);
  const [playerSearch, setPlayerSearch] = useState<string>('');
  const [playerFilter, setPlayerFilter] = useState<
    'all' | 'active' | 'banned' | 'suspects'
  >('all');
  const [busyUid, setBusyUid] = useState<string | null>(null);
  const [statusBanner, setStatusBanner] = useState<string | null>(null);

  // My Account Boost custom inputs
  const [myCoinsInput, setMyCoinsInput] = useState<string>(
    String(account.coins)
  );
  const [myMonthlyInput, setMyMonthlyInput] = useState<string>(
    String(account.monthlyPoints)
  );
  const [myRatingInput, setMyRatingInput] = useState<string>(
    String(account.rating)
  );
  const [myXpInput, setMyXpInput] = useState<string>(String(account.xp));
  const [myLifelineCountInput, setMyLifelineCountInput] =
    useState<string>('99');

  // Per-player inline custom edit values keyed by playerId
  const [customEdits, setCustomEdits] = useState<
    Record<
      string,
      {
        monthlyPoints: string;
        coins: string;
        rating: string;
        fairPlayScore: string;
      }
    >
  >({});

  // Sync my input fields when account updates externally
  useEffect(() => {
    setMyCoinsInput(String(account.coins));
    setMyMonthlyInput(String(account.monthlyPoints));
    setMyRatingInput(String(account.rating));
    setMyXpInput(String(account.xp));
  }, [account.coins, account.monthlyPoints, account.rating, account.xp]);

  // Seed & subscribe in real-time to Firestore `users` and `players` collections
  useEffect(() => {
    seedOwnerFirestoreUsers(account, loadOwnerPlayerOverrides()).catch(() => {});

    const unsub = subscribeToOwnerAllPlayers(
      account,
      loadOwnerPlayerOverrides,
      liveList => {
        setPlayers(liveList);
      }
    );

    return () => {
      unsub();
    };
  }, [account]);

  const showOwnerFeedback = (msg: string) => {
    setStatusBanner(msg);
    window.setTimeout(() => {
      setStatusBanner(prev => (prev === msg ? null : prev));
    }, 4500);
  };

  // Helper to apply a change to the owner's own account + sync to Firestore immediately
  const applyMyAccountUpdate = async (
    patch: Partial<PlayerAccount>,
    ledgerReason: string,
    feedbackMsg: string
  ) => {
    soundFX.playCorrect(false, 2);
    const nextXp =
      patch.xp !== undefined
        ? Math.max(0, Math.floor(Number(patch.xp) || 0))
        : account.xp;
    const { currentRank } = computeLevelInfo(nextXp);
    const nextCoins =
      patch.coins !== undefined
        ? Math.max(0, Math.floor(Number(patch.coins) || 0))
        : account.coins;

    let nextLedger = [...(account.ledger || [])];
    if (nextCoins !== account.coins) {
      const delta = Math.abs(nextCoins - account.coins);
      const entry: EconomyLedgerEntry = {
        id: `ldg_owner_${Date.now()}`,
        timestamp: Date.now(),
        type: nextCoins >= account.coins ? 'credit' : 'debit',
        amount: delta,
        reason: ledgerReason,
        balanceAfter: nextCoins,
      };
      nextLedger = [entry, ...nextLedger.slice(0, 99)];
    }

    const updatedAccount: PlayerAccount = {
      ...account,
      ...patch,
      xp: nextXp,
      level: currentRank.level,
      coins: nextCoins,
      ledger: nextLedger,
      updatedAt: Date.now(),
    };

    const ownerManagedRecord: CloudManagedPlayer = {
      uid: updatedAccount.uid,
      playerId: updatedAccount.playerId,
      username: updatedAccount.username,
      countryCode: updatedAccount.countryCode || 'SA',
      countryFlag: updatedAccount.countryFlag || '🇸🇦',
      xp: updatedAccount.xp,
      level: updatedAccount.level,
      coins: updatedAccount.coins,
      monthlyPoints: updatedAccount.monthlyPoints,
      rating: updatedAccount.rating,
      vipTier: updatedAccount.vipTier,
      fairPlayScore: updatedAccount.fairPlayScore,
      onlineWins: updatedAccount.onlineWins,
      totalMatches: updatedAccount.totalMatches,
      isBanned: Boolean(updatedAccount.isBanned),
    };

    saveOwnerPlayerOverride(ownerManagedRecord);
    onUpdateAccount(updatedAccount, feedbackMsg);
    await syncPlayerToCloud(updatedAccount);
    await ownerMutatePlayerInFirestore(ownerManagedRecord, ownerManagedRecord);
    showOwnerFeedback(feedbackMsg);
  };

  // Helper to mutate any player in Firestore + local overrides in real time
  const handleMutateTargetPlayer = async (
    target: CloudManagedPlayer,
    patch: Partial<CloudManagedPlayer>,
    feedbackMsg: string
  ) => {
    soundFX.playClick();
    setBusyUid(target.playerId);
    try {
      // If the target is the owner's own active account, also update `account` state directly
      if (
        target.playerId === account.playerId ||
        target.uid === account.uid
      ) {
        await applyMyAccountUpdate(
          {
            coins: patch.coins ?? account.coins,
            monthlyPoints: patch.monthlyPoints ?? account.monthlyPoints,
            rating: patch.rating ?? account.rating,
            xp: patch.xp ?? account.xp,
            fairPlayScore: patch.fairPlayScore ?? account.fairPlayScore,
            vipTier: patch.vipTier ?? account.vipTier,
            isBanned:
              patch.isBanned !== undefined ? patch.isBanned : account.isBanned,
          },
          'تحديث مباشر من لوحة تحكم المالك',
          feedbackMsg
        );
        return;
      }

      const updated = await ownerMutatePlayerInFirestore(target, patch);
      saveOwnerPlayerOverride(updated);
      setPlayers(prev =>
        prev
          .map(p => (p.playerId === updated.playerId ? updated : p))
          .sort(
            (a, b) => b.monthlyPoints - a.monthlyPoints || b.rating - a.rating
          )
      );
      showOwnerFeedback(feedbackMsg);
    } finally {
      setBusyUid(null);
    }
  };

  const getCustomEditFor = (p: CloudManagedPlayer) => {
    return (
      customEdits[p.playerId] || {
        monthlyPoints: String(p.monthlyPoints),
        coins: String(p.coins),
        rating: String(p.rating),
        fairPlayScore: String(p.fairPlayScore),
      }
    );
  };

  const updateCustomEditField = (
    p: CloudManagedPlayer,
    field: 'monthlyPoints' | 'coins' | 'rating' | 'fairPlayScore',
    value: string
  ) => {
    const current = getCustomEditFor(p);
    setCustomEdits(prev => ({
      ...prev,
      [p.playerId]: {
        ...current,
        [field]: value,
      },
    }));
  };

  // Anti-Cheat Radar: automatically flag any player (other than owner) with fairPlayScore < 80
  // or suspiciously inflated monthlyPoints (>= 250) or coins (>= 5000)
  const radarSuspects = useMemo(() => {
    return players.filter(p => {
      if (p.playerId === account.playerId) return false;
      const lowFairPlay = p.fairPlayScore < 80;
      const suspiciousPoints = p.monthlyPoints >= 250;
      const suspiciousCoins = p.coins >= 5000;
      return lowFairPlay || suspiciousPoints || suspiciousCoins;
    });
  }, [players, account.playerId]);

  const filteredPlayers = useMemo(() => {
    const q = playerSearch.trim().toLowerCase();
    return players.filter(p => {
      if (playerFilter === 'active' && p.isBanned) return false;
      if (playerFilter === 'banned' && !p.isBanned) return false;
      if (
        playerFilter === 'suspects' &&
        !(p.fairPlayScore < 80 || p.monthlyPoints >= 250 || p.coins >= 5000)
      ) {
        return false;
      }
      if (!q) return true;
      return (
        p.username.toLowerCase().includes(q) ||
        p.playerId.toLowerCase().includes(q) ||
        p.uid.toLowerCase().includes(q)
      );
    });
  }, [players, playerSearch, playerFilter]);

  // One-click Rank #1 Boost for Owner
  const handleRankOneInstantBoost = async () => {
    const highestOtherPoints = players
      .filter(p => p.playerId !== account.playerId && !p.isBanned)
      .reduce((max, p) => Math.max(max, p.monthlyPoints), 150);
    const targetMonthlyPoints = Math.max(
      account.monthlyPoints,
      highestOtherPoints + 50
    );
    const targetRating = Math.max(account.rating, 2500);
    const targetXp = Math.max(account.xp, 6500);

    await applyMyAccountUpdate(
      {
        monthlyPoints: targetMonthlyPoints,
        rating: targetRating,
        xp: targetXp,
        isBanned: false,
      },
      'تعزيز تصدر البطولة الشهرية (لوحة المالك)',
      `👑 تم رفع نقاطك الشهرية إلى ${targetMonthlyPoints} والتصنيف إلى ${targetRating} لتتصدر المركز الأول فوراً!`
    );
  };

  // One-click Royal Gold VIP + All Cosmetics + Lifelines x99
  const handleUnlockFullRoyalVipAndLifelines = async () => {
    const qty = Math.max(
      1,
      Math.min(9999, Math.floor(Number(myLifelineCountInput) || 99))
    );
    const allBorderIds = PROFILE_BORDERS_CATALOG.map(b => b.id);
    const allThemeIds = UI_THEMES_CATALOG.map(th => th.id);

    await applyMyAccountUpdate(
      {
        vipTier: 'royal_gold',
        lifelines: {
          fiftyFifty: qty,
          freezeTime: qty,
          autoSolve: qty,
        },
        ownedBorders: allBorderIds,
        equippedBorder: 'royal_gold_frame',
        ownedThemes: allThemeIds,
      },
      'تفعيل الباقة الملكية الذهبية VIP وتعبئة المساعدات مجاناً',
      `👑 تم تفعيل الباقة الملكية الذهبية (VIP) مجاناً وتعبئة جميع وسائل المساعدة (×${qty})!`
    );
  };

  // One-click Reset Owner Fair-Play (100/100) & Sportsmanship (5.0/5.0)
  const handleResetMyFairPlayAndSportsmanship = async () => {
    await applyMyAccountUpdate(
      {
        fairPlayScore: 100,
        sportsmanshipAvg: 5.0,
        isBanned: false,
      },
      'إعادة ضبط مؤشر النزاهة والروح الرياضية (لوحة المالك)',
      '🛡️ تم إعادة ضبط مؤشر النزاهة إلى (100/100) وتقييم الروح الرياضية إلى (5.0 / 5.0) فوراً!'
    );
  };

  // One-click Zero Out All Radar Suspects
  const handlePunishAllRadarSuspects = async () => {
    if (radarSuspects.length === 0) return;
    soundFX.playClick();
    for (const suspect of radarSuspects) {
      const updated = await ownerMutatePlayerInFirestore(suspect, {
        monthlyPoints: 0,
        coins: 0,
        rating: 800,
        isBanned: true,
      });
      saveOwnerPlayerOverride(updated);
    }
    showOwnerFeedback(
      `🚨 تم تصفير نقاط وعملات جميع المرصودين في الرادار (${radarSuspects.length}) وحظرهم من المتصدرين!`
    );
  };

  return (
    <div
      dir="rtl"
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
    >
      <div className="w-full max-w-5xl rounded-3xl bg-[#070A12] border-2 border-[#FFD166] shadow-[0_0_60px_rgba(255,209,102,0.25)] overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Top Stealth Owner Header */}
        <div className="bg-gradient-to-r from-[#111827] via-[#1B253B] to-[#111827] border-b border-[#28354E] px-5 py-4 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#FFD166]/20 border border-[#FFD166] flex items-center justify-center text-2xl shrink-0">
              👑
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base sm:text-lg font-extrabold text-white">
                  لوحة تحكم المالك السرية (Stealth Owner Control Panel)
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-[#38D9A9]/20 border border-[#38D9A9] text-[10px] font-extrabold text-[#38D9A9] flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#38D9A9] animate-ping" />
                  <span>مربوطة مباشرة بـ Cloud Firestore</span>
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                تحكم فوري بحسابك الشخصي، وإدارة جميع اللاعبين في مجموعة{' '}
                <span dir="ltr" className="font-mono-num text-[#4FF5D2]">
                  users / players
                </span>
                ، ورادار كشف التلاعب وسحب نقاط الغشاشين
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              soundFX.playClick();
              onClose();
            }}
            className="min-h-[40px] px-4 rounded-xl bg-[#111827] hover:bg-[#FF6B81]/20 border border-[#28354E] hover:border-[#FF6B81] text-xs font-extrabold text-slate-200 hover:text-[#FF6B81] flex items-center gap-1.5 transition-colors"
          >
            <X className="w-4 h-4" />
            <span>إغلاق اللوحة السرية</span>
          </button>
        </div>

        {/* Status Toast Banner inside Owner Panel */}
        {statusBanner && (
          <div className="mx-5 mt-3 px-4 py-2.5 rounded-2xl bg-[#38D9A9]/15 border border-[#38D9A9] text-xs font-extrabold text-[#38D9A9] flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{statusBanner}</span>
            </div>
            <button
              type="button"
              onClick={() => setStatusBanner(null)}
              className="text-slate-300 hover:text-white text-xs"
            >
              ✕
            </button>
          </div>
        )}

        {/* 3 Main Navigation Tabs */}
        <div className="px-5 pt-3 pb-2 border-b border-[#28354E] bg-[#0B101E] flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              soundFX.playClick();
              setActiveSection('my_boost');
            }}
            className={`min-h-[42px] px-4 rounded-2xl text-xs font-extrabold flex items-center gap-2 border transition-all ${
              activeSection === 'my_boost'
                ? 'bg-[#FFD166] text-[#070A12] border-[#FFD166] shadow-[0_0_20px_rgba(255,209,102,0.3)]'
                : 'bg-[#111827] text-slate-300 border-[#28354E] hover:border-[#FFD166]/50'
            }`}
          >
            <Crown className="w-4 h-4" />
            <span>1. التحكم الكامل بحسابي الشخصي</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundFX.playClick();
              setActiveSection('radar');
            }}
            className={`min-h-[42px] px-4 rounded-2xl text-xs font-extrabold flex items-center gap-2 border transition-all ${
              activeSection === 'radar'
                ? 'bg-[#FF6B81] text-[#070A12] border-[#FF6B81] shadow-[0_0_20px_rgba(255,107,129,0.3)]'
                : 'bg-[#111827] text-slate-300 border-[#28354E] hover:border-[#FF6B81]/50'
            }`}
          >
            <Radar className="w-4 h-4" />
            <span>2. رادار كشف التلاعب التلقائي</span>
            <span
              dir="ltr"
              className={`px-2 py-0.5 rounded-full text-[10px] font-mono-num font-extrabold ${
                activeSection === 'radar'
                  ? 'bg-[#070A12] text-[#FF6B81]'
                  : 'bg-[#FF6B81]/20 text-[#FF6B81]'
              }`}
            >
              {radarSuspects.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundFX.playClick();
              setActiveSection('players');
            }}
            className={`min-h-[42px] px-4 rounded-2xl text-xs font-extrabold flex items-center gap-2 border transition-all ${
              activeSection === 'players'
                ? 'bg-[#4FF5D2] text-[#070A12] border-[#4FF5D2] shadow-[0_0_20px_rgba(79,245,210,0.3)]'
                : 'bg-[#111827] text-slate-300 border-[#28354E] hover:border-[#4FF5D2]/50'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>3. إدارة اللاعبين وسحب نقاط الغشاشين</span>
            <span
              dir="ltr"
              className={`px-2 py-0.5 rounded-full text-[10px] font-mono-num font-extrabold ${
                activeSection === 'players'
                  ? 'bg-[#070A12] text-[#4FF5D2]'
                  : 'bg-[#4FF5D2]/20 text-[#4FF5D2]'
              }`}
            >
              {players.length}
            </span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-6 flex-1">
          {/* ================================================================
              SECTION 1: MY ACCOUNT BOOST (التحكم الكامل بحسابي الشخصي)
             ================================================================ */}
          {activeSection === 'my_boost' && (
            <div className="space-y-5">
              {/* Current Owner Account Live Summary Bar */}
              <div className="rounded-3xl bg-gradient-to-r from-[#111827] via-[#1B253B] to-[#111827] border border-[#FFD166]/60 p-5">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-[#070A12] border border-[#FFD166] flex items-center justify-center text-3xl">
                      {account.countryFlag}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base sm:text-lg font-extrabold text-white">
                          {account.username}
                        </span>
                        <span
                          dir="ltr"
                          className="text-xs font-mono-num font-bold text-[#FFD166]"
                        >
                          {account.playerId}
                        </span>
                        <span className="px-2 py-0.5 rounded-lg bg-[#FFD166]/20 border border-[#FFD166] text-[10px] font-extrabold text-[#FFD166]">
                          حساب المالك
                        </span>
                      </div>
                      <div className="text-xs text-slate-300 mt-1 flex flex-wrap items-center gap-3 font-mono-num">
                        <span>
                          🪙 العملات:{' '}
                          <strong dir="ltr" className="text-[#FFD166]">
                            {account.coins}
                          </strong>
                        </span>
                        <span>·</span>
                        <span>
                          🏆 نقاط الشهر:{' '}
                          <strong dir="ltr" className="text-[#38D9A9]">
                            {account.monthlyPoints}
                          </strong>
                        </span>
                        <span>·</span>
                        <span>
                          ⚡ التصنيف:{' '}
                          <strong dir="ltr" className="text-[#4FF5D2]">
                            {account.rating}
                          </strong>
                        </span>
                        <span>·</span>
                        <span>
                          ⭐ الخبرة:{' '}
                          <strong dir="ltr" className="text-white">
                            {account.xp} XP (Lv.{account.level})
                          </strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 1-Click Rank #1 Leaderboard Boost */}
                  <button
                    type="button"
                    onClick={handleRankOneInstantBoost}
                    className="min-h-[44px] px-5 rounded-2xl bg-gradient-to-r from-[#FFD166] to-[#F59E0B] text-[#070A12] font-extrabold text-xs flex items-center gap-2 shadow-lg hover:brightness-110 transition-all"
                  >
                    <Trophy className="w-4 h-4" />
                    <span>🚀 تصدّر المركز الأول في البطولة فوراً</span>
                  </button>
                </div>

                {/* 4 Control Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Card A: Coins Control */}
                  <div className="rounded-2xl bg-[#070A12] border border-[#28354E] p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-[#FFD166] flex items-center gap-1.5">
                        <Coins className="w-4 h-4" />
                        <span>إضافة أو تعيين رصيد العملات الذهبية (Coins)</span>
                      </span>
                      <span
                        dir="ltr"
                        className="text-xs font-mono-num font-extrabold text-white"
                      >
                        🪙 {account.coins}
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="number"
                        min={0}
                        value={myCoinsInput}
                        onChange={e => setMyCoinsInput(e.target.value)}
                        placeholder="أدخل الرصيد المطلوب..."
                        className="flex-1 min-h-[40px] rounded-xl bg-[#111827] border border-[#28354E] focus:border-[#FFD166] focus:outline-none px-3 text-xs font-mono-num font-bold text-white"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          applyMyAccountUpdate(
                            {
                              coins: Math.max(
                                0,
                                Math.floor(Number(myCoinsInput) || 0)
                              ),
                            },
                            'تعيين رصيد العملات الذهبية من لوحة المالك',
                            `🪙 تم تعيين رصيد العملات الذهبية إلى ${Math.max(
                              0,
                              Math.floor(Number(myCoinsInput) || 0)
                            )} عملة فوراً!`
                          )
                        }
                        className="min-h-[40px] px-4 rounded-xl bg-[#FFD166] text-[#070A12] text-xs font-extrabold whitespace-nowrap"
                      >
                        تعيين الرصيد
                      </button>
                    </div>

                    <div className="grid grid-cols-4 gap-1.5">
                      {[
                        { label: '+500 🪙', delta: 500 },
                        { label: '+5,000 🪙', delta: 5000 },
                        { label: '+50,000 🪙', delta: 50000 },
                        { label: 'تصفير (0)', delta: -account.coins },
                      ].map((btn, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            const nextVal = Math.max(
                              0,
                              account.coins + btn.delta
                            );
                            applyMyAccountUpdate(
                              { coins: nextVal },
                              'تعديل سريع للعملات الذهبية (لوحة المالك)',
                              `🪙 تم تحديث رصيد عملاتك إلى ${nextVal} عملة!`
                            );
                          }}
                          className="py-2 px-2 rounded-xl bg-[#1B253B] hover:bg-[#28354E] border border-[#28354E] text-[11px] font-mono-num font-extrabold text-[#FFD166]"
                        >
                          {btn.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Card B: Monthly Points, Rating & XP Control */}
                  <div className="rounded-2xl bg-[#070A12] border border-[#28354E] p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-[#4FF5D2] flex items-center gap-1.5">
                        <Flame className="w-4 h-4" />
                        <span>نقاط البطولة الشهرية والتصنيف والخبرة (XP)</span>
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 mb-1">
                          نقاط الشهر 🏆
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={myMonthlyInput}
                          onChange={e => setMyMonthlyInput(e.target.value)}
                          className="w-full min-h-[38px] rounded-xl bg-[#111827] border border-[#28354E] px-2.5 text-xs font-mono-num font-bold text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 mb-1">
                          التصنيف (Rating) ⚡
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={myRatingInput}
                          onChange={e => setMyRatingInput(e.target.value)}
                          className="w-full min-h-[38px] rounded-xl bg-[#111827] border border-[#28354E] px-2.5 text-xs font-mono-num font-bold text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 mb-1">
                          الخبرة (XP) ⭐
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={myXpInput}
                          onChange={e => setMyXpInput(e.target.value)}
                          className="w-full min-h-[38px] rounded-xl bg-[#111827] border border-[#28354E] px-2.5 text-xs font-mono-num font-bold text-white"
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          applyMyAccountUpdate(
                            {
                              monthlyPoints: Math.max(
                                0,
                                Math.floor(Number(myMonthlyInput) || 0)
                              ),
                              rating: Math.max(
                                0,
                                Math.floor(Number(myRatingInput) || 0)
                              ),
                              xp: Math.max(
                                0,
                                Math.floor(Number(myXpInput) || 0)
                              ),
                            },
                            'تحديث النقاط والتصنيف والخبرة (لوحة المالك)',
                            '✅ تم تحديث نقاط الشهر والتصنيف التنافسي ومستوى الخبرة في Firestore فوراً!'
                          )
                        }
                        className="flex-1 min-h-[38px] px-4 rounded-xl bg-gradient-to-r from-[#4FF5D2] to-[#38D9A9] text-[#070A12] text-xs font-extrabold"
                      >
                        حفظ النقاط والتصنيف والـ XP فوراً
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          applyMyAccountUpdate(
                            {
                              monthlyPoints: account.monthlyPoints + 100,
                              rating: account.rating + 150,
                              xp: account.xp + 1000,
                            },
                            'زيادة سريعة للنقاط والتصنيف',
                            '🚀 تمت إضافة +100 نقطة شهرية و +150 تصنيف و +1000 XP!'
                          )
                        }
                        className="min-h-[38px] px-3 rounded-xl bg-[#1B253B] hover:bg-[#28354E] border border-[#4FF5D2]/40 text-[11px] font-extrabold text-[#4FF5D2]"
                      >
                        +100 نقطة سريعة
                      </button>
                    </div>
                  </div>

                  {/* Card C: Royal Gold VIP & Lifelines Refill */}
                  <div className="rounded-2xl bg-[#070A12] border border-[#28354E] p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-[#FFD166] flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4" />
                        <span>الباقة الملكية الذهبية (VIP) ووسائل المساعدة</span>
                      </span>
                      <span className="text-[11px] font-bold text-[#38D9A9]">
                        الحالية:{' '}
                        {
                          (
                            VIP_PACKAGES.find(v => v.id === account.vipTier) ||
                            VIP_PACKAGES[0]
                          ).nameAr
                        }
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center font-mono-num text-xs">
                      <div className="p-2 rounded-xl bg-[#111827] border border-[#28354E]">
                        <div className="text-[10px] text-slate-400">50:50</div>
                        <div className="text-sm font-extrabold text-[#4FF5D2]">
                          {account.lifelines.fiftyFifty}
                        </div>
                      </div>
                      <div className="p-2 rounded-xl bg-[#111827] border border-[#28354E]">
                        <div className="text-[10px] text-slate-400">
                          تجميد الوقت ❄️
                        </div>
                        <div className="text-sm font-extrabold text-[#FFD166]">
                          {account.lifelines.freezeTime}
                        </div>
                      </div>
                      <div className="p-2 rounded-xl bg-[#111827] border border-[#28354E]">
                        <div className="text-[10px] text-slate-400">
                          الحل الفوري ⚡
                        </div>
                        <div className="text-sm font-extrabold text-[#38D9A9]">
                          {account.lifelines.autoSolve}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="number"
                        min={1}
                        max={9999}
                        value={myLifelineCountInput}
                        onChange={e => setMyLifelineCountInput(e.target.value)}
                        className="w-24 min-h-[40px] rounded-xl bg-[#111827] border border-[#28354E] px-3 text-center text-xs font-mono-num font-bold text-white"
                      />
                      <button
                        type="button"
                        onClick={handleUnlockFullRoyalVipAndLifelines}
                        className="flex-1 min-h-[40px] px-4 rounded-xl bg-gradient-to-r from-[#FFD166] to-[#F59E0B] text-[#070A12] text-xs font-extrabold flex items-center justify-center gap-1.5"
                      >
                        <Crown className="w-4 h-4" />
                        <span>
                          تفعيل VIP الملكية مجاناً + تعبئة المساعدات
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Card D: Fair-Play (100/100) & Sportsmanship (5.0/5.0) Reset */}
                  <div className="rounded-2xl bg-[#070A12] border border-[#28354E] p-4 flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-extrabold text-[#38D9A9] flex items-center gap-1.5">
                          <ShieldCheck className="w-4 h-4" />
                          <span>مؤشر النزاهة وتقييم الروح الرياضية</span>
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-center font-mono-num text-xs">
                        <div className="p-2.5 rounded-xl bg-[#111827] border border-[#38D9A9]/40">
                          <div className="text-[10px] text-slate-400">
                            مؤشر النزاهة
                          </div>
                          <div
                            dir="ltr"
                            className="text-base font-extrabold text-[#38D9A9] mt-0.5"
                          >
                            {account.fairPlayScore} / 100
                          </div>
                        </div>
                        <div className="p-2.5 rounded-xl bg-[#111827] border border-[#FFD166]/40">
                          <div className="text-[10px] text-slate-400">
                            تقييم الروح الرياضية
                          </div>
                          <div
                            dir="ltr"
                            className="text-base font-extrabold text-[#FFD166] mt-0.5"
                          >
                            ⭐ {(account.sportsmanshipAvg ?? 5.0).toFixed(1)} /
                            5.0
                          </div>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleResetMyFairPlayAndSportsmanship}
                      className="w-full min-h-[42px] px-4 rounded-xl bg-gradient-to-r from-[#38D9A9] to-[#4FF5D2] text-[#070A12] text-xs font-extrabold flex items-center justify-center gap-1.5"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>
                        إعادة ضبط النزاهة إلى (100/100) والروح الرياضية إلى (5.0
                        / 5.0)
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================
              SECTION 2: ANTI-CHEAT RADAR (رادار كشف التلاعب التلقائي)
             ================================================================ */}
          {activeSection === 'radar' && (
            <div className="space-y-4">
              <div className="rounded-3xl bg-gradient-to-r from-[#111827] via-[#2A121D] to-[#111827] border border-[#FF6B81] p-5 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#FF6B81]/20 border border-[#FF6B81] flex items-center justify-center text-[#FF6B81]">
                    <Radar className="w-6 h-6 animate-spin" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-white">
                      رادار كشف التلاعب التلقائي (Anti-Cheat Radar)
                    </h3>
                    <p className="text-xs text-slate-300 mt-0.5">
                      يفرز تلقائياً أي لاعب ينخفض مؤشر النزاهة لديه عن{' '}
                      <span dir="ltr" className="font-mono-num text-[#FF6B81] font-bold">
                        (80/100)
                      </span>{' '}
                      أو تزيد نقاطه وعملاته بشكل مشبوه لسحب نقاطه أو تصفيرها بضغطة زر واحدة.
                    </p>
                  </div>
                </div>

                {radarSuspects.length > 0 && (
                  <button
                    type="button"
                    onClick={handlePunishAllRadarSuspects}
                    className="min-h-[42px] px-5 rounded-2xl bg-[#FF6B81] hover:bg-[#FF526B] text-[#070A12] text-xs font-extrabold flex items-center gap-2 shadow-lg"
                  >
                    <ShieldAlert className="w-4 h-4" />
                    <span>
                      تصفير وحظر جميع المرصودين ({radarSuspects.length}) بضغطة
                      واحدة
                    </span>
                  </button>
                )}
              </div>

              {radarSuspects.length === 0 ? (
                <div className="rounded-3xl bg-[#111827] border border-[#28354E] p-10 text-center">
                  <div className="text-4xl mb-2">🛡️</div>
                  <div className="text-sm font-extrabold text-white mb-1">
                    لا يوجد أي تلاعب مرصود حالياً
                  </div>
                  <p className="text-xs text-slate-400">
                    جميع اللاعبين المسجلين يتمتعون بمؤشر نزاهة طبيعي (80/100 فأعلى).
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {radarSuspects.map(suspect => {
                    const reasons: string[] = [];
                    if (suspect.fairPlayScore < 80) {
                      reasons.push(
                        `مؤشر نزاهة منخفض (${suspect.fairPlayScore}/100)`
                      );
                    }
                    if (suspect.monthlyPoints >= 250) {
                      reasons.push(
                        `تضخم نقاط الشهر (${suspect.monthlyPoints} نقطة)`
                      );
                    }
                    if (suspect.coins >= 5000) {
                      reasons.push(
                        `تضخم رصيد العملات (${suspect.coins} عملة)`
                      );
                    }

                    return (
                      <div
                        key={suspect.playerId}
                        className="rounded-2xl bg-[#111827] border-2 border-[#FF6B81]/70 p-4 flex flex-wrap items-center justify-between gap-4"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-[#070A12] border border-[#FF6B81] flex items-center justify-center text-2xl shrink-0">
                            {suspect.countryFlag}
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-sm font-extrabold text-white">
                                {suspect.username}
                              </span>
                              <span
                                dir="ltr"
                                className="text-xs font-mono-num font-bold text-[#FFD166]"
                              >
                                {suspect.playerId}
                              </span>
                              {suspect.isBanned && (
                                <span className="px-2 py-0.5 rounded-md bg-[#FF6B81] text-[#070A12] text-[10px] font-extrabold">
                                  🚫 محظور ومخفي من المتصدرين
                                </span>
                              )}
                            </div>

                            {/* Radar Triggers */}
                            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                              {reasons.map((r, i) => (
                                <span
                                  key={i}
                                  className="px-2.5 py-0.5 rounded-lg bg-[#FF6B81]/15 border border-[#FF6B81]/50 text-[11px] font-bold text-[#FF6B81] flex items-center gap-1"
                                >
                                  <AlertTriangle className="w-3 h-3" />
                                  <span>{r}</span>
                                </span>
                              ))}
                            </div>

                            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300 font-mono-num mt-2">
                              <span>
                                🏆 نقاط الشهر:{' '}
                                <strong className="text-[#FFD166]">
                                  {suspect.monthlyPoints}
                                </strong>
                              </span>
                              <span>·</span>
                              <span>
                                🪙 العملات:{' '}
                                <strong className="text-[#FFD166]">
                                  {suspect.coins}
                                </strong>
                              </span>
                              <span>·</span>
                              <span>
                                ⚡ التصنيف:{' '}
                                <strong className="text-[#4FF5D2]">
                                  {suspect.rating}
                                </strong>
                              </span>
                              <span>·</span>
                              <span>
                                🛡️ النزاهة:{' '}
                                <strong
                                  dir="ltr"
                                  className="text-[#FF6B81]"
                                >
                                  {suspect.fairPlayScore}/100
                                </strong>
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* 1-Click Radar Penalty Actions */}
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            disabled={busyUid === suspect.playerId}
                            onClick={() =>
                              handleMutateTargetPlayer(
                                suspect,
                                { monthlyPoints: 0, coins: 0 },
                                `💥 تم تصفير نقاط وعملات (${suspect.username}) فوراً في Firestore!`
                              )
                            }
                            className="min-h-[38px] px-3.5 rounded-xl bg-[#FF6B81] hover:bg-[#FF526B] text-[#070A12] text-xs font-extrabold"
                          >
                            💥 تصفير النقاط والعملات (0)
                          </button>

                          <button
                            type="button"
                            disabled={busyUid === suspect.playerId}
                            onClick={() =>
                              handleMutateTargetPlayer(
                                suspect,
                                {
                                  monthlyPoints: Math.floor(
                                    suspect.monthlyPoints / 2
                                  ),
                                },
                                `📉 تم سحب 50% من نقاط الشهر للاعب (${suspect.username})!`
                              )
                            }
                            className="min-h-[38px] px-3.5 rounded-xl bg-[#1B253B] hover:bg-[#28354E] border border-[#FFD166]/60 text-xs font-extrabold text-[#FFD166]"
                          >
                            📉 سحب 50% من النقاط
                          </button>

                          <button
                            type="button"
                            disabled={busyUid === suspect.playerId}
                            onClick={() =>
                              handleMutateTargetPlayer(
                                suspect,
                                { isBanned: !suspect.isBanned },
                                suspect.isBanned
                                  ? `🔓 تم فك الحظر عن (${suspect.username})!`
                                  : `🚫 تم حظر (${suspect.username}) وإخفاؤه من المتصدرين!`
                              )
                            }
                            className={`min-h-[38px] px-3.5 rounded-xl border text-xs font-extrabold ${
                              suspect.isBanned
                                ? 'bg-[#38D9A9]/20 border-[#38D9A9] text-[#38D9A9]'
                                : 'bg-[#070A12] border-[#FF6B81] text-[#FF6B81]'
                            }`}
                          >
                            {suspect.isBanned
                              ? '🔓 فك الحظر'
                              : '🚫 حظر وإخفاء (Ban)'}
                          </button>

                          <button
                            type="button"
                            disabled={busyUid === suspect.playerId}
                            onClick={() =>
                              handleMutateTargetPlayer(
                                suspect,
                                {
                                  fairPlayScore: 100,
                                  monthlyPoints: Math.min(
                                    140,
                                    suspect.monthlyPoints
                                  ),
                                  coins: Math.min(500, suspect.coins),
                                  isBanned: false,
                                },
                                `✅ تمت تسوية حالة اللاعب (${suspect.username}) وإعادة مؤشر النزاهة إلى 100/100!`
                              )
                            }
                            className="min-h-[38px] px-3.5 rounded-xl bg-[#1B253B] hover:bg-[#28354E] border border-[#38D9A9]/50 text-xs font-extrabold text-[#38D9A9]"
                          >
                            ✅ إعادة النزاهة 100%
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ================================================================
              SECTION 3: REAL-TIME PLAYERS & ANTI-CHEAT CONTROL
              (إدارة اللاعبين وسحب نقاط الغشاشين)
             ================================================================ */}
          {activeSection === 'players' && (
            <div className="space-y-4">
              {/* Search & Filter Bar */}
              <div className="rounded-2xl bg-[#111827] border border-[#28354E] p-4 flex flex-wrap items-center justify-between gap-3">
                <div className="relative flex-1 min-w-[240px]">
                  <Search className="w-4 h-4 text-[#4FF5D2] absolute start-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={playerSearch}
                    onChange={e => setPlayerSearch(e.target.value)}
                    placeholder="ابحث عن أي لاعب بالاسم أو الـ #ID..."
                    className="w-full min-h-[42px] rounded-xl bg-[#070A12] border border-[#28354E] focus:border-[#4FF5D2] focus:outline-none ps-10 pe-4 text-xs sm:text-sm text-white placeholder:text-slate-500"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  {(
                    [
                      { id: 'all', label: `الكل (${players.length})` },
                      {
                        id: 'active',
                        label: `بالبطولة (${
                          players.filter(p => !p.isBanned).length
                        })`,
                      },
                      {
                        id: 'suspects',
                        label: `مشتبه بهم (${radarSuspects.length})`,
                      },
                      {
                        id: 'banned',
                        label: `محظورون Ban (${
                          players.filter(p => p.isBanned).length
                        })`,
                      },
                    ] as const
                  ).map(tab => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => {
                        soundFX.playClick();
                        setPlayerFilter(tab.id);
                      }}
                      className={`px-3 py-2 rounded-xl text-xs font-extrabold border transition-all ${
                        playerFilter === tab.id
                          ? 'bg-[#4FF5D2] text-[#070A12] border-[#4FF5D2]'
                          : 'bg-[#070A12] text-slate-300 border-[#28354E]'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Players List */}
              <div className="space-y-3">
                {filteredPlayers.map(player => {
                  const isMe = player.playerId === account.playerId;
                  const editState = getCustomEditFor(player);
                  const isFlagged =
                    player.fairPlayScore < 80 ||
                    player.monthlyPoints >= 250 ||
                    player.coins >= 5000;

                  return (
                    <div
                      key={player.playerId}
                      className={`rounded-3xl border p-4 transition-all ${
                        player.isBanned
                          ? 'bg-[#1A0D14] border-[#FF6B81]/70'
                          : isMe
                          ? 'bg-[#111827] border-[#FFD166]'
                          : isFlagged
                          ? 'bg-[#111827] border-[#FF6B81]/50'
                          : 'bg-[#111827] border-[#28354E]'
                      }`}
                    >
                      {/* Top Row: Player Info & Ban Button */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-3 border-b border-[#28354E]">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-2xl bg-[#070A12] border border-[#28354E] flex items-center justify-center text-2xl shrink-0">
                            {player.countryFlag}
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-sm font-extrabold text-white">
                                {player.username}
                              </span>
                              <span
                                dir="ltr"
                                className="text-xs font-mono-num font-bold text-[#FFD166]"
                              >
                                {player.playerId}
                              </span>
                              <span className="px-2 py-0.5 rounded-md bg-[#070A12] border border-[#28354E] text-[10px] font-mono-num text-slate-300">
                                {player.countryFlag} {player.countryCode}
                              </span>
                              {isMe && (
                                <span className="px-2 py-0.5 rounded-md bg-[#FFD166]/20 border border-[#FFD166] text-[10px] font-extrabold text-[#FFD166]">
                                  👑 حسابك الشخصي
                                </span>
                              )}
                              {player.isBanned && (
                                <span className="px-2.5 py-0.5 rounded-md bg-[#FF6B81] text-[#070A12] text-[10px] font-extrabold">
                                  🚫 محظور ومخفي من المتصدرين (Banned)
                                </span>
                              )}
                            </div>

                            <div className="flex flex-wrap items-center gap-3 text-xs font-mono-num text-slate-300 mt-1">
                              <span>
                                🪙 العملات:{' '}
                                <strong dir="ltr" className="text-[#FFD166]">
                                  {player.coins}
                                </strong>
                              </span>
                              <span>·</span>
                              <span>
                                🏆 نقاط الشهر:{' '}
                                <strong dir="ltr" className="text-[#38D9A9]">
                                  {player.monthlyPoints}
                                </strong>
                              </span>
                              <span>·</span>
                              <span>
                                ⚡ التصنيف:{' '}
                                <strong dir="ltr" className="text-[#4FF5D2]">
                                  {player.rating}
                                </strong>
                              </span>
                              <span>·</span>
                              <span>
                                🛡️ مؤشر النزاهة:{' '}
                                <strong
                                  dir="ltr"
                                  className={
                                    player.fairPlayScore < 80
                                      ? 'text-[#FF6B81]'
                                      : 'text-[#38D9A9]'
                                  }
                                >
                                  {player.fairPlayScore}/100
                                </strong>
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Hide from Leaderboard / Ban Toggle Button */}
                        <button
                          type="button"
                          disabled={busyUid === player.playerId}
                          onClick={() =>
                            handleMutateTargetPlayer(
                              player,
                              { isBanned: !player.isBanned },
                              player.isBanned
                                ? `🔓 تم إلغاء حظر اللاعب (${player.username}) وإعادته لجدول المتصدرين!`
                                : `🚫 تم حظر اللاعب (${player.username}) وإخفاؤه من المتصدرين ومنعه من الأونلاين فوراً!`
                            )
                          }
                          className={`min-h-[38px] px-4 rounded-xl border text-xs font-extrabold flex items-center gap-1.5 transition-colors ${
                            player.isBanned
                              ? 'bg-[#38D9A9] text-[#070A12] border-[#38D9A9]'
                              : 'bg-[#FF6B81]/15 hover:bg-[#FF6B81] text-[#FF6B81] hover:text-[#070A12] border-[#FF6B81]'
                          }`}
                        >
                          {player.isBanned ? (
                            <>
                              <Unlock className="w-3.5 h-3.5" />
                              <span>إلغاء الحظر وإظهار بالمتصدرين</span>
                            </>
                          ) : (
                            <>
                              <Ban className="w-3.5 h-3.5" />
                              <span>إخفاء من المتصدرين / حظر (Ban)</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* 3 Control Columns: Monthly Points | Coins | Rating & Fair-Play */}
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                        {/* 1. سحب / تعديل نقاط الشهر */}
                        <div className="p-3 rounded-2xl bg-[#070A12] border border-[#28354E] space-y-2">
                          <div className="text-[11px] font-extrabold text-[#38D9A9]">
                            🏆 سحب / تعديل نقاط الشهر ({player.monthlyPoints})
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            <button
                              type="button"
                              onClick={() =>
                                handleMutateTargetPlayer(
                                  player,
                                  { monthlyPoints: 0 },
                                  `💥 تم تصفير نقاط الشهر للاعب (${player.username}) إلى 0 فوراً!`
                                )
                              }
                              className="px-2.5 py-1.5 rounded-lg bg-[#FF6B81]/20 hover:bg-[#FF6B81] text-[#FF6B81] hover:text-[#070A12] border border-[#FF6B81]/50 text-[11px] font-extrabold transition-colors"
                            >
                              تصفير (0)
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleMutateTargetPlayer(
                                  player,
                                  {
                                    monthlyPoints: Math.max(
                                      0,
                                      player.monthlyPoints - 50
                                    ),
                                  },
                                  `📉 تم خصم 50 نقطة شهرية من (${player.username})!`
                                )
                              }
                              className="px-2.5 py-1.5 rounded-lg bg-[#1B253B] hover:bg-[#28354E] text-slate-200 text-[11px] font-mono-num font-bold"
                            >
                              -50
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleMutateTargetPlayer(
                                  player,
                                  {
                                    monthlyPoints: Math.max(
                                      0,
                                      player.monthlyPoints - 100
                                    ),
                                  },
                                  `📉 تم خصم 100 نقطة شهرية من (${player.username})!`
                                )
                              }
                              className="px-2.5 py-1.5 rounded-lg bg-[#1B253B] hover:bg-[#28354E] text-slate-200 text-[11px] font-mono-num font-bold"
                            >
                              -100
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleMutateTargetPlayer(
                                  player,
                                  {
                                    monthlyPoints: player.monthlyPoints + 100,
                                  },
                                  `📈 تمت زيادة +100 نقطة شهرية للاعب (${player.username})!`
                                )
                              }
                              className="px-2.5 py-1.5 rounded-lg bg-[#38D9A9]/20 hover:bg-[#38D9A9] text-[#38D9A9] hover:text-[#070A12] text-[11px] font-mono-num font-extrabold"
                            >
                              +100
                            </button>
                          </div>
                          <div className="flex gap-1.5">
                            <input
                              type="number"
                              min={0}
                              value={editState.monthlyPoints}
                              onChange={e =>
                                updateCustomEditField(
                                  player,
                                  'monthlyPoints',
                                  e.target.value
                                )
                              }
                              className="flex-1 min-h-[34px] rounded-lg bg-[#111827] border border-[#28354E] px-2.5 text-xs font-mono-num text-white"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                handleMutateTargetPlayer(
                                  player,
                                  {
                                    monthlyPoints: Math.max(
                                      0,
                                      Math.floor(
                                        Number(editState.monthlyPoints) || 0
                                      )
                                    ),
                                  },
                                  `✅ تم تعديل نقاط الشهر للاعب (${player.username}) في Firestore!`
                                )
                              }
                              className="px-3 rounded-lg bg-[#38D9A9] text-[#070A12] text-[11px] font-extrabold"
                            >
                              تعيين
                            </button>
                          </div>
                        </div>

                        {/* 2. سحب / تعديل العملات */}
                        <div className="p-3 rounded-2xl bg-[#070A12] border border-[#28354E] space-y-2">
                          <div className="text-[11px] font-extrabold text-[#FFD166]">
                            🪙 سحب / تعديل العملات ({player.coins})
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            <button
                              type="button"
                              onClick={() =>
                                handleMutateTargetPlayer(
                                  player,
                                  { coins: 0 },
                                  `💥 تم تصفير رصيد العملات الذهبية للاعب (${player.username}) فوراً!`
                                )
                              }
                              className="px-2.5 py-1.5 rounded-lg bg-[#FF6B81]/20 hover:bg-[#FF6B81] text-[#FF6B81] hover:text-[#070A12] border border-[#FF6B81]/50 text-[11px] font-extrabold transition-colors"
                            >
                              تصفير (0)
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleMutateTargetPlayer(
                                  player,
                                  { coins: Math.max(0, player.coins - 100) },
                                  `📉 تم خصم 100 عملة ذهبية من (${player.username})!`
                                )
                              }
                              className="px-2.5 py-1.5 rounded-lg bg-[#1B253B] hover:bg-[#28354E] text-slate-200 text-[11px] font-mono-num font-bold"
                            >
                              -100
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleMutateTargetPlayer(
                                  player,
                                  { coins: Math.max(0, player.coins - 500) },
                                  `📉 تم خصم 500 عملة ذهبية من (${player.username})!`
                                )
                              }
                              className="px-2.5 py-1.5 rounded-lg bg-[#1B253B] hover:bg-[#28354E] text-slate-200 text-[11px] font-mono-num font-bold"
                            >
                              -500
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleMutateTargetPlayer(
                                  player,
                                  { coins: player.coins + 500 },
                                  `📈 تمت إضافة +500 عملة ذهبية للاعب (${player.username})!`
                                )
                              }
                              className="px-2.5 py-1.5 rounded-lg bg-[#FFD166]/20 hover:bg-[#FFD166] text-[#FFD166] hover:text-[#070A12] text-[11px] font-mono-num font-extrabold"
                            >
                              +500
                            </button>
                          </div>
                          <div className="flex gap-1.5">
                            <input
                              type="number"
                              min={0}
                              value={editState.coins}
                              onChange={e =>
                                updateCustomEditField(
                                  player,
                                  'coins',
                                  e.target.value
                                )
                              }
                              className="flex-1 min-h-[34px] rounded-lg bg-[#111827] border border-[#28354E] px-2.5 text-xs font-mono-num text-white"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                handleMutateTargetPlayer(
                                  player,
                                  {
                                    coins: Math.max(
                                      0,
                                      Math.floor(Number(editState.coins) || 0)
                                    ),
                                  },
                                  `✅ تم تعديل رصيد العملات للاعب (${player.username}) في Firestore!`
                                )
                              }
                              className="px-3 rounded-lg bg-[#FFD166] text-[#070A12] text-[11px] font-extrabold"
                            >
                              تعيين
                            </button>
                          </div>
                        </div>

                        {/* 3. تعديل التصنيف والنزاهة */}
                        <div className="p-3 rounded-2xl bg-[#070A12] border border-[#28354E] space-y-2">
                          <div className="text-[11px] font-extrabold text-[#4FF5D2]">
                            ⚡ تعديل التصنيف ({player.rating}) والنزاهة (
                            {player.fairPlayScore}/100)
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            <button
                              type="button"
                              onClick={() =>
                                handleMutateTargetPlayer(
                                  player,
                                  {
                                    rating: Math.max(800, player.rating - 200),
                                  },
                                  `📉 تم خفض تصنيف (${player.username}) بمقدار 200 نقطة!`
                                )
                              }
                              className="px-2.5 py-1.5 rounded-lg bg-[#1B253B] hover:bg-[#28354E] text-slate-200 text-[11px] font-bold"
                            >
                              تصنيف -200
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleMutateTargetPlayer(
                                  player,
                                  { fairPlayScore: 40 },
                                  `⚠️ تم خفض مؤشر النزاهة للاعب (${player.username}) إلى 40/100!`
                                )
                              }
                              className="px-2.5 py-1.5 rounded-lg bg-[#FF6B81]/20 hover:bg-[#FF6B81] text-[#FF6B81] hover:text-[#070A12] text-[11px] font-extrabold"
                            >
                              نزاهة 40%
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleMutateTargetPlayer(
                                  player,
                                  { fairPlayScore: 100 },
                                  `🛡️ تمت إعادة مؤشر النزاهة للاعب (${player.username}) إلى 100/100!`
                                )
                              }
                              className="px-2.5 py-1.5 rounded-lg bg-[#38D9A9]/20 hover:bg-[#38D9A9] text-[#38D9A9] hover:text-[#070A12] text-[11px] font-extrabold"
                            >
                              نزاهة 100%
                            </button>
                          </div>
                          <div className="flex gap-1.5">
                            <input
                              type="number"
                              min={0}
                              value={editState.rating}
                              onChange={e =>
                                updateCustomEditField(
                                  player,
                                  'rating',
                                  e.target.value
                                )
                              }
                              placeholder="التصنيف"
                              className="w-1/2 min-h-[34px] rounded-lg bg-[#111827] border border-[#28354E] px-2 text-xs font-mono-num text-white"
                            />
                            <input
                              type="number"
                              min={0}
                              max={100}
                              value={editState.fairPlayScore}
                              onChange={e =>
                                updateCustomEditField(
                                  player,
                                  'fairPlayScore',
                                  e.target.value
                                )
                              }
                              placeholder="النزاهة"
                              className="w-1/2 min-h-[34px] rounded-lg bg-[#111827] border border-[#28354E] px-2 text-xs font-mono-num text-white"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                handleMutateTargetPlayer(
                                  player,
                                  {
                                    rating: Math.max(
                                      0,
                                      Math.floor(Number(editState.rating) || 0)
                                    ),
                                    fairPlayScore: Math.max(
                                      0,
                                      Math.min(
                                        100,
                                        Math.floor(
                                          Number(editState.fairPlayScore) || 0
                                        )
                                      )
                                    ),
                                  },
                                  `✅ تم تحديث التصنيف ومؤشر النزاهة للاعب (${player.username})!`
                                )
                              }
                              className="px-3 rounded-lg bg-[#4FF5D2] text-[#070A12] text-[11px] font-extrabold shrink-0"
                            >
                              حفظ
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
