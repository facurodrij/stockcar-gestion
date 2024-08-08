import pytest
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib.units import mm
from reportlab.platypus import Table, TableStyle, Paragraph
from reportlab.lib import colors
import os


@pytest.fixture
def pdf_path():
    return os.path.join(os.path.dirname(__file__), "venta_test.pdf")


class TestGeneratePDF(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        canvas.Canvas.__init__(self, *args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        """add page info to each page (page x of y)"""
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_number(num_pages)
            canvas.Canvas.showPage(self)
        canvas.Canvas.save(self)

    def draw_page_number(self, page_count):
        self.setFont("Helvetica", 10)
        self.drawRightString(
            200 * mm, 10 * mm, "Pág. %d / %d" % (self._pageNumber, page_count)
        )

    def truncate_text(self, text, max_length):
        if len(text) > max_length:
            return text[: max_length - 3] + "..."
        return text


def test_generate_pdf(pdf_path):
    # Datos de prueba
    venta_id = 1
    venta_numero = "00000001"
    venta_fecha_hora = "01/10/2023 12:00"
    renglones = [
        f"Renglón {i}" for i in range(1, 100)
    ]  # Simulación de muchos renglones
    logo_path = "/home/facurodrij/VSCodeProjects/stockcar-gestion/server/media/Logocabecerafactura.png"

    # Crear el PDF
    buffer = open(pdf_path, "wb")
    c = TestGeneratePDF(buffer, pagesize=A4)

    # Cabecera de la factura
    # Cuadrado para toda la cabecera
    c.rect(20, 720, 555, 105)
    # Dibujar cuadrado que rodea la Letra A y el texto 'Cod. 1'
    c.rect(275, 775, 50, 50)
    # Linea que conectar el cuadrado de la letra A con el cuadrado de la cabecera
    c.line(300, 775, 300, 720)
    c.setFontSize(32)
    c.drawCentredString(300, 795, "A")
    c.setFontSize(8)
    c.drawCentredString(300, 780, "COD. 1")
    c.setFont("Helvetica-Bold", 16)
    c.drawString(340, 800, "NOTA DE CREDITO")
    c.setFontSize(10)
    # c.drawString(510, 800, 'ORIGINAL')
    # Punto de venta, nro de factura, fecha de emisión
    c.drawString(340, 780, "Punto de Venta: 0001")
    c.drawString(460, 780, f"Nro. Comp: {venta_numero}")
    c.drawString(340, 765, f"Fecha de Emisión: {venta_fecha_hora}")
    # CUIT, INGRESOS BRUTOS, INICIO DE ACTIVIDADES
    c.drawString(340, 745, "CUIT: 30-12345678-0")
    c.drawString(460, 745, "IIBB: 12345678912")
    c.drawString(340, 730, "Inicio de Actividades: 01/01/2021")
    # Agregar logo de la empresa (475px x 150px)
    c.drawImage(logo_path, 30, 700, width=240, height=None, preserveAspectRatio=True)

    # Sección de datos del cliente
    # Cuadrado para toda la sección
    c.rect(20, 660, 555, 55)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(30, 700, "Cliente:")
    c.drawString(30, 685, "Domicilio:")
    c.drawString(30, 670, "Localidad:")
    c.drawString(320, 700, "CUIT:")  # TODO: Cambiar por "Tipo de Documento"
    c.drawString(320, 685, "Condición de IVA:")
    c.drawString(320, 670, "Condición de Venta:")
    c.setFont("Helvetica", 10)
    c.drawString(80, 700, "Nombre del Cliente")
    c.drawString(90, 685, "Calle 123")
    c.drawString(90, 670, "Localidad")
    c.drawString(360, 700, "30-12345678-0")
    c.drawString(420, 685, "Responsable Inscripto")
    c.drawString(420, 670, "Contado")

    # Ahora vamos a agregar la sección anterior pero con Tablas
    # Sección de renglones
    data = [
        [
            "Cód. Barras",
            "Descripción",
            "Cantidad",
            "Precio Unitario",
            "% IVA",
            "Subtotal",
        ],
        [
            "1SDFGHJKLPOIUYT",
            c.truncate_text("1SDFGHJKLQWERTYUIOPSARTOG-DSDFKFGH", 33),
            "1",
            "$100.000.000,55",
            "21%",
            "$121",
        ],
        [
            "2SDFGHJKLPOIUYT",
            c.truncate_text("2SDFGHJKLQWERTYUIOPSARTOG-DSDFKFGH", 33),
            "2",
            "$200.000.000,55",
            "21%",
            "$242",
        ],
        [
            "3SDFGHJKLPOIUYT",
            c.truncate_text("3SDFGHJKLQWERTYUIOPSARTOG-DSDFKFGH", 33),
            "3",
            "$300.000.000,55",
            "21%",
            "$363",
        ],
        [
            "4SDFGHJKLPOIUYT",
            c.truncate_text("4SDFGHJKLQWERTYUIOPSARTOG-DSDFKFGH", 33),
            "4",
            "$400.000.000,55",
            "21%",
            "$484",
        ],
        [
            "5SDFGHJKLPOIUYT",
            c.truncate_text("5SDFGHJKLQWERTYUIOPSARTOG-DSDFKFGH", 33),
            "5",
            "$500.000.000,55",
            "21%",
            "$605",
        ],
        [
            "6SDFGHJKLPOIUYT",
            c.truncate_text("6SDFGHJKLQWERTYUIOPSARTOG-DSDFKFGH", 33),
            "6",
            "$600.000.000,55",
            "21%",
            "$726",
        ],
        [
            "7SDFGHJKLPOIUYT",
            c.truncate_text("7SDFGHJKLQWERTYUIOPSARTOG-DSDFKFGH", 33),
            "7",
            "$700.000.000,55",
            "21%",
            "$847",
        ],
        [
            "8SDFGHJKLPOIUYT",
            c.truncate_text("8SDFGHJKLQWERTYUIOPSARTOG-DSDFKFGH", 33),
            "8",
            "$800.000.000,55",
            "21%",
            "$968",
        ],
        [
            "9SDFGHJKLPOIUYT",
            c.truncate_text("9SDFGHJKLQWERTYUIOPSARTOG-DSDFKFGH", 33),
            "9",
            "$900.000.000,55",
            "21%",
            "$1089",
        ],
        [
            "10SDFGHJKLPOIUYT",
            c.truncate_text("10SDFGHJKLQWERTYUIOPSARTOG-DSDFKFGH", 33),
            "10",
            "$1000.000.000,55",
            "21%",
            "$1210",
        ],
        [
            "11SDFGHJKLPOIUYT",
            c.truncate_text("11SDFGHJKLQWERTYUIOPSARTOG-DSDFKFGH", 33),
            "11",
            "$1100.000.000,55",
            "21%",
            "$1331",
        ],
        [
            "12SDFGHJKLPOIUYT",
            c.truncate_text("12SDFGHJKLQWERTYUIOPSARTOG-DSDFKFGH", 33),
            "12",
            "$1200.000.000,55",
            "21%",
            "$1452",
        ],
        [
            "13SDFGHJKLPOIUYT",
            c.truncate_text("13SDFGHJKLQWERTYUIOPSARTOG-DSDFKFGH", 33),
            "13",
            "$1300.000.000,55",
            "21%",
            "$1573",
        ],
        [
            "14SDFGHJKLPOIUYT",
            c.truncate_text("14SDFGHJKLQWERTYUIOPSARTOG-DSDFKFGH", 33),
            "14",
            "$1400.000.000,55",
            "21%",
            "$1694",
        ],
        [
            "15SDFGHJKLPOIUYT",
            c.truncate_text("15SDFGHJKLQWERTYUIOPSARTOG-DSDFKFGH", 33),
            "15",
            "$1500.000.000,55",
            "21%",
            "$1815",
        ],
        [
            "16SDFGHJKLPOIUYT",
            c.truncate_text("16SDFGHJKLQWERTYUIOPSARTOG-DSDFKFGH", 33),
            "16",
            "$1600.000.000,55",
            "21%",
            "$1936",
        ],
        [
            "17SDFGHJKLPOIUYT",
            c.truncate_text("17SDFGHJKLQWERTYUIOPSARTOG-DSDFKFGH", 33),
            "17",
            "$1700.000.000,55",
            "21%",
            "$2057",
        ],
        [
            "18SDFGHJKLPOIUYT",
            c.truncate_text("18SDFGHJKLQWERTYUIOPSARTOG-DSDFKFGH", 33),
            "18",
            "$1800.000.000,55",
            "21%",
            "$2178",
        ],
        [
            "19SDFGHJKLPOIUYT",
            c.truncate_text("19SDFGHJKLQWERTYUIOPSARTOG-DSDFKFGH", 33),
            "19",
            "$1900.000.000,55",
            "21%",
            "$2299",
        ],
        [
            "20SDFGHJKLPOIUYT",
            c.truncate_text("20SDFGHJKLQWERTYUIOPSARTOG-DSDFKFGH", 33),
            "20",
            "$2000.000.000,55",
            "21%",
            "$2420",
        ],
    ]
    table_y_max = 655
    row_heights = [20] + [17] * (len(data) - 1)
    t = Table(data, colWidths=[120, 185, 45, 85, 35, 85], rowHeights=row_heights)
    t.setStyle(
        TableStyle(
            [
                ("FONTSIZE", (0, 0), (-1, -1), 8),
                ("ALIGN", (0, 0), (0, 2), "LEFT"),
                ("ALIGN", (2, 0), (-1, -1), "RIGHT"),
                ("GRID", (0, 0), (-1, 0), 1, colors.black),
                # ("BACKGROUND", (0, 0), (-1, 0), colors.lightgrey)
            ]
        )
    )
    t.wrapOn(c, 0, 0)
    t.drawOn(c, 20, table_y_max - sum(row_heights))

    # Sección de totales y otros tributos
    c.rect(20, 140, 555, 130)
    c.setFont("Helvetica-Bold", 8)
    c.drawString(30, 255, "Otros Tributos:")

    # Tabla de otros tributos
    data = [
        ["Descripción", "Alic. %", "Importe"],
        ["Impuesto 1", "21%", "$100"],
        ["Impuesto 2", "10.5%", "$50"],
        ["Impuesto 3", "5%", "$25"],
    ]

    row_heights = [20] + [16] * (len(data) - 1)

    t = Table(data, colWidths=[150, 40, 80], rowHeights=row_heights)
    t.setStyle(
        TableStyle(
            [
                ("FONTSIZE", (0, 0), (-1, -1), 8),
                ("ALIGN", (0, 0), (-1, -1), "LEFT"),
                ("ALIGN", (1, 0), (-1, -1), "RIGHT"),
                ("GRID", (0, 0), (-1, 0), 1, colors.black),
                # ("BACKGROUND", (0, 0), (-1, 0), colors.lightgrey)
            ]
        )
    )
    t.wrapOn(c, 0, 0)
    t.drawOn(c, 30, 250 - sum(row_heights))

    # Sección de totales
    c.setFont("Helvetica-Bold", 10)
    c.drawRightString(450, 250, "Subtotal: $")
    c.drawRightString(450, 235, "Descuento: $")
    c.drawRightString(450, 220, "Importe gravado: $")
    c.drawRightString(450, 205, "Importe IVA: $")
    c.drawRightString(450, 190, "Importe otros tributos: $")
    c.setFont("Helvetica-Bold", 12)
    c.drawRightString(450, 170, "Importe Total: $")
    c.setFont("Helvetica", 10)
    c.drawRightString(570, 250, "1.000.000.258,55")
    c.drawRightString(570, 235, "0,00")
    c.drawRightString(570, 220, "1.000.000.258,55")
    c.drawRightString(570, 205, "210.000.258,55")
    c.drawRightString(570, 190, "175.000.258,55")
    c.setFont("Helvetica-Bold", 12)
    c.drawRightString(570, 170, "1.385.000.258,55")
    # Total en letras
    c.setFont("Helvetica", 7)
    c.drawString(
        30,
        145,
        "Son PESOS un mil trescientos ochenta y cinco millones doscientos cincuenta y ocho mil quinientos cincuenta y cinco",
    )

    # Sección de CAE, CAE vto, QR
    c.setFont("Helvetica-Bold", 10)
    c.drawRightString(440, 110, "CAE N°:")
    c.drawRightString(440, 95, "Fecha de Vto. de CAE:")
    c.setFont("Helvetica", 10)
    c.drawRightString(550, 110, "135469896513216")
    c.drawRightString(550, 95, "01/10/2023")

    afip_logo_path = "/home/facurodrij/VSCodeProjects/stockcar-gestion/server/media/afip-logo-nuevo.png"
    c.drawImage(afip_logo_path, 110, 0, width=100, height=None, preserveAspectRatio=True)
    # Font oblique bold
    c.setFont("Helvetica-BoldOblique", 10)
    c.drawString(110, 70, "Comprobante Autorizado")
    c.setFont("Helvetica-BoldOblique", 6)
    c.drawString(110, 60, "Esta Administración Federal no se responsabiliza por los datos ingresados en el detalle de la operación")

    codigo_qr_path = "/home/facurodrij/VSCodeProjects/stockcar-gestion/server/media/codigo-qr.png"
    c.drawImage(codigo_qr_path, 30, -35, width=60, height=None, preserveAspectRatio=True)

    # add_content(c, renglones)
    # add_page_number(c, None)
    c.showPage()
    c.save()
    buffer.close()

    # Verificar que el archivo PDF se ha creado
    assert os.path.exists(pdf_path)

    # Opcional: Verificar el contenido del PDF
    # Aquí podrías agregar más verificaciones si es necesario


if __name__ == "__main__":
    pytest.main()
