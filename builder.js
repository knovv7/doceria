(() => {
  'use strict';
  const config = window.SHOP.builder;
  const $ = selector => document.querySelector(selector);
  const money = value => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  const state = { size: null, dough: config.doughs[0].id, fillings: [], coating: config.coatings[0].id, extras: [] };
  let cakeView;
  let pendingSelection;
  let viewLoading = false;
  const ingredientPhoto = index => `style="--photo-x:${(index % 5) * 25}%;--photo-y:${Math.floor(index / 5) * 100 / 3}%"`;
  const checked = '<span class="option-check" aria-hidden="true"><svg><use href="#i-check"/></svg></span>';

  $('#cake-sizes').innerHTML = config.sizes.map((size, index) => `<label class="cake-size-card reveal" style="--index:${index}">
    <input class="sr-only" type="radio" name="cake-size" value="${size.id}" aria-label="Tamanho ${size.label}, ${size.diameter} centímetros, ${size.servings}, ${money(size.price)}">
    <span class="size-photo" style="--size-position:${(size.photo % 3) * 50}%;--size-row:${size.photo < 3 ? 8 : 92}%" role="img" aria-label="Bolo artesanal tamanho ${size.label}"></span>
    <span class="size-medallion">${size.label}</span><strong class="size-diameter">${size.diameter} cm</strong><span class="size-servings">${size.servings}</span><strong class="size-price">${money(size.price)}</strong>${checked}
  </label>`).join('');

  $('#builder-doughs').innerHTML = config.doughs.map((dough, index) => `<label class="ingredient-option"><input class="sr-only" type="radio" name="dough" value="${dough.id}" ${index === 0 ? 'checked' : ''}><span class="ingredient-photo" ${ingredientPhoto(dough.photo)}></span><span>${dough.name}</span>${checked}</label>`).join('');
  $('#builder-fillings').innerHTML = config.fillings.map(filling => `<label class="ingredient-option"><input class="sr-only" type="checkbox" name="filling" value="${filling.id}" aria-describedby="fillings-help"><span class="ingredient-photo" ${ingredientPhoto(filling.photo)}></span><span>${filling.name}</span>${checked}</label>`).join('');
  $('#builder-coatings').innerHTML = config.coatings.map((coating, index) => `<label class="ingredient-option coating-option"><input class="sr-only" type="radio" name="coating" value="${coating.id}" ${index === 0 ? 'checked' : ''}><span class="ingredient-photo" ${ingredientPhoto(coating.photo)}></span><span>${coating.name}<small>${coating.price ? `+ ${money(coating.price)}` : 'Incluída'}</small></span>${checked}</label>`).join('');
  $('#builder-extras').innerHTML = config.extras.map(extra => `<label class="decoration-option"><input class="sr-only" type="checkbox" name="cake-extra" value="${extra.id}"><span class="decoration-photo" ${ingredientPhoto(extra.photo)}></span><span class="decoration-name">${extra.name}</span><span class="decoration-price">+ ${money(extra.price)}</span>${checked}</label>`).join('');

  function selections() {
    return {
      size: config.sizes.find(size => size.id === state.size),
      dough: config.doughs.find(dough => dough.id === state.dough),
      fillings: state.fillings.map(id => config.fillings.find(filling => filling.id === id)),
      coating: config.coatings.find(coating => coating.id === state.coating),
      extras: state.extras.map(id => config.extras.find(extra => extra.id === id))
    };
  }
  function totalCents(selection) {
    if (!selection.size) return 0;
    return Math.round(selection.size.price * 100) + Math.round(selection.coating.price * 100) + selection.extras.reduce((sum, extra) => sum + Math.round(extra.price * 100), 0);
  }
  function coatingName(selection) {
    return selection.coating.id === 'recheio' ? (selection.fillings.map(filling => filling.name).join(' + ') || 'Chantininho') : selection.coating.name;
  }
  function orderSelection(selection) {
    const complete = Boolean(selection.size && selection.fillings.length);
    const lines = [
      selection.size ? `Bolo ${selection.size.label} · ${selection.size.diameter} cm (${selection.size.servings}).` : 'Tamanho a escolher.',
      `Massa: ${selection.dough.name}. Recheios: ${selection.fillings.map(filling => filling.name).join(' + ') || 'a escolher'}.`,
      `Cobertura: ${coatingName(selection)}.`,
      `Decoração: ${selection.extras.map(extra => extra.name).join(', ') || 'sem adicionais'}.`
    ];
    return { complete, started: Boolean(selection.size || selection.fillings.length || selection.extras.length), summary: lines.join('\n'), guests: selection.size?.guests || '', totalCents: totalCents(selection) };
  }
  async function initialize3D() {
    if (viewLoading) return;
    viewLoading = true;
    try {
      const { CakePreview3D } = await import('./cake-3d.mjs');
      cakeView = new CakePreview3D($('#cake-preview'));
      cakeView.update(pendingSelection);
      $('#preview-reset').hidden = false;
      $('#preview-drag-hint').hidden = false;
      $('#preview-reset').addEventListener('click', () => cakeView.resetView());
    } catch (error) {
      const preview = $('#cake-preview');
      preview.classList.add('preview-fallback');
      preview.innerHTML = '<p class="preview-unavailable">Prévia ilustrativa. A visualização 3D não está disponível neste navegador.</p>';
      preview.dataset.renderer = 'fallback';
      preview.dataset.error = error.message;
    }
  }
  function updatePreview() {
    const selection = selections();
    const hasChocolateDough = state.dough === 'chocolate';
    const hasChocolateCoating = state.coating === 'chocolate';
    const variant = Number(hasChocolateDough) + Number(hasChocolateCoating) * 2;
    const preview = $('#cake-preview');
    preview.classList.remove('preview-0', 'preview-1', 'preview-2', 'preview-3');
    preview.classList.add(`preview-${variant}`);
    preview.setAttribute('aria-label', `Prévia 3D: massa ${selection.dough.name.toLowerCase()}, cobertura de ${coatingName(selection).toLowerCase()}. Recheios: ${selection.fillings.map(filling => filling.name).join(' e ') || 'a escolher'}. Decoração: ${selection.extras.map(extra => extra.name).join(', ') || 'sem adicionais'}.`);
    pendingSelection = selection;
    cakeView?.update(selection);
    $('#preview-size').textContent = selection.size ? `${selection.size.label} · ${selection.size.diameter} cm · ${selection.size.servings}` : 'Escolha um tamanho';
    $('#preview-fillings').innerHTML = selection.fillings.map(filling => `<span><i style="background:${filling.color}" aria-hidden="true"></i>${filling.name}</span>`).join('');
    $('#preview-caption').textContent = `${selection.dough.name} · ${coatingName(selection)}`;
    $('#preview-extras').hidden = !selection.extras.length;
    $('#preview-extras').textContent = selection.extras.map(extra => extra.name).join(' + ');
    $('#builder-total').textContent = selection.size ? money(totalCents(selection) / 100) : '—';
    const complete = Boolean(selection.size && selection.fillings.length);
    $('#builder-order').disabled = !complete;
    $('#builder-feedback').textContent = !selection.size ? 'Selecione um tamanho e pelo menos 1 recheio.' : !selection.fillings.length ? 'Agora escolha 1 ou 2 recheios para continuar.' : 'Sua combinação está pronta para encomendar.';
    const limitReached = state.fillings.length >= config.maxFillings;
    document.querySelectorAll('input[name=filling]').forEach(input => {
      input.disabled = limitReached && !input.checked;
    });
    $('#fillings-help').textContent = limitReached ? '2 sabores escolhidos. Desmarque um para trocar.' : `Escolha 1 ou 2 sabores. ${state.fillings.length}/2 selecionados.`;
    document.dispatchEvent(new CustomEvent('docecia:cake-updated', { detail: orderSelection(selection) }));
  }

  document.addEventListener('change', event => {
    const input = event.target;
    if (!input.matches('#cake-sizes input, #cake-builder input, #builder-extras input')) return;
    if (input.name === 'cake-size') state.size = input.value;
    if (input.name === 'dough') state.dough = input.value;
    if (input.name === 'coating') state.coating = input.value;
    if (input.name === 'filling') {
      if (input.checked && state.fillings.length < config.maxFillings) state.fillings.push(input.value);
      else if (input.checked) input.checked = false;
      else state.fillings = state.fillings.filter(id => id !== input.value);
    }
    if (input.name === 'cake-extra') {
      if (input.checked) state.extras.push(input.value);
      else state.extras = state.extras.filter(id => id !== input.value);
    }
    updatePreview();
  });

  $('#cake-builder').addEventListener('submit', event => {
    event.preventDefault();
    const selection = selections();
    if (!selection.size || !selection.fillings.length) return;
    document.dispatchEvent(new CustomEvent('docecia:review-cake', { detail: orderSelection(selection) }));
  });

  document.addEventListener('docecia:clear-cake', () => {
    state.size = null;
    state.fillings = [];
    state.extras = [];
    state.dough = config.doughs[0].id;
    state.coating = config.coatings[0].id;
    document.querySelectorAll('#cake-sizes input, #cake-builder input, #builder-extras input').forEach(input => {
      input.checked = (input.name === 'dough' && input.value === state.dough) || (input.name === 'coating' && input.value === state.coating);
    });
    updatePreview();
  });

  updatePreview();
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { observer.disconnect(); initialize3D(); }
    }, { rootMargin: '450px 0px' });
    observer.observe($('#cake-preview'));
  } else initialize3D();
})();
