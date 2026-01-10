from rest_framework import generics, permissions
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from rest_framework.views import APIView

from .serializers import MeSerializer, UserApproveSerializer
from .permissions import IsManager
from rest_framework.permissions import IsAuthenticated

User = get_user_model()


# 1. Список всех пользователей
class UsersListView(generics.ListAPIView):
    queryset = User.objects.all()
    serializer_class = MeSerializer
    permission_classes = [permissions.IsAuthenticated, IsManager]


# 2. Подтверждение пользователя
class ApproveUserView(generics.UpdateAPIView):
    """Подтверждение пользователя менеджером."""
    queryset = User.objects.all()
    serializer_class = UserApproveSerializer
    permission_classes = [IsAuthenticated, IsManager]
    lookup_url_kwarg = "user_id"

    def perform_update(self, serializer):
        user = serializer.save()

        # Автоматическая активация учётной записи при подтверждении
        if user.is_approved:
            user.is_active = True
        else:
            user.is_active = False

        user.save()


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