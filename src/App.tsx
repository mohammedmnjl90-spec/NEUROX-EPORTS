import React, { useEffect, useRef, useState } from 'react';
import {
  computeLevelInfo,
  LANGUAGE_LABELS,
  PROFILE_BORDERS_CATALOG,
  QUIZ_CATEGORIES,
  UI_THEMES_CATALOG,
  UI_TRANSLATIONS,
  VIP_PACKAGES,
  WORLD_COUNTRIES,
} from './data/constants';
import {
  getActiveAccount,
  loadHourlyAdConfig,
  loadPlaytimeSeconds,
  persistUpdatedAccount,
  savePlaytimeSeconds,
  setActiveAccountUid,
  updatePlayerProfileIdentity,
} from './services/storage';
import {
  checkRealInternetAndFirebaseConnection,
  createCloudPrivateRoom,
  joinCloudPrivateRoom,
  setFirestoreOnlineMode,
  subscribeToIncomingCloudChallenges,
  subscribeToMyCloudProfileUpdates,
} from './services/firebase';
import {
  CategoryId,
  ChallengeNotificationItem,
  FriendItem,
  GameMode,
  HourlyAdConfig,
  LanguageCode,
  MatchHistoryItem,
  PlayerAccount,
} from './types';
import { soundFX } from './utils/sound';
import {
  getLocalizedCategory,
  getLocalizedRankTitle,
  getTranslations,
} from './utils/i18n';
import {
  broadcastChallengeInvite,
  getLocalNotificationPermission,
  loadStoredChallengeNotifications,
  requestLocalNotificationPermission,
  saveStoredChallengeNotifications,
  subscribeToLocalChallengeBroadcasts,
  triggerLocalChallengeNotification,
} from './utils/notifications';
import { SplashScreen } from './components/SplashScreen';
import { AuthScreen } from './components/AuthScreen';
import { MatchArena } from './components/MatchArena';
import { StoreAndRewardsView } from './components/StoreAndRewardsView';
import { LeaderboardAndPrizesView } from './components/LeaderboardAndPrizesView';
import { FriendsAndChatView } from './components/FriendsAndChatView';
import { AchievementsAndHistoryView } from './components/AchievementsAndHistoryView';
import { SettingsView } from './components/SettingsView';
import { HelpView } from './components/HelpView';
import {
  Award,
  Bell,
  BellRing,
  Copy,
  Home,
  Lock,
  Search,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Swords,
  Trophy,
  Users,
  Wifi,
  WifiOff,
  X,
} from 'lucide-react';

type CategoryTypeGroup = 'all' | 'religious' | 'science' | 'humanities' | 'general';

const CATEGORY_TYPE_BY_ID: Record<CategoryId, Exclude<CategoryTypeGroup, 'all'>> = {
  quran: 'religious',
  islamic: 'religious',
  science: 'science',
  math: 'science',
  physics: 'science',
  arabic: 'humanities',
  history: 'humanities',
  geography: 'humanities',
  capitals: 'humanities',
  sports: 'general',
  cocktail: 'general',
};

const CATEGORY_EXTRA_KEYWORDS: Record<CategoryId, string> = {
  quran: 'قرآن قران كريم سور آيات ايات تجويد تلاوة دينية اسلامية ذهبية quran religious islamic',
  islamic: 'إسلاميات اسلاميات سيرة فقه صحابة حديث دينية شرعية islamic studies religious',
  arabic: 'عربي عربية لغة نحو بلاغة شعر أدب ادب مفردات ثقافية أدبية arabic language literature',
  science: 'علوم أحياء احياء كيمياء فلك طب جسم الإنسان علمية science biology chemistry',
  history: 'تاريخ حضارات معارك دول قديمة تاريخية ثقافية history civilizations',
  geography: 'جغرافيا قارات أنهار انهار جبال محيطات خرائط جغرافية ثقافية geography maps',
  capitals: 'بلدان عواصم دول أعلام اعلام عملات جغرافية ثقافية countries capitals flags',
  math: 'رياضيات حساب جبر هندسة أرقام ارقام معادلات ذهني علمية math algebra geometry',
  physics: 'فيزياء طاقة حركة كهرباء قوانين نيوتن ذرة علمية physics energy mechanics',
  sports: 'رياضة كرة قدم كأس العالم اولمبياد أندية اندية رياضية sports football soccer',
  cocktail: 'كوكتيل شامل عام متنوع ثقافة عامة شاملة جميع الأقسام cocktail general all-in-one',
};

const CATEGORY_SEARCH_UI: Record<
  LanguageCode,
  {
    searchPlaceholder: string;
    clearBtn: string;
    resultsCount: (shown: number, total: number) => string;
    noResultsTitle: string;
    noResultsSub: string;
    resetFilterBtn: string;
    typeAll: string;
    typeReligious: string;
    typeScience: string;
    typeHumanities: string;
    typeGeneral: string;
  }
> = {
  ar: {
    searchPlaceholder: '🔍 ابحث سريعاً باسم المسابقة أو نوعها (مثل: قرآن، علمية، تاريخ، رياضة، دينية)...',
    clearBtn: 'مسح',
    resultsCount: (shown, total) => `عرض ${shown} من ${total} مسابقة`,
    noResultsTitle: 'لا توجد مسابقات مطابقة لبحثك',
    noResultsSub: 'جرّب البحث بكلمة أخرى أو اختر تصنيفاً مختلفاً لعرض كافة البطاقات.',
    resetFilterBtn: 'عرض كافة المسابقات (11)',
    typeAll: 'الكل (11)',
    typeReligious: '📖 دينية وشرعية',
    typeScience: '🧬 علمية وحسابية',
    typeHumanities: '🌍 ثقافية وتاريخية',
    typeGeneral: '🏆 رياضية وشاملة',
  },
  en: {
    searchPlaceholder: '🔍 Quick search by quiz name or type (e.g., Quran, Science, History, Sports)...',
    clearBtn: 'Clear',
    resultsCount: (shown, total) => `Showing ${shown} of ${total} quizzes`,
    noResultsTitle: 'No matching quizzes found',
    noResultsSub: 'Try searching with another keyword or reset the competition type filter.',
    resetFilterBtn: 'Show All Quizzes (11)',
    typeAll: 'All (11)',
    typeReligious: '📖 Religious',
    typeScience: '🧬 STEM & Science',
    typeHumanities: '🌍 Culture & Geo',
    typeGeneral: '🏆 Sports & General',
  },
  fr: {
    searchPlaceholder: '🔍 Recherche rapide par nom ou type de quiz (ex: Coran, Science, Histoire, Sport)...',
    clearBtn: 'Effacer',
    resultsCount: (shown, total) => `${shown} sur ${total} quiz affichés`,
    noResultsTitle: 'Aucun quiz correspondant',
    noResultsSub: 'Essayez un autre mot-clé ou réinitialisez le filtre des catégories.',
    resetFilterBtn: 'Afficher tous les quiz (11)',
    typeAll: 'Tous (11)',
    typeReligious: '📖 Religieux',
    typeScience: '🧬 Sciences & Maths',
    typeHumanities: '🌍 Culture & Histoire',
    typeGeneral: '🏆 Sport & Général',
  },
  es: {
    searchPlaceholder: '🔍 Búsqueda rápida por nombre o tipo de concurso (ej: Corán, Ciencia, Historia, Deporte)...',
    clearBtn: 'Limpiar',
    resultsCount: (shown, total) => `Mostrando ${shown} de ${total} concursos`,
    noResultsTitle: 'No se encontraron concursos',
    noResultsSub: 'Prueba con otra palabra clave o restablece el filtro de categorías.',
    resetFilterBtn: 'Mostrar todos los concursos (11)',
    typeAll: 'Todos (11)',
    typeReligious: '📖 Religioso',
    typeScience: '🧬 Ciencias y Mate',
    typeHumanities: '🌍 Cultura e Historia',
    typeGeneral: '🏆 Deporte y General',
  },
  tr: {
    searchPlaceholder: '🔍 Yarışma adına veya türüne göre hızlı ara (örn: Kur’an, Bilim, Tarih, Spor)...',
    clearBtn: 'Temizle',
    resultsCount: (shown, total) => `${total} yarışmadan ${shown} tanesi gösteriliyor`,
    noResultsTitle: 'Eşleşen yarışma bulunamadı',
    noResultsSub: 'Başka bir anahtar kelime deneyin veya tüm kategorileri sıfırlayın.',
    resetFilterBtn: 'Tüm Yarışmaları Göster (11)',
    typeAll: 'Tümü (11)',
    typeReligious: '📖 Dini İlimler',
    typeScience: '🧬 Bilim & Matematik',
    typeHumanities: '🌍 Kültür & Tarih',
    typeGeneral: '🏆 Spor & Genel',
  },
  ur: {
    searchPlaceholder: '🔍 مقابلے کے نام یا قسم سے فوری تلاش کریں (مثلاً: قرآن، سائنسی، تاریخ، کھیل)...',
    clearBtn: 'صاف کریں',
    resultsCount: (shown, total) => `${total} میں سے ${shown} مقابلے دکھائے جا رہے ہیں`,
    noResultsTitle: 'آپ کی تلاش سے کوئی مقابلہ مطابقت نہیں رکھتا',
    noResultsSub: 'کسی دوسرے لفظ سے تلاش کریں یا تمام مقابلے دیکھنے کے لیے فلٹر صاف کریں۔',
    resetFilterBtn: 'تمام مقابلے دکھائیں (11)',
    typeAll: 'سب (11)',
    typeReligious: '📖 دینی و اسلامی',
    typeScience: '🧬 سائنسی و ریاضی',
    typeHumanities: '🌍 ثقافتی و تاریخی',
    typeGeneral: '🏆 کھیل اور عمومی',
  },
};

function normalizeCategorySearchText(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[\u064B-\u065F]/g, '');
}

type ActiveTab =
  | 'arena'
  | 'store'
  | 'leaderboard'
  | 'friends'
  | 'achievements'
  | 'settings'
  | 'help';

export default function App() {
  const [showSplash, setShowSplash] = useState<boolean>(true);
  const [account, setAccount] = useState<PlayerAccount | null>(() =>
    getActiveAccount()
  );
  const [activeTab, setActiveTab] = useState<ActiveTab>('arena');

  // Real-time Network Connectivity State (Online vs Offline-only enforcement)
  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  // Selected Game Mode & Active Match State
  const [selectedMode, setSelectedMode] = useState<GameMode>(() =>
    typeof navigator !== 'undefined' && !navigator.onLine ? 'solo' : 'online'
  );
  const [activeMatch, setActiveMatch] = useState<{
    mode: GameMode;
    category: CategoryId;
    roomCode?: string;
    customOpponentName?: string;
    customOpponentFlag?: string;
    customOpponentPlayerId?: string;
  } | null>(null);
  const activeMatchRef = useRef(activeMatch);
  activeMatchRef.current = activeMatch;
  const isOnlineRef = useRef(isOnline);
  isOnlineRef.current = isOnline;
  const showSplashRef = useRef(showSplash);
  showSplashRef.current = showSplash;

  // 4-Digit Private Room Modal State
  const [roomModalOpen, setRoomModalOpen] = useState<boolean>(false);
  const [roomCategory, setRoomCategory] = useState<CategoryId>('cocktail');
  const [generatedRoomCode, setGeneratedRoomCode] = useState<string>('');
  const [joinRoomInput, setJoinRoomInput] = useState<string>('');

  // Celebratory Top Toast & Exit Confirmation Modal
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<boolean>(false);
  const [showExitConfirmModal, setShowExitConfirmModal] = useState<boolean>(false);

  // Local Notifications & Incoming Friend Challenge Invites State
  const [notifications, setNotifications] = useState<ChallengeNotificationItem[]>(
    () => loadStoredChallengeNotifications()
  );
  const [notifDrawerOpen, setNotifDrawerOpen] = useState<boolean>(false);
  const [activeIncomingBanner, setActiveIncomingBanner] =
    useState<ChallengeNotificationItem | null>(null);
  const [notifPermission, setNotifPermission] = useState<string>(() =>
    getLocalNotificationPermission()
  );

  // Quick Search & Category Type Filter State for Home Arena Categories
  const [categorySearchQuery, setCategorySearchQuery] = useState<string>('');
  const [selectedCategoryType, setSelectedCategoryType] =
    useState<CategoryTypeGroup>('all');

  // Quick Profile Editor State on Home Arena Profile Card
  const [isEditingHomeProfile, setIsEditingHomeProfile] =
    useState<boolean>(false);
  const [homeEditUsername, setHomeEditUsername] = useState<string>('');
  const [homeEditCountryCode, setHomeEditCountryCode] = useState<string>('SA');
  const [homeEditError, setHomeEditError] = useState<string | null>(null);

  // Hourly Playtime Tracker (3600s = 60 minutes) & Interstitial Ad Modal State
  const [playtimeSeconds, setPlaytimeSeconds] = useState<number>(() => {
    const acc = getActiveAccount();
    return acc ? loadPlaytimeSeconds(acc.uid, acc.playtimeSeconds ?? 0) : 0;
  });
  const [hourlyAdModalOpen, setHourlyAdModalOpen] = useState<boolean>(false);
  const [hourlyAdCountdown, setHourlyAdCountdown] = useState<number>(7);
  const [activeHourlyAdConfig, setActiveHourlyAdConfig] =
    useState<HourlyAdConfig>(() => loadHourlyAdConfig());

  // Sync audio/vibration & RTL/LTR language direction when account changes
  useEffect(() => {
    if (!account) return;
    soundFX.soundEnabled = account.soundEnabled;
    soundFX.vibrationEnabled = account.vibrationEnabled;
    soundFX.soundPack = account.soundPack || 'cyber';
    const langMeta = LANGUAGE_LABELS[account.language] || LANGUAGE_LABELS.ar;
    document.documentElement.dir = langMeta.dir;
    document.documentElement.lang = account.language;
  }, [account]);

  // Real-time Firestore listener for 1-Click VIP / Coins / Ban updates from Owner Control Panel
  useEffect(() => {
    if (!account || !isOnline) return;
    const unsub = subscribeToMyCloudProfileUpdates(account, remotePatch => {
      const nextAcc: PlayerAccount = {
        ...account,
        ...remotePatch,
        updatedAt: Date.now(),
      };
      const res = persistUpdatedAccount(nextAcc);
      setAccount({ ...res.account });
      if (remotePatch.vipTier && remotePatch.vipTier !== account.vipTier) {
        const pkg = VIP_PACKAGES.find(p => p.id === remotePatch.vipTier);
        if (pkg && pkg.id !== 'basic') {
          savePlaytimeSeconds(account.uid, 0);
          setPlaytimeSeconds(0);
          setHourlyAdModalOpen(false);
          showToast(
            `👑 تم تفعيل ${pkg.nameAr} ${pkg.badge} في حسابك وإيقاف الإعلانات التلقائية فوراً!`
          );
        }
      }
    });
    return () => unsub();
  }, [account, isOnline]);

  // Background Hourly Playtime Tracker (60 minutes = 3600 seconds)
  // Exempts VIP subscribers (bronze, silver, royal_gold) and never interrupts an active match
  useEffect(() => {
    if (!account) return;

    // VIP Exception: Bronze, Silver, and Royal Gold subscribers have automatic ads completely disabled
    if (account.vipTier !== 'basic') {
      if (hourlyAdModalOpen) setHourlyAdModalOpen(false);
      return;
    }

    const tick = window.setInterval(() => {
      if (hourlyAdModalOpen) return;
      const cfg = loadHourlyAdConfig();
      if (!cfg.enabled) return;

      setPlaytimeSeconds(prev => {
        const next = prev + 1;
        savePlaytimeSeconds(account.uid, next);
        return next;
      });
    }, 1000);

    return () => window.clearInterval(tick);
  }, [account, hourlyAdModalOpen]);

  // Trigger Full-Screen Interstitial Ad when playtime >= 3600s AND no match is active (!activeMatch)
  useEffect(() => {
    if (!account || account.vipTier !== 'basic') return;
    if (activeMatch) return; // Never interrupt an active match! Wait until match completes.
    if (hourlyAdModalOpen) return;

    const cfg = loadHourlyAdConfig();
    if (!cfg.enabled) return;
    const targetInterval = cfg.intervalSeconds || 3600;

    if (playtimeSeconds >= targetInterval) {
      setActiveHourlyAdConfig(cfg);
      setHourlyAdCountdown(cfg.countdownSeconds || 7);
      setHourlyAdModalOpen(true);
    }
  }, [playtimeSeconds, activeMatch, account, hourlyAdModalOpen]);

  // Countdown timer inside the Hourly Interstitial Ad Modal
  useEffect(() => {
    if (!hourlyAdModalOpen) return;
    if (hourlyAdCountdown <= 0) return;

    const timer = window.setTimeout(() => {
      setHourlyAdCountdown(prev => Math.max(0, prev - 1));
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [hourlyAdModalOpen, hourlyAdCountdown]);

  const handleDismissHourlyAd = (goToVipStore = false) => {
    if (hourlyAdCountdown > 0 && !goToVipStore) return;
    soundFX.playClick();
    setHourlyAdModalOpen(false);
    setPlaytimeSeconds(0);
    if (account) {
      savePlaytimeSeconds(account.uid, 0);
    }
    if (goToVipStore && isOnlineRef.current) {
      setActiveMatch(null);
      setActiveTab('store');
    }
  };

  // Prevent accidental exit via phone Back button without confirmation modal
  useEffect(() => {
    window.history.pushState({ neuroxGuard: true }, '');
    const handlePopState = () => {
      window.history.pushState({ neuroxGuard: true }, '');
      setShowExitConfirmModal(true);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Monitor Internet Connectivity via navigator.onLine events + lightweight Firestore reachability probe:
  // When offline, immediately disable Firestore network, terminate any active online/room match,
  // lock all online modes/tabs ('online', 'room', 'friends', 'store', 'leaderboard'),
  // and keep only offline modes ('solo' & 'local') open.
  useEffect(() => {
    const applyOfflineLockdown = () => {
      setFirestoreOnlineMode(false);
      const wasOnline = isOnlineRef.current;
      isOnlineRef.current = false;
      setIsOnline(false);
      setSelectedMode(prev => (prev === 'online' || prev === 'room' ? 'solo' : prev));
      setActiveTab(prev =>
        prev === 'friends' || prev === 'leaderboard' || prev === 'store'
          ? 'arena'
          : prev
      );
      setRoomModalOpen(false);
      setActiveIncomingBanner(null);

      const runningMatch = activeMatchRef.current;
      if (
        runningMatch &&
        (runningMatch.mode === 'online' || runningMatch.mode === 'room')
      ) {
        soundFX.playWrong();
        setActiveMatch(null);
        setActiveTab('arena');
        showToast(
          '📡 انقطع الاتصال بالإنترنت! تم إنهاء المباراة الأونلاين فوراً وإرجاعك للساحة الرئيسية مع قفل أطوار الشبكة.'
        );
      } else if (wasOnline && !showSplashRef.current) {
        showToast(
          '📡 لا يوجد اتصال بالإنترنت: تم تفعيل وضع الأوفلاين فقط (الفردي والمحلي) وإيقاف الأونلاين مؤقتاً.'
        );
      }
    };

    const applyOnlineRecovery = () => {
      setFirestoreOnlineMode(true);
      if (isOnlineRef.current) return;
      isOnlineRef.current = true;
      setIsOnline(true);
      setSelectedMode('online');
      if (!showSplashRef.current) {
        showToast(
          '🌐 عاد الاتصال بالإنترنت! تم فتح جميع أطوار الأونلاين والأصدقاء والبطولة السحابية.'
        );
      }
    };

    const runHeartbeat = async () => {
      if (showSplashRef.current) return;
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        applyOfflineLockdown();
        return;
      }
      const reachable = await checkRealInternetAndFirebaseConnection(4000);
      if (!reachable) {
        applyOfflineLockdown();
      } else if (!isOnlineRef.current) {
        applyOnlineRecovery();
      }
    };

    const handleBrowserOnline = () => {
      setFirestoreOnlineMode(true);
      if (showSplashRef.current) {
        isOnlineRef.current = true;
        setIsOnline(true);
      } else {
        runHeartbeat();
      }
    };

    window.addEventListener('online', handleBrowserOnline);
    window.addEventListener('offline', applyOfflineLockdown);

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      applyOfflineLockdown();
    }

    const hbInterval = window.setInterval(runHeartbeat, 6000);

    return () => {
      window.removeEventListener('online', handleBrowserOnline);
      window.removeEventListener('offline', applyOfflineLockdown);
      window.clearInterval(hbInterval);
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(prev => (prev === msg ? null : prev));
    }, 4200);
  };

  const handleAccountMutation = (
    updated: PlayerAccount,
    customToast?: string
  ) => {
    const res = persistUpdatedAccount(updated);
    setAccount({ ...res.account });
    if (res.newlyUnlockedTitles.length > 0) {
      showToast(
        `🎉 وسام جديد مفتوح: ${res.newlyUnlockedTitles.join(' ، ')}!`
      );
    } else if (customToast) {
      showToast(customToast);
    }
  };

  const handleCopyId = async () => {
    if (!account) return;
    soundFX.playClick();
    try {
      await navigator.clipboard.writeText(account.playerId);
    } catch {}
    setCopiedId(true);
    showToast(`تم نسخ معرّف اللاعب الفريد ${account.playerId} بنجاح!`);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleStartCategoryMatch = (catId: CategoryId) => {
    soundFX.playClick();
    if (
      account?.isBanned &&
      (selectedMode === 'online' || selectedMode === 'room')
    ) {
      soundFX.playWrong();
      showToast(
        '🚫 تم حظر هذا الحساب من اللعب الأونلاين والظهور في المتصدرين بسبب مخالفة معايير النزاهة.'
      );
      return;
    }
    if (!isOnline && (selectedMode === 'online' || selectedMode === 'room')) {
      setSelectedMode('solo');
      setActiveMatch({
        mode: 'solo',
        category: catId,
      });
      return;
    }
    setActiveMatch({
      mode: selectedMode,
      category: catId,
    });
  };

  const handleCreate4DigitRoom = async () => {
    if (!account) return;
    if (account.isBanned) {
      soundFX.playWrong();
      showToast('🚫 تم حظر هذا الحساب من اللعب الأونلاين وإنشاء الغرف.');
      return;
    }
    if (!isOnline) {
      soundFX.playWrong();
      showToast('⚠️ إنشاء الغرف الخاصة يتطلب اتصالاً بالإنترنت!');
      return;
    }
    soundFX.playClick();
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    setGeneratedRoomCode(code);
    const seed = code
      .split('')
      .reduce((acc, ch) => acc * 31 + ch.charCodeAt(0), 7);
    await createCloudPrivateRoom(code, account, roomCategory, seed).catch(
      () => {}
    );
    broadcastChallengeInvite({
      id: `inv_${code}_${Date.now()}`,
      roomCode: code,
      category: roomCategory,
      senderUid: account.uid,
      senderPlayerId: account.playerId,
      senderName: account.username,
      senderFlag: account.countryFlag,
      timestamp: Date.now(),
      read: false,
    });
  };

  const handleJoin4DigitRoom = async (codeToJoin: string) => {
    if (!account) return;
    if (account.isBanned) {
      soundFX.playWrong();
      showToast('🚫 تم حظر هذا الحساب من اللعب الأونلاين والانضمام للغرف.');
      return;
    }
    if (!isOnline) {
      soundFX.playWrong();
      showToast('⚠️ الانضمام للغرف الخاصة يتطلب اتصالاً بالإنترنت!');
      return;
    }
    const clean = codeToJoin.replace(/[^0-9]/g, '').slice(0, 4);
    if (clean.length !== 4) {
      soundFX.playWrong();
      showToast('يرجى إدخال كود غرفة صحيح مكون من 4 أرقام!');
      return;
    }
    soundFX.playCorrect();
    const cloudRoom = await joinCloudPrivateRoom(clean, account).catch(
      () => null
    );
    const isJoiningAsHost =
      cloudRoom &&
      ((cloudRoom.hostPlayerId && cloudRoom.hostPlayerId === account.playerId) ||
        cloudRoom.hostName === account.username);
    setRoomModalOpen(false);
    setNotifDrawerOpen(false);
    setActiveIncomingBanner(null);
    setActiveMatch({
      mode: 'room',
      category: (cloudRoom?.category as CategoryId) || roomCategory,
      roomCode: clean,
      customOpponentName: isJoiningAsHost
        ? undefined
        : cloudRoom?.hostName || undefined,
      customOpponentFlag: isJoiningAsHost
        ? undefined
        : cloudRoom?.hostFlag || undefined,
      customOpponentPlayerId: isJoiningAsHost
        ? undefined
        : cloudRoom?.hostPlayerId || undefined,
    });
  };

  const handleAcceptChallengeNotification = async (
    invite: ChallengeNotificationItem
  ) => {
    if (!account) return;
    setActiveIncomingBanner(null);
    setNotifDrawerOpen(false);
    setNotifications(prev => {
      const next = prev.map(n =>
        n.id === invite.id ? { ...n, read: true } : n
      );
      saveStoredChallengeNotifications(next);
      return next;
    });

    if (!isOnline) {
      soundFX.playWrong();
      showToast('⚠️ الانضمام لدعوة التحدي يتطلب اتصالاً بالإنترنت!');
      return;
    }

    soundFX.playCorrect();
    const cloudRoom = await joinCloudPrivateRoom(invite.roomCode, account).catch(
      () => null
    );
    setActiveMatch({
      mode: 'room',
      category:
        (cloudRoom?.category as CategoryId) || invite.category || 'cocktail',
      roomCode: invite.roomCode,
      customOpponentName: cloudRoom?.hostName || invite.senderName,
      customOpponentFlag: cloudRoom?.hostFlag || invite.senderFlag,
      customOpponentPlayerId: invite.senderPlayerId,
    });
  };

  // Real-time Incoming Challenge Listeners (Firestore Waiting Rooms + Cross-Tab BroadcastChannel)
  useEffect(() => {
    if (!account || !isOnline) return;
    if (account.localNotificationsEnabled === false) return;

    const handleReceiveInvite = (invite: ChallengeNotificationItem) => {
      setNotifications(prev => {
        if (prev.some(p => p.roomCode === invite.roomCode && !invite.id.startsWith('test_'))) {
          return prev;
        }
        const next = [invite, ...prev].slice(0, 25);
        saveStoredChallengeNotifications(next);
        return next;
      });
      setActiveIncomingBanner(invite);
      triggerLocalChallengeNotification(invite, handleAcceptChallengeNotification);
    };

    const unsubCloud = subscribeToIncomingCloudChallenges(
      account,
      (roomCode, hostUid, hostName, hostFlag, category, hostPlayerId) => {
        // Check if this challenger is already in friends list or a new challenger
        const matchedFriend = account.friends.find(
          f =>
            f.uid === hostUid ||
            (hostPlayerId && f.playerId === hostPlayerId) ||
            f.username.toLowerCase() === hostName.toLowerCase()
        );
        const invite: ChallengeNotificationItem = {
          id: `cloud_inv_${roomCode}_${Date.now()}`,
          roomCode,
          category: (category as CategoryId) || 'cocktail',
          senderUid: hostUid,
          senderPlayerId:
            matchedFriend?.playerId || hostPlayerId || '#لاعب_سحابي',
          senderName: hostName,
          senderFlag: hostFlag,
          timestamp: Date.now(),
          read: false,
        };
        handleReceiveInvite(invite);
      }
    );

    const unsubLocal = subscribeToLocalChallengeBroadcasts(
      account.playerId,
      account.uid,
      invite => {
        handleReceiveInvite(invite);
      }
    );

    return () => {
      unsubCloud();
      unsubLocal();
    };
  }, [account, isOnline]);

  const handleTriggerBackgroundTestNotification = async (delaySeconds = 3) => {
    if (!account) return;
    soundFX.playClick();
    const perm = await requestLocalNotificationPermission();
    setNotifPermission(perm);

    showToast(
      delaySeconds > 0
        ? `🕒 سيصلك إشعار دعوة تحدي خلال ${delaySeconds} ثوانٍ! يمكنك تصغير التطبيق أو تبديل التبويب لتجربة تنبيه الخلفية.`
        : '🔔 جاري إرسال إشعار دعوة تحدي تجريبي الآن...'
    );

    window.setTimeout(() => {
      const testCode = Math.floor(1000 + Math.random() * 9000).toString();
      const sampleFriend = account.friends[0];
      const testInvite: ChallengeNotificationItem = {
        id: `test_inv_${Date.now()}`,
        roomCode: testCode,
        category: 'cocktail',
        senderUid: sampleFriend?.uid || 'friend_challenger',
        senderPlayerId: sampleFriend?.playerId || '#9845120394',
        senderName: sampleFriend?.username || 'صديق جديد في الساحة',
        senderFlag: sampleFriend?.countryFlag || '🇸🇦',
        timestamp: Date.now(),
        read: false,
      };
      setNotifications(prev => {
        const next = [testInvite, ...prev].slice(0, 25);
        saveStoredChallengeNotifications(next);
        return next;
      });
      setActiveIncomingBanner(testInvite);
      triggerLocalChallengeNotification(
        testInvite,
        handleAcceptChallengeNotification
      );
    }, delaySeconds * 1000);
  };

  const handleChallengeFriend = async (friend: FriendItem) => {
    if (!account) return;
    if (!isOnline) {
      soundFX.playWrong();
      showToast('⚠️ تحدي الأصدقاء عبر الإنترنت يتطلب اتصالاً بالشبكة!');
      return;
    }
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    const seed = code
      .split('')
      .reduce((acc, ch) => acc * 31 + ch.charCodeAt(0), 7);
    await createCloudPrivateRoom(
      code,
      account,
      'cocktail',
      seed,
      friend.playerId
    ).catch(() => {});
    broadcastChallengeInvite(
      {
        id: `inv_${code}_${Date.now()}`,
        roomCode: code,
        category: 'cocktail',
        senderUid: account.uid,
        senderPlayerId: account.playerId,
        senderName: account.username,
        senderFlag: account.countryFlag,
        timestamp: Date.now(),
        read: false,
      },
      friend.playerId
    );
    showToast(
      `⚔️ تم فتح غرفة التحدي #${code} وإرسال تنبيه فوري إلى ${friend.username} (${friend.playerId})!`
    );
    setActiveMatch({
      mode: 'room',
      category: 'cocktail',
      roomCode: code,
      customOpponentName: friend.username,
      customOpponentFlag: friend.countryFlag,
      customOpponentPlayerId: friend.playerId,
    });
  };

  // 1. Splash Screen (Real Firebase sync when online, instant local launch when offline)
  if (showSplash) {
    return (
      <SplashScreen
        existingAccount={account}
        onFinish={result => {
          if (result) {
            isOnlineRef.current = result.isOnline;
            setIsOnline(result.isOnline);
            if (!result.isOnline) {
              setSelectedMode(prev =>
                prev === 'online' || prev === 'room' ? 'solo' : prev
              );
              setActiveTab(prev =>
                prev === 'friends' || prev === 'leaderboard' || prev === 'store'
                  ? 'arena'
                  : prev
              );
            } else {
              setSelectedMode(prev => (prev === 'solo' ? 'online' : prev));
            }
            if (result.accountPatch && account) {
              const merged: PlayerAccount = {
                ...account,
                ...result.accountPatch,
                updatedAt: Date.now(),
              };
              const res = persistUpdatedAccount(merged);
              setAccount({ ...res.account });
            }
          }
          showSplashRef.current = false;
          setShowSplash(false);
        }}
      />
    );
  }

  // 2. Single Sign-On Auth Gate
  if (!account) {
    return (
      <AuthScreen
        onSuccess={loggedInAccount => {
          setAccount(loggedInAccount);
          showToast(
            `مرحباً بك في الساحة يا ${loggedInAccount.username} ${loggedInAccount.countryFlag}!`
          );
        }}
      />
    );
  }

  const t = getTranslations(account.language);
  const levelInfo = computeLevelInfo(account.xp);
  const vipMeta =
    VIP_PACKAGES.find(v => v.id === account.vipTier) || VIP_PACKAGES[0];
  const activeBorderMeta =
    PROFILE_BORDERS_CATALOG.find(
      b => b.id === (account.equippedBorder || 'default_cyan')
    ) || PROFILE_BORDERS_CATALOG[0];
  const activeThemeMeta =
    UI_THEMES_CATALOG.find(
      th => th.id === (account.equippedTheme || 'midnight_cyan')
    ) || UI_THEMES_CATALOG[0];
  const featuredQuranCategory = QUIZ_CATEGORIES[0];
  const standardCategories = QUIZ_CATEGORIES.slice(1);

  return (
    <div
      className="min-h-screen text-white flex flex-col pb-20 md:pb-8 transition-colors duration-300"
      style={{ backgroundColor: activeThemeMeta.bgPrimary }}
    >
      {/* Celebratory Top Toast Banner */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-md rounded-2xl bg-[#111827] border-2 border-[#FFD166] px-4 py-3 shadow-2xl flex items-center justify-between text-xs font-extrabold text-[#FFD166]">
          <span>{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white mr-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Navigation Bar (Hidden during active match for 100% distraction-free gameplay) */}
      {!activeMatch && (
        <header
          className="sticky top-0 z-30 backdrop-blur-md border-b px-3 sm:px-8 py-3 flex items-center justify-between gap-2 sm:gap-6 transition-colors duration-300"
          style={{
            backgroundColor: `${activeThemeMeta.bgPrimary}E6`,
            borderColor: activeThemeMeta.borderColor,
          }}
        >
          {/* Zone 1: Brand Title */}
          <button
            type="button"
            onClick={() => {
              soundFX.playClick();
              setActiveMatch(null);
              setActiveTab('arena');
            }}
            className="text-sm sm:text-lg font-extrabold tracking-wider text-white whitespace-nowrap shrink-0"
          >
            🧠 NEUROX <span className="text-[#4FF5D2]">ESPORTS</span>
          </button>

          {/* Zone 2: 5 Concise Nav Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-bold text-slate-300">
            {(
              [
                { id: 'arena', label: t.arena, onlineOnly: false },
                { id: 'store', label: t.store, onlineOnly: true },
                { id: 'leaderboard', label: t.leaderboard, onlineOnly: true },
                { id: 'friends', label: t.friends, onlineOnly: true },
                { id: 'achievements', label: t.achievements, onlineOnly: false },
              ] as Array<{ id: ActiveTab; label: string; onlineOnly: boolean }>
            ).map(item => {
              const locked = item.onlineOnly && !isOnline;
              return (
                <button
                  key={item.id}
                  type="button"
                  disabled={locked}
                  onClick={() => {
                    if (locked) return;
                    soundFX.playClick();
                    setActiveMatch(null);
                    setActiveTab(item.id);
                  }}
                  className={`transition-colors whitespace-nowrap shrink-0 flex items-center gap-1 ${
                    locked
                      ? 'opacity-40 cursor-not-allowed text-slate-500'
                      : activeTab === item.id && !activeMatch
                      ? 'text-[#4FF5D2] underline underline-offset-8'
                      : 'hover:text-[#4FF5D2]'
                  }`}
                >
                  {locked && <Lock className="w-3 h-3" />}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Connectivity Indicator, Local Challenge Notifications Bell & Coins */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            <span
              className={`px-2 sm:px-2.5 py-1 rounded-xl border text-[11px] font-extrabold flex items-center gap-1.5 ${
                isOnline
                  ? 'bg-[#38D9A9]/15 border-[#38D9A9]/50 text-[#38D9A9]'
                  : 'bg-[#FF6B81]/15 border-[#FF6B81]/50 text-[#FF6B81]'
              }`}
            >
              {isOnline ? (
                <>
                  <Wifi className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{t.onlineStatus}</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5" />
                  <span>{t.offlineOnlyStatus}</span>
                </>
              )}
            </span>

            {/* Local Challenge Notifications Bell Button */}
            <button
              type="button"
              onClick={() => {
                soundFX.playClick();
                setNotifDrawerOpen(prev => !prev);
                setNotifications(prev => {
                  const next = prev.map(n => ({ ...n, read: true }));
                  saveStoredChallengeNotifications(next);
                  return next;
                });
              }}
              className="relative min-h-[38px] min-w-[38px] px-2.5 rounded-xl bg-[#111827] hover:bg-[#1B253B] border border-[#4FF5D2]/50 text-[#4FF5D2] flex items-center justify-center transition-colors"
              title={t.notifCenterTitle}
              aria-label={t.notifCenterTitle}
            >
              {notifications.some(n => !n.read) ? (
                <BellRing className="w-4 h-4 animate-bounce text-[#FFD166]" />
              ) : (
                <Bell className="w-4 h-4" />
              )}
              {notifications.filter(n => !n.read).length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#FF6B81] text-[#070A12] text-[10px] font-mono-num font-extrabold flex items-center justify-center">
                  {notifications.filter(n => !n.read).length}
                </span>
              )}
            </button>

            <button
              type="button"
              disabled={!isOnline}
              onClick={() => {
                if (!isOnline) return;
                soundFX.playClick();
                setActiveMatch(null);
                setActiveTab('store');
              }}
              className="px-3 sm:px-4 py-2 rounded-xl bg-[#111827] hover:bg-[#1B253B] disabled:opacity-45 border border-[#FFD166]/50 text-xs font-extrabold text-[#FFD166] whitespace-nowrap shrink-0 flex items-center gap-1.5"
            >
              <span>🪙</span>
              <span dir="ltr" className="font-mono-num text-xs sm:text-sm font-extrabold">
                {account.coins}
              </span>
              <span>{t.coins}</span>
            </button>
          </div>
        </header>
      )}

      {/* Incoming Friend Challenge Alert Banner (Real-Time Local Notification Overlay) */}
      {activeIncomingBanner && !activeMatch && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 w-[94%] max-w-lg rounded-3xl bg-[#111827] border-2 border-[#4FF5D2] p-4 shadow-[0_0_40px_rgba(79,245,210,0.3)] animate-pulse">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#1B253B] border border-[#FFD166] flex items-center justify-center text-2xl shrink-0">
                {activeIncomingBanner.senderFlag}
              </div>
              <div>
                <div className="flex items-center gap-1.5 text-xs font-extrabold text-[#FFD166]">
                  <BellRing className="w-3.5 h-3.5" />
                  <span>{t.incomingInviteBannerTitle}</span>
                </div>
                <div className="text-sm font-extrabold text-white mt-0.5">
                  {activeIncomingBanner.senderName}{' '}
                  <span className="text-[11px] font-mono-num text-[#4FF5D2]">
                    ({activeIncomingBanner.senderPlayerId})
                  </span>{' '}
                  · #{activeIncomingBanner.roomCode}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setActiveIncomingBanner(null)}
              className="text-slate-400 hover:text-white text-xs px-2 py-1"
            >
              ✕
            </button>
          </div>
          <div className="flex items-center gap-2.5 mt-3">
            <button
              type="button"
              onClick={() =>
                handleAcceptChallengeNotification(activeIncomingBanner)
              }
              className="flex-1 min-h-[42px] rounded-xl bg-gradient-to-r from-[#4FF5D2] to-[#38D9A9] text-[#070A12] font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-lg"
            >
              <Swords className="w-4 h-4" />
              <span>
                {t.acceptChallengeNowBtn} (#{activeIncomingBanner.roomCode})
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveIncomingBanner(null)}
              className="min-h-[42px] px-4 rounded-xl bg-[#1B253B] hover:bg-[#28354E] text-xs font-bold text-slate-300"
            >
              {t.laterBtn}
            </button>
          </div>
        </div>
      )}

      {/* Local Challenge Notifications Center Modal/Drawer */}
      {notifDrawerOpen && !activeMatch && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-3xl bg-[#111827] border border-[#28354E] p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#28354E]">
              <div className="flex items-center gap-2">
                <BellRing className="w-5 h-5 text-[#4FF5D2]" />
                <div>
                  <h3 className="text-base font-extrabold text-white">
                    {t.notifCenterTitle}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {t.notifCenterSub}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setNotifDrawerOpen(false)}
                className="w-8 h-8 rounded-xl bg-[#1B253B] text-slate-300 hover:text-white flex items-center justify-center text-xs font-bold"
              >
                ✕
              </button>
            </div>

            {/* Incoming Challenge Invitations List */}
            <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
              {notifications.length === 0 ? (
                <div className="py-10 text-center rounded-2xl bg-[#070A12] border border-[#28354E] text-xs text-slate-400">
                  {t.noIncomingInvitesText}
                </div>
              ) : (
                notifications.map(item => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-2xl bg-[#070A12] border border-[#28354E] flex flex-wrap items-center justify-between gap-2.5"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl">{item.senderFlag}</span>
                      <div>
                        <div className="text-xs font-extrabold text-white">
                          {t.inviteFromLabel} {item.senderName}{' '}
                          <span className="font-mono-num text-[#FFD166]">
                            ({item.senderPlayerId})
                          </span>
                        </div>
                        <div className="text-[10px] font-mono-num text-slate-400 mt-0.5">
                          #{item.roomCode}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAcceptChallengeNotification(item)}
                      className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#4FF5D2] to-[#38D9A9] text-[#070A12] text-[11px] font-extrabold flex items-center gap-1"
                    >
                      <Swords className="w-3.5 h-3.5" />
                      <span>
                        {t.joinRoomBtn} #{item.roomCode}
                      </span>
                    </button>
                  </div>
                ))
              )}
            </div>

            {notifications.length > 0 && (
              <div className="mt-4 pt-3 border-t border-[#28354E] flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    soundFX.playClick();
                    setNotifications([]);
                    saveStoredChallengeNotifications([]);
                  }}
                  className="text-xs font-bold text-slate-400 hover:text-[#FF6B81]"
                >
                  {t.clearNotificationsBtn}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Content Container */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 pt-5 pb-20 md:pb-8">
        {!isOnline && !activeMatch && (
          <div className="mb-5 rounded-2xl bg-[#FF6B81]/15 border border-[#FF6B81] px-4 py-3 flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-[#FF6B81]">
            <div className="flex items-center gap-2">
              <WifiOff className="w-4 h-4 shrink-0" />
              <span>{t.offlineBannerText}</span>
            </div>
          </div>
        )}

        {activeMatch ? (
          <MatchArena
            account={account}
            mode={activeMatch.mode}
            category={activeMatch.category}
            roomCode={activeMatch.roomCode}
            customOpponentName={activeMatch.customOpponentName}
            customOpponentFlag={activeMatch.customOpponentFlag}
            customOpponentPlayerId={activeMatch.customOpponentPlayerId}
            onCancelLobby={() => setActiveMatch(null)}
            onPersistAccount={updatedAcc => handleAccountMutation(updatedAcc)}
            onMatchComplete={(updatedAcc, historyEntry) => {
              setActiveMatch(null);
              const winMsg =
                historyEntry.outcome === 'win' ||
                historyEntry.outcome === 'forfeit_win'
                  ? `🏆 انتصار رائع! ربحت +${historyEntry.tournamentPointsEarned} نقطة بطولة و +${historyEntry.coinsDelta} 🪙`
                  : 'انتهت المباراة وتم تحديث تصنيفك وسجل مبارياتك.';
              handleAccountMutation(updatedAcc, winMsg);
            }}
          />
        ) : activeTab === 'store' ? (
          <StoreAndRewardsView
            account={account}
            onUpdateAccount={handleAccountMutation}
          />
        ) : activeTab === 'leaderboard' ? (
          <LeaderboardAndPrizesView account={account} />
        ) : activeTab === 'friends' ? (
          <FriendsAndChatView
            account={account}
            onUpdateAccount={handleAccountMutation}
            onChallengeFriend={handleChallengeFriend}
            onStartDirectChallenge={(friend, roomCode, category) => {
              setActiveMatch({
                mode: 'room',
                category,
                roomCode,
                customOpponentName: friend.username,
                customOpponentFlag: friend.countryFlag,
                customOpponentPlayerId: friend.playerId,
              });
            }}
          />
        ) : activeTab === 'achievements' ? (
          <AchievementsAndHistoryView account={account} />
        ) : activeTab === 'help' ? (
          <HelpView
            account={account}
            onBackToSettings={() => setActiveTab('settings')}
            onGoToArena={() => setActiveTab('arena')}
            onGoToFriends={() => {
              if (!isOnline) {
                showToast('⚠️ قسم الأصدقاء يتطلب اتصالاً بالإنترنت!');
                return;
              }
              setActiveTab('friends');
            }}
          />
        ) : activeTab === 'settings' ? (
          <SettingsView
            account={account}
            onUpdateAccount={handleAccountMutation}
            onOpenHelp={() => setActiveTab('help')}
            onLogout={() => {
              setActiveAccountUid(null);
              setAccount(null);
            }}
          />
        ) : (
          /* ARENA HOME VIEW */
          <div className="space-y-7 pb-10">
            {/* Player Hero & XP Rank Progress Card */}
            <div
              className="rounded-3xl border p-5 sm:p-6 transition-colors duration-300"
              style={{
                backgroundColor: activeThemeMeta.bgCard,
                borderColor: activeThemeMeta.borderColor,
              }}
            >
              <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-3.5">
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl ${activeBorderMeta.ringClass}`}
                    style={{
                      backgroundColor: activeThemeMeta.bgPanel,
                      boxShadow: activeBorderMeta.glowShadow,
                    }}
                  >
                    {account.countryFlag}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h1 className="text-lg sm:text-xl font-extrabold text-white">
                        {account.username}
                      </h1>
                      <span className="text-base" title={vipMeta.nameAr}>
                        {vipMeta.badge}
                      </span>
                      <span className="text-sm" title={activeBorderMeta.nameAr}>
                        {activeBorderMeta.icon}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mt-0.5">
                      <span className="font-mono-num text-[#FFD166] font-bold">
                        {account.playerId}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="text-[#4FF5D2] font-bold">
                        {t.levelLabel} {levelInfo.currentRank.level}:{' '}
                        {getLocalizedRankTitle(
                          levelInfo.currentRank,
                          account.language
                        )}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono-num text-[#38D9A9] whitespace-nowrap">
                        {t.fairPlay}:{' '}
                        <span dir="ltr">{account.fairPlayScore}/100</span>
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono-num text-[#FFD166] font-bold whitespace-nowrap">
                        🤝 {t.sportsmanship}:{' '}
                        <span dir="ltr">
                          ⭐ {(account.sportsmanshipAvg ?? 5.0).toFixed(1)} / 5.0
                        </span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Edit Profile, Copy Player ID & Settings Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      soundFX.playClick();
                      setHomeEditUsername(account.username);
                      setHomeEditCountryCode(account.countryCode || 'SA');
                      setHomeEditError(null);
                      setIsEditingHomeProfile(prev => !prev);
                    }}
                    className="min-h-[42px] px-3.5 rounded-xl bg-[#4FF5D2]/15 hover:bg-[#4FF5D2]/25 border border-[#4FF5D2]/60 text-xs font-extrabold text-[#4FF5D2] flex items-center gap-1.5 whitespace-nowrap transition-colors"
                  >
                    <span>✏️</span>
                    <span>
                      {account.language === 'ar'
                        ? 'تعديل الاسم والدولة'
                        : 'Edit Profile'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyId}
                    className="min-h-[42px] px-3.5 rounded-xl bg-[#1B253B] hover:bg-[#28354E] border border-[#28354E] text-xs font-bold text-[#4FF5D2] flex items-center gap-1.5 whitespace-nowrap"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>
                      {copiedId ? t.copied : `${t.copyId} ${account.playerId}`}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      soundFX.playClick();
                      setActiveTab('settings');
                    }}
                    className="min-h-[42px] min-w-[42px] rounded-xl bg-[#1B253B] hover:bg-[#28354E] border border-[#28354E] flex items-center justify-center text-slate-300 hover:text-white"
                    aria-label={t.settings}
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Inline Username & Country Editor inside Home Profile Card */}
              {isEditingHomeProfile && (
                <div className="mb-4 p-4 rounded-2xl bg-[#070A12] border border-[#4FF5D2]/60 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5">
                        {account.language === 'ar'
                          ? 'الاسم المستعار (Username)'
                          : 'Username'}
                      </label>
                      <input
                        type="text"
                        maxLength={24}
                        value={homeEditUsername}
                        onChange={e => {
                          setHomeEditUsername(e.target.value);
                          setHomeEditError(null);
                        }}
                        className="w-full min-h-[42px] rounded-xl bg-[#111827] border border-[#28354E] focus:border-[#4FF5D2] focus:outline-none px-3.5 text-xs sm:text-sm font-bold text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5">
                        {account.language === 'ar'
                          ? 'الدولة والعلم'
                          : 'Country & Flag'}
                      </label>
                      <select
                        value={homeEditCountryCode}
                        onChange={e => setHomeEditCountryCode(e.target.value)}
                        className="w-full min-h-[42px] rounded-xl bg-[#111827] border border-[#28354E] focus:border-[#4FF5D2] focus:outline-none px-3 text-xs sm:text-sm font-bold text-white"
                      >
                        {WORLD_COUNTRIES.map(c => (
                          <option
                            key={c.code}
                            value={c.code}
                            className="bg-[#111827]"
                          >
                            {c.flag} {c.nameAr}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {homeEditError && (
                    <div className="text-xs font-bold text-[#FF6B81]">
                      ⚠️ {homeEditError}
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsEditingHomeProfile(false)}
                      className="min-h-[38px] px-4 rounded-xl bg-[#1B253B] hover:bg-[#28354E] text-xs font-bold text-slate-300"
                    >
                      {account.language === 'ar' ? 'إلغاء' : 'Cancel'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        soundFX.playClick();
                        const res = updatePlayerProfileIdentity(
                          account,
                          homeEditUsername,
                          homeEditCountryCode
                        );
                        if (res.errorAr || !res.account) {
                          setHomeEditError(
                            res.errorAr || 'يرجى التحقق من الاسم المدخل.'
                          );
                          return;
                        }
                        handleAccountMutation(
                          res.account,
                          '✅ تم تحديث الاسم المستعار والدولة وحفظهما بنجاح!'
                        );
                        setIsEditingHomeProfile(false);
                      }}
                      className="min-h-[38px] px-5 rounded-xl bg-gradient-to-r from-[#4FF5D2] to-[#38D9A9] text-[#070A12] text-xs font-extrabold"
                    >
                      {account.language === 'ar'
                        ? 'حفظ التعديلات فوراً'
                        : 'Save Changes'}
                    </button>
                  </div>
                </div>
              )}

              {/* XP Visual Progress Bar & Quick Metrics */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-center pt-4 border-t border-[#28354E]">
                <div className="lg:col-span-2">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-slate-300 font-bold">
                      {t.progressTowards}{' '}
                      {levelInfo.nextRank
                        ? `${t.levelLabel} ${levelInfo.nextRank.level} (${getLocalizedRankTitle(
                            levelInfo.nextRank,
                            account.language
                          )})`
                        : t.legendaryPeak}
                    </span>
                    <span className="font-mono-num text-[#4FF5D2] font-bold">
                      {account.xp} XP ({levelInfo.progressPercent}%)
                    </span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-[#070A12] overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#4FF5D2] to-[#38D9A9] transition-all duration-300"
                      style={{ width: `${levelInfo.progressPercent}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2 text-center font-mono-num text-xs">
                  <div className="p-2 rounded-xl bg-[#070A12] border border-[#28354E]">
                    <div className="text-[10px] text-slate-400">
                      {t.monthlyPoints}
                    </div>
                    <div className="text-sm font-extrabold text-[#FFD166]">
                      {account.monthlyPoints}
                    </div>
                  </div>
                  <div className="p-2 rounded-xl bg-[#070A12] border border-[#28354E]">
                    <div className="text-[10px] text-slate-400">{t.rating}</div>
                    <div className="text-sm font-extrabold text-[#4FF5D2]">
                      {account.rating}
                    </div>
                  </div>
                  <div className="p-2 rounded-xl bg-[#070A12] border border-[#28354E]">
                    <div className="text-[10px] text-slate-400">{t.wins}</div>
                    <div className="text-sm font-extrabold text-[#38D9A9]">
                      {account.onlineWins}
                    </div>
                  </div>
                  <div className="p-2 rounded-xl bg-[#070A12] border border-[#FFD166]/40">
                    <div className="text-[10px] text-slate-400">
                      {t.sportsmanship}
                    </div>
                    <div dir="ltr" className="text-sm font-extrabold text-[#FFD166]">
                      ⭐ {(account.sportsmanshipAvg ?? 5.0).toFixed(1)}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 3 Game Modes + 4-Digit Private Room Selector */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-extrabold text-white">
                  {t.chooseGameModeTitle}
                </h2>
                <span className="text-xs text-slate-400">
                  {t.matchFormatSubtitle}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <button
                  type="button"
                  disabled={!isOnline}
                  onClick={() => {
                    if (!isOnline) return;
                    soundFX.playClick();
                    setSelectedMode('online');
                  }}
                  className={`p-4 rounded-2xl border text-start transition-all ${
                    !isOnline
                      ? 'bg-[#070A12] border-[#28354E] opacity-45 cursor-not-allowed'
                      : selectedMode === 'online'
                      ? 'bg-[#1B253B] border-[#4FF5D2] shadow-[0_0_20px_rgba(79,245,210,0.15)]'
                      : 'bg-[#111827] border-[#28354E] hover:bg-[#1B253B]/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-2xl">🌍</span>
                    {!isOnline && (
                      <span className="text-[10px] font-bold text-[#FF6B81] flex items-center gap-1">
                        <Lock className="w-3 h-3" /> {t.requiresInternet}
                      </span>
                    )}
                  </div>
                  <div className="text-xs font-extrabold text-white mb-0.5">
                    {t.onlineMode}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {t.onlineModeDesc}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    soundFX.playClick();
                    setSelectedMode('local');
                  }}
                  className={`p-4 rounded-2xl border text-start transition-all ${
                    selectedMode === 'local'
                      ? 'bg-[#1B253B] border-[#A78BFA] shadow-[0_0_20px_rgba(167,139,250,0.15)]'
                      : 'bg-[#111827] border-[#28354E] hover:bg-[#1B253B]/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-2xl">👥</span>
                    {!isOnline && (
                      <span className="text-[10px] font-bold text-[#38D9A9]">
                        {t.availableOffline}
                      </span>
                    )}
                  </div>
                  <div className="text-xs font-extrabold text-white mb-0.5">
                    {t.localMode}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {t.localModeDesc}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    soundFX.playClick();
                    setSelectedMode('solo');
                  }}
                  className={`p-4 rounded-2xl border text-start transition-all ${
                    selectedMode === 'solo'
                      ? 'bg-[#1B253B] border-[#38D9A9] shadow-[0_0_20px_rgba(56,217,169,0.15)]'
                      : 'bg-[#111827] border-[#28354E] hover:bg-[#1B253B]/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-2xl">🎯</span>
                    {!isOnline && (
                      <span className="text-[10px] font-bold text-[#38D9A9]">
                        {t.availableOffline}
                      </span>
                    )}
                  </div>
                  <div className="text-xs font-extrabold text-white mb-0.5">
                    {t.soloMode}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {t.soloModeDesc}
                  </div>
                </button>

                <button
                  type="button"
                  disabled={!isOnline}
                  onClick={() => {
                    if (!isOnline) return;
                    soundFX.playClick();
                    setGeneratedRoomCode('');
                    setJoinRoomInput('');
                    setRoomModalOpen(true);
                  }}
                  className={`p-4 rounded-2xl border text-start transition-all ${
                    !isOnline
                      ? 'bg-[#070A12] border-[#28354E] opacity-45 cursor-not-allowed'
                      : 'bg-[#111827] hover:bg-[#1B253B] border-[#FFD166]/60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-2xl">🏠</span>
                    {!isOnline && (
                      <span className="text-[10px] font-bold text-[#FF6B81] flex items-center gap-1">
                        <Lock className="w-3 h-3" /> {t.requiresInternet}
                      </span>
                    )}
                  </div>
                  <div className="text-xs font-extrabold text-[#FFD166] mb-0.5">
                    {t.privateRoom}
                  </div>
                  <div className="text-[11px] text-slate-300">
                    {t.privateRoomDesc}
                  </div>
                </button>
              </div>
            </div>

            {/* Featured Golden Card & Categories Section with Quick Search + Type Filter */}
            <div>
              {(() => {
                const searchUi =
                  CATEGORY_SEARCH_UI[account.language] || CATEGORY_SEARCH_UI.ar;
                const getTypeLabel = (catId: CategoryId): string => {
                  const group = CATEGORY_TYPE_BY_ID[catId];
                  if (group === 'religious') return searchUi.typeReligious;
                  if (group === 'science') return searchUi.typeScience;
                  if (group === 'humanities') return searchUi.typeHumanities;
                  return searchUi.typeGeneral;
                };

                const normalizedQuery =
                  normalizeCategorySearchText(categorySearchQuery);

                const matchesCategoryFilter = (
                  cat: (typeof QUIZ_CATEGORIES)[number]
                ): boolean => {
                  const catGroup = CATEGORY_TYPE_BY_ID[cat.id];
                  if (
                    selectedCategoryType !== 'all' &&
                    catGroup !== selectedCategoryType
                  ) {
                    return false;
                  }
                  if (!normalizedQuery) return true;

                  const locCat = getLocalizedCategory(cat, account.language);
                  const typeLabel = getTypeLabel(cat.id);
                  const haystack = normalizeCategorySearchText(
                    `${locCat.name} ${locCat.desc} ${cat.nameAr} ${cat.nameEn} ${cat.descAr} ${typeLabel} ${CATEGORY_EXTRA_KEYWORDS[cat.id] || ''}`
                  );
                  return haystack.includes(normalizedQuery);
                };

                const showFeaturedQuran = matchesCategoryFilter(
                  featuredQuranCategory
                );
                const filteredStandardCategories = standardCategories.filter(
                  matchesCategoryFilter
                );
                const totalMatchedCount =
                  (showFeaturedQuran ? 1 : 0) +
                  filteredStandardCategories.length;
                const isFilteringActive =
                  normalizedQuery.length > 0 || selectedCategoryType !== 'all';

                return (
                  <>
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                      <h2 className="text-base font-extrabold text-white">
                        {t.categoriesHeader}
                      </h2>
                      <div className="flex items-center gap-2">
                        {isFilteringActive && (
                          <span className="px-2.5 py-1 rounded-xl bg-[#4FF5D2]/15 border border-[#4FF5D2]/40 text-[11px] font-extrabold text-[#4FF5D2]">
                            {searchUi.resultsCount(
                              totalMatchedCount,
                              QUIZ_CATEGORIES.length
                            )}
                          </span>
                        )}
                        <span className="text-xs text-[#FFD166] font-bold">
                          {t.noRepeatActive}
                        </span>
                      </div>
                    </div>

                    {/* Quick Search Input + Competition Type Filter Bar */}
                    <div className="rounded-2xl bg-[#111827] border border-[#28354E] p-3.5 mb-4 space-y-3">
                      <div className="relative flex items-center">
                        <Search className="w-4 h-4 text-[#4FF5D2] absolute start-3.5 pointer-events-none" />
                        <input
                          type="text"
                          value={categorySearchQuery}
                          onChange={e => setCategorySearchQuery(e.target.value)}
                          placeholder={searchUi.searchPlaceholder}
                          aria-label={searchUi.searchPlaceholder}
                          className="w-full min-h-[44px] rounded-xl bg-[#070A12] border border-[#28354E] focus:border-[#4FF5D2] focus:outline-none ps-10 pe-20 text-xs sm:text-sm text-white placeholder:text-slate-400 transition-colors"
                        />
                        {categorySearchQuery.trim().length > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              soundFX.playClick();
                              setCategorySearchQuery('');
                            }}
                            className="absolute end-2 px-2.5 py-1.5 rounded-lg bg-[#1B253B] hover:bg-[#28354E] text-[11px] font-bold text-slate-200 flex items-center gap-1 transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>{searchUi.clearBtn}</span>
                          </button>
                        )}
                      </div>

                      {/* Quick Filter Buttons by Competition Type */}
                      <div className="flex items-center gap-2 overflow-x-auto pb-0.5">
                        {(
                          [
                            { id: 'all', label: searchUi.typeAll },
                            { id: 'religious', label: searchUi.typeReligious },
                            { id: 'science', label: searchUi.typeScience },
                            {
                              id: 'humanities',
                              label: searchUi.typeHumanities,
                            },
                            { id: 'general', label: searchUi.typeGeneral },
                          ] as Array<{ id: CategoryTypeGroup; label: string }>
                        ).map(tab => {
                          const active = selectedCategoryType === tab.id;
                          return (
                            <button
                              key={tab.id}
                              type="button"
                              onClick={() => {
                                soundFX.playClick();
                                setSelectedCategoryType(tab.id);
                              }}
                              className={`px-3 py-1.5 rounded-xl text-[11px] font-extrabold whitespace-nowrap border transition-all ${
                                active
                                  ? 'bg-[#4FF5D2] text-[#070A12] border-[#4FF5D2] shadow-[0_0_12px_rgba(79,245,210,0.25)]'
                                  : 'bg-[#1B253B]/70 hover:bg-[#1B253B] text-slate-300 border-[#28354E]'
                              }`}
                            >
                              {tab.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Featured Golden Card: مسابقة القرآن الكريم 📖 */}
                    {showFeaturedQuran &&
                      (() => {
                        const locQuran = getLocalizedCategory(
                          featuredQuranCategory,
                          account.language
                        );
                        return (
                          <div
                            onClick={() =>
                              handleStartCategoryMatch(featuredQuranCategory.id)
                            }
                            className="relative overflow-hidden cursor-pointer rounded-3xl bg-gradient-to-r from-[#1B253B] via-[#111827] to-[#1B253B] border-2 border-[#FFD166] p-6 mb-4 animate-golden-card hover:scale-[1.015] transition-transform flex flex-wrap items-center justify-between gap-4"
                          >
                            <div
                              aria-hidden="true"
                              className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,209,102,0.22),transparent_70%)] animate-golden-aura"
                            />

                            <div className="relative z-10 flex items-center gap-4">
                              <div className="w-16 h-16 rounded-2xl bg-[#FFD166]/20 border border-[#FFD166] flex items-center justify-center text-4xl animate-golden-icon">
                                {featuredQuranCategory.icon}
                              </div>
                              <div>
                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                  <span className="text-xs font-extrabold text-[#FFD166]">
                                    {t.featuredGoldenBadge}
                                  </span>
                                  <span className="px-2 py-0.5 rounded-md bg-[#070A12]/70 border border-[#FFD166]/40 text-[10px] font-bold text-[#FFD166]">
                                    {getTypeLabel(featuredQuranCategory.id)}
                                  </span>
                                </div>
                                <h3 className="text-xl font-extrabold text-white mb-1">
                                  {locQuran.name}
                                </h3>
                                <p className="text-xs text-slate-300">
                                  {locQuran.desc}
                                </p>
                              </div>
                            </div>

                            <button
                              type="button"
                              className="relative z-10 min-h-[46px] px-6 rounded-2xl bg-[#FFD166] text-[#070A12] font-extrabold text-xs animate-golden-cta"
                            >
                              {t.startQuranQuizBtn}
                            </button>
                          </div>
                        );
                      })()}

                    {/* Other 10 Categories Grid */}
                    {filteredStandardCategories.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                        {filteredStandardCategories.map(cat => {
                          const locCat = getLocalizedCategory(
                            cat,
                            account.language
                          );
                          return (
                            <button
                              key={cat.id}
                              type="button"
                              onClick={() => handleStartCategoryMatch(cat.id)}
                              className="rounded-3xl bg-[#111827] hover:bg-[#1B253B] border border-[#28354E] hover:border-[#4FF5D2] p-5 text-start transition-all flex items-start justify-between gap-3 group"
                            >
                              <div>
                                <div className="inline-block px-2 py-0.5 rounded-md bg-[#1B253B] border border-[#28354E] text-[10px] font-bold text-[#4FF5D2] mb-1.5">
                                  {getTypeLabel(cat.id)}
                                </div>
                                <h4 className="text-sm font-extrabold text-white group-hover:text-[#4FF5D2] transition-colors mb-1">
                                  {locCat.name}
                                </h4>
                                <p className="text-xs text-slate-400 leading-relaxed">
                                  {locCat.desc}
                                </p>
                              </div>
                              <div className="w-12 h-12 rounded-2xl bg-[#1B253B] border border-[#28354E] flex items-center justify-center text-2xl shrink-0">
                                {cat.icon}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Empty Search Result State */}
                    {totalMatchedCount === 0 && (
                      <div className="rounded-3xl bg-[#111827] border border-[#28354E] p-8 text-center">
                        <div className="text-3xl mb-2">🔍</div>
                        <h3 className="text-sm font-extrabold text-white mb-1">
                          {searchUi.noResultsTitle}
                        </h3>
                        <p className="text-xs text-slate-400 mb-4">
                          {searchUi.noResultsSub}
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            soundFX.playClick();
                            setCategorySearchQuery('');
                            setSelectedCategoryType('all');
                          }}
                          className="min-h-[40px] px-5 rounded-xl bg-[#4FF5D2] text-[#070A12] text-xs font-extrabold"
                        >
                          {searchUi.resetFilterBtn}
                        </button>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        )}
      </main>

      {/* Mobile Fixed Bottom Navigation Bar (<= 15% Viewport Height) */}
      {!activeMatch && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-16 bg-[#070A12]/95 backdrop-blur-xl border-t border-[#28354E] shadow-[0_-8px_30px_rgba(0,0,0,0.65)] grid grid-cols-6 items-center px-1 pb-[env(safe-area-inset-bottom)]">
          {(
            [
              { id: 'arena', icon: Swords, label: t.arena, onlineOnly: false },
              { id: 'store', icon: ShoppingBag, label: t.store, onlineOnly: true },
              {
                id: 'leaderboard',
                icon: Trophy,
                label: t.leaderboard,
                onlineOnly: true,
              },
              { id: 'friends', icon: Users, label: t.friends, onlineOnly: true },
              {
                id: 'achievements',
                icon: Award,
                label: t.achievements,
                onlineOnly: false,
              },
              {
                id: 'settings',
                icon: Settings,
                label: t.settings,
                onlineOnly: false,
              },
            ] as Array<{
              id: ActiveTab;
              icon: React.ElementType;
              label: string;
              onlineOnly: boolean;
            }>
          ).map(tab => {
            const IconComp = tab.icon;
            const active = activeTab === tab.id;
            const locked = tab.onlineOnly && !isOnline;
            return (
              <button
                key={tab.id}
                type="button"
                disabled={locked}
                onClick={() => {
                  if (locked) return;
                  soundFX.playClick();
                  setActiveTab(tab.id);
                }}
                className={`min-h-[44px] flex flex-col items-center justify-center ${
                  locked
                    ? 'text-slate-600 opacity-45 cursor-not-allowed'
                    : active
                    ? 'text-[#4FF5D2]'
                    : 'text-slate-400'
                }`}
              >
                <IconComp className="w-5 h-5" />
                <span className="text-[10px] font-bold mt-1 whitespace-nowrap truncate max-w-full px-0.5">
                  {tab.label}
                </span>
              </button>
            );
          })}
        </nav>
      )}

      {/* 4-Digit Private Room Modal */}
      {roomModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl bg-[#111827] border border-[#FFD166] p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-extrabold text-white">
                {t.privateRoomModalTitle}
              </h3>
              <button
                type="button"
                onClick={() => setRoomModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              {t.privateRoomModalDesc}
            </p>

            {/* Choose Room Category */}
            <div className="mb-4">
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                {t.chooseRoomCategoryLabel}
              </label>
              <select
                value={roomCategory}
                onChange={e => setRoomCategory(e.target.value as CategoryId)}
                className="w-full min-h-[44px] rounded-xl bg-[#1B253B] border border-[#28354E] px-3 text-xs text-white"
              >
                {QUIZ_CATEGORIES.map(c => {
                  const lc = getLocalizedCategory(c, account.language);
                  return (
                    <option key={c.id} value={c.id} className="bg-[#111827]">
                      {c.icon} {lc.name}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Option A: Create 4-digit Room */}
            <div className="p-4 rounded-2xl bg-[#1B253B] border border-[#28354E] mb-4 text-center">
              {generatedRoomCode ? (
                <div>
                  <div className="text-xs text-slate-300 mb-1">
                    {t.shareCodeWithFriend}
                  </div>
                  <div className="text-3xl font-extrabold font-mono-num tracking-widest text-[#FFD166] my-2">
                    {generatedRoomCode}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleJoin4DigitRoom(generatedRoomCode)}
                    className="w-full min-h-[42px] rounded-xl bg-[#4FF5D2] text-[#070A12] font-extrabold text-xs mt-2"
                  >
                    {t.startMatchInRoomBtn} #{generatedRoomCode}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleCreate4DigitRoom}
                  className="w-full min-h-[44px] rounded-xl bg-[#FFD166] text-[#070A12] font-extrabold text-xs"
                >
                  {t.createNew4DigitRoomBtn}
                </button>
              )}
            </div>

            {/* Option B: Join by 4-digit Code */}
            <div className="p-4 rounded-2xl bg-[#070A12] border border-[#28354E]">
              <div className="text-xs font-bold text-slate-300 mb-2">
                {t.orJoinFriendRoomLabel}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  maxLength={4}
                  value={joinRoomInput}
                  onChange={e =>
                    setJoinRoomInput(e.target.value.replace(/[^0-9]/g, ''))
                  }
                  placeholder="4829"
                  className="flex-1 min-h-[44px] rounded-xl bg-[#1B253B] border border-[#28354E] px-4 text-center font-mono-num text-base font-extrabold text-white"
                />
                <button
                  type="button"
                  onClick={() => handleJoin4DigitRoom(joinRoomInput)}
                  className="min-h-[44px] px-5 rounded-xl bg-[#4FF5D2] text-[#070A12] font-extrabold text-xs"
                >
                  {t.joinNowBtn}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Back Button Exit Confirmation Modal */}
      {showExitConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-3xl bg-[#111827] border border-[#28354E] p-6 text-center">
            <div className="text-4xl mb-2">🛡️</div>
            <h4 className="text-lg font-extrabold text-white mb-2">
              {t.exitConfirmTitle}
            </h4>
            <p className="text-xs text-slate-400 mb-5">{t.exitConfirmSub}</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setShowExitConfirmModal(false)}
                className="min-h-[44px] rounded-xl bg-[#4FF5D2] text-[#070A12] font-extrabold text-xs"
              >
                {t.stayInArenaBtn}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowExitConfirmModal(false);
                  setActiveMatch(null);
                  setActiveTab('arena');
                }}
                className="min-h-[44px] rounded-xl bg-[#1B253B] text-slate-300 font-bold text-xs"
              >
                {t.backToHomeBtn}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hourly Interstitial Ad Modal (Triggers after 60 minutes of playtime for non-VIP players, never during a match) */}
      {hourlyAdModalOpen && !activeMatch && account.vipTier === 'basic' && (
        <div
          dir="rtl"
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
        >
          <div className="w-full max-w-xl rounded-3xl bg-[#111827] border-2 border-[#FFD166] overflow-hidden shadow-[0_0_60px_rgba(255,209,102,0.3)]">
            {/* Top Bar with Countdown or Close Button */}
            <div className="bg-[#070A12] px-5 py-3.5 border-b border-[#28354E] flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md bg-[#FFD166]/20 border border-[#FFD166] text-[10px] font-extrabold text-[#FFD166]">
                  إعلان ساعي · NEUROX ADS
                </span>
                <span className="text-xs text-slate-400">
                  أكملت 60 دقيقة من اللعب التنافسي
                </span>
              </div>

              {hourlyAdCountdown > 0 ? (
                <div className="px-3.5 py-1 rounded-xl bg-[#1B253B] border border-[#FFD166] text-xs font-mono-num font-extrabold text-[#FFD166]">
                  يمكنك الإغلاق بعد {hourlyAdCountdown} ثوانٍ
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => handleDismissHourlyAd(false)}
                  className="px-4 py-1.5 rounded-xl bg-[#38D9A9] text-[#070A12] text-xs font-extrabold flex items-center gap-1 shadow-md"
                >
                  <span>إغلاق الإعلان ومتابعة اللعب ✕</span>
                </button>
              )}
            </div>

            {/* Ad Banner Image or Video */}
            {activeHourlyAdConfig.bannerImageUrl && (
              <div className="relative h-52 sm:h-64 w-full bg-[#070A12] overflow-hidden">
                <img
                  src={activeHourlyAdConfig.bannerImageUrl}
                  alt={activeHourlyAdConfig.adTitle}
                  className="w-full h-full object-cover opacity-90"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#111827] via-transparent to-transparent" />
              </div>
            )}

            {/* Ad Content & VIP Upgrade CTA */}
            <div className="p-6 text-center space-y-4">
              <h3 className="text-lg sm:text-xl font-extrabold text-white">
                {activeHourlyAdConfig.adTitle}
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {activeHourlyAdConfig.adDescription}
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                {activeHourlyAdConfig.targetLinkUrl &&
                activeHourlyAdConfig.targetLinkUrl.startsWith('http') ? (
                  <a
                    href={activeHourlyAdConfig.targetLinkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => handleDismissHourlyAd(false)}
                    className="w-full sm:flex-1 min-h-[46px] px-5 rounded-2xl bg-gradient-to-r from-[#FFD166] to-[#F59E0B] text-[#070A12] text-xs sm:text-sm font-extrabold shadow-lg flex items-center justify-center"
                  >
                    {activeHourlyAdConfig.ctaButtonText ||
                      '👑 اشترك في باقات VIP وأوقف الإعلانات نهائياً'}
                  </a>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleDismissHourlyAd(true)}
                    className="w-full sm:flex-1 min-h-[46px] px-5 rounded-2xl bg-gradient-to-r from-[#FFD166] to-[#F59E0B] text-[#070A12] text-xs sm:text-sm font-extrabold shadow-lg"
                  >
                    {activeHourlyAdConfig.ctaButtonText ||
                      '👑 اشترك في باقات VIP وأوقف الإعلانات نهائياً'}
                  </button>
                )}

                <button
                  type="button"
                  disabled={hourlyAdCountdown > 0}
                  onClick={() => handleDismissHourlyAd(false)}
                  className="w-full sm:w-auto min-h-[46px] px-5 rounded-2xl bg-[#1B253B] hover:bg-[#28354E] border border-[#28354E] text-xs font-bold text-slate-200 disabled:opacity-40"
                >
                  {hourlyAdCountdown > 0
                    ? `انتظر (${hourlyAdCountdown}s)`
                    : 'تخطي الإعلان ✕'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
