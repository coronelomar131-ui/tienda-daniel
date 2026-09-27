# Anuncio "¿Réplicas? Aquí no."

Video vertical de 25 s hecho con la skill `video-pizarra` (`.claude/skills/video-pizarra`).
Aquí están sólo las escenas y el storyboard; el motor viene en la skill.

Para volver a sacarlo o cambiarlo:

1. Copia `template/` de la skill a una carpeta nueva y pon ahí este `scenes.js`.
2. En `index.html` agrega la clase `.bs` para Big Shoulders Display
   (`.bs{font-family:"Big Shoulders Display",Impact,sans-serif;font-weight:900}`)
   y carga la fuente junto con Caveat, Kalam y JetBrains Mono.
3. `npm install`, luego `./build.sh prothe-anuncio`.
   Salen `prothe-anuncio.mp4` (master) y `prothe-anuncio-movil.mp4` (para mandar por WhatsApp).
