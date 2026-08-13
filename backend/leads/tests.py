from django.contrib.auth import get_user_model
from django.test import TestCase

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