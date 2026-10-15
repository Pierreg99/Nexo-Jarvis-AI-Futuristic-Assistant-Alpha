import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import {
  SignJWT,
  jwtVerify,
  createRemoteJWKSet,
  decodeJwt,
  type JWTVerifyGetKey,
} from "jose";
import { parse } from "cookie";
import type { Express, Request, Response } from "express";
import type { User } from "../drizzle/schema";

export const ACCOUNT_COOKIE = "nexo_account";
const STATE_COOKIE = "nexo_oauth_state";
export type AccountProvider = "google" | "microsoft";
const googleKeys = createRemoteJWKSet(
  new URL("https://www.googleapis.com/oauth2/v3/certs")
);
const microsoftKeys = createRemoteJWKSet(
  new URL("https://login.microsoftonline.com/common/discovery/v2.0/keys")
);

function secret() {
  return process.env.NEXO_SESSION_SECRET || process.env.JWT_SECRET || "";
}
export function accountConfig(provider: AccountProvider) {
  const prefix = provider === "google" ? "GOOGLE" : "MICROSOFT";
  const clientId = process.env[`${prefix}_CLIENT_ID`] || "";
  const clientSecret = process.env[`${prefix}_CLIENT_SECRET`] || "";
  const tenant = process.env.MICROSOFT_TENANT_ID || "common";
  if (
    provider === "microsoft" &&
    !/^(common|organizations|consumers|[a-f0-9-]{36})$/i.test(tenant)
  )
    return null;
  let base: URL;
  try {
    base = new URL(process.env.NEXO_PUBLIC_URL || "");
  } catch {
    return null;
  }
  if (
    base.protocol !== "https:" &&
    !(
      base.protocol === "http:" &&
      ["localhost", "127.0.0.1"].includes(base.hostname)
    )
  )
    return null;
  if (!clientId || !clientSecret || Buffer.byteLength(secret()) < 32)
    return null;
  return {
    clientId,
    clientSecret,
    tenant,
    redirectUri: `${base.origin}/api/account/${provider}/callback`,
    secure: base.protocol === "https:",
    authorize:
      provider === "google"
        ? "https://accounts.google.com/o/oauth2/v2/auth"
        : `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/authorize`,
    token:
      provider === "google"
        ? "https://oauth2.googleapis.com/token"
        : `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`,
  };
}
export const accountProviders = () =>
  (["google", "microsoft"] as const).map(id => ({
    id,
    configured: Boolean(accountConfig(id)),
  }));
const signingKey = () => new TextEncoder().encode(secret());
export const pkceChallenge = (verifier: string) =>
  createHash("sha256").update(verifier).digest("base64url");
const equal = (a: string, b: string) =>
  a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));

export async function verifyIdentity(
  provider: AccountProvider,
  token: string,
  clientId: string,
  nonce: string,
  tenant = "common",
  keys?: JWTVerifyGetKey
) {
  let issuer: string | string[] = [
    "https://accounts.google.com",
    "accounts.google.com",
  ];
  if (provider === "microsoft") {
    const tid = decodeJwt(token).tid;
    if (typeof tid !== "string" || !/^[a-f0-9-]{36}$/i.test(tid))
      throw new Error("Invalid tenant");
    const consumer = tid === "9188040d-6c67-4c5b-b112-36a304b66dad";
    if (
      (tenant === "organizations" && consumer) ||
      (tenant === "consumers" && !consumer) ||
      (!["common", "organizations", "consumers"].includes(tenant) &&
        tid.toLowerCase() !== tenant.toLowerCase())
    )
      throw new Error("Tenant mismatch");
    issuer = `https://login.microsoftonline.com/${tid}/v2.0`;
  }
  const { payload } = await jwtVerify(
    token,
    keys ?? (provider === "google" ? googleKeys : microsoftKeys),
    {
      algorithms: ["RS256"],
      requiredClaims: ["exp", "iat", "sub", "nonce"],
      issuer,
      audience: clientId,
    }
  );
  if (
    typeof payload.sub !== "string" ||
    !payload.sub ||
    payload.sub.length > 256 ||
    typeof payload.nonce !== "string" ||
    !equal(payload.nonce, nonce)
  )
    throw new Error("Identity mismatch");
  return {
    subject: `${provider}:${payload.sub}`,
    name:
      typeof payload.name === "string"
        ? payload.name.slice(0, 100)
        : "Nexo account",
    email:
      typeof payload.email === "string" ? payload.email.slice(0, 320) : null,
    provider,
  };
}

export async function readAccount(req: Request): Promise<User | null> {
  const token = parse(req.headers.cookie || "")[ACCOUNT_COOKIE];
  if (!token || Buffer.byteLength(secret()) < 32) return null;
  try {
    const { payload } = await jwtVerify(token, signingKey(), {
      algorithms: ["HS256"],
      requiredClaims: ["exp", "iat", "sub"],
      issuer: "nexo",
      audience: "nexo-account",
    });
    if (
      !payload.sub ||
      typeof payload.name !== "string" ||
      !["google", "microsoft"].includes(String(payload.provider))
    )
      return null;
    const now = new Date();
    return {
      id: 0,
      openId: payload.sub,
      name: payload.name,
      email: typeof payload.email === "string" ? payload.email : null,
      loginMethod: `oidc:${payload.provider}`,
      role: "user",
      createdAt: now,
      updatedAt: now,
      lastSignedIn: now,
    };
  } catch {
    return null;
  }
}

export function registerAccountRoutes(app: Express) {
  app.get("/api/account/:provider/start", async (req, res) => {
    const provider = req.params.provider as AccountProvider;
    if (!["google", "microsoft"].includes(provider))
      return void res.sendStatus(404);
    res.setHeader("Cache-Control", "no-store");
    const config = accountConfig(provider);
    if (!config)
      return void res
        .status(503)
        .json({ error: "Account provider is not configured" });
    const state = randomBytes(32).toString("base64url");
    const verifier = randomBytes(32).toString("base64url");
    const nonce = randomBytes(32).toString("base64url");
    const signed = await new SignJWT({ state, verifier, nonce, provider })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuer("nexo")
      .setAudience("nexo-oauth-state")
      .setIssuedAt()
      .setExpirationTime("10m")
      .sign(signingKey());
    res.cookie(STATE_COOKIE, signed, {
      httpOnly: true,
      sameSite: "lax",
      secure: config.secure,
      path: "/api/account",
      maxAge: 600000,
    });
    const url = new URL(config.authorize);
    for (const [key, value] of Object.entries({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      response_type: "code",
      scope: "openid profile email",
      state,
      nonce,
      code_challenge: pkceChallenge(verifier),
      code_challenge_method: "S256",
    }))
      url.searchParams.set(key, value);
    res.redirect(url.toString());
  });
  app.get("/api/account/:provider/callback", async (req, res) => {
    const provider = req.params.provider as AccountProvider;
    if (!["google", "microsoft"].includes(provider))
      return void res.sendStatus(404);
    res.setHeader("Cache-Control", "no-store");
    const config = accountConfig(provider);
    if (!config) return void res.sendStatus(503);
    const cookie = parse(req.headers.cookie || "")[STATE_COOKIE];
    res.clearCookie(STATE_COOKIE, {
      path: "/api/account",
      secure: config.secure,
      sameSite: "lax",
      httpOnly: true,
    });
    try {
      if (
        !cookie ||
        typeof req.query.code !== "string" ||
        req.query.code.length > 4096 ||
        typeof req.query.state !== "string"
      )
        throw new Error("Missing state");
      const { payload } = await jwtVerify(cookie, signingKey(), {
        algorithms: ["HS256"],
        requiredClaims: [
          "exp",
          "iat",
          "state",
          "nonce",
          "verifier",
          "provider",
        ],
        issuer: "nexo",
        audience: "nexo-oauth-state",
      });
      if (
        payload.provider !== provider ||
        typeof payload.state !== "string" ||
        !equal(payload.state, req.query.state) ||
        typeof payload.verifier !== "string" ||
        typeof payload.nonce !== "string"
      )
        throw new Error("State mismatch");
      const response = await fetch(config.token, {
        method: "POST",
        signal: AbortSignal.timeout(15000),
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: config.clientId,
          client_secret: config.clientSecret,
          code: req.query.code,
          redirect_uri: config.redirectUri,
          grant_type: "authorization_code",
          code_verifier: payload.verifier,
        }),
      });
      if (!response.ok) throw new Error("Token exchange failed");
      const tokens = (await response.json()) as { id_token?: string };
      if (!tokens.id_token) throw new Error("Missing identity token");
      const profile = await verifyIdentity(
        provider,
        tokens.id_token,
        config.clientId,
        payload.nonce,
        config.tenant
      );
      const session = await new SignJWT(profile)
        .setProtectedHeader({ alg: "HS256" })
        .setSubject(profile.subject)
        .setIssuer("nexo")
        .setAudience("nexo-account")
        .setIssuedAt()
        .setExpirationTime("7d")
        .sign(signingKey());
      res.cookie(ACCOUNT_COOKIE, session, {
        httpOnly: true,
        sameSite: "lax",
        secure: config.secure,
        path: "/",
        maxAge: 7 * 86400000,
      });
      res.setHeader("Cache-Control", "no-store");
      res.redirect("/?account=connected");
    } catch {
      res
        .status(400)
        .type("text")
        .send("Sign-in could not be completed. Return to Nexo and try again.");
    }
  });
}
