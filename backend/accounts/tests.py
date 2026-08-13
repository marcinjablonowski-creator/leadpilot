from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from .models import User


class LoginTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="admin",
            email="admin@leadpilot.local",
            password="TestPassword123!",
        )

    def test_login_with_correct_credentials(self):
        url = reverse("token_obtain_pair")

        response = self.client.post(
            url,
            {
                "email": "admin@leadpilot.local",
                "password": "TestPassword123!",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)
    
    def test_login_with_wrong_password(self):
        url = reverse("token_obtain_pair")

        response = self.client.post(
            url,
            {
                "email": "admin@leadpilot.local",
                "password": "WrongPassword123!",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED,
        )