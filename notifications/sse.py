# notifications/sse.py
from __future__ import annotations

import json
import queue
import threading
from collections import defaultdict
from typing import Dict, Set


_user_queues: Dict[int, Set["queue.Queue[str]"]] = defaultdict(set)
_lock = threading.Lock()


def add_client(user_id: int) -> "queue.Queue[str]":
    q: "queue.Queue[str]" = queue.Queue()
    with _lock:
        _user_queues[user_id].add(q)
    return q


def remove_client(user_id: int, q: "queue.Queue[str]") -> None:
    with _lock:
        if user_id in _user_queues and q in _user_queues[user_id]:
            _user_queues[user_id].remove(q)
        if user_id in _user_queues and not _user_queues[user_id]:
            _user_queues.pop(user_id, None)


def publish(user_id: int, event: str, data: dict) -> None:
    payload = f"event: {event}\ndata: {json.dumps(data, ensure_ascii=False)}\n\n"
    with _lock:
        queues = list(_user_queues.get(user_id, []))
    for q in queues:
        try:
            q.put_nowait(payload)
        except Exception:
            pass