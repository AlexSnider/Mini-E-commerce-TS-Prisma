import { Router, Request, Response } from "express";
import { verifyToken } from "../../auth/jwt";
import { corsOptions } from "../../middleware/cors";
import { keycloakSession, keycloak } from "../../middleware/keycloak";
import { createUserSchema, loginUserSchema } from "../../schema/user.schema";
import { validateResource } from "../../middleware/validateResource";
import { routeRateLimit } from "../../middleware/routeRateLimit";
import { serverRateLimit } from "../../middleware/serverRateLimit";
import { registerUser, loginUser, logoutUser, findUserById } from "../controllers/UserController";
import { findUser } from "../controllers/UserController";
import { findCategories } from "../controllers/CategoryController";
import dotenv from "dotenv";
dotenv.config();

const router = Router();
router.use(serverRateLimit);

// CORS
router.use(corsOptions);

// KEYCLOAK MIDDLEWARE
router.use(keycloakSession);
router.use(keycloak.middleware());

// HEALTH CHECK
/**
 * @openapi
 * /v1/health-check:
 *  get:
 *    tags: [Health Check]
 *    description: Responds if the server is up and running
 *    responses:
 *      200:
 *        description: App is up and running!
 *      500:
 *        description: Internal server error!
 */
router.get("/v1/health-check", routeRateLimit, (req, res) => {
  res.status(200).json({ message: "OK" });
});

// ADMIN ROUTES
router.get(
  "/v1/admin/users",
  keycloak.protect("realm:administration"),
  async (Request: Request, Response: Response) => {
    await findUser(Request, Response);
  }
);

router.get(
  "/v1/admin/system-metrics",
  keycloak.protect("realm:administration"),
  async (Request: Request, Response: Response) => {
    Response.redirect(process.env.SYSTEM_METRICS);
  }
);

//MANAGER ROUTES
router.get(
  "/v1/manager/categories",
  keycloak.protect("realm:manager"),
  async (Request: Request, Response: Response) => {
    await findCategories(Request, Response);
  }
);

// USER ROUTES
// USER REGISTRATION DOCS
/**
 * @openapi
 * '/v1/register':
 *  post:
 *     tags:
 *     - User
 *     summary: Register a user
 *     requestBody:
 *      required: true
 *      content:
 *        application/json:
 *           schema:
 *              $ref: '#/components/schemas/CreateUserInput'
 *     responses:
 *      201:
 *         description: User created successfully!
 *      400:
 *         content:
 *            application/json:
 *               schema:
 *                  type: object
 *                  properties:
 *                     message:
 *                        type: string
 *                        description: Error message
 *                        example: {
 *                          "error": true,
 *                          "message": "Missing required fields!"}
 *      500:
 *         description: Internal server error!
 */
router.post(
  "/v1/register",
  routeRateLimit,
  validateResource(createUserSchema),
  async (Request: Request, Response: Response) => {
    const userData = Request.body;
    await registerUser(userData, Request, Response);
  }
);

// USER LOGIN
// USER LOGIN DOCS
/**
 * @openapi
 * '/v1/login':
 *  post:
 *     tags:
 *     - User
 *     summary: Login a user
 *     requestBody:
 *      required: true
 *      content:
 *        application/json:
 *           schema:
 *              $ref: '#/components/schemas/LoginUserInput'
 *     responses:
 *      200:
 *         description: User logged in successfully!
 *      400:
 *         content:
 *            application/json:
 *               schema:
 *                  type: object
 *                  properties:
 *                     message:
 *                        type: string
 *                        description: Error message
 *                        example: {
 *                          "error": true,
 *                          "message": "Missing required fields!"}
 *      404:
 *         description: User not found!
 *      500:
 *         description: Internal server error!
 */
router.post(
  "/v1/login",
  routeRateLimit,
  validateResource(loginUserSchema),
  async (Request: Request, Response: Response) => {
    const userData = Request.body;
    await loginUser(userData, Request, Response);
  }
);

// USER LOGOUT
// USER LOGOUT DOCS

router.post("/v1/logout", async (Request: Request, Response: Response) => {
  await logoutUser(Request, Response);
});

// USER FIND BY ID
// USER FIND BY ID DOCS
router.get("/v1/admin/users/:id", routeRateLimit, async (Request: Request, Response: Response) => {
  await findUserById(Request, Response);
});

// VERIFY TOKEN TEST ROUTE
router.get("/v1/verify", verifyToken, async (Request: Request, Response: Response) => {
  Response.clearCookie("refreshToken");
  Response.status(200).json({ message: "Token verified!" });
});

export default router;
