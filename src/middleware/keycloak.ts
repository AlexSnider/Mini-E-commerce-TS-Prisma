import { Router } from "express";
import session from "express-session";
import KeycloakConnect, { KeycloakConfig } from "keycloak-connect";
import dotenv from "dotenv";
dotenv.config();

const router = Router();

const keycloakSession = router.use(
  session({
    secret: process.env.KEYCLOAK_SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);

const keycloakConfig: KeycloakConfig = {
  realm: process.env.KEYCLOAK_REALM,
  resource: process.env.KEYCLOAK_RESOURCE,
  "auth-server-url": process.env.KEYCLOAK_AUTH_SERVER_URL,
  "confidential-port": process.env.KEYCLOAK_CONFIDENTIAL_PORT,
  "ssl-required": process.env.KEYCLOAK_SSL_REQUIRED,
};

const keycloak = new KeycloakConnect(
  {
    store: {
      barerOnly: false,
      memoryStore: new session.MemoryStore(),
    },
  },
  keycloakConfig
);

export { keycloakSession, keycloak };
