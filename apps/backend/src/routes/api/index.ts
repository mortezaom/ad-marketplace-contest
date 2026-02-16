import { Hono } from "hono"
import ads from "./ads/routes"
import channels from "./channels/routes"
import creatives from "./creatives/routes"
import deals from "./deals/routes"
import feedback from "./feedback/routes"
import health from "./health"
import serviceAccounts from "./saccounts/routes"
import users from "./users/routes"

const app = new Hono()

app.route("/health", health)

app.route("/users", users)

app.route("/saccounts", serviceAccounts)

app.route("/channels", channels)

app.route("/ads", ads)

app.route("/deals", deals)

app.route("/creatives", creatives)

app.route("/feedback", feedback)

export default app
