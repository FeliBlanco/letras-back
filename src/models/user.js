import mongoose from 'mongoose'

// Definir el esquema de usuario
const usuarioSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  saldo: {
    type: Number,
    default:0
  }
});

// Crear el modelo de usuario
const Usuario = mongoose.model('Usuario', usuarioSchema);

export default Usuario;