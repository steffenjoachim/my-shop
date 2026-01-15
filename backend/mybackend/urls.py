from django.contrib import admin
from django.urls import path, include
from django.views.generic.base import RedirectView
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path("admin/", admin.site.urls),

    # ✅ ALLE Shop-API-Endpunkte HIER:
    path("api/", include("shop.urls")),

    # ✅ Auth-API:
    path("api/auth/", include("authapp.urls")),

    # ✅ Frontend Redirect
    path("", RedirectView.as_view(url="http://localhost:4200")),
]

# Media-Dateien in Development servieren
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
