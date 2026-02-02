CREATE TABLE "users" (
	"id" integer PRIMARY KEY NOT NULL,
	"first_name" varchar NOT NULL,
	"last_name" varchar DEFAULT '',
	"photo_url" varchar DEFAULT '',
	"username" varchar,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
