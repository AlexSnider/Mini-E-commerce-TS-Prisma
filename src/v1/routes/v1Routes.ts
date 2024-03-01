import { Router, Request, Response } from "express";
import { registerUser, loginUser } from "../controllers/UserController";
import { verifyToken } from "../../auth/jwt";

const router = Router();

// USER ROUTES
router.post("/v1/register", async (Request: Request, Response: Response) => {
  const userData = Request.body;
  await registerUser(userData, Request, Response);
});

router.post("/v1/login", async (Request: Request, Response: Response) => {
  const userData = Request.body;
  await loginUser(userData, Request, Response);
});

// VERIFY TOKEN TEST ROUTE
router.get("/v1/verify", verifyToken, async (Request: Request, Response: Response) => {
  Response.status(200).json({ message: "Token verified!" });
});

export default router;
