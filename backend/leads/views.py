from rest_framework import generics
from rest_framework.permissions import IsAuthenticated

from .models import Lead
from .serializers import LeadSerializer

from rest_framework.views import APIView
from rest_framework.response import Response

from django.shortcuts import get_object_or_404

from .ai_service import analyze_and_save_lead


class LeadListCreateView(generics.ListCreateAPIView):
    serializer_class = LeadSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Lead.objects.filter(user=self.request.user).order_by("-created_at")

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


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
        except RuntimeError:
            return Response(
                {"detail": "AI service is unavailable."},
                status=503,
            )
        except ValueError:
            return Response(
                {"detail": "Invalid AI response."},
                status=502,
            )

        return Response({
            "ai_summary": lead.ai_summary,
            "ai_priority": lead.ai_priority,
            "ai_reply": lead.ai_reply,
        })