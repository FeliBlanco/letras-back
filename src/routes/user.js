import { Router } from 'express';
import Usuario from '../models/user.js';
import jwt from 'jsonwebtoken'
import isLogged from '../middleware/isLogged.js';
import { MercadoPagoConfig, Preference, Payment } from 'mercadopago'
import Compra from '../models/compras.js';

const router = Router();

const generateToken = (user) => jwt.sign({ id: user._id, email: user.email }, 'feliblanco123');

const clientMP = new MercadoPagoConfig({accessToken: "TEST-2102130027432464-083020-c451f6f2832a7264546f972f96b257e3-544629529"});

router.get('/notify_compra', async (req, res) => {
    try {
        console.log(req.query)
        res.send()
    }
    catch(err) {
        res.status(503).send()
    }
})

router.post('/compra_completa', async(req, res) => {
    try {
        const {
            payment_id
        } = req.body;

        if(payment_id) {
            const pay = new Payment(clientMP);
            const response = await pay.get({id: payment_id});
            if(response) {
                if(response.status == "approved") {
                    const find_pay = await Compra.findOne({payment_id});
                    if(find_pay) {
                        res.status(403).send({message:"url_used"})
                    } else {
                        const new_pay = new Compra({
                            user: response.metadata.userid,
                            saldo: response.metadata.saldo,
                            payment_id: parseInt(payment_id)
                        }).save();
                        await Usuario.updateOne({_id: response.metadata.userid}, { $inc: { saldo: response.metadata.saldo } })
                        console.log(new_pay)
                        //console.log(response)
                        res.send("OK")
                    }
                }
            } else {
                res.status(503).send()
            }
        } else {
            res.status(503).send()
        }
    }
    catch(err) {
        console.log(err)
        res.status(503).send()
    }
})
router.post('/compra_completa', isLogged, async(req, res) => {
    try {
        const {
            payment_id
        } = req.body;

        if(payment_id) {
            const pay = new Payment(clientMP);
            const response = await pay.get({id: payment_id});
            console.log(response)
        }
        res.send()
    }
    catch(err) {
        console.log(err)
        res.status(503).send()
    }
})

router.get('/compra_saldo', async(req, res) => {
    try {
        console.log(req.query)
        console.log(req.params)
        res.send()
    }
    catch(err) {
        res.status(503).send()
    }
})

router.post('/create_preference', isLogged, async (req, res) => {
    try {
        const {
            saldo
        } = req.body;

        console.log("PREFERENCE")

        const preference = new Preference(clientMP);

        const body = {
            items: [
                {
                    title: "Saldo",
                    quantity: 1,
                    unit_price: saldo,
                    currency_id: "ARS"
                }
            ],
            back_urls: {
                success: "http://localhost:5173/cargacompleta",
                failure: "http://localhos",
                pending: "ec2-18-206-120-192.compute-1.amazonaws.com:3000/user/compra_saldo"
            },
            auto_return:"approved",
            notification_url:"http://ec2-18-206-120-192.compute-1.amazonaws.com:3000/user/notify_compra",
            metadata: {
                saldo,
                userid: req.user.id
            }
        };

        const result = await preference.create({body});
        res.send({preference: result.id});

    }
    catch(err) {
        console.log(err)
        res.status(503).send()
    }
})
router.get('/data', isLogged, async (req, res) => {
    try {
        res.send(req.user);
    }
    catch(err) {
        res.status(503).send()
    }
})

router.post('/login', async (req, res) => {
    try {
        const {
            email,
            password
        } = req.body;

        if(!email) return res.status(404).send({message: 'email is required.'})
        if(!password) return res.status(404).send({message: 'password is required.'});

        const user = await Usuario.findOne({ email });

        if(!user) {
            return res.status(400).json({ message: 'incorrect_password' });
        }

        //const isMatch = await bcrypt.compare(password, user.password);
        const isMatch = password === user.password;
        if(!isMatch) {
            return res.status(400).json({ message: 'incorrect_password' });
        }

        const token = generateToken(user);

        delete user.password

        res.json({userdata:user, token });
    }
    catch(err) {
        console.log(err)
        res.status(503).send()
    }
})

router.post('/', async (req, res) => {
    console.log(req.body)
    try {
        const {
            name: nombre,
            email,
            password
        } = req.body;
        console.log(nombre)

        if(!email) return res.status(404).send({message: 'email is required.'})
        if(!nombre) return res.status(404).send({message: 'nombre is required.'});
        if(!password) return res.status(404).send({message: 'password is required.'});

        const find_user = await Usuario.findOne({email});
        if(find_user) return res.status(404).send({message: "email is used."});

        const nuevoUsuario = new Usuario({
            nombre,
            email,
            password,
            saldo:14000
        });

        const response = await nuevoUsuario.save()

        const token = generateToken(response);

        res.json({userdata: response, token });
    }
    catch(err) {
        console.log(err)
        res.status(503).send(err)
    }
})

router.get('/', async (req, res) => {

    try {

        const result = await Usuario.find()
        res.send(result)
    }
    catch(err) {
        console.log(err)
        res.status(503).send()
    }
})

export default router;