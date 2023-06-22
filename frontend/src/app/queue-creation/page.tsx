import React from "react"
import InputBox from "../components/InputBox"
import Toggle from "../components/toggle"
import DateCalendar from "../components/DateCalendar"

const QueueCreationPage = () => {
    return (
        <div>
            <InputBox label="Title" value="" type="text"/>
            <DateCalendar label="Date" />
            <InputBox label="Start Time" value="" type="time"/>
            <InputBox label="End Time" value="" type="time"/>
            <Toggle label="hi?"/>
        </div>
    )
}
export default QueueCreationPage