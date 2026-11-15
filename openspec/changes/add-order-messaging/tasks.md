# Tasks

## 1. API
- [ ] 1.1 Add the `Message` model and `GET/POST /orders/{id}/messages` with order-side access and `after` filter; verify 201, 400 length, 403 cashier and 404 third party with Supertest
- [ ] 1.2 Create `order_message` notifications for the other side; verify with tests
- [ ] 1.3 Check the endpoints against `openapi.yaml` and verify Swagger UI

## 2. Client
- [ ] 2.1 Build the messages panel (reuse `usePolling`, 5 s, stops on unmount) on S17 and S22; verify a message appears on the other side within 5 s
- [ ] 2.2 Verify a `<script>` message renders as text

## 3. Verification
- [ ] 3.1 Run QA-20 in production on both platforms and record the evidence on Trello
