from django.db import IntegrityError
from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from .models import User


class UserModelTests(TestCase):
    def test_create_user_with_email_login(self):
        user = User.objects.create_user(
            username="salesperson",
            email="salesperson@leadpilot.pl",
            password="TestPassword123!",
        )

        self.assertEqual(user.email, "salesperson@leadpilot.pl")
        self.assertTrue(user.check_password("TestPassword123!"))
        self.assertEqual(User.USERNAME_FIELD, "email")

    def test_email_must_be_unique(self):
        User.objects.create_user(
            username="first-user",
            email="unique@leadpilot.pl",
            password="TestPassword123!",
        )

        with self.assertRaises(IntegrityError):
            User.objects.create_user(
                username="second-user",
                email="unique@leadpilot.pl",
                password="TestPassword123!",
            )


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

    def test_refresh_token_returns_new_access_token(self):
        login_response = self.client.post(
            reverse("token_obtain_pair"),
            {
                "email": "admin@leadpilot.local",
                "password": "TestPassword123!",
            },
            format="json",
        )

        response = self.client.post(
            reverse("token_refresh"),
            {"refresh": login_response.data["refresh"]},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)

    def test_access_token_authenticates_protected_api(self):
        login_response = self.client.post(
            reverse("token_obtain_pair"),
            {
                "email": "admin@leadpilot.local",
                "password": "TestPassword123!",
            },
            format="json",
        )
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {login_response.data['access']}"
        )

        response = self.client.get("/api/leads/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
