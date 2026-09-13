from django.contrib import admin

from .models import PageView


@admin.register(PageView)
class PageViewAdmin(admin.ModelAdmin):
    list_display = ('path', 'referrer', 'created_at')
    date_hierarchy = 'created_at'
    search_fields = ('path', 'referrer')

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False
