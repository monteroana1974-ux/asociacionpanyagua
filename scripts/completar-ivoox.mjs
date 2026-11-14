// Completa las charlas a partir del feed RSS de iVoox.
// En el panel solo se rellenan "feed" (enlace .xml de iVoox) y "color".
// Este script lee el feed y escribe en la charla: título, fecha, imagen, audio y descripción.
// Se ejecuta al compilar la web (Cloudflare) y en GitHub Actions, que guarda el resultado en el repositorio.
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const DIR = "src/charlas";

const dec = (s = "") =>
  s.replace(/^\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*$/, "$1")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n)).replace(/&amp;/g, "&").trim();
const etiqueta = (xml, t) => dec((xml.match(new RegExp(`<${t}[^>]*>([\\s\\S]*?)</${t}>`)) || [])[1] || "");
const diaMadrid = (d) => new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Madrid" }).format(new Date(d));
const q = (s) => JSON.stringify(String(s));

export function leerFeed(xml) {
  const item = (xml.match(/<item>([\s\S]*?)<\/item>/) || [])[1];
  if (!item) return null;
  const canalImg = (xml.split("<item>")[0].match(/<itunes:image[^>]*href="([^"]+)"/) || [])[1] || "";
  const pub = etiqueta(item, "pubDate");
  return {
    title: etiqueta(item, "title").replace(/\.\s*$/, ""),
    desc: etiqueta(item, "description").replace(/<[^>]+>/g, "").trim(),
    audio: ((item.match(/<enclosure[^>]*\burl="([^"]+)"/) || [])[1] || "").replace(/\?.*$/, ""),
    image: (item.match(/<itunes:image[^>]*href="([^"]+)"/) || [])[1] || canalImg,
    date: pub ? diaMadrid(pub) : "",
  };
}

const campo = (fm, k) => {
  const m = fm.match(new RegExp(`^${k}:\\s*(.*)$`, "m"));
  return m ? m[1].trim().replace(/^["']|["']$/g, "") : "";
};

// Un "date" vacío (lo puede dejar el panel) rompería la compilación: se quita y la fecha sale del nombre del archivo
export function quitarFechasVacias(dir) {
  if (!fs.existsSync(dir)) return;
  for (const f of fs.readdirSync(dir)) {
    if (!f.endsWith(".md")) continue;
    const p = path.join(dir, f);
    const t = fs.readFileSync(p, "utf8");
    const n = t.replace(/^(---\n[\s\S]*?)^date:\s*(""|'')?\s*\n/m, "$1");
    if (n !== t) fs.writeFileSync(p, n);
  }
}

export async function completarCharlas(dir = DIR) {
  let cambios = 0;
  for (const f of fs.readdirSync(dir)) {
    if (!f.endsWith(".md")) continue;
    const p = path.join(dir, f);
    const txt = fs.readFileSync(p, "utf8");
    const m = txt.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
    if (!m) continue;
    let fm = m[1];
    // Un campo de fecha vacío rompería la compilación: se quita (la fecha sale del feed o del nombre del archivo)
    if (/^date:\s*(""|'')?\s*$/m.test(fm)) {
      fm = fm.replace(/^date:\s*(""|'')?\s*\n?/m, "");
      fs.writeFileSync(p, `---\n${fm}\n---\n${m[2]}`);
      cambios++;
    }
    const feed = campo(fm, "feed");
    if (!/^https?:\/\/feeds\.ivoox\.com\/\S+\.xml/i.test(feed)) continue;
    if (campo(fm, "completado_desde") === feed && campo(fm, "audio")) continue;
    let datos;
    try {
      const r = await fetch(feed, { headers: { "User-Agent": "asociacionpanyagua-web" } });
      if (!r.ok) throw new Error("HTTP " + r.status);
      datos = leerFeed(await r.text());
      if (!datos || !datos.audio) throw new Error("el feed no tiene ningún episodio");
    } catch (e) {
      console.warn(`[iVoox] ${f}: no se pudo leer el feed ${feed} (${e.message})`);
      continue;
    }
    const color = campo(fm, "color") || "verde";
    const fecha = datos.date || (f.match(/^(\d{4}-\d{2}-\d{2})/) || [])[1] || "";
    const nuevo =
      `---\ntitle: ${q(datos.title)}\n` +
      (fecha ? `date: ${fecha}\n` : "") +
      `color: ${color}\nfeed: ${q(feed)}\naudio: ${q(datos.audio)}\nimage: ${q(datos.image)}\ncompletado_desde: ${q(feed)}\n---\n` +
      `${datos.desc}\n`;
    if (nuevo !== txt) {
      fs.writeFileSync(p, nuevo);
      cambios++;
      console.log(`[iVoox] ${f}: completada con «${datos.title}» (${fecha})`);
    }
  }
  return cambios;
}

if (import.meta.url === pathToFileURL(process.argv[1] || "").href) {
  completarCharlas().then((n) => console.log(`[iVoox] Charlas completadas: ${n}`));
}
