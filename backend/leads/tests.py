from unittest.mock import patch
from datetime import timedelta

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone

from rest_framework import status
from rest_framework.test import APITestCase

from .models import Lead


User = get_user_model()


class LeadModelTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="testuser",
            email="test@example.com",
            password="TestPassword123!",
        )

    def test_create_lead(self):
        lead = Lead.objects.create(
            user=self.user,
            first_name="Jan",
            last_name="Kowalski",
            email="jan@example.com",
            phone="500600700",
            message="Potrzebuję wyceny klimatyzacji.",
        )

        self.assertEqual(lead.first_name, "Jan")
        self.assertEqual(lead.last_name, "Kowalski")
        self.assertEqual(lead.user, self.user)
        self.assertEqual(lead.status, Lead.Status.NEW)


class LeadAPITests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="user1",
            email="user1@example.com",
            password="TestPassword123!",
        )

        self.other_user = User.objects.create_user(
            username="user2",
            email="user2@example.com",
            password="TestPassword123!",
        )

        self.lead = Lead.objects.create(
            user=self.user,
            first_name="Jan",
            last_name="Kowalski",
            email="jan@example.com",
            phone="500600700",
            message="Potrzebuję wyceny klimatyzacji.",
        )

        self.other_lead = Lead.objects.create(
            user=self.other_user,
            first_name="Anna",
            last_name="Nowak",
            email="anna@example.com",
            phone="500111222",
            message="Potrzebuję montażu klimatyzacji.",
        )

        self.client.force_authenticate(user=self.user)

    def test_get_leads(self):
        response = self.client.get("/api/leads/")

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )
        self.assertEqual(len(response.data), 1)
        self.assertEqual(
            response.data[0]["id"],
            self.lead.id,
        )

    def test_create_lead(self):
        data = {
            "first_name": "Piotr",
            "last_name": "Wiśniewski",
            "email": "piotr@example.com",
            "phone": "500222333",
            "message": "Proszę o wycenę klimatyzacji do domu.",
        }

        response = self.client.post(
            "/api/leads/",
            data,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
        )

        self.assertEqual(
            Lead.objects.count(),
            3,
        )

        created_lead = Lead.objects.get(
            email="piotr@example.com"
        )

        self.assertEqual(
            created_lead.user,
            self.user,
        )

    def test_get_lead_detail(self):
        response = self.client.get(
            f"/api/leads/{self.lead.id}/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            response.data["id"],
            self.lead.id,
        )

        self.assertEqual(
            response.data["first_name"],
            "Jan",
        )

    def test_update_lead(self):
        response = self.client.patch(
            f"/api/leads/{self.lead.id}/",
            {
                "status": Lead.Status.CONTACTED,
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.lead.refresh_from_db()

        self.assertEqual(
            self.lead.status,
            Lead.Status.CONTACTED,
        )

    def test_set_next_contact_at(self):
        next_contact_at = timezone.now() + timedelta(days=1)

        response = self.client.patch(
            f"/api/leads/{self.lead.id}/",
            {
                "next_contact_at": next_contact_at.isoformat(),
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.lead.refresh_from_db()
        self.assertEqual(self.lead.next_contact_at, next_contact_at)

    def test_clear_next_contact_at(self):
        self.lead.next_contact_at = timezone.now()
        self.lead.save(update_fields=["next_contact_at"])

        response = self.client.patch(
            f"/api/leads/{self.lead.id}/",
            {
                "next_contact_at": None,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.lead.refresh_from_db()
        self.assertIsNone(self.lead.next_contact_at)

    def test_user_cannot_set_follow_up_for_another_users_lead(self):
        response = self.client.patch(
            f"/api/leads/{self.other_lead.id}/",
            {
                "next_contact_at": timezone.now().isoformat(),
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.other_lead.refresh_from_db()
        self.assertIsNone(self.other_lead.next_contact_at)

    def test_delete_lead(self):
        response = self.client.delete(
            f"/api/leads/{self.lead.id}/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_204_NO_CONTENT,
        )

        self.assertFalse(
            Lead.objects.filter(
                id=self.lead.id
            ).exists()
        )

    @patch("leads.views.analyze_and_save_lead")
    def test_analyze_lead_endpoint(self, mock_analyze):
        def fake_analysis(lead):
            lead.ai_summary = (
                "Klient chce wycenę klimatyzacji."
            )
            lead.ai_priority = "high"
            lead.ai_reply = (
                "Dzień dobry, przygotujemy wycenę."
            )

            lead.save()

        mock_analyze.side_effect = fake_analysis

        response = self.client.post(
            f"/api/leads/{self.lead.id}/analyze/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            response.data["ai_priority"],
            "high",
        )

        self.assertEqual(
            response.data["ai_summary"],
            "Klient chce wycenę klimatyzacji.",
        )

        self.assertEqual(
            response.data["ai_reply"],
            "Dzień dobry, przygotujemy wycenę.",
        )

    @patch("leads.views.analyze_and_save_lead")
    def test_analyze_lead_ai_error(self, mock_analyze):
        mock_analyze.side_effect = RuntimeError(
            "AI service is unavailable."
        )

        response = self.client.post(
            f"/api/leads/{self.lead.id}/analyze/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_503_SERVICE_UNAVAILABLE,
        )

        self.assertEqual(
            response.data["detail"],
            "AI service is unavailable.",
        )

    def test_api_requires_authentication(self):
        self.client.force_authenticate(user=None)

        response = self.client.get(
            "/api/leads/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED,
        )

    def test_user_cannot_access_another_users_lead(self):
        response = self.client.get(
            f"/api/leads/{self.other_lead.id}/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND,
        )

    def test_user_cannot_update_another_users_lead(self):
        response = self.client.patch(
            f"/api/leads/{self.other_lead.id}/",
            {
                "status": Lead.Status.CONTACTED,
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND,
        )

    def test_user_cannot_delete_another_users_lead(self):
        response = self.client.delete(
            f"/api/leads/{self.other_lead.id}/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND,
        )

        self.assertTrue(
            Lead.objects.filter(
                id=self.other_lead.id
            ).exists()
        )
