from rest_framework import serializers

from .models import Profile, Skill


class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = [
            'id', 'name', 'tagline', 'bio', 'photo', 'resume',
            'email', 'github_url', 'linkedin_url', 'updated_at',
        ]


class SkillSerializer(serializers.ModelSerializer):
    class Meta:
        model = Skill
        fields = ['id', 'name', 'description', 'display_order']
