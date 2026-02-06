import { Hono } from "hono"
import { handleAuth } from "@/utils/middlewares"
import { handleGetList, handleStartFlow, handleSubmitCode, handleSubmitPassword } from "./handlers"

const app = new Hono()

app.post("/flows", handleAuth, handleStartFlow)
app.post("/flows/:flowId/code", handleAuth, handleSubmitCode)
app.post("/flows/:flowId/password", handleAuth, handleSubmitPassword)
app.get("/get-list", handleAuth, handleGetList)

export default app
