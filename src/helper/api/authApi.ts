import { fetchAuth, fetchData } from "./fetchData";

export const authApi = {
  register: async (name: string, email: string, password: string) => {
    return await fetchData("http://localhost:5000/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    });
  },
  login: async (email: string, password: string) => {
    return await fetchData("http://localhost:5000/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },
  checkAuth: async (token: string) => {
    return await fetchAuth("http://localhost:5000/api/auth/me", token);
  },
};
