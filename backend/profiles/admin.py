from django.contrib import admin

from .models import Profile


@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ('name', 'tagline', 'email', 'updated_at')

    def has_add_permission(self, request):
        if Profile.objects.exists():
            return False
        return super().has_add_permission(request)
