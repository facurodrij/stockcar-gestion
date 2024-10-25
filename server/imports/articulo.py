import os
import numpy as np
import pandas as pd
from server.config import db, app
from server.models import Articulo

basedir = os.path.abspath(os.path.dirname(__file__))


def import_data():
    print("Importing data for Articulo model...")
    df = pd.read_json(os.path.join(basedir, "../../../dump/Producto.json"))
    df_stock = pd.read_json(os.path.join(basedir, "../../../dump/Stock.json"))
    df_codigos = pd.read_json(os.path.join(basedir, "../../../dump/ProdCod.json"))

    # Limpiar los datos del DataFrame principal
    df = df.map(lambda x: x.strip() if isinstance(x, str) else x)
    # Renombrar las columnas del DataFrame principal
    df = df.rename(columns={"PRO_CODIGO": "id", "PRO_CODBAR": "codigo_principal"})
    # Crear una columna con la descripción del producto
    df["descripcion"] = (
        df["PRO_LINEA1"]
        + " "
        + df["PRO_LINEA2"]
        + " "
        + df["PRO_LINEA3"]
        + " "
        + df["PRO_LINEA4"]
    )
    # Filtrar los productos dados de alta
    df = df[df["PRO_BAJA"] == 0]
    # Limpiar los datos del DataFrame principal nuevamente
    df = df.map(lambda x: x.strip() if isinstance(x, str) else x)
    df = df.replace({"": None})
    df = df.replace({np.nan: None})
    df = df.replace({"¥": "Ñ", "¤": "ñ"}, regex=True)

    # Limpiar los datos del DataFrame de stock
    df_stock = df_stock.replace({np.nan: None})
    df_stock = df_stock.map(lambda x: x.strip() if isinstance(x, str) else x)
    # Filtrar los productos en stock en el depósito 1
    df_stock = df_stock[df_stock["STK_DEPOSITO"] == 1]
    # Renombrar las columnas del DataFrame de stock
    df_stock = df_stock.rename(
        columns={
            "STK_PRODUCTO": "articulo_id",
            "STK_EXISTENCIA": "existencia",
        }
    )

    # Limpiar los datos del DataFrame de códigos
    df_codigos = df_codigos.map(lambda x: x.strip() if isinstance(x, str) else x)
    df_codigos = df_codigos.replace({np.nan: None})
    # Renombrar las columnas del DataFrame de códigos
    df_codigos = df_codigos.rename(
        columns={
            "PDC_CODIGO": "articulo_id",
            "PDC_CODBAR": "codigo",
        }
    )

    articulo_list = []
    for index, row in df.iterrows():
        # Crear una instancia de Articulo
        articulo = Articulo(
            id=row["id"],
            codigo_principal=row["codigo_principal"],
            descripcion=row["descripcion"] if row["descripcion"] else "Sin descripción",
            linea_factura=(
                row["descripcion"][:30] if row["descripcion"] else "Sin descripción"
            ),
        )

        # Obtener el stock actual del artículo y asignarlo a la instancia
        stock = df_stock[df_stock["articulo_id"] == row["id"]]
        if len(stock) > 0:
            row["existencia"] = stock["existencia"].values[0]
        else:
            row["existencia"] = 0
        articulo.stock_actual = row["existencia"]
        
        # Obtener los códigos asociados al artículo y asignarlos a la instancia
        codigos = df_codigos[df_codigos["articulo_id"] == row["id"]]
        # Quitar el código principal de la lista de códigos para evitar duplicados
        codigos = codigos[codigos["codigo"] != row["codigo_principal"]]
        if len(codigos) > 0:
            articulo.codigo_secundario = codigos["codigo"].values[0]
            articulo.codigo_terciario = (
                codigos["codigo"].values[1] if len(codigos) > 1 else None
            )
            articulo.codigo_cuaternario = (
                codigos["codigo"].values[2] if len(codigos) > 2 else None
            )
            if len(codigos) > 3:
                codigos_adicionales = []
                for cod in codigos["codigo"].values[3:]:
                    codigos_adicionales.append(cod)
                articulo.codigo_adicional = codigos_adicionales

        articulo_list.append(articulo)

    try:
        db.session.add_all(articulo_list)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        print(str(e))
    print("Data imported successfully!")
