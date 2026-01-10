from django.contrib import admin
from .models import Notification


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ("id", "recipient", "type", "is_read", "created_at", "title")
    list_filter = ("type", "is_read", "created_at")
    search_fields = ("recipient__phone", "title", "message")