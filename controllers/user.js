import Follow from "../models/follow.js";
import User from "../models/user.js";
import Publication from "../models/publication.js";
import bcrypt from "bcrypt";
import { createToken } from "../services/jwt.js";
import fs from "fs";
import path from "path";
import { followThisUser, followUserIds } from "../services/followServices.js";

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
      status: "create",
      message: "Usuario registrado con éxito",
      user: {
        id: user_to_save.id,
        name: user_to_save.name,
        last_name: user_to_save.last_name,
        nick: user_to_save.nick,
      }
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

// Método para mostrar el perfil del usuario
export const profile = async (req, res) => {
  try {
    // Obtener el ID del usuario desde los parámetros de la URL
    const userId = req.params.id;

    // Verificar si el ID recibido del usuario autenticado existe
    if (!req.user || !req.user.userId) {
      return res.status(404).send({
        status: "error",
        message: "Usuario no autenticado",
      });
    }

    // Buscar al usuario en la BD, excluimos la contraseña, rol, versión.
    const userProfile = await User.findById(userId).select(
      "-password -role -__v -email"
    );

    // Verificar si el usuario existe
    if (!userProfile) {
      return res.status(404).send({
        status: "error",
        message: "Usuario no encontrado",
      });
    }

    // Información de seguimiento - (req.user.userId = Id del usuario autenticado)
    const followInfo = await followThisUser(req.user.userId, userId);

    // Devolver la información del perfil del usuario
    return res.status(200).json({
      status: "success",
      user: userProfile,
      followInfo,
    });
  } catch (error) {
    console.log("Error al botener el perfil del usuario:", error);
    return res.status(500).send({
      status: "error",
      message: "Error al obtener el perfil del usuario",
    });
  }
};

//metodo para listar usuarios con pagination

export const listUser = async (req, res) => {
  try {
    //control en que pagina estamos y que numero de items por pagina
    let page = req.params.page ? parseInt(req.params.page, 10) : 1;
    let itemsPerPage = req.query.limit ? parseInt(req.query.limit, 10) : 5;

    //Realizar la consulta a la paginada de mongo
    const options = {
      page: page,
      limit: itemsPerPage,
      select: "-password -role -__v -email",
    };

    const users = await User.paginate({}, options);
    //si no hay usuarios  en la pagina solicitada
    if (!users || users.docs.length === 0) {
      return res.status(404).send({
        status: "error",
        message: " No hay usuarios en la pagina solicitada",
      });
    }
    //listar los seguidores de un usuario, obtener el array de ids de los usuarios que sigo

    let followUsers = await followUserIds(req);
    //devolver los usuarios paginados

    return res.status(200).json({
      status: "success",
      users: users.docs,
      totalPages: users.totalPages,
      totalDocs: users.totalDocs,
      page: users.page,
      pagingCounter: users.pagingCounter,
      hasPrevPage: users.hasPrevPage,
      hasNextPage: users.hasNextPage,
      prevPage: users.prevPage,
      nextPage: users.nextPage,
      users_following: followUsers.following,
      users_followers_me: followUsers.followers,
    });
  } catch (error) {
    console.log("Error al obtener el listado del usuario;", error);
    return res.status(500).send({
      status: "error",
      message: "Error al obtener lista de usuarios",
    });
  }
};

//Método para actualizar usuarios

export const updateUser = async (req, res) => {
  try {
    //Recoqer la información del usuario a actualizar

    let userIdentity = req.user;
    let userToUpdate = req.body;
    // validar que los datos estém presentes

    if (!userToUpdate.email || !userToUpdate.nick) {
      return res.status(400).send({
        status: "Error",
        message: "!Los datos email y nick Son requeridos!",
      });
    }

    //Eliminarcampos sobrantes que no se actualizaron

    delete userToUpdate.iat;
    delete userToUpdate.exp;
    delete userToUpdate.role;
    delete userToUpdate.image;

    //comprobar si el usuario ya existe

    const users = await User.find({
      //$or -> realizar consulta que consulta con una de estas condicones
      $or: [
        { email: userToUpdate.email.toLowerCase() },
        { nick: userToUpdate.nick.toLowerCase() },
      ],
    }).exec();

    //verificación si el usuario esta duplicado y evitar conflicto

    const isDuplicateUser = users.some((user) => {
      return user && user._id.toString() !== userIdentity.userId;
    });

    if (isDuplicateUser) {
      return res.status(400).send({
        status: "error",
        message: "!Solo se puede modificar los datos del usuario logeado.!",
      });
    }
    //cifrar la contraseña enviada
    if (userToUpdate.password) {
      try {
        let pwd = await bcrypt.hash(userToUpdate.password, 10);
        userToUpdate.password = pwd;
      } catch (hashError) {
        return res.status(500).send({
          status: "error",
          message: "Error al cifrar la contraseña",
        });
      }
    } else {
      delete userToUpdate.password;
    }

    //buscar ctualizar el usuario modificado a modificar en la base de datos

    let userUpdated = await user.findByIdAndUpdate(
      userIdentity.userId,
      userToUpdate,
      {
        new: true,
      }
    );
    if (!userUpdated) {
      return res.status(400).send({
        status: "Error",
        message: "Error No se pudo actualizar el usuario",
      });
    }
    //Devolver respuesta exitosa con el usuario actualizado
    return res.status(200).json({
      status: "success",
      message: "usuario actualizar correctamente",
      user: userUpdated,
    });
  } catch (error) {
    console.log("Error al actualizar los datos de usuario", error);
    return res.status(500).send({
      status: "error",
      message: "Error al actualizar los datos de usuario",
    });
  }
};
//método para subir imagen de perfil(Avatar -img de perfil)

export const uploadFile = async (req, res) => {
  try {
    //recoger el archivo de imagen y comprobar que exista
    if (!req.file) {
      return res.status(404).send({
        status: "error",
        message: "la peticion no incluye la imagen",
      });
    }
    //consegir el nombre del archivo
    let image = req.file.originalname;

    //obtener la extencion del archivo
    const imageSplit = image.split(".");
    const extension = imageSplit[imageSplit.length - 1];

    //validar la extencion
    if (!["png", "jpg", "jpge", "gif"].includes(extension.toLowerCase())) {
      //Borrar archivos subidos
      const filePath = req.file.path;
      fs.unlinkSync(filePath);
      return res.status(400).send({
        status: "error",
        message: "la extensión no es valida",
      });
    }
    //comprobar  tamaño del archivo(pj:maximo 1mb)

    const fileSize = req.file.size;
    const maxFileSize = 1 * 1024 * 1024; // 5MB
    if (fileSize > maxFileSize) {
      const filePath = req.file.path;
      fs.unlinkSync(filePath);
      return res.status(400).send({
        status: "error",
        message: "El Tamaño del archivo excede el limite (max 1mb)",
      });
    }

    //Guarda la imagen en la bd

    const userUpdated = await User.findByIdAndUpdate(
      { _id: req.user.userId },
      { image: req.file.filename },
      { new: true }
    );
    //verificacion si la actualizacion fue exitosa
    if (!userUpdated) {
      return res.status(400).send({
        status: "error",
        message: "Error al subir la imagen",
      });
    }

    //devolver respuesta exitosa
    return res.status(200).json({
      status: "success",
      user: userUpdated,
      file: req.file,
    });
  } catch (error) {
    console.log("Error al subir los archivos", error);
    return res.status(500).send({
      status: "error",
      message: "Error al subir archivos",
    });
  }
};
//Metodo de la imagen del perfil de (avatar)

export const avatar = async (req, res) => {
  try {
    //Obtener el parametro de la url de la imagen
    const file = req.params.file;
    //Obtener el path real de la imagen
    const filePath = "./uploads/avatars/" + file;
    //Comprobar si la imagen existe
    fs.stat(filePath, (error, exists) => {
      if (!exists) {
        return res.status(404).send({
          status: "error",
          message: "La imagen no existe",
        });
      }
      //devolver el archivo
      return res.sendFile(path.resolve(filePath));
    });
  } catch (error) {
    console.log("Error al mostrar imagen ", error);
    return res.status(500).send({
      status: "error",
      message: "Error al mostrar Avater",
    });
  }
};

// Método para mostrar el contador de seguidores
export const counters = async (req, res) => {
  try {
    // Obtener el id del usuarios autenticado desde el token
    let userId = req.user.userId;

    // En caso de llegar el id del usuario en los parametros (por la url) se toma como prioritario
    if (req.params.id) {
      userId = req.params.id;
    }

    // Buscar el usuario por su userId para obtener nombre y apellido
    const user = await User.findById(userId, { name: 1, last_name: 1 });

    // Si no encuentra al usuario
    if (!user) {
      return res.status(404).send({
        status: "error",
        message: "Usuario no encontrado",
      });
    }

    // Contar el número de usuarios que yo sigo (o el usuario autenticado)
    const followingCount = await Follow.countDocuments({
      following_user: userId,
    });

    // Contar el número de usuarios que me siguen a mi (o al usuario autenticado)
    const followedCount = await Follow.countDocuments({
      followed_user: userId,
    });

    // Contar el número de publicaciones que ha realizado el usuario
    const publicationsCount = await Publication.countDocuments({
      user_id: userId,
    });

    // Devolver respuesta exitosa
    return res.status(200).json({
      status: "success",
      userId,
      name: user.name,
      last_name: user.last_name,
      following: followingCount,
      followed: followedCount,
      publications: publicationsCount,
    });
  } catch (error) {
    return res.status(500).send({
      status: "error",
      message: "Error en los contadores",
    });
  }
};
