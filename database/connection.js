import { connect } from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const connection = async () => {
  try {
    // Conexión a mongo atlas await connect("mongodb+srv://lassoleonardo56:HCXqZn3xEDrqPCQ6@redsocial.aijrviy.mongodb.net/bd_socialnet?retryWrites=true&w=majority");
    await connect(process.env.MONGODB_URI);
    console.log("Conectado correctamente a la BD: db_social_network");
  } catch (error) {
    console.log(error);
    throw new Error("¡No se ha podido conectar a la base de datos!");
  }
};

export default connection;
