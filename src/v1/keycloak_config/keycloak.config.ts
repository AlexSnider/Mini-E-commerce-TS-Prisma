import KeycloakConnect from "keycloak-connect";

const keycloak = new KeycloakConnect({
  store: {
    barerOnly: false,
  },
});

export default keycloak;
