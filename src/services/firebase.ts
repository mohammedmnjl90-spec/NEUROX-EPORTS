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
  Unsubscribe,
} from 'firebase/firestore';
import appletFirebaseConfig from '../../firebase-applet-config.json';
import {
  computeLevelInfo,
  REALISTIC_HUMAN_LEADERBOARD_SEED,
} from '../data/constants';
import {
  CloudManagedPlayer,
  FriendItem,
  FriendPresenceStatus,
  PlayerAccount,
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
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Validate connection on boot when online
async function testConnection() {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return;
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch {
    // Gracefully allow offline / cached operation if backend is unreachable
  }
}
testConnection();

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

// Sanitize a document ID so it strictly matches ^[a-zA-Z0-9_\-]+$
function getSafeDocUid(account: PlayerAccount): string {
  const raw =
    auth.currentUser?.uid ||
    account.uid ||
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

    const payload = {
      uid: docId,
      playerId: existingSnap.exists()
        ? existingSnap.data().playerId || safePlayerId
        : safePlayerId,
      username: safeUsername,
      countryCode: safeCountryCode,
      countryFlag: safeCountryFlag,
      xp: Math.max(0, Math.min(1000000000, Math.floor(account.xp))),
      level: Math.max(1, Math.min(6, Math.floor(account.level))),
      coins: Math.max(0, Math.min(1000000000, Math.floor(account.coins))),
      monthlyPoints: Math.max(
        0,
        Math.min(1000000000, Math.floor(account.monthlyPoints))
      ),
      rating: Math.max(0, Math.min(1000000000, Math.floor(account.rating))),
      vipTier: account.vipTier,
      fairPlayScore: Math.max(
        0,
        Math.min(100, Math.floor(account.fairPlayScore))
      ),
      onlineWins: Math.max(
        0,
        Math.min(1000000000, Math.floor(account.onlineWins))
      ),
      totalMatches: Math.max(
        0,
        Math.min(1000000000, Math.floor(account.totalMatches))
      ),
      isBanned: Boolean(account.isBanned),
      updatedAt: serverTimestamp(),
    };

    if (!existingSnap.exists()) {
      await setDoc(doc(db, 'players', docId), {
        ...payload,
        createdAt: serverTimestamp(),
      });
    } else {
      await updateDoc(doc(db, 'players', docId), payload);
    }

    // Mirror into `users/{docId}` collection for real-time Owner Control Panel management
    try {
      const existingUserSnap = await getDoc(doc(db, 'users', docId));
      if (!existingUserSnap.exists()) {
        await setDoc(doc(db, 'users', docId), {
          ...payload,
          createdAt: serverTimestamp(),
        });
      } else {
        await updateDoc(doc(db, 'users', docId), payload);
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
      const vaultPayload = {
        uid: currentUser.uid,
        contactValue:
          safeContact.length >= 3 ? safeContact : 'player@neurox.gg',
        contactType: account.contactType === 'phone' ? 'phone' : 'email',
        updatedAt: serverTimestamp(),
      };
      if (!vaultSnap.exists()) {
        await setDoc(doc(db, 'user_vaults', currentUser.uid), vaultPayload);
      } else {
        await updateDoc(doc(db, 'user_vaults', currentUser.uid), vaultPayload);
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

export async function createCloudPrivateRoom(
  roomCode: string,
  hostAccount: PlayerAccount,
  category: string,
  questionSeed: number
): Promise<boolean> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return false;
  const hostUid = getSafeDocUid(hostAccount);
  const path = `rooms/${roomCode}`;
  try {
    await syncPlayerToCloud(hostAccount);
    await setDoc(doc(db, 'rooms', roomCode), {
      roomCode,
      hostUid,
      hostName: hostAccount.username.slice(0, 32),
      hostFlag: hostAccount.countryFlag.slice(0, 16),
      guestUid: '',
      guestName: '',
      guestFlag: '',
      category: category.slice(0, 32),
      questionSeed: Math.floor(questionSeed),
      status: 'waiting',
      hostScore: 0,
      guestScore: 0,
      hostReadyNextRound: false,
      guestReadyNextRound: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
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
  hostName: string;
  hostFlag: string;
  hostUid: string;
} | null> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return null;
  const guestUid = getSafeDocUid(guestAccount);
  const path = `rooms/${roomCode}`;
  try {
    await syncPlayerToCloud(guestAccount);
    const snap = await getDoc(doc(db, 'rooms', roomCode));
    if (!snap.exists()) return null;
    const data = snap.data();
    if (data.status === 'waiting' && data.hostUid !== guestUid) {
      await updateDoc(doc(db, 'rooms', roomCode), {
        guestUid,
        guestName: guestAccount.username.slice(0, 32),
        guestFlag: guestAccount.countryFlag.slice(0, 16),
        status: 'active',
        updatedAt: serverTimestamp(),
      });
    }
    return {
      category: data.category,
      questionSeed: data.questionSeed,
      hostName: data.hostName,
      hostFlag: data.hostFlag,
      hostUid: data.hostUid,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
    return null;
  }
}

export async function updateCloudRoomState(
  roomCode: string,
  updates: Partial<{
    hostScore: number;
    guestScore: number;
    hostReadyNextRound: boolean;
    guestReadyNextRound: boolean;
    status: 'waiting' | 'active' | 'completed';
  }>
): Promise<void> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return;
  const path = `rooms/${roomCode}`;
  try {
    await updateDoc(doc(db, 'rooms', roomCode), {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export function subscribeToCloudRoom(
  roomCode: string,
  onUpdate: (data: Record<string, unknown>) => void
): Unsubscribe | null {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return null;
  const path = `rooms/${roomCode}`;
  return onSnapshot(
    doc(db, 'rooms', roomCode),
    snap => {
      if (snap.exists()) {
        onUpdate(snap.data());
      }
    },
    error => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

/**
 * Real-time listener for newly opened challenge rooms in Firestore (`rooms` with status === 'waiting')
 * so the player receives a Local Notification when a friend or new challenger invites them,
 * even if the app tab is in the background.
 */
export function subscribeToIncomingCloudChallenges(
  myAccount: PlayerAccount,
  onNewChallenge: (
    roomCode: string,
    hostUid: string,
    hostName: string,
    hostFlag: string,
    category: string
  ) => void
): Unsubscribe {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return () => {};
  }
  const mySafeUid = getSafeDocUid(myAccount);
  const path = 'rooms';
  const seenRoomCodes = new Set<string>();
  let isInitialSnapshot = true;

  const q = query(collection(db, 'rooms'), where('status', '==', 'waiting'));

  return onSnapshot(
    q,
    snap => {
      if (isInitialSnapshot) {
        snap.docs.forEach(d => {
          seenRoomCodes.add(d.id);
        });
        isInitialSnapshot = false;
        return;
      }

      snap.docChanges().forEach(change => {
        if (change.type === 'added') {
          const data = change.doc.data();
          const roomCode = String(data.roomCode || change.doc.id);
          const hostUid = String(data.hostUid || '');
          const hostName = String(data.hostName || 'منافس جديد');
          const hostFlag = String(data.hostFlag || '🇸🇦');
          const category = String(data.category || 'cocktail');

          if (seenRoomCodes.has(roomCode)) return;
          seenRoomCodes.add(roomCode);

          if (
            hostUid === mySafeUid ||
            hostName.toLowerCase() === myAccount.username.toLowerCase()
          ) {
            return;
          }

          onNewChallenge(roomCode, hostUid, hostName, hostFlag, category);
        }
      });
    },
    error => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
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
 * in Firestore and returns its roomCode and category.
 */
export async function sendQuickChallengeInvite(
  senderAccount: PlayerAccount,
  category = 'cocktail'
): Promise<{ roomCode: string; category: string } | null> {
  const roomCode = Math.floor(1000 + Math.random() * 9000).toString();
  const seed = roomCode
    .split('')
    .reduce((acc, ch) => acc * 31 + ch.charCodeAt(0), 7);

  const ok = await createCloudPrivateRoom(
    roomCode,
    senderAccount,
    category,
    seed
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
        const payload = {
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
        };
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
          await setDoc(ref, {
            ...firestorePayload,
            createdAt: serverTimestamp(),
          });
        } else {
          await updateDoc(ref, firestorePayload);
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
