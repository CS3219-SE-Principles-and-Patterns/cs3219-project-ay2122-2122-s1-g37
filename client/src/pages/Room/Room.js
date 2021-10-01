import React from 'react'
import Chatbox from '../../components/ChatBox/Chatbox';
import RoomPageWrapper from './Room.styled';

function Room() {
    return (
        <RoomPageWrapper>
            <Chatbox/>
        </RoomPageWrapper>
    )
}

export default Room;
