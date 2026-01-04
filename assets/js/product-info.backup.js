/**
 * OpenPOS Product Info v1.1
 * Muestra información adicional del producto en OpenPOS
 */

(function() {
    'use strict';
    
    console.log('[OPPI] v1.1 - Iniciando...');
    
    const config = window.oppiConfig || {
        maxDescriptionLength: 150,
        labels: {
            showMore: 'Ver más',
            showLess: 'Ver menos'
        }
    };
    
    // Variable para rastrear último producto mostrado
    let lastShownProductId = null;
    
    /**
     * Decodificar entidades HTML
     */
    function decodeHTML(html) {
        const txt = document.createElement('textarea');
        txt.innerHTML = html;
        return txt.value;
    }
    
    /**
     * Crear HTML de información del producto
     */
    function createInfoHTML(product) {
        console.log('[OPPI] Creando HTML para:', product.name);
        console.log('[OPPI] Datos del producto:', JSON.stringify({
            short_description: product.short_description,
            description: product.description,
            tags_string: product.tags_string,
            weight_display: product.weight_display,
            dimensions_display: product.dimensions_display,
            _fromDOM: product._fromDOM
        }));
        
        if (!product) return '';
        
        console.log('[OPPI] Creando HTML para:', product.name);
        
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
        
        // Descripción completa (si es diferente a la corta)
        if (product.description && product.description !== product.short_description) {
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
        
        // Peso
        if (product.weight_display) {
            sections.push(`
                <div class="oppi-row">
                    <span class="oppi-lbl">PESO:</span>
                    <span class="oppi-val oppi-mono">${product.weight_display}</span>
                </div>
            `);
        }
        
        // Dimensiones
        if (product.dimensions_display) {
            sections.push(`
                <div class="oppi-row">
                    <span class="oppi-lbl">DIMENSIONES:</span>
                    <span class="oppi-val oppi-mono">${decodeHTML(product.dimensions_display)}</span>
                </div>
            `);
        }
        
        // Atributos
        if (product.product_attributes && product.product_attributes.length > 0) {
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
            console.log('[OPPI] No hay información adicional para mostrar');
            return '';
        }
        
        return `
            <div id="oppi-box" class="oppi-box">
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
 
    /*
     * Inyectar información en el modal 
     */
    function injectInfo(product) {
        // Remover info anterior
        const existing = document.getElementById('oppi-box');
        if (existing) {
            // Si ya existe y es el mismo producto con datos completos, no hacer nada
            if (existing.dataset.productId == product.id && !product._fromDOM) {
                console.log('[OPPI] Info ya existe para este producto');
                return;
            }
            existing.remove();
        }
        
        if (!product) return;
        
        const html = createInfoHTML(product);
        if (!html) return;
        
        // Buscar el modal - usando selectores específicos de OpenPOS
        const modal = document.querySelector('.mat-dialog-container');
        if (!modal) {
            console.log('[OPPI] No se encontró modal');
            return;
        }
        
        // Crear elemento
        const div = document.createElement('div');
        div.innerHTML = html;
        const infoBox = div.firstElementChild;
        
        // Selectores específicos para OpenPOS 6.x
        const insertTargets = [
            // Después del precio
            '.item-price',
            // Antes del formulario
            '.item-form',
            // Dentro del contenedor principal
            '.item-main-container',
            // Dentro de item-rows
            '.item-rows',
            // Contenedor del dialog
            '.item-container',
            '.mat-dialog-content'
        ];
        
        let inserted = false;
        
        for (const selector of insertTargets) {
            const target = modal.querySelector(selector);
            if (target) {
                console.log('[OPPI] Target encontrado:', selector);
                
                // Insertar DESPUÉS del precio
                if (selector === '.item-price' && target.nextSibling) {
                    target.parentNode.insertBefore(infoBox, target.nextSibling);
                    inserted = true;
                    break;
                }
                
                // Insertar ANTES del formulario
                if (selector === '.item-form') {
                    target.parentNode.insertBefore(infoBox, target);
                    inserted = true;
                    break;
                }
                
                // Para otros, insertar al inicio
                if (selector === '.item-main-container' || selector === '.item-rows') {
                    target.insertBefore(infoBox, target.firstChild);
                    inserted = true;
                    break;
                }
                
                // Fallback: agregar al final
                target.appendChild(infoBox);
                inserted = true;
                break;
            }
        }
        
        if (!inserted && modal) {
            // Último recurso: agregar al final del modal
            modal.appendChild(infoBox);
            inserted = true;
        }
        
        if (inserted) {
            // Guardar el ID en el elemento para referencia
            infoBox.dataset.productId = product.id || 0;
            
            lastShownProductId = product.id;
            console.log('[OPPI] ✅ Info inyectada para producto:', product.name);
        } else {
            console.log('[OPPI] ❌ No se pudo insertar la info');
        }
    }
    
    /**
     * Obtener producto desde el carrito en IndexedDB
     */
    async function getCurrentProductFromCart() {
        return new Promise((resolve) => {
            try {
                const request = indexedDB.open('newopDB');
                
                request.onerror = () => resolve(null);
                
                request.onsuccess = (event) => {
                    const db = event.target.result;
                    
                    if (!db.objectStoreNames.contains('app')) {
                        resolve(null);
                        return;
                    }
                    
                    const tx = db.transaction('app', 'readonly');
                    const store = tx.objectStore('app');
                    
                    // Buscar el carrito actual
                    const cursorReq = store.openCursor();
                    cursorReq.onsuccess = (e) => {
                        const cursor = e.target.result;
                        if (cursor) {
                            const data = cursor.value;
                            // Buscar en current_cart o similar
                            if (data && data.items && data.items.length > 0) {
                                // Obtener el último producto del carrito
                                const lastItem = data.items[data.items.length - 1];
                                if (lastItem && lastItem.product) {
                                    console.log('[OPPI] Producto encontrado en carrito:', lastItem.product.name);
                                    resolve(lastItem.product);
                                    return;
                                }
                            }
                            cursor.continue();
                        } else {
                            resolve(null);
                        }
                    };
                    
                    cursorReq.onerror = () => resolve(null);
                };
            } catch (e) {
                console.log('[OPPI] Error accediendo IndexedDB:', e);
                resolve(null);
            }
        });
    }
    
    /**
     * Obtener producto desde la store de productos
     */
    async function getProductById(productId) {
        return new Promise((resolve) => {
            try {
                const request = indexedDB.open('newopDB');
                
                request.onerror = () => resolve(null);
                
                request.onsuccess = (event) => {
                    const db = event.target.result;
                    
                    if (!db.objectStoreNames.contains('products')) {
                        resolve(null);
                        return;
                    }
                    
                    const tx = db.transaction('products', 'readonly');
                    const store = tx.objectStore('products');
                    const getReq = store.get(productId);
                    
                    getReq.onsuccess = () => {
                        if (getReq.result) {
                            console.log('[OPPI] Producto encontrado en DB:', getReq.result.name);
                            resolve(getReq.result);
                        } else {
                            resolve(null);
                        }
                    };
                    
                    getReq.onerror = () => resolve(null);
                };
            } catch (e) {
                resolve(null);
            }
        });
    }

    /**
     * Extraer datos del producto desde el DOM del modal
     */
    function extractProductFromModal() {
        const modal = document.querySelector('.mat-dialog-container');
        if (!modal) return null;
        
        try {
            const titleEl = modal.querySelector('.item-title');
            const priceEl = modal.querySelector('.item-price');
            
            if (titleEl) {
                const name = titleEl.textContent.trim();
                const priceText = priceEl ? priceEl.textContent : '';
                const price = parseFloat(priceText.replace(/[^0-9.,]/g, '').replace(',', '.')) || 0;
                
                if (window.__oppi_productCache && window.__oppi_productCache[name]) {
                    console.log('[OPPI] Producto encontrado en caché:', name);
                    return window.__oppi_productCache[name];
                }
                
                return { id: 0, name: name, price: price, _fromDOM: true };
            }
        } catch (e) {
            console.log('[OPPI] Error extrayendo del DOM:', e);
        }
        return null;
    }

    /**
     * Obtener producto actual - múltiples estrategias
     */
    async function getProduct() {
        console.log('[OPPI] Intentando obtener producto...');
        
        // Estrategia 1: Variable global capturada
        if (window.__oppi_lastProduct && window.__oppi_lastProduct.id) {
            console.log('[OPPI] Producto desde __oppi_lastProduct:', window.__oppi_lastProduct.name);
            return window.__oppi_lastProduct;
        }
        
        // Estrategia 2: Caché por nombre desde el modal
        const modalProduct = extractProductFromModal();
        if (modalProduct && !modalProduct._fromDOM) {
            return modalProduct;
        }
        
        // Estrategia 3: IndexedDB
        try {
            const product = await getCurrentProductFromCart();
            if (product) {
                console.log('[OPPI] Producto desde IndexedDB:', product.name);
                return product;
            }
        } catch (e) {
            console.log('[OPPI] Error IndexedDB:', e);
        }
        
        // Estrategia 4: Retornar lo extraído del DOM como último recurso
        if (modalProduct) {
            console.log('[OPPI] Usando datos básicos del DOM:', modalProduct.name);
            return modalProduct;
        }
        
        return null;
    }
    
    /**
     * Manejar apertura de modal
     */
    async function handleModal(modal) {
        console.log('[OPPI] Modal detectado, buscando producto...');
        
        // Esperar a que Angular renderice el contenido
        await new Promise(r => setTimeout(r, 300));
        
        const product = await getProduct();
        
        if (product) {
            console.log('[OPPI] Producto obtenido:', product.name);
            injectInfo(product);
        } else {
            console.log('[OPPI] No se pudo obtener el producto');
        }
    }
    
    /**
     * Observar clics en productos para capturar datos
     */
    function setupClickCapture() {
        document.addEventListener('click', async (e) => {
            // Detectar clic en producto del grid
            const productEl = e.target.closest('.product-item, .product-card, .product-grid-item, [class*="product-"]');
            
            if (productEl) {
                console.log('[OPPI] Clic en producto detectado');
                
                // Intentar obtener el ID
                let productId = productEl.dataset.productId || 
                               productEl.dataset.id ||
                               productEl.getAttribute('data-product-id');
                
                // Buscar en elementos hijos
                if (!productId) {
                    const idEl = productEl.querySelector('[data-product-id], [data-id]');
                    if (idEl) {
                        productId = idEl.dataset.productId || idEl.dataset.id;
                    }
                }
                
                if (productId) {
                    const product = await getProductById(parseInt(productId));
                    if (product) {
                        window.__oppi_lastProduct = product;
                        console.log('[OPPI] Producto capturado:', product.name);
                    }
                }
            }
            
            // Detectar clic en item del carrito
            const cartItem = e.target.closest('.cart-item, .cart-product, [class*="cart-item"]');
            if (cartItem) {
                console.log('[OPPI] Clic en item de carrito detectado');
                // El producto vendrá del carrito actual
            }
        }, true);
    }
    
    /**
     * Observar cambios en el DOM para detectar modales
     */
    function setupObserver() {
        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                for (const node of mutation.addedNodes) {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        // Detectar overlay container (CDK)
                        if (node.classList && node.classList.contains('cdk-overlay-container')) {
                            console.log('[OPPI] Overlay container detectado');
                            // Observar dentro del overlay
                            node.querySelectorAll('.mat-dialog-container').forEach(handleModal);
                        }
                        
                        // Detectar dialog directamente
                        if (node.classList && node.classList.contains('mat-dialog-container')) {
                            handleModal(node);
                        }
                        
                        // Buscar dialog dentro del nodo agregado
                        const dialogs = node.querySelectorAll ? node.querySelectorAll('.mat-dialog-container') : [];
                        dialogs.forEach(handleModal);
                        
                        // Detectar overlay pane
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
    
        // Interceptar XHR para capturar datos del carrito
        (function() {
            const originalSend = XMLHttpRequest.prototype.send;
            XMLHttpRequest.prototype.send = function(body) {
                try {
                    let cartData = null;
                    
                    // Si es FormData
                    if (body instanceof FormData) {
                        const cartValue = body.get('cart');
                        if (cartValue) {
                            cartData = JSON.parse(cartValue);
                        }
                    }
                    // Si es string con JSON
                    else if (typeof body === 'string' && body.includes('cart')) {
                        // Intentar como JSON directo
                        try {
                            const parsed = JSON.parse(body);
                            if (parsed.cart) cartData = parsed.cart;
                        } catch (e) {
                            // Intentar como URL encoded
                            const params = new URLSearchParams(body);
                            const cartValue = params.get('cart');
                            if (cartValue) {
                                cartData = JSON.parse(cartValue);
                            }
                        }
                    }
                    
                    if (cartData && cartData.items && cartData.items.length > 0) {
                        const lastItem = cartData.items[cartData.items.length - 1];
                        if (lastItem && lastItem.product) {
                            window.__oppi_lastProduct = lastItem.product;
                            window.__oppi_productCache = window.__oppi_productCache || {};
                            window.__oppi_productCache[lastItem.product.name] = lastItem.product;
                            console.log('[OPPI] ✅ Producto capturado de XHR:', lastItem.product.name);
                            console.log('[OPPI] Campos disponibles:', Object.keys(lastItem.product).join(', '));

                            // Si hay un modal abierto, reinyectar con datos completos
                            setTimeout(function() {
                                const modal = document.querySelector('.mat-dialog-container');
                                if (modal) {
                                    console.log('[OPPI] Reinyectando con datos completos...');
                                    injectInfo(lastItem.product);
                                }
                            }, 100);
                        }
                    }
                } catch (e) {
                    // Silenciar errores
                }
                return originalSend.apply(this, arguments);
            };
        })();
        console.log('[OPPI] XHR interceptor configurado');
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
        console.log('[OPPI] Inicializando...');
        injectStyles();
        setupObserver();
        setupClickCapture();
        
        // Verificar si ya hay un modal abierto
        const existingModal = document.querySelector('.mat-dialog-container');
        if (existingModal) {
            handleModal(existingModal);
        }
        
        console.log('[OPPI] ✅ Inicialización completada');
    }
    
    // Iniciar
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    // Re-iniciar después de un delay por si Angular carga después
    setTimeout(init, 3000);
    
})();
