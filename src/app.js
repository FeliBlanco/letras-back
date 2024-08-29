import express from 'express'
import cors from 'cors'
import { createServer } from "http";
import {config} from 'dotenv'

config()


import connectMongoDB from './db.js';
import bodyParser from 'body-parser'
import { conectarSocket } from './socket.js';



connectMongoDB()

import user from './routes/user.js'
import juego from './routes/juego.js'
import chat from './routes/chat.js'

const app = express();

const httpServer = createServer(app);

conectarSocket(httpServer)

app.use(cors())
app.use(express.json())
app.use(bodyParser())

app.use('/user', user)
app.use('/juego', juego)
app.use('/chat', chat)


export default httpServer