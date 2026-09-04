# Epic Vibes Hub

The name of the brand is Epic Entertainment, it shouid be Nigerian user, and we have a dance team under the brand called Creative Dance Team.

Epic Entertainment is mainly an entertainment and party brand. We organize and host different types of events such as:

• Pool parties

• Beach parties

• Apartment parties

• Hangout parties

• Club/night events

• Themed parties and other social events

We can also be booked by individuals, groups, brands or organizations to plan and host parties/events for them.

Creative Dance Team is part of the entertainment side of Epic Entertainment. We can provide dancers and dance performances for parties, events, music videos, weddings, clubs and other occasions. We can also offer dance classes and choreography.

For the website/app, I want people to be able to:

• See upcoming Epic Entertainment events

• View event flyers, photos and videos from previous events

• Buy event tickets online

• Book Epic Entertainment to organize/host their own party

• Book Creative Dance Team for performances

• Make enquiries and contact us directly

• Book dance classes or choreography sessions

• See our different event packages and services

• Make payments or deposits online

• See reviews/testimonials from people who have attended or booked us

• View our social media pages

• Join our mailing/notification list for upcoming events

I would also like an admin dashboard where I can manage events, ticket sales, bookings, clients, payments, dancers, photos, videos and other content.

The main purpose of the website/app is to make Epic Entertainment look professional, attract more customers, increase ticket sales, make it easier for people to book our services, and give us one official platform where people can see everything we do.

The design should be modern, youthful, energetic, stylish and party-focused, with plenty of photos and videos from our events.

I also want the platform to be built in a way that we can add more features in the future, such as VIP/table bookings, event sponsorships, merchandise, dance courses and other entertainment services

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://epic-vibe-hub.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/e838f6bf-66f9-47b8-b498-3a3c12fcb783).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## Self-hosting with Node.js (e.g. Spaceship)

The default `npm run build` targets Lovable hosting. To produce a Node.js
server bundle instead:

```sh
npm install
npm run build:node   # outputs a Node server to .output/
npm run start        # runs node .output/server/index.mjs
```

Hosting panel settings:

- **App root:** the project folder
- **Node version:** 20 or newer
- **Build command:** `npm install && npm run build:node`
- **Start command:** `node .output/server/index.mjs` (or `npm run start`)
- **Port:** the server listens on the `PORT` environment variable automatically

Required environment variables (set them in your hosting panel):

- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_PROJECT_ID`

Note: the database, authentication and file storage stay on the managed
backend — self-hosting only moves the web server.
