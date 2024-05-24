import { object, string, TypeOf } from "zod";

// USER REGISTRATION DOCS
/**
 * @openapi
 * components:
 *  schemas:
 *    CreateUserInput:
 *      type: object
 *      required:
 *        - username
 *        - password
 *        - email
 *      properties:
 *        username:
 *          type: string
 *          default: John Doe
 *        password:
 *          type: string
 *          default: P4ssw0rd
 *        email:
 *          type: string
 *          default: 0Lh9x@example.com
 *      createUserResponse:
 *        type: object
 *        properties:
 *          id:
 *            type: string
 *          username:
 *            type: string
 *          email:
 *            type: string
 *          password:
 *            type: string
 *          resetPasswordToken:
 *            type: string
 *          createdAt:
 *            type: string
 *          updatedAt:
 *            type: string
 */
export const createUserSchema = object({
  body: object({
    username: string({
      required_error: "Name is required",
    }).min(3, "Name too short - should be 3 chars minimum."),
    password: string({
      required_error: "Password is required",
    }).min(3, "Password too short - should be 3 chars minimum."),
    email: string({
      required_error: "Email is required",
    }).email("Not a valid email"),
  }),
});

// USER LOGIN DOCS
/**
 * @openapi
 * components:
 *  schemas:
 *    LoginUserInput:
 *      type: object
 *      required:
 *        - username
 *        - password
 *      properties:
 *        username:
 *          type: string
 *          default: John Doe
 *        password:
 *          type: string
 *          default: P4ssw0rd
 *      loginUserResponse:
 *        type: object
 *        properties:
 *          id:
 *            type: string
 *          username:
 *            type: string
 *          password:
 *            type: string
 */
export const loginUserSchema = object({
  body: object({
    username: string({
      required_error: "Name is required",
    }).min(3, "Name too short - should be 3 chars minimum."),
    password: string({
      required_error: "Password is required",
    }).min(3, "Password too short - should be 3 chars minimum."),
  }),
});

// USER LOGOUT DOCS
/**
 * @openapi
 * components:
 *  schemas:
 *    LogoutUserInput:
 *      type: object
 *      required:
 *        - access_token
 *        - refresh_token
 *      properties:
 *        access_token:
 *          type: string
 *          default: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
 *        refresh_token:
 *          type: string
 *          default: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
 *      logoutUserResponse:
 *        type: object
 *        properties:
 *          message:
 *            type: string
 *            default: "User logged out successfully!"
 *            description: "Logout message"
 */
export const logoutUserSchema = object({
  body: object({
    access_token: string({
      required_error: "Access token is required",
    }),
    refresh_token: string({
      required_error: "Refresh token is required",
    }),
  }),
});

export type CreateUserInput = TypeOf<typeof createUserSchema>["body"];
export type LoginUserInput = TypeOf<typeof loginUserSchema>["body"];
