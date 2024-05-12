import os

import numpy as np
import pandas as pd
from server.config import db, app
from server.core.models.cliente import Cliente
from server.core.models.parametros import TipoDocumento, Localidad, Provincia, Genero, \
    TipoResponsable

basedir = os.path.abspath(os.path.dirname(__file__))


def import_data():
    print("Importing data for Cliente model...")
    df = pd.read_json(os.path.join(basedir, '../../../dump/Cliente.json'))

    # Renombrar las columnas para que coincidan con los nombres de las columnas de la tabla
    df = df.rename(columns={
        # Datos Principales
        "CLI_NUMERO": "id",
        "CLI_NUMERO_DOC": "nro_doc",
        "CLI_NOMBRE1": "nombre_1",

        # Datos Facturacion
        "CLI_PERCEPCION": "percepcion",
        "DESCUENTO": "descuento",
        "CLI_LIMITE": "limite",
        "CLI_DUPLICADO_FACTURA": "duplicado_factura",

        # Datos Secundarios
        "CLI_NOMBRE2": "nombre_2",
        "CLI_DIRECCION": "direccion",
        "CLI_CODIGO_POST": "CODIGO_POSTAL",
        "CLI_NACIMIENTO": "fecha_nacimiento",
        "CLI_TELEFONO": "telefono",
        "CLI_EMAIL": "email",
        "CLI_OBSERVACION": "observacion",
        "CLI_BAJA": "baja",
        "CLI_FECHA_BAJA": "fecha_baja",

        # Foreign keys
        "CLI_TIPO_DOC": "tipo_doc_id",
        "CLI_TIPO_CONT": "tipo_responsable_id",
        "CLI_LOCALIDAD": "localidad_id",
        "CLI_PROVINCIA": "provincia_id",
        "CLI_GENERO": "genero_id",
    })

    # Recorrer todas las columnas y eliminar los espacios en blanco, si es un string
    df = df.map(lambda x: x.strip() if isinstance(x, str) else x)
    # Reemplazar los valores NaN por Null
    # df = df.where(pd.notnull(df), None)
    # df = df.astype(object).replace(np.nan, 'None')
    df = df.replace({np.nan: None})
    # Convertir los valores '' a None
    df = df.replace({'': None})
    # Convertir los valores None a NaT
    df['fecha_nacimiento'] = df['fecha_nacimiento'].replace({None: pd.NaT})
    df['fecha_baja'] = df['fecha_baja'].replace({None: pd.NaT})

    # Recorrer el dataframe y asignar el tipo de documento y tipo de contribuyente
    # Si coincide el nombre del tipo de documento, se asigna el id.
    # Si coincide la abrebiatura del tipo de contribuyente, se asigna el id.
    for index, row in df.iterrows():
        tipo_doc = TipoDocumento.query.filter_by(nombre=row['tipo_doc_id']).first()
        if tipo_doc:
            df.at[index, 'tipo_doc_id'] = tipo_doc.id
        else:
            df.at[index, 'tipo_doc_id'] = TipoDocumento.query.filter_by(nombre='DNI').first().id  # Default value

        tipo_responsable = TipoResponsable.query.filter_by(abreviatura=row['tipo_responsable_id']).first()
        if tipo_responsable:
            df.at[index, 'tipo_responsable_id'] = tipo_responsable.id
        else:
            df.at[index, 'tipo_responsable_id'] = TipoResponsable.query.get({'id': 1}).id  # Default value

    cliente_list = []
    # Recorrer el dataframe y rellenar la lista de objetos Cliente
    for index, row in df.iterrows():
        cliente = Cliente(
            id=row['id'],
            nro_doc=row['nro_doc'] if row['nro_doc'] else 0,
            nombre_1=row['nombre_1'] if row['nombre_1'] else 'Nombre 1',
            tipo_doc_id=row['tipo_doc_id'],
            tipo_responsable_id=row['tipo_responsable_id'],
        )
        cliente_list.append(cliente)

    # Agregar todos los clientes a la base de datos
    db.session.add_all(cliente_list)
    db.session.commit()
    print("Data imported for Cliente model")
