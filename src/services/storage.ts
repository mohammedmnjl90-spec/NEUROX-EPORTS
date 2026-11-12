import { ACHIEVEMENTS_LIST, computeLevelInfo, WORLD_COUNTRIES } from '../data/constants';
import {
  ChatMessageItem,
  CloudManagedPlayer,
  EconomyLedgerEntry,
  PlayerAccount,
} from '../types';
import { syncPlayerToCloud } from './firebase';

const ACTIVE_USER_KEY = 'neurox_active_uid_v1';
const ACCOUNTS_REGISTRY_KEY = 'neurox_accounts_registry_v1';
const CHAT_MESSAGES_KEY = 'neurox_chat_messages_v1';
const OWNER_PLAYER_OVERRIDES_KEY = 'neurox_owner_player_overrides_v1';

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

  return {
    ...rawAcc,
    xp: safeXp,
    level: currentRank.level,
    coins: safeCoins,
    monthlyPoints: Math.max(0, Math.floor(Number(rawAcc.monthlyPoints) || 0)),
    rating: Math.max(0, Math.floor(Number(rawAcc.rating ?? 1200))),
    vipTier: rawAcc.vipTier || 'basic',
    fairPlayScore: Math.max(0, Math.min(100, Math.floor(Number(rawAcc.fairPlayScore ?? 100)))),
    isBanned: Boolean(rawAcc.isBanned),
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
