from rest_framework.permissions import BasePermission


class IsManagerOrAdmin(BasePermission):
    """
    Доступ только для manager и admin
    """

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        return getattr(user, "role", None) in ("manager", "admin")