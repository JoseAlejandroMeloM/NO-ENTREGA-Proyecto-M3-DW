# Proyecto del curso

Fuente: https://dsaw-syllabus.vercel.app/project — leído 2026-11-14.
Un solo proyecto construido durante las 16 semanas. Equipos de ~4 (7 equipos, 26 estudiantes).

## Restricciones
- Resolver un problema real e identificable para un usuario objetivo concreto.
- Justificar por qué una app web (y no una hoja de cálculo, una herramienta existente o una app solo móvil).
- **Al menos 2 roles de usuario** con permisos distintos.
- **Al menos 3 funcionalidades principales** demostrables de punta a punta.
- No puede ser clon de una app grande (Twitter, Instagram, Netflix…).

## Hitos
| ID | Semana | Entregable | Evaluación |
|---|---|---|---|
| M1 | Sem 5 | Problem statement + wireframes Figma de todas las pantallas + prototipo estático HTML/CSS/JS en GitHub Pages | Examen escrito + entrega |
| M2 | Sem 10 | Frontend React funcional con mock data en GitHub Pages | Defensa oral de la arquitectura de componentes |
| M3 | Sem 15 | App full-stack (React + Express + MongoDB + JWT) en Vercel | Examen final escrito + verificación del deploy |
| Demo | Sem 16 | Demo en vivo (5 min) + arquitectura (5 min) + Q&A (2 min) | Panel: profesor + 1–2 invitados |

## Rúbricas (100 pts cada una)
**M1:** 30 problem statement (usuario real, problema, web justificada) · 30 wireframes Figma (todas las pantallas, estilo consistente, ≥1 anotada) · 25 prototipo navegable en GitHub Pages con HTML semántico · 15 historial de commits real de varios miembros.

**M2:** 20 componentes bien estructurados (ninguno >80 líneas) · 20 ≥3 rutas con 1 dinámica (useParams) + ruta protegida que redirige · 20 custom hook (explicar dependency array y cleanup) · 20 defensa oral (trazar bugs/estado en vivo) · 20 desplegado en GitHub Pages.

**M3:** 25 CRUD completo contra MongoDB Atlas sin datos en memoria · 25 JWT con 2 roles, permisos aplicados **en el backend** · 25 front + API en Vercel · 25 auditoría de seguridad (sin XSS ni NoSQL injection, helmet activo).

**Demo Day:** 40 demo en vivo de las 3 funcionalidades · 35 explicación de árbol de componentes, API y schema · 25 Q&A respondido sin notas.

## Lista de verificación final
- URL de Vercel (frontend + API funcionando)
- Repo de GitHub con historial real (no un solo commit)
- README: problema, solución, instrucciones de instalación, documentación de la API
- Link de Figma con la evolución de wireframes a diseño final
- AI usage log de todo el proyecto
