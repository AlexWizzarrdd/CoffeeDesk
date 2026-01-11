from django.conf import settings
from django.db import models

class Task(models.Model):
    TYPE_CHOICES = [
        ("attestation", "Аттестация"),
        ("training", "Обучение"),
        ("medical", "Медосмотр"),
        ("other", "Другое"),
    ]

    STATUS_CHOICES = [
        ("open", "Открыта"),
        ("done", "Выполнена"),
        ("cancelled", "Отменена"),
    ]

    assignee = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="tasks",
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_tasks",
    )

    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)

    type = models.CharField(max_length=30, choices=TYPE_CHOICES, default="other")
    due_date = models.DateField(null=True, blank=True)

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="open")
    completed_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.title} → {self.assignee_id}"