import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

let refreshPromise: Promise<unknown> | null = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isNonRetryableAuthRoute = ["/auth/login", "/auth/register", "/auth/refresh", "/auth/logout"].some(
      (path) => originalRequest?.url?.includes(path)
    );

    if (error.response?.status === 401 && !originalRequest._retry && !isNonRetryableAuthRoute) {
      originalRequest._retry = true;
      try {
        refreshPromise ??= api.post("/auth/refresh").finally(() => {
          refreshPromise = null;
        });
        await refreshPromise;
        return api(originalRequest);
      } catch {
        window.location.href = "/login";
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);
