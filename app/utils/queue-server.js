// app/utils/queue.server.js
import { Queue, Worker } from "bullmq";
import { redis } from "./redis-server";

export const jobQueue = new Queue("jobs", { connection: redis });

// Worker runs inside the Remix app (simple mode)
const worker = new Worker(
  "jobs",
  async (job) => {
    if (job.name === "processOrder") {
      console.log("Processing order for:", job.data.shop);

      // Simulate API call delay
      await new Promise((res) => setTimeout(res, 1000));

      console.log(`Order processed`, job.data);
    }
  },
  { connection: redis }
);

worker.on("failed", (job, err) => {
  console.error(`Job ${job.id} failed:`, err);
});
