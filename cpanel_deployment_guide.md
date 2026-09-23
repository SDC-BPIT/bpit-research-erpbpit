# 🚀 Step-by-Step cPanel Deployment Guide for BPIT Research ERP

This guide provides complete instructions to deploy the **BPIT Research ERP** (Next.js + Prisma + MySQL) onto your cPanel web hosting server (e.g., BPIT website hosting).

---

## 📋 Overview of Deployment Steps

```mermaid
graph TD
    A[Step 1: Export Local MySQL Database] --> B[Step 2: Create MySQL DB in cPanel & Import SQL]
    B --> C[Step 3: Build & Package Project Files]
    C --> D[Step 4: Upload & Extract via cPanel File Manager]
    D --> E[Step 5: Configure Setup Node.js App in cPanel]
    E --> F[Step 6: Configure Environment .env File]
    F --> G[Step 7: Install Dependencies & Generate Prisma Client]
    G --> H[Step 8: Start & Verify ERP App]
```

---

## Step 1: Export your Local MySQL Database

If you have data in your local MySQL database (`bpit_research`):

1. Open **phpMyAdmin** or MySQL Workbench on your local machine.
2. Select the `bpit_research` database.
3. Click **Export** -> Format: **SQL** -> Click **Go**.
4. Save the `.sql` file (or use the pre-existing [`bpit_research.sql`](file:///e:/ERP%20Work/bpit-research-erp/bpit_research.sql) file in your project directory).

---

## Step 2: Create MySQL Database & Import in cPanel

1. Log into your **cPanel** account (e.g., `https://bpitindia.edu.in:2083`).
2. Navigate to **Databases** -> **MySQL® Databases**.
3. **Create a New Database**:
   - Name: `bpit_research` (cPanel will prefix it, e.g. `bpit_bpit_research`).
4. **Create a Database User**:
   - Username: `bpit_erpuser`
   - Password: Set a strong password and save it securely.
5. **Add User to Database**:
   - Select the user and database you just created.
   - Click **Add** -> Check **ALL PRIVILEGES** -> Click **Make Changes**.
6. **Import the SQL File**:
   - Go back to cPanel Home -> Click **phpMyAdmin**.
   - Select your new database on the left menu (e.g. `bpit_bpit_research`).
   - Click the **Import** tab -> Choose File: Select `bpit_research.sql`.
   - Click **Go** to import all tables (`User`, `Faculty`, `Journal`, `Patent`, `Conference`, `FDP`, `BookChapter`, `Book`, etc.).

---

## Step 3: Package the Project Files

On your local development machine:

1. Run Next.js build:
   ```bash
   npm run build
   ```
2. Create a `.zip` archive of your project directory (`bpit-research-erp.zip`).
   - **Include**: `.next`, `pages`, `public`, `prisma`, `package.json`, `package-lock.json`, `next.config.mjs`, `.env`
   - **Exclude**: `node_modules` (Do NOT zip `node_modules`; they will be installed natively on the server).

---

## Step 4: Upload Files via cPanel File Manager

1. In cPanel, open **File Manager**.
2. Navigate to your home directory (e.g., `/home/username/`).
3. Create a folder named `bpit-research-erp` (outside of `public_html` for security).
4. Upload `bpit-research-erp.zip` into `/home/username/bpit-research-erp/`.
5. Right-click `bpit-research-erp.zip` -> Select **Extract**.

---

## Step 5: Setup Node.js Application in cPanel

1. In cPanel Home, go to **Software** -> **Setup Node.js App**.
2. Click **Create Application**.
3. Fill in the parameters:
   - **Node.js Version**: Select `18.x` or `20.x` (or latest available).
   - **Application Mode**: Select `Production`.
   - **Application Root**: `bpit-research-erp` (folder where you extracted files).
   - **Application URL**: Select your domain/subdomain or directory (e.g. `research-erp` or `bpitindia.edu.in/research-erp`).
   - **Application Startup File**: `node_modules/next/dist/bin/next` (or create a simple `server.js` startup wrapper below).
4. Click **Create**.

> [!TIP]
> **Recommended `server.js` startup file** (Create `server.js` inside `/bpit-research-erp/`):
> ```js
> const { createServer } = require('http');
> const parseurl = require('parseurl');
> const next = require('next');
> 
> const dev = process.env.NODE_ENV !== 'production';
> const app = next({ dev });
> const handle = app.getRequestHandler();
> 
> const port = process.env.PORT || 3000;
> 
> app.prepare().then(() => {
>   createServer((req, res) => {
>     handle(req, res, parseurl(req));
>   }).listen(port, (err) => {
>     if (err) throw err;
>     console.log(`> Ready on http://localhost:${port}`);
>   });
> });
> ```

---

## Step 6: Configure Environment (`.env`) File

Edit `.env` inside `/home/username/bpit-research-erp/.env` using cPanel Code Editor:

```env
DATABASE_URL="mysql://cpanel_user:cpanel_password@localhost:3306/cpanel_dbname"
JWT_SECRET="bpit_erp_jwt_secret_2024_secure"

# SMTP Email Configuration
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="amandureja@gmail.com"
SMTP_PASS="your_app_password"
EMAIL_FROM="BPIT ERP <amandureja@gmail.com>"
```

---

## Step 7: Install Dependencies & Generate Prisma Client

1. In **Setup Node.js App** page, copy the command at the top (e.g. `source /home/username/nodevenv/bpit-research-erp/18/bin/activate && cd /home/username/bpit-research-erp`).
2. Open **Terminal** in cPanel (or SSH into server).
3. Paste and run the activation command.
4. Run the following commands inside the virtual environment:
   ```bash
   npm install
   npx prisma generate
   ```

---

## Step 8: Restart & Verify Application

1. Go to **Setup Node.js App** in cPanel.
2. Click **Restart Application**.
3. Open your browser and navigate to your application URL (e.g., `https://bpitindia.edu.in/research-erp`).
4. Verify login, faculty profile views, publication entries, and report generation!

---

## 🛠 Troubleshooting Quick Reference

| Issue | Cause | Solution |
| :--- | :--- | :--- |
| **500 Internal Server Error** | Missing `.env` or incorrect DB connection string | Check `DATABASE_URL` credentials in cPanel `.env` and verify database privileges in cPanel MySQL Databases. |
| **Prisma Client Error** | Prisma client binary missing or out of sync | Run `npx prisma generate` inside cPanel Terminal. |
| **Images/Logos Not Found** | Assets not copied to public directory | Ensure `public/` directory is extracted properly under `/bpit-research-erp/public/`. |
| **Database Connection Refused** | Incorrect host | Use `localhost` or `127.0.0.1` as host in `DATABASE_URL` on cPanel. |
