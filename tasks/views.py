from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Task
from .serializers import TaskSerializer, TaskCreateSerializer
from .permissions import IsManagerOrAdmin

# если хочешь дергать notifications при создании/выполнении:
# from notifications.models import Notification

class TaskViewSet(viewsets.ModelViewSet):
    """
    /api/tasks/
    - employee: видит только свои задачи
    - manager/admin: может смотреть/создавать задачи любому (можно расширить фильтрами)
    """
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = Task.objects.all()

        # фильтры:
        assignee_id = self.request.query_params.get("assignee_id")
        status_q = self.request.query_params.get("status")

        if user.role in ("manager", "admin"):
            if assignee_id:
                qs = qs.filter(assignee_id=assignee_id)
        else:
            qs = qs.filter(assignee=user)

        if status_q:
            qs = qs.filter(status=status_q)

        return qs.order_by("-created_at")

    def get_serializer_class(self):
        if self.action in ("create",):
            return TaskCreateSerializer
        return TaskSerializer

    def perform_create(self, serializer):
        user = self.request.user
        if user.role not in ("manager", "admin"):
            # сотрудник не создаёт задачи
            raise PermissionError("Not allowed")
        task = serializer.save(created_by=user)

        # (опционально) создать Notification при создании задачи
        # Notification.objects.create(
        #     recipient=task.assignee,
        #     title="Новая задача",
        #     message=f"{task.title}",
        # )

    @action(detail=True, methods=["post"], url_path="done")
    def mark_done(self, request, pk=None):
        task = self.get_object()

        # сотрудник может закрыть ТОЛЬКО свою задачу
        if request.user.role not in ("manager", "admin") and task.assignee_id != request.user.id:
            return Response({"detail": "Нет доступа"}, status=status.HTTP_403_FORBIDDEN)

        if task.status != "done":
            task.status = "done"
            task.completed_at = timezone.now()
            task.save(update_fields=["status", "completed_at"])

            # (опционально) notification создателю
            # if task.created_by_id:
            #     Notification.objects.create(
            #         recipient=task.created_by,
            #         title="Задача выполнена",
            #         message=f"{task.assignee} выполнил: {task.title}",
            #     )

        return Response({"ok": True}, status=status.HTTP_200_OK)

    @action(detail=False, methods=["get"], url_path="unread-count")
    def unread_count(self, request):
        user = request.user
        if user.role in ("manager", "admin"):
            # для менеджера можно вернуть сколько "открытых" задач у всех или по фильтру
            assignee_id = request.query_params.get("assignee_id")
            qs = Task.objects.filter(status="open")
            if assignee_id:
                qs = qs.filter(assignee_id=assignee_id)
            return Response({"count": qs.count()}, status=status.HTTP_200_OK)

        cnt = Task.objects.filter(assignee=user, status="open").count()
        return Response({"count": cnt}, status=status.HTTP_200_OK)