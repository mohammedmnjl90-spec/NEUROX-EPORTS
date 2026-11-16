export type LanguageCode = 'ar' | 'en' | 'fr' | 'es' | 'tr' | 'ur';

export type CategoryId =
  | 'quran'
  | 'islamic'
  | 'arabic'
  | 'science'
  | 'history'
  | 'geography'
  | 'capitals'
  | 'math'
  | 'physics'
  | 'sports'
  | 'cocktail';

export type GameMode = 'online' | 'local' | 'solo' | 'room';

export type BotDifficulty = 'beginner' | 'medium' | 'pro' | 'legendary';
export type BotPersona = 'calm' | 'hasty' | 'thinker' | 'aggressive';

export type VipTier = 'basic' | 'bronze' | 'silver' | 'royal_gold';

export type ProfileBorderId =
  | 'default_cyan'
  | 'emerald_flame'
  | 'amethyst_galaxy'
  | 'crimson_cyber'
  | 'royal_gold_frame';

export type UiThemeId =
  | 'midnight_cyan'
  | 'obsidian_gold'
  | 'emerald_matrix'
  | 'violet_nebula';

export type SoundPackId = 'cyber' | 'royal' | 'classic';

export type SportsmanshipBadgeId =
  | 'fair_competitor'
  | 'fast_genius'
  | 'respectful_rival'
  | 'great_fun';

export interface SportsmanshipReview {
  id: string;
  matchId: string;
  targetPlayerId: string;
  targetName: string;
  stars: number; // 1..5
  badge: SportsmanshipBadgeId;
  timestamp: number;
}

export interface LifelinesInventory {
  fiftyFifty: number;
  freezeTime: number;
  autoSolve: number;
}

export interface EconomyLedgerEntry {
  id: string;
  timestamp: number;
  type: 'credit' | 'debit';
  amount: number;
  reason: string;
  balanceAfter: number;
}

export interface MatchHistoryItem {
  id: string;
  timestamp: number;
  mode: GameMode;
  category: CategoryId;
  opponentName: string;
  opponentFlag: string;
  opponentIsBot: boolean;
  playerRoundsWon: number;
  opponentRoundsWon: number;
  playerTotalPoints: number;
  opponentTotalPoints: number;
  outcome: 'win' | 'loss' | 'draw' | 'forfeit_win' | 'forfeit_loss';
  ratingDelta: number;
  tournamentPointsEarned: number;
  coinsDelta: number;
  sportsmanshipStarsGiven?: number;
  sportsmanshipBadgeGiven?: SportsmanshipBadgeId;
}

export type FriendPresenceStatus = 'online' | 'in_match' | 'offline';

export interface FriendItem {
  uid: string;
  playerId: string;
  username: string;
  countryFlag: string;
  rating: number;
  vipTier: VipTier;
  addedAt: number;
  isFavorite?: boolean;
  sportsmanshipAvg?: number;
  sportsmanshipCount?: number;
  lastBadge?: SportsmanshipBadgeId;
  presenceStatus?: FriendPresenceStatus;
  lastSeenMs?: number;
  activeRoomCode?: string;
}

export interface ChatMessageItem {
  id: string;
  friendId: string;
  senderId: string;
  senderName: string;
  text: string;
  isChallenge?: boolean;
  roomCode?: string;
  timestamp: number;
}

export interface ChallengeNotificationItem {
  id: string;
  roomCode: string;
  category: CategoryId;
  senderUid: string;
  senderPlayerId: string;
  senderName: string;
  senderFlag: string;
  timestamp: number;
  read: boolean;
}

export interface CloudFriendRequestItem {
  requestId: string;
  fromUid: string;
  fromPlayerId: string;
  fromName: string;
  fromFlag: string;
  fromRating: number;
  fromVipTier: VipTier;
  toPlayerId: string;
  toUid?: string;
  toName?: string;
  toFlag?: string;
  toRating?: number;
  toVipTier?: VipTier;
  status: 'pending' | 'accepted' | 'rejected';
  timestamp: number;
}

export interface DailyMissionProgress {
  dateStr: string;
  onlineWins: number;
  onlineWinsClaimed: boolean;
  correctAnswers: number;
  correctAnswersClaimed: boolean;
  quranCorrect: number;
  quranCorrectClaimed: boolean;
}

export interface PlayerAccount {
  uid: string;
  playerId: string; // e.g. #1234567890 (10 digits, bots NEVER have this)
  username: string;
  passwordHash: string;
  contactType: 'phone' | 'email';
  contactValue: string;
  countryCode: string;
  countryFlag: string;
  countryName: string;
  xp: number;
  level: number;
  coins: number; // Starts at 50
  monthlyPoints: number;
  rating: number; // Starts at 1200
  vipTier: VipTier;
  fairPlayScore: number; // 100/100
  sportsmanshipAvg?: number; // 1.0 .. 5.0 (Starts at 5.0)
  sportsmanshipCount?: number;
  sportsmanshipBadges?: Partial<Record<SportsmanshipBadgeId, number>>;
  givenReviews?: SportsmanshipReview[];
  lifelines: LifelinesInventory; // Starts at 1 each
  onlineWins: number;
  totalMatches: number;
  totalDraws: number;
  totalCorrectAnswers: number;
  goldenCorrectAnswers: number;
  maxComboReached: number;
  unlockedAchievements: string[];
  seenQuestionIds: string[];
  lastLoginDate: string;
  loginStreak: number;
  lastSpinDate: string;
  adsWatchedDate: string;
  adsWatchedCount: number;
  lastShareDate: string;
  lastDailyBossDate: string;
  dailyMissions: DailyMissionProgress;
  ledger: EconomyLedgerEntry[];
  matchHistory: MatchHistoryItem[];
  friends: FriendItem[];
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  localNotificationsEnabled?: boolean;
  soundPack?: SoundPackId;
  language: LanguageCode;
  botDifficulty: BotDifficulty;
  botPersona: BotPersona;
  ownedBorders?: ProfileBorderId[];
  unlockedBorders?: ProfileBorderId[];
  equippedBorder?: ProfileBorderId;
  ownedThemes?: UiThemeId[];
  equippedTheme?: UiThemeId;
  playtimeSeconds?: number; // Cumulative hourly playtime counter (0..3600)
  isBanned?: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface HourlyAdConfig {
  enabled: boolean;
  intervalSeconds: number; // 3600 seconds (60 minutes)
  countdownSeconds: number; // e.g. 5..15 seconds
  adTitle: string;
  adDescription: string;
  bannerImageUrl: string;
  videoUrl: string;
  targetLinkUrl: string;
  ctaButtonText: string;
  stripeBronzeUrl: string;
  stripeSilverUrl: string;
  stripeGoldUrl: string;
  paypalCheckoutUrl: string;
  ownerContactInfo: string;
  updatedAt: number;
}

export interface PromoVipCode {
  code: string;
  rewardType: 'vip' | 'coins';
  vipTier?: VipTier;
  bonusCoins: number;
  maxUses: number;
  usedByPlayerIds: string[];
  noteAr: string;
  createdAt: number;
}

export interface VipPaymentRequest {
  id: string;
  uid: string;
  playerId: string;
  username: string;
  countryFlag: string;
  requestedTier: VipTier;
  priceUsdText: string;
  paymentMethod: 'card' | 'paypal' | 'local_transfer';
  transferReference: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: number;
  processedAt?: number;
}

export interface CloudManagedPlayer {
  uid: string;
  playerId: string;
  username: string;
  countryCode: string;
  countryFlag: string;
  xp: number;
  level: number;
  coins: number;
  monthlyPoints: number;
  rating: number;
  vipTier: VipTier;
  fairPlayScore: number;
  onlineWins: number;
  totalMatches: number;
  isBanned: boolean;
  updatedAtMs?: number;
}

export interface QuizQuestion {
  id: string;
  category: CategoryId;
  questionAr: string;
  questionEn?: string;
  optionsAr: [string, string, string, string];
  optionsEn?: [string, string, string, string];
  correctIndex: number; // 0..3
  difficulty: 'easy' | 'medium' | 'hard';
}

