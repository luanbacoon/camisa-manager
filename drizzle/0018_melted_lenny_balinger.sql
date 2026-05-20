ALTER TABLE `users` MODIFY COLUMN `role` enum('user','admin','gerente','vendedor','visualizador') NOT NULL DEFAULT 'user';--> statement-breakpoint
ALTER TABLE `users` ADD `tenantId` int;