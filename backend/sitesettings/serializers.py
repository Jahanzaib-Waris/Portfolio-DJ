from rest_framework import serializers

from .models import SiteBranding


class SiteBrandingSerializer(serializers.ModelSerializer):
    class Meta:
        model = SiteBranding
        fields = ['id', 'site_name', 'logo', 'favicon', 'updated_at']
