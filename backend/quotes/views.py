from rest_framework import mixins, viewsets

from .models import QuoteRequest
from .serializers import QuoteRequestSerializer


class QuoteRequestViewSet(mixins.CreateModelMixin, viewsets.GenericViewSet):
    queryset = QuoteRequest.objects.all()
    serializer_class = QuoteRequestSerializer
