from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/", include("users.urls")),
    path("api/manager/", include("users.urls_manager")),
    path("api/schedule/", include("schedule.urls")),
    path("api/notifications/", include("notifications.urls")),
    path("api/tasks/", include("tasks.urls")),
    path("api/shift-requests/", include("shift_requests.urls")),
]