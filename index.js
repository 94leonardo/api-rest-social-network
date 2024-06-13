// Importaciones
import connection from "./database/connection.js";
import express, { json, urlencoded } from "express";
import cors from "cors";
import UserRoutes from "./routes/user.js";
import FollowRoutes from "./routes/follow.js";
import PublicationRoutes from "./routes/publications.js";

// Mensaje de bienvenida
console.log("API NODE arriba");

// Conexión a la BD
connection();


// Crear servidor de Node
const app = express();
const puerto = 3900;
//configurar rutas

app.use('/api/user', UserRoutes);
app.use('/api/follow', FollowRoutes);
app.use('/api/publications', PublicationRoutes);

// Configurar cors: permite que las peticiones se hagan correctamente
app.use(cors());

// Conversión de datos (body a objetos JS)
app.use(json());
app.use(urlencoded({ extended: true }));

// Configurar rutas
app.get('/test-route', (req, res) => {
  return res.status(200).json(
    {
      'id': 1,
      'name': 'leonardo',
      'username': 'lasso'
    }
  );
})

// Configurar el servidor para escuchar las peticiones HTTP
app.listen(puerto, () => {
  console.log("Servidor de NODE corriendo en el puerto", puerto)
});
