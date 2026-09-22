'use client';

import { useEffect, useRef, useState } from 'react';
import Reveal from './client/Reveal';

function useCountUp(target: number, inView: boolean, duration = 2000) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(eased * target));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [duration, inView, target]);
  return value;
}

export default function ImpactSection() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) {
        setInView(true);
        observer.disconnect();
      }
    }, { threshold: 0.3 });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const cnt1 = useCountUp(100, inView);
  const cnt2 = useCountUp(34, inView);
  const cnt3 = useCountUp(250, inView);
  const cnt4 = useCountUp(6, inView);
  const cnt5 = useCountUp(91, inView);
  const cnt6 = useCountUp(3, inView);

  return (
    <section id="impact">
      <div className="impact-inner">
        <Reveal className="impact-header">
          <>
            <div className="impact-eyebrow text-primary">Platform Impact</div>
            <h2 className="impact-h2 text-heading">Numbers that<br /><em>speak</em> for themselves.</h2>
            <p className="impact-sub text-body">Real learners. Real improvement. Tracked across every session, every sentence, every pronunciation attempt.</p>
          </>
        </Reveal>
        <div className="impact-grid" ref={ref}>
          {[
            [cnt1, 'L+', 'Active Learners', 'across Tier 1, 2 & 3 cities'],
            [cnt2, '%', 'Average Accuracy Gain', 'after 30 days of daily practice'],
            [cnt3, 'K+', 'Sentences Solved', 'across all puzzle levels daily'],
            [cnt4, '+', 'CEFR Levels Tracked', 'A1 through C2, globally benchmarked'],
            [cnt5, '%', 'Learners Say It\'s Fun', 'compared to 40% for traditional apps'],
            [cnt6, 'x', 'Faster Grammar Retention', 'vs. passive reading methods'],
          ].map(([value, suffix, label, sub], index) => (
            <Reveal key={label as string} className={`impact-stat d${index + 1}`}>
              <div className="c-box rounded-xl p-6">
                <div className="impact-stat-num">
                  <span className="text-heading">{value as number}</span>
                  <span className="text-primary">{suffix as string}</span>
                </div>
                <div className="impact-stat-label text-heading">{label as string}</div>
                <div className="impact-stat-sub text-muted-foreground">{sub as string}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
