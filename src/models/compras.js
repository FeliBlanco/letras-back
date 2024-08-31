import mongoose from 'mongoose'

const compraSchema = new mongoose.Schema({
    user: {
        type: mongoose.Types.ObjectId,
        required: true
    },
    payment_id: {
        type: Number,
        required:true
    },
    saldo: {
        type: Number,
        required:true
    }
});

const Compra = mongoose.model('Compra', compraSchema);

export default Compra;