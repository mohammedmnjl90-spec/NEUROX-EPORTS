import React, { useState } from 'react';
import { computeLevelInfo, LEVEL_RANKS, VIP_PACKAGES } from '../data/constants';
import { LanguageCode, PlayerAccount } from '../types';
import { getLocalizedRankTitle } from '../utils/i18n';
import { soundFX } from '../utils/sound';
import {
  ArrowLeft,
  ArrowRight,
  Award,
  BellRing,
  BookOpen,
  Bot,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Copy,
  Crown,
  Flame,
  Gamepad2,
  Globe,
  Hash,
  Home,
  Layers,
  Lock,
  Radio,
  Search,
  Share2,
  ShieldCheck,
  Smartphone,
  Snowflake,
  Sparkles,
  Star,
  Swords,
  Target,
  Timer,
  Trophy,
  UserCheck,
  Users,
  Zap,
} from 'lucide-react';

interface HelpViewProps {
  account: PlayerAccount;
  onBackToSettings: () => void;
  onGoToArena: () => void;
  onGoToFriends: () => void;
}

type HelpSectionTab = 'gameplay' | 'friends' | 'scoring';

interface HelpTranslations {
  pageTitle: string;
  pageSubtitle: string;
  backToSettingsBtn: string;
  startPlayingNowBtn: string;
  goToFriendsBtn: string;
  tabGameplay: string;
  tabFriends: string;
  tabScoring: string;

  // Visual Diagrams & Illustrations Labels
  visualMatchFlowTitle: string;
  visualMatchFlowSub: string;
  diagramRound1: string;
  diagramRound1Sub: string;
  diagramRound2: string;
  diagramRound2Sub: string;
  diagramRound3: string;
  diagramRound3Sub: string;
  diagramVictory: string;
  diagramVictorySub: string;
  hudPreviewTitle: string;
  hudPreviewSub: string;
  hudSampleQuestion: string;
  hudSampleOpt1: string;
  hudSampleOpt2: string;
  hudSampleOpt3: string;
  hudSampleOpt4: string;
  hudGoldenTag: string;
  hudTimerTag: string;

  friendsDiagramTitle: string;
  friendsDiagramSub: string;
  diagStep1Label: string;
  diagStep1Tag: string;
  diagStep2Label: string;
  diagStep2Tag: string;
  diagStep3Label: string;
  diagStep3Tag: string;
  diagStep4Label: string;
  diagStep4Tag: string;

  scoringDiagramTitle: string;
  scoringDiagramSub: string;
  eqBaseLabel: string;
  eqSpeedLabel: string;
  eqComboLabel: string;
  eqGoldenLabel: string;
  eqTotalLabel: string;
  eqMaxPtsNote: string;
  rankLadderVisualTitle: string;

  // Section 1: How to Play
  gameplayHeroTitle: string;
  gameplayHeroDesc: string;
  ruleRoundsTitle: string;
  ruleRoundsDesc: string;
  ruleTimerTitle: string;
  ruleTimerDesc: string;
  ruleGoldenTitle: string;
  ruleGoldenDesc: string;
  ruleNoRepeatTitle: string;
  ruleNoRepeatDesc: string;
  modesSectionTitle: string;
  modeOnlineTitle: string;
  modeOnlineDesc: string;
  modeRoomTitle: string;
  modeRoomDesc: string;
  modeLocalTitle: string;
  modeLocalDesc: string;
  modeSoloTitle: string;
  modeSoloDesc: string;
  lifelinesTitle: string;
  lifelinesSub: string;
  lifeline5050Title: string;
  lifeline5050Desc: string;
  lifelineFreezeTitle: string;
  lifelineFreezeDesc: string;
  lifelineAutoTitle: string;
  lifelineAutoDesc: string;

  // Section 2: How to Challenge Friends
  friendsHeroTitle: string;
  friendsHeroDesc: string;
  yourIdLabel: string;
  copyIdBtn: string;
  copiedText: string;
  step1Title: string;
  step1Desc: string;
  step2Title: string;
  step2Desc: string;
  step3Title: string;
  step3Desc: string;
  step4Title: string;
  step4Desc: string;
  fairPlayNoteTitle: string;
  fairPlayNoteDesc: string;

  // Section 3: Points, Levels & Ranks
  scoringHeroTitle: string;
  scoringHeroDesc: string;
  formulaSectionTitle: string;
  formulaBaseTitle: string;
  formulaBaseDesc: string;
  formulaSpeedTitle: string;
  formulaSpeedDesc: string;
  formulaComboTitle: string;
  formulaComboDesc: string;
  formulaGoldenTitle: string;
  formulaGoldenDesc: string;
  rewardsBreakdownTitle: string;
  rewardWinTitle: string;
  rewardWinDesc: string;
  rewardDrawTitle: string;
  rewardDrawDesc: string;
  rewardForfeitTitle: string;
  rewardForfeitDesc: string;
  levelsTableTitle: string;
  levelsTableSub: string;
  yourCurrentRankBadge: string;
  completedRankBadge: string;
  upcomingRankBadge: string;
  vipMultiplierTitle: string;
  vipMultiplierSub: string;
  vipBonusLabel: string;
}

const HELP_I18N: Record<LanguageCode, HelpTranslations> = {
  ar: {
    pageTitle: '📖 دليل التعليمات الشامل وقوانين الساحة',
    pageSubtitle:
      'تعرّف بالرسوم التوضيحية والأيقونات على طريقة اللعب، خطوات تحدي الأصدقاء بالـ #ID والغرف الخاصة، ونظام احتساب النقاط والمستويات.',
    backToSettingsBtn: 'العودة للإعدادات',
    startPlayingNowBtn: 'انتقل إلى الساحة الآن ⚔️',
    goToFriendsBtn: 'انتقل لقسم الأصدقاء 👥',
    tabGameplay: '🎮 طريقة اللعب والأطوار',
    tabFriends: '👥 كيفية تحدي الأصدقاء',
    tabScoring: '🏆 نظام النقاط والمستويات',

    visualMatchFlowTitle: '🗺️ مخطط توضيحي لمسار المباراة التنافسية',
    visualMatchFlowSub: 'من صافرة البداية وحتى حسم اللقب عبر 3 جولات متتالية',
    diagramRound1: 'الجولة الأولى',
    diagramRound1Sub: '7 أسئلة + سؤال ذهبي (2×)',
    diagramRound2: 'الجولة الثانية',
    diagramRound2Sub: '7 أسئلة + سؤال ذهبي (2×)',
    diagramRound3: 'الجولة الحاسمة',
    diagramRound3Sub: 'حسم النقاط والسؤال الفاصل',
    diagramVictory: 'منصة التتويج',
    diagramVictorySub: '+نقاط بطولة وعملات وتصنيف',
    hudPreviewTitle: '📱 رسم توضيحي لواجهة السؤال أثناء اللعب',
    hudPreviewSub: 'محاكاة بصرية لشريط الوقت، السؤال الذهبي، ووسائل المساعدة',
    hudSampleQuestion: 'ما هي السورة التي تعدل ثلث القرآن الكريم؟',
    hudSampleOpt1: 'سورة الإخلاص ✓',
    hudSampleOpt2: 'سورة الفلق',
    hudSampleOpt3: 'سورة الملك',
    hudSampleOpt4: 'سورة الكهف',
    hudGoldenTag: '🌟 السؤال الذهبي رقم 8 (نقاط مضاعفة 2×)',
    hudTimerTag: '⏱️ عداد 6 ثوانٍ',

    friendsDiagramTitle: '🔗 المخطط التوضيحي لخطوات تحدي الأصدقاء (4 خطوات)',
    friendsDiagramSub: 'اتصال مباشر 100% بين اللاعبين الحقيقيين بدون أي بوتات',
    diagStep1Label: '1. شارك أو ابحث بالـ #ID',
    diagStep1Tag: 'كود فريد من 10 أرقام',
    diagStep2Label: '2. أنشئ غرفة (4 أرقام)',
    diagStep2Tag: 'نفس الأسئلة والترتيب 100%',
    diagStep3Label: '3. تنبيه فوري بالخلفية',
    diagStep3Tag: 'جرس صوتي وإشعار محلي',
    diagStep4Label: '4. العب وقيّم الروح الرياضية',
    diagStep4Tag: 'تقييم 1–5 نجوم وأوسمة',

    scoringDiagramTitle: '📐 الرسم التوضيحي لمعادلة احتساب نقاط السؤال',
    scoringDiagramSub: 'كيف تجمع أكبر عدد من النقاط في كل سؤال؟',
    eqBaseLabel: 'نقاط أساسية',
    eqSpeedLabel: 'مكافأة السرعة',
    eqComboLabel: 'سلسلة الكومبو',
    eqGoldenLabel: 'السؤال الذهبي',
    eqTotalLabel: 'إجمالي نقاط السؤال',
    eqMaxPtsNote: 'إجابة صحيحة سريعة في السؤال الذهبي تمنحك أكثر من 370+ نقطة دفعة واحدة!',
    rankLadderVisualTitle: '📈 مسار الترقي البصري عبر الرتب الـ 6',

    gameplayHeroTitle: '⚔️ كيف تُلعب المباريات في NEUROX ESPORTS؟',
    gameplayHeroDesc:
      'تعتمد كل مواجهة على السرعة والدقة المعرفية في 11 قسماً ثقافياً وعلمياً متجدداً، مع نظام صارم لمنع تكرار الأسئلة.',
    ruleRoundsTitle: '3 جولات حاسمة (8 أسئلة للجولة)',
    ruleRoundsDesc:
      'تتكون كل مباراة من 3 جولات، وفي كل جولة 8 أسئلة متتالية (إجمالي 24 سؤالاً في المباراة). الفائز بأغلب الجولات ومجموع النقاط يحسم اللقاء.',
    ruleTimerTitle: '6 ثوانٍ فقط لكل سؤال ⏱️',
    ruleTimerDesc:
      'لديك 6 ثوانٍ للإجابة على كل سؤال. كلما أجبت في وقت أسرع حصلت على نقاط سرعة إضافية أعلى تفوق خصمك.',
    ruleGoldenTitle: 'السؤال الذهبي (السؤال رقم 8) 🌟',
    ruleGoldenDesc:
      'السؤال الأخير في كل جولة هو سؤال ذهبي يمنح ضعف النقاط (2×)، مما يتيح قلب النتيجة في اللحظة الأخيرة!',
    ruleNoRepeatTitle: 'محرك منع تكرار الأسئلة ✓',
    ruleNoRepeatDesc:
      'يحفظ النظام الأسئلة التي مرت عليك لضمان ظهور أسئلة جديدة ومتنوعة في كل مباراة.',
    modesSectionTitle: '🌐 أطوار اللعب الأربعة المتاحة',
    modeOnlineTitle: '1. لعب أونلاين تنافسي 🌍',
    modeOnlineDesc:
      'مواجهة مباشرة عبر الإنترنت تُحتسب نتائجها في البطولة الشهرية وتصنيف Elo العام.',
    modeRoomTitle: '2. تحدي الغرف الخاصة (كود 4 أرقام) 🏠',
    modeRoomDesc:
      'أنشئ غرفة بكود من 4 أرقام وشاركه مع صديقك لخوض نفس الأسئلة وبنفس الترتيب بدقة 100%.',
    modeLocalTitle: '3. لعب مع صديق بجانبك 👥 (يعمل أوفلاين)',
    modeLocalDesc:
      'لاعبان على نفس الجوال يتناوبان الإجابة في كل سؤال، متاح في أي وقت حتى بدون اتصال بالإنترنت.',
    modeSoloTitle: '4. تدريب فردي أوفلاين 🎯 (يعمل أوفلاين)',
    modeSoloDesc:
      'طور مثالي للتدريب السريع ورفع نقاط الخبرة (XP) وتجربة الأقسام بدون الحاجة للإنترنت.',
    lifelinesTitle: '🛠️ وسائل المساعدة الذكية داخل المباراة (Lifelines)',
    lifelinesSub: 'يمكنك استخدام كل وسيلة مساعدة مرة واحدة في الجولة الواحدة',
    lifeline5050Title: 'حذف إجابتين (50/50)',
    lifeline5050Desc: 'يستبعد خيارين خاطئين فوراً ويبقي الإجابة الصحيحة وخياراً واحداً فقط.',
    lifelineFreezeTitle: 'تجميد الوقت (Freeze ❄️)',
    lifelineFreezeDesc: 'يوقف عداد الـ 6 ثوانٍ مؤقتاً ليمنحك فرصة للتفكير بهدوء دون خسارة مكافأة السرعة.',
    lifelineAutoTitle: 'الحل التلقائي الذكي (🤖)',
    lifelineAutoDesc: 'يختار الإجابة الصحيحة فوراً ويمنحك نقاط السؤال كاملة مع الحفاظ على الـ Combo.',

    friendsHeroTitle: '👥 كيف تضيف أصدقاءك وتتحداهم مباشرة؟',
    friendsHeroDesc:
      'اللعبة خالية تماماً من البوتات في قائمة الأصدقاء؛ جميع الأصدقاء هم لاعبون حقيقيون يمتلكون معرّف #ID فريد.',
    yourIdLabel: 'معرّف اللاعب الفريد الخاص بك (#ID):',
    copyIdBtn: 'نسخ الـ ID الخاص بي',
    copiedText: 'تم النسخ!',
    step1Title: 'الخطوة 1: مشاركة أو البحث بكود الـ #ID',
    step1Desc:
      'انسخ كود الـ #ID المكون من 10 أرقام وأرسله لصديقك، أو أدخل كود صديقك في خانة البحث بقسم "الأصدقاء والدردشة" ليظهر اسمه وعلمه وتضيفه فوراً.',
    step2Title: 'الخطوة 2: إرسال تحدي فوري أو كود غرفة من 4 أرقام',
    step2Desc:
      'اضغط على زر "⚔️ العب معه" بجانب اسم صديقك لإنشاء غرفة تحدي خاصة وإرسال كود الغرفة المكون من 4 أرقام إليه تلقائياً.',
    step3Title: 'الخطوة 3: إشعارات الخلفية الفورية (Local Notifications)',
    step3Desc:
      'عندما يرسل لك صديقك دعوة تحدي، سيصلك تنبيه صوتي وإشعار محلي فوري حتى لو كان التطبيق في الخلفية لتنضم للغرفة بضغطة واحدة.',
    step4Title: 'الخطوة 4: تقييم الروح الرياضية بعد المباراة ⭐',
    step4Desc:
      'بعد انتهاء المباراة الودية، يمكنك تقييم صديقك من 1 إلى 5 نجوم ومنحه وسام روح رياضية (منافس شريف، سرعة بديهة، أخلاق رفيعة، مواجهة ممتعة) يظهر في ملفه الشخصي.',
    fairPlayNoteTitle: '🛡️ حماية النزاهة ومكافحة الغش (Fair-Play 100/100)',
    fairPlayNoteDesc:
      'يقوم النظام بقفل الإجابة فور الاختيار، ورصد النقرات الآلية الأسرع من 120 جزءاً من الثانية، وتوحيد بذرة الأسئلة (Seed) في الغرف الخاصة لضمان عدالة المنافسة 100%.',

    scoringHeroTitle: '🏆 كيف يتم احتساب النقاط والتصنيف والمستويات؟',
    scoringHeroDesc:
      'كل إجابة صحيحة وسريعة تقربك من صدارة البطولة الشهرية وترفع مستواك من مبتدئ طموح إلى أسطورة الساحة.',
    formulaSectionTitle: '🧮 معادلة احتساب نقاط كل سؤال في المباراة',
    formulaBaseTitle: '+100 نقطة أساسية',
    formulaBaseDesc: 'تُمنح فور اختيار الإجابة الصحيحة لأي سؤال قياسي.',
    formulaSpeedTitle: '+12 نقطة لكل ثانية متبقية ⚡',
    formulaSpeedDesc: 'كلما أجبت أسرع قبل انتهاء الـ 6 ثوانٍ زادت مكافأة السرعة (تصل إلى +72 نقطة).',
    formulaComboTitle: '+15 نقطة لكل سلسلة (Combo 🔥)',
    formulaComboDesc: 'الإجابات الصحيحة المتتالية ترفع عداد الكومبو وتمنحك نقاطاً تراكمية إضافية.',
    formulaGoldenTitle: 'مضاعف السؤال الذهبي (2× 🌟)',
    formulaGoldenDesc: 'السؤال الثامن في كل جولة يضاعف مجموع نقاط السؤال والسرعة والكومبو مرتين!',
    rewardsBreakdownTitle: '📊 مكافآت نهاية المباراة والتصنيف (Elo & Coins)',
    rewardWinTitle: 'الفوز بالمباراة 🏆',
    rewardWinDesc: '+35 نقطة بطولة شهرية · +25 نقطة تصنيف Elo · +25 عملة ذهبية 🪙 · +120 XP (تزيد مع باقات VIP).',
    rewardDrawTitle: 'التعادل 🤝',
    rewardDrawDesc: '+12 نقطة بطولة شهرية · +5 نقاط تصنيف Elo · +8 عملات ذهبية 🪙 · +60 XP.',
    rewardForfeitTitle: 'الانسحاب أو الخسارة ⚔️',
    rewardForfeitDesc: 'عند الخسارة تكسب +35 XP للمشاركة، بينما انسحاب الخصم يمنحك فوزاً كاملاً بالانسحاب (+30 نقطة بطولة).',
    levelsTableTitle: '👑 جدول المستويات والرتب الـ 6 (XP Progression)',
    levelsTableSub: 'اجمع نقاط الخبرة (XP) من جميع المباريات والمهام اليومية للترقي في رتب الساحة',
    yourCurrentRankBadge: 'رتبتك الحالية ✓',
    completedRankBadge: 'مكتمل ★',
    upcomingRankBadge: 'الرتبة القادمة 🔒',
    vipMultiplierTitle: '💎 مضاعفات باقات VIP للنقاط والعملات',
    vipMultiplierSub: 'ترقية باقة VIP من المتجر تمنحك مضاعفة دائمة لمكافآت الدخول اليومي والعملات الذهبية',
    vipBonusLabel: 'مضاعف المكافآت',
  },

  en: {
    pageTitle: '📖 Comprehensive Help Guide & Arena Rules',
    pageSubtitle:
      'Visual diagrams and step-by-step guides on gameplay rules, challenging friends by #ID and private rooms, and the scoring & leveling system.',
    backToSettingsBtn: 'Back to Settings',
    startPlayingNowBtn: 'Go to Arena Now ⚔️',
    goToFriendsBtn: 'Go to Friends 👥',
    tabGameplay: '🎮 How to Play & Modes',
    tabFriends: '👥 Challenging Friends',
    tabScoring: '🏆 Points & Levels System',

    visualMatchFlowTitle: '🗺️ Competitive Match Flow Diagram',
    visualMatchFlowSub: 'From kickoff to the championship podium across 3 decisive rounds',
    diagramRound1: 'Round 1',
    diagramRound1Sub: '7 Qs + Golden Q (2×)',
    diagramRound2: 'Round 2',
    diagramRound2Sub: '7 Qs + Golden Q (2×)',
    diagramRound3: 'Final Round 3',
    diagramRound3Sub: 'Decisive Points & Tie-Break',
    diagramVictory: 'Victory Podium',
    diagramVictorySub: '+Tournament Pts, Elo & Coins',
    hudPreviewTitle: '📱 In-Match Question HUD Illustration',
    hudPreviewSub: 'Visual preview of the 6s timer bar, Golden Question badge, and Lifelines',
    hudSampleQuestion: 'Which Surah is equivalent to one-third of the Holy Quran?',
    hudSampleOpt1: 'Surah Al-Ikhlas ✓',
    hudSampleOpt2: 'Surah Al-Falaq',
    hudSampleOpt3: 'Surah Al-Mulk',
    hudSampleOpt4: 'Surah Al-Kahf',
    hudGoldenTag: '🌟 Question #8: Golden Question (2× Double Points)',
    hudTimerTag: '⏱️ 6s Timer',

    friendsDiagramTitle: '🔗 4-Step Friend Challenge Visual Pipeline',
    friendsDiagramSub: '100% direct real-player connection with zero bots',
    diagStep1Label: '1. Share or Search #ID',
    diagStep1Tag: 'Unique 10-digit code',
    diagStep2Label: '2. Create 4-Digit Room',
    diagStep2Tag: '100% identical questions',
    diagStep3Label: '3. Instant Background Alert',
    diagStep3Tag: 'Audio & local notification',
    diagStep4Label: '4. Play & Rate Fair-Play',
    diagStep4Tag: '1–5 Stars & Badges',

    scoringDiagramTitle: '📐 Visual Question Scoring Formula',
    scoringDiagramSub: 'How to maximize your points on every single question',
    eqBaseLabel: 'Base Points',
    eqSpeedLabel: 'Speed Bonus',
    eqComboLabel: 'Combo Streak',
    eqGoldenLabel: 'Golden Q Multiplier',
    eqTotalLabel: 'Total Question Score',
    eqMaxPtsNote: 'A fast correct answer on the Golden Question yields 370+ points in a single turn!',
    rankLadderVisualTitle: '📈 Visual Progression Across All 6 Arena Ranks',

    gameplayHeroTitle: '⚔️ How Do Matches Work in NEUROX ESPORTS?',
    gameplayHeroDesc:
      'Every match tests your speed and knowledge across 11 cultural and scientific categories with an active anti-repeat question engine.',
    ruleRoundsTitle: '3 Decisive Rounds (8 Questions/Round)',
    ruleRoundsDesc:
      'Each match consists of 3 rounds with 8 questions per round (24 questions total). Winning rounds and scoring the highest total points secures victory.',
    ruleTimerTitle: '6 Seconds Per Question ⏱️',
    ruleTimerDesc:
      'You have 6 seconds to answer each question. Answering faster grants higher speed bonus points to outscore your rival.',
    ruleGoldenTitle: 'Golden Question (Question #8) 🌟',
    ruleGoldenDesc:
      'The final question of every round is a Golden Question worth Double Points (2×), enabling dramatic last-second comebacks!',
    ruleNoRepeatTitle: 'Anti-Repeat Question Engine ✓',
    ruleNoRepeatDesc:
      'The system tracks seen questions so you always face fresh questions in every match.',
    modesSectionTitle: '🌐 The 4 Available Game Modes',
    modeOnlineTitle: '1. Competitive Online Match 🌍',
    modeOnlineDesc:
      'Live online battles that count towards the Monthly Tournament and global Elo rating.',
    modeRoomTitle: '2. Private Room Challenge (4-Digit Code) 🏠',
    modeRoomDesc:
      'Generate a 4-digit room code and share it with a friend for 100% identical questions in the exact same order.',
    modeLocalTitle: '3. Local Pass & Play 👥 (Works Offline)',
    modeLocalDesc:
      'Two players on the same device taking turns on every question—available anytime even offline.',
    modeSoloTitle: '4. Solo Offline Practice 🎯 (Works Offline)',
    modeSoloDesc:
      'Ideal for fast training, earning XP, and mastering categories without an internet connection.',
    lifelinesTitle: '🛠️ Smart In-Match Lifelines',
    lifelinesSub: 'Each lifeline can be used once per round during active matches',
    lifeline5050Title: '50/50 Eliminate Two',
    lifeline5050Desc: 'Instantly removes two wrong options, leaving only the correct answer and one decoy.',
    lifelineFreezeTitle: 'Freeze Time (❄️)',
    lifelineFreezeDesc: 'Pauses the 6-second countdown timer so you can think carefully without losing speed bonus.',
    lifelineAutoTitle: 'Smart Auto-Solve (🤖)',
    lifelineAutoDesc: 'Automatically selects the correct answer for full points while preserving your Combo streak.',

    friendsHeroTitle: '👥 How to Add & Challenge Real Friends?',
    friendsHeroDesc:
      'The friends system is 100% bot-free. Every player has a unique 10-digit #ID code for direct lookup and live challenges.',
    yourIdLabel: 'Your Unique Player #ID:',
    copyIdBtn: 'Copy My #ID',
    copiedText: 'Copied!',
    step1Title: 'Step 1: Share or Search by #ID Code',
    step1Desc:
      'Copy your 10-digit #ID code and send it to your friend, or enter their #ID in the Friends & Chat search bar to find and add them.',
    step2Title: 'Step 2: Send an Instant Challenge or 4-Digit Room Code',
    step2Desc:
      'Tap "⚔️ Play" next to your friend’s name to open a private room and automatically send them the 4-digit room invitation.',
    step3Title: 'Step 3: Instant Background Alerts (Local Notifications)',
    step3Desc:
      'When a friend sends you a challenge invite, you receive an audio alert and system notification even if the app is in the background.',
    step4Title: 'Step 4: Post-Match Sportsmanship Rating ⭐',
    step4Desc:
      'After friendly matches, rate your friend from 1 to 5 stars and award a sportsmanship badge that contributes to their profile average.',
    fairPlayNoteTitle: '🛡️ Fair-Play & Anti-Cheat Protection (100/100)',
    fairPlayNoteDesc:
      'Answers lock immediately on tap, sub-120ms automated clicks are blocked, and room seeds guarantee identical questions for both players.',

    scoringHeroTitle: '🏆 How Are Points, Ratings & Levels Calculated?',
    scoringHeroDesc:
      'Every fast, accurate answer boosts your Monthly Tournament standing and advances your rank from Ambitious Rookie to Arena Legend.',
    formulaSectionTitle: '🧮 Per-Question Point Calculation Formula',
    formulaBaseTitle: '+100 Base Points',
    formulaBaseDesc: 'Awarded immediately for selecting the correct answer on any standard question.',
    formulaSpeedTitle: '+12 Points Per Remaining Second ⚡',
    formulaSpeedDesc: 'The faster you answer within the 6-second window, the higher your speed bonus (up to +72 pts).',
    formulaComboTitle: '+15 Points Per Combo Streak 🔥',
    formulaComboDesc: 'Consecutive correct answers build your Combo multiplier for extra bonus points.',
    formulaGoldenTitle: 'Golden Question Multiplier (2× 🌟)',
    formulaGoldenDesc: 'Question #8 in every round doubles your base, speed, and combo points!',
    rewardsBreakdownTitle: '📊 Post-Match Rewards & Elo Rating',
    rewardWinTitle: 'Match Victory 🏆',
    rewardWinDesc: '+35 Monthly Tournament Pts · +25 Elo Rating · +25 Gold Coins 🪙 · +120 XP (boosted by VIP).',
    rewardDrawTitle: 'Match Draw 🤝',
    rewardDrawDesc: '+12 Monthly Tournament Pts · +5 Elo Rating · +8 Gold Coins 🪙 · +60 XP.',
    rewardForfeitTitle: 'Loss or Opponent Forfeit ⚔️',
    rewardForfeitDesc: 'Losses still grant +35 XP for participation, while an opponent forfeit awards you a full win (+30 Monthly Pts).',
    levelsTableTitle: '👑 The 6 Arena Ranks & XP Levels',
    levelsTableSub: 'Earn XP across all matches and daily missions to climb the Arena hierarchy',
    yourCurrentRankBadge: 'Current Rank ✓',
    completedRankBadge: 'Unlocked ★',
    upcomingRankBadge: 'Locked 🔒',
    vipMultiplierTitle: '💎 VIP Tier Point & Coin Multipliers',
    vipMultiplierSub: 'Upgrading your VIP package in the Store permanently multiplies your daily rewards and gold coins',
    vipBonusLabel: 'Rewards Multiplier',
  },

  fr: {
    pageTitle: '📖 Guide d’Aide Complet & Règles de l’Arène',
    pageSubtitle:
      'Découvrez en schémas illustrés comment jouer, défier vos amis par #ID et salons privés, et comprendre le système de points et de niveaux.',
    backToSettingsBtn: 'Retour aux Paramètres',
    startPlayingNowBtn: 'Aller à l’Arène ⚔️',
    goToFriendsBtn: 'Voir les Amis 👥',
    tabGameplay: '🎮 Comment Jouer',
    tabFriends: '👥 Défier des Amis',
    tabScoring: '🏆 Points & Niveaux',

    visualMatchFlowTitle: '🗺️ Schéma du Déroulement d’un Match',
    visualMatchFlowSub: 'Du coup d’envoi au podium à travers 3 manches décisives',
    diagramRound1: 'Manche 1',
    diagramRound1Sub: '7 Qs + Question d’Or (2×)',
    diagramRound2: 'Manche 2',
    diagramRound2Sub: '7 Qs + Question d’Or (2×)',
    diagramRound3: 'Manche Finale 3',
    diagramRound3Sub: 'Points décisifs & Départage',
    diagramVictory: 'Podium & Victoire',
    diagramVictorySub: '+Pts Tournoi, Elo & Pièces',
    hudPreviewTitle: '📱 Illustration de l’Interface de Question',
    hudPreviewSub: 'Aperçu visuel du chrono de 6s, de la Question d’Or et des Jokers',
    hudSampleQuestion: 'Quelle sourate équivaut au tiers du Saint Coran ?',
    hudSampleOpt1: 'Sourate Al-Ikhlas ✓',
    hudSampleOpt2: 'Sourate Al-Falaq',
    hudSampleOpt3: 'Sourate Al-Mulk',
    hudSampleOpt4: 'Sourate Al-Kahf',
    hudGoldenTag: '🌟 Question n°8 : Question d’Or (Points Doublés 2×)',
    hudTimerTag: '⏱️ Chrono 6s',

    friendsDiagramTitle: '🔗 Schéma en 4 Étapes pour Défier un Ami',
    friendsDiagramSub: 'Connexion directe 100% joueurs réels sans aucun bot',
    diagStep1Label: '1. Partager/Chercher #ID',
    diagStep1Tag: 'Code unique à 10 chiffres',
    diagStep2Label: '2. Salon à 4 Chiffres',
    diagStep2Tag: 'Mêmes questions à 100%',
    diagStep3Label: '3. Alerte en Arrière-Plan',
    diagStep3Tag: 'Son & notification locale',
    diagStep4Label: '4. Duel & Note Fair-Play',
    diagStep4Tag: '1–5 Étoiles & Badges',

    scoringDiagramTitle: '📐 Schéma de la Formule des Points',
    scoringDiagramSub: 'Comment maximiser votre score à chaque question',
    eqBaseLabel: 'Points de Base',
    eqSpeedLabel: 'Bonus Vitesse',
    eqComboLabel: 'Série Combo',
    eqGoldenLabel: 'Question d’Or',
    eqTotalLabel: 'Score Total',
    eqMaxPtsNote: 'Une réponse rapide à la Question d’Or rapporte plus de 370+ points d’un coup !',
    rankLadderVisualTitle: '📈 Progression Visuelle des 6 Rangs de l’Arène',

    gameplayHeroTitle: '⚔️ Comment se déroulent les matchs dans NEUROX ESPORTS ?',
    gameplayHeroDesc:
      'Chaque duel teste votre rapidité et votre culture générale dans 11 catégories avec un moteur anti-répétition des questions.',
    ruleRoundsTitle: '3 Manches Décisives (8 Questions/Manche)',
    ruleRoundsDesc:
      'Chaque match comprend 3 manches de 8 questions (24 questions au total). Remportez les manches et cumulez le plus de points pour gagner.',
    ruleTimerTitle: '6 Secondes par Question ⏱️',
    ruleTimerDesc:
      'Vous disposez de 6 secondes par question. Plus vous répondez vite, plus votre bonus de vitesse est élevé.',
    ruleGoldenTitle: 'Question d’Or (Question n°8) 🌟',
    ruleGoldenDesc:
      'La dernière question de chaque manche double les points (2×), permettant de renverser le score à la dernière seconde !',
    ruleNoRepeatTitle: 'Moteur Anti-Répétition ✓',
    ruleNoRepeatDesc:
      'Le système mémorise les questions déjà vues pour garantir des questions inédites à chaque partie.',
    modesSectionTitle: '🌐 Les 4 Modes de Jeu Disponibles',
    modeOnlineTitle: '1. Match En Ligne Compétitif 🌍',
    modeOnlineDesc:
      'Affrontement en direct comptant pour le Tournoi Mensuel et le classement Elo.',
    modeRoomTitle: '2. Salon Privé (Code à 4 chiffres) 🏠',
    modeRoomDesc:
      'Créez un code à 4 chiffres et partagez-le avec un ami pour avoir exactement les mêmes questions dans le même ordre.',
    modeLocalTitle: '3. Pass & Play Local 👥 (Hors-ligne)',
    modeLocalDesc:
      'Deux joueurs sur le même téléphone répondent à tour de rôle, disponible sans connexion Internet.',
    modeSoloTitle: '4. Entraînement Solo 🎯 (Hors-ligne)',
    modeSoloDesc:
      'Idéal pour s’entraîner rapidement et gagner de l’XP même sans Internet.',
    lifelinesTitle: '🛠️ Jokers et Aides en Match (Lifelines)',
    lifelinesSub: 'Chaque aide peut être utilisée une fois par manche',
    lifeline5050Title: '50/50 (Supprimer 2 choix)',
    lifeline5050Desc: 'Élimine immédiatement deux mauvaises réponses.',
    lifelineFreezeTitle: 'Geler le Temps (❄️)',
    lifelineFreezeDesc: 'Arrête le compte à rebours de 6 secondes pour réfléchir sereinement.',
    lifelineAutoTitle: 'Résolution Auto (🤖)',
    lifelineAutoDesc: 'Sélectionne automatiquement la bonne réponse avec tous les points.',

    friendsHeroTitle: '👥 Comment Ajouter et Défier vos Amis ?',
    friendsHeroDesc:
      'Aucun bot dans la liste d’amis : chaque joueur possède un identifiant unique #ID à 10 chiffres.',
    yourIdLabel: 'Votre Identifiant Unique (#ID) :',
    copyIdBtn: 'Copier mon #ID',
    copiedText: 'Copié !',
    step1Title: 'Étape 1 : Partager ou Rechercher par #ID',
    step1Desc:
      'Copiez votre #ID et envoyez-le à votre ami, ou entrez le sien dans l’onglet Amis & Chat pour l’ajouter instantanément.',
    step2Title: 'Étape 2 : Lancer un Défi ou Code Salon à 4 Chiffres',
    step2Desc:
      'Appuyez sur « ⚔️ Jouer » à côté du nom de votre ami pour ouvrir un salon privé et lui envoyer une invitation.',
    step3Title: 'Étape 3 : Notifications Locales en Arrière-Plan',
    step3Desc:
      'Recevez une alerte sonore et une notification système dès qu’un ami vous invite, même si l’application est en arrière-plan.',
    step4Title: 'Étape 4 : Évaluation Fair-Play Après-Match ⭐',
    step4Desc:
      'Après un match amical, notez votre ami de 1 à 5 étoiles et attribuez-lui un badge d’esprit sportif.',
    fairPlayNoteTitle: '🛡️ Protection Fair-Play & Anti-Triche (100/100)',
    fairPlayNoteDesc:
      'Verrouillage instantané de la réponse, détection des clics < 120ms et synchronisation des questions par code salon.',

    scoringHeroTitle: '🏆 Calcul des Points, Classement & Niveaux',
    scoringHeroDesc:
      'Chaque bonne réponse rapide augmente vos points mensuels et fait progresser votre niveau d’XP.',
    formulaSectionTitle: '🧮 Formule des Points par Question',
    formulaBaseTitle: '+100 Points de Base',
    formulaBaseDesc: 'Accordés pour chaque bonne réponse standard.',
    formulaSpeedTitle: '+12 Points par Seconde Restante ⚡',
    formulaSpeedDesc: 'Plus vous répondez vite dans les 6 secondes, plus le bonus est grand.',
    formulaComboTitle: '+15 Points par Série (Combo 🔥)',
    formulaComboDesc: 'Les bonnes réponses consécutives augmentent votre multiplicateur Combo.',
    formulaGoldenTitle: 'Multiplicateur Question d’Or (2× 🌟)',
    formulaGoldenDesc: 'La 8e question de chaque manche double tous les points de la question !',
    rewardsBreakdownTitle: '📊 Récompenses de Fin de Match & Elo',
    rewardWinTitle: 'Victoire 🏆',
    rewardWinDesc: '+35 Pts Tournoi Mensuel · +25 Elo · +25 Pièces d’Or 🪙 · +120 XP (multiplié par VIP).',
    rewardDrawTitle: 'Match Nul 🤝',
    rewardDrawDesc: '+12 Pts Tournoi Mensuel · +5 Elo · +8 Pièces d’Or 🪙 · +60 XP.',
    rewardForfeitTitle: 'Défaite ou Abandon ⚔️',
    rewardForfeitDesc: '+35 XP de participation en cas de défaite, ou victoire complète si l’adversaire abandonne.',
    levelsTableTitle: '👑 Les 6 Rangs et Niveaux d’XP',
    levelsTableSub: 'Gagnez de l’XP dans les matchs et missions quotidiennes pour monter en grade',
    yourCurrentRankBadge: 'Rang Actuel ✓',
    completedRankBadge: 'Débloqué ★',
    upcomingRankBadge: 'Verrouillé 🔒',
    vipMultiplierTitle: '💎 Multiplicateurs des Packs VIP',
    vipMultiplierSub: 'Les packs VIP augmentent vos récompenses quotidiennes et pièces d’or',
    vipBonusLabel: 'Multiplicateur Bonus',
  },

  es: {
    pageTitle: '📖 Guía Completa de Instrucciones y Reglas',
    pageSubtitle:
      'Aprende con diagramas visuales cómo jugar, cómo desafiar a tus amigos por #ID y salas privadas, y cómo funciona el sistema de puntos y niveles.',
    backToSettingsBtn: 'Volver a Ajustes',
    startPlayingNowBtn: 'Ir a la Arena ⚔️',
    goToFriendsBtn: 'Ir a Amigos 👥',
    tabGameplay: '🎮 Cómo Jugar y Modos',
    tabFriends: '👥 Desafiar Amigos',
    tabScoring: '🏆 Puntos y Niveles',

    visualMatchFlowTitle: '🗺️ Diagrama Visual del Flujo de la Partida',
    visualMatchFlowSub: 'Desde el inicio hasta el podio en 3 rondas decisivas',
    diagramRound1: 'Ronda 1',
    diagramRound1Sub: '7 Pregs + Dorada (2×)',
    diagramRound2: 'Ronda 2',
    diagramRound2Sub: '7 Pregs + Dorada (2×)',
    diagramRound3: 'Ronda Final 3',
    diagramRound3Sub: 'Puntos Decisivos y Desempate',
    diagramVictory: 'Podio de Victoria',
    diagramVictorySub: '+Pts Torneo, Elo y Monedas',
    hudPreviewTitle: '📱 Ilustración de la Pantalla de Pregunta',
    hudPreviewSub: 'Vista previa del reloj de 6s, Pregunta Dorada y Ayudas Tácticas',
    hudSampleQuestion: '¿Qué sura equivale a un tercio del Sagrado Corán?',
    hudSampleOpt1: 'Sura Al-Ikhlas ✓',
    hudSampleOpt2: 'Sura Al-Falaq',
    hudSampleOpt3: 'Sura Al-Mulk',
    hudSampleOpt4: 'Sura Al-Kahf',
    hudGoldenTag: '🌟 Pregunta #8: Pregunta Dorada (Doble Puntuación 2×)',
    hudTimerTag: '⏱️ Reloj 6s',

    friendsDiagramTitle: '🔗 Diagrama en 4 Pasos para Desafiar Amigos',
    friendsDiagramSub: 'Conexión directa 100% entre jugadores reales sin bots',
    diagStep1Label: '1. Compartir/Buscar #ID',
    diagStep1Tag: 'Código único de 10 dígitos',
    diagStep2Label: '2. Sala de 4 Dígitos',
    diagStep2Tag: '100% mismas preguntas',
    diagStep3Label: '3. Aviso en Segundo Plano',
    diagStep3Tag: 'Sonido y alerta local',
    diagStep4Label: '4. Jugar y Valorar',
    diagStep4Tag: '1–5 Estrellas e Insignias',

    scoringDiagramTitle: '📐 Esquema Visual de la Fórmula de Puntos',
    scoringDiagramSub: 'Cómo obtener la máxima puntuación en cada pregunta',
    eqBaseLabel: 'Puntos Base',
    eqSpeedLabel: 'Bono Velocidad',
    eqComboLabel: 'Bono Racha',
    eqGoldenLabel: 'Pregunta Dorada',
    eqTotalLabel: 'Puntuación Total',
    eqMaxPtsNote: '¡Una respuesta rápida en la Pregunta Dorada otorga más de 370+ puntos de golpe!',
    rankLadderVisualTitle: '📈 Escalera Visual de los 6 Rangos de la Arena',

    gameplayHeroTitle: '⚔️ ¿Cómo se juegan las partidas en NEUROX ESPORTS?',
    gameplayHeroDesc:
      'Cada duelo pone a prueba tu velocidad y conocimiento en 11 categorías con un sistema activo que evita preguntas repetidas.',
    ruleRoundsTitle: '3 Rondas Decisivas (8 Preguntas/Ronda)',
    ruleRoundsDesc:
      'Cada partida tiene 3 rondas de 8 preguntas (24 en total). Gana quien domine las rondas y sume más puntos.',
    ruleTimerTitle: '6 Segundos por Pregunta ⏱️',
    ruleTimerDesc:
      'Tienes 6 segundos para responder. Cuanto más rápido respondas, mayor será tu bonificación de velocidad.',
    ruleGoldenTitle: 'Pregunta Dorada (Pregunta #8) 🌟',
    ruleGoldenDesc:
      '¡La última pregunta de cada ronda otorga Doble Puntuación (2×) para remontadas épicas!',
    ruleNoRepeatTitle: 'Motor Anti-Repetición ✓',
    ruleNoRepeatDesc:
      'El sistema registra las preguntas vistas para ofrecerte siempre nuevos retos.',
    modesSectionTitle: '🌐 Los 4 Modos de Juego Disponibles',
    modeOnlineTitle: '1. Partida Online Competitiva 🌍',
    modeOnlineDesc:
      'Duelos en vivo que suman puntos para el Torneo Mensual y el ranking Elo.',
    modeRoomTitle: '2. Sala Privada (Código de 4 dígitos) 🏠',
    modeRoomDesc:
      'Crea un código de 4 dígitos y compártelo con tu amigo para jugar con las mismas preguntas y el mismo orden.',
    modeLocalTitle: '3. Modo Local con Amigo 👥 (Funciona Offline)',
    modeLocalDesc:
      'Dos jugadores en el mismo móvil respondiendo por turnos sin necesidad de Internet.',
    modeSoloTitle: '4. Práctica Solo Offline 🎯 (Funciona Offline)',
    modeSoloDesc:
      'Entrenamiento rápido para ganar XP y practicar categorías sin conexión.',
    lifelinesTitle: '🛠️ Ayudas Tácticas en Partida (Lifelines)',
    lifelinesSub: 'Puedes usar cada ayuda una vez por ronda',
    lifeline5050Title: '50/50 (Eliminar 2 opciones)',
    lifeline5050Desc: 'Descarta dos respuestas incorrectas al instante.',
    lifelineFreezeTitle: 'Congelar Tiempo (❄️)',
    lifelineFreezeDesc: 'Detiene el reloj de 6 segundos para pensar con calma.',
    lifelineAutoTitle: 'Auto-Respuesta (🤖)',
    lifelineAutoDesc: 'Selecciona automáticamente la respuesta correcta con todos los puntos.',

    friendsHeroTitle: '👥 ¿Cómo Añadir y Retar a tus Amigos?',
    friendsHeroDesc:
      'Entorno 100% libre de bots en amigos: cada jugador real tiene un código #ID único de 10 dígitos.',
    yourIdLabel: 'Tu Código #ID Único de Jugador:',
    copyIdBtn: 'Copiar mi #ID',
    copiedText: '¡Copiado!',
    step1Title: 'Paso 1: Compartir o Buscar por #ID',
    step1Desc:
      'Copia tu código #ID y envíalo a tu amigo, o busca su #ID en la pestaña Amigos y Chat para añadirlo.',
    step2Title: 'Paso 2: Enviar Desafío o Código de 4 Dígitos',
    step2Desc:
      'Pulsa "⚔️ Jugar" junto al nombre de tu amigo para abrir una sala privada y enviarle la invitación al instante.',
    step3Title: 'Paso 3: Notificaciones Locales en Segundo Plano',
    step3Desc:
      'Recibe una alerta sonora y notificación del sistema cuando un amigo te reta, incluso con la app en segundo plano.',
    step4Title: 'Paso 4: Valoración de Deportividad Post-Partida ⭐',
    step4Desc:
      'Tras las partidas amistosas, valora a tu amigo de 1 a 5 estrellas y otórgale una insignia de deportividad.',
    fairPlayNoteTitle: '🛡️ Juego Limpio y Anti-Trampas (100/100)',
    fairPlayNoteDesc:
      'Bloqueo inmediato de respuesta, detección de clics < 120ms y preguntas idénticas sincronizadas por sala.',

    scoringHeroTitle: '🏆 Sistema de Puntos, Clasificación y Niveles',
    scoringHeroDesc:
      'Cada respuesta correcta y veloz impulsa tu posición en el Torneo Mensual y sube tu nivel de XP.',
    formulaSectionTitle: '🧮 Fórmula de Puntuación por Pregunta',
    formulaBaseTitle: '+100 Puntos Base',
    formulaBaseDesc: 'Por cada respuesta correcta en preguntas estándar.',
    formulaSpeedTitle: '+12 Puntos por Segundo Restante ⚡',
    formulaSpeedDesc: 'Responder rápido dentro de los 6 segundos suma hasta +72 puntos extra.',
    formulaComboTitle: '+15 Puntos por Racha (Combo 🔥)',
    formulaComboDesc: 'Las respuestas correctas seguidas aumentan tu bonificación de racha.',
    formulaGoldenTitle: 'Multiplicador Pregunta Dorada (2× 🌟)',
    formulaGoldenDesc: '¡La pregunta #8 de cada ronda duplica todos los puntos obtenidos!',
    rewardsBreakdownTitle: '📊 Recompensas de Partida y Ranking Elo',
    rewardWinTitle: 'Victoria 🏆',
    rewardWinDesc: '+35 Pts Torneo Mensual · +25 Elo · +25 Monedas de Oro 🪙 · +120 XP (mejorado con VIP).',
    rewardDrawTitle: 'Empate 🤝',
    rewardDrawDesc: '+12 Pts Torneo Mensual · +5 Elo · +8 Monedas de Oro 🪙 · +60 XP.',
    rewardForfeitTitle: 'Derrota o Abandono ⚔️',
    rewardForfeitDesc: '+35 XP por participar, o victoria automática si el rival abandona.',
    levelsTableTitle: '👑 Tabla de los 6 Niveles y Rangos',
    levelsTableSub: 'Acumula XP en partidas y misiones diarias para alcanzar la Cima Legendaria',
    yourCurrentRankBadge: 'Rango Actual ✓',
    completedRankBadge: 'Completado ★',
    upcomingRankBadge: 'Próximo Rango 🔒',
    vipMultiplierTitle: '💎 Multiplicadores de Paquetes VIP',
    vipMultiplierSub: 'Mejorar tu rango VIP multiplica tus recompensas diarias y monedas de oro',
    vipBonusLabel: 'Multiplicador de Bono',
  },

  tr: {
    pageTitle: '📖 Kapsamlı Oyun Rehberi ve Arena Kuralları',
    pageSubtitle:
      'Görsel şemalar ve ikonlarla nasıl oynanacağını, #ID ve özel odalarla arkadaş düellolarını ve puan/seviye sistemini öğrenin.',
    backToSettingsBtn: 'Ayarlara Dön',
    startPlayingNowBtn: 'Arenaya Git ⚔️',
    goToFriendsBtn: 'Arkadaşlara Git 👥',
    tabGameplay: '🎮 Nasıl Oynanır?',
    tabFriends: '👥 Arkadaşlarla Düello',
    tabScoring: '🏆 Puan ve Seviye Sistemi',

    visualMatchFlowTitle: '🗺️ Rekabetçi Maç Akış Şeması',
    visualMatchFlowSub: 'Başlangıç düdüğünden şampiyonluk podyumuna 3 kritik tur',
    diagramRound1: '1. Tur',
    diagramRound1Sub: '7 Soru + Altın Soru (2×)',
    diagramRound2: '2. Tur',
    diagramRound2Sub: '7 Soru + Altın Soru (2×)',
    diagramRound3: 'Final 3. Tur',
    diagramRound3Sub: 'Kritik Puanlar & Tie-Break',
    diagramVictory: 'Zafer Podyumu',
    diagramVictorySub: '+Turnuva Puanı, Elo ve Altın',
    hudPreviewTitle: '📱 Maç İçi Soru Ekranı Görseli',
    hudPreviewSub: '6sn zamanlayıcı, Altın Soru rozeti ve Jokerlerin görsel özeti',
    hudSampleQuestion: 'Kur’an-ı Kerim’in üçte birine denk سورة hangisidir?',
    hudSampleOpt1: 'İhlas Suresi ✓',
    hudSampleOpt2: 'Felak Suresi',
    hudSampleOpt3: 'Mülk Suresi',
    hudSampleOpt4: 'Kehf Suresi',
    hudGoldenTag: '🌟 8. Soru: Altın Soru (2× İki Kat Puan)',
    hudTimerTag: '⏱️ 6sn Sayaç',

    friendsDiagramTitle: '🔗 4 Adımda Arkadaş Meydan Okuma Şeması',
    friendsDiagramSub: 'Bot olmadan %100 gerçek oyuncular arası doğrudan bağlantı',
    diagStep1Label: '1. #ID Paylaş / Ara',
    diagStep1Tag: '10 haneli benzersiz kod',
    diagStep2Label: '2. 4 Haneli Oda Kur',
    diagStep2Tag: '%100 aynı soru sırası',
    diagStep3Label: '3. Arka Plan Bildirimi',
    diagStep3Tag: 'Sesli ve yerel uyarı',
    diagStep4Label: '4. Oyna & Sportmenlik Puanla',
    diagStep4Tag: '1–5 Yıldız ve Rozetler',

    scoringDiagramTitle: '📐 Görsel Soru Puanı Hesaplama Şeması',
    scoringDiagramSub: 'Her soruda maksimum puanı nasıl toplarsınız?',
    eqBaseLabel: 'Temel Puan',
    eqSpeedLabel: 'Hız Bonusu',
    eqComboLabel: 'Combo Serisi',
    eqGoldenLabel: 'Altın Soru Çarpanı',
    eqTotalLabel: 'Toplam Soru Puanı',
    eqMaxPtsNote: 'Altın Soruda hızlı ve doğru bir cevap tek seferde 370+ puan kazandırır!',
    rankLadderVisualTitle: '📈 6 Arena Rütbesi Görsel İlerleme Yolu',

    gameplayHeroTitle: '⚔️ NEUROX ESPORTS Maçları Nasıl Oynanır?',
    gameplayHeroDesc:
      'Her karşılaşma 11 farklı kültür ve bilim kategorisinde hızınızı ve bilginizi soru tekrar önleme sistemiyle test eder.',
    ruleRoundsTitle: '3 Kritik Tur (Tur Başına 8 Soru)',
    ruleRoundsDesc:
      'Her maç 8 soruluk 3 turdan (toplam 24 soru) oluşur. Turları ve en yüksek toplam puanı alan oyuncu kazanır.',
    ruleTimerTitle: 'Soru Başına 6 Saniye ⏱️',
    ruleTimerDesc:
      'Her soru için 6 saniyeniz vardır. Ne kadar hızlı doğru cevap verirseniz o kadar yüksek hız bonusu kazanırsınız.',
    ruleGoldenTitle: 'Altın Soru (8. Soru) 🌟',
    ruleGoldenDesc:
      'Her turun son sorusu İki Kat Puan (2×) değerindedir ve son saniyede maçı çevirme şansı sunar!',
    ruleNoRepeatTitle: 'Soru Tekrar Önleme Motoru ✓',
    ruleNoRepeatDesc:
      'Sistem çözdüğünüz soruları kaydederek her maçta yeni sorularla karşılaşmanızı sağlar.',
    modesSectionTitle: '🌐 4 Farklı Oyun Modu',
    modeOnlineTitle: '1. Rekabetçi Online Maç 🌍',
    modeOnlineDesc:
      'Aylık Turnuva ve genel Elo derecesine etki eden canlı karşılaşmalar.',
    modeRoomTitle: '2. Özel Oda Meydan Okuması (4 Haneli Kod) 🏠',
    modeRoomDesc:
      '4 haneli bir oda kodu oluşturup arkadaşınızla paylaşarak %100 aynı soruları aynı sırayla yarışın.',
    modeLocalTitle: '3. Yanındaki Arkadaşla Oyna 👥 (Çevrimdışı Çalışır)',
    modeLocalDesc:
      'Aynı telefonda iki oyuncu sırayla yarışır; internet olmadan da her zaman açıktır.',
    modeSoloTitle: '4. Tek Başına Antrenman 🎯 (Çevrimdışı Çalışır)',
    modeSoloDesc:
      'İnternet gerektirmeden hızlı antrenman yapmak ve XP kazanmak için idealdir.',
    lifelinesTitle: '🛠️ Maç İçi Jokerler (Lifelines)',
    lifelinesSub: 'Her jokeri tur başına bir kez kullanabilirsiniz',
    lifeline5050Title: '50/50 (İki Şıkkı Ele)',
    lifeline5050Desc: 'İki yanlış cevabı anında siler.',
    lifelineFreezeTitle: 'Zamanı Dondur (❄️)',
    lifelineFreezeDesc: '6 saniyelik sayacı durdurarak rahatça düşünmenizi sağlar.',
    lifelineAutoTitle: 'Otomatik Çöz (🤖)',
    lifelineAutoDesc: 'Doğru cevabı tam puanla ve Combo serinizi koruyarak otomatik seçer.',

    friendsHeroTitle: '👥 Arkadaş Ekleme ve Canlı Meydan Okuma',
    friendsHeroDesc:
      'Arkadaş listesinde bot yoktur; her gerçek oyuncunun 10 haneli benzersiz bir #ID kodu bulunur.',
    yourIdLabel: 'Benzersiz Oyuncu #ID Kodunuz:',
    copyIdBtn: 'ID Kodumu Kopyala',
    copiedText: 'Kopyalandı!',
    step1Title: 'Adım 1: #ID Paylaşın veya Arayın',
    step1Desc:
      '10 haneli #ID kodunuzu arkadaşınızla paylaşın veya Arkadaşlar sekmesinde onun #ID kodunu aratarak hemen ekleyin.',
    step2Title: 'Adım 2: Anında Meydan Okuma veya 4 Haneli Oda Kodu',
    step2Desc:
      'Arkadaşınızın yanındaki "⚔️ Oyna" butonuna basarak özel oda kurun ve daveti anında gönderin.',
    step3Title: 'Adım 3: Arka Plan Yerel Bildirimleri',
    step3Desc:
      'Uygulama arka planda olsa bile arkadaşınız davet gönderdiğinde sesli uyarı ve sistem bildirimi alırsınız.',
    step4Title: 'Adım 4: Maç Sonu Sportmenlik Değerlendirmesi ⭐',
    step4Desc:
      'Dostluk maçlarından sonra arkadaşınıza 1-5 yıldız verin ve profilinde görünecek bir sportmenlik rozeti seçin.',
    fairPlayNoteTitle: '🛡️ Adil Oyun ve Hile Koruması (100/100)',
    fairPlayNoteDesc:
      'Anında cevap kilidi, 120ms altı tıklama koruması ve özel odalarda %100 senkronize soru dizilimi.',

    scoringHeroTitle: '🏆 Puanlar, Derece ve Seviyeler Nasıl Hesaplanır?',
    scoringHeroDesc:
      'Her doğru ve hızlı cevap Aylık Turnuva puanınızı artırır ve XP seviyenizi yükseltir.',
    formulaSectionTitle: '🧮 Soru Başına Puan Hesaplama Formülü',
    formulaBaseTitle: '+100 Temel Puan',
    formulaBaseDesc: 'Her standart doğru cevap için anında verilir.',
    formulaSpeedTitle: 'Kalan Saniye Başına +12 Puan ⚡',
    formulaSpeedDesc: '6 saniye içinde ne kadar erken cevaplarsanız o kadar yüksek hız bonusu alırsınız.',
    formulaComboTitle: 'Seri Başına +15 Puan (Combo 🔥)',
    formulaComboDesc: 'Arka arkaya doğru cevaplar Combo çarpanınızı büyütür.',
    formulaGoldenTitle: 'Altın Soru Çarpanı (2× 🌟)',
    formulaGoldenDesc: 'Her turun 8. sorusu kazanılan tüm puanları ikiye katlar!',
    rewardsBreakdownTitle: '📊 Maç Sonu Ödülleri ve Elo Derecesi',
    rewardWinTitle: 'Galibiyet 🏆',
    rewardWinDesc: '+35 Aylık Turnuva Puanı · +25 Elo · +25 Altın 🪙 · +120 XP (VIP ile katlanır).',
    rewardDrawTitle: 'Beraberlik 🤝',
    rewardDrawDesc: '+12 Aylık Turnuva Puanı · +5 Elo · +8 Altın 🪙 · +60 XP.',
    rewardForfeitTitle: 'Mağlubiyet veya Çekilme ⚔️',
    rewardForfeitDesc: 'Mağlubiyette +35 katılım XP’si, rakip çekildiğinde ise tam hükmen galibiyet ödülü verilir.',
    levelsTableTitle: '👑 6 Arena Rütbesi ve XP Seviye Tablosu',
    levelsTableSub: 'Maçlardan ve günlük görevlerden XP toplayarak Efsanevi Zirveye ulaşın',
    yourCurrentRankBadge: 'Mevcut Rütbeniz ✓',
    completedRankBadge: 'Tamamlandı ★',
    upcomingRankBadge: 'Sonraki Rütbe 🔒',
    vipMultiplierTitle: '💎 VIP Paket Çarpanları',
    vipMultiplierSub: 'Mağazadan VIP paketinizi yükselterek günlük ödüllerinizi ve altınlarınızı katlayın',
    vipBonusLabel: 'Ödül Çarpanı',
  },

  ur: {
    pageTitle: '📖 مکمل گائیڈ اور کھیل کے اصول (Help)',
    pageSubtitle:
      'وضاحتی خاکوں اور آئیکنز کے ذریعے کھیلنے کا طریقہ، #ID اور نجی کمروں سے دوستوں کو چیلنج کرنے کا طریقہ، اور پوائنٹس و لیولز کا نظام جانیں۔',
    backToSettingsBtn: 'ترتیبات پر واپس جائیں',
    startPlayingNowBtn: 'میدان میں جائیں ⚔️',
    goToFriendsBtn: 'دوستوں کے سیکشن میں جائیں 👥',
    tabGameplay: '🎮 کھیلنے کا طریقہ اور موڈز',
    tabFriends: '👥 دوستوں کو چیلنج کریں',
    tabScoring: '🏆 پوائنٹس اور لیولز کا نظام',

    visualMatchFlowTitle: '🗺️ مقابلے کے مراحل کا وضاحتی خاکہ',
    visualMatchFlowSub: 'آغاز سے لے کر فتح کےاسٹیج تک 3 فیصلہ کن راؤنڈز',
    diagramRound1: 'پہلا راؤنڈ',
    diagramRound1Sub: '7 سوالات + سنہری سوال (2×)',
    diagramRound2: 'دوسرا راؤنڈ',
    diagramRound2Sub: '7 سوالات + سنہری سوال (2×)',
    diagramRound3: 'تیسرا فیصلہ کن راؤنڈ',
    diagramRound3Sub: 'فیصلہ کن پوائنٹس اور ٹائی بریک',
    diagramVictory: 'فتح کا اسٹیج',
    diagramVictorySub: '+ٹورنامنٹ پوائنٹس، Elo اور سکے',
    hudPreviewTitle: '📱 میچ کے دوران سوال کی اسکرین کا خاکہ',
    hudPreviewSub: '6 سیکنڈ ٹائمر، سنہری سوال اور مددگار وسائل (Lifelines) کا منظر',
    hudSampleQuestion: 'قرآن مجید کی کون سی سورت تہائی قرآن کے برابر ہے؟',
    hudSampleOpt1: 'سورۃ الاخلاص ✓',
    hudSampleOpt2: 'سورۃ الفلق',
    hudSampleOpt3: 'سورۃ الملک',
    hudSampleOpt4: 'سورۃ الکہف',
    hudGoldenTag: '🌟 سوال نمبر 8: سنہری سوال (ڈبل پوائنٹس 2×)',
    hudTimerTag: '⏱️ 6 سیکنڈ ٹائمر',

    friendsDiagramTitle: '🔗 دوستوں کو چیلنج کرنے کے 4 مراحل کا خاکہ',
    friendsDiagramSub: 'بغیر کسی بوٹ کے 100% حقیقی کھلاڑیوں کا براہ راست مقابلہ',
    diagStep1Label: '1. #ID شیئر یا تلاش کریں',
    diagStep1Tag: '10 ہندسوں کا منفرد کوڈ',
    diagStep2Label: '2. 4 ہندسوں کا کمرہ بنائیں',
    diagStep2Tag: '100% ایک جیسے سوالات',
    diagStep3Label: '3. بیک گراؤنڈ فوری تنبیہ',
    diagStep3Tag: 'صوتی الرٹ اور لوکل نوٹیفکیشن',
    diagStep4Label: '4. کھیلیں اور اخلاق کی درجہ بندی کریں',
    diagStep4Tag: '1–5 اسٹارز اور تمغے',

    scoringDiagramTitle: '📐 سوال کے پوائنٹس کا بصری فارمولا',
    scoringDiagramSub: 'ہر سوال میں سب سے زیادہ پوائنٹس کیسے حاصل کریں؟',
    eqBaseLabel: 'بنیادی پوائنٹس',
    eqSpeedLabel: 'اسپیڈ بونس',
    eqComboLabel: 'کومبو تسلسل',
    eqGoldenLabel: 'سنہری سوال',
    eqTotalLabel: 'کل پوائنٹس',
    eqMaxPtsNote: 'سنہری سوال میں تیز اور درست جواب آپ کو ایک ہی بار میں 370+ سے زائد پوائنٹس دیتا ہے!',
    rankLadderVisualTitle: '📈 میدان کے 6 رینکس کی بصری ترقی',

    gameplayHeroTitle: '⚔️ NEUROX ESPORTS میں مقابلے کیسے کھیلے جاتے ہیں؟',
    gameplayHeroDesc:
      'ہر مقابلہ 11 علمی و ثقافتی اقسام میں آپ کی رفتار اور معلومات کا امتحان لیتا ہے، جس میں سوالات دہرائے نہیں جاتے۔',
    ruleRoundsTitle: '3 فیصلہ کن راؤنڈز (ہر راؤنڈ میں 8 سوالات)',
    ruleRoundsDesc:
      'ہر میچ 3 راؤنڈز اور ہر راؤنڈ 8 سوالات (کل 24 سوالات) پر مشتمل ہوتا ہے۔ زیادہ راؤنڈز اور پوائنٹس جیتنے والا فاتح قرار پاتا ہے۔',
    ruleTimerTitle: 'ہر سوال کے لیے صرف 6 سیکنڈ ⏱️',
    ruleTimerDesc:
      'ہر سوال کا جواب دینے کے لیے 6 سیکنڈ ہوتے ہیں۔ جتنی جلدی جواب دیں گے، اتنا ہی زیادہ اسپیڈ بونس ملے گا۔',
    ruleGoldenTitle: 'سنہری سوال (سوال نمبر 8) 🌟',
    ruleGoldenDesc:
      'ہر راؤنڈ کا آخری سوال ڈبل پوائنٹس (2×) دیتا ہے جو آخری لمحے میں بازی پلٹ سکتا ہے!',
    ruleNoRepeatTitle: 'سوالات کی تکرار روکنے کا نظام ✓',
    ruleNoRepeatDesc:
      'سسٹم آپ کے دیکھے ہوئے سوالات کو محفوظ رکھتا ہے تاکہ ہر میچ میں نئے سوالات آئیں۔',
    modesSectionTitle: '🌐 کھیل کے 4 دستیاب موڈز',
    modeOnlineTitle: '1. آن لائن مقابلہ 🌍',
    modeOnlineDesc:
      'براہ راست مقابلہ جس کے پوائنٹس ماہانہ ٹورنامنٹ اور Elo ریٹنگ میں شامل ہوتے ہیں۔',
    modeRoomTitle: '2. نجی کمرہ چیلنج (4 ہندسوں کا کوڈ) 🏠',
    modeRoomDesc:
      '4 ہندسوں کا روم کوڈ بنائیں اور اپنے دوست کو بھیجیں تاکہ دونوں کو 100% ایک جیسے سوالات ایک ہی ترتیب میں ملیں۔',
    modeLocalTitle: '3. پاس بیٹھے دوست کے ساتھ کھیلیں 👥 (آف لائن دستیاب)',
    modeLocalDesc:
      'ایک ہی موبائل پر دو کھلاڑی باری باری جواب دیتے ہیں، بغیر انٹرنیٹ کے بھی چلتا ہے۔',
    modeSoloTitle: '4. انفرادی آف لائن مشق 🎯 (آف لائن دستیاب)',
    modeSoloDesc:
      'بغیر انٹرنیٹ تیز مشق اور XP پوائنٹس بڑھانے کے لیے بہترین موڈ۔',
    lifelinesTitle: '🛠️ میچ کے دوران مددگار وسائل (Lifelines)',
    lifelinesSub: 'آپ ہر راؤنڈ میں ہر وسیلہ ایک بار استعمال کر سکتے ہیں',
    lifeline5050Title: 'دو غلط جوابات ہٹائیں (50/50)',
    lifeline5050Desc: 'فوراً دو غلط آپشنز کو ختم کر دیتا ہے۔',
    lifelineFreezeTitle: 'وقت منجمد کریں (❄️)',
    lifelineFreezeDesc: '6 سیکنڈ کے ٹائمر کو عارضی طور پر روک دیتا ہے تاکہ آپ سکون سے سوچ سکیں۔',
    lifelineAutoTitle: 'خودکار درست حل (🤖)',
    lifelineAutoDesc: 'مکمل پوائنٹس اور کومبو کے ساتھ خودکار طور پر درست جواب منتخب کرتا ہے۔',

    friendsHeroTitle: '👥 دوستوں کو کیسے شامل کریں اور چیلنج بھیجیں؟',
    friendsHeroDesc:
      'دوستوں کی فہرست بوٹس سے مکمل پاک ہے؛ ہر حقیقی کھلاڑی کا 10 ہندسوں کا منفرد #ID کوڈ ہوتا ہے۔',
    yourIdLabel: 'آپ کا منفرد پلیئر #ID کوڈ:',
    copyIdBtn: 'اپنا #ID کاپی کریں',
    copiedText: 'کاپی ہو گیا!',
    step1Title: 'مرحلہ 1: #ID شیئر کریں یا تلاش کریں',
    step1Desc:
      'اپنا 10 ہندسوں کا #ID کاپی کر کے دوست کو بھیجیں یا دوستوں کے سیکشن میں اس کا #ID لکھ کر فوراً شامل کریں۔',
    step2Title: 'مرحلہ 2: فوری چیلنج یا 4 ہندسوں کا روم کوڈ بھیجیں',
    step2Desc:
      'دوست کے نام کے سامنے "⚔️ کھیلیں" بٹن دبائیں تاکہ نجی کمرہ کھل جائے اور اسے فوری دعوت چلی جائے۔',
    step3Title: 'مرحلہ 3: بیک گراؤنڈ لوکل نوٹیفکیشنز',
    step3Desc:
      'جب کوئی دوست آپ کو چیلنج بھیجتا ہے تو ایپ بیک گراؤنڈ میں ہونے کے باوجود فوری صوتی الرٹ اور نوٹیفکیشن ملتا ہے۔',
    step4Title: 'مرحلہ 4: میچ کے بعد اسپورٹس مین شپ ریٹنگ ⭐',
    step4Desc:
      'میچ کے بعد اپنے دوست کو 1 سے 5 اسٹارز دیں اور اخلاقی تمغہ عطا کریں جو اس کی پروفائل میں ظاہر ہوگا۔',
    fairPlayNoteTitle: '🛡️ منصفانہ کھیل اور اینٹی چیٹ تحفظ (100/100)',
    fairPlayNoteDesc:
      'جواب کا فوری لاک، 120ms سے تیز خودکار کلکس کی روک تھام اور نجی کمروں میں یکساں سوالات کی ضمانت۔',

    scoringHeroTitle: '🏆 پوائنٹس، ریٹنگ اور لیولز کیسے شمار ہوتے ہیں؟',
    scoringHeroDesc:
      'ہر تیز اور درست جواب آپ کو ماہانہ ٹورنامنٹ کی چوٹی اور لیجنڈری رینک کے قریب لے جاتا ہے۔',
    formulaSectionTitle: '🧮 ہر سوال کے پوائنٹس کا فارمولا',
    formulaBaseTitle: '+100 بنیادی پوائنٹس',
    formulaBaseDesc: 'ہر عام سوال کا درست جواب دینے پر فوراً ملتے ہیں۔',
    formulaSpeedTitle: '+12 پوائنٹس فی بقیہ سیکنڈ ⚡',
    formulaSpeedDesc: '6 سیکنڈ ختم ہونے سے جتنا پہلے جواب دیں گے، اتنا زیادہ اسپیڈ بونس ملے گا۔',
    formulaComboTitle: '+15 پوائنٹس فی تسلسل (Combo 🔥)',
    formulaComboDesc: 'لگاتار درست جوابات دینے سے کومبو بونس بڑھتا جاتا ہے۔',
    formulaGoldenTitle: 'سنہری سوال کا ڈبل بونس (2× 🌟)',
    formulaGoldenDesc: 'ہر راؤنڈ کا آٹھواں سوال آپ کے حاصل کردہ تمام پوائنٹس کو دگنا کر دیتا ہے!',
    rewardsBreakdownTitle: '📊 میچ کے اختتامی انعامات اور Elo ریٹنگ',
    rewardWinTitle: 'میچ میں کامیابی 🏆',
    rewardWinDesc: '+35 ماہانہ ٹورنامنٹ پوائنٹس · +25 Elo ریٹنگ · +25 سونے کے سکے 🪙 · +120 XP۔',
    rewardDrawTitle: 'برابر مقابلہ 🤝',
    rewardDrawDesc: '+12 ماہانہ ٹورنامنٹ پوائنٹس · +5 Elo ریٹنگ · +8 سونے کے سکے 🪙 · +60 XP۔',
    rewardForfeitTitle: 'شکست یا دستبرداری ⚔️',
    rewardForfeitDesc: 'شکست کی صورت میں بھی شرکت کے +35 XP ملتے ہیں، جبکہ حریف کے دستبردار ہونے پر مکمل فتح ملتی ہے۔',
    levelsTableTitle: '👑 6 لیولز اور رینکس کا جدول (XP Ranks)',
    levelsTableSub: 'میچز اور روزانہ کے مشنز سے XP حاصل کر کے میدان کے لیجنڈ بنیں',
    yourCurrentRankBadge: 'آپ کا موجودہ رینک ✓',
    completedRankBadge: 'مکمل شدہ ★',
    upcomingRankBadge: 'اگلا رینک 🔒',
    vipMultiplierTitle: '💎 VIP پیکجز کے اضافی فوائد',
    vipMultiplierSub: 'اسٹور سے VIP پیکج اپ گریڈ کرنے پر روزانہ کے انعامات اور سکے دگنے ہو جاتے ہیں',
    vipBonusLabel: 'انعامات کا ملٹی پلائر',
  },
};

export const HelpView: React.FC<HelpViewProps> = ({
  account,
  onBackToSettings,
  onGoToArena,
  onGoToFriends,
}) => {
  const [activeSection, setActiveSection] = useState<HelpSectionTab>('gameplay');
  const [copiedId, setCopiedId] = useState<boolean>(false);

  const h = HELP_I18N[account.language] || HELP_I18N.ar;
  const levelInfo = computeLevelInfo(account.xp);
  const isRtl = account.language === 'ar' || account.language === 'ur';
  const FlowChevron = isRtl ? ChevronLeft : ChevronRight;

  const handleCopyId = async () => {
    soundFX.playClick();
    try {
      await navigator.clipboard.writeText(account.playerId);
    } catch {}
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  return (
    <div className="space-y-6 pb-12" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Top Header Banner with Back to Settings & Quick Arena Action */}
      <div className="rounded-3xl bg-gradient-to-r from-[#111827] via-[#1B253B] to-[#111827] border border-[#4FF5D2]/50 p-6 shadow-[0_0_30px_rgba(79,245,210,0.12)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-[#4FF5D2]/15 border border-[#4FF5D2] flex items-center justify-center text-[#4FF5D2] shrink-0">
              <BookOpen className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-white">
                {h.pageTitle}
              </h2>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                {h.pageSubtitle}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => {
                soundFX.playClick();
                onBackToSettings();
              }}
              className="min-h-[42px] px-4 rounded-xl bg-[#1B253B] hover:bg-[#28354E] border border-[#28354E] text-xs font-extrabold text-slate-200 flex items-center gap-1.5"
            >
              {isRtl ? (
                <ArrowRight className="w-4 h-4 text-[#4FF5D2]" />
              ) : (
                <ArrowLeft className="w-4 h-4 text-[#4FF5D2]" />
              )}
              <span>{h.backToSettingsBtn}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundFX.playClick();
                onGoToArena();
              }}
              className="min-h-[42px] px-4 rounded-xl bg-[#4FF5D2] hover:bg-[#38D9A9] text-[#070A12] text-xs font-extrabold flex items-center gap-1.5 shadow-md"
            >
              <Gamepad2 className="w-4 h-4" />
              <span>{h.startPlayingNowBtn}</span>
            </button>
          </div>
        </div>

        {/* 3 Interactive Guide Section Tabs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-6 pt-5 border-t border-[#28354E]">
          {(
            [
              {
                id: 'gameplay',
                label: h.tabGameplay,
                icon: Swords,
                accent: 'border-[#4FF5D2] bg-[#4FF5D2] text-[#070A12]',
              },
              {
                id: 'friends',
                label: h.tabFriends,
                icon: Users,
                accent: 'border-[#FFD166] bg-[#FFD166] text-[#070A12]',
              },
              {
                id: 'scoring',
                label: h.tabScoring,
                icon: Trophy,
                accent: 'border-[#38D9A9] bg-[#38D9A9] text-[#070A12]',
              },
            ] as Array<{
              id: HelpSectionTab;
              label: string;
              icon: React.ElementType;
              accent: string;
            }>
          ).map(tab => {
            const IconComp = tab.icon;
            const isActive = activeSection === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  soundFX.playClick();
                  setActiveSection(tab.id);
                }}
                className={`min-h-[48px] rounded-2xl border px-4 py-2.5 text-xs font-extrabold flex items-center justify-center gap-2 transition-all ${
                  isActive
                    ? `${tab.accent} shadow-lg scale-[1.01]`
                    : 'bg-[#070A12]/80 border-[#28354E] text-slate-300 hover:bg-[#111827] hover:text-white'
                }`}
              >
                <IconComp className="w-4 h-4 shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* SECTION 1: HOW TO PLAY & GAME MODES */}
      {activeSection === 'gameplay' && (
        <div className="space-y-6">
          {/* VISUAL DIAGRAM 1: 3-Round Match Timeline & Live Question HUD Illustration */}
          <div className="rounded-3xl bg-[#111827] border border-[#4FF5D2]/40 p-6">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-5">
              <div>
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-[#4FF5D2]" />
                  <span>{h.visualMatchFlowTitle}</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {h.visualMatchFlowSub}
                </p>
              </div>
              <span className="px-3 py-1 rounded-xl bg-[#4FF5D2]/15 border border-[#4FF5D2]/50 text-[11px] font-mono-num font-extrabold text-[#4FF5D2]">
                3 × 8 = 24 Qs
              </span>
            </div>

            {/* 4-Stage Visual Flow Timeline (RTL/LTR Aware) */}
            <div className="grid grid-cols-1 lg:grid-cols-7 gap-3 items-center mb-6">
              {/* Stage 1: Round 1 */}
              <div className="lg:col-span-1 p-4 rounded-2xl bg-[#070A12] border border-[#4FF5D2]/50 text-center relative overflow-hidden">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-[#4FF5D2]/15 border border-[#4FF5D2] flex items-center justify-center text-[#4FF5D2] mb-2">
                  {/* Custom SVG Round 1 Shield Icon */}
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M12 2L4 5.5V11.5C4 16.8 7.4 21.6 12 23C16.6 21.6 20 16.8 20 11.5V5.5L12 2Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      fill="rgba(79,245,210,0.15)"
                    />
                    <text
                      x="12"
                      y="15"
                      textAnchor="middle"
                      fill="currentColor"
                      fontSize="9"
                      fontWeight="bold"
                    >
                      R1
                    </text>
                  </svg>
                </div>
                <div className="text-xs font-extrabold text-white">
                  {h.diagramRound1}
                </div>
                <div className="text-[10px] text-[#4FF5D2] mt-1 font-bold">
                  {h.diagramRound1Sub}
                </div>
              </div>

              {/* Arrow Connector 1 */}
              <div className="hidden lg:flex items-center justify-center text-[#4FF5D2]">
                <FlowChevron className="w-6 h-6 animate-pulse" />
              </div>

              {/* Stage 2: Round 2 */}
              <div className="lg:col-span-1 p-4 rounded-2xl bg-[#070A12] border border-[#A78BFA]/50 text-center">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-[#A78BFA]/15 border border-[#A78BFA] flex items-center justify-center text-[#A78BFA] mb-2">
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M12 2L4 5.5V11.5C4 16.8 7.4 21.6 12 23C16.6 21.6 20 16.8 20 11.5V5.5L12 2Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      fill="rgba(167,139,250,0.15)"
                    />
                    <text
                      x="12"
                      y="15"
                      textAnchor="middle"
                      fill="currentColor"
                      fontSize="9"
                      fontWeight="bold"
                    >
                      R2
                    </text>
                  </svg>
                </div>
                <div className="text-xs font-extrabold text-white">
                  {h.diagramRound2}
                </div>
                <div className="text-[10px] text-[#A78BFA] mt-1 font-bold">
                  {h.diagramRound2Sub}
                </div>
              </div>

              {/* Arrow Connector 2 */}
              <div className="hidden lg:flex items-center justify-center text-[#A78BFA]">
                <FlowChevron className="w-6 h-6 animate-pulse" />
              </div>

              {/* Stage 3: Round 3 */}
              <div className="lg:col-span-1 p-4 rounded-2xl bg-[#070A12] border border-[#FFD166]/60 text-center">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-[#FFD166]/15 border border-[#FFD166] flex items-center justify-center text-[#FFD166] mb-2">
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M12 2L15 8.5L22 9.3L17 14L18.5 21L12 17.5L5.5 21L7 14L2 9.3L9 8.5L12 2Z"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      fill="rgba(255,209,102,0.2)"
                    />
                  </svg>
                </div>
                <div className="text-xs font-extrabold text-[#FFD166]">
                  {h.diagramRound3}
                </div>
                <div className="text-[10px] text-slate-300 mt-1 font-bold">
                  {h.diagramRound3Sub}
                </div>
              </div>

              {/* Arrow Connector 3 */}
              <div className="hidden lg:flex items-center justify-center text-[#FFD166]">
                <FlowChevron className="w-6 h-6 animate-pulse" />
              </div>

              {/* Stage 4: Victory Podium */}
              <div className="lg:col-span-1 p-4 rounded-2xl bg-gradient-to-b from-[#1B253B] to-[#070A12] border-2 border-[#38D9A9] text-center shadow-[0_0_20px_rgba(56,217,169,0.2)]">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-[#38D9A9]/20 border border-[#38D9A9] flex items-center justify-center text-[#38D9A9] mb-2">
                  <Trophy className="w-6 h-6" />
                </div>
                <div className="text-xs font-extrabold text-[#38D9A9]">
                  {h.diagramVictory}
                </div>
                <div className="text-[10px] text-slate-300 mt-1 font-bold">
                  {h.diagramVictorySub}
                </div>
              </div>
            </div>

            {/* Visual Mini-HUD Illustration of an Active Question */}
            <div className="rounded-2xl bg-[#070A12] border border-[#28354E] p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div>
                  <div className="text-xs font-extrabold text-white">
                    {h.hudPreviewTitle}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {h.hudPreviewSub}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg bg-[#FFD166]/20 border border-[#FFD166] text-[10px] font-extrabold text-[#FFD166]">
                    {h.hudGoldenTag}
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-[#4FF5D2]/15 border border-[#4FF5D2] text-[10px] font-mono-num font-extrabold text-[#4FF5D2]">
                    {h.hudTimerTag}
                  </span>
                </div>
              </div>

              {/* Simulated Timer Bar */}
              <div className="w-full h-2 rounded-full bg-[#1B253B] overflow-hidden mb-3">
                <div className="h-full w-4/5 bg-gradient-to-r from-[#4FF5D2] via-[#38D9A9] to-[#FFD166] rounded-full" />
              </div>

              {/* Simulated Question & 4 Options Grid */}
              <div className="p-3.5 rounded-xl bg-[#111827] border border-[#FFD166]/50 text-center text-xs font-extrabold text-white mb-3">
                {h.hudSampleQuestion}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                <div className="p-2.5 rounded-xl bg-[#38D9A9]/20 border-2 border-[#38D9A9] text-[11px] font-extrabold text-[#38D9A9] text-center">
                  {h.hudSampleOpt1}
                </div>
                <div className="p-2.5 rounded-xl bg-[#111827] border border-[#28354E] text-[11px] text-slate-400 text-center">
                  {h.hudSampleOpt2}
                </div>
                <div className="p-2.5 rounded-xl bg-[#111827] border border-[#28354E] text-[11px] text-slate-500 line-through text-center opacity-50">
                  {h.hudSampleOpt3} (50/50)
                </div>
                <div className="p-2.5 rounded-xl bg-[#111827] border border-[#28354E] text-[11px] text-slate-500 line-through text-center opacity-50">
                  {h.hudSampleOpt4} (50/50)
                </div>
              </div>

              {/* Simulated Lifelines Bar */}
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2 border-t border-[#1B253B]">
                <span className="px-3 py-1 rounded-lg bg-[#1B253B] border border-[#4FF5D2]/50 text-[10px] font-extrabold text-[#4FF5D2] flex items-center gap-1">
                  <Target className="w-3 h-3" /> 50/50
                </span>
                <span className="px-3 py-1 rounded-lg bg-[#1B253B] border border-[#60A5FA]/50 text-[10px] font-extrabold text-[#60A5FA] flex items-center gap-1">
                  <Snowflake className="w-3 h-3" /> Freeze ❄️
                </span>
                <span className="px-3 py-1 rounded-lg bg-[#1B253B] border border-[#FFD166]/50 text-[10px] font-extrabold text-[#FFD166] flex items-center gap-1">
                  <Bot className="w-3 h-3" /> Auto-Solve 🤖
                </span>
              </div>
            </div>
          </div>

          {/* Core Match Rules Grid */}
          <div className="rounded-3xl bg-[#111827] border border-[#28354E] p-6">
            <div className="mb-5">
              <h3 className="text-base font-extrabold text-white">
                {h.gameplayHeroTitle}
              </h3>
              <p className="text-xs text-slate-400 mt-1">{h.gameplayHeroDesc}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-[#070A12] border border-[#4FF5D2]/40 flex items-start gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-[#4FF5D2]/15 border border-[#4FF5D2] flex items-center justify-center text-[#4FF5D2] shrink-0">
                  <Swords className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-white mb-1">
                    {h.ruleRoundsTitle}
                  </h4>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    {h.ruleRoundsDesc}
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#070A12] border border-[#FFD166]/40 flex items-start gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-[#FFD166]/15 border border-[#FFD166] flex items-center justify-center text-[#FFD166] shrink-0">
                  <Timer className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-white mb-1">
                    {h.ruleTimerTitle}
                  </h4>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    {h.ruleTimerDesc}
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#070A12] border border-[#FFD166]/60 flex items-start gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-[#FFD166]/20 border border-[#FFD166] flex items-center justify-center text-[#FFD166] shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-[#FFD166] mb-1">
                    {h.ruleGoldenTitle}
                  </h4>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    {h.ruleGoldenDesc}
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#070A12] border border-[#38D9A9]/40 flex items-start gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-[#38D9A9]/15 border border-[#38D9A9] flex items-center justify-center text-[#38D9A9] shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-[#38D9A9] mb-1">
                    {h.ruleNoRepeatTitle}
                  </h4>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    {h.ruleNoRepeatDesc}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 4 Game Modes Explanation with Explanatory Icons */}
          <div className="rounded-3xl bg-[#111827] border border-[#28354E] p-6">
            <h3 className="text-base font-extrabold text-white mb-4">
              {h.modesSectionTitle}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="p-4 rounded-2xl bg-[#1B253B]/70 border border-[#4FF5D2]/40 flex items-start gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-[#4FF5D2]/15 border border-[#4FF5D2] flex items-center justify-center text-[#4FF5D2] shrink-0">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-extrabold text-[#4FF5D2] mb-1">
                    {h.modeOnlineTitle}
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    {h.modeOnlineDesc}
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#1B253B]/70 border border-[#FFD166]/40 flex items-start gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-[#FFD166]/15 border border-[#FFD166] flex items-center justify-center text-[#FFD166] shrink-0">
                  <Home className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-extrabold text-[#FFD166] mb-1">
                    {h.modeRoomTitle}
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    {h.modeRoomDesc}
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#1B253B]/70 border border-[#A78BFA]/40 flex items-start gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-[#A78BFA]/15 border border-[#A78BFA] flex items-center justify-center text-[#A78BFA] shrink-0">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-extrabold text-[#A78BFA] mb-1">
                    {h.modeLocalTitle}
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    {h.modeLocalDesc}
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#1B253B]/70 border border-[#38D9A9]/40 flex items-start gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-[#38D9A9]/15 border border-[#38D9A9] flex items-center justify-center text-[#38D9A9] shrink-0">
                  <Target className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-extrabold text-[#38D9A9] mb-1">
                    {h.modeSoloTitle}
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    {h.modeSoloDesc}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 3 Lifelines Explanation with Icons */}
          <div className="rounded-3xl bg-[#111827] border border-[#28354E] p-6">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <h3 className="text-base font-extrabold text-white">
                {h.lifelinesTitle}
              </h3>
              <span className="text-xs text-[#4FF5D2] font-bold">
                {h.lifelinesSub}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="p-4 rounded-2xl bg-[#070A12] border border-[#28354E]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-extrabold text-white flex items-center gap-1.5">
                    <Target className="w-4 h-4 text-[#4FF5D2]" />
                    <span>{h.lifeline5050Title}</span>
                  </span>
                  <span className="px-2.5 py-0.5 rounded-lg bg-[#4FF5D2]/15 text-[#4FF5D2] font-mono-num text-xs font-extrabold">
                    50/50 ({account.lifelines.fiftyFifty})
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {h.lifeline5050Desc}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#070A12] border border-[#28354E]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-extrabold text-white flex items-center gap-1.5">
                    <Snowflake className="w-4 h-4 text-[#60A5FA]" />
                    <span>{h.lifelineFreezeTitle}</span>
                  </span>
                  <span className="px-2.5 py-0.5 rounded-lg bg-[#60A5FA]/15 text-[#60A5FA] font-mono-num text-xs font-extrabold">
                    ❄️ ({account.lifelines.freezeTime})
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {h.lifelineFreezeDesc}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#070A12] border border-[#28354E]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-extrabold text-white flex items-center gap-1.5">
                    <Bot className="w-4 h-4 text-[#FFD166]" />
                    <span>{h.lifelineAutoTitle}</span>
                  </span>
                  <span className="px-2.5 py-0.5 rounded-lg bg-[#FFD166]/15 text-[#FFD166] font-mono-num text-xs font-extrabold">
                    🤖 ({account.lifelines.autoSolve})
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {h.lifelineAutoDesc}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: HOW TO CHALLENGE FRIENDS */}
      {activeSection === 'friends' && (
        <div className="space-y-6">
          {/* VISUAL DIAGRAM 2: 4-Step Friend Challenge Pipeline (RTL/LTR Aware) */}
          <div className="rounded-3xl bg-[#111827] border border-[#FFD166]/50 p-6">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-5">
              <div>
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <Share2 className="w-5 h-5 text-[#FFD166]" />
                  <span>{h.friendsDiagramTitle}</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {h.friendsDiagramSub}
                </p>
              </div>
              <span className="px-3 py-1 rounded-xl bg-[#FFD166]/15 border border-[#FFD166]/50 text-[11px] font-extrabold text-[#FFD166]">
                100% Real Players
              </span>
            </div>

            {/* 4 Visual Nodes with Directional Arrows */}
            <div className="grid grid-cols-1 lg:grid-cols-7 gap-3 items-center">
              {/* Node 1: #ID Lookup */}
              <div className="lg:col-span-1 p-4 rounded-2xl bg-[#070A12] border border-[#4FF5D2]/50 text-center">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-[#4FF5D2]/15 border border-[#4FF5D2] flex items-center justify-center text-[#4FF5D2] mb-2.5">
                  <div className="relative">
                    <Hash className="w-6 h-6" />
                    <Search className="w-3.5 h-3.5 absolute -bottom-1 -right-1 text-[#FFD166]" />
                  </div>
                </div>
                <div className="text-xs font-extrabold text-white">
                  {h.diagStep1Label}
                </div>
                <div className="text-[10px] font-mono-num text-[#4FF5D2] mt-1">
                  {h.diagStep1Tag}
                </div>
              </div>

              <div className="hidden lg:flex items-center justify-center text-[#4FF5D2]">
                <FlowChevron className="w-6 h-6 animate-pulse" />
              </div>

              {/* Node 2: 4-Digit Room Seed */}
              <div className="lg:col-span-1 p-4 rounded-2xl bg-[#070A12] border border-[#FFD166]/50 text-center">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-[#FFD166]/15 border border-[#FFD166] flex items-center justify-center text-[#FFD166] mb-2.5">
                  <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none">
                    <rect
                      x="3"
                      y="6"
                      width="18"
                      height="14"
                      rx="3"
                      stroke="currentColor"
                      strokeWidth="2"
                      fill="rgba(255,209,102,0.12)"
                    />
                    <text
                      x="12"
                      y="15"
                      textAnchor="middle"
                      fill="currentColor"
                      fontSize="7.5"
                      fontWeight="bold"
                    >
                      #4829
                    </text>
                  </svg>
                </div>
                <div className="text-xs font-extrabold text-[#FFD166]">
                  {h.diagStep2Label}
                </div>
                <div className="text-[10px] text-slate-300 mt-1">
                  {h.diagStep2Tag}
                </div>
              </div>

              <div className="hidden lg:flex items-center justify-center text-[#FFD166]">
                <FlowChevron className="w-6 h-6 animate-pulse" />
              </div>

              {/* Node 3: Background Notification Wave */}
              <div className="lg:col-span-1 p-4 rounded-2xl bg-[#070A12] border border-[#38D9A9]/50 text-center">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-[#38D9A9]/15 border border-[#38D9A9] flex items-center justify-center text-[#38D9A9] mb-2.5">
                  <div className="relative">
                    <BellRing className="w-6 h-6" />
                    <Radio className="w-3.5 h-3.5 absolute -top-1 -right-1 text-[#FFD166]" />
                  </div>
                </div>
                <div className="text-xs font-extrabold text-[#38D9A9]">
                  {h.diagStep3Label}
                </div>
                <div className="text-[10px] text-slate-300 mt-1">
                  {h.diagStep3Tag}
                </div>
              </div>

              <div className="hidden lg:flex items-center justify-center text-[#38D9A9]">
                <FlowChevron className="w-6 h-6 animate-pulse" />
              </div>

              {/* Node 4: Live Match & Sportsmanship 5 Stars */}
              <div className="lg:col-span-1 p-4 rounded-2xl bg-[#070A12] border border-[#A78BFA]/60 text-center">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-[#A78BFA]/15 border border-[#A78BFA] flex items-center justify-center text-[#A78BFA] mb-2.5">
                  <div className="relative">
                    <Swords className="w-6 h-6" />
                    <Star className="w-3.5 h-3.5 absolute -bottom-1 -right-1 text-[#FFD166] fill-[#FFD166]" />
                  </div>
                </div>
                <div className="text-xs font-extrabold text-[#A78BFA]">
                  {h.diagStep4Label}
                </div>
                <div className="text-[10px] text-slate-300 mt-1">
                  {h.diagStep4Tag}
                </div>
              </div>
            </div>
          </div>

          {/* Player Unique #ID Share Card & Detailed Steps */}
          <div className="rounded-3xl bg-[#111827] border border-[#28354E] p-6">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-5 pb-5 border-t-0 border-b border-[#28354E]">
              <div>
                <h3 className="text-base font-extrabold text-white">
                  {h.friendsHeroTitle}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  {h.friendsHeroDesc}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 bg-[#070A12] border border-[#28354E] rounded-2xl p-3">
                <span className="text-xs text-slate-300 font-bold">
                  {h.yourIdLabel}
                </span>
                <span className="font-mono-num text-sm font-extrabold text-[#FFD166] px-2.5 py-1 rounded-xl bg-[#1B253B]">
                  {account.playerId}
                </span>
                <button
                  type="button"
                  onClick={handleCopyId}
                  className="min-h-[38px] px-3.5 rounded-xl bg-[#4FF5D2] text-[#070A12] text-xs font-extrabold flex items-center gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedId ? h.copiedText : h.copyIdBtn}</span>
                </button>
              </div>
            </div>

            {/* 4 Step-by-Step Cards with Dedicated Icons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-[#070A12] border border-[#28354E] flex items-start gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-[#4FF5D2]/15 border border-[#4FF5D2] flex items-center justify-center text-[#4FF5D2] shrink-0">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-white mb-1">
                    {h.step1Title}
                  </h4>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    {h.step1Desc}
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#070A12] border border-[#28354E] flex items-start gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-[#FFD166]/15 border border-[#FFD166] flex items-center justify-center text-[#FFD166] shrink-0">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-white mb-1">
                    {h.step2Title}
                  </h4>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    {h.step2Desc}
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#070A12] border border-[#28354E] flex items-start gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-[#38D9A9]/15 border border-[#38D9A9] flex items-center justify-center text-[#38D9A9] shrink-0">
                  <BellRing className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-white mb-1">
                    {h.step3Title}
                  </h4>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    {h.step3Desc}
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#070A12] border border-[#28354E] flex items-start gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-[#A78BFA]/15 border border-[#A78BFA] flex items-center justify-center text-[#A78BFA] shrink-0">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-white mb-1">
                    {h.step4Title}
                  </h4>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    {h.step4Desc}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-5 border-t border-[#28354E] flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-start gap-2.5 max-w-2xl">
                <ShieldCheck className="w-5 h-5 text-[#38D9A9] shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-extrabold text-[#38D9A9]">
                    {h.fairPlayNoteTitle}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {h.fairPlayNoteDesc}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  soundFX.playClick();
                  onGoToFriends();
                }}
                className="min-h-[44px] px-5 rounded-xl bg-[#FFD166] text-[#070A12] text-xs font-extrabold flex items-center gap-2"
              >
                <Users className="w-4 h-4" />
                <span>{h.goToFriendsBtn}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: POINTS, LEVELS & RANKS SYSTEM */}
      {activeSection === 'scoring' && (
        <div className="space-y-6">
          {/* VISUAL DIAGRAM 3: Interactive Question Scoring Equation Illustration */}
          <div className="rounded-3xl bg-[#111827] border border-[#38D9A9]/50 p-6">
            <div className="mb-5">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#FFD166]" />
                <span>{h.scoringDiagramTitle}</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {h.scoringDiagramSub}
              </p>
            </div>

            {/* Visual Equation Blocks */}
            <div className="grid grid-cols-1 lg:grid-cols-9 gap-2.5 items-center bg-[#070A12] border border-[#28354E] rounded-2xl p-4">
              {/* Block 1: Base Points */}
              <div className="lg:col-span-1 p-3 rounded-xl bg-[#111827] border border-[#38D9A9]/50 text-center">
                <CheckCircle2 className="w-5 h-5 text-[#38D9A9] mx-auto mb-1" />
                <div className="font-mono-num text-sm font-extrabold text-[#38D9A9]">
                  +100
                </div>
                <div className="text-[10px] text-slate-300 font-bold">
                  {h.eqBaseLabel}
                </div>
              </div>

              <div className="text-center font-mono-num text-lg font-extrabold text-slate-400">
                +
              </div>

              {/* Block 2: Speed Bonus */}
              <div className="lg:col-span-1 p-3 rounded-xl bg-[#111827] border border-[#4FF5D2]/50 text-center">
                <Zap className="w-5 h-5 text-[#4FF5D2] mx-auto mb-1" />
                <div className="font-mono-num text-sm font-extrabold text-[#4FF5D2]">
                  +12/s
                </div>
                <div className="text-[10px] text-slate-300 font-bold">
                  {h.eqSpeedLabel}
                </div>
              </div>

              <div className="text-center font-mono-num text-lg font-extrabold text-slate-400">
                +
              </div>

              {/* Block 3: Combo Streak */}
              <div className="lg:col-span-1 p-3 rounded-xl bg-[#111827] border border-[#FF6B81]/50 text-center">
                <Flame className="w-5 h-5 text-[#FF6B81] mx-auto mb-1" />
                <div className="font-mono-num text-sm font-extrabold text-[#FF6B81]">
                  +15×
                </div>
                <div className="text-[10px] text-slate-300 font-bold">
                  {h.eqComboLabel}
                </div>
              </div>

              <div className="text-center font-mono-num text-lg font-extrabold text-[#FFD166]">
                ×
              </div>

              {/* Block 4: Golden Multiplier */}
              <div className="lg:col-span-1 p-3 rounded-xl bg-[#FFD166]/15 border border-[#FFD166] text-center">
                <Sparkles className="w-5 h-5 text-[#FFD166] mx-auto mb-1" />
                <div className="font-mono-num text-sm font-extrabold text-[#FFD166]">
                  2×
                </div>
                <div className="text-[10px] text-[#FFD166] font-bold">
                  {h.eqGoldenLabel}
                </div>
              </div>

              <div className="text-center font-mono-num text-lg font-extrabold text-[#38D9A9]">
                =
              </div>

              {/* Block 5: Total Score */}
              <div className="lg:col-span-1 p-3 rounded-xl bg-gradient-to-b from-[#1B253B] to-[#111827] border-2 border-[#38D9A9] text-center">
                <Trophy className="w-5 h-5 text-[#FFD166] mx-auto mb-1" />
                <div className="font-mono-num text-sm font-extrabold text-white">
                  370+ Pts
                </div>
                <div className="text-[10px] text-[#38D9A9] font-bold">
                  {h.eqTotalLabel}
                </div>
              </div>
            </div>

            <div className="mt-3 text-center text-xs font-bold text-[#FFD166]">
              💡 {h.eqMaxPtsNote}
            </div>
          </div>

          {/* Question Points Formula Breakdown */}
          <div className="rounded-3xl bg-[#111827] border border-[#28354E] p-6">
            <div className="mb-5">
              <h3 className="text-base font-extrabold text-white">
                {h.scoringHeroTitle}
              </h3>
              <p className="text-xs text-slate-400 mt-1">{h.scoringHeroDesc}</p>
            </div>

            <h4 className="text-xs font-extrabold text-[#4FF5D2] mb-3">
              {h.formulaSectionTitle}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              <div className="p-4 rounded-2xl bg-[#070A12] border border-[#38D9A9]/40">
                <div className="flex items-center gap-2 text-xs font-extrabold text-[#38D9A9] mb-1">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{h.formulaBaseTitle}</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {h.formulaBaseDesc}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#070A12] border border-[#4FF5D2]/40">
                <div className="flex items-center gap-2 text-xs font-extrabold text-[#4FF5D2] mb-1">
                  <Zap className="w-4 h-4" />
                  <span>{h.formulaSpeedTitle}</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {h.formulaSpeedDesc}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#070A12] border border-[#FF6B81]/40">
                <div className="flex items-center gap-2 text-xs font-extrabold text-[#FF6B81] mb-1">
                  <Flame className="w-4 h-4" />
                  <span>{h.formulaComboTitle}</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {h.formulaComboDesc}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#070A12] border border-[#FFD166]/60">
                <div className="flex items-center gap-2 text-xs font-extrabold text-[#FFD166] mb-1">
                  <Sparkles className="w-4 h-4" />
                  <span>{h.formulaGoldenTitle}</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {h.formulaGoldenDesc}
                </p>
              </div>
            </div>

            {/* Match Outcome Rewards */}
            <h4 className="text-xs font-extrabold text-[#FFD166] mt-6 mb-3">
              {h.rewardsBreakdownTitle}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="p-4 rounded-2xl bg-[#1B253B]/70 border border-[#38D9A9]/50">
                <div className="text-xs font-extrabold text-[#38D9A9] mb-1">
                  {h.rewardWinTitle}
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {h.rewardWinDesc}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#1B253B]/70 border border-[#4FF5D2]/50">
                <div className="text-xs font-extrabold text-[#4FF5D2] mb-1">
                  {h.rewardDrawTitle}
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {h.rewardDrawDesc}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#1B253B]/70 border border-[#A78BFA]/50">
                <div className="text-xs font-extrabold text-[#A78BFA] mb-1">
                  {h.rewardForfeitTitle}
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {h.rewardForfeitDesc}
                </p>
              </div>
            </div>
          </div>

          {/* All 6 Levels & Ranks Interactive Progression Table + Visual Ladder Bar */}
          <div className="rounded-3xl bg-[#111827] border border-[#28354E] p-6">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <div>
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <Crown className="w-5 h-5 text-[#FFD166]" />
                  <span>{h.levelsTableTitle}</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {h.levelsTableSub}
                </p>
              </div>
              <div className="px-4 py-1.5 rounded-xl bg-[#4FF5D2]/15 border border-[#4FF5D2] text-xs font-extrabold font-mono-num text-[#4FF5D2]">
                {account.xp} XP ·{' '}
                {getLocalizedRankTitle(levelInfo.currentRank, account.language)}
              </div>
            </div>

            {/* Visual 6-Step XP Ascension Bar */}
            <div className="p-4 rounded-2xl bg-[#070A12] border border-[#28354E] mb-5">
              <div className="text-xs font-extrabold text-slate-300 mb-3">
                {h.rankLadderVisualTitle}
              </div>
              <div className="grid grid-cols-6 gap-2 items-end">
                {LEVEL_RANKS.map(rank => {
                  const isCurrent = rank.level === levelInfo.currentRank.level;
                  const isUnlocked = account.xp >= rank.minXp;
                  const barHeight = 28 + rank.level * 12;
                  return (
                    <div
                      key={rank.level}
                      className="flex flex-col items-center text-center"
                    >
                      <span className="text-lg mb-1">{rank.icon}</span>
                      <div
                        className={`w-full rounded-t-xl border transition-all flex items-center justify-center font-mono-num text-[10px] font-extrabold ${
                          isCurrent
                            ? 'bg-gradient-to-t from-[#4FF5D2]/40 to-[#4FF5D2] border-[#4FF5D2] text-[#070A12]'
                            : isUnlocked
                            ? 'bg-[#38D9A9]/25 border-[#38D9A9] text-[#38D9A9]'
                            : 'bg-[#1B253B]/50 border-[#28354E] text-slate-500'
                        }`}
                        style={{ height: `${barHeight}px` }}
                      >
                        Lv.{rank.level}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {LEVEL_RANKS.map(rank => {
                const isCurrent = rank.level === levelInfo.currentRank.level;
                const isUnlocked = account.xp >= rank.minXp;
                const locTitle = getLocalizedRankTitle(rank, account.language);
                return (
                  <div
                    key={rank.level}
                    className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                      isCurrent
                        ? 'bg-[#1B253B] border-2 border-[#4FF5D2] shadow-[0_0_20px_rgba(79,245,210,0.18)]'
                        : isUnlocked
                        ? 'bg-[#070A12] border-[#38D9A9]/40'
                        : 'bg-[#070A12]/60 border-[#28354E] opacity-75'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-2xl">{rank.icon}</span>
                        <span
                          className={`px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold ${
                            isCurrent
                              ? 'bg-[#4FF5D2] text-[#070A12]'
                              : isUnlocked
                              ? 'bg-[#38D9A9]/20 text-[#38D9A9]'
                              : 'bg-[#1B253B] text-slate-400'
                          }`}
                        >
                          {isCurrent
                            ? h.yourCurrentRankBadge
                            : isUnlocked
                            ? h.completedRankBadge
                            : h.upcomingRankBadge}
                        </span>
                      </div>

                      <div className="text-sm font-extrabold text-white">
                        Lv.{rank.level} — {locTitle}
                      </div>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-[#28354E] flex items-center justify-between text-[11px] font-mono-num">
                      <span className="text-slate-400">XP:</span>
                      <span
                        className="font-extrabold"
                        style={{ color: rank.color }}
                      >
                        {rank.minXp} – {rank.maxXp} XP
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* VIP Multipliers Summary */}
          <div className="rounded-3xl bg-[#111827] border border-[#28354E] p-6">
            <div className="mb-4">
              <h3 className="text-base font-extrabold text-white">
                {h.vipMultiplierTitle}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {h.vipMultiplierSub}
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {VIP_PACKAGES.map(vip => {
                const isOwned = account.vipTier === vip.id;
                return (
                  <div
                    key={vip.id}
                    className={`p-3.5 rounded-2xl border text-center ${
                      isOwned
                        ? 'bg-[#1B253B] border-[#FFD166]'
                        : 'bg-[#070A12] border-[#28354E]'
                    }`}
                  >
                    <div className="text-2xl mb-1">{vip.badge}</div>
                    <div className="text-xs font-extrabold text-white">
                      {isRtl ? vip.nameAr : vip.nameEn}
                    </div>
                    <div className="text-xs font-mono-num font-extrabold text-[#FFD166] mt-1">
                      {vip.dailyMultiplier}× {h.vipBonusLabel}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
