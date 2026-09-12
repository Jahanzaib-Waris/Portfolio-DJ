from django.contrib import admin

from .models import SiteBranding, SiteTheme


@admin.register(SiteBranding)
class SiteBrandingAdmin(admin.ModelAdmin):
    list_display = ('site_name', 'updated_at')

    def has_add_permission(self, request):
        if SiteBranding.objects.exists():
            return False
        return super().has_add_permission(request)


@admin.register(SiteTheme)
class SiteThemeAdmin(admin.ModelAdmin):
    list_display = ('color_accent', 'radius_scale', 'shadow_intensity', 'updated_at')

    def has_add_permission(self, request):
        if SiteTheme.objects.exists():
            return False
        return super().has_add_permission(request)
