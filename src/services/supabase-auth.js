let client = null;

function userDisplay(user) {
  const metadata = user?.user_metadata || {};
  const email = user?.email || '';
  const name = metadata.full_name || metadata.name || email.split('@')[0] || 'TEGY User';
  return {
    name,
    email,
    avatarUrl: metadata.avatar_url || metadata.picture || '',
    provider: user?.app_metadata?.provider || 'email'
  };
}

async function loadConfig() {
  const response = await fetch('/api/auth-config');
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || '認証設定を読み込めませんでした。');
  return payload;
}

export async function initializeAuth({ onUser, onSignedOut }) {
  const config = await loadConfig();
  if (!window.supabase?.createClient) throw new Error('Supabase SDK を読み込めませんでした。');
  client = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });

  const { data: { session }, error } = await client.auth.getSession();
  if (error) throw error;
  if (session?.user) onUser(session.user, userDisplay(session.user));
  else onSignedOut();

  client.auth.onAuthStateChange((event, nextSession) => {
    if (nextSession?.user) onUser(nextSession.user, userDisplay(nextSession.user));
    else if (event === 'SIGNED_OUT') onSignedOut();
  });
  return client;
}

function requireClient() {
  if (!client) throw new Error('認証の準備が完了していません。');
  return client;
}

export async function signInWithGoogle() {
  const { error } = await requireClient().auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${window.location.origin}${window.location.pathname}` }
  });
  if (error) throw error;
}

export async function signInWithEmail(email, password) {
  const { error } = await requireClient().auth.signInWithPassword({ email, password });
  if (error) throw error;
}

export async function resetPassword(email) {
  const { error } = await requireClient().auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}${window.location.pathname}`
  });
  if (error) throw error;
}

export async function signOut() {
  const { error } = await requireClient().auth.signOut();
  if (error) throw error;
}
