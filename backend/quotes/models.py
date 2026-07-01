from django.db import models


class QuoteRequest(models.Model):
    name = models.CharField(max_length=120)
    email = models.EmailField()
    project_details = models.TextField()
    submitted_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-submitted_at']

    def __str__(self):
        return f'{self.name} ({self.submitted_at:%Y-%m-%d})'
