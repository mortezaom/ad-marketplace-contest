import { Hono } from "hono"
import { handleAuth } from "@/utils/middlewares"
import {
	handleGetChannelOwnerForDeal,
	handleGetDealById,
	handleGetDealPayment,
	handleGetDeals,
	handleGetPaymentWallet,
	handleSubmitTransactionStatus,
} from "./handlers"

const dealsRouter = new Hono()

dealsRouter.get("/", handleAuth, handleGetDeals)

dealsRouter.get("/:id", handleAuth, handleGetDealById)

dealsRouter.get("/:id/channel-owner", handleAuth, handleGetChannelOwnerForDeal)

dealsRouter.post("/:id/submit-transaction", handleAuth, handleSubmitTransactionStatus)

dealsRouter.post("/:id/get-payment-wallet", handleAuth, handleGetPaymentWallet)

dealsRouter.get("/:id/get-payment", handleAuth, handleGetDealPayment)

export default dealsRouter
