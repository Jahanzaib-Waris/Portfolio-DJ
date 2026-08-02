from django.http import FileResponse, Http404
from rest_framework import status, viewsets
from rest_framework.generics import RetrieveUpdateAPIView
from rest_framework.views import APIView
from rest_framework.response import Response

from config.permissions import IsAdminUserOrReadOnly

from .models import Profile, Skill
from .serializers import ProfileSerializer, SkillSerializer


class ProfileView(RetrieveUpdateAPIView):
    """The single Profile row: public GET, staff-only PATCH/PUT, plus a POST
    to create it the first time.

    Profile is a singleton, so there's no list or detail-by-id here — the URL
    always addresses the one row, and POST is rejected once it exists.
    """

    serializer_class = ProfileSerializer
    permission_classes = [IsAdminUserOrReadOnly]

    def get_object(self):
        obj = Profile.objects.first()
        if obj is None:
            raise Http404('Profile has not been configured yet.')
        return obj

    def post(self, request, *args, **kwargs):
        if Profile.objects.exists():
            return Response(
                {'detail': 'A profile already exists. Use PATCH to update it.'},
                status=status.HTTP_409_CONFLICT,
            )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class SkillViewSet(viewsets.ModelViewSet):
    queryset = Skill.objects.all()
    serializer_class = SkillSerializer
    permission_classes = [IsAdminUserOrReadOnly]


class ResumeDownloadView(APIView):
    def get(self, request):
        profile = Profile.objects.first()
        if profile is None or not profile.resume:
            raise Http404('No resume has been uploaded yet.')
        return FileResponse(profile.resume.open('rb'), as_attachment=True, filename=profile.resume.name.split('/')[-1])
