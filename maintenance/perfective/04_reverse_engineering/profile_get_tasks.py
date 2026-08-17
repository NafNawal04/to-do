"""
Perfective Maintenance - Reverse Engineering step
=====================================================
Profile crud.get_tasks() with cProfile against the same 20,000-row
benchmark dataset from Program Comprehension, to get exact timing/
call-count data (not just the Viztracer call-timeline overview) and
pinpoint the real bottleneck before making any change.

Run with:  .venv/Scripts/python maintenance/perfective/04_reverse_engineering/profile_get_tasks.py
"""
import sys
import os
import cProfile
import pstats

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..")))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import models
import crud

BENCH_DB = os.path.join(os.path.dirname(__file__), "..", "01_program_comprehension", "bench.db")
PROF_OUT = os.path.join(os.path.dirname(__file__), "get_tasks.prof")
SUMMARY_OUT = os.path.join(os.path.dirname(__file__), "profile_summary.txt")

if not os.path.exists(BENCH_DB):
    print(f"ERROR: {BENCH_DB} not found. Run seed_and_trace.py from "
          f"01_program_comprehension/ first to generate the benchmark dataset.")
    sys.exit(1)

engine = create_engine(f"sqlite:///{BENCH_DB}", connect_args={"check_same_thread": False})
Session = sessionmaker(bind=engine)
db = Session()


def run_representative_queries():
    """20 varied calls across different users/filter combos, to get a
    stable profile rather than one lucky/unlucky single call."""
    for user_id in range(1, 21):
        crud.get_tasks(db, user_id=user_id, status="pending")
        crud.get_tasks(db, user_id=user_id, priority="high", tag="Work")
        crud.get_tasks(db, user_id=user_id)


if __name__ == "__main__":
    profiler = cProfile.Profile()
    profiler.enable()
    run_representative_queries()
    profiler.disable()
    profiler.dump_stats(PROF_OUT)

    stats = pstats.Stats(profiler)
    stats.sort_stats("cumulative")

    with open(SUMMARY_OUT, "w") as f:
        import io
        buf = io.StringIO()
        stats_for_file = pstats.Stats(profiler, stream=buf)
        stats_for_file.sort_stats("cumulative")
        stats_for_file.print_stats(20)
        f.write(buf.getvalue())

    print(f"Profile saved to: {PROF_OUT}")
    print(f"Text summary saved to: {SUMMARY_OUT}")
    print("\nTo view the interactive flame graph:")
    print(f"  snakeviz {PROF_OUT}")
    print("\n--- Top of the summary ---")
    stats.print_stats(15)
