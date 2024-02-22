import express from "express";
import v1 from "../src/routes/v1Routes";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use("/", v1);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
