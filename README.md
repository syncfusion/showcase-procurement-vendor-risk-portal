# showcase-procurement-vendor-risk-portal

Review supplier risk, onboarding, certificates, and contracts in one portal. Built with Syncfusion Charts, TreeGrid, Kanban, ListView, PDF Viewer, Document Editor, and AI AssistView.

This is a React showcase and ships with a bundled demo dataset.

## What you can do

| Page | Route | What it shows |
| --- | --- | --- |
| Risk Dashboard | `/` | KPI cards, risk and spend charts, and a filter bar for region, risk band, and period |
| Vendor Register | `/vendors` | Category hierarchy, vendor scores, score history, and certificates |
| Onboarding Approvals | `/approvals` | Kanban board for moving a vendor through review stages |
| Vendor Documents | `/documents` | PDF contracts and Word-style documents for the selected vendor |
| AI Assistant | `/ai` | Sample answers about risk, spend, expiring certificates, and the approval pipeline |

The assistant answers from the current session data for demo purpose. It does not call an external model.


## Stack

| Layer | Technology |
| --- | --- |
| UI | React 19, TypeScript, React Router |
| Components | Syncfusion React 35.1 |
| Styling | Syncfusion Tailwind 3 theme |
| Build | Vite 8 |
| Data | Local JSON fixture in `react/src/data/fixtures/` |

## Prerequisites

- [Node.js](https://nodejs.org/) 20.19 or later, or 22.12 or later
- npm (included with Node.js)
- A Syncfusion license key is optional. The app runs without one. A key removes the trial banner. Get a [community license](https://www.syncfusion.com/products/community-license) or a trial key from Syncfusion.

## Run the app

From the repository root:

```bash
cd react
npm install
```

Copy the environment file and, if you have a key, paste it into `VITE_SYNCFUSION_LICENSE_KEY`.

```bash
# macOS / Linux
cp .env.example .env

# Windows PowerShell
copy .env.example .env
```

Start the dev server:

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Production build

From the `react` folder:

```bash
npm run build
npm run preview
```

`npm run build` type-checks the project and writes the site to `react/dist`. `npm run preview` serves that folder at [http://localhost:4173](http://localhost:4173).

## License

Syncfusion components require a valid [Syncfusion license](https://www.syncfusion.com/products/community-license) for production use. This sample is a reference implementation.
