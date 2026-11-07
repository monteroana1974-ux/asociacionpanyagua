import fs from "node:fs";
import path from "node:path";

const MESES = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];

export default function (cfg) {
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
  // ---- iVoox ----
  // Acepta: enlace .mp3, página del episodio (…_rf_NÚMERO_1.html), enlace corto ivoox.com/NÚMERO
  // y el feed RSS (feeds.ivoox.com/….xml). Con el feed, al compilar se lee el feed y se busca
  // el episodio publicado el mismo día que la charla (hora de Madrid).
  const feedCache = new Map();
  const esFeed = (u) => /^https?:\/\/feeds\.ivoox\.com\/.+\.xml/i.test(u);
  const diaMadrid = (d) => new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Madrid" }).format(new Date(d));
  const leerItems = (xml) => [...String(xml).matchAll(/<item>([\s\S]*?)<\/item>/g)].map((m) => {
    const b = m[1];
    const link = (b.match(/<link>\s*(?:<!\[CDATA\[)?\s*([^<\]\s]+)/) || [])[1] || "";
    const pub = (b.match(/<pubDate>\s*([^<]+?)\s*<\/pubDate>/) || [])[1] || "";
    const enc = (b.match(/<enclosure[^>]*\burl="([^"]+)"/) || [])[1] || "";
    const id = (link.match(/_rf_(\d+)_/) || enc.match(/_mf_(\d+)_/) || [])[1] || "";
    return { id, dia: pub ? diaMadrid(pub) : "" };
  }).filter((i) => i.id);

  cfg.on("eleventy.before", async () => {
    const dir = "src/charlas";
    for (const f of fs.readdirSync(dir)) {
      if (!f.endsWith(".md")) continue;
      const head = fs.readFileSync(path.join(dir, f), "utf8").slice(0, 3000);
      const m = head.match(/^audio:\s*["']?(\S+?)["']?\s*$/m);
      if (!m || !esFeed(m[1]) || feedCache.has(m[1])) continue;
      try {
        const r = await fetch(m[1]);
        if (!r.ok) throw new Error("HTTP " + r.status);
        feedCache.set(m[1], leerItems(await r.text()));
      } catch (e) {
        console.warn("[iVoox] No se pudo leer el feed " + m[1] + ": " + e.message);
        feedCache.set(m[1], []);
      }
    }
  });

  cfg.addFilter("ivoox", (url, fecha) => {
    const u = String(url || "").trim();
    const player = (id) => ({ mp3: "", embed: `https://www.ivoox.com/player_ej_${id}_6_1.html` });
    if (/\.mp3(\?|$)/i.test(u)) return { mp3: u.replace(/\?.*$/, ""), embed: "" };
    const rf = u.match(/ivoox\.com\/([^\/?#]+?)-audios-mp3_rf_(\d+)_\d+\.html/i);
    if (rf) return { mp3: `https://www.ivoox.com/${rf[1]}_mf_${rf[2]}_feed_1.mp3`, embed: "" };
    const rf2 = u.match(/_rf_(\d+)_/);
    if (rf2) return player(rf2[1]);
    if (esFeed(u)) {
      const dia = fecha ? diaMadrid(fecha) : "";
      const it = (feedCache.get(u) || []).find((i) => i.dia === dia);
      if (it) return player(it.id);
      console.warn("[iVoox] El feed " + u + " no tiene ningún episodio del " + dia + ": esa charla se publica sin reproductor.");
      return { mp3: "", embed: "" };
    }
    // Enlaces del podcast entero (no de un episodio): no se adivina ningún número.
    if (/_sq_|_fg_|\/podcast-/i.test(u)) {
      console.warn("[iVoox] Enlace de podcast, no de episodio: " + u);
      return { mp3: "", embed: "" };
    }
    const id = u.match(/(\d{6,})/);
    return id ? player(id[1]) : { mp3: "", embed: "" };
  });
  cfg.addFilter("json", (v) => JSON.stringify(v));
  cfg.addFilter("textoPlano", (s) => String(s || "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim());

  return {
    dir: { input: "src", includes: "_includes", data: "_data", output: "_site" },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
  };
}
