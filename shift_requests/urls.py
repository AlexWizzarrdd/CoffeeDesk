from django.urls import include, path
from rest_framework.routers import DefaultRouter
from .views import ShiftChangeRequestViewSet

router = DefaultRouter()
router.register(r"", ShiftChangeRequestViewSet, basename="shift-requests")

urlpatterns = [
    path("", include(router.urls)),
]