import { Router, Request, Response } from "express";
import { registerUser, loginUser } from "../controllers/UserController";
import { findUser } from "../controllers/AdminController";
import { findCategories } from "../controllers/ManagerController";
import { verifyToken } from "../../auth/jwt";
import keycloak from "../../keycloak_config/keycloak.config";
import session from "express-session";
import dotenv from "dotenv";
dotenv.config();

const router = Router();

// SESSION
router.use(
  session({
    secret: process.env.KEYCLOAK_SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);
// KEYCLOAK MIDDLEWARE
router.use(keycloak.middleware());

// ADMIN ROUTES
router.get(
  "/v1/admin/find-all-users",
  keycloak.protect(),
  async (Request: Request, Response: Response) => {
    await findUser(Request, Response);
  }
);
router.get(
  "/v1/admin/system-metrics",
  keycloak.protect(),
  async (Request: Request, Response: Response) => {
    Response.redirect(process.env.SYSTEM_METRICS);
  }
);

//MANAGER ROUTES
router.get(
  "/v1/manager/find-all-categories",
  keycloak.protect(),
  async (Request: Request, Response: Response) => {
    await findCategories(Request, Response);
  }
);

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
router.get(
  "/v1/verify",
  keycloak.protect(),
  verifyToken,
  async (Request: Request, Response: Response) => {
    Response.clearCookie("refreshToken");
    Response.status(200).json({ message: "Token verified!" });
  }
);

export default router;
