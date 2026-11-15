import {
  ACHIEVEMENTS_LIST,
  computeLevelInfo,
  PROFILE_BORDERS_CATALOG,
  UI_THEMES_CATALOG,
  VIP_PACKAGES,
  WORLD_COUNTRIES,
} from '../data/constants';
import {
  ChatMessageItem,
  CloudManagedPlayer,
  EconomyLedgerEntry,
  HourlyAdConfig,
  PlayerAccount,
  PromoVipCode,
  VipPaymentRequest,
  VipTier,
} from '../types';
import { ownerMutatePlayerInFirestore, syncPlayerToCloud } from './firebase';

const ACTIVE_USER_KEY = 'neurox_active_uid_v1';
const ACCOUNTS_REGISTRY_KEY = 'neurox_accounts_registry_v1';
const CHAT_MESSAGES_KEY = 'neurox_chat_messages_v1';
const OWNER_PLAYER_OVERRIDES_KEY = 'neurox_owner_player_overrides_v1';
const PLAYTIME_TRACKER_PREFIX = 'neurox_playtime_sec_v1_';
const HOURLY_AD_CONFIG_KEY = 'neurox_hourly_ad_config_v1';
const PROMO_VIP_CODES_KEY = 'neurox_promo_vip_codes_v1';
const VIP_PAYMENT_REQUESTS_KEY = 'neurox_vip_payment_requests_v1';

export function loadOwnerPlayerOverrides(): Record<string, CloudManagedPlayer> {
  try {
    const raw = localStorage.getItem(OWNER_PLAYER_OVERRIDES_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function saveOwnerPlayerOverride(player: CloudManagedPlayer): void {
  try {
    const map = loadOwnerPlayerOverrides();
    map[player.playerId] = player;
    map[player.uid] = player;
    localStorage.setItem(OWNER_PLAYER_OVERRIDES_KEY, JSON.stringify(map));

    // Also synchronize into local accounts registry if this player exists locally
    const registry = loadAllAccounts();
    for (const [uid, acc] of Object.entries(registry)) {
      if (acc.uid === player.uid || acc.playerId === player.playerId) {
        const { currentRank } = computeLevelInfo(player.xp);
        registry[uid] = {
          ...acc,
          username: player.username,
          countryCode: player.countryCode,
          countryFlag: player.countryFlag,
          xp: player.xp,
          level: currentRank.level,
          coins: player.coins,
          monthlyPoints: player.monthlyPoints,
          rating: player.rating,
          vipTier: player.vipTier,
          fairPlayScore: player.fairPlayScore,
          isBanned: player.isBanned,
          updatedAt: Date.now(),
        };
      }
    }
    saveAllAccounts(registry);
  } catch (e) {
    console.error('Failed to save owner player override', e);
  }
}

export function getTodayDateStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function loadPlaytimeSeconds(uid: string, fallback = 0): number {
  try {
    const raw = localStorage.getItem(`${PLAYTIME_TRACKER_PREFIX}${uid}`);
    if (raw === null) return Math.max(0, Math.floor(Number(fallback) || 0));
    return Math.max(0, Math.floor(Number(raw) || 0));
  } catch {
    return Math.max(0, Math.floor(Number(fallback) || 0));
  }
}

export function savePlaytimeSeconds(uid: string, seconds: number): void {
  try {
    const safeSec = Math.max(0, Math.floor(Number(seconds) || 0));
    localStorage.setItem(`${PLAYTIME_TRACKER_PREFIX}${uid}`, String(safeSec));
    const registry = loadAllAccounts();
    if (registry[uid]) {
      registry[uid].playtimeSeconds = safeSec;
      saveAllAccounts(registry);
    }
  } catch {}
}

export function sanitizeAccount(rawAcc: PlayerAccount): PlayerAccount {
  const today = getTodayDateStr();
  const safeXp = Math.max(0, Math.floor(Number(rawAcc.xp) || 0));
  const { currentRank } = computeLevelInfo(safeXp);
  const safeCoins = Math.max(0, Math.floor(Number(rawAcc.coins) || 0));

  const rawLedger = Array.isArray(rawAcc.ledger) ? [...rawAcc.ledger] : [];
  if (rawLedger.length > 0 && rawLedger[0].balanceAfter !== safeCoins) {
    rawLedger[0] = {
      ...rawLedger[0],
      balanceAfter: safeCoins,
    };
  }

  // Apply any owner override if present
  const overrides = loadOwnerPlayerOverrides();
  const ov = overrides[rawAcc.playerId] || overrides[rawAcc.uid];
  const effectiveVipTier = ov?.vipTier || rawAcc.vipTier || 'basic';

  return {
    ...rawAcc,
    xp: safeXp,
    level: currentRank.level,
    coins: safeCoins,
    monthlyPoints: Math.max(0, Math.floor(Number(rawAcc.monthlyPoints) || 0)),
    rating: Math.max(0, Math.floor(Number(rawAcc.rating ?? 1200))),
    vipTier: effectiveVipTier,
    fairPlayScore: Math.max(0, Math.min(100, Math.floor(Number(rawAcc.fairPlayScore ?? 100)))),
    playtimeSeconds: loadPlaytimeSeconds(rawAcc.uid, rawAcc.playtimeSeconds ?? 0),
    isBanned: Boolean(ov ? ov.isBanned : rawAcc.isBanned),
    lifelines: {
      fiftyFifty: Math.max(0, Math.floor(Number(rawAcc.lifelines?.fiftyFifty ?? 1))),
      freezeTime: Math.max(0, Math.floor(Number(rawAcc.lifelines?.freezeTime ?? 1))),
      autoSolve: Math.max(0, Math.floor(Number(rawAcc.lifelines?.autoSolve ?? 1))),
    },
    onlineWins: Math.max(0, Math.floor(Number(rawAcc.onlineWins) || 0)),
    totalMatches: Math.max(0, Math.floor(Number(rawAcc.totalMatches) || 0)),
    totalDraws: Math.max(0, Math.floor(Number(rawAcc.totalDraws) || 0)),
    totalCorrectAnswers: Math.max(0, Math.floor(Number(rawAcc.totalCorrectAnswers) || 0)),
    goldenCorrectAnswers: Math.max(0, Math.floor(Number(rawAcc.goldenCorrectAnswers) || 0)),
    maxComboReached: Math.max(0, Math.floor(Number(rawAcc.maxComboReached) || 0)),
    unlockedAchievements: Array.isArray(rawAcc.unlockedAchievements)
      ? rawAcc.unlockedAchievements
      : [],
    seenQuestionIds: Array.isArray(rawAcc.seenQuestionIds) ? rawAcc.seenQuestionIds : [],
    dailyMissions:
      rawAcc.dailyMissions && rawAcc.dailyMissions.dateStr === today
        ? rawAcc.dailyMissions
        : {
            dateStr: today,
            onlineWins: 0,
            onlineWinsClaimed: false,
            correctAnswers: 0,
            correctAnswersClaimed: false,
            quranCorrect: 0,
            quranCorrectClaimed: false,
          },
    ledger: rawLedger,
    matchHistory: Array.isArray(rawAcc.matchHistory) ? rawAcc.matchHistory : [],
    friends: Array.isArray(rawAcc.friends) ? rawAcc.friends : [],
  };
}

export function loadAllAccounts(): Record<string, PlayerAccount> {
  try {
    const raw = localStorage.getItem(ACCOUNTS_REGISTRY_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function saveAllAccounts(registry: Record<string, PlayerAccount>) {
  try {
    localStorage.setItem(ACCOUNTS_REGISTRY_KEY, JSON.stringify(registry));
  } catch (e) {
    console.error('Failed to save accounts to local storage', e);
  }
}

export function getActiveAccount(): PlayerAccount | null {
  try {
    const registry = loadAllAccounts();
    const activeUid = localStorage.getItem(ACTIVE_USER_KEY);
    if (activeUid && registry[activeUid]) {
      const sanitized = sanitizeAccount(registry[activeUid]);
      registry[activeUid] = sanitized;
      saveAllAccounts(registry);
      return sanitized;
    }
    return null;
  } catch {
    return null;
  }
}

export function setActiveAccountUid(uid: string | null) {
  if (!uid) {
    localStorage.removeItem(ACTIVE_USER_KEY);
  } else {
    localStorage.setItem(ACTIVE_USER_KEY, uid);
  }
}

export function generateUniquePlayerId(registry: Record<string, PlayerAccount>): string {
  const existingIds = new Set(Object.values(registry).map(a => a.playerId));
  while (true) {
    const digits = Math.floor(1000000000 + Math.random() * 9000000000).toString();
    const candidate = `#${digits}`;
    if (!existingIds.has(candidate)) {
      return candidate;
    }
  }
}

export function isUsernameTaken(
  username: string,
  registry: Record<string, PlayerAccount>,
  excludeUid?: string
): boolean {
  const normalized = username.trim().toLowerCase();
  return Object.values(registry).some(
    acc =>
      acc.uid !== excludeUid &&
      acc.username.trim().toLowerCase() === normalized
  );
}

export function updatePlayerProfileIdentity(
  currentAccount: PlayerAccount,
  newUsername: string,
  newCountryCode: string
): { account?: PlayerAccount; errorAr?: string } {
  const registry = loadAllAccounts();
  const cleanUsername = newUsername.trim();
  if (cleanUsername.length < 3) {
    return { errorAr: 'يجب أن يتكون الاسم المستعار من 3 أحرف على الأقل.' };
  }
  if (isUsernameTaken(cleanUsername, registry, currentAccount.uid)) {
    return { errorAr: 'هذا الاسم المستعار مستخدم بالفعل من قبل لاعب آخر، اختر اسماً مميزاً.' };
  }

  const countryMeta =
    WORLD_COUNTRIES.find(c => c.code === newCountryCode) || WORLD_COUNTRIES[0];

  const updated: PlayerAccount = {
    ...currentAccount,
    username: cleanUsername,
    countryCode: countryMeta.code,
    countryFlag: countryMeta.flag,
    countryName: countryMeta.nameAr,
    updatedAt: Date.now(),
  };

  const persisted = persistUpdatedAccount(updated);
  return { account: persisted.account };
}

export function validateStrongPassword(pw: string): {
  valid: boolean;
  hasMinLen: boolean;
  hasUpper: boolean;
  hasNumber: boolean;
  hasSymbol: boolean;
} {
  const hasMinLen = pw.length >= 8;
  const hasUpper = /[A-Z]/.test(pw);
  const hasNumber = /[0-9]/.test(pw);
  const hasSymbol = /[^A-Za-z0-9]/.test(pw);
  return {
    valid: hasMinLen && hasUpper && hasNumber && hasSymbol,
    hasMinLen,
    hasUpper,
    hasNumber,
    hasSymbol,
  };
}

export function createNewPlayerAccount(params: {
  username: string;
  password: string;
  contactType: 'phone' | 'email';
  contactValue: string;
  countryCode: string;
  countryFlag: string;
  countryName: string;
}): { account?: PlayerAccount; errorAr?: string } {
  const registry = loadAllAccounts();
  const cleanUsername = params.username.trim();
  if (cleanUsername.length < 3) {
    return { errorAr: 'يجب أن يتكون اسم المستخدم من 3 أحرف على الأقل' };
  }
  if (isUsernameTaken(cleanUsername, registry)) {
    return { errorAr: 'اسم المستخدم مسجل مسبقاً! يُمنع تكرار الأسماء نهائياً، اختر اسماً فريداً.' };
  }

  const pwCheck = validateStrongPassword(params.password);
  if (!pwCheck.valid) {
    return {
      errorAr: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل وتشمل حرفاً كبيراً (A-Z) ورقماً ورمزاً خاصاً (!@#$).',
    };
  }

  const uid = `usr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const playerId = generateUniquePlayerId(registry);
  const today = getTodayDateStr();
  const now = Date.now();

  const initialLedger: EconomyLedgerEntry = {
    id: `ldg_${now}`,
    timestamp: now,
    type: 'credit',
    amount: 50,
    reason: 'رصيد البداية التنافسي (حساب جديد)',
    balanceAfter: 50,
  };

  const newAccount: PlayerAccount = {
    uid,
    playerId,
    username: cleanUsername,
    passwordHash: btoa(encodeURIComponent(params.password)),
    contactType: params.contactType,
    contactValue: params.contactValue.trim(),
    countryCode: params.countryCode,
    countryFlag: params.countryFlag,
    countryName: params.countryName,
    xp: 0,
    level: 1,
    coins: 50, // Starts at 50 coins only
    monthlyPoints: 0,
    rating: 1200,
    vipTier: 'basic',
    fairPlayScore: 100,
    lifelines: {
      fiftyFifty: 1,
      freezeTime: 1,
      autoSolve: 1,
    },
    onlineWins: 0,
    totalMatches: 0,
    totalDraws: 0,
    totalCorrectAnswers: 0,
    goldenCorrectAnswers: 0,
    maxComboReached: 0,
    unlockedAchievements: [],
    seenQuestionIds: [],
    lastLoginDate: today,
    loginStreak: 1,
    lastSpinDate: '',
    adsWatchedDate: today,
    adsWatchedCount: 0,
    lastShareDate: '',
    lastDailyBossDate: '',
    dailyMissions: {
      dateStr: today,
      onlineWins: 0,
      onlineWinsClaimed: false,
      correctAnswers: 0,
      correctAnswersClaimed: false,
      quranCorrect: 0,
      quranCorrectClaimed: false,
    },
    ledger: [initialLedger],
    matchHistory: [],
    friends: [],
    soundEnabled: true,
    vibrationEnabled: true,
    language: 'ar',
    botDifficulty: 'medium',
    botPersona: 'thinker',
    createdAt: now,
    updatedAt: now,
  };

  registry[uid] = newAccount;
  saveAllAccounts(registry);
  setActiveAccountUid(uid);
  syncPlayerToCloud(newAccount).catch(() => {});

  return { account: newAccount };
}

export function loginPlayerAccount(
  identifier: string,
  password: string
): { account?: PlayerAccount; errorAr?: string } {
  const registry = loadAllAccounts();
  const cleanId = identifier.trim().toLowerCase();
  const encodedPw = btoa(encodeURIComponent(password));

  const found = Object.values(registry).find(acc => {
    const matchUsername = acc.username.trim().toLowerCase() === cleanId;
    const matchPlayerId =
      acc.playerId.toLowerCase() === cleanId ||
      acc.playerId.replace('#', '').toLowerCase() === cleanId;
    const matchContact = acc.contactValue.trim().toLowerCase() === cleanId;
    return matchUsername || matchPlayerId || matchContact;
  });

  if (!found) {
    return { errorAr: 'لم يتم العثور على حساب بهذا الاسم أو الرقم أو المعرّف (#ID).' };
  }

  if (found.passwordHash !== encodedPw) {
    return { errorAr: 'كلمة المرور غير صحيحة، يرجى التأكد والمحاولة مجدداً.' };
  }

  const sanitizedFound = sanitizeAccount(found);
  const today = getTodayDateStr();
  if (sanitizedFound.adsWatchedDate !== today) {
    sanitizedFound.adsWatchedDate = today;
    sanitizedFound.adsWatchedCount = 0;
  }

  registry[sanitizedFound.uid] = sanitizedFound;
  saveAllAccounts(registry);
  setActiveAccountUid(sanitizedFound.uid);
  syncPlayerToCloud(sanitizedFound).catch(() => {});

  return { account: sanitizedFound };
}

export function persistUpdatedAccount(
  rawUpdated: PlayerAccount
): { account: PlayerAccount; newlyUnlockedTitles: string[] } {
  const registry = loadAllAccounts();
  const updated = sanitizeAccount({ ...rawUpdated });

  // Recompute level from XP
  const { currentRank } = computeLevelInfo(updated.xp);
  updated.level = currentRank.level;

  // Check 8 Achievements and award +15 coins each
  const newlyUnlockedTitles: string[] = [];
  const checkMap: Record<string, boolean> = {
    first_win:
      updated.onlineWins >= 1 ||
      updated.matchHistory.some(
        m => m.outcome === 'win' || m.outcome === 'forfeit_win'
      ),
    correct_100: updated.totalCorrectAnswers >= 100,
    wins_10: updated.onlineWins >= 10,
    combo_10: updated.maxComboReached >= 10,
    golden_10: updated.goldenCorrectAnswers >= 10,
    answers_500: updated.totalCorrectAnswers >= 500,
    rating_1500: updated.rating >= 1500,
    draws_5: updated.totalDraws >= 5,
  };

  for (const ach of ACHIEVEMENTS_LIST) {
    if (checkMap[ach.id] && !updated.unlockedAchievements.includes(ach.id)) {
      updated.unlockedAchievements = [...updated.unlockedAchievements, ach.id];
      updated.coins += ach.rewardCoins;
      const entry: EconomyLedgerEntry = {
        id: `ldg_ach_${ach.id}_${Date.now()}`,
        timestamp: Date.now(),
        type: 'credit',
        amount: ach.rewardCoins,
        reason: `مكافأة فتح وسام: ${ach.titleAr}`,
        balanceAfter: updated.coins,
      };
      updated.ledger = [entry, ...updated.ledger.slice(0, 99)];
      newlyUnlockedTitles.push(
        `${ach.icon} ${ach.titleAr} (+${ach.rewardCoins} 🪙)`
      );
    }
  }

  if (updated.ledger.length > 0 && updated.ledger[0].balanceAfter !== updated.coins) {
    updated.ledger = [
      { ...updated.ledger[0], balanceAfter: updated.coins },
      ...updated.ledger.slice(1),
    ];
  }

  updated.updatedAt = Date.now();
  registry[updated.uid] = updated;
  saveAllAccounts(registry);
  setActiveAccountUid(updated.uid);
  syncPlayerToCloud(updated).catch(() => {});

  return { account: updated, newlyUnlockedTitles };
}

export function loadFriendChats(friendId: string): ChatMessageItem[] {
  try {
    const raw = localStorage.getItem(CHAT_MESSAGES_KEY);
    if (!raw) return [];
    const all: ChatMessageItem[] = JSON.parse(raw);
    return all.filter(m => m.friendId === friendId).sort((a, b) => a.timestamp - b.timestamp);
  } catch {
    return [];
  }
}

export function appendFriendChatMessage(msg: ChatMessageItem) {
  try {
    const raw = localStorage.getItem(CHAT_MESSAGES_KEY);
    const all: ChatMessageItem[] = raw ? JSON.parse(raw) : [];
    all.push(msg);
    localStorage.setItem(CHAT_MESSAGES_KEY, JSON.stringify(all.slice(-300)));
  } catch (e) {
    console.error('Failed to save chat message', e);
  }
}

// ============================================================================
// MONETIZATION 1: HOURLY INTERSTITIAL AD SYSTEM & OWNER AD CONFIGURATION
// ============================================================================

export const DEFAULT_HOURLY_AD_CONFIG: HourlyAdConfig = {
  enabled: true,
  intervalSeconds: 3600, // 60 minutes = 3600 seconds
  countdownSeconds: 7, // 7 seconds countdown before dismissal
  adTitle: '👑 ارتقِ بتجربتك في NEUROX ESPORTS إلى مستوى الأساطير!',
  adDescription:
    'احصل على الباقة الملكية الذهبية (VIP) الآن واستمتع بلعب متواصل بدون أي إعلانات تلقائية، مع +250 عملة ذهبية فورية ومضاعفة مكافآت الفوز ووسائل المساعدة الذكية!',
  bannerImageUrl:
    'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80',
  videoUrl: '',
  targetLinkUrl: '#vip-store',
  ctaButtonText: '👑 استكشف باقات VIP وأوقف الإعلانات فوراً',
  stripeBronzeUrl: 'https://checkout.stripe.com/pay/neurox_vip_bronze_299',
  stripeSilverUrl: 'https://checkout.stripe.com/pay/neurox_vip_silver_599',
  stripeGoldUrl: 'https://checkout.stripe.com/pay/neurox_vip_royal_gold_999',
  paypalCheckoutUrl: 'https://www.paypal.com/checkoutnow?token=NEUROX_VIP_PASS',
  ownerContactInfo: 'تواصل مع الإدارة عبر واتساب أو تيليجرام للحصول على كود التفعيل الفوري بعد التحويل',
  updatedAt: Date.now(),
};

export function loadHourlyAdConfig(): HourlyAdConfig {
  try {
    const raw = localStorage.getItem(HOURLY_AD_CONFIG_KEY);
    if (!raw) return { ...DEFAULT_HOURLY_AD_CONFIG };
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_HOURLY_AD_CONFIG,
      ...parsed,
      intervalSeconds: Math.max(60, Math.floor(Number(parsed.intervalSeconds) || 3600)),
      countdownSeconds: Math.max(3, Math.min(30, Math.floor(Number(parsed.countdownSeconds) || 7))),
    };
  } catch {
    return { ...DEFAULT_HOURLY_AD_CONFIG };
  }
}

export function saveHourlyAdConfig(config: HourlyAdConfig): HourlyAdConfig {
  const sanitized: HourlyAdConfig = {
    ...DEFAULT_HOURLY_AD_CONFIG,
    ...config,
    intervalSeconds: Math.max(60, Math.floor(Number(config.intervalSeconds) || 3600)),
    countdownSeconds: Math.max(3, Math.min(30, Math.floor(Number(config.countdownSeconds) || 7))),
    updatedAt: Date.now(),
  };
  try {
    localStorage.setItem(HOURLY_AD_CONFIG_KEY, JSON.stringify(sanitized));
  } catch (e) {
    console.error('Failed to save hourly ad config', e);
  }
  return sanitized;
}

// ============================================================================
// MONETIZATION 2: VIP / PROMO CODES & DIRECT VIP PACKAGE ACTIVATION
// ============================================================================

const INITIAL_PROMO_VIP_CODES: PromoVipCode[] = [
  {
    code: 'VIP-ROYAL-2026',
    rewardType: 'vip',
    vipTier: 'royal_gold',
    bonusCoins: 250,
    maxUses: 100,
    usedByPlayerIds: [],
    noteAr: 'قسيمة تفعيل الباقة الملكية الذهبية 👑 + 250 عملة',
    createdAt: Date.now(),
  },
  {
    code: 'VIP-SILVER-2026',
    rewardType: 'vip',
    vipTier: 'silver',
    bonusCoins: 100,
    maxUses: 100,
    usedByPlayerIds: [],
    noteAr: 'قسيمة تفعيل الباقة الفضية 🥈 + 100 عملة',
    createdAt: Date.now(),
  },
  {
    code: 'VIP-BRONZE-2026',
    rewardType: 'vip',
    vipTier: 'bronze',
    bonusCoins: 50,
    maxUses: 100,
    usedByPlayerIds: [],
    noteAr: 'قسيمة تفعيل الباقة البرونزية 🥉 + 50 عملة',
    createdAt: Date.now(),
  },
  {
    code: 'NEUROX-500',
    rewardType: 'coins',
    bonusCoins: 500,
    maxUses: 200,
    usedByPlayerIds: [],
    noteAr: 'قسيمة شحن 500 عملة ذهبية 🪙',
    createdAt: Date.now(),
  },
];

export function loadPromoVipCodes(): PromoVipCode[] {
  try {
    const raw = localStorage.getItem(PROMO_VIP_CODES_KEY);
    if (!raw) {
      localStorage.setItem(PROMO_VIP_CODES_KEY, JSON.stringify(INITIAL_PROMO_VIP_CODES));
      return [...INITIAL_PROMO_VIP_CODES];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : [...INITIAL_PROMO_VIP_CODES];
  } catch {
    return [...INITIAL_PROMO_VIP_CODES];
  }
}

export function savePromoVipCodes(codes: PromoVipCode[]): void {
  try {
    localStorage.setItem(PROMO_VIP_CODES_KEY, JSON.stringify(codes));
  } catch (e) {
    console.error('Failed to save promo VIP codes', e);
  }
}

export function generateOwnerPromoVipCode(params: {
  customCode?: string;
  rewardType: 'vip' | 'coins';
  vipTier?: VipTier;
  bonusCoins: number;
  maxUses: number;
  noteAr?: string;
}): PromoVipCode {
  const existing = loadPromoVipCodes();
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  const prefix =
    params.rewardType === 'vip'
      ? params.vipTier === 'royal_gold'
        ? 'ROYAL'
        : params.vipTier === 'silver'
        ? 'SILVER'
        : 'BRONZE'
      : 'COINS';

  const cleanCode = (params.customCode || `${prefix}-${randomSuffix}-${Math.floor(100 + Math.random() * 900)}`)
    .trim()
    .toUpperCase();

  const pkgMeta = VIP_PACKAGES.find(p => p.id === params.vipTier);

  const newCode: PromoVipCode = {
    code: cleanCode,
    rewardType: params.rewardType,
    vipTier: params.rewardType === 'vip' ? params.vipTier || 'royal_gold' : undefined,
    bonusCoins: Math.max(0, Math.floor(Number(params.bonusCoins) || 0)),
    maxUses: Math.max(1, Math.floor(Number(params.maxUses) || 1)),
    usedByPlayerIds: [],
    noteAr:
      params.noteAr?.trim() ||
      (params.rewardType === 'vip'
        ? `كود تفعيل ${pkgMeta?.nameAr || 'VIP'} + ${params.bonusCoins} عملة`
        : `كود شحن +${params.bonusCoins} عملة ذهبية`),
    createdAt: Date.now(),
  };

  const next = [newCode, ...existing.filter(c => c.code.toUpperCase() !== cleanCode)];
  savePromoVipCodes(next);
  return newCode;
}

export function deleteOwnerPromoVipCode(codeStr: string): PromoVipCode[] {
  const existing = loadPromoVipCodes();
  const next = existing.filter(c => c.code.toUpperCase() !== codeStr.toUpperCase());
  savePromoVipCodes(next);
  return next;
}

/**
 * Applies a VIP package upgrade to a PlayerAccount (grants instant coins, lifelines,
 * unlocks royal border if royal_gold, resets hourly ad timer, and logs in Economy Ledger).
 */
export function applyVipPackageToAccount(
  account: PlayerAccount,
  tier: VipTier,
  paymentMethodReason: string,
  extraCoins = 0
): PlayerAccount {
  const pkg = VIP_PACKAGES.find(p => p.id === tier) || VIP_PACKAGES[0];
  const totalBonusCoins = pkg.instantCoins + Math.max(0, extraCoins);
  const nextCoins = account.coins + totalBonusCoins;

  const entry: EconomyLedgerEntry = {
    id: `ldg_vip_${tier}_${Date.now()}`,
    timestamp: Date.now(),
    type: 'credit',
    amount: totalBonusCoins,
    reason: `${paymentMethodReason} — ${pkg.nameAr} (+${totalBonusCoins} 🪙)`,
    balanceAfter: nextCoins,
  };

  const nextOwnedBorders = account.ownedBorders || ['default_cyan'];
  const unlockedRoyalBorders =
    tier === 'royal_gold'
      ? Array.from(new Set([...nextOwnedBorders, ...PROFILE_BORDERS_CATALOG.map(b => b.id)]))
      : nextOwnedBorders;

  const nextOwnedThemes = account.ownedThemes || ['midnight_cyan'];
  const unlockedRoyalThemes =
    tier === 'royal_gold'
      ? Array.from(new Set([...nextOwnedThemes, ...UI_THEMES_CATALOG.map(th => th.id)]))
      : nextOwnedThemes;

  // Reset hourly ad playtime counter when upgrading to VIP
  savePlaytimeSeconds(account.uid, 0);

  return {
    ...account,
    vipTier: tier,
    coins: nextCoins,
    playtimeSeconds: 0,
    lifelines: {
      fiftyFifty: account.lifelines.fiftyFifty + pkg.freeLifelinesEach,
      freezeTime: account.lifelines.freezeTime + pkg.freeLifelinesEach,
      autoSolve: account.lifelines.autoSolve + pkg.freeLifelinesEach,
    },
    ownedBorders: unlockedRoyalBorders,
    equippedBorder:
      tier === 'royal_gold' ? 'royal_gold_frame' : account.equippedBorder || 'default_cyan',
    ownedThemes: unlockedRoyalThemes,
    ledger: [entry, ...account.ledger.slice(0, 99)],
    updatedAt: Date.now(),
  };
}

export function redeemPromoVipCode(
  account: PlayerAccount,
  rawCodeInput: string
): { updatedAccount?: PlayerAccount; messageAr: string; success: boolean } {
  const clean = rawCodeInput.trim().toUpperCase();
  if (!clean) {
    return {
      success: false,
      messageAr: 'يرجى إدخال كود القسيمة أولاً.',
    };
  }

  const codes = loadPromoVipCodes();
  const idx = codes.findIndex(c => c.code.toUpperCase() === clean);
  if (idx === -1) {
    return {
      success: false,
      messageAr: 'كود القسيمة غير صحيح أو منتهي الصلاحية، تأكد من كتابته بشكل صحيح.',
    };
  }

  const targetCode = codes[idx];
  if (targetCode.usedByPlayerIds.includes(account.playerId)) {
    return {
      success: false,
      messageAr: 'لقد قمت باستخدام كود القسيمة هذا مسبقاً على حسابك!',
    };
  }

  if (targetCode.usedByPlayerIds.length >= targetCode.maxUses) {
    return {
      success: false,
      messageAr: 'وصل هذا الكود إلى الحد الأقصى لعدد مرات الاستخدام.',
    };
  }

  // Mark code as used by this player
  const updatedCode: PromoVipCode = {
    ...targetCode,
    usedByPlayerIds: [...targetCode.usedByPlayerIds, account.playerId],
  };
  const nextCodes = [...codes];
  nextCodes[idx] = updatedCode;
  savePromoVipCodes(nextCodes);

  if (targetCode.rewardType === 'vip' && targetCode.vipTier) {
    const pkg = VIP_PACKAGES.find(p => p.id === targetCode.vipTier) || VIP_PACKAGES[3];
    const extraCoins = Math.max(0, targetCode.bonusCoins - pkg.instantCoins);
    const updatedAcc = applyVipPackageToAccount(
      account,
      targetCode.vipTier,
      `تفعيل كود قسيمة شحن (${targetCode.code})`,
      extraCoins
    );
    return {
      success: true,
      updatedAccount: updatedAcc,
      messageAr: `🎉 تم شحن الكود (${targetCode.code}) وتفعيل ${pkg.nameAr} ${pkg.badge} وإيقاف الإعلانات التلقائية بنجاح!`,
    };
  } else {
    const bonus = Math.max(10, targetCode.bonusCoins);
    const nextCoins = account.coins + bonus;
    const entry: EconomyLedgerEntry = {
      id: `ldg_code_${Date.now()}`,
      timestamp: Date.now(),
      type: 'credit',
      amount: bonus,
      reason: `شحن كود مكافأة ذهبية (${targetCode.code})`,
      balanceAfter: nextCoins,
    };
    const updatedAcc: PlayerAccount = {
      ...account,
      coins: nextCoins,
      ledger: [entry, ...account.ledger.slice(0, 99)],
      updatedAt: Date.now(),
    };
    return {
      success: true,
      updatedAccount: updatedAcc,
      messageAr: `🪙 تم شحن الكود (${targetCode.code}) وإضافة +${bonus} عملة ذهبية إلى رصيدك فوراً!`,
    };
  }
}

// ============================================================================
// MONETIZATION 3: VIP SUBSCRIPTION REQUESTS & 1-CLICK OWNER APPROVAL
// ============================================================================

export function loadVipPaymentRequests(): VipPaymentRequest[] {
  try {
    const raw = localStorage.getItem(VIP_PAYMENT_REQUESTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveVipPaymentRequests(requests: VipPaymentRequest[]): void {
  try {
    localStorage.setItem(VIP_PAYMENT_REQUESTS_KEY, JSON.stringify(requests));
  } catch (e) {
    console.error('Failed to save VIP payment requests', e);
  }
}

export function submitVipPaymentRequest(params: {
  account: PlayerAccount;
  requestedTier: VipTier;
  priceUsdText: string;
  paymentMethod: 'card' | 'paypal' | 'local_transfer';
  transferReference: string;
}): VipPaymentRequest {
  const existing = loadVipPaymentRequests();
  const req: VipPaymentRequest = {
    id: `vipreq_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    uid: params.account.uid,
    playerId: params.account.playerId,
    username: params.account.username,
    countryFlag: params.account.countryFlag,
    requestedTier: params.requestedTier,
    priceUsdText: params.priceUsdText,
    paymentMethod: params.paymentMethod,
    transferReference: params.transferReference.trim() || 'طلب تفعيل مباشر بعد التحويل',
    status: 'pending',
    createdAt: Date.now(),
  };

  saveVipPaymentRequests([req, ...existing.slice(0, 99)]);
  return req;
}

export async function ownerActivatePlayerVipInCloudAndLocal(
  targetPlayer: CloudManagedPlayer,
  newTier: VipTier
): Promise<CloudManagedPlayer> {
  const pkg = VIP_PACKAGES.find(p => p.id === newTier) || VIP_PACKAGES[0];
  const bonusCoins = pkg.instantCoins;
  const updatedCloud = await ownerMutatePlayerInFirestore(targetPlayer, {
    vipTier: newTier,
    coins: targetPlayer.coins + bonusCoins,
  });
  saveOwnerPlayerOverride(updatedCloud);

  // Also update full local account if this player exists in local registry
  const registry = loadAllAccounts();
  for (const [uid, acc] of Object.entries(registry)) {
    if (acc.playerId === targetPlayer.playerId || acc.uid === targetPlayer.uid) {
      registry[uid] = applyVipPackageToAccount(
        acc,
        newTier,
        'تفعيل VIP مباشر من لوحة تحكم المالك'
      );
    }
  }
  saveAllAccounts(registry);
  return updatedCloud;
}

