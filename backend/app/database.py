"""Conexión a PostgreSQL vía SQLAlchemy. Lee la URL desde .env, nunca hardcodeada."""

import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()  # todos los modelos heredan de esta clase


def get_db():
    """Dependencia de FastAPI: entrega una sesión y la cierra siempre al terminar, incluso si algo falla."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()