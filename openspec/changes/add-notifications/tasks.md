# Tasks

## 1. API
- [x] 1.1 Add the `Notification` model and the internal `notify()` service (by user ids or by roles in an organization, active users only); verify with unit tests
- [x] 1.2 Implement `GET /notifications` (pagination + `unreadCount`), `PATCH /notifications/{id}/read`, `POST /notifications/read-all`; verify ownership 404 and read-all with Supertest
- [x] 1.3 Check the endpoints against `openapi.yaml` and verify they render in Swagger UI

## 2. Client
- [x] 2.1 Add the `usePolling` hook and the bell with unread count + latest-5 dropdown in the top bar; verify the count updates within 30 s
- [x] 2.2 Build S25 Notifications page with "mark all read"; verify against Figma

## 3. Verification
- [ ] 3.1 Run QA-21 in production on both platforms and record the evidence on Trello
