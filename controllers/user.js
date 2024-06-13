// Acciones de prueba
export const testUser = (req, res) => {
    return res.status(200).send({
      message: "Mensaje enviado desde el controlador: user.js"
    });
  }
  