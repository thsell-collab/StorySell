-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "scope" TEXT,
    "expires" TIMESTAMP(3),
    "accessToken" TEXT NOT NULL,
    "userId" BIGINT,
    "firstName" TEXT,
    "lastName" TEXT,
    "email" TEXT,
    "accountOwner" BOOLEAN NOT NULL DEFAULT false,
    "locale" TEXT,
    "collaborator" BOOLEAN DEFAULT false,
    "emailVerified" BOOLEAN DEFAULT false,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Stores" (
    "id" SERIAL NOT NULL,
    "shop" TEXT,
    "shop_owner_name" TEXT,
    "email" TEXT,
    "charge_id" BIGINT,
    "code" TEXT,
    "access_token" TEXT,
    "status" TEXT DEFAULT 'inactive',
    "activated_on" DATE,
    "trial_days" INTEGER,
    "trial_ends_on" DATE,
    "api_client_id" TEXT,
    "decorated_return_url" TEXT,
    "confirmation_url" TEXT,
    "locale" TEXT,
    "host" TEXT,
    "plan" INTEGER DEFAULT 0,
    "plan_id" TEXT,
    "plan_name" TEXT,
    "plan_type" TEXT,
    "plan_amount" DOUBLE PRECISION,
    "subscription_id" TEXT,
    "email_sent" INTEGER DEFAULT 0,
    "last_order_created_at" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Stores_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Stores_shop_key" ON "Stores"("shop");
