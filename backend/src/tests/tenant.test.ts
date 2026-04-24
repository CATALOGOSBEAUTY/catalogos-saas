import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';
import { app } from '../app.js';
import { setRepositoryForTests } from '../repositories/index.js';
import { MemoryCatalogRepository } from '../store/data.js';

beforeAll(() => {
  setRepositoryForTests(new MemoryCatalogRepository());
});

describe('multi-tenant foundation', () => {
  const tinyPng = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
    0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
    0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4,
    0x89, 0x00, 0x00, 0x00, 0x0a, 0x49, 0x44, 0x41,
    0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
    0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00,
    0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae,
    0x42, 0x60, 0x82
  ]);

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

  it('allows tenant product and category CRUD without accepting another tenant category', async () => {
    const agent = request.agent(app);
    await agent
      .post('/api/auth/login')
      .send({ email: 'owner@pulsefit.local', password: 'PulseFit@123' })
      .expect(200);

    const categoryResponse = await agent
      .post('/api/client/categories')
      .set('X-Client-Request', 'true')
      .send({ name: 'Acessorios Teste', slug: 'acessorios-teste' })
      .expect(201);

    await agent
      .post('/api/client/products')
      .set('X-Client-Request', 'true')
      .send({
        categoryId: 'cat-renovo',
        title: 'Produto Tenant Errado',
        slug: 'produto-tenant-errado',
        price: 10,
        stockQuantity: 1
      })
      .expect(422);

    const productResponse = await agent
      .post('/api/client/products')
      .set('X-Client-Request', 'true')
      .send({
        categoryId: categoryResponse.body.data.id,
        title: 'Corda de Treino',
        slug: 'corda-de-treino',
        description: 'Acessorio para aquecimento.',
        price: 39.9,
        stockQuantity: 7,
        catalogStatus: 'ready'
      })
      .expect(201);

    await agent
      .patch(`/api/client/products/${productResponse.body.data.id}/status`)
      .set('X-Client-Request', 'true')
      .send({ catalogStatus: 'live', isActive: true })
      .expect(200);

    await agent
      .delete(`/api/client/categories/${categoryResponse.body.data.id}`)
      .set('X-Client-Request', 'true')
      .expect(409);

    await agent
      .delete(`/api/client/products/${productResponse.body.data.id}`)
      .set('X-Client-Request', 'true')
      .expect(204);

    await agent
      .delete(`/api/client/categories/${categoryResponse.body.data.id}`)
      .set('X-Client-Request', 'true')
      .expect(204);
  });

  it('uploads a validated product image through the backend', async () => {
    const agent = request.agent(app);
    await agent
      .post('/api/auth/login')
      .send({ email: 'owner@pulsefit.local', password: 'PulseFit@123' })
      .expect(200);

    const categoryResponse = await agent
      .post('/api/client/categories')
      .set('X-Client-Request', 'true')
      .send({ name: 'Midia Teste', slug: 'midia-teste' })
      .expect(201);

    const productResponse = await agent
      .post('/api/client/products')
      .set('X-Client-Request', 'true')
      .send({
        categoryId: categoryResponse.body.data.id,
        title: 'Produto com Imagem',
        slug: 'produto-com-imagem',
        price: 10,
        stockQuantity: 1
      })
      .expect(201);

    const uploadResponse = await agent
      .post(`/api/client/products/${productResponse.body.data.id}/image`)
      .set('X-Client-Request', 'true')
      .attach('image', tinyPng, { filename: 'tiny.png', contentType: 'image/png' })
      .expect(200);

    expect(uploadResponse.body.data.imageUrl).toMatch(/^data:image\/png;base64,/);

    await agent
      .delete(`/api/client/products/${productResponse.body.data.id}`)
      .set('X-Client-Request', 'true')
      .expect(204);
    await agent
      .delete(`/api/client/categories/${categoryResponse.body.data.id}`)
      .set('X-Client-Request', 'true')
      .expect(204);
  });

  it('rejects malformed product image uploads', async () => {
    const agent = request.agent(app);
    await agent
      .post('/api/auth/login')
      .send({ email: 'owner@pulsefit.local', password: 'PulseFit@123' })
      .expect(200);

    await agent
      .post('/api/client/products/prod-top-media-sustentacao/image')
      .set('X-Client-Request', 'true')
      .attach('image', Buffer.from('not-a-real-image'), { filename: 'fake.png', contentType: 'image/png' })
      .expect(422);
  });

  it('returns 400 for malformed JSON payloads', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send('{bad-json')
      .expect(400);

    expect(response.body.error.code).toBe('INVALID_JSON');
  });
});
