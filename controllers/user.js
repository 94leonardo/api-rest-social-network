import status from "express/lib/response.js";
import User from "../models/user.js";
import bcrypt from "bcrypt";
import { createToken } from "../services/jwt.js";

// Acciones de prueba
export const testUser = (req, res) => {
  return res.status(200).send({
    message: "Mensaje enviado desde el controlador: user.js",
  });
};

// Registro de usuarios
export const register = async (req, res) => {
  try {
    // Recoger datos de la petición
    let params = req.body;

    // Validaciones: verificamos que los datos obligatorios estén presentes
    if (
      !params.name ||
      !params.last_name ||
      !params.email ||
      !params.password ||
      !params.nick
    ) {
      return res.status(400).json({
        status: "error",
        message: "Faltan datos por enviar",
      });
    }

    // Crear una instancia del modelo User con los datos validados
    let user_to_save = new User(params);

    // Buscar si ya existe un usuario con el mismo email o nick
    const existingUser = await User.findOne({
      $or: [
        { email: user_to_save.email.toLowerCase() },
        { nick: user_to_save.nick.toLowerCase() },
      ],
    });

    // Si encuentra un usuario, devuelve un mensaje indicando que ya existe
    if (existingUser) {
      return res.status(409).json({
        status: "Error",
        message: "-!El usuario ya existe¡",
      });
    }

    // Cifrar contraseña
    const salt = await bcrypt.genSalt(10);
    const hasedPassword = await bcrypt.hash(user_to_save.password, salt);
    user_to_save.password = hasedPassword;

    // Guardar el usuario en la base de datos
    await user_to_save.save();

    // Devolver respuesta exitosa y el usuario registrado
    return res.status(201).json({
      status: "success",
      message: "Usuario registrado con éxito",
      user: user_to_save,
    });
  } catch (error) {
    console.log("Error en registro de usuario:", error);
    return res.status(500).json({
      status: "error",
      message: "Error en registro de usuarios",
    });
  }
};
//Metodo para autenticar usuarios

export const login = async (req, res) => {
  try {
    // Recoger datos de la petición los parametros de body
    let params = req.body;
    //validar si llegaron el email y password

    if (!params.email || !params.password) {
      return res.status(400).send({
        status: "error",
        message: "Faltan datos por enviar",
      });
    }
    // Buscar usuario por email en base de datos
    const user = await User.findOne({ email: params.email.toLowerCase() });
    //si no existe el usuario devolver un error
    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "-!El usuario no existe¡",
      });
    }
    //si el password recibido es igual al de la base de datos
    const validPassword = await bcrypt.compare(params.password, user.password);
    //si los password no coincide enviar mensaje de error
    if (!validPassword) {
      return res.status(401).json({
        status: "error",
        message: "-!Contraseña incorrecta¡",
      });
    }
    //generar token de autenticacion
    const token = createToken(user);
    //devolver token creado y los datos del usuario
    return res.status(200).json({
      status: "success",
      message: "Autenticación exitosa",
      token,
      user: {
        id: user._id,
        name: user.name,
        last_name: user.last_name,
        bio: user.bio,
        nick: user.nick,
        email: user.email,
        role: user.role,
        image: user.image,
        created_at: user.created_at,
      },
    });
  } catch (error) {
    console.log("Error en el login del usuario", error);
    return res.status(500).send({
      status: "error",
      message: "Error en el login del usuario",
    });
  }
};

//metodo para mostrar el perfil de un usuario

export const profile = async (req, res) => {
  try {
    //obtener id del usuario desde los parametros de la url

    const userId = req.params.id;
    //buscar usuario de la bd exluir la contraseña, rol, version
    const user = await User.findById(userId).select('-password -role -__v')
    //verificar si el usuario existe
    if (!user) {

      return res.status(404).send({
        status: "error",
        message: "-!El usuario no encontrado¡",
      })
    }

    //devolver el usuario la informacion del perfil

    return res.status(200).json({
      status: "success",
      user
    })

  } catch (error) {
    console.log("Error al obtener el perfil del usuario;", error);
    return res.status(500).json({
      status: "error",
      message: "Error al obtener el perfil del usuario;",
    })
  }
}