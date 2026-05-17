CREATE TABLE `whatsapp_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int,
	`customerPhone` varchar(30) NOT NULL,
	`customerName` varchar(255) NOT NULL,
	`messageText` text NOT NULL,
	`status` enum('enviado','entregue','lido','falha') NOT NULL DEFAULT 'enviado',
	`messageId` varchar(255),
	`errorMessage` text,
	`sentAt` timestamp NOT NULL DEFAULT (now()),
	`deliveredAt` timestamp,
	`readAt` timestamp,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `whatsapp_history_id` PRIMARY KEY(`id`)
);
