from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView

from .serializers import AdminTokenObtainPairSerializer, CurrentUserSerializer


class AdminTokenObtainPairView(TokenObtainPairView):
    """POST username + password -> access + refresh tokens. Staff only."""

    serializer_class = AdminTokenObtainPairSerializer


class CurrentUserView(APIView):
    """Lets the panel confirm a stored token is still good, and who it belongs to.

    Called on app boot: the access token lives in memory only, so after a page
    reload the panel refreshes it and then hits this to rehydrate the session.
    """

    permission_classes = [IsAdminUser]

    def get(self, request):
        return Response(CurrentUserSerializer(request.user).data)
