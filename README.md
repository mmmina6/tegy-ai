# TEGY Creative Intelligence Canvas

The existing canvas UI now includes AI Script Agent V1. The current chat bar is the input: users describe the product and ad in natural language, and the agent runs three modular skills:

1. Product Extract
2. Persona & Insight
3. Script

Results appear in the existing Script Agent inspector under **Output**. Each project's recent results are stored in that browser under **History**.

## Local setup

1. Install Node.js 20 or newer.
2. In this folder, run `npm install`.
3. Copy `.env.example` to `.env.local`.
4. Create a Gemini API key in Google AI Studio and set `GEMINI_API_KEY` in `.env.local`.
5. For the Anime image trial, create a Hugging Face token with Inference Providers permission and set `HF_TOKEN`. The default test model is `black-forest-labs/FLUX.1-schnell`.
6. Run `npm run dev` and open the local URL printed by Vercel.

Do not put the Gemini key in `app.js`, `index.html`, or any other browser file.

## Vercel setup

Use the existing `tegy-ai` Vercel project:

1. Open **Settings → Environment Variables**.
2. Add `GEMINI_API_KEY` for Production, Preview, and Development as needed.
3. Add `HF_TOKEN` for the Anime image trial. Keep it server-side; never add it to `app.js` or the browser.
4. Optionally add `GEMINI_MODEL`; the default is `gemini-2.5-flash`.
5. Redeploy the latest commit.

### Supabase authentication

Add `SUPABASE_URL` and `SUPABASE_ANON_KEY` for Production, Preview, and Development. Use only the Supabase publishable/anon key, never the `service_role` key.

In Supabase Authentication, enable Email/Password and Google, and disable public user sign-ups. Accounts are provisioned manually by a TEGY administrator. Set the production Vercel URL as the Site URL and add both the production URL and local development URL to Redirect URLs. Google OAuth must use the callback URL shown by Supabase. Sessions are persisted and refreshed by the Supabase browser client.

For customer sharing, model access separately from authentication: assign each user to an organization and grant read-only membership only to that organization's projects. Enforce this in the database/API layer rather than relying on the browser UI.

Vercel serves the static UI and the server-side `/api/script` function together. No separate server is required.

## Structure

```text
api/script.js                         Server-only API route
src/services/gemini.js                Replaceable Gemini service layer
src/agents/script/index.js            Script Agent orchestration
src/agents/script/skills/
  product-extract.js                  Product Extract Skill
  persona-insight.js                  Persona & Insight Skill
  script.js                           Script Skill
app.js                                Existing UI integration
```

## Verification

Run `npm test`. A live Gemini generation additionally requires a valid key and consumes API quota.

## Cloudflare D1 API

TEGY stores structured project data in the Cloudflare D1 database `tegy-production`. Generated files remain in the company Google Shared Drive; the `drive_files` table stores only their IDs, links, and project relationships.

- Schema: `cloudflare/migrations/0001_initial.sql`
- Worker: `cloudflare/src/index.js`
- Configuration: `cloudflare/wrangler.toml`

The Worker requires a `TEGY_API_TOKEN` secret on every `/v1/*` route. `/health` remains public for deployment monitoring. This service token is an interim server-to-server boundary and will be replaced by verified Google Workspace sessions when login is implemented.

Vercel exposes the allow-listed `/api/data` proxy to the browser. Configure `TEGY_API_URL` and the same `TEGY_API_TOKEN` in Vercel; never add the token to browser JavaScript.
