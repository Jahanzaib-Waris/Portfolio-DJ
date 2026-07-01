from rest_framework.routers import DefaultRouter

from .views import QuoteRequestViewSet

router = DefaultRouter()
router.register('', QuoteRequestViewSet, basename='quoterequest')

urlpatterns = router.urls
