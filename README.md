# Frigorífico La Trinidad — sitio web

Página del negocio: nombre, dirección, horarios y contacto por WhatsApp.
Está publicada en https://frigorifico-la-trinidad.web.app

## Cómo se publica

El sitio vive en el mismo proyecto de Firebase que la app Mi Reparto (`mireparto-14d64`),
pero como un sitio de Hosting aparte (`frigorifico-la-trinidad`). Publicar acá no toca la app.

```bash
npx firebase deploy --only hosting --project mireparto-14d64
```

## Contenido

- `public/index.html`: la página completa (HTML y CSS en un solo archivo, sin dependencias).
- `firebase.json` y `.firebaserc`: configuración de Hosting. Se publica solo la carpeta `public/`, para no exponer archivos internos del repositorio.
