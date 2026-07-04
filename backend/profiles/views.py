from django.http import FileResponse, Http404
from rest_framework.generics import ListAPIView, RetrieveAPIView
from rest_framework.views import APIView
from rest_framework.response import Response

from .models import Profile, Skill
from .serializers import ProfileSerializer, SkillSerializer


class ProfileView(RetrieveAPIView):
    serializer_class = ProfileSerializer

    def get_object(self):
        obj = Profile.objects.first()
        if obj is None:
            raise Http404('Profile has not been configured yet.')
        return obj


class SkillListView(ListAPIView):
    queryset = Skill.objects.all()
    serializer_class = SkillSerializer


class ResumeDownloadView(APIView):
    def get(self, request):
        profile = Profile.objects.first()
        if profile is None or not profile.resume:
            raise Http404('No resume has been uploaded yet.')
        return FileResponse(profile.resume.open('rb'), as_attachment=True, filename=profile.resume.name.split('/')[-1])
