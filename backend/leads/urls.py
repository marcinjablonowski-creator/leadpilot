from django.urls import path

from .views import LeadDetailView, LeadListCreateView


urlpatterns = [
    path("", LeadListCreateView.as_view(), name="lead-list-create"),
    path("<int:pk>/", LeadDetailView.as_view(), name="lead-detail"),
]