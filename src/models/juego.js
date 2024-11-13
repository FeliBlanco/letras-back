import mongoose from 'mongoose'

// Definir el esquema de usuario
const juegoSchema = new mongoose.Schema({
    ganancias: {
        type: Number
    }
});

// Crear el modelo de usuario
const Juego = mongoose.model('Juego', juegoSchema);

export default Juego;