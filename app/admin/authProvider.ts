import { AuthProvider } from "react-admin";

export const authProvider: AuthProvider = {
  login: async ({ username: email, password }) => {
    const request = new Request("/admin/api/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
      headers: new Headers({ "Content-Type": "application/json" }),
    });
    return fetch(request)
      .then((response) => {
        if (response.status < 200 || response.status >= 300) {
          throw new Error(response.statusText);
        }
        return response.json();
      })
      .then((auth) => {
        localStorage.setItem("auth", JSON.stringify(auth));
      })
      .catch(() => {
        throw new Error("Network error");
      });
  },
  logout: async () => {
    localStorage.removeItem("auth");
  },
  checkAuth: async () => {
    if (localStorage.getItem("auth")) {
      return Promise.resolve();
    }
    return Promise.reject();
  },
  checkError: async (error) => {
    const status = error.status;
    if (status === 401 || status === 403) {
      return Promise.reject();
    }
    // other error code (404, 500, etc): no need to log out
    return Promise.resolve();
  },
  getPermissions: async () => {},
  getIdentity: async () => {
    const auth = localStorage.getItem("auth");
    if (!auth) {
      return { id: "" };
    }
    const { email } = JSON.parse(auth);
    return {
      id: email,
      fullName: email,
    };
  },
};
