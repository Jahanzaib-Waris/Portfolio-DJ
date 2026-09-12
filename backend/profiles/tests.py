from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Profile, Skill


class ProfileTests(APITestCase):
    def setUp(self):
        self.staff = User.objects.create_user('staffuser', password='pass', is_staff=True)

    def test_get_returns_404_before_profile_exists(self):
        response = self.client.get('/api/profile/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_anonymous_cannot_create_profile(self):
        response = self.client.post('/api/profile/', {'name': 'Someone'})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_staff_can_create_profile(self):
        self.client.force_authenticate(self.staff)
        response = self.client.post('/api/profile/', {'name': 'Jahanzaib'})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Profile.objects.count(), 1)

    def test_creating_a_second_profile_is_rejected(self):
        Profile.objects.create(name='Existing')
        self.client.force_authenticate(self.staff)
        response = self.client.post('/api/profile/', {'name': 'Someone else'})
        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)
        self.assertEqual(Profile.objects.count(), 1)

    def test_anyone_can_read_an_existing_profile(self):
        Profile.objects.create(name='Jahanzaib')
        response = self.client.get('/api/profile/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Jahanzaib')

    def test_anonymous_cannot_update_profile(self):
        Profile.objects.create(name='Jahanzaib')
        response = self.client.patch('/api/profile/', {'name': 'Hacked'})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_staff_can_update_profile(self):
        Profile.objects.create(name='Jahanzaib')
        self.client.force_authenticate(self.staff)
        response = self.client.patch('/api/profile/', {'name': 'Updated Name'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Updated Name')


class SkillTests(APITestCase):
    def setUp(self):
        self.staff = User.objects.create_user('staffuser', password='pass', is_staff=True)

    def test_anyone_can_list_skills(self):
        Skill.objects.create(name='Django', display_order=1)
        response = self.client.get('/api/profile/skills/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)

    def test_anonymous_cannot_create_skill(self):
        response = self.client.post('/api/profile/skills/', {'name': 'React'})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_staff_can_create_and_delete_skill(self):
        self.client.force_authenticate(self.staff)
        create = self.client.post('/api/profile/skills/', {'name': 'React', 'display_order': 1})
        self.assertEqual(create.status_code, status.HTTP_201_CREATED)

        skill_id = create.data['id']
        delete = self.client.delete(f'/api/profile/skills/{skill_id}/')
        self.assertEqual(delete.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Skill.objects.count(), 0)

    def test_skills_are_ordered_by_display_order(self):
        Skill.objects.create(name='Second', display_order=2)
        Skill.objects.create(name='First', display_order=1)
        response = self.client.get('/api/profile/skills/')
        names = [row['name'] for row in response.data['results']]
        self.assertEqual(names, ['First', 'Second'])
