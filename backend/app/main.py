"""Punto de entrada de la API."""

from fastapi import FastAPI

from app.api.auth import router as auth_router

app = FastAPI(title="Sistema Ingredientes")

app.include_router(auth_router, prefix="/api")
