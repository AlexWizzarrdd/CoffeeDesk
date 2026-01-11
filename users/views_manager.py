from django.contrib.auth import get_user_model
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .serializers import UserMedicalExamSerializer

from .serializers import MeSerializer, UserApproveSerializer, UserRoleSerializer
from .permissions import IsManagerOrAdmin, IsAdmin
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
        if requester.role == "manager" and user_to_delete.role not in ("employee", "intern"):
            return Response(
                {"detail": "Менеджер может удалять только бариста (employee) и стажёров (intern)"},
                status=status.HTTP_403_FORBIDDEN,
            )

        return super().destroy(request, *args, **kwargs)

class SetUserRoleView(generics.UpdateAPIView):
    """
    Управляющий (admin) назначает роль пользователю.
    PATCH: {"role": "intern" | "employee" | "manager" | "admin"}
    """
    queryset = User.objects.all()
    serializer_class = UserRoleSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    lookup_url_kwarg = "user_id"
    http_method_names = ["patch"]

    def patch(self, request, *args, **kwargs):
        target_user = self.get_object()

        # запретим менять роль самому себе (чтобы не “сломать” доступ)
        if target_user.id == request.user.id:
            return Response(
                {"detail": "Нельзя менять роль самому себе"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return super().patch(request, *args, **kwargs)

class SetUserMedicalExamView(generics.UpdateAPIView):
    """
    PATCH /api/manager/users/<user_id>/medical-exam/
    body: {"medical_exam_recommended_at": "2026-01-10"} или null
    """
    queryset = User.objects.all()
    serializer_class = UserMedicalExamSerializer
    permission_classes = [IsAuthenticated, IsManagerOrAdmin]
    lookup_url_kwarg = "user_id"
    http_method_names = ["patch"]