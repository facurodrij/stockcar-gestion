import importlib
import click
import pandas as pd

from server.config import db, app
from server.core.models import (
    Genero,
    Provincia,
    TipoDocumento,
    TipoResponsable,
    TipoComprobante,
    Moneda,
    TipoPago,
    AlicuotaIVA,
    TipoArticulo,
    TipoUnidad,
    TipoTributo,
    Tributo,
    Comercio,
    Usuario,
    Rol,
)


@app.cli.command("load_fixtures")
def load_fixtures():
    """Load data from JSON files into the database."""
    # Load data for each model
    for model, filename in [
        (Genero, "genero.json"),
        (Provincia, "provincia.json"),
        (TipoDocumento, "tipo_documento.json"),
        (TipoResponsable, "tipo_responsable.json"),
        (TipoComprobante, "tipo_comprobante.json"),
        (Moneda, "moneda.json"),
        (TipoPago, "tipo_pago.json"),
        (AlicuotaIVA, "tipo_alicuota_iva.json"),
        (TipoArticulo, "tipo_articulo.json"),
        (TipoUnidad, "tipo_unidad.json"),
        (TipoTributo, "tipo_tributo.json"),
        (Tributo, "tributo.json"),
        (Comercio, "comercio.json"),
    ]:
        filepath = f"core/fixtures/{filename}"
        df = pd.read_json(filepath)
        for _, row in df.iterrows():
            record = model(**row.to_dict())
            try:
                db.session.add(record)
                db.session.commit()
            except Exception as e:
                print(f"Error loading {model.__name__}: {e}")
                db.session.rollback()
    click.echo("Data loaded successfully!")


@app.cli.command("import")
@click.argument("model_name")
def import_model(model_name):
    """Import data for a specific model.
    :param model_name: The name of the model in snake_case.
    """
    try:
        # Import the module
        module = importlib.import_module(f"server.core.imports.{model_name}")
        # Call the import_data function in the module
        module.import_data()
    except ImportError:
        click.echo(f"No import script found for model: {model_name}")


@app.cli.command("create_user")
@click.argument("username")
@click.argument("password")
@click.argument("email")
def create_user(username, password, email):
    """Create a new user in the database."""
    new_user = Usuario(username=username, password=password, email=email)
    db.session.add(new_user)
    db.session.commit()
    click.echo("User created successfully!")


@app.cli.command("create_superuser")
@click.argument("username")
@click.argument("password")
@click.argument("email")
def create_superuser(username, password, email):
    """Create a new superuser in the database."""
    new_user = Usuario(
        username=username, password=password, email=email, is_superuser=True
    )
    db.session.add(new_user)
    db.session.commit()
    click.echo("Superuser created successfully!")


@app.cli.command("create_roles")
def create_roles():
    """Create the default roles in the database."""
    roles = [
        Rol(id=1, nombre="admin", descripcion="Administrador del sistema"),
        Rol(id=2, nombre="vendedor", descripcion="Vendedor de productos"),
        Rol(id=3, nombre="cobranza", descripcion="Encargado de cobranzas"),
    ]
    db.session.add_all(roles)
    db.session.commit()
    click.echo("Roles created successfully!")


@app.cli.command("create_permissions")
def create_permissions():
    """Create the default permissions in the database."""
    from server.core.models import Permiso

    # Get all models from the models package
    models = importlib.import_module("server.core.models")
    # Add CRUD permissions for each model
    for model_name in dir(models):
        model = getattr(models, model_name)
        if hasattr(model, "__tablename__"):
            permission_name = model.__tablename__
            permissions = [
                Permiso(
                    nombre=f"{permission_name}.view",
                    descripcion="Ver un registro específico",
                ),
                Permiso(
                    nombre=f"{permission_name}.view_all",
                    descripcion="Ver todos los registros",
                ),
                Permiso(
                    nombre=f"{permission_name}.create",
                    descripcion="Crear un nuevo registro",
                ),
                Permiso(
                    nombre=f"{permission_name}.update",
                    descripcion="Actualizar un registro existente",
                ),
                Permiso(
                    nombre=f"{permission_name}.delete",
                    descripcion="Eliminar un registro existente",
                ),
                Permiso(
                    nombre=f"{permission_name}.export",
                    descripcion="Exportar datos a un archivo",
                ),
                Permiso(
                    nombre=f"{permission_name}.import",
                    descripcion="Importar datos desde un archivo",
                ),
                Permiso(
                    nombre=f"{permission_name}.print",
                    descripcion="Imprimir un registro",
                ),
            ]
            for permission in permissions:
                existing_permission = Permiso.query.filter_by(
                    nombre=permission.nombre
                ).first()
                if existing_permission:
                    click.echo(f"Permission {permission.nombre} already exists!")
                    continue
                db.session.add(permission)
    db.session.commit()
    click.echo("Permissions created successfully!")
