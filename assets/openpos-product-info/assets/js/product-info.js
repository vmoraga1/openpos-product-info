/**
 * OpenPOS Product Info v1.3
 * Muestra información adicional del producto en OpenPOS
 * Soporta modales de productos simples y variables
 */

(function() {
    'use strict';
    
    console.log('[OPPI] v1.3 - Iniciando...');
    
    const config = window.oppiConfig || {
        maxDescriptionLength: 150,
        labels: {
            showMore: 'Ver más',
            showLess: 'Ver menos'
        }
    };
    
    // Variables globales
    let lastShownProductId = null;
    window.__oppi_productCache = window.__oppi_productCache || {};
    window.__oppi_clickedProductName = null;
    
    /**
     * Decodificar entidades HTML
     */
    function decodeHTML(html) {
        const txt = document.createElement('textarea');
        txt.innerHTML = html;
        return txt.value;
    }
    
    /**
     * Normalizar nombre de producto para comparación
     */
    function normalizeName(name) {
        if (!name) return '';
        return name.trim().toLowerCase().replace(/\s+/g, ' ');
    }
    
    /**
     * Buscar producto en cache por nombre (búsqueda flexible)
     */
    function findProductInCache(searchName) {
        if (!searchName || !window.__oppi_productCache) return null;
        
        const normalized = normalizeName(searchName);
        
        // Búsqueda exacta primero
        for (const [name, product] of Object.entries(window.__oppi_productCache)) {
            if (normalizeName(name) === normalized) {
                return product;
            }
        }
        
        // Búsqueda parcial (el nombre del carrito puede estar truncado)
        for (const [name, product] of Object.entries(window.__oppi_productCache)) {
            if (normalizeName(name).includes(normalized) || normalized.includes(normalizeName(name))) {
                return product;
            }
        }
        
        return null;
    }
    
    /**
     * Detectar si es modal de variaciones
     */
    function isVariationModal(modal) {
        return modal.querySelector('app-options') !== null;
    }
    
    /**
     * Crear HTML de información del producto
     */
    function createInfoHTML(product, isCompact) {
        if (!product) return '';
        
        let sections = [];
        
        // Descripción corta
        if (product.short_description) {
            sections.push(`
                <div class="oppi-row">
                    <span class="oppi-lbl">DESCRIPCIÓN:</span>
                    <span class="oppi-val oppi-desc">${product.short_description}</span>
                </div>
            `);
        }
        
        // Descripción completa (si es diferente a la corta) - solo en modo no compacto
        if (!isCompact && product.description && product.description !== product.short_description) {
            const desc = product.description;
            const isLong = desc.length > config.maxDescriptionLength;
            
            if (isLong) {
                const short = desc.substring(0, config.maxDescriptionLength) + '...';
                sections.push(`
                    <div class="oppi-row">
                        <span class="oppi-lbl">DETALLES:</span>
                        <span class="oppi-val oppi-desc">
                            <span class="oppi-short">${short}</span>
                            <span class="oppi-full" style="display:none">${desc}</span>
                            <a href="#" class="oppi-toggle" onclick="event.preventDefault();window.oppiToggle(this)">${config.labels.showMore}</a>
                        </span>
                    </div>
                `);
            } else {
                sections.push(`
                    <div class="oppi-row">
                        <span class="oppi-lbl">DETALLES:</span>
                        <span class="oppi-val oppi-desc">${desc}</span>
                    </div>
                `);
            }
        }
        
        // Etiquetas
        if (product.tags_string) {
            const tags = product.tags_string.split(', ').map(t => 
                `<span class="oppi-tag">${t}</span>`
            ).join('');
            sections.push(`
                <div class="oppi-row">
                    <span class="oppi-lbl">ETIQUETAS:</span>
                    <span class="oppi-val">${tags}</span>
                </div>
            `);
        }
        
        // Marca
        if (product.brand) {
            sections.push(`
                <div class="oppi-row">
                    <span class="oppi-lbl">MARCA:</span>
                    <span class="oppi-val oppi-brand">${product.brand}</span>
                </div>
            `);
        }
        
        // Peso - solo en modo no compacto
        if (!isCompact && product.weight_display) {
            sections.push(`
                <div class="oppi-row">
                    <span class="oppi-lbl">PESO:</span>
                    <span class="oppi-val oppi-mono">${product.weight_display}</span>
                </div>
            `);
        }
        
        // Dimensiones - solo en modo no compacto
        if (!isCompact && product.dimensions_display) {
            sections.push(`
                <div class="oppi-row">
                    <span class="oppi-lbl">DIMENSIONES:</span>
                    <span class="oppi-val oppi-mono">${decodeHTML(product.dimensions_display)}</span>
                </div>
            `);
        }
        
        // Atributos - solo en modo no compacto
        if (!isCompact && product.product_attributes && product.product_attributes.length > 0) {
            const attrs = product.product_attributes.map(a => 
                `<div class="oppi-attr"><b>${a.name}:</b> ${a.value}</div>`
            ).join('');
            sections.push(`
                <div class="oppi-row">
                    <span class="oppi-lbl">ATRIBUTOS:</span>
                    <span class="oppi-val">${attrs}</span>
                </div>
            `);
        }
        
        // SKU
        if (product.sku) {
            sections.push(`
                <div class="oppi-row">
                    <span class="oppi-lbl">SKU:</span>
                    <span class="oppi-val oppi-mono">${product.sku}</span>
                </div>
            `);
        }
        
        if (sections.length === 0) {
            return '';
        }
        
        const compactClass = isCompact ? 'oppi-compact' : '';
        
        return `
            <div id="oppi-box" class="oppi-box ${compactClass}">
                <div class="oppi-header">ℹ️ Información del Producto</div>
                <div class="oppi-body">${sections.join('')}</div>
            </div>
        `;
    }
    
    /**
     * Toggle para descripción larga
     */
    window.oppiToggle = function(el) {
        const container = el.parentElement;
        const short = container.querySelector('.oppi-short');
        const full = container.querySelector('.oppi-full');
        
        if (full.style.display === 'none') {
            short.style.display = 'none';
            full.style.display = 'inline';
            el.textContent = config.labels.showLess;
        } else {
            short.style.display = 'inline';
            full.style.display = 'none';
            el.textContent = config.labels.showMore;
        }
    };
 
    /**
     * Inyectar información en el modal
     */
    function injectInfo(product, modal) {
        const existing = document.getElementById('oppi-box');
        if (existing) {
            if (existing.dataset.productId == product.id && !product._fromDOM) {
                return;
            }
            existing.remove();
        }
        
        if (!product) return;
        if (!modal) modal = document.querySelector('.mat-dialog-container');
        if (!modal) return;
        
        const isVariation = isVariationModal(modal);
        const html = createInfoHTML(product, isVariation);
        if (!html) return;
        
        const div = document.createElement('div');
        div.innerHTML = html;
        const infoBox = div.firstElementChild;
        
        let inserted = false;
        
        // Estrategia de inserción para modal de VARIACIONES
        if (isVariation) {
            // Opción 1: Después del título (.option-popup-title)
            const popupTitle = modal.querySelector('.option-popup-title');
            if (popupTitle && popupTitle.parentNode) {
                popupTitle.parentNode.insertBefore(infoBox, popupTitle.nextSibling);
                inserted = true;
            }
            
            // Opción 2: Dentro de mat-dialog-content al principio
            if (!inserted) {
                const dialogContent = modal.querySelector('.mat-dialog-content');
                if (dialogContent) {
                    dialogContent.insertBefore(infoBox, dialogContent.firstChild);
                    inserted = true;
                }
            }
        }
        
        // Estrategia de inserción para modal SIMPLE (producto normal)
        if (!inserted) {
            const insertTargets = [
                '.item-price',
                '.item-form',
                '.item-main-container',
                '.item-rows',
                '.item-container',
                '.mat-dialog-content'
            ];
            
            for (const selector of insertTargets) {
                const target = modal.querySelector(selector);
                if (target) {
                    if (selector === '.item-price' && target.nextSibling) {
                        target.parentNode.insertBefore(infoBox, target.nextSibling);
                        inserted = true;
                        break;
                    }
                    
                    if (selector === '.item-form') {
                        target.parentNode.insertBefore(infoBox, target);
                        inserted = true;
                        break;
                    }
                    
                    if (selector === '.item-main-container' || selector === '.item-rows') {
                        target.insertBefore(infoBox, target.firstChild);
                        inserted = true;
                        break;
                    }
                    
                    target.appendChild(infoBox);
                    inserted = true;
                    break;
                }
            }
        }
        
        if (!inserted && modal) {
            modal.appendChild(infoBox);
            inserted = true;
        }
        
        if (inserted) {
            infoBox.dataset.productId = product.id || 0;
            lastShownProductId = product.id;
            console.log('[OPPI] ✅ Info inyectada para:', product.name, isVariation ? '(variable)' : '(simple)');
        }
    }
    
    /**
     * Extraer nombre del producto desde el modal
     */
    function getProductNameFromModal(modal) {
        if (!modal) modal = document.querySelector('.mat-dialog-container');
        if (!modal) return null;
        
        // Selectores para ambos tipos de modal
        const selectors = [
            '.option-popup-title h1',  // Modal variaciones
            '.option-popup-title',      // Modal variaciones (fallback)
            '.item-title',              // Modal simple
            '.product-name',
            '.mat-dialog-title',
            'h1',
            'h2',
            '.item-name'
        ];
        
        for (const selector of selectors) {
            const el = modal.querySelector(selector);
            if (el) {
                const text = el.textContent.trim();
                if (text && text.length > 0) {
                    return text;
                }
            }
        }
        
        return null;
    }

    /**
     * Obtener producto actual - múltiples estrategias
     */
    async function getProduct(modal) {
        // Obtener nombre del modal actual
        const modalProductName = getProductNameFromModal(modal);
        
        // Estrategia 1: Si tenemos un nombre clickeado, buscar por ese nombre
        if (window.__oppi_clickedProductName) {
            const cached = findProductInCache(window.__oppi_clickedProductName);
            if (cached) {
                console.log('[OPPI] Producto desde click capturado:', cached.name);
                window.__oppi_clickedProductName = null;
                return cached;
            }
        }
        
        // Estrategia 2: Buscar por nombre del modal en el cache
        if (modalProductName) {
            const cached = findProductInCache(modalProductName);
            if (cached) {
                console.log('[OPPI] Producto desde cache (nombre modal):', cached.name);
                return cached;
            }
        }
        
        // Estrategia 3: Último producto capturado (solo si coincide con el modal)
        if (window.__oppi_lastProduct) {
            if (!modalProductName || normalizeName(window.__oppi_lastProduct.name) === normalizeName(modalProductName)) {
                console.log('[OPPI] Producto desde __oppi_lastProduct:', window.__oppi_lastProduct.name);
                return window.__oppi_lastProduct;
            }
        }
        
        // Estrategia 4: Datos básicos del DOM
        if (modalProductName) {
            console.log('[OPPI] Usando nombre del modal (sin datos adicionales):', modalProductName);
            return { 
                id: 0, 
                name: modalProductName, 
                _fromDOM: true 
            };
        }
        
        return null;
    }
    
    /**
     * Manejar apertura de modal
     */
    async function handleModal(modal) {
        // Evitar procesar el mismo modal múltiples veces
        if (modal.dataset.oppiProcessed) return;
        modal.dataset.oppiProcessed = 'true';
        
        // Esperar a que Angular renderice el contenido
        await new Promise(r => setTimeout(r, 300));
        
        const product = await getProduct(modal);
        
        if (product) {
            injectInfo(product, modal);
        }
    }
    
    /**
     * Capturar clic en items del carrito y productos
     */
    function setupClickCapture() {
        document.addEventListener('click', (e) => {
            // Detectar clic en item del carrito
            const cartItem = e.target.closest('.cart-item, .cart-product, .cart-row, [class*="cart-item"], .item-row');
            
            if (cartItem) {
                const nameSelectors = [
                    '.item-name',
                    '.product-name',
                    '.cart-item-name',
                    '.name',
                    '.title',
                    'span:first-child'
                ];
                
                for (const selector of nameSelectors) {
                    const nameEl = cartItem.querySelector(selector);
                    if (nameEl) {
                        const name = nameEl.textContent.trim();
                        if (name && name.length > 2) {
                            window.__oppi_clickedProductName = name;
                            console.log('[OPPI] Capturado clic en carrito:', name);
                            break;
                        }
                    }
                }
            }
            
            // Detectar clic en producto del grid (para variables)
            const productItem = e.target.closest('.product-item, .product-card, [class*="product-grid"]');
            if (productItem) {
                const nameEl = productItem.querySelector('.product-name, .name, .title');
                if (nameEl) {
                    const name = nameEl.textContent.trim();
                    if (name && name.length > 2) {
                        window.__oppi_clickedProductName = name;
                        console.log('[OPPI] Capturado clic en producto:', name);
                    }
                }
            }
        }, true);
    }
    
    /**
     * Configurar interceptor XHR
     */
    function setupXHRInterceptor() {
        const originalSend = XMLHttpRequest.prototype.send;
        XMLHttpRequest.prototype.send = function(body) {
            try {
                let cartData = null;
                
                if (body instanceof FormData) {
                    const cartValue = body.get('cart');
                    if (cartValue) {
                        cartData = JSON.parse(cartValue);
                    }
                }
                else if (typeof body === 'string' && body.includes('cart')) {
                    try {
                        const parsed = JSON.parse(body);
                        if (parsed.cart) cartData = parsed.cart;
                    } catch (e) {
                        const params = new URLSearchParams(body);
                        const cartValue = params.get('cart');
                        if (cartValue) {
                            cartData = JSON.parse(cartValue);
                        }
                    }
                }
                
                if (cartData && cartData.items && cartData.items.length > 0) {
                    cartData.items.forEach(item => {
                        if (item && item.product) {
                            window.__oppi_productCache[item.product.name] = item.product;
                            
                            // También guardar por nombre del padre si es variación
                            if (item.product.parent_product && item.product.parent_product.name) {
                                window.__oppi_productCache[item.product.parent_product.name] = item.product;
                            }
                        }
                    });
                    
                    const lastItem = cartData.items[cartData.items.length - 1];
                    if (lastItem && lastItem.product) {
                        window.__oppi_lastProduct = lastItem.product;
                        console.log('[OPPI] ✅ Cache actualizado con', cartData.items.length, 'productos');
                    }
                    
                    setTimeout(function() {
                        const modal = document.querySelector('.mat-dialog-container');
                        if (modal && !document.getElementById('oppi-box')) {
                            const modalName = getProductNameFromModal(modal);
                            if (modalName) {
                                const product = findProductInCache(modalName);
                                if (product) {
                                    injectInfo(product, modal);
                                }
                            }
                        }
                    }, 100);
                }
            } catch (e) {
                // Silenciar errores
            }
            return originalSend.apply(this, arguments);
        };
        console.log('[OPPI] XHR interceptor configurado');
    }
    
    /**
     * Observar cambios en el DOM para detectar modales
     */
    function setupObserver() {
        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                for (const node of mutation.addedNodes) {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        if (node.classList && node.classList.contains('mat-dialog-container')) {
                            handleModal(node);
                        }
                        
                        if (node.querySelectorAll) {
                            node.querySelectorAll('.mat-dialog-container').forEach(dialog => {
                                handleModal(dialog);
                            });
                        }
                        
                        if (node.classList && node.classList.contains('cdk-overlay-pane')) {
                            const dialog = node.querySelector('.mat-dialog-container');
                            if (dialog) handleModal(dialog);
                        }
                    }
                }
            }
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        
        console.log('[OPPI] Observer configurado');
    }

    /**
     * Inyectar estilos CSS
     */
    function injectStyles() {
        if (document.getElementById('oppi-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'oppi-styles';
        style.textContent = `
            .oppi-box {
                margin: 12px 0;
                padding: 12px;
                background: linear-gradient(135deg, #f0f4f8 0%, #e2e8f0 100%);
                border-radius: 8px;
                border: 1px solid #cbd5e0;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                font-size: 13px;
                max-height: 300px;
                overflow-y: auto;
            }
            
            /* Modo compacto para modal de variaciones */
            .oppi-box.oppi-compact {
                margin: 8px 12px;
                padding: 8px 10px;
                max-height: 150px;
                font-size: 12px;
            }
            .oppi-box.oppi-compact .oppi-header {
                padding-bottom: 5px;
                margin-bottom: 6px;
                font-size: 11px;
            }
            .oppi-box.oppi-compact .oppi-body {
                gap: 4px;
            }
            .oppi-box.oppi-compact .oppi-row {
                gap: 5px;
            }
            .oppi-box.oppi-compact .oppi-lbl {
                font-size: 9px;
                min-width: 70px;
            }
            .oppi-box.oppi-compact .oppi-tag {
                padding: 1px 6px;
                font-size: 10px;
            }
            
            .oppi-header {
                font-weight: 600;
                color: #2d3748;
                padding-bottom: 8px;
                margin-bottom: 10px;
                border-bottom: 2px solid #4299e1;
                font-size: 12px;
            }
            .oppi-body {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }
            .oppi-row {
                display: flex;
                flex-wrap: wrap;
                align-items: flex-start;
                gap: 8px;
            }
            .oppi-lbl {
                font-size: 10px;
                font-weight: 700;
                color: #718096;
                min-width: 85px;
                text-transform: uppercase;
            }
            .oppi-val {
                flex: 1;
                color: #2d3748;
            }
            .oppi-desc {
                font-style: italic;
                color: #4a5568;
                line-height: 1.4;
            }
            .oppi-mono {
                font-family: 'SF Mono', Monaco, monospace;
                background: #fff;
                padding: 2px 8px;
                border-radius: 4px;
                border: 1px solid #e2e8f0;
            }
            .oppi-tag {
                display: inline-block;
                background: #ebf8ff;
                color: #2b6cb0;
                padding: 2px 10px;
                border-radius: 12px;
                font-size: 11px;
                margin: 2px;
                border: 1px solid #bee3f8;
            }
            .oppi-brand {
                font-weight: 600;
                color: #2f855a;
            }
            .oppi-toggle {
                color: #3182ce;
                font-size: 11px;
                margin-left: 6px;
                cursor: pointer;
            }
            .oppi-attr {
                font-size: 12px;
                margin-bottom: 2px;
            }
            
            /* Dark mode */
            .dark .oppi-box,
            [data-theme="dark"] .oppi-box {
                background: linear-gradient(135deg, #2d3748 0%, #1a202c 100%);
                border-color: #4a5568;
            }
            .dark .oppi-header,
            [data-theme="dark"] .oppi-header {
                color: #e2e8f0;
            }
            .dark .oppi-lbl,
            [data-theme="dark"] .oppi-lbl {
                color: #a0aec0;
            }
            .dark .oppi-val,
            [data-theme="dark"] .oppi-val {
                color: #e2e8f0;
            }
            .dark .oppi-mono,
            [data-theme="dark"] .oppi-mono {
                background: #2d3748;
                border-color: #4a5568;
            }
        `;
        document.head.appendChild(style);
        console.log('[OPPI] Estilos inyectados');
    }
    
    /**
     * Inicialización
     */
    function init() {
        if (window.__oppi_initialized) return;
        window.__oppi_initialized = true;
        
        console.log('[OPPI] Inicializando...');
        injectStyles();
        setupObserver();
        setupXHRInterceptor();
        setupClickCapture();
        
        const existingModal = document.querySelector('.mat-dialog-container');
        if (existingModal) {
            handleModal(existingModal);
        }
        
        console.log('[OPPI] ✅ Inicialización completada');
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    setTimeout(init, 3000);
    
})();
