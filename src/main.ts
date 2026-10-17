// Coming back from single sign-on (#/login?sso_code=… or ?sso_error=…): grab the result before Angular starts.
// On the login page, early unauthenticated API calls can 401 → logout → navigate('/login'), which drops the query
// string before the lazily loaded login screen gets to read it. LoginComponent reads window.__fvSsoReturn instead.
try {
	const hash = window.location.hash || '';
	const q = hash.includes('?') ? new URLSearchParams(hash.slice(hash.indexOf('?') + 1)) : null;
	const code = q?.get('sso_code');
	const error = q?.get('sso_error');
	if (code || error) {
		// A page global, not sessionStorage: the early logout calls sessionStorage.clear().
		(window as any).__fvSsoReturn = { code, error };
		window.history.replaceState(window.history.state, '', window.location.pathname + window.location.search + '#/login');
	}
} catch { /* never block startup */ }

import('./bootstrap')
	.catch(err => console.error(err));
