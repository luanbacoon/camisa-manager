CREATE TABLE `product_gallery` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`imageUrl` text NOT NULL,
	`type` varchar(50) NOT NULL,
	`position` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `product_gallery_id` PRIMARY KEY(`id`)
);
