import axios from "axios";

export const API_BASE_URL = `https://speedbackend-ko6w.onrender.com/api`;
export const SERVER_ORIGIN = `https://speedbackend-ko6w.onrender.com`;

// Uploaded images are served from the server origin (e.g. /uploads/foo.png),
// not under /api. Backend responses only ever return that relative path.
export const resolveAssetUrl = (path: string | null | undefined): string | undefined =>
  path ? `${SERVER_ORIGIN}${path}` : undefined;

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

export default api;
