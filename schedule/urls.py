from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import ShiftViewSet, StatsViewSet

router = DefaultRouter()
router.register(r"shifts", ShiftViewSet, basename="shifts")
router.register(r"stats", StatsViewSet, basename="stats")

urlpatterns = [
    path("", include(router.urls)),
]