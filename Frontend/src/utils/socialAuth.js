import { userRequest } from "../requestMethods";

const scriptPromises = {};

const loadScript = (id, src) => {
  if (scriptPromises[id]) return scriptPromises[id];

  scriptPromises[id] = new Promise((resolve, reject) => {
    const existingScript = document.getElementById(id);

    if (existingScript) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.id = id;
    script.src = src;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Could not load social login script"));
    document.body.appendChild(script);
  });

  return scriptPromises[id];
};

const getGoogleAccessToken = async () => {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  if (!clientId) {
    throw new Error("Google login is not configured. Add VITE_GOOGLE_CLIENT_ID.");
  }

  await loadScript("google-identity-services", "https://accounts.google.com/gsi/client");

  return new Promise((resolve, reject) => {
    if (!window.google?.accounts?.oauth2) {
      reject(new Error("Google login is not available right now"));
      return;
    }

    const tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: "openid email profile",
      callback: (response) => {
        if (response?.access_token) {
          resolve(response.access_token);
          return;
        }

        reject(new Error(response?.error_description || "Google login was cancelled"));
      },
    });

    tokenClient.requestAccessToken({ prompt: "select_account" });
  });
};

const initFacebook = async () => {
  const appId = import.meta.env.VITE_FACEBOOK_APP_ID;

  if (!appId) {
    throw new Error("Facebook login is not configured. Add VITE_FACEBOOK_APP_ID.");
  }

  await loadScript("facebook-sdk", "https://connect.facebook.net/en_US/sdk.js");

  if (!window.FB) {
    throw new Error("Facebook login is not available right now");
  }

  if (!window.__maneMoreFacebookReady) {
    window.FB.init({
      appId,
      cookie: false,
      xfbml: false,
      version: "v19.0",
    });

    window.__maneMoreFacebookReady = true;
  }
};

const getFacebookAccessToken = async () => {
  await initFacebook();

  return new Promise((resolve, reject) => {
    window.FB.login(
      (response) => {
        if (response?.authResponse?.accessToken) {
          resolve(response.authResponse.accessToken);
          return;
        }

        reject(new Error("Facebook login was cancelled"));
      },
      { scope: "public_profile,email" }
    );
  });
};

export const socialSignIn = async (provider) => {
  const normalizedProvider = String(provider || "").toLowerCase();
  const accessToken =
    normalizedProvider === "google"
      ? await getGoogleAccessToken()
      : await getFacebookAccessToken();

  const response = await userRequest.post("/auth/social-login", {
    provider: normalizedProvider,
    accessToken,
  });

  return response.data;
};
