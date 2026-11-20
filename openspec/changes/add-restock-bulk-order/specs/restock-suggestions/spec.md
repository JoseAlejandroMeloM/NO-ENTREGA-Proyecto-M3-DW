## ADDED Requirements

### Requirement: Order all suggestions from one distributor
The restock suggestions screen SHALL group the products to restock that have a best distributor and a suggested quantity by that distributor, and SHALL offer one action per distributor that opens a new purchase order prefilled with every product of the group at its suggested quantity.

#### Scenario: Two products share a distributor
- **WHEN** two products to restock have the same best distributor
- **THEN** S11 shows that distributor with 2 products and an "Order all" action
- **AND** the action opens S15 for that distributor with both items at their suggested quantities

#### Scenario: No distributor carries the product
- **WHEN** a product to restock has no best distributor
- **THEN** it is not part of any group
