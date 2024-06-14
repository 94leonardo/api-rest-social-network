//logica para crear un token
//importar dependencias
import jwt from "jwt-simple";
import moment from "moment";

//clave secreta
const secret = "clave_secreta_key";

// metodo para generar el token

const createToken = (user) => {
  const payload = {
    userId: user._id,
    role: user.role,
    name: user.name,
    iat: moment().unix(), //fecha de creacion
    exp: moment().add(30, "days").unix(), //fecha de expiracion
  };
  //devolver token creado
  return jwt.encode(payload, secret);
};

export { secret, createToken };
