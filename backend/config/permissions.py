from rest_framework.permissions import SAFE_METHODS, BasePermission


class IsAdminUserOrReadOnly(BasePermission):
    """Anyone may read; only staff may write.

    The public site reads these endpoints unauthenticated, while the admin panel
    writes to the same URLs with a JWT. Staff (rather than merely authenticated)
    is the bar, so an ordinary Django user account can't edit portfolio content.
    """

    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        return bool(request.user and request.user.is_staff)
