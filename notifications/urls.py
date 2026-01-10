from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import NotificationViewSet
from .views_sse import notifications_stream

router = DefaultRouter()
router.register(r"", NotificationViewSet, basename="notifications")

urlpatterns = [
    # SSE — отдельно
    path("stream/", notifications_stream, name="notifications_stream"),

    # REST API — через router
    path("", include(router.urls)),
]