from datetime import date, datetime, timedelta
import calendar

from django.contrib.auth import get_user_model
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Shift
from .permissions import IsManagerOrAdmin
from .serializers import (
    ShiftListSerializer,
    ShiftCreateSerializer,
    GenerateMonthSerializer,
    StatsQuerySerializer,
)

# ✅ уведомления
from notifications.models import Notification

User = get_user_model()


def _month_range(yyyy_mm: str):
    y, m = map(int, yyyy_mm.split("-"))
    first = date(y, m, 1)
    last_day = calendar.monthrange(y, m)[1]
    last = date(y, m, last_day)
    return first, last


def _shift_seconds(s: Shift) -> int:
    start_dt = datetime.combine(s.date, s.start_time)
    end_dt = datetime.combine(s.date, s.end_time)
    delta = end_dt - start_dt
    return max(0, int(delta.total_seconds()))


def _actor_label(user) -> str:
    if not user or not getattr(user, "is_authenticated", False):
        return "Система"
    full = f"{getattr(user, 'last_name', '')} {getattr(user, 'first_name', '')}".strip()
    return full or getattr(user, "phone", "Пользователь")


def _shift_payload(shift: Shift, actor) -> dict:
    return {
        "shift_id": shift.id,
        "employee_id": shift.employee_id,
        "date": str(shift.date),
        "start_time": str(shift.start_time),
        "end_time": str(shift.end_time),
        "comment": shift.comment or "",
        "actor_id": getattr(actor, "id", None),
        "actor_label": _actor_label(actor),
    }


def notify(recipient, n_type: str, title: str, message: str, data: dict):
    if not recipient:
        return
    # не шлём самому себе (если админ правит себе)
    if data.get("actor_id") == recipient.id:
        return
    Notification.objects.create(
        recipient=recipient,
        type=n_type,
        title=title,
        message=message,
        data=data,
    )


class ShiftViewSet(viewsets.ModelViewSet):
    """
    /api/schedule/shifts/
    - GET (list/retrieve) : любой авторизованный
    - POST/PATCH/DELETE   : только manager/admin
    """
    queryset = Shift.objects.select_related("employee").all().order_by("date", "start_time")
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action in ("create", "partial_update", "update"):
            return ShiftCreateSerializer
        return ShiftListSerializer

    def get_permissions(self):
        if self.action in ("create", "partial_update", "update", "destroy", "generate_month"):
            return [IsAuthenticated(), IsManagerOrAdmin()]
        return [IsAuthenticated()]

    def list(self, request, *args, **kwargs):
        """
        GET /api/schedule/shifts/?from=YYYY-MM-DD&to=YYYY-MM-DD
        """
        from_q = request.query_params.get("from")
        to_q = request.query_params.get("to")

        qs = self.get_queryset()
        if from_q and to_q:
            qs = qs.filter(date__gte=from_q, date__lte=to_q)

        ser = ShiftListSerializer(qs, many=True)
        return Response(ser.data)

    # -------------------- ✅ NOTIFICATIONS HOOKS --------------------

    def perform_create(self, serializer):
        shift = serializer.save()
        actor = self.request.user

        data = _shift_payload(shift, actor)
        notify(
            recipient=shift.employee,
            n_type=Notification.TYPE_SHIFT_CREATED,
            title="Назначена смена",
            message=f"{data['actor_label']} назначил(а) вам смену {data['date']} {data['start_time']}–{data['end_time']}",
            data=data,
        )

    def perform_update(self, serializer):
        # снимок "до"
        old: Shift = self.get_object()
        old_employee = old.employee
        old_employee_id = old.employee_id
        old_data = {
            "employee_id": old.employee_id,
            "date": str(old.date),
            "start_time": str(old.start_time),
            "end_time": str(old.end_time),
            "comment": old.comment or "",
        }

        shift = serializer.save()
        actor = self.request.user
        new_data = _shift_payload(shift, actor)

        # переназначили сотрудника?
        reassigned = old_employee_id != shift.employee_id

        if reassigned:
            # 1) старому — “переназначено/снято”
            notify(
                recipient=old_employee,
                n_type=Notification.TYPE_SHIFT_REASSIGNED,
                title="Смена переназначена",
                message=f"{new_data['actor_label']} переназначил(а) вашу смену {old_data['date']} {old_data['start_time']}–{old_data['end_time']}",
                data={**new_data, "old": old_data},
            )
            # 2) новому — “назначено”
            notify(
                recipient=shift.employee,
                n_type=Notification.TYPE_SHIFT_CREATED,
                title="Назначена смена",
                message=f"{new_data['actor_label']} назначил(а) вам смену {new_data['date']} {new_data['start_time']}–{new_data['end_time']}",
                data={**new_data, "old": old_data},
            )
        else:
            # обычное изменение своей смены
            notify(
                recipient=shift.employee,
                n_type=Notification.TYPE_SHIFT_UPDATED,
                title="Смена изменена",
                message=f"{new_data['actor_label']} изменил(а) вашу смену {new_data['date']} {new_data['start_time']}–{new_data['end_time']}",
                data={**new_data, "old": old_data},
            )

    def perform_destroy(self, instance: Shift):
        actor = self.request.user
        data = _shift_payload(instance, actor)

        notify(
            recipient=instance.employee,
            n_type=Notification.TYPE_SHIFT_DELETED,
            title="Смена отменена",
            message=f"{data['actor_label']} отменил(а) вашу смену {data['date']} {data['start_time']}–{data['end_time']}",
            data=data,
        )
        instance.delete()

    # -------------------- ✅ GENERATE MONTH --------------------

    @action(detail=False, methods=["post"], url_path="generate-month")
    def generate_month(self, request):
        ser = GenerateMonthSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        data = ser.validated_data

        month = data["month"]
        per_day = data["per_day"]
        start_time = data["start_time"]
        end_time = data["end_time"]
        overwrite = data.get("overwrite", False)
        include_roles = data.get("include_roles") or ["employee", "manager"]
        comment = data.get("comment", "Автогенерация 2/2")

        start_date, end_date = _month_range(month)

        employees = list(
            User.objects.filter(role__in=include_roles, is_active=True, is_approved=True)
            .order_by("id")
        )
        if len(employees) < per_day:
            return Response(
                {"detail": f"Недостаточно сотрудников для per_day={per_day}. Найдено: {len(employees)}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if overwrite:
            Shift.objects.filter(date__gte=start_date, date__lte=end_date).delete()

        doubled = []
        for e in employees:
            doubled.extend([e, e])

        created = 0
        skipped = 0

        idx = 0
        day = start_date
        actor = request.user

        while day <= end_date:
            todays = []
            attempts = 0
            while len(todays) < per_day and attempts < len(doubled) * 2:
                candidate = doubled[idx % len(doubled)]
                idx += 1
                attempts += 1
                if candidate in todays:
                    continue
                todays.append(candidate)

            for emp in todays:
                exists = Shift.objects.filter(
                    employee=emp, date=day, start_time=start_time, end_time=end_time
                ).exists()
                if exists and not overwrite:
                    skipped += 1
                    continue

                shift = Shift.objects.create(
                    employee=emp,
                    date=day,
                    start_time=start_time,
                    end_time=end_time,
                    comment=comment,
                )
                created += 1

                # ✅ уведомление при автогенерации
                payload = _shift_payload(shift, actor)
                notify(
                    recipient=emp,
                    n_type=Notification.TYPE_SHIFT_CREATED,
                    title="Назначена смена (авто)",
                    message=f"{payload['actor_label']} назначил(а) вам смену {payload['date']} {payload['start_time']}–{payload['end_time']}",
                    data=payload,
                )

            day = day + timedelta(days=1)

        return Response(
            {
                "month": month,
                "created": created,
                "skipped": skipped,
                "per_day": per_day,
                "include_roles": include_roles,
            },
            status=status.HTTP_200_OK,
        )


class StatsViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    def list(self, request):
        q = StatsQuerySerializer(data=request.query_params)
        q.is_valid(raise_exception=True)
        params = q.validated_data
        from_date = params["from"]
        to_date = params["to"]

        employee_id = request.query_params.get("employee_id")

        shifts_qs = Shift.objects.select_related("employee").filter(date__gte=from_date, date__lte=to_date)

        role = getattr(request.user, "role", None)
        if role in ("manager", "admin"):
            if employee_id:
                shifts_qs = shifts_qs.filter(employee_id=employee_id)
        else:
            shifts_qs = shifts_qs.filter(employee=request.user)

        per_user = {}
        for s in shifts_qs:
            uid = s.employee_id
            if uid not in per_user:
                per_user[uid] = {
                    "employee_id": uid,
                    "employee_name": f"{s.employee.last_name} {s.employee.first_name} {s.employee.surname}".strip(),
                    "shifts_count": 0,
                    "total_seconds": 0,
                }
            per_user[uid]["shifts_count"] += 1
            per_user[uid]["total_seconds"] += _shift_seconds(s)

        result = []
        for row in per_user.values():
            total = row["total_seconds"]
            row["hours"] = total // 3600
            row["minutes"] = (total % 3600) // 60
            result.append(row)

        result.sort(key=lambda x: x["employee_name"])

        return Response(
            {
                "from": str(from_date),
                "to": str(to_date),
                "count_users": len(result),
                "items": result,
            },
            status=status.HTTP_200_OK,
        )