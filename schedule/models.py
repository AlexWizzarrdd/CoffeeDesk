from django.conf import settings
from django.db import models


class Shift(models.Model):
    """
    Рабочая смена.
    - employee: кому назначена
    - date: день смены (в календаре)
    - start_time/end_time: время
    - created_by: кто назначил (manager/admin) или сам пользователь (если разрешим)
    """
    employee = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="shifts",
    )
    date = models.DateField(db_index=True)
    start_time = models.TimeField()
    end_time = models.TimeField()

    comment = models.CharField(max_length=255, blank=True, default="")
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_shifts",
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["date", "start_time"]
        constraints = [
            models.CheckConstraint(
                check=models.Q(end_time__gt=models.F("start_time")),
                name="shift_end_after_start",
            ),
        ]

    def __str__(self):
        return f"{self.employee_id} {self.date} {self.start_time}-{self.end_time}"