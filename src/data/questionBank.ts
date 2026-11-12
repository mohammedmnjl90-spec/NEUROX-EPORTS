import { CategoryId, QuizQuestion } from '../types';

// Deterministic PRNG (Mulberry32) so 4-digit room codes generate the EXACT same questions in the EXACT same order for both players
export function createSeededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Curated base questions across all 10 categories
const CURATED_QUESTIONS: QuizQuestion[] = [
  // 1. القرآن الكريم (quran)
  { id: 'q_qur_1', category: 'quran', questionAr: 'ما هي أعظم سورة في القرآن الكريم؟', optionsAr: ['سورة الفاتحة', 'سورة البقرة', 'سورة الإخلاص', 'سورة يس'], correctIndex: 0, difficulty: 'easy' },
  { id: 'q_qur_2', category: 'quran', questionAr: 'كم عدد سور القرآن الكريم؟', optionsAr: ['110 سورة', '114 سورة', '116 سورة', '120 سورة'], correctIndex: 1, difficulty: 'easy' },
  { id: 'q_qur_3', category: 'quran', questionAr: 'ما هي السورة التي تخلو من البسملة في بدايتها؟', optionsAr: ['سورة التوبة', 'سورة الأنفال', 'سورة الحشر', 'سورة القصص'], correctIndex: 0, difficulty: 'easy' },
  { id: 'q_qur_4', category: 'quran', questionAr: 'ما هي السورة التي ذُكرت فيها البسملة مرتين؟', optionsAr: ['سورة النمل', 'سورة النحل', 'سورة الكهف', 'سورة مريم'], correctIndex: 0, difficulty: 'medium' },
  { id: 'q_qur_5', category: 'quran', questionAr: 'ما هي أطول آية في القرآن الكريم؟', optionsAr: ['آية الكرسي', 'آية الدَّين', 'آية المواريث', 'آية المباهلة'], correctIndex: 1, difficulty: 'medium' },
  { id: 'q_qur_6', category: 'quran', questionAr: 'في أي سورة تقع آية الكرسي؟', optionsAr: ['سورة آل عمران', 'سورة البقرة', 'سورة النساء', 'سورة المائدة'], correctIndex: 1, difficulty: 'easy' },
  { id: 'q_qur_7', category: 'quran', questionAr: 'من هو الصحابي الوحيد الذي ذُكر اسمه صريحاً في القرآن الكريم؟', optionsAr: ['زيد بن حارثة رضي الله عنه', 'أبو بكر الصديق رضي الله عنه', 'عمر بن الخطاب رضي الله عنه', 'معاذ بن جبل رضي الله عنه'], correctIndex: 0, difficulty: 'medium' },
  { id: 'q_qur_8', category: 'quran', questionAr: 'ما هي السورة التي تُسمى عروس القرآن؟', optionsAr: ['سورة الرحمن', 'سورة الملك', 'سورة الواقعة', 'سورة يس'], correctIndex: 0, difficulty: 'easy' },
  { id: 'q_qur_9', category: 'quran', questionAr: 'ما هي السورة التي تعدل ثلث القرآن الكريم؟', optionsAr: ['سورة الإخلاص', 'سورة الفلق', 'سورة الناس', 'سورة الكافرون'], correctIndex: 0, difficulty: 'easy' },
  { id: 'q_qur_10', category: 'quran', questionAr: 'ما هي السورة التي تنتهي كل آية من آياتها بحرف الدال؟', optionsAr: ['سورة الإخلاص', 'سورة العصر', 'سورة الفلق', 'سورة الكوثر'], correctIndex: 0, difficulty: 'medium' },
  { id: 'q_qur_11', category: 'quran', questionAr: 'كم عدد أجزاء القرآن الكريم؟', optionsAr: ['20 جزءاً', '28 جزءاً', '30 جزءاً', '60 جزءاً'], correctIndex: 2, difficulty: 'easy' },
  { id: 'q_qur_12', category: 'quran', questionAr: 'ما هي السورة التي تُنجي صاحبها من عذاب القبر (المانعة)؟', optionsAr: ['سورة الملك', 'سورة السجدة', 'سورة الدخان', 'سورة الحشر'], correctIndex: 0, difficulty: 'easy' },
  { id: 'q_qur_13', category: 'quran', questionAr: 'ما هي السورة التي ذُكر لفظ الجلالة (الله) في كل آية من آياتها؟', optionsAr: ['سورة المجادلة', 'سورة الممتحنة', 'سورة الحجرات', 'سورة الطلاق'], correctIndex: 0, difficulty: 'hard' },
  { id: 'q_qur_14', category: 'quran', questionAr: 'ما هي أقصر سورة في القرآن الكريم؟', optionsAr: ['سورة الكوثر', 'سورة العصر', 'سورة النصر', 'سورة الإخلاص'], correctIndex: 0, difficulty: 'easy' },
  { id: 'q_qur_15', category: 'quran', questionAr: 'ما هي السورة التي سُميت باسم إحدى الغزوات؟', optionsAr: ['سورة الأحزاب', 'سورة بدر', 'سورة الخندق', 'سورة تبوك'], correctIndex: 0, difficulty: 'medium' },
  { id: 'q_qur_16', category: 'quran', questionAr: 'ما هي السورة التي سُميت باسم ركن من أركان الإسلام؟', optionsAr: ['سورة الحج', 'سورة الصوم', 'سورة الزكاة', 'سورة الصلاة'], correctIndex: 0, difficulty: 'easy' },
  { id: 'q_qur_17', category: 'quran', questionAr: 'ما هي أطول سورة في القرآن الكريم؟', optionsAr: ['سورة البقرة', 'سورة آل عمران', 'سورة النساء', 'سورة الأعراف'], correctIndex: 0, difficulty: 'easy' },
  { id: 'q_qur_18', category: 'quran', questionAr: 'في أي سورة وردت قصة أصحاب الكهف؟', optionsAr: ['سورة الكهف', 'سورة القصص', 'سورة الأنبياء', 'سورة الفرقان'], correctIndex: 0, difficulty: 'easy' },

  // 2. إسلاميات (islamic)
  { id: 'q_isl_1', category: 'islamic', questionAr: 'في أي عام هجري وقعت غزوة بدر الكبرى؟', optionsAr: ['2 هـ', '3 هـ', '4 هـ', '5 هـ'], correctIndex: 0, difficulty: 'easy' },
  { id: 'q_isl_2', category: 'islamic', questionAr: 'من هو الصحابي الملقب بـ "سيف الله المسلول"؟', optionsAr: ['خالد بن الوليد', 'سعد بن أبي وقاص', 'عمرو بن العاص', 'أبو عبيدة بن الجراح'], correctIndex: 0, difficulty: 'easy' },
  { id: 'q_isl_3', category: 'islamic', questionAr: 'من هو الصحابي الملقب بـ "أمين هذه الأمة"؟', optionsAr: ['أبو عبيدة بن الجراح', 'معاذ بن جبل', 'عبدالرحمن بن عوف', 'طلحة بن عبيد الله'], correctIndex: 0, difficulty: 'medium' },
  { id: 'q_isl_4', category: 'islamic', questionAr: 'كم عدد الخلفاء الراشدين رضي الله عنهم؟', optionsAr: ['4 خلفاء', '5 خلفاء', '6 خلفاء', '3 خلفاء'], correctIndex: 0, difficulty: 'easy' },
  { id: 'q_isl_5', category: 'islamic', questionAr: 'من هو أول مؤذن في الإسلام؟', optionsAr: ['بلال بن رباح', 'عبدالله بن أم مكتوم', 'أبو موسى الأشعري', 'عمار بن ياسر'], correctIndex: 0, difficulty: 'easy' },
  { id: 'q_isl_6', category: 'islamic', questionAr: 'في أي سنة هجرية فُتحت مكة المكرمة؟', optionsAr: ['8 هـ', '6 هـ', '7 هـ', '9 هـ'], correctIndex: 0, difficulty: 'medium' },
  { id: 'q_isl_7', category: 'islamic', questionAr: 'ما اسم ناقة النبي محمد ﷺ؟', optionsAr: ['القصواء', 'البراق', 'العنقاء', 'الشهباء'], correctIndex: 0, difficulty: 'medium' },
  { id: 'q_isl_8', category: 'islamic', questionAr: 'من هو النبي الذي ابتلعه الحوت؟', optionsAr: ['يونس عليه السلام', 'موسى عليه السلام', 'أيوب عليه السلام', 'إلياس عليه السلام'], correctIndex: 0, difficulty: 'easy' },
  { id: 'q_isl_9', category: 'islamic', questionAr: 'من هو الصحابي الذي اهتز لموته عرش الرحمن؟', optionsAr: ['سعد بن معاذ', 'حمزة بن عبدالمطلب', 'مصعب بن عمير', 'جعفر بن أبي طالب'], correctIndex: 0, difficulty: 'medium' },
  { id: 'q_isl_10', category: 'islamic', questionAr: 'ما هي أول صلاة فُرضت بعد تحويل القبلة إلى الكعبة المشرفة؟', optionsAr: ['صلاة العصر', 'صلاة الفجر', 'صلاة المغرب', 'صلاة العشاء'], correctIndex: 0, difficulty: 'hard' },

  // 3. اللغة العربية (arabic)
  { id: 'q_ara_1', category: 'arabic', questionAr: 'من هو الشاعر الملقب بـ "أمير الشعراء"؟', optionsAr: ['أحمد شوقي', 'حافظ إبراهيم', 'المتنبي', 'محمود سامي البارودي'], correctIndex: 0, difficulty: 'easy' },
  { id: 'q_ara_2', category: 'arabic', questionAr: 'ما هو جمع كلمة "عَندليب"؟', optionsAr: ['عنادلب', 'عندليبات', 'عناديل', 'عنادل'], correctIndex: 3, difficulty: 'hard' },
  { id: 'q_ara_3', category: 'arabic', questionAr: 'ما إعراب كلمة (المسلمون) في جملة: "انتصر المسلمون"؟', optionsAr: ['فاعل مرفوع بالواو', 'مبتدأ مرفوع بالضمة', 'مفعول به منصوب', 'خبر مرفوع بالواو'], correctIndex: 0, difficulty: 'easy' },
  { id: 'q_ara_4', category: 'arabic', questionAr: 'من هو مؤلف كتاب "البيان والتبيين"؟', optionsAr: ['الجاحظ', 'ابن المقفع', 'المبرد', 'ابن قتيبة'], correctIndex: 0, difficulty: 'medium' },
  { id: 'q_ara_5', category: 'arabic', questionAr: 'ما اسم الصوت الذي يصدره الأسد؟', optionsAr: ['زئير', 'صهيل', 'هديل', 'عواء'], correctIndex: 0, difficulty: 'easy' },
  { id: 'q_ara_6', category: 'arabic', questionAr: 'كم عدد بحور الشعر العربي التي وضعها الخليل بن أحمد الفراهيدي وأضاف إليها الأخفش؟', optionsAr: ['16 بحراً', '12 بحراً', '14 بحراً', '20 بحراً'], correctIndex: 0, difficulty: 'medium' },
  { id: 'q_ara_7', category: 'arabic', questionAr: 'ما معنى كلمة "الليث" في المعاجم العربية؟', optionsAr: ['الأسد', 'الذئب', 'الصقر', 'السيف'], correctIndex: 0, difficulty: 'easy' },
  { id: 'q_ara_8', category: 'arabic', questionAr: 'من القائل: "الخيل والليل والبيداء تعرفني"؟', optionsAr: ['أبو الطيب المتنبي', 'عنترة بن شداد', 'امرؤ القيس', 'أبو تمام'], correctIndex: 0, difficulty: 'easy' },
  { id: 'q_ara_9', category: 'arabic', questionAr: 'ما هو ضد كلمة "الإيثار"؟', optionsAr: ['الأثَرَة (الأنانية)', 'الكرم', 'الجود', 'الحلم'], correctIndex: 0, difficulty: 'medium' },
  { id: 'q_ara_10', category: 'arabic', questionAr: 'أي من الحروف التالية يُعد من حروف الجزم للمضارع؟', optionsAr: ['لَمْ', 'لَنْ', 'كَيْ', 'حَتَّى'], correctIndex: 0, difficulty: 'medium' },

  // 4. العلوم (science)
  { id: 'q_sci_1', category: 'science', questionAr: 'ما هو الغاز الأكثر وفرة في الغلاف الجوي للأرض؟', optionsAr: ['النيتروجين (78%)', 'الأكسجين (21%)', 'ثاني أكسيد الكربون', 'الهيدروجين'], correctIndex: 0, difficulty: 'easy' },
  { id: 'q_sci_2', category: 'science', questionAr: 'ما هو العضو المسؤول عن ضخ الدم في جسم الإنسان؟', optionsAr: ['القلب', 'الرئتان', 'الكبد', 'الكليتان'], correctIndex: 0, difficulty: 'easy' },
  { id: 'q_sci_3', category: 'science', questionAr: 'ما هو الكوكب المعروف بـ "الكوكب الأحمر"؟', optionsAr: ['المريخ', 'الزهرة', 'عطارد', 'المشتري'], correctIndex: 0, difficulty: 'easy' },
  { id: 'q_sci_4', category: 'science', questionAr: 'كم عدد الكروموسومات في الخلية الجسدية الطبيعية للإنسان؟', optionsAr: ['46 كروموسوماً', '23 كروموسوماً', '48 كروموسوماً', '44 كروموسوماً'], correctIndex: 0, difficulty: 'medium' },
  { id: 'q_sci_5', category: 'science', questionAr: 'ما هو الفيتامين الذي يصنعه الجلد عند التعرض لأشعة الشمس؟', optionsAr: ['فيتامين D', 'فيتامين C', 'فيتامين A', 'فيتامين B12'], correctIndex: 0, difficulty: 'easy' },
  { id: 'q_sci_6', category: 'science', questionAr: 'ما هي أصغر عظمة في جسم الإنسان وتوجد في الأذن الوسطى؟', optionsAr: ['عظمة الركاب', 'عظمة الفخذ', 'عظمة القص', 'عظمة الترقوة'], correctIndex: 0, difficulty: 'medium' },
  { id: 'q_sci_7', category: 'science', questionAr: 'ما هو المعدن السائل الوحيد في درجة حرارة الغرفة؟', optionsAr: ['الزئبق', 'الحديد', 'النحاس', 'الألمنيوم'], correctIndex: 0, difficulty: 'easy' },
  { id: 'q_sci_8', category: 'science', questionAr: 'ما اسم العملية التي تصنع بها النباتات غذاءها باستخدام الضوء؟', optionsAr: ['البناء الضوئي', 'التنفس الخلوي', 'النتح', 'التخمر'], correctIndex: 0, difficulty: 'easy' },

  // 5. التاريخ (history)
  { id: 'q_his_1', category: 'history', questionAr: 'من هو القائد المسلم الذي فتح الأندلس عام 92 هـ؟', optionsAr: ['طارق بن زياد', 'قتيبة بن مسلم', 'محمد بن القاسم', 'صلاح الدين الأيوبي'], correctIndex: 0, difficulty: 'easy' },
  { id: 'q_his_2', category: 'history', questionAr: 'في أي عام ميلادي انتهت الحرب العالمية الثانية؟', optionsAr: ['1945 م', '1939 م', '1918 م', '1950 م'], correctIndex: 0, difficulty: 'easy' },
  { id: 'q_his_3', category: 'history', questionAr: 'من هو مؤسس علم الاجتماع ومؤلف "المقدمة" الشهيرة؟', optionsAr: ['ابن خلدون', 'ابن سينا', 'الفارابي', 'ابن رشد'], correctIndex: 0, difficulty: 'easy' },
  { id: 'q_his_4', category: 'history', questionAr: 'ما هي المعركة التي انتصر فيها المسلمون على التتار عام 658 هـ؟', optionsAr: ['معركة عين جالوت', 'معركة حطين', 'معركة اليرموك', 'معركة القادسية'], correctIndex: 0, difficulty: 'medium' },
  { id: 'q_his_5', category: 'history', questionAr: 'من هو الخليفة العباسي الذي أسس "بيت الحكمة" في بغداد؟', optionsAr: ['هارون الرشيد / المأمون', 'المعتصم بالله', 'أبو جعفر المنصور', 'المتوكل على الله'], correctIndex: 0, difficulty: 'medium' },
  { id: 'q_his_6', category: 'history', questionAr: 'من هو القائد الذي حرر القدس في معركة حطين عام 583 هـ؟', optionsAr: ['صلاح الدين الأيوبي', 'نور الدين زنكي', 'الظاهر بيبرس', 'عماد الدين زنكي'], correctIndex: 0, difficulty: 'easy' },
  { id: 'q_his_7', category: 'history', questionAr: 'في أي عام تم توحيد المملكة العربية السعودية على يد الملك عبدالعزيز رحمه الله؟', optionsAr: ['1932 م (1351 هـ)', '1925 م', '1940 م', '1918 م'], correctIndex: 0, difficulty: 'easy' },
  { id: 'q_his_8', category: 'history', questionAr: 'أي حضارة قديمة اشتهرت ببناء الأهرامات في الجيزة؟', optionsAr: ['الحضارة المصرية القديمة', 'حضارة بلاد الرافدين', 'الحضارة الفينيقية', 'الحضارة الإغريقية'], correctIndex: 0, difficulty: 'easy' },

  // 6. الجغرافيا (geography)
  { id: 'q_geo_1', category: 'geography', questionAr: 'ما هي أكبر قارة في العالم من حيث المساحة؟', optionsAr: ['قارة آسيا', 'قارة أفريقيا', 'أمريكا الشمالية', 'قارة أوروبا'], correctIndex: 0, difficulty: 'easy' },
  { id: 'q_geo_2', category: 'geography', questionAr: 'ما هو أطول نهر في العالم؟', optionsAr: ['نهر النيل', 'نهر الأمازون', 'نهر الفرات', 'نهر الدانوب'], correctIndex: 0, difficulty: 'easy' },
  { id: 'q_geo_3', category: 'geography', questionAr: 'ما هو المضيق الذي يصل بين البحر الأحمر وخليج عدن؟', optionsAr: ['مضيق باب المندب', 'مضيق هرمز', 'مضيق جبل طارق', 'مضيق البوسفور'], correctIndex: 0, difficulty: 'easy' },
  { id: 'q_geo_4', category: 'geography', questionAr: 'ما هي أعلى قمة جبلية في العالم؟', optionsAr: ['قمة إفرست', 'قمة كليمنجارو', 'قمة مون بلان', 'قمة أكونكاغوا'], correctIndex: 0, difficulty: 'easy' },
  { id: 'q_geo_5', category: 'geography', questionAr: 'ما هو أكبر محيط على وجه الأرض؟', optionsAr: ['المحيط الهادئ', 'المحيط الأطلسي', 'المحيط الهندي', 'المحيط المتجمد الشمالي'], correctIndex: 0, difficulty: 'easy' },
  { id: 'q_geo_6', category: 'geography', questionAr: 'أين تقع صحراء الربع الخالي؟', optionsAr: ['شبه الجزيرة العربية', 'شمال أفريقيا', 'وسط آسيا', 'أستراليا'], correctIndex: 0, difficulty: 'easy' },
  { id: 'q_geo_7', category: 'geography', questionAr: 'ما هي أخفض نقطة على سطح اليابسة في العالم؟', optionsAr: ['البحر الميت', 'منخفض القطارة', 'وادي الموت', 'بحيرة عسل'], correctIndex: 0, difficulty: 'medium' },
  { id: 'q_geo_8', category: 'geography', questionAr: 'ما هو المضيق الذي يفصل بين قارة أوروبا وقارة أفريقيا؟', optionsAr: ['مضيق جبل طارق', 'مضيق هرمز', 'مضيق ملقا', 'مضيق دوفر'], correctIndex: 0, difficulty: 'easy' },

  // 9. الفيزياء (physics)
  { id: 'q_phy_1', category: 'physics', questionAr: 'ما هي وحدة قياس القوة في النظام الدولي للوحدات (SI)؟', optionsAr: ['النيوتن (N)', 'الجول (J)', 'الواط (W)', 'الباسكال (Pa)'], correctIndex: 0, difficulty: 'easy' },
  { id: 'q_phy_2', category: 'physics', questionAr: 'كم تبلغ سرعة الضوء في الفراغ تقريباً؟', optionsAr: ['300,000 كم/ثانية', '150,000 كم/ثانية', '30,000 كم/ثانية', '1,000,000 كم/ثانية'], correctIndex: 0, difficulty: 'easy' },
  { id: 'q_phy_3', category: 'physics', questionAr: 'ما هي وحدة قياس المقاومة الكهربائية؟', optionsAr: ['الأوم (Ω)', 'الأمبير (A)', 'الفولت (V)', 'الكولوم (C)'], correctIndex: 0, difficulty: 'easy' },
  { id: 'q_phy_4', category: 'physics', questionAr: 'من هو العالم الذي صاغ قوانين الحركة الثلاثة وقانون الجذب العام؟', optionsAr: ['إسحاق نيوتن', 'ألبرت أينشتاين', 'نيكولا تسلا', 'غاليليو غاليلي'], correctIndex: 0, difficulty: 'easy' },
  { id: 'q_phy_5', category: 'physics', questionAr: 'ما هي وحدة قياس التردد؟', optionsAr: ['الهرتز (Hz)', 'الديسيبل (dB)', 'الواط (W)', 'التسلا (T)'], correctIndex: 0, difficulty: 'easy' },
  { id: 'q_phy_6', category: 'physics', questionAr: 'حسب قانون أوم، الجهد الكهربائي (V) يساوي:', optionsAr: ['التيار (I) × المقاومة (R)', 'التيار (I) ÷ المقاومة (R)', 'المقاومة (R) + التيار (I)', 'القدرة (P) × الزمن (t)'], correctIndex: 0, difficulty: 'medium' },
  { id: 'q_phy_7', category: 'physics', questionAr: 'ما هي وحدة قياس الشغل والطاقة في النظام الدولي؟', optionsAr: ['الجول (J)', 'النيوتن (N)', 'الفولت (V)', 'الأمبير (A)'], correctIndex: 0, difficulty: 'easy' },
  { id: 'q_phy_8', category: 'physics', questionAr: 'ما هو الجهاز المستخدم لقياس شدة التيار الكهربائي؟', optionsAr: ['الأميتر', 'الفولتميتر', 'الباروميتر', 'الترموميتر'], correctIndex: 0, difficulty: 'medium' },

  // 10. الرياضة (sports) - كرة القدم العربية والعالمية، كأس العالم، والأولمبياد
  { id: 'q_spo_1', category: 'sports', questionAr: 'أي منتخب عربي حقق إنجازاً تاريخياً بالوصول إلى نصف نهائي كأس العالم FIFA قطر 2022؟', optionsAr: ['المنتخب المغربي', 'المنتخب السعودي', 'المنتخب التونسي', 'المنتخب الجزائري'], correctIndex: 0, difficulty: 'easy' },
  { id: 'q_spo_2', category: 'sports', questionAr: 'أي منتخب عربي فاز على منتخب الأرجنتين (بطل العالم) بنتيجة 2-1 في دور المجموعات لكأس العالم 2022؟', optionsAr: ['المنتخب السعودي', 'المنتخب المغربي', 'المنتخب القطري', 'المنتخب المصري'], correctIndex: 0, difficulty: 'easy' },
  { id: 'q_spo_3', category: 'sports', questionAr: 'من هو المنتخب الأكثر تتويجاً بلقب كأس العالم لكرة القدم برصيد 5 ألقاب؟', optionsAr: ['منتخب البرازيل', 'منتخب ألمانيا', 'منتخب إيطاليا', 'منتخب الأرجنتين'], correctIndex: 0, difficulty: 'easy' },
  { id: 'q_spo_4', category: 'sports', questionAr: 'ما هو النادي الأكثر تتويجاً بلقب دوري أبطال أوروبا عبر التاريخ؟', optionsAr: ['ريال مدريد الإسباني', 'إي سي ميلان الإيطالي', 'بايرن ميونخ الألماني', 'ليفربول الإنجليزي'], correctIndex: 0, difficulty: 'easy' },
  { id: 'q_spo_5', category: 'sports', questionAr: 'من هو المنتخب الأكثر تتويجاً بلقب كأس أمم أفريقيا عبر التاريخ (7 ألقاب)؟', optionsAr: ['منتخب مصر', 'منتخب الكاميرون', 'منتخب غانا', 'منتخب نيجيريا'], correctIndex: 0, difficulty: 'easy' },
  { id: 'q_spo_6', category: 'sports', questionAr: 'ما هو النادي الأكثر تتويجاً بلقب دوري أبطال أفريقيا؟', optionsAr: ['الأهلي المصري', 'الزمالك المصري', 'الترجي التونسي', 'الوداد المغربي'], correctIndex: 0, difficulty: 'easy' },
  { id: 'q_spo_7', category: 'sports', questionAr: 'ما هو النادي الأكثر تتويجاً بلقب دوري أبطال آسيا (4 ألقاب)؟', optionsAr: ['الهلال السعودي', 'أوراوا ريد دياموندز', 'الاتحاد السعودي', 'العين الإماراتي'], correctIndex: 0, difficulty: 'easy' },
  { id: 'q_spo_8', category: 'sports', questionAr: 'في أي عام أُقيمت أول بطولة لكأس العالم لكرة القدم في الأوروغواي؟', optionsAr: ['1930 م', '1934 م', '1928 م', '1950 م'], correctIndex: 0, difficulty: 'medium' },
  { id: 'q_spo_9', category: 'sports', questionAr: 'من هو الهداف التاريخي لبطولات كأس العالم لكرة القدم برصيد 16 هدفاً؟', optionsAr: ['ميروسلاف كلوزه (ألمانيا)', 'رونالدو نازاريو (البرازيل)', 'ليونيل ميسي (الأرجنتين)', 'كيليان مبابي (فرنسا)'], correctIndex: 0, difficulty: 'medium' },
  { id: 'q_spo_10', category: 'sports', questionAr: 'من هو اللاعب الأكثر فوزاً بجائزة الكرة الذهبية (Ballon d\'Or) بـ 8 مرات؟', optionsAr: ['ليونيل ميسي', 'كريستيانو رونالدو', 'ميشيل بلاتيني', 'يوهان كرويف'], correctIndex: 0, difficulty: 'easy' },
  { id: 'q_spo_11', category: 'sports', questionAr: 'أي منتخب توج بلقب كأس العرب FIFA 2021 التي أُقيمت في قطر؟', optionsAr: ['المنتخب الجزائري', 'المنتخب التونسي', 'المنتخب المغربي', 'المنتخب المصري'], correctIndex: 0, difficulty: 'easy' },
  { id: 'q_spo_12', category: 'sports', questionAr: 'أي منتخب فاز بلقب كأس آسيا 2019 وكأس آسيا 2023 على التوالي؟', optionsAr: ['المنتخب القطري', 'المنتخب الياباني', 'المنتخب السعودي', 'المنتخب الكوري الجنوبي'], correctIndex: 0, difficulty: 'easy' },
  { id: 'q_spo_13', category: 'sports', questionAr: 'كم مرة توج المنتخب السعودي بلقب كأس أمم آسيا؟', optionsAr: ['3 مرات', 'مرتان', '4 مرات', 'مرة واحدة'], correctIndex: 0, difficulty: 'medium' },
  { id: 'q_spo_14', category: 'sports', questionAr: 'أي منتخب عربي كان أول منتخب عربي وأفريقي يتأهل لنهائيات كأس العالم عام 1934م؟', optionsAr: ['منتخب مصر', 'منتخب المغرب', 'منتخب تونس', 'منتخب الجزائر'], correctIndex: 0, difficulty: 'medium' },
  { id: 'q_spo_15', category: 'sports', questionAr: 'أي منتخب عربي حقق أول فوز عربي وأفريقي في تاريخ كأس العالم (على المكسيك 3-1 عام 1978)؟', optionsAr: ['منتخب تونس', 'منتخب الجزائر', 'منتخب المغرب', 'منتخب مصر'], correctIndex: 0, difficulty: 'medium' },
  { id: 'q_spo_16', category: 'sports', questionAr: 'من هو النجم العربي المصري الذي فاز بجائزة الحذاء الذهبي في الدوري الإنجليزي الممتاز 3 مرات؟', optionsAr: ['محمد صلاح', 'رياض محرز', 'حكيم زياش', 'أشرف حكيمي'], correctIndex: 0, difficulty: 'easy' },
  { id: 'q_spo_17', category: 'sports', questionAr: 'من هو النجم الجزائري الذي توج بلقب الدوري الإنجليزي الممتاز مع ليستر سيتي ومانشستر سيتي ودوري أبطال أوروبا؟', optionsAr: ['رياض محرز', 'إسلام سليماني', 'ياسين براهيمي', 'إسماعيل بن ناصر'], correctIndex: 0, difficulty: 'easy' },
  { id: 'q_spo_18', category: 'sports', questionAr: 'كم عدد الحلقات المتشابكة في شعار الألعاب الأولمبية؟', optionsAr: ['5 حلقات', '6 حلقات', '4 حلقات', '7 حلقات'], correctIndex: 0, difficulty: 'easy' },
  { id: 'q_spo_19', category: 'sports', questionAr: 'إلى ماذا ترمز الحلقات الخمس في العلم الأولمبي؟', optionsAr: ['قارات العالم الخمس المأهولة', 'الألعاب الرياضية الخمس الأولى', 'الدول الخمس المؤسسة', 'قيم الأولمبياد الخمس'], correctIndex: 0, difficulty: 'easy' },
  { id: 'q_spo_20', category: 'sports', questionAr: 'في أي مدينة أُقيمت أول دورة ألعاب أولمبية حديثة عام 1896م؟', optionsAr: ['أثينا - اليونان', 'باريس - فرنسا', 'لندن - بريطانيا', 'روما - إيطاليا'], correctIndex: 0, difficulty: 'medium' },
  { id: 'q_spo_21', category: 'sports', questionAr: 'كم تبلغ مسافة سباق الماراثون الرسمي في الألعاب الأولمبية؟', optionsAr: ['42.195 كيلومتراً', '40.000 كيلومتراً', '50.000 كيلومتراً', '35.500 كيلومتراً'], correctIndex: 0, difficulty: 'hard' },
  { id: 'q_spo_22', category: 'sports', questionAr: 'من هو العداء الجامايكي صاحب الرقم القياسي العالمي في سباق 100 متر (9.58 ثانية)؟', optionsAr: ['يوسين بولت', 'تايسون غاي', 'جاستن غاتلين', 'كارل لويس'], correctIndex: 0, difficulty: 'easy' },
  { id: 'q_spo_23', category: 'sports', questionAr: 'من هو البطل الأولمبي المغربي الذي حقق ذهبيتي 1500 متر و5000 متر في أولمبياد أثينا 2004؟', optionsAr: ['هشام الكروج', 'سعيد عويطة', 'سفيان البقالي', 'نوال المتوكل'], correctIndex: 0, difficulty: 'medium' },
  { id: 'q_spo_24', category: 'sports', questionAr: 'من هو البطل الأولمبي القطري المتوج بذهبية الوثب العالي في أولمبياد طوكيو 2020؟', optionsAr: ['معتز برشم', 'ناصر العطية', 'فارس حسونة', 'طلال منصور'], correctIndex: 0, difficulty: 'easy' },
  { id: 'q_spo_25', category: 'sports', questionAr: 'من هو السباح التونسي الذي توج بذهبية 1500 متر سباحة حرة في أولمبياد بكين 2008 وأولمبياد طوكيو؟', optionsAr: ['أسامة الملولي / أحمد الحفناوي', 'فريديريك بوسكيه', 'مايكل فيلبس', 'يان ثورب'], correctIndex: 0, difficulty: 'medium' },
  { id: 'q_spo_26', category: 'sports', questionAr: 'كم عدد لاعبي فريق كرة السلة داخل أرض الملعب لكل فريق؟', optionsAr: ['5 لاعبين', '6 لاعبين', '7 لاعبين', '9 لاعبين'], correctIndex: 0, difficulty: 'easy' },
  { id: 'q_spo_27', category: 'sports', questionAr: 'كم عدد لاعبي فريق الكرة الطائرة داخل الملعب لكل فريق؟', optionsAr: ['6 لاعبين', '5 لاعبين', '7 لاعبين', '8 لاعبين'], correctIndex: 0, difficulty: 'easy' },
  { id: 'q_spo_28', category: 'sports', questionAr: 'كم عدد لاعبي فريق كرة اليد داخل أرض الملعب (بما فيهم حارس المرمى)؟', optionsAr: ['7 لاعبين', '6 لاعبين', '8 لاعبين', '5 لاعبين'], correctIndex: 0, difficulty: 'medium' },
  { id: 'q_spo_29', category: 'sports', questionAr: 'ما هي البطولة الكبرى في التنس التي تُقام على الملاعب الترابية (الرملية) في باريس؟', optionsAr: ['رولان غاروس (فرنسا المفتوحة)', 'ويمبلدون', 'أستراليا المفتوحة', 'أمريكا المفتوحة'], correctIndex: 0, difficulty: 'medium' },
  { id: 'q_spo_30', category: 'sports', questionAr: 'ما هي أقدم بطولة تنس في العالم وتُقام على الملاعب العشبية في لندن؟', optionsAr: ['بطولة ويمبلدون', 'بطولة رولان غاروس', 'بطولة أمريكا المفتوحة', 'بطولة أستراليا المفتوحة'], correctIndex: 0, difficulty: 'easy' },
  { id: 'q_spo_31', category: 'sports', questionAr: 'أي نادي إماراتي توج بلقب دوري أبطال آسيا عامي 2003 و2024؟', optionsAr: ['نادي العين الإماراتي', 'نادي شباب الأهلي', 'نادي الوصل', 'نادي الجزيرة'], correctIndex: 0, difficulty: 'easy' },
  { id: 'q_spo_32', category: 'sports', questionAr: 'أي منتخب توج بلقب كأس العالم 2018 في روسيا؟', optionsAr: ['منتخب فرنسا', 'منتخب كرواتيا', 'منتخب بلجيكا', 'منتخب البرازيل'], correctIndex: 0, difficulty: 'easy' },
  { id: 'q_spo_33', category: 'sports', questionAr: 'من هو اللاعب الوحيد في التاريخ الذي فاز بكأس العالم 3 مرات كلاعب (1958، 1962، 1970)؟', optionsAr: ['الأسطورة بيليه (البرازيل)', 'دييغو مارادونا', 'فرانتس بيكنباور', 'زين الدين زيدان'], correctIndex: 0, difficulty: 'easy' },
  { id: 'q_spo_34', category: 'sports', questionAr: 'ما هي مدة الأشواط الإضافية في مباريات كرة القدم عند انتهاء الوقت الأصلي بالتعادل؟', optionsAr: ['30 دقيقة مقسمة على شوطين (15 لكل شوط)', '20 دقيقة مقسمة على شوطين', '45 دقيقة شوط واحد', '15 دقيقة فقط'], correctIndex: 0, difficulty: 'easy' },
  { id: 'q_spo_35', category: 'sports', questionAr: 'في أي عام توج المنتخب العراقي بلقب كأس أمم آسيا التاريخي؟', optionsAr: ['2007 م', '2004 م', '2011 م', '2015 م'], correctIndex: 0, difficulty: 'easy' },
];

// Procedural Dynamic Question Bank Builder (> 550 total distinct questions)
function buildFullQuestionBank(): QuizQuestion[] {
  const bank: QuizQuestion[] = [...CURATED_QUESTIONS];

  // A. Procedural Quran Surahs (Order, Type, Verses) -> +90 questions
  const surahFacts: Array<{ name: string; order: number; verses: number; type: 'مكية' | 'مدنية' }> = [
    { name: 'الفاتحة', order: 1, verses: 7, type: 'مكية' },
    { name: 'البقرة', order: 2, verses: 286, type: 'مدنية' },
    { name: 'آل عمران', order: 3, verses: 200, type: 'مدنية' },
    { name: 'النساء', order: 4, verses: 176, type: 'مدنية' },
    { name: 'المائدة', order: 5, verses: 120, type: 'مدنية' },
    { name: 'الأنعام', order: 6, verses: 165, type: 'مكية' },
    { name: 'الأعراف', order: 7, verses: 206, type: 'مكية' },
    { name: 'الأنفال', order: 8, verses: 75, type: 'مدنية' },
    { name: 'التوبة', order: 9, verses: 129, type: 'مدنية' },
    { name: 'يونس', order: 10, verses: 109, type: 'مكية' },
    { name: 'هود', order: 11, verses: 123, type: 'مكية' },
    { name: 'يوسف', order: 12, verses: 111, type: 'مكية' },
    { name: 'الرعد', order: 13, verses: 43, type: 'مدنية' },
    { name: 'إبراهيم', order: 14, verses: 52, type: 'مكية' },
    { name: 'الحجر', order: 15, verses: 99, type: 'مكية' },
    { name: 'النحل', order: 16, verses: 128, type: 'مكية' },
    { name: 'الإسراء', order: 17, verses: 111, type: 'مكية' },
    { name: 'الكهف', order: 18, verses: 110, type: 'مكية' },
    { name: 'مريم', order: 19, verses: 98, type: 'مكية' },
    { name: 'طه', order: 20, verses: 135, type: 'مكية' },
    { name: 'الأنبياء', order: 21, verses: 112, type: 'مكية' },
    { name: 'الحج', order: 22, verses: 78, type: 'مدنية' },
    { name: 'المؤمنون', order: 23, verses: 118, type: 'مكية' },
    { name: 'النور', order: 24, verses: 64, type: 'مدنية' },
    { name: 'الفرقان', order: 25, verses: 77, type: 'مكية' },
    { name: 'يس', order: 36, verses: 83, type: 'مكية' },
    { name: 'الصافات', order: 37, verses: 182, type: 'مكية' },
    { name: 'ص', order: 38, verses: 88, type: 'مكية' },
    { name: 'الزمر', order: 39, verses: 75, type: 'مكية' },
    { name: 'غافر', order: 40, verses: 85, type: 'مكية' },
    { name: 'فصلت', order: 41, verses: 54, type: 'مكية' },
    { name: 'الشورى', order: 42, verses: 53, type: 'مكية' },
    { name: 'الرحمن', order: 55, verses: 78, type: 'مدنية' },
    { name: 'الواقعة', order: 56, verses: 96, type: 'مكية' },
    { name: 'الحديد', order: 57, verses: 29, type: 'مدنية' },
    { name: 'الملك', order: 67, verses: 30, type: 'مكية' },
    { name: 'القلم', order: 68, verses: 52, type: 'مكية' },
    { name: 'الحاقة', order: 69, verses: 52, type: 'مكية' },
    { name: 'نوح', order: 71, verses: 28, type: 'مكية' },
    { name: 'الجن', order: 72, verses: 28, type: 'مكية' },
    { name: 'المزمل', order: 73, verses: 20, type: 'مكية' },
    { name: 'المدثر', order: 74, verses: 56, type: 'مكية' },
    { name: 'القيامة', order: 75, verses: 40, type: 'مكية' },
    { name: 'الإنسان', order: 76, verses: 31, type: 'مدنية' },
    { name: 'النبأ', order: 78, verses: 40, type: 'مكية' },
    { name: 'الأعلى', order: 87, verses: 19, type: 'مكية' },
    { name: 'الغاشية', order: 88, verses: 26, type: 'مكية' },
    { name: 'الفجر', order: 89, verses: 30, type: 'مكية' },
    { name: 'البلد', order: 90, verses: 20, type: 'مكية' },
    { name: 'الشمس', order: 91, verses: 15, type: 'مكية' },
    { name: 'الليل', order: 92, verses: 21, type: 'مكية' },
    { name: 'الضحى', order: 93, verses: 11, type: 'مكية' },
    { name: 'الشرح', order: 94, verses: 8, type: 'مكية' },
    { name: 'التين', order: 95, verses: 8, type: 'مكية' },
    { name: 'العلق', order: 96, verses: 19, type: 'مكية' },
    { name: 'القدر', order: 97, verses: 5, type: 'مكية' },
    { name: 'الكوثر', order: 108, verses: 3, type: 'مكية' },
    { name: 'الإخلاص', order: 112, verses: 4, type: 'مكية' },
    { name: 'الفلق', order: 113, verses: 5, type: 'مكية' },
    { name: 'الناس', order: 114, verses: 6, type: 'مكية' },
  ];

  surahFacts.forEach((s, idx) => {
    const w1 = s.verses + 5;
    const w2 = Math.max(3, s.verses - 4);
    const w3 = s.verses + 12;
    bank.push({
      id: `gen_qur_v_${idx}`,
      category: 'quran',
      questionAr: `كم عدد آيات سورة ${s.name} في المصحف الشريف؟`,
      optionsAr: [`${s.verses} آية`, `${w1} آية`, `${w2} آية`, `${w3} آية`],
      correctIndex: 0,
      difficulty: 'medium',
    });

    const o1 = s.order === 114 ? 110 : s.order + 1;
    const o2 = Math.max(1, s.order - 2);
    const o3 = ((s.order + 9) % 114) + 1;
    bank.push({
      id: `gen_qur_o_${idx}`,
      category: 'quran',
      questionAr: `ما هو رقم ترتيب سورة ${s.name} في المصحف الشريف؟`,
      optionsAr: [`السورة رقم ${s.order}`, `السورة رقم ${o1}`, `السورة رقم ${o2}`, `السورة رقم ${o3}`],
      correctIndex: 0,
      difficulty: 'medium',
    });
  });

  // B. Procedural Countries & Capitals -> +130 questions
  const countriesCapitals: Array<{ country: string; capital: string; continent: string; currency: string }> = [
    { country: 'المملكة العربية السعودية', capital: 'الرياض', continent: 'آسيا', currency: 'الريال السعودي' },
    { country: 'اليمن', capital: 'صنعاء', continent: 'آسيا', currency: 'الريال اليمني' },
    { country: 'مصر', capital: 'القاهرة', continent: 'أفريقيا', currency: 'الجنيه المصري' },
    { country: 'الإمارات العربية المتحدة', capital: 'أبوظبي', continent: 'آسيا', currency: 'الدرهم الإماراتي' },
    { country: 'الكويت', capital: 'مدينة الكويت', continent: 'آسيا', currency: 'الدينار الكويتي' },
    { country: 'قطر', capital: 'الدوحة', continent: 'آسيا', currency: 'الريال القطري' },
    { country: 'البحرين', capital: 'المنامة', continent: 'آسيا', currency: 'الدينار البحريني' },
    { country: 'سلطنة عُمان', capital: 'مسقط', continent: 'آسيا', currency: 'الريال العماني' },
    { country: 'الأردن', capital: 'عمّان', continent: 'آسيا', currency: 'الدينار الأردني' },
    { country: 'العراق', capital: 'بغداد', continent: 'آسيا', currency: 'الدينار العراقي' },
    { country: 'فلسطين', capital: 'القدس', continent: 'آسيا', currency: 'الدينار / الشيكل' },
    { country: 'سوريا', capital: 'دمشق', continent: 'آسيا', currency: 'الليرة السورية' },
    { country: 'لبنان', capital: 'بيروت', continent: 'آسيا', currency: 'الليرة اللبنانية' },
    { country: 'السودان', capital: 'الخرطوم', continent: 'أفريقيا', currency: 'الجنيه السوداني' },
    { country: 'ليبيا', capital: 'طرابلس', continent: 'أفريقيا', currency: 'الدينار الليبي' },
    { country: 'تونس', capital: 'تونس', continent: 'أفريقيا', currency: 'الدينار التونسي' },
    { country: 'الجزائر', capital: 'الجزائر', continent: 'أفريقيا', currency: 'الدينار الجزائري' },
    { country: 'المغرب', capital: 'الرباط', continent: 'أفريقيا', currency: 'الدرهم المغربي' },
    { country: 'موريتانيا', capital: 'نواكشوط', continent: 'أفريقيا', currency: 'الأوقية الموريتانية' },
    { country: 'الصومال', capital: 'مقديشو', continent: 'أفريقيا', currency: 'الشلن الصومالي' },
    { country: 'تركيا', capital: 'أنقرة', continent: 'آسيا وأوروبا', currency: 'الليرة التركية' },
    { country: 'باكستان', capital: 'إسلام آباد', continent: 'آسيا', currency: 'الروبية الباكستانية' },
    { country: 'ماليزيا', capital: 'كوالالمبور', continent: 'آسيا', currency: 'الرينغيت الماليزي' },
    { country: 'إندونيسيا', capital: 'جاكرتا', continent: 'آسيا', currency: 'الروبية الإندونيسية' },
    { country: 'اليابان', capital: 'طوكيو', continent: 'آسيا', currency: 'الين الياباني' },
    { country: 'كوريا الجنوبية', capital: 'سيول', continent: 'آسيا', currency: 'الوون الكوري' },
    { country: 'الصين', capital: 'بكين', continent: 'آسيا', currency: 'اليوان الصيني' },
    { country: 'الهند', capital: 'نيودلهي', continent: 'آسيا', currency: 'الروبية الهندية' },
    { country: 'فرنسا', capital: 'باريس', continent: 'أوروبا', currency: 'اليورو' },
    { country: 'ألمانيا', capital: 'برلين', continent: 'أوروبا', currency: 'اليورو' },
    { country: 'إيطاليا', capital: 'روما', continent: 'أوروبا', currency: 'اليورو' },
    { country: 'إسبانيا', capital: 'مدريد', continent: 'أوروبا', currency: 'اليورو' },
    { country: 'البرتغال', capital: 'لشبونة', continent: 'أوروبا', currency: 'اليورو' },
    { country: 'المملكة المتحدة', capital: 'لندن', continent: 'أوروبا', currency: 'الجنيه الإسترليني' },
    { country: 'روسيا', capital: 'موسكو', continent: 'أوروبا وآسيا', currency: 'الروبل الروسي' },
    { country: 'سويسرا', capital: 'برن', continent: 'أوروبا', currency: 'الفرنك السويسري' },
    { country: 'النمسا', capital: 'فيينا', continent: 'أوروبا', currency: 'اليورو' },
    { country: 'اليونان', capital: 'أثينا', continent: 'أوروبا', currency: 'اليورو' },
    { country: 'السويد', capital: 'ستوكهولم', continent: 'أوروبا', currency: 'الكرونة السويدية' },
    { country: 'النرويج', capital: 'أوسلو', continent: 'أوروبا', currency: 'الكرونة النرويجية' },
    { country: 'البرازيل', capital: 'برازيليا', continent: 'أمريكا الجنوبية', currency: 'الريال البرازيلي' },
    { country: 'الأرجنتين', capital: 'بوينس آيرس', continent: 'أمريكا الجنوبية', currency: 'البيزو الأرجنتيني' },
    { country: 'كندا', capital: 'أوتاوا', continent: 'أمريكا الشمالية', currency: 'الدولار الكندي' },
    { country: 'الولايات المتحدة', capital: 'واشنطن العاصمة', continent: 'أمريكا الشمالية', currency: 'الدولار الأمريكي' },
    { country: 'المكسيك', capital: 'مكسيكو سيتي', continent: 'أمريكا الشمالية', currency: 'البيزو المكسيكي' },
    { country: 'أستراليا', capital: 'كانبرا', continent: 'أوقيانوسيا', currency: 'الدولار الأسترالي' },
    { country: 'نيجيريا', capital: 'أبوجا', continent: 'أفريقيا', currency: 'النايرا النيجيري' },
    { country: 'كينيا', capital: 'نيروبي', continent: 'أفريقيا', currency: 'الشلن الكيني' },
    { country: 'جنوب أفريقيا', capital: 'بريتوريا', continent: 'أفريقيا', currency: 'الراند الجنوب أفريقي' },
    { country: 'السنغال', capital: 'داكار', continent: 'أفريقيا', currency: 'الفرنك الأفريقي' },
  ];

  countriesCapitals.forEach((item, idx) => {
    const d1 = countriesCapitals[(idx + 3) % countriesCapitals.length].capital;
    const d2 = countriesCapitals[(idx + 7) % countriesCapitals.length].capital;
    const d3 = countriesCapitals[(idx + 11) % countriesCapitals.length].capital;
    bank.push({
      id: `gen_cap_${idx}`,
      category: 'capitals',
      questionAr: `ما هي عاصمة دولة ${item.country}؟`,
      optionsAr: [item.capital, d1, d2, d3],
      correctIndex: 0,
      difficulty: 'easy',
    });

    const c1 = countriesCapitals[(idx + 4) % countriesCapitals.length].country;
    const c2 = countriesCapitals[(idx + 9) % countriesCapitals.length].country;
    const c3 = countriesCapitals[(idx + 14) % countriesCapitals.length].country;
    bank.push({
      id: `gen_cap_rev_${idx}`,
      category: 'capitals',
      questionAr: `مدينة "${item.capital}" هي العاصمة الرسمية لأي دولة؟`,
      optionsAr: [item.country, c1, c2, c3],
      correctIndex: 0,
      difficulty: 'medium',
    });
  });

  // C. Procedural Science & Chemical Elements -> +60 questions
  const chemicalElements: Array<{ name: string; symbol: string; atomicNum: number }> = [
    { name: 'الهيدروجين', symbol: 'H', atomicNum: 1 },
    { name: 'الهيليوم', symbol: 'He', atomicNum: 2 },
    { name: 'الكربون', symbol: 'C', atomicNum: 6 },
    { name: 'النيتروجين', symbol: 'N', atomicNum: 7 },
    { name: 'الأكسجين', symbol: 'O', atomicNum: 8 },
    { name: 'الصوديوم', symbol: 'Na', atomicNum: 11 },
    { name: 'المغنيسيوم', symbol: 'Mg', atomicNum: 12 },
    { name: 'الألمنيوم', symbol: 'Al', atomicNum: 13 },
    { name: 'السيليكون', symbol: 'Si', atomicNum: 14 },
    { name: 'الفسفور', symbol: 'P', atomicNum: 15 },
    { name: 'الكبريت', symbol: 'S', atomicNum: 16 },
    { name: 'الكلور', symbol: 'Cl', atomicNum: 17 },
    { name: 'البوتاسيوم', symbol: 'K', atomicNum: 19 },
    { name: 'الكالسيوم', symbol: 'Ca', atomicNum: 20 },
    { name: 'الحديد', symbol: 'Fe', atomicNum: 26 },
    { name: 'النحاس', symbol: 'Cu', atomicNum: 29 },
    { name: 'الخارصين (الزنك)', symbol: 'Zn', atomicNum: 30 },
    { name: 'الفضة', symbol: 'Ag', atomicNum: 47 },
    { name: 'القصدير', symbol: 'Sn', atomicNum: 50 },
    { name: 'اليود', symbol: 'I', atomicNum: 53 },
    { name: 'الذهب', symbol: 'Au', atomicNum: 79 },
    { name: 'الزئبق', symbol: 'Hg', atomicNum: 80 },
    { name: 'الرصاص', symbol: 'Pb', atomicNum: 82 },
    { name: 'اليورانيوم', symbol: 'U', atomicNum: 92 },
  ];

  chemicalElements.forEach((el, idx) => {
    const s1 = chemicalElements[(idx + 2) % chemicalElements.length].symbol;
    const s2 = chemicalElements[(idx + 5) % chemicalElements.length].symbol;
    const s3 = chemicalElements[(idx + 9) % chemicalElements.length].symbol;
    bank.push({
      id: `gen_sci_el_${idx}`,
      category: 'science',
      questionAr: `ما هو الرمز الكيميائي لعنصر ${el.name} في الجدول الدوري؟`,
      optionsAr: [el.symbol, s1, s2, s3],
      correctIndex: 0,
      difficulty: 'medium',
    });

    bank.push({
      id: `gen_sci_at_${idx}`,
      category: 'science',
      questionAr: `ما هو العدد الذري لعنصر ${el.name} (${el.symbol})؟`,
      optionsAr: [`${el.atomicNum}`, `${el.atomicNum + 2}`, `${Math.max(1, el.atomicNum - 1)}`, `${el.atomicNum + 5}`],
      correctIndex: 0,
      difficulty: 'hard',
    });
  });

  // D. Procedural Mathematics (Mental Arithmetic, Multiplication, Squares, Equations) -> +120 questions
  for (let i = 1; i <= 40; i++) {
    const a = (i * 7) % 25 + 6;
    const b = (i * 5) % 18 + 4;
    const prod = a * b;
    bank.push({
      id: `gen_math_mul_${i}`,
      category: 'math',
      questionAr: `ما هو ناتج العملية الحسابية: ${a} × ${b} ؟`,
      optionsAr: [`${prod}`, `${prod + a}`, `${prod - b}`, `${prod + 10}`],
      correctIndex: 0,
      difficulty: 'medium',
    });

    const x = i + 3;
    const coef = (i % 5) + 2;
    const add = (i % 9) + 4;
    const rhs = coef * x + add;
    bank.push({
      id: `gen_math_eq_${i}`,
      category: 'math',
      questionAr: `إذا كان ${coef}س + ${add} = ${rhs} ، فما قيمة (س)؟`,
      optionsAr: [`${x}`, `${x + 2}`, `${Math.max(1, x - 1)}`, `${x + 4}`],
      correctIndex: 0,
      difficulty: 'medium',
    });

    const sqBase = i + 4;
    const sqVal = sqBase * sqBase;
    bank.push({
      id: `gen_math_sq_${i}`,
      category: 'math',
      questionAr: `ما هو الجذر التربيعي للعدد ${sqVal} ؟`,
      optionsAr: [`${sqBase}`, `${sqBase + 1}`, `${sqBase - 1}`, `${sqBase + 3}`],
      correctIndex: 0,
      difficulty: 'easy',
    });
  }

  // E. Procedural Physics (Speed, Force, Energy, Ohm's Law, Power) -> +60 questions
  for (let i = 1; i <= 30; i++) {
    const mass = i * 2 + 2;
    const acc = (i % 6) + 2;
    const force = mass * acc;
    bank.push({
      id: `gen_phy_f_${i}`,
      category: 'physics',
      questionAr: `جسم كتلته ${mass} كجم يتحرك بتسارع ${acc} م/ث²، ما مقدار القوة المؤثرة عليه بالنيوتن؟`,
      optionsAr: [`${force} نيوتن`, `${force + 10} نيوتن`, `${Math.max(2, force - 6)} نيوتن`, `${mass + acc} نيوتن`],
      correctIndex: 0,
      difficulty: 'medium',
    });

    const current = (i % 8) + 2;
    const res = i + 3;
    const volt = current * res;
    bank.push({
      id: `gen_phy_v_${i}`,
      category: 'physics',
      questionAr: `دائرة كهربائية يمر بها تيار شدته ${current} أمبير ومقاومتها ${res} أوم، كم يبلغ فرق الجهد (الفولت)؟`,
      optionsAr: [`${volt} فولت`, `${volt + 8} فولت`, `${Math.max(2, volt - 4)} فولت`, `${current + res} فولت`],
      correctIndex: 0,
      difficulty: 'medium',
    });
  }

  // F. Additional Islamic, History, Geography, Arabic Landmarks -> +60 questions
  const landmarks: Array<{ landmark: string; cityOrCountry: string; cat: CategoryId }> = [
    { landmark: 'المسجد النبوي الشريف', cityOrCountry: 'المدينة المنورة - السعودية', cat: 'islamic' },
    { landmark: 'المسجد الأقصى المبارك', cityOrCountry: 'القدس - فلسطين', cat: 'islamic' },
    { landmark: 'الجامع الأزهر', cityOrCountry: 'القاهرة - مصر', cat: 'islamic' },
    { landmark: 'جامع القرويين', cityOrCountry: 'فاس - المغرب', cat: 'islamic' },
    { landmark: 'جامع الزيتونة', cityOrCountry: 'تونس', cat: 'islamic' },
    { landmark: 'الجامع الأموي الكبير', cityOrCountry: 'دمشق - سوريا', cat: 'islamic' },
    { landmark: 'قصر الحمراء التاريخي', cityOrCountry: 'غرناطة - الأندلس', cat: 'history' },
    { landmark: 'مدينة البتراء الوردية', cityOrCountry: 'الأردن', cat: 'history' },
    { landmark: 'مدائن صالح (الحِجر)', cityOrCountry: 'العلا - السعودية', cat: 'history' },
    { landmark: 'باب اليمن التاريخي ودار الحجر', cityOrCountry: 'صنعاء - اليمن', cat: 'history' },
    { landmark: 'برج خليفة (أعلى ناطحة سحاب)', cityOrCountry: 'دبي - الإمارات', cat: 'geography' },
    { landmark: 'شلالات نياجرا الشهيرة', cityOrCountry: 'بين كندا والولايات المتحدة', cat: 'geography' },
    { landmark: 'نهر الأمازون العظيم', cityOrCountry: 'أمريكا الجنوبية', cat: 'geography' },
    { landmark: 'جزيرة سقطرى النادرة', cityOrCountry: 'اليمن', cat: 'geography' },
    { landmark: 'جبل طارق التاريخي', cityOrCountry: 'جنوب شبه الجزيرة الأيبيرية', cat: 'geography' },
  ];

  landmarks.forEach((lm, idx) => {
    const w1 = landmarks[(idx + 2) % landmarks.length].cityOrCountry;
    const w2 = landmarks[(idx + 5) % landmarks.length].cityOrCountry;
    const w3 = landmarks[(idx + 8) % landmarks.length].cityOrCountry;
    bank.push({
      id: `gen_lm_${idx}`,
      category: lm.cat,
      questionAr: `أين يقع معلم "${lm.landmark}" الشهير؟`,
      optionsAr: [lm.cityOrCountry, w1, w2, w3],
      correctIndex: 0,
      difficulty: 'easy',
    });
  });

  // G. World Cup & Olympic Editions (Host & Champion) -> +22 questions for sports
  const worldCups: Array<{ year: number; host: string; winner: string }> = [
    { year: 2022, host: 'قطر', winner: 'الأرجنتين' },
    { year: 2018, host: 'روسيا', winner: 'فرنسا' },
    { year: 2014, host: 'البرازيل', winner: 'ألمانيا' },
    { year: 2010, host: 'جنوب أفريقيا', winner: 'إسبانيا' },
    { year: 2006, host: 'ألمانيا', winner: 'إيطاليا' },
    { year: 2002, host: 'كوريا الجنوبية واليابان', winner: 'البرازيل' },
    { year: 1998, host: 'فرنسا', winner: 'فرنسا' },
    { year: 1994, host: 'الولايات المتحدة', winner: 'البرازيل' },
    { year: 1990, host: 'إيطاليا', winner: 'ألمانيا' },
    { year: 1986, host: 'المكسيك', winner: 'الأرجنتين' },
    { year: 1982, host: 'إسبانيا', winner: 'إيطاليا' },
  ];

  worldCups.forEach((wc, idx) => {
    const wHost1 = worldCups[(idx + 2) % worldCups.length].host;
    const wHost2 = worldCups[(idx + 4) % worldCups.length].host;
    const wHost3 = worldCups[(idx + 6) % worldCups.length].host;
    bank.push({
      id: `gen_spo_host_${wc.year}`,
      category: 'sports',
      questionAr: `في أي دولة أُقيمت بطولة كأس العالم لكرة القدم عام ${wc.year} م؟`,
      optionsAr: [wc.host, wHost1, wHost2, wHost3],
      correctIndex: 0,
      difficulty: 'easy',
    });

    const allTeams = ['الأرجنتين', 'فرنسا', 'البرازيل', 'ألمانيا', 'إيطاليا', 'إسبانيا', 'إنجلترا', 'الأوروغواي'];
    const wrongWinners = allTeams.filter(t => t !== wc.winner);
    bank.push({
      id: `gen_spo_win_${wc.year}`,
      category: 'sports',
      questionAr: `أي منتخب توج بلقب كأس العالم FIFA عام ${wc.year} م في ${wc.host}؟`,
      optionsAr: [
        wc.winner,
        wrongWinners[idx % wrongWinners.length],
        wrongWinners[(idx + 2) % wrongWinners.length],
        wrongWinners[(idx + 4) % wrongWinners.length],
      ],
      correctIndex: 0,
      difficulty: 'medium',
    });
  });

  return bank;
}

export const FULL_QUESTION_BANK: QuizQuestion[] = buildFullQuestionBank();

// Permute options deterministically so the correct answer is evenly distributed across indices 0..3
function shuffleQuestionOptions(q: QuizQuestion, rand: () => number): QuizQuestion {
  const indices = [0, 1, 2, 3];
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const temp = indices[i];
    indices[i] = indices[j];
    indices[j] = temp;
  }
  const newOptionsAr: [string, string, string, string] = [
    q.optionsAr[indices[0]],
    q.optionsAr[indices[1]],
    q.optionsAr[indices[2]],
    q.optionsAr[indices[3]],
  ];
  const newCorrectIndex = indices.indexOf(q.correctIndex);
  return {
    ...q,
    optionsAr: newOptionsAr,
    correctIndex: newCorrectIndex,
  };
}

export function getMatchQuestions(
  category: CategoryId,
  count: number,
  seenIds: string[],
  customSeed?: number
): QuizQuestion[] {
  const rand = customSeed !== undefined ? createSeededRandom(customSeed) : Math.random;

  let pool =
    category === 'cocktail'
      ? [...FULL_QUESTION_BANK]
      : FULL_QUESTION_BANK.filter(q => q.category === category);

  // If NOT using a deterministic shared room seed, filter out recently seen questions first
  if (customSeed === undefined && seenIds.length > 0) {
    const unseen = pool.filter(q => !seenIds.includes(q.id));
    if (unseen.length >= count) {
      pool = unseen;
    }
  }

  // Fisher-Yates shuffle with rand()
  const shuffled = [...pool];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const tmp = shuffled[i];
    shuffled[i] = shuffled[j];
    shuffled[j] = tmp;
  }

  return shuffled.slice(0, count).map(q => shuffleQuestionOptions(q, rand));
}

export function getDailyBossQuestion(dateStr: string): QuizQuestion {
  let seed = 0;
  for (let i = 0; i < dateStr.length; i++) {
    seed = (seed * 31 + dateStr.charCodeAt(i)) >>> 0;
  }
  const rand = createSeededRandom(seed);
  const hardPool = FULL_QUESTION_BANK.filter(q => q.difficulty === 'hard' || q.difficulty === 'medium');
  const chosen = hardPool[Math.floor(rand() * hardPool.length)] || FULL_QUESTION_BANK[0];
  return shuffleQuestionOptions(chosen, rand);
}
