import { app } from "./app";
import { env } from "./config/env";
import { startScheduler } from "./jobs/scheduler";

app.listen(env.PORT, () => {
  console.log(`Backend listening on http://localhost:${env.PORT}`);
});

startScheduler();
