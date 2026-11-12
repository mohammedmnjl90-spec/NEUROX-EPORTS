import { SoundPackId } from '../types';

export type SfxEventType =
  | 'correct'
  | 'wrong'
  | 'victory'
  | 'loss'
  | 'forfeit'
  | 'lifeline'
  | 'coin'
  | 'click';

// Multi-Layered Synthesized Web Audio SFX Library + Haptics Controller for NEUROX ESPORTS
// Supports 3 distinct Sound Packs ('cyber', 'royal', 'classic') and automatic variations per event

class SoundAndHapticsEngine {
  private ctx: AudioContext | null = null;
  public soundEnabled: boolean = true;
  public vibrationEnabled: boolean = true;
  public soundPack: SoundPackId = 'cyber';
  private variationCounter: number = 0;
  private listeners: Array<(event: SfxEventType, labelAr: string) => void> = [];

  private getContext(): AudioContext | null {
    if (!this.soundEnabled) return null;
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public onSfxTrigger(
    cb: (event: SfxEventType, labelAr: string) => void
  ): () => void {
    this.listeners.push(cb);
    return () => {
      this.listeners = this.listeners.filter(l => l !== cb);
    };
  }

  private emitSfxEvent(event: SfxEventType, labelAr: string) {
    for (const cb of this.listeners) {
      try {
        cb(event, labelAr);
      } catch {}
    }
  }

  private nextVariation(count: number): number {
    this.variationCounter = (this.variationCounter + 1) % count;
    return this.variationCounter;
  }

  private getPackWaveforms(): {
    lead: OscillatorType;
    sub: OscillatorType;
    pitchMult: number;
  } {
    if (this.soundPack === 'royal') {
      return { lead: 'triangle', sub: 'sine', pitchMult: 1.0 };
    }
    if (this.soundPack === 'classic') {
      return { lead: 'square', sub: 'triangle', pitchMult: 1.08 };
    }
    // Default: 'cyber'
    return { lead: 'sawtooth', sub: 'triangle', pitchMult: 1.0 };
  }

  private playToneLayer(
    ctx: AudioContext,
    freq: number,
    startTime: number,
    duration: number,
    type: OscillatorType,
    peakGain: number,
    endFreq?: number
  ) {
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);
    if (endFreq !== undefined) {
      osc.frequency.exponentialRampToValueAtTime(
        Math.max(20, endFreq),
        startTime + duration
      );
    }

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(3600, startTime);

    gain.gain.setValueAtTime(0.001, startTime);
    gain.gain.linearRampToValueAtTime(peakGain, startTime + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0008, startTime + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + duration + 0.01);
  }

  public vibrate(pattern: number | number[]) {
    if (!this.vibrationEnabled) return;
    try {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(pattern);
      }
    } catch {}
  }

  public playClick() {
    this.vibrate(10);
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const { sub, pitchMult } = this.getPackWaveforms();
      this.playToneLayer(
        ctx,
        640 * pitchMult,
        ctx.currentTime,
        0.05,
        sub,
        0.1,
        290 * pitchMult
      );
    } catch {}
  }

  public playTick(urgent: boolean = false) {
    if (urgent) this.vibrate(25);
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const { sub } = this.getPackWaveforms();
      this.playToneLayer(
        ctx,
        urgent ? 920 : 520,
        ctx.currentTime,
        0.055,
        urgent ? 'triangle' : sub,
        urgent ? 0.13 : 0.055
      );
    } catch {}
  }

  // 1. CORRECT ANSWER SFX (3 Multi-Layered Variations + Golden Question Shimmer + Combo Pitch Boost)
  public playCorrect(isGolden: boolean = false, comboCount: number = 1) {
    this.vibrate(isGolden ? [30, 40, 70] : [25, 30]);
    this.emitSfxEvent(
      'correct',
      isGolden ? '🌟 مؤثر إجابة ذهبية صحيحة (+2)' : '✅ مؤثر إجابة صحيحة'
    );
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const { lead, sub, pitchMult } = this.getPackWaveforms();
      // Scale pitch slightly up with higher combos (up to +20%)
      const comboBoost = 1 + Math.min(0.2, Math.max(0, comboCount - 1) * 0.03);
      const mult = pitchMult * comboBoost;

      const variations = [
        [523.25, 659.25, 783.99, 1046.5], // C5 - E5 - G5 - C6
        [587.33, 739.99, 880.0, 1174.66], // D5 - F#5 - A5 - D6
        [493.88, 659.25, 783.99, 987.77], // B4 - E5 - G5 - B5
      ];
      const chosen = variations[this.nextVariation(variations.length)];
      const notes = isGolden ? chosen : chosen.slice(0, 3);

      notes.forEach((freq, idx) => {
        const start = now + idx * 0.065;
        // Sub warm harmonic layer
        this.playToneLayer(ctx, freq * mult, start, 0.2, sub, 0.16);
        // Lead bright harmonic layer (fifth / octave shimmer)
        this.playToneLayer(
          ctx,
          freq * mult * (isGolden ? 1.5 : 1.0),
          start + 0.01,
          0.18,
          lead,
          0.07
        );
      });
    } catch {}
  }

  // 2. WRONG ANSWER SFX (3 Multi-Layered Dissonant Buzzer Variations)
  public playWrong() {
    this.vibrate([65, 40, 85]);
    this.emitSfxEvent('wrong', '❌ مؤثر إجابة خاطئة');
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const { lead, sub, pitchMult } = this.getPackWaveforms();
      const variations: Array<[number, number]> = [
        [240, 175],
        [220, 155],
        [260, 185],
      ];
      const [f1, f2] = variations[this.nextVariation(variations.length)];

      // First low hit
      this.playToneLayer(ctx, f1 * pitchMult, now, 0.14, lead, 0.12, (f1 - 30) * pitchMult);
      this.playToneLayer(ctx, f1 * 0.5 * pitchMult, now, 0.16, sub, 0.15);

      // Second descending buzzer hit
      this.playToneLayer(
        ctx,
        f2 * pitchMult,
        now + 0.11,
        0.22,
        lead,
        0.13,
        (f2 - 40) * pitchMult
      );
      this.playToneLayer(
        ctx,
        f2 * 0.5 * pitchMult,
        now + 0.11,
        0.24,
        sub,
        0.16
      );
    } catch {}
  }

  // 3. VICTORY SFX (3 Multi-Layered Esports Championship Fanfares)
  public playVictory() {
    this.vibrate([50, 40, 50, 40, 140]);
    this.emitSfxEvent('victory', '🏆 سيمفونية الانتصار');
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const { lead, sub, pitchMult } = this.getPackWaveforms();
      const fanfares = [
        [523.25, 659.25, 783.99, 1046.5, 1318.51], // C Major Grand Fanfare
        [440.0, 554.37, 659.25, 880.0, 1108.73], // A Major Heroic Fanfare
        [587.33, 739.99, 880.0, 1174.66, 1479.98], // D Major Royal Fanfare
      ];
      const notes = fanfares[this.nextVariation(fanfares.length)];

      notes.forEach((freq, idx) => {
        const isLast = idx === notes.length - 1;
        const start = now + idx * 0.095;
        const dur = isLast ? 0.48 : 0.22;

        this.playToneLayer(ctx, freq * pitchMult, start, dur, sub, 0.18);
        this.playToneLayer(ctx, freq * pitchMult, start, dur, lead, 0.08);
        if (isLast) {
          // Bass root chord reinforcement on final note
          this.playToneLayer(
            ctx,
            notes[0] * 0.5 * pitchMult,
            start,
            0.52,
            'triangle',
            0.16
          );
        }
      });
    } catch {}
  }

  // 4. DEFEAT / LOSS SFX (3 Dramatic Minor Descending Sequences)
  public playLoss() {
    this.vibrate([80, 50, 110]);
    this.emitSfxEvent('loss', '⚔️ مؤثر انتهاء المباراة بالخسارة');
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const { lead, sub, pitchMult } = this.getPackWaveforms();
      const sequences = [
        [440.0, 415.3, 392.0, 329.63], // A4 -> G#4 -> G4 -> E4
        [392.0, 369.99, 349.23, 293.66], // G4 -> F#4 -> F4 -> D4
        [493.88, 440.0, 392.0, 329.63], // B4 -> A4 -> G4 -> E4
      ];
      const notes = sequences[this.nextVariation(sequences.length)];

      notes.forEach((freq, idx) => {
        const isLast = idx === notes.length - 1;
        const start = now + idx * 0.14;
        const dur = isLast ? 0.45 : 0.2;
        const endF = isLast ? freq * 0.88 * pitchMult : undefined;

        this.playToneLayer(ctx, freq * pitchMult, start, dur, sub, 0.16, endF);
        this.playToneLayer(
          ctx,
          freq * 0.5 * pitchMult,
          start,
          dur + 0.04,
          lead,
          0.07,
          endF ? endF * 0.5 : undefined
        );
      });
    } catch {}
  }

  // 5. FORFEIT SFX (3 Tactical Siren / Phase-Out Sweep Variations)
  public playForfeit() {
    this.vibrate([100, 40, 60, 40, 120]);
    this.emitSfxEvent('forfeit', '🏳️ مؤثر الانسحاب التكتيكي');
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const { lead, sub, pitchMult } = this.getPackWaveforms();
      const sweeps: Array<[number, number, number]> = [
        [740, 370, 185],
        [680, 340, 170],
        [820, 410, 205],
      ];
      const [s1, s2, s3] = sweeps[this.nextVariation(sweeps.length)];

      // Tactical two-stage siren sweep + phase drop
      this.playToneLayer(
        ctx,
        s1 * pitchMult,
        now,
        0.18,
        lead,
        0.11,
        s2 * pitchMult
      );
      this.playToneLayer(
        ctx,
        s2 * pitchMult,
        now + 0.16,
        0.34,
        sub,
        0.16,
        s3 * pitchMult
      );
    } catch {}
  }

  // 6. LIFELINE ACTIVATION SFX (50:50, Freeze +5s, Auto Solve)
  public playLifeline() {
    this.vibrate([20, 25, 35]);
    this.emitSfxEvent('lifeline', '⚡ تفعيل وسيلة مساعدة');
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const { sub, pitchMult } = this.getPackWaveforms();
      this.playToneLayer(
        ctx,
        587.33 * pitchMult,
        now,
        0.12,
        sub,
        0.14,
        1174.66 * pitchMult
      );
    } catch {}
  }

  public playCoin() {
    this.vibrate([20, 30, 20]);
    this.emitSfxEvent('coin', '🪙 كسب عملات ذهبية');
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const { sub, pitchMult } = this.getPackWaveforms();
      [987.77, 1318.51].forEach((freq, idx) => {
        this.playToneLayer(
          ctx,
          freq * pitchMult,
          now + idx * 0.075,
          0.2,
          sub,
          0.15
        );
      });
    } catch {}
  }

  // 7. INCOMING CHALLENGE NOTIFICATION ALERT CHIME
  public playChallengeInvite() {
    this.vibrate([90, 50, 120, 50, 160]);
    this.emitSfxEvent('lifeline', '🔔 دعوة تحدي جديدة من صديق');
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const { lead, sub, pitchMult } = this.getPackWaveforms();
      const notes = [659.25, 880.0, 1046.5, 1318.51]; // E5 - A5 - C6 - E6
      notes.forEach((freq, idx) => {
        const start = now + idx * 0.08;
        this.playToneLayer(ctx, freq * pitchMult, start, 0.24, sub, 0.18);
        this.playToneLayer(ctx, freq * pitchMult * 1.5, start + 0.01, 0.2, lead, 0.07);
      });
    } catch {}
  }
}

export const soundFX = new SoundAndHapticsEngine();
