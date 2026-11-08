This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app), showing a live storage dashboard for a Linux/Ubuntu mini PC.

## What it does

- `GET /api/storage` runs `lsblk` and `df` on the host and returns disk/filesystem usage as JSON.
- The dashboard (`/`) polls that endpoint every 15 seconds and renders:
    - Total/used/free capacity summary cards
    - Per-mount usage bars (`/`, external drives, etc.)
    - A tree of physical disks and their partitions (model, transport, size)
- The system overview lists running project servers detected by Linux `ss` on TCP ports 3000–3099.
- On non-Linux machines (e.g. this dev machine on Windows), or if `lsblk`/`df` aren't available, it falls back to sample data so the UI can still be developed/previewed.

## Getting Started

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

To make the development server reachable by other devices on the same network, run:

```bash
npm run dev:network
```

Find the mini PC's LAN address with `hostname -I`, then open `http://<mini-pc-ip>:3000` from another device.

## Deploying on the mini PC (Ubuntu)

1. Copy this project to the mini PC and install dependencies: `npm install`
2. Build for production: `npm run build`
3. Start it locally: `npm start` (defaults to port 3000), or expose it to the LAN with `npm run start:network`.
4. To start it automatically when the mini PC boots, install the optional, machine-specific `mini-pc-dashboard.service` file (kept locally and excluded from Git):

```bash
sudo cp mini-pc-dashboard.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now mini-pc-dashboard
```

Check its status with `systemctl status mini-pc-dashboard`. The service is configured for this project path and the current NVM Node path; update `User`, `WorkingDirectory`, `PATH`, and `ExecStart` in `mini-pc-dashboard.service` if those paths differ on another machine.

No extra permissions are required — `lsblk` and `df` are readable by any user.
