import { Hono } from "hono"
import { handleAuth } from "@/utils/middlewares"
import { handleGetUserInfo, handleSaveUserWallet, handleUserAuth } from "./handlers"

const app = new Hono()

app.post("/", handleUserAuth)

app.get("/", handleAuth, handleGetUserInfo)

app.put("/save-wallet", handleAuth, handleSaveUserWallet)

export default app
