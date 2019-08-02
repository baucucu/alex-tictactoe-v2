(function init() {
    // const socket = io.connect('http://tic-tac-toe-realtime.herokuapp.com'),
    const socket = io.connect('http://localhost:5500');

    socket.on("PONG", () => {
        setTimeout(socket.emit("PING"),5000);
    });

    let rooms;
    let roomsHTML;
    let player = {
        id: "",
        status: "visitor",
        playerName: "",
        room: "",
        type: ""
    };

    socket.on('syncScreens', (data) => {
        console.dir("sync screen has been received", data);
        rooms = data.rooms;

        console.table(rooms);
        
        if(socket.id == data.player.id) player = data.player;

                
        roomsHTML = `<button ${player.playerName.length > 0 ?  "" : 'style="display: none;' };" class="w3-btn w3-blue" id="createRoom">Create room</button>`;
        
        if(rooms){
            // ## Create a card for each room
            rooms.forEach(room => {


                let playerIsOwner = player.playerName == room.owner;

                roomsHTML += `
                <div id="${room.roomName}" class="w3-card-4">
                    <header class="w3-container w3-blue-grey w3-bar">
                        <h4 w3-left w3-button w3-bar-item>${room.roomName}</h4>
                        <button ${playerIsOwner ?  "" : 'style= "display:none"'} class="w3-right w3-bar-item w3-button" id="deleteRoom-${room.roomName}">x</button>
                    </header>
                    <div class="w3-cell-row">

                        <div class="w3-container w3-light-grey w3-cell">
                            <p id="${room.roomName}-playerXName">Player X: ${room.playerX.playerName}</p>
                            <p id="playerXScore">Score: ${room.playerX.playerScore}</p>
                            <button ${player.playerName == "" || room.playerX.playerName.length > 0  || ( room.player0.playerName == player.playerName && player.playerName.length > 0) ?  'style="display: none;' : "" };" class="w3-btn w3-blue" id="${room.roomName}-playerxjoin">Join</button>
                            <button ${room.playerX.playerName.length > 0 && room.playerX.playerName == player.playerName ?  "" : 'style="display: none;' };" class="w3-btn w3-red" id="${room.roomName}-playerxquit">Quit</button>
                        </div>
                    
                        <div class="w3-container w3-light-grey w3-cell">
                            <p id="${room.roomName}-player0Name">Player 0: ${room.player0.playerName}</p>
                            <p id="player0Score">Score: ${room.player0.playerScore}</p>
                            <button ${player.playerName == "" || room.player0.playerName.length > 0  || ( room.playerX.playerName == player.playerName && player.playerName.length > 0) ?  'style="display: none;' : "" };" class="w3-btn w3-blue" id="${room.roomName}-player0join">Join</button>
                            <button ${room.player0.playerName.length > 0 && room.player0.playerName == player.playerName ?  "" : 'style="display: none;' };" class="w3-btn w3-red" id="${room.roomName}-player0quit">Quit</button>
                        </div>
                    
                    </div>
                </div>
                `;
            });
            $('#roomsList').html(roomsHTML);
            //  ## Attach event listeners to card controls
            rooms.forEach( room => {
                $(`#${room.roomName}-player0join`).click(() => {
                    socket.emit('playerJoin', {player: player, roomName: room.roomName, type:"0" , id: player.id});    
                });
                $(`#${room.roomName}-player0quit`).click(() => {
                    socket.emit('playerQuit', {player: player, roomName: room.roomName, type:"0" , id: player.id});
                });
                $(`#${room.roomName}-playerxjoin`).click(() => {
                    socket.emit('playerJoin', {player: player, roomName: room.roomName, type:"X" , id: player.id});
                });
                $(`#${room.roomName}-playerxquit`).click(() => {
                    socket.emit('playerQuit', {player: player, roomName: room.roomName, type:"X" , id: player.id});
                });
                
                $(`#deleteRoom-${room.roomName}`).on("click", function() {
                    console.log("delete room requested");
                    socket.emit('deleteRoom', {roomName: room.roomName});
                });
            })

            $('#createRoom').click( ()=> {
                socket.emit('createRoom');
            });

            
        }
    });

    socket.on('nameTaken', () => {
        console.log('name taken');
        $('form legend').html('This name is already taken. Please chose another name.');
    });

    socket.on('nameSet', (data) => {
        console.log("name ok");
        player.playerName = data.name;
        playerHasName = "true"
        $('#welcome').html(`Welcome ${player.playerName}`);
        $('form legend').html('Change your name');
    });

    socket.on('agreeJoin', (data) => {
        console.log('agreeJoin reeceived');
        let agree = window.confirm(`Do you agree ${data.player.playerName} joins your game?`);

        if(agree) {
            console.log("agree data: ", {player: data.player, roomName: data.roomName, type: data.type , id: data.id, agree: agree});
            socket.emit("playerJoin", {player: data.player, roomName: data.roomName, type: data.type , id: data.id, agree: agree});
        }
    });
    
    $('form').submit( function(event) {
        event.preventDefault();
 
        let name = $('input').val();
        if(name.length > 0) {
            
            socket.emit('playerName', {playerName: name, player: player});
            
        }
        return;        
    });

}());