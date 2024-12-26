import List from "../shared/List";

export default function ArticuloList({
    apiUrl,
    editUrl,
    detailUrl,
    allowView,
    allowCreate,
    allowUpdate,
    allowDelete
}) {
    const columns = [
        { field: 'stock_actual', headerName: 'Stock', flex: 0.5 },
        { field: 'descripcion', headerName: 'Descripción', flex: 2 },
        { field: 'codigo_principal', headerName: 'Código principal', flex: 1 },
        { field: 'codigo_secundario', headerName: 'Código secundario', flex: 1 },
        { field: 'codigo_terciario', headerName: 'Código terciario', flex: 0.75 },
        { field: 'codigo_cuaternario', headerName: 'Código cuaternario', flex: 0.75 },
        { field: 'codigo_adicional', headerName: 'Código adicional', flex: 0.75 },
    ];

    const mapDataToRows = (data) => {
        return data['articulos'].map(item => ({
            id: item.id,
            stock_actual: item.stock_actual,
            codigo_principal: item.codigo_principal,
            codigo_secundario: item.codigo_secundario,
            codigo_terciario: item.codigo_terciario,
            codigo_cuaternario: item.codigo_cuaternario,
            codigo_adicional: item.codigo_adicional,
            descripcion: item.descripcion,
        }));
    };

    const toolbarProps = {
        show_btn_add: allowCreate,
        txt_btn_add: 'Nuevo Artículo',
        url_btn_add: '/articulos/form'
    };

    return (
        <List
            apiUrl={apiUrl}
            editUrl={editUrl}
            detailUrl={detailUrl}
            allowView={allowView}
            allowUpdate={allowUpdate}
            allowDelete={allowDelete}
            columns={columns}
            mapDataToRows={mapDataToRows}
            toolbarProps={toolbarProps}
        />
    );
}