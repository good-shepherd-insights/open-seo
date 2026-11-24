CREATE TABLE "dashboard_card_positions" (
	"user_id" text NOT NULL,
	"project_id" text NOT NULL,
	"card_id" text NOT NULL,
	"position" integer NOT NULL,
	CONSTRAINT "dashboard_card_positions_user_id_project_id_card_id_pk" PRIMARY KEY("user_id","project_id","card_id")
);
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "agent_id" text;--> statement-breakpoint
ALTER TABLE "dashboard_card_positions" ADD CONSTRAINT "dashboard_card_positions_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard_card_positions" ADD CONSTRAINT "dashboard_card_positions_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "dashboard_card_positions_project_idx" ON "dashboard_card_positions" USING btree ("project_id");