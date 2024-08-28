import app from "./src/app.js";
import {config} from 'dotenv'

config()

const APP_PORT = process.env.PORT;

app.listen(APP_PORT, () => console.log(`PORT: ${APP_PORT}`))