from rest_framework import mixins, viewsets
from rest_framework.throttling import ScopedRateThrottle

from .models import QuoteRequest
from .serializers import QuoteRequestSerializer


class QuoteRequestViewSet(mixins.CreateModelMixin, viewsets.GenericViewSet):
    """Public, unauthenticated create-only endpoint for the Request a Quote form.

    Throttled per client IP so a bot can't flood the admin with submissions; the
    rate itself is set by the 'quotes' scope in REST_FRAMEWORK.DEFAULT_THROTTLE_RATES.
    """

    queryset = QuoteRequest.objects.all()
    serializer_class = QuoteRequestSerializer
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'quotes'
