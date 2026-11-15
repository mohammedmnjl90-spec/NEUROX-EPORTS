import React, { useEffect, useRef, useState } from 'react';
import { VIP_PACKAGES } from '../data/constants';
import { getDailyBossQuestion } from '../data/questionBank';
import {
  applyVipPackageToAccount,
  getTodayDateStr,
  loadHourlyAdConfig,
  redeemPromoVipCode,
  submitVipPaymentRequest,
} from '../services/storage';
import {
  EconomyLedgerEntry,
  PlayerAccount,
  VipTier,
} from '../types';
import { getViewTranslations } from '../utils/i18n';
import { soundFX } from '../utils/sound';
import {
  Building2,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Ticket,
  X,
} from 'lucide-react';

interface StoreAndRewardsViewProps {
  account: PlayerAccount;
  onUpdateAccount: (updated: PlayerAccount, toastMsg?: string) => void;
}

const WHEEL_SEGMENTS = [
  { label: '10 🪙', type: 'coins' as const, value: 10, color: '#1B253B' },
  { label: '15 🪙', type: 'coins' as const, value: 15, color: '#111827' },
  { label: '25 🪙', type: 'coins' as const, value: 25, color: '#1B253B' },
  { label: '60 🪙 !', type: 'coins' as const, value: 60, color: '#FFD166' },
  { label: '50:50 🎯', type: 'lifeline' as const, value: 1, color: '#4FF5D2' },
  { label: '+5s ❄️', type: 'freeze' as const, value: 1, color: '#A78BFA' },
];

export const StoreAndRewardsView: React.FC<StoreAndRewardsViewProps> = ({
  account,
  onUpdateAccount,
}) => {
  const vt = getViewTranslations(account.language);
  const today = getTodayDateStr();

  // Keep a live reference to the latest account state for async timers
  const latestAccountRef = useRef<PlayerAccount>(account);
  useEffect(() => {
    latestAccountRef.current = account;
  }, [account]);

  // Spin Wheel State
  const [wheelRotation, setWheelRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const canFreeSpinToday = account.lastSpinDate !== today;

  // Reward Ad 5-second Modal State
  const [watchingAd, setWatchingAd] = useState(false);
  const [adSecondsLeft, setAdSecondsLeft] = useState(5);
  const adsWatchedToday =
    account.adsWatchedDate === today ? account.adsWatchedCount : 0;

  // Daily Boss 5-second Question Modal State
  const [dailyBossOpen, setDailyBossOpen] = useState(false);
  const [bossTimeLeft, setBossTimeLeft] = useState(5);
  const [bossAnswered, setBossAnswered] = useState(false);
  const dailyBossQuestion = getDailyBossQuestion(today);
  const bossDoneToday = account.lastDailyBossDate === today;

  // Secure VIP Checkout Modal & Promo Code State
  const [checkoutTier, setCheckoutTier] = useState<VipTier | null>(null);
  const [checkoutTab, setCheckoutTab] = useState<'electronic' | 'code' | 'transfer'>('electronic');
  const [paymentGateway, setPaymentGateway] = useState<'card_mada' | 'paypal'>('card_mada');
  const [cardHolderName, setCardHolderName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [checkoutSuccess, setCheckoutSuccess] = useState<string | null>(null);
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [transferReferenceInput, setTransferReferenceInput] = useState('');
  const adConfig = loadHourlyAdConfig();

  const appendLedger = (
    acc: PlayerAccount,
    type: 'credit' | 'debit',
    amount: number,
    reason: string,
    newBalance: number
  ): EconomyLedgerEntry[] => {
    const entry: EconomyLedgerEntry = {
      id: `ldg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      timestamp: Date.now(),
      type,
      amount,
      reason,
      balanceAfter: newBalance,
    };
    return [entry, ...acc.ledger.slice(0, 99)];
  };

  // Reward Ad 5s timer (without mutating parent state inside setState updater)
  useEffect(() => {
    if (!watchingAd) return;
    if (adSecondsLeft <= 0) {
      setWatchingAd(false);
      const currAcc = latestAccountRef.current;
      const currAdsCount =
        currAcc.adsWatchedDate === today ? currAcc.adsWatchedCount : 0;
      const newCoins = currAcc.coins + 30;
      const updated: PlayerAccount = {
        ...currAcc,
        coins: newCoins,
        adsWatchedDate: today,
        adsWatchedCount: currAdsCount + 1,
        ledger: appendLedger(
          currAcc,
          'credit',
          30,
          `${vt.rewardAdTitle} (${currAdsCount + 1}/3)`,
          newCoins
        ),
      };
      soundFX.playCoin();
      onUpdateAccount(updated, '+30 🪙');
      return;
    }

    const timer = window.setTimeout(() => {
      setAdSecondsLeft(prev => prev - 1);
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [watchingAd, adSecondsLeft, today, vt.rewardAdTitle, onUpdateAccount]);

  // Daily Boss 5s timer (without mutating parent state inside setState updater)
  useEffect(() => {
    if (!dailyBossOpen || bossAnswered) return;
    if (bossTimeLeft <= 0) {
      setBossAnswered(true);
      soundFX.playWrong();
      const currAcc = latestAccountRef.current;
      const updated: PlayerAccount = {
        ...currAcc,
        lastDailyBossDate: today,
      };
      onUpdateAccount(updated);
      window.setTimeout(() => setDailyBossOpen(false), 1200);
      return;
    }

    const timer = window.setTimeout(() => {
      soundFX.playTick(true);
      setBossTimeLeft(prev => prev - 1);
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [dailyBossOpen, bossAnswered, bossTimeLeft, today, onUpdateAccount]);

  // Spin Wheel Handler
  const handleSpinWheel = (isFree: boolean) => {
    if (isSpinning) return;
    if (!isFree && account.coins < 250) {
      soundFX.playWrong();
      return;
    }

    soundFX.playClick();
    setIsSpinning(true);

    const prizeIdx = Math.floor(Math.random() * WHEEL_SEGMENTS.length);
    const segmentAngle = 360 / WHEEL_SEGMENTS.length;
    const extraSpins = 5 * 360;
    const targetRotation =
      wheelRotation + extraSpins + (360 - prizeIdx * segmentAngle);
    setWheelRotation(targetRotation);

    window.setTimeout(() => {
      setIsSpinning(false);
      const currAcc = latestAccountRef.current;
      const prize = WHEEL_SEGMENTS[prizeIdx];
      let nextCoins = isFree ? currAcc.coins : Math.max(0, currAcc.coins - 250);
      const nextLifelines = { ...currAcc.lifelines };
      let msg = '';

      if (prize.type === 'coins') {
        nextCoins += prize.value;
        msg = `🎉 +${prize.value} 🪙`;
      } else if (prize.type === 'lifeline') {
        nextLifelines.fiftyFifty += 1;
        msg = '🎉 +1 (50:50 🎯)';
      } else {
        nextLifelines.freezeTime += 1;
        msg = '🎉 +1 (+5s ❄️)';
      }

      soundFX.playCoin();
      const updated: PlayerAccount = {
        ...currAcc,
        coins: nextCoins,
        lifelines: nextLifelines,
        lastSpinDate: isFree ? today : currAcc.lastSpinDate,
        ledger: appendLedger(
          currAcc,
          nextCoins >= currAcc.coins ? 'credit' : 'debit',
          Math.abs(nextCoins - currAcc.coins),
          `${vt.spinWheelTitle} (${prize.label})`,
          nextCoins
        ),
      };
      onUpdateAccount(updated, msg);
    }, 3200);
  };

  // Buy Lifeline (Single or 5-Pack with 10% discount)
  const handleBuyLifeline = (
    key: 'fiftyFifty' | 'freezeTime' | 'autoSolve',
    titleText: string,
    unitPrice: number,
    quantity: 1 | 5
  ) => {
    const rawTotal = unitPrice * quantity;
    const finalPrice = quantity === 5 ? Math.round(rawTotal * 0.9) : rawTotal;

    if (account.coins < finalPrice) {
      soundFX.playWrong();
      return;
    }

    soundFX.playCoin();
    const newCoins = account.coins - finalPrice;
    const updated: PlayerAccount = {
      ...account,
      coins: newCoins,
      lifelines: {
        ...account.lifelines,
        [key]: account.lifelines[key] + quantity,
      },
      ledger: appendLedger(
        account,
        'debit',
        finalPrice,
        `${quantity}× ${titleText}`,
        newCoins
      ),
    };
    onUpdateAccount(updated, `✓ ${quantity}× ${titleText}`);
  };

  // Daily Login Streak Claim
  const canClaimDailyLogin = account.lastLoginDate !== today;
  const handleClaimDailyStreak = () => {
    const vipPkg =
      VIP_PACKAGES.find(v => v.id === account.vipTier) || VIP_PACKAGES[0];
    const nextStreak = account.loginStreak + 1;
    const baseReward = Math.min(50, 10 + nextStreak * 5);
    const totalReward = baseReward * vipPkg.dailyMultiplier;
    const newCoins = account.coins + totalReward;

    soundFX.playCoin();
    const updated: PlayerAccount = {
      ...account,
      coins: newCoins,
      loginStreak: nextStreak,
      lastLoginDate: today,
      ledger: appendLedger(
        account,
        'credit',
        totalReward,
        `${vt.dailyLoginStreakTitle} (${nextStreak})`,
        newCoins
      ),
    };
    onUpdateAccount(updated, `🎁 +${totalReward} 🪙`);
  };

  // Share Game (+25 coins once daily)
  const sharedToday = account.lastShareDate === today;
  const handleShareGame = async () => {
    if (sharedToday) return;
    soundFX.playCoin();
    try {
      await navigator.clipboard.writeText(
        `NEUROX ESPORTS — ID: ${account.playerId}`
      );
    } catch {}
    const newCoins = account.coins + 25;
    const updated: PlayerAccount = {
      ...account,
      coins: newCoins,
      lastShareDate: today,
      ledger: appendLedger(
        account,
        'credit',
        25,
        vt.shareGameTitle,
        newCoins
      ),
    };
    onUpdateAccount(updated, '+25 🪙');
  };

  // Answer Daily Boss Question
  const handleAnswerDailyBoss = (idx: number) => {
    if (bossAnswered) return;
    setBossAnswered(true);
    const isCorrect = idx === dailyBossQuestion.correctIndex;
    if (isCorrect) {
      soundFX.playCorrect(true);
      const newCoins = account.coins + 20;
      const updated: PlayerAccount = {
        ...account,
        coins: newCoins,
        lastDailyBossDate: today,
        ledger: appendLedger(
          account,
          'credit',
          20,
          vt.dailyBossTitle,
          newCoins
        ),
      };
      onUpdateAccount(updated, '🔥 +20 🪙');
    } else {
      soundFX.playWrong();
      const updated: PlayerAccount = {
        ...account,
        lastDailyBossDate: today,
      };
      onUpdateAccount(updated);
    }
    setTimeout(() => setDailyBossOpen(false), 1200);
  };

  // Claim Daily Mission (+20 coins each)
  const handleClaimMission = (
    missionKey: 'onlineWins' | 'correctAnswers' | 'quranCorrect',
    titleText: string
  ) => {
    const newCoins = account.coins + 20;
    const nextMissions = { ...account.dailyMissions };
    if (missionKey === 'onlineWins') nextMissions.onlineWinsClaimed = true;
    if (missionKey === 'correctAnswers') nextMissions.correctAnswersClaimed = true;
    if (missionKey === 'quranCorrect') nextMissions.quranCorrectClaimed = true;

    soundFX.playCoin();
    const updated: PlayerAccount = {
      ...account,
      coins: newCoins,
      dailyMissions: nextMissions,
      ledger: appendLedger(
        account,
        'credit',
        20,
        titleText,
        newCoins
      ),
    };
    onUpdateAccount(updated, `🎯 +20 🪙 (${titleText})`);
  };

  // Activate VIP Package with Gold Coins OR open Secure Checkout Modal for USD purchase
  const handleActivateVip = (pkgId: VipTier, useCoins: boolean) => {
    const pkg = VIP_PACKAGES.find(p => p.id === pkgId);
    if (!pkg || pkg.id === account.vipTier) return;

    if (!useCoins) {
      soundFX.playClick();
      if (pkg.id === 'basic') {
        const updatedBasic: PlayerAccount = {
          ...account,
          vipTier: 'basic',
          updatedAt: Date.now(),
        };
        onUpdateAccount(updatedBasic, `تم التبديل إلى ${pkg.nameAr}`);
        return;
      }
      setCheckoutTier(pkg.id);
      setCheckoutTab('electronic');
      setCheckoutError(null);
      setCheckoutSuccess(null);
      return;
    }

    if (account.coins < pkg.priceCoins) {
      soundFX.playWrong();
      onUpdateAccount(
        account,
        `⚠️ رصيدك الحالي (${account.coins} 🪙) غير كافٍ لتفعيل ${pkg.nameAr} (${pkg.priceCoins} 🪙). يمكنك الاشتراك بالدولار (${pkg.priceUsdText}) أو شحن كود قسيمة!`
      );
      return;
    }

    soundFX.playVictory();
    const deducted = pkg.priceCoins;
    const newCoins = account.coins - deducted + pkg.instantCoins;
    const updatedAfterDeduction: PlayerAccount = {
      ...account,
      coins: account.coins - deducted,
    };
    const finalUpdated = applyVipPackageToAccount(
      updatedAfterDeduction,
      pkg.id,
      `تفعيل بالعملات الذهبية (-${deducted} 🪙)`
    );
    finalUpdated.coins = newCoins;
    onUpdateAccount(
      finalUpdated,
      `👑 تم تفعيل ${pkg.nameAr} بنجاح! (+${pkg.instantCoins} 🪙 فورية وإيقاف الإعلانات التلقائية)`
    );
  };

  // Complete Direct Electronic Payment (Card / Mada / Visa / MasterCard / PayPal)
  const handleCompleteElectronicPayment = () => {
    if (!checkoutTier) return;
    const pkg = VIP_PACKAGES.find(p => p.id === checkoutTier);
    if (!pkg) return;

    setCheckoutError(null);
    if (paymentGateway === 'card_mada') {
      const cleanNum = cardNumber.replace(/\s+/g, '');
      if (cardHolderName.trim().length < 3) {
        soundFX.playWrong();
        setCheckoutError('يرجى إدخال اسم حامل البطاقة بشكل صحيح.');
        return;
      }
      if (cleanNum.length < 12) {
        soundFX.playWrong();
        setCheckoutError('يرجى إدخال رقم البطاقة الائتمانية / مدى (16 رقماً).');
        return;
      }
      if (cardExpiry.trim().length < 4 || cardCvv.trim().length < 3) {
        soundFX.playWrong();
        setCheckoutError('يرجى إدخال تاريخ الانتهاء (MM/YY) ورمز الأمان (CVV).');
        return;
      }
    }

    soundFX.playClick();
    setIsProcessingPayment(true);

    window.setTimeout(() => {
      setIsProcessingPayment(false);
      soundFX.playVictory();
      const methodLabel =
        paymentGateway === 'paypal'
          ? `اشتراك إلكتروني عبر PayPal (${pkg.priceUsdText})`
          : `اشتراك إلكتروني بالبطاقة / مدى (${pkg.priceUsdText})`;

      const updatedAcc = applyVipPackageToAccount(
        account,
        pkg.id,
        methodLabel
      );

      // Also record approved transaction in owner payment logs
      submitVipPaymentRequest({
        account: updatedAcc,
        requestedTier: pkg.id,
        priceUsdText: pkg.priceUsdText,
        paymentMethod: paymentGateway === 'paypal' ? 'paypal' : 'card',
        transferReference:
          paymentGateway === 'paypal'
            ? `دفع إلكتروني مكتمل عبر PayPal (${pkg.priceUsdText})`
            : `بطاقة باسم ${cardHolderName.trim()} تنتهي بـ ${cardNumber.slice(-4)} (${pkg.priceUsdText})`,
      });

      onUpdateAccount(
        updatedAcc,
        `👑 تم إتمام الدفع وتفعيل ${pkg.nameAr} (${pkg.priceUsdText}) فوراً! تمت إضافة +${pkg.instantCoins} 🪙 وإيقاف الإعلانات التلقائية نهائياً.`
      );
      setCheckoutTier(null);
      setCardHolderName('');
      setCardNumber('');
      setCardExpiry('');
      setCardCvv('');
    }, 800);
  };

  // Redeem Promo / VIP Code
  const handleRedeemCodeSubmit = () => {
    setCheckoutError(null);
    setCheckoutSuccess(null);
    const res = redeemPromoVipCode(account, promoCodeInput);
    if (!res.success || !res.updatedAccount) {
      soundFX.playWrong();
      setCheckoutError(res.messageAr);
      return;
    }
    soundFX.playVictory();
    setPromoCodeInput('');
    onUpdateAccount(res.updatedAccount, res.messageAr);
    setCheckoutSuccess(res.messageAr);
    window.setTimeout(() => {
      setCheckoutTier(null);
      setCheckoutSuccess(null);
    }, 1400);
  };

  // Submit Direct VIP Subscription Request (Local Transfer / Contact Admin)
  const handleSubmitDirectTransferRequest = () => {
    if (!checkoutTier) return;
    const pkg = VIP_PACKAGES.find(p => p.id === checkoutTier);
    if (!pkg) return;

    setCheckoutError(null);
    if (transferReferenceInput.trim().length < 3) {
      soundFX.playWrong();
      setCheckoutError(
        'يرجى كتابة رقم الحوالة أو اسم المحوّل أو ملاحظة التأكيد لإرسال الطلب للإدارة.'
      );
      return;
    }

    soundFX.playCorrect();
    submitVipPaymentRequest({
      account,
      requestedTier: pkg.id,
      priceUsdText: pkg.priceUsdText,
      paymentMethod: 'local_transfer',
      transferReference: transferReferenceInput.trim(),
    });

    setTransferReferenceInput('');
    setCheckoutSuccess(
      `✅ تم إرسال طلب الاشتراك في ${pkg.nameAr} (${pkg.priceUsdText}) إلى لوحة تحكم الإدارة بنجاح! سيتم تفعيل باقتك فوراً.`
    );
  };

  return (
    <div className="space-y-8 pb-10">
      {/* Top Balance Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-[#111827] via-[#1B253B] to-[#111827] border border-[#28354E] p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white mb-1">
            {vt.storeBannerTitle}
          </h2>
          <p className="text-xs text-slate-400">
            {vt.storeBannerSub}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2.5 rounded-2xl bg-[#070A12] border border-[#FFD166]/40 flex items-center gap-2">
            <span className="text-xl">🪙</span>
            <div>
              <div className="text-[10px] text-slate-400">{vt.currentBalanceLabel}</div>
              <div
                dir="ltr"
                className="text-lg font-extrabold font-mono-num text-[#FFD166] whitespace-nowrap"
              >
                {account.coins}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section 1: Lifelines Store (Single & 5-Pack 10% Discount) */}
      <div>
        <h3 className="text-base font-extrabold text-white mb-3">
          {vt.lifelinesSectionTitle}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              key: 'fiftyFifty' as const,
              icon: '🎯',
              title: vt.fiftyFiftyTitle,
              desc: vt.fiftyFiftyDesc,
              price: 250,
              owned: account.lifelines.fiftyFifty,
            },
            {
              key: 'freezeTime' as const,
              icon: '❄️',
              title: vt.freezeTimeTitle,
              desc: vt.freezeTimeDesc,
              price: 300,
              owned: account.lifelines.freezeTime,
            },
            {
              key: 'autoSolve' as const,
              icon: '⚡',
              title: vt.autoSolveTitle,
              desc: vt.autoSolveDesc,
              price: 450,
              owned: account.lifelines.autoSolve,
            },
          ].map(item => {
            const pack5Price = Math.round(item.price * 5 * 0.9);
            return (
              <div
                key={item.key}
                className="rounded-3xl bg-[#111827] border border-[#28354E] p-5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-3xl">{item.icon}</span>
                    <span className="text-xs font-mono-num text-[#4FF5D2]">
                      {vt.youOwnLabel} {item.owned}
                    </span>
                  </div>
                  <h4 className="text-sm font-extrabold text-white mb-1">
                    {item.title}
                  </h4>
                  <p className="text-xs text-slate-400 mb-4">{item.desc}</p>
                </div>

                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() =>
                      handleBuyLifeline(item.key, item.title, item.price, 1)
                    }
                    className="w-full min-h-[42px] rounded-xl bg-[#1B253B] hover:bg-[#28354E] border border-[#28354E] text-xs font-bold text-white flex items-center justify-between px-4"
                  >
                    <span>{vt.buy1UnitBtn}</span>
                    <span className="font-mono-num text-[#FFD166]">
                      {item.price} 🪙
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleBuyLifeline(item.key, item.title, item.price, 5)
                    }
                    className="w-full min-h-[42px] rounded-xl bg-[#4FF5D2]/15 hover:bg-[#4FF5D2]/25 border border-[#4FF5D2]/50 text-xs font-extrabold text-[#4FF5D2] flex items-center justify-between px-4"
                  >
                    <span>{vt.buy5PackBtn}</span>
                    <span className="font-mono-num text-[#FFD166]">
                      {pack5Price} 🪙
                    </span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 2: Daily Spin Wheel & Daily Login & Daily Boss & Ads/Share */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Spin Wheel 🎡 */}
        <div className="rounded-3xl bg-[#111827] border border-[#28354E] p-6 flex flex-col items-center text-center">
          <h3 className="text-base font-extrabold text-white mb-1">
            {vt.spinWheelTitle}
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            {vt.spinWheelSub}
          </p>

          {/* Animated Wheel */}
          <div className="relative w-52 h-52 my-3 flex items-center justify-center">
            <div className="absolute -top-3 z-20 text-2xl">🔻</div>
            <div
              className="w-full h-full rounded-full border-4 border-[#4FF5D2] bg-[#1B253B] shadow-[0_0_30px_rgba(79,245,210,0.2)] flex items-center justify-center relative overflow-hidden"
              style={{
                transform: `rotate(${wheelRotation}deg)`,
                transition: isSpinning
                  ? 'transform 3.1s cubic-bezier(0.16, 1, 0.3, 1)'
                  : 'none',
              }}
            >
              {WHEEL_SEGMENTS.map((seg, i) => (
                <div
                  key={i}
                  className="absolute text-[11px] font-extrabold text-white"
                  style={{
                    transform: `rotate(${i * 60}deg) translateY(-68px)`,
                  }}
                >
                  {seg.label}
                </div>
              ))}
              <div className="w-12 h-12 rounded-full bg-[#070A12] border-2 border-[#FFD166] flex items-center justify-center text-lg z-10">
                🎡
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 w-full mt-4">
            <button
              type="button"
              disabled={!canFreeSpinToday || isSpinning}
              onClick={() => handleSpinWheel(true)}
              className="min-h-[44px] rounded-xl bg-gradient-to-r from-[#4FF5D2] to-[#38D9A9] text-[#070A12] font-extrabold text-xs disabled:opacity-40"
            >
              {canFreeSpinToday ? vt.freeSpinTodayBtn : vt.freeSpinUsedBtn}
            </button>

            <button
              type="button"
              disabled={isSpinning}
              onClick={() => handleSpinWheel(false)}
              className="min-h-[44px] rounded-xl bg-[#1B253B] hover:bg-[#28354E] border border-[#FFD166]/40 text-xs font-bold text-[#FFD166]"
            >
              {vt.extraSpinBtn}
            </button>
          </div>
        </div>

        {/* Daily Boss, Login Streak, Rewarded Ads, Share */}
        <div className="space-y-3">
          {/* Daily Boss 🔥 */}
          <div className="rounded-3xl bg-gradient-to-r from-[#1B253B] to-[#111827] border border-[#FFD166]/60 p-5 flex items-center justify-between gap-4">
            <div>
              <div className="text-xs font-extrabold text-[#FFD166] mb-1">
                {vt.dailyBossTitle}
              </div>
              <p className="text-xs text-slate-300">
                {vt.dailyBossDesc}
              </p>
            </div>
            <button
              type="button"
              disabled={bossDoneToday}
              onClick={() => {
                soundFX.playClick();
                setBossTimeLeft(5);
                setBossAnswered(false);
                setDailyBossOpen(true);
              }}
              className="min-h-[44px] px-4 rounded-xl bg-[#FFD166] text-[#070A12] font-extrabold text-xs shrink-0 disabled:opacity-40"
            >
              {bossDoneToday ? vt.dailyBossDoneBtn : vt.dailyBossStartBtn}
            </button>
          </div>

          {/* Daily Login Streak 🎁 */}
          <div className="rounded-3xl bg-[#111827] border border-[#28354E] p-5 flex items-center justify-between gap-4">
            <div>
              <div className="text-xs font-extrabold text-[#4FF5D2] mb-1">
                {vt.dailyLoginStreakTitle} ({account.loginStreak})
              </div>
              <p className="text-xs text-slate-400">
                {vt.dailyLoginStreakDesc}
              </p>
            </div>
            <button
              type="button"
              disabled={!canClaimDailyLogin}
              onClick={handleClaimDailyStreak}
              className="min-h-[44px] px-4 rounded-xl bg-[#1B253B] hover:bg-[#28354E] border border-[#4FF5D2]/40 text-xs font-bold text-[#4FF5D2] shrink-0 disabled:opacity-50"
            >
              {canClaimDailyLogin ? vt.claimRewardBtn : vt.claimedTodayBtn}
            </button>
          </div>

          {/* Watch Rewarded Ad (Max 3/day, +30 coins after 5s) */}
          <div className="rounded-3xl bg-[#111827] border border-[#28354E] p-5 flex items-center justify-between gap-4">
            <div>
              <div className="text-xs font-extrabold text-white mb-1">
                {vt.rewardAdTitle} ({adsWatchedToday}/3)
              </div>
              <p className="text-xs text-slate-400">
                {vt.rewardAdDesc}
              </p>
            </div>
            <button
              type="button"
              disabled={adsWatchedToday >= 3}
              onClick={() => {
                soundFX.playClick();
                setAdSecondsLeft(5);
                setWatchingAd(true);
              }}
              className="min-h-[44px] px-4 rounded-xl bg-[#38D9A9]/20 hover:bg-[#38D9A9]/30 border border-[#38D9A9] text-xs font-extrabold text-[#38D9A9] shrink-0 disabled:opacity-40"
            >
              {adsWatchedToday >= 3 ? vt.dailyLimitReachedBtn : vt.watchAdBtn}
            </button>
          </div>

          {/* Share Game (+25 coins once daily) */}
          <div className="rounded-3xl bg-[#111827] border border-[#28354E] p-5 flex items-center justify-between gap-4">
            <div>
              <div className="text-xs font-extrabold text-white mb-1">
                {vt.shareGameTitle}
              </div>
              <p className="text-xs text-slate-400">
                {vt.shareGameDesc}
              </p>
            </div>
            <button
              type="button"
              disabled={sharedToday}
              onClick={handleShareGame}
              className="min-h-[44px] px-4 rounded-xl bg-[#A78BFA]/20 hover:bg-[#A78BFA]/30 border border-[#A78BFA] text-xs font-extrabold text-[#A78BFA] shrink-0 disabled:opacity-40"
            >
              {sharedToday ? vt.sharedTodayBtn : vt.shareNowBtn}
            </button>
          </div>
        </div>
      </div>

      {/* Section 3: Daily Missions 🎯 */}
      <div className="rounded-3xl bg-[#111827] border border-[#28354E] p-6">
        <h3 className="text-base font-extrabold text-white mb-4">
          {vt.dailyMissionsTitle}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              key: 'onlineWins' as const,
              title: vt.missionOnlineWins,
              current: account.dailyMissions.onlineWins,
              target: 3,
              claimed: account.dailyMissions.onlineWinsClaimed,
            },
            {
              key: 'correctAnswers' as const,
              title: vt.missionCorrectAnswers,
              current: account.dailyMissions.correctAnswers,
              target: 15,
              claimed: account.dailyMissions.correctAnswersClaimed,
            },
            {
              key: 'quranCorrect' as const,
              title: vt.missionQuranCorrect,
              current: account.dailyMissions.quranCorrect,
              target: 5,
              claimed: account.dailyMissions.quranCorrectClaimed,
            },
          ].map(m => {
            const done = m.current >= m.target;
            return (
              <div
                key={m.key}
                className="rounded-2xl bg-[#1B253B] border border-[#28354E] p-4 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs font-bold text-white mb-2">
                    <span>{m.title}</span>
                    <span className="font-mono-num text-[#4FF5D2]">
                      {Math.min(m.current, m.target)}/{m.target}
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#070A12] overflow-hidden mb-4">
                    <div
                      className="h-full bg-[#4FF5D2]"
                      style={{
                        width: `${Math.min(100, (m.current / m.target) * 100)}%`,
                      }}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  disabled={!done || m.claimed}
                  onClick={() => handleClaimMission(m.key, m.title)}
                  className="w-full min-h-[40px] rounded-xl bg-[#FFD166] text-[#070A12] font-extrabold text-xs disabled:opacity-40"
                >
                  {m.claimed
                    ? vt.claimedTodayBtn
                    : done
                    ? `${vt.claimRewardBtn} (+20 🪙)`
                    : vt.inProgressBtn}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 4: Royal VIP Subscriptions (4 Tiers) */}
      <div id="vip-store">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div>
            <h3 className="text-base font-extrabold text-white">
              {vt.vipPackagesTitle}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              اشترك في أي باقة VIP لإيقاف الإعلانات التلقائية كل ساعة نهائياً والحصول على عملات ومساعدات فورية
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              soundFX.playClick();
              setCheckoutTier('royal_gold');
              setCheckoutTab('code');
              setCheckoutError(null);
              setCheckoutSuccess(null);
            }}
            className="min-h-[40px] px-4 rounded-xl bg-[#1B253B] hover:bg-[#28354E] border border-[#FFD166]/60 text-xs font-extrabold text-[#FFD166] flex items-center gap-1.5 shadow-md"
          >
            <Ticket className="w-4 h-4" />
            <span>🎟️ شحن كود قسيمة VIP أو عملات</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {VIP_PACKAGES.map(pkg => {
            const isCurrent = account.vipTier === pkg.id;
            return (
              <div
                key={pkg.id}
                className={`rounded-3xl p-5 border flex flex-col justify-between ${
                  pkg.id === 'royal_gold'
                    ? 'bg-gradient-to-b from-[#1B253B] to-[#111827] border-2 border-[#FFD166] shadow-[0_0_25px_rgba(255,209,102,0.15)]'
                    : 'bg-[#111827] border-[#28354E]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-3xl">{pkg.badge}</span>
                    <span className="text-xs font-mono-num font-bold text-[#FFD166]">
                      {pkg.priceCoins > 0
                        ? `${pkg.priceCoins} 🪙 / ${pkg.priceUsdText}`
                        : pkg.priceUsdText}
                    </span>
                  </div>
                  <h4 className="text-sm font-extrabold text-white mb-2">
                    {pkg.nameAr}
                  </h4>
                  {pkg.id !== 'basic' && (
                    <div className="mb-2.5 px-2.5 py-1 rounded-lg bg-[#38D9A9]/15 border border-[#38D9A9]/40 text-[10px] font-extrabold text-[#38D9A9]">
                      🚫 إيقاف الإعلانات التلقائية كل ساعة نهائياً
                    </div>
                  )}
                  <ul className="space-y-1.5 text-xs text-slate-300 mb-5">
                    {pkg.perksAr.map((perk, idx) => (
                      <li key={idx}>• {perk}</li>
                    ))}
                  </ul>
                </div>

                {isCurrent ? (
                  <div className="w-full min-h-[42px] rounded-xl bg-[#38D9A9]/20 border border-[#38D9A9] text-[#38D9A9] text-xs font-extrabold flex items-center justify-center">
                    {vt.activePackageBadge}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {pkg.id !== 'basic' ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handleActivateVip(pkg.id, false)}
                          className="w-full min-h-[42px] rounded-xl bg-gradient-to-r from-[#4FF5D2] to-[#38D9A9] hover:brightness-110 text-[#070A12] text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-md transition-all"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>اشترك الآن ({pkg.priceUsdText})</span>
                        </button>
                        {pkg.priceCoins > 0 && (
                          <button
                            type="button"
                            onClick={() => handleActivateVip(pkg.id, true)}
                            className="w-full min-h-[38px] rounded-xl bg-[#FFD166]/15 hover:bg-[#FFD166] text-[#FFD166] hover:text-[#070A12] border border-[#FFD166]/60 text-[11px] font-extrabold transition-colors"
                          >
                            {vt.activateWithCoinsBtn} ({pkg.priceCoins} 🪙)
                          </button>
                        )}
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleActivateVip(pkg.id, false)}
                        className="w-full min-h-[38px] rounded-xl bg-[#1B253B] hover:bg-[#28354E] border border-[#28354E] text-[11px] font-bold text-slate-300"
                      >
                        الباقة الافتراضية ({pkg.priceUsdText})
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 5: Protected Economy Ledger */}
      <div className="rounded-3xl bg-[#111827] border border-[#28354E] p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-extrabold text-white">
            🛡️ {vt.economyLedgerTitle}
          </h3>
          <span className="text-xs font-bold text-[#38D9A9]">
            {account.language === 'ar'
              ? 'موثق ومضمون ✓'
              : account.language === 'ur'
              ? 'تصدیق شدہ ✓'
              : 'Fair Play Verified ✓'}
          </span>
        </div>
        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
          {account.ledger.slice(0, 15).map((entry, idx) => (
            <div
              key={entry.id}
              className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-[#070A12] border border-[#28354E] text-xs"
            >
              <div>
                <div className="font-bold text-white">{entry.reason}</div>
                <div className="text-[10px] text-slate-500 font-mono-num" dir="ltr">
                  {new Date(entry.timestamp).toLocaleString()}
                </div>
              </div>
              <div className="text-end font-mono-num">
                <div
                  dir="ltr"
                  className={`font-extrabold whitespace-nowrap ${
                    entry.type === 'credit' ? 'text-[#38D9A9]' : 'text-[#FF6B81]'
                  }`}
                >
                  {entry.type === 'credit' ? '+' : '-'}
                  {entry.amount} 🪙
                </div>
                <div className="text-[10px] text-slate-400 whitespace-nowrap">
                  {vt.balanceLabel}{' '}
                  <span dir="ltr">
                    {idx === 0 ? account.coins : entry.balanceAfter}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5-Second Reward Ad Modal */}
      {watchingAd && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-3xl bg-[#111827] border border-[#4FF5D2] p-6 text-center">
            <div className="text-4xl mb-3 animate-bounce">📺</div>
            <h4 className="text-lg font-extrabold text-white mb-1">
              {vt.rewardAdTitle}
            </h4>
            <p className="text-xs text-slate-400 mb-5">
              {vt.rewardAdDesc}
            </p>
            <div className="w-20 h-20 rounded-full bg-[#1B253B] border-2 border-[#FFD166] flex items-center justify-center mx-auto text-3xl font-extrabold font-mono-num text-[#FFD166]">
              {adSecondsLeft}
            </div>
          </div>
        </div>
      )}

      {/* Daily Boss 5-Second Modal */}
      {dailyBossOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-3xl bg-[#111827] border-2 border-[#FFD166] p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-extrabold text-[#FFD166]">
                {vt.dailyBossTitle} (+20 🪙)
              </span>
              <span className="px-3 py-1 rounded-xl bg-[#FF6B81]/20 border border-[#FF6B81] text-sm font-extrabold font-mono-num text-[#FF6B81]">
                {bossTimeLeft}s
              </span>
            </div>

            <h4 className="text-lg font-extrabold text-white text-center mb-5">
              {dailyBossQuestion.questionAr}
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {dailyBossQuestion.optionsAr.map((opt, i) => (
                <button
                  key={i}
                  type="button"
                  disabled={bossAnswered}
                  onClick={() => handleAnswerDailyBoss(i)}
                  className="min-h-[50px] rounded-2xl bg-[#1B253B] hover:bg-[#28354E] border border-[#28354E] px-4 py-2.5 text-sm font-bold text-white text-start"
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          SECURE VIP CHECKOUT MODAL (نافذة بوابة الدفع الآمنة لباقات VIP)
         ==================================================================== */}
      {checkoutTier &&
        (() => {
          const selectedPkg =
            VIP_PACKAGES.find(p => p.id === checkoutTier) || VIP_PACKAGES[3];
          const externalStripeLink =
            selectedPkg.id === 'bronze'
              ? adConfig.stripeBronzeUrl
              : selectedPkg.id === 'silver'
              ? adConfig.stripeSilverUrl
              : adConfig.stripeGoldUrl;

          return (
            <div
              dir="rtl"
              className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
            >
              <div className="w-full max-w-2xl rounded-3xl bg-[#111827] border-2 border-[#FFD166] p-5 sm:p-6 shadow-[0_0_50px_rgba(255,209,102,0.22)] my-auto space-y-5">
                {/* Modal Header */}
                <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#28354E]">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-[#FFD166]/20 border border-[#FFD166] flex items-center justify-center text-3xl shrink-0">
                      {selectedPkg.badge}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base sm:text-lg font-extrabold text-white">
                          بوابة الدفع الآمنة (Secure Checkout)
                        </h3>
                        <span className="px-2.5 py-0.5 rounded-full bg-[#38D9A9]/20 border border-[#38D9A9] text-[10px] font-extrabold text-[#38D9A9] flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" />
                          <span>مشفر وآمن 256-Bit SSL</span>
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-0.5">
                        تفعيل فوري ومرتبط بـ Cloud Firestore مع إيقاف الإعلانات التلقائية نهائياً
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCheckoutTier(null)}
                    className="w-9 h-9 rounded-xl bg-[#1B253B] hover:bg-[#28354E] text-slate-300 hover:text-white flex items-center justify-center"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Package Selector & Summary Card */}
                <div className="p-4 rounded-2xl bg-[#070A12] border border-[#28354E] space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-xs font-extrabold text-slate-300">
                      ملخص الباقة المختارة:
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {VIP_PACKAGES.filter(p => p.id !== 'basic').map(p => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            soundFX.playClick();
                            setCheckoutTier(p.id);
                          }}
                          className={`px-3 py-1 rounded-xl text-[11px] font-extrabold border transition-all ${
                            checkoutTier === p.id
                              ? 'bg-[#FFD166] text-[#070A12] border-[#FFD166]'
                              : 'bg-[#111827] text-slate-300 border-[#28354E]'
                          }`}
                        >
                          {p.badge} {p.nameAr} ({p.priceUsdText})
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-[#1B253B]">
                    <div>
                      <div className="text-sm font-extrabold text-white flex items-center gap-1.5">
                        <span>{selectedPkg.badge}</span>
                        <span>{selectedPkg.nameAr}</span>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-1.5">
                        {selectedPkg.perksAr.map((perk, idx) => (
                          <span
                            key={idx}
                            className="px-2.5 py-1 rounded-lg bg-[#111827] border border-[#28354E] text-[11px] text-slate-200"
                          >
                            ✓ {perk}
                          </span>
                        ))}
                        <span className="px-2.5 py-1 rounded-lg bg-[#38D9A9]/15 border border-[#38D9A9]/50 text-[11px] font-extrabold text-[#38D9A9]">
                          ✓ إيقاف الإعلانات التلقائية كل ساعة
                        </span>
                      </div>
                    </div>

                    <div className="text-end shrink-0">
                      <div className="text-[11px] text-slate-400">
                        الإجمالي المطلوب
                      </div>
                      <div
                        dir="ltr"
                        className="text-2xl font-mono-num font-extrabold text-[#FFD166]"
                      >
                        {selectedPkg.priceUsdText}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3 Payment Options Tabs */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      soundFX.playClick();
                      setCheckoutTab('electronic');
                      setCheckoutError(null);
                      setCheckoutSuccess(null);
                    }}
                    className={`min-h-[44px] px-3 py-2 rounded-2xl border text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all ${
                      checkoutTab === 'electronic'
                        ? 'bg-[#4FF5D2] text-[#070A12] border-[#4FF5D2]'
                        : 'bg-[#070A12] text-slate-300 border-[#28354E]'
                    }`}
                  >
                    <CreditCard className="w-4 h-4 shrink-0" />
                    <span>1) الدفع الإلكتروني المباشر</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      soundFX.playClick();
                      setCheckoutTab('code');
                      setCheckoutError(null);
                      setCheckoutSuccess(null);
                    }}
                    className={`min-h-[44px] px-3 py-2 rounded-2xl border text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all ${
                      checkoutTab === 'code'
                        ? 'bg-[#FFD166] text-[#070A12] border-[#FFD166]'
                        : 'bg-[#070A12] text-slate-300 border-[#28354E]'
                    }`}
                  >
                    <Ticket className="w-4 h-4 shrink-0" />
                    <span>2) كود قسيمة شحن (VIP Code)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      soundFX.playClick();
                      setCheckoutTab('transfer');
                      setCheckoutError(null);
                      setCheckoutSuccess(null);
                    }}
                    className={`min-h-[44px] px-3 py-2 rounded-2xl border text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all ${
                      checkoutTab === 'transfer'
                        ? 'bg-[#38D9A9] text-[#070A12] border-[#38D9A9]'
                        : 'bg-[#070A12] text-slate-300 border-[#28354E]'
                    }`}
                  >
                    <Building2 className="w-4 h-4 shrink-0" />
                    <span>3) التحويل المحلي والإدارة</span>
                  </button>
                </div>

                {/* Feedback Messages */}
                {checkoutError && (
                  <div className="p-3.5 rounded-2xl bg-[#FF6B81]/15 border border-[#FF6B81] text-xs font-extrabold text-[#FF6B81]">
                    ⚠️ {checkoutError}
                  </div>
                )}

                {checkoutSuccess && (
                  <div className="p-3.5 rounded-2xl bg-[#38D9A9]/15 border border-[#38D9A9] text-xs font-extrabold text-[#38D9A9] flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{checkoutSuccess}</span>
                  </div>
                )}

                {/* TAB 1: ELECTRONIC PAYMENT (Card / Mada / Visa / MasterCard / PayPal) */}
                {checkoutTab === 'electronic' && (
                  <div className="p-4 rounded-2xl bg-[#070A12] border border-[#28354E] space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-extrabold text-white">
                        اختر وسيلة الدفع الإلكتروني:
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setPaymentGateway('card_mada')}
                          className={`px-3 py-1.5 rounded-xl text-xs font-extrabold border ${
                            paymentGateway === 'card_mada'
                              ? 'bg-[#1B253B] border-[#4FF5D2] text-[#4FF5D2]'
                              : 'bg-[#111827] border-[#28354E] text-slate-400'
                          }`}
                        >
                          💳 مدى / Visa / MasterCard
                        </button>
                        <button
                          type="button"
                          onClick={() => setPaymentGateway('paypal')}
                          className={`px-3 py-1.5 rounded-xl text-xs font-extrabold border ${
                            paymentGateway === 'paypal'
                              ? 'bg-[#1B253B] border-[#FFD166] text-[#FFD166]'
                              : 'bg-[#111827] border-[#28354E] text-slate-400'
                          }`}
                        >
                          🅿️ PayPal
                        </button>
                      </div>
                    </div>

                    {paymentGateway === 'card_mada' ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="sm:col-span-2">
                          <label className="block text-[11px] font-bold text-slate-300 mb-1">
                            اسم حامل البطاقة (Cardholder Name)
                          </label>
                          <input
                            type="text"
                            value={cardHolderName}
                            onChange={e => setCardHolderName(e.target.value)}
                            placeholder="MOHAMMED AL-OTAIBI"
                            className="w-full min-h-[42px] rounded-xl bg-[#111827] border border-[#28354E] focus:border-[#4FF5D2] focus:outline-none px-3.5 text-xs font-bold text-white"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-[11px] font-bold text-slate-300 mb-1">
                            رقم البطاقة الائتمانية / مدى (16 رقماً)
                          </label>
                          <input
                            type="text"
                            dir="ltr"
                            maxLength={19}
                            value={cardNumber}
                            onChange={e =>
                              setCardNumber(
                                e.target.value
                                  .replace(/[^0-9]/g, '')
                                  .replace(/(.{4})/g, '$1 ')
                                  .trim()
                              )
                            }
                            placeholder="4532 •••• •••• 8891"
                            className="w-full min-h-[42px] rounded-xl bg-[#111827] border border-[#28354E] focus:border-[#4FF5D2] focus:outline-none px-3.5 text-xs font-mono-num font-bold text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-300 mb-1">
                            تاريخ الانتهاء (MM/YY)
                          </label>
                          <input
                            type="text"
                            dir="ltr"
                            maxLength={5}
                            value={cardExpiry}
                            onChange={e => setCardExpiry(e.target.value)}
                            placeholder="08/29"
                            className="w-full min-h-[42px] rounded-xl bg-[#111827] border border-[#28354E] focus:border-[#4FF5D2] focus:outline-none px-3.5 text-xs font-mono-num font-bold text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-300 mb-1">
                            رمز الأمان (CVV)
                          </label>
                          <input
                            type="password"
                            dir="ltr"
                            maxLength={4}
                            value={cardCvv}
                            onChange={e =>
                              setCardCvv(e.target.value.replace(/[^0-9]/g, ''))
                            }
                            placeholder="•••"
                            className="w-full min-h-[42px] rounded-xl bg-[#111827] border border-[#28354E] focus:border-[#4FF5D2] focus:outline-none px-3.5 text-xs font-mono-num font-bold text-white"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 rounded-2xl bg-[#111827] border border-[#28354E] text-center space-y-2">
                        <div className="text-2xl">🅿️</div>
                        <div className="text-xs font-extrabold text-white">
                          الدفع الآمن السريع عبر حساب PayPal ({selectedPkg.priceUsdText})
                        </div>
                        <p className="text-[11px] text-slate-400">
                          يمكنك إتمام الدفع مباشرة لتفعيل {selectedPkg.nameAr} فوراً في حسابك ({account.playerId}).
                        </p>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-2.5 pt-1">
                      <button
                        type="button"
                        disabled={isProcessingPayment}
                        onClick={handleCompleteElectronicPayment}
                        className="flex-1 min-h-[46px] px-5 rounded-2xl bg-gradient-to-r from-[#4FF5D2] to-[#38D9A9] text-[#070A12] text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
                      >
                        <Sparkles className="w-4 h-4" />
                        <span>
                          {isProcessingPayment
                            ? 'جاري تأكيد عملية الدفع وتفعيل الباقة...'
                            : `إتمام الدفع وتفعيل ${selectedPkg.nameAr} فوراً (${selectedPkg.priceUsdText})`}
                        </span>
                      </button>

                      {externalStripeLink && (
                        <a
                          href={
                            paymentGateway === 'paypal'
                              ? adConfig.paypalCheckoutUrl
                              : externalStripeLink
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="min-h-[46px] px-4 rounded-2xl bg-[#1B253B] hover:bg-[#28354E] border border-[#28354E] text-xs font-bold text-slate-200 flex items-center gap-1.5"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-[#4FF5D2]" />
                          <span>رابط الدفع الخارجي</span>
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 2: REDEEM VIP / PROMO CODE */}
                {checkoutTab === 'code' && (
                  <div className="p-4 rounded-2xl bg-[#070A12] border border-[#FFD166]/50 space-y-3">
                    <div>
                      <h4 className="text-sm font-extrabold text-[#FFD166] mb-1">
                        🎟️ تفعيل فوري عبر كود قسيمة شحن (Redeem VIP Code)
                      </h4>
                      <p className="text-xs text-slate-300">
                        أدخل كود التفعيل الذي حصلت عليه من مالك اللعبة بعد الدفع ليتم تفعيل باقة VIP وإضافة العملات الذهبية وإيقاف الإعلانات فوراً:
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2.5">
                      <input
                        type="text"
                        dir="ltr"
                        value={promoCodeInput}
                        onChange={e =>
                          setPromoCodeInput(e.target.value.toUpperCase())
                        }
                        placeholder="مثال: VIP-ROYAL-2026"
                        className="flex-1 min-h-[46px] rounded-xl bg-[#111827] border border-[#28354E] focus:border-[#FFD166] focus:outline-none px-4 text-center font-mono-num text-sm font-extrabold text-[#FFD166] uppercase tracking-wider"
                      />
                      <button
                        type="button"
                        onClick={handleRedeemCodeSubmit}
                        className="min-h-[46px] px-6 rounded-xl bg-gradient-to-r from-[#FFD166] to-[#F59E0B] text-[#070A12] text-xs sm:text-sm font-extrabold shrink-0 shadow-lg"
                      >
                        تفعيل الكود فوراً 🚀
                      </button>
                    </div>
                  </div>
                )}

                {/* TAB 3: LOCAL TRANSFER & DIRECT REQUEST TO OWNER */}
                {checkoutTab === 'transfer' && (
                  <div className="p-4 rounded-2xl bg-[#070A12] border border-[#38D9A9]/50 space-y-3">
                    <div>
                      <h4 className="text-sm font-extrabold text-[#38D9A9] mb-1">
                        🏦 التحويل المحلي وإرسال طلب تفعيل مباشر للإدارة
                      </h4>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {adConfig.ownerContactInfo}
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-[#111827] border border-[#28354E] text-xs text-slate-300 flex flex-wrap items-center justify-between gap-2">
                      <span>
                        معرّف حسابك للتفعيل الفوري:{' '}
                        <strong
                          dir="ltr"
                          className="font-mono-num text-[#FFD166]"
                        >
                          {account.playerId}
                        </strong>
                      </span>
                      <span>
                        الباقة المطلوبة:{' '}
                        <strong className="text-[#4FF5D2]">
                          {selectedPkg.badge} {selectedPkg.nameAr} (
                          {selectedPkg.priceUsdText})
                        </strong>
                      </span>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">
                        رقم الحوالة / اسم المحوّل / ملاحظة التأكيد للإدارة:
                      </label>
                      <input
                        type="text"
                        value={transferReferenceInput}
                        onChange={e =>
                          setTransferReferenceInput(e.target.value)
                        }
                        placeholder="أدخل رقم الإيصال أو اسم المحوّل ليظهر طلبك فوراً لدى المالك..."
                        className="w-full min-h-[44px] rounded-xl bg-[#111827] border border-[#28354E] focus:border-[#38D9A9] focus:outline-none px-3.5 text-xs font-bold text-white"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleSubmitDirectTransferRequest}
                      className="w-full min-h-[46px] rounded-xl bg-gradient-to-r from-[#38D9A9] to-[#4FF5D2] text-[#070A12] text-xs sm:text-sm font-extrabold shadow-lg"
                    >
                      📨 إرسال طلب تفعيل {selectedPkg.nameAr} إلى لوحة تحكم المالك
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })()}
    </div>
  );
};

