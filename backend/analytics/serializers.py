from rest_framework import serializers


class PageViewCreateSerializer(serializers.Serializer):
    """Input for the public tracking beacon — everything else (session key,
    is_blog_post/slug, timestamp) is derived server-side in the view."""

    path = serializers.CharField(max_length=255)
    referrer = serializers.CharField(max_length=255, required=False, allow_blank=True, default='')
