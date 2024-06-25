//importaciones

import { Router } from "express";

const router = Router();

import {
  testPublication,
  savePublication,
  showPublication,
  deletePublication,
  PublicationsUser,
  uploadMedia,
  showMedia,
  feed
} from "../controllers/publications.js";
import { ensureAuth } from "../middlewares/auth.js";
import multer from "multer";

//consfiguracion de subida de archivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./uploads/publications/");
  },
  filename: (req, file, cb) => {
    cb(null, "pub-" + Date.now() + "-" + file.originalname);
  },
});

//Middleware para subida de archivos
const uploads = multer({ storage });

//definir las rutas
router.get("/test-publication", ensureAuth, testPublication);
router.post("/new-publication", ensureAuth, savePublication);
router.get("/show-publication/:id", ensureAuth, showPublication);
router.delete("/delete-publication/:id", ensureAuth, deletePublication);
router.get("/publication-user/:id/:page?", ensureAuth, PublicationsUser);
router.post("/upload-media/:id", [ensureAuth, uploads.single("file0")], uploadMedia);
router.get("/media/:file", showMedia);
router.get("/feed/:page?", ensureAuth, feed);


//exportar el modulo router

export default router;
