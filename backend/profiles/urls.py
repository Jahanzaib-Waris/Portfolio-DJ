from django.urls import path

from .views import ProfileView, ResumeDownloadView, SkillListView

urlpatterns = [
    path('', ProfileView.as_view(), name='profile-detail'),
    path('resume/', ResumeDownloadView.as_view(), name='profile-resume'),
    path('skills/', SkillListView.as_view(), name='profile-skills'),
]
