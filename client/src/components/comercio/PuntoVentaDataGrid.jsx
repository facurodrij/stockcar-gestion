import { esES } from "@mui/x-data-grid/locales";
import React from "react";
import { GridToolbarContainer, GridRowModes, DataGrid, GridRowEditStopReasons, GridActionsCellItem } from "@mui/x-data-grid";
import Button from "@mui/material/Button";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Cancel";


function EditToolbar(props) {
    const { rows, setRows, setRowModesModel } = props;

    const handleClick = () => {
        const newId = rows.length > 0 ? rows[rows.length - 1].id + 1 : 1;
        setRows((oldRows) => [...oldRows, { id: newId, numero: '', nombre_fantasia: '', domicilio: '' }]);
        setRowModesModel((oldModel) => ({
            ...oldModel,
            [newId]: { mode: GridRowModes.Edit, fieldToFocus: 'nombre_fantasia' },
        }));
    };

    return (
        <GridToolbarContainer>
            <Button color="primary" startIcon={<AddIcon />} onClick={handleClick}>
                Agregar Punto de Venta
            </Button>
        </GridToolbarContainer>
    );
}

export default function PuntoVentaDataGrid({ rows, setRows}) {
    const [rowModesModel, setRowModesModel] = React.useState({});

    const handleRowEditStop = (params, event) => {
        if (params.reason === GridRowEditStopReasons.rowFocusOut) {
            event.defaultMuiPrevented = true;
        }
    };

    const handleEditClick = (id) => () => {
        setRowModesModel({ ...rowModesModel, [id]: { mode: GridRowModes.Edit } });
    };

    const handleSaveClick = (id) => () => {
        setRowModesModel({ ...rowModesModel, [id]: { mode: GridRowModes.View } });
    };

    const handleDeleteClick = (id) => () => {
        setRows(rows.filter((row) => row.id !== id));
    };

    const handleCancelClick = (id) => () => {
        setRowModesModel({
            ...rowModesModel,
            [id]: { mode: GridRowModes.View, ignoreModifications: true },
        });

        const editedRow = rows.find((row) => row.id === id);
        if (editedRow.isNew) {
            setRows(rows.filter((row) => row.id !== id));
        }
    };

    const processRowUpdate = (newRow) => {
        const updatedRow = { ...newRow, isNew: false };
        setRows(rows.map((row) => (row.id === newRow.id ? updatedRow : row)));
        return updatedRow;
    };

    const handleRowModesModelChange = (newRowModesModel) => {
        setRowModesModel(newRowModesModel);
    };


    return (
        <div style={{ width: '100%' }}>
            <DataGrid
                autoHeight
                localeText={esES.components.MuiDataGrid.defaultProps.localeText}
                columns={[
                    { field: 'nombre_fantasia', headerName: 'Nombre Fantasía', flex: 1.5, type:'string', editable: true },
                    { field: 'domicilio', headerName: 'Domicilio', flex: 2, type:'string', editable: true },
                    { field: 'numero', headerName: 'Número', flex: 0.5, type: 'number', editable: true },
                    {
                        field: 'actions',
                        type: 'actions',
                        headerName: 'Actions',
                        flex: 1,
                        cellClassName: 'actions',
                        getActions: ({ id }) => {
                            const isInEditMode = rowModesModel[id]?.mode === GridRowModes.Edit;

                            if (isInEditMode) {
                                return [
                                    <GridActionsCellItem
                                        icon={<SaveIcon />}
                                        label="Guardar"
                                        sx={{
                                            color: 'primary.main',
                                        }}
                                        onClick={handleSaveClick(id)}
                                    />,
                                    <GridActionsCellItem
                                        icon={<CancelIcon />}
                                        label="Cancelar"
                                        className="textPrimary"
                                        onClick={handleCancelClick(id)}
                                        color="inherit"
                                    />,
                                ];
                            }

                            return [
                                <GridActionsCellItem
                                    icon={<EditIcon />}
                                    label="Editar"
                                    className="textPrimary"
                                    onClick={handleEditClick(id)}
                                    color="inherit"
                                />,
                                <GridActionsCellItem
                                    icon={<DeleteIcon />}
                                    label="Eliminar"
                                    onClick={handleDeleteClick(id)}
                                    color="inherit"
                                />,
                            ];
                        },
                    },
                ]}
                rows={rows}
                editMode="row"
                rowModesModel={rowModesModel}
                onRowModesModelChange={handleRowModesModelChange}
                onRowEditStop={handleRowEditStop}
                processRowUpdate={processRowUpdate}
                slots={{
                    toolbar: EditToolbar,
                }}
                slotProps={{
                    toolbar: { rows, setRows, setRowModesModel },
                }}
            />
        </div>
    )
}