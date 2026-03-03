from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from .models import Portfolio, Stock
from .serializers import PortfolioSerializer, StockSerializer
from .services import (
    fetch_stock_data,
    search_stocks,
    refresh_portfolio_stocks,
    fetch_metals_history_3y,
)


class SignupAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = (request.data.get("username") or "").strip()
        password = request.data.get("password") or ""

        if not username or not password:
            return Response(
                {"error": "Username and password are required"},
                status=400,
            )

        if User.objects.filter(username=username).exists():
            return Response({"error": "Username already exists"}, status=400)

        user = User.objects.create_user(username=username, password=password)
        token, _ = Token.objects.get_or_create(user=user)

        return Response(
            {"token": token.key, "user": {"id": user.id, "username": user.username}},
            status=201,
        )


class LoginAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = (request.data.get("username") or "").strip()
        password = request.data.get("password") or ""

        user = authenticate(request, username=username, password=password)
        if not user:
            return Response({"error": "Invalid credentials"}, status=400)

        token, _ = Token.objects.get_or_create(user=user)
        return Response(
            {"token": token.key, "user": {"id": user.id, "username": user.username}}
        )


class LogoutAPIView(APIView):

    def post(self, request):
        Token.objects.filter(user=request.user).delete()
        return Response({"message": "Logged out successfully"})


class MeAPIView(APIView):

    def get(self, request):
        return Response({"id": request.user.id, "username": request.user.username})


# -----------------------
# Portfolio API
# -----------------------

class PortfolioListAPIView(APIView):

    def get(self, request):
        portfolios = Portfolio.objects.filter(owner=request.user)
        for portfolio in portfolios:
            refresh_portfolio_stocks(portfolio)

        portfolios = Portfolio.objects.filter(owner=request.user)
        serializer = PortfolioSerializer(portfolios, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = PortfolioSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(owner=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PortfolioDetailAPIView(APIView):

    def get(self, request, pk):
        try:
            portfolio = Portfolio.objects.get(pk=pk, owner=request.user)
        except Portfolio.DoesNotExist:
            return Response({"error": "Portfolio not found"}, status=404)

        refresh_portfolio_stocks(portfolio)
        portfolio.refresh_from_db()
        serializer = PortfolioSerializer(portfolio)
        return Response(serializer.data)

    def put(self, request, pk):
        try:
            portfolio = Portfolio.objects.get(pk=pk, owner=request.user)
        except Portfolio.DoesNotExist:
            return Response({"error": "Portfolio not found"}, status=404)

        serializer = PortfolioSerializer(portfolio, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)

    def delete(self, request, pk):
        try:
            portfolio = Portfolio.objects.get(pk=pk, owner=request.user)
        except Portfolio.DoesNotExist:
            return Response({"error": "Portfolio not found"}, status=404)

        portfolio.delete()
        return Response(status=204)


# -----------------------
# Stock API
# -----------------------

class StockListAPIView(APIView):

    def get(self, request):
        stocks = Stock.objects.filter(portfolio__owner=request.user)
        serializer = StockSerializer(stocks, many=True)
        return Response(serializer.data)

    def post(self, request):

        portfolio_id = request.data.get("portfolio")
        name = request.data.get("name")
        ticker = request.data.get("ticker")

        if not portfolio_id or not name or not ticker:
            return Response(
                {"error": "Portfolio, name and ticker are required"},
                status=400
            )

        try:
            portfolio = Portfolio.objects.get(pk=portfolio_id, owner=request.user)
        except Portfolio.DoesNotExist:
            return Response({"error": "Portfolio not found"}, status=404)

        try:
            # Fetch stock data automatically
            stock_data = fetch_stock_data(ticker)

            stock = Stock.objects.create(
                portfolio=portfolio,
                name=name,
                ticker=ticker,
                **stock_data
            )

            serializer = StockSerializer(stock)
            return Response(serializer.data, status=201)

        except Exception as e:
            return Response(
                {"error": str(e)},
                status=400
            )


class StockSearchAPIView(APIView):

    def get(self, request):
        query = request.query_params.get("q", "")
        if not query.strip():
            return Response({"results": []})

        try:
            results = search_stocks(query)
            return Response({"results": results})
        except Exception as e:
            return Response({"error": str(e)}, status=400)


class StockDetailAPIView(APIView):

    def get(self, request, pk):
        try:
            stock = Stock.objects.get(pk=pk, portfolio__owner=request.user)
        except Stock.DoesNotExist:
            return Response({"error": "Stock not found"}, status=404)

        # 🔥 check if range query param exists
        range_value = request.query_params.get("range")

        # If NO range → return normal serializer (old behavior)
        if not range_value:
            serializer = StockSerializer(stock)
            return Response(serializer.data)

        # If range exists → return live data + history
        try:
            stock_data = fetch_stock_data(stock.ticker, range_value)
            return Response(stock_data)
        except Exception as e:
            return Response({"error": str(e)}, status=400)

    def put(self, request, pk):
        try:
            stock = Stock.objects.get(pk=pk, portfolio__owner=request.user)
        except Stock.DoesNotExist:
            return Response({"error": "Stock not found"}, status=404)

        serializer = StockSerializer(stock, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)

    def delete(self, request, pk):
        try:
            stock = Stock.objects.get(pk=pk, portfolio__owner=request.user)
        except Stock.DoesNotExist:
            return Response({"error": "Stock not found"}, status=404)

        stock.delete()
        return Response(status=204)

class PortfolioTopDiscountAPIView(APIView):

    def get(self, request, pk):
        try:
            portfolio = Portfolio.objects.get(pk=pk, owner=request.user)
        except Portfolio.DoesNotExist:
            return Response({"error": "Portfolio not found"}, status=404)

        stocks = (
            Stock.objects
            .filter(portfolio=portfolio)
            .order_by('-discount_level')[:5]
        )

        data = [
            {
                "name": stock.name,
                "ticker": stock.ticker,
                "discount_level": stock.discount_level
            }
            for stock in stocks
        ]

        return Response(data)


class MetalsHistoryAPIView(APIView):

    def get(self, request):
        try:
            history = fetch_metals_history_3y()
            return Response({
                "period": "3y",
                "source": "yfinance",
                "history": history,
            })
        except Exception as e:
            return Response({"error": str(e)}, status=400)
