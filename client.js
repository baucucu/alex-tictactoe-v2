(function init() {
    // const socket = io.connect('http://tic-tac-toe-realtime.herokuapp.com'),
    const socket = io.connect('http://localhost:5500');

    let rooms;
    let player = {
        id: "",
        playerName: "",
        room: "",
        type: ""
    };

    socket.on('syncScreens', (data) => {
        rooms = data;
        let roomsHTML = '<button class="w3-btn w3-blue" id="createRoom">Create room</button>';
        
        if(rooms){
            // ## Create a card for each room
            rooms.forEach(room => {

                roomsHTML += `
                <div id="${room.roomName}" class="w3-card-4">
                    <header class="w3-container w3-blue-grey">
                        <h4>${room.roomName}</h4>
                    </header>
                    <div class="w3-cell-row">

                        <div class="w3-container w3-light-grey w3-cell">
                            <p id="${room.roomName}-playerXName">Player X: ${room.playerX.playerName}</p>
                            <p id="playerXScore">Score: ${room.playerX.playerScore}</p>
                            <button ${room.playerX.playerName.length == 0 ?  "" : 'style="display: none;' };" class="w3-btn w3-blue" id="${room.roomName}-playerxjoin">Join</button>
                            <button ${room.playerX.playerName.length > 0 && room.playerX.playerName == player.playerName ?  "" : 'style="display: none;' };" class="w3-btn w3-red" id="${room.roomName}-playerxquit">Quit</button>
                        </div>
                    
                        <div class="w3-container w3-light-grey w3-cell">
                            <p id="${room.roomName}-player0Name">Player 0: ${room.player0.playerName}</p>
                            <p id="player0Score">Score: ${room.player0.playerScore}</p>
                            <button ${room.player0.playerName.length == 0 ?  "" : 'style="display: none;' };" class="w3-btn w3-blue" id="${room.roomName}-player0join">Join</button>
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
                    socket.emit('playerJoin', {player: player, roomName: room.roomName, type:"0" })
                });
                $(`#${room.roomName}-player0quit`).click(() => {
                    socket.emit('playerQuit', {player: player, roomName: room.roomName, type:"0" })
                });
                $(`#${room.roomName}-playerxjoin`).click(() => {
                    socket.emit('playerJoin', {player: player, roomName: room.roomName, type:"X" })
                });
                $(`#${room.roomName}-playerxquit`).click(() => {
                    socket.emit('playerQuit', {player: player, roomName: room.roomName, type:"X" })
                });
            })

            $('#createRoom').click( ()=> {
                socket.emit('createRoom');
            });
        }
    });
    
    $('form').submit( function(event) {
        event.preventDefault();
        player.playerName = $('input').val();
        if(player.playerName.length > 0) {
            $('#welcome').html(`Welcome ${player.playerName}`);
            $('form legend').html('Change your name');
            socket.emit('playerName', {playerName: player.playerName});
        }
        return;        
    });

}());