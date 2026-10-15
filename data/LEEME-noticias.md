# Cómo publicar noticias

Todas las noticias están en `data/noticias.json`. No hay que tocar `index.html` ni `noticias.html`.

- **Inicio:** muestra solo las noticias que tengan `"inicio": true` (máximo 6, de la más reciente a la más antigua). Si son una o dos, se ven como tarjetas anchas.
- **noticias.html:** muestra todas, con filtros y paginación. Arriba va la noticia con `"destacada": true` más reciente que tenga `imagen`.

Para sacar una noticia del inicio, borre la línea `"inicio": true` (o cámbiela a `false`): la noticia sigue en noticias.html.

## Agregar una noticia

Copie este bloque al inicio de la lista (después del `[`), cambie los datos y deje una coma entre noticias:

```json
{
  "id": "nombre-corto-sin-espacios",
  "fecha": "2026-10-15",
  "categoria": "evento",
  "titulo": "Título de la noticia",
  "resumen": "Una o dos frases que resuman la noticia.",
  "imagen": "/imagenes/imagenes-index-noticias/mi-imagen.webp",
  "enlaces": [
    { "texto": "Leer más", "url": "https://www.facebook.com/...", "icono": "bi-facebook" }
  ]
},
```

## Campos

| Campo | Obligatorio | Descripción |
|---|---|---|
| `id` | Sí | Identificador único, en minúsculas y con guiones. |
| `fecha` | Sí | Formato `AAAA-MM-DD`. Define el orden. |
| `categoria` | Sí | `convocatoria`, `evento`, `comunicado` o `video` (son los filtros). |
| `titulo`, `resumen` | Sí | Texto de la tarjeta. |
| `etiqueta` | No | Cambia el texto de la etiqueta de color (por ejemplo `"Audiencia Pública"`). |
| `imagen` | No | Ruta que empieza por `/`. Sin imagen se muestra un ícono. |
| `icono` | No | Ícono de [Bootstrap Icons](https://icons.getbootstrap.com/) cuando no hay imagen, por ejemplo `"bi-megaphone-fill"`. |
| `video` | No | Código de un video de YouTube (lo que va después de `watch?v=`). Se reproduce dentro de la tarjeta. |
| `enlaces` | No | Botones: `texto`, `url` y opcionalmente `icono`. Los PDF y sitios externos se abren en otra pestaña. |
| `galeria` | No | Lista de rutas de fotos. Agrega el botón "Ver galería". |
| `detalle` | No | `{ "imagenes": [...], "texto": "<p>...</p>" }`. Agrega el botón "Ver detalles" con una ventana de información. |
| `inicio` | No | `true` para mostrarla también en la página de inicio. |
| `destacada` | No | `true` para que pueda ir como noticia principal en noticias.html. |

## Antes de subir

El archivo debe ser JSON válido: comillas dobles, comas entre elementos y sin coma después del último. Si tiene un error, las páginas muestran "No fue posible cargar las noticias". Puede revisarlo en https://jsonlint.com.
