from django.db import models


class QuoteRequest(models.Model):
    name = models.CharField(max_length=120)
    email = models.EmailField()
    service = models.CharField(max_length=80, blank=True, default='')
    backend = models.CharField(max_length=80, blank=True, default='')
    budget = models.CharField(max_length=80, blank=True, default='')
    timeline = models.CharField(max_length=80, blank=True, default='')
    project_link = models.URLField(blank=True, default='')
    project_details = models.TextField()
    submitted_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-submitted_at']

    def __str__(self):
        service_label = f' [{self.service}]' if self.service else ''
        return f'{self.name}{service_label} ({self.submitted_at:%Y-%m-%d})'
