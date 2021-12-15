import {
    io
} from "socket.io-client";

const joinRoomButton = document.getElementById("room-btn");
const messageInput = document.getElementById("message-input");
const roomInput = document.getElementById("room-input");
const form = document.getElementById("form");

const socket = io("http://localhost:3000"); // WHICH SOCKET SERVER DO I CONNECT TO? NEEDS TO MATCH THE SERVER PORT PASSED INTO THE SOCKET PACKAGE..
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

//#region Canvas IIFE...
;
(function () {

    // Config vars
    let canvas, ctx, gravity, friction, ball;


    class Paddle {
        constructor(
            x = 0, y = 0,
            width = 0, height = 0,
            fillColor = '', strokeColor = '', strokeWidth = 2
        ) {
            this.x = Number(x)
            this.y = Number(y)
            this.width = Number(width)
            this.height = Number(height)
            this.fillColor = fillColor
            this.strokeColor = strokeColor
            this.strokeWidth = strokeWidth
        }

        // get keyword causes this method to be called
        // when you use myRectangle.area
        get area() {
            return this.width * this.height
        }


        // gets the X position of the left side
        get left() {
            // origin is at top left so just return x
            return this.x
        }

        // get X position of right side
        get right() {
            // x is left position + the width to get end point
            return this.x + this.width
        }

        // get the Y position of top side
        get top() {
            // origin is at top left so just return y
            return this.y
        }

        // get Y position at bottom
        get bottom() {
            return this.y + this.height
        }

        // draw rectangle to screen
        draw() {
            // destructuring
            const {
                x,
                y,
                width,
                height,
                fillColor,
                strokeColor,
                strokeWidth
            } = this

            // saves the current styles set elsewhere
            // to avoid overwriting them
            ctx.save()

            // set the styles for this shape
            ctx.fillStyle = fillColor
            ctx.lineWidth = strokeWidth

            // create the *path*
            ctx.beginPath()
            ctx.strokeStyle = strokeColor
            ctx.rect(x, y, width, height)

            // draw the path to screen
            ctx.fill()
            ctx.stroke()

            // restores the styles from earlier
            // preventing the colors used here
            // from polluting other drawings
            ctx.restore()
        }
    }

    function init() {
        canvas = document.getElementById("sandbox");
        ctx = sandbox.getContext('2d');

        gravity = 0;
        friction = 1;

        // begin update loop
        window.requestAnimationFrame(update)

        // Starting objects..




        ball = {
            bounce: 0, // energy lost on bounce (25%)
            radius: 5,
            x: canvas.width / 2,
            y: canvas.height / 2,
            // velX: (Math.random() * 5 + 5) * (Math.floor(Math.random() * 1) || -1),
            // velY: (Math.random() * 5 + 5) * (Math.floor(Math.random() * 1) || -1)
            velX: (5),
            velY: (5)
        }


    }



    function drawPaddles() {

        /*
        //Outlined Square X: 50 Y:35, width/height: 50
        ctx.beginPath();
        ctx.strokeRect(50, 35, 50, 50)

        // filled square X: 125, Y: 35, width/height 50
        ctx.beginPath()
        ctx.fillRect(125, 35, 50, 50)

        // filled, outlined square X: 200, Y: 35, width/height 50
        ctx.beginPath();
        ctx.strokeStyle = 'red'
        ctx.fillStyle = 'blue'
        ctx.lineWidth = 5;
        ctx.rect(200, 35, 50, 50)
        ctx.fill();
        ctx.stroke();


        // // Draw Ball
        // ctx.save()
        // ctx.strokeStyle = 'black'
        // ctx.fillStyle = 'red'

        // // x, y, radius, startAngle, endAngle, antiClockwise = false by default

        // ctx.beginPath()
        // ctx.arc(150, 75, 5, 0, 2 * Math.PI, false) // full circle
        // ctx.fill()
        // ctx.stroke()

        // ctx.restore()

        */

        const player1Paddle = new Paddle(15, 52.5, 15, 45, 'lightblue', `black`)
        const player2Paddle = new Paddle(270, 52.5, 15, 45, 'lightblue', `black`)

        console.log(player2Paddle)

        player1Paddle.draw();
        player2Paddle.draw();


    }

    function drawBall() {
        // Draw Ball
        ctx.strokeStyle = 'black'
        ctx.fillStyle = 'red'

        // x, y, radius, startAngle, endAngle, antiClockwise = false by default

        ctx.beginPath()
        ctx.arc(ball.x, ball.y,
            ball.radius,
            0, Math.PI * 2) // full circle
        ctx.fill()
        ctx.stroke()
    }

    // draws a grid
    function createGrid() {
        // draw a line every *step* pixels
        const step = 30

        // our end points
        const width = canvas.width
        const height = canvas.height

        // set our styles
        ctx.save()
        ctx.strokeStyle = 'gray' // line colors
        ctx.fillStyle = 'black' // text color

        // draw vertical from X to Height
        for (let x = 0; x < width; x += step) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
            ctx.fillText(x, x, 12)
        }

        // draw horizontal from Y to Width
        for (let y = 0; y < height; y += step) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
            ctx.fillText(y, 0, y)
        }

        // restore the styles from before this function was called
        ctx.restore()
    }

    function draw() {
        // clear the canvas and redraw everything
        ctx.clearRect(0, 0, canvas.width, canvas.height)

        drawBall();


        drawPaddles();
        createGrid();

    }

    function update() {
        console.log("update")
        // queue the next update
        window.requestAnimationFrame(update)

        // logic goes here


        // bottom bound / floor
        if (ball.y + ball.radius >= canvas.height) {
            ball.velY = -ball.velY
            ball.y = canvas.height - ball.radius
            ball.velX *= friction
        }
        // top bound / ceiling
        if (ball.y - ball.radius <= 0) {
            ball.velY = -ball.velY
            ball.y = ball.radius
            ball.velX *= friction
        }

        // left bound
        if (ball.x - ball.radius <= 0) {
            ball.velX = -ball.velX
            ball.x = ball.radius
        }
        // right bound
        if (ball.x + ball.radius >= canvas.width) {
            ball.velX = -ball.velX
            ball.x = canvas.width - ball.radius
        }

        // reset insignificant amounts to 0
        if (ball.velX < 0.01 && ball.velX > -0.01) {
            ball.velX = 0
        }
        if (ball.velY < 0.01 && ball.velY > -0.01) {
            ball.velY = 0
        }

        //Add gravity
        ball.velY += gravity;

        //Update ball position
        ball.x += ball.velX;
        ball.y += ball.velY;



        // draw after logic/calculations
        draw()
    }




    document.addEventListener("DOMContentLoaded", init)

})()

//#endregion

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


setInterval(() => {
    moveBall(1);
}, 100);

//#region ball
const ball = document.getElementById("ball")


function moveBall(amount) {

    ball.style.left = `${ball.offsetLeft + amount}px`
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