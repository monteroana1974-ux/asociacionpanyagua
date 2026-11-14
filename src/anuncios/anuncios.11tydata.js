// Los anuncios con "publicado: false" se guardan pero no salen en la web.
export default {
  layout: "anuncio.njk",
  eleventyComputed: {
    permalink: (data) =>
      data.publicado === false ? false : `/retiros-y-peregrinaciones/${data.page.fileSlug}/`,
  },
};
