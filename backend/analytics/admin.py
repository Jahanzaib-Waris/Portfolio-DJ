from django.contrib import admin

from .models import PageView


@admin.register(PageView)
class PageViewAdmin(admin.ModelAdmin):
    list_display = ('path', 'referrer', 'is_blog_post', 'created_at')
    list_filter = ('is_blog_post',)
    date_hierarchy = 'created_at'
    search_fields = ('path', 'referrer', 'slug')

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False
