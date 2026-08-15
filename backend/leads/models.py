from django.conf import settings
from django.db import models


class Lead(models.Model):
    class Source(models.TextChoices):
        MANUAL = "manual", "Manual"
        PUBLIC_FORM = "public_form", "Public form"

    class Status(models.TextChoices):
        NEW = "new", "New"
        CONTACTED = "contacted", "Contacted"
        WON = "won", "Won"
        LOST = "lost", "Lost"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="leads",
    )

    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100, blank=True)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=30, blank=True)
    message = models.TextField()
    source = models.CharField(
        max_length=20,
        choices=Source.choices,
        default=Source.MANUAL,
    )

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.NEW,
    )

    ai_summary = models.TextField(blank=True)
    ai_priority = models.CharField(max_length=20, blank=True)
    ai_reply = models.TextField(blank=True)

    sales_notes = models.TextField(blank=True)
    next_contact_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.first_name} {self.last_name}".strip()
