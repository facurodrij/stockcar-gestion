# Instalación y Ejecución

La instalación y ejecución del programa se debe realizar de la siguiente forma:

## Servidor
### Requerimientos
Python 3.11 o superior

### Instalación de librerías
La instalación de dependencias, en mi caso opto por utilizar un entorno virtual (venv) y se realiza de esta forma:

1. Descargar e instalar las dependencias con pip
pip install -r requirements.txt

### Migración de base de datos

1. Inicializar la base de datos, la configuración de la misma se encuentra en config.py
flask db init

2. Crear y ejecutar las migraciones
flask db migrate -m "Nombre-de-la-migración"
flask db upgrade

3. Poblar las tablas de parámetros de la base de datos con datos preestablecidos
flask load_fixtures

### Iniciar servidor

La forma de iniciar el servidor flask se realiza ejecutando el siguiente comando
flask run

## Cliente
...