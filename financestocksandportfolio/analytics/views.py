from rest_framework.response import Response
from rest_framework.views import APIView

from portfolio.models import Portfolio, Stock
from .services.risk_clustering import RISK_FREE_RATE, compute_stock_risk_clusters
from .services.btc_forecasting import get_btc_forecast_payload


class PortfolioRiskClusterAPIView(APIView):
    def get(self, request, pk):
        try:
            portfolio = Portfolio.objects.get(pk=pk, owner=request.user)
        except Portfolio.DoesNotExist:
            return Response({"error": "Portfolio not found"}, status=404)

        stocks = Stock.objects.filter(portfolio=portfolio)
        result = compute_stock_risk_clusters(stocks)

        return Response(
            {
                "portfolio_id": portfolio.id,
                "portfolio_name": portfolio.name,
                "risk_free_rate": RISK_FREE_RATE,
                **result,
            }
        )


class BtcForecastAPIView(APIView):
    def get(self, request):
        model_name = request.query_params.get("model", "linear")
        forecast_days = request.query_params.get("days", 30)
        try:
            payload = get_btc_forecast_payload(model_name, forecast_days)
            return Response(payload)
        except Exception as exc:
            return Response({"error": str(exc)}, status=400)
