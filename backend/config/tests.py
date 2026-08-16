from django.test import SimpleTestCase, override_settings
from django.urls import reverse


class HealthCheckTests(SimpleTestCase):
    @override_settings(SECURE_SSL_REDIRECT=True)
    def test_health_check_returns_ok(self):
        response = self.client.get(reverse("health-check"))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"status": "ok"})
