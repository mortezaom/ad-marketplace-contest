import { Hono } from "hono"
import channels from "./channels/routes"
import health from "./health"
import users from "./users/routes"

const app = new Hono()

app.route("/health", health)

app.route("/users", users)

app.route("/channels", channels)

export default app
