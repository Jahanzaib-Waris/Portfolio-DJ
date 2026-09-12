from rest_framework import serializers

from .models import SiteBranding, SiteTheme


class SiteBrandingSerializer(serializers.ModelSerializer):
    class Meta:
        model = SiteBranding
        fields = ['id', 'site_name', 'logo', 'favicon', 'updated_at']


class SiteThemeSerializer(serializers.ModelSerializer):
    class Meta:
        model = SiteTheme
        fields = [
            'id',
            'color_void', 'color_panel', 'color_panel_edge', 'color_neon_blue',
            'color_neon_indigo', 'color_accent', 'color_status_green', 'color_status_red',
            'font_display', 'font_mono',
            'radius_scale', 'shadow_intensity', 'button_style', 'card_style',
            'updated_at',
        ]
