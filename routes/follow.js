//importaciones

import { Router } from "express";

const router = Router();

import { testFollow } from "../controllers/follow.js";

//definir las rutas
router.get('/test-Follow', testFollow);

//exportar el modulo router

export default router;