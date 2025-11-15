from rest_framework import permissions


class IsManager(permissions.BasePermission):
    """
    Разрешает доступ только менеджерам и администраторам.
    """

    def has_permission(self, request, view):
        user = request.user

        return bool(
            user
            and user.is_authenticated
            and (user.role == "manager" or user.role == "admin")
        )