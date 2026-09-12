from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Project


class ProjectReadTests(APITestCase):
    def test_anyone_can_list_projects(self):
        Project.objects.create(title='One', display_order=1)
        response = self.client.get('/api/projects/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)

    def test_tech_stack_list_splits_and_strips(self):
        project = Project.objects.create(title='One', tech_stack='Django,  React ,Tailwind')
        response = self.client.get(f'/api/projects/{project.id}/')
        self.assertEqual(response.data['tech_stack_list'], ['Django', 'React', 'Tailwind'])

    def test_projects_ordered_by_display_order(self):
        Project.objects.create(title='Second', display_order=2)
        Project.objects.create(title='First', display_order=1)
        response = self.client.get('/api/projects/')
        titles = [row['title'] for row in response.data['results']]
        self.assertEqual(titles, ['First', 'Second'])

    def test_is_featured_defaults_false(self):
        project = Project.objects.create(title='One')
        response = self.client.get(f'/api/projects/{project.id}/')
        self.assertFalse(response.data['is_featured'])


class ProjectWriteTests(APITestCase):
    def setUp(self):
        self.staff = User.objects.create_user('staffuser', password='pass', is_staff=True)

    def test_anonymous_cannot_create(self):
        response = self.client.post('/api/projects/', {'title': 'New'})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_staff_can_create_with_is_featured(self):
        self.client.force_authenticate(self.staff)
        response = self.client.post('/api/projects/', {'title': 'New', 'is_featured': True})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Project.objects.get().is_featured)

    def test_anonymous_cannot_delete(self):
        project = Project.objects.create(title='One')
        response = self.client.delete(f'/api/projects/{project.id}/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertTrue(Project.objects.filter(pk=project.pk).exists())

    def test_staff_can_update_and_delete(self):
        project = Project.objects.create(title='One')
        self.client.force_authenticate(self.staff)

        update = self.client.patch(f'/api/projects/{project.id}/', {'title': 'Renamed'})
        self.assertEqual(update.status_code, status.HTTP_200_OK)
        self.assertEqual(update.data['title'], 'Renamed')

        delete = self.client.delete(f'/api/projects/{project.id}/')
        self.assertEqual(delete.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Project.objects.filter(pk=project.pk).exists())
