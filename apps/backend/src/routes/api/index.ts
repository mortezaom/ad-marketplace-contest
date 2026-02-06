import { Hono } from "hono"
import channels from "./channels/routes"
import health from "./health"
import serviceAccounts from "./saccounts/routes"
import users from "./users/routes"

const app = new Hono()

app.route("/health", health)

app.route("/users", users)

app.route("/saccounts", serviceAccounts)

app.route("/channels", channels)

export default app
