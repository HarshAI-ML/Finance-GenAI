from django.urls import path

from .views import PortfolioRiskClusterAPIView, BtcForecastAPIView


urlpatterns = [
    path(
        "crypto/btc/forecast/",
        BtcForecastAPIView.as_view(),
        name="btc-forecast",
    ),
    path(
        "portfolios/<int:pk>/risk-clusters/",
        PortfolioRiskClusterAPIView.as_view(),
        name="portfolio-risk-clusters",
    ),
]
