from rest_framework import serializers

from .models import Project


class ProjectSerializer(serializers.ModelSerializer):
    tech_stack_list = serializers.ReadOnlyField()

    class Meta:
        model = Project
        fields = [
            'id', 'title', 'description', 'tech_stack', 'tech_stack_list',
            'thumbnail', 'repo_url', 'live_url', 'display_order', 'created_at',
        ]
