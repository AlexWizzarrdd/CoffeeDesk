# shift_requests/views.py
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import ShiftChangeRequest
from .serializers import ShiftChangeRequestCreateSerializer, ShiftChangeRequestListSerializer

from users.permissions import IsManagerOrAdmin
from notifications.models import Notification

User = get_user_model()


TYPE_LABEL = {
    ShiftChangeRequest.TYPE_SWAP: "Поменяться",
    ShiftChangeRequest.TYPE_DROP: "Снять смену",
    ShiftChangeRequest.TYPE_MOVE: "Перенести/изменить",
    ShiftChangeRequest.TYPE_OTHER: "Другое",
}

STATUS_LABEL = {
    ShiftChangeRequest.STATUS_PENDING: "Ожидает",
    ShiftChangeRequest.STATUS_APPROVED: "Одобрено",
    ShiftChangeRequest.STATUS_REJECTED: "Отклонено",
    ShiftChangeRequest.STATUS_CANCELLED: "Отменено",
}


def _user_label(user) -> str:
    if not user or not getattr(user, "is_authenticated", False):
        return "Система"
    full = f"{getattr(user, 'last_name', '')} {getattr(user, 'first_name', '')} {getattr(user, 'surname', '')}"
    full = " ".join(full.split()).strip()
    return full or getattr(user, "phone", "Пользователь")


def _hhmm(t) -> str:
    s = str(t) if t is not None else ""
    return s[:5] if len(s) >= 5 else s


def _build_payload(req: ShiftChangeRequest, actor) -> dict:
    shift = req.shift
    employee = getattr(shift, "employee", None)

    return {
        "request_id": req.id,
        "request_status": req.status,
        "status_label": STATUS_LABEL.get(req.status, req.status),

        "type": req.type,
        "type_label": TYPE_LABEL.get(req.type, req.type),

        "shift_id": shift.id,
        "employee_id": shift.employee_id,
        "employee_name": _user_label(employee) if employee else None,

        "date": str(shift.date),
        "start_time": str(shift.start_time),
        "end_time": str(shift.end_time),
        "start_hhmm": _hhmm(shift.start_time),
        "end_hhmm": _hhmm(shift.end_time),

        "requester_id": req.requester_id,
        "requester_name": _user_label(req.requester),

        "requester_comment": req.comment or "",
        "manager_comment": req.manager_comment or "",

        "actor_id": getattr(actor, "id", None),
        "actor_label": _user_label(actor),
    }


def notify(recipient, n_type: str, title: str, message: str, data: dict):
    if not recipient:
        return
    # не шлём уведомление самому себе
    if data.get("actor_id") == recipient.id:
        return
    Notification.objects.create(
        recipient=recipient,
        type=n_type,
        title=title,
        message=message,
        data=data,
    )


class ShiftChangeRequestViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = (
            ShiftChangeRequest.objects
            .select_related("shift", "shift__employee", "requester", "decided_by")
        )

        # barista/intern видит только свои запросы
        if getattr(user, "role", None) not in ("manager", "admin"):
            qs = qs.filter(requester=user)

        st = self.request.query_params.get("status")
        if st:
            qs = qs.filter(status=st)

        return qs.order_by("-created_at")

    def get_serializer_class(self):
        if self.action == "create":
            return ShiftChangeRequestCreateSerializer
        return ShiftChangeRequestListSerializer

    def perform_create(self, serializer):
        req = serializer.save(
            requester=self.request.user,
            status=ShiftChangeRequest.STATUS_PENDING,
        )

        actor = self.request.user
        payload = _build_payload(req, actor)

        # ---- уведомление менеджерам/админам ----
        # если у тебя есть константа Notification.TYPE_SHIFT_CHANGE_REQUEST — используем её
        n_type = getattr(Notification, "TYPE_SHIFT_CHANGE_REQUEST", "info")

        title = "Запрос на изменение смены"
        msg_lines = [
            f"От: {payload['requester_name']}",
            f"Тип: {payload['type_label']}",
            f"Смена: {payload['date']} {payload['start_hhmm']}–{payload['end_hhmm']}",
        ]
        if payload["requester_comment"]:
            msg_lines.append(f"Комментарий: {payload['requester_comment']}")
        message = "\n".join(msg_lines)

        managers = User.objects.filter(role__in=("manager", "admin"), is_active=True)
        for m in managers:
            notify(
                recipient=m,
                n_type=n_type,
                title=title,
                message=message,
                data=payload,
            )

    @action(
        detail=True,
        methods=["post"],
        url_path="approve",
        permission_classes=[IsAuthenticated, IsManagerOrAdmin],
    )
    def approve(self, request, pk=None):
        obj: ShiftChangeRequest = self.get_object()
        if obj.status != ShiftChangeRequest.STATUS_PENDING:
            return Response({"detail": "Запрос уже обработан"}, status=status.HTTP_400_BAD_REQUEST)

        obj.status = ShiftChangeRequest.STATUS_APPROVED
        obj.manager_comment = request.data.get("manager_comment", "") or ""
        obj.decided_by = request.user
        obj.decided_at = timezone.now()
        obj.save(update_fields=["status", "manager_comment", "decided_by", "decided_at"])

        actor = request.user
        payload = _build_payload(obj, actor)

        # ---- уведомление сотруднику о решении ----
        n_type = getattr(Notification, "TYPE_SHIFT_CHANGE_DECISION", "info")
        title = "Запрос по смене одобрен ✅"
        msg_lines = [
            f"Решение: {payload['status_label']}",
            f"Тип: {payload['type_label']}",
            f"Смена: {payload['date']} {payload['start_hhmm']}–{payload['end_hhmm']}",
            f"Кто: {payload['actor_label']}",
        ]
        if payload["manager_comment"]:
            msg_lines.append(f"Комментарий менеджера: {payload['manager_comment']}")
        message = "\n".join(msg_lines)

        notify(
            recipient=obj.requester,
            n_type=n_type,
            title=title,
            message=message,
            data=payload,
        )

        return Response({"ok": True}, status=status.HTTP_200_OK)

    @action(
        detail=True,
        methods=["post"],
        url_path="reject",
        permission_classes=[IsAuthenticated, IsManagerOrAdmin],
    )
    def reject(self, request, pk=None):
        obj: ShiftChangeRequest = self.get_object()
        if obj.status != ShiftChangeRequest.STATUS_PENDING:
            return Response({"detail": "Запрос уже обработан"}, status=status.HTTP_400_BAD_REQUEST)

        obj.status = ShiftChangeRequest.STATUS_REJECTED
        obj.manager_comment = request.data.get("manager_comment", "") or ""
        obj.decided_by = request.user
        obj.decided_at = timezone.now()
        obj.save(update_fields=["status", "manager_comment", "decided_by", "decided_at"])

        actor = request.user
        payload = _build_payload(obj, actor)

        # ---- уведомление сотруднику о решении ----
        n_type = getattr(Notification, "TYPE_SHIFT_CHANGE_DECISION", "info")
        title = "Запрос по смене отклонён ❌"
        msg_lines = [
            f"Решение: {payload['status_label']}",
            f"Тип: {payload['type_label']}",
            f"Смена: {payload['date']} {payload['start_hhmm']}–{payload['end_hhmm']}",
            f"Кто: {payload['actor_label']}",
        ]
        if payload["manager_comment"]:
            msg_lines.append(f"Комментарий менеджера: {payload['manager_comment']}")
        message = "\n".join(msg_lines)

        notify(
            recipient=obj.requester,
            n_type=n_type,
            title=title,
            message=message,
            data=payload,
        )

        return Response({"ok": True}, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"], url_path="cancel", permission_classes=[IsAuthenticated])
    def cancel(self, request, pk=None):
        obj: ShiftChangeRequest = self.get_object()

        if obj.requester_id != request.user.id:
            return Response({"detail": "Нет доступа"}, status=status.HTTP_403_FORBIDDEN)
        if obj.status != ShiftChangeRequest.STATUS_PENDING:
            return Response(
                {"detail": "Можно отменить только ожидающий запрос"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        obj.status = ShiftChangeRequest.STATUS_CANCELLED
        obj.decided_by = request.user
        obj.decided_at = timezone.now()
        obj.save(update_fields=["status", "decided_by", "decided_at"])

        return Response({"ok": True}, status=status.HTTP_200_OK)