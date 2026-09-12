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
        obj, _ = SiteTheme.objects.get_or_create(pk=1)
        return obj
