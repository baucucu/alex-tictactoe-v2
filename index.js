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
let players = [];

io.on('connection', function(socket) {

    socket.on("PING", () => {
        setTimeout(socket.emit("PONG"),5000);
    });
    
    let player = {
        id: "",
        status: "visitor",
        playerName: "",
        room: "",
        type: ""
    };

    // ## Send the rooms list to the new connected client
    io.emit('syncScreens', {rooms, player});

    io.clients((error, clients) => {
        if (error) throw error;
        player.id = clients[clients.length-1];

        console.log(`${player.status} [ ${player.id} ] has connected!`);
        console.log("Clients: "+clients); // => [6em3d4TJP8Et9EMNAAAA, G5p55dHhGgUnLUctAAAB]
      });

    socket.on('disconnect', function(){

        rooms.forEach( room => {
            if(room.playerX.playerName == player.playerName && room.playerX.playerName !== "") {
                room.playerX.playerName = ""
                room.playerX.seatStatus = "empty"
                room.players -= 1;
            }
            if(room.player0.playerName == player.playerName && room.player0.playerName !== "") {
                room.player0.playerName = ""
                room.player0.seatStatus = "empty"
                room.players -= 1;
            }
        });

        let newPlayers = players.filter(p => {
            return p.playerName != player.playerName
        });
        players = newPlayers;

        

        console.log(`${player.status} [ ${player.id} ] ${player.playerName}` + " has disconnected!");
        console.log("Players: ", players);
    });


    socket.on('playerName', (data) => {

        let message = `${player.status} [ ${player.id} ] ${player.playerName}` 
        message += player.status == "visitor" ? " has set name to " : " has changed name to ";
        message += data.playerName;

        let playerCheck = players.filter( p => {
            return p.playerName == data.playerName;
        })[0];

        let socketCheck = players.filter( p => {
            return p.id == data.player.id;
        });
    
        if(playerCheck) {
            console.log("Player name already exists");
            socket.emit('nameTaken');
        }
        else {
            player.status = "user";

            rooms.forEach(room => {
                if(room.playerX.playerName == player.playerName  && player.playerName !== ""){
                    room.playerX.playerName = data.playerName;
                }
                if(room.player0.playerName == player.playerName && player.playerName !== ""){
                    room.player0.playerName = data.playerName;
                }
            });

            player.playerName = data.playerName;
            
            if(socketCheck.length == 0) {players.push(player)};

            io.emit('syncScreens', {rooms, player});
            socket.emit('nameSet', {name: player.playerName});
            
            console.log("Players: ", players);
            console.log(message);
        }
    });

    socket.on('createRoom', () =>{
        let newRoom = {
            "roomName": `room-${rooms.length+1}`,
            "roomStatus": "empty",
            "owner":player.playerName,
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
        let message = player.playerName.length > 0 ? `Player ${player.playerName} `  : `A visitor `;
        message += `[ ${player.id} ] has created ` + newRoom.roomName;
        console.log(message);
        io.emit('syncScreens', {rooms, player});
    });


    socket.on('playerJoin', (data) => {
        console.log("data: ", data);

        let requestedRoom = rooms.filter(room => {return room.roomName == data.roomName});
        console.log("Requested room: ",requestedRoom);

        let playerNumberCheck = requestedRoom[0].players;

        console.log(" Players in room: ", playerNumberCheck);
        console.log("agree: ", data.agree);

        if( playerNumberCheck == 1 && !data.agree) {
            socket.to(`${data.roomName}`).emit('agreeJoin', {player: data.player, roomName: data.roomName, type: data.type , id: data.id});
            return;
        }

        player.room = data.roomName;
        player.type = data.type;

        if( !io.sockets.adapter.rooms[data.roomName] || io.sockets.adapter.rooms[data.roomName].length === 1 ){
            if(data.player.playerName.length > 0){
                socket.join(data.roomName);
                console.log("Player " + player.playerName + ` [ ${player.id} ]  has joined ` + data.roomName);
                rooms.forEach(room => {
                    if(room.roomName == data.roomName){
                        room[`player${data.type}`].playerName = data.player.playerName
                        room[`player${data.type}`].seatStatus = "waiting"
                        room.players += 1;
                    }
                });
                io.emit('syncScreens', {rooms, player});
            }
        }
    });




    socket.on('playerQuit', (data) => {
        console.log(data.player.playerName + " wants to quit " + data.roomName);
        player.room = "";
        player.type = "";
        socket.leave(data.roomName);
        console.log("Player " + player.playerName + ` [ ${player.id} ] has left ` + data.roomName);
        
        rooms.forEach(room => {
            if(room.roomName == data.roomName){
                room[`player${data.type}`].playerName = ""
                room[`player${data.type}`].seatStatus = "empty"
                room.players -= 1;
            }
        });
        io.emit('syncScreens', {rooms, player});
    });



    socket.on('deleteRoom', (data) => {
        console.log("delete room received: ", data.roomName);
        let newRooms = rooms.filter(room => {
            return room.roomName != data.roomName
        });
        rooms = newRooms;
        // console.log("rooms: ", rooms);
        console.log(data.roomName, " has been deleted by ", player.playerName);
        io.emit('syncScreens', {rooms,player});    
    });
});

server.listen(process.env.PORT);
