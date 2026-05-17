CREATE TABLE `tracking_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`trackingCode` varchar(50) NOT NULL,
	`status` varchar(100) NOT NULL,
	`description` text,
	`events` json,
	`lastUpdate` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `tracking_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `supplier_orders` ADD `trackingStatus` varchar(100);--> statement-breakpoint
ALTER TABLE `supplier_orders` ADD `lastTrackingUpdate` timestamp;--> statement-breakpoint
ALTER TABLE `supplier_orders` ADD `scheduleCronTaskUid` varchar(65);--> statement-breakpoint
ALTER TABLE `supplier_orders` ADD CONSTRAINT `supplier_orders_scheduleCronTaskUid_unique` UNIQUE(`scheduleCronTaskUid`);