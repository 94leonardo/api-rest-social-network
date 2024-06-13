//importaciones

import { Router } from "express";

const router = Router();

import { testUser } from "../controllers/user.js";

//definir las rutas
router.get('/test-user', testUser);

//exportar el modulo router

export default router;