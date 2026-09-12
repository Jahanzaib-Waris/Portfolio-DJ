from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase

from .models import SiteBranding, SiteTheme


class BrandingTests(APITestCase):
    def setUp(self):
        self.staff = User.objects.create_user('staffuser', password='pass', is_staff=True)

    def test_get_auto_creates_with_defaults(self):
        self.assertEqual(SiteBranding.objects.count(), 0)
        response = self.client.get('/api/settings/branding/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['site_name'], 'Portfolio')
        self.assertEqual(SiteBranding.objects.count(), 1)

    def test_anonymous_cannot_update(self):
        response = self.client.patch('/api/settings/branding/', {'site_name': 'Hacked'})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_staff_can_update(self):
        self.client.force_authenticate(self.staff)
        response = self.client.patch('/api/settings/branding/', {'site_name': 'My Portfolio'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['site_name'], 'My Portfolio')

    def test_only_one_row_ever_exists(self):
        self.client.get('/api/settings/branding/')
        self.client.get('/api/settings/branding/')
        self.assertEqual(SiteBranding.objects.count(), 1)


class ThemeTests(APITestCase):
    def setUp(self):
        self.staff = User.objects.create_user('staffuser', password='pass', is_staff=True)

    def test_get_returns_sane_defaults(self):
        response = self.client.get('/api/settings/theme/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['radius_scale'], 'soft')
        self.assertEqual(response.data['button_style'], 'solid')

    def test_anonymous_cannot_update(self):
        response = self.client.patch('/api/settings/theme/', {'color_accent': '#ff0000'})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_staff_can_update_colors_and_variants(self):
        self.client.force_authenticate(self.staff)
        response = self.client.patch('/api/settings/theme/', {
            'color_accent': '#8957e5',
            'button_style': 'outline',
            'card_style': 'accent',
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['color_accent'], '#8957e5')
        self.assertEqual(response.data['button_style'], 'outline')

    def test_invalid_hex_color_rejected(self):
        self.client.force_authenticate(self.staff)
        response = self.client.patch('/api/settings/theme/', {'color_accent': 'not-a-color'})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('color_accent', response.data)

    def test_invalid_choice_rejected(self):
        self.client.force_authenticate(self.staff)
        response = self.client.patch('/api/settings/theme/', {'button_style': 'glowing'})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('button_style', response.data)
