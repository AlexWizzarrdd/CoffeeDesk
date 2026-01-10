from rest_framework import generics, permissions, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model

from .serializers import (
    RegisterSerializer,
    MeSerializer,
    PhoneTokenObtainPairSerializer,
    UserApproveSerializer,
)

from .views_manager import IsManager

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]


class MeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response(MeSerializer(request.user).data)


class PhoneLoginView(TokenObtainPairView):
    serializer_class = PhoneTokenObtainPairSerializer


class ApproveUserView(generics.UpdateAPIView):
    queryset = User.objects.all()
    serializer_class = UserApproveSerializer
    permission_classes = [IsAuthenticated, IsManager]
    lookup_url_kwarg = "user_id"
    http_method_names = ["patch"]

    def patch(self, request, *args, **kwargs):
        return self.partial_update(request, *args, **kwargs)


class UserDeleteView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, user_id):
        user_to_delete = get_object_or_404(User, id=user_id)
        requester = request.user

        if requester.id == user_to_delete.id:
            return Response(
                {"detail": "Нельзя удалить свой собственный аккаунт"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if requester.role == "manager":
            if user_to_delete.role in ["admin", "manager"]:
                return Response(
                    {"detail": "У вас нет прав удалить этого пользователя"},
                    status=status.HTTP_403_FORBIDDEN
                )

        user_to_delete.delete()
        return Response({"detail": "Пользователь удалён"}, status=status.HTTP_200_OK)


# LogoutView for blacklisting refresh tokens
class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get("refresh")
            if not refresh_token:
                return Response(
                    {"detail": "Refresh token is required"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            token = RefreshToken(refresh_token)
            token.blacklist()

            return Response({"detail": "Logout successful"}, status=status.HTTP_200_OK)
        except Exception:
            return Response(
                {"detail": "Invalid or expired token"},
                status=status.HTTP_400_BAD_REQUEST
            )