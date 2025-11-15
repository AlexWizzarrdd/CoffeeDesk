from django.urls import path
from .views_manager import (
    UsersListView,
    UserApproveView,
    UserRoleUpdateView,
)

urlpatterns = [
    path("users/", UsersListView.as_view(), name="users_list"),
    path("users/<int:pk>/approve/", UserApproveView.as_view(), name="user_approve"),
    path("users/<int:pk>/role/", UserRoleUpdateView.as_view(), name="user_role_update"),
]