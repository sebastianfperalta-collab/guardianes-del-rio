# Guardianes del Río (demo #3)

Viaje en barca por el río Bogotá, del páramo de Guacheneque al Salto del Tequendama. 5 tramos. El entorno revive según lo que limpias.

## Cómo probarlo
- En el celular: súbelo a GitHub Pages (igual que los otros demos) y ábrelo desde el enlace. Mueve el celular para mirar alrededor (en iPhone pide permiso de movimiento). Sin giroscopio: arrastra el dedo.
- En computador local: `python3 -m http.server` dentro de esta carpeta y abre `http://localhost:8000`.
- Atajos: `?rapido=1` (mitad de basura, para presentaciones cortas), `?tramo=2` (salta a un tramo).

## Qué se hace
1. Tocar la basura que flota para recogerla. Hay 15 tipos de residuos (plástico, vidrio, cartón, metal, orgánicos, llantas, pilas, bombillos, electrónicos…) con pesos distintos; no se repite el mismo dos veces seguidas.
2. Mantener presionadas las tuberías que vierten para sellarlas (tramos 2 y 4). Mientras mantienes, la barca frena casi por completo; el CTA "Mantén presionado para tapar" indica qué elemento es interactivo.
3. Mantener presionada el ave atrapada en una bolsa para liberarla (tramo 3).
4. Tocar fauna y flora para fotografiarla: el juego se pausa, aparece la foto con su ficha y se llena la libreta (5 especies). El CTA "Toca para fotografiar" aparece sobre los animales visibles.
5. Al final de cada tramo: clasificar residuos en 3 canecas y leer un dato real.
6. Diploma "Guardián del Río" con su nombre, descargable en PNG.

## Personalizar
Edita `config.js`: `organizacion` (aparece en el diploma), `contacto` (pantalla final), cantidad de basura.
Los textos y datos están en `js/datos.js`.

## Datos verificados (consultados en noviembre de 2026)
- Nace en el páramo de Guacheneque, Villapinzón, a unos 3.300 m (El Tiempo; Alcaldía de Bogotá). Desemboca en el río Magdalena.
- Salto del Tequendama: 157 m de caída; Patrimonio Natural de Colombia desde 2019 (Ministerio de Ambiente).
- Convenio CAR–Alcaldía de Villapinzón con el Centro Tecnológico del Cuero para reducir vertimientos de curtiembres (Alcaldía de Bogotá).
- PTAR Canoas: en licitación (oct. 2026); tratará aguas de unos 6,5 millones de personas de Bogotá y Soacha hacia 2035. Adjudicación esperada hacia mediados de 2027. No está en operación.
- Tingua bogotana (*Rallus semiplumbeus*): endémica y amenazada; guapucha (*Grundulus bogotensis*): menos de 8 cm, endémica del altiplano, amenazada (Key Biodiversity Areas; Pontificia Universidad Javeriana).
- Los ríos Fucha, Tunjuelo y Salitre desembocan en el Bogotá (Alcaldía de Bogotá).

## Pendiente por confirmar antes de presentarlo
- Fotos reales en `img/`: falta confirmar autor y licencia de cada una para acreditarla en pantalla.
- La garza de `img/garza.webp` es una garza gris (*Ardea cinerea*), no *Ardea alba* como dice el juego; ajusta nombre o foto.
- La foto del pato (`img/pato.webp`) es *Oxyura jamaicensis* (pato ruddy), no el pato andino del juego; ajusta nombre o foto.
- La longitud total del río aparece con cifras distintas según la fuente (308 a 380 km), por eso no se muestra ninguna.
- El "pato andino" del álbum se asocia a *Oxyura jamaicensis*, que figura como amenazada a nivel nacional en la ficha de los humedales de la Sabana; confirma el nombre común con un biólogo si lo vas a citar.
- La historia del abuelo es ficticia (narrativa).

## Estilo visual (v2)
- Orillas tipo acantilado con capas de roca, agua azul turquesa con espuma, casas de techo rojo, palafitos, puentes de madera, cascadas, nubes, helechos arborescentes en el último tramo y edificios en el tramo de Bogotá y Soacha.
- Fondo 360° pintado por código (cielo, nubes y tres capas de cordillera), en el mismo estilo low-poly. Se oscurece y se llena de bruma cuando el río está sucio.
- Interfaz de vidrio oscuro turquesa con botones naranja/verde y mapa de ruta de 5 tramos.
- La versión anterior quedó en la carpeta demo-rio-v1 (no incluida en el zip).

## Créditos técnicos
three.js 0.160 (MIT). Fuentes Fredoka y Nunito (OFL). Sonidos sintetizados en el navegador.
