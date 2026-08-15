from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("leads", "0003_lead_sales_notes"),
    ]

    operations = [
        migrations.AddField(
            model_name="lead",
            name="next_contact_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
