'use client';

import { PointerEvent as ReactPointerEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { emitBurst, emitConfetti, emitDragGhost } from '../lib/effects';
import { emitToast } from '../lib/toast';
import Reveal from './client/Reveal';

type Puzzle = { words: string[]; hint: string };

type DragState = {
  word: string;
  fromBank: boolean;
  index: number;
  el: HTMLElement;
};

const PUZZLES: Puzzle[] = [
  { words: ['I', 'am', 'a', 'student', 'from', 'Patna.'], hint: 'A student introduces themselves from their hometown.' },
  { words: ['She', 'speaks', 'English', 'with', 'great', 'confidence.'], hint: "Describing someone's impressive language skills." },
  { words: ['We', 'practice', 'every', 'day', 'to', 'improve.'], hint: 'Consistency is the key to getting better at English.' },
  { words: ['My', 'trainer', 'helped', 'me', 'speak', 'clearly.'], hint: 'Crediting a mentor for your progress in speaking.' },
];

function shuffleArr(a: string[]) {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  if (b.join('') === a.join('') && b.length > 1) {
    [b[0], b[1]] = [b[1], b[0]];
  }
  return b;
}

export default function PuzzleSection() {
  const [pIdx, setPIdx] = useState(0);
  const [placed, setPlaced] = useState<string[]>([]);
  const [bank, setBank] = useState<string[]>([]);
  const [moves, setMoves] = useState(0);
  const [streak, setStreak] = useState(0);
  const [hintShown, setHintShown] = useState(false);
  const [dragOverDropzone, setDragOverDropzone] = useState(false);
  const [solvedCelebrated, setSolvedCelebrated] = useState(false);
  const dragRef = useRef<DragState | null>(null);
  const suppressClick = useRef(false);

  const puzzle = PUZZLES[pIdx];
  const correct = useMemo(() => puzzle.words, [puzzle.words]);

  useEffect(() => {
    setBank(shuffleArr(PUZZLES[0].words));
  }, []);

  const countCorrect = useCallback((placedState = placed) => {
    let n = 0;
    placedState.forEach((w, i) => {
      if (w && w === correct[i]) n += 1;
    });
    return n;
  }, [correct, placed]);

  const progress = placed.length > 0 ? Math.round((countCorrect() / correct.length) * 100) : 0;
  const isSolved = countCorrect() === correct.length && placed.length === correct.length;

  useEffect(() => {
    if (isSolved && !solvedCelebrated) {
      const nextStreak = streak + 1;
      setStreak(nextStreak);
      emitConfetti();
      emitToast({ title: 'Sentence Solved! 🎉', body: `Perfect! ${nextStreak} puzzle streak 🔥` });
      setSolvedCelebrated(true);
    }
    if (!isSolved && solvedCelebrated) {
      setSolvedCelebrated(false);
    }
  }, [isSolved, solvedCelebrated, streak]);

  const status = useMemo(() => {
    const c = countCorrect();
    if (c === correct.length && placed.length === correct.length) {
      return { color: '#00e3fd', text: '✓ Sentence solved!' };
    }
    if (progress >= 50) {
      return { color: '#ab8eff', text: 'Getting closer…' };
    }
    return { color: '#ff6c95', text: moves === 0 ? 'Drag words to start' : 'Drag words to arrange…' };
  }, [correct.length, countCorrect, moves, placed.length, progress]);

  const finishMove = (nextPlaced: string[], cx?: number, cy?: number) => {
    setMoves((prev) => prev + 1);
    if (typeof cx === 'number' && typeof cy === 'number') emitBurst(cx, cy);

  };

  const moveBankToPlaced = (idx: number, insertAt = placed.length, cx?: number, cy?: number) => {
    if (idx < 0 || idx >= bank.length) return;
    const nextBank = [...bank];
    const word = nextBank.splice(idx, 1)[0];
    const bounded = Math.max(0, Math.min(insertAt, placed.length));
    const nextPlaced = [...placed];
    nextPlaced.splice(bounded, 0, word);
    setBank(nextBank);
    setPlaced(nextPlaced);
    finishMove(nextPlaced, cx, cy);
  };

  const movePlacedToBank = (idx: number, insertAt = bank.length, cx?: number, cy?: number) => {
    if (idx < 0 || idx >= placed.length) return;
    const nextPlaced = [...placed];
    const word = nextPlaced.splice(idx, 1)[0];
    const bounded = Math.max(0, Math.min(insertAt, bank.length));
    const nextBank = [...bank];
    nextBank.splice(bounded, 0, word);
    setPlaced(nextPlaced);
    setBank(nextBank);
    finishMove(nextPlaced, cx, cy);
  };

  const handleSwap = (fi: number, fb: boolean, ti: number, tb: boolean, cx?: number, cy?: number) => {
    const nextBank = [...bank];
    const nextPlaced = [...placed];

    if (fb && tb) {
      [nextBank[fi], nextBank[ti]] = [nextBank[ti], nextBank[fi]];
    } else if (!fb && !tb) {
      [nextPlaced[fi], nextPlaced[ti]] = [nextPlaced[ti], nextPlaced[fi]];
    } else if (fb && !tb) {
      const w1 = nextBank.splice(fi, 1)[0];
      const w2 = nextPlaced.splice(ti, 1, w1)[0];
      nextBank.splice(fi, 0, w2);
    } else {
      const w1 = nextPlaced.splice(fi, 1)[0];
      const w2 = nextBank.splice(ti, 1, w1)[0];
      nextPlaced.splice(fi, 0, w2);
    }

    setBank(nextBank);
    setPlaced(nextPlaced);
    finishMove(nextPlaced, cx, cy);
  };

  const resetPuzzle = (index: number) => {
    setPIdx(index);
    setMoves(0);
    setHintShown(false);
    setPlaced([]);
    setDragOverDropzone(false);
    setSolvedCelebrated(false);
    setBank(shuffleArr(PUZZLES[index].words));
  };

  const cleanupDrag = () => {
    emitDragGhost({ type: 'hide' });
    if (dragRef.current?.el) dragRef.current.el.classList.remove('dragging');
    dragRef.current = null;
    setDragOverDropzone(false);
  };

  const beginPointerDrag = (word: string, idx: number, fromBank: boolean, ev: ReactPointerEvent<HTMLButtonElement>) => {
    ev.preventDefault();
    const el = ev.currentTarget as HTMLElement;
    dragRef.current = { word, fromBank, index: idx, el };
    suppressClick.current = false;
    el.classList.add('dragging');
    emitDragGhost({ type: 'show', text: word, x: ev.clientX, y: ev.clientY });

    const startX = ev.clientX;
    const startY = ev.clientY;

    const mm = (moveEv: PointerEvent) => {
      if (Math.abs(moveEv.clientX - startX) > 3 || Math.abs(moveEv.clientY - startY) > 3) {
        suppressClick.current = true;
      }
      emitDragGhost({ type: 'move', x: moveEv.clientX, y: moveEv.clientY });
      const els = document.elementsFromPoint(moveEv.clientX, moveEv.clientY);
      const overDropzone = els.some(
        (node) => node instanceof HTMLElement && (node.id === 'dropzone' || node.closest?.('#dropzone')),
      );
      setDragOverDropzone(overDropzone);
    };

    const mu = (upEv: PointerEvent) => {
      const drag = dragRef.current;
      cleanupDrag();
      if (!drag) {
        window.removeEventListener('pointermove', mm);
        window.removeEventListener('pointerup', mu);
        window.removeEventListener('pointercancel', mu);
        return;
      }

      const els = document.elementsFromPoint(upEv.clientX, upEv.clientY);
      const dropTile = els.find(
        (node) => node instanceof HTMLElement && node.classList.contains('tile') && node !== drag.el,
      ) as HTMLElement | undefined;
      const dzHit = els.find(
        (node) => node instanceof HTMLElement && (node.id === 'dropzone' || node.closest?.('#dropzone')),
      ) as HTMLElement | undefined;
      const bkHit = els.find(
        (node) => node instanceof HTMLElement && (node.id === 'bank' || node.closest?.('#bank')),
      ) as HTMLElement | undefined;

      if (dropTile && dropTile.dataset.idx != null && dropTile.dataset.bank != null) {
        handleSwap(drag.index, drag.fromBank, Number(dropTile.dataset.idx), dropTile.dataset.bank === '1', upEv.clientX, upEv.clientY);
      } else if (dzHit && drag.fromBank) {
        moveBankToPlaced(drag.index, placed.length, upEv.clientX, upEv.clientY);
      } else if (bkHit && !drag.fromBank) {
        movePlacedToBank(drag.index, bank.length, upEv.clientX, upEv.clientY);
      }

      window.removeEventListener('pointermove', mm);
      window.removeEventListener('pointerup', mu);
      window.removeEventListener('pointercancel', mu);
    };

    window.addEventListener('pointermove', mm);
    window.addEventListener('pointerup', mu, { once: true });
    window.addEventListener('pointercancel', mu, { once: true });
  };

  const handleTileClick = (isBank: boolean, idx: number) => {
    if (suppressClick.current) {
      suppressClick.current = false;
      return;
    }
    if (isBank) moveBankToPlaced(idx, placed.length);
    else movePlacedToBank(idx, bank.length);
  };

  return (
    <section id="puzzle">
      <div className="puzzle-inner">
        <Reveal variant="left">
          <div className="sec-eyebrow text-primary">Try It Right Now</div>
          <h2 className="sec-h2 text-heading">Learn by <em>doing</em>,<br />not reading.</h2>
          <p className="sec-p text-body">Our signature sentence puzzle teaches grammar intuitively — drag tiles into order, get instant AI feedback, and build fluency that actually sticks.</p>
          <div className="feature-pills">
            {[
              ['🎯', 'Instant ground-truth checking', 'Word-by-word position analysis after every move', 'rgba(0,227,253,0.10)'],
              ['🧠', 'Adaptive difficulty', 'Sentences match your current CEFR level automatically', 'rgba(171,142,255,0.10)'],
              ['✨', 'Gamified progress', 'Streaks, scores, and celebration on completion', 'rgba(0,227,253,0.08)'],
              ['🎙️', 'Voice practice after puzzle', 'Practise pronouncing the completed sentence aloud with AI feedback', 'rgba(183,159,255,0.10)'],
            ].map(([icon, title, copy, bg]) => (
              <div className="fpill c-box rounded-xl" key={title}>
                <div className="fpill-icon rounded-lg" style={{ background: bg as string }}>{icon}</div>
                <div>
                  <div className="fpill-text text-heading">{title}</div>
                  <div className="fpill-sub text-muted-foreground">{copy}</div>
                </div>
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal className="puzzle-game glass-glow rounded-xl" variant="right">
          <>
            <div className="game-header">
              <div className="game-title text-heading">Sentence Puzzle</div>
              <div className="game-stage text-muted-foreground" id="g-stage">Level {pIdx + 1} of {PUZZLES.length}</div>
            </div>
            <div className="game-body">
              <div className="game-prompt text-body">Arrange into correct order ↓</div>
              <div className="game-hint text-muted-foreground" id="g-hint">{puzzle.hint}</div>

              <div id="dropzone" className={`drop-zone ${dragOverDropzone ? 'drag-over' : ''} ${placed.length ? 'has-tiles' : ''}`}>
                {!placed.length && <span className="drop-zone-hint text-muted-foreground">Drop words here →</span>}
                {placed.map((word, idx) => (
                  <button
                    key={`placed-${word}-${idx}`}
                    className={`tile ${moves > 0 ? (word === correct[idx] ? 'correct-place' : 'wrong-place') : ''}`}
                    type="button"
                    data-idx={idx}
                    data-bank="0"
                    onClick={() => handleTileClick(false, idx)}
                    onPointerDown={(e) => beginPointerDrag(word, idx, false, e)}
                  >
                    {word}
                  </button>
                ))}
              </div>

              <div className="font-mono text-muted-foreground" style={{ fontSize: '10px', marginBottom: '8px', letterSpacing: '.05em' }}>WORD BANK</div>
              <div className="bank" id="bank">
                {bank.map((word, idx) => (
                  <button
                    key={`bank-${word}-${idx}`}
                    className="tile"
                    type="button"
                    data-idx={idx}
                    data-bank="1"
                    onClick={() => handleTileClick(true, idx)}
                    onPointerDown={(e) => beginPointerDrag(word, idx, true, e)}
                  >
                    {word}
                  </button>
                ))}
              </div>

              <div className="game-progress">
                <div className="prog-header">
                  <span className="prog-label text-muted-foreground">Match accuracy</span>
                  <span className="prog-pct text-primary" id="g-pct">{progress}%</span>
                </div>
                <div className="prog-bar"><div className="prog-inner" id="g-prog" style={{ width: `${progress}%` }} /></div>
              </div>

              <div className="game-status">
                <div className="status-left">
                  <div className="status-dot" id="g-dot" style={{ background: status.color }} />
                  <div className="status-text text-body" id="g-status">{status.text}</div>
                </div>
                <div className="game-controls">
                  <button
                    className="gbtn gbtn-outline"
                    id="g-shuffle"
                    type="button"
                    onClick={() => {
                      setBank(shuffleArr([...placed, ...bank]));
                      setPlaced([]);
                      setMoves(0);
                      setHintShown(false);
                      setDragOverDropzone(false);
                      emitToast({ title: 'Shuffled ↺', body: 'Give it another go!' });
                    }}
                  >
                    Shuffle
                  </button>
                  <button className="gbtn gbtn-outline" id="g-answer" type="button" onClick={() => setHintShown((prev) => !prev)}>
                    {hintShown ? 'Hide' : 'Hint'}
                  </button>
                  <button
                    className="gbtn gbtn-primary"
                    id="g-next"
                    type="button"
                    onClick={() => {
                      const next = (pIdx + 1) % PUZZLES.length;
                      resetPuzzle(next);
                      emitToast({ title: 'Next Level!', body: 'New sentence challenge ready 🎯' });
                    }}
                  >
                    Next →
                  </button>
                </div>
              </div>

              <div
                id="g-reveal"
                style={{
                  display: hintShown ? 'block' : 'none',
                  marginTop: '12px',
                  padding: '12px 14px',
                  borderRadius: '12px',
                  background: 'rgba(0,227,253,0.08)',
                  border: '1px solid rgba(0,227,253,0.2)',
                  fontSize: '13px',
                  color: '#00e3fd',
                  fontFamily: 'var(--ff-display)',
                  fontWeight: 700,
                }}
              >
                {`💡 Answer: ${puzzle.words.join(' ')}`}
              </div>

              <div id="g-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px', marginTop: '14px' }}>
                <div className="c-box rounded-xl" style={{ padding: '12px', textAlign: 'center' }}>
                  <div style={{ fontFamily: 'var(--ff-display)', fontSize: '20px', fontWeight: 700, color: '#ecedf6' }} id="g-moves">{moves}</div>
                  <div style={{ fontSize: '11px', color: '#a9abb3' }}>Moves</div>
                </div>
                <div className="c-box rounded-xl" style={{ padding: '12px', textAlign: 'center' }}>
                  <div style={{ fontFamily: 'var(--ff-display)', fontSize: '20px', fontWeight: 700, color: '#ecedf6' }} id="g-correct">{countCorrect()}/{correct.length}</div>
                  <div style={{ fontSize: '11px', color: '#a9abb3' }}>Correct</div>
                </div>
                <div className="c-box rounded-xl" style={{ padding: '12px', textAlign: 'center' }}>
                  <div style={{ fontFamily: 'var(--ff-display)', fontSize: '20px', fontWeight: 700, color: '#ecedf6' }} id="g-streak">{streak}🔥</div>
                  <div style={{ fontSize: '11px', color: '#a9abb3' }}>Streak</div>
                </div>
              </div>
            </div>
          </>
        </Reveal>
      </div>
    </section>
  );
}
