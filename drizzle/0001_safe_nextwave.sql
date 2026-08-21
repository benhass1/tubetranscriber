CREATE TABLE `transcript_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`videoId` varchar(32) NOT NULL,
	`title` text NOT NULL,
	`channel` varchar(255) NOT NULL,
	`thumbnailUrl` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `transcript_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `history_user_updated_idx` ON `transcript_history` (`userId`,`updatedAt`);--> statement-breakpoint
CREATE INDEX `history_user_video_idx` ON `transcript_history` (`userId`,`videoId`);