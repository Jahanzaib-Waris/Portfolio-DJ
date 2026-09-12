from django.urls import path
from rest_framework_simplejwt.views import TokenBlacklistView, TokenRefreshView

from .views import AdminTokenObtainPairView, ChangePasswordView, CurrentUserView

urlpatterns = [
    path('token/', AdminTokenObtainPairView.as_view(), name='token-obtain-pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    # Logout: blacklisting the refresh token stops it being exchanged again.
    path('token/blacklist/', TokenBlacklistView.as_view(), name='token-blacklist'),
    path('me/', CurrentUserView.as_view(), name='current-user'),
    path('change-password/', ChangePasswordView.as_view(), name='change-password'),
]
