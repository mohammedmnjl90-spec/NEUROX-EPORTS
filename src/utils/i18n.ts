import { CategoryDefinition, RankTierInfo } from '../data/constants';
import { CategoryId, LanguageCode } from '../types';

export interface LocalizedStrings {
  // Navigation & Header
  arena: string;
  store: string;
  leaderboard: string;
  friends: string;
  achievements: string;
  settings: string;
  onlineStatus: string;
  offlineOnlyStatus: string;
  offlineBannerText: string;
  coins: string;
  copyId: string;
  copied: string;
  logout: string;

  // Player Profile & Stats
  levelLabel: string;
  fairPlay: string;
  sportsmanship: string;
  progressTowards: string;
  legendaryPeak: string;
  monthlyPoints: string;
  rating: string;
  wins: string;

  // Game Modes & Private Room
  chooseGameModeTitle: string;
  matchFormatSubtitle: string;
  onlineMode: string;
  onlineModeDesc: string;
  localMode: string;
  localModeDesc: string;
  soloMode: string;
  soloModeDesc: string;
  privateRoom: string;
  privateRoomDesc: string;
  requiresInternet: string;
  availableOffline: string;

  // Categories Section
  categoriesHeader: string;
  noRepeatActive: string;
  featuredGoldenBadge: string;
  startQuranQuizBtn: string;

  // Private Room Modal
  privateRoomModalTitle: string;
  privateRoomModalDesc: string;
  chooseRoomCategoryLabel: string;
  shareCodeWithFriend: string;
  startMatchInRoomBtn: string;
  createNew4DigitRoomBtn: string;
  orJoinFriendRoomLabel: string;
  joinNowBtn: string;

  // Notifications Center
  notifCenterTitle: string;
  notifCenterSub: string;
  bgNotifStatusLabel: string;
  statusGranted: string;
  statusDenied: string;
  statusPending: string;
  enableBgNotifBtn: string;
  simulateInstantInviteBtn: string;
  testBgNotif3sBtn: string;
  noIncomingInvitesText: string;
  inviteFromLabel: string;
  joinRoomBtn: string;
  clearNotificationsBtn: string;
  incomingInviteBannerTitle: string;
  acceptChallengeNowBtn: string;
  laterBtn: string;

  // Settings View
  fairPlayTitle: string;
  fairPlayDesc: string;
  sportsmanshipProfileTitle: string;
  sportsmanshipProfileDesc: string;
  evaluationsCountLabel: string;
  badgeFairCompetitor: string;
  badgeFastGenius: string;
  badgeRespectfulRival: string;
  badgeGreatFun: string;
  sfxAndVibrationTitle: string;
  interactiveSfxLabel: string;
  phoneVibrationLabel: string;
  enabledText: string;
  disabledText: string;
  localNotifSettingsTitle: string;
  localNotifSettingsDesc: string;
  localNotifToggleLabel: string;
  systemNotifPermissionLabel: string;
  soundPackTitle: string;
  soundPackSub: string;
  packCyberLabel: string;
  packCyberSub: string;
  packRoyalLabel: string;
  packRoyalSub: string;
  packClassicLabel: string;
  packClassicSub: string;
  activeLabel: string;
  sfxSoundboardTitle: string;
  sfxSoundboardSub: string;
  sfxVictory: string;
  sfxLoss: string;
  sfxCorrect: string;
  sfxWrong: string;
  sfxForfeit: string;
  botAiTitle: string;
  botAiSub: string;
  botDifficultyLabel: string;
  diffBeginner: string;
  diffMedium: string;
  diffPro: string;
  diffLegendary: string;
  botPersonaLabel: string;
  personaCalm: string;
  personaHasty: string;
  personaThinker: string;
  personaAggressive: string;
  supportedLanguagesTitle: string;

  // Friends View
  friendsSearchTitle: string;
  friendsSearchDesc: string;
  copyMyIdToShare: string;
  searchPlaceholder: string;
  searchAndAddBtn: string;
  searchingWaitText: string;
  realFriendsListTitle: string;
  noFriendsAddedTitle: string;
  noFriendsAddedDesc: string;
  playWithFriendBtn: string;
  rateSportsmanshipBtn: string;
  createRoomAndPlayWith: string;
  sendBtn: string;
  writeMessagePlaceholder: string;
  selectOrSearchFriendTitle: string;

  // Exit Modal
  exitConfirmTitle: string;
  exitConfirmSub: string;
  stayInArenaBtn: string;
  backToHomeBtn: string;
}

export const FULL_TRANSLATIONS: Record<LanguageCode, LocalizedStrings> = {
  ar: {
    arena: 'الساحة',
    store: 'المتجر والمكافآت',
    leaderboard: 'البطولة والجوائز',
    friends: 'الأصدقاء والدردشة',
    achievements: 'الأوسمة والسجل',
    settings: 'الإعدادات',
    onlineStatus: 'متصل بالإنترنت',
    offlineOnlyStatus: 'وضع أوفلاين فقط',
    offlineBannerText:
      'أنت تتصفح التطبيق بدون اتصال بالإنترنت: تم إيقاف أطوار الأونلاين والأصدقاء والبطولة مؤقتاً، ويمكنك اللعب في أطوار الأوفلاين (التدريب الفردي أو لاعبان على نفس الجوال) حتى يعود الإنترنت.',
    coins: 'عملة ذهبية',
    copyId: 'نسخ المعرّف',
    copied: 'تم النسخ!',
    logout: 'تسجيل الخروج',

    levelLabel: 'المستوى',
    fairPlay: 'النزاهة',
    sportsmanship: 'الروح الرياضية',
    progressTowards: 'التقدم نحو',
    legendaryPeak: 'القمة الأسطورية 👑',
    monthlyPoints: 'نقاط الشهر',
    rating: 'التصنيف',
    wins: 'الانتصارات',

    chooseGameModeTitle: '⚔️ اختر طور اللعب أو أنشئ غرفة تحدي خاصة',
    matchFormatSubtitle: '3 جولات · 8 أسئلة للجولة · 6 ثوانٍ للسؤال',
    onlineMode: 'لعب أونلاين (كوكتيل شامل 🌍)',
    onlineModeDesc: 'مواجهة تنافسية مباشرة · يُحتسب في البطولة الشهرية',
    localMode: 'لعب مع صديق بجانبك 👥',
    localModeDesc: 'لاعبان على نفس الجوال يتناوبان الإجابة (يعمل بدون إنترنت)',
    soloMode: 'لعب أوفلاين بمفردك 🎯',
    soloModeDesc: 'للتدريب السريع وكسب نقاط الخبرة (يعمل بدون إنترنت)',
    privateRoom: 'تحدي الغرف الخاصة (كود 4 أرقام 🏠)',
    privateRoomDesc: 'أنشئ كوداً من 4 أرقام أو انضم لصديق بنفس الأسئلة والترتيب',
    requiresInternet: 'يتطلب إنترنت',
    availableOffline: '✓ متاح أوفلاين',

    categoriesHeader: '📚 أقسام المسابقات المعرفية (11 قسماً · أكثر من 600 سؤال متجدد)',
    noRepeatActive: 'نظام منع تكرار الأسئلة مفعّل ✓',
    featuredGoldenBadge: '🌟 القسم الذهبي الخاص والمميز',
    startQuranQuizBtn: 'ابدأ مسابقة القرآن الكريم 📖',

    privateRoomModalTitle: '🏠 تحدي الغرف الخاصة (كود 4 أرقام)',
    privateRoomModalDesc:
      'يضمن كود الغرفة المكون من 4 أرقام توليد نفس الأسئلة وبنفس الترتيب للطرفين بدقة 100%.',
    chooseRoomCategoryLabel: 'اختر قسم الأسئلة للغرفة:',
    shareCodeWithFriend: 'شارك هذا الكود مع صديقك:',
    startMatchInRoomBtn: 'بدء المباراة في الغرفة 🚀',
    createNew4DigitRoomBtn: 'إنشاء كود غرفة جديد من 4 أرقام ➕',
    orJoinFriendRoomLabel: 'أو انضم إلى غرفة صديقك بإدخال الكود:',
    joinNowBtn: 'انضمام الآن',

    notifCenterTitle: '🔔 مركز التنبيهات المحلي ودعوات التحدي',
    notifCenterSub:
      'إشعارات فورية عند تلقي دعوة تحدي من صديق جديد حتى لو كان التطبيق في الخلفية',
    bgNotifStatusLabel: 'حالة إشعارات الخلفية في المتصفح/النظام:',
    statusGranted: 'مفعّلة بالكامل ✓',
    statusDenied: 'محظورة من المتصفح',
    statusPending: 'بانتظار التفعيل',
    enableBgNotifBtn: 'تفعيل إشعارات الخلفية 🔔',
    simulateInstantInviteBtn: '⚡ محاكاة دعوة تحدي فورية',
    testBgNotif3sBtn: '🕒 تجربة إشعار في الخلفية (بعد 3 ثوانٍ)',
    noIncomingInvitesText:
      'لا توجد دعوات تحدي واردة حالياً. عندما يرسل لك صديق دعوة غرفة ستظهر هنا فوراً مع تنبيه صوتي وإشعار في الخلفية!',
    inviteFromLabel: 'دعوة تحدي من',
    joinRoomBtn: 'انضمام للغرفة',
    clearNotificationsBtn: 'مسح سجل التنبيهات',
    incomingInviteBannerTitle: '🔔 دعوة تحدي مباشرة جديدة!',
    acceptChallengeNowBtn: '⚡ قبول التحدي والانضمام فوراً',
    laterBtn: 'لاحقاً',

    fairPlayTitle: 'مؤشر النزاهة واللعب النظيف',
    fairPlayDesc: 'قفل فوري للإجابة · رصد نقرات أقل من 120ms · حماية سجل العملات',
    sportsmanshipProfileTitle: 'تقييم الروح الرياضية',
    sportsmanshipProfileDesc:
      'يُحتسب من تقييمات الأصدقاء والمنافسين بعد انتهاء المباريات الودية والتنافسية',
    evaluationsCountLabel: 'تقييم',
    badgeFairCompetitor: '🤝 منافس شريف',
    badgeFastGenius: '⚡ سرعة بديهة',
    badgeRespectfulRival: '👑 أخلاق رفيعة',
    badgeGreatFun: '🔥 مواجهة ممتعة',
    sfxAndVibrationTitle: 'الصوت والاهتزاز',
    interactiveSfxLabel: 'المؤثرات الصوتية التفاعلية',
    phoneVibrationLabel: 'اهتزاز الهاتف',
    enabledText: 'مفعّل',
    disabledText: 'موقف',
    localNotifSettingsTitle: 'إشعارات التحديات',
    localNotifSettingsDesc:
      'إخطار فوري بالصوت وإشعار النظام عند تلقي دعوة تحدي من صديق جديد حتى لو كان التطبيق في الخلفية',
    localNotifToggleLabel: 'التنبيهات المحلية',
    systemNotifPermissionLabel: 'إذن إشعارات النظام والخلفية',
    soundPackTitle: '🎛️ اختيار نمط الصوت الرياضي',
    soundPackSub: 'نغمات متعددة الطبقات مع تنويع تلقائي لكل حدث',
    packCyberLabel: 'النمط السيبراني ⚡',
    packCyberSub: 'أوتار سينث رياضية سريعة وحيوية',
    packRoyalLabel: 'النمط الملكي 👑',
    packRoyalSub: 'أجراس أوركسترالية دافئة وفخمة',
    packClassicLabel: 'النمط الكلاسيكي 🎮',
    packClassicSub: 'نغمات أركيد كريستالية نقية',
    activeLabel: 'نشط ✓',
    sfxSoundboardTitle: '🎧 لوحة تجربة المؤثرات الصوتية الحية',
    sfxSoundboardSub: 'جرب الضغط المتكرر لسماع التنويع التلقائي لكل مؤثر',
    sfxVictory: 'الفوز 🏆',
    sfxLoss: 'الخسارة ⚔️',
    sfxCorrect: 'إجابة صحيحة ✅',
    sfxWrong: 'إجابة خاطئة ❌',
    sfxForfeit: 'الانسحاب 🏳️',
    botAiTitle: 'إعدادات مستوى البوت',
    botAiSub: 'اختر مستوى صعوبة البوت وشخصيته التنافسية في التدريب',
    botDifficultyLabel: 'مستوى صعوبة البوت:',
    diffBeginner: 'مبتدئ 🌱',
    diffMedium: 'متوسط ⚡',
    diffPro: 'محترف 🔥',
    diffLegendary: 'أسطوري 👑',
    botPersonaLabel: 'شخصية البوت:',
    personaCalm: 'هادئ 😌',
    personaHasty: 'متسرع ⚡',
    personaThinker: 'مفكر 🧠',
    personaAggressive: 'ضاغط 🔥',
    supportedLanguagesTitle: 'لغة التطبيق (6 لغات)',

    friendsSearchTitle: '👥 البحث عن اللاعبين الحقيقيين بالـ #ID واللعب المباشر',
    friendsSearchDesc:
      'بيئة حقيقية 100% خالية من البوتات · شارك كود الـ ID الخاص بك مع صديقك أو أدخل الـ ID الخاص به ليظهر اسمه وتلعبوا معاً فوراً',
    copyMyIdToShare: 'انسخ معرّفك لمشاركته:',
    searchPlaceholder: 'أدخل كود الـ ID لصديقك (مثال: #1234567890) أو اسمه المسجل...',
    searchAndAddBtn: 'بحث بالـ ID وإضافة صديق',
    searchingWaitText: 'جاري البحث عن اللاعب...',
    realFriendsListTitle: 'قائمة أصدقائك الحقيقيين',
    noFriendsAddedTitle: 'لا يوجد أصدقاء مضافون بعد',
    noFriendsAddedDesc:
      'أدخل كود الـ #ID الخاص بصديقك في مربع البحث بالأعلى ليظهر اسمه وتتمكن من تحديه في غرفة مباشرة!',
    playWithFriendBtn: '⚔️ العب معه',
    rateSportsmanshipBtn: 'تقييم الروح الرياضية',
    createRoomAndPlayWith: '⚔️ إنشاء غرفة واللعب مع',
    sendBtn: 'إرسال',
    writeMessagePlaceholder: 'اكتب رسالة أو كود الغرفة...',
    selectOrSearchFriendTitle: 'اختر صديقاً أو ابحث عن صديقك بالـ #ID',

    exitConfirmTitle: 'هل أنت متأكد أنك تريد الخروج من التطبيق؟',
    exitConfirmSub: 'تم حفظ كافة نقاطك وعملاتك في حسابك بأمان.',
    stayInArenaBtn: 'البقاء في الساحة',
    backToHomeBtn: 'العودة للرئيسية',
  },

  en: {
    arena: 'Arena',
    store: 'Store & Rewards',
    leaderboard: 'Tournament & Prizes',
    friends: 'Friends & Chat',
    achievements: 'Badges & History',
    settings: 'Settings',
    onlineStatus: 'Online',
    offlineOnlyStatus: 'Offline Mode Only',
    offlineBannerText:
      'You are currently offline: Online modes, Friends, and Tournament are paused. You can play Offline modes (Solo Practice or Local Pass & Play) until internet returns.',
    coins: 'Gold Coins',
    copyId: 'Copy ID',
    copied: 'Copied!',
    logout: 'Log Out',

    levelLabel: 'Level',
    fairPlay: 'Fair Play',
    sportsmanship: 'Sportsmanship',
    progressTowards: 'Progress towards',
    legendaryPeak: 'Legendary Peak 👑',
    monthlyPoints: 'Monthly Pts',
    rating: 'Rating',
    wins: 'Wins',

    chooseGameModeTitle: '⚔️ Choose Game Mode or Create a Private Room',
    matchFormatSubtitle: '3 Rounds · 8 Questions/Round · 6s per Question',
    onlineMode: 'Online Match (All-in-One 🌍)',
    onlineModeDesc: 'Live competitive match · Counts towards Monthly Tournament',
    localMode: 'Local Pass & Play 👥',
    localModeDesc: 'Two players on the same device taking turns (Works Offline)',
    soloMode: 'Solo Offline Practice 🎯',
    soloModeDesc: 'Fast training & XP progression (Works Offline)',
    privateRoom: 'Private Room (4-Digit Code 🏠)',
    privateRoomDesc: 'Create a 4-digit code or join a friend with identical questions',
    requiresInternet: 'Requires Internet',
    availableOffline: '✓ Available Offline',

    categoriesHeader: '📚 Knowledge Quiz Categories (11 Categories · 600+ Questions)',
    noRepeatActive: 'Anti-Repeat Question Engine Active ✓',
    featuredGoldenBadge: '🌟 Featured Golden Category',
    startQuranQuizBtn: 'Start Holy Quran Quiz 📖',

    privateRoomModalTitle: '🏠 Private Room Challenge (4-Digit Code)',
    privateRoomModalDesc:
      'A 4-digit room code guarantees 100% identical questions in the exact same order for both players.',
    chooseRoomCategoryLabel: 'Select Room Category:',
    shareCodeWithFriend: 'Share this code with your friend:',
    startMatchInRoomBtn: 'Start Match in Room 🚀',
    createNew4DigitRoomBtn: 'Generate New 4-Digit Room Code ➕',
    orJoinFriendRoomLabel: 'Or enter your friend’s 4-digit room code:',
    joinNowBtn: 'Join Now',

    notifCenterTitle: '🔔 Local Notifications & Challenge Invites',
    notifCenterSub:
      'Instant alerts when receiving a challenge invite from a friend even if the app is in the background',
    bgNotifStatusLabel: 'Browser / System Background Notification Status:',
    statusGranted: 'Fully Enabled ✓',
    statusDenied: 'Blocked by Browser',
    statusPending: 'Awaiting Permission',
    enableBgNotifBtn: 'Enable Background Alerts 🔔',
    simulateInstantInviteBtn: '⚡ Simulate Instant Challenge Invite',
    testBgNotif3sBtn: '🕒 Test Background Alert (in 3s)',
    noIncomingInvitesText:
      'No incoming challenge invites right now. When a friend invites you to a room, it will appear here with a sound alert and background notification!',
    inviteFromLabel: 'Challenge invite from',
    joinRoomBtn: 'Join Room',
    clearNotificationsBtn: 'Clear Notifications',
    incomingInviteBannerTitle: '🔔 New Live Challenge Invite!',
    acceptChallengeNowBtn: '⚡ Accept Challenge & Join Now',
    laterBtn: 'Later',

    fairPlayTitle: 'Fair-Play & Anti-Cheat Integrity Score',
    fairPlayDesc: 'Instant answer lock · Sub-120ms click detection · Protected coin ledger',
    sportsmanshipProfileTitle: '🤝 Average Sportsmanship Rating',
    sportsmanshipProfileDesc:
      'Calculated from friend and opponent ratings after friendly and competitive matches',
    evaluationsCountLabel: 'ratings',
    badgeFairCompetitor: '🤝 Fair Competitor',
    badgeFastGenius: '⚡ Fast Genius',
    badgeRespectfulRival: '👑 Respectful Rival',
    badgeGreatFun: '🔥 Great Match',
    sfxAndVibrationTitle: '🔊 Sound Effects & Vibration (SFX & Haptics)',
    interactiveSfxLabel: 'Interactive Sound Effects',
    phoneVibrationLabel: 'Phone Vibration (Haptics)',
    enabledText: 'Enabled',
    disabledText: 'Muted',
    localNotifSettingsTitle: '🔔 Local Notifications for Challenge Invites',
    localNotifSettingsDesc:
      'Instant audio & system notification when a friend sends a challenge invite even in the background',
    localNotifToggleLabel: 'Local Notifications',
    systemNotifPermissionLabel: 'System & Background Notification Permission',
    soundPackTitle: '🎛️ Esports Sound Pack Selector',
    soundPackSub: 'Multi-layered synthesized audio with automatic variations',
    packCyberLabel: 'Cyber Synth Pack ⚡',
    packCyberSub: 'Fast, punchy esports synth chords',
    packRoyalLabel: 'Royal Orchestral Pack 👑',
    packRoyalSub: 'Warm, majestic harmonic bells',
    packClassicLabel: 'Classic Arcade Pack 🎮',
    packClassicSub: 'Crisp retro crystal chimes',
    activeLabel: 'Active ✓',
    sfxSoundboardTitle: '🎧 Live SFX Preview Soundboard',
    sfxSoundboardSub: 'Tap repeatedly to hear automatic variations per event',
    sfxVictory: 'Victory 🏆',
    sfxLoss: 'Defeat ⚔️',
    sfxCorrect: 'Correct ✅',
    sfxWrong: 'Wrong ❌',
    sfxForfeit: 'Forfeit 🏳️',
    botAiTitle: '🤖 Smart Bot AI Settings',
    botAiSub: 'Select Bot difficulty and competitive persona for practice modes',
    botDifficultyLabel: 'Bot Difficulty:',
    diffBeginner: 'Beginner 🌱',
    diffMedium: 'Medium ⚡',
    diffPro: 'Pro 🔥',
    diffLegendary: 'Legendary 👑',
    botPersonaLabel: 'Bot Persona:',
    personaCalm: 'Calm 😌',
    personaHasty: 'Hasty ⚡',
    personaThinker: 'Thinker 🧠',
    personaAggressive: 'Aggressive 🔥',
    supportedLanguagesTitle: '🌍 Supported Languages & Interface Direction (6 Languages)',

    friendsSearchTitle: '👥 Find Real Players by #ID & Play Together',
    friendsSearchDesc:
      '100% Real Player Environment (Zero Bots) · Share your #ID code with your friend or enter theirs to play together immediately',
    copyMyIdToShare: 'Copy Your ID to Share:',
    searchPlaceholder: 'Enter friend’s #ID (e.g. #1234567890) or username...',
    searchAndAddBtn: 'Search by ID & Add Friend',
    searchingWaitText: 'Searching player...',
    realFriendsListTitle: 'Your Real Friends List',
    noFriendsAddedTitle: 'No Friends Added Yet',
    noFriendsAddedDesc:
      'Enter your friend’s #ID code in the search box above to find their profile and challenge them in a live room!',
    playWithFriendBtn: '⚔️ Play',
    rateSportsmanshipBtn: 'Rate Sportsmanship',
    createRoomAndPlayWith: '⚔️ Create Room & Play with',
    sendBtn: 'Send',
    writeMessagePlaceholder: 'Write a message or room code...',
    selectOrSearchFriendTitle: 'Select a Friend or Search by #ID',

    exitConfirmTitle: 'Are you sure you want to leave the Arena?',
    exitConfirmSub: 'All your points and gold coins are safely saved.',
    stayInArenaBtn: 'Stay in Arena',
    backToHomeBtn: 'Back to Home',
  },

  fr: {
    arena: 'Arène',
    store: 'Boutique & Bonus',
    leaderboard: 'Tournoi & Prix',
    friends: 'Amis & Chat',
    achievements: 'Badges & Historique',
    settings: 'Paramètres',
    onlineStatus: 'En Ligne',
    offlineOnlyStatus: 'Mode Hors-Ligne',
    offlineBannerText:
      'Vous êtes hors-ligne : les modes en ligne, amis et tournoi sont suspendus. Vous pouvez jouer aux modes hors-ligne (Solo ou Local) jusqu’au retour d’Internet.',
    coins: 'Pièces d’Or',
    copyId: 'Copier ID',
    copied: 'Copié !',
    logout: 'Déconnexion',

    levelLabel: 'Niveau',
    fairPlay: 'Fair-Play',
    sportsmanship: 'Esprit Sportif',
    progressTowards: 'Progression vers',
    legendaryPeak: 'Sommet Légendaire 👑',
    monthlyPoints: 'Pts du Mois',
    rating: 'Classement',
    wins: 'Victoires',

    chooseGameModeTitle: '⚔️ Choisissez un Mode ou Créez un Salon Privé',
    matchFormatSubtitle: '3 Manches · 8 Questions/Manche · 6s par Question',
    onlineMode: 'Match En Ligne (Cocktail 🌍)',
    onlineModeDesc: 'Affrontement en direct · Compte pour le Tournoi Mensuel',
    localMode: 'Pass & Play Local 👥',
    localModeDesc: 'Deux joueurs sur le même appareil (Fonctionne hors-ligne)',
    soloMode: 'Entraînement Solo 🎯',
    soloModeDesc: 'Entraînement rapide et gain d’XP (Fonctionne hors-ligne)',
    privateRoom: 'Salon Privé (Code 4 chiffres 🏠)',
    privateRoomDesc: 'Créez un code à 4 chiffres ou rejoignez un ami avec les mêmes questions',
    requiresInternet: 'Internet Requis',
    availableOffline: '✓ Dispo Hors-Ligne',

    categoriesHeader: '📚 Catégories de Quiz (11 Catégories · 600+ Questions)',
    noRepeatActive: 'Système Anti-Répétition Actif ✓',
    featuredGoldenBadge: '🌟 Catégorie d’Or Spéciale',
    startQuranQuizBtn: 'Lancer le Quiz du Saint Coran 📖',

    privateRoomModalTitle: '🏠 Défi Salon Privé (Code 4 Chiffres)',
    privateRoomModalDesc:
      'Le code à 4 chiffres garantit exactement les mêmes questions et le même ordre pour les deux joueurs.',
    chooseRoomCategoryLabel: 'Choisir la catégorie du salon :',
    shareCodeWithFriend: 'Partagez ce code avec votre ami :',
    startMatchInRoomBtn: 'Démarrer le Match 🚀',
    createNew4DigitRoomBtn: 'Créer un Code Salon à 4 Chiffres ➕',
    orJoinFriendRoomLabel: 'Ou rejoignez le salon d’un ami avec son code :',
    joinNowBtn: 'Rejoindre',

    notifCenterTitle: '🔔 Notifications Locales & Invitations de Défi',
    notifCenterSub:
      'Alertes instantanées lors d’une invitation d’ami même lorsque l’application est en arrière-plan',
    bgNotifStatusLabel: 'Statut des notifications en arrière-plan :',
    statusGranted: 'Activées ✓',
    statusDenied: 'Bloquées',
    statusPending: 'En attente',
    enableBgNotifBtn: 'Activer Notifications 🔔',
    simulateInstantInviteBtn: '⚡ Simuler une Invitation Immédiate',
    testBgNotif3sBtn: '🕒 Tester en Arrière-Plan (dans 3s)',
    noIncomingInvitesText:
      'Aucune invitation pour le moment. Lorsqu’un ami vous invite, elle apparaîtra ici avec une alerte sonore !',
    inviteFromLabel: 'Invitation de défi de',
    joinRoomBtn: 'Rejoindre',
    clearNotificationsBtn: 'Effacer l’historique',
    incomingInviteBannerTitle: '🔔 Nouvelle Invitation de Défi !',
    acceptChallengeNowBtn: '⚡ Accepter et Rejoindre',
    laterBtn: 'Plus tard',

    fairPlayTitle: 'Indice d’Intégrité Fair-Play & Anti-Triche',
    fairPlayDesc: 'Verrouillage instantané · Détection < 120ms · Protection des pièces',
    sportsmanshipProfileTitle: '🤝 Note Moyenne d’Esprit Sportif',
    sportsmanshipProfileDesc:
      'Calculée à partir des évaluations des amis et adversaires après les matchs',
    evaluationsCountLabel: 'avis',
    badgeFairCompetitor: '🤝 Adversaire Loyal',
    badgeFastGenius: '⚡ Esprit Vif',
    badgeRespectfulRival: '👑 Grand Respect',
    badgeGreatFun: '🔥 Super Match',
    sfxAndVibrationTitle: '🔊 Effets Sonores & Vibrations',
    interactiveSfxLabel: 'Effets Sonores Interactifs',
    phoneVibrationLabel: 'Vibration du Téléphone',
    enabledText: 'Activé',
    disabledText: 'Désactivé',
    localNotifSettingsTitle: '🔔 Notifications Locales des Défis d’Amis',
    localNotifSettingsDesc:
      'Notification sonore et système lorsqu’un ami vous envoie un défi même en arrière-plan',
    localNotifToggleLabel: 'Notifications Locales',
    systemNotifPermissionLabel: 'Permission Notifications Système',
    soundPackTitle: '🎛️ Pack Audio Esports',
    soundPackSub: 'Synthèse audio multicouche avec variations automatiques',
    packCyberLabel: 'Pack Cyber ⚡',
    packCyberSub: 'Accords synthé rapides et dynamiques',
    packRoyalLabel: 'Pack Royal 👑',
    packRoyalSub: 'Cloches orchestrales chaleureuses',
    packClassicLabel: 'Pack Classique 🎮',
    packClassicSub: 'Sons d’arcade cristallins',
    activeLabel: 'Actif ✓',
    sfxSoundboardTitle: '🎧 Table d’Écoute des Effets Sonores',
    sfxSoundboardSub: 'Appuyez plusieurs fois pour écouter les variations',
    sfxVictory: 'Victoire 🏆',
    sfxLoss: 'Défaite ⚔️',
    sfxCorrect: 'Correct ✅',
    sfxWrong: 'Erreur ❌',
    sfxForfeit: 'Abandon 🏳️',
    botAiTitle: '🤖 Paramètres IA du Bot',
    botAiSub: 'Choisissez la difficulté et la personnalité du Bot en entraînement',
    botDifficultyLabel: 'Difficulté du Bot :',
    diffBeginner: 'Débutant 🌱',
    diffMedium: 'Moyen ⚡',
    diffPro: 'Pro 🔥',
    diffLegendary: 'Légendaire 👑',
    botPersonaLabel: 'Personnalité du Bot :',
    personaCalm: 'Calme 😌',
    personaHasty: 'Pressé ⚡',
    personaThinker: 'Penseur 🧠',
    personaAggressive: 'Offensif 🔥',
    supportedLanguagesTitle: '🌍 Langues Supportées (6 Langues)',

    friendsSearchTitle: '👥 Rechercher des Joueurs Réels par #ID',
    friendsSearchDesc:
      'Environnement 100% joueurs réels sans bots · Partagez votre #ID ou entrez celui de votre ami pour jouer ensemble',
    copyMyIdToShare: 'Copier votre ID :',
    searchPlaceholder: 'Entrez le code #ID de votre ami (ex: #1234567890)...',
    searchAndAddBtn: 'Rechercher par ID & Ajouter',
    searchingWaitText: 'Recherche en cours...',
    realFriendsListTitle: 'Liste de vos Amis Réels',
    noFriendsAddedTitle: 'Aucun Ami Ajouté',
    noFriendsAddedDesc:
      'Entrez le code #ID de votre ami ci-dessus pour l’ajouter et le défier en direct !',
    playWithFriendBtn: '⚔️ Jouer',
    rateSportsmanshipBtn: 'Noter Fair-Play',
    createRoomAndPlayWith: '⚔️ Créer un Salon avec',
    sendBtn: 'Envoyer',
    writeMessagePlaceholder: 'Écrivez un message ou code salon...',
    selectOrSearchFriendTitle: 'Sélectionnez un Ami ou Recherchez par #ID',

    exitConfirmTitle: 'Voulez-vous vraiment quitter l’application ?',
    exitConfirmSub: 'Tous vos points et pièces sont sauvegardés en sécurité.',
    stayInArenaBtn: 'Rester dans l’Arène',
    backToHomeBtn: 'Retour à l’Accueil',
  },

  es: {
    arena: 'Arena',
    store: 'Tienda y Premios',
    leaderboard: 'Torneo y Trofeos',
    friends: 'Amigos y Chat',
    achievements: 'Logros e Historial',
    settings: 'Ajustes',
    onlineStatus: 'En Línea',
    offlineOnlyStatus: 'Solo Sin Conexión',
    offlineBannerText:
      'Estás sin conexión: los modos online, amigos y torneo están pausados. Puedes jugar en los modos sin conexión (Práctica Solo o Local) hasta que vuelva Internet.',
    coins: 'Monedas de Oro',
    copyId: 'Copiar ID',
    copied: '¡Copiado!',
    logout: 'Cerrar Sesión',

    levelLabel: 'Nivel',
    fairPlay: 'Juego Limpio',
    sportsmanship: 'Deportividad',
    progressTowards: 'Progreso hacia',
    legendaryPeak: 'Cima Legendaria 👑',
    monthlyPoints: 'Pts del Mes',
    rating: 'Clasificación',
    wins: 'Victorias',

    chooseGameModeTitle: '⚔️ Elige Modo de Juego o Crea una Sala Privada',
    matchFormatSubtitle: '3 Rondas · 8 Preguntas/Ronda · 6s por Pregunta',
    onlineMode: 'Partida Online (Cóctel 🌍)',
    onlineModeDesc: 'Duelo competitivo en vivo · Cuenta para el Torneo Mensual',
    localMode: 'Jugar con Amigo Local 👥',
    localModeDesc: 'Dos jugadores en el mismo móvil por turnos (Funciona Offline)',
    soloMode: 'Práctica Solo Offline 🎯',
    soloModeDesc: 'Entrenamiento rápido y puntos XP (Funciona Offline)',
    privateRoom: 'Sala Privada (Código 4 dígitos 🏠)',
    privateRoomDesc: 'Crea un código de 4 dígitos o únete a un amigo con las mismas preguntas',
    requiresInternet: 'Requiere Internet',
    availableOffline: '✓ Disponible Offline',

    categoriesHeader: '📚 Categorías de Conocimiento (11 Categorías · 600+ Preguntas)',
    noRepeatActive: 'Motor Anti-Repetición Activo ✓',
    featuredGoldenBadge: '🌟 Categoría Dorada Destacada',
    startQuranQuizBtn: 'Iniciar Concurso del Sagrado Corán 📖',

    privateRoomModalTitle: '🏠 Desafío en Sala Privada (Código 4 Dígitos)',
    privateRoomModalDesc:
      'El código de 4 dígitos garantiza el 100% de las mismas preguntas y en el mismo orden para ambos jugadores.',
    chooseRoomCategoryLabel: 'Elige la categoría de la sala:',
    shareCodeWithFriend: 'Comparte este código con tu amigo:',
    startMatchInRoomBtn: 'Iniciar Partida en Sala 🚀',
    createNew4DigitRoomBtn: 'Crear Código de Sala de 4 Dígitos ➕',
    orJoinFriendRoomLabel: 'O únete a la sala de tu amigo con su código:',
    joinNowBtn: 'Unirse Ahora',

    notifCenterTitle: '🔔 Notificaciones Locales e Invitaciones',
    notifCenterSub:
      'Alertas instantáneas al recibir un desafío de un amigo incluso con la app en segundo plano',
    bgNotifStatusLabel: 'Estado de notificaciones en segundo plano:',
    statusGranted: 'Activadas ✓',
    statusDenied: 'Bloqueadas',
    statusPending: 'Pendiente',
    enableBgNotifBtn: 'Activar Notificaciones 🔔',
    simulateInstantInviteBtn: '⚡ Simular Invitación Instantánea',
    testBgNotif3sBtn: '🕒 Probar en Segundo Plano (en 3s)',
    noIncomingInvitesText:
      'No hay invitaciones pendientes. ¡Cuando un amigo te invite a una sala aparecerá aquí al instante!',
    inviteFromLabel: 'Invitación de desafío de',
    joinRoomBtn: 'Unirse a Sala',
    clearNotificationsBtn: 'Borrar Historial',
    incomingInviteBannerTitle: '🔔 ¡Nueva Invitación de Desafío!',
    acceptChallengeNowBtn: '⚡ Aceptar Desafío y Unirse',
    laterBtn: 'Más tarde',

    fairPlayTitle: 'Índice de Juego Limpio y Anti-Trampas',
    fairPlayDesc: 'Bloqueo instantáneo · Detección < 120ms · Registro protegido',
    sportsmanshipProfileTitle: '🤝 Promedio de Deportividad (Sportsmanship)',
    sportsmanshipProfileDesc:
      'Calculado según las valoraciones de amigos y rivales tras las partidas',
    evaluationsCountLabel: 'valoraciones',
    badgeFairCompetitor: '🤝 Rival Justo',
    badgeFastGenius: '⚡ Mente Rápida',
    badgeRespectfulRival: '👑 Gran Respeto',
    badgeGreatFun: '🔥 Gran Partida',
    sfxAndVibrationTitle: '🔊 Efectos de Sonido y Vibración',
    interactiveSfxLabel: 'Efectos de Sonido Interactivos',
    phoneVibrationLabel: 'Vibración del Teléfono',
    enabledText: 'Activado',
    disabledText: 'Silenciado',
    localNotifSettingsTitle: '🔔 Notificaciones Locales de Desafíos',
    localNotifSettingsDesc:
      'Aviso sonoro y del sistema cuando un amigo te envía un desafío incluso en segundo plano',
    localNotifToggleLabel: 'Notificaciones Locales',
    systemNotifPermissionLabel: 'Permiso de Notificaciones del Sistema',
    soundPackTitle: '🎛️ Paquete de Sonido Esports',
    soundPackSub: 'Audio sintetizado multicapa con variaciones automáticas',
    packCyberLabel: 'Estilo Cyber ⚡',
    packCyberSub: 'Acordes electrónicos rápidos y vibrantes',
    packRoyalLabel: 'Estilo Real 👑',
    packRoyalSub: 'Campanas orquestales cálidas',
    packClassicLabel: 'Estilo Clásico 🎮',
    packClassicSub: 'Tonos arcade cristalinos',
    activeLabel: 'Activo ✓',
    sfxSoundboardTitle: '🎧 Panel de Prueba de Sonidos en Vivo',
    sfxSoundboardSub: 'Pulsa varias veces para escuchar las variaciones automáticas',
    sfxVictory: 'Victoria 🏆',
    sfxLoss: 'Derrota ⚔️',
    sfxCorrect: 'Correcto ✅',
    sfxWrong: 'Incorrecto ❌',
    sfxForfeit: 'Abandono 🏳️',
    botAiTitle: '🤖 Ajustes de IA del Bot',
    botAiSub: 'Elige la dificultad y personalidad del Bot en entrenamiento',
    botDifficultyLabel: 'Dificultad del Bot:',
    diffBeginner: 'Principiante 🌱',
    diffMedium: 'Medio ⚡',
    diffPro: 'Pro 🔥',
    diffLegendary: 'Legendario 👑',
    botPersonaLabel: 'Personalidad del Bot:',
    personaCalm: 'Calmo 😌',
    personaHasty: 'Rápido ⚡',
    personaThinker: 'Pensador 🧠',
    personaAggressive: 'Agresivo 🔥',
    supportedLanguagesTitle: '🌍 Idiomas Soportados (6 Idiomas)',

    friendsSearchTitle: '👥 Buscar Jugadores Reales por #ID y Jugar',
    friendsSearchDesc:
      'Entorno 100% jugadores reales sin bots · Comparte tu código #ID con tu amigo o ingresa el suyo para jugar juntos',
    copyMyIdToShare: 'Copiar tu ID para compartir:',
    searchPlaceholder: 'Ingresa el código #ID de tu amigo (ej: #1234567890)...',
    searchAndAddBtn: 'Buscar por ID y Añadir',
    searchingWaitText: 'Buscando jugador...',
    realFriendsListTitle: 'Lista de Amigos Reales',
    noFriendsAddedTitle: 'Aún no hay amigos añadidos',
    noFriendsAddedDesc:
      '¡Ingresa el código #ID de tu amigo arriba para ver su nombre y retarlo en una sala en vivo!',
    playWithFriendBtn: '⚔️ Jugar',
    rateSportsmanshipBtn: 'Valorar Deportividad',
    createRoomAndPlayWith: '⚔️ Crear Sala y Jugar con',
    sendBtn: 'Enviar',
    writeMessagePlaceholder: 'Escribe un mensaje o código de sala...',
    selectOrSearchFriendTitle: 'Selecciona un Amigo o Busca por #ID',

    exitConfirmTitle: '¿Estás seguro de que deseas salir de la aplicación?',
    exitConfirmSub: 'Todos tus puntos y monedas están guardados de forma segura.',
    stayInArenaBtn: 'Seguir en la Arena',
    backToHomeBtn: 'Volver al Inicio',
  },

  tr: {
    arena: 'Arena',
    store: 'Mağaza ve Ödüller',
    leaderboard: 'Turnuva ve Ödüller',
    friends: 'Arkadaşlar ve Sohbet',
    achievements: 'Rozetler ve Geçmiş',
    settings: 'Ayarlar',
    onlineStatus: 'Çevrimiçi',
    offlineOnlyStatus: 'Sadece Çevrimdışı Mod',
    offlineBannerText:
      'Şu anda çevrimdışısınız: Online modlar, arkadaşlar ve turnuva geçici olarak duraklatıldı. İnternet gelene kadar çevrimdışı modlarda oynayabilirsiniz.',
    coins: 'Altın Para',
    copyId: 'ID Kopyala',
    copied: 'Kopyalandı!',
    logout: 'Çıkış Yap',

    levelLabel: 'Seviye',
    fairPlay: 'Adil Oyun',
    sportsmanship: 'Sportmenlik',
    progressTowards: 'İlerleme:',
    legendaryPeak: 'Efsanevi Zirve 👑',
    monthlyPoints: 'Aylık Puan',
    rating: 'Derece',
    wins: 'Galibiyet',

    chooseGameModeTitle: '⚔️ Oyun Modu Seçin veya Özel Oda Oluşturun',
    matchFormatSubtitle: '3 Tur · Tur Başına 8 Soru · Soru Başına 6 Sn',
    onlineMode: 'Online Maç (Genel Kültür 🌍)',
    onlineModeDesc: 'Canlı rekabetçi karşılaşma · Aylık Turnuvaya dahil edilir',
    localMode: 'Yanındaki Arkadaşla Oyna 👥',
    localModeDesc: 'Aynı telefonda sırayla iki oyuncu (İnternetsiz çalışır)',
    soloMode: 'Tek Başına Antrenman 🎯',
    soloModeDesc: 'Hızlı antrenman ve XP kazanımı (İnternetsiz çalışır)',
    privateRoom: 'Özel Oda (4 Haneli Kod 🏠)',
    privateRoomDesc: '4 haneli oda kodu oluşturun veya arkadaşınızla aynı sorularla yarışın',
    requiresInternet: 'İnternet Gerekir',
    availableOffline: '✓ Çevrimdışı Açık',

    categoriesHeader: '📚 Bilgi Yarışması Kategorileri (11 Kategori · 600+ Soru)',
    noRepeatActive: 'Soru Tekrar Önleme Sistemi Aktif ✓',
    featuredGoldenBadge: '🌟 Özel Altın Kategori',
    startQuranQuizBtn: 'Kur’an-ı Kerim Yarışmasını Başlat 📖',

    privateRoomModalTitle: '🏠 Özel Oda Meydan Okuması (4 Haneli Kod)',
    privateRoomModalDesc:
      '4 haneli oda kodu her iki oyuncuya da %100 aynı soruları aynı sırayla sunar.',
    chooseRoomCategoryLabel: 'Oda kategorisini seçin:',
    shareCodeWithFriend: 'Bu kodu arkadaşınızla paylaşın:',
    startMatchInRoomBtn: 'Odada Maçı Başlat 🚀',
    createNew4DigitRoomBtn: 'Yeni 4 Haneli Oda Kodu Oluştur ➕',
    orJoinFriendRoomLabel: 'Veya arkadaşınızın 4 haneli oda kodunu girin:',
    joinNowBtn: 'Şimdi Katıl',

    notifCenterTitle: '🔔 Yerel Bildirimler ve Meydan Okuma Davetleri',
    notifCenterSub:
      'Uygulama arka planda olsa bile arkadaşınızdan davet geldiğinde anında bildirim alın',
    bgNotifStatusLabel: 'Tarayıcı / Sistem Arka Plan Bildirim Durumu:',
    statusGranted: 'Tamamen Aktif ✓',
    statusDenied: 'Engellendi',
    statusPending: 'İzin Bekleniyor',
    enableBgNotifBtn: 'Arka Plan Bildirimlerini Aç 🔔',
    simulateInstantInviteBtn: '⚡ Anında Davet Simüle Et',
    testBgNotif3sBtn: '🕒 Arka Plan Bildirimini Test Et (3sn)',
    noIncomingInvitesText:
      'Şu anda gelen meydan okuma daveti yok. Arkadaşınız oda açtığında burada sesli bildirimle görünür!',
    inviteFromLabel: 'Meydan okuma daveti:',
    joinRoomBtn: 'Odaya Katıl',
    clearNotificationsBtn: 'Bildirimleri Temizle',
    incomingInviteBannerTitle: '🔔 Yeni Canlı Meydan Okuma Daveti!',
    acceptChallengeNowBtn: '⚡ Daveti Kabul Et ve Hemen Katıl',
    laterBtn: 'Daha Sonra',

    fairPlayTitle: 'Adil Oyun ve Hile Koruması (Fair-Play)',
    fairPlayDesc: 'Anında cevap kilidi · 120ms altı tıklama tespiti · Güvenli altın kaydı',
    sportsmanshipProfileTitle: '🤝 Ortalama Sportmenlik Puanı',
    sportsmanshipProfileDesc:
      'Dostluk ve rekabetçi maçlar sonrasında arkadaş ve rakiplerin değerlendirmelerinden hesaplanır',
    evaluationsCountLabel: 'değerlendirme',
    badgeFairCompetitor: '🤝 Adil Rakip',
    badgeFastGenius: '⚡ Hızlı Zeka',
    badgeRespectfulRival: '👑 Saygılı Oyuncu',
    badgeGreatFun: '🔥 Keyifli Maç',
    sfxAndVibrationTitle: '🔊 Ses Efektleri ve Titreşim',
    interactiveSfxLabel: 'Etkileşimli Ses Efektleri',
    phoneVibrationLabel: 'Telefon Titreşimi',
    enabledText: 'Açık',
    disabledText: 'Kapalı',
    localNotifSettingsTitle: '🔔 Meydan Okuma Davetleri İçin Yerel Bildirimler',
    localNotifSettingsDesc:
      'Uygulama arka planda olsa bile arkadaş davetlerinde sesli ve sistem bildirimi gönderir',
    localNotifToggleLabel: 'Yerel Bildirimler',
    systemNotifPermissionLabel: 'Sistem ve Arka Plan Bildirim İzni',
    soundPackTitle: '🎛️ Espor Ses Paketi Seçimi',
    soundPackSub: 'Her olay için otomatik varyasyonlu çok katmanlı sesler',
    packCyberLabel: 'Siber Paket ⚡',
    packCyberSub: 'Hızlı ve enerjik sentezleyici akorlar',
    packRoyalLabel: 'Kraliyet Paketi 👑',
    packRoyalSub: 'Sıcak orkestral çan tınıları',
    packClassicLabel: 'Klasik Paket 🎮',
    packClassicSub: 'Kristal netliğinde arcade tonları',
    activeLabel: 'Aktif ✓',
    sfxSoundboardTitle: '🎧 Canlı Ses Efektleri Deneme Paneli',
    sfxSoundboardSub: 'Varyasyonları duymak için tekrar tekrar dokunun',
    sfxVictory: 'Zafer 🏆',
    sfxLoss: 'Mağlubiyet ⚔️',
    sfxCorrect: 'Doğru Cevap ✅',
    sfxWrong: 'Yanlış Cevap ❌',
    sfxForfeit: 'Çekilme 🏳️',
    botAiTitle: '🤖 Yapay Zeka Bot Ayarları',
    botAiSub: 'Antrenman modları için Bot zorluğunu ve karakterini seçin',
    botDifficultyLabel: 'Bot Zorluk Seviyesi:',
    diffBeginner: 'Başlangıç 🌱',
    diffMedium: 'Orta ⚡',
    diffPro: 'Profesyonel 🔥',
    diffLegendary: 'Efsanevi 👑',
    botPersonaLabel: 'Bot Karakteri:',
    personaCalm: 'Sakin 😌',
    personaHasty: 'Aceleci ⚡',
    personaThinker: 'Düşünen 🧠',
    personaAggressive: 'Baskıcı 🔥',
    supportedLanguagesTitle: '🌍 Desteklenen Diller (6 Dil)',

    friendsSearchTitle: '👥 #ID ile Gerçek Oyuncuları Bul ve Birlikte Oyna',
    friendsSearchDesc:
      '%100 Gerçek Oyuncu Ortamı (Bot Yok) · Arkadaşınızla #ID kodunuzu paylaşın veya onunkini girip hemen birlikte oynayın',
    copyMyIdToShare: 'Paylaşmak İçin ID Kopyala:',
    searchPlaceholder: 'Arkadaşınızın #ID kodunu girin (Örn: #1234567890)...',
    searchAndAddBtn: 'ID ile Ara ve Arkadaş Ekle',
    searchingWaitText: 'Oyuncu aranıyor...',
    realFriendsListTitle: 'Gerçek Arkadaş Listeniz',
    noFriendsAddedTitle: 'Henüz Arkadaş Eklenmedi',
    noFriendsAddedDesc:
      'Arkadaşınızın #ID kodunu yukarıdaki arama kutusuna girerek adını görün ve canlı odada meydan okuyun!',
    playWithFriendBtn: '⚔️ Oyna',
    rateSportsmanshipBtn: 'Sportmenlik Puanla',
    createRoomAndPlayWith: '⚔️ Oda Kur ve Oyna:',
    sendBtn: 'Gönder',
    writeMessagePlaceholder: 'Bir mesaj veya oda kodu yazın...',
    selectOrSearchFriendTitle: 'Bir Arkadaş Seçin veya #ID ile Arayın',

    exitConfirmTitle: 'Uygulamadan çıkmak istediğinize emin misiniz?',
    exitConfirmSub: 'Tüm puanlarınız ve altınlarınız güvenle kaydedildi.',
    stayInArenaBtn: 'Arenada Kal',
    backToHomeBtn: 'Ana Sayfaya Dön',
  },

  ur: {
    arena: 'میدان',
    store: 'اسٹور اور انعامات',
    leaderboard: 'ٹورنامنٹ اور انعامات',
    friends: 'دوست اور چیٹ',
    achievements: 'تمغے اور ریکارڈ',
    settings: 'ترتیبات',
    onlineStatus: 'آن لائن',
    offlineOnlyStatus: 'صرف آف لائن موڈ',
    offlineBannerText:
      'آپ اس وقت آف لائن ہیں: آن لائن موڈز، دوست اور ٹورنامنٹ عارضی طور پر بند ہیں۔ انٹرنیٹ بحال ہونے تک آپ آف لائن موڈز کھیل سکتے ہیں۔',
    coins: 'سونے کے سکے',
    copyId: 'آئی ڈی کاپی کریں',
    copied: 'کاپی ہو گیا!',
    logout: 'لاگ آؤٹ',

    levelLabel: 'لیول',
    fairPlay: 'منصفانہ کھیل',
    sportsmanship: 'اسپورٹس مین شپ',
    progressTowards: 'اگلے درجے کی طرف پیش رفت',
    legendaryPeak: 'لیجنڈری چوٹی 👑',
    monthlyPoints: 'ماہانہ پوائنٹس',
    rating: 'ریٹنگ',
    wins: 'کامیابیاں',

    chooseGameModeTitle: '⚔️ گیم موڈ منتخب کریں یا نجی کمرہ بنائیں',
    matchFormatSubtitle: '3 راؤنڈز · ہر راؤنڈ میں 8 سوالات · ہر سوال کے لیے 6 سیکنڈ',
    onlineMode: 'آن لائن مقابلہ (مجموعی کوئز 🌍)',
    onlineModeDesc: 'براہ راست مقابلہ · ماہانہ ٹورنامنٹ میں شامل ہوتا ہے',
    localMode: 'دوست کے ساتھ کھیلیں 👥',
    localModeDesc: 'ایک ہی موبائل پر دو کھلاڑی باری باری (بغیر انٹرنیٹ چلتا ہے)',
    soloMode: 'آف لائن مشق 🎯',
    soloModeDesc: 'تیز مشق اور XP پوائنٹس حاصل کریں (بغیر انٹرنیٹ چلتا ہے)',
    privateRoom: 'نجی کمرہ (4 ہندسوں کا کوڈ 🏠)',
    privateRoomDesc: '4 ہندسوں کا کوڈ بنائیں یا دوست کے ساتھ یکساں سوالات میں مقابلہ کریں',
    requiresInternet: 'انٹرنیٹ درکار ہے',
    availableOffline: '✓ آف لائن دستیاب ہے',

    categoriesHeader: '📚 علمی مقابلوں کے شعبے (11 شعبے · 600 سے زائد سوالات)',
    noRepeatActive: 'سوالات کی تکرار روکنے کا نظام فعال ہے ✓',
    featuredGoldenBadge: '🌟 خصوصی سنہری شعبہ',
    startQuranQuizBtn: 'قرآن کریم کوئز شروع کریں 📖',

    privateRoomModalTitle: '🏠 نجی کمرے کا چیلنج (4 ہندسوں کا کوڈ)',
    privateRoomModalDesc:
      '4 ہندسوں کا کوڈ دونوں کھلاڑیوں کے لیے 100% ایک جیسے سوالات اور ترتیب کی ضمانت دیتا ہے۔',
    chooseRoomCategoryLabel: 'کمرے کے سوالات کا شعبہ منتخب کریں:',
    shareCodeWithFriend: 'یہ کوڈ اپنے دوست کے ساتھ شیئر کریں:',
    startMatchInRoomBtn: 'کمرے میں مقابلہ شروع کریں 🚀',
    createNew4DigitRoomBtn: 'نیا 4 ہندسوں کا کوڈ بنائیں ➕',
    orJoinFriendRoomLabel: 'یا کوڈ درج کر کے دوست کے کمرے میں شامل ہوں:',
    joinNowBtn: 'ابھی شامل ہوں',

    notifCenterTitle: '🔔 مقامی اطلاعات اور چیلنج دعوت نامے',
    notifCenterSub:
      'دوست کی طرف سے چیلنج ملنے پر فوری اطلاع، چاہے ایپ بیک گراؤنڈ میں ہی کیوں نہ ہو',
    bgNotifStatusLabel: 'بیک گراؤنڈ اطلاعات کی صورتحال:',
    statusGranted: 'مکمل طور پر فعال ✓',
    statusDenied: 'بلاک ہے',
    statusPending: 'اجازت کا انتظار',
    enableBgNotifBtn: 'بیک گراؤنڈ اطلاعات فعال کریں 🔔',
    simulateInstantInviteBtn: '⚡ فوری چیلنج اطلاع کا تجربہ کریں',
    testBgNotif3sBtn: '🕒 بیک گراؤنڈ اطلاع کا تجربہ (3 سیکنڈ بعد)',
    noIncomingInvitesText:
      'اس وقت کوئی چیلنج دعوت نامہ موجود نہیں۔ جب آپ کا دوست کمرہ بنائے گا تو یہاں فوری اطلاع ملے گی!',
    inviteFromLabel: 'چیلنج دعوت منجانب',
    joinRoomBtn: 'کمرے میں شامل ہوں',
    clearNotificationsBtn: 'اطلاعات صاف کریں',
    incomingInviteBannerTitle: '🔔 نیا براہ راست چیلنج دعوت نامہ!',
    acceptChallengeNowBtn: '⚡ چیلنج قبول کریں اور شامل ہوں',
    laterBtn: 'بعد میں',

    fairPlayTitle: 'منصفانہ کھیل اور اینٹی چیٹ انڈیکس',
    fairPlayDesc: 'فوری جواب لاک · 120ms سے کم کلک کی شناخت · محفوظ ریکارڈ',
    sportsmanshipProfileTitle: '🤝 اوسط اسپورٹس مین شپ ریٹنگ',
    sportsmanshipProfileDesc:
      'دوستانہ اور مسابقتی مقابلوں کے بعد دوستوں اور حریفوں کی درجہ بندی سے شمار کیا جاتا ہے',
    evaluationsCountLabel: 'جائزے',
    badgeFairCompetitor: '🤝 باوقار حریف',
    badgeFastGenius: '⚡ تیز ذہن',
    badgeRespectfulRival: '👑 اعلیٰ اخلاق',
    badgeGreatFun: '🔥 شاندار مقابلہ',
    sfxAndVibrationTitle: '🔊 صوتی اثرات اور وائبریشن',
    interactiveSfxLabel: 'انٹرایکٹو صوتی اثرات',
    phoneVibrationLabel: 'موبائل وائبریشن',
    enabledText: 'فعال',
    disabledText: 'بند',
    localNotifSettingsTitle: '🔔 چیلنج دعوتوں کے لیے مقامی اطلاعات (Local Notifications)',
    localNotifSettingsDesc:
      'جب کوئی نیا دوست چیلنج بھیجے تو ایپ بیک گراؤنڈ میں ہونے پر بھی فوری اطلاع حاصل کریں',
    localNotifToggleLabel: 'مقامی اطلاعات',
    systemNotifPermissionLabel: 'سسٹم اور بیک گراؤنڈ اطلاعات کی اجازت',
    soundPackTitle: '🎛️ ای اسپورٹس ساؤنڈ پیک منتخب کریں',
    soundPackSub: 'ہر موقع کے لیے خودکار تنوع کے ساتھ ملٹی لیئر آوازیں',
    packCyberLabel: 'سائبر انداز ⚡',
    packCyberSub: 'تیز اور جاندار سنتھ دھنیں',
    packRoyalLabel: 'شاہی انداز 👑',
    packRoyalSub: 'پروقار آرکسٹرل گھنٹیاں',
    packClassicLabel: 'کلاسک انداز 🎮',
    packClassicSub: 'کرسٹل آرکیڈ دھنیں',
    activeLabel: 'فعال ✓',
    sfxSoundboardTitle: '🎧 صوتی اثرات کا براہ راست تجربہ',
    sfxSoundboardSub: 'مختلف آوازیں سننے کے لیے بار بار دبائیں',
    sfxVictory: 'فتح 🏆',
    sfxLoss: 'شکست ⚔️',
    sfxCorrect: 'درست جواب ✅',
    sfxWrong: 'غلط جواب ❌',
    sfxForfeit: 'دستبرداری 🏳️',
    botAiTitle: '🤖 اسمارٹ بوٹ کی ترتیبات',
    botAiSub: 'مشق کے لیے بوٹ کی مشکل کی سطح اور انداز منتخب کریں',
    botDifficultyLabel: 'بوٹ کی مشکل کی سطح:',
    diffBeginner: 'ابتدائی 🌱',
    diffMedium: 'درمیانہ ⚡',
    diffPro: 'ماہر 🔥',
    diffLegendary: 'لیجنڈری 👑',
    botPersonaLabel: 'بوٹ کا انداز:',
    personaCalm: 'پرسکون 😌',
    personaHasty: 'جلد باز ⚡',
    personaThinker: 'مفکر 🧠',
    personaAggressive: 'جارحانہ 🔥',
    supportedLanguagesTitle: '🌍 دستیاب زبانیں (6 زبانیں)',

    friendsSearchTitle: '👥 #ID کے ذریعے حقیقی کھلاڑیوں کو تلاش کریں اور کھیلیں',
    friendsSearchDesc:
      '100% حقیقی کھلاڑیوں کا ماحول (بغیر بوٹس) · اپنا #ID کوڈ دوست کو دیں یا اس کا کوڈ درج کر کے فوراً ساتھ کھیلیں',
    copyMyIdToShare: 'شیئر کرنے کے لیے اپنی آئی ڈی کاپی کریں:',
    searchPlaceholder: 'اپنے دوست کا #ID کوڈ درج کریں (مثال: #1234567890)...',
    searchAndAddBtn: 'آئی ڈی سے تلاش اور شامل کریں',
    searchingWaitText: 'تلاش جاری ہے...',
    realFriendsListTitle: 'آپ کے حقیقی دوستوں کی فہرست',
    noFriendsAddedTitle: 'ابھی تک کوئی دوست شامل نہیں کیا گیا',
    noFriendsAddedDesc:
      'اوپر سرچ باکس میں اپنے دوست کا #ID کوڈ درج کریں تاکہ اس کا نام ظاہر ہو اور آپ براہ راست کھیل سکیں!',
    playWithFriendBtn: '⚔️ کھیلیں',
    rateSportsmanshipBtn: 'اسپورٹس مین شپ ریٹنگ',
    createRoomAndPlayWith: '⚔️ کمرہ بنائیں اور کھیلیں ہمراہ',
    sendBtn: 'بھیجیں',
    writeMessagePlaceholder: 'پیغام یا کمرے کا کوڈ لکھیں...',
    selectOrSearchFriendTitle: 'دوست منتخب کریں یا #ID سے تلاش کریں',

    exitConfirmTitle: 'کیا آپ واقعی ایپ سے باہر نکلنا چاہتے ہیں؟',
    exitConfirmSub: 'آپ کے تمام پوائنٹس اور سکے محفوظ ہیں۔',
    stayInArenaBtn: 'میدان میں رہیں',
    backToHomeBtn: 'مرکزی صفحے پر واپس',
  },
};

const CATEGORY_TRANSLATIONS: Record<
  CategoryId,
  Record<LanguageCode, { name: string; desc: string }>
> = {
  quran: {
    ar: {
      name: 'مسابقة القرآن الكريم',
      desc: 'سور، آيات، أحكام وتدبر في كتاب الله العزيز',
    },
    en: {
      name: 'Holy Quran Quiz',
      desc: 'Surahs, verses, Tajweed rules, and reflections on the Holy Quran',
    },
    fr: {
      name: 'Quiz du Saint Coran',
      desc: 'Sourates, versets, règles et méditation du Saint Coran',
    },
    es: {
      name: 'Concurso del Sagrado Corán',
      desc: 'Suras, aleyas, reglas y reflexión sobre el Sagrado Corán',
    },
    tr: {
      name: 'Kur’an-ı Kerim Yarışması',
      desc: 'Sureler, ayetler, tecvid kuralları ve Kur’an bilgisi',
    },
    ur: {
      name: 'قرآن کریم کوئز',
      desc: 'سورتیں، آیات، تجوید کے احکام اور تدبرِ قرآن',
    },
  },
  islamic: {
    ar: {
      name: 'إسلاميات',
      desc: 'السيرة النبوية، الصحابة، الفقه والتاريخ الإسلامي',
    },
    en: {
      name: 'Islamic Studies',
      desc: 'Prophetic biography, Companions, Fiqh, and Islamic civilization',
    },
    fr: {
      name: 'Études Islamiques',
      desc: 'Biographie du Prophète, Compagnons, Fiqh et histoire islamique',
    },
    es: {
      name: 'Estudios Islámicos',
      desc: 'Biografía del Profeta, Compañeros, Fiqh e historia islámica',
    },
    tr: {
      name: 'İslami İlimler',
      desc: 'Siyer-i Nebi, Sahabe hayatı, Fıkıh ve İslam tarihi',
    },
    ur: {
      name: 'اسلامیات',
      desc: 'سیرت النبی ﷺ، صحابہ کرام، فقہ اور اسلامی تاریخ',
    },
  },
  arabic: {
    ar: {
      name: 'اللغة العربية',
      desc: 'النحو، البلاغة، الشعر، ومعاني المفردات',
    },
    en: {
      name: 'Arabic Language',
      desc: 'Grammar, rhetoric, classic poetry, and vocabulary meanings',
    },
    fr: {
      name: 'Langue Arabe',
      desc: 'Grammaire, éloquence, poésie et richesse du vocabulaire',
    },
    es: {
      name: 'Lengua Árabe',
      desc: 'Gramática, retórica, poesía clásica y vocabulario',
    },
    tr: {
      name: 'Arap Dili ve Edebiyatı',
      desc: 'Nahiv, belagat, şiir ve kelime anlamları',
    },
    ur: {
      name: 'عربی زبان و ادب',
      desc: 'نحو، بلاغت، شاعری اور الفاظ کے معانی',
    },
  },
  science: {
    ar: {
      name: 'العلوم',
      desc: 'الأحياء، الكيمياء، الفلك وجسم الإنسان',
    },
    en: {
      name: 'General Science',
      desc: 'Biology, chemistry, astronomy, and the human body',
    },
    fr: {
      name: 'Sciences Générales',
      desc: 'Biologie, chimie, astronomie et corps humain',
    },
    es: {
      name: 'Ciencias Generales',
      desc: 'Biología, química, astronomía y el cuerpo humano',
    },
    tr: {
      name: 'Genel Bilim',
      desc: 'Biyoloji, kimya, astronomi ve insan vücudu',
    },
    ur: {
      name: 'جنرل سائنس',
      desc: 'حیاتیات، کیمسٹری، فلکیات اور انسانی جسم',
    },
  },
  history: {
    ar: {
      name: 'التاريخ',
      desc: 'الحضارات القديمة، المعارك، والأحداث التاريخية',
    },
    en: {
      name: 'World History',
      desc: 'Ancient civilizations, decisive battles, and historical milestones',
    },
    fr: {
      name: 'Histoire du Monde',
      desc: 'Civilisations anciennes, grandes batailles et événements historiques',
    },
    es: {
      name: 'Historia Universal',
      desc: 'Civilizaciones antiguas, batallas y grandes hitos históricos',
    },
    tr: {
      name: 'Dünya Tarihi',
      desc: 'Eski uygarlıklar, meydan savaşları ve tarihi olaylar',
    },
    ur: {
      name: 'عالمی تاریخ',
      desc: 'قدیم تہذیبیں، مشہور معرکے اور تاریخی واقعات',
    },
  },
  geography: {
    ar: {
      name: 'الجغرافيا',
      desc: 'القارات، الأنهار، الجبال، والمضايق العالمية',
    },
    en: {
      name: 'Geography',
      desc: 'Continents, rivers, mountain peaks, and world straits',
    },
    fr: {
      name: 'Géographie',
      desc: 'Continents, fleuves, montagnes et détroits du monde',
    },
    es: {
      name: 'Geografía',
      desc: 'Continentes, ríos, montañas y estrechos del mundo',
    },
    tr: {
      name: 'Coğrafya',
      desc: 'Kıtalar, nehirler, dağlar ve dünya boğazları',
    },
    ur: {
      name: 'جغرافیہ',
      desc: 'براعظم، دریا، پہاڑ اور عالمی آبنائے',
    },
  },
  capitals: {
    ar: {
      name: 'بلدان وعواصم',
      desc: 'عواصم الدول، العملات، والأعلام الدولية',
    },
    en: {
      name: 'Countries & Capitals',
      desc: 'World capitals, national currencies, and international flags',
    },
    fr: {
      name: 'Pays & Capitales',
      desc: 'Capitales mondiales, devises et drapeaux internationaux',
    },
    es: {
      name: 'Países y Capitales',
      desc: 'Capitales del mundo, monedas y banderas internacionales',
    },
    tr: {
      name: 'Ülkeler ve Başkentler',
      desc: 'Dünya başkentleri, para birimleri ve bayraklar',
    },
    ur: {
      name: 'ممالک اور دارالحکومت',
      desc: 'ممالک کے دارالحکومت، کرنسیاں اور پرچم',
    },
  },
  math: {
    ar: {
      name: 'الرياضيات',
      desc: 'الحساب الذهني السريع، الجبر، والهندسة',
    },
    en: {
      name: 'Mathematics',
      desc: 'Fast mental arithmetic, algebra, and geometry challenges',
    },
    fr: {
      name: 'Mathématiques',
      desc: 'Calcul mental rapide, algèbre et géométrie',
    },
    es: {
      name: 'Matemáticas',
      desc: 'Cálculo mental rápido, álgebra y geometría',
    },
    tr: {
      name: 'Matematik',
      desc: 'Hızlı zihinden işlem, cebir ve geometri',
    },
    ur: {
      name: 'ریاضی',
      desc: 'تیز ذہنی حساب، الجبرا اور جیومیٹری',
    },
  },
  physics: {
    ar: {
      name: 'الفيزياء',
      desc: 'القوانين الفيزيائية، الطاقة، الحركة والكهرباء',
    },
    en: {
      name: 'Physics',
      desc: 'Physical laws, energy, motion, optics, and electricity',
    },
    fr: {
      name: 'Physique',
      desc: 'Lois physiques, énergie, mouvement et électricité',
    },
    es: {
      name: 'Física',
      desc: 'Leyes físicas, energía, movimiento y electricidad',
    },
    tr: {
      name: 'Fizik',
      desc: 'Fizik yasaları, enerji, hareket ve elektrik',
    },
    ur: {
      name: 'طبیعیات (فزکس)',
      desc: 'طبیعی قوانین، توانائی، حرکت اور برق',
    },
  },
  sports: {
    ar: {
      name: 'الرياضة',
      desc: 'كرة القدم العربية والعالمية، كأس العالم، والألعاب الأولمبية',
    },
    en: {
      name: 'Sports & Football',
      desc: 'Global & Arab football, World Cup history, and Olympic Games',
    },
    fr: {
      name: 'Sports & Football',
      desc: 'Football mondial et arabe, Coupe du Monde et Jeux Olympiques',
    },
    es: {
      name: 'Deportes y Fútbol',
      desc: 'Fútbol mundial y árabe, Copa del Mundo y Juegos Olímpicos',
    },
    tr: {
      name: 'Spor ve Futbol',
      desc: 'Dünya ve Arap futbolu, Dünya Kupası ve Olimpiyat Oyunları',
    },
    ur: {
      name: 'کھیل اور فٹ بال',
      desc: 'عالمی و عرب فٹ بال، ورلڈ کپ اور اولمپک مقابلے',
    },
  },
  cocktail: {
    ar: {
      name: 'كوكتيل شامل',
      desc: 'تحدي متنوع يجمع كافة الأقسام المعرفية',
    },
    en: {
      name: 'All-in-One Cocktail',
      desc: 'Diverse challenge combining all knowledge categories',
    },
    fr: {
      name: 'Cocktail Général',
      desc: 'Défi varié réunissant toutes les catégories de connaissances',
    },
    es: {
      name: 'Cóctel General',
      desc: 'Desafío variado que combina todas las categorías',
    },
    tr: {
      name: 'Genel Kültür Kokteyli',
      desc: 'Tüm bilgi kategorilerini birleştiren karma yarışma',
    },
    ur: {
      name: 'مجموعی کوئز (کاک ٹیل)',
      desc: 'تمام علمی شعبوں پر مشتمل متنوع مقابلہ',
    },
  },
};

export function getTranslations(lang: LanguageCode): LocalizedStrings {
  return FULL_TRANSLATIONS[lang] || FULL_TRANSLATIONS.ar;
}

export function getLocalizedCategory(
  cat: CategoryDefinition,
  lang: LanguageCode
): { name: string; desc: string } {
  const entry = CATEGORY_TRANSLATIONS[cat.id]?.[lang];
  if (entry) return entry;
  return {
    name: lang === 'ar' || lang === 'ur' ? cat.nameAr : cat.nameEn,
    desc: cat.descAr,
  };
}

export function getLocalizedRankTitle(
  rank: RankTierInfo,
  lang: LanguageCode
): string {
  if (lang === 'ar' || lang === 'ur') return rank.titleAr;
  return rank.titleEn;
}

export interface ViewTranslations {
  // Leaderboard
  tournamentTopBadge: string;
  tournamentTitle: string;
  tournamentSubtitle: string;
  daysLabel: string;
  hoursLabel: string;
  minutesLabel: string;
  secondsLabel: string;
  top5PrizesHeader: string;
  currentLeaderLabel: string;
  liveStandingsTitle: string;
  liveStandingsSub: string;
  yourPointsLabel: string;
  liveRefreshBtn: string;
  youTag: string;
  ratingTag: string;
  prizeCandidateTag: string;
  pointsUnit: string;
  monthlyPointsSub: string;

  // Store & Rewards
  storeBannerTitle: string;
  storeBannerSub: string;
  currentBalanceLabel: string;
  lifelinesSectionTitle: string;
  youOwnLabel: string;
  buy1UnitBtn: string;
  buy5PackBtn: string;
  fiftyFiftyTitle: string;
  fiftyFiftyDesc: string;
  freezeTimeTitle: string;
  freezeTimeDesc: string;
  autoSolveTitle: string;
  autoSolveDesc: string;
  spinWheelTitle: string;
  spinWheelSub: string;
  freeSpinTodayBtn: string;
  freeSpinUsedBtn: string;
  extraSpinBtn: string;
  dailyBossTitle: string;
  dailyBossDesc: string;
  dailyBossDoneBtn: string;
  dailyBossStartBtn: string;
  dailyLoginStreakTitle: string;
  dailyLoginStreakDesc: string;
  claimRewardBtn: string;
  claimedTodayBtn: string;
  rewardAdTitle: string;
  rewardAdDesc: string;
  dailyLimitReachedBtn: string;
  watchAdBtn: string;
  shareGameTitle: string;
  shareGameDesc: string;
  sharedTodayBtn: string;
  shareNowBtn: string;
  dailyMissionsTitle: string;
  missionOnlineWins: string;
  missionCorrectAnswers: string;
  missionQuranCorrect: string;
  inProgressBtn: string;
  vipPackagesTitle: string;
  activePackageBadge: string;
  activateWithCoinsBtn: string;
  instantTrialBtn: string;
  economyLedgerTitle: string;
  balanceLabel: string;

  // Achievements & History
  analyticsChartTitle: string;
  analyticsChartSub: string;
  previewBadge: string;
  recentMatchesTab: string;
  byCategoriesTab: string;
  areaChartTab: string;
  barChartTab: string;
  totalWinsCard: string;
  totalLossesCard: string;
  winRateCard: string;
  maxComboCard: string;
  winsSeriesName: string;
  lossesSeriesName: string;
  achievementsHeader: string;
  achievementsSub: string;
  unlockedCountLabel: string;
  completedBadgeText: string;
  matchHistoryHeader: string;
  totalMatchesLabel: string;
  noMatchesYetText: string;
  againstLabel: string;
  victoryText: string;
  defeatText: string;
  forfeitWinText: string;
  forfeitLossText: string;
  roundsWord: string;
  pointsWord: string;
  yourRatingBadge: string;

  // Match Arena
  searchingOpponentText: string;
  cancelSearchBtn: string;
  startingInSec: string;
  roundBreakBadge: string;
  roundEndedTitle: string;
  roundBreakRuleDesc: string;
  secondsRemaining: string;
  readyForNextRound: string;
  waitingYourApproval: string;
  preparingText: string;
  confirmReadyBtn: string;
  forfeitMatchBtn: string;
  crushingVictoryTitle: string;
  matchOverGoodLuckTitle: string;
  totalPointsLabel: string;
  tournamentPointsLabel: string;
  goldCoinsLabel: string;
  xpPointsLabel: string;
  postMatchRatingTitle: string;
  postMatchRatingSub: string;
  ratingRecordedBadge: string;
  submitSportsmanshipBtn: string;
  saveAndReturnBtn: string;
  yourTurnBanner: string;
  player2TurnBanner: string;
  opponentTurnBanner: string;
  goldenQuestionBadge: string;
  standardQuestionBadge: string;
  confirmForfeitModalTitle: string;
  confirmForfeitModalDesc: string;
  continuePlayingBtn: string;
}

export const VIEW_TRANSLATIONS: Record<LanguageCode, ViewTranslations> = {
  ar: {
    tournamentTopBadge: '🏆 البطولة الشهرية الكبرى · جوائز حقيقية لأول 5 مراكز',
    tournamentTitle: 'العد التنازلي لنهاية بطولة الشهر الحالي',
    tournamentSubtitle: 'تُحتسب النقاط من مباريات الطور الأونلاين · لوحة المتصدرين خالية تماماً من البوتات',
    daysLabel: 'يوم',
    hoursLabel: 'ساعة',
    minutesLabel: 'دقيقة',
    secondsLabel: 'ثانية',
    top5PrizesHeader: '🎁 جوائز المراكز الخمسة الأولى في نهاية الشهر',
    currentLeaderLabel: 'المتصدر حالياً:',
    liveStandingsTitle: '📊 ترتيب متصدري البطولة الشهرية (تحديث حي للمراكز الخمسة الأولى)',
    liveStandingsSub: 'يتحدث ترتيب المراكز الـ 5 الأولى لحظياً مع انتهاء المباريات الجارية في الساحة',
    yourPointsLabel: 'نقاطك:',
    liveRefreshBtn: 'تحديث حي للترتيب ⚡',
    youTag: '(أنت)',
    ratingTag: 'التصنيف',
    prizeCandidateTag: 'مرشح لجائزة',
    pointsUnit: 'نقطة',
    monthlyPointsSub: 'نقاط الشهر',

    storeBannerTitle: 'متجر المساعدات والمكافآت',
    storeBannerSub: 'احصل على وسائل المساعدة والمكافآت اليومية لتعزيز فرص فوزك في الساحة',
    currentBalanceLabel: 'رصيدك الحالي',
    lifelinesSectionTitle: '1. متجر وسائل المساعدة داخل المباراة (خصم 10% لباقة 5 حبات)',
    youOwnLabel: 'لديك:',
    buy1UnitBtn: 'شراء 1 حبة',
    buy5PackBtn: 'باقة 5 حبات (خصم 10%)',
    fiftyFiftyTitle: 'حذف إجابتين (50:50)',
    fiftyFiftyDesc: 'يحذف خيارين خاطئين فوراً من السؤال',
    freezeTimeTitle: 'تجميد الوقت (+5 ثوانٍ)',
    freezeTimeDesc: 'يمنحك 5 ثوانٍ إضافية للتفكير في السؤال',
    autoSolveTitle: 'حل فوري للسؤال',
    autoSolveDesc: 'يختار الإجابة الصحيحة تلقائياً وبأقصى سرعة',
    spinWheelTitle: '🎡 عجلة الحظ اليومية',
    spinWheelSub: 'لفة واحدة مجانية يومياً · الجائزة الكبرى 60 🪙 أو مساعدات مجانية',
    freeSpinTodayBtn: 'لفة مجانية اليوم 🎁',
    freeSpinUsedBtn: 'تم استخدام المجانية ✓',
    extraSpinBtn: 'لفة إضافية (250 🪙)',
    dailyBossTitle: '🔥 سؤال اليوم النادر',
    dailyBossDesc: 'سؤال واحد خاص يومياً بمهلة 5 ثوانٍ فقط يمنح +20 عملة ذهبية!',
    dailyBossDoneBtn: 'تم التحدي اليوم ✓',
    dailyBossStartBtn: 'ابدأ التحدي (+20 🪙)',
    dailyLoginStreakTitle: '🎁 مكافأة الدخول اليومي',
    dailyLoginStreakDesc: 'تزداد المكافأة مع أيام الدخول المتتالية وتتضاعف لمشتركي VIP',
    claimRewardBtn: 'استلام المكافأة',
    claimedTodayBtn: 'تم الاستلام اليوم ✓',
    rewardAdTitle: '📺 إعلان مكافأة سريع',
    rewardAdDesc: 'كل إعلان يمنحك +30 عملة ذهبية بعد عداد 5 ثوانٍ',
    dailyLimitReachedBtn: 'اكتمل الحد اليومي',
    watchAdBtn: 'مشاهدة (+30 🪙)',
    shareGameTitle: '📤 مشاركة اللعبة مع الأصدقاء',
    shareGameDesc: 'شارك اللعبة ومعرّفك الخاص واكسب +25 عملة مرة واحدة يومياً',
    sharedTodayBtn: 'تمت المشاركة ✓',
    shareNowBtn: 'مشاركة (+25 🪙)',
    dailyMissionsTitle: '🎯 المهام اليومية (كل مهمة تمنح +20 عملة ذهبية)',
    missionOnlineWins: 'الفوز في 3 مباريات أونلاين',
    missionCorrectAnswers: 'الإجابة على 15 سؤالاً صحيحاً',
    missionQuranCorrect: '5 إجابات صحيحة في قسم القرآن 📖',
    inProgressBtn: 'قيد الإنجاز',
    vipPackagesTitle: '👑 باقات اشتراك VIP الملكية (4 باقات)',
    activePackageBadge: '✓ باقتك المفعلة حالياً',
    activateWithCoinsBtn: 'تفعيل بالعملات',
    instantTrialBtn: 'تفعيل فوري للتجربة',
    economyLedgerTitle: 'سجل العمليات والرصيد',
    balanceLabel: 'الرصيد:',

    analyticsChartTitle: 'إحصائيات الأداء والمباريات',
    analyticsChartSub: 'تحليل تفاعلي لسجل انتصاراتك وخسائرك حسب التسلسل الزمني للمباريات أو الأقسام المعرفية',
    previewBadge: 'معاينة توضيحية · يتحدث تلقائياً بعد أول مباراة',
    recentMatchesTab: '📈 آخر المباريات',
    byCategoriesTab: '📚 حسب الأقسام',
    areaChartTab: 'مساحي متدرج',
    barChartTab: 'أعمدة مزدوجة',
    totalWinsCard: 'إجمالي الانتصارات',
    totalLossesCard: 'إجمالي الخسائر',
    winRateCard: 'نسبة الفوز',
    maxComboCard: 'أعلى سلسلة كومبو',
    winsSeriesName: 'الانتصارات',
    lossesSeriesName: 'الخسائر',
    achievementsHeader: 'أوسمة البطولة والإنجازات (8 أوسمة)',
    achievementsSub: 'كل وسام يمنحك +15 عملة ذهبية 🪙 وإشعاراً احتفالياً فور تحقيقه',
    unlockedCountLabel: 'المفتوحة:',
    completedBadgeText: '✓ مكتمل (+15 🪙)',
    matchHistoryHeader: 'سجل آخر 50 مباراة',
    totalMatchesLabel: 'إجمالي المباريات:',
    noMatchesYetText: 'لم تخض أي مباراة بعد. ابدأ أول مواجهة لك في الساحة لتظهر نتائجك هنا!',
    againstLabel: 'ضد',
    victoryText: 'انتصار',
    defeatText: 'خسارة',
    forfeitWinText: 'فوز بالانسحاب',
    forfeitLossText: 'خسارة بالانسحاب',
    roundsWord: 'الجولات',
    pointsWord: 'النقاط',
    yourRatingBadge: '🤝 تقييمك:',

    searchingOpponentText: 'جاري البحث عن منافس في الساحة الأونلاين...',
    cancelSearchBtn: 'إلغاء البحث والعودة',
    startingInSec: 'انطلاق خلال',
    roundBreakBadge: 'استراحة بين الجولات · قانون اللعب النظيف',
    roundEndedTitle: 'انتهت الجولة',
    roundBreakRuleDesc: 'يجب أن يضغط الطرفان على موافق لبدء الجولة التالية خلال 30 ثانية، ومن يتأخر يُعتبر منسحباً فوراً.',
    secondsRemaining: 'ثانية متبقية',
    readyForNextRound: '✓ جاهز للجولة التالية',
    waitingYourApproval: '⏳ بانتظار موافقتك',
    preparingText: '⏳ يستعد...',
    confirmReadyBtn: 'موافق لبدء الجولة التالية 🚀',
    forfeitMatchBtn: 'انسحاب من المباراة 🏳️',
    crushingVictoryTitle: 'انتصار ساحق في الساحة!',
    matchOverGoodLuckTitle: 'انتهت المباراة · حظاً أوفر في الجولة القادمة',
    totalPointsLabel: 'مجموع النقاط',
    tournamentPointsLabel: 'نقاط البطولة',
    goldCoinsLabel: 'العملات الذهبية',
    xpPointsLabel: 'نقاط الخبرة XP',
    postMatchRatingTitle: '🤝 تقييم ما بعد المباراة (روح رياضية)',
    postMatchRatingSub: 'قيّم أداء وأخلاق خصمك لتعزيز بيئة اللعب النظيف (+5 XP مكافأة تقييم)',
    ratingRecordedBadge: '✓ تم تسجيل التقييم (+5 XP)',
    submitSportsmanshipBtn: '⭐ اعتماد تقييم الروح الرياضية',
    saveAndReturnBtn: 'حفظ النتيجة والعودة للساحة الرئيسية',
    yourTurnBanner: '🎯 دورك الآن للإجابة!',
    player2TurnBanner: '👥 دور اللاعب الثاني الآن!',
    opponentTurnBanner: '🤖 دور الخصم للإجابة...',
    goldenQuestionBadge: '🌟 سؤال ذهبي حاسم (GOLDEN +2 نقطتان)',
    standardQuestionBadge: 'سؤال قياسي (+1 نقطة)',
    confirmForfeitModalTitle: 'تأكيد الانسحاب من المباراة؟',
    confirmForfeitModalDesc: 'تنبيه اللعب النظيف: الانسحاب من المباراة التنافسية يمنح الفوز للخصم مباشرة ويخصم 15 عملة ذهبية.',
    continuePlayingBtn: 'متابعة اللعب ⚡',
  },

  en: {
    tournamentTopBadge: '🏆 Grand Monthly Tournament · Real Prizes for Top 5',
    tournamentTitle: 'Countdown to End of Current Monthly Tournament',
    tournamentSubtitle: 'Points are earned in Online Mode · 100% Bot-Free Human Leaderboard',
    daysLabel: 'Days',
    hoursLabel: 'Hours',
    minutesLabel: 'Min',
    secondsLabel: 'Sec',
    top5PrizesHeader: '🎁 Top 5 Monthly Prizes at Month End',
    currentLeaderLabel: 'Current Leader:',
    liveStandingsTitle: '📊 Monthly Tournament Leaderboard (Live Top-5 Updates)',
    liveStandingsSub: 'Top 5 rankings update in real time as Arena matches conclude',
    yourPointsLabel: 'Your Pts:',
    liveRefreshBtn: 'Live Rank Update ⚡',
    youTag: '(You)',
    ratingTag: 'Rating',
    prizeCandidateTag: 'Prize Contender',
    pointsUnit: 'Pts',
    monthlyPointsSub: 'Monthly Points',

    storeBannerTitle: 'Competitive Store & Daily Rewards Hub 🪙',
    storeBannerSub: 'Strict Hardcore Economy · Tamper-Proof Protected Ledger',
    currentBalanceLabel: 'Current Balance',
    lifelinesSectionTitle: '1. In-Match Lifelines Store (10% Off 5-Packs)',
    youOwnLabel: 'Owned:',
    buy1UnitBtn: 'Buy 1x',
    buy5PackBtn: '5-Pack (10% Off)',
    fiftyFiftyTitle: '50:50 Remove Two',
    fiftyFiftyDesc: 'Instantly removes two wrong options from the question',
    freezeTimeTitle: 'Freeze Time (+5s)',
    freezeTimeDesc: 'Grants 5 extra seconds to think on the current question',
    autoSolveTitle: 'Instant Auto Solve',
    autoSolveDesc: 'Automatically picks the correct answer at maximum speed',
    spinWheelTitle: '🎡 Daily Lucky Spin Wheel',
    spinWheelSub: 'One free spin daily · Grand Prize 60 🪙 or free lifelines',
    freeSpinTodayBtn: 'Free Spin Today 🎁',
    freeSpinUsedBtn: 'Free Spin Used ✓',
    extraSpinBtn: 'Extra Spin (250 🪙)',
    dailyBossTitle: '🔥 Daily Boss Rare Question',
    dailyBossDesc: 'One special 5-second question daily granting +20 Gold Coins!',
    dailyBossDoneBtn: 'Completed Today ✓',
    dailyBossStartBtn: 'Start Challenge (+20 🪙)',
    dailyLoginStreakTitle: '🎁 Daily Login Streak Reward',
    dailyLoginStreakDesc: 'Rewards grow with consecutive login days & multiply for VIP tiers',
    claimRewardBtn: 'Claim Reward',
    claimedTodayBtn: 'Claimed Today ✓',
    rewardAdTitle: '📺 Quick Rewarded Ad',
    rewardAdDesc: 'Each 5-second ad grants +30 Gold Coins (up to 3/day)',
    dailyLimitReachedBtn: 'Daily Limit Reached',
    watchAdBtn: 'Watch (+30 🪙)',
    shareGameTitle: '📤 Share Game with Friends',
    shareGameDesc: 'Share the game and your #ID to earn +25 coins once daily',
    sharedTodayBtn: 'Shared Today ✓',
    shareNowBtn: 'Share (+25 🪙)',
    dailyMissionsTitle: '🎯 Daily Missions (+20 Gold Coins Each)',
    missionOnlineWins: 'Win 3 Online Matches',
    missionCorrectAnswers: 'Answer 15 Questions Correctly',
    missionQuranCorrect: '5 Correct Answers in Holy Quran 📖',
    inProgressBtn: 'In Progress',
    vipPackagesTitle: '👑 Royal VIP Subscriptions (4 Tiers)',
    activePackageBadge: '✓ Currently Active Tier',
    activateWithCoinsBtn: 'Activate with Coins',
    instantTrialBtn: 'Instant Trial Activation',
    economyLedgerTitle: '🛡️ Protected Economy Ledger',
    balanceLabel: 'Balance:',

    analyticsChartTitle: '📊 Historical Performance Analytics (Wins vs Losses)',
    analyticsChartSub: 'Interactive breakdown of your Wins and Losses by match timeline or knowledge category',
    previewBadge: 'Interactive Preview · Updates after your first match',
    recentMatchesTab: '📈 Recent Matches',
    byCategoriesTab: '📚 By Category',
    areaChartTab: 'Gradient Area',
    barChartTab: 'Dual Bars',
    totalWinsCard: 'Total Wins',
    totalLossesCard: 'Total Losses',
    winRateCard: 'Win Rate %',
    maxComboCard: 'Max Combo Streak',
    winsSeriesName: 'Wins',
    lossesSeriesName: 'Losses',
    achievementsHeader: '🏅 Tournament Badges & Achievements (8 Badges)',
    achievementsSub: 'Each unlocked badge grants +15 Gold Coins 🪙 and a celebratory alert',
    unlockedCountLabel: 'Unlocked:',
    completedBadgeText: '✓ Unlocked (+15 🪙)',
    matchHistoryHeader: '📜 Last 50 Matches & Rating History',
    totalMatchesLabel: 'Total Matches:',
    noMatchesYetText: 'No matches played yet. Start your first Arena battle to see your history here!',
    againstLabel: 'vs',
    victoryText: 'Victory',
    defeatText: 'Defeat',
    forfeitWinText: 'Win by Forfeit',
    forfeitLossText: 'Loss by Forfeit',
    roundsWord: 'Rounds',
    pointsWord: 'Points',
    yourRatingBadge: '🤝 Rated:',

    searchingOpponentText: 'Searching for a live opponent in the Arena...',
    cancelSearchBtn: 'Cancel & Return',
    startingInSec: 'Starting in',
    roundBreakBadge: 'Inter-Round Break · Fair-Play Rule',
    roundEndedTitle: 'End of Round',
    roundBreakRuleDesc: 'Both players must confirm readiness within 30 seconds or forfeit immediately.',
    secondsRemaining: 'seconds left',
    readyForNextRound: '✓ Ready for Next Round',
    waitingYourApproval: '⏳ Waiting for you',
    preparingText: '⏳ Preparing...',
    confirmReadyBtn: 'Ready for Next Round 🚀',
    forfeitMatchBtn: 'Forfeit Match 🏳️',
    crushingVictoryTitle: 'Crushing Arena Victory!',
    matchOverGoodLuckTitle: 'Match Over · Better Luck Next Round',
    totalPointsLabel: 'Total Points',
    tournamentPointsLabel: 'Tournament Pts',
    goldCoinsLabel: 'Gold Coins',
    xpPointsLabel: 'XP Earned',
    postMatchRatingTitle: '🤝 Post-Match Sportsmanship Rating',
    postMatchRatingSub: 'Rate your opponent’s fair play and sportsmanship (+5 XP Bonus)',
    ratingRecordedBadge: '✓ Rating Saved (+5 XP)',
    submitSportsmanshipBtn: '⭐ Submit Sportsmanship Rating',
    saveAndReturnBtn: 'Save Result & Return to Arena',
    yourTurnBanner: '🎯 Your Turn to Answer!',
    player2TurnBanner: '👥 Player 2’s Turn!',
    opponentTurnBanner: '🤖 Opponent’s Turn...',
    goldenQuestionBadge: '🌟 GOLDEN QUESTION (+2 Points)',
    standardQuestionBadge: 'Standard Question (+1 Pt)',
    confirmForfeitModalTitle: 'Confirm Match Forfeit?',
    confirmForfeitModalDesc: 'Fair-Play Warning: Forfeiting an online match grants victory to your opponent and deducts 15 coins.',
    continuePlayingBtn: 'Continue Playing ⚡',
  },

  fr: {
    tournamentTopBadge: '🏆 Grand Tournoi Mensuel · Prix Réels pour le Top 5',
    tournamentTitle: 'Compte à Rebours de la Fin du Tournoi Mensuel',
    tournamentSubtitle: 'Points gagnés en mode En Ligne · Classement 100% Humain sans Bots',
    daysLabel: 'Jours',
    hoursLabel: 'Heures',
    minutesLabel: 'Min',
    secondsLabel: 'Sec',
    top5PrizesHeader: '🎁 Prix du Top 5 en Fin de Mois',
    currentLeaderLabel: 'Leader actuel :',
    liveStandingsTitle: '📊 Classement du Tournoi Mensuel (Mise à jour Top 5 en direct)',
    liveStandingsSub: 'Le classement Top 5 se met à jour en direct après chaque match',
    yourPointsLabel: 'Vos Pts :',
    liveRefreshBtn: 'Actualiser en Direct ⚡',
    youTag: '(Vous)',
    ratingTag: 'Cote',
    prizeCandidateTag: 'Candidat au prix',
    pointsUnit: 'Pts',
    monthlyPointsSub: 'Points du Mois',

    storeBannerTitle: 'Boutique Compétitive & Centre de Bonus 🪙',
    storeBannerSub: 'Économie Compétitive Stricte · Registre des Transactions Protégé',
    currentBalanceLabel: 'Solde Actuel',
    lifelinesSectionTitle: '1. Boutique des Jokers (Remise 10% sur le Pack de 5)',
    youOwnLabel: 'Possédé :',
    buy1UnitBtn: 'Acheter 1x',
    buy5PackBtn: 'Pack de 5 (-10%)',
    fiftyFiftyTitle: 'Joker 50:50',
    fiftyFiftyDesc: 'Supprime immédiatement deux mauvaises réponses',
    freezeTimeTitle: 'Gel du Temps (+5s)',
    freezeTimeDesc: 'Ajoute 5 secondes supplémentaires pour réfléchir',
    autoSolveTitle: 'Résolution Instantanée',
    autoSolveDesc: 'Sélectionne automatiquement la bonne réponse',
    spinWheelTitle: '🎡 Roue de la Fortune Quotidienne',
    spinWheelSub: 'Un tour gratuit par jour · Gros lot 60 🪙 ou jokers gratuits',
    freeSpinTodayBtn: 'Tour Gratuit 🎁',
    freeSpinUsedBtn: 'Tour Gratuit Utilisé ✓',
    extraSpinBtn: 'Tour Supplémentaire (250 🪙)',
    dailyBossTitle: '🔥 Question Rare du Jour (Daily Boss)',
    dailyBossDesc: 'Une question spéciale de 5 secondes par jour offrant +20 pièces !',
    dailyBossDoneBtn: 'Défi Terminé ✓',
    dailyBossStartBtn: 'Lancer le Défi (+20 🪙)',
    dailyLoginStreakTitle: '🎁 Bonus de Connexion Quotidienne',
    dailyLoginStreakDesc: 'Augmente chaque jour consécutif et se multiplie pour les membres VIP',
    claimRewardBtn: 'Réclamer Bonus',
    claimedTodayBtn: 'Déjà Réclamé ✓',
    rewardAdTitle: '📺 Publicité Récompensée Rapide',
    rewardAdDesc: 'Chaque vidéo de 5s offre +30 pièces d’or (max 3/jour)',
    dailyLimitReachedBtn: 'Limite Atteinte',
    watchAdBtn: 'Regarder (+30 🪙)',
    shareGameTitle: '📤 Partager le Jeu avec des Amis',
    shareGameDesc: 'Partagez votre #ID et gagnez +25 pièces une fois par jour',
    sharedTodayBtn: 'Partagé ✓',
    shareNowBtn: 'Partager (+25 🪙)',
    dailyMissionsTitle: '🎯 Missions Quotidiennes (+20 Pièces par Mission)',
    missionOnlineWins: 'Gagner 3 Matchs En Ligne',
    missionCorrectAnswers: '15 Bonnes Réponses',
    missionQuranCorrect: '5 Bonnes Réponses en Saint Coran 📖',
    inProgressBtn: 'En Cours',
    vipPackagesTitle: '👑 Abonnements VIP Royaux (4 Niveaux)',
    activePackageBadge: '✓ Abonnement Actif',
    activateWithCoinsBtn: 'Activer en Pièces',
    instantTrialBtn: 'Essai Instantané',
    economyLedgerTitle: '🛡️ Registre Économique Protégé',
    balanceLabel: 'Solde :',

    analyticsChartTitle: '📊 Graphique de Performance Historique (Victoires vs Défaites)',
    analyticsChartSub: 'Analyse interactive de vos victoires et défaites par match ou par catégorie',
    previewBadge: 'Aperçu Interactif · Mis à jour après le 1er match',
    recentMatchesTab: '📈 Derniers Matchs',
    byCategoriesTab: '📚 Par Catégorie',
    areaChartTab: 'Aires Dégradées',
    barChartTab: 'Barres Doubles',
    totalWinsCard: 'Total Victoires',
    totalLossesCard: 'Total Défaites',
    winRateCard: 'Taux de Victoire',
    maxComboCard: 'Combo Max',
    winsSeriesName: 'Victoires',
    lossesSeriesName: 'Défaites',
    achievementsHeader: '🏅 Badges & Succès du Tournoi (8 Badges)',
    achievementsSub: 'Chaque badge débloqué offre +15 pièces d’or 🪙',
    unlockedCountLabel: 'Débloqués :',
    completedBadgeText: '✓ Débloqué (+15 🪙)',
    matchHistoryHeader: '📜 Historique des 50 Derniers Matchs',
    totalMatchesLabel: 'Total Matchs :',
    noMatchesYetText: 'Aucun match joué. Lancez votre premier duel dans l’Arène !',
    againstLabel: 'contre',
    victoryText: 'Victoire',
    defeatText: 'Défaite',
    forfeitWinText: 'Victoire par Abandon',
    forfeitLossText: 'Défaite par Abandon',
    roundsWord: 'Manches',
    pointsWord: 'Points',
    yourRatingBadge: '🤝 Votre note :',

    searchingOpponentText: 'Recherche d’un adversaire en direct...',
    cancelSearchBtn: 'Annuler et Retourner',
    startingInSec: 'Départ dans',
    roundBreakBadge: 'Pause entre les Manches · Fair-Play',
    roundEndedTitle: 'Fin de la Manche',
    roundBreakRuleDesc: 'Les deux joueurs doivent confirmer dans les 30 secondes sous peine d’abandon.',
    secondsRemaining: 'secondes restantes',
    readyForNextRound: '✓ Prêt pour la suite',
    waitingYourApproval: '⏳ En attente de vous',
    preparingText: '⏳ Se prépare...',
    confirmReadyBtn: 'Prêt pour la Manche Suivante 🚀',
    forfeitMatchBtn: 'Abandonner le Match 🏳️',
    crushingVictoryTitle: 'Victoire Écrasante dans l’Arène !',
    matchOverGoodLuckTitle: 'Match Terminé · Bonne Chance pour la Suite',
    totalPointsLabel: 'Total Points',
    tournamentPointsLabel: 'Pts Tournoi',
    goldCoinsLabel: 'Pièces d’Or',
    xpPointsLabel: 'Points XP',
    postMatchRatingTitle: '🤝 Évaluation Fair-Play d’Après-Match',
    postMatchRatingSub: 'Notez l’esprit sportif de votre adversaire (+5 XP Bonus)',
    ratingRecordedBadge: '✓ Note Enregistrée (+5 XP)',
    submitSportsmanshipBtn: '⭐ Valider la Note Fair-Play',
    saveAndReturnBtn: 'Enregistrer et Retourner à l’Arène',
    yourTurnBanner: '🎯 À votre tour de répondre !',
    player2TurnBanner: '👥 Au tour du Joueur 2 !',
    opponentTurnBanner: '🤖 Tour de l’adversaire...',
    goldenQuestionBadge: '🌟 QUESTION D’OR (+2 Points)',
    standardQuestionBadge: 'Question Standard (+1 Pt)',
    confirmForfeitModalTitle: 'Confirmer l’Abandon du Match ?',
    confirmForfeitModalDesc: 'Avertissement Fair-Play : Abandonner donne la victoire à l’adversaire et retire 15 pièces.',
    continuePlayingBtn: 'Continuer le Match ⚡',
  },

  es: {
    tournamentTopBadge: '🏆 Gran Torneo Mensual · Premios Reales para el Top 5',
    tournamentTitle: 'Cuenta Regresiva para el Fin del Torneo Mensual',
    tournamentSubtitle: 'Los puntos se ganan en Modo Online · Clasificación 100% Humana sin Bots',
    daysLabel: 'Días',
    hoursLabel: 'Horas',
    minutesLabel: 'Min',
    secondsLabel: 'Seg',
    top5PrizesHeader: '🎁 Premios del Top 5 a Fin de Mes',
    currentLeaderLabel: 'Líder actual:',
    liveStandingsTitle: '📊 Clasificación del Torneo Mensual (Top 5 en Vivo)',
    liveStandingsSub: 'El Top 5 se actualiza en tiempo real al finalizar las partidas en la Arena',
    yourPointsLabel: 'Tus Pts:',
    liveRefreshBtn: 'Actualizar en Vivo ⚡',
    youTag: '(Tú)',
    ratingTag: 'Rango',
    prizeCandidateTag: 'Candidato a premio',
    pointsUnit: 'Pts',
    monthlyPointsSub: 'Puntos del Mes',

    storeBannerTitle: 'Tienda Competitiva y Centro de Premios 🪙',
    storeBannerSub: 'Economía Competitiva Estricta · Registro Protegido contra Trampas',
    currentBalanceLabel: 'Saldo Actual',
    lifelinesSectionTitle: '1. Tienda de Comodines en Partida (10% Dto. en Pack de 5)',
    youOwnLabel: 'Tienes:',
    buy1UnitBtn: 'Comprar 1x',
    buy5PackBtn: 'Pack de 5 (-10%)',
    fiftyFiftyTitle: 'Eliminar Dos (50:50)',
    fiftyFiftyDesc: 'Elimina al instante dos respuestas incorrectas',
    freezeTimeTitle: 'Congelar Tiempo (+5s)',
    freezeTimeDesc: 'Otorga 5 segundos extra para pensar la respuesta',
    autoSolveTitle: 'Resolución Instantánea',
    autoSolveDesc: 'Selecciona automáticamente la respuesta correcta',
    spinWheelTitle: '🎡 Ruleta de la Suerte Diaria',
    spinWheelSub: 'Un giro gratis al día · Gran Premio de 60 🪙 o comodines gratis',
    freeSpinTodayBtn: 'Giro Gratis Hoy 🎁',
    freeSpinUsedBtn: 'Giro Gratis Usado ✓',
    extraSpinBtn: 'Giro Extra (250 🪙)',
    dailyBossTitle: '🔥 Pregunta Rara del Día (Daily Boss)',
    dailyBossDesc: '¡Una pregunta especial de 5 segundos al día que otorga +20 monedas!',
    dailyBossDoneBtn: 'Completado Hoy ✓',
    dailyBossStartBtn: 'Iniciar Reto (+20 🪙)',
    dailyLoginStreakTitle: '🎁 Premio por Racha Diaria',
    dailyLoginStreakDesc: 'Aumenta con los días consecutivos y se multiplica para miembros VIP',
    claimRewardBtn: 'Reclamar Premio',
    claimedTodayBtn: 'Reclamado Hoy ✓',
    rewardAdTitle: '📺 Anuncio Rápido con Premio',
    rewardAdDesc: 'Cada anuncio de 5s otorga +30 monedas de oro (máx. 3/día)',
    dailyLimitReachedBtn: 'Límite Alcanzado',
    watchAdBtn: 'Ver (+30 🪙)',
    shareGameTitle: '📤 Compartir Juego con Amigos',
    shareGameDesc: 'Comparte el juego y tu #ID para ganar +25 monedas una vez al día',
    sharedTodayBtn: 'Compartido ✓',
    shareNowBtn: 'Compartir (+25 🪙)',
    dailyMissionsTitle: '🎯 Misiones Diarias (+20 Monedas cada una)',
    missionOnlineWins: 'Ganar 3 Partidas Online',
    missionCorrectAnswers: 'Responder 15 Preguntas Correctas',
    missionQuranCorrect: '5 Respuestas Correctas en Sagrado Corán 📖',
    inProgressBtn: 'En Progreso',
    vipPackagesTitle: '👑 Suscripciones VIP Reales (4 Niveles)',
    activePackageBadge: '✓ Tu Plan Activo',
    activateWithCoinsBtn: 'Activar con Monedas',
    instantTrialBtn: 'Prueba Instantánea',
    economyLedgerTitle: '🛡️ Registro Económico Protegido',
    balanceLabel: 'Saldo:',

    analyticsChartTitle: '📊 Gráfico Analítico de Rendimiento (Victorias vs Derrotas)',
    analyticsChartSub: 'Análisis interactivo de tus victorias y derrotas por historial o categoría',
    previewBadge: 'Vista Previa · Se actualiza tras tu primera partida',
    recentMatchesTab: '📈 Últimas Partidas',
    byCategoriesTab: '📚 Por Categoría',
    areaChartTab: 'Área Degradada',
    barChartTab: 'Barras Dobles',
    totalWinsCard: 'Total Victorias',
    totalLossesCard: 'Total Derrotas',
    winRateCard: '% de Victoria',
    maxComboCard: 'Racha Máx. Combo',
    winsSeriesName: 'Victorias',
    lossesSeriesName: 'Derrotas',
    achievementsHeader: '🏅 Medallas y Logros del Torneo (8 Medallas)',
    achievementsSub: 'Cada medalla desbloqueada otorga +15 monedas de oro 🪙',
    unlockedCountLabel: 'Desbloqueadas:',
    completedBadgeText: '✓ Completado (+15 🪙)',
    matchHistoryHeader: '📜 Historial de las Últimas 50 Partidas',
    totalMatchesLabel: 'Total Partidas:',
    noMatchesYetText: 'Aún no has jugado partidas. ¡Inicia tu primer duelo en la Arena!',
    againstLabel: 'vs',
    victoryText: 'Victoria',
    defeatText: 'Derrota',
    forfeitWinText: 'Victoria por Abandono',
    forfeitLossText: 'Derrota por Abandono',
    roundsWord: 'Rondas',
    pointsWord: 'Puntos',
    yourRatingBadge: '🤝 Tu valoración:',

    searchingOpponentText: 'Buscando rival en vivo en la Arena...',
    cancelSearchBtn: 'Cancelar y Volver',
    startingInSec: 'Iniciando en',
    roundBreakBadge: 'Descanso entre Rondas · Juego Limpio',
    roundEndedTitle: 'Fin de la Ronda',
    roundBreakRuleDesc: 'Ambos jugadores deben confirmar en 30 segundos o se declarará abandono.',
    secondsRemaining: 'segundos restantes',
    readyForNextRound: '✓ Listo para la siguiente ronda',
    waitingYourApproval: '⏳ Esperando tu confirmación',
    preparingText: '⏳ Preparándose...',
    confirmReadyBtn: 'Listo para la Siguiente Ronda 🚀',
    forfeitMatchBtn: 'Abandonar Partida 🏳️',
    crushingVictoryTitle: '¡Victoria Aplastante en la Arena!',
    matchOverGoodLuckTitle: 'Partida Terminada · Buena Suerte en la Próxima',
    totalPointsLabel: 'Puntos Totales',
    tournamentPointsLabel: 'Pts Torneo',
    goldCoinsLabel: 'Monedas de Oro',
    xpPointsLabel: 'Puntos XP',
    postMatchRatingTitle: '🤝 Valoración de Deportividad Post-Partida',
    postMatchRatingSub: 'Valora el juego limpio de tu rival (+5 XP de bonificación)',
    ratingRecordedBadge: '✓ Valoración Guardada (+5 XP)',
    submitSportsmanshipBtn: '⭐ Enviar Valoración de Deportividad',
    saveAndReturnBtn: 'Guardar Resultado y Volver a la Arena',
    yourTurnBanner: '🎯 ¡Tu turno de responder!',
    player2TurnBanner: '👥 ¡Turno del Jugador 2!',
    opponentTurnBanner: '🤖 Turno del rival...',
    goldenQuestionBadge: '🌟 PREGUNTA DORADA (+2 Puntos)',
    standardQuestionBadge: 'Pregunta Estándar (+1 Pt)',
    confirmForfeitModalTitle: '¿Confirmar Abandono de Partida?',
    confirmForfeitModalDesc: 'Aviso de Juego Limpio: Abandonar otorga la victoria al rival y descuenta 15 monedas.',
    continuePlayingBtn: 'Seguir Jugando ⚡',
  },

  tr: {
    tournamentTopBadge: '🏆 Büyük Aylık Turnuva · İlk 5’e Gerçek Ödüller',
    tournamentTitle: 'Mevcut Aylık Turnuva Bitiş Geri Sayımı',
    tournamentSubtitle: 'Puanlar Online Modda kazanılır · %100 Botsuz Gerçek Oyuncu Sıralaması',
    daysLabel: 'Gün',
    hoursLabel: 'Saat',
    minutesLabel: 'Dk',
    secondsLabel: 'Sn',
    top5PrizesHeader: '🎁 Ay Sonu İlk 5 Sıra Ödülleri',
    currentLeaderLabel: 'Şu anki lider:',
    liveStandingsTitle: '📊 Aylık Turnuva Liderlik Tablosu (Canlı İlk 5 Güncellemesi)',
    liveStandingsSub: 'İlk 5 sıralaması Arena maçları bittikçe anlık olarak güncellenir',
    yourPointsLabel: 'Puanınız:',
    liveRefreshBtn: 'Canlı Sıralama Güncelle ⚡',
    youTag: '(Siz)',
    ratingTag: 'Derece',
    prizeCandidateTag: 'Ödül Adayı',
    pointsUnit: 'Puan',
    monthlyPointsSub: 'Aylık Puan',

    storeBannerTitle: 'Rekabetçi Mağaza ve Günlük Ödül Merkezi 🪙',
    storeBannerSub: 'Sıkı Rekabetçi Ekonomi · Hile Korumalı İşlem Kaydı',
    currentBalanceLabel: 'Mevcut Bakiye',
    lifelinesSectionTitle: '1. Maç İçi Joker Mağazası (5’li Pakette %10 İndirim)',
    youOwnLabel: 'Sahip:',
    buy1UnitBtn: '1 Adet Al',
    buy5PackBtn: '5’li Paket (%10 İndirim)',
    fiftyFiftyTitle: 'İki Şık Sil (50:50)',
    fiftyFiftyDesc: 'Sorudan iki yanlış seçeneği anında siler',
    freezeTimeTitle: 'Süreyi Dondur (+5sn)',
    freezeTimeDesc: 'Soruyu düşünmek için 5 ek saniye verir',
    autoSolveTitle: 'Anında Otomatik Çöz',
    autoSolveDesc: 'Doğru cevabı maksimum hızla otomatik seçer',
    spinWheelTitle: '🎡 Günlük Şans Çarkı (Spin Wheel)',
    spinWheelSub: 'Günde 1 ücretsiz çevirme · Büyük ödül 60 🪙 veya ücretsiz jokerler',
    freeSpinTodayBtn: 'Bugün Ücretsiz Çevir 🎁',
    freeSpinUsedBtn: 'Ücretsiz Hak Kullanıldı ✓',
    extraSpinBtn: 'Ekstra Çevirme (250 🪙)',
    dailyBossTitle: '🔥 Günün Nadir Sorusu (Daily Boss)',
    dailyBossDesc: 'Günde 5 saniyelik tek özel soru +20 altın kazandırır!',
    dailyBossDoneBtn: 'Bugün Tamamlandı ✓',
    dailyBossStartBtn: 'Meydan Okumayı Başlat (+20 🪙)',
    dailyLoginStreakTitle: '🎁 Günlük Giriş Serisi Ödülü',
    dailyLoginStreakDesc: 'Ardışık giriş günleriyle artar ve VIP üyeler için katlanır',
    claimRewardBtn: 'Ödülü Al',
    claimedTodayBtn: 'Bugün Alındı ✓',
    rewardAdTitle: '📺 Hızlı Ödüllü Reklam',
    rewardAdDesc: 'Her 5 saniyelik reklam +30 altın verir (günde maks. 3)',
    dailyLimitReachedBtn: 'Günlük Limit Doldu',
    watchAdBtn: 'İzle (+30 🪙)',
    shareGameTitle: '📤 Oyunu Arkadaşlarınla Paylaş',
    shareGameDesc: 'Oyunu ve #ID kodunu paylaşarak günde bir kez +25 altın kazan',
    sharedTodayBtn: 'Paylaşıldı ✓',
    shareNowBtn: 'Paylaş (+25 🪙)',
    dailyMissionsTitle: '🎯 Günlük Görevler (Her Görev +20 Altın Verir)',
    missionOnlineWins: '3 Online Maç Kazan',
    missionCorrectAnswers: '15 Soruyu Doğru Cevapla',
    missionQuranCorrect: 'Kur’an Bölümünde 5 Doğru Cevap 📖',
    inProgressBtn: 'Devam Ediyor',
    vipPackagesTitle: '👑 Kraliyet VIP Paketleri (4 Paket)',
    activePackageBadge: '✓ Aktif Paketiniz',
    activateWithCoinsBtn: 'Altınla Etkinleştir',
    instantTrialBtn: 'Anında Deneme Etkinleştir',
    economyLedgerTitle: '🛡️ Korumalı Ekonomi İşlem Geçmişi',
    balanceLabel: 'Bakiye:',

    analyticsChartTitle: '📊 Geçmiş Performans Analiz Grafiği (Galibiyet vs Mağlubiyet)',
    analyticsChartSub: 'Maç sırasına veya bilgi kategorilerine göre galibiyet ve mağlubiyet analizi',
    previewBadge: 'Önizleme Modu · İlk maçtan sonra güncellenir',
    recentMatchesTab: '📈 Son Maçlar',
    byCategoriesTab: '📚 Kategorilere Göre',
    areaChartTab: 'Gradyan Alan',
    barChartTab: 'Çift Sütun',
    totalWinsCard: 'Toplam Galibiyet',
    totalLossesCard: 'Toplam Mağlubiyet',
    winRateCard: 'Kazanma Oranı %',
    maxComboCard: 'En Yüksek Kombo',
    winsSeriesName: 'Galibiyet (Wins)',
    lossesSeriesName: 'Mağlubiyet (Losses)',
    achievementsHeader: '🏅 Turnuva Rozetleri ve Başarımlar (8 Rozet)',
    achievementsSub: 'Açılan her rozet anında +15 altın 🪙 kazandırır',
    unlockedCountLabel: 'Açılan:',
    completedBadgeText: '✓ Tamamlandı (+15 🪙)',
    matchHistoryHeader: '📜 Son 50 Maç ve Derece Geçmişi',
    totalMatchesLabel: 'Toplam Maç:',
    noMatchesYetText: 'Henüz maç yapmadınız. Sonuçlarınızı görmek için Arenada ilk maçınıza başlayın!',
    againstLabel: 'rakip:',
    victoryText: 'Galibiyet',
    defeatText: 'Mağlubiyet',
    forfeitWinText: 'Hükmen Galibiyet',
    forfeitLossText: 'Hükmen Mağlubiyet',
    roundsWord: 'Turlar',
    pointsWord: 'Puanlar',
    yourRatingBadge: '🤝 Puanınız:',

    searchingOpponentText: 'Arenada canlı rakip aranıyor...',
    cancelSearchBtn: 'Aramayı İptal Et ve Dön',
    startingInSec: 'Başlıyor:',
    roundBreakBadge: 'Turlar Arası Mola · Adil Oyun Kuralı',
    roundEndedTitle: 'Tur Bitti:',
    roundBreakRuleDesc: 'Her iki taraf 30 saniye içinde onaylamalıdır, geciken oyuncu çekilmiş sayılır.',
    secondsRemaining: 'saniye kaldı',
    readyForNextRound: '✓ Sonraki Tura Hazır',
    waitingYourApproval: '⏳ Onayınız Bekleniyor',
    preparingText: '⏳ Hazırlanıyor...',
    confirmReadyBtn: 'Sonraki Tura Hazırım 🚀',
    forfeitMatchBtn: 'Maçtan Çekil 🏳️',
    crushingVictoryTitle: 'Arenada Ezici Zafer!',
    matchOverGoodLuckTitle: 'Maç Bitti · Sonraki Turda Bol Şans',
    totalPointsLabel: 'Toplam Puan',
    tournamentPointsLabel: 'Turnuva Puanı',
    goldCoinsLabel: 'Altın Para',
    xpPointsLabel: 'Deneyim XP',
    postMatchRatingTitle: '🤝 Maç Sonu Sportmenlik Değerlendirmesi',
    postMatchRatingSub: 'Adil oyun ortamı için rakibinizin sportmenliğini puanlayın (+5 XP Bonus)',
    ratingRecordedBadge: '✓ Değerlendirme Kaydedildi (+5 XP)',
    submitSportsmanshipBtn: '⭐ Sportmenlik Puanını Gönder',
    saveAndReturnBtn: 'Sonucu Kaydet ve Arenaya Dön',
    yourTurnBanner: '🎯 Cevap Sırası Sizde!',
    player2TurnBanner: '👥 Sıra 2. Oyuncuda!',
    opponentTurnBanner: '🤖 Rakibin Cevap Sırası...',
    goldenQuestionBadge: '🌟 ALTIN SORU (+2 Puan)',
    standardQuestionBadge: 'Standart Soru (+1 Puan)',
    confirmForfeitModalTitle: 'Maçtan Çekilmeyi Onaylıyor musunuz?',
    confirmForfeitModalDesc: 'Adil Oyun Uyarısı: Maçtan çekilmek galibiyeti rakibe verir ve 15 altın düşer.',
    continuePlayingBtn: 'Oynamaya Devam Et ⚡',
  },

  ur: {
    tournamentTopBadge: '🏆 عظیم ماہانہ ٹورنامنٹ · سرفہرست 5 کھلاڑیوں کے لیے حقیقی انعامات',
    tournamentTitle: 'موجودہ ماہانہ ٹورنامنٹ کے اختتام کا وقت',
    tournamentSubtitle: 'پوائنٹس آن لائن موڈ میں شمار ہوتے ہیں · بوٹس سے پاک حقیقی کھلاڑیوں کی فہرست',
    daysLabel: 'دن',
    hoursLabel: 'گھنٹے',
    minutesLabel: 'منٹ',
    secondsLabel: 'سیکنڈ',
    top5PrizesHeader: '🎁 مہینے کے آخر میں پہلی 5 پوزیشنز کے انعامات',
    currentLeaderLabel: 'موجودہ سرفہرست:',
    liveStandingsTitle: '📊 ماہانہ ٹورنامنٹ کی درجہ بندی (پہلی 5 پوزیشنز کی براہ راست اپ ڈیٹ)',
    liveStandingsSub: 'میدان میں مقابلوں کے اختتام کے ساتھ ہی سرفہرست کھلاڑیوں کی ترتیب اپ ڈیٹ ہوتی ہے',
    yourPointsLabel: 'آپ کے پوائنٹس:',
    liveRefreshBtn: 'براہ راست اپ ڈیٹ ⚡',
    youTag: '(آپ)',
    ratingTag: 'ریٹنگ',
    prizeCandidateTag: 'امیدوار برائے انعام',
    pointsUnit: 'پوائنٹس',
    monthlyPointsSub: 'ماہانہ پوائنٹس',

    storeBannerTitle: 'مسابقتی اسٹور اور روزانہ انعامات کا مرکز 🪙',
    storeBannerSub: 'شفاف مسابقتی معیشت · مکمل طور پر محفوظ ریکارڈ',
    currentBalanceLabel: 'موجودہ بیلنس',
    lifelinesSectionTitle: '1. مقابلے میں مددگار وسائل کا اسٹور (5 کے پیک پر 10% رعایت)',
    youOwnLabel: 'موجود:',
    buy1UnitBtn: '1 عدد خریدیں',
    buy5PackBtn: '5 کا پیک (10% رعایت)',
    fiftyFiftyTitle: 'دو غلط جوابات حذف کریں (50:50)',
    fiftyFiftyDesc: 'سوال سے فوری طور پر دو غلط اختیارات ہٹا دیتا ہے',
    freezeTimeTitle: 'وقت منجمد کریں (+5 سیکنڈ)',
    freezeTimeDesc: 'سوال پر غور کرنے کے لیے 5 اضافی سیکنڈ دیتا ہے',
    autoSolveTitle: 'فوری خودکار حل (Auto Solve)',
    autoSolveDesc: 'خودکار طور پر درست جواب کا انتخاب کرتا ہے',
    spinWheelTitle: '🎡 روزانہ قسمت کا پہیہ (Spin Wheel)',
    spinWheelSub: 'روزانہ ایک مفت چکر · بڑا انعام 60 🪙 یا مفت مددگار وسائل',
    freeSpinTodayBtn: 'آج کا مفت چکر 🎁',
    freeSpinUsedBtn: 'مفت چکر استعمال ہو چکا ✓',
    extraSpinBtn: 'اضافی چکر (250 🪙)',
    dailyBossTitle: '🔥 آج کا نایاب سوال (Daily Boss)',
    dailyBossDesc: 'روزانہ 5 سیکنڈ کا ایک خاص سوال جو +20 سونے کے سکے دیتا ہے!',
    dailyBossDoneBtn: 'آج مکمل ہو گیا ✓',
    dailyBossStartBtn: 'چیلنج شروع کریں (+20 🪙)',
    dailyLoginStreakTitle: '🎁 روزانہ لاگ ان کا انعام',
    dailyLoginStreakDesc: 'مسلسل لاگ ان کے دنوں کے ساتھ انعام بڑھتا ہے اور VIP کے لیے دگنا ہوتا ہے',
    claimRewardBtn: 'انعام حاصل کریں',
    claimedTodayBtn: 'آج وصول کر لیا ✓',
    rewardAdTitle: '📺 فوری انعامی اشتہار',
    rewardAdDesc: 'ہر 5 سیکنڈ کا اشتہار +30 سونے کے سکے دیتا ہے',
    dailyLimitReachedBtn: 'روزانہ کی حد مکمل',
    watchAdBtn: 'دیکھیں (+30 🪙)',
    shareGameTitle: '📤 دوستوں کے ساتھ گیم شیئر کریں',
    shareGameDesc: 'گیم اور اپنی #ID شیئر کریں اور روزانہ ایک بار +25 سکے حاصل کریں',
    sharedTodayBtn: 'شیئر ہو چکا ✓',
    shareNowBtn: 'شیئر کریں (+25 🪙)',
    dailyMissionsTitle: '🎯 روزانہ کے مہمات (ہر مہم پر +20 سونے کے سکے)',
    missionOnlineWins: '3 آن لائن مقابلے جیتیں',
    missionCorrectAnswers: '15 سوالات کے درست جواب دیں',
    missionQuranCorrect: 'قرآن کریم کے شعبے میں 5 درست جوابات 📖',
    inProgressBtn: 'جاری ہے',
    vipPackagesTitle: '👑 شاہی VIP پیکجز (4 پیکجز)',
    activePackageBadge: '✓ آپ کا فعال پیکج',
    activateWithCoinsBtn: 'سکوں سے فعال کریں',
    instantTrialBtn: 'فوری تجرباتی آغاز',
    economyLedgerTitle: '🛡️ محفوظ معاشی ریکارڈ (Economy Ledger)',
    balanceLabel: 'بیلنس:',

    analyticsChartTitle: '📊 تاریخی کارکردگی کا تجزیاتی چارٹ (کامیابیاں بمقابلہ شکست)',
    analyticsChartSub: 'مقابلوں کی ترتیب یا علمی شعبوں کے لحاظ سے آپ کی کامیابیوں اور شکست کا انٹرایکٹو تجزیہ',
    previewBadge: 'نمونہ پیش نظارہ · پہلے مقابلے کے بعد اپ ڈیٹ ہو گا',
    recentMatchesTab: '📈 حالیہ مقابلے',
    byCategoriesTab: '📚 شعبوں کے لحاظ سے',
    areaChartTab: 'ایریا چارٹ',
    barChartTab: 'بار چارٹ',
    totalWinsCard: 'کل کامیابیاں',
    totalLossesCard: 'کل شکست',
    winRateCard: 'کامیابی کا تناسب %',
    maxComboCard: 'بہترین کومبو سلسلہ',
    winsSeriesName: 'کامیابیاں (Wins)',
    lossesSeriesName: 'شکست (Losses)',
    achievementsHeader: '🏅 ٹورنامنٹ کے تمغے اور اعزازات (8 تمغے)',
    achievementsSub: 'ہر تمغہ مکمل کرنے پر فوری +15 سونے کے سکے 🪙 ملتے ہیں',
    unlockedCountLabel: 'حاصل شدہ:',
    completedBadgeText: '✓ مکمل (+15 🪙)',
    matchHistoryHeader: '📜 آخری 50 مقابلوں اور ریٹنگ کا ریکارڈ',
    totalMatchesLabel: 'کل مقابلے:',
    noMatchesYetText: 'آپ نے ابھی تک کوئی مقابلہ نہیں کھیلا۔ میدان میں اپنا پہلا مقابلہ شروع کریں!',
    againstLabel: 'بمقابلہ',
    victoryText: 'کامیابی',
    defeatText: 'شکست',
    forfeitWinText: 'دستبرداری سے فتح',
    forfeitLossText: 'دستبرداری سے شکست',
    roundsWord: 'راؤنڈز',
    pointsWord: 'پوائنٹس',
    yourRatingBadge: '🤝 آپ کی ریٹنگ:',

    searchingOpponentText: 'میدان میں حریف کی تلاش جاری ہے...',
    cancelSearchBtn: 'تلاش منسوخ کریں اور واپس جائیں',
    startingInSec: 'آغاز برائے',
    roundBreakBadge: 'راؤنڈز کے درمیان وقفہ · منصفانہ کھیل',
    roundEndedTitle: 'راؤنڈ مکمل ہوا',
    roundBreakRuleDesc: 'اگلا راؤنڈ شروع کرنے کے لیے دونوں کھلاڑیوں کو 30 سیکنڈ میں تصدیق کرنی ہوگی۔',
    secondsRemaining: 'سیکنڈ باقی',
    readyForNextRound: '✓ اگلے راؤنڈ کے لیے تیار',
    waitingYourApproval: '⏳ آپ کی تصدیق کا انتظار',
    preparingText: '⏳ تیاری کر رہا ہے...',
    confirmReadyBtn: 'اگلے راؤنڈ کے لیے تیار 🚀',
    forfeitMatchBtn: 'مقابلے سے دستبرداری 🏳️',
    crushingVictoryTitle: 'میدان میں شاندار فتح!',
    matchOverGoodLuckTitle: 'مقابلہ ختم ہوا · اگلی بار نیک تمنائیں',
    totalPointsLabel: 'کل پوائنٹس',
    tournamentPointsLabel: 'ٹورنامنٹ پوائنٹس',
    goldCoinsLabel: 'سونے کے سکے',
    xpPointsLabel: 'تجربہ XP',
    postMatchRatingTitle: '🤝 مقابلے کے بعد اسپورٹس مین شپ ریٹنگ',
    postMatchRatingSub: 'منصفانہ کھیل کے فروغ کے لیے اپنے حریف کے اخلاق کی درجہ بندی کریں (+5 XP بونس)',
    ratingRecordedBadge: '✓ ریٹنگ محفوظ ہو گئی (+5 XP)',
    submitSportsmanshipBtn: '⭐ اسپورٹس مین شپ ریٹنگ جمع کرائیں',
    saveAndReturnBtn: 'نتیجہ محفوظ کریں اور میدان میں واپس جائیں',
    yourTurnBanner: '🎯 جواب دینے کی آپ کی باری ہے!',
    player2TurnBanner: '👥 دوسرے کھلاڑی کی باری!',
    opponentTurnBanner: '🤖 حریف کے جواب کی باری...',
    goldenQuestionBadge: '🌟 سنہری فیصلہ کن سوال (+2 پوائنٹس)',
    standardQuestionBadge: 'معیاری سوال (+1 پوائنٹ)',
    confirmForfeitModalTitle: 'کیا آپ واقعی مقابلے سے دستبردار ہونا چاہتے ہیں؟',
    confirmForfeitModalDesc: 'انتباہ: مقابلے سے دستبردار ہونے پر حریف کو فتح ملے گی اور 15 سکے منہا ہوں گے۔',
    continuePlayingBtn: 'کھیل جاری رکھیں ⚡',
  },
};

export function getViewTranslations(lang: LanguageCode): ViewTranslations {
  return VIEW_TRANSLATIONS[lang] || VIEW_TRANSLATIONS.ar;
}

