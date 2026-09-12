-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(36) NOT NULL,
    `email` VARCHAR(191) NULL,
    `passwordHash` VARCHAR(255) NULL,
    `name` VARCHAR(100) NOT NULL,
    `phone` VARCHAR(20) NULL,
    `role` ENUM('CUSTOMER', 'WAITER', 'KITCHEN', 'CASHIER', 'ADMIN') NOT NULL DEFAULT 'CUSTOMER',
    `authProvider` ENUM('LOCAL', 'GOOGLE') NOT NULL DEFAULT 'LOCAL',
    `googleId` VARCHAR(100) NULL,
    `image` VARCHAR(500) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    UNIQUE INDEX `users_phone_key`(`phone`),
    UNIQUE INDEX `users_googleId_key`(`googleId`),
    INDEX `users_role_idx`(`role`),
    INDEX `users_phone_idx`(`phone`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `staff_profiles` (
    `id` VARCHAR(36) NOT NULL,
    `userId` VARCHAR(36) NOT NULL,
    `employeeCode` VARCHAR(50) NOT NULL,
    `quickPinHash` VARCHAR(255) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `hiredAt` DATETIME(3) NULL,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `staff_profiles_userId_key`(`userId`),
    UNIQUE INDEX `staff_profiles_employeeCode_key`(`employeeCode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `restaurant_tables` (
    `id` VARCHAR(36) NOT NULL,
    `tableNumber` VARCHAR(20) NOT NULL,
    `qrCodeToken` VARCHAR(64) NULL,
    `capacity` INTEGER NOT NULL DEFAULT 4,
    `status` ENUM('AVAILABLE', 'OCCUPIED', 'RESERVED', 'OUT_OF_SERVICE') NOT NULL DEFAULT 'AVAILABLE',
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `restaurant_tables_tableNumber_key`(`tableNumber`),
    UNIQUE INDEX `restaurant_tables_qrCodeToken_key`(`qrCodeToken`),
    INDEX `restaurant_tables_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `table_sessions` (
    `id` VARCHAR(36) NOT NULL,
    `tableId` VARCHAR(36) NOT NULL,
    `waiterId` VARCHAR(36) NULL,
    `guestCount` INTEGER NOT NULL DEFAULT 1,
    `status` ENUM('ACTIVE', 'BILLED', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'ACTIVE',
    `notes` VARCHAR(255) NULL,
    `openedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `closedAt` DATETIME(3) NULL,

    INDEX `table_sessions_tableId_status_idx`(`tableId`, `status`),
    INDEX `table_sessions_status_idx`(`status`),
    INDEX `table_sessions_openedAt_idx`(`openedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `categories` (
    `id` VARCHAR(36) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `slug` VARCHAR(120) NOT NULL,
    `description` TEXT NULL,
    `image` VARCHAR(500) NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `categories_name_key`(`name`),
    UNIQUE INDEX `categories_slug_key`(`slug`),
    INDEX `categories_slug_idx`(`slug`),
    INDEX `categories_sortOrder_idx`(`sortOrder`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `products` (
    `id` VARCHAR(36) NOT NULL,
    `categoryId` VARCHAR(36) NOT NULL,
    `name` VARCHAR(150) NOT NULL,
    `slug` VARCHAR(180) NOT NULL,
    `description` TEXT NULL,
    `image` VARCHAR(500) NOT NULL,
    `galleryImages` JSON NULL,
    `priceType` ENUM('VARIANT', 'WEIGHT') NOT NULL DEFAULT 'VARIANT',
    `pricePerKg` DECIMAL(10, 2) NULL,
    `allowCustomWeight` BOOLEAN NOT NULL DEFAULT false,
    `trackStock` BOOLEAN NOT NULL DEFAULT false,
    `stockQuantity` INTEGER NOT NULL DEFAULT 0,
    `lowStockAlert` INTEGER NULL DEFAULT 5,
    `isAvailable` BOOLEAN NOT NULL DEFAULT true,
    `isFeatured` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `products_slug_key`(`slug`),
    INDEX `products_slug_idx`(`slug`),
    INDEX `products_categoryId_isAvailable_idx`(`categoryId`, `isAvailable`),
    INDEX `products_isFeatured_idx`(`isFeatured`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `product_variants` (
    `id` VARCHAR(36) NOT NULL,
    `productId` VARCHAR(36) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `price` DECIMAL(10, 2) NOT NULL,
    `isAvailable` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `product_variants_productId_isAvailable_idx`(`productId`, `isAvailable`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `product_weight_options` (
    `id` VARCHAR(36) NOT NULL,
    `productId` VARCHAR(36) NOT NULL,
    `value` INTEGER NOT NULL,
    `unit` VARCHAR(10) NOT NULL DEFAULT 'g',
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `product_weight_options_productId_idx`(`productId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `orders` (
    `id` VARCHAR(36) NOT NULL,
    `orderNumber` VARCHAR(30) NOT NULL,
    `userId` VARCHAR(36) NULL,
    `tableSessionId` VARCHAR(36) NULL,
    `orderSource` ENUM('CUSTOMER_WEB', 'WAITER', 'ADMIN', 'QR') NOT NULL DEFAULT 'CUSTOMER_WEB',
    `orderType` ENUM('DINE_IN', 'TAKEAWAY', 'PICKUP', 'DELIVERY') NOT NULL DEFAULT 'DELIVERY',
    `status` ENUM('PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'DELIVERED', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `subtotalAmount` DECIMAL(10, 2) NOT NULL,
    `deliveryCharge` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `discountAmount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `totalAmount` DECIMAL(10, 2) NOT NULL,
    `customerName` VARCHAR(100) NOT NULL,
    `customerPhone` VARCHAR(20) NOT NULL,
    `customerEmail` VARCHAR(191) NULL,
    `deliveryAddress` TEXT NULL,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `orders_orderNumber_key`(`orderNumber`),
    INDEX `orders_orderNumber_idx`(`orderNumber`),
    INDEX `orders_userId_idx`(`userId`),
    INDEX `orders_status_idx`(`status`),
    INDEX `orders_orderSource_idx`(`orderSource`),
    INDEX `orders_orderType_idx`(`orderType`),
    INDEX `orders_createdAt_idx`(`createdAt`),
    INDEX `orders_tableSessionId_idx`(`tableSessionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `order_items` (
    `id` VARCHAR(36) NOT NULL,
    `orderId` VARCHAR(36) NOT NULL,
    `productId` VARCHAR(36) NULL,
    `productName` VARCHAR(150) NOT NULL,
    `variantName` VARCHAR(100) NULL,
    `selectedWeightInGrams` INTEGER NULL,
    `unitPrice` DECIMAL(10, 2) NULL,
    `pricePerKg` DECIMAL(10, 2) NULL,
    `calculatedPrice` DECIMAL(10, 2) NOT NULL,
    `quantity` INTEGER NOT NULL DEFAULT 1,
    `specialInstructions` VARCHAR(255) NULL,

    INDEX `order_items_orderId_idx`(`orderId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `kot_tickets` (
    `id` VARCHAR(36) NOT NULL,
    `orderId` VARCHAR(36) NOT NULL,
    `tableSessionId` VARCHAR(36) NULL,
    `ticketNumber` INTEGER NOT NULL AUTO_INCREMENT,
    `status` ENUM('QUEUED', 'PREPARING', 'READY', 'SERVED', 'CANCELLED') NOT NULL DEFAULT 'QUEUED',
    `notes` VARCHAR(255) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `kot_tickets_ticketNumber_key`(`ticketNumber`),
    INDEX `kot_tickets_orderId_idx`(`orderId`),
    INDEX `kot_tickets_status_idx`(`status`),
    INDEX `kot_tickets_createdAt_idx`(`createdAt`),
    INDEX `kot_tickets_tableSessionId_idx`(`tableSessionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `kot_items` (
    `id` VARCHAR(36) NOT NULL,
    `kotTicketId` VARCHAR(36) NOT NULL,
    `orderItemId` VARCHAR(36) NOT NULL,
    `itemName` VARCHAR(150) NOT NULL,
    `itemDetails` VARCHAR(100) NULL,
    `quantity` INTEGER NOT NULL DEFAULT 1,
    `status` ENUM('PENDING', 'COOKING', 'READY', 'SERVED') NOT NULL DEFAULT 'PENDING',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `kot_items_kotTicketId_idx`(`kotTicketId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bills` (
    `id` VARCHAR(36) NOT NULL,
    `billNumber` VARCHAR(30) NOT NULL,
    `tableSessionId` VARCHAR(36) NULL,
    `orderId` VARCHAR(36) NULL,
    `createdById` VARCHAR(36) NULL,
    `grossAmount` DECIMAL(10, 2) NOT NULL,
    `discountAmount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `deliveryCharge` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `taxAmount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `netAmount` DECIMAL(10, 2) NOT NULL,
    `status` ENUM('UNPAID', 'PARTIALLY_PAID', 'PAID', 'VOID') NOT NULL DEFAULT 'UNPAID',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `settledAt` DATETIME(3) NULL,

    UNIQUE INDEX `bills_billNumber_key`(`billNumber`),
    UNIQUE INDEX `bills_tableSessionId_key`(`tableSessionId`),
    UNIQUE INDEX `bills_orderId_key`(`orderId`),
    INDEX `bills_status_createdAt_idx`(`status`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payments` (
    `id` VARCHAR(36) NOT NULL,
    `billId` VARCHAR(36) NOT NULL,
    `recordedById` VARCHAR(36) NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `method` ENUM('CASH', 'FONEPAY_QR', 'ESEWA', 'KHALTI', 'CARD', 'OTHER') NOT NULL DEFAULT 'CASH',
    `status` ENUM('PENDING', 'PAID', 'FAILED', 'REFUNDED') NOT NULL DEFAULT 'PAID',
    `transactionReference` VARCHAR(100) NULL,
    `notes` VARCHAR(255) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `payments_billId_idx`(`billId`),
    INDEX `payments_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notifications` (
    `id` VARCHAR(36) NOT NULL,
    `userId` VARCHAR(36) NULL,
    `targetRole` ENUM('CUSTOMER', 'WAITER', 'KITCHEN', 'CASHIER', 'ADMIN') NULL,
    `recipientType` ENUM('USER', 'ROLE_BROADCAST') NOT NULL DEFAULT 'USER',
    `type` ENUM('ORDER_CREATED', 'ORDER_STATUS_CHANGED', 'KOT_NEW', 'KOT_READY', 'BILL_REQUESTED', 'PAYMENT_RECEIVED', 'SYSTEM_ALERT') NOT NULL DEFAULT 'SYSTEM_ALERT',
    `title` VARCHAR(150) NOT NULL,
    `body` TEXT NOT NULL,
    `linkUrl` VARCHAR(255) NULL,
    `metadata` JSON NULL,
    `isRead` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `notifications_userId_isRead_idx`(`userId`, `isRead`),
    INDEX `notifications_targetRole_isRead_idx`(`targetRole`, `isRead`),
    INDEX `notifications_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `push_subscriptions` (
    `id` VARCHAR(36) NOT NULL,
    `userId` VARCHAR(36) NULL,
    `clientType` ENUM('CUSTOMER', 'WAITER', 'KITCHEN', 'CASHIER', 'ADMIN') NOT NULL DEFAULT 'CUSTOMER',
    `endpoint` VARCHAR(500) NOT NULL,
    `p256dhKey` VARCHAR(255) NOT NULL,
    `authKey` VARCHAR(255) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `push_subscriptions_endpoint_key`(`endpoint`),
    INDEX `push_subscriptions_userId_idx`(`userId`),
    INDEX `push_subscriptions_clientType_idx`(`clientType`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `audit_logs` (
    `id` VARCHAR(36) NOT NULL,
    `userId` VARCHAR(36) NULL,
    `action` ENUM('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'STATUS_CHANGE', 'PAYMENT_RECORD', 'VOID_BILL') NOT NULL,
    `entity` VARCHAR(50) NOT NULL,
    `entityId` VARCHAR(36) NOT NULL,
    `details` JSON NULL,
    `ipAddress` VARCHAR(45) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `audit_logs_userId_idx`(`userId`),
    INDEX `audit_logs_entity_entityId_idx`(`entity`, `entityId`),
    INDEX `audit_logs_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `staff_profiles` ADD CONSTRAINT `staff_profiles_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `table_sessions` ADD CONSTRAINT `table_sessions_tableId_fkey` FOREIGN KEY (`tableId`) REFERENCES `restaurant_tables`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `table_sessions` ADD CONSTRAINT `table_sessions_waiterId_fkey` FOREIGN KEY (`waiterId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `products` ADD CONSTRAINT `products_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `categories`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `product_variants` ADD CONSTRAINT `product_variants_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `product_weight_options` ADD CONSTRAINT `product_weight_options_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_tableSessionId_fkey` FOREIGN KEY (`tableSessionId`) REFERENCES `table_sessions`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `kot_tickets` ADD CONSTRAINT `kot_tickets_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `kot_tickets` ADD CONSTRAINT `kot_tickets_tableSessionId_fkey` FOREIGN KEY (`tableSessionId`) REFERENCES `table_sessions`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `kot_items` ADD CONSTRAINT `kot_items_kotTicketId_fkey` FOREIGN KEY (`kotTicketId`) REFERENCES `kot_tickets`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `kot_items` ADD CONSTRAINT `kot_items_orderItemId_fkey` FOREIGN KEY (`orderItemId`) REFERENCES `order_items`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bills` ADD CONSTRAINT `bills_tableSessionId_fkey` FOREIGN KEY (`tableSessionId`) REFERENCES `table_sessions`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bills` ADD CONSTRAINT `bills_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `orders`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bills` ADD CONSTRAINT `bills_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payments` ADD CONSTRAINT `payments_billId_fkey` FOREIGN KEY (`billId`) REFERENCES `bills`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payments` ADD CONSTRAINT `payments_recordedById_fkey` FOREIGN KEY (`recordedById`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `push_subscriptions` ADD CONSTRAINT `push_subscriptions_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

