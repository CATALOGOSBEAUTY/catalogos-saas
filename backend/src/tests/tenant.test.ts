import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';
import { app } from '../app.js';
import { setRepositoryForTests } from '../repositories/index.js';
import { MemoryCatalogRepository } from '../store/data.js';

beforeAll(() => {
  setRepositoryForTests(new MemoryCatalogRepository());
});

describe('multi-tenant foundation', () => {
  it('does not leak products from another tenant in public bootstrap', async () => {
    const response = await request(app).get('/api/public/pulsefit/bootstrap').expect(200);
    const titles = response.body.data.products.map((product: { title: string }) => product.title);
    expect(titles).toContain('Legging Compressao Verde');
    expect(titles).not.toContain('Servico Isolado');
  });

  it('calculates public order total on the backend', async () => {
    const response = await request(app)
      .post('/api/public/pulsefit/orders')
      .send({
        customer: {
          fullName: 'Cliente Teste',
          phone: '71999999999',
          fulfillmentType: 'delivery',
          paymentMethod: 'pix'
        },
        items: [
          {
            productId: 'prod-top-media-sustentacao',
            quantity: 2,
            clientPriceIgnored: 1
          }
        ]
      })
      .expect(201);

    expect(response.body.data.totalAmount).toBe(179.8);
    expect(response.body.data.items[0].unitPrice).toBe(89.9);
  });

  it('blocks client session from master routes', async () => {
    const agent = request.agent(app);
    await agent
      .post('/api/auth/login')
      .send({ email: 'owner@pulsefit.local', password: 'PulseFit@123' })
      .expect(200);

    await agent.get('/api/master/dashboard').expect(403);
  });

  it('allows client session to read only its tenant products', async () => {
    const agent = request.agent(app);
    await agent
      .post('/api/auth/login')
      .send({ email: 'owner@pulsefit.local', password: 'PulseFit@123' })
      .expect(200);

    const response = await agent.get('/api/client/products').expect(200);
    const titles = response.body.data.map((product: { title: string }) => product.title);
    expect(titles).toContain('Whey Protein Baunilha');
    expect(titles).not.toContain('Servico Isolado');
  });
});
