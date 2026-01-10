from django.urls import path
from .views_manager import UsersListView, ApproveUserView, UserDeleteView, SetUserRoleView
from .permissions import IsManagerOrAdmin, IsAdmin

urlpatterns = [
    path("users/", UsersListView.as_view(), name="users_list"),
    path("users/<int:user_id>/approve/", ApproveUserView.as_view(), name="approve_user"),
    path("users/<int:user_id>/role/", SetUserRoleView.as_view(), name="set_user_role"),
    path("users/<int:user_id>/", UserDeleteView.as_view(), name="delete_user"),
]