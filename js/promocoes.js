/* promocoes.js
   Funções para injetar automaticamente embeds do Instagram em um grid de promoções.
   Uso:
     import/insira este script no fim do <body>
     chame renderPromocoes(arrayDeLinks, 'promocoes-grid')

   Observações:
   - O Instagram exige o script https://www.instagram.com/embed.js para processar os blockquotes.
   - Este módulo carrega o script se não estiver presente e chama a função de processo.
*/

(function (global) {
  'use strict';

  /**
   * Carrega o script de embed do Instagram (uma única vez) e retorna uma Promise
   * que resolve quando window.instgrm.Embeds.process() estiver disponível.
   */
  function loadInstagramEmbedScript() {
    return new Promise((resolve) => {
      // Se já existe a API carregada, resolve imediatamente (apenas chamaremos process())
      if (window.instgrm && typeof window.instgrm.Embeds === 'object' && typeof window.instgrm.Embeds.process === 'function') {
        resolve(window.instgrm);
        return;
      }

      // Se já existe a tag <script> apontando para o embed.js, aguardar onload
      const existing = Array.from(document.getElementsByTagName('script')).find(s => s.src && s.src.indexOf('instagram.com/embed.js') !== -1);
      if (existing) {
        existing.addEventListener('load', () => resolve(window.instgrm));
        // Caso já tenha sido carregado mas antes do evento, tentar resolver
        setTimeout(() => { if (window.instgrm) resolve(window.instgrm); }, 600);
        return;
      }

      // Criar a tag script e inserir no head
      const s = document.createElement('script');
      s.src = 'https://www.instagram.com/embed.js';
      s.async = true;
      s.onload = () => {
        // O script define window.instgrm; aguardar um pequeno timeout para garantir
        setTimeout(() => resolve(window.instgrm), 120);
      };
      s.onerror = () => {
        console.warn('Falha ao carregar https://www.instagram.com/embed.js');
        resolve(null);
      };
      document.head.appendChild(s);
    });
  }

  /**
   * Cria o markup do blockquote do Instagram para uma postagem pública.
   * O Instagram aceita blockquotes com atributo data-instgrm-permalink.
   */
  function createInstagramBlockquote(link) {
    const block = document.createElement('blockquote');
    block.className = 'instagram-media';
    block.setAttribute('data-instgrm-permalink', link);
    block.setAttribute('data-instgrm-captioned', '');
    block.style = 'background:transparent; border:none;';

    // Texto alternativo para usuários sem JS
    const a = document.createElement('a');
    a.href = link;
    a.textContent = 'Ver publicação no Instagram';
    block.appendChild(a);

    return block;
  }

  /**
   * renderPromocoes
   * - promotions: array de objetos de promoção (com photo, name, price, description e instagramLink)
   * - containerId: id do grid (default 'promocoes-grid')
   */
  async function renderPromocoes(promotions, containerId = 'promocoes-grid') {
    if (!Array.isArray(promotions)) {
      console.error('renderPromocoes espera um array de objetos de promoção.');
      return;
    }

    const container = document.getElementById(containerId);
    if (!container) {
      console.error('Container não encontrado:', containerId);
      return;
    }

    // Limpar grid
    container.innerHTML = '';

    // Se não há promoções, ocultar a seção
    if (promotions.length === 0) {
      const section = container.closest('section');
      if (section) section.style.display = 'none';
      return;
    }

    // Mostrar a seção se há promoções
    const section = container.closest('section');
    if (section) section.style.display = 'block';

    // Para cada promoção, criar um card clicável
    promotions.forEach((promo, index) => {
      const card = document.createElement('div');
      card.className = 'promo-card clickable-promo';
      card.setAttribute('data-promo-id', promo.id || index);
      card.style.cursor = 'pointer';

      // Container do conteúdo visual
      const visualContent = document.createElement('div');
      visualContent.className = 'promo-visual';

      // Se tem foto (URL do Storage), mostrar imagem
      if (promo.photo) {
        const img = document.createElement('img');
        img.src = promo.photo;
        img.alt = promo.name || 'Promoção';
        img.className = 'promo-image';
        img.onerror = () => {
          img.src = 'https://via.placeholder.com/400x300?text=Imagem+Indisponivel';
        };
        visualContent.appendChild(img);
      }
      // Se tem instagramLink, mostrar embed do Instagram
      else if (promo.instagramLink) {
        const block = createInstagramBlockquote(promo.instagramLink);
        visualContent.appendChild(block);
      }
      // Fallback: placeholder
      else {
        const placeholder = document.createElement('div');
        placeholder.className = 'promo-placeholder';
        placeholder.innerHTML = '<span>🎉</span>';
        visualContent.appendChild(placeholder);
      }

      card.appendChild(visualContent);

      // Informações da promoção (nome e preço)
      const infoContent = document.createElement('div');
      infoContent.className = 'promo-info';

      if (promo.name) {
        const title = document.createElement('h3');
        title.className = 'promo-title';
        title.textContent = promo.name;
        infoContent.appendChild(title);
      }

      if (promo.price !== undefined && promo.price !== null) {
        const priceElement = document.createElement('div');
        priceElement.className = 'promo-price';
        priceElement.textContent = typeof promo.price === 'number' 
          ? `R$ ${promo.price.toFixed(2).replace('.', ',')}` 
          : promo.price;
        infoContent.appendChild(priceElement);
      }

      // Descrição curta (truncada)
      if (promo.description) {
        const desc = document.createElement('p');
        desc.className = 'promo-description-short';
        desc.textContent = promo.description.length > 80 
          ? promo.description.substring(0, 80) + '...'
          : promo.description;
        infoContent.appendChild(desc);
      }

      // Indicador de clique
      const clickIndicator = document.createElement('div');
      clickIndicator.className = 'promo-click-indicator';
      clickIndicator.innerHTML = '<span>👆 Clique para ver detalhes</span>';
      infoContent.appendChild(clickIndicator);

      card.appendChild(infoContent);

      // Event listener para abrir modal
      card.addEventListener('click', () => openPromoModal(promo));

      container.appendChild(card);
    });

    // Carregar (ou reutilizar) o script do Instagram e processar os embeds (apenas se há links do Instagram)
    const hasInstagramLinks = promotions.some(p => p.instagramLink);
    if (hasInstagramLinks) {
      const instgrm = await loadInstagramEmbedScript();
      if (instgrm && typeof instgrm.Embeds === 'object' && typeof instgrm.Embeds.process === 'function') {
        try {
          instgrm.Embeds.process();
        } catch (err) {
          // Em algumas circunstâncias o process pode falhar primeiro; tentar novamente
          setTimeout(() => {
            try { instgrm.Embeds.process(); } catch (e) { console.warn('instgrm process falhou', e); }
          }, 500);
        }
      } else {
        // Se não foi possível carregar a API, deixar os links clicáveis (fallback)
        console.warn('Instagram embed script não disponível. As cards mostram link simples como fallback.');
      }
    }
  }

    // Carregar (ou reutilizar) o script do Instagram e processar os embeds (apenas se há links do Instagram)
    const hasInstagramLinks = promotions.some(p => p.instagramLink);
    if (hasInstagramLinks) {
      const instgrm = await loadInstagramEmbedScript();
      if (instgrm && typeof instgrm.Embeds === 'object' && typeof instgrm.Embeds.process === 'function') {
        try {
          instgrm.Embeds.process();
        } catch (err) {
          // Em algumas circunstâncias o process pode falhar primeiro; tentar novamente
          setTimeout(() => {
            try { instgrm.Embeds.process(); } catch (e) { console.warn('instgrm process falhou', e); }
          }, 500);
        }
      } else {
        // Se não foi possível carregar a API, deixar os links clicáveis (fallback)
        console.warn('Instagram embed script não disponível. As cards mostram link simples como fallback.');
      }
    }
  }

  // Expor a função globalmente para uso direto em páginas que não usam módulos.
  global.renderPromocoes = renderPromocoes;

  // Opcional: botão de recarregar dentro da seção (se existir)
  document.addEventListener('click', (ev) => {
    const el = ev.target;
    if (el && el.id === 'promocoes-reload') {
      // Se quiser, pode guardar os links em window.promocoesLinks para reuso.
      if (window.promocoesLinks && Array.isArray(window.promocoesLinks)) {
        renderPromocoes(window.promocoesLinks);
      } else {
        // apenas recarrega processo do instgrm
        if (window.instgrm && window.instgrm.Embeds && typeof window.instgrm.Embeds.process === 'function') {
          try { window.instgrm.Embeds.process(); } catch (e) { console.warn(e); }
        }
      }
    }
  });

})(window);

/* Fim de promocoes.js */
