// Regression (#99): texts that stayed in English with Spanish on.
// React splits `Hello, {name}` and `Estimated delivery {date}` into separate text nodes,
// so the translation layer sees "Hello, " and "Estimated delivery " on their own.
import { describe, expect, it } from 'vitest';
import { toSpanish } from '../../../client/src/i18n/preferences';

describe('toSpanish', () => {
  it('translates the greeting text node on the distributor dashboard', () => {
    // Arrange
    const node = 'Hello, ';
    // Act
    const es = toSpanish(node);
    // Assert
    expect(es).toBe('Hola, ');
  });

  it('translates the estimated delivery label on the order page', () => {
    expect(toSpanish('Estimated delivery ')).toBe('Entrega estimada ');
  });

  it('translates the distributor count in the directory, singular and plural', () => {
    expect(toSpanish('3 distributors')).toBe('3 distribuidores');
    expect(toSpanish('1 distributor')).toBe('1 distribuidor');
  });

  it('keeps translating a full greeting as before', () => {
    expect(toSpanish('Hello, Rosa')).toBe('Hola, Rosa');
  });
});

describe('toSpanish on the phone sale screen', () => {
  it('translates the "View cart" bar and its item count', () => {
    expect(toSpanish('View cart · ')).toBe('Ver carrito · ');
    expect(toSpanish('3 items')).toBe('3 productos');
  });
});
