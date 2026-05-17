ALTER TABLE `catalog_orders` ADD `tenantId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `customers` ADD `tenantId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `sales` ADD `tenantId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `supplier_orders` ADD `tenantId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `catalog_orders` ADD CONSTRAINT `catalog_orders_tenantId_tenants_id_fk` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `customers` ADD CONSTRAINT `customers_tenantId_tenants_id_fk` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sales` ADD CONSTRAINT `sales_tenantId_tenants_id_fk` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `supplier_orders` ADD CONSTRAINT `supplier_orders_tenantId_tenants_id_fk` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE cascade ON UPDATE no action;