/**
 * Deep links por hash, sem sair do mundinho:
 *   /#/articles            -> templo (lista)
 *   /#/articles/<slug>     -> leitor com o artigo aberto
 *   /#/open-source         -> touro (projetos)
 *
 * As páginas estáticas /articles/<slug>/ continuam sendo as URLs canônicas
 * para SEO; o hash é o jeito de cair direto num modal da cena.
 */

let handlers = {};

export function setRoute(route) {
  const url = route ? `${location.pathname}#${route}` : location.pathname;
  history.replaceState(null, "", url);
}

function handleHash() {
  const hash = location.hash.replace(/^#\/?/, "");
  if (!hash) return;

  const [section, slug] = hash.split("/");
  if (section === "articles" && handlers.articles) {
    handlers.articles(slug);
  } else if (section === "open-source" && handlers.openSource) {
    handlers.openSource();
  }
}

export function initRouter({ articles, openSource }) {
  handlers = { articles, openSource };
  handleHash();
  window.addEventListener("hashchange", handleHash);
}
