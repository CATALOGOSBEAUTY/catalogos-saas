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

  it('separates client and master login entry points', async () => {
    await request(app)
      .post('/api/auth/client-login')
      .send({ email: 'master@catalogos.local', password: 'Master@123' })
      .expect(403);

    await request(app)
      .post('/api/auth/master-login')
      .send({ email: 'owner@pulsefit.local', password: 'PulseFit@123' })
      .expect(403);

    const clientLogin = await request(app)
      .post('/api/auth/client-login')
      .send({ email: 'owner@pulsefit.local', password: 'PulseFit@123' })
      .expect(200);

    expect(clientLogin.body.data.tenant.slug).toBe('pulsefit');
    expect(clientLogin.body.data.master).toBeNull();

    const masterLogin = await request(app)
      .post('/api/auth/master-login')
      .send({ email: 'master@catalogos.local', password: 'Master@123' })
      .expect(200);

    expect(masterLogin.body.data.master.role).toBe('super_admin');
    expect(masterLogin.body.data.tenant).toBeNull();
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

  it('lets the client update public appearance settings used by the public catalog', async () => {
    const agent = request.agent(app);
    await agent
      .post('/api/auth/client-login')
      .send({ email: 'owner@pulsefit.local', password: 'PulseFit@123' })
      .expect(200);

    const settingsResponse = await agent
      .put('/api/client/settings/public')
      .set('X-Client-Request', 'true')
      .send({
        heroTitle: 'PulseFit Catalogo Premium',
        heroSubtitle: 'Treino, performance e estilo em uma loja atualizada.',
        whatsappPhone: '5571888888888',
        primaryColor: '#7C3AED'
      })
      .expect(200);

    expect(settingsResponse.body.data.heroTitle).toBe('PulseFit Catalogo Premium');

    const publicResponse = await request(app).get('/api/public/pulsefit/bootstrap').expect(200);
    expect(publicResponse.body.data.hero.title).toBe('PulseFit Catalogo Premium');
    expect(publicResponse.body.data.settings.whatsappPhone).toBe('5571888888888');
  });

  it('lets the client update order status for its own orders', async () => {
    const orderResponse = await request(app)
      .post('/api/public/pulsefit/orders')
      .send({
        customer: {
          fullName: 'Cliente Status',
          phone: '71911111111',
          fulfillmentType: 'pickup',
          paymentMethod: 'cash'
        },
        items: [{ productId: 'prod-whey-baunilha', quantity: 1 }]
      })
      .expect(201);

    const agent = request.agent(app);
    await agent
      .post('/api/auth/client-login')
      .send({ email: 'owner@pulsefit.local', password: 'PulseFit@123' })
      .expect(200);

    const updateResponse = await agent
      .patch(`/api/client/orders/${orderResponse.body.data.id}/status`)
      .set('X-Client-Request', 'true')
      .send({ status: 'confirmed' })
      .expect(200);

    expect(updateResponse.body.data.status).toBe('confirmed');
  });

  it('enforces plan product limits on client product creation', async () => {
    const master = request.agent(app);
    await master
      .post('/api/auth/master-login')
      .send({ email: 'master@catalogos.local', password: 'Master@123' })
      .expect(200);

    const planResponse = await master
      .post('/api/master/plans')
      .set('X-Master-Request', 'true')
      .send({
        name: 'Tiny Test',
        code: 'tiny-test',
        priceMonthly: 9.9,
        productLimit: 3,
        userLimit: 1,
        storageLimitMb: 50
      })
      .expect(201);

    await master
      .patch('/api/master/companies/company-pulsefit/plan')
      .set('X-Master-Request', 'true')
      .send({ planCode: planResponse.body.data.code })
      .expect(200);

    const client = request.agent(app);
    await client
      .post('/api/auth/client-login')
      .send({ email: 'owner@pulsefit.local', password: 'PulseFit@123' })
      .expect(200);

    await client
      .post('/api/client/products')
      .set('X-Client-Request', 'true')
      .send({
        categoryId: 'cat-tops',
        title: 'Produto acima do limite',
        slug: 'produto-acima-limite',
        price: 10,
        stockQuantity: 1
      })
      .expect(403);

    await master
      .patch('/api/master/companies/company-pulsefit/plan')
      .set('X-Master-Request', 'true')
      .send({ planCode: 'silver' })
      .expect(200);
  });

  it('lets master operate company status, manual invoices and audit logs', async () => {
    const master = request.agent(app);
    await master
      .post('/api/auth/master-login')
      .send({ email: 'master@catalogos.local', password: 'Master@123' })
      .expect(200);

    const invoiceResponse = await master
      .post('/api/master/billing/invoices')
      .set('X-Master-Request', 'true')
      .send({
        companyId: 'company-pulsefit',
        amount: 149.9,
        dueDate: '2026-05-10'
      })
      .expect(201);

    const paidResponse = await master
      .patch(`/api/master/billing/invoices/${invoiceResponse.body.data.id}/status`)
      .set('X-Master-Request', 'true')
      .send({ status: 'paid' })
      .expect(200);

    expect(paidResponse.body.data.status).toBe('paid');
    expect(paidResponse.body.data.paidAt).toBeTruthy();

    await master
      .patch('/api/master/companies/company-pulsefit/status')
      .set('X-Master-Request', 'true')
      .send({ status: 'suspended' })
      .expect(200);

    await request(app).get('/api/public/pulsefit/bootstrap').expect(404);

    await master
      .patch('/api/master/companies/company-pulsefit/status')
      .set('X-Master-Request', 'true')
      .send({ status: 'active' })
      .expect(200);

    const auditResponse = await master.get('/api/master/audit-logs').expect(200);
    const actions = auditResponse.body.data.map((row: { action: string }) => row.action);
    expect(actions).toContain('invoice.status_updated');
    expect(actions).toContain('company.status_updated');
  });
});
