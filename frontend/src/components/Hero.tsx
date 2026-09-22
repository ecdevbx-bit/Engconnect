'use client';

import { useEffect, useState } from 'react';
import { emitToast } from '../lib/toast';
import Reveal from './client/Reveal';

const TILE_WORDS = ['She', 'speaks', 'English', 'with', 'confidence'];

export default function Hero() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % TILE_WORDS.length);
    }, 1200);

    return () => window.clearInterval(timer);
  }, []);

  const scrollToPuzzle = () => {
    document.getElementById('puzzle')?.scrollIntoView({ behavior: 'smooth' });
    emitToast({
      title: "Let's go!",
      body: 'Drag the word tiles to build the sentence.',
    });
  };

  const showDemoToast = () => {
    emitToast({ title: 'Demo', body: 'Walkthrough modal coming soon.' });
  };

  return (
    <section className="hero">
      <div className="hero-grid"></div>

      <div className="hero-content">
        <div className="hero-left">
          <Reveal className="hero-badge d1">
            <div className="badge-dot">✦</div>
            AI-powered English fluency platform for India
          </Reveal>

          <Reveal className="hero-h1 d2">
            <>
              Speak
              <br />
              <em>English</em>
              <br />
              <span className="stroke">Fearlessly.</span>
            </>
          </Reveal>

          <Reveal className="hero-sub d3">
            Premium English learning for ambitious students &amp; professionals. Sentence puzzles,
            voice AI, real-time feedback — all beautifully designed for the Indian learner.
          </Reveal>

          <Reveal className="hero-actions d4">
            <>
              <button
                className="btn btn-hero btn-hero-primary"
                id="startBtn"
                type="button"
                onClick={scrollToPuzzle}
              >
                Start Free Assessment →
              </button>
              <button
                className="btn btn-hero btn-hero-secondary"
                id="demoBtn"
                type="button"
                onClick={showDemoToast}
              >
                ▶ See How It Works
              </button>
            </>
          </Reveal>

          <Reveal className="social-proof d5">
            <>
              <div className="proof-faces">
                <div
                  className="face"
                  style={{ background: 'linear-gradient(135deg,#b79fff,#ab8eff)' }}
                >
                  SP
                </div>
                <div
                  className="face"
                  style={{ background: 'linear-gradient(135deg,#00e3fd,#b79fff)' }}
                >
                  MG
                </div>
                <div
                  className="face"
                  style={{ background: 'linear-gradient(135deg,#ff6c95,#ab8eff)' }}
                >
                  AR
                </div>
                <div
                  className="face"
                  style={{ background: 'linear-gradient(135deg,#ab8eff,#ff6c95)' }}
                >
                  +
                </div>
              </div>
              <p className="proof-copy">
                <strong>1,00,000+</strong> learners enrolled across India 🇮🇳
              </p>
            </>
          </Reveal>
        </div>

        <Reveal className="hero-visual d2" variant="right">
          <>
            <div className="orb orb1"></div>
            <div className="orb orb2"></div>

            <div className="stat-card sc-1 c-box rounded-xl">
              <div className="sc-label text-muted-foreground">Accuracy Score</div>
              <div className="sc-val text-cyan">
                92%
              </div>
              <div className="sc-chip" style={{ background: 'rgba(0,227,253,0.10)', color: '#00e3fd' }}>
                📈 +14% this week
              </div>
            </div>

            <div className="stat-card sc-2 c-box rounded-xl">
              <div className="sc-label text-muted-foreground">Daily Streak</div>
              <div className="sc-val">🔥 14</div>
              <div className="sc-chip" style={{ background: 'rgba(255,108,149,0.10)', color: '#ff6c95' }}>
                Keep going!
              </div>
            </div>

            <div className="stat-card sc-3 c-box rounded-xl">
              <div className="sc-label text-muted-foreground">CEFR Level</div>
              <div className="sc-val text-primary">
                B2
              </div>
              <div className="sc-chip" style={{ background: 'rgba(171,142,255,0.12)', color: '#ab8eff' }}>
                Upper-Intermediate
              </div>
            </div>

            <div className="stat-card sc-4 c-box rounded-xl">
              <div className="sc-label text-muted-foreground">AI Tutor</div>
              <div className="sc-val text-heading" style={{ fontSize: '13px', lineHeight: '1.4' }}>
                Grammar
                <br />
                corrected ✓
              </div>
            </div>

            <div className="phone-mockup c-box">
              <div className="phone-notch"></div>
              <div className="phone-screen">
                <div className="phone-appbar">
                  <div className="phone-appbar-title text-heading">English Connection</div>
                  <div className="phone-streak">🔥 14 day streak</div>
                </div>

                <div className="phone-level-card c-box rounded-xl">
                  <div className="plc-label text-muted-foreground">Your CEFR Level</div>
                  <div className="plc-val text-heading">B2 Upper-Intermediate</div>
                  <div className="plc-bar">
                    <div className="plc-fill"></div>
                  </div>
                </div>

                <div className="phone-mini-cards">
                  <div className="pmc c-box rounded-lg">
                    <div className="pmc-val text-cyan">
                      92%
                    </div>
                    <div className="pmc-label text-muted-foreground">Accuracy</div>
                  </div>
                  <div className="pmc c-box rounded-lg">
                    <div className="pmc-val text-primary">
                      247
                    </div>
                    <div className="pmc-label text-muted-foreground">Words Learnt</div>
                  </div>
                  <div className="pmc c-box rounded-lg">
                    <div className="pmc-val" style={{ color: '#f59e0b' }}>
                      48
                    </div>
                    <div className="pmc-label text-muted-foreground">Puzzles</div>
                  </div>
                </div>

                <div className="phone-tile-area">
                  <div className="pta-label text-muted-foreground">Today&apos;s Puzzle</div>
                  <div className="pta-tiles">
                    {TILE_WORDS.map((word, index) => {
                      const classNames = ['pta-tile'];
                      if (index < activeIndex) classNames.push('done');
                      if (index === activeIndex) classNames.push('correct');

                      return (
                        <div key={word} className={classNames.join(' ')}>
                          {word}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="phone-voice c-box rounded-lg">
                  <div className="pv-icon">🎙️</div>
                  <div className="pv-text">
                    <strong className="text-heading">Voice AI Active</strong>
                    Pronounce the sentence now…
                  </div>
                  <div className="pv-wave">
                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            </div>
          </>
        </Reveal>
      </div>

      <div className="scroll-strip">
        <div className="strip-track">
          {[
            '🧩 Sentence Builder',
            '🎙️ Voice Practice',
            '🤖 AI Tutor',
            '📊 CEFR Tracking',
            '🔥 Daily Streaks',
            '⚡ Instant Feedback',
            '🏆 Leaderboard',
            '🎯 Adaptive AI',
            '🧩 Sentence Builder',
            '🎙️ Voice Practice',
            '🤖 AI Tutor',
            '📊 CEFR Tracking',
            '🔥 Daily Streaks',
            '⚡ Instant Feedback',
            '🏆 Leaderboard',
            '🎯 Adaptive AI',
          ].map((item, index) => {
            const [icon, ...label] = item.split(' ');
            return (
              <div key={`${item}-${index}`} className="strip-item">
                <span className="strip-icon">{icon}</span>
                <span>{label.join(' ')}</span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
