from rest_framework.permissions import BasePermission


class IsManager(BasePermission):
    """
    Полный доступ:
    - manager (менеджер)
    - admin (управляющий)
    """
    message = "Требуются права менеджера или управляющего"

    def has_permission(self, request, view):
        user = request.user
        return bool(
            user
            and user.is_authenticated
            and getattr(user, "role", None) in ("manager", "admin")
        )


class IsAdmin(BasePermission):
    message = "Требуются права управляющего"

    def has_permission(self, request, view):
        user = request.user
        return bool(
            user
            and user.is_authenticated
            and getattr(user, "role", None) == "admin"
        )


class IsManagerOrAdmin(BasePermission):
    message = "Требуются права менеджера или управляющего"

    def has_permission(self, request, view):
        user = request.user
        return bool(
            user
            and user.is_authenticated
            and getattr(user, "role", None) in ("manager", "admin")
        )

class IsEmployeeOrIntern(BasePermission):
    """
    Ограниченный доступ:
    - employee (бариста)
    - intern (стажёр)
    """
    message = "Требуются права сотрудника"

    def has_permission(self, request, view):
        user = request.user
        return bool(
            user
            and user.is_authenticated
            and getattr(user, "role", None) in ("employee", "intern")
        )