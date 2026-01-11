from rest_framework import serializers
from .models import ShiftChangeRequest


class ShiftChangeRequestCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ShiftChangeRequest
        fields = ("id", "shift", "type", "comment", "status", "created_at")
        read_only_fields = ("id", "status", "created_at")

    def validate_shift(self, shift):
        """
        Бариста/стажёр может создавать запрос только по СВОЕЙ смене.
        manager/admin может по любой (на всякий).
        """
        request = self.context.get("request")
        if not request or not getattr(request, "user", None):
            return shift

        role = getattr(request.user, "role", None)
        if role in ("manager", "admin"):
            return shift

        if shift.employee_id != request.user.id:
            raise serializers.ValidationError("Нельзя создавать запрос на чужую смену.")
        return shift


class ShiftChangeRequestListSerializer(serializers.ModelSerializer):
    shift_date = serializers.DateField(source="shift.date", read_only=True)
    shift_start = serializers.TimeField(source="shift.start_time", read_only=True)
    shift_end = serializers.TimeField(source="shift.end_time", read_only=True)

    requester_id = serializers.IntegerField(source="requester.id", read_only=True)
    requester_name = serializers.SerializerMethodField()

    employee_id = serializers.IntegerField(source="shift.employee_id", read_only=True)
    employee_name = serializers.SerializerMethodField()

    class Meta:
        model = ShiftChangeRequest
        fields = (
            "id",
            "type",
            "status",
            "comment",
            "manager_comment",
            "created_at",
            "decided_at",
            "decided_by",
            "requester_id",
            "requester_name",
            "shift",
            "shift_date",
            "shift_start",
            "shift_end",
            "employee_id",
            "employee_name",
        )

    def get_requester_name(self, obj):
        u = obj.requester
        return f"{u.last_name} {u.first_name} {u.surname}".strip()

    def get_employee_name(self, obj):
        u = obj.shift.employee
        return f"{u.last_name} {u.first_name} {u.surname}".strip()