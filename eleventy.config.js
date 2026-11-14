import { completarCharlas } from "./scripts/completar-ivoox.mjs";
const MESES = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];

export default function (cfg) {
  // Antes de compilar, las charlas nuevas (solo con el feed de iVoox) se completan con los datos del feed
  cfg.on("eleventy.before", async () => { await completarCharlas(); });

  cfg.addPassthroughCopy({ "src/img": "img" });
  cfg.addPassthroughCopy({ "src/css": "css" });
  cfg.addPassthroughCopy({ "src/js": "js" });
  cfg.addPassthroughCopy({ "src/admin": "admin" });
  cfg.addPassthroughCopy({ "src/_redirects": "_redirects" });

  // Charlas ordenadas de la más reciente a la más antigua
  cfg.addCollection("charlas", (api) =>
    api.getFilteredByGlob("src/charlas/*.md").sort((a, b) => b.date - a.date || b.inputPath.localeCompare(a.inputPath))
  );
  cfg.addCollection("anuncios", (api) =>
    api.getFilteredByGlob("src/anuncios/*.md").sort((a, b) => b.date - a.date)
  );

  // Charlas agrupadas por mes: [{key:"2026-11", label:"Noviembre 2026", items:[...]}]
  cfg.addFilter("porMes", (items) => {
    const grupos = new Map();
    for (const it of items) {
      const d = it.date;
      const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
      if (!grupos.has(key)) {
        const m = MESES[d.getUTCMonth()];
        grupos.set(key, { key, label: m[0].toUpperCase() + m.slice(1) + " " + d.getUTCFullYear(), items: [] });
      }
      grupos.get(key).items.push(it);
    }
    return [...grupos.values()];
  });

  cfg.addFilter("fecha", (d) => {
    const x = new Date(d);
    return `${x.getUTCDate()} de ${MESES[x.getUTCMonth()]} de ${x.getUTCFullYear()}`;
  });
  cfg.addFilter("isoDate", (d) => new Date(d).toISOString().slice(0, 10));
  cfg.addFilter("limit", (arr, n) => arr.slice(0, n));
  cfg.addFilter("youtubeId", (url) => {
    const m = String(url || "").match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([\w-]{11})/);
    return m ? m[1] : "";
  });
  // Acepta el enlace .mp3, la página del episodio de iVoox o el enlace corto ivoox.com/123456
  cfg.addFilter("ivoox", (url) => {
    const u = String(url || "").trim();
    if (/\.mp3(\?|$)/i.test(u)) return { mp3: u.replace(/\?.*$/, ""), embed: "" };
    const rf = u.match(/ivoox\.com\/([^\/?#]+?)-audios-mp3_rf_(\d+)_\d+\.html/i);
    if (rf) return { mp3: `https://www.ivoox.com/${rf[1]}_mf_${rf[2]}_feed_1.mp3`, embed: "" };
    const id = u.match(/(\d{6,})/);
    return { mp3: "", embed: id ? `https://www.ivoox.com/player_ej_${id[1]}_6_1.html` : "" };
  });
  cfg.addFilter("indiceDe", (items, url) => items.findIndex((it) => it.url === url));
  cfg.addFilter("json", (v) => JSON.stringify(v));
  cfg.addFilter("textoPlano", (s) => String(s || "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim());

  return {
    dir: { input: "src", includes: "_includes", data: "_data", output: "_site" },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
  };
}
