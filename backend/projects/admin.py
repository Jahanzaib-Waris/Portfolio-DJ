from django.contrib import admin

from .models import Project


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ('title', 'display_order', 'repo_url', 'live_url', 'created_at')
    list_editable = ('display_order',)
    search_fields = ('title', 'description', 'tech_stack')
