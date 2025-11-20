# careercrm

this is a serverless web application that automatically tracks job applications by analyzing my gmail inbox.

## what it does

- scans inbox for application updates
- analyzes email content (using gemini ai)
- updates application status automatically
- runs entirely in the browser

## why i built this

manually updating a spreadsheet every time i get a rejection email is annoying. i wanted to remove the friction and see if i could build a fully client-side tool that handles sensitive data (emails) securely without a backend.

## features

- automatic email analysis
- kanban-style board
- recruiter contact management
- application stats + response rates
- client-side only (localstorage)
- secure oauth 2.0 with gmail

## configuration

since this runs on your own data, you need your own keys. on first launch, it will ask for:

1. **analysis key**: from [google ai studio](https://aistudio.google.com/app/apikey) (for the parsing logic)
2. **oauth client id**: from [google cloud console](https://console.cloud.google.com/) (to read your gmail)
   - enable the gmail api
   - configure oauth consent screen
   - create oauth 2.0 credentials for a web application
   - add `http://localhost:5173` to authorized javascript origins

## security

- all keys stored in browser's `localStorage`
- no backend server so fully client-side
- emails processed locally in browser
- oauth tokens handled by google's official library

## tech stack

- react 18 + typescript
- vite
- tailwindcss
- google gmail api
- google generative ai sdk

## license

MIT
