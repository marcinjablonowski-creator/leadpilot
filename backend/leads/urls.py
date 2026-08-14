from django.urls import path

from .views import LeadAnalyzeView, LeadDetailView, LeadListCreateView


urlpatterns = [
    path("", LeadListCreateView.as_view(), name="lead-list-create"),
    path("<int:pk>/", LeadDetailView.as_view(), name="lead-detail"),
    path(
        "<int:pk>/analyze/",
        LeadAnalyzeView.as_view(),
        name="lead-analyze",
    ),
]