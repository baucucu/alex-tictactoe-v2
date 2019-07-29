require('custom-env').env('staging');

const express = require('express');
const path = require('path');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io').listen(server);

app.use(express.static('.'));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

let rooms = require('./rooms');
let connections = [];

io.on('connection', function(socket) {

    let connection = {
        id: "",
        playerName: "",
        room: "",
        type: ""
    };

    // ## Send the rooms list to the new connected client
    io.emit('syncScreens', rooms);

    io.clients((error, clients) => {
        if (error) throw error;
        connection.id = clients[clients.length-1];

        console.log(`A visitor [ ${connection.id} ] has connected!`);
        console.log("Clients: "+clients); // => [6em3d4TJP8Et9EMNAAAA, G5p55dHhGgUnLUctAAAB]
      });

    socket.on('disconnect', function(){
        let user = connection.playerName.length > 0 
            ? 
                connection.playerName + `[ ${connection.id} ]`
            : 
                `A visitor [ ${connection.id} ]`;
        console.log(user+" has disconnected!");
    });

    socket.on('playerName', (data) => {
        let message = connection.playerName == "" ? `A visitor [ ${connection.id} ] has set name to ` + data.playerName : connection.playerName + `[ ${connection.id} ] has changed name to ` + data.playerName;
        console.log(message);
        connection.playerName = data.playerName;
    });

    socket.on('createRoom', () =>{
        let newRoom = {
            "roomName": `room-${rooms.length+1}`,
            "roomStatus": "empty",
            "players": 0,
            "playerX": {
                "playerName": "",
                "seatStatus": "empty",
                "playerScore": 0
            },
            "player0": {
                "playerName": "",
                "seatStatus": "empty",
                "playerScore": 0
            }
        }   
        rooms.push(newRoom);
        let message = connection.playerName.length > 0 ? `Player ${connection.playerName} `  : `A visitor `;
        message += `[ ${connection.id} ] has created ` + newRoom.roomName;
        console.log(message);
        io.emit('syncScreens', rooms);
    });

    socket.on('playerJoin', (data) => {
        
        connection.room = data.roomName;
        connection.type = data.type;

        if( !io.sockets.adapter.rooms[data.roomName] || io.sockets.adapter.rooms[data.roomName].length === 1 ){
            if(data.player.playerName.length > 0){
                socket.join(data.roomName);
                console.log("Player " + connection.playerName + ` [ ${connection.id} ]  has joined ` + data.roomName);
                rooms.forEach(room => {
                    if(room.roomName == data.roomName){
                        room[`player${data.type}`].playerName = data.player.playerName
                        room[`player${data.type}`].seatStatus = "waiting"
                    }
                });
                io.emit('syncScreens', rooms);
            }
        }

    //    ## Get a list of all open rooms in socket.io
    //    console.log("Rooms: ",io.sockets.adapter.rooms);
    //    console.log(rooms);
    });

    socket.on('playerQuit', (data) => {
        console.log(data.player.playerName + " wants to quit " + data.roomName);
        connection.room = "";
        connection.type = "";
        socket.leave(data.roomName);
        console.log("Player " + connection.playerName + ` [ ${connection.id} ] has left ` + data.roomName);
        
        rooms.forEach(room => {
            if(room.roomName == data.roomName){
                room[`player${data.type}`].playerName = ""
                room[`player${data.type}`].seatStatus = "empty"
            }
        });
        io.emit('syncScreens', rooms);
    });

    socket.on('deleteRoom', (data) => {
        console.log("delete room received: ", data.roomName);
        let newRooms = rooms.filter(room => {
            return room.roomName != data.roomName
        });
        rooms = newRooms;
        console.log("rooms: ", rooms);
        console.log(data.roomName, " has been deleted by ", connection.playerName);
        io.emit('syncScreens', rooms);    
    });
});

server.listen(process.env.PORT);
