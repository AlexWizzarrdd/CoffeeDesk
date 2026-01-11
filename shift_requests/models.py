from django.conf import settings
from django.db import models

from schedule.models import Shift  # если schedule в другом месте — поправь импорт


class ShiftChangeRequest(models.Model):
    TYPE_SWAP = "swap"      # хочу поменяться
    TYPE_DROP = "drop"      # не могу выйти
    TYPE_MOVE = "move"      # перенести/изменить время (решает менеджер)
    TYPE_OTHER = "other"

    TYPE_CHOICES = [
        (TYPE_SWAP, "Поменяться"),
        (TYPE_DROP, "Снять смену"),
        (TYPE_MOVE, "Перенести/изменить"),
        (TYPE_OTHER, "Другое"),
    ]

    STATUS_PENDING = "pending"
    STATUS_APPROVED = "approved"
    STATUS_REJECTED = "rejected"
    STATUS_CANCELLED = "cancelled"

    STATUS_CHOICES = [
        (STATUS_PENDING, "Ожидает"),
        (STATUS_APPROVED, "Одобрено"),
        (STATUS_REJECTED, "Отклонено"),
        (STATUS_CANCELLED, "Отменено"),
    ]

    requester = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="shift_change_requests",
        db_index=True,
    )

    shift = models.ForeignKey(
        Shift,
        on_delete=models.CASCADE,
        related_name="change_requests",
        db_index=True,
    )

    type = models.CharField(max_length=20, choices=TYPE_CHOICES, default=TYPE_OTHER)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING, db_index=True)

    comment = models.TextField(blank=True, default="")
    manager_comment = models.TextField(blank=True, default="")

    decided_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name="decided_shift_change_requests",
    )
    decided_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("-created_at",)

    def __str__(self):
        return f"req#{self.id} shift={self.shift_id} {self.type} {self.status}"