import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

const partialStringIndexOptions = (field) => ({
  unique: true,
  partialFilterExpression: {
    [field]: { $exists: true, $type: "string" },
  },
});

const rebuildStripeIndexes = async (collectionName) => {
  const collection = mongoose.connection.collection(collectionName);
  const indexes = await collection.indexes();

  for (const field of ["stripeSessionId", "stripe_session_id"]) {
    const oldIndex = indexes.find(
      (index) => index.key?.[field] === 1 && !index.partialFilterExpression
    );

    if (oldIndex) {
      console.log(`Dropping ${collectionName}.${oldIndex.name}`);
      await collection.dropIndex(oldIndex.name);
    }

    console.log(`Creating partial unique index on ${collectionName}.${field}`);
    await collection.createIndex({ [field]: 1 }, partialStringIndexOptions(field));
  }
};

const run = async () => {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is not defined");
  }

  await mongoose.connect(process.env.MONGODB_URI);

  await rebuildStripeIndexes("orders");
  await rebuildStripeIndexes("payments");

  await mongoose.disconnect();
  console.log("Stripe session indexes repaired");
};

run().catch(async (error) => {
  console.error("Failed to repair Stripe session indexes:", error);
  await mongoose.disconnect();
  process.exit(1);
});
