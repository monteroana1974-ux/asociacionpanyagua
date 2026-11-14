// Ajustes del inicio de sesión del panel (/admin) con GitHub.
// El identificador de la aplicación de GitHub no es secreto; la clave secreta
// (GITHUB_CLIENT_SECRET) se guarda cifrada en Cloudflare Pages → Configuración → Variables.
export const withDefaults = (env) => ({
  ALLOWED_DOMAINS: [
    "asociacionpanyagua.org",
    "www.asociacionpanyagua.org",
    "asociacionpanyagua.pages.dev",
    "*.asociacionpanyagua.pages.dev",
    "localhost",
  ].join(","),
  GITHUB_CLIENT_ID: "Ov23liOS6xCQCSjN2F7C",
  ...env,
});
