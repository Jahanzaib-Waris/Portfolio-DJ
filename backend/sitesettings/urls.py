from django.urls import path

from .views import BrandingView, ThemeView

urlpatterns = [
    path('branding/', BrandingView.as_view(), name='branding-detail'),
    path('theme/', ThemeView.as_view(), name='theme-detail'),
]
