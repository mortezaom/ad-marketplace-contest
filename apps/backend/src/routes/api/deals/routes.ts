import { Hono } from "hono"
import { handleAuth } from "@/utils/middlewares"
import {
	handleGetChannelOwnerForDeal,
	handleGetDealById,
	handleGetDeals,
	handleUpdateDeal,
} from "./handlers"

const dealsRouter = new Hono()

dealsRouter.get("/", handleAuth, handleGetDeals)
dealsRouter.get("/:id", handleAuth, handleGetDealById)
dealsRouter.patch("/:id", handleAuth, handleUpdateDeal)
dealsRouter.get("/:id/channel-owner", handleAuth, handleGetChannelOwnerForDeal)

export default dealsRouter
