import API from "./api";

export const getPortfolios = () => {
  return API.get("portfolios/");
};

export const getPortfolioById = (id) => {
  return API.get(`portfolios/${id}/`);
};

export const createPortfolio = (data) => {
  return API.post("portfolios/", data);
};

export const updatePortfolio = (id, data) => {
  return API.put(`portfolios/${id}/`, data);
};

export const deletePortfolio = (id) => {
  return API.delete(`portfolios/${id}/`);
};

export const getPortfolioRiskClusters = (id) => {
  return API.get(`portfolios/${id}/risk-clusters/`);
};
