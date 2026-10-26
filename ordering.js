(() => {
  'use strict';
  const shop = window.SHOP;
  const sweets = shop.sweets;
  const policy = shop.ordering;
  const $ = selector => document.querySelector(selector);
  const money = value => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  const selected = new Map();
  let cake = { complete: false, started: false, summary: '', guests: '', totalCents: 0 };
  const localISO = date => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  const minimumDate = new Date();
  minimumDate.setDate(minimumDate.getDate() + policy.leadDays);
  $('#pickup-date').min = localISO(minimumDate);

  $('#sweet-options').innerHTML = sweets.flavors.map(flavor => `<div class="sweet-choice" data-sweet="${flavor.id}">
    <label class="sweet-option"><input class="sr-only" type="checkbox" name="sweet-flavor" value="${flavor.id}">
      <span class="sweet-photo" style="--sweet-x:${(flavor.photo % 3) * 50}%;--sweet-y:${Math.floor(flavor.photo / 3) * 100}%"><span class="sweet-check" aria-hidden="true"><svg><use href="#i-check"/></svg></span></span>
      <span class="sweet-name">${flavor.name}${flavor.note ? `<small>${flavor.note}</small>` : ''}</span>
    </label>
    <div class="sweet-quantity" role="group" aria-label="Quantidade de ${flavor.name}" hidden><button type="button" data-sweet-minus="${flavor.id}" aria-label="Diminuir ${flavor.name}">−</button><output aria-live="polite">${sweets.minimumPerFlavor} un.</output><button type="button" data-sweet-plus="${flavor.id}" aria-label="Aumentar ${flavor.name}">+</button></div>
  </div>`).join('');
  $('#sweet-weight').textContent = `${sweets.weight} g`;
  $('#sweet-special-price').textContent = `+ ${money(sweets.specialPerHundred)} / cento`;
  $('#sweets-minimum').innerHTML = `Pedido mínimo: <strong>${sweets.minimumPerFlavor} unidades de cada sabor.</strong>`;
  const policies = [
    ['calendar', `Encomende com pelo menos ${policy.leadDays} dias de antecedência.`],
    ['clock', 'Pedidos urgentes estão sujeitos à disponibilidade e podem ter taxa adicional.'],
    ['check', `A data é reservada após a confirmação e o pagamento de ${policy.depositPercent}% do valor.`],
    ['payment', `Pagamento por ${policy.paymentMethods}. Combine os detalhes no atendimento.`]
  ];
  $('#ordering-policies').innerHTML = policies.map(([icon, text]) => `<li><svg aria-hidden="true"><use href="#i-${icon}"/></svg><span>${text}</span></li>`).join('');

  function sweetLines() {
    return sweets.flavors.filter(flavor => selected.has(flavor.id)).map(flavor => `${selected.get(flavor.id)} ${flavor.name}${$('#special-sweets').checked ? ' (cobertura especial)' : ''}`);
  }
  function totalCents() {
    const quantity = [...selected.values()].reduce((sum, value) => sum + value, 0);
    return (cake.complete ? cake.totalCents : 0) + Math.round(quantity * (sweets.pricePerHundred + ($('#special-sweets').checked ? sweets.specialPerHundred : 0)));
  }
  function update() {
    $('#enquiry-cake').textContent = cake.started ? cake.summary : selected.size ? 'Docinhos de festa, feitos com carinho.' : 'O seu bolo e os docinhos escolhidos aparecem aqui.';
    $('#clear-cake').hidden = !cake.started;
    $('#enquiry-sweets').textContent = sweetLines().join(' · ');
    $('#enquiry-sweets').hidden = !selected.size;
    $('#enquiry-total').hidden = !cake.complete && !selected.size;
    $('#enquiry-total strong').textContent = money(totalCents() / 100);
    $('#sweet-price').textContent = money(sweets.pricePerHundred + ($('#special-sweets').checked ? sweets.specialPerHundred : 0));
    $('#enquiry-feedback').textContent = '';
    sweets.flavors.forEach(flavor => {
      const card = $(`[data-sweet="${flavor.id}"]`);
      const quantity = selected.get(flavor.id);
      card.querySelector('.sweet-quantity').hidden = !quantity;
      card.querySelector('output').textContent = `${quantity || sweets.minimumPerFlavor} un.`;
      card.querySelector('[data-sweet-minus]').disabled = !quantity || quantity <= sweets.minimumPerFlavor;
    });
  }
  document.addEventListener('docecia:cake-updated', event => { cake = event.detail; update(); });
  document.addEventListener('docecia:review-cake', () => {
    $('#sua-encomenda').classList.add('in-view');
    $('#sua-encomenda').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'center' });
    $('#pickup-date').focus({ preventScroll: true });
  });
  $('#clear-cake').addEventListener('click', () => {
    document.dispatchEvent(new CustomEvent('docecia:clear-cake'));
    $('#pickup-date').focus({ preventScroll: true });
  });
  $('#sweet-options').addEventListener('change', event => {
    if (event.target.name !== 'sweet-flavor') return;
    if (event.target.checked) selected.set(event.target.value, sweets.minimumPerFlavor);
    else selected.delete(event.target.value);
    update();
  });
  $('#sweet-options').addEventListener('click', event => {
    const button = event.target.closest('[data-sweet-minus], [data-sweet-plus]');
    if (!button) return;
    const id = button.dataset.sweetMinus || button.dataset.sweetPlus;
    if (!selected.has(id)) return;
    selected.set(id, Math.max(sweets.minimumPerFlavor, selected.get(id) + (button.hasAttribute('data-sweet-plus') ? sweets.minimumPerFlavor : -sweets.minimumPerFlavor)));
    update();
  });
  $('#special-sweets').addEventListener('change', update);
  $('#enquiry-form').addEventListener('input', () => { $('#enquiry-feedback').textContent = ''; });
  $('#enquiry-form').addEventListener('submit', event => {
    event.preventDefault();
    if (cake.started && !cake.complete) {
      $('#enquiry-feedback').textContent = 'Complete o bolo com um tamanho e pelo menos 1 recheio, ou remova-o para pedir somente docinhos.';
      return;
    }
    if (!cake.complete && !selected.size) {
      $('#enquiry-feedback').textContent = 'Monte seu bolo ou escolha os sabores de docinhos para continuar.';
      return;
    }
    if (!event.currentTarget.reportValidity()) return;
    const notes = $('#pickup-notes').value.trim();
    const summary = [
      cake.complete ? cake.summary : '',
      selected.size ? `Docinhos (${sweets.weight} g):\n${sweetLines().join('\n')}.` : '',
      `Total estimado: ${money(totalCents() / 100)}. Valores demonstrativos; confirmar disponibilidade e detalhes no atendimento.`,
      notes ? `Observações: ${notes}` : ''
    ].filter(Boolean).join('\n\n');
    document.dispatchEvent(new CustomEvent('docecia:configured-cake', { detail: { summary, guests: cake.complete ? cake.guests : '', date: $('#pickup-date').value, time: $('#pickup-time').value } }));
  });
  update();
})();
