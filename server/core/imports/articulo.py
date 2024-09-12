import os
import numpy as np
import pandas as pd
from server.config import db, app
from server.core.models import Articulo

basedir = os.path.abspath(os.path.dirname(__file__))


def import_data():
    print("Importing data for Articulo model...")
    df = pd.read_json(os.path.join(basedir, "../../../dump/Producto.json"))
    df_stock = pd.read_json(os.path.join(basedir, "../../../dump/Stock.json"))

    # Filtrar solo los productos que son deposito 1
    df_stock = df_stock[df_stock["STK_DEPOSITO"] == 1]

    df = df.rename(
        columns={
            "PRO_CODIGO": "id",
            "PRO_CODBAR": "codigo_barras",
            "PRO_NOMBRE": "descripcion",
        }
    )
    # TODO: cargar como descripcion de articulo, los valores en las columnas "PRO_LINEA1", "PRO_LINEA2"...

    # TODO: cargar los codigos de barras adicionales del arhivo ProCod.json


    # Filtrar por "PRO_BAJA": 1, significa que el producto está dado de baja
    df = df[df["PRO_BAJA"] == 0]

    df_stock = df_stock.rename(
        columns={
            "STK_PRODUCTO": "articulo_id",
            "STK_EXISTENCIA": "existencia",
        }
    )

    df = df.map(lambda x: x.strip() if isinstance(x, str) else x)
    df = df.replace({np.nan: None})
    df_stock = df_stock.replace({np.nan: None})
    df_stock = df_stock.map(lambda x: x.strip() if isinstance(x, str) else x)

    articulo_list = []
    for index, row in df.iterrows():
        # Obtener el stock actual del artículo
        stock = df_stock[df_stock["articulo_id"] == row["id"]]
        if len(stock) > 0:
            row["existencia"] = stock["existencia"].values[0]
        else:
            row["existencia"] = 0
        articulo = Articulo(
            id=row["id"],
            codigo_principal=row["codigo_barras"],
            descripcion=row["descripcion"],
            linea_factura=row["descripcion"][:30],
            stock_actual=row["existencia"],
        )
        articulo_list.append(articulo)

    try:
        db.session.add_all(articulo_list)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        print(str(e))
    print("Data imported successfully!")
