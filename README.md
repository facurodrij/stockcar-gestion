# Instalación y Ejecución

Este documento proporciona instrucciones detalladas para instalar y ejecutar el proyecto, que consta de un servidor Flask y un cliente React.

## Requisitos

### Servidor (Flask)
- Python 3.11 o superior

### Cliente (React)
- npm 10.5 o superior

## Instalación de Dependencias

### Servidor (Flask)

1. **Crear y activar un entorno virtual**:
    ```sh
    python -m venv venv

    source venv/bin/activate  # En Windows usa `venv\Scripts\activate`

2. **Ejecutar en la terminal**:
    ```sh
    pip install -r server/requirements.txt
    
### Cliente (React)

1. **Movernos dentro del directorio `client/` y ejecutar**:
    ```sh
    cd client/ # Para movernos dentro del directorio

    npm install

## Migración de Base de Datos

Antes de iniciar el servidor Flask debemos inicializar la base de datos.

1. **Movernos dentro del directorio `server/`**:
    ```sh
    cd server/

2. **Inicializar la base de datos**:
    ```sh
    flask db init

3. **Crear y ejecutar las migraciones**:
    ```sh
    flask db migrate -m "Nombre-de-la-migración"

    flask db upgrade

4. **(Opcional) Poblar las tablas con datos preestablecidos**:
    ```sh
    flask load_fixtures

## Ejecución

### Servidor (Flask)

1. Iniciar el servidor:
    ```sh
    flask run

### Cliente (React)

1. Iniciar el servidor:
    ```sh
    npm start

## Configuración Adicional

- **Configurar el archivo `config.py`**: Asegúrate de que el archivo `config.py` contenga las configuraciones necesarias para tu entorno.

## Resolución de Problemas

- **Error de instalación de dependencias**: Verifica que estás utilizando la versión correcta de Python y npm.

- **Problemas con la base de datos**: Asegúrate de que la configuración en `config.py` es correcta y que el servicio de base de datos está en funcionamiento.
