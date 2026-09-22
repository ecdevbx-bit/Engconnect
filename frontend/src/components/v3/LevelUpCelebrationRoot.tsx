"use client";

import { useEffect } from "react";
import { useSession } from "@/lib/session";

import LevelUpCelebration from "@/components/jumbleWordsComponent/LevelUpCelebration";
import { fromSessionUser } from "@/lib/displayUser";
import { useSfx } from "@/hooks/useSfx";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { clearLevelUp } from "@/store/slices/xpSlice";

// LevelUpCelebrationRoot — a single app-wide mount of the level-up card.
// Any feature (Jumble, Pronunciation, AI Partner, …) triggers it by
// dispatching `triggerLevelUp(newLevel)` when the backend reports a level-up;
// this listens to `xp.levelUpTo` and shows the celebration from wherever the
// user is. Mounted once in Providers so it overlays the whole app.
export default function LevelUpCelebrationRoot() {
  const dispatch = useAppDispatch();
  const levelUpTo = useAppSelector((s) => s.xp.levelUpTo);
  const session = useSession();
  const user = fromSessionUser(session.data?.user);
  const firstName = user?.displayName?.split(" ")[0];

  // Fanfare the moment a level-up card is triggered, from wherever the user is.
  const playSfx = useSfx(true);
  useEffect(() => {
    if (levelUpTo != null) playSfx("levelup");
  }, [levelUpTo, playSfx]);

  return (
    <LevelUpCelebration
      level={levelUpTo}
      onDone={() => dispatch(clearLevelUp())}
      userName={firstName}
    />
  );
}
