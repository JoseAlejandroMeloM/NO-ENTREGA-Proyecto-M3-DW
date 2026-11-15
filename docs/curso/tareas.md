# Tareas (HW00–HW15)

Fuente: https://dsaw-syllabus.vercel.app/homeworks — cada tarea construye una parte del proyecto. Autocalificación en GitHub Classroom: Structure 20 · Quality 20 · Deploy 20 · Criteria 40.

> Regla: si una tarea no está desplegada públicamente, no se califica.

## HW00 · Sem 0 · GitHub Fundamentals (github-pages)

**Objetivo:** Set up your development environment, create your GitHub account, and accept your first GitHub Classroom assignment. By the end you will have made your first commit and pushed to a remote repository.

**Entregables:**
- `README.md` — Your name, the link to your GitHub profile, and one sentence about what you want to build this semester.
- `hello.txt` — A plain-text file containing "Hello, GitHub!" — proof that you can create, commit, and push a file.

**Rúbrica (Criteria):**
- README.md present with name, GitHub profile link, and semester goal — 10 pts
- hello.txt present with correct content — committed and pushed (not just created in the UI) — 10 pts
- Commit history shows at least 2 meaningful commits (not just one "initial commit") — 5 pts

**Capa 2 (extensión):** Add a `.gitconfig` snippet to your README showing the `user.name` and `user.email` settings and explain why they matter for commit authorship.

**Log de IA:** Did you use AI to understand any git command? Paste the exact command, the AI explanation, and whether it matched what actually happened.

GitHub Classroom: https://classroom.github.com/a/wkoxIyzJ

## HW01 · Sem 1 · Team README & Project Kickoff (github-pages)

**Objetivo:** Form your team, choose the problem you will solve this semester, and argue why it deserves a web application.

**Entregables:**
- `README.md` — Problem statement, web app justification, target users, 3+ user stories, team roles.
- `index.html` — GitHub Pages landing page introducing the project.
- `figma-link.txt` — Link to Figma wireframe sketch with at least one annotated screen.

**Rúbrica (Criteria):**
- Problem identifies a real, specific user and an unsolved need — 15 pts
- Web-app justification rules out simpler alternatives (spreadsheet, existing tool) — 10 pts
- 3+ user stories in As-a / I-want / So-that format — 10 pts
- Figma sketch has at least 1 annotated screen with element labels — 5 pts

**Capa 2 (extensión):** The Figma sketch must show at least one screen with annotations explaining what each element does.

**Log de IA:** Did you use AI to write user stories or the problem statement? Document the prompt, what changed, and why.

GitHub Classroom: https://classroom.github.com/a/ldLXoPBi

## HW02 · Sem 2 · Semantic HTML (github-pages)

**Objetivo:** Build the HTML skeleton of your project's landing page using semantic HTML only — no CSS, no JavaScript.

**Entregables:**
- `index.html` — Landing page skeleton using semantic HTML5 elements throughout.
- `about.html` — About page with team info linked from the landing page.

**Rúbrica (Criteria):**
- Correct semantic elements used (header, nav, main, section, article, footer) — no div soup — 15 pts
- Heading hierarchy is logical (h1 → h2 → h3, no skips) — 10 pts
- W3C validation passes with no errors — validation.png in repo root — 15 pts

**Capa 2 (extensión):** Validate the HTML with the W3C validator. Paste the validation report as a screenshot in the repo root named `validation.png`.

**Log de IA:** Did you ask AI which semantic element to use for a specific section? Include the exact question and the element you actually ended up using.

GitHub Classroom: https://classroom.github.com/a/AEBN5VKN

## HW03 · Sem 3 · CSS Fundamentals (github-pages)

**Objetivo:** Style your project's landing page with CSS and make it responsive — no libraries.

**Entregables:**
- `styles/main.css` — Base styles — typography, colors, layout.
- `styles/responsive.css` — Responsive rules for mobile (< 640px) and tablet (640–1024px).

**Rúbrica (Criteria):**
- Flexbox or Grid used for layout — no float, no tables — 10 pts
- Mobile-first breakpoints at < 640px and 640–1024px with meaningful differences — 15 pts
- CSS-only accordion using :target selector works without any JavaScript — 15 pts

**Capa 2 (extensión):** Implement a CSS-only accordion (no JavaScript) for the FAQ section using the :target selector.

**Log de IA:** Did you use AI to fix a specificity conflict or a layout issue? Describe what the conflict was and what the AI explained.

GitHub Classroom: https://classroom.github.com/a/FWme_kqD

## HW04 · Sem 4 · UX + Tailwind CSS (github-pages)

**Objetivo:** Create complete wireframes for your project in Figma and rebuild the landing page with Tailwind CSS, including a working dark mode toggle.

**Entregables:**
- `index.html` — Landing page rebuilt with Tailwind CSS utility classes.
- `figma-link.txt` — Link to completed Figma wireframes for all project screens.

**Rúbrica (Criteria):**
- All project screens wireframed in Figma with consistent visual style — 15 pts
- Tailwind utility classes used throughout — no custom CSS for layout or spacing — 10 pts
- Dark mode toggle saves preference to localStorage and restores it on reload — 15 pts

**Capa 2 (extensión):** The dark mode toggle must save the user's preference in localStorage and respect it on page reload.

**Log de IA:** Did you use AI to pick a Tailwind color palette? Show the palette it suggested and explain what you changed.

GitHub Classroom: https://classroom.github.com/a/Aq0m_gp3

## HW05 · Sem 5 · JavaScript Fundamentals (github-pages)

**Objetivo:** Add real interactivity to your project page using vanilla JavaScript — no libraries, no frameworks.

**Entregables:**
- `js/main.js` — Main script — DOM manipulation, event listeners, form validation.
- `js/validation.js` — Client-side validation module — all validation logic isolated here.

**Rúbrica (Criteria):**
- All form fields validated client-side with visible inline error messages — 15 pts
- Real-time search/filter works on a list of 5+ items — updates on every keystroke — 15 pts
- Zero dependencies — vanilla JS only, no jQuery or utility libraries — 10 pts

**Capa 2 (extensión):** Implement a real-time search/filter on any list on the page (at least 5 items) using only vanilla JS.

**Log de IA:** Did you use AI to help with a specific DOM selector or event listener? Paste the original AI code and your final version with the differences highlighted.

GitHub Classroom: https://classroom.github.com/a/A_aqbTKL

## HW06 · Sem 6 · JavaScript Intermediate (github-pages)

**Objetivo:** Demonstrate command of modern array methods by building a filterable list UI over a real dataset.

**Entregables:**
- `index.html` — Filterable list UI.
- `data.js` — Dataset with at least 20 items, each with 3+ properties.
- `app.js` — All rendering done with map/filter/reduce — no for loops.

**Rúbrica (Criteria):**
- All rendering done exclusively with map / filter / reduce — zero for loops in app.js — 15 pts
- Sort toggle (A→Z / Z→A + numeric) chains correctly with the active filter — 10 pts
- Dataset has 20+ items each with 3+ properties; all properties visible in the UI — 15 pts

**Capa 2 (extensión):** Add a sort toggle (A→Z / Z→A and a numeric sort) that chains with the active filter.

**Log de IA:** Describe a case where reduce() was the right tool. Did AI suggest reduce() or a for loop? Which did you use and why?

GitHub Classroom: https://classroom.github.com/a/s3gBXHgQ

## HW07 · Sem 7 · Async JavaScript (github-pages)

**Objetivo:** Build a mini-app that consumes a public API, handles all three states of an async request, and has an offline fallback using localStorage.

**Entregables:**
- `index.html` — App UI with loading, success, and error states visible.
- `api.js` — All fetch logic isolated here — async/await, error handling.
- `cache.js` — localStorage cache module — read and write last successful response.

**Rúbrica (Criteria):**
- Loading, success, and error states are visually distinct and rendered from component state — 15 pts
- localStorage cache shows last successful response when the fetch fails — 15 pts
- Retry button appears only in the error state and re-fetches without a page reload — 10 pts

**Capa 2 (extensión):** Add a "retry" button that appears only in the error state and re-triggers the fetch without refreshing the page.

**Log de IA:** Did AI help you write the error handling? Paste the AI code and describe what edge case it missed that you had to add yourself.

GitHub Classroom: https://classroom.github.com/a/o4fowY30

## HW08 · Sem 8 · React Introduction (github-pages)

**Objetivo:** Migrate the HW07 app to React, split it into components, and add a favorites feature.

**Entregables:**
- `src/` — React app (Vite). At least 5 components, each in its own file.
- `src/components/FavoritesList.jsx` — Renders saved favorites — persisted in localStorage.

**Rúbrica (Criteria):**
- App split into 5+ components, each in its own file with a single clear responsibility — 15 pts
- Favorites persist across page refresh and are removable one-by-one — 15 pts
- No class components — functional components with hooks only — 10 pts

**Capa 2 (extensión):** Favorites must survive a page refresh (localStorage) and must be removable one-by-one.

**Log de IA:** Did you use AI to convert vanilla JS code to React? Show the before/after for one function and explain what the AI got wrong.

GitHub Classroom: https://classroom.github.com/a/p0v4g0ty

## HW09 · Sem 9 · React State (github-pages)

**Objetivo:** Implement the main feature of your project in React with correct state and effect management.

**Entregables:**
- `src/` — React app. Main feature fully interactive — no mock data hardcoded in JSX.
- `src/hooks/useFeature.js` — Custom hook encapsulating the main feature's state and data fetching.

**Rúbrica (Criteria):**
- Custom hook encapsulates all state and data fetching for the main feature — 15 pts
- Hook used in at least 2 different components without duplicating logic — 10 pts
- No mock data hardcoded in JSX — all data flows through state or props — 15 pts

**Capa 2 (extensión):** The custom hook must be reusable — demonstrate it being used in at least 2 different components.

**Log de IA:** Did AI help you identify when to use useEffect vs when to compute during render? Explain the rule in your own words.

GitHub Classroom: https://classroom.github.com/a/TLb03b3B

## HW10 · Sem 10 · React Router + Architecture (github-pages)

**Objetivo:** Complete the frontend of your project with routing and a clean component architecture. This is Milestone 2.

**Entregables:**
- `src/App.jsx` — Routing with at least 3 routes, including 1 dynamic route with useParams.
- `src/components/` — No component over 80 lines — refactored and split.
- `ARCHITECTURE.md` — One paragraph describing the component tree and routing structure.

**Rúbrica (Criteria):**
- 3+ routes including 1 dynamic route using useParams that renders correctly — 15 pts
- Protected route redirects unauthenticated users (localStorage flag) to /login — 15 pts
- ARCHITECTURE.md present and accurately describes the component tree and routing — 10 pts

**Capa 2 (extensión):** Implement a protected route — navigating to it while "logged out" (localStorage flag) redirects to /login.

**Log de IA:** Did AI suggest a folder structure? Compare what it suggested with what you actually implemented and justify the differences.

GitHub Classroom: https://classroom.github.com/a/G7uTvfvZ

## HW11 · Sem 11 · Express REST API (vercel)

**Objetivo:** Design and implement the REST API for your project's backend. Design comes before code.

**Entregables:**
- `API-DESIGN.md` — Every endpoint documented: method, path, request body, response shape, status codes.
- `api/` — Express app with at least 4 endpoints covering the main resource. In-memory data (arrays) — no DB yet.
- `deployment.txt` — Vercel URL of the deployed API.

**Rúbrica (Criteria):**
- API-DESIGN.md documents every endpoint with method, path, request body, response shape, and status codes — 15 pts
- 4+ CRUD endpoints implemented and return correct status codes — 15 pts
- GET /resource accepts page and limit query params and returns totalPages in the response — 10 pts

**Capa 2 (extensión):** Add pagination to the GET /resource endpoint — page and limit query params, totalPages in the response.

**Log de IA:** Did you use AI to design the API? Show the spec it generated and explain every decision you changed.

GitHub Classroom: https://classroom.github.com/a/hEudpqLE

## HW12 · Sem 12 · MongoDB + Mongoose (vercel)

**Objetivo:** Add real persistence to your API using MongoDB Atlas and Mongoose.

**Entregables:**
- `models/` — At least 2 Mongoose models with field types, required rules, and validation.
- `api/` — All 4 CRUD endpoints now persisting to MongoDB — in-memory arrays removed.
- `deployment.txt` — Updated Vercel URL.

**Rúbrica (Criteria):**
- 2+ Mongoose models with required fields and validation rules — no bare strings — 15 pts
- All in-memory arrays removed; all 4 CRUD operations persist to MongoDB Atlas — 15 pts
- A Mongoose virtual or pre-save hook is working and its purpose is documented — 10 pts

**Capa 2 (extensión):** Implement a Mongoose virtual or pre-save hook — document what it does and why you chose it.

**Log de IA:** Did AI help you write a Mongoose query? Paste the query and explain each operator used.

GitHub Classroom: https://classroom.github.com/a/Du-JMA3V

## HW13 · Sem 13 · Full-Stack Integration + Auth (vercel)

**Objetivo:** Connect the React frontend to the Express + MongoDB backend, implement JWT authentication, and make both user roles work end-to-end.

**Entregables:**
- `api/auth/` — POST /register and POST /login endpoints. Passwords hashed with bcrypt.
- `api/middleware/auth.js` — JWT verification middleware protecting at least one route.
- `src/context/AuthContext.jsx` — React context storing the auth token, providing login/logout.
- `deployment.txt` — Vercel URL — both frontend and API must work.

**Rúbrica (Criteria):**
- POST /register and POST /login work — passwords hashed with bcrypt, never stored in plain text — 15 pts
- JWT middleware verifies the token and protects at least one route (returns 401 without valid token) — 15 pts
- AuthContext provides token + login/logout to the whole React app via context — 10 pts

**Capa 2 (extensión):** Implement token refresh: store the JWT expiry and silently redirect to /login if an API call returns 401.

**Log de IA:** Did AI write any of the JWT middleware? Identify the security implication it got wrong or missed entirely.

GitHub Classroom: https://classroom.github.com/a/JU0GDxZw

## HW14 · Sem 14 · TypeScript Migration (vercel)

**Objetivo:** Migrate key parts of your project to TypeScript and create a shared types file used by both frontend and backend.

**Entregables:**
- `src/types.ts` — At least 2 interfaces representing the main entities, imported by frontend and backend.
- `src/components/*.tsx` — 3 React components migrated to TypeScript — typed props, no any.
- `api/**/*.ts` — 2 Express route files migrated to TypeScript — typed req/res.
- `deployment.txt` — Updated Vercel URL. TypeScript build must work on Vercel.

**Rúbrica (Criteria):**
- Shared types.ts defines 2+ interfaces imported and used by both frontend and backend — 15 pts
- 3 React components and 2 Express route files typed — zero any, zero @ts-ignore — 15 pts
- Path aliases (@/types) configured in tsconfig.json and resolving correctly on Vercel — 10 pts

**Capa 2 (extensión):** Configure path aliases in tsconfig.json so imports read @/types instead of ../../types.

**Log de IA:** Did TypeScript catch any bugs you hadn't noticed? Describe them specifically. Which type was hardest to define?

GitHub Classroom: https://classroom.github.com/a/JqT0lJSg

## HW15 · Sem 15 · Security Audit + Final Deployment (vercel)

**Objetivo:** Audit your project's security and ensure the final Vercel deployment is stable and clean.

**Entregables:**
- `security-audit.md` — Completed security checklist (XSS, NoSQL injection, CORS, input validation, env vars, helmet) with justifications for each item.
- `deployment.txt` — Final Vercel URL — this is the URL used on Demo Day.

**Rúbrica (Criteria):**
- security-audit.md covers all 6 checklist items (XSS, NoSQL injection, CORS, input validation, env vars, helmet) with justifications — 15 pts
- express-rate-limit active on /register and /login — verified with a rapid-fire test — 15 pts
- Final Vercel URL responds on both frontend routes and API routes — 10 pts

**Capa 2 (extensión):** Add basic rate limiting to auth endpoints with express-rate-limit.

**Log de IA:** Did you use AI to identify vulnerabilities? Did it find anything you hadn't noticed? Which vulnerability was hardest to understand and fix?

GitHub Classroom: https://classroom.github.com/a/CXlOImpQ
