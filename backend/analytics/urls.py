from django.urls import path

from .views import AnalyticsSummaryView, TrackView

urlpatterns = [
    path('track/', TrackView.as_view(), name='analytics-track'),
    path('summary/', AnalyticsSummaryView.as_view(), name='analytics-summary'),
]
