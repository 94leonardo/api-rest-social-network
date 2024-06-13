//importaciones

import { Router } from "express";

const router = Router();

import { register, testUser } from "../controllers/user.js";

//definir las rutas
router.get("/test-user", testUser);
router.post("/register", register);

//exportar el modulo router

export default router;
