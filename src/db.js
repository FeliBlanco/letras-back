import mongoose from 'mongoose'

const connectMongoDB = async () => {
    try {
      await mongoose.connect('mongodb://localhost:27017/letras', {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log('Conectado a MongoDB');
    } catch (error) {
      console.error('Error al conectar a MongoDB:', error);
      process.exit(1);
    }
}

export default connectMongoDB;