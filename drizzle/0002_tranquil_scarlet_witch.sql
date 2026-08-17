CREATE TABLE "download_history" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"url" text NOT NULL,
	"title" text DEFAULT '' NOT NULL,
	"thumbnail" text,
	"platform" text DEFAULT '' NOT NULL,
	"format_label" text DEFAULT '' NOT NULL,
	"format_id" text DEFAULT '' NOT NULL,
	"file_size_bytes" bigint,
	"duration_seconds" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rate_limit_log" (
	"id" text PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"endpoint" text NOT NULL,
	"window_start" timestamp NOT NULL,
	"count" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "download_history" ADD CONSTRAINT "download_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;