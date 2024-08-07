import pytest
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib.units import mm
import os

@pytest.fixture
def pdf_path():
    return os.path.join(os.path.dirname(__file__), 'venta_test.pdf')

def add_page_number(canvas, doc):
    page_num = canvas.getPageNumber()
    text = f"Pág {page_num}"
    canvas.drawRightString(200 * mm, 10 * mm, text)

def test_generate_pdf(pdf_path):
    # Datos de prueba
    venta_id = 1
    venta_numero = '00000001'
    venta_fecha_hora = '01/10/2023 12:00'
    renglones = [f'Renglón {i}' for i in range(1, 100)]  # Simulación de muchos renglones
    logo_path = '/home/facurodrij/VSCodeProjects/stockcar-gestion/server/media/Logocabecerafactura.png'

    # Crear el PDF
    buffer = open(pdf_path, 'wb')
    c = canvas.Canvas(buffer, pagesize=A4)

    # Función para agregar contenido y manejar el desbordamiento
    def add_content(c, renglones):
        y = 800
        for renglon in renglones:
            if y < 50:  # Si el espacio en la página actual se está acabando
                add_page_number(c, None)
                c.showPage()
                y = 800  # Reiniciar la posición y para la nueva página
            c.drawString(10, y, renglon)
            y -= 20

    # Cabecera de la factura
    # Cuadrado para toda la cabecera
    c.rect(20, 720, 555, 105)
    # Dibujar cuadrado que rodea la Letra A y el texto 'Cod. 1'
    c.rect(275, 775, 50, 50)
    # Linea que conectar el cuadrado de la letra A con el cuadrado de la cabecera
    c.line(300, 775, 300, 720)
    c.setFontSize(32)
    c.drawCentredString(300, 795, 'A')
    c.setFontSize(8)
    c.drawCentredString(300, 780, 'COD. 1')
    c.setFont('Helvetica-Bold', 16)
    c.drawString(340, 800, 'NOTA DE CREDITO')
    c.setFontSize(10)
    #c.drawString(510, 800, 'ORIGINAL')
    # Punto de venta, nro de factura, fecha de emisión
    c.drawString(340, 780, 'Punto de Venta: 0001')
    c.drawString(460, 780, f'Nro. Comp: {venta_numero}')
    c.drawString(340, 765, f'Fecha de Emisión: {venta_fecha_hora}') 
    # CUIT, INGRESOS BRUTOS, INICIO DE ACTIVIDADES
    c.drawString(340, 745, 'CUIT: 30-12345678-0')
    c.drawString(460, 745, 'IIBB: 12345678912')
    c.drawString(340, 730, 'Inicio de Actividades: 01/01/2021')
    # Agregar logo de la empresa (475px x 150px)
    c.drawImage(logo_path, 30, 700, width=240, height=None, preserveAspectRatio=True)    

    c.drawString(10, 820, 'Comprobante de Venta')
    
    add_content(c, renglones)
    add_page_number(c, None)
    c.showPage()

    #c.showPage()
    c.save()
    buffer.close()

    # Verificar que el archivo PDF se ha creado
    assert os.path.exists(pdf_path)

    # Opcional: Verificar el contenido del PDF
    # Aquí podrías agregar más verificaciones si es necesario

if __name__ == '__main__':
    pytest.main()