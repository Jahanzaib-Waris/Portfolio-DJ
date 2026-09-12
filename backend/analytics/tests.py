from django.contrib.auth.models import User
from django.core.cache import cache
from rest_framework import status
from rest_framework.test import APITestCase

from blog.models import BlogPost
from .models import PageView


class TrackViewTests(APITestCase):
    def setUp(self):
        cache.clear()

    def test_anonymous_can_track_a_view(self):
        response = self.client.post('/api/analytics/track/', {'path': '/', 'referrer': ''})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(PageView.objects.count(), 1)

    def test_blog_post_path_is_classified(self):
        self.client.post('/api/analytics/track/', {'path': '/blogs/my-post', 'referrer': ''})
        view = PageView.objects.get()
        self.assertTrue(view.is_blog_post)
        self.assertEqual(view.slug, 'my-post')

    def test_non_blog_path_is_not_classified(self):
        self.client.post('/api/analytics/track/', {'path': '/projects', 'referrer': ''})
        view = PageView.objects.get()
        self.assertFalse(view.is_blog_post)
        self.assertEqual(view.slug, '')

    def test_missing_path_is_rejected(self):
        response = self.client.post('/api/analytics/track/', {'referrer': 'x'})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class AnalyticsSummaryTests(APITestCase):
    def setUp(self):
        cache.clear()
        self.staff = User.objects.create_user('staffuser', password='pass', is_staff=True)

    def test_anonymous_cannot_read_summary(self):
        response = self.client.get('/api/analytics/summary/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_staff_gets_aggregated_totals(self):
        post = BlogPost.objects.create(
            title='Hello', slug='hello', content='x', is_published=True,
        )
        PageView.objects.create(path='/', session_key='a')
        PageView.objects.create(path='/', session_key='a')  # same visitor, second view
        PageView.objects.create(path='/blogs/hello', is_blog_post=True, slug='hello', session_key='b')

        self.client.force_authenticate(self.staff)
        response = self.client.get('/api/analytics/summary/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['total_views'], 3)
        self.assertEqual(response.data['total_visitors'], 2)
        self.assertEqual(response.data['top_posts'][0]['title'], post.title)

    def test_days_param_bounds_the_window(self):
        self.client.force_authenticate(self.staff)
        response = self.client.get('/api/analytics/summary/', {'days': '999999'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertLessEqual(response.data['days'], 365)
