// Vista previa de los anuncios en el panel: se ven como en la web, sin los nombres de los campos.
const { CMS } = window;
const h = window.h;
CMS.registerPreviewStyle("/css/estilo.css");

const val = (o, k) => (o && typeof o.get === "function" ? o.get(k) : o ? o[k] : undefined);
const lista = (l) => (!l ? [] : typeof l.toArray === "function" ? l.toArray() : Array.isArray(l) ? l : []);
const ruta = (getAsset, p) => {
  if (!p) return "";
  try { const a = getAsset(p); return a ? String(a.url || a) : p; } catch { return p; }
};

const Anuncio = ({ entry, widgetFor, widgetsFor, getAsset }) => {
  const data = val(entry, "data");
  const titulo = val(data, "title");
  const imagen = ruta(getAsset, val(data, "image"));
  const bloques = lista(widgetsFor("bloques"));
  return h("div", { style: { background: "#fff" } },
    h("section", { className: "titular" },
      h("div", { className: "envoltura" },
        h("p", { className: "antetitulo" }, "Retiros y peregrinaciones"),
        titulo ? h("h1", null, titulo) : null)),
    h("div", { className: "envoltura envoltura--texto prosa anuncio" },
      imagen ? h("img", { className: "ancha", src: imagen, alt: "" }) : null,
      val(data, "resumen") ? h("div", { className: "anuncio__resumen" }, widgetFor("resumen")) : null,
      ...bloques.map((b, i) => {
        const d = val(b, "data");
        const w = val(b, "widgets");
        const img = ruta(getAsset, val(d, "imagen"));
        const cab = val(d, "cabecera");
        const txt = val(d, "texto");
        if (!img && !cab && !txt) return null;
        return h("section", { className: "bloque-anuncio", key: i },
          img ? h("img", { className: "bloque-anuncio__img bloque-anuncio__img--" + (val(d, "posicion") || "centro"), src: img, alt: "" }) : null,
          cab ? h("h2", null, cab) : null,
          txt ? val(w, "texto") : null);
      })));
};

CMS.registerPreviewTemplate("anuncios", Anuncio);
