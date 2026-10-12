"""Punto de entrada de la API."""

import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.auth import router as auth_router
from app.api.consumos import router as consumos_router
from app.api.formatos import router as formatos_router
from app.api.material_maestro import router as material_maestro_router
from app.api.ordenes_produccion import router as ordenes_produccion_router
from app.api.recepciones import router as recepciones_router
from app.api.saldos import router as saldos_router
from app.api.usuarios import router as usuarios_router

app = FastAPI(title="Sistema Ingredientes")

CORS_ORIGINS = [
    origen.strip()
    for origen in os.getenv(
        "CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173"
    ).split(",")
    if origen.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api")
app.include_router(usuarios_router, prefix="/api")
app.include_router(material_maestro_router, prefix="/api")
app.include_router(recepciones_router, prefix="/api")
app.include_router(saldos_router, prefix="/api")
app.include_router(ordenes_produccion_router, prefix="/api")
app.include_router(consumos_router, prefix="/api")
app.include_router(formatos_router, prefix="/api")
