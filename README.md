# Sunriver Hotel Management System

This is a full-stack hotel management application built with React (Vite), TypeScript, and Tailwind CSS for the front-end, and Vercel Serverless Functions with a Neon PostgreSQL database for the back-end.

## Project Structure

- **/src**: Contains all the front-end React application source code.
- **/api**: Contains the Vercel Serverless Functions that act as the back-end API, connecting to the database.
- **/db**: Contains the SQL schema file for setting up the Neon database.
- **vite.config.ts**: Configuration for the Vite front-end development server and build process.
- **package.json**: Lists all project dependencies and scripts.

## Setup and Development

1.  **Clone the Repository**:
    ```bash
    git clone <your-repo-url>
    cd <repo-name>
    ```

2.  **Install Dependencies**:
    ```bash
    npm install
    ```

3.  **Set up the Database**:
    - Create a new project on [Neon](https://neon.tech/).
    - In the Neon SQL Editor, copy and paste the entire content of `db/schema.sql` and run it to create and populate your tables.
    - Find your database connection string (it will look like `postgres://...`).

4.  **Configure Environment Variables**:
    - Create a new file in the root of the project named `.env`.
    - Add your Neon database connection string to this file:
      ```
      POSTGRES_URL="your_neon_database_connection_string"
      ```

5.  **Run the Development Server**:
    ```bash
    npm run dev
    ```
    This will start the Vite front-end server and the Vercel serverless functions simultaneously. The application will be available at `http://localhost:5173`.

## Deployment to Vercel

1.  **Push to GitHub**: Make sure your project is in a GitHub repository.

2.  **Import Project on Vercel**:
    - Go to your Vercel dashboard and click "Add New... -> Project".
    - Import your GitHub repository.
    - Vercel should automatically detect that you are using Vite and configure the build settings correctly.

3.  **Configure Environment Variables on Vercel**:
    - In your Vercel project's settings, go to the "Environment Variables" section.
    - Add a new variable with the key `POSTGRES_URL` and paste your Neon database connection string as the value.
    - **Important**: Ensure this variable is available for all environments (Production, Preview, and Development).

4.  **Deploy**:
    - Click the "Deploy" button. Vercel will build your application and deploy it. After a few moments, your hotel management system will be live!
