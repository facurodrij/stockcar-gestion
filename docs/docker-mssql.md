# Steps for install SQLServer on Docker
1. Install Docker and Docker Compose
2. Run docker-compose with the following command:
```bash
docker-compose up -d
```
3. Connect to the SQLServer instance with the following command:
```bash
docker exec -it sqlserver /opt/mssql-tools/bin/sqlcmd -S localhost -U SA -P 'Admin-181020'
```
**Note:** Or connect with a SQLServer client like DataGrip, DBeaver, etc.
4. Run following Docker-compose and SQLServer command for restore a database:
```bash
docker-compose exec mssql /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P "Admin-181020" -Q "RESTORE DATABASE Datos FROM DISK = '/var/opt/mssql/backup/Datos_FullBackup_20240418_0803.bak' WITH MOVE 'Datos' TO '/var/opt/mssql/data/Datos.mdf', MOVE 'Datos_Log' TO '/var/opt/mssql/data/Datos.ldf'"
```
