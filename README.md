# OpenPOS Product Info

Plugin para WordPress/WooCommerce que agrega información adicional del producto al modal de OpenPOS.

## Características

- ✅ Muestra descripción corta del producto
- ✅ Muestra descripción completa (expandible)
- ✅ Muestra etiquetas del producto
- ✅ Muestra marca (si está configurada)
- ✅ Muestra peso y dimensiones
- ✅ Muestra atributos del producto
- ✅ Soporte para campos personalizados
- ✅ Diseño responsive
- ✅ Soporte para tema oscuro

## Instalación

### Método 1: Subir ZIP
1. Descarga el archivo ZIP del plugin
2. Ve a WordPress Admin > Plugins > Añadir nuevo > Subir plugin
3. Selecciona el archivo ZIP y haz clic en "Instalar ahora"
4. Activa el plugin

### Método 2: Manual vía FTP
1. Descomprime el archivo ZIP
2. Sube la carpeta `openpos-product-info` a `/wp-content/plugins/`
3. Ve a WordPress Admin > Plugins
4. Activa "OpenPOS Product Info"

## Uso

Una vez activado, el plugin automáticamente:
1. Agrega los datos adicionales del producto (descripción, etiquetas, etc.) al objeto de producto de OpenPOS
2. Muestra esta información en el modal del producto cuando se hace clic en un producto

## Personalización

### Agregar campos meta personalizados

Puedes agregar campos meta personalizados usando el filtro `oppi_custom_meta_keys`:

```php
add_filter('oppi_custom_meta_keys', function($metas) {
    $metas['_mi_campo_meta'] = 'Mi Etiqueta Personalizada';
    $metas['_otro_campo'] = 'Otro Campo';
    return $metas;
});
```

### Modificar la configuración JavaScript

El plugin pasa una configuración al JavaScript que puedes modificar con el filtro de WordPress:

```php
add_filter('oppi_js_config', function($config) {
    $config['showDescription'] = false; // Ocultar descripción
    $config['maxDescriptionLength'] = 300; // Cambiar longitud máxima
    return $config;
});
```

### Personalizar los estilos

Puedes sobrescribir los estilos CSS en tu tema o plugin:

```css
/* Ejemplo: Cambiar el color de fondo */
.oppi-info-wrapper {
    background-color: #fff !important;
}

/* Ejemplo: Cambiar el color de las etiquetas */
.oppi-tag {
    background-color: #28a745 !important;
    color: white !important;
}
```

## API REST

El plugin también expone un endpoint REST para obtener información del producto:

```
GET /wp-json/oppi/v1/product/{id}
```

Respuesta:
```json
{
    "success": true,
    "data": {
        "id": 123,
        "short_description": "Descripción corta...",
        "description": "Descripción completa...",
        "tags": [...],
        "brand": "Mi Marca",
        // ... más campos
    }
}
```

## Solución de problemas

### La información no se muestra
1. Verifica que el plugin esté activado
2. Limpia la caché del navegador
3. En OpenPOS, haz logout y login nuevamente para recargar los productos
4. Verifica la consola del navegador (F12) para ver errores

### Los productos no tienen los datos nuevos
Los datos se agregan cuando OpenPOS sincroniza los productos. Para forzar la resincronización:
1. Ve a OpenPOS Admin > Settings > Tools
2. Haz clic en "Clear Product Cache"
3. Vuelve a iniciar sesión en el POS

## Compatibilidad

- WordPress 5.0+
- WooCommerce 4.0+
- OpenPOS 6.0+

## Changelog

### 1.0.0
- Versión inicial
- Soporte para descripción, etiquetas, marca, peso, dimensiones y atributos

## Soporte

Para soporte, contacta a [Sintexis](https://sintexis.cl)

## Licencia

GPL v2 o posterior
