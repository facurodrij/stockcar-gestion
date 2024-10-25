import os

import numpy as np
import pandas as pd
from server.config import db, app
from server.models.cliente import Cliente
from server.models.parametros import TipoDocumento, Provincia, Genero, \
    TipoResponsable

basedir = os.path.abspath(os.path.dirname(__file__))


def import_data():
    print("Importing data for Provincia model...")
    df = pd.read_json(os.path.join(basedir, '../../../dump/Provinci.json'))

    # Renombrar las columnas para que coincidan con los nombres de las columnas de la tabla
    df = df.rename(columns={
        # Datos Principales
        "PRC_CLAVE": "id",
        "PRC_NOMBRE": "nombre",
        "PRC_COD_AFIP": "codigo_afip"
    })

    # Recorrer todas las columnas y eliminar los espacios en blanco, si es un string
    df = df.map(lambda x: x.strip() if isinstance(x, str) else x)

    df = df.replace({np.nan: None})
    df = df.replace({'': None})

    provincia_list = []
    for index, row in df.iterrows():
        provincia = Provincia(
            id=row['id'],
            nombre=row['nombre'],
            codigo_afip=row['codigo_afip']
        )
        provincia_list.append(provincia)

    db.session.add_all(provincia_list)
    db.session.commit()
    print("Data imported for Provincia model")
