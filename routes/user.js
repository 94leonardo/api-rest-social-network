//revisar si tenemos la authorisacion para entrar al agun de rutas
//importaciones

import { Router } from "express";

const router = Router();

import {
  register,
  testUser,
  login,
  profile,
  listUser,
  updateUser,
  uploadFile,
  avatar
} from "../controllers/user.js";
import { ensureAuth } from "../middlewares/auth.js";
import multer from "multer";

//consfiguracion de subida de archivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./uploads/avatars/");
  },
  filename: (req, file, cb) => {
    cb(null, "avatar-" + Date.now() + "-" + file.originalname);
  },
});

//Middleware para subida de archivos
const uploads = multer({ storage });



//definir las rutas
router.get("/test-user", ensureAuth, testUser);
router.post("/register", register);
router.post("/login", login);
router.get("/profile/:id", ensureAuth, profile);
router.get("/list/:page?", ensureAuth, listUser);
router.put("/update", ensureAuth, updateUser);
router.post("/upload", [ensureAuth, uploads.single("file0")], uploadFile);
router.get("/avatar/:file", avatar);

//exportar el modulo router

export default router;
