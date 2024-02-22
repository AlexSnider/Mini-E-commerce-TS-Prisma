import { Router, Request } from "express";
import { createUser } from "../controllers/UserController";

const router = Router();

router.post("/register", async (request: Request) => {
  await createUser(request.body);
});

export default router;
