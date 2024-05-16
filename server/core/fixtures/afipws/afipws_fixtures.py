import io
import json
import pandas as pd

from afip import Afip


def guardar_datos_afip(metodo, nombre_archivo, columnas_renombradas, columnas_eliminadas, extracciones=[]):
    datos = metodo()
    df = pd.read_json(io.StringIO(json.dumps(datos)))
    df = df.rename(columns=columnas_renombradas)
    df = df.replace({"NULL": None})
    df = df.drop(columns=columnas_eliminadas)

    for extraccion in extracciones:
        df[extraccion["nueva_columna"]] = df[extraccion["columna_origen"]].str.extract(extraccion["patron"])
        df[extraccion["nueva_columna"]] = pd.to_numeric(df[extraccion["nueva_columna"]])

    df.to_json(nombre_archivo, orient="records", force_ascii=False)
    print(f"Datos guardados en {nombre_archivo}")


cert = open("../../../instance/afipws_test.cert").read()
key = open("../../../instance/afipws_test.key").read()

afip = Afip({
    "CUIT": 20428129572,
    "cert": cert,
    "key": key
})

guardar_datos_afip(
    afip.ElectronicBilling.getVoucherTypes,
    "tipo_comprobante.json",
    {"Id": "codigo_afip", "Desc": "descripcion"},
    ["FchDesde", "FchHasta"]
)

guardar_datos_afip(
    afip.ElectronicBilling.getConceptTypes,
    "tipo_concepto.json",
    {"Id": "codigo_afip", "Desc": "descripcion"},
    ["FchDesde", "FchHasta"]
)

guardar_datos_afip(
    afip.ElectronicBilling.getDocumentTypes,
    "tipo_documento.json",
    {"Id": "codigo_afip", "Desc": "descripcion"},
    ["FchDesde", "FchHasta"]
)

guardar_datos_afip(
    afip.ElectronicBilling.getAliquotTypes,
    "tipo_alicuota_iva.json",
    {"Id": "codigo_afip", "Desc": "descripcion"},
    ["FchDesde", "FchHasta"],
    [{"nueva_columna": "porcentaje", "columna_origen": "descripcion", "patron": r"(\d+\.\d+|\d+)"}]
)

guardar_datos_afip(
    afip.ElectronicBilling.getCurrenciesTypes,
    "tipo_moneda.json",
    {"Id": "codigo_afip", "Desc": "descripcion"},
    ["FchDesde", "FchHasta"]
)

guardar_datos_afip(
    afip.ElectronicBilling.getOptionsTypes,
    "tipo_opcion.json",
    {"Id": "codigo_afip", "Desc": "descripcion", "FchDesde": "fecha_desde", "FchHasta": "fecha_hasta"},
    []
)

guardar_datos_afip(
    afip.ElectronicBilling.getTaxTypes,
    "tipo_tributo.json",
    {"Id": "codigo_afip", "Desc": "descripcion"},
    ["FchDesde", "FchHasta"]
)
