import { ActionFunction, json } from "@remix-run/node";
import { authenticator, adminSessionStorage } from "~/auth.server";

export const action: ActionFunction = async ({ request }) => {
  try {
    const user = await authenticator.authenticate("admin", request);
    let session = await adminSessionStorage.getSession(
      request.headers.get("Cookie")
    );

    // if we do have a successRedirect, we redirect to it and set the user
    // in the session sessionKey
    session.set(authenticator.sessionKey, user);
    session.set(authenticator.sessionStrategyKey || "strategy", "admin");

    return json(
      { email: user.user?.email },
      {
        headers: {
          "Set-Cookie": await adminSessionStorage.commitSession(session),
        },
      }
    );
  } catch (error) {
    return json((error as Error).message, { status: 500 });
  }
};
