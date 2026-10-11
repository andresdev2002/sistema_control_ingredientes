"""Punto de entrada de la API."""

from fastapi import FastAPI

from app.api.auth import router as auth_router
from app.api.material_maestro import router as material_maestro_router
from app.api.ordenes_produccion import router as ordenes_produccion_router
from app.api.recepciones import router as recepciones_router
from app.api.saldos import router as saldos_router
from app.api.usuarios import router as usuarios_router

app = FastAPI(title="Sistema Ingredientes")

app.include_router(auth_router, prefix="/api")
app.include_router(usuarios_router, prefix="/api")
app.include_router(material_maestro_router, prefix="/api")
app.include_router(recepciones_router, prefix="/api")
app.include_router(saldos_router, prefix="/api")
app.include_router(ordenes_produccion_router, prefix="/api")
