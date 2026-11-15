# Guía de recursos del curso — Desarrollo de Aplicaciones Web (DSAW)

Universidad de La Sabana · 2026-II · Prof. Juan David Murillo · Syllabus: https://dsaw-syllabus.vercel.app
Última actualización: 2026-11-14.

> **Para Claude:** lee ESTE archivo primero. Abre un archivo de detalle solo cuando la tarea lo necesite.
> Los PDF originales están en `docs/materiales/pdf/`; nunca los leas si existe el texto en `docs/materiales/texto/`.

## 1. Mapa de archivos

| Archivo | Qué contiene | Cuándo abrirlo |
|---|---|---|
| `docs/curso/proyecto.md` | Restricciones, hitos M1–M3, rúbricas, checklist final | Cualquier decisión de alcance o entrega |
| `docs/curso/calificacion.md` | Pesos por corte, regla de despliegue, **política de IA** | Antes de entregar algo |
| `docs/curso/cronograma.md` | 32 sesiones: tema, laboratorio, preparación | Para saber qué técnica se vio y cuándo |
| `docs/curso/tareas.md` | HW00–HW15: entregables, rúbrica, capa 2, log de IA | Cuando una parte del proyecto coincide con una tarea |
| `docs/curso/notas-notion.md` | Notas de clase de Notion resumidas | Metodología, Git, HTTP, JWT, pruebas |
| `docs/materiales/texto/NN-*.md` | Texto extraído de cada PDF (con marcas de página) | Solo si el resumen de abajo no basta |

## 2. Reglas del curso que afectan TODO el proyecto
- **Lo no desplegado no se califica.** Frontend en GitHub Pages (M1, M2); app completa en Vercel (M3).
- **Política de IA (3 capas):** construir (IA permitida, documentada) → extensión que exige entender → **AI Usage Log** (prompt, respuesta, qué cambié y por qué). Mantener `docs/ai-log.md` durante todo el proyecto.
- "Si se entregan trabajos hechos por IA, una IA los calificará"; todo trabajo puede ser llamado a **sustentación**; Demo Day con Q&A **sin notas**. → El equipo debe entender cada línea.
- Dos trabajos iguales = 1.0 para ambos. Entrega tardía (≤24 h) se califica sobre 60%. Entregas hasta las 11:59 PM.
- Equipos de 4, fijos todo el semestre. Historial de commits real de **varios miembros** (se califica).
- Quiz de entrada de 5 min en cada clase sobre la preparación (sin IA).

## 3. Lo que el profesor pide en cuanto a metodología
- **Spec-Driven Development:** requisitos → especificación → validación → implementación → pruebas.
- **BMAD + OpenSpec** (demo: https://juancho20sp.github.io/bmad-openspec-demo/). Roles: PO pregunta todo al stakeholder → planear → diseñar → repartir → construir → revisa el humano.
- **"grill-me":** la IA pregunta hasta tener el mismo contexto antes de implementar.
- **Contrato de integración** front ↔ back (nombres exactos de campos, payloads, códigos de estado), documentado con **Swagger o Postman**.
- **Inventario antes de pedir a la IA** (qué tengo / qué necesito / cómo) para ahorrar tokens.
- **Historias de usuario** con criterios de aceptación; tickets con Summary, AC y DoD.
- Ramas: nunca trabajar en main; PR + code review antes de merge (Gitflow o Trunk-Based).

## 4. Temas por capa del proyecto

Formato: tema → fuentes → lo que hay que aplicar en el proyecto.

### 4.1 Planeación y colaboración (M1)
- **Git / GitHub / Classroom** → PDF `00`, Notion (Git, Branching), cronograma Sem 01, HW00–HW01.
  Aplicar: repo del equipo, ramas por feature, PRs, commits pequeños y frecuentes de todos.
- **Historias de usuario** → PDF `01`. Iniciativa → épica → historia → subtareas. Formato "Como [rol], quiero [acción] para [beneficio]" + criterios de aceptación. Incluye requisitos funcionales y no funcionales (seguridad, rendimiento, usabilidad, mantenibilidad).
- **Problem statement + justificación web** → `proyecto.md` (30 pts de M1).
- **UX + Figma** → cronograma Sem 04, HW04. Wireframes de TODAS las pantallas, ≥1 anotada; guardar evolución en Figma.

### 4.2 Frontend estático (M1)
- **HTML semántico** → PDF `02`, Sem 02, HW02. header/nav/main/section/article/footer, jerarquía de headings, formularios con label, aria-*, alt.
- **CSS** → PDF `03`, Notion (Clase CSS), Sem 03, HW03. Selectores, **especificidad** (tema de examen), box model, Flexbox, Grid, mobile-first.
- **Tailwind + Vite** → Sem 04, HW04.
- **JavaScript base + DOM** → PDFs `04`, `05`, Sem 05, HW05. const > let, nunca var; scope; hoisting; querySelector, textContent (no innerHTML con datos del usuario), classList, createElement, addEventListener, delegación, validación de formularios sin librerías.

### 4.3 Frontend React (M2)
- **JS intermedio / ES6+** → Sem 06, HW06. map/filter/reduce, destructuring, spread, módulos, `?.`, `??`.
- **Asincronía** → PDF `06`, Notion (JS), Sem 07, HW07. Event loop, call stack, microtareas, promesas, async/await, fetch con estados loading/error, localStorage.
- **React** → PDF `07`, Notion (REACT, Frameworks), Sem 08–10, HW08–HW10. Componentes, JSX, props, keys, render condicional, useState (inmutable), useEffect (dependencias + cleanup), **custom hook**, React Router v6 (≥3 rutas, 1 dinámica con useParams, ruta protegida), componentes ≤80 líneas, ESLint sin warnings, React Context.

### 4.4 Backend (M3)
- **APIs y REST** → PDF `08`, Notion (Arquitectura Cliente-Servidor), Sem 11. API = contrato; REST sin estado; planear con OpenAPI; documentar. Códigos de estado correctos (200/201/400/401/403/404/500).
- **Express** → PDF `09`, Sem 11, HW11. `express.Router()` por recurso, controladores, `req.params`, `res.json()`, middleware de error, patrón MVC. Deploy en Vercel.
- **MongoDB + Mongoose** → Sem 12, HW12. Schemas con validación para cada entidad, CRUD, populate, referencias vs embebidos. Sin datos en memoria.

### 4.5 Integración, auth y seguridad (M3)
- **Integración** → Sem 13, HW13. CORS, `.env`, reemplazar mocks por llamadas reales.
- **JWT + bcrypt** → PDF `10`, Notion (JWT), Sem 13, HW13. Detalles clave del PDF:
  - Registro: `bcrypt.hash(pass, 12)`; login: `bcrypt.compare` y `jwt.sign({sub, role}, JWT_SECRET, {algorithm:"HS256", expiresIn:"15m", issuer, audience})`.
  - Middleware `authenticate` (Bearer, `algorithms:["HS256"]` fijado, valida iss/aud → 401) + `authorize(...roles)` → 403.
  - Mismo mensaje de error en login fallido; payload sin datos sensibles (Base64 no cifra); secreto ≥256 bits en variable de entorno; refresh token opcional; nunca el token en la URL; rate limiting en `/login`; helmet.
  - Ataques: `alg:none`, RS256→HS256, secreto débil.
  - **Los permisos por rol se aplican en el backend** (25 pts de M3).
- **TypeScript** → Sem 14, HW14. Tipar rutas Express y componentes React, sin `any`.
- **Seguridad** → Sem 15, HW15. XSS, CSRF, NoSQL injection, sanitizar entradas, HTTPS, helmet (25 pts de M3).
- **Pruebas** → Notion (Pruebas Unitarias). Pirámide: muchas unitarias (AAA, mocks), algunas de integración, pocas E2E; smoke con `/health`; cada bug corregido trae su prueba.

### 4.6 Despliegue y Demo Day
- **Vercel full-stack + GitHub Actions CI** → Sem 15. Front y API en el mismo dominio, variables de entorno en producción.
- **Demo Day** → `proyecto.md`. 5 min de demo en vivo de las 3 funcionalidades, 5 min de arquitectura (árbol de componentes, API, schema de BD), 2 min de Q&A.

## 5. Stack que se debe usar (según el curso)
HTML/CSS/JS → Tailwind + Vite → React + React Router v6 → Express.js → MongoDB Atlas + Mongoose → JWT + bcrypt → TypeScript → helmet → Vercel + GitHub Actions. Herramientas: VS Code (Prettier, GitLens, Thunder Client, Live Share), Figma, Swagger/Postman.

## 6. Pendientes / dudas
- Las "notas de grupo" no están en la página de Notion del curso: ¿dónde están?
- Notion menciona una propuesta de "mantenimiento de vías rurales"; confirmar si el proyecto es **CONECTA NEGOCIO** u otro.
- Confirmar con el equipo: ¿Gitflow o Trunk-Based?
