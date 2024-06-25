import Publication from "../models/publication.js";
import fs from "fs";
import path from "path";
import { followUserIds } from "../services/followServices.js";

// Acciones de prueba
export const testPublication = (req, res) => {
  return res.status(200).send({
    message: "Mensaje enviado desde el controlador: publications.js",
  });
};

// Método para hacer una publicación
export const savePublication = async (req, res) => {
  try {
    // Obtener datos del body
    const params = req.body;

    // Verificar que llegue desde el body el parámetro text con su información
    if (!params.text) {
      return res.status(400).send({
        status: "error",
        message: "Debes enviar el texto de la publicación",
      });
    }

    // Crear el objeto del modelo
    let newPublication = new Publication(params);

    // Agregar la información del usuario autenticado al objeto de la nueva publicación
    newPublication.user_id = req.user.userId;

    // Guardar la nueva publicación en la BD
    const publicationStored = await newPublication.save();

    // Verificar si se guardó la publicación en la BD (si existe publicationStored)
    if (!publicationStored) {
      return res.status(500).send({
        status: "error",
        message: "No se ha guardado la publicación",
      });
    }

    // Devolver respuesta exitosa
    return res.status(200).send({
      status: "success",
      message: "¡Publicación creada con éxito!",
      publicationStored,
    });
  } catch (error) {
    console.log("Error al crear la publicación:", error);
    return res.status(500).send({
      status: "error",
      message: "Error al crear la publicación",
    });
  }
};

// Método para mostrar la publicación
export const showPublication = async (req, res) => {
  try {
    // Obtener el id de la publicación de la url
    const publicationId = req.params.id;

    // Buscar la publicación por id desde la BD
    const publicationStored = await Publication.findById(
      publicationId
    ).populate("user_id", "name last_name");

    // Verificar si se encontró la publicación
    if (!publicationStored) {
      return res.status(500).send({
        status: "error",
        message: "No existe la publicación",
      });
    }

    // Devolver respuesta exitosa
    return res.status(200).send({
      status: "success",
      message: "Publicación encontrada",
      publication: publicationStored,
    });
  } catch (error) {
    console.log("Error al mostrar la publicación:", error);
    return res.status(500).send({
      status: "error",
      message: "Error al mostrar la publicación",
    });
  }
};

//metodo para eliminar una publicacion

export const deletePublication = async (req, res) => {
  try {
    // Obtener el id de la publicación de la url que quiero eliminar
    const publicationId = req.params.id;

    //encontrar y elimar la publucación

    const publicationDeleted = await Publication.findOneAndDelete({
      user_id: req.user.userId,
      _id: publicationId,
    }).populate("user_id", "name last_name");
    //verificamos si encontramos la publicacion
    if (!publicationDeleted) {
      return res.status(404).send({
        status: "error",
        message:
          "No se ha podido eliminar  o no tienes permiso para eliminar la publicación",
      });
    }

    // Devolver respuesta exitosa
    return res.status(200).send({
      status: "success",
      message: "Publiciacion eliminada con exito",
      publication: publicationDeleted,
    });
  } catch (error) {
    console.log("Error al eliminar la publicación:", error);
    return res.status(500).send({
      status: "error",
      message: "Error al eliminar la publicación",
    });
  }
};

//metodo para listar publicaciones usuario

export const PublicationsUser = async (req, res) => {
  try {
    const userId = req.params.id;
    //asignar el numero de pagina
    let page = req.params.page ? parseInt(req.params.page, 10) : 1;

    //numero de usuarios que queremos mostrar por pagina
    let itemsPerPage = req.query.limit ? parseInt(req.query.limit, 10) : 5;

    //consfigar opciones de la consulta
    const option = {
      page: page,
      limit: itemsPerPage,
      sort: { create_at: -1 },
      populate: {
        path: "user_id",
        select: "-password -role -__v -email",
      },
      lean: true,
    };

    // Buscar las publicaciones del usuario
    const publications = await Publication.paginate(
      { user_id: userId },
      options
    );

    if (!publications.docs || publications.docs.length <= 0) {
      return res.status(404).send({
        status: "error",
        message: "No hay publicaciones para mostrar",
      });
    }

    // Devolver respuesta exitosa
    return res.status(200).send({
      status: "success",
      message: "Publicaciones del usuario: ",
      publications: publications.docs,
      total: publications.totalDocs,
      pages: publications.totalPages,
      page: publications.page,
      limit: publications.limit,
    });
    // Devolver respuesta exitosa
  } catch (error) {
    console.log("Error al listar la publicación:", error);
    return res.status(500).send({
      status: "error",
      message: "Error al listar la publicación",
    });
  }
};

//metodo para subir imagenes de publicaciones

export const uploadMedia = async (req, res) => {
  try {
    // Obtener el id de la publicación de la url
    const publicationId = req.params.id;
    //COMPROBAR QUE EXISTE EL ARCHIVO comprobar que exista EN EL BODY
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
    //si todo es correcto se procede a gruarda en la base de datos
    const publicationUpdated = await Publication.findOneAndUpdate(
      { user_id: req.user.userId, _id: publicationId },
      { file: req.file.filename },
      { new: true }
    );
    if (!publicationUpdated) {
      return res.status(500).send({
        status: "error",
        message: "Error al subir el archivo",
      });
    }

    return res.status(200).send({
      status: "success",
      message: "archivo subido con exito",
      publication: publicationUpdated,
      file: req.file,
    });
  } catch {
    console.log("Error al listar la publicación:", error);
    return res.status(500).send({
      status: "error",
      message: "Error al subir la media",
    });
  }
};

// Método para mostrar el archivo subido a la publicación
export const showMedia = async (req, res) => {
  try {
    // Obtener el parámetro del archivo desde la url
    const file = req.params.file;

    // Crear el path real de la imagen
    const filePath = "./uploads/publications/" + file;

    // Comprobar si existe el archivo
    fs.stat(filePath, (error, exists) => {
      if (!exists) {
        return res.status(404).send({
          status: "error",
          message: "No existe la imagen",
        });
      }
      // Si lo encuentra nos devolvueve un archivo
      return res.sendFile(path.resolve(filePath));
    });
  } catch (error) {
    return res.status(500).send({
      status: "error",
      message: "Error al mostrar archivo en la publicación",
    });
  }
};


// Método para listar todas las publicaciones de los usuarios que yo sigo (Feed)
export const feed = async (req, res) => {
  try {
    // Asignar el número de página
    let page = req.params.page ? parseInt(req.params.page, 10) : 1;

    // Número de publicaciones que queremos mostrar por página
    let itemsPerPage = req.query.limit ? parseInt(req.query.limit, 10) : 5;

    // Verificar que el usuario autenticado existe y tiene un userId
    if (!req.user || !req.user.userId) {
      return res.status(404).send({
        status: "error",
        message: "Usuario no autenticado"
      });
    }

    // Obtener un array de IDs de los usuarios que sigue el usuario autenticado
    const myFollows = await followUserIds(req);

    // Verificar que la lista de usuarios que sigo no esté vacía
    if (!myFollows.following || myFollows.following.length === 0) {
      return res.status(404).send({
        status: "error",
        message: "No sigues a ningún usuario, no hay publicaciones que mostrar"
      });
    }

    // Configurar las options de la consulta
    const options = {
      page: page,
      limit: itemsPerPage,
      sort: { created_at: -1 },
      populate: {
        path: 'user_id',
        select: '-password -role -__v -email'
      },
      lean: true
    };

    // Consulta a la base de datos con paginate
    const result = await Publication.paginate(
      { user_id: { $in: myFollows.following } },
      options
    );

    // Verificar si se encontraron publicaciones en la BD
    if (!result.docs || result.docs.length <= 0) {
      return res.status(404).send({
        status: "error",
        message: "No hay publicaciones para mostrar"
      });
    }

    // Devolver respuesta exitosa
    return res.status(200).send({
      status: "success",
      message: "Feed de Publicaciones",
      publications: result.docs,
      total: result.totalDocs,
      pages: result.totalPages,
      page: result.page,
      limit: result.limit
    });

  } catch (error) {
    return res.status(500).send({
      status: "error",
      message: "Error al mostrar las publicaciones en el feed"
    });
  }
}