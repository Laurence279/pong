/*

Fetch request ====> server responds with information =====> gives info to client and closes connection.

Socket.io sets up a WebSocket:

WebSocket connects to a server and keeps the connection open instead of making multiple
requests over and over.

*/
// const io = require(`socket.io`)(8001, {
//     cors: {
//         origin: 'http://localhost:8080' //Where is the client coming from?????
//     }
// });


const express = require(`express`);
var cors = require('cors')
const app = express();
let port = process.env.PORT;
if (port == null || port == "") {
    port = 3001;
}

let server = app.use(express.static('./build'))
    .listen(port, () => console.log(`Listening on ${port}`));


const options = {
    serveClient: false,
    cookie: false,
    cors: {
        //origin: "http://localhost:3001/",
        origin: "https://pingpongpong.herokuapp.com/",
        methods: ["GET", "POST"]
    }
};



const {
    instrument
} = require(`@socket.io/admin-ui`);

const socketIO = require("socket.io")
const io = socketIO(server, options);


var expressOptions = {
    origin: "https://pingpongpong.herokuapp.com/"
    //origin: "http://localhost:3001/"
}
app.use(cors(expressOptions));

const userIo = io.of(`user`);
userIo.on(`connection`, socket => {
    console.log("connected to user namespace with username " + socket.username);
})


//Below middleware only runs on the /user namespace
userIo.use((socket, next) => {
    if (socket.handshake.auth.token) {
        socket.username = getUsernameFromToken(socket.handshake.auth.token);
        next();
    } else {
        next(new Error("Please send token."))
    }
})

function getUsernameFromToken(token) {
    return token
}
const roomnum = {
    room: 1,
    player1: undefined,
    player2: undefined
};

//Handle a client connection to this server
io.on("connection", socket => {

    socket.join(roomnum)
    console.log(socket.id)
    socket.broadcast.emit(`connect-other`, socket.id)
    socket.on(`send-message`, (message, room) => {
        if (room === "") {
            socket.broadcast.emit(`receive-message`, socket.id, message) // Emits response to every client except this one
        } else {
            socket.to(room).emit(`receive-message`, socket.id, message);
        }
    })
    socket.on(`join-room`, (room, callback) => {
        socket.join(room);
        callback(`Joined ${room}`); // Call this function with a resolve when a room is joined, this is passed in from the client
    })

    socket.on('sync', (syncVars, id) => {
        if (id == roomnum.player1) {
            let posX;
            if (syncVars.directionX === 1) {
                posX = syncVars.ballPosX + 60;
            } else {
                posX = syncVars.ballPosX - 60
            }

            const player1Pos = {
                ballPosX: posX,
                ballPosY: syncVars.ballPosY,
                paddle1X: syncVars.paddle1X,
                paddle1Y: syncVars.paddle1Y
            }
            socket.broadcast.emit('sync-client', player1Pos)
        } else if (id == roomnum.player2) {

            const player2Pos = {
                paddle2X: syncVars.paddle2X,
                paddle2Y: syncVars.paddle2Y
            }
            socket.broadcast.emit('sync-client', player2Pos)
        } else {
            return;
        }

    })

    socket.on('start-game', () => {
        socket.emit('receive-game-start');
    })

    socket.on('player-scored', player => {

        if (player.score >= 11) {
            socket.broadcast.emit('reset-game', player);
            return;
        }
        socket.broadcast.emit('receive-score', player);
    })


    socket.on(`choose-player1`, id => {

        console.log("Current player is " + roomnum.player1);
        if (roomnum.player1 !== undefined || roomnum.player2 == id) {
            return;
        }
        console.log(`${id} is now Player 1.`)
        roomnum.player1 = id;
        socket.emit('assign-player1', id)
        if (roomnum.player2 != undefined) {
            socket.emit('receive-game-start')
        }
    })

    socket.on(`choose-player2`, id => {
        console.log("Current player is " + roomnum.player2);
        if (roomnum.player2 !== undefined || roomnum.player1 == id) {
            return;
        }
        console.log(`${id} is now Player 2.`)
        roomnum.player2 = id;
        socket.emit(`assign-player2`, id)
        if (roomnum.player1 != undefined) {
            socket.broadcast.emit('receive-game-start')
        }
    })

    socket.on(`ping`, n => console.log(n))
})

instrument(io, {
    auth: false
});