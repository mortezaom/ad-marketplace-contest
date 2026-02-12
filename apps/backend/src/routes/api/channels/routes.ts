import { Hono } from "hono"
import { handleAuth } from "@/utils/middlewares"
import {
	handleAddAdmin,
	handleChannelPhotoByUsername,
	handleDemoteAdmin,
	handleGetChannelAdmins,
	handleGetChannelById,
	handleGetChannelPhoto,
	handleGetChannels,
	handleVerifyChannel,
	hangleAgentForChannel,
} from "./handlers"

const app = new Hono()

app.post("/agent-for-channel", handleAuth, hangleAgentForChannel)

app.post("/verify-channel", handleAuth, handleVerifyChannel)

app.get("/get-channels", handleAuth, handleGetChannels)

app.get("/photo/:token", handleAuth, handleGetChannelPhoto)

app.get("/channel-photo/:username", handleChannelPhotoByUsername)

app.get("/:id", handleAuth, handleGetChannelById)

app.get("/:id/admins", handleAuth, handleGetChannelAdmins)

app.post("/:id/admins", handleAuth, handleAddAdmin)

app.delete("/:id/admins/:adminId", handleAuth, handleDemoteAdmin)

export default app
