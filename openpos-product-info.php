<?php
/**
 * Plugin Name: OpenPOS Info Products
 * Description: Agrega información adicional del producto (descripción, etiquetas, etc.) al modal de producto en OpenPOS
 * Version: 1.1
 * Author: Víctor Moraga
 * Author URI: https://sintexis.cl
 */

// Evitar acceso directo
if (!defined('ABSPATH')) {
    exit;
}

// Definir constantes
define('OPPI_VERSION', '1.1');
define('OPPI_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('OPPI_PLUGIN_URL', plugin_dir_url(__FILE__));

/**
 * Obtener opciones del plugin con valores por defecto
 */
function oppi_get_options() {
    $defaults = array(
        'show_short_description' => 'yes',
        'show_description' => 'yes',
        'show_tags' => 'yes',
        'show_brand' => 'yes',
        'show_weight' => 'yes',
        'show_dimensions' => 'yes',
        'show_attributes' => 'yes',
        'show_sku' => 'no',
        'show_stock' => 'no',
        'show_price_rules' => 'yes',
        'show_categories' => 'no',
        'show_barcode' => 'no',
        'show_vendor' => 'no',
        'max_description_length' => 150,
        'info_position' => 'after_price',
        'custom_fields' => '',
    );
    
    $options = get_option('oppi_settings', array());
    return wp_parse_args($options, $defaults);
}

/**
 * Agregar menú de administración
 */
function oppi_admin_menu() {
    add_submenu_page(
        'woocommerce',
        'OpenPOS Info Adicional',
        'Info Adicional POS',
        'manage_options',
        'oppi-settings',
        'oppi_settings_page'
    );
}
add_action('admin_menu', 'oppi_admin_menu');

/**
 * Registrar configuraciones
 */
function oppi_register_settings() {
    register_setting('oppi_settings_group', 'oppi_settings', 'oppi_sanitize_settings');
}
add_action('admin_init', 'oppi_register_settings');

/**
 * Sanitizar configuraciones
 */
function oppi_sanitize_settings($input) {
    $sanitized = array();
    
    $checkboxes = array(
        'show_short_description', 'show_description', 'show_tags', 
        'show_brand', 'show_weight', 'show_dimensions', 'show_attributes',
        'show_sku', 'show_stock', 'show_price_rules', 'show_categories',
        'show_barcode', 'show_vendor'
    );
    
    foreach ($checkboxes as $key) {
        $sanitized[$key] = isset($input[$key]) ? 'yes' : 'no';
    }
    
    $sanitized['max_description_length'] = absint($input['max_description_length'] ?? 150);
    $sanitized['info_position'] = sanitize_text_field($input['info_position'] ?? 'after_price');
    $sanitized['custom_fields'] = sanitize_text_field($input['custom_fields'] ?? '');
    
    return $sanitized;
}

/**
 * Página de configuración
 */
function oppi_settings_page() {
    $options = oppi_get_options();
    ?>
    <div class="wrap">
        <h1><?php echo esc_html(get_admin_page_title()); ?></h1>
        
        <form method="post" action="options.php">
            <?php settings_fields('oppi_settings_group'); ?>
            
            <div class="oppi-admin-container" style="display: flex; gap: 20px; margin-top: 20px;">
                <!-- Columna de configuración -->
                <div class="oppi-settings-column" style="flex: 1; background: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                    <h2 style="margin-top: 0; border-bottom: 1px solid #ddd; padding-bottom: 10px;">
                        📋 Campos a mostrar
                    </h2>
                    
                    <table class="form-table">
                        <tr>
                            <th scope="row">Descripción corta</th>
                            <td>
                                <label>
                                    <input type="checkbox" name="oppi_settings[show_short_description]" value="yes" <?php checked($options['show_short_description'], 'yes'); ?>>
                                    Mostrar descripción corta del producto
                                </label>
                            </td>
                        </tr>
                        <tr>
                            <th scope="row">Descripción completa</th>
                            <td>
                                <label>
                                    <input type="checkbox" name="oppi_settings[show_description]" value="yes" <?php checked($options['show_description'], 'yes'); ?>>
                                    Mostrar descripción completa
                                </label>
                            </td>
                        </tr>
                        <tr>
                            <th scope="row">Etiquetas</th>
                            <td>
                                <label>
                                    <input type="checkbox" name="oppi_settings[show_tags]" value="yes" <?php checked($options['show_tags'], 'yes'); ?>>
                                    Mostrar etiquetas del producto
                                </label>
                            </td>
                        </tr>
                        <tr>
                            <th scope="row">Marca</th>
                            <td>
                                <label>
                                    <input type="checkbox" name="oppi_settings[show_brand]" value="yes" <?php checked($options['show_brand'], 'yes'); ?>>
                                    Mostrar marca (si existe)
                                </label>
                            </td>
                        </tr>
                        <tr>
                            <th scope="row">Peso</th>
                            <td>
                                <label>
                                    <input type="checkbox" name="oppi_settings[show_weight]" value="yes" <?php checked($options['show_weight'], 'yes'); ?>>
                                    Mostrar peso del producto
                                </label>
                            </td>
                        </tr>
                        <tr>
                            <th scope="row">Dimensiones</th>
                            <td>
                                <label>
                                    <input type="checkbox" name="oppi_settings[show_dimensions]" value="yes" <?php checked($options['show_dimensions'], 'yes'); ?>>
                                    Mostrar dimensiones (largo × ancho × alto)
                                </label>
                            </td>
                        </tr>
                        <tr>
                            <th scope="row">Atributos</th>
                            <td>
                                <label>
                                    <input type="checkbox" name="oppi_settings[show_attributes]" value="yes" <?php checked($options['show_attributes'], 'yes'); ?>>
                                    Mostrar atributos del producto
                                </label>
                            </td>
                        </tr>
                        <tr>
                            <th scope="row">SKU</th>
                            <td>
                                <label>
                                    <input type="checkbox" name="oppi_settings[show_sku]" value="yes" <?php checked($options['show_sku'], 'yes'); ?>>
                                    Mostrar SKU adicional
                                </label>
                            </td>
                        </tr>
                        <tr>
                            <th scope="row">Stock</th>
                            <td>
                                <label>
                                    <input type="checkbox" name="oppi_settings[show_stock]" value="yes" <?php checked($options['show_stock'], 'yes'); ?>>
                                    Mostrar cantidad en stock
                                </label>
                            </td>
                        </tr>
                        <tr>
                            <th scope="row">Precios escalonados</th>
                            <td>
                                <label>
                                    <input type="checkbox" name="oppi_settings[show_price_rules]" value="yes" <?php checked($options['show_price_rules'], 'yes'); ?>>
                                    Mostrar precios por cantidad (mayorista)
                                </label>
                            </td>
                        </tr>
                        <tr>
                            <th scope="row">Categorías</th>
                            <td>
                                <label>
                                    <input type="checkbox" name="oppi_settings[show_categories]" value="yes" <?php checked($options['show_categories'], 'yes'); ?>>
                                    Mostrar categorías del producto
                                </label>
                            </td>
                        </tr>
                        <tr>
                            <th scope="row">Código de barras</th>
                            <td>
                                <label>
                                    <input type="checkbox" name="oppi_settings[show_barcode]" value="yes" <?php checked($options['show_barcode'], 'yes'); ?>>
                                    Mostrar código de barras
                                </label>
                            </td>
                        </tr>
                        <tr>
                            <th scope="row">Proveedor</th>
                            <td>
                                <label>
                                    <input type="checkbox" name="oppi_settings[show_vendor]" value="yes" <?php checked($options['show_vendor'], 'yes'); ?>>
                                    Mostrar proveedor/vendor
                                </label>
                            </td>
                        </tr>
                    </table>
                    
                    <h2 style="border-bottom: 1px solid #ddd; padding-bottom: 10px; margin-top: 30px;">
                        ⚙️ Opciones de visualización
                    </h2>
                    
                    <table class="form-table">
                        <tr>
                            <th scope="row">Longitud máxima de descripción</th>
                            <td>
                                <input type="number" name="oppi_settings[max_description_length]" value="<?php echo esc_attr($options['max_description_length']); ?>" min="50" max="500" style="width: 80px;">
                                <p class="description">Caracteres antes de truncar (se mostrará botón "Ver más")</p>
                            </td>
                        </tr>
                        <tr>
                            <th scope="row">Campos meta personalizados</th>
                            <td>
                                <input type="text" name="oppi_settings[custom_fields]" value="<?php echo esc_attr($options['custom_fields']); ?>" class="regular-text" placeholder="_mi_campo, _otro_campo">
                                <p class="description">Meta keys separados por coma. Ej: _proveedor, _ubicacion, _codigo_interno</p>
                            </td>
                        </tr>
                    </table>
                </div>
                
                <!-- Columna de preview -->
                <div class="oppi-preview-column"
                    style="width:350px;
                            background:#fff;
                            padding:20px;
                            border-radius:8px;
                            box-shadow:0 1px 3px rgba(0,0,0,0.1);
                            display:flex;
                            flex-direction:column;">
                    <h2 style="margin-top: 0; border-bottom: 1px solid #ddd; padding-bottom: 10px;">
                        👁️ Vista previa
                    </h2>
                    
                    <div id="oppi-preview" style="background: #f8f9fa; border-radius: 8px; padding: 15px; border: 1px solid #e9ecef;">
                        <div style="font-size: 11px; color: #6c757d; border-bottom: 2px solid #007bff; padding-bottom: 6px; margin-bottom: 10px;">
                            ℹ️ Información del producto
                        </div>
                        
                        <div class="oppi-preview-item" data-field="show_short_description" style="margin-bottom: 8px; <?php echo $options['show_short_description'] !== 'yes' ? 'display:none;' : ''; ?>">
                            <strong style="font-size: 11px; color: #495057;">DESCRIPCIÓN CORTA:</strong>
                            <div style="color: #6c757d; font-style: italic; font-size: 13px;">Tela de arpillera de alta calidad...</div>
                        </div>
                        
                        <div class="oppi-preview-item" data-field="show_tags" style="margin-bottom: 8px; <?php echo $options['show_tags'] !== 'yes' ? 'display:none;' : ''; ?>">
                            <strong style="font-size: 11px; color: #495057;">ETIQUETAS:</strong>
                            <div>
                                <span style="background: #e7f1ff; color: #0d6efd; padding: 2px 8px; border-radius: 12px; font-size: 11px; margin-right: 4px;">10 onzas</span>
                                <span style="background: #e7f1ff; color: #0d6efd; padding: 2px 8px; border-radius: 12px; font-size: 11px;">Rollo 50m</span>
                            </div>
                        </div>
                        
                        <div class="oppi-preview-item" data-field="show_weight" style="margin-bottom: 8px; <?php echo $options['show_weight'] !== 'yes' ? 'display:none;' : ''; ?>">
                            <strong style="font-size: 11px; color: #495057;">PESO:</strong>
                            <span style="font-family: monospace; background: #fff; padding: 2px 6px; border-radius: 4px; border: 1px solid #dee2e6;">25 kg</span>
                        </div>
                        
                        <div class="oppi-preview-item" data-field="show_dimensions" style="margin-bottom: 8px; <?php echo $options['show_dimensions'] !== 'yes' ? 'display:none;' : ''; ?>">
                            <strong style="font-size: 11px; color: #495057;">DIMENSIONES:</strong>
                            <span style="font-family: monospace; background: #fff; padding: 2px 6px; border-radius: 4px; border: 1px solid #dee2e6;">160 × 30 × 30 cm</span>
                        </div>
                        
                        <div class="oppi-preview-item" data-field="show_stock" style="margin-bottom: 8px; <?php echo $options['show_stock'] !== 'yes' ? 'display:none;' : ''; ?>">
                            <strong style="font-size: 11px; color: #495057;">STOCK:</strong>
                            <span style="color: #198754; font-weight: 600;">150 unidades</span>
                        </div>
                    </div>
                    
                    <p style="margin-top: 15px; font-size: 12px; color: #6c757d;">
                        <strong>Nota:</strong> Los cambios se verán en el POS después de guardar y recargar la página del POS.
                    </p>
                    <p style="margin-top: auto; text-align: center;">Integrado por <a href="https://sintexis.cl/">Sintexis.cl</a></p>
                </div>
            </div>
            
            <?php submit_button('Guardar cambios'); ?>
        </form>
        
        <script>
        jQuery(document).ready(function($) {
            // Actualizar preview en tiempo real
            $('input[type="checkbox"]').on('change', function() {
                var field = $(this).attr('name').replace('oppi_settings[', '').replace(']', '');
                var previewItem = $('.oppi-preview-item[data-field="' + field + '"]');
                if ($(this).is(':checked')) {
                    previewItem.show();
                } else {
                    previewItem.hide();
                }
            });
        });
        </script>
    </div>
    <?php
}

/**
 * Agregar datos personalizados del producto a OpenPOS
 * 
 * Este filtro agrega la descripción, descripción corta, etiquetas y otros campos
 * al objeto del producto que OpenPOS envía al frontend
 */
if (!function_exists('oppi_add_product_data')) {
    function oppi_add_product_data($product_data, $product = null) {
        if (empty($product_data) || empty($product_data['id'])) {
            return $product_data;
        }
        
        $product_id = $product_data['id'];
        
        // Obtener el producto de WooCommerce
        $_product = wc_get_product($product_id);
        
        if (!$_product) {
            return $product_data;
        }
        
        // Si es una variación, obtener también el producto padre
        $parent_id = $_product->get_parent_id();
        $parent_product = $parent_id ? wc_get_product($parent_id) : null;
        
        // Descripción corta
        $short_description = $_product->get_short_description();
        if (empty($short_description) && $parent_product) {
            $short_description = $parent_product->get_short_description();
        }
        $product_data['short_description'] = wp_strip_all_tags($short_description);
        $product_data['short_description_html'] = wp_kses_post($short_description);
        
        // Descripción completa
        $description = $_product->get_description();
        if (empty($description) && $parent_product) {
            $description = $parent_product->get_description();
        }
        $product_data['description'] = wp_strip_all_tags($description);
        $product_data['description_html'] = wp_kses_post($description);
        
        // Etiquetas del producto
        $tags = array();
        $product_tags = wp_get_post_terms($parent_id ? $parent_id : $product_id, 'product_tag');
        if (!is_wp_error($product_tags) && !empty($product_tags)) {
            foreach ($product_tags as $tag) {
                $tags[] = array(
                    'id' => $tag->term_id,
                    'name' => $tag->name,
                    'slug' => $tag->slug
                );
            }
        }
        $product_data['tags'] = $tags;
        $product_data['tags_string'] = implode(', ', array_column($tags, 'name'));

        // Categorías del producto
        $categories = array();
        $product_categories = wp_get_post_terms($parent_id ? $parent_id : $product_id, 'product_cat');
        if (!is_wp_error($product_categories) && !empty($product_categories)) {
            foreach ($product_categories as $cat) {
                $categories[] = array(
                    'id' => $cat->term_id,
                    'name' => $cat->name,
                    'slug' => $cat->slug
                );
            }
        }
        $product_data['categories'] = $categories;
        
        // Peso
        $weight = $_product->get_weight();
        $product_data['weight'] = $weight ? $weight : '';
        $product_data['weight_unit'] = get_option('woocommerce_weight_unit', 'kg');
        $product_data['weight_display'] = $weight ? $weight . ' ' . get_option('woocommerce_weight_unit', 'kg') : '';
        
        // Dimensiones
        $dimensions = array(
            'length' => $_product->get_length(),
            'width' => $_product->get_width(),
            'height' => $_product->get_height()
        );
        $product_data['dimensions'] = $dimensions;
        $product_data['dimensions_unit'] = get_option('woocommerce_dimension_unit', 'cm');
        $product_data['dimensions_display'] = wc_format_dimensions($dimensions);
        
        // Atributos del producto (para productos variables)
        $attributes = array();
        $product_attributes = $_product->get_attributes();
        if (!empty($product_attributes)) {
            foreach ($product_attributes as $attribute_name => $attribute) {
                if (is_object($attribute)) {
                    // Es un objeto WC_Product_Attribute
                    $attr_name = $attribute->get_name();
                    $attr_options = $attribute->get_options();
                    
                    // Obtener nombres legibles de los términos
                    if ($attribute->is_taxonomy()) {
                        $attr_label = wc_attribute_label($attr_name);
                        $terms = array();
                        foreach ($attr_options as $term_id) {
                            $term = get_term($term_id);
                            if ($term && !is_wp_error($term)) {
                                $terms[] = $term->name;
                            }
                        }
                        $attr_value = implode(', ', $terms);
                    } else {
                        $attr_label = $attr_name;
                        $attr_value = implode(', ', $attr_options);
                    }
                    
                    $attributes[] = array(
                        'name' => $attr_label,
                        'value' => $attr_value,
                        'visible' => $attribute->get_visible()
                    );
                } else {
                    // Es un valor simple (para variaciones)
                    $attr_label = wc_attribute_label(str_replace('pa_', '', $attribute_name));
                    $attributes[] = array(
                        'name' => $attr_label,
                        'value' => $attribute,
                        'visible' => true
                    );
                }
            }
        }
        $product_data['product_attributes'] = $attributes;
        
        // Marca (si existe el taxonomy o meta)
        $brand = '';
        // Intentar con taxonomías comunes de marca
        $brand_taxonomies = array('product_brand', 'brand', 'pwb-brand', 'yith_product_brand');
        foreach ($brand_taxonomies as $tax) {
            if (taxonomy_exists($tax)) {
                $brand_terms = wp_get_post_terms($parent_id ? $parent_id : $product_id, $tax);
                if (!is_wp_error($brand_terms) && !empty($brand_terms)) {
                    $brand = $brand_terms[0]->name;
                    break;
                }
            }
        }
        // Si no hay taxonomía de marca, intentar con meta
        if (empty($brand)) {
            $brand = get_post_meta($product_id, '_brand', true);
            if (empty($brand) && $parent_id) {
                $brand = get_post_meta($parent_id, '_brand', true);
            }
        }
        $product_data['brand'] = $brand;
        
        // Proveedor/Vendor (si existe)
        $vendor = get_post_meta($product_id, '_vendor', true);
        if (empty($vendor) && $parent_id) {
            $vendor = get_post_meta($parent_id, '_vendor', true);
        }
        $product_data['vendor'] = $vendor;
        
        // Fecha de creación
        $product_data['date_created'] = $_product->get_date_created() ? $_product->get_date_created()->format('Y-m-d H:i:s') : '';
        
        // Fecha de modificación
        $product_data['date_modified'] = $_product->get_date_modified() ? $_product->get_date_modified()->format('Y-m-d H:i:s') : '';
        
        // Meta personalizados adicionales (desde configuración del plugin)
        $options = oppi_get_options();
        $custom_fields_string = $options['custom_fields'];
        $custom_data = array();
        
        if (!empty($custom_fields_string)) {
            $custom_keys = array_map('trim', explode(',', $custom_fields_string));
            
            foreach ($custom_keys as $meta_key) {
                if (empty($meta_key)) continue;
                
                $meta_value = get_post_meta($product_id, $meta_key, true);
                if (empty($meta_value) && $parent_id) {
                    $meta_value = get_post_meta($parent_id, $meta_key, true);
                }
                
                if (!empty($meta_value)) {
                    // Crear etiqueta legible desde el meta key
                    $label = str_replace(array('_', '-'), ' ', ltrim($meta_key, '_'));
                    $label = ucwords($label);
                    
                    $custom_data[$meta_key] = array(
                        'label' => $label,
                        'value' => $meta_value
                    );
                }
            }
        }
        
        // Permitir agregar más metas via filtro
        $custom_metas = apply_filters('oppi_custom_meta_keys', array());
        foreach ($custom_metas as $meta_key => $label) {
            $meta_value = get_post_meta($product_id, $meta_key, true);
            if (empty($meta_value) && $parent_id) {
                $meta_value = get_post_meta($parent_id, $meta_key, true);
            }
            if (!empty($meta_value)) {
                $custom_data[$meta_key] = array(
                    'label' => $label,
                    'value' => $meta_value
                );
            }
        }
        
        $product_data['custom_meta'] = $custom_data;
        
        // Unidad de medida (si usas algún plugin de unidades)
        $unit = get_post_meta($product_id, '_unit', true);
        if (empty($unit) && $parent_id) {
            $unit = get_post_meta($parent_id, '_unit', true);
        }
        $product_data['unit'] = $unit;
        
        // Contenido/Cantidad por unidad
        $unit_content = get_post_meta($product_id, '_unit_content', true);
        if (empty($unit_content) && $parent_id) {
            $unit_content = get_post_meta($parent_id, '_unit_content', true);
        }
        $product_data['unit_content'] = $unit_content;
        
        return $product_data;
    }
}
add_filter('op_product_data', 'oppi_add_product_data', 10, 2);

/**
 * Registrar y encolar scripts y estilos para OpenPOS
 */
function oppi_register_scripts() {
    // Registrar el script
    wp_register_script(
        'oppi-product-info', 
        plugin_dir_url(__FILE__) . 'assets/js/product-info.js', 
        array(), 
        '1.1.' . time(),
        true
    );
    wp_enqueue_script('oppi-product-info');
    
    // Registrar el estilo
    wp_register_style(
        'oppi-product-info-style',
        plugin_dir_url(__FILE__) . 'assets/css/product-info.css',
        array(),
        '1.1.' . time()
    );
    wp_enqueue_style('oppi-product-info-style');
    
    // Pasar configuración al JavaScript
    $options = oppi_get_options();
    
    wp_localize_script('oppi-product-info', 'oppiConfig', array(
        'showDescription' => $options['show_description'] === 'yes',
        'showShortDescription' => $options['show_short_description'] === 'yes',
        'showTags' => $options['show_tags'] === 'yes',
        'showWeight' => $options['show_weight'] === 'yes',
        'showDimensions' => $options['show_dimensions'] === 'yes',
        'showAttributes' => $options['show_attributes'] === 'yes',
        'showBrand' => $options['show_brand'] === 'yes',
        'showSku' => $options['show_sku'] === 'yes',
        'showStock' => $options['show_stock'] === 'yes',
        'showPriceRules' => $options['show_price_rules'] === 'yes',
        'showCategories' => $options['show_categories'] === 'yes',
        'showBarcode' => $options['show_barcode'] === 'yes',
        'showVendor' => $options['show_vendor'] === 'yes',
        'maxDescriptionLength' => intval($options['max_description_length']),
        'labels' => array(
            'showMore' => 'Ver más',
            'showLess' => 'Ver menos',
        )
    ));
}
add_action('init', 'oppi_register_scripts');

// Agregar scripts al POS de OpenPOS
function oppi_add_to_pos_scripts($handles) {
    $handles[] = 'oppi-product-info';
    return $handles;
}
add_filter('openpos_pos_header_js', 'oppi_add_to_pos_scripts');

// Agregar estilos al POS
function oppi_add_to_pos_styles($handles) {
    $handles[] = 'oppi-product-info-style';
    return $handles;
}
add_filter('openpos_pos_header_css', 'oppi_add_to_pos_styles');

/**
 * Crear directorio de assets si no existe durante la activación
 */
function oppi_activate() {
    $plugin_dir = plugin_dir_path(__FILE__);
    
    // Crear directorios
    if (!file_exists($plugin_dir . 'assets')) {
        mkdir($plugin_dir . 'assets', 0755, true);
    }
    if (!file_exists($plugin_dir . 'assets/js')) {
        mkdir($plugin_dir . 'assets/js', 0755, true);
    }
    if (!file_exists($plugin_dir . 'assets/css')) {
        mkdir($plugin_dir . 'assets/css', 0755, true);
    }
}
register_activation_hook(__FILE__, 'oppi_activate');

/**
 * API endpoint para obtener información extendida del producto
 * Útil si necesitas hacer una llamada AJAX adicional
 */
add_action('rest_api_init', function() {
    register_rest_route('oppi/v1', '/product/(?P<id>\d+)', array(
        'methods' => 'GET',
        'callback' => function(WP_REST_Request $request) {
            $product_id = $request->get_param('id');
            $product = wc_get_product($product_id);
            
            if (!$product) {
                return new WP_REST_Response(array(
                    'success' => false,
                    'message' => 'Producto no encontrado'
                ), 404);
            }
            
            $product_data = array('id' => $product_id);
            $product_data = oppi_add_product_data($product_data, $product);
            
            return new WP_REST_Response(array(
                'success' => true,
                'data' => $product_data
            ), 200);
        },
        'permission_callback' => '__return_true'
    ));
});

/**
 * Agregar enlace de configuración en la página de plugins
 */
function oppi_plugin_action_links($links) {
    $settings_link = '<a href="' . admin_url('admin.php?page=oppi-settings') . '">Configuración</a>';
    array_unshift($links, $settings_link);
    return $links;
}
add_filter('plugin_action_links_' . plugin_basename(__FILE__), 'oppi_plugin_action_links');