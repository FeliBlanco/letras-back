import { Router } from 'express';
import Usuario from '../models/user.js';
import jwt from 'jsonwebtoken'
import isLogged from '../middleware/isLogged.js';

const router = Router();

const generateToken = (user) => jwt.sign({ id: user._id, email: user.email }, 'feliblanco123');

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