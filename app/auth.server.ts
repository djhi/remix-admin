import { createCookieSessionStorage } from "@remix-run/node";
import { Authenticator, AuthorizationError } from "remix-auth";
import { SupabaseStrategy } from "remix-auth-supabase";
import { Session } from "@supabase/supabase-js";
import { supabaseAdmin } from "~/supabase.server";

export const checkSession = (
  request: Request,
  options?: Parameters<typeof supabaseAdminStrategy["checkSession"]>[1]
) => {
  return supabaseAdminStrategy.checkSession(request, options);
};

export const adminSessionStorage = createCookieSessionStorage({
  cookie: {
    name: "admin",
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secrets: [process.env.ADMIN_SESSION_SECRET || "xryMYxSd3FiX69Rd"], // This should be an env variable
    secure: process.env.NODE_ENV === "production",
  },
});

const supabaseAdminStrategy = new SupabaseStrategy(
  {
    supabaseClient: supabaseAdmin,
    sessionStorage: adminSessionStorage,
    sessionKey: "admin:session",
    sessionErrorKey: "admin:error",
  },
  async ({ req, supabaseClient }) => {
    const { email, password } = await req.json();

    if (!email) throw new AuthorizationError("Email is required");
    if (typeof email !== "string")
      throw new AuthorizationError("Email must be a string");

    if (!password) throw new AuthorizationError("Password is required");
    if (typeof password !== "string")
      throw new AuthorizationError("Password must be a string");

    return supabaseClient.auth.api
      .signInWithEmail(email, password)
      .then(({ data, error }): Session => {
        if (error || !data) {
          throw new AuthorizationError(
            error?.message ?? "No user session found"
          );
        }

        return data;
      });
  }
);

export const authenticator = new Authenticator<Session>(adminSessionStorage, {
  sessionKey: supabaseAdminStrategy.sessionKey, // keep in sync
  sessionErrorKey: supabaseAdminStrategy.sessionErrorKey, // keep in sync
});

authenticator.use(supabaseAdminStrategy, "admin");
