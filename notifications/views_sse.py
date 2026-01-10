# notifications/views_sse.py
from __future__ import annotations

import time
from django.contrib.auth import get_user_model
from django.http import StreamingHttpResponse, HttpResponseForbidden
from django.views.decorators.http import require_GET

from rest_framework_simplejwt.tokens import AccessToken

from .models import Notification  # подстрой импорт под твою модель
from .sse import add_client, remove_client

User = get_user_model()


def _get_user_from_token(request):
    token = request.GET.get("token")
    if not token:
        return None
    try:
        t = AccessToken(token)
        user_id = int(t["user_id"])
        return User.objects.get(id=user_id)
    except Exception:
        return None


@require_GET
def notifications_stream(request):
    user = _get_user_from_token(request)
    if not user:
        return HttpResponseForbidden("Unauthorized")

    user_id = user.id
    q = add_client(user_id)

    def gen():
        try:
            # 1) сразу отправляем текущий unread_count (чтобы “мгновенно” появилось)
            unread = Notification.objects.filter(user_id=user_id, is_read=False).count()
            yield f"event: unread_count\ndata: {unread}\n\n"

            # 2) дальше слушаем пуши
            last_ping = time.time()
            while True:
                # ждём событие до 15 сек
                try:
                    msg = q.get(timeout=15)
                    yield msg
                except Exception:
                    pass

                # keep-alive ping раз в ~15 сек
                if time.time() - last_ping >= 15:
                    yield "event: ping\ndata: 1\n\n"
                    last_ping = time.time()
        finally:
            remove_client(user_id, q)

    resp = StreamingHttpResponse(gen(), content_type="text/event-stream")
    resp["Cache-Control"] = "no-cache"
    resp["X-Accel-Buffering"] = "no"  # полезно, если будет nginx
    return resp