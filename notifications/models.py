from django.conf import settings
from django.db import models


class Notification(models.Model):
    TYPE_SHIFT_CREATED = "shift_created"
    TYPE_SHIFT_UPDATED = "shift_updated"
    TYPE_SHIFT_DELETED = "shift_deleted"
    TYPE_SHIFT_REASSIGNED = "shift_reassigned"

    TYPE_CHOICES = [
        (TYPE_SHIFT_CREATED, "Смена назначена"),
        (TYPE_SHIFT_UPDATED, "Смена изменена"),
        (TYPE_SHIFT_DELETED, "Смена отменена"),
        (TYPE_SHIFT_REASSIGNED, "Смена переназначена"),
    ]

    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notifications",
        db_index=True,
    )

    type = models.CharField(max_length=50, choices=TYPE_CHOICES, db_index=True)

    title = models.CharField(max_length=255)
    message = models.TextField(blank=True)

    # полезная нагрузка (shift_id, date, times, actor_id и т.д.)
    data = models.JSONField(default=dict, blank=True)

    is_read = models.BooleanField(default=False, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ("-created_at",)

    def __str__(self):
        return f"[{self.type}] to={self.recipient_id} read={self.is_read}"