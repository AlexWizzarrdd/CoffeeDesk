from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/", include("users.urls")),
    path("api/manager/", include("users.urls_manager")),
    path("api/schedule/", include("schedule.urls")),
    path("api/notifications/", include("notifications.urls")),

]