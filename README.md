# WorkDrive Video Viewer

A React + Vite video viewer with scrollable filename tabs and media controls. Add a WorkDrive external-share folder link using the ⚙ Settings button. The app lists video files in the shared folder and plays their WorkDrive direct-download links, including seeking when Range requests are available.

## Run locally

```bash
npm install
npm run dev
```

| Script | Purpose |
|---|---|
| `npm run dev` | Vite development server and WorkDrive listing middleware |
| `npm run build` | Build the client into `dist/` |
| `npm run preview` | Preview the built client with WorkDrive listing middleware |
| `npm run lint` | ESLint |
| `npm test` | Unit tests |

## Configure a folder

1. Open ⚙ Settings.
2. Paste the WorkDrive external folder share URL, for example `https://workdrive.zohoexternal.in/external/<share-token>`.
3. Save. Video filenames appear as tabs. Select one to play.

The share URL is stored in this browser's local storage. WorkDrive guest credentials are fetched per request by the server and are not saved. Empty the setting to use `public/videos.json` instead.

## Deploy to GitHub Pages

The repository deploys automatically to GitHub Pages when changes are pushed to `master`. The workflow builds the Vite app with the `/videodrive/` base path and publishes `dist/`.

Enable **Settings → Pages → Build and deployment → Source → GitHub Actions** in the repository if Pages is not already configured. After the workflow completes, the site is available at:

`https://dancerprince.github.io/videodrive/`

GitHub Pages is static hosting and cannot run the WorkDrive folder-listing middleware. The deployed site can display videos from `public/videos.json`, but entering an external-share folder URL will not list its videos until the listing proxy is hosted separately (for example, as a serverless function) and the app is configured to use that service.

## Limitations

- Zoho's external-share guest API is undocumented and may change.
- The WorkDrive integration needs the Vite server middleware (`npm run dev` / `npm run preview`) or a separately hosted server/serverless equivalent.
- Only files directly inside the shared folder are currently listed (not nested subfolders).
