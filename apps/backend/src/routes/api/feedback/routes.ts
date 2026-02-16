import { Hono } from "hono"
import { handleAuth } from "@/utils/middlewares"
import { handleSendFeedback } from "./handlers"

const feedbackRouter = new Hono()

// Send feedback for a deal (to channel owner if advertiser, to advertiser if channel owner)
feedbackRouter.post("/deal/:dealId", handleAuth, handleSendFeedback)

export default feedbackRouter
