from django.conf import settings
from django.contrib.auth import get_user_model
from kombu.exceptions import OperationalError
from rest_framework import generics
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.throttling import AnonRateThrottle

from .models import Lead
from .serializers import LeadSerializer, PublicLeadSerializer
from .tasks import analyze_public_lead

from rest_framework.views import APIView
from rest_framework.response import Response

from django.shortcuts import get_object_or_404

from .ai_service import (
    AIResponseError,
    AIServiceError,
    analyze_and_save_lead,
)


User = get_user_model()


class PublicLeadCreateView(generics.CreateAPIView):
    serializer_class = PublicLeadSerializer
    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [AnonRateThrottle]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            owner = User.objects.get(
                email__iexact=settings.PUBLIC_LEADS_OWNER_EMAIL,
                is_active=True,
            )
        except User.DoesNotExist:
            return Response(
                {"detail": "Formularz jest chwilowo niedostępny."},
                status=503,
            )

        lead = serializer.save(
            user=owner,
            source=Lead.Source.PUBLIC_FORM,
        )

        try:
            analyze_public_lead.delay(lead.pk)
        except OperationalError:
            pass

        return Response(
            {"detail": "Dziękujemy. Zapytanie zostało wysłane."},
            status=201,
        )


class LeadListCreateView(generics.ListCreateAPIView):
    serializer_class = LeadSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Lead.objects.filter(user=self.request.user).order_by("-created_at")

    def perform_create(self, serializer):
        lead = serializer.save(user=self.request.user)

        try:
            analyze_and_save_lead(lead)
        except (RuntimeError, ValueError):
            pass


class LeadDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = LeadSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Lead.objects.filter(user=self.request.user)

class LeadAnalyzeView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        lead = get_object_or_404(
            Lead,
            pk=pk,
            user=request.user,
        )

        try:
            analyze_and_save_lead(lead)
        except (AIServiceError, AIResponseError) as error:
            return Response(
                {"detail": error.detail, "code": error.code},
                status=error.status_code,
            )
        # Safe fallbacks for unexpected errors from legacy integrations.
        except RuntimeError:
            return Response(
                {
                    "detail": "Usługa AI jest chwilowo niedostępna.",
                    "code": "ai_unavailable",
                },
                status=503,
            )
        except ValueError:
            return Response(
                {
                    "detail": "AI zwróciło nieprawidłową odpowiedź.",
                    "code": "ai_invalid_response",
                },
                status=502,
            )

        return Response({
            "ai_summary": lead.ai_summary,
            "ai_priority": lead.ai_priority,
            "ai_reply": lead.ai_reply,
        })
