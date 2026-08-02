from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import ProfileView, ResumeDownloadView, SkillViewSet

router = DefaultRouter()
router.register('skills', SkillViewSet, basename='skill')

urlpatterns = [
    path('', ProfileView.as_view(), name='profile-detail'),
    path('resume/', ResumeDownloadView.as_view(), name='profile-resume'),
    path('', include(router.urls)),
]
