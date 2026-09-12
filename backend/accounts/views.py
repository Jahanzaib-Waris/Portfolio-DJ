from rest_framework import status
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView

from .serializers import AdminTokenObtainPairSerializer, ChangePasswordSerializer, CurrentUserSerializer


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


class ChangePasswordView(APIView):
    """POST current_password + new_password -> sets the new password.

    Staff only, same as everything else in the panel. Validation errors
    (wrong current password, weak new password) land on their field via the
    same shape the Blog/Project editors already expect.
    """

    permission_classes = [IsAdminUser]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)

        user = request.user
        user.set_password(serializer.validated_data['new_password'])
        user.save(update_fields=['password'])

        return Response(status=status.HTTP_204_NO_CONTENT)
