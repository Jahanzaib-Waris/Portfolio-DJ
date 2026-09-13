from django.core.files.storage import default_storage
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from config.permissions import IsAdminUserOrReadOnly

from .models import BlogPost
from .serializers import BlogPostDetailSerializer, BlogPostListSerializer


class BlogPostViewSet(viewsets.ModelViewSet):
    lookup_field = 'slug'
    permission_classes = [IsAdminUserOrReadOnly]

    @action(detail=False, methods=['post'])
    def upload_image(self, request):
        """Inline image upload for the rich-text editor's content body.

        Distinct from `cover_image` (one per post, its own model field) — a
        post body can hold any number of these. `detail=False` means DRF's
        router places this before the `<slug>` detail route, so "upload-image"
        is never mistaken for a slug lookup (the same class of ordering issue
        `profiles/urls.py` has, avoided here for free).
        """
        image = request.FILES.get('image')
        if not image:
            return Response({'detail': 'No image provided.'}, status=status.HTTP_400_BAD_REQUEST)

        path = default_storage.save(f'blog/content/{image.name}', image)
        # default_storage.url() returns a relative path locally but an already-absolute
        # (presigned) URL on S3/Supabase Storage — build_absolute_uri is a safe no-op
        # on an already-absolute URL, so this works unconditionally either way.
        url = request.build_absolute_uri(default_storage.url(path))
        return Response({'url': url}, status=status.HTTP_201_CREATED)

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
