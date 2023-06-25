import React from "react";
import { DataGrid } from '@mui/x-data-grid';
 
const FAQs = () => {
    return (
        <DataGrid 
        columns={[{ field: 'Questions' }, { field: 'Answer' }]}
        />
    );
}

export default FAQs;