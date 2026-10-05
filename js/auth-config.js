// ERVIRA Authentication configuration
// Public browser configuration only. Never place payment/API secrets here.
// Create a Supabase project and enable Email, Google and Apple providers.
// Then replace the two values below.
window.ERVIRA_AUTH_CONFIG = Object.freeze({
  supabaseUrl: 'https://YOUR-PROJECT.supabase.co',
  supabaseAnonKey: 'YOUR_SUPABASE_ANON_KEY',
  redirectTo: window.location.origin + '/account.html'
});
