from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User


class CustomUserAdmin(UserAdmin):
    model = User
    list_display = ("phone", "first_name", "last_name", "surname", "is_staff")
    search_fields = ("phone", "first_name", "last_name", "surname")
    ordering = ("phone",)

    fieldsets = (
        (None, {"fields": ("phone", "password")}),
        ("Personal info", {"fields": ("first_name", "last_name", "surname")}),
        ("Permissions", {"fields": ("is_active", "is_staff", "is_superuser")}),
        ("Important dates", {"fields": ("last_login",)}),
    )

    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": ("phone", "password1", "password2", "is_staff", "is_superuser"),
        }),
    )


admin.site.register(User, CustomUserAdmin)