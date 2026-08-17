"""
Corrective Maintenance - Program Comprehension step
=====================================================
Bug: crud.get_tasks() builds a SQL LIKE pattern from the user-supplied
`search` string with plain f"%{search}%" and never escapes LIKE wildcard
characters (% and _). SQLite's LIKE/ILIKE treats "_" as "match any single
character" and "%" as "match any run of characters". So a search for the
literal character "_" (e.g. a user searching for a task title containing
an underscore) actually matches EVERY task, because "_" in the pattern is
interpreted as a wildcard instead of a literal character.

This script seeds an isolated in-memory database with a few tasks and runs
crud.get_tasks() under @pysnooper.snoop() with the failing input
(search="_") so the line-by-line trace can be inspected.

Run with:  .venv/Scripts/python maintenance/corrective/01_program_comprehension/reproduce_bug.py
"""
import sys
import os
import datetime

# Make the project root importable (this script lives 2 folders deep in maintenance/)
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..")))

import pysnooper
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

import models
import crud

# Isolated in-memory DB so this never touches the real todo.db
engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
models.Base.metadata.create_all(bind=engine)
Session = sessionmaker(bind=engine)
db = Session()

user = models.User(username="demo_user", hashed_password="x")
db.add(user)
db.commit()
db.refresh(user)

# Sample tasks: only ONE title actually contains a literal underscore.
sample_titles = [
    "Buy groceries",
    "Finish report",
    "Update user_profile module",  # <- the only title with a literal "_"
    "Walk the dog",
]
for title in sample_titles:
    db.add(models.Task(
        title=title,
        priority="medium",
        status="pending",
        user_id=user.id,
        created_at=datetime.datetime.utcnow(),
    ))
db.commit()

trace_path = os.path.join(os.path.dirname(__file__), "pysnooper_trace_output.txt")


@pysnooper.snoop(trace_path, depth=2)
def run_search(db, user_id, search_term):
    return crud.get_tasks(db, user_id=user_id, search=search_term)


if __name__ == "__main__":
    results = run_search(db, user.id, "_")
    print(f"\nSearched for literal '_' -> {len(results)} task(s) matched (expected 1):")
    for t in results:
        print(f"  - {t.title}")
    print(f"\nFull line-by-line trace written to: {trace_path}")
