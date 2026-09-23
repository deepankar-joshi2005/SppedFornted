import axios from "axios";

export const API_BASE_URL = "https://api.thespeedtest.in/api";

export const SERVER_ORIGIN = "https://api.thespeedtest.in";

export const resolveAssetUrl = (
  path: string | null | undefined
): string | undefined => {
  return path ? `${SERVER_ORIGIN}${path}` : undefined;
};

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

export default api;