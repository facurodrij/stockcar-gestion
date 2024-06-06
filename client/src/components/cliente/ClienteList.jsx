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
import {currencyFormatter} from "../../utils/formatters";
import {API} from "../../App";
import DetailDialog from "../shared/DetailDialog";
import ClienteDetailDialog from "./ClienteDetailDialog";


export default function ClienteList() {
    const [list, setList] = useState([]);
    const [itemSelected, setItemSelected] = useState(null);
    const [itemsSelectedList, setItemsSelectedList] = useState([]);
    const [showDetail, setShowDetail] = useState(false);

    const fetchData = async () => {
        const res = await fetch(`${API}/clientes`);
        return await res.json();
    }

    useEffect(() => {
        fetchData().then(data => {
            setList(data['clientes']);
        });
    }, []);

    const columns = [
        {field: 'id', headerName: 'ID', width: 50},
        {field: 'tipo_responsable', headerName: 'Tipo Responsable', width: 200},
        {field: 'razon_social', headerName: 'Razón Social', width: 250},
        {field: 'tipo_documento', headerName: 'Tipo Documento', width: 100},
        {field: 'nro_documento', headerName: 'Nro. Documento', width: 150},
        {
            field: 'fecha_nacimiento', headerName: 'Fecha Nacimiento', minWidth: 150, type: 'date',
            valueFormatter: (params) => {
                if (!params) {
                    return "";
                }
                return dayjs(params, 'YYYY-MM-DD').format('DD/MM/YYYY')
            }
        },
        {field: 'direccion', headerName: 'Dirección', width: 300},
        {field: 'localidad', headerName: 'Localidad', width: 200},
        {
            field: 'actions', type: 'actions', headerName: 'Acciones', width: 100,
            getActions: (params: GridRowParams) => [
                <GridActionsCellItem
                    icon={<VisibilityIcon/>}
                    label="Detalle"
                    onClick={() => handleShowDetail(params.row)}
                    showInMenu
                />,
                <GridActionsCellItem
                    icon={<VisibilityIcon/>}
                    label="Otra..."
                    onClick={() => console.log(params.row)}
                    showInMenu
                />
            ]
        }
    ]

    let rows: GridRowsProp = list.map((item) => {
        return {
            id: item.id,
            tipo_responsable: item.tipo_responsable['descripcion'] || '',
            razon_social: item.razon_social,
            tipo_documento: item.tipo_documento['descripcion'] || '',
            nro_documento: item.nro_documento,
            fecha_nacimiento: item.fecha_nacimiento,
            direccion: item.direccion,
            localidad: item.localidad
        }
    });

    const handleShowDetail = (item) => {
        setItemSelected(item);
        setShowDetail(true);
    }

    const handleCloseDetail = () => {
        setItemSelected(null);
        setShowDetail(false);
    }

    return (
        <>
            <div style={{height: 500, width: '100%'}}>
                <DataGrid
                    rows={rows}
                    rowHeight={30}
                    columns={columns}
                    pageSize={5}
                    rowsPerPageOptions={[5, 10, 20]}
                    checkboxSelection
                />
            </div>
            <ClienteDetailDialog item={itemSelected} open={showDetail} onClose={handleCloseDetail}/>
        </>
    );
};
