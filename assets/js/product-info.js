/**
 * OpenPOS Product Info v1.3
 * Muestra información adicional del producto en OpenPOS
 * Soporta modales de productos simples y variables
 */

(function() {
    'use strict';
    
    console.log('[OPPI] v1.3 - Iniciando...');
    
    const config = Object.assign({
        maxDescriptionLength: 150,
        showShortDescription: true,
        showDescription: true,
        showTags: true,
        showBrand: true,
        showWeight: true,
        showDimensions: true,
        showAttributes: true,
        showSku: false,
        showStock: false,
        showPriceRules: true,
        showCategories: false,
        showBarcode: false,
        showVendor: false,
        labels: {
            showMore: 'Ver más',
            showLess: 'Ver menos'
        }
    }, window.oppiConfig || {});
    
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
        // DEBUG campos disponibles del producto
        //console.log('[OPPI] DEBUG - Todos los campos del producto:', Object.keys(product));
        
        let sections = [];
        
        // Descripción corta
        if (config.showShortDescription && product.short_description) {
            sections.push(`
                <div class="oppi-row">
                    <span class="oppi-lbl">DESCRIPCIÓN:</span>
                    <span class="oppi-val oppi-desc">${product.short_description}</span>
                </div>
            `);
        }
        
        // Descripción completa (si es diferente a la corta)
        if (config.showDescription && product.description && product.description !== product.short_description) {
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
        if (config.showTags && product.tags_string) {
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
        if (config.showBrand && product.brand) {
            sections.push(`
                <div class="oppi-row">
                    <span class="oppi-lbl">MARCA:</span>
                    <span class="oppi-val oppi-brand">${product.brand}</span>
                </div>
            `);
        }
        
        // Peso - solo en modo no compacto
        if (!isCompact && config.showWeight && product.weight_display) {
            sections.push(`
                <div class="oppi-row">
                    <span class="oppi-lbl">PESO:</span>
                    <span class="oppi-val oppi-mono">${product.weight_display}</span>
                </div>
            `);
        }
        
        // Dimensiones - solo en modo no compacto (verificar que tenga valores reales)
        const hasDimensions = product.dimensions_display && 
                              product.dimensions_display.trim() !== '' &&
                              product.dimensions_display !== 'N/D' &&
                              product.dimensions_display !== 'N/A' &&
                              !/^[\s×x]+$/.test(product.dimensions_display);
        
        if (!isCompact && config.showDimensions && hasDimensions) {
            sections.push(`
                <div class="oppi-row">
                    <span class="oppi-lbl">DIMENSIONES:</span>
                    <span class="oppi-val oppi-mono">${decodeHTML(product.dimensions_display)}</span>
                </div>
            `);
        }
        
        // Atributos - solo en modo no compacto
        if (!isCompact && config.showAttributes && product.product_attributes && product.product_attributes.length > 0) {
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
        if (config.showSku && product.sku) {
            sections.push(`
                <div class="oppi-row">
                    <span class="oppi-lbl">SKU:</span>
                    <span class="oppi-val oppi-mono">${product.sku}</span>
                </div>
            `);
        }

        // Precios escalonados
        if (config.showPriceRules && product.price_rules && product.price_rules.length > 0) {
            // Filtrar duplicados y ordenar por cantidad mínima
            const uniqueRules = [];
            const seen = new Set();
            
            product.price_rules.forEach(rule => {
                const key = `${rule.min_qty}-${rule.price}`;
                if (!seen.has(key)) {
                    seen.add(key);
                    uniqueRules.push(rule);
                }
            });
            
            // Ordenar por cantidad mínima
            uniqueRules.sort((a, b) => (a.min_qty || 0) - (b.min_qty || 0));
            
            if (uniqueRules.length > 0) {
                let rulesHtml = '<div class="oppi-price-rules">';
                
                uniqueRules.forEach((rule, index) => {
                    const minQty = parseInt(rule.min_qty) || 0;
                    const price = parseFloat(rule.price) || 0;
                    
                    // Determinar el rango
                    let qtyLabel;
                    if (index < uniqueRules.length - 1) {
                        // No es el último tramo: mostrar rango "desde - hasta"
                        const nextMinQty = parseInt(uniqueRules[index + 1].min_qty) || 0;
                        const maxQty = nextMinQty - 1;
                        qtyLabel = `${minQty}-${maxQty}`;
                    } else {
                        // Último tramo: mostrar "cantidad+"
                        qtyLabel = `${minQty}+`;
                    }
                    
                    rulesHtml += `<div class="oppi-price-rule">
                        <span class="oppi-rule-qty">${qtyLabel} unid.</span>
                        <span class="oppi-rule-price">$${price.toLocaleString('es-CL')}</span>
                    </div>`;
                });
                
                rulesHtml += '</div>';
                
                sections.push(`
                    <div class="oppi-row">
                        <span class="oppi-lbl">PRECIOS:</span>
                        <span class="oppi-val">${rulesHtml}</span>
                    </div>
                `);
            }
        }
        
        // Categorías
        if (config.showCategories && product.categories && product.categories.length > 0) {
            let cats = '';
            if (typeof product.categories[0] === 'object') {
                cats = product.categories.map(c => c.name || c.title).join(', ');
            } else {
                cats = product.categories.join(', ');
            }
            sections.push(`
                <div class="oppi-row">
                    <span class="oppi-lbl">CATEGORÍAS:</span>
                    <span class="oppi-val">${cats}</span>
                </div>
            `);
        }
        
        // Código de barras
        if (config.showBarcode && product.barcode) {
            sections.push(`
                <div class="oppi-row">
                    <span class="oppi-lbl">CÓD. BARRAS:</span>
                    <span class="oppi-val oppi-mono">${product.barcode}</span>
                </div>
            `);
        }
        
        // Proveedor
        if (config.showVendor && product.vendor) {
            sections.push(`
                <div class="oppi-row">
                    <span class="oppi-lbl">PROVEEDOR:</span>
                    <span class="oppi-val">${product.vendor}</span>
                </div>
            `);
        }
        
        // Stock
        if (config.showStock && (product.qty !== undefined || product.stock_status)) {
            const stockQty = product.qty !== undefined ? product.qty : '';
            const stockStatus = product.stock_status === 'instock' ? 'En stock' : 
                                product.stock_status === 'outofstock' ? 'Agotado' : product.stock_status;
            const stockDisplay = stockQty ? `${stockQty} unidades` : stockStatus;
            const stockClass = product.stock_status === 'outofstock' ? 'oppi-stock-out' : 'oppi-stock-in';
            
            sections.push(`
                <div class="oppi-row">
                    <span class="oppi-lbl">STOCK:</span>
                    <span class="oppi-val ${stockClass}">${stockDisplay}</span>
                </div>
            `);
        }

        // Campos personalizados
        if (product.custom_meta && Object.keys(product.custom_meta).length > 0) {
            for (const [key, meta] of Object.entries(product.custom_meta)) {
                if (meta && meta.value) {
                    const label = meta.label || key.replace(/_/g, ' ').toUpperCase();
                    sections.push(`
                        <div class="oppi-row">
                            <span class="oppi-lbl">${label.toUpperCase()}:</span>
                            <span class="oppi-val">${meta.value}</span>
                        </div>
                    `);
                }
            }
        }

        // Si no hay ninguna sección, no mostrar nada
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
        }
    }

    /**
     * Extraer nombre del producto desde el modal
     */
    function getProductNameFromModal(modal) {
        if (!modal) modal = document.querySelector('.mat-dialog-container');
        if (!modal) return null;
        
        // Para modal de variación, buscar en .option-popup-title h1
        const h1 = modal.querySelector('.option-popup-title h1');
        if (h1) {
            return h1.textContent.trim();
        }
        
        // Para modal simple/carrito, buscar elementos específicos
        // Primero intentar obtener el título sin el código
        const titleEl = modal.querySelector('.item-title, .product-title, .product-name');
        if (titleEl) {
            // Clonar para no modificar el DOM
            const clone = titleEl.cloneNode(true);
            // Remover elementos hijos que contengan código/precio
            clone.querySelectorAll('.item-code, .item-sku, .item-price, [class*="code"], [class*="sku"], [class*="price"]').forEach(el => el.remove());
            
            let text = clone.textContent.trim();
            
            // Si el texto termina con números (SKU pegado), removerlos
            // Buscar patrón: texto seguido de números al final sin espacio
            text = text.replace(/(\d{5,})$/, '').trim();
            
            // También limpiar "Código:" o "SKU:" si quedó
            text = text.replace(/C[oó]digo:?\s*\d+/gi, '').trim();
            text = text.replace(/SKU:?\s*\d+/gi, '').trim();
            text = text.replace(/PRECIO:?\s*[\d.,]+/gi, '').trim();
            
            if (text) {
                return text;
            }
        }
        
        // Fallback: otros selectores
        const selectors = ['.mat-dialog-title', '.item-name', 'h1', 'h2'];
        for (const selector of selectors) {
            const el = modal.querySelector(selector);
            if (el) {
                let text = el.textContent.trim();
                text = text.replace(/(\d{5,})$/, '').trim();
                if (text && text.length > 0) {
                    return text;
                }
            }
        }
        
        return null;
    }
    
    /*
     * Extraer nombre del producto desde el modal
     *
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
    }*/

    /**
     * Obtener producto actual - múltiples estrategias
     */
    async function getProduct(modal) {
        const modalProductName = getProductNameFromModal(modal);
        const isVariation = isVariationModal(modal);

        // DEBUG: Ver qué hay en cache
        //console.log('[OPPI] DEBUG - Nombre del modal:', modalProductName);
        //console.log('[OPPI] DEBUG - Nombres en cache:', Object.keys(window.__oppi_productCache || {}));
        
        // CASO 1: Modal de SELECCIÓN de variación → buscar producto PADRE
        if (isVariation) {
            if (modalProductName) {
                const cached = findProductInCache(modalProductName);
                if (cached && !cached.parent_id) {
                    return cached;
                }
            }
            if (modalProductName) {
                const product = await searchProductInIndexedDB(modalProductName);
                if (product) {
                    window.__oppi_productCache[product.name] = product;
                    return product;
                }
            }
            return null;
        }
        
        // CASO 2: Modal de item del CARRITO → buscar producto específico
        
        // PRIORIDAD 1: Buscar por nombre EXACTO del modal (más preciso)
        if (modalProductName) {
            // Búsqueda exacta primero
            const exactMatch = window.__oppi_productCache[modalProductName];
            if (exactMatch) {
                //console.log('[OPPI] Producto exacto desde modal:', exactMatch.name);
                window.__oppi_clickedProductName = null;
                return exactMatch;
            }
            
            // Búsqueda normalizada exacta
            const normalizedModal = normalizeName(modalProductName);
            for (const [name, product] of Object.entries(window.__oppi_productCache)) {
                if (normalizeName(name) === normalizedModal) {
                    window.__oppi_clickedProductName = null;
                    return product;
                }
            }
        }
        
        // PRIORIDAD 2: Nombre clickeado (fallback)
        if (window.__oppi_clickedProductName) {
            const cached = findProductInCache(window.__oppi_clickedProductName);
            if (cached) {
                window.__oppi_clickedProductName = null;
                return cached;
            }
        }
        
        // PRIORIDAD 3: Último producto capturado (si coincide)
        if (window.__oppi_lastProduct) {
            if (modalProductName && normalizeName(window.__oppi_lastProduct.name) === normalizeName(modalProductName)) {
                return window.__oppi_lastProduct;
            }
        }
        
        // PRIORIDAD 4: Buscar en IndexedDB
        if (modalProductName) {
            const product = await searchProductInIndexedDB(modalProductName);
            if (product) {
                window.__oppi_productCache[product.name] = product;
                return product;
            }
        }
        
        // PRIORIDAD 5: Datos básicos del DOM
        if (modalProductName) {
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
        await new Promise(r => setTimeout(r, 100));
        
        const product = await getProduct(modal);
        
        if (product) {
            injectInfo(product, modal);
        }
    }

    /**
     * Obtener producto desde IndexedDB por ID
     */
    function getProductFromIndexedDB(productId) {
        return new Promise((resolve) => {
            try {
                const request = indexedDB.open('newopDB');
                
                request.onerror = () => resolve(null);
                
                request.onsuccess = (event) => {
                    const db = event.target.result;
                    
                    const storeName = db.objectStoreNames.contains('product_display') ? 'product_display' : 
                                      db.objectStoreNames.contains('products') ? 'products' : null;
                    
                    if (!storeName) {
                        resolve(null);
                        return;
                    }
                    
                    const tx = db.transaction(storeName, 'readonly');
                    const store = tx.objectStore(storeName);
                    const getReq = store.get(productId);
                    
                    getReq.onsuccess = () => resolve(getReq.result || null);
                    getReq.onerror = () => resolve(null);
                };
            } catch (e) {
                resolve(null);
            }
        });
    }

    /**
     * Buscar producto en IndexedDB por nombre
     */
    function searchProductInIndexedDB(searchName) {
        return new Promise((resolve) => {
            try {
                const request = indexedDB.open('newopDB');
                
                request.onerror = () => resolve(null);
                
                request.onsuccess = (event) => {
                    const db = event.target.result;
                    
                    // El store correcto es 'product_display'
                    const storeName = db.objectStoreNames.contains('product_display') ? 'product_display' : 
                                      db.objectStoreNames.contains('products') ? 'products' : null;
                    
                    if (!storeName) {
                        resolve(null);
                        return;
                    }
                    
                    const tx = db.transaction(storeName, 'readonly');
                    const store = tx.objectStore(storeName);
                    const cursorReq = store.openCursor();
                    const normalizedSearch = normalizeName(searchName);
                    
                    cursorReq.onsuccess = (e) => {
                        const cursor = e.target.result;
                        if (cursor) {
                            const product = cursor.value;
                            if (product && product.name) {
                                if (normalizeName(product.name) === normalizedSearch) {
                                    //console.log('[OPPI] ✅ Producto encontrado en IndexedDB:', product.name);
                                    resolve(product);
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
                resolve(null);
            }
        });
    }
    
    /**
     * Capturar clic en items del carrito y productos
     */
    function setupClickCapture() {
        document.addEventListener('click', async (e) => {
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
                            break;
                        }
                    }
                }
            }
            
            // Detectar clic en producto del grid (para variables y simples)
            const productItem = e.target.closest('.product-item, .product-card, [class*="product-grid"], .product');
            if (productItem) {
                // Intentar obtener el ID del producto
                const productId = productItem.dataset.productId || 
                                  productItem.dataset.id ||
                                  productItem.getAttribute('data-product-id') ||
                                  productItem.getAttribute('data-id');
                
                if (productId) {
                    // Buscar en IndexedDB
                    const product = await getProductFromIndexedDB(parseInt(productId));
                    if (product) {
                        window.__oppi_productCache[product.name] = product;
                        window.__oppi_lastProduct = product;
                        window.__oppi_clickedProductName = product.name;
                    }
                }
                
                // También capturar por nombre como fallback
                const nameEl = productItem.querySelector('.product-name, .name, .title, .product-title');
                if (nameEl) {
                    const name = nameEl.textContent.trim();
                    if (name && name.length > 2) {
                        window.__oppi_clickedProductName = name;
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
                            
                            // Si es variación, guardar también el producto padre
                            if (item.product.parent_product) {
                                window.__oppi_productCache[item.product.parent_product.name] = item.product.parent_product;
                            }
                        }
                    });
                    
                    const lastItem = cartData.items[cartData.items.length - 1];
                    if (lastItem && lastItem.product) {
                        window.__oppi_lastProduct = lastItem.product;
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
        //console.log('[OPPI] XHR interceptor configurado');
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
        
        //console.log('[OPPI] Observer configurado');
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
            .oppi-price-rules {
                display: flex;
                flex-wrap: wrap;
                gap: 6px;
            }
            .oppi-price-rule {
                background: #fff3cd;
                border: 1px solid #ffc107;
                border-radius: 6px;
                padding: 4px 8px;
                font-size: 11px;
                display: flex;
                flex-direction: column;
                align-items: center;
            }
            .oppi-rule-qty {
                font-weight: 600;
                color: #856404;
                font-size: 10px;
            }
            .oppi-rule-price {
                color: #155724;
                font-weight: 700;
            }
            .oppi-stock-in {
                color: #198754;
                font-weight: 600;
            }
            .oppi-stock-out {
                color: #dc3545;
                font-weight: 600;
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
    }
    
    /**
     * Inicialización
     */
    function init() {
        if (window.__oppi_initialized) return;
        window.__oppi_initialized = true;
        
        //console.log('[OPPI] Inicializando...');
        injectStyles();
        setupObserver();
        setupXHRInterceptor();
        setupClickCapture();
        
        const existingModal = document.querySelector('.mat-dialog-container');
        if (existingModal) {
            handleModal(existingModal);
        }
        
        //console.log('[OPPI] ✅ Inicialización completada');
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    setTimeout(init, 1000);
    
})();
