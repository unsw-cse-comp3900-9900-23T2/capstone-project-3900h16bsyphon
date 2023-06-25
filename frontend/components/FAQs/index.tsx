import React, { useCallback } from "react";
import { DataGrid } from '@mui/x-data-grid';
import style from './FAQs.module.css';
import { GridRowSpacingParams } from '@mui/x-data-grid';
 
const FAQs = () => {
    const data = [{ 'id': 1, 
            'Questions': 'What did one wall say to the other wall?',
            'Answer': "I'll meet you at the corner!" },
            { 'id': 2,
            'Questions': 'What do you call a fake noodle?',
            'Answer': 'An Impasta!' },
            { 'id': 3,
            'Questions': "Why did the math book look so sad?",
            'Answer': "The math book had been feeling down lately, burdened by the weight of numbers and equations that seemed to stretch endlessly across its pages. It had grown tired of being seen as a mere tool for solving problems, longing to be appreciated for the beauty and elegance hidden within its mathematical realm. Each day, as it watched novels being read with delight and poetry being recited with passion, the math book couldn't help but feel left out, confined to a world where its true potential went unnoticed. It yearned for the day when someone would open its cover not out of obligation, but with genuine curiosity and a desire to explore the intricacies of numbers. The math book dreamt of being embraced, not for its ability to calculate, but for its power to unlock the secrets of the universe and inspire minds. So, as it sat on the shelf, a tinge of sadness permeated its pages, silently hoping that one day, someone would see beyond its numerical facade and discover the wonders that lay within."
            }];
    const getRowSpacing = useCallback((params: GridRowSpacingParams) => {
        return {
            top: params.isFirstVisible ? 0 : 5,
            bottom: params.isLastVisible ? 0 : 5,
        };
        }, []);
    
    return (
        <div>
            <h3> FAQs</h3>
            <DataGrid 
                columns={[{ field: 'Questions', width: 350, editable: true, headerAlign: 'center'}, 
                            { field: 'Answer', width: 350, editable: true, headerAlign: 'center'}]}
                rows={data}
                className={style.grid}
                getRowHeight={() => 'auto'} 
                autoHeight={true}
                pageSizeOptions={[5, 10, 20]}
                getRowSpacing={getRowSpacing}
                sx={{
                    border: 0.5,
                    '&.MuiDataGrid-root--densityCompact .MuiDataGrid-cell': { py: '8px' },
                    '&.MuiDataGrid-root--densityStandard .MuiDataGrid-cell': { py: '15px' },
                    '&.MuiDataGrid-root--densityComfortable .MuiDataGrid-cell': { py: '22px' },
                }}
            />
        </div>
    );
}

export default FAQs;