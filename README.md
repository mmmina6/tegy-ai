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
5. Run `npm run dev` and open the local URL printed by Vercel.

Do not put the Gemini key in `app.js`, `index.html`, or any other browser file.

## Vercel setup

Use the existing `tegy-ai` Vercel project:

1. Open **Settings → Environment Variables**.
2. Add `GEMINI_API_KEY` for Production, Preview, and Development as needed.
3. Optionally add `GEMINI_MODEL`; the default is `gemini-2.5-flash`.
4. Redeploy the latest commit.

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
