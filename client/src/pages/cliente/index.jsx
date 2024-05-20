import React, {useState} from 'react';
import Typography from '@mui/material/Typography';
import {GridActionsCellItem, GridColDef, GridRowParams} from "@mui/x-data-grid";
import VisibilityIcon from "@mui/icons-material/Visibility";
import dayjs from "dayjs";
import List from '../../components/List';
import DetailDialog from "../../components/DetailDialog";
import GeneralTabContent from "./detail/GeneralTabContent";
import InvoiceTabContent from "./detail/InvoiceTabContent";


export default function Index() {
    const [itemSelected, setItemSelected] = useState(null);
    const [showDetail, setShowDetail] = useState(false);

    const handleShowDetail = (item) => {
        setItemSelected(item);
        setShowDetail(true); // Abre el DetailDialog
    }

    const handleCloseDetail = () => {
        setItemSelected(null);
        setShowDetail(false); // Cierra el DetailDialog
    }

    const listContext = {
        // Campo para determinar si List debe mostrar los DatePickers para filtrar por rangos de fecha
        showDatePickers: false,
        // Campo para determinar si List debe cargarse al abrir la página con React.useEffect
        autoLoad: true,
        columns: [
            {field: 'id', headerName: 'ID', width: 100},
            {field: 'tipo_responsable', headerName: 'Tipo Responsable', width: 200},
            {field: 'razon_social', headerName: 'Razón Social', width: 300},
            {field: 'tipo_doc', headerName: 'Tipo Documento', width: 150},
            {field: 'nro_doc', headerName: 'Nro. Documento', width: 150},
            {
                field: 'fecha_nacimiento', headerName: 'Fecha Nacimiento', type: 'dateTime', minWidth: 150,
                valueGetter: (params) => {
                    if (!params || params.value === null) {
                        return ""; // o cualquier valor por defecto que quieras
                    }
                    // Convertir el valor a un formato de fecha
                    return dayjs(params.value).format('DD/MM/YYYY HH:mm')
                },
                valueFormatter: (params) => {
                    if (!params || params.value === null) {
                        return ""; // o cualquier valor por defecto que quieras
                    }
                    // Formatear el valor para mostrarlo
                    return params.value.toString();
                }
            },
            {
                field: 'actions', type: 'actions', headerName: 'Acciones', width: 150,
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
    };

    const detailContext = {
        title: 'Detalle de Cliente',
        tabsName: ['General', 'Datos Facturación'],
        tabsContent: [
            <GeneralTabContent/>,
            <InvoiceTabContent/>
        ]
    }

    return (
        <>
            <Typography
                variant="h4"
                sx={{
                    mt: 2,
                    mb: 2,
                    fontFamily: 'roboto',
                    color: 'inherit'
                }}
            >
                Clientes
            </Typography>
            <List model={"clientes"} context={listContext}/>
            <DetailDialog model={"clientes"} item={itemSelected} open={showDetail} onClose={handleCloseDetail}
                          context={detailContext}/>
        </>
    )
}
