from sqlalchemy.orm import Session
import models
import schemas
import auth
import datetime

# User Operations
def get_user_by_username(db: Session, username: str):
    return db.query(models.User).filter(models.User.username == username).first()

def create_user(db: Session, user: schemas.UserCreate):
    hashed_pwd = auth.hash_password(user.password)
    db_user = models.User(username=user.username, hashed_password=hashed_pwd)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

# Task Operations (Isolated by user_id)
def get_tasks(db: Session, user_id: int, status: str = None, priority: str = None, tag: str = None, search: str = None):
    query = db.query(models.Task).filter(models.Task.user_id == user_id)
    if status:
        query = query.filter(models.Task.status == status)
    if priority:
        query = query.filter(models.Task.priority == priority)
    if tag:
        query = query.filter(models.Task.tag == tag)
    if search:
        query = query.filter(
            (models.Task.title.ilike(f"%{search}%")) | 
            (models.Task.description.ilike(f"%{search}%"))
        )
    return query.order_by(models.Task.created_at.desc()).all()

def get_task(db: Session, task_id: int, user_id: int):
    return db.query(models.Task).filter(models.Task.id == task_id, models.Task.user_id == user_id).first()

def create_task(db: Session, task: schemas.TaskCreate, user_id: int):
    db_task = models.Task(
        title=task.title,
        description=task.description,
        priority=task.priority,
        tag=task.tag,
        due_date=task.due_date,
        status="pending",
        user_id=user_id,
        created_at=datetime.datetime.utcnow()
    )
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task

def update_task(db: Session, db_task: models.Task, task_update: schemas.TaskUpdate):
    update_data = task_update.model_dump(exclude_unset=True)
    
    # If task status changes, set completed_at
    if "status" in update_data:
        if update_data["status"] == "completed" and db_task.status != "completed":
            db_task.completed_at = datetime.datetime.utcnow()
        elif update_data["status"] == "pending" and db_task.status != "pending":
            db_task.completed_at = None
            
    for key, value in update_data.items():
        setattr(db_task, key, value)
        
    db.commit()
    db.refresh(db_task)
    return db_task

def delete_task(db: Session, db_task: models.Task):
    db.delete(db_task)
    db.commit()
    return db_task
