CREATE TABLE `dashboard_card_positions` (
	`user_id` text NOT NULL,
	`project_id` text NOT NULL,
	`card_id` text NOT NULL,
	`position` integer NOT NULL,
	PRIMARY KEY(`user_id`, `project_id`, `card_id`),
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `dashboard_card_positions_project_idx` ON `dashboard_card_positions` (`project_id`);
