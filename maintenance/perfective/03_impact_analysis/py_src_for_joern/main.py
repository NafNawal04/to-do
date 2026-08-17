import os
import sys

# Fix Windows cp1252 encoding crash when printing Unicode/emoji characters
if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')
from fastapi import FastAPI, Depends, HTTPException, Query, status
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from sqlalchemy import inspect, text
from sqlalchemy.orm import Session
import models
import schemas
import crud
import auth
from database import engine, get_db


def ensure_legacy_columns():
    inspector = inspect(engine)
    if "users" not in inspector.get_table_names():
        return

    columns = [col["name"] for col in inspector.get_columns("users")]
    if "email_verified" not in columns:
        with engine.begin() as connection:
            connection.execute(text("ALTER TABLE users ADD COLUMN email_verified BOOLEAN NOT NULL DEFAULT 0"))


# Create database tables
ensure_legacy_columns()
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="To-Do Premium App API", description="Backend APIs with SQLite JWT Authentication")

# Authentication API Endpoints
@app.post("/api/auth/register", response_model=schemas.UserResponse, status_code=201)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_username(db, username=user.username)
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )
    return crud.create_user(db=db, user=user)

@app.post("/api/auth/login", response_model=schemas.Token)
def login(user_credentials: schemas.UserCreate, db: Session = Depends(get_db)):
    user = crud.get_user_by_username(db, username=user_credentials.username)
    if not user or not auth.verify_password(user_credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = auth.create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/api/auth/me", response_model=schemas.UserResponse)
def get_me(current_user: models.User = Depends(auth.get_current_user)):
    return current_user

# CRUD API Endpoints (Protected by JWT)
@app.get("/api/tasks", response_model=list[schemas.TaskResponse])
def read_tasks(
    status: str = Query(None, pattern="^(pending|completed)$"),
    priority: str = Query(None, pattern="^(low|medium|high)$"),
    tag: str = Query(None),
    search: str = Query(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    tasks = crud.get_tasks(db, user_id=current_user.id, status=status, priority=priority, tag=tag, search=search)
    return tasks

@app.get("/api/tasks/{task_id}", response_model=schemas.TaskResponse)
def read_task(
    task_id: int, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    db_task = crud.get_task(db, task_id=task_id, user_id=current_user.id)
    if db_task is None:
        raise HTTPException(status_code=404, detail="Task not found")
    return db_task

@app.post("/api/tasks", response_model=schemas.TaskResponse, status_code=201)
def create_task(
    task: schemas.TaskCreate, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    try:
        db_task = crud.create_task(db=db, task=task, user_id=current_user.id)
        return db_task
    except Exception as e:
        raise HTTPException(status_code=400, detail="Could not create task")

@app.put("/api/tasks/{task_id}", response_model=schemas.TaskResponse)
def update_task(
    task_id: int, 
    task_update: schemas.TaskUpdate, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    db_task = crud.get_task(db, task_id=task_id, user_id=current_user.id)
    if db_task is None:
        raise HTTPException(status_code=404, detail="Task not found")
    
    updated_task = crud.update_task(db=db, db_task=db_task, task_update=task_update)
    return updated_task

@app.delete("/api/tasks/{task_id}", response_model=schemas.TaskResponse)
def delete_task(
    task_id: int, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    db_task = crud.get_task(db, task_id=task_id, user_id=current_user.id)
    if db_task is None:
        raise HTTPException(status_code=404, detail="Task not found")
    
    deleted_task = crud.delete_task(db=db, db_task=db_task)
    return deleted_task

# Serve static files
# Ensure the static directory exists before mounting
os.makedirs("static", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
def read_root():
    return FileResponse("static/index.html")
