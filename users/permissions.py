from rest_framework.permissions import BasePermission


class IsManager(BasePermission):
    message = "Требуются права менеджера"

    def has_permission(self, request, view):
        user = request.user
        return bool(
            user
            and user.is_authenticated
            and getattr(user, "role", None) in ("manager", "admin")
        )

class IsAdmin(BasePermission):
    message = "Требуются права администратора"

    def has_permission(self, request, view):
        user = request.user
        return bool(
            user
            and user.is_authenticated
            and getattr(user, "role", None) == "admin"
        )

class IsManagerOrAdmin(BasePermission):
    message = "Требуются права менеджера или администратора"

    def has_permission(self, request, view):
        user = request.user
        return bool(
            user
            and user.is_authenticated
            and getattr(user, "role", None) in ("manager", "admin")
        )
