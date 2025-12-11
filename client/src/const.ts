export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

export const APP_TITLE = import.meta.env.VITE_APP_TITLE || "App";

export const APP_LOGO = "https://placehold.co/128x128/E1E7EF/1F2937?text=App";

// Generate login URL at runtime so redirect URI reflects the current origin.
// Returns empty string if OAuth is not configured to prevent errors.
// Generate GitHub OAuth login URL
export const getGitHubLoginUrl = (): string => {
  try {
    const githubClientId = import.meta.env.VITE_GITHUB_CLIENT_ID;
    
    if (!githubClientId || githubClientId === 'undefined') {
      console.warn('GitHub OAuth not configured: VITE_GITHUB_CLIENT_ID is missing');
      return '';
    }
    
    const redirectUri = `${window.location.origin}/api/auth/callback/github`;
    const state = encodeURIComponent(window.location.pathname);
    
    const url = new URL('https://github.com/login/oauth/authorize');
    url.searchParams.set('client_id', githubClientId);
    url.searchParams.set('redirect_uri', redirectUri);
    url.searchParams.set('state', state);
    url.searchParams.set('scope', 'read:user user:email');
    
    return url.toString();
  } catch (error) {
    console.error('Failed to construct GitHub login URL:', error);
    return '';
  }
};

// Use GitHub OAuth by default
export const getLoginUrl = (): string => {
  return getGitHubLoginUrl();
};
