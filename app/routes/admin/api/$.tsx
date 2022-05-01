import { ActionFunction, json, LoaderFunction } from "@remix-run/node";
import { checkSession } from "~/auth.server";

export const loader: LoaderFunction = async ({ request }) => {
  const session = await checkSession(request);
  if (!session) {
    throw json("Unauthorized", { status: 401 });
  }

  const apiUrl = getSupabaseUrlFromRequestUrl(request.url);

  return fetch(apiUrl, {
    headers: {
      prefer: request.headers.get("prefer") ?? "",
      accept: request.headers.get("accept") ?? "application/json",
      apiKey: `${process.env.SUPABASE_SERVICE_ROLE}`,
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE}`,
    },
  });
};

export const action: ActionFunction = async ({ request }) => {
  const session = await checkSession(request);
  if (!session) {
    throw json("Unauthorized", { status: 401 });
  }
  const apiUrl = getSupabaseUrlFromRequestUrl(request.url);

  return fetch(apiUrl, {
    method: request.method,
    body: request.body,
    headers: {
      prefer: request.headers.get("prefer") ?? "",
      accept: request.headers.get("accept") ?? "application/json",
      apiKey: `${process.env.SUPABASE_SERVICE_ROLE}`,
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE}`,
    },
  });
};

const ADMIN_PREFIX = "/admin/api";

const getSupabaseUrlFromRequestUrl = (url: string) => {
  const startOfRequest = url.indexOf(ADMIN_PREFIX);
  const query = url.substring(startOfRequest + ADMIN_PREFIX.length);
  return `${process.env.SUPABASE_URL}/rest/v1${query}`;
};
