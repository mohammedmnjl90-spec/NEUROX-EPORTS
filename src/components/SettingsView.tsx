import React, { useEffect, useState } from 'react';
import { LANGUAGE_LABELS, WORLD_COUNTRIES } from '../data/constants';
import { updatePlayerProfileIdentity } from '../services/storage';
import {
  BotDifficulty,
  BotPersona,
  LanguageCode,
  PlayerAccount,
  SoundPackId,
} from '../types';
import { getTranslations } from '../utils/i18n';
import { soundFX } from '../utils/sound';
import {
  BookOpen,
  Check,
  Copy,
  Globe,
  HelpCircle,
  LogOut,
  ShieldCheck,
  Smartphone,
  UserCheck,
  Volume2,
  VolumeX,
} from 'lucide-react';

interface SettingsViewProps {
  account: PlayerAccount;
  onUpdateAccount: (updated: PlayerAccount, toastMsg?: string) => void;
  onLogout: () => void;
  onOpenHelp: () => void;
}

const PROFILE_EDITOR_COPY: Record<
  LanguageCode,
  {
    sectionTitle: string;
    usernameLabel: string;
    usernamePlaceholder: string;
    countryLabel: string;
    saveBtn: string;
    savedToast: string;
  }
> = {
  ar: {
    sectionTitle: '✏️ تعديل الاسم المستعار والدولة',
    usernameLabel: 'الاسم المستعار (Username)',
    usernamePlaceholder: 'أدخل اسمك المستعار...',
    countryLabel: 'الدولة والعلم',
    saveBtn: 'حفظ التعديلات فوراً ✓',
    savedToast: '✓ تم تحديث اسمك المستعار ودولتك وحفظهما بنجاح!',
  },
  en: {
    sectionTitle: '✏️ Edit Username & Country',
    usernameLabel: 'Nickname (Username)',
    usernamePlaceholder: 'Enter your username...',
    countryLabel: 'Country & Flag',
    saveBtn: 'Save Changes Immediately ✓',
    savedToast: '✓ Profile username and country saved!',
  },
  fr: {
    sectionTitle: '✏️ Modifier le Pseudo et le Pays',
    usernameLabel: 'Pseudo (Username)',
    usernamePlaceholder: 'Entrez votre pseudo...',
    countryLabel: 'Pays et Drapeau',
    saveBtn: 'Enregistrer Immédiatement ✓',
    savedToast: '✓ Pseudo et pays mis à jour !',
  },
  es: {
    sectionTitle: '✏️ Editar Nombre de Usuario y País',
    usernameLabel: 'Nombre de Usuario',
    usernamePlaceholder: 'Ingresa tu apodo...',
    countryLabel: 'País y Bandera',
    saveBtn: 'Guardar Cambios Ahora ✓',
    savedToast: '✓ ¡Nombre de usuario y país actualizados!',
  },
  tr: {
    sectionTitle: '✏️ Kullanıcı Adı ve Ülkeyi Düzenle',
    usernameLabel: 'Kullanıcı Adı',
    usernamePlaceholder: 'Kullanıcı adınızı girin...',
    countryLabel: 'Ülke ve Bayrak',
    saveBtn: 'Değişiklikleri Hemen Kaydet ✓',
    savedToast: '✓ Kullanıcı adı ve ülke başarıyla kaydedildi!',
  },
  ur: {
    sectionTitle: '✏️ صارف کا نام اور ملک تبدیل کریں',
    usernameLabel: 'صارف کا نام (Username)',
    usernamePlaceholder: 'اپنا نام درج کریں...',
    countryLabel: 'ملک اور جھنڈا',
    saveBtn: 'تبدیلیاں فوراً محفوظ کریں ✓',
    savedToast: '✓ آپ کا نام اور ملک کامیابی سے محفوظ ہو گیا!',
  },
};

const HELP_BUTTON_TEXT: Record<
  LanguageCode,
  { title: string; desc: string; btn: string }
> = {
  ar: {
    title: '📖 دليل التعليمات وطريقة اللعب',
    desc: 'شرح كامل لطريقة اللعب، كيفية تحدي الأصدقاء بالـ #ID والغرف الخاصة، ونظام احتساب النقاط والمستويات.',
    btn: 'فتح صفحة التعليمات 📖',
  },
  en: {
    title: '📖 Help Guide & How to Play',
    desc: 'Complete guide on gameplay rules, challenging friends by #ID & rooms, and the points & leveling system.',
    btn: 'Open Help Guide 📖',
  },
  fr: {
    title: '📖 Guide d’Aide & Comment Jouer',
    desc: 'Explication complète des règles du jeu, comment défier vos amis par #ID et le système de points et niveaux.',
    btn: 'Ouvrir le Guide d’Aide 📖',
  },
  es: {
    title: '📖 Guía de Instrucciones y Ayuda',
    desc: 'Explicación completa sobre cómo jugar, cómo retar a tus amigos por #ID y el sistema de puntos y niveles.',
    btn: 'Abrir Instrucciones 📖',
  },
  tr: {
    title: '📖 Oyun Rehberi ve Yardım',
    desc: 'Nasıl oynanacağı, #ID ile arkadaşlara meydan okuma ve puan/seviye sistemi hakkında detaylı rehber.',
    btn: 'Yardım Sayfasını Aç 📖',
  },
  ur: {
    title: '📖 ہدایات اور کھیل کا طریقہ',
    desc: 'کھیلنے کا طریقہ، #ID کے ذریعے دوستوں کو چیلنج کرنے کا طریقہ، اور پوائنٹس و لیولز کی مکمل تفصیل۔',
    btn: 'ہدایات کا صفحہ کھولیں 📖',
  },
};

export const SettingsView: React.FC<SettingsViewProps> = ({
  account,
  onUpdateAccount,
  onLogout,
  onOpenHelp,
}) => {
  const [copiedId, setCopiedId] = useState(false);
  const [activePreviewSfx, setActivePreviewSfx] = useState<string | null>(null);

  // Profile Identity Editor State (Username + Country)
  const [editUsername, setEditUsername] = useState(account.username);
  const [editCountryCode, setEditCountryCode] = useState(
    account.countryCode || WORLD_COUNTRIES[0].code
  );
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSavedFlash, setProfileSavedFlash] = useState(false);

  useEffect(() => {
    setEditUsername(account.username);
    setEditCountryCode(account.countryCode || WORLD_COUNTRIES[0].code);
  }, [account.username, account.countryCode]);

  const t = getTranslations(account.language);
  const peCopy =
    PROFILE_EDITOR_COPY[account.language] || PROFILE_EDITOR_COPY.ar;

  const handleSaveProfileIdentity = (e: React.FormEvent) => {
    e.preventDefault();
    soundFX.playClick();
    setProfileError(null);

    const res = updatePlayerProfileIdentity(
      account,
      editUsername,
      editCountryCode
    );
    if (res.errorAr || !res.account) {
      soundFX.playWrong();
      setProfileError(res.errorAr || 'تعذر حفظ التعديلات');
      return;
    }

    soundFX.playCorrect(true);
    setProfileSavedFlash(true);
    setTimeout(() => setProfileSavedFlash(false), 2200);
    onUpdateAccount(res.account, peCopy.savedToast);
  };

  const triggerPreviewSfx = (id: string, fn: () => void) => {
    if (!account.soundEnabled) {
      soundFX.soundEnabled = true;
      fn();
      soundFX.soundEnabled = account.soundEnabled;
    } else {
      fn();
    }
    setActivePreviewSfx(id);
    setTimeout(() => {
      setActivePreviewSfx(prev => (prev === id ? null : prev));
    }, 650);
  };

  const handleCopyPlayerId = async () => {
    soundFX.playClick();
    try {
      await navigator.clipboard.writeText(account.playerId);
    } catch {}
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  return (
    <div className="space-y-6 pb-10">
      {/* Player Identity & Fair Play Card */}
      <div className="rounded-3xl bg-[#111827] border border-[#28354E] p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-16 h-16 rounded-2xl bg-[#1B253B] border border-[#4FF5D2] flex items-center justify-center text-3xl">
              {account.countryFlag}
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-white">
                {account.username}
              </h2>
              <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                <span className="font-mono-num text-[#FFD166] font-bold">
                  {account.playerId}
                </span>
                <span>·</span>
                <span>{account.countryName}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => {
                soundFX.playClick();
                onOpenHelp();
              }}
              className="min-h-[42px] px-4 rounded-xl bg-[#4FF5D2]/15 hover:bg-[#4FF5D2]/25 border border-[#4FF5D2] text-xs font-extrabold text-[#4FF5D2] flex items-center gap-1.5"
            >
              <HelpCircle className="w-4 h-4" />
              <span>{(HELP_BUTTON_TEXT[account.language] || HELP_BUTTON_TEXT.ar).btn}</span>
            </button>

            <button
              type="button"
              onClick={handleCopyPlayerId}
              className="min-h-[42px] px-4 rounded-xl bg-[#1B253B] hover:bg-[#28354E] border border-[#28354E] text-xs font-bold text-[#4FF5D2] flex items-center gap-1.5"
            >
              <Copy className="w-4 h-4" />
              <span>{copiedId ? t.copied : `${t.copyId} ${account.playerId}`}</span>
            </button>
          </div>
        </div>

        {/* Edit Username & Country Form */}
        <form
          onSubmit={handleSaveProfileIdentity}
          className="mt-5 pt-4 border-t border-[#28354E]"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs sm:text-sm font-extrabold text-[#4FF5D2] flex items-center gap-1.5">
              <UserCheck className="w-4 h-4" />
              <span>{peCopy.sectionTitle}</span>
            </h3>
            {profileSavedFlash && (
              <span className="px-2.5 py-0.5 rounded-lg bg-[#38D9A9]/20 border border-[#38D9A9] text-[11px] font-extrabold text-[#38D9A9]">
                {peCopy.savedToast}
              </span>
            )}
          </div>

          {profileError && (
            <div className="mb-3 rounded-xl bg-[#FF6B81]/15 border border-[#FF6B81] px-3.5 py-2 text-xs font-bold text-[#FF6B81]">
              ⚠️ {profileError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1.5">
                {peCopy.usernameLabel}
              </label>
              <input
                type="text"
                required
                minLength={3}
                maxLength={24}
                value={editUsername}
                onChange={e => setEditUsername(e.target.value)}
                placeholder={peCopy.usernamePlaceholder}
                className="w-full min-h-[44px] rounded-xl bg-[#070A12] border border-[#28354E] focus:border-[#4FF5D2] focus:outline-none px-3.5 text-xs sm:text-sm font-bold text-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1.5 flex items-center gap-1">
                <Globe className="w-3.5 h-3.5 text-[#4FF5D2]" />
                <span>{peCopy.countryLabel}</span>
              </label>
              <select
                value={editCountryCode}
                onChange={e => setEditCountryCode(e.target.value)}
                className="w-full min-h-[44px] rounded-xl bg-[#070A12] border border-[#28354E] focus:border-[#4FF5D2] focus:outline-none px-3 text-xs sm:text-sm font-bold text-white"
              >
                {WORLD_COUNTRIES.map(c => (
                  <option
                    key={c.code}
                    value={c.code}
                    className="bg-[#111827] text-white"
                  >
                    {c.flag} {account.language === 'ar' || account.language === 'ur' ? c.nameAr : c.nameEn}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="min-h-[44px] px-4 rounded-xl bg-gradient-to-r from-[#4FF5D2] to-[#38D9A9] text-[#070A12] font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-md hover:opacity-95 transition-opacity"
            >
              <Check className="w-4 h-4" />
              <span>{peCopy.saveBtn}</span>
            </button>
          </div>
        </form>

        {/* Fair-Play Score Bar */}
        <div className="mt-5 pt-4 border-t border-[#28354E] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#38D9A9]" />
            <div>
              <div className="text-xs font-extrabold text-white">
                {t.fairPlayTitle}
              </div>
              <div className="text-[11px] text-slate-400">
                {t.fairPlayDesc}
              </div>
            </div>
          </div>
          <div className="px-4 py-1.5 rounded-xl bg-[#38D9A9]/15 border border-[#38D9A9] text-sm font-extrabold font-mono-num text-[#38D9A9]">
            {t.fairPlay}: <span dir="ltr">{account.fairPlayScore}/100</span>
          </div>
        </div>

        {/* Sportsmanship Rating Summary in Player Profile */}
        <div className="mt-4 pt-4 border-t border-[#28354E]">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <div>
              <div className="text-xs font-extrabold text-white flex items-center gap-1.5">
                <span>🤝 {t.sportsmanshipProfileTitle}</span>
              </div>
              <div className="text-[11px] text-slate-400">
                {t.sportsmanshipProfileDesc}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span
                dir="ltr"
                className="px-4 py-1.5 rounded-xl bg-[#FFD166]/15 border border-[#FFD166] text-sm font-extrabold font-mono-num text-[#FFD166] inline-flex items-center gap-1.5 whitespace-nowrap"
              >
                <span>⭐</span>
                <span>{(account.sportsmanshipAvg ?? 5.0).toFixed(1)} / 5.0</span>
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-[#1B253B] border border-[#28354E] text-xs font-mono-num text-slate-300 whitespace-nowrap">
                {account.sportsmanshipCount ?? 1} {t.evaluationsCountLabel}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-[#070A12] border border-[#28354E] flex items-center justify-between">
              <span className="text-slate-300">{t.badgeFairCompetitor}</span>
              <span className="font-mono-num font-extrabold text-[#4FF5D2]">
                {account.sportsmanshipBadges?.fair_competitor || 0}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-[#070A12] border border-[#28354E] flex items-center justify-between">
              <span className="text-slate-300">{t.badgeFastGenius}</span>
              <span className="font-mono-num font-extrabold text-[#FFD166]">
                {account.sportsmanshipBadges?.fast_genius || 0}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-[#070A12] border border-[#28354E] flex items-center justify-between">
              <span className="text-slate-300">{t.badgeRespectfulRival}</span>
              <span className="font-mono-num font-extrabold text-[#38D9A9]">
                {account.sportsmanshipBadges?.respectful_rival || 0}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-[#070A12] border border-[#28354E] flex items-center justify-between">
              <span className="text-slate-300">{t.badgeGreatFun}</span>
              <span className="font-mono-num font-extrabold text-[#A78BFA]">
                {account.sportsmanshipBadges?.great_fun || 0}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Sound & Vibration Settings + Local Notifications + Sound Pack Selector + SFX Test Soundboard */}
      <div className="rounded-3xl bg-[#111827] border border-[#28354E] p-6">
        <h3 className="text-base font-extrabold text-white mb-4">
          {t.sfxAndVibrationTitle}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => {
              const next = !account.soundEnabled;
              soundFX.soundEnabled = next;
              if (next) soundFX.playClick();
              onUpdateAccount({ ...account, soundEnabled: next });
            }}
            className={`min-h-[54px] rounded-2xl border px-4 flex items-center justify-between text-xs font-bold ${
              account.soundEnabled
                ? 'bg-[#1B253B] border-[#4FF5D2] text-white'
                : 'bg-[#070A12] border-[#28354E] text-slate-400'
            }`}
          >
            <span className="flex items-center gap-2">
              {account.soundEnabled ? (
                <Volume2 className="w-4 h-4 text-[#4FF5D2]" />
              ) : (
                <VolumeX className="w-4 h-4" />
              )}
              <span>{t.interactiveSfxLabel}</span>
            </span>
            <span className="font-mono-num text-[#4FF5D2]">
              {account.soundEnabled ? t.enabledText : t.disabledText}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              const next = !account.vibrationEnabled;
              soundFX.vibrationEnabled = next;
              soundFX.playClick();
              onUpdateAccount({ ...account, vibrationEnabled: next });
            }}
            className={`min-h-[54px] rounded-2xl border px-4 flex items-center justify-between text-xs font-bold ${
              account.vibrationEnabled
                ? 'bg-[#1B253B] border-[#4FF5D2] text-white'
                : 'bg-[#070A12] border-[#28354E] text-slate-400'
            }`}
          >
            <span className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-[#4FF5D2]" />
              <span>{t.phoneVibrationLabel}</span>
            </span>
            <span className="font-mono-num text-[#4FF5D2]">
              {account.vibrationEnabled ? t.enabledText : t.disabledText}
            </span>
          </button>
        </div>

        {/* Sound Pack Selector */}
        <div className="mt-5 pt-5 border-t border-[#28354E]">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
            <span className="text-xs font-extrabold text-white">
              {t.soundPackTitle}
            </span>
            <span className="text-[11px] text-slate-400">
              {t.soundPackSub}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {(
              [
                {
                  id: 'cyber',
                  label: t.packCyberLabel,
                  sub: t.packCyberSub,
                },
                {
                  id: 'royal',
                  label: t.packRoyalLabel,
                  sub: t.packRoyalSub,
                },
                {
                  id: 'classic',
                  label: t.packClassicLabel,
                  sub: t.packClassicSub,
                },
              ] as Array<{ id: SoundPackId; label: string; sub: string }>
            ).map(pack => {
              const currentPack = account.soundPack || 'cyber';
              const isSelected = currentPack === pack.id;
              return (
                <button
                  key={pack.id}
                  type="button"
                  onClick={() => {
                    soundFX.soundPack = pack.id;
                    soundFX.playCorrect(false, 2);
                    onUpdateAccount({ ...account, soundPack: pack.id });
                  }}
                  className={`min-h-[58px] rounded-2xl border p-3 text-start transition-all flex flex-col justify-center ${
                    isSelected
                      ? 'bg-[#4FF5D2]/15 border-[#4FF5D2] text-white shadow-[0_0_16px_rgba(79,245,210,0.18)]'
                      : 'bg-[#1B253B] border-[#28354E] text-slate-300 hover:border-slate-500'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-extrabold">{pack.label}</span>
                    {isSelected && (
                      <span className="text-[10px] font-bold text-[#4FF5D2]">
                        {t.activeLabel}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1">
                    {pack.sub}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Interactive SFX Test Soundboard */}
        <div className="mt-5 pt-5 border-t border-[#28354E]">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <span className="text-xs font-extrabold text-white">
              {t.sfxSoundboardTitle}
            </span>
            <span className="text-[11px] text-[#FFD166]">
              {t.sfxSoundboardSub}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            {[
              {
                id: 'victory',
                label: t.sfxVictory,
                accent: 'border-[#FFD166]/60 text-[#FFD166] hover:bg-[#FFD166]/10',
                play: () => soundFX.playVictory(),
              },
              {
                id: 'loss',
                label: t.sfxLoss,
                accent: 'border-[#FF6B81]/60 text-[#FF6B81] hover:bg-[#FF6B81]/10',
                play: () => soundFX.playLoss(),
              },
              {
                id: 'correct',
                label: t.sfxCorrect,
                accent: 'border-[#38D9A9]/60 text-[#38D9A9] hover:bg-[#38D9A9]/10',
                play: () => soundFX.playCorrect(true, 2),
              },
              {
                id: 'wrong',
                label: t.sfxWrong,
                accent: 'border-rose-500/60 text-rose-400 hover:bg-rose-500/10',
                play: () => soundFX.playWrong(),
              },
              {
                id: 'forfeit',
                label: t.sfxForfeit,
                accent: 'border-amber-400/60 text-amber-300 hover:bg-amber-400/10',
                play: () => soundFX.playForfeit(),
              },
            ].map(item => {
              const isPlaying = activePreviewSfx === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => triggerPreviewSfx(item.id, item.play)}
                  className={`min-h-[54px] rounded-2xl bg-[#1B253B] border px-3 py-2.5 flex flex-col items-center justify-center text-center transition-transform active:scale-95 ${
                    item.accent
                  } ${isPlaying ? 'scale-105 ring-2 ring-[#4FF5D2]' : ''}`}
                >
                  <span className="text-xs font-extrabold">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Smart Bot AI Difficulty & Persona */}
      <div className="rounded-3xl bg-[#111827] border border-[#28354E] p-6">
        <h3 className="text-base font-extrabold text-white mb-1">
          {t.botAiTitle}
        </h3>
        <p className="text-xs text-slate-400 mb-4">{t.botAiSub}</p>

        <div className="mb-4">
          <div className="text-xs font-bold text-slate-300 mb-2">
            {t.botDifficultyLabel}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {(
              [
                { id: 'beginner', label: t.diffBeginner },
                { id: 'medium', label: t.diffMedium },
                { id: 'pro', label: t.diffPro },
                { id: 'legendary', label: t.diffLegendary },
              ] as Array<{ id: BotDifficulty; label: string }>
            ).map(d => (
              <button
                key={d.id}
                type="button"
                onClick={() => {
                  soundFX.playClick();
                  onUpdateAccount({ ...account, botDifficulty: d.id });
                }}
                className={`min-h-[44px] rounded-xl border text-xs font-bold ${
                  account.botDifficulty === d.id
                    ? 'bg-[#4FF5D2] text-[#070A12] border-[#4FF5D2]'
                    : 'bg-[#1B253B] text-white border-[#28354E]'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="text-xs font-bold text-slate-300 mb-2">
            {t.botPersonaLabel}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {(
              [
                { id: 'calm', label: t.personaCalm },
                { id: 'hasty', label: t.personaHasty },
                { id: 'thinker', label: t.personaThinker },
                { id: 'aggressive', label: t.personaAggressive },
              ] as Array<{ id: BotPersona; label: string }>
            ).map(p => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  soundFX.playClick();
                  onUpdateAccount({ ...account, botPersona: p.id });
                }}
                className={`min-h-[44px] rounded-xl border text-xs font-bold ${
                  account.botPersona === p.id
                    ? 'bg-[#A78BFA] text-[#070A12] border-[#A78BFA]'
                    : 'bg-[#1B253B] text-white border-[#28354E]'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 6 Supported Languages (Arabic RTL, English, French, Spanish, Turkish, Urdu) */}
      <div className="rounded-3xl bg-[#111827] border border-[#28354E] p-6">
        <h3 className="text-base font-extrabold text-white mb-3 whitespace-nowrap">
          🌍 {t.supportedLanguagesTitle}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {(Object.keys(LANGUAGE_LABELS) as LanguageCode[]).map(langKey => {
            const meta = LANGUAGE_LABELS[langKey];
            const isSelected = account.language === langKey;
            const nextT = getTranslations(langKey);
            return (
              <button
                key={langKey}
                type="button"
                onClick={() => {
                  soundFX.playClick();
                  document.documentElement.dir = meta.dir;
                  document.documentElement.lang = langKey;
                  onUpdateAccount(
                    { ...account, language: langKey },
                    `${meta.flag} ${meta.name} — ${nextT.arena}`
                  );
                }}
                className={`min-h-[46px] rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 ${
                  isSelected
                    ? 'bg-[#4FF5D2] text-[#070A12] border-[#4FF5D2]'
                    : 'bg-[#1B253B] text-white border-[#28354E]'
                }`}
              >
                <span>{meta.flag}</span>
                <span>{meta.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Help & Game Instructions Card + Logout Button */}
      <div className="rounded-3xl bg-[#111827] border border-[#4FF5D2]/50 p-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-start gap-3.5 max-w-xl">
          <div className="w-12 h-12 rounded-2xl bg-[#4FF5D2]/15 border border-[#4FF5D2] flex items-center justify-center text-[#4FF5D2] shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-white">
              {(HELP_BUTTON_TEXT[account.language] || HELP_BUTTON_TEXT.ar).title}
            </h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              {(HELP_BUTTON_TEXT[account.language] || HELP_BUTTON_TEXT.ar).desc}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => {
              soundFX.playClick();
              onOpenHelp();
            }}
            className="min-h-[46px] px-6 rounded-2xl bg-gradient-to-r from-[#4FF5D2] to-[#38D9A9] text-[#070A12] text-xs font-extrabold flex items-center gap-2 shadow-lg"
          >
            <BookOpen className="w-4 h-4" />
            <span>
              {(HELP_BUTTON_TEXT[account.language] || HELP_BUTTON_TEXT.ar).btn}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundFX.playClick();
              onLogout();
            }}
            className="min-h-[46px] px-6 rounded-2xl bg-[#FF6B81]/15 hover:bg-[#FF6B81]/25 border border-[#FF6B81] text-xs font-extrabold text-[#FF6B81] flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            <span>{t.logout}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
