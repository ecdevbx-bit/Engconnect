'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Reveal from './client/Reveal';
import { useGlowBorder } from '@/hooks/useGlowBorder';

const SVG_W = 1440;
const SVG_H = 1950;

const NODE_COORDS = [
  { cx: 200, cy: 150 },
  { cx: 1240, cy: 550 },
  { cx: 200, cy: 950 },
  { cx: 1240, cy: 1350 },
  { cx: 200, cy: 1750 },
] as const;

const CARD_SIDES = ['right', 'left', 'right', 'left', 'right'] as const;

const CARDS = [
  {
    chipClass: 'chip-blue',
    chipText: 'Interactive speaking',
    title: 'Start with real debate energy',
    desc: 'Learners enter the journey with active speaking practice that feels fast, responsive, and confidence-building.',
    tags: ['Live prompts', 'Rebuttal flow', 'Confidence boost'],
    src: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80',
    alt: 'People having a discussion',
  },
  {
    chipClass: 'chip-purple',
    chipText: 'Visible progress',
    title: 'Then see progress clearly',
    desc: 'The second stop turns effort into visible improvement with skill analytics, scoring, and guided next steps.',
    tags: ['CEFR mapping', 'Skill scoring', 'Clear next step'],
    src: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=900&q=80',
    alt: 'Analytics dashboard',
  },
  {
    chipClass: 'chip-green',
    chipText: 'Always-on guidance',
    title: 'Get help in the middle',
    desc: 'The AI tutor acts like a companion on the road, explaining mistakes and nudging learners forward naturally.',
    tags: ['Context aware', 'Gentle corrections', 'Mentor feel'],
    src: 'https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?auto=format&fit=crop&w=900&q=80',
    alt: 'Mentor helping learner',
  },
  {
    chipClass: 'chip-amber',
    chipText: 'Active reading',
    title: 'Move into immersive reading',
    desc: 'At this point the path opens into richer content with voice, reading flow, and deeper exposure to natural language.',
    tags: ['Audio sync', 'Natural input', 'Immersion'],
    src: 'https://images.unsplash.com/photo-1503694978374-8a2fa686963a?auto=format&fit=crop&w=900&q=80',
    alt: 'Reading and audio experience',
  },
  {
    chipClass: 'chip-rose',
    chipText: 'Structured journey',
    title: 'Finish on a clear roadmap',
    desc: 'The final stop shows long-term direction so learners feel they are traveling somewhere meaningful, not just doing tasks.',
    tags: ['A1 to C1', 'Milestones', 'Momentum'],
    src: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=900&q=80',
    alt: 'Learning roadmap',
  },
] as const;

type Point = { x: number; y: number };
type Position = { left: number; top: number };

export default function FeaturesSection() {
  const graphRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const pathRef = useRef<SVGPathElement | null>(null);
  const cardRefs = useRef<(HTMLElement | null)[]>([]);
  const glowRef = useGlowBorder<HTMLDivElement>();

  const [pathLen, setPathLen] = useState(0);
  const [thresholds, setThresholds] = useState<number[]>([]);
  const [progress, setProgress] = useState(0);
  const [mobile, setMobile] = useState(false);
  const [cardPositions, setCardPositions] = useState<Position[]>([]);
  const [dotPoint, setDotPoint] = useState<Point | null>(null);
  const [layerHeight, setLayerHeight] = useState<number | undefined>(undefined);

  useEffect(() => {
    const updateMetrics = () => {
      const svg = svgRef.current;
      const path = pathRef.current;

      if (!svg || !path) return;

      const isMobile = window.innerWidth <= 980;
      setMobile(isMobile);

      const total = path.getTotalLength();
      setPathLen(total);

      const nextThresholds = NODE_COORDS.map((node) => {
        let best = 0;
        let minDiff = Infinity;

        for (let p = 0; p <= 1; p += 0.002) {
          const point = path.getPointAtLength(p * total);
          const distance = Math.hypot(point.x - node.cx, point.y - node.cy);

          if (distance < minDiff) {
            minDiff = distance;
            best = p;
          }
        }

        return best;
      });

      setThresholds(nextThresholds);

      const svgRect = svg.getBoundingClientRect();
      setLayerHeight(isMobile ? undefined : svgRect.height);

      if (isMobile) {
        setCardPositions([]);
        return;
      }

      const scale = svgRect.width / SVG_W;
      const layerWidth = svgRect.width;

      const nextPositions: Position[] = cardRefs.current.map((card, index) => {
        const cardWidth = card?.offsetWidth ?? 320;
        const cardHeight = card?.offsetHeight ?? 360;
        const node = NODE_COORDS[index];
        const side = CARD_SIDES[index];
        const nodeRadius = 28 * scale;
        const gap = 52;

        const cx = node.cx * scale;
        const cy = node.cy * scale;

        let left =
          side === 'right'
            ? cx + nodeRadius + gap
            : cx - nodeRadius - gap - cardWidth;

        let top = cy - cardHeight / 2;

        left = Math.max(18, Math.min(layerWidth - cardWidth - 18, left));
        top = Math.max(0, top);

        return { left, top };
      });

      setCardPositions(nextPositions);
    };

    const onScroll = () => {
      const graph = graphRef.current;
      const svg = svgRef.current;
      const path = pathRef.current;

      if (!graph || !svg || !path) return;

      const rect = graph.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const scale = svg.getBoundingClientRect().width / SVG_W;

      const startY = 150 * scale;
      const endY = 1750 * scale;

      const startScroll = viewportHeight * 0.5 - startY;
      const endScroll = viewportHeight * 0.5 - endY;

      let nextProgress = (startScroll - rect.top) / (startScroll - endScroll);
      nextProgress = Math.max(0, Math.min(1, nextProgress));

      setProgress(nextProgress);

      if (pathLen > 0 && nextProgress > 0 && nextProgress < 1) {
        const point = path.getPointAtLength(nextProgress * pathLen);
        setDotPoint({ x: point.x, y: point.y });
      } else {
        setDotPoint(null);
      }
    };

    updateMetrics();
    onScroll();

    window.addEventListener('resize', updateMetrics);
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      window.removeEventListener('resize', updateMetrics);
      window.removeEventListener('scroll', onScroll);
    };
  }, [pathLen]);

  const dashOffset = useMemo(() => {
    return pathLen ? pathLen * (1 - progress) : 1;
  }, [pathLen, progress]);

  const activeIndex = useMemo(() => {
    if (!thresholds.length) return -1;

    for (let i = 0; i < thresholds.length; i += 1) {
      const next = thresholds[i + 1] ?? 1.1;

      if (
        (i === 0 && progress > 0 && progress < next) ||
        (progress >= thresholds[i] && progress < next)
      ) {
        return i;
      }
    }

    return progress >= 1 ? thresholds.length - 1 : -1;
  }, [progress, thresholds]);

  return (
    <section id="features">
      <Reveal className="why-header">
        <>
          <div className="sec-eyebrow" style={{ justifyContent: 'flex-start' }}>
            Why English Connection
          </div>

          <h2 className="sec-h2" style={{ textAlign: 'left' }}>
            Designed as a learning
            <br />
            <em>journey you travel through.</em>
          </h2>

          <p className="sec-p" style={{ maxWidth: '540px', textAlign: 'left' }}>
            Scroll down and follow the path — each stop reveals a richer part of
            the platform, like moving through a living product story instead of a
            static feature list.
          </p>
        </>
      </Reveal>

      <div className="graph-outer" ref={graphRef}>
        <div className="curve-svg-wrap">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${SVG_W} ${SVG_H}`}
            preserveAspectRatio="xMidYMid meet"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="curveGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#b79fff" stopOpacity=".95" />
                <stop offset="30%" stopColor="#ab8eff" stopOpacity=".9" />
                <stop offset="58%" stopColor="#00e3fd" stopOpacity=".88" />
                <stop offset="82%" stopColor="#ff6c95" stopOpacity=".9" />
                <stop offset="100%" stopColor="#c8b4ff" stopOpacity=".95" />
              </linearGradient>

              <filter id="glowF" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="7" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <path
              d="M 200 150 C 600 150, 1100 300, 1240 550 C 1380 800, 340 700, 200 950 C 60 1200, 1100 1100, 1240 1350 C 1380 1600, 340 1500, 200 1750 C 150 1850, 200 1850, 350 1850"
              fill="none"
              stroke="rgba(171,142,255,.15)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray="2 12"
            />

            <path
              d="M 200 150 C 600 150, 1100 300, 1240 550 C 1380 800, 340 700, 200 950 C 60 1200, 1100 1100, 1240 1350 C 1380 1600, 340 1500, 200 1750 C 150 1850, 200 1850, 350 1850"
              fill="none"
              stroke="url(#curveGrad)"
              strokeWidth="24"
              strokeLinecap="round"
              opacity=".25"
              filter="url(#glowF)"
              strokeDasharray={pathLen || 1}
              strokeDashoffset={dashOffset}
            />

            <path
              ref={pathRef}
              d="M 200 150 C 600 150, 1100 300, 1240 550 C 1380 800, 340 700, 200 950 C 60 1200, 1100 1100, 1240 1350 C 1380 1600, 340 1500, 200 1750 C 150 1850, 200 1850, 350 1850"
              fill="none"
              stroke="url(#curveGrad)"
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={pathLen || 1}
              strokeDashoffset={dashOffset}
            />

            {NODE_COORDS.map((node, index) => {
              const colors = ['#b79fff', '#ab8eff', '#00e3fd', '#ff6c95', '#c8b4ff'];
              const fills = [
                'rgba(183,159,255,.12)',
                'rgba(171,142,255,.12)',
                'rgba(0,227,253,.12)',
                'rgba(255,108,149,.12)',
                'rgba(200,180,255,.12)',
              ];

              const visible =
                mobile || progress >= (thresholds[index] ?? 2) || (index === 0 && progress > 0);

              return (
                <g
                  key={index}
                  style={{
                    opacity: visible ? 1 : 0,
                    transition: 'opacity .45s ease',
                  }}
                >
                  <circle
                    cx={node.cx}
                    cy={node.cy}
                    r="30"
                    fill={fills[index]}
                    className="node-pulse"
                    style={index ? { animationDelay: `${index * 0.25}s` } : undefined}
                  />
                  <circle
                    cx={node.cx}
                    cy={node.cy}
                    r="14"
                    fill={colors[index]}
                    stroke="rgba(236,237,246,0.9)"
                    strokeWidth="4"
                  />
                  <text
                    x={node.cx}
                    y={node.cy - 34}
                    fill="#a9abb3"
                    fontSize="12"
                    fontFamily="var(--ff-mono)"
                    fontWeight="600"
                    letterSpacing=".05em"
                    textAnchor="middle"
                  >
                    {`0${index + 1}`}
                  </text>
                </g>
              );
            })}

            {dotPoint && (
              <circle
                cx={dotPoint.x}
                cy={dotPoint.y}
                r="26"
                fill="rgba(171,142,255,.15)"
                filter="url(#glowF)"
              />
            )}

            {dotPoint && (
              <circle
                cx={dotPoint.x}
                cy={dotPoint.y}
                r="12"
                fill="#ecedf6"
                stroke="#ab8eff"
                strokeWidth="2"
                style={{ filter: 'drop-shadow(0 4px 8px rgba(171,142,255,0.3))' }}
              />
            )}

            {dotPoint && (
              <circle cx={dotPoint.x} cy={dotPoint.y} r="6" fill="#ab8eff" />
            )}
          </svg>
        </div>

        <div
          className="why-cards-layer"
          ref={glowRef}
          style={mobile ? undefined : { height: layerHeight }}
        >
          {CARDS.map((card, index) => (
            <article
              key={card.title}
              ref={(el) => {
                cardRefs.current[index] = el;
              }}
              className={`why-fcard glass-glow rounded-xl ${mobile || activeIndex === index ? 'active' : ''}`}
              style={
                mobile
                  ? undefined
                  : cardPositions[index]
                    ? {
                        left: cardPositions[index].left,
                        top: cardPositions[index].top,
                      }
                    : undefined
              }
            >
              <img className="wfc-img rounded-t-xl" src={card.src} alt={card.alt} />

              <div className="wfc-content">
                <span className={`wfc-chip ${card.chipClass}`}>{card.chipText}</span>
                <h3 className="wfc-title text-heading">{card.title}</h3>
                <p className="wfc-desc text-body">{card.desc}</p>

                <div className="wfc-tags">
                  {card.tags.map((tag) => (
                    <span key={tag} className="text-muted-foreground">{tag}</span>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
