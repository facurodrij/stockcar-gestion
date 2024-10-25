import os
import numpy as np
import pandas as pd
from datetime import datetime
from server.config import db
from server.models import Venta, PuntoVenta, TipoComprobante

basedir = os.path.abspath(os.path.dirname(__file__))


def import_data():
    print("Importing data for Venta model...")
    df = pd.read_json(os.path.join(basedir, "../../../dump/Doc_Vent.json"))

    df = df.rename(
        columns={
            "DOV_NUMERO": "numero",
            "DOV_CLINOMBRE": "nombre_cliente",
            "DOV_FECHA": "fecha_hora",
            "DOV_DESCUENTO": "descuento",
            "DOV_RECARGO": "recargo",
            "DOV_COTIZACION": "moneda_cotizacion",
            "DOV_GRAVADO": "gravado",
            "DOV_IVA21": "total_iva",
            "DOV_TOTAL": "total",
            "DOV_CAE": "cae",
            "DOV_VENCIMIENTO_CAE": "vencimiento_cae",
            "DOV_SUCURSAL": "nro_punto_venta",
            "DOV_CLIENTE": "cliente_id",
        }
    )

    df = df.map(lambda x: x.strip() if isinstance(x, str) else x)
    df = df.replace({np.NaN: None})
    # null to none
    df = df.replace({"": None})
    df = df.replace({pd.NaT: None})

    df["fecha_hora"] = pd.to_datetime(df["fecha_hora"])
    #df["vencimiento_cae"] = pd.to_datetime(df["vencimiento_cae"], errors='coerce')
    #df["vencimiento_cae"] = df["vencimiento_cae"].fillna(pd.to_datetime(df["vencimiento_cae"], format="%Y-%m-%d %H:%M:%S", errors='coerce'))

    df = df.map(lambda x: None if pd.isna(x) else x)

    errors = []
    venta_list = []
    for index, row in df.iterrows():
        punto_venta_id = 1  # Punto de venta por defecto
        if row["DOV_TIPO_DOC"] == "F" and row["DOV_LETRA"] == "A":
            tipo_comprobante_id = 1  # Factura A
            estado = 'facturado'
        elif row["DOV_TIPO_DOC"] == "F" and row["DOV_LETRA"] == "B":
            tipo_comprobante_id = 5  # Factura B
            estado = 'facturado'
        elif row["DOV_TIPO_DOC"] == "P":
            tipo_comprobante_id = 10  # Presupuesto
            estado = 'ticket'
        else:
            tipo_comprobante_id = 9  # Remito
            estado = 'ticket'
        # Formato fecha 2022-08-15 10:47:32.670
        vencimiento_cae = datetime.strptime(row["vencimiento_cae"], "%Y-%m-%d %H:%M:%S.%f") if row["vencimiento_cae"] else None

        venta = Venta(
            numero=row["numero"],
            nombre_cliente=row["nombre_cliente"],
            cliente_id=row["cliente_id"],
            fecha_hora=row["fecha_hora"],
            tipo_comprobante_id=tipo_comprobante_id,
            punto_venta_id=punto_venta_id,
            descuento=row["descuento"] if row["descuento"] else 0,
            recargo=row["recargo"] if row["recargo"] else 0,
            gravado=row["gravado"],
            total_iva=row["total_iva"],
            total_tributos=row["DOV_PERCEPCIONES"] + row["DOV_PERCEPCIONES2"],
            total=row["total"],
            cae=row["cae"] if row["cae"] else None,
            vencimiento_cae=vencimiento_cae,
            estado=estado,
        )
        venta_list.append(venta)
    try:
        db.session.add_all(venta_list)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        print(str(e))
    print("Data imported successfully!")