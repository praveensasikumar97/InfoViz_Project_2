# Case B (Gapminder Bubble Chart)

**Live:** [infoviz.praveensasikumar.com](https://infoviz.praveensasikumar.com) | **Local:** run `npm install` and then `npm run dev`, then open the localhost URL printed by Vite in your browser.

## Tech stack

| Item | Details |
|---|---|
| Frontend framework | **React 19** with **TypeScript** |
| Build tool | **Vite** |
| Styling | **Tailwind CSS 4** with a custom archival-atlas design system |
| UI utilities | **shadcn/ui** primitives included in the project template |
| Data files | Processed **CSV** and **JSON** based on the public Gapminder teaching dataset |

## Dependencies and setup

The project uses the dependencies already declared in `package.json`. No extra services, API keys, databases, or backend setup are required for the assignment submission.

To run the redesign locally:

```bash
npm install
npm run dev
```

After the server starts, open the local address printed by Vite in your browser.

## Submission contents

| Deliverable | Purpose |
|---|---|
| `README.md` | Documents the selected case, stack, and local run instructions |
| `src/` | Contains the frontend source code for the redesign |
| `data/` | Contains the processed dataset and metadata used in the redesign |
| `phase1_Structured Diagnosis.pdf` | Structured diagnosis for Case A and Case B |
| `phase3_Info Viz Project.pdf` | Self-contained design rationale and self-audit for the redesign |

## Notes on the redesign

The redesign keeps the same core Gapminder variables-**income**, **life expectancy**, **population**, **region**, and **year**-but changes the interface argument. Instead of relying on autoplay animation as the first reading mode, it opens with comparison-first small multiples, exposes the **log/linear** income-scale decision, and foregrounds a short methodological note about the five-year sampled dataset used in the implementation.
