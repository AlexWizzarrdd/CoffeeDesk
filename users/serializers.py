from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer




User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ("phone", "password", "first_name", "last_name", "surname")
        extra_kwargs = {
            "first_name": {"required": True},
            "last_name": {"required": True},
            "surname": {"required": True},
        }

    def validate_password(self, value):
        validate_password(value)
        return value

    def create(self, validated_data):
        validated_data["role"] = "employee"
        validated_data["is_approved"] = False
        validated_data["is_active"] = False
        password = validated_data.pop("password")
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class UserListSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "first_name", "last_name", "surname", "phone", "role", "is_approved", "is_active")
        read_only_fields = fields

class MeSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "phone", "first_name", "last_name", "surname", "role", "is_approved", "is_active", "is_staff")
        read_only_fields = fields

class PhoneTokenObtainPairSerializer(TokenObtainPairSerializer):
    username_field = 'phone'

class UserApproveSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "is_approved", "is_active", "role"]
        read_only_fields = ["id"]

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "first_name", "last_name", "surname", "phone", "role", "is_approved", "is_active")
        read_only_fields = fields

class UserRoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["role"]

    def validate_role(self, value):
        # при желании можно запретить ставить admin самому себе/кому-то и т.д.
        return value

# Backward compatibility (если где-то ещё используется старое имя)
SetRoleSerializer = UserRoleSerializer