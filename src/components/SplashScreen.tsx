import React, { useEffect, useRef, useState } from 'react';
import { bootstrapCloudStartup, setFirestoreOnlineMode } from '../services/firebase';
import { PlayerAccount } from '../types';
import esportsArenaBg from '../assets/images/esports_trophy_arena_1794404580592.jpg';

export interface SplashFinishResult {
  isOnline: boolean;
  accountPatch?: Partial<PlayerAccount>;
}

interface SplashScreenProps {
  existingAccount: PlayerAccount | null;
  onFinish: (result?: SplashFinishResult) => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  existingAccount,
  onFinish,
}) => {
  const isInitiallyOffline =
    typeof navigator !== 'undefined' && !navigator.onLine;
  const [progress, setProgress] = useState<number>(isInitiallyOffline ? 75 : 8);
  const [statusLabel, setStatusLabel] = useState<string>(
    isInitiallyOffline
      ? 'وضع الأوفلاين · فتح فوري من التخزين المحلي...'
      : 'جاري التحميل... الاتصال بقاعدة بيانات Firebase'
  );
  const [isFadingOut, setIsFadingOut] = useState<boolean>(false);
  const finishedRef = useRef<boolean>(false);
  const onFinishRef = useRef(onFinish);
  onFinishRef.current = onFinish;

  useEffect(() => {
    let active = true;
    let tickTimer: number | undefined;
    let fadeTimer: number | undefined;
    let hardFailsafeTimer: number | undefined;

    const completeSplash = (result: SplashFinishResult, delayMs = 240) => {
      if (!active || finishedRef.current) return;
      finishedRef.current = true;
      if (tickTimer) window.clearInterval(tickTimer);
      if (hardFailsafeTimer) window.clearTimeout(hardFailsafeTimer);
      setProgress(100);
      setIsFadingOut(true);
      fadeTimer = window.setTimeout(() => {
        if (active) {
          onFinishRef.current(result);
        }
      }, delayMs);
    };

    // Case 1: Completely offline -> skip server completely and launch ultra-fast from localStorage
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setFirestoreOnlineMode(false);
      setStatusLabel('وضع الأوفلاين · فتح فوري من التخزين المحلي...');
      completeSplash({ isOnline: false }, 220);
      return () => {
        active = false;
        if (fadeTimer) window.clearTimeout(fadeTimer);
      };
    }

    // Case 2: Online -> real Firebase sync ("جاري التحميل..."), speed depends on real internet quality,
    // capped at a hard 12-second safety timeout so slow/blocked connections never hang forever.
    const handleSuddenOffline = () => {
      setFirestoreOnlineMode(false);
      setStatusLabel('انقطع الإنترنت · الفتح من التخزين المحلي...');
      completeSplash({ isOnline: false }, 180);
    };
    window.addEventListener('offline', handleSuddenOffline);

    // Smooth asymptotic progress while real Firestore request is in flight (never hits 100 until done)
    const startMs = Date.now();
    tickTimer = window.setInterval(() => {
      if (!active || finishedRef.current) return;
      const elapsedSec = (Date.now() - startMs) / 1000;
      setProgress(prev => {
        // Approaches 92% asymptotically over ~11s on slow connections
        const target = Math.min(92, Math.round(12 + 80 * (1 - Math.exp(-elapsedSec / 3.2))));
        return Math.max(prev, target);
      });
    }, 120);

    // Hard 12.6s safety net in case browser timers/promises stall
    hardFailsafeTimer = window.setTimeout(() => {
      setStatusLabel('جاري الدخول بوضع الأمان المحلي...');
      completeSplash({ isOnline: false }, 180);
    }, 12600);

    bootstrapCloudStartup(existingAccount, 12000, stage => {
      if (!active || finishedRef.current) return;
      if (stage === 'connecting') {
        setStatusLabel('جاري التحميل... الاتصال بقاعدة بيانات Firebase');
        setProgress(prev => Math.max(prev, 24));
      } else if (stage === 'syncing') {
        setStatusLabel('جاري التحميل... مزامنة بيانات اللاعب والغرف');
        setProgress(prev => Math.max(prev, 62));
      } else if (stage === 'done') {
        setStatusLabel('اكتمل التحميل · انطلاق إلى الساحة!');
      }
    }).then(res => {
      if (!active || finishedRef.current) return;
      if (res.timedOut) {
        setStatusLabel('استغرق السيرفر وقتاً طويلاً · فتح الساحة الآن');
      } else if (!res.online) {
        setStatusLabel('لا يوجد استجابة من السحابة · تفعيل وضع الأوفلاين');
      } else {
        setStatusLabel('اكتمل التحميل · انطلاق إلى الساحة!');
      }
      completeSplash(
        {
          isOnline: res.online,
          accountPatch: res.accountPatch,
        },
        220
      );
    });

    return () => {
      active = false;
      window.removeEventListener('offline', handleSuddenOffline);
      if (tickTimer) window.clearInterval(tickTimer);
      if (fadeTimer) window.clearTimeout(fadeTimer);
      if (hardFailsafeTimer) window.clearTimeout(hardFailsafeTimer);
    };
  }, [existingAccount]);

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-between overflow-hidden bg-[#070A12] px-6 py-10 text-center select-none transition-all duration-300 ease-out ${
        isFadingOut ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      {/* High-Quality Esports Championship Podium Background Image */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <img
          src={esportsArenaBg}
          alt="NEUROX Esports Championship Arena"
          className={`h-full w-full object-cover object-center transition-transform duration-[2000ms] ease-out ${
            isFadingOut ? 'scale-110' : 'scale-105'
          }`}
        />
        {/* Multi-layered Vignette & Gradient Overlay for Crystal-Clear Text Legibility */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#070A12]/85 via-[#070A12]/65 to-[#070A12]/95" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,209,102,0.16)_0%,rgba(7,10,18,0.82)_75%)]" />
      </div>

      {/* Top Status Header */}
      <div className="relative z-10 mt-2 flex items-center gap-2.5 rounded-full bg-[#111827]/80 backdrop-blur-md border border-[#FFD166]/40 px-4 py-1.5 text-[11px] font-bold text-[#FFD166] shadow-lg">
        <span
          className={`h-2 w-2 rounded-full ${
            isInitiallyOffline ? 'bg-[#FF6B81]' : 'bg-[#4FF5D2] animate-ping'
          }`}
        />
        <span>{isInitiallyOffline ? 'LOCAL OFFLINE MODE' : 'CLOUD ESPORTS ARENA'}</span>
        <span aria-hidden="true">·</span>
        <span className="text-[#4FF5D2]">FAIR-PLAY VERIFIED</span>
      </div>

      {/* Center Emblem, Title & Real-Time Progress Bar */}
      <div className="relative z-10 flex flex-col items-center max-w-md w-full my-auto">
        {/* Glowing Trophy & Brain Emblem */}
        <div className="relative flex items-center justify-center w-28 h-28 sm:w-32 sm:h-32 mb-5 rounded-3xl bg-[#111827]/85 backdrop-blur-md border-2 border-[#FFD166] shadow-[0_0_55px_rgba(255,209,102,0.38)]">
          <span
            className="text-6xl sm:text-7xl drop-shadow-[0_0_16px_rgba(255,209,102,0.65)]"
            role="img"
            aria-label="Championship Trophy"
          >
            🏆
          </span>
          <span className="absolute -bottom-2 -right-2 w-10 h-10 rounded-2xl bg-[#1B253B] border border-[#4FF5D2] flex items-center justify-center text-xl shadow-lg">
            🧠
          </span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-wider text-white mb-2 drop-shadow-[0_4px_20px_rgba(0,0,0,0.9)]">
          NEUROX <span className="text-[#4FF5D2]">ESPORTS</span>
        </h1>
        <p className="text-xs sm:text-sm font-bold text-[#FFD166] mb-7 drop-shadow">
          بطولة التحديات الثقافية والرياضات الذهنية التنافسية
        </p>

        {/* Welcome Card */}
        {existingAccount ? (
          <div className="w-full rounded-2xl bg-[#111827]/85 backdrop-blur-md border border-[#4FF5D2]/50 px-5 py-3.5 mb-7 shadow-xl">
            <p className="text-xs text-[#4FF5D2] font-bold mb-1">
              مرحباً بعودتك إلى منصة التتويج
            </p>
            <div className="flex items-center justify-center gap-2 text-base sm:text-lg font-extrabold text-white">
              <span>{existingAccount.countryFlag}</span>
              <span>{existingAccount.username}</span>
              <span className="text-xs font-mono-num text-[#FFD166]">
                {existingAccount.playerId}
              </span>
            </div>
          </div>
        ) : (
          <div className="w-full rounded-2xl bg-[#111827]/85 backdrop-blur-md border border-[#28354E] px-5 py-3 mb-7 text-xs font-bold text-slate-200 shadow-xl">
            استعد لخوض المواجهات الحية مع أصدقائك والمنافسة على الصدارة
          </div>
        )}

        {/* Real Network-Driven Progress Indicator */}
        <div className="w-full rounded-2xl bg-[#111827]/90 backdrop-blur-md border border-[#28354E] p-4 shadow-2xl">
          <div className="flex items-center justify-between gap-2 text-xs mb-2">
            <div className="flex items-center gap-2 text-slate-200 font-bold text-start">
              {progress < 100 && !isInitiallyOffline && (
                <span className="inline-block w-3.5 h-3.5 rounded-full border-2 border-[#4FF5D2] border-t-transparent animate-spin shrink-0" />
              )}
              <span>{statusLabel}</span>
            </div>
            <span className="font-mono-num text-sm font-extrabold text-[#FFD166] shrink-0">
              {progress}%
            </span>
          </div>
          <div className="w-full h-3 rounded-xl bg-[#070A12] border border-[#28354E] overflow-hidden p-0.5">
            <div
              className="h-full rounded-lg bg-gradient-to-r from-[#4FF5D2] via-[#38D9A9] to-[#FFD166] shadow-[0_0_16px_rgba(255,209,102,0.5)] transition-all duration-150 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 text-xs font-bold text-slate-400">
        NEUROX ESPORTS · بيئة تنافسية حقيقية · قانون اللعب النظيف
      </div>
    </div>
  );
};
