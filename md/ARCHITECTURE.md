# Architecture

React/Vite video viewer. The app accepts a WorkDrive **external-share folder link** in Settings, lists the folder's videos, and uses WorkDrive's direct-download URLs as `<video>` sources. A small same-origin Vite middleware reproduces the guest session created by the WorkDrive share page; no API keys or OAuth credentials are required.

```
public/
  videos.json                   # optional local fallback catalog
server/
  workdriveFolderProxy.js       # dev/preview server: guest session + folder listing
src/
  App.jsx                       # layout: video tabs + player + settings
  components/                   # SettingsDialog, VideoTabs, VideoPlayer
  hooks/useFolderSetting.js     # persist chosen share link
  hooks/useVideoCatalog.js      # loading/error state
  services/videoCatalog.js      # proxy/static catalog requests + validation
  lib/
    workdriveFolder.js          # parse links and API listings
    workdriveUrl.js             # public WorkDrive share URL conversion
    videoSource.js              # classify and validate media URLs
```

## External-share flow

1. The user pastes `https://workdrive.zohoexternal.in/external/<share-token>` in Settings. The URL is saved locally in the browser.
2. The client requests `/folder-listing?url=...` on the app server.
3. The server validates the URL host/path, loads the WorkDrive share page, extracts its current guest token/resource ID and cookies, and uses those in WorkDrive's guest API request. Credentials are held in memory for the request and never returned to the client or written to disk.
4. The server returns the listing JSON. The client keeps video extensions and uses each WorkDrive `download_url` as the video source. Those links support HTTP Range requests, enabling seek/scrub.
5. The video file names appear as tabs; selecting a tab plays that video.

## Settings and fallback

- External share folders: `https://workdrive.zohoexternal.<dc>/external/<token>`.
- Older public folders: `https://workdrive.zohopublic.<dc>/folder/<id>`.
- Empty Settings value: load the optional `public/videos.json` fallback catalog.
- Folder listing currently includes videos directly inside the shared folder; subfolders are not recursively traversed.

## Runtime and deployment

`server/workdriveFolderProxy.js` is registered as middleware in Vite development and preview. It is not included in `dist/`; a production deployment needs an equivalent server/serverless endpoint. WorkDrive's external page/API are undocumented implementation details, so Zoho changes can break this integration. Guest access must be enabled for the share URL.
