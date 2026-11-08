// Datos verificados (fuentes consultadas en noviembre de 2026). Ver LEEME.md
export const TRAMOS = [
  {
    id: 'paramo', nombre: 'Nacimiento · Páramo de Guacheneque', lugar: 'Villapinzón',
    dato: 'El río Bogotá nace a unos 3.300 m de altura, en el páramo de Guacheneque (Villapinzón, Cundinamarca). Su agua abastece a Bogotá y a decenas de municipios de Cundinamarca.',
    cierre: 'Aquí el agua todavía es casi limpia. Cuidar el páramo es cuidar el río desde el principio.',
    fuente: 'CAR · El Tiempo · Alcaldía de Bogotá',
    basura: 10, vertimiento: false, estado0: 0.75
  },
  {
    id: 'curtiembres', nombre: 'Villapinzón y Chocontá', lugar: 'Cuenca alta',
    dato: 'En la cuenca alta, vertimientos de curtiembres y otras actividades empiezan a ensuciar el agua. La CAR trabaja con el Centro Tecnológico del Cuero para reducir esos vertimientos.',
    cierre: 'Si el río no se ensucia aquí arriba, no hay que limpiarlo después aguas abajo.',
    fuente: 'CAR · Alcaldía de Bogotá',
    basura: 16, vertimiento: true, estado0: 0.35
  },
  {
    id: 'sabana', nombre: 'La Sabana y sus humedales', lugar: 'Sabana de Bogotá',
    dato: 'Los humedales de la Sabana son hogar de aves como la tingua bogotana, endémica y en peligro. También viven allí la guapucha, un pez de menos de 8 cm que solo existe en el altiplano.',
    cierre: 'Cada humedal recuperado es casa para especies que no existen en ningún otro lugar.',
    fuente: 'Key Biodiversity Areas · Pontificia Universidad Javeriana',
    basura: 20, vertimiento: false, estado0: 0.2
  },
  {
    id: 'ciudad', nombre: 'Bogotá y Soacha', lugar: 'El tramo más duro',
    dato: 'Al río llegan los ríos Fucha, Tunjuelo y Salitre. La PTAR Canoas, que tratará las aguas de unos 6,5 millones de personas de Bogotá y Soacha hacia 2035, está hoy en licitación.',
    cierre: 'La gran planta es una obra de años. Mientras tanto, lo que cada uno no tira marca la diferencia.',
    fuente: 'Alcaldía de Bogotá (licitación PTAR Canoas, oct. 2026)',
    basura: 24, vertimiento: true, estado0: 0.08
  },
  {
    id: 'tequendama', nombre: 'Salto del Tequendama', lugar: 'Camino al Magdalena',
    dato: 'El río cae 157 metros en el Salto del Tequendama, declarado Patrimonio Natural de Colombia en 2019. Luego sigue hasta desembocar en el río Magdalena.',
    cierre: 'Del páramo al Magdalena: un solo río, muchas manos. Hoy hiciste parte del camino.',
    fuente: 'Ministerio de Ambiente (2019) · Alcaldía de Bogotá',
    basura: 14, vertimiento: false, estado0: 0.15
  }
];

export const ESPECIES = [
  { id: 'tingua', nombre: 'Tingua bogotana', cien: 'Rallus semiplumbeus', dato: 'Ave endémica de los humedales de la Sabana. Está en peligro: depende de humedales limpios con juncos.' },
  { id: 'guapucha', nombre: 'Guapucha', cien: 'Grundulus bogotensis', dato: 'Pez plateado de menos de 8 cm, endémico del altiplano. Está amenazado y necesita agua de buena calidad.' },
  { id: 'garza', nombre: 'Garza real', cien: 'Ardea alba', dato: 'Ave pescadora de humedales. Aparece cuando el agua vuelve a tener peces.' },
  { id: 'pato', nombre: 'Pato andino', cien: 'Oxyura jamaicensis andina', dato: 'Pato buceador de los humedales altoandinos; figura entre las especies amenazadas de la Sabana.' },
  { id: 'frailejon', nombre: 'Frailejón', cien: 'Espeletia', dato: 'Planta del páramo que atrapa la niebla y la convierte en agua: una esponja natural.' }
];

export const BASURA = [
  { tipo: 'plastico', nombre: 'Botella plástica', color: 0x4fc3f7 },
  { tipo: 'plastico', nombre: 'Bolsa', color: 0xe0e0e0 },
  { tipo: 'metal', nombre: 'Lata', color: 0xb0b7c3 },
  { tipo: 'organico', nombre: 'Restos de comida', color: 0x8d6e3f },
  { tipo: 'organico', nombre: 'Ramas y hojas secas', color: 0x6b5a2e },
  { tipo: 'llanta', nombre: 'Llanta', color: 0x2b2b2b }
];
