import {
    io
} from "socket.io-client";

const joinRoomButton = document.getElementById("room-btn");
const messageInput = document.getElementById("message-input");
const roomInput = document.getElementById("room-input");
const form = document.getElementById("form");

const socket = io("http://localhost:8002"); // WHICH SOCKET SERVER DO I CONNECT TO? NEEDS TO MATCH THE SERVER PORT PASSED INTO THE SOCKET PACKAGE..
console.log(socket)
// userSocket not being used to now, so no authenticating users etc..
// const userSocket = io(`http://localhost:3000/user`, {
//     auth: {
//         token: "A"
//     }
// });

socket.on(`connect`, () => {
    displayMessage(`You connected with id ${socket.id.substring(0,4)}`);
})

socket.on(`connect-other`, (id) => {
    displayMessage(`Someone connected with id ${id.substring(0,4)}, say hi!`)
})


//Event listener. Sends specified data up to server
// socket.emit("custom-event", 5, "Hello", {
//     a: "a"
// })


// userSocket.on(`connect_error`, error => { //Called if user is not authenticated
//     displayMessage(error);
// })

//receive-message event is called when the server broadcasts it
socket.on(`receive-message`, function (id, message) {
    displayMessage(message, id);
})

form.addEventListener("submit", e => {
    e.preventDefault();
    const message = messageInput.value;
    const room = roomInput.value;

    if (message === "") return;
    displayMessage(message, socket.id);

    socket.emit(`send-message`, message, room)

    messageInput.value = "";
})

joinRoomButton.addEventListener("click", () => {
    const room = roomInput.value;
    socket.emit(`join-room`, room, message => {
        displayMessage(message)
        //Callback function will display a message to the user to verify a room was joined
    })
    // Tell server this client wants to join a room
})

function displayMessage(message, id) {
    const div = document.createElement("div");
    if (id == undefined) {
        id = "";
        div.textContent = `${message}`;
        document.getElementById("message-container").append(div);
        return;
    }
    div.textContent = `${id.substring(0,4)}: ${message}`;
    document.getElementById("message-container").append(div);
}

//#region Pong

socket.on(`assign-player1`, id => {
    displayMessage(`${id.substring(0,4)} is now Player 1.`)
    player1Btn.classList.add('selected');
    player1Btn.text.innerText = id.substring(0, 4);
})

socket.on(`assign-player2`, id => {
    displayMessage(`${id.substring(0,4)} is now Player 2.`)
    player2Btn.classList.add('selected');
    player2Btn.text.innerText = id.substring(0, 4);
})

//Make the DIV element draggagle:
const player1Btn = document.getElementById("slot-1");
player1Btn.text = document.getElementById("p1-occupied");
const player2Btn = document.getElementById("slot-2")
player2Btn.text = document.getElementById("p2-occupied");
const player1Paddle = document.getElementById("player1");
const player2Paddle = document.getElementById("player2");

player1Btn.addEventListener("click", function (e) {
    socket.emit(`choose-player1`, socket.id)

    if (player2Btn.enabled === true) return
    if (player1Btn.enabled === true) {
        resetPlayerSlot(player1Btn, player1Paddle);
        return;
    }
    player1Btn.enabled = true;

    player1Btn.classList.add('selected');
    dragElement(player1Paddle);
    player1Btn.text.innerText = socket.id.substring(0, 4);
})

player2Btn.addEventListener("click", function (e) {
    socket.emit(`choose-player2`, socket.id)
    if (player1Btn.enabled === true) return
    if (player2Btn.enabled === true) {
        resetPlayerSlot(player2Btn, player2Paddle);
        return;
    }
    player2Btn.enabled = true;
    player2Btn.classList.add('selected');
    dragElement(player2Paddle);
    player2Btn.text.innerText = socket.id.substring(0, 4);
})

function resetPlayerSlot(slot, paddle) {
    paddle.onmousedown = "";
    slot.enabled = false;
    slot.classList.remove('selected');
    slot.text.innerText = "Open";
}


const sandbox = document.getElementById("sandbox");

function dragElement(elmnt) {
    var pos1 = 0,
        pos2 = 0,
        pos3 = 0,
        pos4 = 0;
    if (document.getElementById(elmnt.id + "header")) {
        /* if present, the header is where you move the DIV from:*/
        document.getElementById(elmnt.id + "header").onmousedown = dragMouseDown;
    } else {
        /* otherwise, move the DIV from anywhere inside the DIV:*/
        elmnt.onmousedown = dragMouseDown;
    }

    function dragMouseDown(e) {
        e = e || window.event;
        e.preventDefault();
        // get the mouse cursor position at startup:
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        // call a function whenever the cursor moves:
        document.onmousemove = elementDrag;
    }

    function elementDrag(e) {
        e = e || window.event;
        e.preventDefault();
        // calculate the new cursor position:

        pos2 = pos4 - e.clientY;
        pos4 = e.clientY;
        // set the element's new position:
        elmnt.style.top = clamp((elmnt.offsetTop - pos2), min, max) + "px";
    }

    function closeDragElement() {
        /* stop moving when mouse button is released:*/
        document.onmouseup = null;
        document.onmousemove = null;
    }


    const min = -150;
    const max = 120;

    // Clamp number between two values with the following line:
    const clamp = (num, min, max) => Math.min(Math.max(num, min), max);

    clamp(-50, min, max); // Will return: 0
    clamp(50, min, max); // Will return: 50
    clamp(500, min, max); // Will return: 100

}
//#endregion


//#region connect/reconnect

//If client disconnects and reconnects later, socket will send up all of the previous pings to the server

// Using socket.volatile.emit will ignore/delete messages if it cant send. Otherwise all messages are resent.

// let count = 0;
// setInterval(() => {
//     socket.volatile.emit(`ping`, ++count)
// }, 1000);

// document.addEventListener("keydown", e => {
//     if (e.target.matches("input")) return

//     if (e.key === "c") socket.connect();
//     if (e.key === "d") socket.disconnect();
// })

//#endregion