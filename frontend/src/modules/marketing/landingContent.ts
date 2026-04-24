export const systemBrand = {
  name: 'Sistematize',
  tagline: 'catalogo online',
  description:
    'Plataforma SaaS multiempresa para criar catalogos digitais, receber pedidos no WhatsApp e gerenciar produtos, midia, clientes e planos em uma estrutura profissional.'
};

export const marketingNavigation = [
  { label: 'Produto', href: '#produto' },
  { label: 'Planos', href: '#planos' },
  { label: 'Catalogo demo', href: '/loja/pulsefit/catalogo' },
  { label: 'Painel cliente', href: '/cliente/login' },
  { label: 'Master', href: '/master/login' }
];

export const productHighlights = [
  {
    title: 'Catalogo publico por cliente',
    description: 'Cada empresa recebe uma loja publica por slug, com busca, categorias, produto detalhado, carrinho e envio do pedido.'
  },
  {
    title: 'Central de gerenciamento',
    description: 'O cliente administra produtos, categorias, imagens, destaques, pedidos e configuracoes em um painel separado do master.'
  },
  {
    title: 'Backoffice master',
    description: 'A plataforma controla clientes, planos, assinaturas, auditoria, operacao e crescimento do SaaS em uma area isolada.'
  }
];

export const workflowSteps = [
  'Cliente cria ou recebe sua empresa na plataforma',
  'Cadastra produtos, categorias, midia e destaques',
  'Divulga o link publico do catalogo',
  'Recebe pedidos e continua evoluindo por plano'
];

export const commercialPlans = [
  {
    name: 'Bronze',
    price: 'R$ 49,90',
    limit: '50 produtos',
    users: '1 usuario',
    storage: '100MB',
    features: ['Pagina publica', 'Pedido via WhatsApp', 'Painel basico', 'Produtos e categorias']
  },
  {
    name: 'Silver',
    price: 'R$ 149,90',
    limit: '150 produtos',
    users: '2 usuarios',
    storage: '500MB',
    features: ['Tudo do Bronze', 'Relatorios mensais', 'Banners', 'Produtos em destaque']
  },
  {
    name: 'Gold',
    price: 'R$ 299,90',
    limit: '250 produtos',
    users: '5 usuarios',
    storage: '1GB',
    features: ['Tudo do Silver', 'Relatorios avancados', 'Gateway de pagamento', 'Cupons']
  },
  {
    name: 'Platinum',
    price: 'R$ 397,90',
    limit: '500 produtos',
    users: '10 usuarios',
    storage: '3GB',
    features: ['Tudo do Gold', 'Analise de conversao', 'WhatsApp Pro', 'Suporte prioritario']
  },
  {
    name: 'Enterprise',
    price: 'A partir de R$ 497,90',
    limit: '1000+ produtos',
    users: 'Usuarios customizados',
    storage: 'Storage customizado',
    features: ['Customizacao', 'Suporte dedicado', 'Multiunidade', 'Modulos por contrato']
  }
];

export const platformModules = ['Relatorios avancados', 'WhatsApp Pro', 'Pagamento online', 'Dominio proprio', 'Chatbot'];
