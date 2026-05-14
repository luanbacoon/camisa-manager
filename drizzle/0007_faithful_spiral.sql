ALTER TABLE `supplier_orders` ADD `supplier` varchar(255);--> statement-breakpoint
ALTER TABLE `supplier_orders` ADD `orderType` varchar(50) DEFAULT 'Nacional';--> statement-breakpoint
ALTER TABLE `supplier_orders` ADD `currency` varchar(20) DEFAULT 'BRL';--> statement-breakpoint
ALTER TABLE `supplier_orders` ADD `discount` decimal(10,2) DEFAULT '0';--> statement-breakpoint
ALTER TABLE `supplier_orders` ADD `freight` decimal(10,2) DEFAULT '0';--> statement-breakpoint
ALTER TABLE `supplier_orders` ADD `deliveryDate` timestamp;