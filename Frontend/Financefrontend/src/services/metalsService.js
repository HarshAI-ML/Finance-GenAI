import API from "./api";

export const getMetalsHistory = () => {
  return API.get("metals/history/");
};
