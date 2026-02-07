import { Hono } from "hono"
import { handleAuth } from "@/utils/middlewares"
import { handleAssignToChannel, handleGetChannels, handleVerifyChannel } from "./handlers"

const app = new Hono()

app.post("/assign-to-channel", handleAuth, handleAssignToChannel)

app.post("/verify-channel", handleAuth, handleVerifyChannel)

app.get("/get-channels", handleAuth, handleGetChannels)

export default app
