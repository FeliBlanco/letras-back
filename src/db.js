import mongoose from 'mongoose'

const connectMongoDB = async () => {
  console.log(process.env.DB_URL)
    try {
      await mongoose.connect(process.env.DB_URL, {
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