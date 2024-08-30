import jwt from 'jsonwebtoken';
import Usuario from '../models/user.js';

const isLogged = async (req, res, next) => {
    if(!req.header('Authorization')) return res.status(401).json({ message: 'no_token' });
    const token = req.header('Authorization').replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({ message: 'no_token' });
    }

    try {
        const decoded = jwt.verify(token, 'feliblanco123');
        const userdata = await Usuario.findOne({_id: decoded.id}).lean().exec();
        if(userdata) {
            req.token = token;
            req.user = userdata;
            req.user.id = userdata._id.toString();
            next();
        } else {
            res.status(503).send({message: 'user_not_found'})
        }
    } catch (error) {
        console.log(error)
        res.status(403).json({ message: 'invalid_token' });
    }
};

export default isLogged