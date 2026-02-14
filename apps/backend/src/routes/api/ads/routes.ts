import { Hono } from "hono"
import { handleAuth } from "@/utils/middlewares"
import {
	handleApplyToAdRequest,
	handleCreateAdRequest,
	handleDeleteAdRequest,
	handleGetAdRequestApplications,
	handleGetAdRequestById,
	handleGetAdRequests,
	handleGetMyAdRequests,
	handleUpdateAdRequest,
	handleUpdateApplicationStatus,
} from "./handlers"

const app = new Hono()

// Create new ad request
app.post("/", handleAuth, handleCreateAdRequest)

// Get all open ad requests (for channel owners)
app.get("/", handleAuth, handleGetAdRequests)

// Get advertiser's own ad requests
app.get("/my-ads", handleAuth, handleGetMyAdRequests)

// Get single ad request
app.get("/:id", handleAuth, handleGetAdRequestById)

// Update ad request
app.put("/:id", handleAuth, handleUpdateAdRequest)

// Delete ad request
app.delete("/:id", handleAuth, handleDeleteAdRequest)

// Apply to ad request
app.post("/:id/apply", handleAuth, handleApplyToAdRequest)

// Get applications for ad request
app.get("/:id/applications", handleAuth, handleGetAdRequestApplications)

// Update application status (accept/reject)
app.post("/:id/applications/:applicationId", handleAuth, handleUpdateApplicationStatus)

export default app
