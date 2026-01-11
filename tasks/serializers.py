from rest_framework import serializers
from .models import Task

class TaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = [
            "id",
            "assignee",
            "created_by",
            "title",
            "description",
            "type",
            "due_date",
            "status",
            "created_at",
            "completed_at",
        ]
        read_only_fields = ["id", "created_by", "created_at", "completed_at"]

class TaskCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = ["assignee", "title", "description", "type", "due_date"]

class TaskUpdateStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = ["status"]