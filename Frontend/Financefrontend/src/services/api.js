import axios from "axios";

const API = axios.create({
  baseURL: "http://127.0.0.1:8000/api/"
});

// Optional: Add interceptor (future JWT support)
API.interceptors.response.use(
  response => response,
  error => {
    console.error("API Error:", error);
    return Promise.reject(error);
  }
);

export default API;