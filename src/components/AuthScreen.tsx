import React, { useState } from 'react';
import { WORLD_COUNTRIES } from '../data/constants';
import {
  createNewPlayerAccount,
  loginPlayerAccount,
  validateStrongPassword,
} from '../services/storage';
import { PlayerAccount } from '../types';
import { soundFX } from '../utils/sound';
import { Eye, EyeOff, UserPlus, LogIn } from 'lucide-react';

interface AuthScreenProps {
  onSuccess: (account: PlayerAccount) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onSuccess }) => {
  const [activeTab, setActiveTab] = useState<'register' | 'login'>('register');

  // Register state
  const [contactType, setContactType] = useState<'phone' | 'email'>('phone');
  const [selectedCountry, setSelectedCountry] = useState(WORLD_COUNTRIES[0]); // Starts with Saudi Arabia 🇸🇦
  const [phoneInput, setPhoneInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(false);

  // Login state
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Feedback
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const pwValidation = validateStrongPassword(password);

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    soundFX.playClick();
    setErrorMsg(null);

    if (!agreedTerms) {
      setErrorMsg('يجب الموافقة على شروط وقوانين البطولة واللعب النظيف للمتابعة.');
      soundFX.playWrong();
      return;
    }

    const contactVal =
      contactType === 'phone'
        ? `${selectedCountry.dialCode}${phoneInput.trim()}`
        : emailInput.trim();

    if (contactType === 'phone' && phoneInput.trim().length < 6) {
      setErrorMsg('يرجى إدخال رقم هاتف / واتساب صحيح.');
      soundFX.playWrong();
      return;
    }

    if (contactType === 'email' && !emailInput.includes('@')) {
      setErrorMsg('يرجى إدخال بريد إلكتروني صحيح.');
      soundFX.playWrong();
      return;
    }

    const res = createNewPlayerAccount({
      username,
      password,
      contactType,
      contactValue: contactVal,
      countryCode: selectedCountry.code,
      countryFlag: selectedCountry.flag,
      countryName: selectedCountry.nameAr,
    });

    if (res.errorAr || !res.account) {
      setErrorMsg(res.errorAr || 'تعذر إنشاء الحساب');
      soundFX.playWrong();
      return;
    }

    soundFX.playVictory();
    onSuccess(res.account);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    soundFX.playClick();
    setErrorMsg(null);

    const res = loginPlayerAccount(loginIdentifier, loginPassword);
    if (res.errorAr || !res.account) {
      setErrorMsg(res.errorAr || 'بيانات الدخول غير صحيحة');
      soundFX.playWrong();
      return;
    }

    soundFX.playCorrect();
    onSuccess(res.account);
  };


  return (
    <div className="min-h-screen bg-[#070A12] text-white flex flex-col justify-center items-center px-4 py-8">
      <div className="w-full max-w-lg rounded-3xl bg-[#111827] border border-[#28354E] p-6 sm:p-8 shadow-2xl">
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-[#1B253B] border border-[#28354E] flex items-center justify-center text-4xl mb-3 shadow-[0_0_25px_rgba(79,245,210,0.18)]">
            🧠
          </div>
          <h1 className="text-2xl font-extrabold tracking-wide">
            NEUROX <span className="text-[#4FF5D2]">ESPORTS</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            تسجيل الدخول مرة واحدة فقط · حفظ تلقائي لحسابك ونقاطك
          </p>
        </div>

        {/* 2 Tabs: إنشاء حساب جديد | دخول لحسابي */}
        <div className="grid grid-cols-2 gap-2 p-1.5 rounded-2xl bg-[#070A12] border border-[#28354E] mb-6">
          <button
            type="button"
            onClick={() => {
              soundFX.playClick();
              setActiveTab('register');
              setErrorMsg(null);
            }}
            className={`min-h-[44px] flex items-center justify-center gap-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === 'register'
                ? 'bg-[#4FF5D2] text-[#070A12] shadow-md'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>إنشاء حساب جديد</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundFX.playClick();
              setActiveTab('login');
              setErrorMsg(null);
            }}
            className={`min-h-[44px] flex items-center justify-center gap-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === 'login'
                ? 'bg-[#4FF5D2] text-[#070A12] shadow-md'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <LogIn className="w-4 h-4" />
            <span>دخول لحسابي</span>
          </button>
        </div>

        {errorMsg && (
          <div className="mb-5 rounded-2xl bg-[#FF6B81]/15 border border-[#FF6B81] px-4 py-3 text-xs text-[#FF6B81] font-semibold">
            ⚠️ {errorMsg}
          </div>
        )}

        {activeTab === 'register' ? (
          <form onSubmit={handleRegister} className="space-y-4">
            {/* Unique Username */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                اسم اللاعب الفريد (يُمنع تكرار الأسماء)
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="مثال: صقر_الميدان"
                className="w-full min-h-[46px] rounded-xl bg-[#1B253B] border border-[#28354E] px-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#4FF5D2]"
              />
            </div>

            {/* Country Flag Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                اختر دولتك وعلمك (السعودية، اليمن، مصر، الإمارات وجميع الدول)
              </label>
              <div className="relative">
                <select
                  value={selectedCountry.code}
                  onChange={e => {
                    const found = WORLD_COUNTRIES.find(c => c.code === e.target.value);
                    if (found) setSelectedCountry(found);
                  }}
                  className="w-full min-h-[46px] rounded-xl bg-[#1B253B] border border-[#28354E] px-4 text-sm text-white focus:outline-none focus:border-[#4FF5D2]"
                >
                  {WORLD_COUNTRIES.map(c => (
                    <option key={c.code} value={c.code} className="bg-[#111827] text-white">
                      {c.flag} {c.nameAr} ({c.dialCode})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Contact Method Switcher: Phone/WhatsApp vs Email */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-300">طريقة التواصل</label>
                <div className="flex items-center gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setContactType('phone')}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                      contactType === 'phone'
                        ? 'bg-[#4FF5D2]/20 text-[#4FF5D2] border border-[#4FF5D2]/40'
                        : 'text-slate-400'
                    }`}
                  >
                    📱 رقم واتساب / هاتف
                  </button>
                  <button
                    type="button"
                    onClick={() => setContactType('email')}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                      contactType === 'email'
                        ? 'bg-[#4FF5D2]/20 text-[#4FF5D2] border border-[#4FF5D2]/40'
                        : 'text-slate-400'
                    }`}
                  >
                    ✉️ بريد إلكتروني
                  </button>
                </div>
              </div>

              {contactType === 'phone' ? (
                <div className="flex gap-2" dir="ltr">
                  <div className="min-h-[46px] px-3 rounded-xl bg-[#070A12] border border-[#28354E] flex items-center gap-1.5 text-sm font-mono-num shrink-0">
                    <span>{selectedCountry.flag}</span>
                    <span className="text-[#4FF5D2]">{selectedCountry.dialCode}</span>
                  </div>
                  <input
                    type="tel"
                    required
                    value={phoneInput}
                    onChange={e => setPhoneInput(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="5XXXXXXXX"
                    className="w-full min-h-[46px] rounded-xl bg-[#1B253B] border border-[#28354E] px-4 text-sm text-white font-mono-num placeholder-slate-500 focus:outline-none focus:border-[#4FF5D2]"
                  />
                </div>
              ) : (
                <input
                  type="email"
                  required
                  dir="ltr"
                  value={emailInput}
                  onChange={e => setEmailInput(e.target.value)}
                  placeholder="player@example.com"
                  className="w-full min-h-[46px] rounded-xl bg-[#1B253B] border border-[#28354E] px-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#4FF5D2]"
                />
              )}
            </div>

            {/* Strong Password */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                كلمة المرور القوية
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="مثال: Neurox@2026"
                  className="w-full min-h-[46px] rounded-xl bg-[#1B253B] border border-[#28354E] px-4 pl-11 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#4FF5D2]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password Checklist */}
              <div className="grid grid-cols-2 gap-1.5 mt-2 text-[11px]">
                <div className={pwValidation.hasMinLen ? 'text-[#38D9A9]' : 'text-slate-500'}>
                  {pwValidation.hasMinLen ? '✓' : '○'} 8 أحرف على الأقل
                </div>
                <div className={pwValidation.hasUpper ? 'text-[#38D9A9]' : 'text-slate-500'}>
                  {pwValidation.hasUpper ? '✓' : '○'} حرف كبير (A-Z)
                </div>
                <div className={pwValidation.hasNumber ? 'text-[#38D9A9]' : 'text-slate-500'}>
                  {pwValidation.hasNumber ? '✓' : '○'} رقم واحد على الأقل (0-9)
                </div>
                <div className={pwValidation.hasSymbol ? 'text-[#38D9A9]' : 'text-slate-500'}>
                  {pwValidation.hasSymbol ? '✓' : '○'} رمز خاص (!@#$%)
                </div>
              </div>
            </div>

            {/* Terms Agreement */}
            <label className="flex items-start gap-3 p-3 rounded-xl bg-[#1B253B]/60 border border-[#28354E] cursor-pointer">
              <input
                type="checkbox"
                checked={agreedTerms}
                onChange={e => setAgreedTerms(e.target.checked)}
                className="mt-1 w-4 h-4 accent-[#4FF5D2]"
              />
              <span className="text-xs text-slate-300 leading-relaxed">
                أوافق على شروط البطولة الشهرية وقوانين النزاهة ومكافحة الغش (Fair-Play)، وأعلم أنه سيُمنح لي معرّف فريد من 10 أرقام (<span className="font-mono-num text-[#FFD166]">#ID</span>) ورصيد بداية تنافسي (50 🪙).
              </span>
            </label>

            <button
              type="submit"
              className="w-full min-h-[50px] rounded-2xl bg-gradient-to-r from-[#4FF5D2] to-[#38D9A9] text-[#070A12] font-extrabold text-sm shadow-lg hover:opacity-95 transition-opacity"
            >
              إنشاء حسابي ودخول الساحة 🚀
            </button>
          </form>
        ) : (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                اسم اللاعب أو رقم الهاتف أو المعرّف الفريد (#ID)
              </label>
              <input
                type="text"
                required
                value={loginIdentifier}
                onChange={e => setLoginIdentifier(e.target.value)}
                placeholder="الاسم أو #1234567890 أو الرقم"
                className="w-full min-h-[46px] rounded-xl bg-[#1B253B] border border-[#28354E] px-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#4FF5D2]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                كلمة المرور
              </label>
              <input
                type="password"
                required
                value={loginPassword}
                onChange={e => setLoginPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full min-h-[46px] rounded-xl bg-[#1B253B] border border-[#28354E] px-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#4FF5D2]"
              />
            </div>

            <button
              type="submit"
              className="w-full min-h-[50px] rounded-2xl bg-gradient-to-r from-[#4FF5D2] to-[#38D9A9] text-[#070A12] font-extrabold text-sm shadow-lg hover:opacity-95 transition-opacity"
            >
              استرجاع حسابي والدخول 🔐
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
