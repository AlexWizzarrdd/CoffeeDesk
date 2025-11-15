from rest_framework import generics, permissions
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import PhoneTokenObtainPairSerializer, UserApproveSerializer


from .serializers import RegisterSerializer, MeSerializer
from django.contrib.auth import get_user_model

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