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
    //fecha de creacion
    iat: moment().unix(),
    //fecha de expiracion
    exp: moment().add(30, "days").unix(),
  };
  //devolver token creado
  return jwt.encode(payload, secret);
};

export { secret, createToken };
