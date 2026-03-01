from django.urls import path
from .views import (
    PortfolioListAPIView,
    PortfolioDetailAPIView,
    StockListAPIView,
    StockDetailAPIView
)

urlpatterns = [

    # Portfolio APIs
    path('portfolios/', PortfolioListAPIView.as_view(), name='portfolio-list'),
    path('portfolios/<int:pk>/', PortfolioDetailAPIView.as_view(), name='portfolio-detail'),

    # Stock APIs
    path('stocks/', StockListAPIView.as_view(), name='stock-list'),
    path('stocks/<int:pk>/', StockDetailAPIView.as_view(), name='stock-detail'),
]