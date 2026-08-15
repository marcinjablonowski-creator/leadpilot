from celery import shared_task

from .ai_service import analyze_and_save_lead
from .models import Lead


@shared_task(
    autoretry_for=(RuntimeError, ValueError),
    retry_backoff=True,
    retry_jitter=True,
    max_retries=3,
)
def analyze_public_lead(lead_id):
    try:
        lead = Lead.objects.get(pk=lead_id)
    except Lead.DoesNotExist:
        return

    analyze_and_save_lead(lead)
