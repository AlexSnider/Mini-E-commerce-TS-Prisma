import express from "express";
import cookieParser from "cookie-parser";
import v1 from "../src/v1/routes/v1Routes";
import swaggerDocs from "../src/utils/docs/swagger";

const app = express();
const PORT = process.env.PORT;

app.use(express.json());
app.use(cookieParser());
app.use("/", v1);

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);

  swaggerDocs(app, PORT);
  console.log(`Docs available at http://localhost:${PORT}/api-docs`);
});
