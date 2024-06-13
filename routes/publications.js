//importaciones

import { Router } from "express";

const router = Router();

import { testPublication } from "../controllers/publications.js";

//definir las rutas
router.get('/test-publication', testPublication);

//exportar el modulo router

export default router;