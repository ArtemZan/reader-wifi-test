const { WebSocketServer, WebSocket: a } = require("ws")
const uuid = require("uuid")
const { hrtime } = require('node:process');


const wsServer = new WebSocketServer({
    port: 4000
})

const socketsPingTimeNs = new Map()
const socketsTimeouts = new Map()
const socketsSrc = new Map()


const pingTimeColors = [
    "\x1b[32m",
    "\x1b[34m",
    "\x1b[33m",
    "\x1b[31m"
]


function clearSocketTimout(socket) {
    const timeout = socketsTimeouts.get(socket.id)
    clearTimeout(timeout)
    socketsTimeouts.delete(socket.id)
}

function handleWsMessage(socket, data) {
    const pingStartTimeNs = socketsPingTimeNs.get(socket.id)
    const timeNowNs = hrtime.bigint()

    //console.log("timeNowNs: ", timeNowNs, typeof timeNowNs, "pingStartTimeNs: ", pingStartTimeNs, typeof pingStartTimeNs)
    //console.log("Got message: ", data)

    if (data.src) {
        socketsSrc.set(socket.id, data.src)
    }

    if (data?.method === "NotifyEvent" && data.params?.events?.length) {
        //console.log("Ping. Connection: ", socket.id)

        const events = data.params.events
        //console.log("Event: ", events[0])

        const hasPingEvent = events.some(e => e.event === "ping")

        if (hasPingEvent) {
            const timeElapsedMs = Math.round(Number((BigInt(timeNowNs) - BigInt(pingStartTimeNs || 0)) / 1000n)) / 1000

            const colorControl = pingTimeColors[Math.min(3, Math.floor(timeElapsedMs / 300))]

            console.log("src: ", data.src.padEnd(30, " "), `time (ms): ${colorControl}${timeElapsedMs}\x1b[37m`)


            socketsPingTimeNs.set(socket.id, null)
            clearSocketTimout(socket)

            setTimeout(() => {
                sendPing(socket)
            }, 100)
        }

    }
}

function sendPing(socket) {


    socketsPingTimeNs.set(socket.id, hrtime.bigint())

    socket.send(JSON.stringify({
        src: "reader-wifi-test",
        id: 1087,
        method: "Script.Eval",
        params: {
            id: 1,
            code: "_ping();"
        }
    }))

    const timeout = setTimeout(() => {
        console.log("Ping took too long to respond. Src: ", socketsSrc.get(socket.id))
        socketsSrc.delete(socket.id)
    }, 10000)

    socketsTimeouts.set(socket.id, timeout)
}

wsServer.addListener("listening", () => {
    console.log("Ws server started")
})

wsServer.addListener("connection", (ws) => {
    ws.id = uuid.v4()

    ws.on("message", (data) => {
        handleWsMessage(ws, JSON.parse(data.toString()))
    })

    // ws.on("close", () => {
    //     console.log("Connection closed. Src: ", socketsSrc.get(socket.id))
    //     socketsSrc.delete(socket.id)
    //     clearSocketTimout(ws.id)
    // })

    console.log("New connection. Id: ", ws.id)

    sendPing(ws)
})

// function sendPings() {
//     console.log("\n")
//     for (const socket of wsServer.clients) {
//         //console.log("Send ping. Save time for socket id: ", socket.id)


//     }
// }

// setInterval(sendPings, 500)
