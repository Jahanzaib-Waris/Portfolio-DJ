from django.urls import path

from .views import ProfileView, ResumeDownloadView

urlpatterns = [
    path('', ProfileView.as_view(), name='profile-detail'),
    path('resume/', ResumeDownloadView.as_view(), name='profile-resume'),
]
