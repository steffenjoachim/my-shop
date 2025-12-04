from django.contrib import admin
from django.urls import path, include
from django.views.generic.base import RedirectView

urlpatterns = [
    path("admin/", admin.site.urls),

    # ✅ ALLE Shop-API-Endpunkte HIER:
    path("api/", include("shop.urls")),

    # ✅ Auth-API:
    path("api/auth/", include("authapp.urls")),

    # ✅ Frontend Redirect
    path("", RedirectView.as_view(url="http://localhost:4200")),
]
