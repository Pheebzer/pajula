# Spotify Playlist Tracker

A Cloudflare Workers application for fetching and processing Spotify playlist data, and presenting it as an HTML dashboard.  
Raw JSON data is also made available via the `/data` endpoint.

An example of the dashboard is (probably) running at https://pajula.rocks

## Runtime Setup

### Prerequisites

- Wrangler CLI installed
- Node.js installed (LTS 22)
- Cloudflare API token for cache purges:
  - Zone → Cache Purge: Purge

### Commands

To set up the worker and necessary bindings, run the following commands:

```bash
# Login
wrangler login

# Create KV namespaces
wrangler kv namespace create pajula

# Add secrets
wrangler secret put SPOTIFY_CLIENT_ID
wrangler secret put SPOTIFY_CLIENT_SECRET
wrangler secret put SPOTIFY_PLAYLIST_ID
wrangler secret put CLOUDFLARE_API_TOKEN
wrangler secret put CLOUDFLARE_DOMAIN

# Add secrets for local development
cp .env.example .env
```

You will need to update `wrangler.jsonc` with your KV ID, and fill the `.env` file with your secrets for local development.

Note that Cloudflare-specific secrets are only needed in production, as the local environment does not have a CDN cache to purge.

## Cloudfalre configuration

We want to always serve the latest HTML version from edge caches, and avoid browsers from caching content locally.
This guarantees always fresh content, low response times, and cost savings by fewer worker invocations and bandwidth usage.

For this to work, make sure Cloudflare is configured to:
 - cache the content (exact TTL does't matter) for the appropriate domain / routes
 - not add any cache headers that encourage browser to cache content locally
Implementing appropriate cache policy is left as an excercise to the reader.

## Local Development

The local environment is a fully emulated runtime provided by [Miniflare v3](https://developers.cloudflare.com/workers/testing/miniflare/), which is baked into Wrangler.

Miniflare will start a local worker, and also create a fake scheduler and KV storage for it to use.

Note that the local environment will persist KV data between restarts. If you need to modify or reset the KV, the data can be found under `.wrangler/state/v3/kv`.

```bash
# Start dev server
npm run start
```

To trigger the Cron job that parses new data and HTML layout, ping the schedule URL:

```bash
curl -X POST http://localhost:8787/cdn-cgi/handler/scheduled
```

## Deployment

Run `wrangler deploy`.

No separate dev environment is currently implemented, as the local environment should be sufficient to test logic changes.

If you want a separate dev environment, one can easily be set up following [these instructions](https://developers.cloudflare.com/workers/wrangler/environments/).
