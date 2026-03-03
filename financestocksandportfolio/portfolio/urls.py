from django.urls import path
from .views import (
    SignupAPIView,
    LoginAPIView,
    LogoutAPIView,
    MeAPIView,
    PortfolioListAPIView,
    PortfolioDetailAPIView,
    StockListAPIView,
    StockSearchAPIView,
    StockDetailAPIView,
    PortfolioTopDiscountAPIView,
    MetalsHistoryAPIView,
)

urlpatterns = [
    # Auth APIs
    path("auth/signup/", SignupAPIView.as_view(), name="signup"),
    path("auth/login/", LoginAPIView.as_view(), name="login"),
    path("auth/logout/", LogoutAPIView.as_view(), name="logout"),
    path("auth/me/", MeAPIView.as_view(), name="me"),

    # Portfolio APIs
    path('portfolios/', PortfolioListAPIView.as_view(), name='portfolio-list'),
    path('portfolios/<int:pk>/', PortfolioDetailAPIView.as_view(), name='portfolio-detail'),

    # Stock APIs
    path('stocks/', StockListAPIView.as_view(), name='stock-list'),
    path('stocks/search/', StockSearchAPIView.as_view(), name='stock-search'),
    path('stocks/<int:pk>/', StockDetailAPIView.as_view(), name='stock-detail'),
    path('metals/history/', MetalsHistoryAPIView.as_view(), name='metals-history'),
    path(
    'portfolios/<int:pk>/top-discount/',PortfolioTopDiscountAPIView.as_view(),
),
]
