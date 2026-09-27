from rest_framework import serializers

from .models import QuoteRequest


class QuoteRequestSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(source='name', required=False)
    details = serializers.CharField(source='project_details', required=False)
    company_website = serializers.CharField(required=False, write_only=True, allow_blank=True, default='')

    class Meta:
        model = QuoteRequest
        fields = [
            'id',
            'name',
            'full_name',
            'email',
            'service',
            'backend',
            'budget',
            'timeline',
            'project_link',
            'project_details',
            'details',
            'company_website',
            'submitted_at',
        ]
        read_only_fields = ['id', 'submitted_at']
        extra_kwargs = {
            'name': {'required': False},
            'project_details': {'required': False},
            'email': {'error_messages': {'required': 'I need an email address to reply to you.', 'invalid': 'I need a valid email address to reply to you.'}},
        }

    def validate(self, attrs):
        # Honeypot: reject bots silently or with validation error
        if attrs.get('company_website'):
            raise serializers.ValidationError({'company_website': 'Spam detected.'})

        # Name normalization & required check
        name = attrs.get('name') or attrs.get('full_name')
        if not name or not str(name).strip():
            raise serializers.ValidationError({'name': 'Please tell me your name.'})
        attrs['name'] = str(name).strip()

        # Details normalization & required check
        details = attrs.get('project_details') or attrs.get('details')
        if not details or not str(details).strip():
            raise serializers.ValidationError({'project_details': 'A short description helps me understand what you need.'})
        attrs['project_details'] = str(details).strip()

        return attrs

    def create(self, validated_data):
        validated_data.pop('company_website', None)
        return super().create(validated_data)
