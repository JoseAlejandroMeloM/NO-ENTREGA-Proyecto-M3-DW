# Notas de clase (Notion)

Fuente: página Notion "🌐 Desarrollo Web" y subpáginas — leído 2026-11-14. Resumen; ver el original para imágenes.
Página raíz: https://app.notion.com/p/3ae63934d27b804e8364ff64ab6b69b4

## Lo que el profesor exige o recomienda para el proyecto (lo más importante)
- **Spec-Driven Development (SDD):** requisitos → especificación → validación → implementación → pruebas. Definir *qué* antes del *cómo*.
- **BMAD + OpenSpec** para el trabajo full-stack en equipo. Demo del profesor: https://juancho20sp.github.io/bmad-openspec-demo/
- **Skill "grill-me":** que la IA haga preguntas hasta saber lo mismo que tú antes de implementar (también para historias de usuario).
- **Documentación siempre lista.**
- **Contrato de integración** para que varias personas trabajen en simultáneo: nombres exactos de campos, datos mínimos (p. ej. crear usuario: nombre, apellido, cédula), formato de request/response. Una mayúscula distinta rompe el contrato. Documentar con **Swagger o Postman**.
- **Todo desplegado en Vercel.**
- **Seguridad:** autenticación con tokens; sanitizar entradas (programación defensiva: trim de espacios, validar tipos, limitar longitud — "pegar El Quijote en el campo nombre").
- **Inventario antes de pedirle a la IA:** listar funciones/componentes/elementos en un .md para ahorrar tokens; buen desarrollo con IA = ¿Qué tengo? → ¿Qué necesito? → ¿Cómo hacerlo?
- `CLAUDE.md` = las reglas/la "conciencia" del proyecto para la IA.
- **Trinidad del proyecto:** alcance, cronograma, costo → objetivo: calidad. Trabajo en sprints.

## Git y ramas (Presentación: Estrategias de Branching)
- Commit = delta entre dos versiones; un commit por cada cambio que funcione.
- Rama = copia del repo en un punto; nadie trabaja directo en main. Merge a main después de un PR.
- **Gitflow:** ramas permanentes (main/develop) + temporales (feature/release/hotfix). Organizado, releases planificadas; riesgo de ramas largas con conflictos.
- **Trunk-Based:** main siempre desplegable, ramas cortas, PR + code review, CI/CD, feature flags. Menos conflictos; exige disciplina en la revisión.
- Pregunta de parcial: **despliegue** (subir a infraestructura, puede estar inactivo) vs **lanzamiento** (anunciar la feature).
- Hotfix = PR que resuelve un único problema sobre main.
- **Elementos de un ticket:** Summary, AC (criterios de aceptación), DoD (definición de terminado).

## IA en el desarrollo (Presentaciones: Agents/Skills/Harness, BMAD)
- Agente: percibe → decide → actúa, en ciclo. Skill: carpeta de instrucciones reutilizable que se activa por contexto. Harness: lo que da permisos y herramientas (archivos, navegador, APIs).
- BMAD: la IA organizada como equipo (investiga → organiza → diseña → reparte → construye front/back → revisa el humano). Entender → Planear → Construir → Revisar. Todo queda por escrito; no reemplaza el criterio humano.

## Arquitectura cliente-servidor y HTTP (Corte III)
- Códigos: 2xx ok (200 OK, 201 creado) · 3xx recurso en otro lugar · 4xx error del cliente (400 input, 403 sin permiso, 404 no existe) · 5xx error del servidor (500, 502).
- Responder con el código correcto + mensaje claro (404 "user not found", no 200 "error").
- Métodos: GET leer · POST crear · PUT modificar · DELETE borrar = CRUD sobre entidades del dominio.
- Endpoint = método + BASE_URL + ruta, p. ej. `GET /api/users/:id`.

## JWT y seguridad HTTP (Corte III)
- Sesiones (stateful, cookie) vs tokens (stateless, el servidor solo verifica la firma; escala a varios servidores, revocar es difícil).
- JWT = HEADER.PAYLOAD.SIGNATURE. Base64 **no es cifrado**: el payload es público; la firma da autenticidad e integridad.
- Claims: iss, sub, aud, exp, iat. HS256 = un secreto compartido.
- Ataques: `alg: "none"`, confusión RS256→HS256.
- **Sal** en el hash de contraseñas (bcrypt), distinta por usuario.

## Pruebas (Corte III: Pruebas Unitarias)
- Tipos: unitarias, integración, E2E, regresión, smoke (app arranca, home carga, login responde, `/health` conecta a la BD), sanity, UAT, rendimiento, seguridad.
- Pirámide: muchas unitarias rápidas (<0.5 s, patrón AAA: Arrange-Act-Assert, mocks para dependencias externas), algunas de integración, pocas E2E (Playwright/Cypress) solo para flujos críticos.
- Regla de oro: cada bug corregido trae una prueba que lo reproduce. Funciones que retornan algo son más fáciles de probar.

## Frontend
- **CSS:** box model (content, padding, border, margin); id = único, clase = estilos compartidos. Examen: especificidad (inline > id > clase/atributo/pseudoclase > elemento/pseudoelemento).
- **HTML:** localhost 127.0.0.1, DNS, puertos; HTML semántico.
- **JS:** arrays, programación declarativa/funcional, arrow functions (return implícito vs explícito), JS es de un solo hilo → event loop y asincronía. Taller Pokédex (pokeapi.co): fetch + async/await, buscar por id o nombre, manejo de errores, sanitizar entrada.
- **Frameworks:** framework (reglas, boilerplate) vs librería (React es librería).
- **React:** SPA; React Router mapea URL → componente (`/users` → `Users.jsx`), NavLink evita recargar; render/re-render, React.memo, props vs state, useEffect, Context; atomic design.

## Otros
- Propuesta de proyecto anotada: seguimiento del mantenimiento de vías rurales (JAC, veredas, municipio). Puede no ser el proyecto final; confirmar.
- Herramientas IA del día a día: Fireflies (transcribir reuniones).
- Notas de grupo: no están dentro de esta página de Notion.
