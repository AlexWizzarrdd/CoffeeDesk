from rest_framework.permissions import BasePermission

class IsManagerOrAdmin(BasePermission):
    def has_permission(self, request, view):
        u = request.user
        return bool(u and u.is_authenticated and u.role in ("manager", "admin"))