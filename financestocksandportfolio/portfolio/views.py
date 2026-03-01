from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import Portfolio, Stock
from .serializers import PortfolioSerializer, StockSerializer
from .services import fetch_stock_data


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
        

class StockDetailAPIView(APIView):

    def get(self, request, pk):
        try:
            stock = Stock.objects.get(pk=pk)
        except Stock.DoesNotExist:
            return Response({"error": "Stock not found"}, status=404)

        serializer = StockSerializer(stock)
        return Response(serializer.data)

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