import { Hono } from "hono"
import { handleAuth } from "@/utils/middlewares"
import { handleGetUserInfo, handleUserAuth } from "./handlers"

const app = new Hono()

app.post("/", handleUserAuth)

app.get("/", handleAuth, handleGetUserInfo)

export default app
