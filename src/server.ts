import express from "express";
import cookieParser from "cookie-parser";
import v1 from "../src/v1/routes/v1Routes";

const app = express();
const PORT = process.env.PORT || 3006;

app.use(express.json());
app.use(cookieParser());
app.use("/", v1);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
