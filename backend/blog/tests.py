from django.contrib.auth.models import User
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from .models import BlogPost


def make_post(**kwargs):
    defaults = {
        'title': 'A post',
        'slug': 'a-post',
        'content': 'body',
        'published_date': timezone.now().date(),
        'is_published': True,
    }
    defaults.update(kwargs)
    return BlogPost.objects.create(**defaults)


class BlogPostReadTests(APITestCase):
    def setUp(self):
        self.staff = User.objects.create_user('staffuser', password='pass', is_staff=True)

    def test_anonymous_list_excludes_drafts(self):
        make_post(slug='published', is_published=True)
        make_post(slug='draft', is_published=False)

        response = self.client.get('/api/blog/posts/')
        slugs = [row['slug'] for row in response.data['results']]
        self.assertEqual(slugs, ['published'])

    def test_staff_list_includes_drafts(self):
        make_post(slug='published', is_published=True)
        make_post(slug='draft', is_published=False)

        self.client.force_authenticate(self.staff)
        response = self.client.get('/api/blog/posts/')
        slugs = {row['slug'] for row in response.data['results']}
        self.assertEqual(slugs, {'published', 'draft'})

    def test_anonymous_draft_detail_is_404_not_403(self):
        make_post(slug='draft', is_published=False)
        response = self.client.get('/api/blog/posts/draft/')
        # 404, not 403 — doesn't confirm to an anonymous caller that the post exists.
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_staff_can_read_draft_detail(self):
        make_post(slug='draft', is_published=False)
        self.client.force_authenticate(self.staff)
        response = self.client.get('/api/blog/posts/draft/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_list_serializer_omits_content(self):
        make_post(content='full markdown body')
        response = self.client.get('/api/blog/posts/')
        self.assertNotIn('content', response.data['results'][0])


class BlogPostWriteTests(APITestCase):
    def setUp(self):
        self.staff = User.objects.create_user('staffuser', password='pass', is_staff=True)

    def test_anonymous_cannot_create(self):
        response = self.client.post('/api/blog/posts/', {
            'title': 'New', 'slug': 'new', 'content': 'x',
            'published_date': timezone.now().date(),
        })
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_staff_can_create(self):
        self.client.force_authenticate(self.staff)
        response = self.client.post('/api/blog/posts/', {
            'title': 'New', 'slug': 'new', 'content': 'x',
            'published_date': timezone.now().date(),
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(BlogPost.objects.count(), 1)

    def test_duplicate_slug_rejected(self):
        make_post(slug='taken')
        self.client.force_authenticate(self.staff)
        response = self.client.post('/api/blog/posts/', {
            'title': 'New', 'slug': 'taken', 'content': 'x',
            'published_date': timezone.now().date(),
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('slug', response.data)

    def test_anonymous_cannot_delete(self):
        post = make_post()
        response = self.client.delete(f'/api/blog/posts/{post.slug}/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertTrue(BlogPost.objects.filter(pk=post.pk).exists())

    def test_staff_can_delete(self):
        post = make_post()
        self.client.force_authenticate(self.staff)
        response = self.client.delete(f'/api/blog/posts/{post.slug}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(BlogPost.objects.filter(pk=post.pk).exists())
