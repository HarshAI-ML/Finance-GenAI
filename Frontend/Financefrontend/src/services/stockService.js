import API from "./api";

export const getStocks = () => {
  return API.get("stocks/");
};

export const getStocksByPortfolio = (portfolioId) => {
  return API.get(`portfolios/${portfolioId}/`);
  // OR better if you create filter endpoint:
  // return API.get(`stocks/?portfolio=${portfolioId}`);
};

export const createStock = (data) => {
  return API.post("stocks/", data);
};

export const searchStocks = (query) => {
  return API.get("stocks/search/", {
    params: { q: query }
  });
};

export const updateStock = (id, data) => {
  return API.put(`stocks/${id}/`, data);
};

export const deleteStock = (id) => {
  return API.delete(`stocks/${id}/`);
};
