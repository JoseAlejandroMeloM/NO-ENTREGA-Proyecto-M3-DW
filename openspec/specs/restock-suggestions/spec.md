# restock-suggestions Specification

## Purpose
Predicts when each product will run out from its last 30 days of sales and suggests how much to order and from which distributor, so stores restock before running out.

## Requirements

### Requirement: Stock-out prediction
For each active product the system SHALL compute average daily sales over the last 30 days and days of stock left (`stock / avgDaily`), reporting no prediction when the product had no sales.

#### Scenario: Product with steady sales
- **WHEN** a product sold 60 units in the last 30 days and has stock 10
- **THEN** its average daily sales is 2 and its days left is 5

#### Scenario: Product without sales
- **WHEN** a product had no sales in the last 30 days
- **THEN** its days left is empty and it is listed after products with a prediction

### Requirement: Restock suggestion
A product SHALL be suggested for restock when days left is at most the lead time plus 3 days or it is at low stock, with quantity `max(0, ceil(avgDaily * 14) + minStock - stock)`.

#### Scenario: Suggested quantity
- **WHEN** a product has avgDaily 2, minStock 5, stock 10 and lead time 2
- **THEN** it is suggested (5 days left ≤ 5) with quantity 23

### Requirement: Best distributor for a suggestion
Each suggestion SHALL name the distributor with the lowest price among available catalog items that match the product, and use that distributor's delivery days as lead time (3 days when none matches).

#### Scenario: No matching distributor
- **WHEN** no distributor carries a matching item
- **THEN** the suggestion has no distributor and lead time 3

### Requirement: Urgency order and access
Suggestions SHALL be sorted by days left ascending, and only `store_owner` and `store_inventory` SHALL access them.

#### Scenario: Sorted by urgency
- **WHEN** an inventory clerk opens restock suggestions
- **THEN** the product with the fewest days left is first

#### Scenario: Cashier requests suggestions
- **WHEN** a `store_cashier` calls `/insights/restock`
- **THEN** the response is 403
