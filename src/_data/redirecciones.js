// Lee src/_redirects (direcciones de la web antigua de GoDaddy) para que
// la página 404 pueda redirigirlas también en GitHub Pages.
import fs from "node:fs";

export default function () {
  const mapa = {};
  for (const linea of fs.readFileSync("src/_redirects", "utf8").split("\n")) {
    const l = linea.trim();
    if (!l || l.startsWith("#")) continue;
    const [desde, hacia] = l.split(/\s+/);
    let clave;
    try { clave = decodeURIComponent(desde); } catch { clave = desde; }
    mapa[clave.toLowerCase().replace(/\/+$/, "")] = hacia;
  }
  return mapa;
}
