(() => {
  'use strict';
  const shop = window.SHOP;
  const $ = (selector, parent = document) => parent.querySelector(selector);
  const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];
  const money = value => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  const icon = name => `<svg aria-hidden="true"><use href="#i-${name}"/></svg>`;
  const productById = id => shop.products.find(product => product.id === id);
  let cart = {};
  try {
    const saved = JSON.parse(localStorage.getItem('docecia-cart-v1') || '{}');
    for (const [id, qty] of Object.entries(saved || {})) {
      if (productById(id) && Number.isInteger(qty) && qty > 0 && qty <= 99) cart[id] = qty;
    }
  } catch { /* O carrinho continua disponível quando o armazenamento é bloqueado. */ }
  let activeCategory = 'todos';
  let toastTimer;
  let dialogTrigger;
  let customMessage = '';
  const tile = (index, alt) => `<div class="photo-tile tile-${index}" role="img" aria-label="${alt}"></div>`;

  function productCard(product, catalog = false, index = 0) {
    return `<article class="product-card ${catalog ? '' : 'reveal'}" style="--index:${index}">
      <div class="product-image">${tile(product.image, product.name)}${product.tag ? `<span class="product-tag">${product.tag}</span>` : ''}</div>
      <div class="product-info"><h3>${product.shortName || product.name}</h3><p>${product.description}</p>${catalog ? `<span class="product-portion">${product.portion}</span>` : ''}
      <div class="product-bottom"><span class="product-price">${money(product.price)}</span><button class="add-button" data-add="${product.id}" aria-label="Adicionar ${product.name} à sacola">${icon('bag')}</button></div></div></article>`;
  }

  $('#catalog-filters').innerHTML = [{ id: 'todos', name: 'Todos' }, ...shop.categories].map(category => `<button data-filter="${category.id}" aria-pressed="${category.id === activeCategory}">${category.name}</button>`).join('');
  const catalogActions = document.createElement('div');
  catalogActions.className = 'dialog-actions';
  catalogActions.innerHTML = `<button class="icon-button" data-cart aria-label="Abrir carrinho">${icon('bag')}<span class="cart-count" hidden>0</span></button>`;
  catalogActions.append($('#catalog-dialog .dialog-top>[data-close]'));
  $('#catalog-dialog .dialog-top').append(catalogActions);

  function renderCatalog() {
    const query = $('#catalog-search').value.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const products = shop.products.filter(product => {
      const words = `${product.name} ${product.description}`.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
      return (activeCategory === 'todos' || product.category === activeCategory) && words.includes(query);
    });
    $('#catalog-products').innerHTML = products.map(product => productCard(product, true)).join('');
    $('#catalog-empty').hidden = products.length > 0;
    $('#catalog-results').textContent = `${products.length} ${products.length === 1 ? 'produto encontrado' : 'produtos encontrados'}`;
    $$('[data-filter]').forEach(button => button.setAttribute('aria-pressed', button.dataset.filter === activeCategory));
  }

  function closeMobileMenu() {
    $('.menu-toggle').setAttribute('aria-expanded', 'false');
    $('.menu-toggle').setAttribute('aria-label', 'Abrir menu');
    $('#mobile-nav').hidden = true;
  }
  function openDialog(id) {
    const current = $('dialog[open]');
    if (current?.id === id) return;
    if (!current) dialogTrigger = document.activeElement;
    current?.close();
    closeMobileMenu();
    const dialog = $(`#${id}`);
    dialog.showModal();
    dialog.scrollTop = 0;
    if (id === 'catalog-dialog') $('[data-close]', dialog).focus({ preventScroll: true });
  }
  function openCatalog(category = 'todos') {
    activeCategory = category;
    $('#catalog-search').value = '';
    renderCatalog();
    openDialog('catalog-dialog');
  }

  function showToast(message, showCart = true) {
    clearTimeout(toastTimer);
    $('#toast>span').textContent = message;
    $('#toast>[data-cart]').hidden = !showCart;
    $('#toast').classList.add('show');
    toastTimer = setTimeout(() => $('#toast').classList.remove('show'), 4000);
  }
  function saveCart() {
    try { localStorage.setItem('docecia-cart-v1', JSON.stringify(cart)); } catch { /* Opcional. */ }
    renderCart();
  }
  function addToCart(id) {
    const product = productById(id);
    if (!product) return;
    if ((cart[id] || 0) >= 99) { showToast('Limite de 99 unidades por produto.', false); return; }
    cart[id] = (cart[id] || 0) + 1;
    saveCart();
    showToast(`${product.shortName || product.name} na sacola.`);
    const button = document.activeElement;
    if (button?.matches('[data-add]')) {
      const original = icon('bag');
      button.innerHTML = icon('check');
      setTimeout(() => { if (button.isConnected) button.innerHTML = original; }, 1100);
    }
  }
  function subtotalCents() {
    return Object.entries(cart).reduce((sum, [id, qty]) => sum + Math.round(productById(id).price * 100) * qty, 0);
  }
  function renderCart() {
    const entries = Object.entries(cart);
    const count = entries.reduce((total, [, qty]) => total + qty, 0);
    $$('.cart-count').forEach(badge => { badge.textContent = count; badge.hidden = !count; });
    $('#cart-heading-count').textContent = count ? `(${count})` : '';
    $$('[data-cart]').forEach(button => button.setAttribute('aria-label', `Abrir carrinho${count ? `, ${count} ${count === 1 ? 'item' : 'itens'}` : ', vazio'}`));
    $('#cart-summary').hidden = !count;
    $('#cart-config-notice').hidden = true;
    $('#cart-subtotal').textContent = money(subtotalCents() / 100);
    $('#cart-items').innerHTML = entries.length ? entries.map(([id, qty]) => {
      const product = productById(id);
      return `<article class="cart-row"><div class="cart-image">${tile(product.image, product.name)}</div><div><h3>${product.name}</h3><p class="cart-row-price">${money(product.price)} <span>por unidade</span></p><div class="cart-row-controls"><div class="quantity"><button data-quantity="${id}" data-delta="-1" aria-label="Diminuir quantidade de ${product.name}">−</button><span aria-label="Quantidade">${qty}</span><button data-quantity="${id}" data-delta="1" aria-label="Aumentar quantidade de ${product.name}" ${qty >= 99 ? 'disabled' : ''}>+</button></div><button class="remove-button" data-remove="${id}" aria-label="Remover ${product.name}">Remover</button></div></div></article>`;
    }).join('') : `<div class="empty-cart">${icon('bag')}<h3>Sua sacola pede um doce.</h3><p>Escolha seu favorito e comece a planejar um momento especial.</p><button class="button" data-catalog>Explorar o cardápio ${icon('arrow')}</button></div>`;
  }

  function orderMessage() {
    const rows = Object.entries(cart).map(([id, qty]) => {
      const product = productById(id);
      return `• ${qty} × ${product.name} — ${money(product.price)} cada = ${money(Math.round(product.price * 100) * qty / 100)}`;
    });
    const note = $('#cart-note').value.trim();
    return `Olá, ${shop.name}! Gostaria de consultar este pedido:\n\n${rows.join('\n')}\n\nSubtotal: ${money(subtotalCents() / 100)}${note ? `\n\nObservações: ${note}` : ''}\n\nPodemos confirmar disponibilidade, prazo e valor da entrega?${shop.demo ? '\n\nPedido demonstrativo — confirmar valores no atendimento.' : ''}`;
  }
  function sendWhatsapp(message, noticeId) {
    const number = String(shop.whatsapp || '').replace(/\D/g, '');
    if (!/^\d{10,15}$/.test(number)) {
      $(`#${noticeId}`).hidden = false;
      $(`#${noticeId}`).scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'nearest' });
      return;
    }
    window.open(`https://wa.me/${number}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
  }
  async function copyMessage(message, fallbackId, button) {
    try {
      await navigator.clipboard.writeText(message);
      const old = button.innerHTML;
      button.innerHTML = `Copiado! ${icon('check')}`;
      setTimeout(() => { button.innerHTML = old; }, 2500);
    } catch {
      const fallback = $(`#${fallbackId}`);
      fallback.value = message;
      fallback.hidden = false;
      fallback.focus();
      fallback.select();
      button.textContent = 'Selecione e copie o texto abaixo';
    }
  }

  document.addEventListener('click', event => {
    const target = event.target.closest('button,a');
    if (!target) return;
    if (target.hasAttribute('data-catalog')) openCatalog();
    if (target.hasAttribute('data-category')) openCatalog(target.dataset.category);
    if (target.hasAttribute('data-filter')) { activeCategory = target.dataset.filter; renderCatalog(); }
    if (target.hasAttribute('data-cart')) { renderCart(); openDialog('cart-dialog'); $('#toast').classList.remove('show'); }
    if (target.hasAttribute('data-order')) { openDialog('order-dialog'); }
    if (target.hasAttribute('data-close')) target.closest('dialog').close();
    if (target.hasAttribute('data-add')) addToCart(target.dataset.add);
    if (target.hasAttribute('data-remove')) {
      delete cart[target.dataset.remove]; saveCart();
      ($('#cart-items button') || $('#cart-dialog [data-close]')).focus({ preventScroll: true });
    }
    if (target.hasAttribute('data-quantity')) {
      const id = target.dataset.quantity;
      const next = Math.min(99, (cart[id] || 0) + Number(target.dataset.delta));
      if (next <= 0) delete cart[id]; else cart[id] = next;
      saveCart();
      const replacement = $(`[data-quantity="${id}"][data-delta="${target.dataset.delta}"]`);
      if (replacement && !replacement.disabled) replacement.focus({ preventScroll: true });
    }
    if (target.hasAttribute('data-social')) {
      const number = String(shop.whatsapp || '').replace(/\D/g, '');
      const instagram = String(shop.instagram || '').replace(/^@/, '');
      if (target.dataset.social === 'whatsapp') {
        if (/^\d{10,15}$/.test(number)) window.open(`https://wa.me/${number}`, '_blank', 'noopener,noreferrer');
        else openDialog('order-dialog');
      } else if (/^[A-Za-z0-9._]{1,30}$/.test(instagram)) {
        window.open(`https://www.instagram.com/${encodeURIComponent(instagram)}/`, '_blank', 'noopener,noreferrer');
      } else {
        $('#info-title').textContent = 'Nosso Instagram está chegando.';
        $('#info-content').innerHTML = '<p>Em breve, você poderá acompanhar nossas criações, novidades e um pouquinho do carinho que vai em cada receita.</p><p>Enquanto isso, vamos planejar o seu próximo momento especial?</p><button class="text-link" data-order>Planejar uma encomenda <svg aria-hidden="true"><use href="#i-arrow"/></svg></button>';
        openDialog('info-dialog');
      }
    }
    if (target.closest('#mobile-nav') && target.matches('a')) closeMobileMenu();
  });

  $$('dialog').forEach(dialog => {
    dialog.addEventListener('click', event => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
    });
    dialog.addEventListener('close', () => {
      if (!$('dialog[open]') && dialogTrigger?.isConnected) dialogTrigger.focus({ preventScroll: true });
    });
  });
  $('.menu-toggle').addEventListener('click', () => {
    const isOpen = $('.menu-toggle').getAttribute('aria-expanded') === 'true';
    $('.menu-toggle').setAttribute('aria-expanded', String(!isOpen));
    $('.menu-toggle').setAttribute('aria-label', isOpen ? 'Abrir menu' : 'Fechar menu');
    $('#mobile-nav').hidden = isOpen;
  });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMobileMenu(); });
  matchMedia('(min-width: 761px)').addEventListener('change', event => { if (event.matches) closeMobileMenu(); });
  $('#catalog-search').addEventListener('input', renderCatalog);
  $('#reset-filters').addEventListener('click', () => { activeCategory = 'todos'; $('#catalog-search').value = ''; renderCatalog(); $('#catalog-search').focus(); });
  $('#continue-shopping').addEventListener('click', () => openCatalog());
  $('#checkout').addEventListener('click', () => { if (Object.keys(cart).length) sendWhatsapp(orderMessage(), 'cart-config-notice'); });
  $('#copy-order').addEventListener('click', event => copyMessage(orderMessage(), 'order-copy-fallback', event.currentTarget));
  $('#copy-custom').addEventListener('click', event => copyMessage(customMessage, 'custom-copy-fallback', event.currentTarget));
  $('#custom-order-form').addEventListener('input', () => { $('#custom-config-notice').hidden = true; });
  document.addEventListener('docecia:configured-cake', event => {
    const form = $('#custom-order-form');
    $('textarea[name=details]', form).value = event.detail.summary;
    $('input[name=guests]', form).value = event.detail.guests;
    $('input[name=guests]', form).required = Boolean(event.detail.guests);
    if (event.detail.date) $('input[name=date]', form).value = event.detail.date;
    if (event.detail.time) $('input[name=time]', form).value = event.detail.time;
    $('#custom-config-notice').hidden = true;
    $('textarea[name=details]', form).setCustomValidity('');
    openDialog('order-dialog');
  });
  for (const field of [$('#custom-order-form input[name=name]'), $('#custom-order-form textarea[name=details]')]) {
    field.addEventListener('input', () => field.setCustomValidity(field.value.trim() ? '' : 'Preencha este campo.'));
  }
  const today = new Date();
  const localDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  $('input[name=date]').min = localDate;
  $('#custom-order-form').addEventListener('submit', event => {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    if (values.get('date') < localDate) { $('input[name=date]').reportValidity(); return; }
    const date = new Date(`${values.get('date')}T12:00:00`).toLocaleDateString('pt-BR');
    customMessage = `Olá, ${shop.name}! Sou ${String(values.get('name')).trim()} e gostaria de fazer uma encomenda.\n\nData: ${date}\nHorário desejado: ${values.get('time') || 'a combinar'}\nConvidados: ${values.get('guests') || 'a informar'}\nDetalhes: ${String(values.get('details')).trim()}\n\nPodemos conversar sobre sabores, orçamento e disponibilidade?`;
    sendWhatsapp(customMessage, 'custom-config-notice');
  });
  $('#privacy-open').addEventListener('click', () => {
    $('#info-title').textContent = 'Sua privacidade';
    $('#info-content').innerHTML = '<p>Este site guarda apenas os itens da sacola no armazenamento local do seu navegador. Você pode apagá-los pelas configurações do navegador. Não usamos ferramentas de análise ou cookies de publicidade.</p><p>Os dados preenchidos na encomenda ficam nesta página até que você escolha enviá-los pelo WhatsApp ou copiá-los. Nenhum formulário envia dados para um servidor deste site.</p><p>Ao continuar no WhatsApp, você acessa um serviço externo, sujeito à política de privacidade desse serviço.</p>';
    openDialog('info-dialog');
  });
  const updateHeader = () => $('#header').classList.toggle('scrolled', window.scrollY > 20);
  addEventListener('scroll', updateHeader, { passive: true });
  const sections = $$('#inicio,#galeria,#docinhos,#retirada,#contato');
  if ('IntersectionObserver' in window) {
    const navObserver = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      $$('.desktop-nav>a').forEach(link => link.classList.toggle('active', link.hash === `#${entry.target.id}`));
    }), { rootMargin: '-20% 0px -50% 0px', threshold: 0 });
    sections.forEach(section => navObserver.observe(section));
  }
  // Uma imagem local alternativa preserva a composição se o arquivo principal falhar.
  $('.hero-photo img').addEventListener('error', event => {
    if (event.target.dataset.fallback) return;
    event.target.dataset.fallback = 'true';
    event.target.closest('picture')?.querySelector('source')?.remove();
    event.target.src = matchMedia('(max-width: 540px)').matches ? 'assets/hero-fallback.webp' : 'assets/hero-wide-fallback.webp';
  });
  const catalogImage = new Image();
  catalogImage.onerror = () => document.body.classList.add('catalog-fallback');
  catalogImage.src = 'assets/catalog.webp';
  $('#year').textContent = new Date().getFullYear();
  $('#pickup-street').textContent = shop.pickup.street;
  $('#pickup-neighborhood').textContent = shop.pickup.neighborhood;
  $('#pickup-city').textContent = shop.pickup.city;
  $('#instagram-caption').textContent = shop.instagram ? 'Nossas criações' : 'Em breve';
  renderCatalog(); renderCart(); updateHeader();
})();
