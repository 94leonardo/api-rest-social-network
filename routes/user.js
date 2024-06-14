//revisar si tenemos la authorisacion para entrar al agun de rutas
//importaciones

import { Router } from "express";

const router = Router();

import { register, testUser, login } from "../controllers/user.js";
import { ensureAuth } from '../middlewares/auth.js';

//definir las rutas
router.get("/test-user", ensureAuth, testUser);
router.post("/register", register);
router.post("/login", login);

//exportar el modulo router

export default router;
