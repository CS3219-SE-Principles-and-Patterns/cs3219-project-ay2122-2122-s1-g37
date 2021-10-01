import React, { useRef } from 'react'
import { Button, TextField } from "@mui/material"
import {ChatInputWrapper, TextFieldWrapper} from './ChatInput.styled';

function ChatInput({onSubmit}) {
    const inputRef = useRef(null);

    const submitMsg = (e) => {
        e.preventDefault();
        onSubmit(inputRef.current.value);
        inputRef.current.value = "";
    }

    return (
        <form onSubmit={submitMsg}>
            <ChatInputWrapper> 
                <TextFieldWrapper className="chatinput-textfield" inputRef={inputRef} placeholder="Chat here..." size="small"/>
                <Button className="chatinput-btn" variant="contained" onClick={submitMsg}>Submit</Button>
            </ChatInputWrapper>
        </form>
    )
}

export default ChatInput
