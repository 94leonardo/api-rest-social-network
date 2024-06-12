const mongoose = require('mongoose');
const connection = async () => {

    try {

        await mongoose.connect("mongodb://localhost:27017/db_social_network");
        console.log('--!Base de datos conectada--¡');



    } catch (error) {
        console.log(error);
        throw new error('--!Error en la Conexion de la base de datos--¡');
    }

}

module.exports = connection;