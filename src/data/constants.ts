import { CategoryId, LanguageCode, ProfileBorderId, UiThemeId, VipTier } from '../types';

export interface ProfileBorderDefinition {
  id: ProfileBorderId;
  nameAr: string;
  descAr: string;
  priceCoins: number;
  icon: string;
  borderColor: string;
  glowShadow: string;
  ringClass: string;
}

export const PROFILE_BORDERS_CATALOG: ProfileBorderDefinition[] = [
  {
    id: 'default_cyan',
    nameAr: 'الإطار السماوي القياسي',
    descAr: 'إطار نيون سماوي كلاسيكي للساحة',
    priceCoins: 0,
    icon: '💠',
    borderColor: '#4FF5D2',
    glowShadow: '0 0 14px rgba(79, 245, 210, 0.28)',
    ringClass: 'border-2 border-[#4FF5D2]',
  },
  {
    id: 'emerald_flame',
    nameAr: 'إطار اللهب الزمردي',
    descAr: 'توهج زمردي متقد يعكس الانتصارات المتتالية',
    priceCoins: 120,
    icon: '🐉',
    borderColor: '#10B981',
    glowShadow: '0 0 22px rgba(16, 185, 129, 0.55)',
    ringClass: 'border-2 border-[#10B981] ring-2 ring-[#38D9A9]/40',
  },
  {
    id: 'amethyst_galaxy',
    nameAr: 'إطار المجرة البنفسجية',
    descAr: 'هالة كونية بنفسجية لنخبة العباقرة',
    priceCoins: 180,
    icon: '🌌',
    borderColor: '#A78BFA',
    glowShadow: '0 0 24px rgba(167, 139, 250, 0.6)',
    ringClass: 'border-2 border-[#A78BFA] ring-2 ring-[#A78BFA]/40',
  },
  {
    id: 'crimson_cyber',
    nameAr: 'إطار النبض القرمزي',
    descAr: 'طاقة هجومية حمراء متوهجة ترهب الخصوم',
    priceCoins: 250,
    icon: '⚡',
    borderColor: '#FF6B81',
    glowShadow: '0 0 26px rgba(255, 107, 129, 0.65)',
    ringClass: 'border-2 border-[#FF6B81] ring-2 ring-[#FF6B81]/45',
  },
  {
    id: 'royal_gold_frame',
    nameAr: 'الإطار الملكي الذهبي 👑',
    descAr: 'إطار مذهب فاخر خاص بأساطير الميدان',
    priceCoins: 350,
    icon: '👑',
    borderColor: '#FFD166',
    glowShadow: '0 0 30px rgba(255, 209, 102, 0.7)',
    ringClass: 'border-2 border-[#FFD166] ring-2 ring-[#FFD166]/50',
  },
];

export interface UiThemeDefinition {
  id: UiThemeId;
  nameAr: string;
  descAr: string;
  priceCoins: number;
  icon: string;
  bgPrimary: string;
  bgCard: string;
  bgPanel: string;
  borderColor: string;
  accentColor: string;
}

export const UI_THEMES_CATALOG: UiThemeDefinition[] = [
  {
    id: 'midnight_cyan',
    nameAr: 'ثيم منتصف الليل السماوي (الافتراضي)',
    descAr: 'الهوية الرياضية الليلية الكلاسيكية بلمسات سماوية',
    priceCoins: 0,
    icon: '🌌',
    bgPrimary: '#070A12',
    bgCard: '#111827',
    bgPanel: '#1B253B',
    borderColor: '#28354E',
    accentColor: '#4FF5D2',
  },
  {
    id: 'obsidian_gold',
    nameAr: 'ثيم الفخامة الذهبية (Obsidian Gold)',
    descAr: 'خلفية داكنة ملكية مع ألواح وحدود ذهبية دافئة',
    priceCoins: 160,
    icon: '✨',
    bgPrimary: '#0C0A06',
    bgCard: '#18140C',
    bgPanel: '#262014',
    borderColor: '#4A3B1C',
    accentColor: '#FFD166',
  },
  {
    id: 'emerald_matrix',
    nameAr: 'ثيم المصفوفة الزمردية (Emerald Matrix)',
    descAr: 'طابع رقمي زمردي يريح العين ويرفع التركيز الذهني',
    priceCoins: 220,
    icon: '🧪',
    bgPrimary: '#040D0A',
    bgCard: '#0B1D17',
    bgPanel: '#132E25',
    borderColor: '#1E4638',
    accentColor: '#38D9A9',
  },
  {
    id: 'violet_nebula',
    nameAr: 'ثيم السديم البنفسجي (Violet Nebula)',
    descAr: 'أجواء فضائية بنفسجية عميقة لمواجهات المحترفين',
    priceCoins: 280,
    icon: '🔮',
    bgPrimary: '#090614',
    bgCard: '#150F2A',
    bgPanel: '#221842',
    borderColor: '#382868',
    accentColor: '#A78BFA',
  },
];

export interface CountryOption {
  code: string;
  dialCode: string;
  flag: string;
  nameAr: string;
  nameEn: string;
}

export const WORLD_COUNTRIES: CountryOption[] = [
  { code: 'SA', dialCode: '+966', flag: '🇸🇦', nameAr: 'المملكة العربية السعودية', nameEn: 'Saudi Arabia' },
  { code: 'YE', dialCode: '+967', flag: '🇾🇪', nameAr: 'اليمن', nameEn: 'Yemen' },
  { code: 'EG', dialCode: '+20', flag: '🇪🇬', nameAr: 'مصر', nameEn: 'Egypt' },
  { code: 'AE', dialCode: '+971', flag: '🇦🇪', nameAr: 'الإمارات العربية المتحدة', nameEn: 'United Arab Emirates' },
  { code: 'KW', dialCode: '+965', flag: '🇰🇼', nameAr: 'الكويت', nameEn: 'Kuwait' },
  { code: 'QA', dialCode: '+974', flag: '🇶🇦', nameAr: 'قطر', nameEn: 'Qatar' },
  { code: 'BH', dialCode: '+973', flag: '🇧🇭', nameAr: 'البحرين', nameEn: 'Bahrain' },
  { code: 'OM', dialCode: '+968', flag: '🇴🇲', nameAr: 'سلطنة عُمان', nameEn: 'Oman' },
  { code: 'JO', dialCode: '+962', flag: '🇯🇴', nameAr: 'الأردن', nameEn: 'Jordan' },
  { code: 'IQ', dialCode: '+964', flag: '🇮🇶', nameAr: 'العراق', nameEn: 'Iraq' },
  { code: 'PS', dialCode: '+970', flag: '🇵🇸', nameAr: 'فلسطين', nameEn: 'Palestine' },
  { code: 'SY', dialCode: '+963', flag: '🇸🇾', nameAr: 'سوريا', nameEn: 'Syria' },
  { code: 'LB', dialCode: '+961', flag: '🇱🇧', nameAr: 'لبنان', nameEn: 'Lebanon' },
  { code: 'SD', dialCode: '+249', flag: '🇸🇩', nameAr: 'السودان', nameEn: 'Sudan' },
  { code: 'LY', dialCode: '+218', flag: '🇱🇾', nameAr: 'ليبيا', nameEn: 'Libya' },
  { code: 'TN', dialCode: '+216', flag: '🇹🇳', nameAr: 'تونس', nameEn: 'Tunisia' },
  { code: 'DZ', dialCode: '+213', flag: '🇩🇿', nameAr: 'الجزائر', nameEn: 'Algeria' },
  { code: 'MA', dialCode: '+212', flag: '🇲🇦', nameAr: 'المغرب', nameEn: 'Morocco' },
  { code: 'MR', dialCode: '+222', flag: '🇲🇷', nameAr: 'موريتانيا', nameEn: 'Mauritania' },
  { code: 'SO', dialCode: '+252', flag: '🇸🇴', nameAr: 'الصومال', nameEn: 'Somalia' },
  { code: 'DJ', dialCode: '+253', flag: '🇩🇯', nameAr: 'جيبوتي', nameEn: 'Djibouti' },
  { code: 'KM', dialCode: '+269', flag: '🇰🇲', nameAr: 'جزر القمر', nameEn: 'Comoros' },
  { code: 'TR', dialCode: '+90', flag: '🇹🇷', nameAr: 'تركيا', nameEn: 'Turkey' },
  { code: 'PK', dialCode: '+92', flag: '🇵🇰', nameAr: 'باكستان', nameEn: 'Pakistan' },
  { code: 'MY', dialCode: '+60', flag: '🇲🇾', nameAr: 'ماليزيا', nameEn: 'Malaysia' },
  { code: 'ID', dialCode: '+62', flag: '🇮🇩', nameAr: 'إندونيسيا', nameEn: 'Indonesia' },
  { code: 'US', dialCode: '+1', flag: '🇺🇸', nameAr: 'الولايات المتحدة', nameEn: 'United States' },
  { code: 'GB', dialCode: '+44', flag: '🇬🇧', nameAr: 'المملكة المتحدة', nameEn: 'United Kingdom' },
  { code: 'FR', dialCode: '+33', flag: '🇫🇷', nameAr: 'فرنسا', nameEn: 'France' },
  { code: 'DE', dialCode: '+49', flag: '🇩🇪', nameAr: 'ألمانيا', nameEn: 'Germany' },
  { code: 'ES', dialCode: '+34', flag: '🇪🇸', nameAr: 'إسبانيا', nameEn: 'Spain' },
  { code: 'IT', dialCode: '+39', flag: '🇮🇹', nameAr: 'إيطاليا', nameEn: 'Italy' },
  { code: 'CA', dialCode: '+1', flag: '🇨🇦', nameAr: 'كندا', nameEn: 'Canada' },
  { code: 'AU', dialCode: '+61', flag: '🇦🇺', nameAr: 'أستراليا', nameEn: 'Australia' },
  { code: 'BR', dialCode: '+55', flag: '🇧🇷', nameAr: 'البرازيل', nameEn: 'Brazil' },
  { code: 'AR', dialCode: '+54', flag: '🇦🇷', nameAr: 'الأرجنتين', nameEn: 'Argentina' },
  { code: 'JP', dialCode: '+81', flag: '🇯🇵', nameAr: 'اليابان', nameEn: 'Japan' },
  { code: 'KR', dialCode: '+82', flag: '🇰🇷', nameAr: 'كوريا الجنوبية', nameEn: 'South Korea' },
  { code: 'CN', dialCode: '+86', flag: '🇨🇳', nameAr: 'الصين', nameEn: 'China' },
  { code: 'IN', dialCode: '+91', flag: '🇮🇳', nameAr: 'الهند', nameEn: 'India' },
];

export interface RankTierInfo {
  level: number;
  minXp: number;
  maxXp: number;
  titleAr: string;
  titleEn: string;
  icon: string;
  color: string;
}

export const LEVEL_RANKS: RankTierInfo[] = [
  { level: 1, minXp: 0, maxXp: 250, titleAr: 'مبتدئ طموح 🌱', titleEn: 'Ambitious Rookie 🌱', icon: '🌱', color: '#38D9A9' },
  { level: 2, minXp: 250, maxXp: 650, titleAr: 'مقاتل ذكي ⚡', titleEn: 'Clever Challenger ⚡', icon: '⚡', color: '#4FF5D2' },
  { level: 3, minXp: 650, maxXp: 1400, titleAr: 'خبير الميدان 🛡️', titleEn: 'Arena Tactician 🛡️', icon: '🛡️', color: '#60A5FA' },
  { level: 4, minXp: 1400, maxXp: 2600, titleAr: 'نخبة المحترفين 🔥', titleEn: 'Elite Master 🔥', icon: '🔥', color: '#A78BFA' },
  { level: 5, minXp: 2600, maxXp: 4500, titleAr: 'عبقري البطولات 💎', titleEn: 'Grandmaster 💎', icon: '💎', color: '#F472B6' },
  { level: 6, minXp: 4500, maxXp: 10000, titleAr: 'أسطورة الساحة 👑', titleEn: 'Arena Legend 👑', icon: '👑', color: '#FFD166' },
];

export function computeLevelInfo(xp: number): {
  currentRank: RankTierInfo;
  nextRank: RankTierInfo | null;
  progressPercent: number;
} {
  let current = LEVEL_RANKS[0];
  for (const r of LEVEL_RANKS) {
    if (xp >= r.minXp) {
      current = r;
    }
  }
  const nextIdx = LEVEL_RANKS.findIndex(r => r.level === current.level) + 1;
  const nextRank = nextIdx < LEVEL_RANKS.length ? LEVEL_RANKS[nextIdx] : null;
  if (!nextRank) {
    return { currentRank: current, nextRank: null, progressPercent: 100 };
  }
  const span = nextRank.minXp - current.minXp;
  const progressed = xp - current.minXp;
  const progressPercent = Math.max(0, Math.min(100, Math.round((progressed / span) * 100)));
  return { currentRank: current, nextRank, progressPercent };
}

export interface CategoryDefinition {
  id: CategoryId;
  icon: string;
  nameAr: string;
  nameEn: string;
  descAr: string;
  isFeaturedGold?: boolean;
  accentColor: string;
}

export const QUIZ_CATEGORIES: CategoryDefinition[] = [
  {
    id: 'quran',
    icon: '📖',
    nameAr: 'مسابقة القرآن الكريم',
    nameEn: 'Holy Quran Quiz',
    descAr: 'سور، آيات، أحكام وتدبر في كتاب الله العزيز',
    isFeaturedGold: true,
    accentColor: '#FFD166',
  },
  {
    id: 'islamic',
    icon: '🕌',
    nameAr: 'إسلاميات',
    nameEn: 'Islamic Studies',
    descAr: 'السيرة النبوية، الصحابة، الفقه والتاريخ الإسلامي',
    accentColor: '#10B981',
  },
  {
    id: 'arabic',
    icon: '✒️',
    nameAr: 'اللغة العربية',
    nameEn: 'Arabic Language',
    descAr: 'النحو، البلاغة، الشعر، ومعاني المفردات',
    accentColor: '#A78BFA',
  },
  {
    id: 'science',
    icon: '🧬',
    nameAr: 'العلوم',
    nameEn: 'General Science',
    descAr: 'الأحياء، الكيمياء، الفلك وجسم الإنسان',
    accentColor: '#4FF5D2',
  },
  {
    id: 'history',
    icon: '🏛️',
    nameAr: 'التاريخ',
    nameEn: 'World History',
    descAr: 'الحضارات القديمة، المعارك، والأحداث التاريخية',
    accentColor: '#F59E0B',
  },
  {
    id: 'geography',
    icon: '🌍',
    nameAr: 'الجغرافيا',
    nameEn: 'Geography',
    descAr: 'القارات، الأنهار، الجبال، والمضايق العالمية',
    accentColor: '#38BDF8',
  },
  {
    id: 'capitals',
    icon: '🏳️',
    nameAr: 'بلدان وعواصم',
    nameEn: 'Countries & Capitals',
    descAr: 'عواصم الدول، العملات، والأعلام الدولية',
    accentColor: '#FB7185',
  },
  {
    id: 'math',
    icon: '📐',
    nameAr: 'الرياضيات',
    nameEn: 'Mathematics',
    descAr: 'الحساب الذهني السريع، الجبر، والهندسة',
    accentColor: '#818CF8',
  },
  {
    id: 'physics',
    icon: '⚛️',
    nameAr: 'الفيزياء',
    nameEn: 'Physics',
    descAr: 'القوانين الفيزيائية، الطاقة، الحركة والكهرباء',
    accentColor: '#34D399',
  },
  {
    id: 'sports',
    icon: '⚽',
    nameAr: 'الرياضة',
    nameEn: 'Sports & Football',
    descAr: 'كرة القدم العربية والعالمية، كأس العالم، والألعاب الأولمبية',
    accentColor: '#22C55E',
  },
  {
    id: 'cocktail',
    icon: '🎲',
    nameAr: 'كوكتيل شامل',
    nameEn: 'All-in-One Cocktail',
    descAr: 'تحدي متنوع يجمع كافة الأقسام المعرفية',
    accentColor: '#4FF5D2',
  },
];

export interface AchievementDefinition {
  id: string;
  icon: string;
  titleAr: string;
  titleEn: string;
  descAr: string;
  rewardCoins: number;
}

export const ACHIEVEMENTS_LIST: AchievementDefinition[] = [
  {
    id: 'first_win',
    icon: '🏆',
    titleAr: 'أول انتصار',
    titleEn: 'First Victory',
    descAr: 'تحقيق أول فوز في الساحة التنافسية',
    rewardCoins: 15,
  },
  {
    id: 'correct_100',
    icon: '🎯',
    titleAr: '100 إجابة صحيحة',
    titleEn: '100 Correct Answers',
    descAr: 'الوصول إلى 100 إجابة صحيحة في المباريات',
    rewardCoins: 15,
  },
  {
    id: 'wins_10',
    icon: '⚔️',
    titleAr: '10 انتصارات',
    titleEn: '10 Victories',
    descAr: 'الفوز في 10 مباريات تنافسية',
    rewardCoins: 15,
  },
  {
    id: 'combo_10',
    icon: '🔥',
    titleAr: 'كومبو 10',
    titleEn: '10x Combo Streak',
    descAr: 'تحقيق سلسلة 10 إجابات صحيحة متتالية',
    rewardCoins: 15,
  },
  {
    id: 'golden_10',
    icon: '🌟',
    titleAr: '10 إجابات ذهبية',
    titleEn: '10 Golden Answers',
    descAr: 'الإجابة بشكل صحيح على 10 أسئلة ذهبية حاسمة (+2)',
    rewardCoins: 15,
  },
  {
    id: 'answers_500',
    icon: '📚',
    titleAr: '500 إجابة',
    titleEn: '500 Total Answers',
    descAr: 'الإجابة على 500 سؤال صحيح في الساحة',
    rewardCoins: 15,
  },
  {
    id: 'rating_1500',
    icon: '👑',
    titleAr: 'تصنيف 1500',
    titleEn: '1500 Rating Club',
    descAr: 'الوصول إلى تصنيف تنافسي 1500 نقطة أو أعلى',
    rewardCoins: 15,
  },
  {
    id: 'draws_5',
    icon: '⚖️',
    titleAr: '5 تعادلات',
    titleEn: '5 Fierce Draws',
    descAr: 'خوض 5 مباريات وصلت إلى التعادل أو السؤال الفاصل',
    rewardCoins: 15,
  },
];

export interface VipPackageDefinition {
  id: VipTier;
  nameAr: string;
  nameEn: string;
  badge: string;
  priceCoins: number;
  priceUsdText: string;
  instantCoins: number;
  freeLifelinesEach: number;
  dailyMultiplier: number;
  removeAds: boolean;
  perksAr: string[];
  accentColor: string;
}

export const VIP_PACKAGES: VipPackageDefinition[] = [
  {
    id: 'basic',
    nameAr: 'الباقة الأساسية (مجاناً)',
    nameEn: 'Basic Tier (Free)',
    badge: '🛡️',
    priceCoins: 0,
    priceUsdText: 'مجاناً',
    instantCoins: 0,
    freeLifelinesEach: 0,
    dailyMultiplier: 1,
    removeAds: false,
    perksAr: ['دخول كافة أقسام المسابقات', 'مكافأة دخول يومي قياسية', 'المشاركة في البطولة الشهرية'],
    accentColor: '#94A3B8',
  },
  {
    id: 'bronze',
    nameAr: 'الباقة البرونزية VIP',
    nameEn: 'Bronze VIP',
    badge: '🥉',
    priceCoins: 400,
    priceUsdText: '$2.99',
    instantCoins: 150,
    freeLifelinesEach: 1,
    dailyMultiplier: 2,
    removeAds: true,
    perksAr: ['إزالة الإعلانات بالكامل', 'شارة برونزية 🥉 بجانب الاسم', '+150 عملة فورية + 1 من كل مساعدة', 'مضاعفة مكافأة الدخول اليومي (2x)'],
    accentColor: '#D97706',
  },
  {
    id: 'silver',
    nameAr: 'الباقة الفضية VIP',
    nameEn: 'Silver VIP',
    badge: '🥈',
    priceCoins: 800,
    priceUsdText: '$5.99',
    instantCoins: 350,
    freeLifelinesEach: 2,
    dailyMultiplier: 2,
    removeAds: true,
    perksAr: ['إزالة الإعلانات بالكامل', 'شارة فضية 🥈 بجانب الاسم', '+350 عملة فورية + 2 من كل مساعدة', 'مضاعفة مكافأة الدخول اليومي (2x)'],
    accentColor: '#E2E8F0',
  },
  {
    id: 'royal_gold',
    nameAr: 'الباقة الملكية الذهبية 👑',
    nameEn: 'Royal Gold VIP 👑',
    badge: '👑',
    priceCoins: 1400,
    priceUsdText: '$9.99',
    instantCoins: 750,
    freeLifelinesEach: 4,
    dailyMultiplier: 3,
    removeAds: true,
    perksAr: ['إزالة الإعلانات الفورية للأبد', 'التاج الملكي الذهبي 👑 بجانب الاسم', '+750 عملة فورية + 4 من كل مساعدة', 'مضاعفة مكافأة الدخول اليومي (3x)'],
    accentColor: '#FFD166',
  },
];

export const MONTHLY_PRIZES = [
  { rank: 1, icon: '📱', titleAr: 'المركز الأول: آيفون 16 برو ماكس', titleEn: '1st Place: iPhone 16 Pro Max', color: '#FFD166' },
  { rank: 2, icon: '💻', titleAr: 'المركز الثاني: لابتوب احترافي للألعاب', titleEn: '2nd Place: Gaming Laptop', color: '#E2E8F0' },
  { rank: 3, icon: '🎮', titleAr: 'المركز الثالث: بلايستيشن 5 برو', titleEn: '3rd Place: PlayStation 5 Pro', color: '#F59E0B' },
  { rank: 4, icon: '📟', titleAr: 'المركز الرابع: آيباد إير حديث', titleEn: '4th Place: iPad Air', color: '#4FF5D2' },
  { rank: 5, icon: '📺', titleAr: 'المركز الخامس: شاشة تلفاز ذكية 4K', titleEn: '5th Place: 4K Smart TV', color: '#A78BFA' },
];

export const REALISTIC_HUMAN_LEADERBOARD_SEED = [
  { uid: 'h_1', playerId: '#9182736450', username: 'عبدالرحمن_الغامدي', countryFlag: '🇸🇦', monthlyPoints: 68, rating: 1640, vipTier: 'royal_gold' as VipTier, level: 6 },
  { uid: 'h_2', playerId: '#8273645192', username: 'صقر_اليمن', countryFlag: '🇾🇪', monthlyPoints: 61, rating: 1590, vipTier: 'silver' as VipTier, level: 5 },
  { uid: 'h_3', playerId: '#7364519283', username: 'أحمد_القاهرة', countryFlag: '🇪🇬', monthlyPoints: 54, rating: 1535, vipTier: 'royal_gold' as VipTier, level: 5 },
  { uid: 'h_4', playerId: '#6451928374', username: 'سيف_الإمارات', countryFlag: '🇦🇪', monthlyPoints: 49, rating: 1495, vipTier: 'bronze' as VipTier, level: 4 },
  { uid: 'h_5', playerId: '#5192837465', username: 'نور_الهدى', countryFlag: '🇸🇦', monthlyPoints: 42, rating: 1450, vipTier: 'silver' as VipTier, level: 4 },
  { uid: 'h_6', playerId: '#4918273611', username: 'طارق_الشمري', countryFlag: '🇰🇼', monthlyPoints: 36, rating: 1410, vipTier: 'basic' as VipTier, level: 3 },
  { uid: 'h_7', playerId: '#3829104756', username: 'عمر_المقدسي', countryFlag: '🇵🇸', monthlyPoints: 31, rating: 1380, vipTier: 'bronze' as VipTier, level: 3 },
  { uid: 'h_8', playerId: '#2718394650', username: 'ريم_العنزي', countryFlag: '🇶🇦', monthlyPoints: 25, rating: 1340, vipTier: 'basic' as VipTier, level: 3 },
  { uid: 'h_9', playerId: '#1928374609', username: 'ياسين_المغربي', countryFlag: '🇲🇦', monthlyPoints: 19, rating: 1290, vipTier: 'basic' as VipTier, level: 2 },
  { uid: 'h_10', playerId: '#1092837461', username: 'حمزة_الأردني', countryFlag: '🇯🇴', monthlyPoints: 14, rating: 1245, vipTier: 'basic' as VipTier, level: 2 },
];

export const BOT_OPPONENTS_POOL = [
  { name: 'آلي: الفارس الذكي', flag: '🤖' },
  { name: 'آلي: العقل الرقمي', flag: '🤖' },
  { name: 'آلي: صقر المعرفة', flag: '🤖' },
  { name: 'آلي: النخبة الآلي', flag: '🤖' },
  { name: 'آلي: المحلل السريع', flag: '🤖' },
  { name: 'آلي: عبقري الساحة', flag: '🤖' },
];

export const LANGUAGE_LABELS: Record<LanguageCode, { name: string; dir: 'rtl' | 'ltr'; flag: string }> = {
  ar: { name: 'العربية', dir: 'rtl', flag: '🇸🇦' },
  en: { name: 'English', dir: 'ltr', flag: '🇬🇧' },
  fr: { name: 'Français', dir: 'ltr', flag: '🇫🇷' },
  es: { name: 'Español', dir: 'ltr', flag: '🇪🇸' },
  tr: { name: 'Türkçe', dir: 'ltr', flag: '🇹🇷' },
  ur: { name: 'اردو', dir: 'rtl', flag: '🇵🇰' },
};

export const UI_TRANSLATIONS: Record<LanguageCode, Record<string, string>> = {
  ar: {
    arena: 'الساحة',
    store: 'المتجر والمكافآت',
    leaderboard: 'البطولة والجوائز',
    friends: 'الأصدقاء والدردشة',
    achievements: 'الأوسمة والسجل',
    settings: 'الإعدادات',
    welcomeBack: 'مرحباً بعودتك يا بطل الساحة',
    onlineMode: 'لعب أونلاين (كوكتيل شامل 🌍)',
    localMode: 'لعب مع صديق بجانبك 👥',
    soloMode: 'لعب أوفلاين بمفردك 🎯',
    privateRoom: 'تحدي الغرف الخاصة (كود 4 أرقام 🏠)',
    fairPlay: 'النزاهة',
    coins: 'عملة ذهبية',
    monthlyPoints: 'نقاط الشهر',
    copyId: 'نسخ المعرّف',
    copied: 'تم النسخ!',
  },
  en: {
    arena: 'Arena',
    store: 'Store & Rewards',
    leaderboard: 'Tournament & Prizes',
    friends: 'Friends & Chat',
    achievements: 'Badges & History',
    settings: 'Settings',
    welcomeBack: 'Welcome back to the Arena',
    onlineMode: 'Online Match (All-in-One 🌍)',
    localMode: 'Local Pass & Play 👥',
    soloMode: 'Solo Offline Practice 🎯',
    privateRoom: 'Private Room (4-Digit Code 🏠)',
    fairPlay: 'Fair Play',
    coins: 'Gold Coins',
    monthlyPoints: 'Monthly Pts',
    copyId: 'Copy ID',
    copied: 'Copied!',
  },
  fr: {
    arena: 'Arène',
    store: 'Boutique & Bonus',
    leaderboard: 'Tournoi & Prix',
    friends: 'Amis & Chat',
    achievements: 'Badges & Historique',
    settings: 'Paramètres',
    welcomeBack: 'Bienvenue dans l’Arène',
    onlineMode: 'Match En Ligne (Cocktail 🌍)',
    localMode: 'Pass & Play Local 👥',
    soloMode: 'Entraînement Solo 🎯',
    privateRoom: 'Salon Privé (Code 4 chiffres 🏠)',
    fairPlay: 'Fair-Play',
    coins: 'Pièces d’Or',
    monthlyPoints: 'Pts du Mois',
    copyId: 'Copier ID',
    copied: 'Copié !',
  },
  es: {
    arena: 'Arena',
    store: 'Tienda y Premios',
    leaderboard: 'Torneo y Trofeos',
    friends: 'Amigos y Chat',
    achievements: 'Logros e Historial',
    settings: 'Ajustes',
    welcomeBack: 'Bienvenido de nuevo a la Arena',
    onlineMode: 'Partida Online (Cóctel 🌍)',
    localMode: 'Jugar con Amigo Local 👥',
    soloMode: 'Práctica Solo Offline 🎯',
    privateRoom: 'Sala Privada (Código 4 dígitos 🏠)',
    fairPlay: 'Juego Limpio',
    coins: 'Monedas de Oro',
    monthlyPoints: 'Pts del Mes',
    copyId: 'Copiar ID',
    copied: '¡Copiado!',
  },
  tr: {
    arena: 'Arena',
    store: 'Mağaza ve Ödüller',
    leaderboard: 'Turnuva ve Ödüller',
    friends: 'Arkadaşlar ve Sohbet',
    achievements: 'Rozetler ve Geçmiş',
    settings: 'Ayarlar',
    welcomeBack: 'Arenaya Tekrar Hoş Geldin',
    onlineMode: 'Online Maç (Genel Kültür 🌍)',
    localMode: 'Yanındaki Arkadaşla Oyna 👥',
    soloMode: 'Tek Başına Antrenman 🎯',
    privateRoom: 'Özel Oda (4 Haneli Kod 🏠)',
    fairPlay: 'Adil Oyun',
    coins: 'Altın Para',
    monthlyPoints: 'Aylık Puan',
    copyId: 'ID Kopyala',
    copied: 'Kopyalandı!',
  },
  ur: {
    arena: 'میدان',
    store: 'اسٹور اور انعامات',
    leaderboard: 'ٹورنامنٹ اور انعامات',
    friends: 'دوست اور چیٹ',
    achievements: 'تمغے اور ریکارڈ',
    settings: 'ترتیبات',
    welcomeBack: 'میدان میں خوش آمدید',
    onlineMode: 'آن لائن مقابلہ (مجموعی کوئز 🌍)',
    localMode: 'دوست کے ساتھ کھیلیں 👥',
    soloMode: 'آف لائن مشق 🎯',
    privateRoom: 'نجی کمرہ (4 ہندسوں کا کوڈ 🏠)',
    fairPlay: 'منصفانہ کھیل',
    coins: 'سونے کے سکے',
    monthlyPoints: 'ماہانہ پوائنٹس',
    copyId: 'آئی ڈی کاپی کریں',
    copied: 'کاپی ہو گیا!',
  },
};
