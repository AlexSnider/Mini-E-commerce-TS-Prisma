import { Router } from "express";
import cors from "cors";

const router = Router();

const corsOptions = router.use(
  cors({
    origin: "*",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);

export { corsOptions };
