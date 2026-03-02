import axios from "axios";
import { clearAuthSession, getToken } from "../utils/auth";

const API = axios.create({
  baseURL: "http://127.0.0.1:8000/api/"
});

API.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Token ${token}`;
  }
  return config;
});

// Optional: Add interceptor (future JWT support)
API.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      clearAuthSession();
    }
    console.error("API Error:", error);
    return Promise.reject(error);
  }
);

export default API;
