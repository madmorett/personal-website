const CopyWebpackPlugin = require('copy-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCSSExtractPlugin = require('mini-css-extract-plugin')
const { RawSource } = require('webpack-sources')
const path = require('path')
const { getArticles } = require('./build-articles')

const siteUrl = 'https://matheusmorett.com'
const articles = getArticles()

// Generate sitemap.xml
const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${siteUrl}/</loc><priority>1.0</priority></url>
  <url><loc>${siteUrl}/articles/</loc><priority>0.8</priority></url>
${articles.map(a => `  <url><loc>${siteUrl}/articles/${a.slug}/</loc><lastmod>${a.rawDate}</lastmod><priority>0.6</priority></url>`).join('\n')}
</urlset>`

// Generate one HtmlWebpackPlugin per article
const articleHtmlPlugins = articles.map(article => {
    return new HtmlWebpackPlugin({
        template: path.resolve(__dirname, '../src/blog/article-template.html'),
        filename: `articles/${article.slug}/index.html`,
        chunks: ['blog'],
        templateParameters: { article, siteUrl },
        minify: true
    })
})

// Blog listing page
const blogListPlugin = new HtmlWebpackPlugin({
    template: path.resolve(__dirname, '../src/blog/blog-list-template.html'),
    filename: 'articles/index.html',
    chunks: ['blogList'],
    templateParameters: { articles, siteUrl },
    minify: true
})

// Generate article cards HTML for homepage injection
const articleCardsHtml = articles.slice(0, 4).map(article => `
    <a href="/articles/${article.slug}/" class="article-card">
        <span class="article-card__date">${article.date}</span>
        <h3 class="article-card__title">${article.title}</h3>
        <p class="article-card__description">${article.description}</p>
        ${article.tags.length > 0 ? `<div class="article-card__tags">${article.tags.map(t => `<span class="article-card__tag">${t}</span>`).join('')}</div>` : ''}
    </a>
`).join('')

const homepageArticlesContent = articles.length > 0
    ? articleCardsHtml
    : '<p class="articles__empty">Articles coming soon.</p>'

module.exports = {
    entry: {
        main: path.resolve(__dirname, '../src/script.js'),
        blog: path.resolve(__dirname, '../src/blog/blog-entry.js'),
        blogList: path.resolve(__dirname, '../src/blog/blog-list-entry.js')
    },
    output:
    {
        hashFunction: 'xxhash64',
        filename: '[name].[contenthash].js',
        path: path.resolve(__dirname, '../dist')
    },
    devtool: 'source-map',
    plugins:
    [
        new CopyWebpackPlugin({
            patterns: [
                { from: path.resolve(__dirname, '../static') }
            ]
        }),
        // Homepage
        new HtmlWebpackPlugin({
            template: path.resolve(__dirname, '../src/index.html'),
            filename: 'index.html',
            chunks: ['main'],
            minify: true,
            templateParameters: {
                articleCards: homepageArticlesContent
            }
        }),
        // Blog listing
        blogListPlugin,
        // Individual articles
        ...articleHtmlPlugins,
        new MiniCSSExtractPlugin(),
        // Emit sitemap.xml
        {
            apply(compiler) {
                compiler.hooks.thisCompilation.tap('SitemapPlugin', (compilation) => {
                    compilation.hooks.processAssets.tap(
                        { name: 'SitemapPlugin', stage: compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL },
                        () => { compilation.emitAsset('sitemap.xml', new RawSource(sitemapXml)) }
                    )
                })
            }
        }
    ],
    module:
    {
        rules:
        [
            // HTML (exclude blog templates — they use EJS via HtmlWebpackPlugin)
            {
                test: /\.(html)$/,
                exclude: [
                    path.resolve(__dirname, '../src/blog'),
                    path.resolve(__dirname, '../src/index.html')
                ],
                use:
                [
                    'html-loader'
                ]
            },

            // JS
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use:
                [
                    'babel-loader'
                ]
            },

            // CSS
            {
                test: /\.css$/,
                use:
                [
                    MiniCSSExtractPlugin.loader,
                    'css-loader'
                ]
            },

            // Images
            {
                test: /\.(jpg|png|gif|svg)$/,
                type: 'asset/resource',
                generator:
                {
                    filename: 'assets/images/[hash][ext]'
                }
            },

            // Fonts
            {
                test: /\.(ttf|eot|woff|woff2)$/,
                type: 'asset/resource',
                generator:
                {
                    filename: 'assets/fonts/[hash][ext]'
                }
            }
        ]
    }
}
