import { QUIZ_CATEGORIES } from '../data/constants';
import { ChallengeNotificationItem, FriendItem } from '../types';
import { soundFX } from './sound';

const LOCAL_NOTIF_STORAGE_KEY = 'neurox_challenge_notifications_v1';
const BROADCAST_CHANNEL_NAME = 'neurox_challenge_notifications_channel';

let titleBlinkInterval: number | null = null;
const defaultTitle =
  typeof document !== 'undefined'
    ? document.title || 'NEUROX ESPORTS'
    : 'NEUROX ESPORTS';

export type LocalNotificationPermissionState =
  | NotificationPermission
  | 'unsupported';

export function getLocalNotificationPermission(): LocalNotificationPermissionState {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return window.Notification.permission;
}

export async function requestLocalNotificationPermission(): Promise<LocalNotificationPermissionState> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  try {
    const result = await window.Notification.requestPermission();
    return result;
  } catch {
    return window.Notification.permission;
  }
}

export function startBackgroundTitleAlert(message: string) {
  if (typeof document === 'undefined') return;
  stopBackgroundTitleAlert();

  let toggle = false;
  titleBlinkInterval = window.setInterval(() => {
    if (!document.hidden) {
      stopBackgroundTitleAlert();
      return;
    }
    document.title = toggle ? `🔔 ${message}` : defaultTitle;
    toggle = !toggle;
  }, 1100);
}

export function stopBackgroundTitleAlert() {
  if (titleBlinkInterval !== null) {
    window.clearInterval(titleBlinkInterval);
    titleBlinkInterval = null;
  }
  if (typeof document !== 'undefined') {
    document.title = defaultTitle;
  }
}

// Automatically clear title blinking when the player returns to the tab/window
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  window.addEventListener('focus', () => stopBackgroundTitleAlert());
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      stopBackgroundTitleAlert();
    }
  });
}

export function loadStoredChallengeNotifications(): ChallengeNotificationItem[] {
  try {
    const raw = localStorage.getItem(LOCAL_NOTIF_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveStoredChallengeNotifications(
  items: ChallengeNotificationItem[]
): void {
  try {
    localStorage.setItem(
      LOCAL_NOTIF_STORAGE_KEY,
      JSON.stringify(items.slice(0, 25))
    );
  } catch {}
}

/**
 * Triggers a Local Notification (Web Notification API + Sound Chime + Background Title Ticker)
 * to alert the player of an incoming friend challenge even when the app is in the background.
 */
export function triggerLocalChallengeNotification(
  invite: ChallengeNotificationItem,
  onAcceptChallenge?: (invite: ChallengeNotificationItem) => void
): void {
  // 1. Play crystalline challenge alert chime + haptic pattern
  soundFX.playChallengeInvite();

  const catMeta =
    QUIZ_CATEGORIES.find(c => c.id === invite.category) || QUIZ_CATEGORIES[0];

  // 2. If app is in background (hidden tab or minimized window), start blinking title badge
  if (typeof document !== 'undefined' && document.hidden) {
    startBackgroundTitleAlert(
      `تحدي جديد من ${invite.senderName} (#${invite.roomCode})`
    );
  }

  // 3. Fire system/browser Local Notification if permission is granted
  if (
    typeof window !== 'undefined' &&
    'Notification' in window &&
    window.Notification.permission === 'granted'
  ) {
    try {
      const title = `⚔️ دعوة تحدي من ${invite.senderFlag} ${invite.senderName}!`;
      const body = `قسم ${catMeta.nameAr} ${catMeta.icon} · كود الغرفة #${invite.roomCode} · اضغط للانضمام فوراً!`;

      const notification = new window.Notification(title, {
        body,
        tag: `neurox_challenge_${invite.roomCode}`,
        renotify: true,
        requireInteraction: true,
      } as NotificationOptions);

      notification.onclick = () => {
        try {
          window.focus();
          notification.close();
        } catch {}
        stopBackgroundTitleAlert();
        if (onAcceptChallenge) {
          onAcceptChallenge(invite);
        }
      };
    } catch {
      // Fallback if Notification constructor is restricted in service-worker-only environments
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready
          .then(reg => {
            reg.showNotification(
              `⚔️ دعوة تحدي من ${invite.senderFlag} ${invite.senderName}!`,
              {
                body: `قسم ${catMeta.nameAr} · كود الغرفة #${invite.roomCode}`,
                tag: `neurox_challenge_${invite.roomCode}`,
              }
            );
          })
          .catch(() => {});
      }
    }
  }
}

/**
 * Triggers a Local Notification (Web Notification API + Sound Chime + Background Title Ticker)
 * when a Favorite Friend (صديق مفضل) enters the game (status transitions from offline to online).
 */
export function triggerFavoriteFriendOnlineNotification(
  friend: FriendItem,
  onQuickInvite?: (friend: FriendItem) => void
): void {
  // 1. Play crystalline alert chime + haptic pattern
  soundFX.playChallengeInvite();

  // 2. If app is in background, start blinking title alert
  if (typeof document !== 'undefined' && document.hidden) {
    startBackgroundTitleAlert(
      `🟢 صديقك المفضل ${friend.username} نشط الآن في اللعبة!`
    );
  }

  // 3. Fire system/browser Local Notification if permission is granted
  if (
    typeof window !== 'undefined' &&
    'Notification' in window &&
    window.Notification.permission === 'granted'
  ) {
    const title = `⭐🟢 صديقك المفضل ${friend.countryFlag} ${friend.username} نشط الآن!`;
    const body = `دخل ${friend.username} (${friend.playerId}) إلى الساحة الآن · اضغط هنا لإرسال دعوة تحدي سريعة فوراً!`;

    try {
      const notification = new window.Notification(title, {
        body,
        tag: `neurox_fav_online_${friend.playerId}`,
        renotify: true,
      } as NotificationOptions);

      notification.onclick = () => {
        try {
          window.focus();
          notification.close();
        } catch {}
        stopBackgroundTitleAlert();
        if (onQuickInvite) {
          onQuickInvite(friend);
        }
      };
    } catch {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready
          .then(reg => {
            reg.showNotification(title, {
              body,
              tag: `neurox_fav_online_${friend.playerId}`,
            });
          })
          .catch(() => {});
      }
    }
  }
}

/**
 * Broadcasts a challenge invite across browser tabs/windows via BroadcastChannel & localStorage
 * so multi-tab testing and background tabs immediately receive the challenge.
 */
export function broadcastChallengeInvite(
  invite: ChallengeNotificationItem,
  targetPlayerId?: string
): void {
  const payload = {
    type: 'NEUROX_CHALLENGE_INVITE',
    invite,
    targetPlayerId: targetPlayerId || '',
  };

  try {
    if (typeof BroadcastChannel !== 'undefined') {
      const channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      channel.postMessage(payload);
      channel.close();
    }
  } catch {}

  try {
    localStorage.setItem(
      'neurox_last_broadcast_challenge',
      JSON.stringify({ ...payload, emittedAt: Date.now() })
    );
  } catch {}
}

export function subscribeToLocalChallengeBroadcasts(
  myPlayerId: string,
  myUid: string,
  onInvite: (invite: ChallengeNotificationItem) => void
): () => void {
  let channel: BroadcastChannel | null = null;

  const handlePayload = (data: {
    type?: string;
    invite?: ChallengeNotificationItem;
    targetPlayerId?: string;
  }) => {
    if (!data || data.type !== 'NEUROX_CHALLENGE_INVITE' || !data.invite) {
      return;
    }
    const { invite, targetPlayerId } = data;
    // Ignore self-sent challenges unless explicitly testing
    if (
      invite.senderUid === myUid &&
      invite.senderPlayerId === myPlayerId &&
      !invite.id.startsWith('test_')
    ) {
      return;
    }
    // If targeted to a specific friend ID, check match (or allow if target is empty/test)
    if (
      targetPlayerId &&
      targetPlayerId !== myPlayerId &&
      !invite.id.startsWith('test_')
    ) {
      return;
    }
    onInvite(invite);
  };

  try {
    if (typeof BroadcastChannel !== 'undefined') {
      channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      channel.onmessage = ev => {
        handlePayload(ev.data);
      };
    }
  } catch {}

  const handleStorage = (ev: StorageEvent) => {
    if (ev.key === 'neurox_last_broadcast_challenge' && ev.newValue) {
      try {
        const parsed = JSON.parse(ev.newValue);
        handlePayload(parsed);
      } catch {}
    }
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('storage', handleStorage);
  }

  return () => {
    if (channel) {
      try {
        channel.close();
      } catch {}
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', handleStorage);
    }
  };
}
