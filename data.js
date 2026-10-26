// Edite os dados comerciais neste arquivo. Preços em reais, por unidade.
window.SHOP = {
  name: 'Doce & Cia',
  // Número com país e DDD, somente dígitos. Exemplo de formato: 55 + DDD + número.
  whatsapp: '',
  email: '',
  // Perfil do Instagram, sem @. Vazio mantém o estado “Em breve”.
  instagram: '',
  pickup: { street: 'Rua dos Confeiteiros, 123', neighborhood: 'Jardim Doce', city: 'São Paulo — SP' },
  demo: true,
  // Condições e preços de exemplo. Confirme os dados reais antes de publicar.
  ordering: { leadDays: 5, depositPercent: 50, paymentMethods: 'Pix ou dinheiro' },
  sweets: {
    weight: 20, pricePerHundred: 180, specialPerHundred: 25, minimumPerFlavor: 25,
    flavors: [
      { id: 'brigadeiro', name: 'Brigadeiro de chocolate', photo: 0 },
      { id: 'beijinho-coco', name: 'Beijinho de coco', photo: 1 },
      { id: 'beijinho-leite', name: 'Beijinho de leite', photo: 2 },
      { id: 'cajuzinho', name: 'Cajuzinho', photo: 3 },
      { id: 'prestigio', name: 'Prestígio', note: 'brigadeiro com coco', photo: 4 }
    ]
  },
  // Montador: valores demonstrativos, em reais. Até dois recheios incluídos.
  builder: {
    maxFillings: 2,
    sizes: [
      { id: 'pp', label: 'PP', diameter: 10, servings: '6 a 8 fatias', guests: 8, price: 89.90, photo: 0 },
      { id: 'p', label: 'P', diameter: 15, servings: '12 a 15 fatias', guests: 15, price: 129.90, photo: 1 },
      { id: 'm', label: 'M', diameter: 20, servings: '20 a 25 fatias', guests: 25, price: 179.90, photo: 2 },
      { id: 'g', label: 'G', diameter: 22, servings: '28 a 32 fatias', guests: 32, price: 229.90, photo: 3 },
      { id: 'gg', label: 'GG', diameter: 26, servings: '40 a 45 fatias', guests: 45, price: 289.90, photo: 4 }
    ],
    doughs: [
      { id: 'branca', name: 'Branca', photo: 0 },
      { id: 'chocolate', name: 'Chocolate', photo: 1 }
    ],
    fillings: [
      { id: 'chocolate-leite', name: 'Chocolate de leite', photo: 2, color: '#68412b' },
      { id: 'chocolate-branco', name: 'Chocolate branco', photo: 3, color: '#edddad' },
      { id: 'prestigio', name: 'Prestígio', photo: 4, color: '#987057' },
      { id: 'doce-leite', name: 'Doce de leite', photo: 5, color: '#ba793e' },
      { id: 'creme-belga', name: 'Creme belga', photo: 6, color: '#e8c76d' },
      { id: 'avela', name: 'Creme de avelã', photo: 7, color: '#7e5039' },
      { id: 'ninho', name: 'Leite Ninho', photo: 8, color: '#eee0bf' },
      { id: 'morango', name: 'Geleia de morango', photo: 9, color: '#a83c36' },
      { id: 'abacaxi', name: 'Abacaxi', photo: 10, color: '#e3bd50' }
    ],
    coatings: [
      { id: 'recheio', name: 'Do recheio', photo: 5, price: 0 },
      { id: 'chantininho', name: 'Chantininho', photo: 19, price: 0 },
      { id: 'chocolate', name: 'Chocolate', photo: 2, price: 15 },
      { id: 'doce-leite', name: 'Doce de leite', photo: 5, price: 15 }
    ],
    extras: [
      { id: 'topo', name: 'Topo personalizado', photo: 11, price: 18 },
      { id: 'glitter', name: 'Glitter comestível', photo: 12, price: 12 },
      { id: 'papel-arroz', name: 'Papel de arroz', photo: 13, price: 20 },
      { id: 'flores', name: 'Flores naturais', photo: 14, price: 35 },
      { id: 'frutas', name: 'Frutas vermelhas', photo: 15, price: 25 },
      { id: 'chocolates', name: 'Chocolates', photo: 16, price: 22 },
      { id: 'ganache', name: 'Ganache escorrida', photo: 17, price: 20 },
      { id: 'docinhos', name: 'Docinhos enrolados', photo: 18, price: 24 }
    ]
  },
  categories: [
    { id: 'aniversario', name: 'Aniversário', label: 'Bolos de aniversário', image: 8 },
    { id: 'casamento', name: 'Casamento', label: 'Bolos de casamento', image: 4 },
    { id: 'comemoracoes', name: 'Comemorações', label: 'Para comemorar', image: 3 },
    { id: 'personalizados', name: 'Personalizados', label: 'Bolos personalizados', image: 5 },
    { id: 'cupcakes', name: 'Cupcakes', label: 'Cupcakes', image: 6 }
  ],
  products: [
    { id: 'trufado', name: 'Trufado de Chocolate', category: 'aniversario', image: 0, price: 149.90, portion: 'Bolo de 1 kg · 10 a 12 fatias', description: 'Massa de cacau, recheio trufado e uma generosa camada de ganache.', tag: 'O mais amado' },
    { id: 'red-velvet', name: 'Red Velvet', category: 'comemoracoes', image: 1, price: 159.90, portion: 'Bolo de 1 kg · 10 a 12 fatias', description: 'Massa aveludada, delicado toque de cacau e creme de cream cheese.' },
    { id: 'cheesecake', name: 'Cheesecake de Frutas Vermelhas', shortName: 'Cheesecake de Frutas', category: 'comemoracoes', image: 2, price: 169.90, portion: 'Torta de 1 kg · 10 a 12 fatias', description: 'Creme leve, base amanteigada e o frescor das frutas vermelhas.', tag: 'Delicado & fresco' },
    { id: 'caramelo', name: 'Caramelo Salgado', category: 'aniversario', image: 3, price: 154.90, portion: 'Bolo de 1 kg · 10 a 12 fatias', description: 'Baunilha, caramelo artesanal e flor de sal na medida certa.' },
    { id: 'casamento', name: 'Celebração em Dois Andares', category: 'casamento', image: 4, price: 549.90, portion: 'Bolo de 3 kg · 30 a 36 fatias', description: 'Baunilha e ganache branca, com acabamento delicado e flores decorativas.' },
    { id: 'morango', name: 'Jardim de Morangos', category: 'personalizados', image: 5, price: 189.90, portion: 'Bolo de 1 kg · 10 a 12 fatias', description: 'Morangos frescos, recheio de leite e uma decoração feita para você.' },
    { id: 'cupcakes', name: 'Cupcakes de Chocolate', category: 'cupcakes', image: 6, price: 54.90, portion: 'Caixa com 4 unidades', description: 'Pequenos bolinhos de cacau com uma cobertura cremosa de chocolate.' },
    { id: 'chocolate-frutas', name: 'Chocolate & Frutas', category: 'aniversario', image: 8, price: 179.90, portion: 'Bolo de 1 kg · 10 a 12 fatias', description: 'Chocolate intenso, ganache sedosa e uma seleção de frutas frescas.' }
  ],
};
