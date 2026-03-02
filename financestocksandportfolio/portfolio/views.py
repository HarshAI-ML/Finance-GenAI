from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import Portfolio, Stock
from .serializers import PortfolioSerializer, StockSerializer
from .services import fetch_stock_data, search_stocks


# -----------------------
# Portfolio API
# -----------------------

class PortfolioListAPIView(APIView):

    def get(self, request):
        portfolios = Portfolio.objects.all()
        serializer = PortfolioSerializer(portfolios, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = PortfolioSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PortfolioDetailAPIView(APIView):

    def get(self, request, pk):
        try:
            portfolio = Portfolio.objects.get(pk=pk)
        except Portfolio.DoesNotExist:
            return Response({"error": "Portfolio not found"}, status=404)

        serializer = PortfolioSerializer(portfolio)
        return Response(serializer.data)

    def put(self, request, pk):
        try:
            portfolio = Portfolio.objects.get(pk=pk)
        except Portfolio.DoesNotExist:
            return Response({"error": "Portfolio not found"}, status=404)

        serializer = PortfolioSerializer(portfolio, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)

    def delete(self, request, pk):
        try:
            portfolio = Portfolio.objects.get(pk=pk)
        except Portfolio.DoesNotExist:
            return Response({"error": "Portfolio not found"}, status=404)

        portfolio.delete()
        return Response(status=204)


# -----------------------
# Stock API
# -----------------------

class StockListAPIView(APIView):

    def get(self, request):
        stocks = Stock.objects.all()
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
            # Fetch stock data automatically
            stock_data = fetch_stock_data(ticker)

            stock = Stock.objects.create(
                portfolio_id=portfolio_id,
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
            stock = Stock.objects.get(pk=pk)
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
            stock = Stock.objects.get(pk=pk)
        except Stock.DoesNotExist:
            return Response({"error": "Stock not found"}, status=404)

        serializer = StockSerializer(stock, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)

    def delete(self, request, pk):
        try:
            stock = Stock.objects.get(pk=pk)
        except Stock.DoesNotExist:
            return Response({"error": "Stock not found"}, status=404)

        stock.delete()
        return Response(status=204)

class PortfolioTopDiscountAPIView(APIView):

    def get(self, request, pk):
        try:
            portfolio = Portfolio.objects.get(pk=pk)
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
