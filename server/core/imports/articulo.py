import os
import numpy as np
import pandas as pd
from server.config import db, app
from server.core.models import Articulo

basedir = os.path.abspath(os.path.dirname(__file__))


def import_data():
    print("Importing data for Articulo model...")
    df = pd.read_json(os.path.join(basedir, '../../../dump/Producto.json'))

    df = df.rename(columns={
        # Datos Principales
        "PRO_CODIGO": "id",
        "PRO_CODBAR": "codigo_barras",
        "PRO_NOMBRE": "descripcion",
    })

    df = df.map(lambda x: x.strip() if isinstance(x, str) else x)
    df = df.replace({np.nan: None})
    # df = df.replace({'': None})

    df['descripcion'] += ' ' + df['PRO_LINEA1'].map(str) + ' ' + df['PRO_LINEA2'].map(str) + ' ' + df['PRO_LINEA3'].map(
        str) + df['PRO_LINEA4'].map(str) + ' ' + df['PRO_LINEA5'].map(str) + ' ' + df['PRO_LINEA6'].map(
        str) + ' ' + df['PRO_LINEA7'].map(str)

    # Imprimir solo las columnas modificadas
    print(df[['id', 'codigo_barras', 'descripcion']])

    articulo_list = []
    for index, row in df.iterrows():
        articulo = Articulo(
            id=row['id'],
            codigo_barras=row['codigo_barras'],
            descripcion=row['descripcion'],
        )
        articulo_list.append(articulo)

    try:
        db.session.add_all(articulo_list)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        print(str(e))
    print("Data imported successfully!")
