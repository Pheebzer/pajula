import { DATA_KEY, HTML_KEY, CACHE_CONTROL_HEADERS } from './const';
import { updatePlaylistData } from './lib/playlist-updater';
import { Env } from './types';

export default {
	async fetch(req: Request, env: Env) {
		const url = new URL(req.url);
		const path = url.pathname;

    // Data route, serve JSON data
    // Not consumed by anything, exists for debugging purposes and further development
		if (path === '/data') {
			const data = await env.pajula.get(DATA_KEY);
			if (!data) {
				return new Response(`No data found`, { status: 404 });
			}
			return new Response(data, { 
				headers: {
					"content-type": "application/json; charset=utf-8",
					...CACHE_CONTROL_HEADERS
				} 
			});
		}

		// Main route, serve HTML dashboard
		const html = await env.pajula.get(HTML_KEY);
		if (!html) {
			return new Response("Dashboard not ready yet. Data is being processed...", { 
				headers: { "content-type": "text/plain; charset=utf-8" } 
			});
		}
		return new Response(html, { 
			headers: { 
				"content-type": "text/html; charset=utf-8",
                ...CACHE_CONTROL_HEADERS
			} 
		});
	},

  // cron job to update the data and generate the HTML page
  // Request returns immediately, the cron job runs in the background
	async scheduled(_event, env: Env, ctx: ExecutionContext): Promise<void> {
		ctx.waitUntil(updatePlaylistData(env));
	}
} satisfies ExportedHandler<Env>;