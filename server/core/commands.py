import importlib

import click
import pandas as pd
from server.config import db, app
from server.core.models import Genero, Provincia, TipoDocumento, TipoResponsable, TipoComprobante, Moneda, \
    TipoPago, AlicuotaIVA, TipoArticulo, TipoUnidad, TipoTributo, Tributo, Comercio, Usuario, Rol


@app.cli.command("load_fixtures")
def load_fixtures():
    """Load data from JSON files into the database."""
    # Load data for each model
    for model, filename in [(Genero, 'genero.json'), (Provincia, 'provincia.json'),
                            (TipoDocumento, 'tipo_documento.json'), (TipoResponsable, 'tipo_responsable.json'),
                            (TipoComprobante, 'tipo_comprobante.json'), (Moneda, 'moneda.json'),
                            (TipoPago, 'tipo_pago.json'), (AlicuotaIVA, 'tipo_alicuota_iva.json'),
                            (TipoArticulo, 'tipo_articulo.json'), (TipoUnidad, 'tipo_unidad.json'),
                            (TipoTributo, 'tipo_tributo.json'), (Tributo, 'tributo.json'), (Comercio, 'comercio.json')]:
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
    new_user = Usuario(
        username=username,
        password=password,
        email=email
    )
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
        username=username,
        password=password,
        email=email,
        is_superuser=True
    )
    db.session.add(new_user)
    db.session.commit()
    click.echo("Superuser created successfully!")
