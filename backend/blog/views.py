from rest_framework import viewsets

from config.permissions import IsAdminUserOrReadOnly

from .models import BlogPost
from .serializers import BlogPostDetailSerializer, BlogPostListSerializer


class BlogPostViewSet(viewsets.ModelViewSet):
    lookup_field = 'slug'
    permission_classes = [IsAdminUserOrReadOnly]

    def get_queryset(self):
        """Drafts are visible to staff only.

        The admin panel lists and edits unpublished posts through this same
        endpoint, so the filter has to depend on who's asking rather than being
        baked into a static queryset.
        """
        user = self.request.user
        if user.is_authenticated and user.is_staff:
            return BlogPost.objects.all()
        return BlogPost.objects.filter(is_published=True)

    def get_serializer_class(self):
        # Only the list view gets the trimmed serializer; retrieve and every
        # write action need the full field set, `content` in particular.
        if self.action == 'list':
            return BlogPostListSerializer
        return BlogPostDetailSerializer
