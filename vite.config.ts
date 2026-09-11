import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import {VitePWA} from 'vite-plugin-pwa';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['apple-touch-icon.png', 'icon.svg'],
        manifest: {
          id: '/',
          name: 'Smart Resource Organizer',
          short_name: 'SmartOrg',
          description: 'A production-ready personal dashboard for organizing links, documents, GitHub repositories, and reels.',
          theme_color: '#090d16',
          background_color: '#090d16',
          display: 'standalone',
          start_url: '/',
          scope: '/',
          share_target: {
            action: '/',
            method: 'GET',
            params: {
              title: 'title',
              text: 'text',
              url: 'url',
            },
          },
          icons: [
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-maskable-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'gstatic-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
          ],
        },
        devOptions: {
          enabled: true,
          type: 'module',
        },
      }),
      {
        name: 'api-backend-proxy',
        configureServer(server) {
          server.middlewares.use('/api/summarize', async (req, res) => {
            if (req.method !== 'POST') {
              res.statusCode = 405;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Method Not Allowed' }));
              return;
            }

            let body = '';
            req.on('data', (chunk) => {
              body += chunk;
            });

            req.on('end', async () => {
              try {
                const parsed = JSON.parse(body || '{}');
                const title = parsed.title || 'Resource';
                const url = parsed.url || '';
                const description = parsed.description || '';

                const apiKey = process.env.GEMINI_API_KEY;
                if (apiKey) {
                  try {
                    const { GoogleGenAI } = await import('@google/genai');
                    const ai = new GoogleGenAI({ apiKey });
                    const prompt = `You are a concise technical summarizer. Provide a clean, dense summary of this web resource:
Title: ${title}
URL: ${url}
Description: ${description}

Respond strictly with valid JSON conforming to this schema:
{
  "summary": "1-2 sentence dense summary",
  "keyPoints": ["point 1", "point 2", "point 3"],
  "suggestedTags": ["tag1", "tag2"],
  "readingTimeMinutes": 2
}`;
                    const response = await ai.models.generateContent({
                      model: 'gemini-2.5-flash',
                      contents: prompt,
                      config: { responseMimeType: 'application/json' },
                    });

                    if (response.text) {
                      res.setHeader('Content-Type', 'application/json');
                      res.end(response.text);
                      return;
                    }
                  } catch (genAiErr) {
                    console.warn('Gemini proxy generation warning:', genAiErr);
                  }
                }

                // Deterministic fallback response when key is unset or API call is bypassed
                const fallbackResult = {
                  summary: description
                    ? `${description.slice(0, 160)}. Architectural reference covering operational guides for ${title}.`
                    : `Technical reference covering design patterns, integration points, and workflows for ${title}.`,
                  keyPoints: [
                    `Operational specifications for ${title}`,
                    'Implementation patterns and architectural guidelines',
                    'Security boundaries and protocol requirements',
                  ],
                  suggestedTags: ['reference', 'documentation'],
                  readingTimeMinutes: 2,
                };

                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(fallbackResult));
              } catch (parseErr) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'Invalid JSON request payload' }));
              }
            });
          });
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      host: '0.0.0.0',
      port: 3000,
      allowedHosts: true as const,
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
      fs: {
        strict: false,
      },
    },
  };
});
