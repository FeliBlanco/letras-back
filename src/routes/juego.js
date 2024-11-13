import { Router } from 'express';
import isLogged from '../middleware/isLogged.js';
import Usuario from '../models/user.js';
import { sendSocket, sendSocketToUser } from '../socket.js';
import Juego from '../models/juego.js';

const router = Router();

let ganancias = 25000;

const PREMIOS = {
    menor: 10000,
    medio: 13000,
    alto: 20000
}

const precio_letra = 2000;
const ganancia_minima = 20000;

let cartas_info = [
    {
        letra: 'A',
        precio: PREMIOS.menor,
        probabilidad: 0.4
    },
    {
        letra: 'B',
        precio: PREMIOS.medio,
        probabilidad: 0.4
    },
    {
        letra: 'C',
        precio: PREMIOS.medio,
        probabilidad: 1
    },
    {
        letra: 'D',
        precio: PREMIOS.alto,
        probabilidad:0.2
    },
    {
        letra: 'E',
        precio: PREMIOS.menor,
        probabilidad: 0.6
    },
    {
        letra: 'F',
        precio: PREMIOS.alto,
        probabilidad: 0.3
    },
    {
        letra: 'G',
        precio: PREMIOS.menor,
        probabilidad: 0.5
    },
    {
        letra: 'H',
        precio: PREMIOS.medio,
        probabilidad: 0.8
    },
    {
        letra:'I',
        precio: PREMIOS.menor,
        probabilidad: 1
    }
]


let letras_juego = null;
let juego_running = false;
let id_partida = null;

let buscando_letra = false;
let letra_elegida = "";

(async ()=> {
    const response = await Juego.find()
    if(response.length == 0) {
        new Juego({
            ganancias: 0
        }).save();
    }
})()

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
        if(userdata.saldo < precio_letra) {
            return res.status(400).send({message:'saldo_insuficiente'});
        }
        const nuevo_saldo = userdata.saldo - precio_letra;

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

function ajustarProbabilidades(ganancia_total) {
    // Calcula cuánto falta para alcanzar la ganancia mínima
    const diferencia = ganancia_minima - ganancia_total;

    // Ajusta las probabilidades basadas en la diferencia
    cartas_info = cartas_info.map(carta => {
        let nueva_probabilidad = carta.probabilidad;

        if (carta.precio === PREMIOS.alto) {
            // Disminuir la probabilidad de premios altos si la ganancia está cerca de la ganancia mínima
            nueva_probabilidad -= diferencia > 0 ? 0.05 : -0.05;
        } else if (carta.precio === PREMIOS.menor) {
            // Aumentar la probabilidad de premios menores si la ganancia está cerca de la ganancia mínima
            nueva_probabilidad += diferencia > 0 ? 0.05 : -0.05;
        } else if (carta.precio === PREMIOS.medio) {
            // Ajuste menor para premios medios
            nueva_probabilidad += diferencia > 0 ? 0.02 : -0.02;
        }

        // Limita las probabilidades entre 0 y 1
        nueva_probabilidad = Math.max(0, Math.min(1, nueva_probabilidad));

        return { ...carta, probabilidad: nueva_probabilidad };
    });
}

const generarLetras = () => {
    ajustarProbabilidades(ganancias)
    return cartas_info.map(i => ({userid:0, marcador:0, ganador:false, username:"", name: i.letra, precio: i.precio, probabilidad: i.probabilidad}))
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
    console.log("Elegir letra");
    buscando_letra = false;


    const posibilidad = Math.random() * 100;

    const cartas_precio_minimo = letras_juego.filter(j => j.precio == PREMIOS.menor);
    const cartas_precio_medio = letras_juego.filter(j => j.precio == PREMIOS.medio);
    const cartas_precio_maximo = letras_juego.filter(j => j.precio == PREMIOS.alto);

    let letra_index = null;
    let letra_el = null;

    if(ganancias < ganancia_minima) {
        if(posibilidad < 40) {
            const ind = Math.floor(Math.random() * cartas_precio_minimo.length);
            letra_el = cartas_precio_minimo[ind].name;
        } else if(posibilidad < 80) {
            const ind = Math.floor(Math.random() * cartas_precio_medio.length);
            letra_el = cartas_precio_medio[ind].name;
        } else {
            const ind = Math.floor(Math.random() * cartas_precio_maximo.length);
            letra_el = cartas_precio_maximo[ind].name;    
        }
    } else {
        if(posibilidad < 20) {
            const ind = Math.floor(Math.random() * cartas_precio_minimo.length);
            letra_el = cartas_precio_minimo[ind].name;
        } else if(posibilidad < 50) {
            const ind = Math.floor(Math.random() * cartas_precio_medio.length);
            letra_el = cartas_precio_medio[ind].name;
        } else {
            const ind = Math.floor(Math.random() * cartas_precio_maximo.length);
            letra_el = cartas_precio_maximo[ind].name;    
        }
    }
    
    const findin = letras_juego.findIndex(i => i.name == letra_el);
    if(findin != -1) {
        if(!(letras_juego[findin].precio == PREMIOS.alto && letras_juego[findin].marcador > 2 && ganancias < ganancia_minima)) {
            letra_index = findin;
        }
    }

    // Si la carta elegida es de premio alto y la ganancia mínima aún no se ha alcanzado
    /*if (cartas_info[letra_index].precio === PREMIOS.alto && ganancias < ganancia_minima) {
        // Si la carta ya ha alcanzado 2 puntos, evitar que llegue a 4 puntos para no ganar
        if (letras_juego[letra_index].marcador >= 3) {
            // Seleccionar otra letra de premio menor o medio
            letra_index = letrasPonderadas.filter(
                idx => cartas_info[idx].precio !== PREMIOS.alto || letras_juego[idx].marcador < 3
            )[Math.floor(Math.random() * letrasPonderadas.length)];
        }
    }*/

    // Sumar un punto a la letra elegida
    if(letra_index != null) {
        letras_juego[letra_index].marcador++;
        letra_elegida = letras_juego[letra_index].name;
    
        if (letras_juego[letra_index].marcador >= 4) {
            // Si la letra ha llegado a 4 puntos y puede ganar, enviamos la notificación de ganador
            letras_juego[letra_index].ganador = true;
            sendSocket('elegirletra', { letra: letra_elegida });
            sendSocket('ganador', { index: letra_index, userid: letras_juego[letra_index].userid });
    
            // Calcular la ganancia
            const suma = cartas_info.length * precio_letra;
            const ganancia = suma - letras_juego[letra_index].precio;
            ganancias += ganancia;
            console.log(`Ganancia obtenida: ${ganancia} - Total: ${ganancias}`);
    
            // Actualizar el saldo del usuario
            const user = await Usuario.findOne({ _id: letras_juego[letra_index].userid });
            if (user) {
                const nuevo_saldo = user.saldo + letras_juego[letra_index].precio;
                await Usuario.updateOne({ _id: user._id }, { saldo: nuevo_saldo });
                sendSocketToUser(user._id, "actualizardata", { saldo: nuevo_saldo });
            }
    
            setTimeout(restartGame, 5000);
        } else {
            // Enviar la letra elegida al frontend
            sendSocket('elegirletra', { letra: letra_elegida });
            setTimeout(() => buscarLetra(partida), 5000);
        }
    } else {
        setTimeout(() => buscarLetra(partida), 5000);
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