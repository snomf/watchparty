// server.ts
import { Client } from 'pg'; // Import Client class
import config from './config';

async function testDatabaseConnection() {
  const client = new Client(config.DATABASE_URL); // Create a new client instance
  try {
    await client.connect(); // Attempt to connect to the database
    console.log('Database connection test: SUCCESS!'); // Log success
    await client.end(); // Close the connection
  } catch (error: any) {
    console.error('Database connection test: FAILED!'); // Log failure
    console.error('Error details:', error); // Log full error details
  }
}

async function startServer() {
  console.log('Starting minimal server...'); // Log server start attempt
  await testDatabaseConnection(); // Run the database connection test
  const port = process.env.PORT || 8080;
  const host = '0.0.0.0';
  console.log(`Server listening on port ${port}`); // Log port info
  // No actual HTTP server needed for this test
}

startServer(); // Start the simplified server logic
