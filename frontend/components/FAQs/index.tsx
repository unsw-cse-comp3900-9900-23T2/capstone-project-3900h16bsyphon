import React, { useEffect } from 'react';
import { DataGrid, GridActionsCellItem, GridColDef, GridFilterAltIcon, GridToolbarContainer, GridToolbarFilterButton} from '@mui/x-data-grid';
import style from './FAQs.module.css';
import { Button, Typography } from '@mui/material';
import { authenticatedDeleteFetch, authenticatedGetFetch, authenticatedPostFetch} from '../../utils';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/DeleteOutlined';

type FAQ = {
  id: number;
  question: string;
  answer: string;
};

type FAQsProps = {
  courseOfferingId: string | string[] | undefined;
  tutor?: boolean;
};



const defaultData : FAQ[] = [
  { id: 100, 
    question: 'What did one wall say to the other wall?',
    answer: 'I\'ll meet you at the corner!' },
  { id: 101,
    question: 'What do you call a fake noodle?',
    answer: 'An Impasta!' },
  { id: 102,
    question: 'Why did the math book look so sad?',
    answer: 'The math book had been feeling down lately, burdened by the weight of numbers and equations that seemed to stretch endlessly across its pages. It had grown tired of being seen as a mere tool for solving problems, longing to be appreciated for the beauty and elegance hidden within its mathematical realm. Each day, as it watched novels being read with delight and poetry being recited with passion, the math book couldn\'t help but feel left out, confined to a world where its true potential went unnoticed. It yearned for the day when someone would open its cover not out of obligation, but with genuine curiosity and a desire to explore the intricacies of numbers. The math book dreamt of being embraced, not for its ability to calculate, but for its power to unlock the secrets of the universe and inspire minds. So, as it sat on the shelf, a tinge of sadness permeated its pages, silently hoping that one day, someone would see beyond its numerical facade and discover the wonders that lay within.'
  }];

const FAQs = ({ courseOfferingId, tutor = false }: FAQsProps) => {
  const [data, setData] = React.useState(defaultData);

  useEffect(() => {
    let getFAQs = async () => {
      if (!courseOfferingId) return;
      let res = await authenticatedGetFetch('/faqs/get', {
        course_offering_id: courseOfferingId as string,
      });
      let d = await res.json();
      d.map((e : any) => {
        e.id = e.faq_id;
        delete e.faq_id;
        return e;
      });
      setData(d);
    };
    getFAQs();
  }, [courseOfferingId, setData]);

  let addFAQ = async (row: any) => {
    let faq = {
      faq_id: row.id as number,
      question: row.question as string,
      answer: row.answer as string,
      course_offering_id: Number.parseInt(courseOfferingId as string),
    };
    console.log('posting...');
    console.log(faq);
    await authenticatedPostFetch('/faqs/add', faq);
  };

  const addRow = () => {
    if (data.filter((e) => e.id === 0).length > 0) return;
    setData([...data, { id : 0, question: '...enter question...', answer: '...enter answer...' }]);
  };

  const handleDeleteClick = (id: number) => async () => {
    let res = await authenticatedDeleteFetch('/faqs/delete', { faq_id: id.toString() });
    if (res.ok) {
      setData(data.filter((e) => e.id !== id));
    } else {
      console.log(res);
    }
  };
  
  const columns: GridColDef[] = [
    { field: 'question', headerName: 'Question', width: 500, editable: true, headerAlign: 'center'},
    { field: 'answer', headerName: 'Answer', width: 500, editable: true, headerAlign: 'center'},
    { field: 'actions', headerName: 'Delete', width: 100, headerAlign: 'center', type: 'actions', cellClassName: 'actions',
      getActions: ({ id }) => ([<GridActionsCellItem
        icon={<DeleteIcon />}
        label="Delete"
        onClick={handleDeleteClick(Number.parseInt(id.toString()))}
        color="inherit"
        key={id}
      />])
    },
  ];

  const toolbar = () => (
    <GridToolbarContainer>
      <Button color="primary" 
        startIcon={<AddIcon />} 
        onClick={addRow}
        className={style.addButton}>
          Add FAQ
      </Button>
      <GridToolbarFilterButton/>
    </GridToolbarContainer>
  );
  return (
    <div>
      <Typography variant="h6" className={style.pageTitle}>Frequently Asked Questions</Typography>

      <DataGrid 
        columns={columns}
        rows={data}
        isCellEditable={() => tutor}
        className={style.grid}
        getRowClassName={() => 'Row'}
        getRowHeight={() => 'auto'}
        pageSizeOptions={[5, 10, 20, 100]}
        editMode='row'
        processRowUpdate={(newRow) => {
          console.log(newRow);
          const updatedRow = { ...newRow, isNew: false };
          if (newRow.question === '...enter question...' || newRow.answer === '...enter answer...') return updatedRow;
          setData((prev) => prev.map((row) => (row.id === newRow.id ? updatedRow : row)));
          addFAQ(updatedRow);
          return updatedRow;
        }}
        slots = {{
          toolbar: toolbar,
        }}
        sx={{
          border: 0.5,
          '&.MuiDataGrid-root--densityCompact .MuiDataGrid-cell': { py: '8px' },
          '&.MuiDataGrid-root--densityStandard .MuiDataGrid-cell': { py: '15px' },
          '&.MuiDataGrid-root--densityComfortable .MuiDataGrid-cell': { py: '22px' },
          '& .MuiDataGrid-columnHeaders': { backgroundColor: '#f5f5f5', borderTop: 0.5, borderBottom: 0.5},
        }}
        aria-label='FAQs'
      />

    </div>
  );
};

export default FAQs;
