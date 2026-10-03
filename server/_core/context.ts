import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";
import { parse } from "cookie";
import { randomUUID } from "node:crypto";
import { COOKIE_NAME } from "@shared/const";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
  workspaceId?: string;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;
  const cookies = parse(opts.req.headers.cookie ?? "");

  try {
    if (cookies[COOKIE_NAME] || opts.req.headers.authorization)
      user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    // Authentication is optional for public procedures.
    user = null;
  }

  const existing = cookies.nexo_workspace;
  const workspaceId =
    existing &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      existing
    )
      ? existing
      : randomUUID();
  if (workspaceId !== existing)
    opts.res.cookie("nexo_workspace", workspaceId, {
      httpOnly: true,
      sameSite: "lax",
      secure:
        opts.req.secure || opts.req.headers["x-forwarded-proto"] === "https",
      path: "/",
      maxAge: 365 * 86400000,
    });

  return {
    req: opts.req,
    res: opts.res,
    user,
    workspaceId,
  };
}
