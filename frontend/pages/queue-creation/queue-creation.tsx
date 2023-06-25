import React, {useState} from "react"
import dayjs, { Dayjs } from 'dayjs';
import style from './queue-creation.module.css'
import TextField from '@mui/material/TextField';
import { FormGroup, Box, Typography, Button} from "@mui/material";
import SyphonDatePicker from "../../components/SyphonDatePicker";
import SwitchToggles from "../../components/SwitchToggles";
import SyphonTimePicker from "../../components/SyphonTimePicker";
import FAQs from "../../components/FAQs";

const QueueCreationPage = () => {
    const [date, setDate] = useState<Dayjs| null>(dayjs(new Date()));
    const [timeStart, setTimeStart] = useState<Dayjs| null>(dayjs(new Date()));
    const [timeEnd, setTimeEnd] = useState<Dayjs| null>(dayjs(new Date()).add(2, 'hour'));

    const [isVisible, setIsVisible] = useState(true);
    const [isAvailable, setIsAvailable] = useState(true);
    const [isTimeLimit, setIsTimeLimit] = useState(false);
    const [title, setTitle] = useState("");
    const [course, setCourse] = useState("COMP1521");

    return (
        <div className={style.container}> 
            <Typography variant="h5" style={{margin: "30px"}}>Create a new Queue for {course}</Typography>
            <FormGroup className={style.formGroup} row={true}>
                <Typography variant="body1" style={{marginRight: "35px"}}>Title</Typography>
                <Box className={style.textField}>
                    <TextField
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        variant='outlined'
                        fullWidth
                    />
                </Box>
            </FormGroup>
            <SyphonDatePicker date={date} setDate={setDate} />
            <SyphonTimePicker 
                timeStart={timeStart} 
                setTimeStart={setTimeStart} 
                timeEnd={timeEnd} 
                setTimeEnd={setTimeEnd} 
            />
            <SwitchToggles 
                isAvailable={isAvailable} 
                setIsAvailable={setIsAvailable}
                isVisible={isVisible}
                setIsVisible={setIsVisible}
                isTimeLimit={isTimeLimit}
                setIsTimeLimit={setIsTimeLimit}
            />

            <FAQs />
            <Button variant="contained" className={style.button}>Create Queue</Button>

        </div>
    )
}
export default QueueCreationPage