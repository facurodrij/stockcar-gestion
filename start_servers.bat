@echo off
cd /d C:\stockcar-gestion\server
call .venv\Scripts\activate
start cmd /k "waitress-serve --host=192.168.0.19 --port=50100 wsgi:app"
cd /d C:\stockcar-gestion\client
start cmd /k "serve -s build -l 3000"