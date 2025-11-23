-- Drop existing tables if they exist (order matters due to FKs)
DROP TABLE IF EXISTS payment_webhook_events CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS user_mandates CASCADE;
DROP TABLE IF EXISTS plans CASCADE;
DROP TABLE IF EXISTS users CASCADE;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE users (
    "id" SERIAL PRIMARY KEY,
    "name" VARCHAR(255),
    "bio" TEXT,
    "userType" VARCHAR(100) NOT NULL,
    "email" VARCHAR(255) UNIQUE,
    "mobile" VARCHAR(20) UNIQUE,
    "passwordHash" VARCHAR(255) NOT NULL,
    "isActive" BOOLEAN DEFAULT TRUE,
    "age" INT
);

CREATE TABLE plans (
  "id" SERIAL PRIMARY KEY,
  "planName" VARCHAR(150) NOT NULL,
  "price" NUMERIC(10,2) NOT NULL,
  "validityInDays" INT NOT NULL,
  "isNew" BOOLEAN DEFAULT FALSE,
  "isPromotional" BOOLEAN DEFAULT FALSE,
  "isActive" BOOLEAN DEFAULT TRUE,
  "descriptionOfPlan" TEXT,
  "subscriberCount" INT DEFAULT 0,
  "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  "modifiedAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  "createdBy" VARCHAR(100),
  "deletedAt" TIMESTAMPTZ,
  "deletedBy" VARCHAR(100)
);

CREATE TABLE subscriptions (
  id SERIAL PRIMARY KEY,
  "userId" INT NOT NULL REFERENCES users("id") ON DELETE CASCADE,
  "planId" INT REFERENCES plans(id) ON DELETE SET NULL,
  "paymentId" INT DEFAULT NULL,
  "transactionId" VARCHAR(255) DEFAULT NULL,
  "paymentStatus" VARCHAR(50) DEFAULT 'initiated',
  "subscriptionStatus" VARCHAR(50) DEFAULT 'inactive',
  "amount" NUMERIC(10,2) NOT NULL,
  "gateway" VARCHAR(50) NOT NULL,
  "notes" TEXT DEFAULT NULL,
  "expiresOn" TIMESTAMPTZ,
  "downgradeSubscriptionId" INT DEFAULT NULL,
  "refundId" INT DEFAULT NULL,
  "receiptUrl" TEXT,
  "isActive" BOOLEAN DEFAULT TRUE,
  "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  "modifiedAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE payment_webhook_events (
  id SERIAL PRIMARY KEY,
  "subscriptionId" INT NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  "paymentId" INT NOT NULL,
  "transactionId" VARCHAR(255),
  "refundId" INT DEFAULT NULL,
  "metaData" JSONB,
  "paymentStatus" VARCHAR(20) DEFAULT 'pending',
  "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_mandates (
  id SERIAL PRIMARY KEY,
  "userId" INT NOT NULL REFERENCES users("id") ON DELETE CASCADE,
  "mandateId" VARCHAR(255),
  "paymentMethodToken" VARCHAR(255),
  "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  "modifiedAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Seed 50 users
INSERT INTO users (name, bio, "userType", email, mobile, "passwordHash", "isActive", age)
SELECT
  'User ' || g,
  'Bio for user ' || g,
  (ARRAY['admin','customer','manager'])[1 + floor(random()*3)::int],
  'user' || g || '@example.com',
  '555' || LPAD(g::text, 2, '0'),
  md5('password' || g),
  TRUE,
  20 + (g % 25)
FROM generate_series(1, 5) AS g;

-- Seed 5 plans
WITH plan_data AS (
  SELECT plan_name, idx
  FROM unnest(ARRAY[
    'Starter','Basic','Professional','Business','Ultimate'
  ]) WITH ORDINALITY AS t(plan_name, idx)
)
INSERT INTO plans (
  "planName", 
  "price", 
  "validityInDays",  
  "isNew",
  "isPromotional", 
  "descriptionOfPlan",
  "subscriberCount", 
  "createdBy"
)
SELECT
  plan_name,
  (100 + idx * 5 + random() * 5)::int,
  30 * (1 + (idx % 3)),
  (idx % 2 = 0),
  (idx % 3 = 0),
  plan_name || ' plan description',
  (50 + (random() * 450)::int)::int,
  'seed-script'
FROM plan_data;

-- Seed user mandates for every user
INSERT INTO user_mandates ("userId", "mandateId", "paymentMethodToken")
SELECT
  id,
  'mandate_' || id,
  'token_' || id
FROM users;


-- Seed subscriptions
WITH pairs AS (
  SELECT
    u.id AS "userId",
    p.id AS "planId",
    row_number() OVER (ORDER BY random()) AS rn,
    (10 + floor(random() * 40))::int AS expires_in_days,
    ARRAY['razorpay', 'paypal'] AS gateway
  FROM users u
  CROSS JOIN plans p
)
INSERT INTO subscriptions (
    "userId",
    "planId",
    "paymentId",
    "transactionId",
    "paymentStatus",
    "subscriptionStatus",

    "amount",
    "gateway",
    "notes",
    "expiresOn",
    "receiptUrl"
)
SELECT
  "userId",
  "planId",
  random() * 1000000,
  'txn_' || md5(random()::text),
  CASE
    WHEN rn > 30 THEN 'failed'
    WHEN rn BETWEEN 21 AND 30 THEN 'refunded'
    ELSE 'success'
  END,
  CASE
    WHEN rn > 30 THEN 'canceled'
    WHEN rn BETWEEN 21 AND 30 THEN 'paused'
    ELSE 'active'
  END,
  ROUND((10 + random() * 90)::numeric, 2),
  gateway[1 + floor(random()*2)::int],
  CASE
    WHEN rn > 30 THEN 'Gateway Error'
    WHEN rn BETWEEN 21 AND 30 THEN 'Price Mismatch'
    ELSE 'success'
  END,
  CURRENT_TIMESTAMP + expires_in_days * INTERVAL '1 day', -- expires on
  'https://payments.example.com/receipts/' || md5(random()::text) -- receipt url
FROM pairs
WHERE rn <= 35;


