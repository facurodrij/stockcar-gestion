import {DataGrid} from "@mui/x-data-grid";
import {esES} from "@mui/x-data-grid/locales";
import React from "react";


export default function TributoDataGrid({tributos, selectedTributo, setSelectedTributo}) {
    const rows = tributos && tributos.length > 0 ? tributos.map((item) => {
        return {
            id: item.id,
            descripcion: item.descripcion,
            alicuota: item.alicuota,
        }
    }) : [];
    
    return (
        <div style={{width: '100%'}}>
            <DataGrid
                autoHeight
                checkboxSelection
                disableRowSelectionOnClick
                localeText={esES.components.MuiDataGrid.defaultProps.localeText}
                columns={[
                    {field: 'id', headerName: 'ID', width: 75},
                    {field: 'descripcion', headerName: 'Descripción', width: 250},
                    {field: 'alicuota', headerName: 'Alícuota', width: 250},
                ]}
                rows={rows}
                rowSelectionModel={selectedTributo}
                onRowSelectionModelChange={(newRowSelectionModel) => {
                    setSelectedTributo(newRowSelectionModel);
                }}
            />
        </div>
    )
}