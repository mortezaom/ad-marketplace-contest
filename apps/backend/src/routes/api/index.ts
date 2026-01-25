import { Hono } from "hono"
import health from "./health"
import users from "./users"

const app = new Hono().route("/health", health).route("/users", users)

export default app
