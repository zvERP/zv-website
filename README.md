# Website Local Video para Odoo 16

Este repositorio contiene el addon `website_local_video`. Añade un bloque
**Vídeo local** al editor de sitios web de Odoo 16.

## Funciones

- Subida desde el equipo directamente en el editor (MP4, WebM, OGG, MOV o M4V).
- Vídeo incrustado mediante el reproductor HTML5 nativo.
- Reemplazo del vídeo desde las opciones del bloque.
- Controles, reproducción automática, bucle, silencio, proporción, ancho y ajuste.
- Subidas restringidas a usuarios con permisos de edición del sitio web.
- Vídeos privados servidos mediante un token no enumerable y limitado al sitio.
- Límite predeterminado de 100 MB.

## Instalación

1. Copia `website_local_video` en una ruta de addons de Odoo.
2. Actualiza la lista de aplicaciones.
3. Instala **Website Local Video**.
4. Edita una página y arrastra **Vídeo local** desde los bloques de estructura.

El tamaño máximo se puede configurar, entre 1 y 1024 MB, mediante el parámetro
de sistema `website_local_video.max_file_size_mb`. Odoo, el proxy inverso y el
servidor web también deben admitir el tamaño de petición elegido.

Para conseguir la máxima compatibilidad entre navegadores, conviene usar MP4
con vídeo H.264 y audio AAC. Odoo guarda el archivo como un adjunto privado del
sitio web actual y lo sirve únicamente mediante la URL autorizada que genera el
módulo; el módulo no transcodifica el vídeo.
