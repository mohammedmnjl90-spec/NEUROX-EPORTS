import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  initializeFirestore,
  setLogLevel,
  doc,
  getDoc,
  getDocFromServer,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  onSnapshot,
  serverTimestamp,
  enableNetwork,
  disableNetwork,
  Unsubscribe,
} from 'firebase/firestore';
import appletFirebaseConfig from '../../firebase-applet-config.json';
import {
  computeLevelInfo,
  REALISTIC_HUMAN_LEADERBOARD_SEED,
} from '../data/constants';
import { getMatchQuestions } from '../data/questionBank';
import {
  CategoryId,
  CloudFriendRequestItem,
  CloudManagedPlayer,
  FriendItem,
  FriendPresenceStatus,
  PlayerAccount,
  VipTier,
} from '../types';

// Use the provisioned firebase-applet-config.json directly
export const firebaseConfig = {
  ...appletFirebaseConfig,
  firestoreDatabaseId:
    appletFirebaseConfig.firestoreDatabaseId ||
    'ai-studio-ca2a931b-ac2f-4520-a828-ab337582abf1',
};

// Silence internal SDK transport probe warnings so offline/long-polling fallback is clean
try {
  setLogLevel('silent');
} catch {}

const app = initializeApp(firebaseConfig);
export const db = initializeFirestore(
  app,
  {
    experimentalAutoDetectLongPolling: true,
  },
  firebaseConfig.firestoreDatabaseId
);
export const auth = getAuth(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

function isOfflineOrNetworkError(error: unknown): boolean {
  const msg =
    error instanceof Error
      ? error.message.toLowerCase()
      : String(error).toLowerCase();
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code?: unknown }).code).toLowerCase()
      : '';
  return (
    code === 'unavailable' ||
    code === 'failed-precondition' ||
    msg.includes('client is offline') ||
    msg.includes('could not reach cloud firestore backend') ||
    msg.includes('network error') ||
    msg.includes('offline') ||
    msg.includes('unavailable')
  );
}

/**
 * Recursively sanitizes a Firestore document payload before `setDoc` so no field is ever `undefined` or `NaN`.
 * Replaces `undefined` with `""` (empty string) and `NaN` with `0`.
 */
export function cleanFirestoreData<T extends Record<string, any>>(raw: T): T {
  const cleaned: Record<string, any> = {};
  for (const [key, val] of Object.entries(raw || {})) {
    if (val === undefined) {
      cleaned[key] = '';
    } else if (typeof val === 'number') {
      cleaned[key] = Number.isNaN(val) ? 0 : val;
    } else if (Array.isArray(val)) {
      cleaned[key] = val.map(item =>
        item === undefined ? '' : typeof item === 'number' && Number.isNaN(item) ? 0 : item
      );
    } else {
      cleaned[key] = val;
    }
  }
  return cleaned as T;
}

/**
 * Sanitizes a partial update payload before `updateDoc` by stripping `undefined` keys
 * and converting `NaN` numbers to `0` so Firestore never rejects an update.
 */
export function cleanFirestoreUpdateData<T extends Record<string, any>>(raw: T): T {
  const cleaned: Record<string, any> = {};
  for (const [key, val] of Object.entries(raw || {})) {
    if (val === undefined) {
      continue;
    }
    if (typeof val === 'number') {
      cleaned[key] = Number.isNaN(val) ? 0 : val;
    } else if (Array.isArray(val)) {
      cleaned[key] = val.map(item =>
        item === undefined ? '' : typeof item === 'number' && Number.isNaN(item) ? 0 : item
      );
    } else {
      cleaned[key] = val;
    }
  }
  return cleaned as T;
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
) {
  // Gracefully ignore transient offline/network states so offline mode works without throwing
  if (isOfflineOrNetworkError(error)) {
    return;
  }

  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map(provider => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  // Log diagnostic info without throwing or disconnecting the app's network state
  console.warn('Firestore Operation Diagnostic: ', JSON.stringify(errInfo));
}

// Validate connection on boot only when online
async function testConnection() {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return;
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch {
    // Gracefully allow offline / cached operation if backend is unreachable
  }
}
testConnection();

/**
 * Toggles Firestore network transport cleanly when browser/Android network state changes.
 */
export function setFirestoreOnlineMode(online: boolean): void {
  try {
    if (online) {
      enableNetwork(db).catch(() => {});
    } else {
      disableNetwork(db).catch(() => {});
    }
  } catch {
    // Ignore transport toggle errors
  }
}

function runWithTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number
): Promise<{ ok: true; value: T } | { ok: false; timedOut: boolean; error?: unknown }> {
  return new Promise(resolve => {
    let settled = false;
    const timer = window.setTimeout(() => {
      if (settled) return;
      settled = true;
      resolve({ ok: false, timedOut: true });
    }, timeoutMs);

    promise
      .then(value => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timer);
        resolve({ ok: true, value });
      })
      .catch(error => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timer);
        resolve({ ok: false, timedOut: false, error });
      });
  });
}

/**
 * Verifies real internet AND live Firebase Firestore connectivity.
 * In Android WebView, `navigator.onLine` alone is not enough, so this performs
 * a lightweight live server check (`getDocFromServer`) with a strict timeout.
 */
export async function checkRealInternetAndFirebaseConnection(
  timeoutMs = 2500
): Promise<boolean> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    setFirestoreOnlineMode(false);
    return false;
  }

  setFirestoreOnlineMode(true);
  const pingResult = await runWithTimeout(
    getDocFromServer(doc(db, 'players', 'neurox_ping_check')),
    timeoutMs
  );

  if (pingResult.ok) {
    return true;
  }

  if (pingResult.timedOut || isOfflineOrNetworkError(pingResult.error)) {
    return false;
  }

  // Server responded with a non-network error (e.g. permission/not-found), meaning internet & Firebase are reachable
  return true;
}

export interface CloudStartupResult {
  online: boolean;
  cloudSynced: boolean;
  timedOut: boolean;
  accountPatch?: Partial<PlayerAccount>;
}

/**
 * Real Firebase startup sync for SplashScreen.tsx:
 * - If offline (`!navigator.onLine`): skips server immediately for instant local launch.
 * - If online: enables Firestore network, reads/syncs player profile & active waiting rooms
 *   at the user's real internet speed, capped by a 12-second safety timeout so the app never hangs.
 */
export async function bootstrapCloudStartup(
  existingAccount: PlayerAccount | null,
  maxTimeoutMs = 12000,
  onStage?: (stage: 'connecting' | 'syncing' | 'done') => void
): Promise<CloudStartupResult> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    setFirestoreOnlineMode(false);
    return {
      online: false,
      cloudSynced: false,
      timedOut: false,
    };
  }

  setFirestoreOnlineMode(true);
  onStage?.('connecting');

  const syncWork = async (): Promise<{
    reachable: boolean;
    synced: boolean;
    accountPatch?: Partial<PlayerAccount>;
  }> => {
    let reachable = false;
    let synced = false;
    let accountPatch: Partial<PlayerAccount> | undefined;

    // Step 1: Verify real Firestore server response using lightweight getDocFromServer
    if (existingAccount) {
      const safeUid = getSafeDocUid(existingAccount);
      try {
        const serverUserSnap = await getDocFromServer(doc(db, 'users', safeUid));
        reachable = true;
        if (serverUserSnap.exists()) {
          const d = serverUserSnap.data();
          const patch: Partial<PlayerAccount> = {};
          if (d.vipTier && d.vipTier !== existingAccount.vipTier) {
            patch.vipTier = d.vipTier;
          }
          if (typeof d.coins === 'number' && d.coins !== existingAccount.coins) {
            patch.coins = d.coins;
          }
          if (
            typeof d.monthlyPoints === 'number' &&
            d.monthlyPoints !== existingAccount.monthlyPoints
          ) {
            patch.monthlyPoints = d.monthlyPoints;
          }
          if (typeof d.rating === 'number' && d.rating !== existingAccount.rating) {
            patch.rating = d.rating;
          }
          if (
            typeof d.fairPlayScore === 'number' &&
            d.fairPlayScore !== existingAccount.fairPlayScore
          ) {
            patch.fairPlayScore = d.fairPlayScore;
          }
          if (
            typeof d.isBanned === 'boolean' &&
            d.isBanned !== Boolean(existingAccount.isBanned)
          ) {
            patch.isBanned = d.isBanned;
          }
          if (Object.keys(patch).length > 0) {
            accountPatch = patch;
          }
        }
      } catch (err) {
        if (!isOfflineOrNetworkError(err)) {
          reachable = true;
        }
      }

      onStage?.('syncing');

      // Step 2: Sync local account & warm active rooms snapshot in parallel
      const [profileSyncOk] = await Promise.all([
        syncPlayerToCloud(
          accountPatch ? { ...existingAccount, ...accountPatch } : existingAccount
        ).catch(() => false),
        getDocs(
          query(collection(db, 'rooms'), where('status', '==', 'waiting'), limit(5))
        ).catch(() => null),
      ]);

      if (profileSyncOk) {
        reachable = true;
        synced = true;
      }
    } else {
      // No logged-in account yet: lightweight server ping + leaderboard warmup
      try {
        await getDocFromServer(doc(db, 'players', 'neurox_ping_check'));
        reachable = true;
      } catch (err) {
        if (!isOfflineOrNetworkError(err)) {
          reachable = true;
        }
      }

      onStage?.('syncing');

      try {
        await getDocs(
          query(
            collection(db, 'players'),
            where('monthlyPoints', '>=', 0),
            orderBy('monthlyPoints', 'desc'),
            limit(5)
          )
        );
        reachable = true;
        synced = true;
      } catch {
        // Ignore query error if offline
      }
    }

    return { reachable, synced, accountPatch };
  };

  const result = await runWithTimeout(syncWork(), maxTimeoutMs);
  onStage?.('done');

  const browserOnline =
    typeof navigator !== 'undefined' ? navigator.onLine : true;

  if (!result.ok) {
    return {
      online: browserOnline,
      cloudSynced: false,
      timedOut: result.timedOut,
    };
  }

  return {
    online: browserOnline && result.value.reachable,
    cloudSynced: result.value.synced,
    timedOut: false,
    accountPatch: result.value.accountPatch,
  };
}

/**
 * Syncs newly registered or logged-in account to Firestore during AuthScreen flow
 * with a hard 12-second safety timeout so AuthScreen never hangs on poor mobile networks.
 */
export async function syncAuthAccountWithCloud(
  account: PlayerAccount,
  maxTimeoutMs = 12000
): Promise<{ synced: boolean; timedOut: boolean }> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    setFirestoreOnlineMode(false);
    return { synced: false, timedOut: false };
  }

  setFirestoreOnlineMode(true);
  const res = await runWithTimeout(syncPlayerToCloud(account), maxTimeoutMs);
  if (!res.ok) {
    return { synced: false, timedOut: res.timedOut };
  }
  return { synced: Boolean(res.value), timedOut: false };
}

export async function linkGoogleCloudAccount(): Promise<User | null> {
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  return result.user;
}

export function subscribeToAuthChanges(
  cb: (user: User | null) => void
): Unsubscribe {
  return onAuthStateChanged(auth, cb);
}

// Sanitize a document ID so it strictly matches ^[a-zA-Z0-9_\-]+$ and matches account.uid
export function getSafeDocUid(account: PlayerAccount): string {
  const raw =
    account.uid ||
    auth.currentUser?.uid ||
    account.playerId.replace('#', 'plr_');
  return raw.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 120) || 'plr_default';
}

// Automatically sync player public profile to Firestore on Register, Login, and Match/Store updates
export async function syncPlayerToCloud(
  account: PlayerAccount
): Promise<boolean> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return false;
  }

  const docId = getSafeDocUid(account);
  const playerPath = `players/${docId}`;
  const userPath = `users/${docId}`;

  try {
    const existingSnap = await getDoc(doc(db, 'players', docId));
    const safeUsername = account.username.slice(0, 32).padEnd(2, '_');
    const safeCountryCode = (account.countryCode || 'SA').slice(0, 8);
    const safeCountryFlag = (account.countryFlag || '🇸🇦').slice(0, 16);
    const safePlayerId = /^#[0-9]{10}$/.test(account.playerId)
      ? account.playerId
      : `#${Math.floor(1000000000 + Math.random() * 9000000000)}`;

    const payload = cleanFirestoreData({
      uid: docId,
      playerId: existingSnap.exists()
        ? existingSnap.data().playerId || safePlayerId
        : safePlayerId,
      username: safeUsername,
      countryCode: safeCountryCode,
      countryFlag: safeCountryFlag,
      xp: Math.max(0, Math.min(1000000000, Math.floor(Number(account.xp) || 0))),
      level: Math.max(1, Math.min(6, Math.floor(Number(account.level) || 1))),
      coins: Math.max(0, Math.min(1000000000, Math.floor(Number(account.coins) || 0))),
      monthlyPoints: Math.max(
        0,
        Math.min(1000000000, Math.floor(Number(account.monthlyPoints) || 0))
      ),
      rating: Math.max(0, Math.min(1000000000, Math.floor(Number(account.rating) || 1200))),
      vipTier: account.vipTier || 'basic',
      fairPlayScore: Math.max(
        0,
        Math.min(100, Math.floor(Number(account.fairPlayScore ?? 100)))
      ),
      onlineWins: Math.max(
        0,
        Math.min(1000000000, Math.floor(Number(account.onlineWins) || 0))
      ),
      totalMatches: Math.max(
        0,
        Math.min(1000000000, Math.floor(Number(account.totalMatches) || 0))
      ),
      isBanned: Boolean(account.isBanned),
      updatedAt: serverTimestamp(),
    });

    if (!existingSnap.exists()) {
      await setDoc(
        doc(db, 'players', docId),
        cleanFirestoreData({
          ...payload,
          createdAt: serverTimestamp(),
        })
      );
    } else {
      await updateDoc(
        doc(db, 'players', docId),
        cleanFirestoreUpdateData(payload)
      );
    }

    // Mirror into `users/{docId}` collection for real-time Owner Control Panel management
    try {
      const existingUserSnap = await getDoc(doc(db, 'users', docId));
      if (!existingUserSnap.exists()) {
        await setDoc(
          doc(db, 'users', docId),
          cleanFirestoreData({
            ...payload,
            createdAt: serverTimestamp(),
          })
        );
      } else {
        await updateDoc(
          doc(db, 'users', docId),
          cleanFirestoreUpdateData(payload)
        );
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, userPath);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, playerPath);
    return false;
  }

  // If authenticated with a verified Google account, also sync isolated private vault
  const currentUser = auth.currentUser;
  if (currentUser && currentUser.emailVerified) {
    const vaultPath = `user_vaults/${currentUser.uid}`;
    try {
      const vaultSnap = await getDoc(doc(db, 'user_vaults', currentUser.uid));
      const safeContact = (
        account.contactValue ||
        currentUser.email ||
        'player@neurox.gg'
      ).slice(0, 120);
      const vaultPayload = cleanFirestoreData({
        uid: currentUser.uid,
        contactValue:
          safeContact.length >= 3 ? safeContact : 'player@neurox.gg',
        contactType: account.contactType === 'phone' ? 'phone' : 'email',
        updatedAt: serverTimestamp(),
      });
      if (!vaultSnap.exists()) {
        await setDoc(doc(db, 'user_vaults', currentUser.uid), vaultPayload);
      } else {
        await updateDoc(
          doc(db, 'user_vaults', currentUser.uid),
          cleanFirestoreUpdateData(vaultPayload)
        );
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, vaultPath);
    }
  }

  return true;
}

export interface CloudLeaderboardEntry {
  uid: string;
  playerId: string;
  username: string;
  countryFlag: string;
  monthlyPoints: number;
  rating: number;
  vipTier: 'basic' | 'bronze' | 'silver' | 'royal_gold';
  level: number;
  isBanned?: boolean;
}

export async function fetchCloudLeaderboard(): Promise<
  CloudLeaderboardEntry[]
> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return [];
  const path = 'players';
  try {
    const q = query(
      collection(db, 'players'),
      where('monthlyPoints', '>=', 0),
      orderBy('monthlyPoints', 'desc'),
      limit(50)
    );
    const snap = await getDocs(q);
    return snap.docs
      .map(d => {
        const data = d.data();
        return {
          uid: data.uid,
          playerId: data.playerId,
          username: data.username,
          countryFlag: data.countryFlag,
          monthlyPoints: data.monthlyPoints,
          rating: data.rating,
          vipTier: data.vipTier,
          level: data.level,
          isBanned: Boolean(data.isBanned),
        };
      })
      .filter(entry => !entry.isBanned);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

export async function findCloudPlayerByIdentifier(
  searchInput: string
): Promise<CloudLeaderboardEntry | null> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return null;
  const clean = searchInput.trim();
  if (!clean) return null;
  const normalizedId = clean.startsWith('#') ? clean : `#${clean}`;
  const path = 'players';

  try {
    const q = query(
      collection(db, 'players'),
      where('monthlyPoints', '>=', 0),
      orderBy('monthlyPoints', 'desc'),
      limit(100)
    );
    const snap = await getDocs(q);
    for (const d of snap.docs) {
      const data = d.data();
      const pId = String(data.playerId || '');
      const uName = String(data.username || '');
      if (
        pId.toLowerCase() === clean.toLowerCase() ||
        pId.toLowerCase() === normalizedId.toLowerCase() ||
        uName.toLowerCase() === clean.toLowerCase()
      ) {
        return {
          uid: data.uid,
          playerId: pId,
          username: uName,
          countryFlag: data.countryFlag || '🇸🇦',
          monthlyPoints: data.monthlyPoints || 0,
          rating: data.rating || 1200,
          vipTier: data.vipTier || 'basic',
          level: data.level || 1,
        };
      }
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return null;
  }
}

export function generateRoomQuestionSeeds(
  baseSeed: number,
  count = 25
): number[] {
  const seeds: number[] = [];
  let state = Math.max(1, Math.abs(Math.floor(baseSeed)) || 7919);
  for (let i = 0; i < count; i++) {
    state = (state * 1664525 + 1013904223) % 2147483647;
    seeds.push(Math.abs(state));
  }
  return seeds;
}

function normalizePlayerIdTag(id: string): string {
  const trimmed = (id || '').trim().toLowerCase();
  if (!trimmed) return '';
  return trimmed.startsWith('#') ? trimmed : `#${trimmed}`;
}

function getRoomCollectionName(roomCode: string): 'global_matchmaking' | 'rooms' {
  return roomCode.startsWith('gmm_') ? 'global_matchmaking' : 'rooms';
}

export async function createCloudPrivateRoom(
  roomCode: string,
  hostAccount: PlayerAccount,
  category: string,
  questionSeed: number,
  targetPlayerId = '',
  customQuestionSeeds?: number[]
): Promise<boolean> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return false;
  const cleanRoomCode = String(roomCode || '')
    .replace(/[^a-zA-Z0-9_-]/g, '')
    .slice(0, 32);
  if (cleanRoomCode.length < 4) return false;

  const colName = getRoomCollectionName(cleanRoomCode);
  const hostUid = getSafeDocUid(hostAccount);
  const path = `${colName}/${cleanRoomCode}`;
  const cleanTargetId =
    targetPlayerId === '__online_matchmaking__'
      ? '__online_matchmaking__'
      : normalizePlayerIdTag(targetPlayerId || '').slice(0, 32);
  const safeSeed = Math.max(0, Math.floor(Number(questionSeed) || 7));
  const unifiedSeeds = (
    customQuestionSeeds && customQuestionSeeds.length > 0
      ? customQuestionSeeds
      : generateRoomQuestionSeeds(safeSeed, 25)
  )
    .slice(0, 25)
    .map(n => Math.max(0, Math.floor(Number(n) || 0)));

  const safeHostName =
    (hostAccount.username || 'لاعب_الميدان').trim().slice(0, 32) ||
    'لاعب_الميدان';
  const safeHostFlag =
    (hostAccount.countryFlag || '🇸🇦').trim().slice(0, 16) || '🇸🇦';
  const safeHostPlayerId = (hostAccount.playerId || '#1000000000')
    .trim()
    .slice(0, 16);
  const safeCategory = (
    (category || 'cocktail').trim().slice(0, 32) || 'cocktail'
  ) as CategoryId;

  const unifiedQuestionIds = getMatchQuestions(
    safeCategory,
    25,
    [],
    safeSeed,
    unifiedSeeds
  )
    .slice(0, 25)
    .map(q => String(q.id || 'q_qur_1'));

  // Sync player profile in background without blocking room creation
  syncPlayerToCloud(hostAccount).catch(() => {});

  const effectiveHostUid = hostUid || 'plr_host';
  const roomDocData = cleanFirestoreData({
    roomCode: cleanRoomCode,
    hostUid: effectiveHostUid,
    hostName: safeHostName,
    hostFlag: safeHostFlag,
    hostPlayerId: safeHostPlayerId,
    guestUid: '',
    guestName: '',
    guestFlag: '',
    guestPlayerId: '',
    activeTurnUid: effectiveHostUid,
    targetPlayerId: cleanTargetId || '',
    category: safeCategory,
    questionSeed: safeSeed,
    questionSeeds: unifiedSeeds,
    questionIds: unifiedQuestionIds,
    currentRound: 0,
    status: 'waiting',
    hostScore: 0,
    guestScore: 0,
    hostSelectedOption: -1,
    guestSelectedOption: -1,
    roundWinnerUid: '',
    hostAnsweredRound: 0,
    guestAnsweredRound: 0,
    hostReadyNextRound: false,
    guestReadyNextRound: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  try {
    const roomRef = doc(db, colName, cleanRoomCode);
    const existingSnap = await getDoc(roomRef).catch(() => null);
    if (!existingSnap || !existingSnap.exists()) {
      await setDoc(roomRef, roomDocData);
    } else {
      const existingData = existingSnap.data();
      // If our own waiting room already exists, keep it active/waiting cleanly
      if (
        existingData.hostUid === effectiveHostUid &&
        existingData.status === 'waiting'
      ) {
        await updateDoc(
          roomRef,
          cleanFirestoreUpdateData({
            status: 'waiting',
            activeTurnUid: effectiveHostUid,
            updatedAt: serverTimestamp(),
          })
        );
      }
    }
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    return false;
  }
}

export async function joinCloudPrivateRoom(
  roomCode: string,
  guestAccount: PlayerAccount
): Promise<{
  category: string;
  questionSeed: number;
  questionSeeds: number[];
  questionIds: string[];
  currentRound: number;
  hostName: string;
  hostFlag: string;
  hostUid: string;
  hostPlayerId: string;
  guestUid: string;
  activeTurnUid: string;
  status: string;
} | null> {
  const cleanRoomCode = String(roomCode || '')
    .replace(/[^a-zA-Z0-9_-]/g, '')
    .slice(0, 32);
  const colName = getRoomCollectionName(cleanRoomCode);
  const fallbackSeed = cleanRoomCode
    .split('')
    .reduce((acc, ch) => acc * 31 + ch.charCodeAt(0), 7);
  const fallbackSeeds = generateRoomQuestionSeeds(fallbackSeed, 25);
  const fallbackQuestionIds = getMatchQuestions(
    'cocktail',
    25,
    [],
    fallbackSeed,
    fallbackSeeds
  ).map(q => q.id);
  const fallbackResult = {
    category: 'cocktail',
    questionSeed: fallbackSeed,
    questionSeeds: fallbackSeeds,
    questionIds: fallbackQuestionIds,
    currentRound: 0,
    hostName: '',
    hostFlag: '🇸🇦',
    hostUid: '',
    hostPlayerId: '',
    guestUid: '',
    activeTurnUid: '',
    status: 'waiting',
  };

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return fallbackResult;
  }

  const rawGuestUid = getSafeDocUid(guestAccount);
  const path = `${colName}/${cleanRoomCode}`;

  // Sync guest profile asynchronously without blocking room join
  syncPlayerToCloud(guestAccount).catch(() => {});

  try {
    const roomRef = doc(db, colName, cleanRoomCode);
    let snap = await getDoc(roomRef);
    if (!snap.exists()) {
      // Wait briefly in case host's room creation is still propagating to Firestore
      await new Promise(r => setTimeout(r, 500));
      snap = await getDoc(roomRef);
    }
    if (!snap.exists()) {
      return fallbackResult;
    }

    const data = snap.data();

    const isHostRejoiningOwnWaitingRoom =
      data.hostUid === rawGuestUid &&
      (data.hostPlayerId || '') === (guestAccount.playerId || '') &&
      data.hostName === guestAccount.username;

    let assignedGuestUid = String(data.guestUid || '');
    const initialTurnUid = String(data.activeTurnUid || data.hostUid || '');

    if (data.status === 'waiting' && !isHostRejoiningOwnWaitingRoom) {
      const effectiveGuestUid =
        data.hostUid === rawGuestUid
          ? `${rawGuestUid}_guest_${(guestAccount.playerId || '').replace(/[^0-9]/g, '').slice(-4) || '2'}`.slice(
              0,
              120
            )
          : rawGuestUid;

      assignedGuestUid = effectiveGuestUid || 'plr_guest';

      await updateDoc(
        roomRef,
        cleanFirestoreUpdateData({
          guestUid: assignedGuestUid,
          guestName: (guestAccount.username || 'منافس').trim().slice(0, 32) || 'منافس',
          guestFlag: (guestAccount.countryFlag || '🇸🇦').trim().slice(0, 16) || '🇸🇦',
          guestPlayerId: (guestAccount.playerId || '#1000000000').trim().slice(0, 16),
          activeTurnUid: initialTurnUid,
          status: 'active',
          updatedAt: serverTimestamp(),
        })
      );
    }

    const catStr = String(data.category || 'cocktail') as CategoryId;
    const qSeed = Number(data.questionSeed || fallbackSeed);
    const qSeeds = Array.isArray(data.questionSeeds)
      ? data.questionSeeds.map((n: unknown) => Number(n) || 0)
      : generateRoomQuestionSeeds(qSeed, 25);
    const qIds =
      Array.isArray(data.questionIds) && data.questionIds.length > 0
        ? data.questionIds.map((id: unknown) => String(id || 'q_qur_1'))
        : getMatchQuestions(catStr, 25, [], qSeed, qSeeds).map(q => q.id);

    return {
      category: catStr,
      questionSeed: qSeed,
      questionSeeds: qSeeds,
      questionIds: qIds,
      currentRound: Number(data.currentRound ?? 0),
      hostName: String(data.hostName || 'المضيف'),
      hostFlag: String(data.hostFlag || '🇸🇦'),
      hostUid: String(data.hostUid || ''),
      hostPlayerId: String(data.hostPlayerId || ''),
      guestUid: assignedGuestUid,
      activeTurnUid: initialTurnUid,
      status: isHostRejoiningOwnWaitingRoom ? String(data.status || 'waiting') : 'active',
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
    return fallbackResult;
  }
}

export async function updateCloudRoomState(
  roomCode: string,
  updates: Partial<{
    currentRound: number;
    questionIds: string[];
    activeTurnUid: string;
    hostScore: number;
    guestScore: number;
    hostSelectedOption: number;
    guestSelectedOption: number;
    roundWinnerUid: string;
    hostAnsweredRound: number;
    guestAnsweredRound: number;
    hostReadyNextRound: boolean;
    guestReadyNextRound: boolean;
    status: 'waiting' | 'active' | 'finished' | 'completed';
  }>
): Promise<void> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return;
  const cleanRoomCode = String(roomCode || '')
    .replace(/[^a-zA-Z0-9_-]/g, '')
    .slice(0, 32);
  if (!cleanRoomCode) return;
  const colName = getRoomCollectionName(cleanRoomCode);
  const path = `${colName}/${cleanRoomCode}`;
  try {
    const cleanedUpdates = cleanFirestoreUpdateData({
      ...updates,
      updatedAt: serverTimestamp(),
    });
    await updateDoc(doc(db, colName, cleanRoomCode), cleanedUpdates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Real-time human-only online matchmaking via Firestore `global_matchmaking` collection.
 * Forces category to `'cocktail'` (comprehensive general quiz) so any two online players
 * searching from different devices are matched into the same active room without any bots.
 */
export async function findOrCreateOnlineMatchmakingRoom(
  playerAccount: PlayerAccount,
  _category?: CategoryId
): Promise<{
  role: 'host' | 'guest';
  roomCode: string;
  hostName?: string;
  hostFlag?: string;
  hostPlayerId?: string;
  hostUid?: string;
  guestUid?: string;
  activeTurnUid?: string;
} | null> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return null;
  const mySafeUid = getSafeDocUid(playerAccount);
  const myPid = normalizePlayerIdTag(playerAccount.playerId);
  const unifiedOnlineCategory: CategoryId = 'cocktail';

  try {
    const q = query(
      collection(db, 'global_matchmaking'),
      where('status', '==', 'waiting'),
      limit(25)
    );
    const snap = await getDocs(q);
    const now = Date.now();

    for (const d of snap.docs) {
      const data = d.data();
      const hUid = String(data.hostUid || '');
      const hPid = normalizePlayerIdTag(String(data.hostPlayerId || ''));
      const rawCreated = data.createdAt || data.updatedAt;
      const createdMs =
        rawCreated && typeof rawCreated.toMillis === 'function'
          ? rawCreated.toMillis()
          : now;

      // Match with any waiting real human player (created within the last 5 minutes)
      if (
        hUid !== mySafeUid &&
        hPid !== myPid &&
        now - createdMs <= 5 * 60 * 1000
      ) {
        const joined = await joinCloudPrivateRoom(d.id, playerAccount);
        if (joined && joined.status === 'active') {
          return {
            role: 'guest',
            roomCode: d.id,
            hostName: joined.hostName,
            hostFlag: joined.hostFlag,
            hostPlayerId: joined.hostPlayerId,
            hostUid: joined.hostUid,
            guestUid: joined.guestUid,
            activeTurnUid: joined.activeTurnUid,
          };
        }
      }
    }

    const gmmCode = `gmm_${Math.floor(100000 + Math.random() * 900000)}`;
    const seed = gmmCode
      .split('')
      .reduce((acc, ch) => acc * 31 + ch.charCodeAt(0), 7);
    const created = await createCloudPrivateRoom(
      gmmCode,
      playerAccount,
      unifiedOnlineCategory,
      seed,
      '__online_matchmaking__'
    );
    if (created) {
      return {
        role: 'host',
        roomCode: gmmCode,
        hostUid: mySafeUid,
        activeTurnUid: mySafeUid,
      };
    }
    return null;
  } catch {
    return null;
  }
}

export function subscribeToCloudRoom(
  roomCode: string,
  onUpdate: (data: Record<string, unknown>) => void,
  onMissing?: () => void
): Unsubscribe | null {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return null;
  const cleanRoomCode = String(roomCode || '')
    .replace(/[^a-zA-Z0-9_-]/g, '')
    .slice(0, 32);
  if (!cleanRoomCode) return null;
  const colName = getRoomCollectionName(cleanRoomCode);
  const path = `${colName}/${cleanRoomCode}`;
  try {
    return onSnapshot(
      doc(db, colName, cleanRoomCode),
      snap => {
        if (snap.exists()) {
          onUpdate(snap.data());
        } else {
          onMissing?.();
        }
      },
      error => {
        handleFirestoreError(error, OperationType.GET, path);
      }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
    return null;
  }
}

/**
 * Real-time listener for newly opened challenge rooms in Firestore (`rooms` with status === 'waiting')
 * across different mobile devices via Cloud Firestore.
 * Immediately notifies the second device when `targetPlayerId === myAccount.playerId`
 * (or when an open waiting room is created).
 */
export function subscribeToIncomingCloudChallenges(
  myAccount: PlayerAccount,
  onNewChallenge: (
    roomCode: string,
    hostUid: string,
    hostName: string,
    hostFlag: string,
    category: string,
    hostPlayerId?: string,
    targetPlayerId?: string
  ) => void
): Unsubscribe {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return () => {};
  }
  try {
    const mySafeUid = getSafeDocUid(myAccount);
    const myNormalizedId = normalizePlayerIdTag(myAccount.playerId || '');
    const path = 'rooms';
    const seenRoomCodes = new Set<string>();
    let isInitialSnapshot = true;

    const q = query(collection(db, 'rooms'), where('status', '==', 'waiting'));

    const processRoomDoc = (
      docId: string,
      data: Record<string, any>,
      isFromInitial: boolean
    ) => {
      const roomCode = String(data.roomCode || docId);
      const rawTarget = String(data.targetPlayerId || '');
      if (rawTarget === '__online_matchmaking__' || roomCode.startsWith('mm_')) {
        seenRoomCodes.add(roomCode);
        return;
      }

      const hostUid = String(data.hostUid || '');
      const hostName = String(data.hostName || 'منافس جديد');
      const hostFlag = String(data.hostFlag || '🇸🇦');
      const hostPlayerId = String(data.hostPlayerId || '');
      const targetPlayerId = normalizePlayerIdTag(rawTarget);
      const category = String(data.category || 'cocktail');

      // Never notify the host about their own room
      if (
        hostUid === mySafeUid ||
        (hostPlayerId && normalizePlayerIdTag(hostPlayerId) === myNormalizedId) ||
        hostName.toLowerCase() === (myAccount.username || '').toLowerCase()
      ) {
        seenRoomCodes.add(roomCode);
        return;
      }

      // If this room targets a specific player ID, ONLY notify that exact target player
      if (targetPlayerId && targetPlayerId !== myNormalizedId) {
        seenRoomCodes.add(roomCode);
        return;
      }

      // On initial snapshot, only trigger if this room is specifically targeting this player
      // and was created within the last 5 minutes so stale old rooms don't pop up
      if (isFromInitial) {
        const rawCreated = data.createdAt || data.updatedAt;
        const createdMs =
          rawCreated && typeof rawCreated.toMillis === 'function'
            ? rawCreated.toMillis()
            : Date.now();
        const isRecentTargetedInvite =
          targetPlayerId === myNormalizedId &&
          Date.now() - createdMs <= 5 * 60 * 1000;

        seenRoomCodes.add(roomCode);
        if (isRecentTargetedInvite) {
          onNewChallenge(
            roomCode,
            hostUid,
            hostName,
            hostFlag,
            category,
            hostPlayerId,
            targetPlayerId
          );
        }
        return;
      }

      if (seenRoomCodes.has(roomCode)) return;
      seenRoomCodes.add(roomCode);

      onNewChallenge(
        roomCode,
        hostUid,
        hostName,
        hostFlag,
        category,
        hostPlayerId,
        targetPlayerId
      );
    };

    return onSnapshot(
      q,
      snap => {
        if (isInitialSnapshot) {
          isInitialSnapshot = false;
          snap.docs.forEach(d => {
            processRoomDoc(d.id, d.data(), true);
          });
          return;
        }

        snap.docChanges().forEach(change => {
          if (change.type === 'added' || change.type === 'modified') {
            const data = change.doc.data();
            if (data.status === 'waiting') {
              processRoomDoc(change.doc.id, data, false);
            }
          }
        });
      },
      error => {
        handleFirestoreError(error, OperationType.LIST, path);
      }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'rooms');
    return () => {};
  }
}

// ============================================================================
// REAL-TIME CLOUD FRIEND REQUESTS (`friend_requests` in Firestore)
// ============================================================================

export async function sendCloudFriendRequest(
  fromAccount: PlayerAccount,
  targetPlayer: {
    uid?: string;
    playerId: string;
    username?: string;
    countryFlag?: string;
    rating?: number;
    vipTier?: VipTier;
  }
): Promise<{ ok: boolean; requestId: string }> {
  const fromPid = normalizePlayerIdTag(fromAccount.playerId || '#1000000000').slice(
    0,
    16
  );
  const toPid = normalizePlayerIdTag(targetPlayer.playerId || '').slice(0, 16);
  const cleanFromDigits = fromPid.replace(/[^a-zA-Z0-9]/g, '') || '0';
  const cleanToDigits = toPid.replace(/[^a-zA-Z0-9]/g, '') || '0';
  const requestId = `freq_${cleanFromDigits}_${cleanToDigits}`.slice(0, 120);

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return { ok: false, requestId };
  }

  // Ensure sender's profile is synced to Firestore so the recipient can always discover them
  syncPlayerToCloud(fromAccount).catch(() => {});

  const fromSafeUid = getSafeDocUid(fromAccount);
  const toSafeUid = (targetPlayer.uid || `plr_${cleanToDigits}`)
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, 120);

  const payload = cleanFirestoreData({
    requestId,
    fromUid: fromSafeUid,
    fromPlayerId: fromPid,
    fromName: (fromAccount.username || 'لاعب_الميدان').trim().slice(0, 32) || 'لاعب',
    fromFlag: (fromAccount.countryFlag || '🇸🇦').trim().slice(0, 16) || '🇸🇦',
    fromRating: Math.max(0, Math.floor(Number(fromAccount.rating || 1200))),
    fromVipTier: (fromAccount.vipTier || 'basic') as VipTier,
    toPlayerId: toPid,
    toUid: toSafeUid,
    toName: (targetPlayer.username || `لاعب ${toPid}`).trim().slice(0, 32),
    toFlag: (targetPlayer.countryFlag || '🇸🇦').trim().slice(0, 16) || '🇸🇦',
    toRating: Math.max(0, Math.floor(Number(targetPlayer.rating || 1200))),
    toVipTier: (targetPlayer.vipTier || 'basic') as VipTier,
    status: 'pending',
    timestamp: Math.floor(Date.now()),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  try {
    const reqRef = doc(db, 'friend_requests', requestId);
    const existingSnap = await getDoc(reqRef).catch(() => null);
    if (!existingSnap || !existingSnap.exists()) {
      await setDoc(reqRef, payload);
    } else {
      await updateDoc(
        reqRef,
        cleanFirestoreUpdateData({
          status: 'pending',
          timestamp: Math.floor(Date.now()),
          updatedAt: serverTimestamp(),
        })
      );
    }
    return { ok: true, requestId };
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `friend_requests/${requestId}`);
    return { ok: false, requestId };
  }
}

export async function respondToCloudFriendRequest(
  requestId: string,
  acceptorAccount: PlayerAccount,
  decision: 'accepted' | 'rejected'
): Promise<boolean> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return false;
  const cleanId = String(requestId || '')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, 120);
  if (!cleanId) return false;

  // Ensure acceptor's profile is also synced to Firestore
  syncPlayerToCloud(acceptorAccount).catch(() => {});

  try {
    const reqRef = doc(db, 'friend_requests', cleanId);
    await updateDoc(
      reqRef,
      cleanFirestoreUpdateData({
        status: decision,
        toUid: getSafeDocUid(acceptorAccount),
        toName: (acceptorAccount.username || 'لاعب').trim().slice(0, 32) || 'لاعب',
        toFlag: (acceptorAccount.countryFlag || '🇸🇦').trim().slice(0, 16) || '🇸🇦',
        toRating: Math.max(0, Math.floor(Number(acceptorAccount.rating || 1200))),
        toVipTier: (acceptorAccount.vipTier || 'basic') as VipTier,
        timestamp: Math.floor(Date.now()),
        updatedAt: serverTimestamp(),
      })
    );
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `friend_requests/${cleanId}`);
    return false;
  }
}

/**
 * Real-time listener (`onSnapshot`) on `friend_requests` in Firestore:
 * 1) Watches incoming `pending` requests where `toPlayerId === myAccount.playerId`
 *    and triggers `onIncomingPending(pendingList, newestRequest)` so a live pop-up banner
 *    appears immediately on Player B's screen ("لديك طلب صداقة جديد من [الاسم] - قبول / رفض").
 * 2) Watches `accepted` requests where either `fromPlayerId === myAccount.playerId` OR
 *    `toPlayerId === myAccount.playerId` and triggers `onMutualFriendAccepted(friendItem)`
 *    so BOTH players are automatically added to each other's friends list in real time!
 */
export function subscribeToCloudFriendRequests(
  myAccount: PlayerAccount,
  callbacks: {
    onIncomingPending: (
      pendingRequests: CloudFriendRequestItem[],
      newestRequest: CloudFriendRequestItem | null
    ) => void;
    onMutualFriendAccepted: (newFriend: FriendItem) => void;
  }
): Unsubscribe {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return () => {};
  }

  try {
    const myNormalizedId = normalizePlayerIdTag(myAccount.playerId || '');
    if (!myNormalizedId) return () => {};

    const seenPendingIds = new Set<string>();
    const processedAcceptedIds = new Set<string>();

    const q = query(
      collection(db, 'friend_requests'),
      where('status', 'in', ['pending', 'accepted'])
    );

    return onSnapshot(
      q,
      snap => {
        const incomingPending: CloudFriendRequestItem[] = [];
        let newestPending: CloudFriendRequestItem | null = null;

        snap.docs.forEach(d => {
          const data = d.data();
          const reqId = String(data.requestId || d.id);
          const fromPlayerId = normalizePlayerIdTag(String(data.fromPlayerId || ''));
          const toPlayerId = normalizePlayerIdTag(String(data.toPlayerId || ''));
          const status = String(data.status || 'pending') as
            | 'pending'
            | 'accepted'
            | 'rejected';

          if (status === 'pending' && toPlayerId === myNormalizedId && fromPlayerId !== myNormalizedId) {
            const item: CloudFriendRequestItem = {
              requestId: reqId,
              fromUid: String(data.fromUid || `plr_${fromPlayerId.replace(/[^0-9]/g, '')}`),
              fromPlayerId,
              fromName: String(data.fromName || 'لاعب جديد'),
              fromFlag: String(data.fromFlag || '🇸🇦'),
              fromRating: Number(data.fromRating || 1200),
              fromVipTier: (data.fromVipTier || 'basic') as VipTier,
              toPlayerId,
              toUid: String(data.toUid || ''),
              toName: String(data.toName || ''),
              toFlag: String(data.toFlag || '🇸🇦'),
              toRating: Number(data.toRating || 1200),
              toVipTier: (data.toVipTier || 'basic') as VipTier,
              status: 'pending',
              timestamp: Number(data.timestamp || Date.now()),
            };
            incomingPending.push(item);

            if (!seenPendingIds.has(reqId)) {
              seenPendingIds.add(reqId);
              newestPending = item;
            }
          } else if (status === 'accepted') {
            if (fromPlayerId === myNormalizedId && toPlayerId && toPlayerId !== myNormalizedId) {
              // I sent this friend request and Player B just accepted it!
              const acceptKey = `${reqId}_from_${toPlayerId}`;
              if (!processedAcceptedIds.has(acceptKey)) {
                processedAcceptedIds.add(acceptKey);
                callbacks.onMutualFriendAccepted({
                  uid: String(
                    data.toUid || `plr_${toPlayerId.replace(/[^0-9]/g, '')}`
                  ),
                  playerId: toPlayerId,
                  username: String(data.toName || `صديق ${toPlayerId}`),
                  countryFlag: String(data.toFlag || '🇸🇦'),
                  rating: Number(data.toRating || 1200),
                  vipTier: (data.toVipTier || 'basic') as VipTier,
                  addedAt: Number(data.timestamp || Date.now()),
                  isFavorite: true,
                  presenceStatus: 'online',
                });
              }
            } else if (toPlayerId === myNormalizedId && fromPlayerId && fromPlayerId !== myNormalizedId) {
              // I accepted Player A's friend request! Ensure Player A is in my friends list too
              const acceptKey = `${reqId}_to_${fromPlayerId}`;
              if (!processedAcceptedIds.has(acceptKey)) {
                processedAcceptedIds.add(acceptKey);
                callbacks.onMutualFriendAccepted({
                  uid: String(
                    data.fromUid || `plr_${fromPlayerId.replace(/[^0-9]/g, '')}`
                  ),
                  playerId: fromPlayerId,
                  username: String(data.fromName || `صديق ${fromPlayerId}`),
                  countryFlag: String(data.fromFlag || '🇸🇦'),
                  rating: Number(data.fromRating || 1200),
                  vipTier: (data.fromVipTier || 'basic') as VipTier,
                  addedAt: Number(data.timestamp || Date.now()),
                  isFavorite: true,
                  presenceStatus: 'online',
                });
              }
            }
          }
        });

        incomingPending.sort((a, b) => b.timestamp - a.timestamp);
        callbacks.onIncomingPending(incomingPending, newestPending);
      },
      err => {
        handleFirestoreError(err, OperationType.LIST, 'friend_requests');
      }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'friend_requests');
    return () => {};
  }
}

export interface FriendRealtimePresence {
  status: FriendPresenceStatus;
  lastSeenMs: number;
  activeRoomCode?: string;
  activeCategory?: string;
  rating?: number;
  monthlyPoints?: number;
}

/**
 * Subscribes in real-time to Firestore `players` and `rooms` collections to compute
 * each friend's live status:
 * - 'in_match' (في مباراة): Friend is currently host or guest in a waiting/active room
 * - 'online' (نشط): Friend's player profile was updated recently in Firestore
 * - 'offline' (خارج اللعبة): Friend has not been active recently
 */
export function subscribeToFriendsPresence(
  friends: FriendItem[],
  onPresenceUpdate: (presenceMap: Record<string, FriendRealtimePresence>) => void
): Unsubscribe {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return () => {};
  }
  const playersPath = 'players';
  const roomsPath = 'rooms';

  const latestPlayersByKey = new Map<
    string,
    {
      uid: string;
      playerId: string;
      username: string;
      updatedAtMs: number;
      rating: number;
      monthlyPoints: number;
    }
  >();

  const activeRoomsByParticipant = new Map<
    string,
    { roomCode: string; category: string; updatedAtMs: number }
  >();

  const recomputePresence = () => {
    const now = Date.now();
    const ONLINE_THRESHOLD_MS = 6 * 60 * 1000; // 6 minutes
    const ROOM_ACTIVE_THRESHOLD_MS = 10 * 60 * 1000; // 10 minutes
    const result: Record<string, FriendRealtimePresence> = {};

    for (const f of friends) {
      const pidKey = f.playerId.toLowerCase();
      const uidKey = f.uid.toLowerCase();
      const nameKey = f.username.toLowerCase();

      const pRecord =
        latestPlayersByKey.get(pidKey) ||
        latestPlayersByKey.get(uidKey) ||
        latestPlayersByKey.get(nameKey);

      const roomRecord =
        activeRoomsByParticipant.get(uidKey) ||
        activeRoomsByParticipant.get(nameKey);

      const lastSeenMs = Math.max(
        pRecord?.updatedAtMs || 0,
        roomRecord?.updatedAtMs || 0
      );

      if (
        roomRecord &&
        now - roomRecord.updatedAtMs <= ROOM_ACTIVE_THRESHOLD_MS
      ) {
        result[f.playerId] = {
          status: 'in_match',
          lastSeenMs: roomRecord.updatedAtMs,
          activeRoomCode: roomRecord.roomCode,
          activeCategory: roomRecord.category,
          rating: pRecord?.rating ?? f.rating,
          monthlyPoints: pRecord?.monthlyPoints,
        };
      } else if (
        lastSeenMs > 0 &&
        now - lastSeenMs <= ONLINE_THRESHOLD_MS
      ) {
        result[f.playerId] = {
          status: 'online',
          lastSeenMs,
          rating: pRecord?.rating ?? f.rating,
          monthlyPoints: pRecord?.monthlyPoints,
        };
      } else {
        result[f.playerId] = {
          status: 'offline',
          lastSeenMs,
          rating: pRecord?.rating ?? f.rating,
          monthlyPoints: pRecord?.monthlyPoints,
        };
      }
    }

    onPresenceUpdate(result);
  };

  const playersQuery = query(
    collection(db, 'players'),
    where('monthlyPoints', '>=', 0),
    orderBy('monthlyPoints', 'desc'),
    limit(100)
  );

  const unsubPlayers = onSnapshot(
    playersQuery,
    snap => {
      latestPlayersByKey.clear();
      snap.docs.forEach(d => {
        const data = d.data();
        const uid = String(data.uid || d.id);
        const playerId = String(data.playerId || '');
        const username = String(data.username || '');
        const rawTs = data.updatedAt;
        const updatedAtMs =
          rawTs && typeof rawTs.toMillis === 'function'
            ? rawTs.toMillis()
            : Date.now();
        const entry = {
          uid,
          playerId,
          username,
          updatedAtMs,
          rating: Number(data.rating || 1200),
          monthlyPoints: Number(data.monthlyPoints || 0),
        };
        if (playerId) latestPlayersByKey.set(playerId.toLowerCase(), entry);
        if (uid) latestPlayersByKey.set(uid.toLowerCase(), entry);
        if (username) latestPlayersByKey.set(username.toLowerCase(), entry);
      });
      recomputePresence();
    },
    error => {
      handleFirestoreError(error, OperationType.LIST, playersPath);
    }
  );

  const roomsQuery = query(
    collection(db, 'rooms'),
    where('status', 'in', ['waiting', 'active'])
  );

  const unsubRooms = onSnapshot(
    roomsQuery,
    snap => {
      activeRoomsByParticipant.clear();
      snap.docs.forEach(d => {
        const data = d.data();
        const roomCode = String(data.roomCode || d.id);
        const category = String(data.category || 'cocktail');
        const hostUid = String(data.hostUid || '').toLowerCase();
        const hostName = String(data.hostName || '').toLowerCase();
        const guestUid = String(data.guestUid || '').toLowerCase();
        const guestName = String(data.guestName || '').toLowerCase();
        const rawTs = data.updatedAt || data.createdAt;
        const updatedAtMs =
          rawTs && typeof rawTs.toMillis === 'function'
            ? rawTs.toMillis()
            : Date.now();

        const rEntry = { roomCode, category, updatedAtMs };
        if (hostUid) activeRoomsByParticipant.set(hostUid, rEntry);
        if (hostName) activeRoomsByParticipant.set(hostName, rEntry);
        if (guestUid) activeRoomsByParticipant.set(guestUid, rEntry);
        if (guestName) activeRoomsByParticipant.set(guestName, rEntry);
      });
      recomputePresence();
    },
    error => {
      handleFirestoreError(error, OperationType.LIST, roomsPath);
    }
  );

  const intervalId = window.setInterval(recomputePresence, 20000);

  return () => {
    unsubPlayers();
    unsubRooms();
    window.clearInterval(intervalId);
  };
}

/**
 * Sends a direct Quick Challenge Invite to a friend via Firestore without needing
 * manual room code generation. Automatically provisions a synchronized room document
 * in Firestore with `targetPlayerId` and `status: 'waiting'`, and returns its roomCode and category.
 */
export async function sendQuickChallengeInvite(
  senderAccount: PlayerAccount,
  category = 'cocktail',
  targetPlayerId = ''
): Promise<{ roomCode: string; category: string } | null> {
  const roomCode = Math.floor(1000 + Math.random() * 9000).toString();
  const seed = roomCode
    .split('')
    .reduce((acc, ch) => acc * 31 + ch.charCodeAt(0), 7);

  const ok = await createCloudPrivateRoom(
    roomCode,
    senderAccount,
    category,
    seed,
    targetPlayerId
  );
  if (!ok) {
    return { roomCode, category };
  }
  return { roomCode, category };
}

// ============================================================================
// STEALTH OWNER CONTROL PANEL — REAL-TIME FIRESTORE USERS & ANTI-CHEAT API
// ============================================================================

const INITIAL_RADAR_SUSPECTS: CloudManagedPlayer[] = [
  {
    uid: 'suspect_cheat_01',
    playerId: '#9948102341',
    username: 'الشبح_المتسلل99',
    countryCode: 'EG',
    countryFlag: '🇪🇬',
    xp: 4800,
    level: 5,
    coins: 9450,
    monthlyPoints: 340,
    rating: 1940,
    vipTier: 'silver',
    fairPlayScore: 58,
    onlineWins: 92,
    totalMatches: 95,
    isBanned: false,
  },
  {
    uid: 'suspect_cheat_02',
    playerId: '#8837291045',
    username: 'قناص_الثغرات_X',
    countryCode: 'AE',
    countryFlag: '🇦🇪',
    xp: 3100,
    level: 4,
    coins: 7200,
    monthlyPoints: 295,
    rating: 1810,
    vipTier: 'bronze',
    fairPlayScore: 65,
    onlineWins: 74,
    totalMatches: 78,
    isBanned: false,
  },
];

export function buildBaselineManagedPlayers(
  currentAccount: PlayerAccount,
  overrides: Record<string, CloudManagedPlayer>
): CloudManagedPlayer[] {
  const map = new Map<string, CloudManagedPlayer>();

  // 1. Seed contenders from Monthly Leaderboard
  for (const seed of REALISTIC_HUMAN_LEADERBOARD_SEED) {
    const ov = overrides[seed.playerId] || overrides[seed.uid];
    map.set(seed.playerId, {
      uid: seed.uid.replace(/[^a-zA-Z0-9_-]/g, '_'),
      playerId: seed.playerId,
      username: ov?.username ?? seed.username,
      countryCode: ov?.countryCode ?? 'SA',
      countryFlag: ov?.countryFlag ?? seed.countryFlag,
      xp: ov?.xp ?? seed.level * 950,
      level: ov?.level ?? seed.level,
      coins: ov?.coins ?? 240 + seed.monthlyPoints * 2,
      monthlyPoints: ov?.monthlyPoints ?? seed.monthlyPoints,
      rating: ov?.rating ?? seed.rating,
      vipTier: ov?.vipTier ?? seed.vipTier,
      fairPlayScore: ov?.fairPlayScore ?? 100,
      onlineWins: ov?.onlineWins ?? Math.floor(seed.monthlyPoints / 4),
      totalMatches: ov?.totalMatches ?? Math.floor(seed.monthlyPoints / 3),
      isBanned: ov?.isBanned ?? false,
    });
  }

  // 2. Include Anti-Cheat Radar suspects if not yet modified
  for (const susp of INITIAL_RADAR_SUSPECTS) {
    const ov = overrides[susp.playerId] || overrides[susp.uid];
    map.set(susp.playerId, ov ? { ...susp, ...ov } : { ...susp });
  }

  // 3. Always include current owner account with freshest values
  const mySafeUid = getSafeDocUid(currentAccount);
  map.set(currentAccount.playerId, {
    uid: mySafeUid,
    playerId: currentAccount.playerId,
    username: currentAccount.username,
    countryCode: currentAccount.countryCode || 'SA',
    countryFlag: currentAccount.countryFlag || '🇸🇦',
    xp: currentAccount.xp,
    level: currentAccount.level,
    coins: currentAccount.coins,
    monthlyPoints: currentAccount.monthlyPoints,
    rating: currentAccount.rating,
    vipTier: currentAccount.vipTier,
    fairPlayScore: currentAccount.fairPlayScore,
    onlineWins: currentAccount.onlineWins,
    totalMatches: currentAccount.totalMatches,
    isBanned: Boolean(currentAccount.isBanned),
  });

  return Array.from(map.values());
}

/**
 * Ensures all baseline leaderboard & radar players exist in Firestore `users` and `players`
 * collections so the Owner Control Panel can manage them in real time in Firestore.
 */
export async function seedOwnerFirestoreUsers(
  currentAccount: PlayerAccount,
  overrides: Record<string, CloudManagedPlayer>
): Promise<void> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return;
  const baseline = buildBaselineManagedPlayers(currentAccount, overrides);

  for (const item of baseline) {
    const safeId = item.uid.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 120);
    try {
      const userRef = doc(db, 'users', safeId);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        const payload = cleanFirestoreData({
          uid: safeId,
          playerId: /^#[0-9]{10}$/.test(item.playerId)
            ? item.playerId
            : `#${Math.floor(1000000000 + Math.random() * 9000000000)}`,
          username: item.username.slice(0, 32).padEnd(2, '_'),
          countryCode: (item.countryCode || 'SA').slice(0, 8),
          countryFlag: (item.countryFlag || '🇸🇦').slice(0, 16),
          xp: Math.max(0, Math.min(1000000000, Math.floor(item.xp))),
          level: Math.max(1, Math.min(6, Math.floor(item.level))),
          coins: Math.max(0, Math.min(1000000000, Math.floor(item.coins))),
          monthlyPoints: Math.max(
            0,
            Math.min(1000000000, Math.floor(item.monthlyPoints))
          ),
          rating: Math.max(0, Math.min(1000000000, Math.floor(item.rating))),
          vipTier: item.vipTier,
          fairPlayScore: Math.max(
            0,
            Math.min(100, Math.floor(item.fairPlayScore))
          ),
          onlineWins: Math.max(0, Math.floor(item.onlineWins)),
          totalMatches: Math.max(0, Math.floor(item.totalMatches)),
          isBanned: Boolean(item.isBanned),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        await setDoc(userRef, payload);
        await setDoc(doc(db, 'players', safeId), payload);
      }
    } catch {
      // Ignore individual seed errors if offline
    }
  }
}

/**
 * Subscribes in real-time (`onSnapshot`) to both `users` and `players` collections in Firestore
 * for the Stealth Owner Control Panel.
 */
export function subscribeToOwnerAllPlayers(
  currentAccount: PlayerAccount,
  getLocalOverrides: () => Record<string, CloudManagedPlayer>,
  onUpdate: (players: CloudManagedPlayer[]) => void
): Unsubscribe {
  const usersMap = new Map<string, CloudManagedPlayer>();
  const playersMap = new Map<string, CloudManagedPlayer>();

  const emitMerged = () => {
    const overrides = getLocalOverrides();
    const mergedByPlayerId = new Map<string, CloudManagedPlayer>();

    // Start with baseline so the list is never empty
    for (const base of buildBaselineManagedPlayers(currentAccount, overrides)) {
      mergedByPlayerId.set(base.playerId, base);
    }

    // Merge Firestore `players` collection
    for (const p of playersMap.values()) {
      const ov = overrides[p.playerId] || overrides[p.uid];
      mergedByPlayerId.set(p.playerId, ov ? { ...p, ...ov } : p);
    }

    // Merge Firestore `users` collection (takes priority)
    for (const u of usersMap.values()) {
      const ov = overrides[u.playerId] || overrides[u.uid];
      mergedByPlayerId.set(u.playerId, ov ? { ...u, ...ov } : u);
    }

    // Ensure current owner's live account stats are reflected
    const mySafeUid = getSafeDocUid(currentAccount);
    mergedByPlayerId.set(currentAccount.playerId, {
      uid: mySafeUid,
      playerId: currentAccount.playerId,
      username: currentAccount.username,
      countryCode: currentAccount.countryCode || 'SA',
      countryFlag: currentAccount.countryFlag || '🇸🇦',
      xp: currentAccount.xp,
      level: currentAccount.level,
      coins: currentAccount.coins,
      monthlyPoints: currentAccount.monthlyPoints,
      rating: currentAccount.rating,
      vipTier: currentAccount.vipTier,
      fairPlayScore: currentAccount.fairPlayScore,
      onlineWins: currentAccount.onlineWins,
      totalMatches: currentAccount.totalMatches,
      isBanned: Boolean(currentAccount.isBanned),
    });

    const sorted = Array.from(mergedByPlayerId.values()).sort(
      (a, b) => b.monthlyPoints - a.monthlyPoints || b.rating - a.rating
    );
    onUpdate(sorted);
  };

  // Emit immediately so UI renders without waiting
  emitMerged();

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return () => {};
  }

  const parseSnapDoc = (d: any): CloudManagedPlayer => {
    const data = d.data();
    const xpVal = Number(data.xp ?? 0);
    const { currentRank } = computeLevelInfo(xpVal);
    return {
      uid: String(data.uid || d.id),
      playerId: String(data.playerId || `#1000000000`),
      username: String(data.username || 'لاعب'),
      countryCode: String(data.countryCode || 'SA'),
      countryFlag: String(data.countryFlag || '🇸🇦'),
      xp: xpVal,
      level: Number(data.level || currentRank.level || 1),
      coins: Number(data.coins ?? 50),
      monthlyPoints: Number(data.monthlyPoints ?? 0),
      rating: Number(data.rating ?? 1200),
      vipTier: data.vipTier || 'basic',
      fairPlayScore: Number(data.fairPlayScore ?? 100),
      onlineWins: Number(data.onlineWins ?? 0),
      totalMatches: Number(data.totalMatches ?? 0),
      isBanned: Boolean(data.isBanned),
    };
  };

  const usersQuery = query(
    collection(db, 'users'),
    where('monthlyPoints', '>=', 0),
    orderBy('monthlyPoints', 'desc'),
    limit(100)
  );

  const playersQuery = query(
    collection(db, 'players'),
    where('monthlyPoints', '>=', 0),
    orderBy('monthlyPoints', 'desc'),
    limit(100)
  );

  const unsubUsers = onSnapshot(
    usersQuery,
    snap => {
      usersMap.clear();
      snap.docs.forEach(d => {
        const parsed = parseSnapDoc(d);
        usersMap.set(parsed.playerId, parsed);
      });
      emitMerged();
    },
    err => {
      handleFirestoreError(err, OperationType.LIST, 'users');
    }
  );

  const unsubPlayers = onSnapshot(
    playersQuery,
    snap => {
      playersMap.clear();
      snap.docs.forEach(d => {
        const parsed = parseSnapDoc(d);
        playersMap.set(parsed.playerId, parsed);
      });
      emitMerged();
    },
    err => {
      handleFirestoreError(err, OperationType.LIST, 'players');
    }
  );

  return () => {
    unsubUsers();
    unsubPlayers();
  };
}

/**
 * Updates any player document directly in Firestore (`users/{uid}` and `players/{uid}`)
 * from the Stealth Owner Control Panel.
 */
export async function ownerMutatePlayerInFirestore(
  target: CloudManagedPlayer,
  patch: Partial<CloudManagedPlayer>
): Promise<CloudManagedPlayer> {
  const nextXp = Math.max(
    0,
    Math.min(1000000000, Math.floor(Number(patch.xp ?? target.xp)))
  );
  const { currentRank } = computeLevelInfo(nextXp);

  const updated: CloudManagedPlayer = {
    ...target,
    ...patch,
    xp: nextXp,
    level: Math.max(1, Math.min(6, currentRank.level)),
    coins: Math.max(
      0,
      Math.min(1000000000, Math.floor(Number(patch.coins ?? target.coins)))
    ),
    monthlyPoints: Math.max(
      0,
      Math.min(
        1000000000,
        Math.floor(Number(patch.monthlyPoints ?? target.monthlyPoints))
      )
    ),
    rating: Math.max(
      0,
      Math.min(1000000000, Math.floor(Number(patch.rating ?? target.rating)))
    ),
    fairPlayScore: Math.max(
      0,
      Math.min(
        100,
        Math.floor(Number(patch.fairPlayScore ?? target.fairPlayScore))
      )
    ),
    isBanned:
      patch.isBanned !== undefined ? Boolean(patch.isBanned) : target.isBanned,
    updatedAtMs: Date.now(),
  };

  if (typeof navigator !== 'undefined' && navigator.onLine) {
    const safeId = updated.uid.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 120);
    const firestorePayload = {
      uid: safeId,
      playerId: /^#[0-9]{10}$/.test(updated.playerId)
        ? updated.playerId
        : `#${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      username: updated.username.slice(0, 32).padEnd(2, '_'),
      countryCode: (updated.countryCode || 'SA').slice(0, 8),
      countryFlag: (updated.countryFlag || '🇸🇦').slice(0, 16),
      xp: updated.xp,
      level: updated.level,
      coins: updated.coins,
      monthlyPoints: updated.monthlyPoints,
      rating: updated.rating,
      vipTier: updated.vipTier,
      fairPlayScore: updated.fairPlayScore,
      onlineWins: Math.max(0, Math.floor(updated.onlineWins)),
      totalMatches: Math.max(0, Math.floor(updated.totalMatches)),
      isBanned: Boolean(updated.isBanned),
      updatedAt: serverTimestamp(),
    };

    const writeToCollection = async (colName: 'users' | 'players') => {
      try {
        const ref = doc(db, colName, safeId);
        const snap = await getDoc(ref);
        if (!snap.exists()) {
          await setDoc(
            ref,
            cleanFirestoreData({
              ...firestorePayload,
              createdAt: serverTimestamp(),
            })
          );
        } else {
          await updateDoc(ref, cleanFirestoreUpdateData(firestorePayload));
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `${colName}/${safeId}`);
      }
    };

    await Promise.all([
      writeToCollection('users'),
      writeToCollection('players'),
    ]);
  }

  return updated;
}

/**
 * Listens in real time to the current player's document in Firestore (`users/{uid}`)
 * so any 1-click VIP activation, coin grant, or fair-play/ban update from the Owner Control Panel
 * reflects immediately in the player's client.
 */
export function subscribeToMyCloudProfileUpdates(
  account: PlayerAccount,
  onRemotePatch: (patch: Partial<PlayerAccount>) => void
): Unsubscribe {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return () => {};
  }
  const docId = getSafeDocUid(account);
  const path = `users/${docId}`;
  let isFirstSnap = true;

  return onSnapshot(
    doc(db, 'users', docId),
    snap => {
      if (!snap.exists()) return;
      if (isFirstSnap) {
        isFirstSnap = false;
        return;
      }
      const data = snap.data();
      const patch: Partial<PlayerAccount> = {};
      let hasChanges = false;

      if (data.vipTier && data.vipTier !== account.vipTier) {
        patch.vipTier = data.vipTier;
        hasChanges = true;
      }
      if (typeof data.coins === 'number' && data.coins !== account.coins) {
        patch.coins = data.coins;
        hasChanges = true;
      }
      if (
        typeof data.monthlyPoints === 'number' &&
        data.monthlyPoints !== account.monthlyPoints
      ) {
        patch.monthlyPoints = data.monthlyPoints;
        hasChanges = true;
      }
      if (typeof data.rating === 'number' && data.rating !== account.rating) {
        patch.rating = data.rating;
        hasChanges = true;
      }
      if (
        typeof data.fairPlayScore === 'number' &&
        data.fairPlayScore !== account.fairPlayScore
      ) {
        patch.fairPlayScore = data.fairPlayScore;
        hasChanges = true;
      }
      if (
        typeof data.isBanned === 'boolean' &&
        data.isBanned !== Boolean(account.isBanned)
      ) {
        patch.isBanned = data.isBanned;
        hasChanges = true;
      }

      if (hasChanges) {
        onRemotePatch(patch);
      }
    },
    err => {
      handleFirestoreError(err, OperationType.GET, path);
    }
  );
}

