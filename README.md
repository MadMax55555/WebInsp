# WebInsp

> Save, tag, and present web design references — turn inspiration into client-ready project collections.

WebInsp is a local-first full-stack tool for freelancers and web agencies. It solves a specific workflow problem: you find great websites constantly, but when a client meeting comes around, your bookmarks are scattered and contextless. WebInsp gives you a structured library of inspirations with tagging, search, and — most importantly — **project collections** where you discuss each reference with your client, decide what to keep or remove, and document the reasoning that shapes the new project.

***

## Why It Exists

Every web project starts with a conversation: *"What kind of site do you have in mind?"* That conversation is clearer when you can show, not just describe. WebInsp lets you:

- **Build a personal reference library** over time, tagged and searchable
- **Create a collection per project** — pick the references that are relevant for that client
- **Present and iterate together** — mark each reference keep or remove, add a note explaining why, and arrive at a final agreed-upon inspiration set that guides the design direction

The collection is not just a mood board. It's a documented decision trail between you and your client.

***

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + Vite |
| Backend | Django + Django REST Framework |
| Database | SQLite (local) |
| Proxy | Vite dev proxy → Django API |

***

## Features

- **Save showcases** — URL, title, description, tags
- **Browse library** — filterable grid UI with search and tag filters
- **Showcase drawer** — open details, visit the source site, manage collection membership
- **Collections** — group showcases into project-specific collections linked to a client
- **Client review mode** — per-showcase keep / remove status + free-text note explaining the decision
- **Tag management** — create and delete tags to keep the library organized

***

## Run Locally

### Requirements

- Python 3
- pip
- Node.js
- npm

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on Vite and proxies `/api` requests to the Django backend at `localhost:8000`.

***

## Screens

### Showcases

The main library view. Every saved website is shown as a card with its thumbnail, title, domain, description, and tags. Select multiple cards to bulk-add them to a collection.
<img src="screenshots/showcases.png" alt="Showcases screen" width="850" />


### Collections

Each collection represents a client project. Open a collection to see all its referenced showcases, read and write client notes per showcase, and mark each one as **kept** or **removed**. The final set of kept references becomes the agreed-upon design inspiration for the project.
<img src="screenshots/collections.png" alt="Collections screen" width="850" />


***

## Collection Workflow

```
1. Save showcases to your library over time
2. Start a new project → create a collection, add the client name
3. Pull in relevant showcases from the library
4. Present the collection in the client meeting
5. For each showcase, discuss → mark Keep or Remove → add a note
6. The kept showcases + notes become the project's design brief reference
```


