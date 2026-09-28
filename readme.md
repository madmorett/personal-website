# Three.js Journey

## Deploy

Site hospedado na Vercel, deployado sob a conta/email **matheusmorett300@hotmail.com**.
Domínio canônico: `madmorett.com` (projectId em `.vercel/project.json`).
`matheusmorett.com` faz 301 para `madmorett.com`. Canonical, sitemap, robots e
og:url usam só `madmorett.com` (`siteUrl` em `bundler/webpack.common.js`).

## Setup
Download [Node.js](https://nodejs.org/en/download/).
Run this followed commands:

``` bash
# Install dependencies (only the first time)
npm install

# Run the local server at localhost:8080
npm run dev

# Build for production in the dist/ directory
npm run build
```
