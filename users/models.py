from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from django.core.validators import RegexValidator
from django.utils import timezone

phone_validator = RegexValidator(
    regex = r'^\+7\d{10}$',
    message = "Введите номер в формате +79991234567"
)

name_validator = RegexValidator(
    regex=r'^[A-Za-zА-Яа-яЁё-]+$',
    message="Поле может содержать только буквы и дефис"
)

class UserManager(BaseUserManager):
    def create_user(self, phone, password=None, **extra_fields):
        if not phone:
            raise ValueError("Phone number is required")

        phone = str(phone).strip()
        extra_fields.setdefault("is_approved", False)
        extra_fields.setdefault("role", "employee")
        user = self.model(phone=phone, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, phone, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_active", True)
        extra_fields.setdefault("role", "admin")
        extra_fields.setdefault("is_approved", True)

        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser must have is_staff=True")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser must have is_superuser=True")

        return self.create_user(phone, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    phone = models.CharField(max_length=12, unique=True, validators=[phone_validator])
    first_name = models.CharField(max_length=150, validators=[name_validator])
    last_name = models.CharField(max_length=150, validators=[name_validator])
    surname = models.CharField(max_length=150, validators=[name_validator])
    medical_exam_recommended_at = models.DateField(
        null=True,
        blank=True,
        verbose_name="Рекомендуемый медосмотр до",
    )

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    # роли (значения храним как коды, отображение — человекочитаемое)
    ROLE_CHOICES = [
        ("employee", "Бариста"),
        ("intern", "Стажёр"),
        ("manager", "Менеджер"),
        ("admin", "Управляющий"),
    ]

    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default="employee")
    is_approved = models.BooleanField(default=False)

    objects = UserManager()

    USERNAME_FIELD = "phone"
    REQUIRED_FIELDS = []

    def clean(self):
        # Normalize and capitalize name fields
        for field in ["first_name", "last_name", "surname"]:
            value = getattr(self, field, "")
            if isinstance(value, str):
                normalized = " ".join(value.split()).strip().capitalize()
                setattr(self, field, normalized)

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return self.phone