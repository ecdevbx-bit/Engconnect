"use client";

import { useCallback, useEffect, useState } from "react";
import { BookMarked, Loader2, Plus, Sparkles, Trash2, Volume2 } from "lucide-react";

import PageHeader from "@/components/layout/PageHeader";
import { speak } from "@/lib/tts";
import { addWord, deleteWord, fetchWordBank, type WordBankEntry } from "@/lib/wordBank";

import { WordPractice } from "./WordPractice";

export function WordBankTrainer({ accessToken }: { accessToken: string }) {
  const [words, setWords] = useState<WordBankEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [practice, setPractice] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchWordBank(accessToken)
      .then((w) => {
        if (!cancelled) setWords(w);
      })
      .catch(() => {
        if (!cancelled) setMsg("Couldn't load your words.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  const onAdd = useCallback(async () => {
    const candidate = input.trim();
    if (!candidate || busy) return;
    setBusy(true);
    setMsg(null);
    try {
      const res = await addWord(accessToken, candidate);
      setInput("");
      if (res.added) {
        setWords((prev) => [res.word, ...prev.filter((w) => w.word !== res.word.word)]);
      } else {
        setMsg(`"${res.word.word}" is already in your bank.`);
        setWords((prev) =>
          prev.some((w) => w.word === res.word.word) ? prev : [res.word, ...prev],
        );
      }
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Couldn't add that word.");
    } finally {
      setBusy(false);
    }
  }, [accessToken, busy, input]);

  const onDelete = useCallback(
    async (word: string) => {
      setWords((prev) => prev.filter((w) => w.word !== word)); // optimistic
      setPractice((p) => (p === word ? null : p));
      try {
        await deleteWord(accessToken, word);
      } catch {
        setMsg("Couldn't remove that word — refresh to retry.");
      }
    },
    [accessToken],
  );

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        eyebrow="Word Bank"
        title="Your words"
        description="Save words you want to remember, listen to them, and practice saying them."
        icon={<BookMarked className="h-5 w-5" />}
      />

      {/* Add a word */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onAdd();
        }}
        className="mt-6 flex gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a word…"
          aria-label="Add a word"
          className="flex-1 rounded-xl border border-white/[0.12] bg-surface-2/60 px-4 py-2.5 text-sm text-heading outline-none focus:border-primary"
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-[#0b0e14] transition hover:bg-primary-1 disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Add
        </button>
      </form>

      {msg && <p className="mt-3 text-sm font-medium text-primary">{msg}</p>}

      {/* List */}
      <div className="mt-6">
        {loading ? (
          <p className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </p>
        ) : words.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/[0.12] bg-surface-2/30 p-8 text-center">
            <BookMarked className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">
              No words yet. Add one above, or drag words in from the Pronunciation trainer.
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {words.map((w) => (
              <li
                key={w.word}
                className="flex items-center gap-2 rounded-2xl border border-white/[0.08] bg-surface-2/40 p-3 pl-4"
              >
                <span className="flex-1 truncate font-semibold text-heading">{w.word}</span>
                {w.source === "pronunciation" && (
                  <span title="Saved from Pronunciation" className="shrink-0 text-muted-foreground">
                    <Sparkles className="h-3.5 w-3.5" />
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => speak(w.word, { rate: 0.9 })}
                  aria-label={`Listen to ${w.word}`}
                  className="shrink-0 rounded-lg p-2 text-muted-foreground transition hover:bg-white/5 hover:text-heading"
                >
                  <Volume2 className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setPractice((p) => (p === w.word ? null : w.word))}
                  className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                    practice === w.word
                      ? "bg-primary text-[#0b0e14]"
                      : "border border-white/[0.12] text-heading hover:bg-white/5"
                  }`}
                >
                  Practice
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(w.word)}
                  aria-label={`Delete ${w.word}`}
                  className="shrink-0 rounded-lg p-2 text-muted-foreground transition hover:bg-red-500/10 hover:text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {practice && (
        <WordPractice key={practice} word={practice} onClose={() => setPractice(null)} />
      )}
    </div>
  );
}
