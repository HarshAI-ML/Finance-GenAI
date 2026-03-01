from django.db import models


class Portfolio(models.Model):
    name = models.CharField(max_length=100)
    sector = models.CharField(max_length=100)

    def __str__(self):
        return self.name


class Stock(models.Model):
    portfolio = models.ForeignKey(
        Portfolio,
        on_delete=models.CASCADE,
        related_name='stocks'   # VERY IMPORTANT
    )

    name = models.CharField(max_length=100)
    ticker = models.CharField(max_length=20)

    current_price = models.FloatField(null=True, blank=True)
    pe_ratio = models.FloatField(null=True, blank=True)
    eps = models.FloatField(null=True, blank=True)
    market_cap = models.FloatField(null=True, blank=True)

    intrinsic_value = models.FloatField(null=True, blank=True)
    discount_level = models.FloatField(null=True, blank=True)
    opportunity_score = models.FloatField(null=True, blank=True)

    last_updated = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.ticker})"