import React from 'react';
import { GridToolbarContainer, GridToolbarQuickFilter, GridToolbarColumnsButton, GridToolbarFilterButton, GridToolbarDensitySelector, GridToolbarExport } from '@mui/x-data-grid';
import { Box, Button } from '@mui/material';
import { Add } from '@mui/icons-material';
import { Link } from 'react-router-dom';

const ListToolbar = ({ show_btn_add, txt_btn_add, url_btn_add }) => {
    return (
        <GridToolbarContainer sx={{ borderBottom: 1, borderColor: 'divider', pb: .5 }}>
            <GridToolbarQuickFilter size={'small'} />
            <GridToolbarColumnsButton />
            <GridToolbarFilterButton />
            <GridToolbarDensitySelector />
            <GridToolbarExport />
            <Box sx={{ flexGrow: 1 }} />
            {show_btn_add && (
                <Button
                    startIcon={<Add />}
                    component={Link}
                    to={url_btn_add}
                    size="small"
                    variant="contained"
                    color="success"
                >
                    {txt_btn_add}
                </Button>
            )}
        </GridToolbarContainer>
    );
}

export default ListToolbar;