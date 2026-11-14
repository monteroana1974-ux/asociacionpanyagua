// Inicio de sesión del panel de edición (Sveltia CMS) con GitHub.
// La lógica está en auth-lib/sveltia-cms-auth.js (proyecto sveltia/sveltia-cms-auth, licencia MIT).
import worker from "../auth-lib/sveltia-cms-auth.js";
import { withDefaults } from "../auth-lib/env.js";

export const onRequest = ({ request, env }) => worker.fetch(request, withDefaults(env));
