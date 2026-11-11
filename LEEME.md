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

## Modelos 3D y entorno (v3)
- Canoa de tablas con costillas, bancos, borda, roda de proa con franjas, cuerda, balde, canasto tejido y remo.
- Fauna rehecha: garza con cuello curvo, tingua de pico rojo, pato de mejilla blanca y cola en abanico, guapuchas que saltan.
- 15 residuos con forma propia (botella con etiqueta, lata, llanta, caja con solapas, periódico, bombillo, celular…).
- Vertimiento con cabezal de concreto, chorro animado y mancha en el agua; al sellarlo aparece una tapa verde con volante.
- Agua con ondas que siguen la corriente, reflejo del cielo, destello del sol, red de luz y espuma de orilla; nata cuando está sucia.
- Acantilados con estratos, vetas y musgo; pasto con parches y cultivos de la sabana.
- Vegetación nueva con vaivén de viento: pinos, árboles, sauces llorones, arbustos, pasto, juncos con espadañas, lirios, lotos y frailejones con flores.
- Pueblos con casas detalladas (ventanas, puertas, corredor, balcón), potreros con cercas y vacas, iglesia, palafitos, canoas pintadas, puentes con barandas y faroles.
- Ciudad con edificios de ventanas y toldos, y fábricas con chimeneas cuyo humo se apaga cuando el río sana.
- Letreros de madera con el nombre de cada tramo, nubes suaves, cascadas con rocas y bruma.
- Muelle con cuerdas, farol y el abuelo con ruana y sombrero.
- Si el equipo va lento (menos de 26 cuadros por segundo), el juego baja la resolución y oculta pasto y arbustos automáticamente.
- Fondo 360° pintado por código; interfaz de vidrio oscuro turquesa.
- Versiones anteriores: carpetas demo-rio-v1 y demo-rio-v2 (no incluidas en el zip).

## Segunda ronda de mejoras 3D (v4)
- Formas redondeadas y suaves: pinos de pisos redondeados, copas de masas redondas, arbustos y guijarros lisos.
- Acantilados y orillas como muros de bloques de piedra clara, con enredaderas que cuelgan y pasto que se asoma en el borde.
- Agua turquesa translúcida con piedras del fondo visibles cerca de la orilla y red de luz más marcada.
- Orillas más densas: flores en espiga de colores, plantas de hoja ancha, helechos bajos, guijarros, más lirios y lotos blancos y rosados; florecitas pintadas sobre el pasto.
- Rocas en bloques facetados claros con musgo arriba.
- La versión anterior quedó en la carpeta demo-rio-v3 (no incluida en el zip).

## Créditos técnicos
three.js 0.160 (MIT). Fuentes Fredoka y Nunito (OFL). Sonidos sintetizados en el navegador.
