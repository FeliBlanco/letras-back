import { Router } from 'express';
import isLogged from '../middleware/isLogged.js';
import { sendSocket } from '../socket.js';

const router = Router();

let messages = [];

router.get('/', async(req, res) => {
    try {
        res.send(messages)
    }
    catch(err) {
        res.status(503).send()
    }
})


router.post('/', isLogged, async(req, res) => {
    try {
        console.log("MENSAJE")
        const { 
            message
        } = req.body;

        const fecha = new Date();
        const new_chat = {userid: req.user.id, message, fecha}
        messages.push(new_chat)

        sendSocket("chat", new_chat)

        res.send()
    }
    catch(err) {
        res.status(503).send()
        console.log(err)
    }
})

export default router;