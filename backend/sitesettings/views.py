from rest_framework.generics import RetrieveUpdateAPIView

from config.permissions import IsAdminUserOrReadOnly

from .models import SiteBranding
from .serializers import SiteBrandingSerializer


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
