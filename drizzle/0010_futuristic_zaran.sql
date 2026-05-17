CREATE TABLE `whatsapp_templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`status` enum('novo','em_analise','confirmado','cancelado','entregue') NOT NULL,
	`messageText` text NOT NULL,
	`emoji` varchar(10) DEFAULT '📦',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `whatsapp_templates_id` PRIMARY KEY(`id`),
	CONSTRAINT `whatsapp_templates_status_unique` UNIQUE(`status`)
);
