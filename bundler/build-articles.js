const { marked } = require("marked");
const hljs = require("highlight.js");
const matter = require("gray-matter");
const fs = require("fs");
const path = require("path");

function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

marked.use({
  renderer: {
    // marked <13 passa (code, infostring); marked >=13 passa um token.
    // Aceitar os dois evita que um upgrade volte a esvaziar todos os blocos.
    code(codeOrToken, infostring) {
      const isToken = typeof codeOrToken === "object" && codeOrToken !== null;
      const code = (isToken ? codeOrToken.text : codeOrToken) || "";
      const lang = ((isToken ? codeOrToken.lang : infostring) || "").trim().split(/\s+/)[0];

      if (lang && hljs.getLanguage(lang)) {
        const highlighted = hljs.highlight(code, { language: lang }).value;
        return `<pre><code class="hljs language-${lang}">${highlighted}</code></pre>`;
      }
      if (!code) {
        return `<pre><code class="hljs"></code></pre>`;
      }
      // Sem linguagem: não adivinhar (highlightAuto erra feio em texto/CLI); só escapar.
      return `<pre><code class="hljs">${escapeHtml(code)}</code></pre>`;
    },
  },
});

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function getArticles() {
  const articlesDir = path.resolve(__dirname, "../content/articles");

  if (!fs.existsSync(articlesDir)) {
    return [];
  }

  const files = fs.readdirSync(articlesDir).filter((f) => f.endsWith(".md"));

  const articles = files.map((file) => {
    const raw = fs.readFileSync(path.join(articlesDir, file), "utf-8");
    const { data, content } = matter(raw);
    const slug = data.slug || file.replace(".md", "");
    const htmlContent = marked(content);
    const words = htmlContent.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;
    const readingMinutes = Math.max(1, Math.round(words / 220));

    return {
      title: data.title || "Untitled",
      date: formatDate(data.date),
      rawDate: data.date || "",
      description: data.description || "",
      tags: data.tags || [],
      image: data.image || "",
      originalUrl: data.originalUrl || "",
      slug,
      htmlContent,
      readingMinutes,
      filename: file,
    };
  });

  articles.sort((a, b) => new Date(b.rawDate) - new Date(a.rawDate));

  return articles;
}

module.exports = { getArticles };
