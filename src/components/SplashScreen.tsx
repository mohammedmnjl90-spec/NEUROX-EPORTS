import React, { useEffect, useState } from 'react';
import { PlayerAccount } from '../types';
import esportsArenaBg from '../assets/images/esports_trophy_arena_1794404580592.jpg';

interface SplashScreenProps {
  existingAccount: PlayerAccount | null;
  onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  existingAccount,
  onFinish,
}) => {
  const [progress, setProgress] = useState<number>(0);
  const [isFadingOut, setIsFadingOut] = useState<boolean>(false);

  useEffect(() => {
    let startTime: number | null = null;
    let animFrameId: number;
    const durationMs = 2400; // Smooth 2.4s loading progression

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const t = Math.min(1, elapsed / durationMs);
      // Smooth cubic ease-in-out curve
      const eased =
        t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      const currentPct = Math.min(100, Math.round(eased * 100));
      setProgress(currentPct);

      if (t < 1) {
        animFrameId = window.requestAnimationFrame(step);
      } else {
        setIsFadingOut(true);
        window.setTimeout(() => {
          onFinish();
        }, 550);
      }
    };

    animFrameId = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(animFrameId);
  }, [onFinish]);

  const loadingStageLabel =
    progress < 35
      ? 'جاري الاتصال بسحابة الميدان التنافسي...'
      : progress < 70
      ? 'جاري تحميل بنك الأسئلة وأنظمة اللعب النظيف...'
      : progress < 98
      ? 'جاري تجهيز منصة البطولة والأصدقاء...'
      : 'اكتمل التحميل · انطلاق إلى الساحة!';

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-between overflow-hidden bg-[#070A12] px-6 py-10 text-center select-none transition-all duration-500 ease-out ${
        isFadingOut ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      {/* High-Quality Esports Championship Podium Background Image */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <img
          src={esportsArenaBg}
          alt="NEUROX Esports Championship Arena"
          className={`h-full w-full object-cover object-center transition-transform duration-[3000ms] ease-out ${
            isFadingOut ? 'scale-110' : 'scale-105'
          }`}
        />
        {/* Multi-layered Vignette & Gradient Overlay for Crystal-Clear Text Legibility */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#070A12]/85 via-[#070A12]/65 to-[#070A12]/95" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,209,102,0.16)_0%,rgba(7,10,18,0.82)_75%)]" />
      </div>

      {/* Top Status Header */}
      <div className="relative z-10 mt-2 flex items-center gap-2.5 rounded-full bg-[#111827]/80 backdrop-blur-md border border-[#FFD166]/40 px-4 py-1.5 text-[11px] font-bold text-[#FFD166] shadow-lg">
        <span className="h-2 w-2 rounded-full bg-[#4FF5D2] animate-ping" />
        <span>CLOUD ESPORTS ARENA</span>
        <span aria-hidden="true">·</span>
        <span className="text-[#4FF5D2]">FAIR-PLAY VERIFIED</span>
      </div>

      {/* Center Emblem, Title & Smooth Progress Bar */}
      <div className="relative z-10 flex flex-col items-center max-w-md w-full my-auto">
        {/* Glowing Trophy & Brain Emblem */}
        <div className="relative flex items-center justify-center w-28 h-28 sm:w-32 sm:h-32 mb-5 rounded-3xl bg-[#111827]/85 backdrop-blur-md border-2 border-[#FFD166] shadow-[0_0_55px_rgba(255,209,102,0.38)]">
          <span className="text-6xl sm:text-7xl drop-shadow-[0_0_16px_rgba(255,209,102,0.65)]" role="img" aria-label="Championship Trophy">
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

        {/* Smooth Eased Progress Indicator */}
        <div className="w-full rounded-2xl bg-[#111827]/90 backdrop-blur-md border border-[#28354E] p-4 shadow-2xl">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-slate-200 font-bold">{loadingStageLabel}</span>
            <span className="font-mono-num text-sm font-extrabold text-[#FFD166]">
              {progress}%
            </span>
          </div>
          <div className="w-full h-3 rounded-xl bg-[#070A12] border border-[#28354E] overflow-hidden p-0.5">
            <div
              className="h-full rounded-lg bg-gradient-to-r from-[#4FF5D2] via-[#38D9A9] to-[#FFD166] shadow-[0_0_16px_rgba(255,209,102,0.5)] transition-all duration-75 ease-out"
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
