/*

Fetch request ====> server responds with information =====> gives info to client and closes connection.

Socket.io sets up a WebSocket:

WebSocket connects to a server and keeps the connection open instead of making multiple
requests over and over.

*/
const express = require(`express`);
const app = express();
let port = process.env.PORT;
if (port == null || port == "") {
    port = 8080;
}
app.get("/", function (req, res) {
    res.sendFile("C:/Repos/pong/client/index.html")
})

const {
    instrument
} = require(`@socket.io/admin-ui`);
const io = require(`socket.io`)(3000, {
    cors: {
        origin: [`http://localhost:8080`, `https://admin.socket.io`],
    },
})

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

//Handle a client connection to this server
io.on("connection", socket => {
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

    socket.on(`choose-player1`, id => {
        console.log(`${id} is now Player 1.`)
        socket.broadcast.emit(`assign-player1`, id)
    })

    socket.on(`choose-player2`, id => {
        console.log(`${id} is now Player 2.`)
        socket.broadcast.emit(`assign-player2`, id)
    })

    socket.on(`ping`, n => console.log(n))
})

instrument(io, {
    auth: false
});

app.listen(port, function () {
    console.log("Server open on port " + port);
});