from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    # Kept mounted deliberately: it's the fallback whenever the custom admin
    # panel has a bug, and it costs nothing to leave available.
    path('admin/', admin.site.urls),
    path('api/auth/', include('accounts.urls')),
    path('api/profile/', include('profiles.urls')),
    path('api/blog/', include('blog.urls')),
    path('api/projects/', include('projects.urls')),
    path('api/quotes/', include('quotes.urls')),
    path('api/settings/', include('sitesettings.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
