from datetime import timedelta

from django.db.models import Count
from django.db.models.functions import TruncDate
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAdminUser
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from quotes.models import QuoteRequest

from .models import PageView
from .serializers import PageViewCreateSerializer
from .utils import session_key_for


class TrackView(APIView):
    """Public tracking beacon, fired once per page view from the frontend.

    Throttled the same way the quote form is — a public unauthenticated
    write endpoint needs a cap even though its worst case (a fake pageview
    row) is far less sensitive than a fake quote submission.
    """

    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'analytics'

    def post(self, request):
        serializer = PageViewCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        PageView.objects.create(
            path=serializer.validated_data['path'],
            referrer=serializer.validated_data.get('referrer', ''),
            session_key=session_key_for(request),
        )
        return Response(status=status.HTTP_201_CREATED)


class AnalyticsSummaryView(APIView):
    """Staff-only aggregate stats behind the admin Analytics screen.

    Aggregation happens in the database, not by shipping every row to the
    browser — `?days=` (default 30) bounds the window everything below is
    computed over.
    """

    permission_classes = [IsAdminUser]

    def get(self, request):
        try:
            days = int(request.query_params.get('days', 30))
        except ValueError:
            days = 30
        days = max(1, min(days, 365))
        cutoff = timezone.now() - timedelta(days=days)

        views_qs = PageView.objects.filter(created_at__gte=cutoff)

        total_views = views_qs.count()
        total_visitors = views_qs.values('session_key').distinct().count()

        series = list(
            views_qs.annotate(day=TruncDate('created_at'))
            .values('day')
            .annotate(count=Count('id'))
            .order_by('day')
        )

        top_pages = list(
            views_qs.values('path').annotate(count=Count('id')).order_by('-count')[:10]
        )

        top_referrers = list(
            views_qs.exclude(referrer='')
            .values('referrer')
            .annotate(count=Count('id'))
            .order_by('-count')[:10]
        )

        # Ties traffic analytics to the existing Quotes feature — no new
        # model needed, QuoteRequest.submitted_at already has what's needed
        # for a "leads over time" series alongside page views.
        quotes_trend = list(
            QuoteRequest.objects.filter(submitted_at__gte=cutoff)
            .annotate(day=TruncDate('submitted_at'))
            .values('day')
            .annotate(count=Count('id'))
            .order_by('day')
        )

        return Response({
            'days': days,
            'total_views': total_views,
            'total_visitors': total_visitors,
            'series': series,
            'top_pages': top_pages,
            'top_referrers': top_referrers,
            'quotes_trend': quotes_trend,
        })
