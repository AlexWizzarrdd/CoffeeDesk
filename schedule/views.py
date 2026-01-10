from datetime import date, datetime, timedelta
import calendar

from django.contrib.auth import get_user_model
from django.db.models import Q
from django.utils.timezone import make_aware

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

User = get_user_model()


def _month_range(yyyy_mm: str):
    y, m = map(int, yyyy_mm.split("-"))
    first = date(y, m, 1)
    last_day = calendar.monthrange(y, m)[1]
    last = date(y, m, last_day)
    return first, last


def _shift_seconds(s: Shift) -> int:
    """
    Считает длительность смены в секундах.
    Предполагаем: end_time > start_time в пределах дня.
    """
    start_dt = datetime.combine(s.date, s.start_time)
    end_dt = datetime.combine(s.date, s.end_time)
    delta = end_dt - start_dt
    return max(0, int(delta.total_seconds()))


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
        # ограничиваем мутирующие методы
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

        # Если захотите в будущем ограничить для employee только свои смены:
        # if request.user.role == "employee":
        #     qs = qs.filter(employee=request.user)

        ser = ShiftListSerializer(qs, many=True)
        return Response(ser.data)

    @action(detail=False, methods=["post"], url_path="generate-month")
    def generate_month(self, request):
        """
        POST /api/schedule/shifts/generate-month/
        body: {month:"YYYY-MM", per_day:2, start_time:"09:00", end_time:"18:00", overwrite:false, include_roles:["employee","manager"], comment:"..."}
        """
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

        # берём пользователей по ролям
        employees = list(
            User.objects.filter(role__in=include_roles, is_active=True, is_approved=True)
            .order_by("id")
        )
        if len(employees) < per_day:
            return Response(
                {"detail": f"Недостаточно сотрудников для per_day={per_day}. Найдено: {len(employees)}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # overwrite: удаляем смены в диапазоне
        if overwrite:
            Shift.objects.filter(date__gte=start_date, date__lte=end_date).delete()

        # 2/2 паттерн:
        # делаем последовательность вида:
        # [emp1, emp1, emp2, emp2, emp3, emp3, ...] и крутим по кругу.
        doubled = []
        for e in employees:
            doubled.extend([e, e])

        created = 0
        skipped = 0

        idx = 0
        day = start_date
        while day <= end_date:
            todays = []
            # набираем per_day уникальных сотрудников на день
            # (важно: если doubled даёт одинаковых подряд — пропускаем уже выбранных на этот день)
            attempts = 0
            while len(todays) < per_day and attempts < len(doubled) * 2:
                candidate = doubled[idx % len(doubled)]
                idx += 1
                attempts += 1
                if candidate in todays:
                    continue
                todays.append(candidate)

            for emp in todays:
                exists = Shift.objects.filter(employee=emp, date=day, start_time=start_time, end_time=end_time).exists()
                if exists and not overwrite:
                    skipped += 1
                    continue

                Shift.objects.create(
                    employee=emp,
                    date=day,
                    start_time=start_time,
                    end_time=end_time,
                    comment=comment,
                )
                created += 1

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
    """
    GET /api/schedule/stats/?from=YYYY-MM-DD&to=YYYY-MM-DD[&employee_id=ID]
    """
    permission_classes = [IsAuthenticated]

    def list(self, request):
        q = StatsQuerySerializer(data=request.query_params)
        q.is_valid(raise_exception=True)
        params = q.validated_data
        from_date = params["from"]
        to_date = params["to"]

        employee_id = request.query_params.get("employee_id")

        # базовая выборка
        shifts_qs = Shift.objects.select_related("employee").filter(date__gte=from_date, date__lte=to_date)

        # правила доступа:
        role = getattr(request.user, "role", None)

        if role in ("manager", "admin"):
            # можно смотреть всех, либо конкретного по employee_id
            if employee_id:
                shifts_qs = shifts_qs.filter(employee_id=employee_id)
        else:
            # employee видит только себя
            shifts_qs = shifts_qs.filter(employee=request.user)

        # агрегация в питоне (просто и надёжно)
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

        # доп. поля hours/minutes
        result = []
        for row in per_user.values():
            total = row["total_seconds"]
            hours = total // 3600
            minutes = (total % 3600) // 60
            row["hours"] = hours
            row["minutes"] = minutes
            result.append(row)

        # сортировка по имени
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