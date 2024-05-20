import React, {useState, useEffect} from 'react'
import Typography from '@mui/material/Typography';
import {DataGrid, GridRowsProp, GridColDef, useGridApiRef, GridActionsCellItem} from '@mui/x-data-grid';
import {esES} from '@mui/x-data-grid/locales';
import {Button, TextField} from '@mui/material';
import {AdapterDayjs} from '@mui/x-date-pickers/AdapterDayjs';
import {LocalizationProvider} from '@mui/x-date-pickers/LocalizationProvider';
import {DatePicker} from '@mui/x-date-pickers/DatePicker';
import Box from "@mui/material/Box";
import {GridRowParams} from "@mui/x-data-grid";
import VisibilityIcon from '@mui/icons-material/Visibility';
import dayjs from "dayjs";
import {currencyFormatter} from "../utils/formatters";
import {API} from "../App";


const List = ({model, context}) => {
    const [list, setList] = useState([]);
    const [itemSelected, setItemSelected] = useState(null);
    const [itemsSelectedList, setItemsSelectedList] = useState([]);
    const [from, setFrom] = useState(null);
    const [to, setTo] = useState(null);

    const fetchData = async () => {
        const fromStr = from ? from.toISOString() : null;
        const toStr = to ? to.toISOString() : null;

        const url = (from || to) ? `${API}/${model}?desde=${fromStr}&hasta=${toStr}` : `${API}/${model}`;
        const res = await fetch(url);
        const data = await res.json();
        setList(data.model);
    }

    let rows: GridRowsProp = list.map((item) => {
        let row = {};
        context.columns.forEach(col => {
            row[col.field] = item[col.field];
        });
        return row;
    });

    useEffect(() => {
        if (context.autoLoad) {
            fetchData();
        }
    }, []);

    return (
        <>
            {context.showDatePickers && (
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
                            value={from}
                            onChange={(newValue) => setFrom(newValue)}
                            sx={{mr: 2}}
                        />
                        <DatePicker
                            label="Hasta"
                            value={to}
                            onChange={(newValue) => setTo(newValue)}
                            sx={{mr: 2}}
                        />
                    </LocalizationProvider>

                    <Button
                        variant="contained"
                        color="primary"
                        sx={{mt: 2}}
                        onClick={fetchData}
                    >
                        Buscar
                    </Button>
                </Box>
            )}
            <div style={{height: 400, width: '100%'}}>
                <DataGrid
                    rows={rows}
                    rowHeight={30}
                    columns={context.columns}
                    pageSize={5}
                    rowsPerPageOptions={[5, 10, 20]}
                    checkboxSelection
                />
            </div>
        </>
    );
};

export default List;