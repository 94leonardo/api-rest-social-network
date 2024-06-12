//importaciones
const connection = require('./database/connection');
const express = require('express');
const cors = require('cors');
// mensaje de bienvenida
console.log("---!Bienvenido Api node arriba--¡");
//conexion a la base de datos
connection();

//crear servidor de node

const app = express();
const puerto = 3900;

//configuracion de los  cors las peticiones se hagan bien en las rutas de los diferentes dominios

app.use(cors());

//Convercion de datos (body a objetos JS)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
//configuracion de las rutas de las peticiones http login y signup

app.get('/test-rout', (req, res) => {
    return res.status(200).json({
        'id': 1,
        'name': 'leonardo',
        'username': 'leo'
    })
})


//Configuracion el servidor para escuchar las peticiones http

app.listen(puerto, () => {
    console.log(`Escuchando en el puerto ${puerto}`);
})