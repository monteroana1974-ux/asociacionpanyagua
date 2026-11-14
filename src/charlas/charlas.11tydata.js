// Dirección de cada charla: el nombre completo del archivo (único).
// Las charlas con "publicado: false" se guardan pero no salen en la web.
export default {
  layout: "charla.njk",
  eleventyComputed: {
    permalink: (data) =>
      data.publicado === false ? false : `/charlas/${data.page.inputPath.split("/").pop().replace(/\.md$/, "")}/`,
  },
};
