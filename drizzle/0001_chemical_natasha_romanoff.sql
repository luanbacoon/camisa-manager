CREATE TABLE `catalog_orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`customerName` varchar(255) NOT NULL,
	`customerPhone` varchar(30),
	`customerEmail` varchar(320),
	`items` json NOT NULL,
	`notes` text,
	`status` enum('novo','em_analise','confirmado','cancelado') NOT NULL DEFAULT 'novo',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `catalog_orders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `customers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`phone` varchar(30),
	`email` varchar(320),
	`address` text,
	`notes` text,
	`isDefault` boolean NOT NULL DEFAULT false,
	`totalSpent` decimal(12,2) NOT NULL DEFAULT '0.00',
	`totalOrders` int NOT NULL DEFAULT 0,
	`lastPurchaseAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `customers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `product_sizes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`size` varchar(20) NOT NULL,
	`stock` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `product_sizes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`team` varchar(255),
	`description` text,
	`imageUrl` text,
	`cost` decimal(10,2) NOT NULL DEFAULT '0.00',
	`avgCost` decimal(10,2) NOT NULL DEFAULT '0.00',
	`price` decimal(10,2) NOT NULL DEFAULT '0.00',
	`active` boolean NOT NULL DEFAULT true,
	`showInCatalog` boolean NOT NULL DEFAULT true,
	`totalUnitsReceived` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `products_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sale_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`saleId` int NOT NULL,
	`productId` int NOT NULL,
	`size` varchar(20) NOT NULL,
	`quantity` int NOT NULL,
	`unitPrice` decimal(10,2) NOT NULL,
	`unitCost` decimal(10,2) NOT NULL DEFAULT '0.00',
	CONSTRAINT `sale_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sales` (
	`id` int AUTO_INCREMENT NOT NULL,
	`customerId` int NOT NULL,
	`paymentMethod` enum('dinheiro','pix','cartao_credito','cartao_debito','transferencia','outro') NOT NULL,
	`total` decimal(12,2) NOT NULL,
	`profit` decimal(12,2) NOT NULL DEFAULT '0.00',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sales_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `stock_adjustments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`size` varchar(20) NOT NULL,
	`quantityBefore` int NOT NULL,
	`quantityAfter` int NOT NULL,
	`delta` int NOT NULL,
	`reason` text NOT NULL,
	`type` enum('venda','pedido_recebido','ajuste_manual','devolucao') NOT NULL,
	`referenceId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `stock_adjustments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `store_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`storeName` varchar(255) NOT NULL DEFAULT 'Minha Loja',
	`ownerName` varchar(255),
	`phone` varchar(30),
	`email` varchar(320),
	`address` text,
	`logoUrl` text,
	`instagram` varchar(255),
	`whatsapp` varchar(30),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `store_settings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `supplier_orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`size` varchar(20) NOT NULL,
	`quantity` int NOT NULL,
	`unitCost` decimal(10,2) NOT NULL,
	`totalCost` decimal(12,2) NOT NULL,
	`status` enum('pendente','em_transito','recebido','cancelado') NOT NULL DEFAULT 'pendente',
	`trackingCode` varchar(50),
	`notes` text,
	`orderedAt` timestamp NOT NULL DEFAULT (now()),
	`receivedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `supplier_orders_id` PRIMARY KEY(`id`)
);
