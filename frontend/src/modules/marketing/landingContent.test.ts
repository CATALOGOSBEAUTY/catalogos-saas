import { describe, expect, it } from 'vitest';
import { commercialPlans, marketingNavigation, platformModules, systemBrand } from './landingContent';

describe('landingContent', () => {
  it('defines the Sistematize brand and primary entry points', () => {
    expect(systemBrand.name).toBe('Sistematize');
    expect(systemBrand.tagline).toContain('catalogo online');
    expect(marketingNavigation).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: 'Catalogo demo', href: '/loja/pulsefit/catalogo' }),
        expect.objectContaining({ label: 'Painel cliente', href: '/cliente/login' }),
        expect.objectContaining({ label: 'Master', href: '/master/login' })
      ])
    );
  });

  it('matches the commercial plan ladder from the product documentation', () => {
    expect(commercialPlans.map((plan) => plan.name)).toEqual(['Bronze', 'Silver', 'Gold', 'Platinum', 'Enterprise']);
    expect(commercialPlans.map((plan) => plan.price)).toEqual(['R$ 49,90', 'R$ 149,90', 'R$ 299,90', 'R$ 397,90', 'A partir de R$ 497,90']);
  });

  it('advertises paid modules as platform expansion points', () => {
    expect(platformModules).toEqual(expect.arrayContaining(['Relatorios avancados', 'WhatsApp Pro', 'Pagamento online', 'Dominio proprio', 'Chatbot']));
  });
});
