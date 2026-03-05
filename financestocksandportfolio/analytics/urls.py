from django.urls import path

from .views import PortfolioRiskClusterAPIView


urlpatterns = [
    path(
        "portfolios/<int:pk>/risk-clusters/",
        PortfolioRiskClusterAPIView.as_view(),
        name="portfolio-risk-clusters",
    ),
]
