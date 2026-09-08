import { createRemoteJWKSet, jwtVerify } from "jose";

const GOOGLE_JWKS = createRemoteJWKSet(
  new URL("https://www.googleapis.com/oauth2/v3/certs"),
);

export function baseUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(
    /\/$/,
    "",
  );
}

export function googleConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET,
  );
}

export function googleClientId(): string {
  return process.env.GOOGLE_CLIENT_ID ?? "";
}

export function googleRedirectUri(): string {
  return `${baseUrl()}/api/auth/google/callback`;
}

export function googleAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: googleClientId(),
    redirect_uri: googleRedirectUri(),
    response_type: "code",
    scope: "openid email profile",
    state,
    prompt: "select_account",
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export type GoogleUserInfo = {
  googleId: string;
  email: string;
  name: string;
  emailVerified: boolean;
  picture: string;
};

export async function verifyGoogleCode(
  code: string,
): Promise<GoogleUserInfo> {
  const params = new URLSearchParams({
    code,
    client_id: googleClientId(),
    client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    redirect_uri: googleRedirectUri(),
    grant_type: "authorization_code",
  });

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });
  if (!res.ok) {
    throw new Error("google_token_exchange_failed");
  }

  const tokens = (await res.json()) as { id_token: string };
  const { payload } = await jwtVerify(tokens.id_token, GOOGLE_JWKS, {
    issuer: ["https://accounts.google.com", "accounts.google.com"],
    audience: googleClientId(),
  });

  return {
    googleId: String(payload.sub ?? ""),
    email: String(payload.email ?? "").toLowerCase(),
    name: String(payload.name ?? ""),
    emailVerified: Boolean(payload.email_verified),
    picture: String(payload.picture ?? ""),
  };
}