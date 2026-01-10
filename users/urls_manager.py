from django.urls import path
from .views_manager import UsersListView, ApproveUserView

urlpatterns = [
    path("users/", UsersListView.as_view(), name="users_list"),
    path("users/<int:user_id>/approve/", ApproveUserView.as_view(), name="approve_user"),
]