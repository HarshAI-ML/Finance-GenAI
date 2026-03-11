import API from "./api";

export const getBtcForecast = (model = "linear", days = 30) => {
  return API.get("crypto/btc/forecast/", {
    params: { model, days },
  });
};
