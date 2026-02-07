import { Hono } from "hono"
import { handleDashAuth } from "@/utils/middlewares"
import { handleGetList, handleStartFlow, handleSubmitCode, handleSubmitPassword } from "./handlers"

const app = new Hono()

app.post("/flows", handleDashAuth, handleStartFlow)
app.post("/flows/:flowId/code", handleDashAuth, handleSubmitCode)
app.post("/flows/:flowId/password", handleDashAuth, handleSubmitPassword)
app.get("/get-list", handleDashAuth, handleGetList)

export default app
