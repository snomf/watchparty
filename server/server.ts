import { postgres } from './utils/postgres'; // Import your postgres client

async function testDatabaseConnection() {
  try {
    await postgres?.connect(); // Attempt to connect to the database
    console.log('Database connection test: SUCCESS!'); // Log success
    await postgres?.end(); // Close the connection
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
