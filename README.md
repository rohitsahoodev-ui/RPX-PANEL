# RDX VPS Panel - Installation Guide

RDX VPS Panel is a modern, enterprise-grade LXC/LXD control panel. Follow these steps to install it on your VPS.

## Prerequisites

- **OS**: Ubuntu 22.04 or 24.04 (Recommended)
- **Node.js**: v18 or higher
- **LXC/LXD**: Installed and initialized (`lxd init`)
- **Root Access**: Required for executing LXC commands and port forwarding.

## Step 1: System Preparation

Update your system and install necessary tools:

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y nodejs npm lxd iptables
```

Ensure LXD is initialized:
```bash
sudo lxd init --auto
```

## Step 2: Download and Install

1. Clone or upload the panel files to your VPS.
2. Navigate to the project directory:
   ```bash
   cd rdx-panel
   ```
3. **Install Dependencies (CRITICAL)**:
   This step installs `vite`, `tsx`, and other required tools.
   ```bash
   npm install
   ```
   *If you see "command not found" later, it's usually because this step was skipped or failed.*

## Step 3: Configuration

Create a `.env` file in the root directory:

```env
# Panel Configuration
SECRET_KEY=your-random-secret-key
ADMIN_USERNAME=admin
ADMIN_PASSWORD=rdx
PANEL_NAME=RDX VPS Panel
WATERMARK=RDX VPS Service
WELCOME_MESSAGE=Welcome to RDX VPS Panel

# VPS Configuration
MAX_VPS_PER_USER=5
DEFAULT_OS_IMAGE=ubuntu:22.04
DOCKER_NETWORK=hvm_network
MAX_CONTAINERS=50

# Server Configuration
SERVER_IP=0.0.0.0
SERVER_PORT=3000
DEBUG=False
```

## Step 4: Build and Start

1. Build the frontend:
   ```bash
   npm run build
   ```
2. Start the panel:
   ```bash
   # Using the built-in start script (uses tsx)
   npm start

   # OR using PM2 (Recommended for production)
   # First install pm2 and tsx globally if not already
   sudo npm install -g pm2 tsx
   pm2 start server.ts --interpreter tsx --name rdx-panel
   ```

### Troubleshooting: "command not found" (vite, tsx, etc.)
If `npm run build` or `npm start` fails with "not found":
1. Run `npm install` in the project root.
2. Check if `node_modules` folder exists.
3. Try using `npx`:
   - `npx vite build`
   - `npx tsx server.ts`

### Troubleshooting: "Unknown file extension .ts"
If you see an error like `ERR_UNKNOWN_FILE_EXTENSION`, it means Node is trying to run the `.ts` file directly without a transpiler. 
**Solution**: Ensure you are using `npm start` (which now uses `tsx`) or run it manually using `npx tsx server.ts`.

## Step 5: Access the Panel

Open your browser and visit `http://your-vps-ip:3000`.
Log in with the credentials defined in your `.env` file.

## Multi-Node Setup (Optional)

To add remote nodes:
1. Install LXD on the remote node.
2. Ensure the remote node allows API access or use a tunnel.
3. Add the node IP and API key in the "Nodes" section of the RDX Panel.

## Security Notes

- Always run the panel behind a reverse proxy (like Nginx) with SSL (Certbot).
- Ensure your firewall (UFW) allows traffic on the configured `SERVER_PORT`.
- Change the `SECRET_KEY` and `ADMIN_PASSWORD` immediately after installation.
