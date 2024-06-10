require('dotenv').config();
import { startApi } from "./modules/api/startApi";
import { loadFiles } from "./modules/storage/files";
import { db } from "./modules/storage/storage";
import { log } from "./utils/log";
import { awaitShutdown } from "./utils/shutdown";
import { hasRole } from "./roles";
import { loadSystemUsers } from "./modules/profile/systemUsers";
import { initRedis } from "./modules/eventbus/redis";

async function main() {

    //
    // Connect to the database
    //

    log('Connecting to DB...');
    await db.$connect();
    await initRedis();
    await loadSystemUsers();

    //
    // Connect to s3
    //

    await loadFiles();

    //
    // Starts workers
    //

    if (hasRole('workers')) {
        // No workers yet
    }

    //
    // Start API
    //

    await startApi();

    //
    // Ready
    //

    log('Ready');
    await awaitShutdown();
    log('Shutting down...');
}

main().catch(async (e) => {
    console.error(e);
    await db.$disconnect()
    process.exit(1);
}).then(async () => {
    log('Disconnecting from DB...');
    await db.$disconnect();
});