"""Script temporal para crear el primer usuario LIDER en la base de datos.
Usar una sola vez para bootstrap, luego borrar."""

from app.database import SessionLocal
from app.models.usuario import RolUsuario
from app.schemas.usuario import UsuarioCreate
from app.services.usuario_service import crear_usuario

if __name__ == "__main__":
    nombre = input("Nombre: ")
    documento = input("Documento: ")
    password = input("Password: ")

    datos = UsuarioCreate(
        nombre=nombre,
        documento=documento,
        rol=RolUsuario.LIDER,
        password=password,
        lider_id=None,
    )

    db = SessionLocal()
    try:
        usuario = crear_usuario(db, datos)
        print(f"Usuario LIDER creado: id={usuario.id}, documento={usuario.documento}")
    finally:
        db.close()
