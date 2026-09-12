from django.contrib.auth.models import User
from django.core.cache import cache
from rest_framework import status
from rest_framework.test import APITestCase

from .models import QuoteRequest

VALID_PAYLOAD = {
    'name': 'Jane',
    'email': 'jane@example.com',
    'project_details': 'Need a website.',
}


class QuoteSubmissionTests(APITestCase):
    def setUp(self):
        cache.clear()

    def test_anonymous_can_submit(self):
        response = self.client.post('/api/quotes/', VALID_PAYLOAD)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(QuoteRequest.objects.count(), 1)

    def test_submission_is_throttled_after_five(self):
        for _ in range(5):
            response = self.client.post('/api/quotes/', VALID_PAYLOAD)
            self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        response = self.client.post('/api/quotes/', VALID_PAYLOAD)
        self.assertEqual(response.status_code, status.HTTP_429_TOO_MANY_REQUESTS)
        # The throttled request must not have persisted a row.
        self.assertEqual(QuoteRequest.objects.count(), 5)


class QuoteInboxTests(APITestCase):
    def setUp(self):
        cache.clear()
        self.staff = User.objects.create_user('staffuser', password='pass', is_staff=True)
        self.quote = QuoteRequest.objects.create(**VALID_PAYLOAD)

    def test_anonymous_cannot_list(self):
        response = self.client.get('/api/quotes/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_anonymous_cannot_delete(self):
        response = self.client.delete(f'/api/quotes/{self.quote.id}/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_staff_can_list_and_delete(self):
        self.client.force_authenticate(self.staff)

        listing = self.client.get('/api/quotes/')
        self.assertEqual(listing.status_code, status.HTTP_200_OK)
        self.assertEqual(listing.data['count'], 1)

        delete = self.client.delete(f'/api/quotes/{self.quote.id}/')
        self.assertEqual(delete.status_code, status.HTTP_204_NO_CONTENT)

    def test_staff_inbox_reads_are_not_throttled(self):
        # The 5/hour cap applies to the public `create` action only — it
        # would otherwise also cap the admin inbox at five reads an hour.
        self.client.force_authenticate(self.staff)
        for _ in range(8):
            response = self.client.get('/api/quotes/')
            self.assertEqual(response.status_code, status.HTTP_200_OK)
