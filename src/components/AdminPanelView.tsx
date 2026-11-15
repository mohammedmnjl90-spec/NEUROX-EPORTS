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
  deleteOwnerPromoVipCode,
  generateOwnerPromoVipCode,
  loadHourlyAdConfig,
  loadOwnerPlayerOverrides,
  loadPromoVipCodes,
  loadVipPaymentRequests,
  ownerActivatePlayerVipInCloudAndLocal,
  saveHourlyAdConfig,
  saveOwnerPlayerOverride,
  saveVipPaymentRequests,
} from '../services/storage';
import {
  CloudManagedPlayer,
  EconomyLedgerEntry,
  HourlyAdConfig,
  PlayerAccount,
  PromoVipCode,
  VipPaymentRequest,
  VipTier,
} from '../types';
import { soundFX } from '../utils/sound';
import {
  AlertTriangle,
  ArrowRight,
  Ban,
  CheckCircle2,
  Coins,
  Copy,
  CreditCard,
  Crown,
  Flame,
  Megaphone,
  Plus,
  Radar,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Ticket,
  Trash2,
  Trophy,
  Unlock,
  Users,
  X,
} from 'lucide-react';

export interface AdminPanelViewProps {
  account: PlayerAccount;
  onUpdateAccount: (updated: PlayerAccount, toastMsg?: string) => void;
  onClose: () => void;
}

type AdminFilterMode = 'all' | 'radar_low_fairplay' | 'active' | 'banned';

export const AdminPanelView: React.FC<AdminPanelViewProps> = ({
  account,
  onUpdateAccount,
  onClose,
}) => {
  const [players, setPlayers] = useState<CloudManagedPlayer[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterMode, setFilterMode] = useState<AdminFilterMode>('all');
  const [radarOnlyMode, setRadarOnlyMode] = useState<boolean>(false);
  const [showMyBoostPanel, setShowMyBoostPanel] = useState<boolean>(true);
  const [busyPlayerId, setBusyPlayerId] = useState<string | null>(null);
  const [feedbackBanner, setFeedbackBanner] = useState<string | null>(null);

  // Owner's personal account boost inputs
  const [myCoinsInput, setMyCoinsInput] = useState<string>(
    String(account.coins)
  );
  const [myPointsInput, setMyPointsInput] = useState<string>(
    String(account.monthlyPoints)
  );
  const [myRatingInput, setMyRatingInput] = useState<string>(
    String(account.rating)
  );
  const [myXpInput, setMyXpInput] = useState<string>(String(account.xp));
  const [myLifelinesQty, setMyLifelinesQty] = useState<string>('99');

  // Inline custom numeric inputs next to each player
  const [rowInputs, setRowInputs] = useState<
    Record<
      string,
      {
        coins: string;
        monthlyPoints: string;
        rating: string;
        fairPlayScore: string;
      }
    >
  >({});

  // Monetization 1: Ads & Promo/VIP Codes Management State
  const [showAdsAndCodesPanel, setShowAdsAndCodesPanel] = useState<boolean>(true);
  const [adConfig, setAdConfig] = useState<HourlyAdConfig>(() =>
    loadHourlyAdConfig()
  );
  const [promoCodes, setPromoCodes] = useState<PromoVipCode[]>(() =>
    loadPromoVipCodes()
  );
  const [newCodeRewardType, setNewCodeRewardType] = useState<'vip' | 'coins'>('vip');
  const [newCodeVipTier, setNewCodeVipTier] = useState<VipTier>('royal_gold');
  const [newCodeBonusCoins, setNewCodeBonusCoins] = useState<string>('250');
  const [newCodeMaxUses, setNewCodeMaxUses] = useState<string>('1');
  const [newCodeCustomStr, setNewCodeCustomStr] = useState<string>('');
  const [newCodeNote, setNewCodeNote] = useState<string>('');

  // Monetization 2: VIP Payment Requests State
  const [showPaymentRequestsPanel, setShowPaymentRequestsPanel] =
    useState<boolean>(true);
  const [paymentRequests, setPaymentRequests] = useState<VipPaymentRequest[]>(
    () => loadVipPaymentRequests()
  );

  useEffect(() => {
    setMyCoinsInput(String(account.coins));
    setMyPointsInput(String(account.monthlyPoints));
    setMyRatingInput(String(account.rating));
    setMyXpInput(String(account.xp));
  }, [account.coins, account.monthlyPoints, account.rating, account.xp]);

  // Seed & subscribe in real-time to Firestore `users` and `players` collections
  useEffect(() => {
    seedOwnerFirestoreUsers(account, loadOwnerPlayerOverrides()).catch(() => {});

    const unsub = subscribeToOwnerAllPlayers(
      account,
      loadOwnerPlayerOverrides,
      livePlayers => {
        setPlayers(livePlayers);
      }
    );

    return () => {
      unsub();
    };
  }, [account]);

  const showFeedback = (msg: string) => {
    setFeedbackBanner(msg);
    window.setTimeout(() => {
      setFeedbackBanner(prev => (prev === msg ? null : prev));
    }, 4500);
  };

  const getRowEditValues = (p: CloudManagedPlayer) => {
    return (
      rowInputs[p.playerId] || {
        coins: String(p.coins),
        monthlyPoints: String(p.monthlyPoints),
        rating: String(p.rating),
        fairPlayScore: String(p.fairPlayScore),
      }
    );
  };

  const setRowEditField = (
    p: CloudManagedPlayer,
    field: 'coins' | 'monthlyPoints' | 'rating' | 'fairPlayScore',
    val: string
  ) => {
    const current = getRowEditValues(p);
    setRowInputs(prev => ({
      ...prev,
      [p.playerId]: {
        ...current,
        [field]: val,
      },
    }));
  };

  // Update Owner's own account + sync to Firestore immediately
  const handleUpdateMyOwnerAccount = async (
    patch: Partial<PlayerAccount>,
    ledgerReason: string,
    msg: string
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
        id: `ldg_admin_${Date.now()}`,
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

    const ownerRecord: CloudManagedPlayer = {
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

    saveOwnerPlayerOverride(ownerRecord);
    onUpdateAccount(updatedAccount, msg);
    await syncPlayerToCloud(updatedAccount);
    await ownerMutatePlayerInFirestore(ownerRecord, ownerRecord);
    showFeedback(msg);
  };

  // Mutate any player in Firestore (`users` & `players` collections)
  const handleMutatePlayer = async (
    target: CloudManagedPlayer,
    patch: Partial<CloudManagedPlayer>,
    msg: string
  ) => {
    soundFX.playClick();
    setBusyPlayerId(target.playerId);
    try {
      if (
        target.playerId === account.playerId ||
        target.uid === account.uid
      ) {
        await handleUpdateMyOwnerAccount(
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
          msg
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
      setRowInputs(prev => ({
        ...prev,
        [updated.playerId]: {
          coins: String(updated.coins),
          monthlyPoints: String(updated.monthlyPoints),
          rating: String(updated.rating),
          fairPlayScore: String(updated.fairPlayScore),
        },
      }));
      showFeedback(msg);
    } finally {
      setBusyPlayerId(null);
    }
  };

  // Anti-Cheat Radar: automatically identifies players with low Fair-Play (< 80)
  // or suspiciously inflated points/coins
  const lowFairPlayPlayers = useMemo(
    () => players.filter(p => p.fairPlayScore < 80),
    [players]
  );

  const suspiciousPlayers = useMemo(
    () =>
      players.filter(
        p =>
          p.playerId !== account.playerId &&
          (p.fairPlayScore < 80 || p.monthlyPoints >= 250 || p.coins >= 5000)
      ),
    [players, account.playerId]
  );

  const visiblePlayers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return players.filter(p => {
      if (radarOnlyMode || filterMode === 'radar_low_fairplay') {
        if (
          !(p.fairPlayScore < 80 || p.monthlyPoints >= 250 || p.coins >= 5000)
        ) {
          return false;
        }
      } else if (filterMode === 'active' && p.isBanned) {
        return false;
      } else if (filterMode === 'banned' && !p.isBanned) {
        return false;
      }

      if (!q) return true;
      return (
        p.username.toLowerCase().includes(q) ||
        p.playerId.toLowerCase().includes(q) ||
        p.uid.toLowerCase().includes(q)
      );
    });
  }, [players, searchQuery, filterMode, radarOnlyMode]);

  // 1-Click Rank #1 Boost for Owner
  const handleRankOneBoost = async () => {
    const topOther = players
      .filter(p => p.playerId !== account.playerId && !p.isBanned)
      .reduce((max, p) => Math.max(max, p.monthlyPoints), 150);
    const nextPoints = Math.max(account.monthlyPoints, topOther + 50);
    const nextRating = Math.max(account.rating, 2500);
    const nextXp = Math.max(account.xp, 6500);

    await handleUpdateMyOwnerAccount(
      {
        monthlyPoints: nextPoints,
        rating: nextRating,
        xp: nextXp,
        isBanned: false,
      },
      'تصدر البطولة الشهرية من لوحة المالك',
      `👑 تم رفع نقاطك الشهرية إلى ${nextPoints} والتصنيف إلى ${nextRating} لتتصدر المركز الأول فوراً!`
    );
  };

  // 1-Click Activate Royal Gold VIP & Lifelines
  const handleActivateRoyalVipAndLifelines = async () => {
    const qty = Math.max(
      1,
      Math.min(9999, Math.floor(Number(myLifelinesQty) || 99))
    );
    await handleUpdateMyOwnerAccount(
      {
        vipTier: 'royal_gold',
        lifelines: {
          fiftyFifty: qty,
          freezeTime: qty,
          autoSolve: qty,
        },
        ownedBorders: PROFILE_BORDERS_CATALOG.map(b => b.id),
        equippedBorder: 'royal_gold_frame',
        ownedThemes: UI_THEMES_CATALOG.map(th => th.id),
      },
      'تفعيل VIP الملكية وتعبئة المساعدات مجاناً',
      `👑 تم تفعيل الباقة الملكية الذهبية (VIP) مجاناً وتعبئة جميع وسائل المساعدة (×${qty})!`
    );
  };

  // 1-Click Punish All Low Fair-Play (< 80) Suspects
  const handleZeroAndBanAllRadarPlayers = async () => {
    const targets =
      lowFairPlayPlayers.length > 0 ? lowFairPlayPlayers : suspiciousPlayers;
    if (targets.length === 0) return;
    soundFX.playClick();
    for (const t of targets) {
      if (t.playerId === account.playerId) continue;
      const updated = await ownerMutatePlayerInFirestore(t, {
        monthlyPoints: 0,
        coins: 0,
        rating: 800,
        isBanned: true,
      });
      saveOwnerPlayerOverride(updated);
    }
    showFeedback(
      `🚨 تم تصفير نقاط وعملات جميع المرصودين في رادار التلاعب (${targets.length}) وحظرهم من المتصدرين!`
    );
  };

  // Save Hourly Ad & Payment Gateway Configuration
  const handleSaveAdConfig = () => {
    soundFX.playCorrect();
    const saved = saveHourlyAdConfig(adConfig);
    setAdConfig(saved);
    showFeedback(
      `📺 تم حفظ إعدادات إعلان الساعة التلقائي (${saved.countdownSeconds} ثوانٍ) وروابط بوابة الدفع بنجاح!`
    );
  };

  // Generate a new Promo / VIP Activation Code
  const handleCreatePromoCode = () => {
    soundFX.playCorrect();
    const created = generateOwnerPromoVipCode({
      customCode: newCodeCustomStr,
      rewardType: newCodeRewardType,
      vipTier: newCodeVipTier,
      bonusCoins: Math.max(0, Math.floor(Number(newCodeBonusCoins) || 0)),
      maxUses: Math.max(1, Math.floor(Number(newCodeMaxUses) || 1)),
      noteAr: newCodeNote,
    });
    setPromoCodes(loadPromoVipCodes());
    setNewCodeCustomStr('');
    setNewCodeNote('');
    showFeedback(`🎟️ تم توليد كود الشحن الجديد (${created.code}) بنجاح!`);
  };

  // Delete a Promo / VIP Code
  const handleDeletePromoCode = (codeStr: string) => {
    soundFX.playClick();
    const next = deleteOwnerPromoVipCode(codeStr);
    setPromoCodes(next);
    showFeedback(`🗑️ تم حذف الكود (${codeStr}) من القائمة.`);
  };

  // 1-Click Activate VIP Tier for any Player in Firestore & Local Registry
  const handleQuickActivatePlayerVip = async (
    target: CloudManagedPlayer,
    tier: VipTier
  ) => {
    soundFX.playVictory();
    setBusyPlayerId(target.playerId);
    try {
      const pkg = VIP_PACKAGES.find(p => p.id === tier) || VIP_PACKAGES[0];
      if (
        target.playerId === account.playerId ||
        target.uid === account.uid
      ) {
        await handleUpdateMyOwnerAccount(
          {
            vipTier: tier,
            coins: account.coins + pkg.instantCoins,
          },
          `تفعيل ${pkg.nameAr} من لوحة المالك`,
          `👑 تم تفعيل ${pkg.nameAr} ${pkg.badge} لحسابك وإضافة +${pkg.instantCoins} عملة!`
        );
        return;
      }

      const updated = await ownerActivatePlayerVipInCloudAndLocal(target, tier);
      setPlayers(prev =>
        prev.map(p => (p.playerId === updated.playerId ? updated : p))
      );
      showFeedback(
        `👑 تم تفعيل ${pkg.nameAr} ${pkg.badge} للاعب (${target.username} ${target.playerId}) في Firestore وإيقاف الإعلانات التلقائية عنه فوراً!`
      );
    } finally {
      setBusyPlayerId(null);
    }
  };

  // Approve or Reject a Player's VIP Subscription Request
  const handleResolveVipPaymentRequest = async (
    req: VipPaymentRequest,
    approve: boolean
  ) => {
    soundFX.playClick();
    if (approve) {
      const targetPlayer = players.find(
        p => p.playerId === req.playerId || p.uid === req.uid
      ) || {
        uid: req.uid,
        playerId: req.playerId,
        username: req.username,
        countryCode: 'SA',
        countryFlag: req.countryFlag || '🇸🇦',
        xp: 0,
        level: 1,
        coins: 50,
        monthlyPoints: 0,
        rating: 1200,
        vipTier: 'basic' as VipTier,
        fairPlayScore: 100,
        onlineWins: 0,
        totalMatches: 0,
        isBanned: false,
      };
      await handleQuickActivatePlayerVip(targetPlayer, req.requestedTier);
    }

    const nextReqs = paymentRequests.map(r =>
      r.id === req.id
        ? {
            ...r,
            status: (approve ? 'approved' : 'rejected') as
              | 'approved'
              | 'rejected',
            processedAt: Date.now(),
          }
        : r
    );
    setPaymentRequests(nextReqs);
    saveVipPaymentRequests(nextReqs);

    if (!approve) {
      showFeedback(`❌ تم رفض طلب الاشتراك الخاص باللاعب (${req.username}).`);
    }
  };

  return (
    <div dir="rtl" className="space-y-6 pb-16">
      {/* Top Stealth Owner Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-[#111827] via-[#1B253B] to-[#111827] border-2 border-[#FFD166] p-5 sm:p-6 shadow-[0_0_45px_rgba(255,209,102,0.2)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-[#FFD166]/20 border border-[#FFD166] flex items-center justify-center text-3xl shrink-0">
              👑
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg sm:text-xl font-extrabold text-white">
                  لوحة تحكم المالك السرية (Stealth Owner Control Panel)
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-[#38D9A9]/20 border border-[#38D9A9] text-[10px] font-extrabold text-[#38D9A9] flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#38D9A9] animate-ping" />
                  <span>متصل لحظياً بـ Cloud Firestore</span>
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                وصول سري حصري للمالك · إدارة حية لجميع اللاعبين في Firestore، وتعديل العملات والنقاط والتصنيف والنزاهة، ورادار كشف التلاعب التلقائي{' '}
                <span dir="ltr" className="font-mono-num text-[#FF6B81] font-bold">
                  (&lt;80)
                </span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                soundFX.playClick();
                setShowMyBoostPanel(prev => !prev);
              }}
              className="min-h-[42px] px-4 rounded-xl bg-[#FFD166]/15 hover:bg-[#FFD166]/25 border border-[#FFD166] text-xs font-extrabold text-[#FFD166] flex items-center gap-1.5"
            >
              <Crown className="w-4 h-4" />
              <span>
                {showMyBoostPanel
                  ? 'إخفاء قسم تعزيز حسابي'
                  : 'إظهار قسم تعزيز حسابي'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundFX.playClick();
                onClose();
              }}
              className="min-h-[42px] px-4 rounded-xl bg-[#070A12] hover:bg-[#FF6B81]/20 border border-[#28354E] hover:border-[#FF6B81] text-xs font-extrabold text-slate-200 hover:text-[#FF6B81] flex items-center gap-1.5 transition-colors"
            >
              <ArrowRight className="w-4 h-4" />
              <span>إغلاق والعودة للأصدقاء</span>
            </button>
          </div>
        </div>

        {/* 4 Live Firestore KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-[#28354E] font-mono-num">
          <div className="p-3 rounded-2xl bg-[#070A12] border border-[#28354E] flex items-center justify-between">
            <div>
              <div className="text-[11px] text-slate-400">
                إجمالي اللاعبين (Firestore)
              </div>
              <div className="text-lg font-extrabold text-[#4FF5D2] mt-0.5">
                {players.length}
              </div>
            </div>
            <Users className="w-5 h-5 text-[#4FF5D2]" />
          </div>

          <div className="p-3 rounded-2xl bg-[#070A12] border border-[#38D9A9]/40 flex items-center justify-between">
            <div>
              <div className="text-[11px] text-slate-400">
                النشطون بالمتصدرين
              </div>
              <div className="text-lg font-extrabold text-[#38D9A9] mt-0.5">
                {players.filter(p => !p.isBanned).length}
              </div>
            </div>
            <Trophy className="w-5 h-5 text-[#38D9A9]" />
          </div>

          <div className="p-3 rounded-2xl bg-[#070A12] border border-[#FF6B81]/60 flex items-center justify-between">
            <div>
              <div className="text-[11px] text-slate-400">
                رادار التلاعب (نزاهة &lt;80)
              </div>
              <div className="text-lg font-extrabold text-[#FF6B81] mt-0.5">
                {lowFairPlayPlayers.length}
              </div>
            </div>
            <Radar className="w-5 h-5 text-[#FF6B81] animate-pulse" />
          </div>

          <div className="p-3 rounded-2xl bg-[#070A12] border border-[#FFD166]/40 flex items-center justify-between">
            <div>
              <div className="text-[11px] text-slate-400">
                المحظورون (Banned)
              </div>
              <div className="text-lg font-extrabold text-[#FFD166] mt-0.5">
                {players.filter(p => p.isBanned).length}
              </div>
            </div>
            <Ban className="w-5 h-5 text-[#FFD166]" />
          </div>
        </div>
      </div>

      {/* Live Action Feedback Toast */}
      {feedbackBanner && (
        <div className="rounded-2xl bg-[#38D9A9]/15 border border-[#38D9A9] px-4 py-3 text-xs font-extrabold text-[#38D9A9] flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{feedbackBanner}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackBanner(null)}
            className="text-slate-300 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ====================================================================
          SECTION 1: MY ACCOUNT BOOST (التحكم الكامل بحسابي الشخصي)
         ==================================================================== */}
      {showMyBoostPanel && (
        <div className="rounded-3xl bg-[#111827] border border-[#FFD166]/60 p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#28354E]">
            <div className="flex items-center gap-2.5">
              <Crown className="w-5 h-5 text-[#FFD166]" />
              <div>
                <h2 className="text-base font-extrabold text-white">
                  التحكم الكامل بحسابي الشخصي ({account.username}{' '}
                  <span dir="ltr" className="text-[#FFD166] font-mono-num">
                    {account.playerId}
                  </span>
                  )
                </h2>
                <p className="text-xs text-slate-400">
                  تحديث فوري لرصيد عملاتك الذهبية ونقاط البطولة والتصنيف وباقة VIP الملكية ومؤشر النزاهة في Firestore
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleRankOneBoost}
              className="min-h-[42px] px-5 rounded-2xl bg-gradient-to-r from-[#FFD166] to-[#F59E0B] text-[#070A12] font-extrabold text-xs flex items-center gap-2 shadow-lg hover:brightness-110 transition-all"
            >
              <Trophy className="w-4 h-4" />
              <span>🚀 تصدّر المركز الأول في البطولة فوراً</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* 1. My Coins */}
            <div className="p-3.5 rounded-2xl bg-[#070A12] border border-[#28354E] space-y-2.5">
              <div className="flex items-center justify-between text-xs font-extrabold text-[#FFD166]">
                <span className="flex items-center gap-1">
                  <Coins className="w-3.5 h-3.5" />
                  <span>رصيد العملات (Coins)</span>
                </span>
                <span dir="ltr" className="font-mono-num text-white">
                  🪙 {account.coins}
                </span>
              </div>
              <div className="flex gap-1.5">
                <input
                  type="number"
                  min={0}
                  value={myCoinsInput}
                  onChange={e => setMyCoinsInput(e.target.value)}
                  className="flex-1 min-h-[38px] rounded-xl bg-[#111827] border border-[#28354E] px-2.5 text-xs font-mono-num font-bold text-white"
                />
                <button
                  type="button"
                  onClick={() =>
                    handleUpdateMyOwnerAccount(
                      {
                        coins: Math.max(
                          0,
                          Math.floor(Number(myCoinsInput) || 0)
                        ),
                      },
                      'تعيين رصيد العملات من لوحة المالك',
                      `🪙 تم تعيين رصيد عملاتك الذهبية إلى ${Math.max(
                        0,
                        Math.floor(Number(myCoinsInput) || 0)
                      )} عملة!`
                    )
                  }
                  className="px-3 rounded-xl bg-[#FFD166] text-[#070A12] text-xs font-extrabold"
                >
                  تعيين
                </button>
              </div>
              <div className="grid grid-cols-3 gap-1">
                {[500, 5000, 50000].map(amt => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() =>
                      handleUpdateMyOwnerAccount(
                        { coins: account.coins + amt },
                        'إضافة عملات من لوحة المالك',
                        `🪙 تمت إضافة +${amt} عملة ذهبية لحسابك!`
                      )
                    }
                    className="py-1.5 rounded-lg bg-[#1B253B] hover:bg-[#28354E] text-[10px] font-mono-num font-extrabold text-[#FFD166]"
                  >
                    +{amt}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. My Points, Rating & XP */}
            <div className="p-3.5 rounded-2xl bg-[#070A12] border border-[#28354E] space-y-2.5">
              <div className="text-xs font-extrabold text-[#4FF5D2] flex items-center gap-1">
                <Flame className="w-3.5 h-3.5" />
                <span>نقاط الشهر والتصنيف والـ XP</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                <div>
                  <label className="block text-[9px] text-slate-400 mb-0.5">
                    نقاط الشهر
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={myPointsInput}
                    onChange={e => setMyPointsInput(e.target.value)}
                    className="w-full min-h-[34px] rounded-lg bg-[#111827] border border-[#28354E] px-2 text-xs font-mono-num font-bold text-white"
                  />
                </div>
                <div>
                  <label className="block text-[9px] text-slate-400 mb-0.5">
                    التصنيف
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={myRatingInput}
                    onChange={e => setMyRatingInput(e.target.value)}
                    className="w-full min-h-[34px] rounded-lg bg-[#111827] border border-[#28354E] px-2 text-xs font-mono-num font-bold text-white"
                  />
                </div>
                <div>
                  <label className="block text-[9px] text-slate-400 mb-0.5">
                    الخبرة XP
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={myXpInput}
                    onChange={e => setMyXpInput(e.target.value)}
                    className="w-full min-h-[34px] rounded-lg bg-[#111827] border border-[#28354E] px-2 text-xs font-mono-num font-bold text-white"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  handleUpdateMyOwnerAccount(
                    {
                      monthlyPoints: Math.max(
                        0,
                        Math.floor(Number(myPointsInput) || 0)
                      ),
                      rating: Math.max(
                        0,
                        Math.floor(Number(myRatingInput) || 0)
                      ),
                      xp: Math.max(0, Math.floor(Number(myXpInput) || 0)),
                    },
                    'تحديث نقاط الشهر والتصنيف والخبرة',
                    '✅ تم تحديث نقاط الشهر والتصنيف التنافسي والـ XP في Firestore!'
                  )
                }
                className="w-full min-h-[36px] rounded-xl bg-gradient-to-r from-[#4FF5D2] to-[#38D9A9] text-[#070A12] text-xs font-extrabold"
              >
                حفظ النقاط والتصنيف فوراً
              </button>
            </div>

            {/* 3. Royal VIP & Lifelines */}
            <div className="p-3.5 rounded-2xl bg-[#070A12] border border-[#28354E] space-y-2.5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs font-extrabold text-[#FFD166]">
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>باقة VIP الملكية والمساعدات</span>
                  </span>
                  <span className="text-[10px] text-[#38D9A9]">
                    {
                      (
                        VIP_PACKAGES.find(v => v.id === account.vipTier) ||
                        VIP_PACKAGES[0]
                      ).nameAr
                    }
                  </span>
                </div>
                <div className="text-[11px] text-slate-300 font-mono-num mt-1.5">
                  50:50 ({account.lifelines.fiftyFifty}) · تجميد (
                  {account.lifelines.freezeTime}) · حل فوري (
                  {account.lifelines.autoSolve})
                </div>
              </div>
              <div className="flex gap-1.5">
                <input
                  type="number"
                  min={1}
                  max={9999}
                  value={myLifelinesQty}
                  onChange={e => setMyLifelinesQty(e.target.value)}
                  className="w-16 min-h-[36px] rounded-xl bg-[#111827] border border-[#28354E] px-2 text-center text-xs font-mono-num font-bold text-white"
                />
                <button
                  type="button"
                  onClick={handleActivateRoyalVipAndLifelines}
                  className="flex-1 min-h-[36px] px-3 rounded-xl bg-gradient-to-r from-[#FFD166] to-[#F59E0B] text-[#070A12] text-[11px] font-extrabold"
                >
                  تفعيل VIP + تعبئة المساعدات
                </button>
              </div>
            </div>

            {/* 4. Reset Fair-Play & Sportsmanship */}
            <div className="p-3.5 rounded-2xl bg-[#070A12] border border-[#28354E] space-y-2.5 flex flex-col justify-between">
              <div>
                <div className="text-xs font-extrabold text-[#38D9A9] flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>النزاهة والروح الرياضية</span>
                </div>
                <div className="text-xs text-slate-300 font-mono-num mt-1.5 flex items-center justify-between">
                  <span>
                    النزاهة:{' '}
                    <strong dir="ltr" className="text-[#38D9A9]">
                      {account.fairPlayScore}/100
                    </strong>
                  </span>
                  <span>
                    الأخلاق:{' '}
                    <strong dir="ltr" className="text-[#FFD166]">
                      ⭐ {(account.sportsmanshipAvg ?? 5.0).toFixed(1)}/5.0
                    </strong>
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  handleUpdateMyOwnerAccount(
                    {
                      fairPlayScore: 100,
                      sportsmanshipAvg: 5.0,
                      isBanned: false,
                    },
                    'إعادة ضبط مؤشر النزاهة والروح الرياضية',
                    '🛡️ تم إعادة ضبط مؤشر النزاهة إلى (100/100) وتقييم الروح الرياضية إلى (5.0 / 5.0)!'
                  )
                }
                className="w-full min-h-[36px] px-3 rounded-xl bg-gradient-to-r from-[#38D9A9] to-[#4FF5D2] text-[#070A12] text-[11px] font-extrabold"
              >
                إعادة ضبط (100/100) و (5.0/5.0)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          SECTION 1.5: ADS & PROMO/VIP CODES MANAGEMENT (إدارة الإعلانات وأكواد الشحن)
         ==================================================================== */}
      <div className="rounded-3xl bg-[#111827] border border-[#4FF5D2]/60 p-5 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#28354E]">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#4FF5D2]/15 border border-[#4FF5D2] flex items-center justify-center text-[#4FF5D2]">
              <Megaphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white">
                إدارة الإعلانات وأكواد الشحن (Ads & Promo/VIP Codes)
              </h2>
              <p className="text-xs text-slate-400">
                توليد أكواد قسائم الشحن (لباقات VIP أو العملات) والتحكم في مدة وصورة/فيديو ورابط إعلان الساعة التلقائي
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              soundFX.playClick();
              setShowAdsAndCodesPanel(prev => !prev);
            }}
            className="min-h-[38px] px-3.5 rounded-xl bg-[#070A12] border border-[#28354E] text-xs font-bold text-[#4FF5D2]"
          >
            {showAdsAndCodesPanel ? 'طي القسم ▲' : 'عرض القسم ▼'}
          </button>
        </div>

        {showAdsAndCodesPanel && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Part A: Generate Promo / VIP Codes */}
            <div className="p-4 rounded-2xl bg-[#070A12] border border-[#FFD166]/40 space-y-3.5">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-[#FFD166] flex items-center gap-1.5">
                  <Ticket className="w-4 h-4" />
                  <span>توليد أكواد قسائم شحن (VIP أو عملات ذهبية)</span>
                </h3>
                <span className="text-[11px] font-mono-num text-slate-400">
                  الأكواد الفعالة: {promoCodes.length}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    نوع مكافأة الكود
                  </label>
                  <select
                    value={
                      newCodeRewardType === 'coins'
                        ? 'coins'
                        : `vip_${newCodeVipTier}`
                    }
                    onChange={e => {
                      const val = e.target.value;
                      if (val === 'coins') {
                        setNewCodeRewardType('coins');
                        setNewCodeBonusCoins('500');
                      } else {
                        setNewCodeRewardType('vip');
                        const tier = val.replace('vip_', '') as VipTier;
                        setNewCodeVipTier(tier);
                        const pkg = VIP_PACKAGES.find(p => p.id === tier);
                        setNewCodeBonusCoins(String(pkg?.instantCoins ?? 250));
                      }
                    }}
                    className="w-full min-h-[38px] rounded-xl bg-[#111827] border border-[#28354E] px-2.5 text-xs font-bold text-white"
                  >
                    <option value="vip_royal_gold">
                      👑 الباقة الملكية الذهبية ($9.99) + 250 🪙
                    </option>
                    <option value="vip_silver">
                      🥈 الباقة الفضية ($5.99) + 100 🪙
                    </option>
                    <option value="vip_bronze">
                      🥉 الباقة البرونزية ($2.99) + 50 🪙
                    </option>
                    <option value="coins">🪙 شحن عملات ذهبية فقط</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    العملات الذهبية المرفقة
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={newCodeBonusCoins}
                    onChange={e => setNewCodeBonusCoins(e.target.value)}
                    className="w-full min-h-[38px] rounded-xl bg-[#111827] border border-[#28354E] px-3 text-xs font-mono-num font-bold text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    كود مخصص (اختياري أو يولد آلياً)
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    value={newCodeCustomStr}
                    onChange={e =>
                      setNewCodeCustomStr(e.target.value.toUpperCase())
                    }
                    placeholder="مثال: WALEED-VIP-99"
                    className="w-full min-h-[38px] rounded-xl bg-[#111827] border border-[#28354E] px-3 text-xs font-mono-num font-bold text-[#FFD166]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    عدد مرات الاستخدام المسموحة
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10000}
                    value={newCodeMaxUses}
                    onChange={e => setNewCodeMaxUses(e.target.value)}
                    className="w-full min-h-[38px] rounded-xl bg-[#111827] border border-[#28354E] px-3 text-xs font-mono-num font-bold text-white"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleCreatePromoCode}
                className="w-full min-h-[40px] rounded-xl bg-gradient-to-r from-[#FFD166] to-[#F59E0B] text-[#070A12] text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-md"
              >
                <Plus className="w-4 h-4" />
                <span>توليد وحفظ كود الشحن الجديد فوراً</span>
              </button>

              {/* Active Promo Codes List */}
              <div className="space-y-2 max-h-56 overflow-y-auto pt-2 border-t border-[#28354E]">
                {promoCodes.map(item => (
                  <div
                    key={item.code}
                    className="p-2.5 rounded-xl bg-[#111827] border border-[#28354E] flex flex-wrap items-center justify-between gap-2 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          dir="ltr"
                          className="font-mono-num font-extrabold text-[#FFD166]"
                        >
                          {item.code}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-[#070A12] border border-[#28354E] text-[10px] font-mono-num text-slate-300">
                          استخدم: {item.usedByPlayerIds.length}/{item.maxUses}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {item.noteAr}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          soundFX.playClick();
                          navigator.clipboard
                            .writeText(item.code)
                            .catch(() => {});
                          showFeedback(
                            `📋 تم نسخ كود الشحن (${item.code}) لإرساله للاعب!`
                          );
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-[#1B253B] hover:bg-[#28354E] text-[11px] font-bold text-[#4FF5D2] flex items-center gap-1"
                      >
                        <Copy className="w-3 h-3" />
                        <span>نسخ</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeletePromoCode(item.code)}
                        className="p-1.5 rounded-lg bg-[#FF6B81]/15 hover:bg-[#FF6B81] text-[#FF6B81] hover:text-[#070A12]"
                        title="حذف الكود"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Part B: Hourly Interstitial Ad & Payment Links Configuration */}
            <div className="p-4 rounded-2xl bg-[#070A12] border border-[#4FF5D2]/40 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-[#4FF5D2] flex items-center gap-1.5">
                  <Megaphone className="w-4 h-4" />
                  <span>إعدادات إعلان الساعة التلقائي وبنر المالك</span>
                </h3>
                <label className="flex items-center gap-2 text-xs font-extrabold text-[#38D9A9] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={adConfig.enabled}
                    onChange={e =>
                      setAdConfig(prev => ({
                        ...prev,
                        enabled: e.target.checked,
                      }))
                    }
                    className="w-4 h-4 accent-[#38D9A9]"
                  />
                  <span>تفعيل إعلان الساعة</span>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    مدة العداد التنازلي للإعلان (ثوانٍ)
                  </label>
                  <input
                    type="number"
                    min={3}
                    max={30}
                    value={adConfig.countdownSeconds}
                    onChange={e =>
                      setAdConfig(prev => ({
                        ...prev,
                        countdownSeconds: Math.max(
                          3,
                          Math.min(30, Number(e.target.value) || 7)
                        ),
                      }))
                    }
                    className="w-full min-h-[38px] rounded-xl bg-[#111827] border border-[#28354E] px-3 text-xs font-mono-num font-bold text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    عنوان الإعلان الترويجي
                  </label>
                  <input
                    type="text"
                    value={adConfig.adTitle}
                    onChange={e =>
                      setAdConfig(prev => ({
                        ...prev,
                        adTitle: e.target.value,
                      }))
                    }
                    className="w-full min-h-[38px] rounded-xl bg-[#111827] border border-[#28354E] px-3 text-xs font-bold text-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    رابط صورة البنر الإعلاني (Image URL) أو الفيديو
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    value={adConfig.bannerImageUrl}
                    onChange={e =>
                      setAdConfig(prev => ({
                        ...prev,
                        bannerImageUrl: e.target.value,
                      }))
                    }
                    placeholder="https://..."
                    className="w-full min-h-[38px] rounded-xl bg-[#111827] border border-[#28354E] px-3 text-xs font-mono-num text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    الرابط المستهدف عند الضغط على الإعلان
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    value={adConfig.targetLinkUrl}
                    onChange={e =>
                      setAdConfig(prev => ({
                        ...prev,
                        targetLinkUrl: e.target.value,
                      }))
                    }
                    placeholder="#vip-store أو https://..."
                    className="w-full min-h-[38px] rounded-xl bg-[#111827] border border-[#28354E] px-3 text-xs font-mono-num text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    معلومات التحويل المحلي والتواصل مع المالك
                  </label>
                  <input
                    type="text"
                    value={adConfig.ownerContactInfo}
                    onChange={e =>
                      setAdConfig(prev => ({
                        ...prev,
                        ownerContactInfo: e.target.value,
                      }))
                    }
                    className="w-full min-h-[38px] rounded-xl bg-[#111827] border border-[#28354E] px-3 text-xs text-white"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleSaveAdConfig}
                className="w-full min-h-[40px] rounded-xl bg-gradient-to-r from-[#4FF5D2] to-[#38D9A9] text-[#070A12] text-xs font-extrabold shadow-md"
              >
                💾 حفظ إعدادات إعلان الساعة وبوابة الدفع
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ====================================================================
          SECTION 1.8: VIP PAYMENT REQUESTS (طلبات الدفع وتفعيل VIP المباشرة)
         ==================================================================== */}
      <div className="rounded-3xl bg-[#111827] border border-[#38D9A9]/60 p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#38D9A9]/15 border border-[#38D9A9] flex items-center justify-center text-[#38D9A9]">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-white">
                  طلبات الدفع وتفعيل باقات VIP (Payment Requests)
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-[#FFD166] text-[#070A12] text-xs font-mono-num font-extrabold">
                  {
                    paymentRequests.filter(r => r.status === 'pending')
                      .length
                  }{' '}
                  بانتظار التفعيل
                </span>
              </div>
              <p className="text-xs text-slate-400">
                طلبات الاشتراك والتحويل المرسلة من اللاعبين مع تفعيل فوري بضغطة زر واحدة في Cloud Firestore
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              soundFX.playClick();
              setPaymentRequests(loadVipPaymentRequests());
              setShowPaymentRequestsPanel(prev => !prev);
            }}
            className="min-h-[38px] px-3.5 rounded-xl bg-[#070A12] border border-[#28354E] text-xs font-bold text-[#38D9A9]"
          >
            {showPaymentRequestsPanel ? 'طي الطلبات ▲' : 'عرض الطلبات ▼'}
          </button>
        </div>

        {showPaymentRequestsPanel && (
          <div className="space-y-2.5">
            {paymentRequests.length === 0 ? (
              <div className="p-6 rounded-2xl bg-[#070A12] border border-[#28354E] text-center text-xs text-slate-400">
                لا توجد طلبات اشتراك معلقة حالياً. يمكنك أيضاً تفعيل أي باقة VIP لأي لاعب مباشرة من قائمته بالأسفل بضغطة زر!
              </div>
            ) : (
              paymentRequests.map(req => {
                const pkg =
                  VIP_PACKAGES.find(p => p.id === req.requestedTier) ||
                  VIP_PACKAGES[3];
                return (
                  <div
                    key={req.id}
                    className={`p-3.5 rounded-2xl border flex flex-wrap items-center justify-between gap-3 ${
                      req.status === 'pending'
                        ? 'bg-[#070A12] border-[#FFD166]'
                        : req.status === 'approved'
                        ? 'bg-[#070A12]/60 border-[#38D9A9]/40'
                        : 'bg-[#070A12]/40 border-[#FF6B81]/40'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{req.countryFlag}</span>
                      <div>
                        <div className="flex flex-wrap items-center gap-2 text-xs font-extrabold text-white">
                          <span>{req.username}</span>
                          <span
                            dir="ltr"
                            className="font-mono-num text-[#FFD166]"
                          >
                            {req.playerId}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-[#111827] border border-[#FFD166]/50 text-[#FFD166]">
                            {pkg.badge} {pkg.nameAr} ({req.priceUsdText})
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-300 mt-1">
                          المرجع / الحوالة: {req.transferReference}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {req.status === 'pending' ? (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              handleResolveVipPaymentRequest(req, true)
                            }
                            className="min-h-[36px] px-4 rounded-xl bg-[#38D9A9] text-[#070A12] text-xs font-extrabold"
                          >
                            ✅ موافقة وتفعيل VIP فوراً
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleResolveVipPaymentRequest(req, false)
                            }
                            className="min-h-[36px] px-3 rounded-xl bg-[#FF6B81]/20 text-[#FF6B81] text-xs font-extrabold"
                          >
                            ❌ رفض
                          </button>
                        </>
                      ) : (
                        <span
                          className={`px-3 py-1 rounded-xl text-xs font-extrabold ${
                            req.status === 'approved'
                              ? 'bg-[#38D9A9]/20 text-[#38D9A9]'
                              : 'bg-[#FF6B81]/20 text-[#FF6B81]'
                          }`}
                        >
                          {req.status === 'approved'
                            ? '✓ تم التفعيل'
                            : '✕ مرفوض'}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* ====================================================================
          SECTION 2: ANTI-CHEAT RADAR BANNER (رادار التلاعب التلقائي <80)
         ==================================================================== */}
      <div className="rounded-3xl bg-gradient-to-r from-[#111827] via-[#2A121D] to-[#111827] border-2 border-[#FF6B81]/80 p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#FF6B81]/20 border border-[#FF6B81] flex items-center justify-center text-[#FF6B81] shrink-0">
              <Radar className="w-6 h-6 animate-spin" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-extrabold text-white">
                  رادار التلاعب التلقائي (Anti-Cheat Radar)
                </h2>
                <span
                  dir="ltr"
                  className="px-2.5 py-0.5 rounded-full bg-[#FF6B81] text-[#070A12] text-xs font-mono-num font-extrabold"
                >
                  {lowFairPlayPlayers.length} (&lt;80)
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                يفرز آلياً أي لاعب تنخفض نزاهته عن{' '}
                <span dir="ltr" className="font-mono-num text-[#FF6B81] font-bold">
                  (80/100)
                </span>{' '}
                أو تتضخم نقاطه وعملاته بشكل غير طبيعي، لسحب نقاطه أو تصفيرها أو حظره فوراً.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                soundFX.playClick();
                const next = !radarOnlyMode;
                setRadarOnlyMode(next);
                setFilterMode(next ? 'radar_low_fairplay' : 'all');
              }}
              className={`min-h-[42px] px-4 rounded-2xl text-xs font-extrabold flex items-center gap-2 border transition-all ${
                radarOnlyMode || filterMode === 'radar_low_fairplay'
                  ? 'bg-[#FF6B81] text-[#070A12] border-[#FF6B81] shadow-[0_0_20px_rgba(255,107,129,0.35)]'
                  : 'bg-[#070A12] text-[#FF6B81] border-[#FF6B81]'
              }`}
            >
              <Radar className="w-4 h-4" />
              <span>
                {radarOnlyMode || filterMode === 'radar_low_fairplay'
                  ? 'إلغاء تصفية الرادار (عرض الكل)'
                  : `تصفية اللاعبين ذوي النزاهة المنخفضة (<80) (${lowFairPlayPlayers.length})`}
              </span>
            </button>

            {suspiciousPlayers.length > 0 && (
              <button
                type="button"
                onClick={handleZeroAndBanAllRadarPlayers}
                className="min-h-[42px] px-4 rounded-2xl bg-[#FF6B81]/20 hover:bg-[#FF6B81] text-[#FF6B81] hover:text-[#070A12] border border-[#FF6B81] text-xs font-extrabold flex items-center gap-1.5 transition-colors"
              >
                <ShieldAlert className="w-4 h-4" />
                <span>تصفير وحظر جميع المرصودين دفعة واحدة</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ====================================================================
          SECTION 3: LIVE FIRESTORE PLAYERS LIST & INSTANT CONTROLS
          (قائمة اللاعبين الحية في Firestore وأزرار التعديل والحظر)
         ==================================================================== */}
      <div className="rounded-3xl bg-[#111827] border border-[#28354E] p-5 space-y-4">
        {/* Search & Filter Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-[#4FF5D2] absolute start-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="ابحث عن أي لاعب في Firestore بالاسم أو الـ #ID..."
              className="w-full min-h-[44px] rounded-2xl bg-[#070A12] border border-[#28354E] focus:border-[#4FF5D2] focus:outline-none ps-10 pe-4 text-xs sm:text-sm text-white placeholder:text-slate-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                { id: 'all', label: `الكل (${players.length})` },
                {
                  id: 'radar_low_fairplay',
                  label: `🚨 رادار التلاعب <80 (${lowFairPlayPlayers.length})`,
                },
                {
                  id: 'active',
                  label: `النشطون بالمتصدرين (${
                    players.filter(p => !p.isBanned).length
                  })`,
                },
                {
                  id: 'banned',
                  label: `المحظورون Ban (${
                    players.filter(p => p.isBanned).length
                  })`,
                },
              ] as Array<{ id: AdminFilterMode; label: string }>
            ).map(tab => {
              const isSelected =
                filterMode === tab.id ||
                (tab.id === 'radar_low_fairplay' && radarOnlyMode);
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    soundFX.playClick();
                    setFilterMode(tab.id);
                    setRadarOnlyMode(tab.id === 'radar_low_fairplay');
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-extrabold border transition-all ${
                    isSelected
                      ? tab.id === 'radar_low_fairplay'
                        ? 'bg-[#FF6B81] text-[#070A12] border-[#FF6B81]'
                        : 'bg-[#4FF5D2] text-[#070A12] border-[#4FF5D2]'
                      : 'bg-[#070A12] text-slate-300 border-[#28354E] hover:border-slate-500'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Live Players Rows */}
        {visiblePlayers.length === 0 ? (
          <div className="py-12 text-center rounded-2xl bg-[#070A12] border border-[#28354E]">
            <div className="text-3xl mb-2">🛡️</div>
            <div className="text-sm font-extrabold text-white mb-1">
              لا يوجد لاعبون مطابقون لمعايير البحث أو التصفية الحالية
            </div>
            <p className="text-xs text-slate-400">
              يمكنك التبديل إلى تبويب "الكل" لعرض جميع اللاعبين المسجلين في Firestore.
            </p>
          </div>
        ) : (
          <div className="space-y-3.5">
            {visiblePlayers.map(player => {
              const isMe = player.playerId === account.playerId;
              const isLowFairPlay = player.fairPlayScore < 80;
              const isSuspicious =
                isLowFairPlay ||
                player.monthlyPoints >= 250 ||
                player.coins >= 5000;
              const vals = getRowEditValues(player);

              return (
                <div
                  key={player.playerId}
                  className={`rounded-3xl border p-4 transition-all ${
                    player.isBanned
                      ? 'bg-[#1A0D14] border-[#FF6B81]/80'
                      : isLowFairPlay
                      ? 'bg-[#17111C] border-2 border-[#FF6B81]'
                      : isMe
                      ? 'bg-[#0B1324] border-[#FFD166]'
                      : 'bg-[#070A12] border-[#28354E]'
                  }`}
                >
                  {/* Player Header Row: Identity, Live Stats Badges, and Ban Button */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-3 border-b border-[#28354E]">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-[#111827] border border-[#28354E] flex items-center justify-center text-2xl shrink-0">
                        {player.countryFlag}
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm sm:text-base font-extrabold text-white">
                            {player.username}
                          </span>
                          <span
                            dir="ltr"
                            className="text-xs font-mono-num font-bold text-[#FFD166]"
                          >
                            {player.playerId}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-[#111827] border border-[#28354E] text-[10px] font-mono-num text-slate-300">
                            {player.countryFlag} {player.countryCode}
                          </span>
                          {isMe && (
                            <span className="px-2 py-0.5 rounded-md bg-[#FFD166]/20 border border-[#FFD166] text-[10px] font-extrabold text-[#FFD166]">
                              👑 حساب المالك
                            </span>
                          )}
                          {isLowFairPlay && (
                            <span className="px-2.5 py-0.5 rounded-md bg-[#FF6B81]/20 border border-[#FF6B81] text-[10px] font-extrabold text-[#FF6B81] flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              <span dir="ltr">
                                نزاهة منخفضة ({player.fairPlayScore}/100)
                              </span>
                            </span>
                          )}
                          {!isLowFairPlay && isSuspicious && !isMe && (
                            <span className="px-2.5 py-0.5 rounded-md bg-[#FFD166]/20 border border-[#FFD166] text-[10px] font-extrabold text-[#FFD166]">
                              ⚠️ تضخم نقاط/عملات مشبوه
                            </span>
                          )}
                          {player.isBanned && (
                            <span className="px-2.5 py-0.5 rounded-md bg-[#FF6B81] text-[#070A12] text-[10px] font-extrabold">
                              🚫 محظور ومخفي من المتصدرين (Banned)
                            </span>
                          )}
                        </div>

                        {/* Live Firestore Values Summary */}
                        <div className="flex flex-wrap items-center gap-3 text-xs font-mono-num text-slate-300 mt-1.5">
                          <span>
                            🪙 العملات:{' '}
                            <strong dir="ltr" className="text-[#FFD166]">
                              {player.coins}
                            </strong>
                          </span>
                          <span>·</span>
                          <span>
                            🏆 النقاط:{' '}
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
                            🛡️ النزاهة:{' '}
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

                    {/* Quick Ban / Unban & Zero-Out Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        disabled={busyPlayerId === player.playerId}
                        onClick={() =>
                          handleMutatePlayer(
                            player,
                            { monthlyPoints: 0, coins: 0 },
                            `💥 تم تصفير النقاط والعملات للاعب (${player.username}) فوراً!`
                          )
                        }
                        className="min-h-[38px] px-3.5 rounded-xl bg-[#FF6B81]/15 hover:bg-[#FF6B81] text-[#FF6B81] hover:text-[#070A12] border border-[#FF6B81]/60 text-xs font-extrabold transition-colors"
                      >
                        💥 تصفير النقاط والعملات (0)
                      </button>

                      <button
                        type="button"
                        disabled={busyPlayerId === player.playerId}
                        onClick={() =>
                          handleMutatePlayer(
                            player,
                            { isBanned: !player.isBanned },
                            player.isBanned
                              ? `🔓 تم فك الحظر عن (${player.username}) وإعادته للمتصدرين!`
                              : `🚫 تم حظر (${player.username}) وإخفاؤه من المتصدرين ومنعه من الأونلاين!`
                          )
                        }
                        className={`min-h-[38px] px-4 rounded-xl border text-xs font-extrabold flex items-center gap-1.5 transition-colors ${
                          player.isBanned
                            ? 'bg-[#38D9A9] text-[#070A12] border-[#38D9A9]'
                            : 'bg-[#FF6B81] text-[#070A12] border-[#FF6B81]'
                        }`}
                      >
                        {player.isBanned ? (
                          <>
                            <Unlock className="w-3.5 h-3.5" />
                            <span>إلغاء الحظر (Unban)</span>
                          </>
                        ) : (
                          <>
                            <Ban className="w-3.5 h-3.5" />
                            <span>إخفاء من المتصدرين / حظر (Ban)</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* 1-Click VIP Tier Activation Bar for this Player */}
                  <div className="mb-3 p-2.5 rounded-2xl bg-[#111827] border border-[#FFD166]/40 flex flex-wrap items-center justify-between gap-2">
                    <div className="text-xs font-extrabold text-[#FFD166] flex items-center gap-1.5">
                      <Crown className="w-3.5 h-3.5" />
                      <span>تفعيل باقة VIP بضغطة زر (Firestore):</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {VIP_PACKAGES.map(pkg => {
                        const isCurrentVip = player.vipTier === pkg.id;
                        return (
                          <button
                            key={pkg.id}
                            type="button"
                            disabled={busyPlayerId === player.playerId}
                            onClick={() =>
                              handleQuickActivatePlayerVip(player, pkg.id)
                            }
                            className={`px-3 py-1.5 rounded-xl text-[11px] font-extrabold border transition-all ${
                              isCurrentVip
                                ? 'bg-[#FFD166] text-[#070A12] border-[#FFD166] shadow-md'
                                : 'bg-[#070A12] hover:bg-[#1B253B] text-slate-300 border-[#28354E]'
                            }`}
                          >
                            {pkg.badge} {pkg.nameAr}
                            {isCurrentVip ? ' (مفعلة ✓)' : ''}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 4 Control Boxes Side-by-Side: Coins | Points | Rating | Fair-Play */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {/* 1. تعديل العملات (Coins) */}
                    <div className="p-3 rounded-2xl bg-[#111827] border border-[#28354E] space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-extrabold text-[#FFD166]">
                        <span>🪙 تعديل العملات</span>
                        <span dir="ltr" className="font-mono-num">
                          {player.coins}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        <button
                          type="button"
                          onClick={() =>
                            handleMutatePlayer(
                              player,
                              { coins: 0 },
                              `🪙 تم تصفير عملات (${player.username}) إلى 0!`
                            )
                          }
                          className="px-2 py-1 rounded-lg bg-[#FF6B81]/20 text-[#FF6B81] text-[10px] font-extrabold"
                        >
                          تصفير 0
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleMutatePlayer(
                              player,
                              { coins: Math.max(0, player.coins - 100) },
                              `🪙 تم سحب 100 عملة من (${player.username})!`
                            )
                          }
                          className="px-2 py-1 rounded-lg bg-[#1B253B] text-slate-200 text-[10px] font-mono-num font-bold"
                        >
                          -100
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleMutatePlayer(
                              player,
                              { coins: player.coins + 500 },
                              `🪙 تمت إضافة +500 عملة للاعب (${player.username})!`
                            )
                          }
                          className="px-2 py-1 rounded-lg bg-[#FFD166]/20 text-[#FFD166] text-[10px] font-mono-num font-extrabold"
                        >
                          +500
                        </button>
                      </div>
                      <div className="flex gap-1">
                        <input
                          type="number"
                          min={0}
                          value={vals.coins}
                          onChange={e =>
                            setRowEditField(player, 'coins', e.target.value)
                          }
                          className="flex-1 min-h-[32px] rounded-lg bg-[#070A12] border border-[#28354E] px-2 text-xs font-mono-num text-white"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            handleMutatePlayer(
                              player,
                              {
                                coins: Math.max(
                                  0,
                                  Math.floor(Number(vals.coins) || 0)
                                ),
                              },
                              `✅ تم تحديث عملات (${player.username}) في Firestore!`
                            )
                          }
                          className="px-2.5 rounded-lg bg-[#FFD166] text-[#070A12] text-[10px] font-extrabold"
                        >
                          حفظ
                        </button>
                      </div>
                    </div>

                    {/* 2. تعديل النقاط (Monthly Points) */}
                    <div className="p-3 rounded-2xl bg-[#111827] border border-[#28354E] space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-extrabold text-[#38D9A9]">
                        <span>🏆 تعديل النقاط</span>
                        <span dir="ltr" className="font-mono-num">
                          {player.monthlyPoints}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        <button
                          type="button"
                          onClick={() =>
                            handleMutatePlayer(
                              player,
                              { monthlyPoints: 0 },
                              `🏆 تم تصفير نقاط الشهر للاعب (${player.username}) إلى 0!`
                            )
                          }
                          className="px-2 py-1 rounded-lg bg-[#FF6B81]/20 text-[#FF6B81] text-[10px] font-extrabold"
                        >
                          تصفير 0
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleMutatePlayer(
                              player,
                              {
                                monthlyPoints: Math.max(
                                  0,
                                  player.monthlyPoints - 50
                                ),
                              },
                              `📉 تم سحب 50 نقطة من (${player.username})!`
                            )
                          }
                          className="px-2 py-1 rounded-lg bg-[#1B253B] text-slate-200 text-[10px] font-mono-num font-bold"
                        >
                          -50
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleMutatePlayer(
                              player,
                              { monthlyPoints: player.monthlyPoints + 100 },
                              `📈 تمت إضافة +100 نقطة للاعب (${player.username})!`
                            )
                          }
                          className="px-2 py-1 rounded-lg bg-[#38D9A9]/20 text-[#38D9A9] text-[10px] font-mono-num font-extrabold"
                        >
                          +100
                        </button>
                      </div>
                      <div className="flex gap-1">
                        <input
                          type="number"
                          min={0}
                          value={vals.monthlyPoints}
                          onChange={e =>
                            setRowEditField(
                              player,
                              'monthlyPoints',
                              e.target.value
                            )
                          }
                          className="flex-1 min-h-[32px] rounded-lg bg-[#070A12] border border-[#28354E] px-2 text-xs font-mono-num text-white"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            handleMutatePlayer(
                              player,
                              {
                                monthlyPoints: Math.max(
                                  0,
                                  Math.floor(Number(vals.monthlyPoints) || 0)
                                ),
                              },
                              `✅ تم تحديث نقاط الشهر للاعب (${player.username}) في Firestore!`
                            )
                          }
                          className="px-2.5 rounded-lg bg-[#38D9A9] text-[#070A12] text-[10px] font-extrabold"
                        >
                          حفظ
                        </button>
                      </div>
                    </div>

                    {/* 3. تعديل التصنيف (Rating) */}
                    <div className="p-3 rounded-2xl bg-[#111827] border border-[#28354E] space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-extrabold text-[#4FF5D2]">
                        <span>⚡ تعديل التصنيف</span>
                        <span dir="ltr" className="font-mono-num">
                          {player.rating}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        <button
                          type="button"
                          onClick={() =>
                            handleMutatePlayer(
                              player,
                              { rating: 800 },
                              `⚡ تم خفض تصنيف (${player.username}) إلى 800!`
                            )
                          }
                          className="px-2 py-1 rounded-lg bg-[#FF6B81]/20 text-[#FF6B81] text-[10px] font-extrabold"
                        >
                          800
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleMutatePlayer(
                              player,
                              { rating: Math.max(0, player.rating - 200) },
                              `📉 تم خفض تصنيف (${player.username}) بمقدار 200!`
                            )
                          }
                          className="px-2 py-1 rounded-lg bg-[#1B253B] text-slate-200 text-[10px] font-mono-num font-bold"
                        >
                          -200
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleMutatePlayer(
                              player,
                              { rating: player.rating + 200 },
                              `📈 تمت زيادة تصنيف (${player.username}) بمقدار +200!`
                            )
                          }
                          className="px-2 py-1 rounded-lg bg-[#4FF5D2]/20 text-[#4FF5D2] text-[10px] font-mono-num font-extrabold"
                        >
                          +200
                        </button>
                      </div>
                      <div className="flex gap-1">
                        <input
                          type="number"
                          min={0}
                          value={vals.rating}
                          onChange={e =>
                            setRowEditField(player, 'rating', e.target.value)
                          }
                          className="flex-1 min-h-[32px] rounded-lg bg-[#070A12] border border-[#28354E] px-2 text-xs font-mono-num text-white"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            handleMutatePlayer(
                              player,
                              {
                                rating: Math.max(
                                  0,
                                  Math.floor(Number(vals.rating) || 0)
                                ),
                              },
                              `✅ تم تحديث تصنيف (${player.username}) في Firestore!`
                            )
                          }
                          className="px-2.5 rounded-lg bg-[#4FF5D2] text-[#070A12] text-[10px] font-extrabold"
                        >
                          حفظ
                        </button>
                      </div>
                    </div>

                    {/* 4. تعديل النزاهة (Fair-Play Score) */}
                    <div className="p-3 rounded-2xl bg-[#111827] border border-[#28354E] space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-extrabold text-white">
                        <span>🛡️ تعديل النزاهة</span>
                        <span
                          dir="ltr"
                          className={`font-mono-num ${
                            player.fairPlayScore < 80
                              ? 'text-[#FF6B81]'
                              : 'text-[#38D9A9]'
                          }`}
                        >
                          {player.fairPlayScore}/100
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        <button
                          type="button"
                          onClick={() =>
                            handleMutatePlayer(
                              player,
                              { fairPlayScore: 40 },
                              `🚨 تم خفض مؤشر النزاهة للاعب (${player.username}) إلى 40/100!`
                            )
                          }
                          className="px-2 py-1 rounded-lg bg-[#FF6B81]/20 text-[#FF6B81] text-[10px] font-extrabold"
                        >
                          40%
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleMutatePlayer(
                              player,
                              { fairPlayScore: 65 },
                              `⚠️ تم خفض مؤشر النزاهة للاعب (${player.username}) إلى 65/100!`
                            )
                          }
                          className="px-2 py-1 rounded-lg bg-[#1B253B] text-[#FFD166] text-[10px] font-mono-num font-bold"
                        >
                          65%
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleMutatePlayer(
                              player,
                              { fairPlayScore: 100 },
                              `🛡️ تمت إعادة مؤشر النزاهة للاعب (${player.username}) إلى 100/100!`
                            )
                          }
                          className="px-2 py-1 rounded-lg bg-[#38D9A9]/20 text-[#38D9A9] text-[10px] font-mono-num font-extrabold"
                        >
                          100%
                        </button>
                      </div>
                      <div className="flex gap-1">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={vals.fairPlayScore}
                          onChange={e =>
                            setRowEditField(
                              player,
                              'fairPlayScore',
                              e.target.value
                            )
                          }
                          className="flex-1 min-h-[32px] rounded-lg bg-[#070A12] border border-[#28354E] px-2 text-xs font-mono-num text-white"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            handleMutatePlayer(
                              player,
                              {
                                fairPlayScore: Math.max(
                                  0,
                                  Math.min(
                                    100,
                                    Math.floor(Number(vals.fairPlayScore) || 0)
                                  )
                                ),
                              },
                              `✅ تم تحديث مؤشر النزاهة للاعب (${player.username}) في Firestore!`
                            )
                          }
                          className="px-2.5 rounded-lg bg-white text-[#070A12] text-[10px] font-extrabold"
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
        )}
      </div>
    </div>
  );
};
