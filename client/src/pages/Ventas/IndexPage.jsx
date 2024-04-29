import React, {useState, useEffect} from 'react'
import Typography from '@mui/material/Typography';
import {DataGrid, GridRowsProp, GridColDef} from '@mui/x-data-grid';
import {esES} from '@mui/x-data-grid/locales';
import '@fontsource/roboto';
import {Button, TextField} from '@mui/material';
import {AdapterDayjs} from '@mui/x-date-pickers/AdapterDayjs';
import 'dayjs/locale/es';
import {LocalizationProvider} from '@mui/x-date-pickers/LocalizationProvider';
import {DatePicker} from '@mui/x-date-pickers/DatePicker';
import Box from "@mui/material/Box";

const API = process.env.REACT_APP_API_URL;

export default function IndexPage() {
    const [ventas, setVentas] = useState([])
    const [desde, setDesde] = useState(null)
    const [hasta, setHasta] = useState(null)

    const getVentas = async () => {
        const desdeStr = desde ? desde.toISOString() : '';
        const hastaStr = hasta ? hasta.toISOString() : '';

        const url = `${API}/ventas?desde=${desdeStr}&hasta=${hastaStr}`;

        const res = await fetch(url);
        const data = await res.json();
        setVentas(data.ventas)
        console.log(desde, hasta)
    }

    const columns: GridColDef[] = [
        {field: 'id', headerName: 'ID'},
        {field: 'fecha', headerName: 'Fecha'},
        {field: 'tipo_doc', headerName: 'Tipo'},
        {field: 'letra', headerName: 'Letra'},
        {field: 'nro_doc', headerName: 'Número'},
        {field: 'cliente', headerName: 'Cliente'},
    ];

    let rows: GridRowsProp = ventas.map((venta) => ({
        id: venta.id,
        fecha: venta.fecha,
        tipo_doc: venta.tipo_doc,
        letra: venta.letra,
        nro_doc: venta.nro_doc,
        cliente: venta.nombre_cliente
    }));

    return (
        <>
            <Typography
                variant="h4"
                sx={{
                    mt: 2,
                    fontFamily: 'roboto',
                    color: 'inherit'
                }}
            >
                Ventas
            </Typography>

            <Box
                component="form"
                sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    m: 2
                }}
                noValidate
                autoComplete="off"
            >
                <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale={'es'}>
                    <DatePicker
                        label="Desde"
                        value={desde}
                        onChange={(newValue) => setDesde(newValue)}
                        sx={{mr: 2}}
                    />
                    <DatePicker
                        label="Hasta"
                        value={hasta}
                        onChange={(newValue) => setHasta(newValue)}
                        sx={{mr: 2}}
                    />
                </LocalizationProvider>

                <Button
                    variant="contained"
                    color="primary"
                    sx={{mt: 2}}
                    onClick={getVentas}
                >
                    Buscar
                </Button>
            </Box>
            <div style={{height: 300, width: '100%'}}>
                <DataGrid
                    rows={rows}
                    rowHeight={30}
                    columns={columns}
                    localeText={esES.components.MuiDataGrid.defaultProps.localeText}
                />
            </div>
        </>
    )
}