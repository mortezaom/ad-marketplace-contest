import { Hono } from "hono"
import { handleAuth } from "@/utils/middlewares"
import {
	handleCreateCreative,
	handleGetCreativeById,
	handleGetCreativesByDeal,
	handleUpdateCreative,
} from "./handlers"

const creativesRouter = new Hono()

// Get all creatives for a deal
creativesRouter.get("/deal/:dealId", handleAuth, handleGetCreativesByDeal)

// Get a specific creative
creativesRouter.get("/:id", handleAuth, handleGetCreativeById)

// Create a new creative for a deal
creativesRouter.post("/deal/:dealId", handleAuth, handleCreateCreative)

// Update a creative
creativesRouter.patch("/:id", handleAuth, handleUpdateCreative)

export default creativesRouter
