import { Router } from 'express';
import isLogged from '../middleware/isLogged.js';
import Usuario from '../models/user.js';
import { sendSocket, sendSocketToUser } from '../socket.js';

const router = Router();

const letras = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h','i'];
const precios = [12000, 13000, 12800, 14000, 16000, 14500, 19000, 15500, 18000, 16000, 12700, 12000, 14000, 15000];


let letras_juego = null;
let juego_running = false;
let id_partida = null;

let buscando_letra = false;
let letra_elegida = "";

router.get('/', async (req, res) => {
    try {
        res.send({letras: letras_juego, buscando_letra: buscando_letra, letra_elegida})
    }
    catch(err) {
        res.status(503).send()
    }
})

router.post('/jugar', isLogged, async (req, res) => {
    try {
        const userdata = req.user;
        const {
            index
        } = req.body;

        if(letras_juego[index].userid != 0) {
            return res.status(400).send({message:'index_ocupado'});
        }
        if(userdata.saldo < 2000) {
            return res.status(400).send({message:'saldo_insuficiente'});
        }

        const precio = 2000;

        const nuevo_saldo = userdata.saldo - precio;

        await Usuario.updateOne({_id: userdata._id}, {saldo: nuevo_saldo})

        letras_juego[index].userid = userdata.id;
        letras_juego[index].username = userdata.nombre;

        console.log(req.user)

        sendSocket("union_juego", {index, userid: userdata._id, username: userdata.nombre})
        sendSocketToUser(userdata.id, "actualizardata", {saldo: nuevo_saldo})
        comenzarJuego()

        res.send()
        
    }
    catch(err) {
        console.log(err)
        res.status(503).send()
    }
})

const generarLetras = () => {
    return letras.map(i => ({userid:0, marcador:0, ganador:false, username:"", name: i, precio: precios[Math.floor(Math.random() * (precios.length - 1))]}))
}

const comenzarJuego = () => {
    if(letras_juego.every(i => i.userid != 0)) {
        if(juego_running == false) {
            id_partida = Math.floor(Math.random() * 150)
            juego_running = true;
            console.log("COMIENZA JUEGO")
            sendSocket('comenzarjuego')

            buscarLetra(id_partida)
        }
    }
}

function buscarLetra(partida) {
    if(partida == id_partida) {
        letra_elegida = "";
        buscando_letra = true;
        sendSocket('buscandoletra')
        setTimeout(() => elegirLetra(partida), 3000)
    }
}

async function elegirLetra(partida) {
    console.log("Elegir letra")
    buscando_letra = false;
    const letra_index = Math.floor(Math.random() * letras_juego.length);
    letras_juego[letra_index].marcador ++;
    letra_elegida = letras_juego[letra_index].name
    if(letras_juego[letra_index].marcador >= 4) {
        letras_juego[letra_index].ganador = true;
        sendSocket('elegirletra', {letra: letra_elegida});
        sendSocket('ganador', {index:letra_index, userid: letras_juego[letra_index].userid});

        const user = await Usuario.findOne({_id: letras_juego[letra_index].userid});
        if(user) {
            const nuevo_saldo = user.saldo + letras_juego[letra_index].precio;

            await Usuario.updateOne({_id: user._id}, {saldo: nuevo_saldo});
            sendSocketToUser(user._id, "actualizardata", {saldo: nuevo_saldo})
        }


        setTimeout(restartGame, 5000)
    }
    else {
        sendSocket('elegirletra', {letra: letra_elegida})
        setTimeout(() => buscarLetra(partida), 5000)
    }
}

const restartGame = () => {
    id_partida = null;
    juego_running = false;
    letra_elegida = "";
    buscando_letra = false;
    letras_juego = generarLetras();
    sendSocket('actualizarjuego', {letras: letras_juego})
}

letras_juego = generarLetras();

export default router;