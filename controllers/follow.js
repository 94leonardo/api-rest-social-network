import Follow from "../models/follow.js";
import User from "../models/user.js";

// Acciones de prueba
export const testFollow = (req, res) => {
  return res.status(200).send({
    message: "Mensaje enviado desde el controlador: follow.js",
  });
};

// Método para guardar un follow (seguir a otro usuario)
export const saveFollow = async (req, res) => {
  try {
    // Obtener datos del body
    const { followed_user } = req.body;

    // Obtener el id del usuario autenticado (login) desde el token
    const identity = req.user;

    // Verificar si "identity" contiene la información del usuario autenticado
    if (!identity || !identity.userId) {
      return res.status(400).send({
        status: "error",
        message: "No se ha proporcionado el usuario para realizar el following",
      });
    }

    // Verificar si el usuario está intentando seguirse a sí mismo
    if (identity.userId === followed_user) {
      return res.status(400).send({
        status: "error",
        message: "No puedes seguirte a ti mismo",
      });
    }

    // Verificar si el usuario a seguir existe
    const followedUser = await User.findById(followed_user);
    if (!followedUser) {
      return res.status(404).send({
        status: "error",
        message: "El usuario que intentas seguir no existe",
      });
    }

    // Verificar si ya existe un seguimiento con los mismos usuarios
    const existingFollow = await Follow.findOne({
      following_user: identity.userId,
      followed_user: followed_user,
    });

    if (existingFollow) {
      return res.status(400).send({
        status: "error",
        message: "Ya estás siguiendo a este usuario.",
      });
    }

    // Crear el objeto con modelo follow
    const newFollow = new Follow({
      following_user: identity.userId,
      followed_user: followed_user,
    });

    // Guardar objeto en la BD
    const followStored = await newFollow.save();

    // Verificar si se guardó correctamente en la BD
    if (!followStored) {
      return res.status(500).send({
        status: "error",
        message: "No se ha podido seguir al usuario.",
      });
    }

    // Obtener el nombre y apellido del usuario seguido
    const followedUserDetails = await User.findById(followed_user).select(
      "name last_name"
    );

    if (!followedUserDetails) {
      return res.status(404).send({
        status: "error",
        message: "Usuario seguido no encontrado",
      });
    }

    // Combinar datos de follow y followedUser
    const combinedFollowData = {
      ...followStored.toObject(),
      followedUser: {
        name: followedUserDetails.name,
        last_name: followedUserDetails.last_name,
      },
    };

    // Devolver respuesta
    return res.status(200).json({
      status: "success",
      identity: req.user,
      follow: combinedFollowData,
    });
  } catch (error) {
    if (error.code === 11000) {
      // Error de índice único duplicado
      return res.status(400).json({
        status: "error",
        message: "Ya estás siguiendo a este usuario.",
      });
    }
    return res.status(500).json({
      status: "error",
      message: "Error al seguir al usuario.",
    });
  }
};

// Método para eliminar un follow (dejar de seguir)

export const unfollow = async (req, res) => {
  try {
    //obtener id del usuario identificado
    const userId = req.user.userId;
    //obtener id del usuario a dejar de seguir
    const followed_user = req.params.id;
    //busqueda de las coincidencias del ambos usuarios y eliminar
    const followDeleted = await Follow.findOneAndDelete({
      following_user: userId, //quien realisa el segimiento
      followed_user: followed_user, //a quien se quiere dejar de segir
    });

    //varificar si se encontró el documento o lo elimino
    if (!followDeleted) {
      return res.status(404).send({
        status: "error",
        message: "El usuario que intentas dejar de seguir no existe",
      });
    }
    //devolver respuesta
    return res.status(200).send({
      status: "success",
      message: `Dejaste de seguir al usuario ${followed_user}`,
    });
  } catch (error) {
    return res.status(500).send({
      status: "error",
      message: "Error al dejar de seguir al usuario.",
    });
  }
};

// Método para listar usuarios que estoy siguiendo

export const following = async (req, res) => {
  try {
    //obtener id del usuario identificado
    let userId = req.user && req.user.userId ? req.user.userId : undefined;
    //comprobar si llega el ID por parametros en la urk (este es prioritario)
    if (req.params.id) page = req.params.id;

    //asignar el numero de pagina
    let page = req.params.page ? parseInt(req.params.page, 10) : 1;

    //numero de usuarios que queremos mostrar por pagina
    let itemsPerPage = req.query.limit ? parseInt(req.query.limit, 10) : 5;

    //configurar las opciones de la consulta
    const options = {
      page: page,
      limit: itemsPerPage,
      select: "-password -role -__v",
      populate: {
        path: 'followed_user',
        select: '-password -role -__v'
      },
      lean: true
    }

    //buscar en la base de datos los usuarios que me siguen
    const follows = await Follow.paginate({ following_user: userId }, options);

    //devolver resouesta
    return res.status(200).send({
      status: "success",
      message: "listado de usuarios que yo sigo",
      follows: follows.docs,
      total: follows.totalDocs,
      pages: follows.totalPages,
      page: follows.page,
      limit: follows.limit
    });
  } catch (error) {
    return res.status(500).send({
      status: "error",
      message: "Error al listar los usuarios que estas siguiendo.",
    });
  }
};

// Método para listar los usuarios que me siguen
