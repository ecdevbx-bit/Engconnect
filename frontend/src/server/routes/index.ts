import "server-only";

import { Router } from "../router";
import { registerAccountRoutes } from "./account";
import { registerAdminRoutes } from "./admin";
import { registerChatRoutes } from "./chat";
import { registerJumbleRoutes } from "./jumble";
import { registerPremiumRoutes } from "./premium";
import { registerPronunciationRoutes } from "./pronunciation";
import { registerSupportRoutes } from "./support";
import { registerUserRoutes } from "./users";

// The whole backend API. Paths are relative to /api. The full contract
// (request/response shapes) is documented in docs/wiki/api.md.
export const api = new Router();

registerAccountRoutes(api); //      /session, /session/start, /account/* (Supabase Auth helpers)
registerUserRoutes(api); //         /users/*, /levels, /leaderboard, /flags, /stt/token
registerJumbleRoutes(api); //       /game/jumble/*
registerPronunciationRoutes(api); // /pronunciation/*, /word-bank/*
registerChatRoutes(api); //         /chat/*  (AI Partner on Gemini Live)
registerPremiumRoutes(api); //      /trial/*, /feedback, /pro-link, /payments/*
registerSupportRoutes(api); //      /support, /admin/support (tickets → email via Resend)
registerAdminRoutes(api); //        /admin/*  (INTERNAL_API_KEY or admin user)
