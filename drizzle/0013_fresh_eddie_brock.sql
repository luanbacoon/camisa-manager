CREATE TABLE `backups` (
	`id` int AUTO_INCREMENT NOT NULL,
	`filename` varchar(255) NOT NULL,
	`description` text,
	`size` varchar(50) NOT NULL,
	`status` enum('pending','completed','failed') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`restoredAt` timestamp,
	CONSTRAINT `backups_id` PRIMARY KEY(`id`)
);
