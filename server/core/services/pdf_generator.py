import os
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib.units import mm, inch
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import Paragraph, Frame, Table, TableStyle
from reportlab.lib import colors
from num2words import num2words

from server.core.models import Venta, EstadoVenta


# TODO: Generar codigo QR con la informacion de la venta

class BasePDFGenerator(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        canvas.Canvas.__init__(self, *args, **kwargs)
        self._saved_page_states = []
        self.header_image = "/home/facurodrij/VSCodeProjects/stockcar-gestion/server/media/Logocabecerafactura.png"

    def truncate_text(self, text, max_length):
        if len(text) > max_length:
            return text[: max_length - 3] + "..."
        return text


class A4PDFGenerator(BasePDFGenerator):
    def __init__(self, *args, **kwargs):
        BasePDFGenerator.__init__(self, *args, **kwargs)
        self.setPageSize(A4)

    def showPage(self):
        "Add a page, then start a new page"
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        """Add page numbers to each page and save the PDF"""
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_number(num_pages)
            canvas.Canvas.showPage(self)
        canvas.Canvas.save(self)

    def draw_page_number(self, page_count):
        "Draw page number at the bottom of each page"
        self.setFont("Helvetica", 10)
        self.drawRightString(
            200 * mm, 10 * mm, "Pág. %d / %d" % (self._pageNumber, page_count)
        )

    def draw_header(self):
        "Draw a header at the top of the page"
        self.rect(20, 720, 555, 105)  # Rectangle for header
        self.rect(275, 775, 50, 50)  # Rectangle for letter and code
        self.line(300, 775, 300, 720)  # Vertical line
        self.setFont("Helvetica", 32)
        self.drawCentredString(300, 795, f"{self.venta.tipo_comprobante.letra}")
        self.setFontSize(8)
        if self.venta.tipo_comprobante.codigo_afip:
            self.drawCentredString(
                300, 780, f"COD. {self.venta.tipo_comprobante.codigo_afip:02d}"
            )
        self.setFont("Helvetica-Bold", 16)
        if self.venta.estado == EstadoVenta.facturado:
            self.drawString(340, 800, "FACTURA")
        elif self.venta.estado == EstadoVenta.ticket:
            self.drawString(340, 800, f"{self.venta.tipo_comprobante.descripcion}")
        elif self.venta.estado == EstadoVenta.anulado:
            self.drawString(340, 800, "NOTA DE CREDITO")
        self.setFontSize(10)
        self.drawString(340, 780, f"Punto de Venta: {self.venta.punto_venta:04d}")
        self.drawString(460, 780, f"Nro. Comp: {self.venta.numero:08d}")
        self.drawString(
            340,
            765,
            f"Fecha de Emisión: {self.venta.fecha_hora.strftime('%d/%m/%Y %H:%M:%S')}",
        )
        self.drawString(340, 745, "CUIT: 30-12345678-0")
        self.drawString(460, 745, "IIBB: 12345678912")
        self.drawString(
            340, 730, "Inicio de Actividades: 01/01/2021"
        )  # TODO: Obtener de la base de datos
        # Agregar logo de la empresa (475px x 150px)
        self.drawImage(
            self.header_image, 30, 700, width=240, height=None, preserveAspectRatio=True
        )

    def draw_customer_data(self):
        "Draw customer data below the header"
        self.rect(20, 660, 555, 55)
        self.setFont("Helvetica-Bold", 10)
        self.drawString(30, 700, "Cliente:")
        self.drawString(30, 685, "Domicilio:")
        self.drawString(30, 670, "Localidad:")
        self.drawString(320, 700, f"{self.venta.cliente.tipo_documento.descripcion}:")
        self.drawString(320, 685, "Condición de IVA:")
        self.drawString(320, 670, "Condición de Venta:")
        self.setFont("Helvetica", 10)
        self.drawString(80, 700, f"{self.venta.cliente.razon_social}")
        self.drawString(90, 685, f"{self.venta.cliente.direccion}")
        self.drawString(90, 670, f"{self.venta.cliente.localidad}")
        self.drawString(360, 700, f"{self.venta.cliente.nro_documento}")
        self.drawString(420, 685, f"{self.venta.cliente.tipo_responsable.descripcion}")
        self.drawString(420, 670, f"{self.venta.tipo_pago.nombre}")

    def draw_item_table(self):
        "Draw the table of items"
        table_data = [
            [
                "Cód. Barras",
                "Descripción",
                "Cantidad",
                "Precio Unitario",
                "% IVA",
                "Subtotal",
            ]
        ]
        for item in self.items:
            table_data.append(
                [
                    item.articulo.codigo_barras,
                    self.truncate_text(item.descripcion, 33),
                    item.cantidad,
                    f"${item.precio_unidad:.2f}",
                    f"${item.alicuota_iva:.2f}",
                    f"${item.subtotal:.2f}",
                ]
            )
        table_y_max = 655  # Max Y position for the table
        row_heights = [20] + [17] * (len(table_data) - 1)
        table = Table(
            table_data, colWidths=[120, 185, 45, 85, 35, 85], rowHeights=row_heights
        )
        table.setStyle(
            TableStyle(
                [
                    ("FONTSIZE", (0, 0), (-1, -1), 8),
                    ("ALIGN", (0, 0), (0, 2), "LEFT"),
                    ("ALIGN", (2, 0), (-1, -1), "RIGHT"),
                    ("GRID", (0, 0), (-1, 0), 1, colors.black),
                ]
            )
        )
        table.wrapOn(self, 0, 0)
        table.drawOn(self, 20, table_y_max - sum(row_heights))

    def draw_total(self):
        "Draw Total sections and other taxes"

        "Other taxes section"
        self.rect(20, 140, 555, 130)
        self.setFont("Helvetica-Bold", 8)
        self.drawString(30, 255, "Otros Tributos:")
        table_data = [["Descripción", "Alic. %", "Importe"]]
        for tributo in self.venta.tributos:
            table_data.append(
                [
                    tributo.descripcion,
                    f"{tributo.alicuota:.2f}",
                    f"${self.venta.get_tributo_importe(tributo.id):.2f}",
                ]
            )
        table_y_max = 250  # Max Y position for the table
        row_heights = [20] + [16] * (len(table_data) - 1)
        table = Table(table_data, colWidths=[150, 40, 80], rowHeights=row_heights)
        table.setStyle(
            TableStyle(
                [
                    ("FONTSIZE", (0, 0), (-1, -1), 8),
                    ("ALIGN", (0, 0), (-1, -1), "LEFT"),
                    ("ALIGN", (1, 0), (-1, -1), "RIGHT"),
                    ("GRID", (0, 0), (-1, 0), 1, colors.black),
                ]
            )
        )
        table.wrapOn(self, 0, 0)
        table.drawOn(self, 30, table_y_max - sum(row_heights))

        "Total section"
        self.setFont("Helvetica-Bold", 10)
        self.drawRightString(450, 250, "Importe neto gravado: $")
        self.drawRightString(450, 235, "Descuento: $")
        self.drawRightString(450, 220, "Recargo: $")
        self.drawRightString(450, 205, "Importe IVA: $")
        self.drawRightString(450, 190, "Importe otros tributos: $")
        self.setFont("Helvetica-Bold", 12)
        self.drawRightString(450, 170, "Importe Total: $")
        self.setFont("Helvetica", 10)
        self.drawRightString(570, 250, f"{self.venta.gravado:.2f}")
        self.drawRightString(570, 235, f"{self.venta.descuento:.2f}")
        self.drawRightString(570, 220, f"{self.venta.recargo:.2f}")
        self.drawRightString(570, 205, f"{self.venta.total_iva:.2f}")
        self.drawRightString(570, 190, f"{self.venta.total_tributos:.2f}")
        self.setFont("Helvetica-Bold", 12)
        self.drawRightString(570, 170, f"{self.venta.total:.2f}")

        "Total in words"
        self.setFont("Helvetica", 7)
        total_without_decimals = int(self.venta.total)
        cents = int((self.venta.total - total_without_decimals) * 100)
        self.drawString(
            30,
            145,
            "Son {} con {} centavos de {}".format(
                num2words(total_without_decimals, lang="es"),
                cents,
                self.venta.moneda.nombre,
            ),
        )

    def draw_CAE(self):
        "Draw CAE section"
        afip_logo_path = "/home/facurodrij/VSCodeProjects/stockcar-gestion/server/static/pdf_images/afip-logo.png"
        codigo_qr_path = "/home/facurodrij/VSCodeProjects/stockcar-gestion/server/media/codigo-qr.png"

        self.setFont("Helvetica-Bold", 10)
        self.drawRightString(440, 110, "CAE N°:")
        self.drawRightString(440, 95, "Fecha de Vto. de CAE:")
        self.setFont("Helvetica", 10)
        self.drawRightString(550, 110, f"{self.venta.cae}")
        self.drawRightString(
            550, 95, f"{self.venta.vencimiento_cae.strftime('%d/%m/%Y')}"
        )
        self.drawImage(
            afip_logo_path, 110, 0, width=100, height=None, preserveAspectRatio=True
        )
        self.setFont("Helvetica-BoldOblique", 10)
        self.drawString(110, 70, "Comprobante Autorizado")
        self.setFont("Helvetica-BoldOblique", 6)
        self.drawString(
            110,
            60,
            "Esta Administración Federal no se responsabiliza por los datos ingresados en el detalle de la operación",
        )
        self.drawImage(
            codigo_qr_path, 30, -35, width=60, height=None, preserveAspectRatio=True
        )

    def generate_pdf(self, venta: Venta):
        self.venta = venta
        self.venta_items = venta.items
        self.setTitle(f"A4 {self.venta.tipo_comprobante.descripcion}, N° {self.venta.nro_comprobante()}")
        if len(self.venta_items) > 20:
            "If the sale has more than 20 items, create multiple pages"
            for i in range(0, len(self.venta_items), 20):
                self.items = self.venta_items[i : i + 20]
                self.draw_header()
                self.draw_customer_data()
                self.draw_item_table()
                self.draw_total()
                if self.venta.estado == EstadoVenta.facturado:
                    self.draw_CAE()
                self.showPage()
        else:
            self.items = self.venta_items
            self.draw_header()
            self.draw_customer_data()
            self.draw_item_table()
            self.draw_total()
            if self.venta.estado == EstadoVenta.facturado:
                self.draw_CAE()
            self.showPage()
        self.save()


class TicketPDFGenerator(BasePDFGenerator):
    def __init__(self, *args, **kwargs):
        BasePDFGenerator.__init__(self, *args, **kwargs)
        self.setPageSize((3.10 * inch, 11.68 * inch))
        self.header_image = "/home/facurodrij/VSCodeProjects/stockcar-gestion/server/media/Logocabecerafactura.png"

    def draw_header(self):
        "Draw a header at the top of the page"
        self.drawImage(
            self.header_image, 10, 730, width=210, height=None, preserveAspectRatio=True
        )
        self.line(10, 770, 210, 770)
        self.setFont("Helvetica", 14)
        self.drawCentredString(110, 750, f"{self.venta.tipo_comprobante.descripcion}")
        self.setFontSize(6)
        if self.venta.tipo_comprobante.codigo_afip:
            self.drawCentredString(
                110, 740, f"COD. {self.venta.tipo_comprobante.codigo_afip:02d}"
            )
        self.setFontSize(8)
        self.drawString(10, 725, f"Nro. Comp: {self.venta.nro_comprobante()}")
        self.drawString(
            10,
            715,
            f"Fecha de Emisión: {self.venta.fecha_hora.strftime('%d/%m/%Y %H:%M:%S')}",
        )
        self.line(10, 705, 210, 705)
        self.drawString(10, 690, "Cliente:")
        self.drawString(
            45, 690, f"{self.truncate_text(self.venta.cliente.razon_social, 30)}"
        )
        self.line(10, 680, 210, 680)
        self.table_y_max = 670 # Max Y position for the items table

    def draw_item_table(self):
        "Draw the table of items"
        table_data = []
        for item in self.items:
            table_data.append(
                [
                    item.cantidad,
                    self.truncate_text(item.descripcion, 30),
                    f"${item.subtotal:.2f}",
                ]
            )
        row_heights = [10] * (len(table_data))
        table = Table(table_data, colWidths=[30, 120, 60], rowHeights=row_heights)
        table.setStyle(
            TableStyle(
                [
                    ("FONTSIZE", (0, 0), (-1, -1), 6),
                    # ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                    ("ALIGN", (1, 0), (-1, -1), "LEFT"),
                    ("ALIGN", (2, 0), (-1, -1), "RIGHT"),
                    # ("GRID", (0, 0), (-1, 0), 1, colors.black),
                ]
            )
        )
        table.wrapOn(self, 0, 0)
        table.drawOn(self, 5, self.table_y_max - sum(row_heights))
        self.total_y_max = self.table_y_max - sum(row_heights) # Max Y position for the total section

    def draw_total(self):
        "Draw Total section"
        self.line(
            10, self.total_y_max, 210, self.total_y_max
        )  # Horizontal line for total section
        self.setFont("Helvetica", 8)
        self.drawString(10, self.total_y_max - 10, "Importe neto gravado:")
        self.drawRightString(210, self.total_y_max - 10, f"$ {self.venta.gravado:.2f}")
        self.drawString(10, self.total_y_max - 20, "Importe IVA:")
        self.drawRightString(210, self.total_y_max - 20, f"$ {self.venta.total_iva:.2f}")
        self.drawString(10, self.total_y_max - 30, "Importe Otros Tributos:")
        self.drawRightString(210, self.total_y_max - 30, f"$ {self.venta.total_tributos:.2f}")
        self.setFont("Helvetica-Bold", 8)
        self.drawString(10, self.total_y_max - 45, "TOTAL:")
        self.setFont("Helvetica", 8)
        self.drawRightString(
            210, self.total_y_max - 45, f"$ {self.venta.total:.2f}"
        )
        self.cae_y_max = self.total_y_max - 60 # Max Y position for the CAE section
    
    def draw_CAE(self):
        "Draw CAE section"
        afip_logo_path = "/home/facurodrij/VSCodeProjects/stockcar-gestion/server/static/pdf_images/afip-logo.png"
        codigo_qr_path = "/home/facurodrij/VSCodeProjects/stockcar-gestion/server/media/codigo-qr.png"

        self.drawImage(
            codigo_qr_path,
            70,
            self.cae_y_max - 160,
            width=80,
            height=None,
            preserveAspectRatio=True,
        )
        self.setFont("Helvetica", 8)
        self.drawCentredString(
            110, self.cae_y_max - 90, "CAE N°: {}".format(self.venta.cae)
        )
        self.drawCentredString(
            110,
            self.cae_y_max - 100,
            "Fecha de Vto. de CAE: {}".format(
                self.venta.vencimiento_cae.strftime("%d/%m/%Y")
            ),
        )
        self.drawImage(
            afip_logo_path,
            70,
            self.cae_y_max - 220,
            width=80,
            height=None,
            preserveAspectRatio=True,
        )
        self.setFont("Helvetica-BoldOblique", 8)
        self.drawCentredString(110, self.cae_y_max - 145, "Comprobante Autorizado")

    def generate_pdf(self, venta: Venta):
        self.venta = venta
        self.venta_items = venta.items
        self.setTitle(f"Ticket {self.venta.tipo_comprobante.descripcion}, N° {self.venta.nro_comprobante()}")
        if len(self.venta_items) > 45:
            "If the sale has more than 25 items, create multiple pages"
            for i in range(0, len(self.venta_items), 45):
                self.items = self.venta_items[i : i + 45]
                # Solo en la primera página se dibuja el header
                if i == 0:
                    self.draw_header()
                self.draw_item_table()
                # Solo en la última página se dibuja el CAE
                if i + 45 >= len(self.venta_items) and self.venta.estado == EstadoVenta.facturado:
                    self.draw_total()
                    self.draw_CAE()
                self.table_y_max = 800 # Reset table_y_max for the next page
                self.showPage()
        else:
            self.items = self.venta_items
            self.draw_header()
            self.draw_item_table()
            self.draw_total()
            if self.venta.estado == EstadoVenta.facturado:
                self.draw_CAE()
            self.showPage()
        self.save()