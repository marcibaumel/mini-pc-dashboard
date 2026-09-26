This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app), showing a live storage dashboard for a Linux/Ubuntu mini PC.

## What it does

- `GET /api/storage` runs `lsblk` and `df` on the host and returns disk/filesystem usage as JSON.
- The dashboard (`/`) polls that endpoint every 15 seconds and renders:
  - Total/used/free capacity summary cards
  - Per-mount usage bars (`/`, external drives, etc.)
  - A tree of physical disks and their partitions (model, transport, size)
- On non-Linux machines (e.g. this dev machine on Windows), or if `lsblk`/`df` aren't available, it falls back to sample data so the UI can still be developed/previewed.

## Getting Started

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Deploying on the mini PC (Ubuntu)

1. Copy this project to the mini PC and install dependencies: `npm install`
2. Build for production: `npm run build`
3. Start it: `npm start` (defaults to port 3000)
4. Optionally run it as a systemd service or with `pm2` so it survives reboots, e.g.:

```bash
pm2 start npm --name mini-pc-dashboard -- start
pm2 save
```

No extra permissions are required — `lsblk` and `df` are readable by any user.
