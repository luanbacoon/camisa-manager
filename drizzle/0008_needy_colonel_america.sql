CREATE TABLE `supplier_order_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`productId` int NOT NULL,
	`size` varchar(20) NOT NULL,
	`quantity` int NOT NULL,
	`unitCost` decimal(10,2) NOT NULL,
	`totalCost` decimal(12,2) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `supplier_order_items_id` PRIMARY KEY(`id`)
);
