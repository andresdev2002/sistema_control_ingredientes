"""rol CALIDAD y calidad_id en formatos

Revision ID: a7c3e1d94b20
Revises: f53c76eb6bd4
Create Date: 2026-10-12 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a7c3e1d94b20'
down_revision: Union[str, Sequence[str], None] = 'f53c76eb6bd4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # ALTER TYPE ... ADD VALUE no puede usarse en la misma transacción que lo
    # referencia; autocommit_block lo ejecuta fuera de la transacción de Alembic.
    with op.get_context().autocommit_block():
        op.execute("ALTER TYPE rol_usuario ADD VALUE IF NOT EXISTS 'CALIDAD'")

    op.add_column(
        'formatos_fo_pfto_0057',
        sa.Column('calidad_id', sa.Integer(), nullable=True),
    )
    op.create_foreign_key(
        'formatos_fo_pfto_0057_calidad_id_fkey',
        'formatos_fo_pfto_0057', 'usuarios',
        ['calidad_id'], ['id'],
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_constraint(
        'formatos_fo_pfto_0057_calidad_id_fkey',
        'formatos_fo_pfto_0057',
        type_='foreignkey',
    )
    op.drop_column('formatos_fo_pfto_0057', 'calidad_id')
    # El valor 'CALIDAD' de rol_usuario NO se elimina: PostgreSQL no soporta
    # ALTER TYPE ... DROP VALUE. Quitarlo exigiría recrear el tipo y migrar
    # la columna usuarios.rol, y fallaría si existe algún usuario con ese rol.
