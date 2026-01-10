from rest_framework import generics, permissions, status
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import get_user_model
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import MeSerializer, UserApproveSerializer
from .permissions import IsManager

User = get_user_model()


class UsersListView(generics.ListAPIView):
    queryset = User.objects.all()
    serializer_class = MeSerializer
    permission_classes = [IsAuthenticated, IsManager]


class ApproveUserView(generics.UpdateAPIView):
    """
    Обновление флагов пользователя менеджером/админом.
    Логика:
    - если менеджер подтверждает (is_approved=True) -> автоматически активируем (is_active=True)
    - если менеджер снимает подтверждение (is_approved=False) -> можно деактивировать (is_active=False)
    - если is_approved не передавали -> is_active не трогаем (можно активировать отдельно)
    """
    queryset = User.objects.all()
    serializer_class = UserApproveSerializer
    permission_classes = [IsAuthenticated, IsManager]
    lookup_url_kwarg = "user_id"
    http_method_names = ["patch"]

    def perform_update(self, serializer):
        # Какие поля реально пришли в PATCH
        incoming_fields = set(getattr(serializer, "validated_data", {}).keys())

        user = serializer.save()

        # ТОЛЬКО если клиент менял is_approved — применяем авто-правило
        if "is_approved" in incoming_fields:
            if user.is_approved:
                user.is_active = True
            else:
                user.is_active = False
            user.save(update_fields=["is_active"])