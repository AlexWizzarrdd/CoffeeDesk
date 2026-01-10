from django.contrib.auth import get_user_model
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .serializers import MeSerializer, UserApproveSerializer
from .permissions import IsManagerOrAdmin

User = get_user_model()


class UsersListView(generics.ListAPIView):
    queryset = User.objects.all()
    serializer_class = MeSerializer
    permission_classes = [IsAuthenticated, IsManagerOrAdmin]


class ApproveUserView(generics.UpdateAPIView):
    """
    Обновление флагов пользователя менеджером/админом.

    Логика:
    - если PATCH содержит is_approved=True -> автоматически is_active=True
    - если PATCH содержит is_approved=False -> автоматически is_active=False
    - если is_approved НЕ передавали -> is_active не трогаем (можно активировать отдельно)
    """
    queryset = User.objects.all()
    serializer_class = UserApproveSerializer
    permission_classes = [IsAuthenticated, IsManagerOrAdmin]
    lookup_url_kwarg = "user_id"
    http_method_names = ["patch"]

    def perform_update(self, serializer):
        incoming_fields = set(getattr(serializer, "validated_data", {}).keys())
        user = serializer.save()

        # Авто-правило только если реально меняли is_approved
        if "is_approved" in incoming_fields:
            user.is_active = bool(user.is_approved)
            user.save(update_fields=["is_active"])


class UserDeleteView(generics.DestroyAPIView):
    queryset = User.objects.all()
    permission_classes = [IsAuthenticated, IsManagerOrAdmin]
    lookup_url_kwarg = "user_id"

    def destroy(self, request, *args, **kwargs):
        user_to_delete = self.get_object()
        requester = request.user

        # 1) нельзя удалить себя
        if user_to_delete.id == requester.id:
            return Response(
                {"detail": "Нельзя удалить свой собственный аккаунт"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # 2) manager может удалять только employee
        if requester.role == "manager" and user_to_delete.role != "employee":
            return Response(
                {"detail": "Менеджер может удалять только сотрудников (employee)"},
                status=status.HTTP_403_FORBIDDEN,
            )

        return super().destroy(request, *args, **kwargs)