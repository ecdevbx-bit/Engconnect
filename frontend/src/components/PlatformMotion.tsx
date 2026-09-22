'use client';

import { useGlowBorder } from '@/hooks/useGlowBorder';

export default function PlatformMotion() {
  const glowRef = useGlowBorder<HTMLDivElement>();

  return (
  <section id="motion" className="compact-pia">
    <div className="pia-shell">
      <div className="pia-head reveal">
        <div>
          <div className="sec-eyebrow text-primary">Platform in Action</div>
          <h2 className="compact-title left text-heading">
            Compact, cinematic,
            <br />
            <em>product-first motion.</em>
          </h2>
          <p className="compact-sub left text-body">Sentence building, AI voice feedback, progress tracking, and guided practice flows — everything here shows how English Connection helps learners improve spoken English.</p>
        </div>
        <div className="pia-note reveal d2 c-box rounded-xl">
          <span className="text-heading font-semibold">Why English Connection works</span>
          <p className="text-body">Practice real sentences, speak responses, get instant AI correction, and improve with clear learning feedback.</p>
        </div>
      </div>
      <div className="pia-grid" ref={glowRef}>
        <article className="pia-card glass-glow rounded-xl reveal">
          <div className="pia-bg pia-bg-blue"></div>
          <div className="pia-topline text-muted-foreground">Sentence builder</div>
          <div className="pia-visual pv-sentence">
            <div className="sentence-flow">
              <span>She</span>
              <span>speaks</span>
              <span>English</span>
              <span>with</span>
              <span>confidence</span>
            </div>
            <div className="sentence-progress">
              <i></i>
            </div>
          </div>
          <h3 className="text-heading">Puzzle-first learning</h3>
          <p className="text-body">Animated word flow and completion rhythm make the lesson feel active immediately.</p>
        </article>
        <article className="pia-card glass-glow rounded-xl reveal d2">
          <div className="pia-bg pia-bg-green"></div>
          <div className="pia-topline text-muted-foreground">Voice AI</div>
          <div className="pia-visual pv-voice" style={{flexDirection: "column", gap: "12px"}}>
            <div style={{position: "relative", display: "flex", alignItems: "center", justifyContent: "center", width: "64px", height: "64px"}}>
              <div className="voice-core-sm">🎙️</div>
              <div className="voice-rings">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
            <div className="voice-bars-sm">
              <i></i>
              <i></i>
              <i></i>
              <i></i>
              <i></i>
              <i></i>
            </div>
          </div>
          <h3 className="text-heading">Listening and speaking feedback</h3>
          <p className="text-body">Soft pulse rings and waveform bars add a polished sense of live microphone activity.</p>
        </article>
        <article className="pia-card glass-glow rounded-xl reveal d3">
          <div className="pia-bg pia-bg-lilac"></div>
          <div className="pia-topline text-muted-foreground">Assessment</div>
          <div className="pia-visual pv-metric">
            <div className="metric-pill text-primary">B1 → B2</div>
            <div className="metric-bars">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
          <h3 className="text-heading">Progress snapshots</h3>
          <p className="text-body">Compact analytics tiles make the platform feel measurable and outcome-driven.</p>
        </article>
        <article className="pia-card glass-glow rounded-xl reveal">
          <div className="pia-bg pia-bg-night"></div>
          <div className="pia-topline text-muted-foreground">Debate mode</div>
          <div className="pia-visual pv-debate">
            <div className="mini-chat left">AI challenges your idea</div>
            <div className="mini-chat right">You respond with confidence</div>
          </div>
          <h3 className="text-heading">Conversation energy</h3>
          <p className="text-body">The debate card brings motion and layered speaking energy without being heavy.</p>
        </article>
        <article className="pia-card glass-glow rounded-xl reveal d2">
          <div className="pia-bg pia-bg-sand"></div>
          <div className="pia-topline text-muted-foreground">Courses</div>
          <div className="pia-visual pv-course" style={{flexDirection: "row", alignItems: "center", justifyContent: "center", gap: "14px"}}>
            <div className="path-line-pia" style={{position: "static", width: "100%", maxWidth: "200px", height: "2px"}}></div>
            <div style={{position: "absolute", display: "flex", alignItems: "center", gap: "14px"}}>
              <span className="node-pia done"></span>
              <span className="node-pia done"></span>
              <span className="node-pia active"></span>
              <span className="node-pia"></span>
            </div>
          </div>
          <h3 className="text-heading">Structured path visuals</h3>
          <p className="text-body">An elegant course journey that gives a clearer sense of progression and roadmap.</p>
        </article>
        <article className="pia-card glass-glow rounded-xl reveal d3">
          <div className="pia-bg pia-bg-rose"></div>
          <div className="pia-topline text-muted-foreground">Blogs and reads</div>
          <div className="pia-visual pv-read">
            <div className="read-lines">
              <i></i>
              <i></i>
              <i></i>
              <i></i>
            </div>
            <div className="read-badge text-heading">New</div>
          </div>
          <h3 className="text-heading">Editorial content moments</h3>
          <p className="text-body">Clean content cards add variety and make the ecosystem feel broader than lessons alone.</p>
        </article>
      </div>
    </div>
  </section>
  );
}
