from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("portfolio", "0002_portfolio_owner"),
    ]

    operations = [
        migrations.AddField(
            model_name="stock",
            name="max_price",
            field=models.FloatField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="stock",
            name="min_price",
            field=models.FloatField(blank=True, null=True),
        ),
    ]
