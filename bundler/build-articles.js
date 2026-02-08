const { marked } = require("marked");
const hljs = require("highlight.js");
const matter = require("gray-matter");
const fs = require("fs");
const path = require("path");

marked.use({
  renderer: {
    code(token) {
      const lang = token.lang || "";
      const code = token.text || "";
      if (lang && hljs.getLanguage(lang)) {
        const highlighted = hljs.highlight(code, { language: lang }).value;
        return `<pre><code class="hljs language-${lang}">${highlighted}</code></pre>`;
      }
      if (!code) {
        return `<pre><code class="hljs"></code></pre>`;
      }
      const highlighted = hljs.highlightAuto(code).value;
      return `<pre><code class="hljs">${highlighted}</code></pre>`;
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
      filename: file,
    };
  });

  articles.sort((a, b) => new Date(b.rawDate) - new Date(a.rawDate));

  return articles;
}

module.exports = { getArticles };
