from django.db import models


class PageView(models.Model):
    """One recorded page view from the public site.

    `session_key` is a same-day hash of (IP, User-Agent) — enough to dedupe
    repeat views from one visitor into a rough "unique visitors" count
    without storing anything identifying or needing cookie consent.
    """

    path = models.CharField(max_length=255)
    referrer = models.CharField(max_length=255, blank=True)
    session_key = models.CharField(max_length=64)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=['created_at']),
            models.Index(fields=['path']),
        ]

    def __str__(self):
        return f'{self.path} ({self.created_at:%Y-%m-%d %H:%M})'
