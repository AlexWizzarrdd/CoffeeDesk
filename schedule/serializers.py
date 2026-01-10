from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Shift

User = get_user_model()


class ShiftListSerializer(serializers.ModelSerializer):
    employee_id = serializers.IntegerField(source="employee.id", read_only=True)
    employee_phone = serializers.CharField(source="employee.phone", read_only=True)
    employee_name = serializers.SerializerMethodField()

    class Meta:
        model = Shift
        fields = [
            "id",
            "employee_id",
            "employee_phone",
            "employee_name",
            "date",
            "start_time",
            "end_time",
            "comment",
            "created_at",
        ]

    def get_employee_name(self, obj):
        return f"{obj.employee.last_name} {obj.employee.first_name} {obj.employee.surname}".strip()


class ShiftCreateSerializer(serializers.ModelSerializer):
    # важно: для PATCH employee может не приходить
    employee = serializers.PrimaryKeyRelatedField(queryset=User.objects.all(), required=False)

    class Meta:
        model = Shift
        fields = ["employee", "date", "start_time", "end_time", "comment"]

    def validate(self, attrs):
        """
        ВАЖНО:
        - при CREATE attrs содержит start_time/end_time
        - при PATCH может прийти только comment или только end_time и т.п.
          Поэтому берём недостающие поля из instance (если она есть)
        """
        start = attrs.get("start_time") or getattr(self.instance, "start_time", None)
        end = attrs.get("end_time") or getattr(self.instance, "end_time", None)

        if start and end and end <= start:
            raise serializers.ValidationError("end_time должно быть больше start_time")

        return attrs


class GenerateMonthSerializer(serializers.Serializer):
    month = serializers.RegexField(regex=r"^\d{4}-\d{2}$")  # "2026-01"
    per_day = serializers.IntegerField(min_value=2, max_value=50)
    start_time = serializers.TimeField()
    end_time = serializers.TimeField()
    overwrite = serializers.BooleanField(default=False)
    include_roles = serializers.ListField(
        child=serializers.ChoiceField(choices=["employee", "manager", "admin"]),
        required=False,
    )
    comment = serializers.CharField(required=False, allow_blank=True, default="Автогенерация 2/2")

    def validate(self, attrs):
        if attrs["end_time"] <= attrs["start_time"]:
            raise serializers.ValidationError("end_time должно быть больше start_time")
        return attrs


class StatsQuerySerializer(serializers.Serializer):
    # оставляем query params как from/to, но валидируем как даты
    from_date = serializers.DateField(required=True, input_formats=["%Y-%m-%d"], source="from")
    to_date = serializers.DateField(required=True, input_formats=["%Y-%m-%d"], source="to")