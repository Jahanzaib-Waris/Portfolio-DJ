from django.core.exceptions import ValidationError
from django.db import models


class SiteBranding(models.Model):
    """Singleton holding the site-wide brand identity: name, logo, favicon.

    Distinct from `profiles.Profile` (the portfolio owner's personal info used
    in the hero/nav name) — this is the site chrome: browser tab title, the
    control panel header, and (once wired up) a logo image separate from the
    owner's personal photo.
    """

    site_name = models.CharField(max_length=80, default='Portfolio')
    logo = models.ImageField(upload_to='branding/', blank=True, null=True)
    favicon = models.ImageField(upload_to='branding/', blank=True, null=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Site branding'
        verbose_name_plural = 'Site branding'

    def __str__(self):
        return self.site_name

    def clean(self):
        if not self.pk and SiteBranding.objects.exists():
            raise ValidationError('Only one Site branding instance is allowed. Edit the existing one instead.')
