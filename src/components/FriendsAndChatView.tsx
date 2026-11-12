import React, { useEffect, useRef, useState } from 'react';
import { QUIZ_CATEGORIES, VIP_PACKAGES } from '../data/constants';
import {
  findCloudPlayerByIdentifier,
  FriendRealtimePresence,
  sendQuickChallengeInvite,
  subscribeToCloudRoom,
  subscribeToFriendsPresence,
  syncPlayerToCloud,
} from '../services/firebase';
import {
  appendFriendChatMessage,
  loadAllAccounts,
  loadFriendChats,
} from '../services/storage';
import {
  CategoryId,
  ChatMessageItem,
  FriendItem,
  FriendPresenceStatus,
  LanguageCode,
  PlayerAccount,
  SportsmanshipBadgeId,
  SportsmanshipReview,
} from '../types';
import { getLocalizedCategory, getTranslations } from '../utils/i18n';
import {
  broadcastChallengeInvite,
  requestLocalNotificationPermission,
  triggerFavoriteFriendOnlineNotification,
} from '../utils/notifications';
import { soundFX } from '../utils/sound';
import {
  BellRing,
  CheckCircle2,
  Copy,
  Heart,
  Loader2,
  MessageSquare,
  Radio,
  Send,
  Star,
  Swords,
  Trash2,
  UserPlus,
  Zap,
} from 'lucide-react';
import { AdminPanelView } from './AdminPanelView';

function isStealthOwnerTriggerMatch(input: string): boolean {
  return input.trim() === "'waleed'733715080@#][ abu Mohammed";
}

const FRIEND_BADGE_LABELS: Record<SportsmanshipBadgeId, string> = {
  fair_competitor: '🤝 منافس شريف',
  fast_genius: '⚡ سرعة بديهة',
  respectful_rival: '👑 أخلاق رفيعة',
  great_fun: '🔥 مواجهة ممتعة',
};

interface PresenceStrings {
  statusOnline: string;
  statusInMatch: string;
  statusOffline: string;
  filterAll: string;
  filterFavorites: string;
  favoriteBadge: string;
  markFavoriteBtn: string;
  unmarkFavoriteBtn: string;
  favAddedToast: string;
  favRemovedToast: string;
  favOnlineBannerTitle: string;
  favOnlineBannerSub: string;
  simulateFavOnlineBtn: string;
  quickInviteBtn: string;
  quickInviteSending: string;
  quickInviteSentBannerTitle: string;
  quickInviteSentBannerSub: string;
  enterArenaNowBtn: string;
  cancelInviteBtn: string;
  joinActiveFriendMatchBtn: string;
  quickInviteChatText: string;
  livePresenceNote: string;
}

const PRESENCE_I18N: Record<LanguageCode, PresenceStrings> = {
  ar: {
    statusOnline: 'نشط',
    statusInMatch: 'في مباراة',
    statusOffline: 'خارج اللعبة',
    filterAll: 'الكل',
    filterFavorites: 'المفضلون',
    favoriteBadge: 'صديق مفضل',
    markFavoriteBtn: 'تعيين كصديق مفضل (تنبيه عند الدخول)',
    unmarkFavoriteBtn: 'إلغاء من المفضلين',
    favAddedToast: '⭐ تمت إضافة الصديق إلى المفضلين! سيصلك تنبيه محلي فور دخوله اللعبة.',
    favRemovedToast: 'تمت إزالة الصديق من قائمة المفضلين.',
    favOnlineBannerTitle: '🔔 تنبيه محلي: صديقك المفضل دخل اللعبة الآن!',
    favOnlineBannerSub:
      'تغيرت حالته من (خارج اللعبة) إلى (نشط 🟢) · أرسل له دعوة تحدي سريعة الآن!',
    simulateFavOnlineBtn: '🔔 تجربة تنبيه الدخول',
    quickInviteBtn: '⚡ دعوة سريعة',
    quickInviteSending: 'جاري الإرسال...',
    quickInviteSentBannerTitle: '⚡ تم إرسال دعوة تحدي سريعة مباشرة!',
    quickInviteSentBannerSub:
      'تم إشعار صديقك فوراً بدون الحاجة لإنشاء غرفة يدوية · ستبدأ المباراة تلقائياً فور قبوله أو يمكنك الدخول الآن',
    enterArenaNowBtn: 'دخول الساحة الآن 🚀',
    cancelInviteBtn: 'إلغاء',
    joinActiveFriendMatchBtn: 'انضم لمباراته الجارية ⚔️',
    quickInviteChatText: '⚡ أرسلت لك دعوة تحدي سريعة مباشرة! اضغط للانضمام فوراً',
    livePresenceNote: 'حالة الأصدقاء محدّثة في الوقت الفعلي',
  },
  en: {
    statusOnline: 'Online',
    statusInMatch: 'In Match',
    statusOffline: 'Offline',
    filterAll: 'All',
    filterFavorites: 'Favorites',
    favoriteBadge: 'Favorite',
    markFavoriteBtn: 'Set as Favorite (Alert when Online)',
    unmarkFavoriteBtn: 'Remove from Favorites',
    favAddedToast: '⭐ Added as Favorite Friend! You will get a local alert when they come online.',
    favRemovedToast: 'Removed from Favorite Friends.',
    favOnlineBannerTitle: '🔔 Local Alert: Your Favorite Friend is Now Online!',
    favOnlineBannerSub:
      'Status changed from Offline to Online 🟢 · Send them a Quick Challenge now!',
    simulateFavOnlineBtn: '🔔 Test Online Alert',
    quickInviteBtn: '⚡ Quick Invite',
    quickInviteSending: 'Sending...',
    quickInviteSentBannerTitle: '⚡ Direct Quick Challenge Sent!',
    quickInviteSentBannerSub:
      'Your friend was notified immediately without manual room setup · Match starts automatically on accept or enter now',
    enterArenaNowBtn: 'Enter Arena Now 🚀',
    cancelInviteBtn: 'Cancel',
    joinActiveFriendMatchBtn: 'Join Active Match ⚔️',
    quickInviteChatText: '⚡ Sent you a direct Quick Challenge invite! Tap to join now',
    livePresenceNote: 'Real-time friend status active',
  },
  fr: {
    statusOnline: 'En ligne',
    statusInMatch: 'En match',
    statusOffline: 'Hors-ligne',
    filterAll: 'Tous',
    filterFavorites: 'Favoris',
    favoriteBadge: 'Favori',
    markFavoriteBtn: 'Ajouter aux Favoris (Alerte connexion)',
    unmarkFavoriteBtn: 'Retirer des Favoris',
    favAddedToast: '⭐ Ami ajouté aux favoris ! Vous recevrez une alerte locale à sa connexion.',
    favRemovedToast: 'Retiré de la liste des favoris.',
    favOnlineBannerTitle: '🔔 Alerte Locale : Votre Ami Favori est En Ligne !',
    favOnlineBannerSub:
      'Son statut est passé de Hors-ligne à En ligne 🟢 · Envoyez-lui un défi rapide !',
    simulateFavOnlineBtn: '🔔 Tester Alerte Connexion',
    quickInviteBtn: '⚡ Invit. Rapide',
    quickInviteSending: 'Envoi...',
    quickInviteSentBannerTitle: '⚡ Invitation Rapide Envoyée !',
    quickInviteSentBannerSub:
      'Votre ami a reçu une notification immédiate sans création manuelle de salon',
    enterArenaNowBtn: 'Entrer dans l’Arène 🚀',
    cancelInviteBtn: 'Annuler',
    joinActiveFriendMatchBtn: 'Rejoindre son Match ⚔️',
    quickInviteChatText: '⚡ Invitation de défi rapide envoyée ! Rejoignez maintenant',
    livePresenceNote: 'Statut des amis en temps réel',
  },
  es: {
    statusOnline: 'Activo',
    statusInMatch: 'En partida',
    statusOffline: 'Desconectado',
    filterAll: 'Todos',
    filterFavorites: 'Favoritos',
    favoriteBadge: 'Favorito',
    markFavoriteBtn: 'Marcar como Favorito (Aviso al entrar)',
    unmarkFavoriteBtn: 'Quitar de Favoritos',
    favAddedToast: '⭐ ¡Añadido a Favoritos! Recibirás una alerta local cuando se conecte.',
    favRemovedToast: 'Eliminado de amigos favoritos.',
    favOnlineBannerTitle: '🔔 Alerta Local: ¡Tu Amigo Favorito está Activo!',
    favOnlineBannerSub:
      'Su estado cambió de Desconectado a Activo 🟢 · ¡Envíale una invitación rápida!',
    simulateFavOnlineBtn: '🔔 Probar Alerta',
    quickInviteBtn: '⚡ Inv. Rápida',
    quickInviteSending: 'Enviando...',
    quickInviteSentBannerTitle: '⚡ ¡Invitación Rápida Enviada!',
    quickInviteSentBannerSub:
      'Tu amigo fue notificado al instante sin crear salas manualmente',
    enterArenaNowBtn: 'Entrar a la Arena 🚀',
    cancelInviteBtn: 'Cancelar',
    joinActiveFriendMatchBtn: 'Unirse a su Partida ⚔️',
    quickInviteChatText: '⚡ ¡Te envié un desafío rápido directo! Únete ahora',
    livePresenceNote: 'Estado de amigos en tiempo real',
  },
  tr: {
    statusOnline: 'Aktif',
    statusInMatch: 'Maçta',
    statusOffline: 'Çevrimdışı',
    filterAll: 'Tümü',
    filterFavorites: 'Favoriler',
    favoriteBadge: 'Favori',
    markFavoriteBtn: 'Favori Ekle (Oyuna Girince Bildir)',
    unmarkFavoriteBtn: 'Favorilerden Çıkar',
    favAddedToast: '⭐ Favori arkadaş eklendi! Oyuna girdiğinde yerel bildirim alacaksınız.',
    favRemovedToast: 'Favori arkadaşlardan çıkarıldı.',
    favOnlineBannerTitle: '🔔 Yerel Bildirim: Favori Arkadaşınız Oyuna Girdi!',
    favOnlineBannerSub:
      'Durumu Çevrimdışı’ndan Aktif 🟢 olarak değişti · Hemen hızlı davet gönderin!',
    simulateFavOnlineBtn: '🔔 Giriş Bildirimini Test Et',
    quickInviteBtn: '⚡ Hızlı Davet',
    quickInviteSending: 'Gönderiliyor...',
    quickInviteSentBannerTitle: '⚡ Doğrudan Hızlı Davet Gönderildi!',
    quickInviteSentBannerSub:
      'Manuel oda kurmaya gerek kalmadan arkadaşınıza anında bildirim gönderildi',
    enterArenaNowBtn: 'Arenaya Gir 🚀',
    cancelInviteBtn: 'İptal',
    joinActiveFriendMatchBtn: 'Maçına Katıl ⚔️',
    quickInviteChatText: '⚡ Sana doğrudan hızlı meydan okuma gönderdim! Hemen katıl',
    livePresenceNote: 'Gerçek zamanlı arkadaş durumu',
  },
  ur: {
    statusOnline: 'آن لائن (نشط)',
    statusInMatch: 'مقابلے میں',
    statusOffline: 'گیم سے باہر',
    filterAll: 'سب',
    filterFavorites: 'پسندیدہ',
    favoriteBadge: 'پسندیدہ دوست',
    markFavoriteBtn: 'پسندیدہ بنائیں (گیم میں آنے پر اطلاع)',
    unmarkFavoriteBtn: 'پسندیدہ سے ہٹائیں',
    favAddedToast: '⭐ پسندیدہ دوست میں شامل! جب وہ گیم میں آئے گا تو آپ کو مقامی تنبیہ ملے گی۔',
    favRemovedToast: 'پسندیدہ فہرست سے ہٹا دیا گیا۔',
    favOnlineBannerTitle: '🔔 مقامی تنبیہ: آپ کا پسندیدہ دوست گیم میں آ گیا ہے!',
    favOnlineBannerSub:
      'اس کی حالت (گیم سے باہر) سے بدل کر (آن لائن 🟢) ہو گئی ہے · ابھی فوری دعوت بھیجیں!',
    simulateFavOnlineBtn: '🔔 آمد کی تنبیہ چیک کریں',
    quickInviteBtn: '⚡ فوری دعوت',
    quickInviteSending: 'بھیجا جا رہا ہے...',
    quickInviteSentBannerTitle: '⚡ فوری چیلنج دعوت براہ راست بھیج دی گئی!',
    quickInviteSentBannerSub:
      'دستی کمرہ بنائے بغیر آپ کے دوست کو فوری اطلاع بھیج دی گئی ہے',
    enterArenaNowBtn: 'ابھی میدان میں داخل ہوں 🚀',
    cancelInviteBtn: 'منسوخ',
    joinActiveFriendMatchBtn: 'جاری میچ میں شامل ہوں ⚔️',
    quickInviteChatText: '⚡ میں نے آپ کو براہ راست فوری چیلنج بھیجا ہے!',
    livePresenceNote: 'دوستوں کی حالت براہ راست اپ ڈیٹ ہو رہی ہے',
  },
};

interface FriendsAndChatViewProps {
  account: PlayerAccount;
  onUpdateAccount: (updated: PlayerAccount, toastMsg?: string) => void;
  onChallengeFriend: (friend: FriendItem) => void;
  onStartDirectChallenge?: (
    friend: FriendItem,
    roomCode: string,
    category: CategoryId
  ) => void;
}

export const FriendsAndChatView: React.FC<FriendsAndChatViewProps> = ({
  account,
  onUpdateAccount,
  onChallengeFriend,
  onStartDirectChallenge,
}) => {
  const t = getTranslations(account.language);
  const p = PRESENCE_I18N[account.language] || PRESENCE_I18N.ar;

  const [searchQuery, setSearchQuery] = useState('');
  const [searchingCloud, setSearchingCloud] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [copiedMyId, setCopiedMyId] = useState(false);
  const [stealthOwnerOpen, setStealthOwnerOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'favorites' | FriendPresenceStatus
  >('all');

  // Real-time Firestore presence map keyed by friend.playerId
  const [presenceMap, setPresenceMap] = useState<
    Record<string, FriendRealtimePresence>
  >({});

  // Track previous presence status of each friend to detect transitions from 'offline' -> 'online'
  const prevPresenceStatusRef = useRef<Record<string, FriendPresenceStatus>>({});
  const isInitialPresenceLoadRef = useRef<boolean>(true);

  // Active Local Notification Banner when a Favorite Friend enters the game
  const [favoriteOnlineAlertFriend, setFavoriteOnlineAlertFriend] =
    useState<FriendItem | null>(null);

  // Quick Invite state (sends direct challenge without manual room creation)
  const [sendingQuickInviteId, setSendingQuickInviteId] = useState<string | null>(
    null
  );
  const [quickCategory, setQuickCategory] = useState<CategoryId>('cocktail');
  const [pendingQuickChallenge, setPendingQuickChallenge] = useState<{
    friend: FriendItem;
    roomCode: string;
    category: CategoryId;
  } | null>(null);

  // Filter out any legacy demo friends automatically so only real added friends remain
  const realFriends = account.friends.filter(
    f => f.uid !== 'friend_demo_1' && f.uid !== 'friend_demo_2'
  );

  // Sort Favorite Friends to the top
  const sortedFriends = [...realFriends].sort((a, b) => {
    if (Boolean(a.isFavorite) !== Boolean(b.isFavorite)) {
      return a.isFavorite ? -1 : 1;
    }
    return b.addedAt - a.addedAt;
  });

  const [activeFriend, setActiveFriend] = useState<FriendItem | null>(
    sortedFriends[0] || null
  );
  const [chatMessages, setChatMessages] = useState<ChatMessageItem[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [showRateFriendBox, setShowRateFriendBox] = useState(false);
  const [friendStars, setFriendStars] = useState<number>(5);
  const [friendBadge, setFriendBadge] =
    useState<SportsmanshipBadgeId>('fair_competitor');

  useEffect(() => {
    if (account.friends.length !== realFriends.length) {
      onUpdateAccount({ ...account, friends: realFriends });
    }
  }, []);

  // Keep current player's presence fresh in Firestore when viewing Friends & Chat
  useEffect(() => {
    if (!navigator.onLine) return;
    syncPlayerToCloud(account).catch(() => {});
  }, [account.uid]);

  // Subscribe in real-time to Firestore `players` and `rooms` for friend status (نشط، في مباراة، خارج اللعبة)
  // and detect when a Favorite Friend transitions from 'offline' -> 'online'
  useEffect(() => {
    if (!navigator.onLine || realFriends.length === 0) return;

    const unsub = subscribeToFriendsPresence(realFriends, cloudMap => {
      const localAccounts = Object.values(loadAllAccounts());
      const now = Date.now();
      const merged: Record<string, FriendRealtimePresence> = { ...cloudMap };

      for (const f of realFriends) {
        const current = merged[f.playerId];
        const localMatch = localAccounts.find(
          la =>
            la.playerId === f.playerId ||
            la.uid === f.uid ||
            la.username.toLowerCase() === f.username.toLowerCase()
        );
        if (
          localMatch &&
          current &&
          current.status === 'offline' &&
          now - (localMatch.updatedAt || 0) <= 6 * 60 * 1000
        ) {
          merged[f.playerId] = {
            ...current,
            status: 'online',
            lastSeenMs: localMatch.updatedAt,
          };
        }
      }

      // Check for Favorite Friend transitioning from 'offline' to 'online' (or 'in_match')
      for (const f of realFriends) {
        const nextStatus: FriendPresenceStatus =
          merged[f.playerId]?.status || 'offline';
        const prevStatus = prevPresenceStatusRef.current[f.playerId];

        if (
          !isInitialPresenceLoadRef.current &&
          f.isFavorite &&
          prevStatus === 'offline' &&
          (nextStatus === 'online' || nextStatus === 'in_match') &&
          account.localNotificationsEnabled !== false
        ) {
          setFavoriteOnlineAlertFriend(f);
          triggerFavoriteFriendOnlineNotification(f, targetFriend => {
            handleSendQuickInvite(targetFriend);
          });
        }

        prevPresenceStatusRef.current[f.playerId] = nextStatus;
      }

      isInitialPresenceLoadRef.current = false;
      setPresenceMap(merged);
    });

    return () => {
      unsub();
    };
  }, [realFriends, account.uid, account.localNotificationsEnabled]);

  // Listen in real-time to a pending Quick Challenge room so if the friend accepts, we launch automatically!
  useEffect(() => {
    if (!pendingQuickChallenge || !navigator.onLine) return;
    const unsub = subscribeToCloudRoom(
      pendingQuickChallenge.roomCode,
      roomData => {
        if (roomData.status === 'active' && roomData.guestUid) {
          soundFX.playCorrect(true, 2);
          const target = pendingQuickChallenge;
          setPendingQuickChallenge(null);
          if (onStartDirectChallenge) {
            onStartDirectChallenge(
              target.friend,
              target.roomCode,
              target.category
            );
          } else {
            onChallengeFriend(target.friend);
          }
        }
      }
    );
    return () => {
      if (unsub) unsub();
    };
  }, [pendingQuickChallenge]);

  useEffect(() => {
    if (!activeFriend) return;
    setChatMessages(loadFriendChats(activeFriend.playerId));
  }, [activeFriend]);

  const getFriendStatus = (friend: FriendItem): FriendPresenceStatus => {
    if (!navigator.onLine) return 'offline';
    return presenceMap[friend.playerId]?.status || 'offline';
  };

  const handleToggleFavoriteFriend = async (friend: FriendItem) => {
    soundFX.playClick();
    const nextIsFav = !friend.isFavorite;
    if (nextIsFav) {
      await requestLocalNotificationPermission().catch(() => {});
    }

    const updatedFriend: FriendItem = {
      ...friend,
      isFavorite: nextIsFav,
    };

    const nextFriends = realFriends.map(f =>
      f.playerId === friend.playerId ? updatedFriend : f
    );

    if (activeFriend?.playerId === friend.playerId) {
      setActiveFriend(updatedFriend);
    }

    onUpdateAccount(
      { ...account, friends: nextFriends },
      nextIsFav ? p.favAddedToast : p.favRemovedToast
    );
  };

  // Simulate / Test Favorite Friend entering the game (offline -> online transition)
  const handleSimulateFavoriteFriendOnline = async (friend: FriendItem) => {
    soundFX.playClick();
    await requestLocalNotificationPermission().catch(() => {});

    // Temporarily mark as offline in ref then transition to online
    prevPresenceStatusRef.current[friend.playerId] = 'offline';
    setPresenceMap(prev => ({
      ...prev,
      [friend.playerId]: {
        ...(prev[friend.playerId] || {}),
        status: 'online',
        lastSeenMs: Date.now(),
      },
    }));
    prevPresenceStatusRef.current[friend.playerId] = 'online';

    setFavoriteOnlineAlertFriend(friend);
    triggerFavoriteFriendOnlineNotification(friend, targetFriend => {
      handleSendQuickInvite(targetFriend);
    });
  };

  const renderStatusBadge = (friend: FriendItem) => {
    const status = getFriendStatus(friend);
    const meta = presenceMap[friend.playerId];

    if (status === 'in_match') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FFD166]/15 border border-[#FFD166]/60 text-[10px] font-extrabold text-[#FFD166]">
          <span className="w-2 h-2 rounded-full bg-[#FFD166] animate-ping" />
          <span>
            ⚔️ {p.statusInMatch}
            {meta?.activeRoomCode ? ` (#${meta.activeRoomCode})` : ''}
          </span>
        </span>
      );
    }

    if (status === 'online') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#38D9A9]/15 border border-[#38D9A9]/60 text-[10px] font-extrabold text-[#38D9A9]">
          <span className="w-2 h-2 rounded-full bg-[#38D9A9] animate-pulse" />
          <span>🟢 {p.statusOnline}</span>
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#1B253B] border border-[#28354E] text-[10px] font-bold text-slate-400">
        <span className="w-2 h-2 rounded-full bg-slate-500" />
        <span>⚪ {p.statusOffline}</span>
      </span>
    );
  };

  const handleSendQuickInvite = async (friend: FriendItem) => {
    if (!navigator.onLine) {
      soundFX.playWrong();
      setSearchError(t.requiresInternet);
      return;
    }

    soundFX.playClick();
    setSendingQuickInviteId(friend.playerId);
    setActiveFriend(friend);
    setFavoriteOnlineAlertFriend(null);

    try {
      const created = await sendQuickChallengeInvite(account, quickCategory);
      const code =
        created?.roomCode ||
        Math.floor(1000 + Math.random() * 9000).toString();

      broadcastChallengeInvite(
        {
          id: `qinv_${code}_${Date.now()}`,
          roomCode: code,
          category: quickCategory,
          senderUid: account.uid,
          senderPlayerId: account.playerId,
          senderName: account.username,
          senderFlag: account.countryFlag,
          timestamp: Date.now(),
          read: false,
        },
        friend.playerId
      );

      const inviteMsg: ChatMessageItem = {
        id: `msg_qinv_${Date.now()}`,
        friendId: friend.playerId,
        senderId: account.playerId,
        senderName: account.username,
        text: `${p.quickInviteChatText} (#${code})`,
        isChallenge: true,
        roomCode: code,
        timestamp: Date.now(),
      };
      appendFriendChatMessage(inviteMsg);
      setChatMessages(prev => [...prev, inviteMsg]);

      soundFX.playCorrect(false, 2);
      setPendingQuickChallenge({
        friend,
        roomCode: code,
        category: quickCategory,
      });
    } finally {
      setSendingQuickInviteId(null);
    }
  };

  const handleCopyMyId = async () => {
    soundFX.playClick();
    try {
      await navigator.clipboard.writeText(account.playerId);
    } catch {}
    setCopiedMyId(true);
    setTimeout(() => setCopiedMyId(false), 2200);
  };

  const handleAddFriend = async (e: React.FormEvent) => {
    e.preventDefault();
    soundFX.playClick();
    setSearchError(null);

    if (isStealthOwnerTriggerMatch(searchQuery)) {
      setSearchQuery('');
      setStealthOwnerOpen(true);
      return;
    }

    const q = searchQuery.trim();
    if (!q) return;

    if (!navigator.onLine) {
      soundFX.playWrong();
      setSearchError(t.requiresInternet);
      return;
    }

    if (
      q.toLowerCase() === account.username.toLowerCase() ||
      q === account.playerId ||
      `#${q}` === account.playerId
    ) {
      soundFX.playWrong();
      setSearchError('لا يمكنك إضافة حسابك الشخصي كصديق!');
      return;
    }

    const alreadyExists = realFriends.some(
      f =>
        f.username.toLowerCase() === q.toLowerCase() ||
        f.playerId === q ||
        f.playerId === `#${q}`
    );
    if (alreadyExists) {
      soundFX.playWrong();
      setSearchError('هذا اللاعب مضاف بالفعل في قائمة أصدقائك!');
      return;
    }

    setSearchingCloud(true);
    try {
      const cloudPlayer = await findCloudPlayerByIdentifier(q);
      const localRegistry = Object.values(loadAllAccounts());
      const foundLocal = localRegistry.find(
        pl =>
          pl.username.toLowerCase() === q.toLowerCase() ||
          pl.playerId === q ||
          pl.playerId === `#${q}`
      );

      let newFriend: FriendItem | null = null;

      if (cloudPlayer) {
        newFriend = {
          uid: cloudPlayer.uid,
          playerId: cloudPlayer.playerId,
          username: cloudPlayer.username,
          countryFlag: cloudPlayer.countryFlag,
          rating: cloudPlayer.rating,
          vipTier: cloudPlayer.vipTier,
          addedAt: Date.now(),
          isFavorite: true,
          presenceStatus: 'online',
        };
      } else if (foundLocal) {
        newFriend = {
          uid: foundLocal.uid,
          playerId: foundLocal.playerId,
          username: foundLocal.username,
          countryFlag: foundLocal.countryFlag,
          rating: foundLocal.rating,
          vipTier: foundLocal.vipTier,
          addedAt: Date.now(),
          isFavorite: true,
          presenceStatus: 'online',
        };
      }

      if (!newFriend) {
        soundFX.playWrong();
        setSearchError(
          `لم يتم العثور على لاعب حقيقي مسجل بالمعرّف أو الاسم (${q}). اطلب من صديقك نسخ الـ #ID الخاص به ومشاركته معك بدقة!`
        );
        return;
      }

      soundFX.playCorrect();
      const updated: PlayerAccount = {
        ...account,
        friends: [newFriend, ...realFriends],
      };
      setSearchQuery('');
      setActiveFriend(newFriend);
      onUpdateAccount(
        updated,
        `✅ تم العثور على اللاعب الحقيقي ${newFriend.username} (${newFriend.playerId}) وإضافته لقائمة أصدقائك المفضلين!`
      );
    } finally {
      setSearchingCloud(false);
    }
  };

  const handleRemoveFriend = (playerIdToRemove: string) => {
    soundFX.playClick();
    const nextFriends = realFriends.filter(f => f.playerId !== playerIdToRemove);
    if (activeFriend?.playerId === playerIdToRemove) {
      setActiveFriend(nextFriends[0] || null);
    }
    onUpdateAccount(
      { ...account, friends: nextFriends },
      'تمت إزالة اللاعب من قائمة الأصدقاء.'
    );
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeFriend || !messageInput.trim()) return;
    soundFX.playClick();

    const userMsg: ChatMessageItem = {
      id: `msg_${Date.now()}`,
      friendId: activeFriend.playerId,
      senderId: account.playerId,
      senderName: account.username,
      text: messageInput.trim(),
      timestamp: Date.now(),
    };
    appendFriendChatMessage(userMsg);
    setChatMessages(prev => [...prev, userMsg]);
    setMessageInput('');
  };

  const handleSubmitFriendSportsmanship = () => {
    if (!activeFriend) return;
    soundFX.playCorrect(false, 2);

    const prevAvg = activeFriend.sportsmanshipAvg ?? 5.0;
    const prevCount = activeFriend.sportsmanshipCount ?? 1;
    const newCount = prevCount + 1;
    const newAvg = Number(
      ((prevAvg * prevCount + friendStars) / newCount).toFixed(2)
    );

    const updatedFriend: FriendItem = {
      ...activeFriend,
      sportsmanshipAvg: newAvg,
      sportsmanshipCount: newCount,
      lastBadge: friendBadge,
    };

    const nextFriends = realFriends.map(f =>
      f.playerId === activeFriend.playerId ? updatedFriend : f
    );

    const reviewEntry: SportsmanshipReview = {
      id: `rev_fr_${Date.now()}`,
      matchId: `friendly_${Date.now()}`,
      targetPlayerId: activeFriend.playerId,
      targetName: activeFriend.username,
      stars: friendStars,
      badge: friendBadge,
      timestamp: Date.now(),
    };

    const playerPrevAvg = account.sportsmanshipAvg ?? 5.0;
    const playerPrevCount = account.sportsmanshipCount ?? 1;
    const playerNewCount = playerPrevCount + 1;
    const playerNewAvg = Number(
      ((playerPrevAvg * playerPrevCount + friendStars) / playerNewCount).toFixed(2)
    );
    const nextBadges = { ...(account.sportsmanshipBadges || {}) };
    nextBadges[friendBadge] = (nextBadges[friendBadge] || 0) + 1;

    setActiveFriend(updatedFriend);
    setShowRateFriendBox(false);

    onUpdateAccount(
      {
        ...account,
        xp: account.xp + 5,
        sportsmanshipAvg: playerNewAvg,
        sportsmanshipCount: playerNewCount,
        sportsmanshipBadges: nextBadges,
        givenReviews: [reviewEntry, ...(account.givenReviews || []).slice(0, 49)],
        friends: nextFriends,
      },
      `🤝 تم إرسال تقييم الروح الرياضية (${friendStars} ⭐ - ${FRIEND_BADGE_LABELS[friendBadge]}) لصديقك ${activeFriend.username}!`
    );
  };

  const filteredFriends = sortedFriends.filter(f => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'favorites') return Boolean(f.isFavorite);
    return getFriendStatus(f) === statusFilter;
  });

  const favoritesCount = realFriends.filter(f => Boolean(f.isFavorite)).length;
  const onlineCount = realFriends.filter(f => getFriendStatus(f) === 'online').length;
  const inMatchCount = realFriends.filter(f => getFriendStatus(f) === 'in_match').length;
  const offlineCount = realFriends.filter(f => getFriendStatus(f) === 'offline').length;

  if (stealthOwnerOpen) {
    return (
      <AdminPanelView
        account={account}
        onUpdateAccount={onUpdateAccount}
        onClose={() => setStealthOwnerOpen(false)}
      />
    );
  }

  return (
    <div className="space-y-6 pb-10">
      {/* Local Notification Banner: Favorite Friend Just Entered the Game (Offline -> Online) */}
      {favoriteOnlineAlertFriend && (
        <div className="rounded-3xl bg-gradient-to-r from-[#111827] via-[#1B253B] to-[#111827] border-2 border-[#38D9A9] p-5 shadow-[0_0_35px_rgba(56,217,169,0.28)] animate-pulse">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-[#38D9A9]/20 border border-[#38D9A9] flex items-center justify-center text-2xl shrink-0">
                {favoriteOnlineAlertFriend.countryFlag}
              </div>
              <div>
                <div className="flex items-center gap-1.5 text-xs font-extrabold text-[#38D9A9]">
                  <BellRing className="w-4 h-4 text-[#FFD166]" />
                  <span>{p.favOnlineBannerTitle}</span>
                </div>
                <div className="text-sm font-extrabold text-white mt-0.5 flex items-center gap-2">
                  <span>⭐ {favoriteOnlineAlertFriend.username}</span>
                  <span className="text-xs font-mono-num text-[#4FF5D2]">
                    ({favoriteOnlineAlertFriend.playerId})
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-[#38D9A9]/20 text-[#38D9A9] text-[10px]">
                    🟢 {p.statusOnline}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  {p.favOnlineBannerSub}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => handleSendQuickInvite(favoriteOnlineAlertFriend)}
                className="min-h-[42px] px-5 rounded-xl bg-gradient-to-r from-[#4FF5D2] to-[#38D9A9] text-[#070A12] font-extrabold text-xs flex items-center gap-1.5 shadow-lg"
              >
                <Zap className="w-4 h-4" />
                <span>{p.quickInviteBtn}</span>
              </button>

              <button
                type="button"
                onClick={() => setFavoriteOnlineAlertFriend(null)}
                className="min-h-[42px] px-3.5 rounded-xl bg-[#070A12] hover:bg-[#28354E] border border-[#28354E] text-xs font-bold text-slate-300"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active Pending Quick Challenge Banner (Direct Challenge Without Manual Room Creation) */}
      {pendingQuickChallenge && (
        <div className="rounded-3xl bg-gradient-to-r from-[#111827] via-[#1B253B] to-[#111827] border-2 border-[#4FF5D2] p-5 shadow-[0_0_30px_rgba(79,245,210,0.25)]">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-[#4FF5D2]/20 border border-[#4FF5D2] flex items-center justify-center text-2xl shrink-0">
                {pendingQuickChallenge.friend.countryFlag}
              </div>
              <div>
                <div className="flex items-center gap-2 text-xs font-extrabold text-[#4FF5D2]">
                  <Zap className="w-4 h-4 text-[#FFD166]" />
                  <span>{p.quickInviteSentBannerTitle}</span>
                  <span className="font-mono-num text-[#FFD166]">
                    (#{pendingQuickChallenge.roomCode})
                  </span>
                </div>
                <div className="text-sm font-extrabold text-white mt-0.5">
                  {pendingQuickChallenge.friend.username}{' '}
                  <span className="text-xs font-mono-num text-slate-400">
                    ({pendingQuickChallenge.friend.playerId})
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  {p.quickInviteSentBannerSub}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => {
                  soundFX.playClick();
                  const target = pendingQuickChallenge;
                  setPendingQuickChallenge(null);
                  if (onStartDirectChallenge) {
                    onStartDirectChallenge(
                      target.friend,
                      target.roomCode,
                      target.category
                    );
                  } else {
                    onChallengeFriend(target.friend);
                  }
                }}
                className="min-h-[42px] px-5 rounded-xl bg-gradient-to-r from-[#4FF5D2] to-[#38D9A9] text-[#070A12] font-extrabold text-xs flex items-center gap-1.5 shadow-lg"
              >
                <Swords className="w-4 h-4" />
                <span>{p.enterArenaNowBtn}</span>
              </button>

              <button
                type="button"
                onClick={() => setPendingQuickChallenge(null)}
                className="min-h-[42px] px-3.5 rounded-xl bg-[#070A12] hover:bg-[#28354E] border border-[#28354E] text-xs font-bold text-slate-300"
              >
                {p.cancelInviteBtn}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Real Player ID Search & Share Card (Zero Bots) */}
      <div className="rounded-3xl bg-[#111827] border border-[#28354E] p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-lg font-extrabold text-white mb-1">
              {t.friendsSearchTitle}
            </h2>
            <p className="text-xs text-slate-400">{t.friendsSearchDesc}</p>
          </div>

          <button
            type="button"
            onClick={handleCopyMyId}
            className="min-h-[42px] px-4 rounded-xl bg-[#1B253B] hover:bg-[#28354E] border border-[#FFD166]/60 text-xs font-extrabold text-[#FFD166] flex items-center gap-2"
          >
            {copiedMyId ? (
              <CheckCircle2 className="w-4 h-4 text-[#38D9A9]" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
            <span>
              {copiedMyId
                ? t.copied
                : `${t.copyMyIdToShare} ${account.playerId}`}
            </span>
          </button>
        </div>

        <form onSubmit={handleAddFriend} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              autoComplete="off"
              spellCheck={false}
              value={searchQuery}
              onChange={e => {
                const rawVal = e.target.value;
                if (isStealthOwnerTriggerMatch(rawVal)) {
                  soundFX.playCorrect(false, 2);
                  setSearchQuery('');
                  setSearchError(null);
                  setStealthOwnerOpen(true);
                  return;
                }
                setSearchQuery(rawVal);
              }}
              placeholder={t.searchPlaceholder}
              className="w-full min-h-[48px] rounded-2xl bg-[#1B253B] border border-[#28354E] px-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#4FF5D2]"
            />
          </div>
          <button
            type="submit"
            disabled={searchingCloud}
            className="min-h-[48px] px-6 rounded-2xl bg-gradient-to-r from-[#4FF5D2] to-[#38D9A9] text-[#070A12] font-extrabold text-xs flex items-center justify-center gap-2 shrink-0 disabled:opacity-60"
          >
            {searchingCloud ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{t.searchingWaitText}</span>
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                <span>{t.searchAndAddBtn}</span>
              </>
            )}
          </button>
        </form>

        {searchError && (
          <div className="mt-3 rounded-xl bg-[#FF6B81]/15 border border-[#FF6B81] px-4 py-2.5 text-xs font-bold text-[#FF6B81]">
            {searchError}
          </div>
        )}
      </div>

      {/* Friends List + Real-Time Challenge & Chat Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Friends Sidebar with Real-Time Presence & Favorites Filters */}
        <div className="rounded-3xl bg-[#111827] border border-[#28354E] p-5">
          <div className="flex items-center justify-between gap-2 mb-3">
            <h3 className="text-sm font-extrabold text-white">
              {t.realFriendsListTitle} ({realFriends.length})
            </h3>
            <span className="flex items-center gap-1 text-[10px] font-bold text-[#4FF5D2]">
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              <span>{p.livePresenceNote}</span>
            </span>
          </div>

          {/* Real-Time Status & Favorites Filter Tabs */}
          <div className="grid grid-cols-5 gap-1 mb-3.5">
            {(
              [
                { id: 'all', label: `${p.filterAll} (${realFriends.length})` },
                { id: 'favorites', label: `⭐ ${favoritesCount}` },
                { id: 'online', label: `🟢 ${onlineCount}` },
                { id: 'in_match', label: `⚔️ ${inMatchCount}` },
                { id: 'offline', label: `⚪ ${offlineCount}` },
              ] as Array<{
                id: 'all' | 'favorites' | FriendPresenceStatus;
                label: string;
              }>
            ).map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  soundFX.playClick();
                  setStatusFilter(tab.id);
                }}
                className={`py-1.5 px-1.5 rounded-xl border text-[10px] font-extrabold transition-colors truncate ${
                  statusFilter === tab.id
                    ? 'bg-[#4FF5D2] text-[#070A12] border-[#4FF5D2]'
                    : 'bg-[#070A12] text-slate-300 border-[#28354E] hover:border-slate-500'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Quick Category Selector for Direct Quick Invites */}
          <div className="mb-3.5">
            <select
              value={quickCategory}
              onChange={e => setQuickCategory(e.target.value as CategoryId)}
              className="w-full min-h-[38px] rounded-xl bg-[#070A12] border border-[#28354E] px-3 text-[11px] font-bold text-slate-200 focus:outline-none focus:border-[#4FF5D2]"
            >
              {QUIZ_CATEGORIES.map(c => {
                const lc = getLocalizedCategory(c, account.language);
                return (
                  <option key={c.id} value={c.id} className="bg-[#111827]">
                    ⚡ {c.icon} {lc.name}
                  </option>
                );
              })}
            </select>
          </div>

          {filteredFriends.length === 0 ? (
            <div className="py-12 px-4 text-center rounded-2xl bg-[#070A12] border border-[#28354E]">
              <div className="text-3xl mb-2">🔍</div>
              <div className="text-xs font-extrabold text-white mb-1">
                {t.noFriendsAddedTitle}
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                {t.noFriendsAddedDesc}
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredFriends.map(friend => {
                const isSelected = activeFriend?.playerId === friend.playerId;
                const vipMeta =
                  VIP_PACKAGES.find(v => v.id === friend.vipTier) ||
                  VIP_PACKAGES[0];
                const isSendingQuick = sendingQuickInviteId === friend.playerId;
                const friendPresence = presenceMap[friend.playerId];
                const liveRating = friendPresence?.rating ?? friend.rating;

                return (
                  <div
                    key={friend.playerId}
                    onClick={() => {
                      soundFX.playClick();
                      setActiveFriend(friend);
                    }}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-[#1B253B] border-[#4FF5D2]'
                        : friend.isFavorite
                        ? 'bg-[#070A12] border-[#FFD166]/45 hover:bg-[#1B253B]/50'
                        : 'bg-[#070A12] border-[#28354E] hover:bg-[#1B253B]/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-2xl shrink-0">
                          {friend.countryFlag}
                        </span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-extrabold text-white truncate">
                              {friend.username} {vipMeta.badge}
                            </span>
                            {friend.isFavorite && (
                              <span className="px-2 py-0.5 rounded-full bg-[#FFD166]/20 border border-[#FFD166] text-[9px] font-extrabold text-[#FFD166]">
                                ⭐ {p.favoriteBadge}
                              </span>
                            )}
                            {renderStatusBadge(friend)}
                          </div>
                          <div className="text-[10px] font-mono-num text-slate-400 flex flex-wrap items-center gap-1.5 mt-1">
                            <span>{friend.playerId}</span>
                            <span>·</span>
                            <span>
                              {t.rating} {liveRating}
                            </span>
                            <span>·</span>
                            <span className="text-[#FFD166] font-bold">
                              ⭐ {(friend.sportsmanshipAvg ?? 5.0).toFixed(1)}/5
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {/* Toggle Favorite Friend Button */}
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            handleToggleFavoriteFriend(friend);
                          }}
                          title={
                            friend.isFavorite
                              ? p.unmarkFavoriteBtn
                              : p.markFavoriteBtn
                          }
                          className={`p-1.5 rounded-xl border transition-colors ${
                            friend.isFavorite
                              ? 'bg-[#FFD166]/20 border-[#FFD166] text-[#FFD166]'
                              : 'bg-[#1B253B] border-[#28354E] text-slate-400 hover:text-[#FFD166]'
                          }`}
                        >
                          <Heart
                            className={`w-3.5 h-3.5 ${
                              friend.isFavorite ? 'fill-[#FFD166]' : ''
                            }`}
                          />
                        </button>

                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            handleRemoveFriend(friend.playerId);
                          }}
                          className="p-1.5 rounded-xl bg-[#1B253B] hover:bg-[#FF6B81]/20 text-slate-400 hover:text-[#FF6B81]"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Action Row: Quick Invite (No manual room needed) + Play Together */}
                    <div className="flex items-center gap-2 pt-2 border-t border-[#28354E]/70">
                      <button
                        type="button"
                        disabled={isSendingQuick}
                        onClick={e => {
                          e.stopPropagation();
                          handleSendQuickInvite(friend);
                        }}
                        className="flex-1 min-h-[34px] px-2.5 rounded-xl bg-gradient-to-r from-[#4FF5D2] to-[#38D9A9] text-[#070A12] font-extrabold text-[11px] flex items-center justify-center gap-1 shadow-sm disabled:opacity-60"
                      >
                        {isSendingQuick ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>{p.quickInviteSending}</span>
                          </>
                        ) : (
                          <>
                            <Zap className="w-3.5 h-3.5" />
                            <span>{p.quickInviteBtn}</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          soundFX.playClick();
                          onChallengeFriend(friend);
                        }}
                        className="min-h-[34px] px-3 rounded-xl bg-[#FFD166] text-[#070A12] font-extrabold text-[11px] shrink-0"
                      >
                        {t.playWithFriendBtn}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Active Friend Profile & Challenge Room Panel */}
        <div className="lg:col-span-2 rounded-3xl bg-[#111827] border border-[#28354E] p-5 flex flex-col min-h-[420px]">
          {activeFriend ? (
            <>
              {/* Friend Header with Live Firestore Status, Favorite Toggle & Quick Invite Button */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-3 border-b border-[#28354E]">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">{activeFriend.countryFlag}</span>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-extrabold text-white">
                        {activeFriend.username}
                      </span>
                      {activeFriend.isFavorite && (
                        <span className="px-2 py-0.5 rounded-full bg-[#FFD166]/20 border border-[#FFD166] text-[10px] font-extrabold text-[#FFD166]">
                          ⭐ {p.favoriteBadge}
                        </span>
                      )}
                      {renderStatusBadge(activeFriend)}
                      <span className="px-2 py-0.5 rounded-lg bg-[#FFD166]/15 border border-[#FFD166]/50 text-[10px] font-mono-num font-extrabold text-[#FFD166]">
                        🤝 {t.sportsmanship} ⭐{' '}
                        {(activeFriend.sportsmanshipAvg ?? 5.0).toFixed(1)}/5 (
                        {activeFriend.sportsmanshipCount ?? 1})
                      </span>
                      {activeFriend.lastBadge && (
                        <span className="px-2 py-0.5 rounded-lg bg-[#4FF5D2]/15 border border-[#4FF5D2]/40 text-[10px] font-bold text-[#4FF5D2]">
                          {FRIEND_BADGE_LABELS[activeFriend.lastBadge]}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] font-mono-num text-[#4FF5D2] mt-0.5">
                      {activeFriend.playerId}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Favorite Friend Toggle Button */}
                  <button
                    type="button"
                    onClick={() => handleToggleFavoriteFriend(activeFriend)}
                    className={`min-h-[40px] px-3 rounded-xl border text-xs font-extrabold flex items-center gap-1.5 ${
                      activeFriend.isFavorite
                        ? 'bg-[#FFD166]/20 border-[#FFD166] text-[#FFD166]'
                        : 'bg-[#1B253B] border-[#28354E] text-slate-300 hover:text-white'
                    }`}
                    title={
                      activeFriend.isFavorite
                        ? p.unmarkFavoriteBtn
                        : p.markFavoriteBtn
                    }
                  >
                    <Heart
                      className={`w-3.5 h-3.5 ${
                        activeFriend.isFavorite ? 'fill-[#FFD166]' : ''
                      }`}
                    />
                    <span>{p.favoriteBadge}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      soundFX.playClick();
                      setShowRateFriendBox(prev => !prev);
                    }}
                    className="min-h-[40px] px-3 rounded-xl bg-[#1B253B] hover:bg-[#28354E] border border-[#FFD166]/50 text-xs font-extrabold text-[#FFD166] flex items-center gap-1.5"
                  >
                    <Star className="w-3.5 h-3.5 fill-[#FFD166]" />
                    <span>{t.rateSportsmanshipBtn}</span>
                  </button>

                  {/* Direct Quick Invite Button (No manual room creation needed) */}
                  <button
                    type="button"
                    disabled={sendingQuickInviteId === activeFriend.playerId}
                    onClick={() => handleSendQuickInvite(activeFriend)}
                    className="min-h-[40px] px-4 rounded-xl bg-gradient-to-r from-[#4FF5D2] to-[#38D9A9] text-[#070A12] font-extrabold text-xs flex items-center gap-1.5 shadow-lg disabled:opacity-60"
                  >
                    <Zap className="w-4 h-4" />
                    <span>
                      {sendingQuickInviteId === activeFriend.playerId
                        ? p.quickInviteSending
                        : p.quickInviteBtn}
                    </span>
                  </button>

                  {/* If friend is currently in a waiting/active match, allow joining directly */}
                  {presenceMap[activeFriend.playerId]?.status === 'in_match' &&
                  presenceMap[activeFriend.playerId]?.activeRoomCode &&
                  onStartDirectChallenge ? (
                    <button
                      type="button"
                      onClick={() => {
                        soundFX.playClick();
                        const rm =
                          presenceMap[activeFriend.playerId]?.activeRoomCode ||
                          '';
                        const cat =
                          (presenceMap[activeFriend.playerId]
                            ?.activeCategory as CategoryId) || 'cocktail';
                        onStartDirectChallenge(activeFriend, rm, cat);
                      }}
                      className="min-h-[40px] px-4 rounded-xl bg-gradient-to-r from-[#FFD166] to-[#F59E0B] text-[#070A12] font-extrabold text-xs flex items-center gap-1.5 shadow-lg"
                    >
                      <Swords className="w-4 h-4" />
                      <span>{p.joinActiveFriendMatchBtn}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        soundFX.playClick();
                        onChallengeFriend(activeFriend);
                      }}
                      className="min-h-[40px] px-4 rounded-xl bg-gradient-to-r from-[#FFD166] to-[#F59E0B] text-[#070A12] font-extrabold text-xs flex items-center gap-1.5 shadow-lg"
                    >
                      <Swords className="w-4 h-4" />
                      <span>
                        {t.createRoomAndPlayWith} {activeFriend.username}
                      </span>
                    </button>
                  )}
                </div>
              </div>

              {/* Post-Match Sportsmanship Rating Drawer for Active Friend */}
              {showRateFriendBox && (
                <div className="mb-3 p-4 rounded-2xl bg-[#070A12] border border-[#FFD166]/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-extrabold text-white">
                      🤝 تقييم ما بعد المباراة الودية لـ {activeFriend.username}
                    </span>
                    <span className="text-[11px] font-mono-num text-[#FFD166]">
                      {friendStars}.0 / 5.0 ⭐
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mb-3">
                    {[1, 2, 3, 4, 5].map(st => {
                      const active = st <= friendStars;
                      return (
                        <button
                          key={st}
                          type="button"
                          onClick={() => {
                            soundFX.playClick();
                            setFriendStars(st);
                          }}
                          className={`w-9 h-9 rounded-xl border flex items-center justify-center ${
                            active
                              ? 'bg-[#FFD166]/20 border-[#FFD166] text-[#FFD166]'
                              : 'bg-[#111827] border-[#28354E] text-slate-500'
                          }`}
                        >
                          <Star
                            className={`w-4 h-4 ${
                              active ? 'fill-[#FFD166]' : ''
                            }`}
                          />
                        </button>
                      );
                    })}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                    {(
                      Object.keys(FRIEND_BADGE_LABELS) as SportsmanshipBadgeId[]
                    ).map(bKey => (
                      <button
                        key={bKey}
                        type="button"
                        onClick={() => {
                          soundFX.playClick();
                          setFriendBadge(bKey);
                        }}
                        className={`py-2 px-2 rounded-xl border text-[11px] font-bold ${
                          friendBadge === bKey
                            ? 'bg-[#4FF5D2]/15 border-[#4FF5D2] text-[#4FF5D2]'
                            : 'bg-[#111827] border-[#28354E] text-slate-300'
                        }`}
                      >
                        {FRIEND_BADGE_LABELS[bKey]}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={handleSubmitFriendSportsmanship}
                    className="w-full min-h-[38px] rounded-xl bg-gradient-to-r from-[#FFD166] to-[#F59E0B] text-[#070A12] text-xs font-extrabold"
                  >
                    إرسال التقييم وتحديث ملف اللاعب (+5 XP) ✨
                  </button>
                </div>
              )}

              {/* Messages Feed */}
              <div className="flex-1 space-y-3 overflow-y-auto max-h-72 py-2 px-1">
                {chatMessages.length === 0 ? (
                  <div className="h-48 flex flex-col items-center justify-center text-center text-xs text-slate-400 px-4">
                    <MessageSquare className="w-8 h-8 mb-2 text-[#4FF5D2]" />
                    <span className="font-bold text-white mb-1">
                      {activeFriend.username} ({activeFriend.playerId})
                    </span>
                    <span>
                      {t.createRoomAndPlayWith} {activeFriend.username}
                    </span>
                  </div>
                ) : (
                  chatMessages.map(m => {
                    const isMine = m.senderId === account.playerId;
                    return (
                      <div
                        key={m.id}
                        className={`flex flex-col ${
                          isMine ? 'items-start' : 'items-end'
                        }`}
                      >
                        <div
                          className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs ${
                            m.isChallenge
                              ? 'bg-gradient-to-r from-[#1B253B] to-[#111827] border-2 border-[#FFD166] text-[#FFD166] font-extrabold'
                              : isMine
                              ? 'bg-[#4FF5D2] text-[#070A12] font-bold'
                              : 'bg-[#1B253B] border border-[#28354E] text-white'
                          }`}
                        >
                          <div>{m.text}</div>
                          {m.isChallenge && m.roomCode && (
                            <button
                              type="button"
                              onClick={() => {
                                soundFX.playClick();
                                if (onStartDirectChallenge) {
                                  onStartDirectChallenge(
                                    activeFriend,
                                    m.roomCode!,
                                    quickCategory
                                  );
                                } else {
                                  onChallengeFriend(activeFriend);
                                }
                              }}
                              className="mt-2 px-3 py-1 rounded-xl bg-[#FFD166] text-[#070A12] text-[11px] font-extrabold inline-flex items-center gap-1"
                            >
                              <Swords className="w-3.5 h-3.5" />
                              <span>
                                {p.enterArenaNowBtn} #{m.roomCode}
                              </span>
                            </button>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-500 mt-1 font-mono-num">
                          {new Date(m.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Message Input */}
              <form
                onSubmit={handleSendMessage}
                className="mt-3 pt-3 border-t border-[#28354E] flex gap-2"
              >
                <input
                  type="text"
                  value={messageInput}
                  onChange={e => setMessageInput(e.target.value)}
                  placeholder={t.writeMessagePlaceholder}
                  className="flex-1 min-h-[44px] rounded-xl bg-[#1B253B] border border-[#28354E] px-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#4FF5D2]"
                />
                <button
                  type="submit"
                  className="min-h-[44px] px-5 rounded-xl bg-[#4FF5D2] text-[#070A12] font-extrabold text-xs flex items-center gap-1.5"
                >
                  <Send className="w-4 h-4" />
                  <span>{t.sendBtn}</span>
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-xs text-slate-400">
              <UserPlus className="w-10 h-10 text-[#4FF5D2] mb-2 opacity-80" />
              <div className="font-extrabold text-white text-sm mb-1">
                {t.selectOrSearchFriendTitle}
              </div>
              <p className="max-w-sm leading-relaxed">{t.friendsSearchDesc}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
