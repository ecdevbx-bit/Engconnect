"use client";

import { useState, useCallback, useRef, useMemo, useEffect, useLayoutEffect } from "react";
import {
    DndContext,
    DragEndEvent,
    DragStartEvent,
    DragOverEvent,
    rectIntersection,
    useSensor,
    useSensors,
    PointerSensor,
    TouchSensor,
    DragOverlay,
    useDroppable,
    UniqueIdentifier,
} from "@dnd-kit/core";
import {
    SortableContext,
    horizontalListSortingStrategy,
    arrayMove,
    useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { BsShuffle } from "react-icons/bs";
import { cn } from "@/lib/utils";
import { GAME_THEMES, DEFAULT_THEME, type GameTheme, type ThemeId } from "./gameThemes";
import TrainEngine from "./TrainEngine";

interface Word {
    id: UniqueIdentifier;
    text: string;
}

export interface WordDragDropProps {
    shuffledWords: string[];
    onSubmit: (userAnswer: string[]) => Promise<void> | void;
    onSkip: () => void;
    isSubmitting?: boolean;
    tapToPlace?: boolean;
    feedback?: "correct" | "wrong" | null;
    onSentenceChange?: (words: string[]) => void;
    onPlaceSound?: () => void;
    themeId?: ThemeId;
    /**
     * Autoplay / demo mode. The board assembles itself on a timer with no user
     * input (tiles disabled, Jumble button hidden). Reused by the landing
     * showcase and the first-visit walkthrough. Off by default — live gameplay
     * is unaffected.
     */
    autoplay?: boolean;
    /** Target word order the autoplay assembles. Defaults to the pool order. */
    autoplaySolution?: string[];
    /** Loop the autoplay cycle (assemble → hold → reset → repeat). Default true. */
    autoplayLoop?: boolean;
}

type ZoneId = "pool-zone" | "sentence-zone";
type DerailVec = { x: number; y: number; r: number };

const TILE_BASE =
    "select-none touch-none px-3 py-2 text-sm font-medium tracking-wide border shadow-sm transition-colors duration-150";

// Coach colour variants — a varied, cheerful train.
const COACH_PALETTES = [
    { body: "linear-gradient(#5D3A7A,#2D1942)", roof: "linear-gradient(#7a5da0,#3a2555)", text: "#f0ecff" },
    { body: "linear-gradient(#297A85,#113D42)", roof: "linear-gradient(#3a9eaa,#184f56)", text: "#e6fbff" },
    { body: "linear-gradient(#9C6339,#4F2D14)", roof: "linear-gradient(#c0824a,#6a3e1c)", text: "#fff0dd" },
    { body: "linear-gradient(#9E2F4C,#471120)", roof: "linear-gradient(#c24868,#5e1a30)", text: "#ffe6ee" },
    { body: "linear-gradient(#3B5998,#1B2A4A)", roof: "linear-gradient(#5878b0,#2c3c5e)", text: "#e6eeff" },
];

const makeWords = (words: string[]): Word[] =>
    words.map((text, i) => ({ id: `${i}__${text}`, text }));

// ── Word tile (pool + the inline build zone) ─────────────────────────────────

function SortableTile({
    word,
    inSentence,
    disabled,
    popping,
    onTap,
    theme,
    index,
}: {
    word: Word;
    inSentence: boolean;
    disabled: boolean;
    popping: boolean;
    onTap?: () => void;
    theme: GameTheme;
    index: number;
}) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
        useSortable({ id: word.id });

    return (
        <div
            ref={setNodeRef}
            style={{ transform: CSS.Transform.toString(transform), transition }}
            {...attributes}
            {...(disabled ? {} : listeners)}
            onClick={disabled ? undefined : onTap}
            className={cn(
                TILE_BASE,
                inSentence ? theme.tileSentence : theme.tilePool,
                disabled
                    ? "cursor-default"
                    : onTap
                        ? "cursor-pointer active:cursor-grabbing"
                        : "cursor-grab active:cursor-grabbing",
                !disabled && "hover:border-primary/60",
                popping && "anim-tile-pop",
                isDragging && "opacity-30"
            )}
        >
            <span
                className={cn("inline-block", theme.bobTiles && !isDragging && "anim-bubble-bob")}
                style={theme.bobTiles ? { animationDelay: `${(index % 6) * 0.22}s` } : undefined}
            >
                {word.text}
            </span>
        </div>
    );
}

function OverlayTile({ word, theme }: { word: Word; theme: GameTheme }) {
    return (
        <div className={cn(TILE_BASE, theme.tileSentence, "rotate-2 scale-105 shadow-2xl")}>
            {word.text}
        </div>
    );
}

// ── Band coach — a detailed rail car (display only, mirrors the build zone) ──

function BandCoach({
    word,
    index,
    derail,
}: {
    word: string;
    index: number;
    derail?: DerailVec;
}) {
    const pal = COACH_PALETTES[index % COACH_PALETTES.length];
    const style: Record<string, string> = {};
    if (derail) {
        style["--sx"] = `${derail.x}px`;
        style["--sy"] = `${derail.y}px`;
        style["--sr"] = `${derail.r}deg`;
    }
    return (
        <div
            className={cn("coach", derail && "anim-coach-derail")}
            style={style as React.CSSProperties}
        >
            <div className="coach-roof" style={{ background: pal.roof }} />
            <div className="coach-body" style={{ background: pal.body, color: pal.text }}>
                <div className="coach-windows">
                    <span className="coach-window" />
                    <span className="coach-window" />
                    <span className="coach-window" />
                </div>
                <div className="coach-word">{word}</div>
            </div>
            <div className="coach-wheels">
                <span className="coach-wheel" />
                <span className="coach-wheel" />
            </div>
        </div>
    );
}

// ── The fixed bottom train band — a live visualization of the build zone ─────

function TrainBand({
    sentenceWords,
    feedback,
    derail,
}: {
    sentenceWords: Word[];
    feedback: "correct" | "wrong" | null;
    derail: Record<string, DerailVec>;
}) {
    const bandRef = useRef<HTMLDivElement>(null);
    const groupRef = useRef<HTMLDivElement>(null);
    const scaleRef = useRef<HTMLDivElement>(null);
    const [travelX, setTravelX] = useState(0);
    // Mobile fit-scale: shrink the train so the whole sentence fits the band
    // width. Easy (3–5 words) sits at the base size; medium/hard keep shrinking
    // only as far as needed to fit. null = tablet/desktop (left at full size).
    const [fitScale, setFitScale] = useState<number | null>(null);

    // On a wrong answer, measure how far the train must race to reach the buffer.
    useLayoutEffect(() => {
        if (feedback === "wrong" && bandRef.current && groupRef.current) {
            const bandW = bandRef.current.clientWidth;
            const groupW = groupRef.current.scrollWidth;
            setTravelX(Math.max(bandW - groupW - 64, 0));
        }
    }, [feedback]);

    // Recompute the mobile fit-scale whenever the placed words change (or the
    // viewport resizes). scrollWidth is unaffected by the applied transform, so
    // it always reports the train's natural (unscaled) width.
    const wordsSig = sentenceWords.map((w) => w.text).join("|");
    useLayoutEffect(() => {
        const compute = () => {
            // Phones only — tablet/desktop keep the train at full size.
            if (!window.matchMedia("(max-width: 767px)").matches) {
                setFitScale(null);
                return;
            }
            const band = bandRef.current;
            const scaleEl = scaleRef.current;
            if (!band || !scaleEl) return;
            const natural = scaleEl.scrollWidth; // unscaled content width
            if (!natural) return;
            const BASE = 0.5; // size tuned for easy sentences (3–5 words)
            // Left-anchored like desktop: the engine waits on the left and fills
            // up toward the buffer as coaches are added. The second term is the
            // gap a fully-packed train leaves before the buffer — kept small so a
            // long, completed sentence's engine pulls right up to it.
            const avail = band.clientWidth - 28 - 32; // group left offset + buffer clearance
            // Easy fits at BASE; longer trains shrink only as far as needed.
            setFitScale(Math.max(0.1, Math.min(BASE, avail / natural)));
        };
        compute();
        window.addEventListener("resize", compute);
        return () => window.removeEventListener("resize", compute);
    }, [wordsSig]);

    const groupAnim =
        feedback === "correct"
            ? "anim-train-roll-out"
            : feedback === "wrong"
                ? "anim-train-crash-travel"
                : "anim-train-roll-in";

    return (
        <div ref={bandRef} className="train-band">
            <div className="train-track" />
            {/* buffer stop at the end of the line — bumpers turn green on correct */}
            <div
                className={cn("train-buffer", feedback === "correct" && "train-buffer--go")}
            />

            {sentenceWords.length === 0 && (
                <p className="pointer-events-none absolute left-1/2 top-9 hidden -translate-x-1/2 text-sm italic text-muted-foreground md:block">
                    Arrange the words above — each one becomes a coach 🚃
                </p>
            )}

            {/* coaches trail on the left, the engine leads on the right */}
            <div
                ref={groupRef}
                className={cn("train-group", groupAnim)}
                style={{ left: 28, ["--travel-x" as string]: `${travelX}px` } as React.CSSProperties}
            >
                {/* Inner wrapper carries the responsive scale-down (mobile),
                    kept separate from .train-group whose transform is reserved
                    for the roll-in / depart / crash choreography. */}
                <div
                    ref={scaleRef}
                    className="train-scale"
                    style={fitScale != null ? { transform: `scale(${fitScale})` } : undefined}
                >
                    {sentenceWords.map((w, i) => (
                        <BandCoach
                            key={w.id}
                            word={w.text}
                            index={i}
                            derail={feedback === "wrong" ? derail[String(w.id)] : undefined}
                        />
                    ))}
                    <TrainEngine className={cn(feedback === "wrong" && "anim-engine-crash")} />
                </div>
            </div>
        </div>
    );
}

// ── Generic droppable zone (pool + the inline build zone) ────────────────────

function DroppableZone({
    id,
    isOver,
    isEmpty,
    placeholder,
    extraZoneClass,
    contentAnimClass,
    leadDecor,
    traveler,
    children,
}: {
    id: ZoneId;
    isOver: boolean;
    isEmpty: boolean;
    placeholder: string;
    extraZoneClass?: string;
    contentAnimClass?: string;
    leadDecor?: string | null;
    traveler?: React.ReactNode;
    children: React.ReactNode;
}) {
    const { setNodeRef } = useDroppable({ id });
    return (
        <div
            ref={setNodeRef}
            className={cn(
                "relative flex min-h-20 w-full flex-wrap content-start items-center gap-2 rounded-2xl border-2 border-dashed p-3 transition-all duration-150",
                isOver
                    ? "border-primary/60 bg-primary/5 scale-[1.01]"
                    : isEmpty
                        ? "border-white/[0.10] bg-surface-1/50"
                        : cn("border-white/[0.06]", extraZoneClass || "c-box")
            )}
        >
            {isEmpty ? (
                <p className="pointer-events-none w-full py-1 text-center text-sm italic text-muted-foreground">
                    {placeholder}
                </p>
            ) : (
                <div className={cn("flex w-full flex-wrap content-start items-center gap-1.5", contentAnimClass)}>
                    {leadDecor && (
                        <span className="mr-1 select-none text-3xl leading-none">{leadDecor}</span>
                    )}
                    {children}
                </div>
            )}
            {traveler}
        </div>
    );
}

function WordDragDropInner({
    shuffledWords,
    onSubmit,
    isSubmitting = false,
    tapToPlace = false,
    feedback = null,
    onSentenceChange,
    onPlaceSound,
    themeId = DEFAULT_THEME,
    autoplay = false,
    autoplaySolution,
    autoplayLoop = true,
}: WordDragDropProps) {
    const theme = GAME_THEMES[themeId] ?? GAME_THEMES[DEFAULT_THEME];
    const isTrain = theme.id === "train";

    const initialPool = useMemo(() => makeWords(shuffledWords), [shuffledWords]);
    const [pool, setPool] = useState<Word[]>(initialPool);
    const [sentenceWords, setSentenceWords] = useState<Word[]>([]);
    const [activeWord, setActiveWord] = useState<Word | null>(null);
    // In autoplay the component drives its own win feedback (the parent's
    // `feedback` prop is for real gameplay). `fb` is the effective feedback
    // used by all the win/lose visuals below.
    const [demoFeedback, setDemoFeedback] = useState<"correct" | "wrong" | null>(null);
    const fb = autoplay ? demoFeedback : feedback;

    const [activeFromZone, setActiveFromZone] = useState<ZoneId | null>(null);
    const [overZone, setOverZone] = useState<ZoneId | null>(null);
    const [poppingId, setPoppingId] = useState<UniqueIdentifier | null>(null);
    const [derail, setDerail] = useState<Record<string, DerailVec>>({});

    const activeFromZoneRef = useRef<ZoneId | null>(null);
    const [result, setResult] = useState<"correct" | "wrong" | null>(null);

    const onSubmitRef = useRef(onSubmit);
    onSubmitRef.current = onSubmit;

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } })
    );

    useEffect(() => {
        onSentenceChange?.(sentenceWords.map((w) => w.text));
    }, [sentenceWords, onSentenceChange]);

    useEffect(() => {
        if (poppingId == null) return;
        const t = setTimeout(() => setPoppingId(null), 350);
        return () => clearTimeout(t);
    }, [poppingId]);

    // Derailment — a random scatter vector per coach on a wrong answer.
    useEffect(() => {
        if (feedback === "wrong") {
            const m: Record<string, DerailVec> = {};
            sentenceWords.forEach((w) => {
                m[String(w.id)] = {
                    x: (Math.random() * 2 - 1) * 170,
                    y: 90 + Math.random() * 160,
                    r: (Math.random() * 2 - 1) * 130,
                };
            });
            setDerail(m);
        } else if (feedback === null) {
            setDerail({});
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [feedback]);

    const isCorrect = result === "correct";
    const allWordsPlaced = pool.length === 0 && sentenceWords.length > 0;
    const nothingMoved = pool.length === initialPool.length && sentenceWords.length === 0;

    // Auto-submit — once every word is placed and the arrangement has settled.
    useEffect(() => {
        if (!allWordsPlaced || result !== null || isSubmitting || autoplay) return;
        const t = setTimeout(() => {
            onSubmitRef.current(sentenceWords.map((w) => w.text));
            setResult("correct");
        }, 650);
        return () => clearTimeout(t);
    }, [allWordsPlaced, result, isSubmitting, sentenceWords, autoplay]);

    // Autoplay driver — assembles the sentence on a timer, holds the win
    // state, then resets and loops. No user input is involved; all the same
    // tile/zone/win visuals run, just scripted.
    useEffect(() => {
        if (!autoplay) return;

        // Resolve the exact Word sequence to place. Match the solution texts
        // against the initial pool (consuming duplicates left-to-right). Fall
        // back to pool order if the solution doesn't match the tiles.
        const wantTexts =
            autoplaySolution && autoplaySolution.length === initialPool.length
                ? autoplaySolution
                : initialPool.map((w) => w.text);
        const remaining = [...initialPool];
        const ordered: Word[] = [];
        for (const text of wantTexts) {
            const idx = remaining.findIndex((w) => w.text === text);
            if (idx === -1) { ordered.length = 0; break; }
            ordered.push(remaining.splice(idx, 1)[0]);
        }
        const sequence = ordered.length === initialPool.length ? ordered : initialPool;

        let cancelled = false;
        const timers: ReturnType<typeof setTimeout>[] = [];
        const at = (ms: number, fn: () => void) => {
            timers.push(setTimeout(() => { if (!cancelled) fn(); }, ms));
        };

        const STEP = 720;
        const START = 650;

        const runCycle = () => {
            if (cancelled) return;
            setPool(initialPool);
            setSentenceWords([]);
            setDemoFeedback(null);
            setResult(null);

            sequence.forEach((w, i) => {
                at(START + i * STEP, () => {
                    setPool((prev) => prev.filter((x) => x.id !== w.id));
                    setSentenceWords((prev) => [...prev, w]);
                    setPoppingId(w.id);
                });
            });

            const doneAt = START + sequence.length * STEP + 250;
            at(doneAt, () => setDemoFeedback("correct"));
            if (autoplayLoop) at(doneAt + 2400, runCycle);
        };

        runCycle();
        return () => {
            cancelled = true;
            timers.forEach(clearTimeout);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [autoplay]);

    const handleDragStart = useCallback(
        (e: DragStartEvent) => {
            const id = e.active.id;
            const word =
                pool.find((w) => w.id === id) ??
                sentenceWords.find((w) => w.id === id) ??
                null;
            const zone: ZoneId = pool.some((w) => w.id === id) ? "pool-zone" : "sentence-zone";
            setActiveWord(word);
            setActiveFromZone(zone);
            activeFromZoneRef.current = zone;
        },
        [pool, sentenceWords]
    );

    const handleDragOver = useCallback(
        (e: DragOverEvent) => {
            const id = e.over?.id;
            if (!id) { setOverZone(null); return; }
            if (id === "pool-zone" || id === "sentence-zone") { setOverZone(id); return; }
            if (pool.some((w) => w.id === id)) { setOverZone("pool-zone"); return; }
            if (sentenceWords.some((w) => w.id === id)) { setOverZone("sentence-zone"); return; }
            setOverZone(null);
        },
        [pool, sentenceWords]
    );

    const handleDragEnd = useCallback(
        (e: DragEndEvent) => {
            const { active, over } = e;
            setActiveWord(null);
            setActiveFromZone(null);
            setOverZone(null);
            activeFromZoneRef.current = null;
            if (!over) return;

            const draggedId = active.id;
            const fromZone = activeFromZoneRef.current ?? activeFromZone;
            const overIsPoolZone = over.id === "pool-zone";
            const overIsSentenceZone = over.id === "sentence-zone";
            const overInPool = pool.some((w) => w.id === over.id);
            const overInSentence = sentenceWords.some((w) => w.id === over.id);

            const toZone: ZoneId =
                overIsSentenceZone || overInSentence
                    ? "sentence-zone"
                    : overIsPoolZone || overInPool
                        ? "pool-zone"
                        : (fromZone ?? "pool-zone");

            if (fromZone === toZone) {
                if (fromZone === "sentence-zone" && overInSentence) {
                    setSentenceWords((prev) =>
                        arrayMove(
                            prev,
                            prev.findIndex((w) => w.id === draggedId),
                            prev.findIndex((w) => w.id === over.id)
                        )
                    );
                }
                if (fromZone === "pool-zone" && overInPool) {
                    setPool((prev) =>
                        arrayMove(
                            prev,
                            prev.findIndex((w) => w.id === draggedId),
                            prev.findIndex((w) => w.id === over.id)
                        )
                    );
                }
                return;
            }

            const sourceList = fromZone === "pool-zone" ? pool : sentenceWords;
            const word = sourceList.find((w) => w.id === draggedId);
            if (!word) return;

            if (fromZone === "pool-zone" && toZone === "sentence-zone") {
                setPool((prev) => prev.filter((w) => w.id !== draggedId));
                setSentenceWords((prev) => {
                    if (overInSentence) {
                        const idx = prev.findIndex((w) => w.id === over.id);
                        const next = [...prev];
                        next.splice(idx, 0, word);
                        return next;
                    }
                    return [...prev, word];
                });
            }
            if (fromZone === "sentence-zone" && toZone === "pool-zone") {
                setSentenceWords((prev) => prev.filter((w) => w.id !== draggedId));
                setPool((prev) => {
                    if (overInPool) {
                        const idx = prev.findIndex((w) => w.id === over.id);
                        const next = [...prev];
                        next.splice(idx, 0, word);
                        return next;
                    }
                    return [...prev, word];
                });
            }

            setPoppingId(draggedId);
            onPlaceSound?.();
            setResult(null);
        },
        [pool, sentenceWords, activeFromZone, onPlaceSound]
    );

    const handleTap = useCallback(
        (wordId: UniqueIdentifier) => {
            if (result === "correct" || !tapToPlace || autoplay) return;
            const fromPool = pool.find((w) => w.id === wordId);
            if (fromPool) {
                setPool((prev) => prev.filter((w) => w.id !== wordId));
                setSentenceWords((prev) => [...prev, fromPool]);
            } else {
                const fromSentence = sentenceWords.find((w) => w.id === wordId);
                if (!fromSentence) return;
                setSentenceWords((prev) => prev.filter((w) => w.id !== wordId));
                setPool((prev) => [...prev, fromSentence]);
            }
            setPoppingId(wordId);
            onPlaceSound?.();
            setResult(null);
        },
        [pool, sentenceWords, result, tapToPlace, onPlaceSound, autoplay]
    );

    const handleReset = () => {
        setPool(initialPool);
        setSentenceWords([]);
        setResult(null);
    };

    const sentenceZoneClass = cn(
        theme.zoneClass,
        fb === "correct" && "!border-cyan/50",
        fb === "wrong" && "!border-pink/50"
    );
    const contentAnimClass = isTrain
        ? ""
        : fb === "correct"
            ? theme.winAnim
            : fb === "wrong"
                ? theme.loseAnim
                : "";

    return (
        <div className="flex flex-col gap-4 p-3 md:gap-5 md:p-6">
            <DndContext
                sensors={sensors}
                collisionDetection={rectIntersection}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
            >
                {/* Word pool / yard */}
                <div id="tour-pool">
                    {isTrain && (
                        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                            🚉 Word yard
                        </p>
                    )}
                    <SortableContext items={pool.map((w) => w.id)} strategy={horizontalListSortingStrategy}>
                        <DroppableZone
                            id="pool-zone"
                            isOver={overZone === "pool-zone" && activeFromZone === "sentence-zone"}
                            isEmpty={pool.length === 0}
                            placeholder="All words placed ✓"
                        >
                            {pool.map((word, i) => (
                                <SortableTile
                                    key={word.id}
                                    word={word}
                                    index={i}
                                    inSentence={false}
                                    disabled={isCorrect || autoplay}
                                    popping={poppingId === word.id}
                                    theme={theme}
                                    onTap={tapToPlace && !autoplay ? () => handleTap(word.id) : undefined}
                                />
                            ))}
                        </DroppableZone>
                    </SortableContext>
                </div>

                {/* Inline build zone — directly below the yard */}
                <div id="tour-sentence">
                    <div className="mb-2 flex items-center justify-between gap-2">
                        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                            {theme.emoji} Your sentence
                        </p>
                        {/* Re-jumble — compact button beside the label to save a row.
                            The answer auto-sends once every word is placed. */}
                        {!autoplay && (
                            <button
                                id="tour-jumble-btn"
                                onClick={handleReset}
                                disabled={isCorrect || nothingMoved || isSubmitting}
                                className={cn(
                                    "flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold tracking-wide transition-all duration-150",
                                    !isCorrect && !nothingMoved
                                        ? "c-box cursor-pointer border-white/[0.06] text-heading hover:border-primary/40 active:scale-[0.98]"
                                        : "cursor-not-allowed border-white/[0.06] bg-surface-2 text-muted-foreground"
                                )}
                            >
                                <span className="text-primary">Re-Jumble</span>
                                <BsShuffle className="text-base text-primary" />
                            </button>
                        )}
                    </div>
                    <SortableContext items={sentenceWords.map((w) => w.id)} strategy={horizontalListSortingStrategy}>
                        <DroppableZone
                            id="sentence-zone"
                            isOver={overZone === "sentence-zone" && activeFromZone === "pool-zone"}
                            isEmpty={sentenceWords.length === 0}
                            placeholder={tapToPlace ? `${theme.placeholder} — tap or drag.` : theme.placeholder}
                            extraZoneClass={sentenceZoneClass}
                            contentAnimClass={contentAnimClass}
                            leadDecor={theme.leadDecor}
                            traveler={
                                theme.travelerOnWin ? (
                                    <span className={cn("bridge-traveler", fb === "correct" && "walking")}>
                                        {theme.travelerOnWin}
                                    </span>
                                ) : null
                            }
                        >
                            {sentenceWords.map((word, i) => (
                                <SortableTile
                                    key={word.id}
                                    word={word}
                                    index={i}
                                    inSentence={true}
                                    disabled={isCorrect || autoplay}
                                    popping={poppingId === word.id}
                                    theme={theme}
                                    onTap={tapToPlace && !autoplay ? () => handleTap(word.id) : undefined}
                                />
                            ))}
                        </DroppableZone>
                    </SortableContext>
                </div>

                <DragOverlay dropAnimation={null}>
                    {activeWord ? <OverlayTile word={activeWord} theme={theme} /> : null}
                </DragOverlay>
            </DndContext>

            {/* Train world — the bottom band mirrors the build zone */}
            {isTrain && (
                <TrainBand sentenceWords={sentenceWords} feedback={fb} derail={derail} />
            )}
        </div>
    );
}

export default function WordDragDrop(props: WordDragDropProps) {
    return <WordDragDropInner key={JSON.stringify(props.shuffledWords)} {...props} />;
}
