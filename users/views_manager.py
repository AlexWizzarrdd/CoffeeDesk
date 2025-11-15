from rest_framework import generics, permissions
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from rest_framework.views import APIView
from .serializers import MeSerializer

User = get_user_model()


# Permission: только менеджер или админ
class IsManager(permissions.BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and
            request.user.role in ["manager", "admin"]
        )


# 1. Список всех пользователей
class UsersListView(generics.ListAPIView):
    queryset = User.objects.all()
    serializer_class = MeSerializer
    permission_classes = [permissions.IsAuthenticated, IsManager]


# 2. Подтверждение пользователя
class UserApproveView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsManager]

    def post(self, request, pk):
        try:
            user = User.objects.get(id=pk)
        except User.DoesNotExist:
            return Response({"error": "Пользователь не найден"}, status=404)

        user.is_approved = True
        user.save()
        return Response({"status": "Пользователь подтверждён"})


# 3. Назначение роли
class UserRoleUpdateView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsManager]

    def post(self, request, pk):
        role = request.data.get("role")

        if role not in ["employee", "manager", "admin"]:
            return Response({"error": "Неверная роль"}, status=400)

        try:
            user = User.objects.get(id=pk)
        except User.DoesNotExist:
            return Response({"error": "Пользователь не найден"}, status=404)

        user.role = role
        user.save()
        return Response({"status": "Роль обновлена", "role": role})