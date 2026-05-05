"""Background task management for long-running operations."""

from __future__ import annotations

import uuid
from datetime import datetime, timedelta
from typing import Any
from enum import Enum

# In-memory task store (can be replaced with Redis or DB)
_task_store: dict[str, dict] = {}


class TaskStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


class Task:
    def __init__(self, task_id: str, task_type: str, data: dict):
        self.task_id = task_id
        self.task_type = task_type
        self.data = data
        self.status = TaskStatus.PENDING
        self.result = None
        self.error = None
        self.created_at = datetime.utcnow()
        self.started_at = None
        self.completed_at = None

    def to_dict(self) -> dict:
        return {
            "task_id": self.task_id,
            "task_type": self.task_type,
            "status": self.status,
            "result": self.result,
            "error": self.error,
            "created_at": self.created_at.isoformat(),
            "started_at": self.started_at.isoformat() if self.started_at else None,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
        }


def create_task(task_type: str, data: dict) -> str:
    """Create a new background task."""
    task_id = str(uuid.uuid4())
    task = Task(task_id, task_type, data)
    _task_store[task_id] = task
    return task_id


def get_task(task_id: str) -> Task | None:
    """Get a task by ID."""
    return _task_store.get(task_id)


def update_task(task_id: str, status: TaskStatus, result: Any = None, error: str = None) -> bool:
    """Update a task's status and result."""
    task = _task_store.get(task_id)
    if not task:
        return False

    task.status = status
    if status == TaskStatus.RUNNING:
        task.started_at = datetime.utcnow()
    elif status in (TaskStatus.COMPLETED, TaskStatus.FAILED):
        task.completed_at = datetime.utcnow()

    if result is not None:
        task.result = result
    if error:
        task.error = error

    return True


def cleanup_old_tasks(hours: int = 24) -> int:
    """Clean up tasks older than specified hours."""
    cutoff = datetime.utcnow() - timedelta(hours=hours)
    to_delete = []

    for task_id, task in _task_store.items():
        if task.completed_at and task.completed_at < cutoff:
            to_delete.append(task_id)

    for task_id in to_delete:
        del _task_store[task_id]

    return len(to_delete)
