import { Server } from "socket.io";


let io = null;

export function conectarSocket(httpServer) {
    io = new Server(httpServer, {allowEIO3: true, cors: {
        origin: ["http://localhost:5173", "http://ec2-18-206-120-192.compute-1.amazonaws.com/home", "http://localhost"]
      }});
    io.on("connection", (socket) => {
        if(socket?.handshake?.query?.userid) {
            const userid = socket.handshake.query.userid;
            console.log("TIENE USERID")
            socket.join("user"+userid);
        } else {
            console.log("NO TIENE USERID")
        }
        console.log(socket.handshake.query)
        console.log("CONEXION SOCKET")
    });
}

export function sendSocketToUser(userid, name, data) {
    if(io) {
        io.to("user"+userid).emit(name, data)
    }
}

export function sendSocket(name, data = {}) {
    if(io) {
        io.emit(name, data)
    }
}

export default io
