from rest_framework import mixins, viewsets
from rest_framework.permissions import BasePermission
from rest_framework.throttling import ScopedRateThrottle

from .models import QuoteRequest
from .serializers import QuoteRequestSerializer


class CreatePublicReadStaff(BasePermission):
    """Anyone may submit the form; only staff may read or delete submissions.

    Inverted relative to the rest of the API, where reads are the public part —
    here the submissions are private and the write is what's exposed.
    """

    def has_permission(self, request, view):
        if view.action == 'create':
            return True
        return bool(request.user and request.user.is_staff)


class QuoteRequestViewSet(
    mixins.CreateModelMixin,
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    """The Request a Quote form, plus the admin panel's inbox for it."""

    queryset = QuoteRequest.objects.all()
    serializer_class = QuoteRequestSerializer
    permission_classes = [CreatePublicReadStaff]
    throttle_scope = 'quotes'

    def get_throttles(self):
        # Throttle the public submission only. Applying it viewset-wide would
        # cap the admin panel's own inbox at 5 requests an hour.
        if self.action == 'create':
            return [ScopedRateThrottle()]
        return []
