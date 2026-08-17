"""
Perfective Maintenance - Program Comprehension step
========================================================
Feature to improve: crud.get_tasks() - the query behind GET /api/tasks.
Not broken - every filter (status/priority/tag/search) returns correct
results today. The enhancement goal is performance at scale: user_id,
status, priority, and tag are all filtered on in get_tasks() but none
of them are indexed in models.py, so every call does a full table scan.

This script seeds a realistic-size dataset (50 users x 400 tasks each =
20,000 rows) into an isolated on-disk SQLite file (never touches the
real todo.db) and traces a single get_tasks() call with Viztracer to
see the current call timeline before any change is made.

Run with:  .venv/Scripts/python maintenance/perfective/01_program_comprehension/seed_and_trace.py
"""
import sys
import os
import random
import datetime

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..")))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import models
import crud

DB_PATH = os.path.join(os.path.dirname(__file__), "bench.db")
N_USERS = 50
TASKS_PER_USER = 400

STATUSES = ["pending", "completed"]
PRIORITIES = ["low", "medium", "high"]
TAGS = ["Work", "Personal", "Urgent", "Later", None]


def seed(db):
    print(f"Seeding {N_USERS} users x {TASKS_PER_USER} tasks = {N_USERS * TASKS_PER_USER} rows...")
    for u in range(N_USERS):
        user = models.User(username=f"bench_user_{u}", hashed_password="x")
        db.add(user)
        db.flush()
        for t in range(TASKS_PER_USER):
            db.add(models.Task(
                title=f"Task {t} for user {u}",
                priority=random.choice(PRIORITIES),
                status=random.choice(STATUSES),
                tag=random.choice(TAGS),
                user_id=user.id,
                created_at=datetime.datetime.now(datetime.timezone.utc),
            ))
        if u % 10 == 0:
            db.commit()
    db.commit()
    print("Seeding done.")


if __name__ == "__main__":
    fresh = not os.path.exists(DB_PATH)
    engine = create_engine(f"sqlite:///{DB_PATH}", connect_args={"check_same_thread": False})
    models.Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    db = Session()

    if fresh:
        seed(db)
    else:
        print(f"Reusing existing {DB_PATH} (delete it to reseed).")

    # Trace ONE representative call: filter by status + priority + tag,
    # for a user in the middle of the table (worst case for a full scan).
    target_user_id = N_USERS // 2

    import viztracer
    tracer = viztracer.VizTracer(output_file=os.path.join(os.path.dirname(__file__), "get_tasks_trace.json"))
    tracer.start()
    results = crud.get_tasks(db, user_id=target_user_id, status="pending", priority="high", tag="Work")
    tracer.stop()
    tracer.save()

    print(f"\nget_tasks(user_id={target_user_id}, status='pending', priority='high', tag='Work') -> {len(results)} rows")
    print("Viztracer trace saved to get_tasks_trace.json - open with:")
    print("  vizviewer maintenance/perfective/01_program_comprehension/get_tasks_trace.json")
