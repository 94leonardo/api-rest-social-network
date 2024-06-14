import jwt from 'jwt-simple';
import moment from 'moment';
import { secret } from '../services/jwt.js';

//asegurar la autenticación 

export const ensureAuth = (req, res, next) => {
    //Comprobar si llego la cabecera de authenticacion del  token

    if (!req.headers.authorization) {
        return res.status(403).send({
            status: "error",
            message: "La petición no tiene cabecera de autenticación"
        })
    }

    //Limpiar el token y quitar las comillas si las hay
    const token = req.headers.authorization.replace(/['"]+/g, '');
    //decodificar el token y comprobar si ha expirado
    try {
        //decodificar el token 
        let payload = jwt.decode(token, secret);
        //comprobar si el token ha expirado
        if (payload.exp <= moment().unix()) {
            return res.status(401).send({
                status: "error",
                message: "El token ha expirado"
            })
        }
        //agregar los datos del user
        req.user = payload;

    } catch (error) {
        return res.status(404).send({
            status: "error",
            message: "Token no valido"

        })

    }
    //pasar a la ejecucuin del sigiente metodo

    next();
}