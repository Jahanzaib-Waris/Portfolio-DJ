from rest_framework import serializers

from .models import QuoteRequest


class QuoteRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuoteRequest
        fields = ['id', 'name', 'email', 'project_details', 'submitted_at']
        read_only_fields = ['id', 'submitted_at']
