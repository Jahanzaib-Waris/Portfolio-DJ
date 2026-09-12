from django.contrib.auth.password_validation import validate_password
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


class ChangePasswordSerializer(serializers.Serializer):
    """Self-service password change: current + new, no email flow.

    Single-admin site, so a full forgot-password-via-email flow was judged
    unnecessary — this covers the "Settings -> Account" screen instead.
    """

    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True)

    def validate_current_password(self, value):
        if not self.context['request'].user.check_password(value):
            raise serializers.ValidationError('Current password is incorrect.')
        return value

    def validate_new_password(self, value):
        validate_password(value, user=self.context['request'].user)
        return value
