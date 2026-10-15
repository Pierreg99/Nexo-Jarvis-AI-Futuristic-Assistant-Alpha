import {
  beforeAll,
  beforeEach,
  afterEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { generateKeyPair, exportJWK, SignJWT, decodeJwt } from "jose";
import type { Express, Request, Response } from "express";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  ACCOUNT_COOKIE,
  accountConfig,
  pkceChallenge,
  readAccount,
  registerAccountRoutes,
  verifyIdentity,
} from "./account";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

const secret = "test-session-secret-with-at-least-32-bytes";
let pair: Awaited<ReturnType<typeof generateKeyPair>>;
let jwk: Awaited<ReturnType<typeof exportJWK>>;
let directory: string;
beforeAll(async () => {
  pair = await generateKeyPair("RS256");
  jwk = {
    ...(await exportJWK(pair.publicKey)),
    kid: "nexo-test-key",
    alg: "RS256",
    use: "sig",
  };
});
beforeEach(() => {
  vi.stubEnv("NEXO_SESSION_SECRET", secret);
  vi.stubEnv("NEXO_PUBLIC_URL", "https://nexo.example");
  for (const provider of ["GOOGLE", "MICROSOFT"]) {
    vi.stubEnv(`${provider}_CLIENT_ID`, "test-client");
    vi.stubEnv(`${provider}_CLIENT_SECRET`, "test-secret");
  }
  directory = mkdtempSync(path.join(tmpdir(), "nexo-account-"));
  vi.stubEnv("NEXO_DATA_DIR", directory);
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  rmSync(directory, { recursive: true, force: true });
});
function routes() {
  const handlers: Record<
    string,
    (req: Request, res: Response) => Promise<void>
  > = {};
  registerAccountRoutes({
    get: (url: string, fn: (req: Request, res: Response) => Promise<void>) => {
      handlers[url] = fn;
    },
  } as unknown as Express);
  return handlers;
}
function response() {
  return {
    cookie: vi.fn(),
    clearCookie: vi.fn(),
    redirect: vi.fn(),
    status: vi.fn().mockReturnThis(),
    json: vi.fn(),
    sendStatus: vi.fn(),
    type: vi.fn().mockReturnThis(),
    send: vi.fn(),
    setHeader: vi.fn(),
  };
}
async function start() {
  const handlers = routes();
  const res = response();
  await handlers["/api/account/:provider/start"](
    { params: { provider: "google" } } as unknown as Request,
    res as unknown as Response
  );
  const url = new URL(res.redirect.mock.calls[0][0]);
  const signed = res.cookie.mock.calls[0][1] as string;
  return { handlers, url, signed, res };
}
function idToken(nonce: string, aud = "test-client", expiry = "5m") {
  return new SignJWT({ nonce, name: "Test pilot", email: "pilot@example.com" })
    .setProtectedHeader({ alg: "RS256", kid: "nexo-test-key" })
    .setSubject("stable-user")
    .setIssuer("https://accounts.google.com")
    .setAudience(aud)
    .setIssuedAt()
    .setExpirationTime(expiry)
    .sign(pair.privateKey);
}

describe("OAuth identity and workspace boundaries", () => {
  it("uses the RFC 7636 PKCE challenge and server-issued state", async () => {
    expect(pkceChallenge("dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk")).toBe(
      "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM"
    );
    const { url, signed, res } = await start();
    const payload = decodeJwt(signed);
    expect(url.searchParams.get("code_challenge")).toBe(
      pkceChallenge(String(payload.verifier))
    );
    expect(url.searchParams.get("state")).toBe(payload.state);
    expect(url.searchParams.get("nonce")).toBe(payload.nonce);
    expect(url.searchParams.get("scope")).toBe("openid profile email");
    expect(res.cookie.mock.calls[0][2]).toMatchObject({
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      maxAge: 600000,
    });
  });
  it("rejects changed state before contacting any provider", async () => {
    const { handlers, signed } = await start();
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    const res = response();
    await handlers["/api/account/:provider/callback"](
      {
        params: { provider: "google" },
        query: { code: "code", state: "tampered" },
        headers: { cookie: `nexo_oauth_state=${signed}` },
      } as unknown as Request,
      res as unknown as Response
    );
    expect(res.status).toHaveBeenCalledWith(400);
    expect(fetch).not.toHaveBeenCalled();
    expect(res.cookie).not.toHaveBeenCalled();
  });
  it("requires the correct audience, nonce, issuer, and valid lifetime", async () => {
    const key = async () => pair.publicKey;
    await expect(
      verifyIdentity(
        "google",
        await idToken("nonce"),
        "test-client",
        "nonce",
        "common",
        key
      )
    ).resolves.toMatchObject({ subject: "google:stable-user" });
    await expect(
      verifyIdentity(
        "google",
        await idToken("wrong"),
        "test-client",
        "nonce",
        "common",
        key
      )
    ).rejects.toThrow();
    await expect(
      verifyIdentity(
        "google",
        await idToken("nonce", "other-client"),
        "test-client",
        "nonce",
        "common",
        key
      )
    ).rejects.toThrow();
    await expect(
      verifyIdentity(
        "google",
        await idToken("nonce", "test-client", "-1s"),
        "test-client",
        "nonce",
        "common",
        key
      )
    ).rejects.toThrow();
  });
  it("rejects Microsoft tenants outside the configured organization", async () => {
    const token = await new SignJWT({
      tid: "11111111-1111-1111-1111-111111111111",
      nonce: "nonce",
    })
      .setProtectedHeader({ alg: "RS256" })
      .setSubject("user")
      .setIssuedAt()
      .setExpirationTime("5m")
      .sign(pair.privateKey);
    await expect(
      verifyIdentity(
        "microsoft",
        token,
        "test-client",
        "nonce",
        "22222222-2222-2222-2222-222222222222",
        async () => pair.publicKey
      )
    ).rejects.toThrow("Tenant mismatch");
  });
  it("exchanges the code with PKCE and persists only a verified local identity", async () => {
    const { handlers, url, signed } = await start();
    const payload = decodeJwt(signed);
    const token = await idToken(String(payload.nonce));
    const fetch = vi.fn(
      async (url: unknown) =>
        new Response(
          JSON.stringify(
            String(url).includes("certs")
              ? { keys: [jwk] }
              : {
                  id_token: token,
                  access_token: "never-store-this-access-token",
                }
          ),
          { headers: { "Content-Type": "application/json" } }
        )
    );
    vi.stubGlobal("fetch", fetch);
    const res = response();
    await handlers["/api/account/:provider/callback"](
      {
        params: { provider: "google" },
        query: { code: "code", state: url.searchParams.get("state") },
        headers: { cookie: `nexo_oauth_state=${signed}` },
      } as unknown as Request,
      res as unknown as Response
    );
    expect(res.redirect).toHaveBeenCalledWith("/?account=connected");
    const session = res.cookie.mock.calls.find(
      c => c[0] === ACCOUNT_COOKIE
    )?.[1];
    expect(session).toBeTypeOf("string");
    const profile = await readAccount({
      headers: { cookie: `${ACCOUNT_COOKIE}=${session}` },
    } as Request);
    expect(profile).toMatchObject({
      openId: "google:stable-user",
      name: "Test pilot",
      role: "user",
    });
    expect(JSON.stringify(decodeJwt(session))).not.toContain(
      "never-store-this-access-token"
    );
    const request = fetch.mock.calls.find(c => String(c[0]).includes("/token"));
    expect(request).toBeDefined();
    const exchange = new URLSearchParams(
      String((request as unknown as [unknown, RequestInit])[1].body)
    );
    expect(exchange.get("code_verifier")).toBe(payload.verifier);
    expect(exchange.get("redirect_uri")).toBe(
      "https://nexo.example/api/account/google/callback"
    );
  });
  it("disables providers without a strong signing secret or a valid public URL", () => {
    vi.stubEnv("NEXO_SESSION_SECRET", "short");
    vi.stubEnv("JWT_SECRET", "");
    expect(accountConfig("google")).toBeNull();
    vi.stubEnv("NEXO_SESSION_SECRET", secret);
    vi.stubEnv("NEXO_PUBLIC_URL", "http://public.example");
    expect(accountConfig("google")).toBeNull();
  });
  it("syncs one identity across guest sessions and isolates different identities", async () => {
    const now = new Date();
    const caller = (id: string, guest: string) =>
      appRouter.createCaller({
        accountId: id,
        workspaceId: guest,
        user: {
          id: 0,
          openId: id,
          name: "Pilot",
          email: null,
          loginMethod: "oidc:google",
          role: "user",
          createdAt: now,
          updatedAt: now,
          lastSignedIn: now,
        },
        req: { headers: {} } as TrpcContext["req"],
        res: {} as TrpcContext["res"],
      });
    await caller("google:one", "guest-a").nexo2.memory.create({
      content: "Account one only",
    });
    expect(
      (await caller("google:one", "guest-b").nexo2.workspace.snapshot())
        .workspace.memory[0].content
    ).toBe("Account one only");
    expect(
      (await caller("google:two", "guest-a").nexo2.workspace.snapshot())
        .workspace.memory
    ).toEqual([]);
    const client = caller("google:one", "guest-c");
    expect(
      await client.nexo2.workspace.importNotes({
        notes: [{ content: "Imported note" }, { content: "Imported note" }],
      })
    ).toEqual({ imported: 1 });
    expect(
      await client.nexo2.workspace.importNotes({
        notes: [{ content: "Imported note" }],
      })
    ).toEqual({ imported: 0 });
  });
});
