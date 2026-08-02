from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer


class AdminTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Issues tokens only to staff accounts.

    These tokens exist purely to drive the admin panel, so a non-staff user
    getting one would be a token that can't do anything except reveal that the
    credentials were valid. Rejecting them at issue time keeps that surface shut
    and gives the panel a clear error to show.
    """

    def validate(self, attrs):
        data = super().validate(attrs)

        if not self.user.is_staff:
            raise serializers.ValidationError(
                'This account does not have admin access.'
            )

        data['user'] = CurrentUserSerializer(self.user).data
        return data


class CurrentUserSerializer(serializers.Serializer):
    """The subset of the user record the admin panel actually renders."""

    id = serializers.IntegerField(read_only=True)
    username = serializers.CharField(read_only=True)
    email = serializers.EmailField(read_only=True)
    is_staff = serializers.BooleanField(read_only=True)
    is_superuser = serializers.BooleanField(read_only=True)
