import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const cfg = window.ERVIRA_AUTH_CONFIG || {};
const configured = cfg.supabaseUrl && cfg.supabaseAnonKey &&
  !cfg.supabaseUrl.includes('YOUR-PROJECT') &&
  !cfg.supabaseAnonKey.includes('YOUR_SUPABASE');

const els = {
  status: document.querySelector('[data-auth-status]'),
  email: document.querySelector('#authEmail'),
  emailButton: document.querySelector('[data-auth-email]'),
  google: document.querySelector('[data-auth-google]'),
  apple: document.querySelector('[data-auth-apple]'),
  logout: document.querySelector('[data-auth-logout]'),
  dashboard: document.querySelector('[data-auth-dashboard]'),
  accountName: document.querySelector('[data-account-name]'),
  accountEmail: document.querySelector('[data-account-email]'),
  authCard: document.querySelector('[data-auth-card]'),
  signedIn: document.querySelector('[data-signed-in]'),
  configNotice: document.querySelector('[data-auth-config]')
};

const setStatus = (message, type = '') => {
  if (!els.status) return;
  els.status.textContent = message;
  els.status.dataset.state = type;
};

const showSignedIn = (session) => {
  const user = session?.user;
  if (!user) {
    els.signedIn?.setAttribute('hidden', '');
    els.authCard?.removeAttribute('hidden');
    els.dashboard?.setAttribute('hidden', '');
    return;
  }
  const name = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'کاربر ERVIRA';
  if (els.accountName) els.accountName.textContent = name;
  if (els.accountEmail) els.accountEmail.textContent = user.email || '';
  els.authCard?.setAttribute('hidden', '');
  els.signedIn?.removeAttribute('hidden');
  els.dashboard?.removeAttribute('hidden');
  els.configNotice?.setAttribute('hidden', '');
};

const handleAuthCallbackMessage = () => {
  const params = new URLSearchParams(window.location.search);
  const error = params.get('error_description') || params.get('error');
  if (error) {
    setStatus('ورود تکمیل نشد. دوباره روش ورود را انتخاب کن.', 'error');
    window.history.replaceState({}, document.title, window.location.pathname);
  }
};

handleAuthCallbackMessage();

if (!configured) {
  els.configNotice?.removeAttribute('hidden');
  setStatus('ورود واقعی آماده است؛ فقط اتصال پروژه احراز هویت باید تنظیم شود.', 'setup');
} else {
  const supabase = createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });

  const startOAuth = async (provider) => {
    setStatus('در حال انتقال به ورود امن…');
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: cfg.redirectTo }
    });
    if (error) setStatus('ورود انجام نشد. دوباره تلاش کن.', 'error');
  };

  els.google?.addEventListener('click', () => startOAuth('google'));
  els.apple?.addEventListener('click', () => startOAuth('apple'));

  els.emailButton?.addEventListener('click', async () => {
    const email = els.email?.value.trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setStatus('یک ایمیل معتبر وارد کن.', 'error');
      els.email?.focus();
      return;
    }
    els.emailButton.disabled = true;
    setStatus('لینک ورود امن به ایمیلت ارسال می‌شود…');
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: cfg.redirectTo }
    });
    els.emailButton.disabled = false;
    if (error) {
      setStatus('ارسال لینک ورود ناموفق بود. دوباره امتحان کن.', 'error');
      return;
    }
    setStatus('لینک ورود ارسال شد؛ ایمیلت را باز کن و روی لینک بزن.', 'success');
  });

  els.logout?.addEventListener('click', async () => {
    await supabase.auth.signOut();
    showSignedIn(null);
    setStatus('از حساب خارج شدی.');
  });

  const { data } = await supabase.auth.getSession();
  showSignedIn(data.session);
  supabase.auth.onAuthStateChange((_event, session) => showSignedIn(session));
}
