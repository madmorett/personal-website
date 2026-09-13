const CopyWebpackPlugin = require('copy-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCSSExtractPlugin = require('mini-css-extract-plugin')
const webpack = require('webpack')
const { RawSource } = require('webpack-sources')
const path = require('path')
const { getArticles } = require('./build-articles')
const fs = require('fs')

const siteUrl = 'https://matheusmorett.com'
const articles = getArticles()
const openSource = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../content/open-source.json'), 'utf-8'))

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

// Dados leves dos artigos injetados na cena 3D (lista da Tábua da Sabedoria).
// O texto completo vai em articles/<slug>.json e é buscado sob demanda.
const tabletArticles = articles.map(({ title, date, description, tags, slug }) => ({
    title, date, description, tags, slug
}))

// HTML indexável injetado no <main class="sr-only"> da home
const seoArticles = articles.map(a =>
    `<li><a href="/articles/${a.slug}/">${a.title}</a> <time datetime="${a.rawDate}">${a.date}</time> — ${a.description}</li>`
).join('\n')
const seoOpenSource = openSource.map(p =>
    `<li><strong>${p.name}</strong> — ${p.tagline} ${p.description} ${p.links.map(l => `<a href="${l.url}">${l.label}</a>`).join(' · ')}</li>`
).join('\n')

const articleJsonAssets = articles.map(a => ({
    filename: `articles/${a.slug}.json`,
    source: JSON.stringify({
        title: a.title, date: a.date, description: a.description, tags: a.tags,
        slug: a.slug, originalUrl: a.originalUrl, htmlContent: a.htmlContent
    })
}))

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
        // Injeta os artigos na cena 3D
        new webpack.DefinePlugin({
            __ARTICLES__: JSON.stringify(tabletArticles),
            __OPEN_SOURCE__: JSON.stringify(openSource)
        }),
        // Homepage
        new HtmlWebpackPlugin({
            template: path.resolve(__dirname, '../src/index.html'),
            filename: 'index.html',
            chunks: ['main'],
            minify: true,
            templateParameters: { seoArticles, seoOpenSource }
        }),
        // Blog listing
        blogListPlugin,
        // Individual articles
        ...articleHtmlPlugins,
        new MiniCSSExtractPlugin(),
        // Emit sitemap.xml + one JSON per article for the in-scene reader
        {
            apply(compiler) {
                compiler.hooks.thisCompilation.tap('SitemapPlugin', (compilation) => {
                    compilation.hooks.processAssets.tap(
                        { name: 'SitemapPlugin', stage: compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL },
                        () => {
                            compilation.emitAsset('sitemap.xml', new RawSource(sitemapXml))
                            articleJsonAssets.forEach(({ filename, source }) => {
                                compilation.emitAsset(filename, new RawSource(source))
                            })
                        }
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
                    {
                        loader: 'html-loader',
                        options: {
                            // Assets absolutos (/favicon, /icons, /sound) são copiados
                            // pelo CopyWebpackPlugin — o loader não deve resolvê-los.
                            sources: {
                                urlFilter: (attribute, value) => !value.startsWith('/')
                            }
                        }
                    }
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
