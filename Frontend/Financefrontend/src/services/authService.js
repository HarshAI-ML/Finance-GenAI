import API from "./api";
import { clearAuthSession, getStoredUser, setAuthSession } from "../utils/auth";

export const signup = async (payload) => {
  const res = await API.post("auth/signup/", payload);
  setAuthSession(res.data.token, res.data.user);
  return res;
};

export const login = async (payload) => {
  const res = await API.post("auth/login/", payload);
  setAuthSession(res.data.token, res.data.user);
  return res;
};

export const logout = async () => {
  try {
    await API.post("auth/logout/");
  } finally {
    clearAuthSession();
  }
};

export const getCurrentUser = () => getStoredUser();
