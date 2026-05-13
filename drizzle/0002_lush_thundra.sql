ALTER TABLE `sales` ADD `discountValue` decimal(10,2) DEFAULT '0.00' NOT NULL;--> statement-breakpoint
ALTER TABLE `sales` ADD `discountPercent` decimal(5,2) DEFAULT '0.00' NOT NULL;--> statement-breakpoint
ALTER TABLE `sales` ADD `saleDate` timestamp;