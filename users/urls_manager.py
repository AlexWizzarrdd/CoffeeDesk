from django.urls import path
from .views_manager import (
    UsersListView,
    ApproveUserView,
    UserDeleteView,
    SetUserRoleView,
    SetUserMedicalExamView,
)

urlpatterns = [
    path("users/", UsersListView.as_view(), name="users_list"),
    path("users/<int:user_id>/approve/", ApproveUserView.as_view(), name="approve_user"),
    path("users/<int:user_id>/role/", SetUserRoleView.as_view(), name="set_user_role"),
    path("users/<int:user_id>/medical-exam/", SetUserMedicalExamView.as_view(), name="set_user_medical_exam"),
    path("users/<int:user_id>/", UserDeleteView.as_view(), name="delete_user"),
]