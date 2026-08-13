export default function handler(_request, response) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return response.status(503).json({
      error: 'Supabase authentication is not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY in Vercel.'
    });
  }

  response.setHeader('Cache-Control', 'public, max-age=0, s-maxage=300, stale-while-revalidate=600');
  return response.status(200).json({ supabaseUrl, supabaseAnonKey });
}
