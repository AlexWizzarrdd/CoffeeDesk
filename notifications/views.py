from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Notification
from .serializers import NotificationSerializer


class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    """
    /api/notifications/
    - GET list: список уведомлений текущего пользователя
    - GET retrieve: одно уведомление (только своё)

    Доп. экшены:
    - POST /api/notifications/{id}/read/
    - POST /api/notifications/read-all/
    - GET  /api/notifications/unread-count/
    """
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = Notification.objects.filter(recipient=self.request.user).order_by("-created_at")
        unread = self.request.query_params.get("unread")
        if unread in ("1", "true", "True"):
            qs = qs.filter(is_read=False)
        return qs

    @action(detail=True, methods=["post"], url_path="read")
    def mark_read(self, request, pk=None):
        n = self.get_object()
        if not n.is_read:
            n.is_read = True
            n.save(update_fields=["is_read"])
        return Response({"ok": True}, status=status.HTTP_200_OK)

    @action(detail=False, methods=["post"], url_path="read-all")
    def read_all(self, request):
        qs = Notification.objects.filter(recipient=request.user, is_read=False)
        updated = qs.update(is_read=True)
        return Response({"ok": True, "updated": updated}, status=status.HTTP_200_OK)

    @action(detail=False, methods=["get"], url_path="unread-count")
    def unread_count(self, request):
        cnt = Notification.objects.filter(recipient=request.user, is_read=False).count()
        return Response({"count": cnt}, status=status.HTTP_200_OK)