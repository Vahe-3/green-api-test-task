# Telegram Chat (GREEN-API)

A web chat for sending and receiving Telegram messages through [GREEN-API](https://green-api.com/telegram). It's styled like Telegram Web, with light and dark themes and a phone layout.

The test task asks for MAX and allows WhatsApp or Telegram instead. This version is built for Telegram.

## Features

- Sign in with a GREEN-API instance (`idInstance`, `apiTokenInstance`, `apiUrl`). The app checks that the instance is linked to Telegram.
- Start a chat by phone number or `@username`
- Send and receive text messages, with "sending / sent / delivered / read" status
- Messages you send from your own Telegram app also appear in the chat
- Photos, stickers and other media show as a placeholder (the app is text-only)
- Retry for messages that failed to send, with the reason on hover
- Chat list with search, last message and unread counters
- Chats are saved in the browser per instance
- Works in one browser tab at a time, so incoming messages aren't split between tabs. Opening the app in another tab pauses this one, with a **Use here** button to switch back.
- If GREEN-API stops accepting the credentials (for example, the token was changed), the app signs out and says why
- Light and dark theme, phone and desktop layouts

## Run locally

You need [Node.js](https://nodejs.org) 22.12 or newer.

```bash
npm install
npm run dev
```

Then open http://localhost:5173.

On Windows, if PowerShell says "running scripts is disabled on this system", use `npm.cmd` instead of `npm` (for example `npm.cmd run dev`), or run the commands in Command Prompt.

If port 5173 is already taken, Vite picks the next free one (5174, …), so check the address it prints. In demo mode the app shows a "Demo mode" note in the chat list.

| Command            | What it does                                                         |
| ------------------ | -------------------------------------------------------------------- |
| `npm run dev`      | Runs the app against GREEN-API                                       |
| `npm run dev:mock` | Runs it with a fake API: any credentials work and replies are echoed |
| `npm run build`    | Type-checks and builds into `dist/`                                  |
| `npm run preview`  | Serves the built app                                                 |
| `npm run lint`     | Runs the linter                                                      |

## Setting up GREEN-API

1. Sign up at [console.green-api.com](https://console.green-api.com).
2. Create an instance with the **Telegram: Developer** tariff (free).
3. Link your Telegram account: in the console click **Get QR**, then in the Telegram app open **Settings → Devices → Link Desktop Device** and scan it.
4. Wait until the instance shows as authorized.
5. Copy `idInstance`, `apiTokenInstance` and `apiUrl` from the instance page into the app.

To test both directions, message someone else, or a second account of yours, and reply from their Telegram app.

The app receives messages with GREEN-API's HTTP polling (`receiveNotification` / `deleteNotification`). That needs **no webhook URL** on the instance, and message **notifications turned on**. New instances start with all notifications off. The app detects this at sign-in and offers a **Turn them on** button, which calls `setSettings`. GREEN-API then restarts the instance, which can take up to 5 minutes, before you sign in again.

## How it works

| Step | GREEN-API method |
| --- | --- |
| Sign in | `getStateInstance` (must be `authorized`), `getSettings`, and `setSettings` if notifications are off |
| New chat | `checkAccount` turns a phone or `@username` into a `chatId` |
| Send | `sendMessage` |
| Receive | Long-polls `receiveNotification`, handles `incomingMessageReceived`, `outgoingMessageReceived` and `outgoingMessageStatus`, then calls `deleteNotification` |

Every request has a time limit, so a connection that hangs (for example after the computer wakes from sleep) is noticed and retried. Network errors are retried with a growing delay; a 401 or 403 answer means the credentials no longer work, so the app signs out instead.

## Project structure

```
src/
  api/            greenApi.ts (real client), mockApi.ts (demo), shared types
  store/          App state: reducer, React context, localStorage persistence, one-tab-at-a-time sync
  components/
    LoginPage/    Sign-in form
    Sidebar/      Menu, search, chat list, "new chat" button
    ChatWindow/   Header, message list, bubbles, message input
    NewChatDialog/
    ui/           Shared pieces: icons, avatar, menu, dialog, text field
  utils/          Phone and date formatting, helpers
  theme.ts        Light/dark theme
```
