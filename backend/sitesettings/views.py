from rest_framework.generics import RetrieveUpdateAPIView

from config.permissions import IsAdminUserOrReadOnly

from .models import SiteBranding, SiteTheme
from .serializers import SiteBrandingSerializer, SiteThemeSerializer


class BrandingView(RetrieveUpdateAPIView):
    """The single SiteBranding row: public GET, staff-only PATCH/PUT.

    Unlike Profile, this auto-creates its row on first access rather than
    404ing — the public site needs branding (site name, favicon) on every
    page load, so there's no meaningful "not configured yet" state to show.
    """

    serializer_class = SiteBrandingSerializer
    permission_classes = [IsAdminUserOrReadOnly]

    def get_object(self):
        obj, _ = SiteBranding.objects.get_or_create(pk=1)
        return obj


class ThemeView(RetrieveUpdateAPIView):
    """The single SiteTheme row: public GET (the public site applies it),
    staff-only PATCH/PUT. Same auto-create-on-first-access pattern as
    branding — a theme with sane defaults always exists."""

    serializer_class = SiteThemeSerializer
    permission_classes = [IsAdminUserOrReadOnly]

    def get_object(self):
        obj, created = SiteTheme.objects.get_or_create(pk=1)
        if not created and obj.color_accent == '#238636':
            obj.color_void = '#0A0C16'
            obj.color_panel = '#11142A'
            obj.color_panel_edge = '#232848'
            obj.color_neon_blue = '#38BDF8'
            obj.color_neon_indigo = '#7C6CFF'
            obj.color_accent = '#6D5AF6'
            obj.color_status_red = '#FCA5A5'
            obj.font_display = 'Manrope'
            obj.font_mono = 'Fira Code'
            obj.save()
        return obj
