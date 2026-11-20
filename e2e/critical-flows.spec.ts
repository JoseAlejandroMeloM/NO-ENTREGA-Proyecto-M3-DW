// E2E: critical flows exercised in a real browser.
import { expect, test, type Page } from '@playwright/test';

const PASSWORD = 'demo12345'; // demo-only accounts from `npm run demo` (docs/design-brief.md)

async function login(page: Page, email: string) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(PASSWORD);
  await page.getByRole('button', { name: /log in|sign in/i }).click();
  await expect(page).not.toHaveURL(/\/login/);
}

/** Stock shown on the first product card of the sale screen after searching. */
async function stockOf(page: Page, search: string) {
  await page.goto('/app/sales/new');
  await page.getByPlaceholder('Find a product by name or SKU').fill(search);
  const card = page.getByRole('button', { name: `Add ${search}` });
  await expect(card).toBeVisible();
  const text = await card.getByText(/in stock/).innerText();
  return { card, stock: Number(text.match(/\d+/)![0]) };
}

test('a user logs in and lands on their home screen', async ({ page }) => {
  await login(page, 'rosa@tienda.test');

  await expect(page).toHaveURL(/\/app/);
  await expect(page.getByRole('navigation').first()).toBeVisible();
});

test('a cashier registers a sale and the stock goes down', async ({ page }) => {
  // Arrange
  await login(page, 'caja@tienda.test');
  await page.goto('/app/sales/new');
  await page.getByPlaceholder('Find a product by name or SKU').fill('a');
  const first = page.getByRole('button', { name: /^Add / }).and(page.locator(':enabled')).first();
  const name = (await first.getAttribute('aria-label'))!.replace(/^Add /, '');
  const { card, stock: before } = await stockOf(page, name);

  // Act
  await card.click();
  await page.getByRole('button', { name: 'Nequi' }).click();
  await page.getByRole('button', { name: 'Register sale' }).click();

  // Assert
  await expect(page.getByText('Sale registered')).toBeVisible();
  expect((await stockOf(page, name)).stock).toBe(before - 1);
});

test('a store sends a purchase order and the distributor sees it', async ({ page, browser }) => {
  // Arrange: the store owner builds an order that reaches the distributor's minimum.
  await login(page, 'rosa@tienda.test');
  await page.goto('/app/orders/new');
  const select = page.getByLabel('Distributor');
  const firstDistributor = await select.locator('option').nth(1).getAttribute('value');
  await select.selectOption(firstDistributor!);
  await page.getByLabel(/^Quantity of /).first().fill('100');

  // Act
  await page.getByRole('button', { name: 'Send order' }).click();
  await expect(page).toHaveURL(/\/app\/orders\/[a-f0-9]{24}$/);
  const orderId = page.url().split('/').pop()!;

  // Assert: the distributor, in a separate browser session, sees the new order.
  const distributor = await (await browser.newContext()).newPage();
  await login(distributor, 'ventas@distrinorte.test');
  await distributor.goto(`/dist/orders/${orderId}`);
  await expect(distributor.getByText(/pending/i).first()).toBeVisible();
});


test('a store owner closes the day with a shortage visible in history', async ({ page }) => {
  await login(page, 'rosa@tienda.test');
  const panel = page.getByRole('region', { name: 'Close day' });
  await panel.getByLabel('Opening float (COP)').fill('100000');
  await panel.getByLabel('Counted cash (COP)').fill('0');
  await panel.getByLabel('Note (optional)').fill('Drawer recount');
  await panel.getByRole('button', { name: 'Save closing' }).click();

  await expect(panel.getByText('This business day is closed.')).toBeVisible();
  const row = panel.getByRole('row').filter({ hasText: 'Drawer recount' });
  await expect(row.getByRole('cell').nth(2)).toHaveClass(/text-red-700/);
});

test('a visitor switches to Spanish and dark mode, and back', async ({ page }) => {
  await page.goto('/');
  // Spanish: texts, labels and placeholders are translated; English comes back on the second click.
  await page.getByRole('button', { name: 'Ver en español' }).click();
  await expect(page.getByRole('link', { name: 'Iniciar sesión' }).first()).toBeVisible();
  await page.getByRole('link', { name: 'Iniciar sesión' }).first().click();
  await expect(page.getByLabel('Contraseña')).toBeVisible();
  await page.getByRole('button', { name: 'View in English' }).click();
  await expect(page.getByLabel('Password')).toBeVisible();

  // Dark mode is a token swap on <html>, remembered after a reload.
  await page.getByRole('button', { name: 'Switch to dark mode' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

test('an owner orders every restock suggestion of one distributor at once', async ({ page }) => {
  await login(page, 'rosa@tienda.test');
  await page.goto('/app/restock');

  // The panel groups products to restock by their best distributor.
  const orderAll = page.getByRole('link', { name: /^Order all \d+ from / }).first();
  await expect(orderAll).toBeVisible();
  const count = Number((await orderAll.getAttribute('aria-label'))!.match(/\d+/)![0]);

  // New purchase order opens with every product of the group prefilled.
  await orderAll.click();
  await expect(page).toHaveURL(/\/app\/orders\/new\?distributor=/);
  await expect(page.getByText(`Total (${count} item${count === 1 ? '' : 's'})`)).toBeVisible();
});
