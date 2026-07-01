from django.db import models


class Project(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    tech_stack = models.CharField(
        max_length=300, blank=True,
        help_text='Comma-separated tags, e.g. "Django, React, Tailwind"',
    )
    thumbnail = models.ImageField(upload_to='projects/thumbnails/', blank=True, null=True)
    repo_url = models.URLField(blank=True)
    live_url = models.URLField(blank=True)
    display_order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['display_order', '-created_at']

    def __str__(self):
        return self.title

    @property
    def tech_stack_list(self):
        return [tag.strip() for tag in self.tech_stack.split(',') if tag.strip()]
