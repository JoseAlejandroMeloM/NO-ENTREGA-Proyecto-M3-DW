# Cronograma (16 semanas · 32 sesiones · 3 módulos)

Fuente: https://dsaw-syllabus.vercel.app/schedule — leído 2026-11-14.
Formato: Sesión — Clase | Laboratorio | Preparación. "PDF" = material en `docs/materiales/pdf/`.

## Módulo 1 · Fundamentos (Corte 1)

### Sem 01 · Dev Environment, Git & Agile — PDF: 00-presentacion-del-curso, 01-historias-de-usuario
- S1 Course intro + tooling + Git — git init/add/commit/push | primer repo, README, GitHub Pages | "Git in 15 minutes" (Traversy)
- S2 GitHub collaboration + Agile — branches, PRs, merge conflicts, Scrum, user stories, backlog | equipos de 4, 3 historias de usuario, restricciones del proyecto | Agile Manifesto + documento de restricciones (Canvas)

### Sem 02 · Semantic HTML
- S3 Semantic HTML — header/nav/main/section/article/footer, jerarquía de headings | esqueleto HTML de la landing (sin CSS) | MDN HTML basics
- S4 Forms + accesibilidad — inputs, labels, aria-*, alt | formulario de contacto/registro | MDN Web forms

### Sem 03 · CSS Fundamentals — PDF: 02-fundamentos-desarrollo-web, 03-introduccion-css
- S5 Selectores, especificidad, box model, display | estilo base de la landing HW02 (sin frameworks) | Flexbox Froggy
- S6 Flexbox + Grid + responsive mobile-first | landing responsive | Grid Garden

### Sem 04 · UX + Tailwind CSS
- S7 UX + Figma — user flows, arquitectura de información, contraste, tipografía | wireframes de todas las pantallas | "Figma for developers"
- S8 Tailwind — utility-first, Tailwind + Vite, responsive/hover/dark | rehacer landing con Tailwind | Tailwind Core Concepts

### Sem 05 · JavaScript Fundamentals — PDF: 04-introduccion-javascript, 05-dom-manipulation
- S9 Variables, tipos, funciones, scope, hoisting, selectores DOM, createElement | contador de caracteres en textarea | MDN JS first steps
- S10 addEventListener, delegación, preventDefault, valores de formulario | validación de formulario en tiempo real (sin librerías) | javascript.info Bubbling and capturing

## Módulo 2 · Frontend (Corte 2)

### Sem 06 · JavaScript Intermediate — PDF: 07-frameworks-js
- S11 map/filter/reduce/find, destructuring, spread | dataset desordenado → lista limpia con métodos funcionales | javascript.info Array methods
- S12 ES6+: arrow, template literals, import/export, ?. y ?? | refactor sin var ni for tradicionales | javascript.info Destructuring

### Sem 07 · Async JavaScript — PDF: 06-asincronismo-javascript
- S13 DOM avanzado, insertAdjacentHTML, DocumentFragment, localStorage | to-do list persistente | MDN Using Promises
- S14 Promises, async/await, Fetch, manejo de errores, API pública | fetch con estados loading/error | MDN Fetch API

### Sem 08 · React Introduction
- S15 Por qué React, componentes, JSX, props | convertir HW07 a Vite + React, ≥3 componentes | react.dev Quick Start
- S16 Listas, keys, renderizado condicional | estados loading/success/error | react.dev Thinking in React

### Sem 09 · React State
- S17 useState, inmutabilidad, lifting state, controlados vs no controlados | formulario multi-paso con validación | react.dev State
- S18 useEffect, dependencias, cleanup, fetch al montar | reemplazar datos hardcodeados con fetch | react.dev Synchronizing with Effects

### Sem 10 · React Router + Architecture
- S19 React Router v6: BrowserRouter, Routes, Link, useParams, useNavigate, rutas anidadas | ≥3 rutas, 1 dinámica | React Router tutorial
- S20 Estructura de carpetas, extraer componentes, prop drilling, co-location | partir componentes >80 líneas, ESLint con 0 warnings | Kent C. Dodds folder structure

## Módulo 3 · Backend + Producción (Corte 3)

### Sem 11 · HTTP + Express.js — PDF: 08-introduccion-backend, 09-express-router
- S21 HTTP: métodos, status codes, headers, REST | diseñar spec de la API en papel | Fireship REST API concepts
- S22 Express: routing, middleware, req/res, error middleware, deploy en Vercel | API "Hello World" en Vercel con ≥2 rutas | Express Getting started

### Sem 12 · MongoDB + Mongoose
- S23 Documentos vs filas, colecciones, Atlas, Schema y Model | schemas Mongoose de todas las entidades con validación | guía Atlas (Canvas)
- S24 CRUD, validación, populate, referencias vs embebidos | API HW11 persistiendo en Atlas, sin mocks | Mongoose Getting started

### Sem 13 · Full-Stack Integration + Auth — PDF: 10-jwt
- S25 CORS, .env, reemplazar mocks por llamadas reales | conectar React con Express | Fireship JWT explained
- S26 Flujo de auth, bcrypt, jsonwebtoken sign/verify, middleware de rutas protegidas | register + login + ≥1 ruta protegida | MDN CORS

### Sem 14 · TypeScript
- S27 Tipos, interfaces, generics, strict, Vite | migrar un archivo de rutas Express a TS | TS in 5 minutes
- S28 Props tipadas, useState tipado, respuestas API tipadas | migrar un componente React a TS sin `any` | React & TS cheat sheet

### Sem 15 · Security + Full-Stack Deployment
- S29 XSS, CSRF, NoSQL injection, sanitización, HTTPS, helmet | auditoría con checklist HW15 | OWASP Top 10
- S30 Config Vercel, variables de entorno en producción, GitHub Actions CI | deploy full-stack en Vercel (front + API mismo dominio) | revisar requisitos del demo

### Sem 16 · Demo Day
- S31–S32 Presentaciones finales de 12 min: demo en vivo + arquitectura + Q&A del panel

## Stack que implica el curso
Git/GitHub · HTML semántico · CSS/Flexbox/Grid · Figma · Tailwind + Vite · JavaScript ES6+ · React (useState, useEffect, React Router v6) · ESLint · Express.js · MongoDB Atlas + Mongoose · JWT + bcrypt · TypeScript · helmet/OWASP · Vercel + GitHub Actions
