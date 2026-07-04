from django.core.exceptions import ValidationError
from django.db import models


class Profile(models.Model):
    """Singleton-style model holding the developer's public profile info.

    Only one row is expected to exist; it's managed from the Django admin.
    """

    name = models.CharField(max_length=120)
    tagline = models.CharField(max_length=200, blank=True)
    bio = models.TextField(blank=True)
    photo = models.ImageField(upload_to='profile/', blank=True, null=True)
    resume = models.FileField(upload_to='resume/', blank=True, null=True)
    email = models.EmailField(blank=True)
    github_url = models.URLField(blank=True)
    linkedin_url = models.URLField(blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Profile'
        verbose_name_plural = 'Profile'

    def __str__(self):
        return self.name or 'Profile'

    def clean(self):
        if not self.pk and Profile.objects.exists():
            raise ValidationError('Only one Profile instance is allowed. Edit the existing one instead.')


class Skill(models.Model):
    name = models.CharField(max_length=80)
    description = models.CharField(
        max_length=200, blank=True,
        help_text='Short blurb, e.g. "REST APIs, ORM, admin-driven CMS"',
    )
    display_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['display_order', 'name']

    def __str__(self):
        return self.name
