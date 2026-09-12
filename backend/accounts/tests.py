from django.contrib.auth.models import User
from django.core.cache import cache
from rest_framework import status
from rest_framework.test import APITestCase


class TokenObtainTests(APITestCase):
    def setUp(self):
        # Throttle counters live in the cache, which the test runner doesn't
        # reset between methods — a busy scope from a previous test would
        # otherwise make an unrelated test's first request 429.
        cache.clear()
        self.staff = User.objects.create_user('staffuser', password='StrongPass123!', is_staff=True)
        self.plain = User.objects.create_user('plainuser', password='StrongPass123!')

    def test_staff_login_succeeds(self):
        response = self.client.post(
            '/api/auth/token/', {'username': 'staffuser', 'password': 'StrongPass123!'}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        self.assertEqual(response.data['user']['username'], 'staffuser')

    def test_non_staff_login_rejected(self):
        response = self.client.post(
            '/api/auth/token/', {'username': 'plainuser', 'password': 'StrongPass123!'}
        )
        # Rejected by the custom serializer, not simplejwt's own auth failure.
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_wrong_password_rejected(self):
        response = self.client.post(
            '/api/auth/token/', {'username': 'staffuser', 'password': 'wrong'}
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_login_is_throttled_after_five_attempts(self):
        for _ in range(5):
            response = self.client.post(
                '/api/auth/token/', {'username': 'staffuser', 'password': 'wrong'}
            )
            self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

        response = self.client.post(
            '/api/auth/token/', {'username': 'staffuser', 'password': 'wrong'}
        )
        self.assertEqual(response.status_code, status.HTTP_429_TOO_MANY_REQUESTS)

    def test_login_throttle_counts_successes_too(self):
        # A correct login burns the same quota — otherwise an attacker could
        # dodge the limit by mixing in valid-looking requests.
        for _ in range(5):
            self.client.post('/api/auth/token/', {'username': 'staffuser', 'password': 'StrongPass123!'})

        response = self.client.post(
            '/api/auth/token/', {'username': 'staffuser', 'password': 'StrongPass123!'}
        )
        self.assertEqual(response.status_code, status.HTTP_429_TOO_MANY_REQUESTS)


class CurrentUserTests(APITestCase):
    def setUp(self):
        cache.clear()
        self.staff = User.objects.create_user('staffuser', password='StrongPass123!', is_staff=True)

    def test_requires_authentication(self):
        response = self.client.get('/api/auth/me/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_returns_current_user_when_authenticated(self):
        self.client.force_authenticate(self.staff)
        response = self.client.get('/api/auth/me/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], 'staffuser')


class ChangePasswordTests(APITestCase):
    def setUp(self):
        cache.clear()
        self.staff = User.objects.create_user('staffuser', password='OldPass123!', is_staff=True)
        self.client.force_authenticate(self.staff)

    def test_requires_authentication(self):
        self.client.force_authenticate(None)
        response = self.client.post(
            '/api/auth/change-password/',
            {'current_password': 'OldPass123!', 'new_password': 'NewPass456!'},
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_wrong_current_password_rejected(self):
        response = self.client.post(
            '/api/auth/change-password/',
            {'current_password': 'wrong', 'new_password': 'NewPass456!'},
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('current_password', response.data)

    def test_weak_new_password_rejected(self):
        response = self.client.post(
            '/api/auth/change-password/',
            {'current_password': 'OldPass123!', 'new_password': '12345678'},
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('new_password', response.data)

    def test_successful_change_updates_password(self):
        response = self.client.post(
            '/api/auth/change-password/',
            {'current_password': 'OldPass123!', 'new_password': 'NewPass456!'},
        )
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

        self.staff.refresh_from_db()
        self.assertTrue(self.staff.check_password('NewPass456!'))
        self.assertFalse(self.staff.check_password('OldPass123!'))
