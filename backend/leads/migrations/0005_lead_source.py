from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("leads", "0004_lead_next_contact_at"),
    ]

    operations = [
        migrations.AddField(
            model_name="lead",
            name="source",
            field=models.CharField(
                choices=[
                    ("manual", "Manual"),
                    ("public_form", "Public form"),
                ],
                default="manual",
                max_length=20,
            ),
        ),
    ]
