// Catálogo de equipos: metadatos para la portada, el selector del visor y la tabla comparativa.
// No importa nada 3D: se carga también en la portada.

export const MARCAS = {
  Agilent: { pais: 'Estados Unidos', desc: 'Fabricante de referencia en cromatografía de gases y de líquidos, GC/MS e ICP-MS. Sus cromatógrafos 7890 y sus HPLC Infinity están entre los más extendidos en laboratorios de control.' },
  Shimadzu: { pais: 'Japón', desc: 'Amplia gama de espectrofotómetros UV-Vis y FTIR, LC-MS y GC-MS. Destaca por la velocidad de sus triple cuadrupolos y por su material didáctico sobre fundamentos.' },
  'Modelo didáctico': { pais: 'Referencias: Thermo Scientific DFS · JEOL', desc: 'Instrumento genérico de sector magnético. Ninguno de los tres fabricantes del catálogo comercializa hoy sectores magnéticos; los fabrican principalmente Thermo Fisher Scientific y JEOL.' },
  Bruker: { pais: 'Alemania / Estados Unidos', desc: 'Líder en resonancia magnética nuclear y especialista en MALDI-TOF, movilidad iónica (timsTOF) y FT-ICR. Su MALDI Biotyper es el estándar en identificación microbiana.' },
};

/** Grandes áreas de la instrumentación del catálogo. `campos` da el rótulo de cada dato de la ficha según el área. */
export const AREAS = {
  masas: {
    nombre: 'Espectrometría de masas', corto: 'Masas',
    desc: 'Los compuestos se ionizan y los iones se separan según su relación masa/carga (m/z). Identifica y cuantifica moléculas y elementos a partir de su masa y de sus fragmentos.',
    campos: { entrada: 'Introducción de muestra', fuente: 'Fuente de iones', analizador: 'Analizador', detector: 'Detector', vacio: 'Sistema de vacío', rango: 'Rango de masas', resolucion: 'Resolución' },
  },
  espectroscopia: {
    nombre: 'Espectroscopía', corto: 'Espectroscopía',
    desc: 'Se mide cómo la muestra absorbe radiación electromagnética: luz ultravioleta y visible, infrarrojo o radiofrecuencia dentro de un campo magnético. Cada región del espectro informa de algo distinto: electrones, enlaces o núcleos.',
    campos: { entrada: 'Muestra', fuente: 'Fuente de radiación', analizador: 'Sistema de medida', detector: 'Detector', vacio: 'Requisitos', rango: 'Rango espectral', resolucion: 'Resolución' },
  },
  cromatografia: {
    nombre: 'Cromatografía', corto: 'Cromatografía',
    desc: 'Los componentes de una mezcla se separan al repartirse entre una fase móvil, gas o líquido, y una fase estacionaria dentro de una columna. Cada compuesto sale en un tiempo característico y un detector lo registra.',
    campos: { entrada: 'Inyección', fuente: 'Fase móvil', analizador: 'Separación', detector: 'Detector', vacio: 'Gases y servicios', rango: 'Intervalo de trabajo', resolucion: 'Prestaciones' },
  },
};

/** Clasificación de los analizadores de masas. */
export const CLASES = {
  Tradicional: { nombre: 'Analizadores tradicionales', desc: 'Separación por desviación en campos magnéticos y eléctricos estáticos. Fueron los primeros espectrómetros de masas y siguen siendo la referencia en alta resolución con barrido para contaminantes persistentes.' },
  Cuadrupolar: { nombre: 'Analizadores cuadrupolares', desc: 'Separación por estabilidad de la trayectoria en campos de radiofrecuencia. Compactos, rápidos y robustos: son los más extendidos en análisis de rutina y cuantificación.' },
  Moderno: { nombre: 'Analizadores modernos de alta resolución', desc: 'Medida del tiempo de vuelo o de la frecuencia de oscilación del ion, a menudo combinada con movilidad iónica. Alta resolución y exactitud de masa para identificar compuestos desconocidos.' },
  Óptica: { nombre: 'Espectroscopía óptica', desc: 'Absorción de luz ultravioleta, visible o infrarroja. La luz atraviesa la muestra, o se refleja en ella, y el detector mide cuánta se absorbe a cada longitud de onda o número de onda.' },
  RMN: { nombre: 'Resonancia magnética nuclear', desc: 'Los núcleos con espín, como el ¹H, se orientan en un campo magnético intenso y absorben radiofrecuencia a una frecuencia que depende de su entorno químico.' },
  Separación: { nombre: 'Técnicas de separación', desc: 'Cromatografía de gases y de líquidos: separan los componentes de una mezcla antes de detectarlos, solas o acopladas a un espectrómetro de masas.' },
};

export const TIPOS = {
  'Sector magnético': {
    nombre: 'GC-HRMS · sector magnético de doble enfoque', fuente: 'Impacto electrónico (EI)', analizador: 'Sector eléctrico (ESA) + sector magnético',
    desc: 'Alta resolución (≥ 10 000) con detección selectiva de iones. Método de referencia para dioxinas, furanos y otros contaminantes orgánicos persistentes.',
  },
  'GC-MS': {
    nombre: 'GC-MS · cuadrupolo simple', fuente: 'Impacto electrónico (EI)', analizador: 'Cuadrupolo',
    desc: 'Compuestos volátiles y semivolátiles separados por cromatografía de gases. Espectros EI reproducibles, comparables con bibliotecas.',
  },
  'LC-MS/MS': {
    nombre: 'LC-MS/MS · triple cuadrupolo', fuente: 'Electrospray (ESI) / APCI', analizador: 'Q1 · celda de colisión · Q3',
    desc: 'Compuestos polares, no volátiles o termolábiles separados por HPLC. Cuantificación selectiva por transiciones MRM.',
  },
  'MALDI-TOF': {
    nombre: 'MALDI-TOF · tiempo de vuelo', fuente: 'Desorción/ionización láser asistida por matriz (MALDI)', analizador: 'Tiempo de vuelo (TOF)',
    desc: 'Biomoléculas y polímeros de masa elevada. Identificación de microorganismos por su huella proteica.',
  },
  'LC-QTOF': {
    nombre: 'LC-QTOF · cuadrupolo + tiempo de vuelo', fuente: 'Electrospray (ESI)', analizador: 'Cuadrupolo + celda de colisión + TOF ortogonal',
    desc: 'Masa exacta (< 1 ppm) y espectros completos de alta resolución, con fragmentación selectiva. Identificación de desconocidos, metabolómica y cribado.',
  },
  'TIMS-QTOF': {
    nombre: 'LC-TIMS-QTOF · movilidad iónica + tiempo de vuelo', fuente: 'Electrospray (nanoESI)', analizador: 'Movilidad iónica atrapada + cuadrupolo + TOF ortogonal',
    desc: 'Separación adicional por forma y tamaño del ion (sección eficaz de colisión). Proteómica y lipidómica de alto rendimiento.',
  },
  'FT-ICR': {
    nombre: 'FT-ICR · resonancia ciclotrónica de iones', fuente: 'ESI y MALDI', analizador: 'Celda ICR en campo magnético con transformada de Fourier',
    desc: 'La mayor resolución y exactitud de masa disponibles. Fórmulas moleculares exactas en mezclas muy complejas (petróleo, materia orgánica natural, metabolómica).',
  },
  'ICP-MS': {
    nombre: 'ICP-MS · plasma acoplado inductivamente', fuente: 'Plasma de argón (ICP)', analizador: 'Celda de colisión/reacción + cuadrupolo',
    desc: 'Análisis elemental: metales y trazas desde ng/L hasta cientos de mg/L, con información isotópica. Aguas, alimentos, suelos, clínica y semiconductores.',
  },
  'UV-Vis': {
    nombre: 'Espectrofotometría UV-Vis', fuente: 'Lámparas de deuterio y de wolframio-halógeno', analizador: 'Monocromador de rejilla · doble haz',
    desc: 'Absorción de luz ultravioleta y visible por transiciones electrónicas. La absorbancia es proporcional a la concentración (ley de Beer-Lambert): cuantificación de rutina, cinética y control de calidad.',
  },
  FTIR: {
    nombre: 'Espectroscopía FTIR · infrarrojo por transformada de Fourier', fuente: 'Fuente cerámica de infrarrojo', analizador: 'Interferómetro de Michelson',
    desc: 'Absorción de radiación infrarroja por las vibraciones de los enlaces. El espectro es una huella de los grupos funcionales: identificación de compuestos, polímeros y materiales.',
  },
  RMN: {
    nombre: 'RMN · resonancia magnética nuclear', fuente: 'Pulsos de radiofrecuencia', analizador: 'Imán superconductor + sonda',
    desc: 'Los núcleos ¹H, ¹³C y otros absorben radiofrecuencia según su entorno químico. Desplazamientos químicos, acoplamientos e integrales permiten deducir la estructura de una molécula.',
  },
  GC: {
    nombre: 'Cromatografía de gases (GC)', fuente: 'Gas portador', analizador: 'Columna capilar en horno',
    desc: 'Separación de compuestos volátiles y semivolátiles en una columna capilar calentada con un gas portador. Detectores como el FID cuantifican con gran sensibilidad.',
  },
  HPLC: {
    nombre: 'Cromatografía de líquidos (HPLC)', fuente: 'Fase móvil líquida a alta presión', analizador: 'Columna rellena termostatizada',
    desc: 'Separación de compuestos no volátiles o termolábiles con una fase móvil líquida bombeada a alta presión a través de una columna rellena. Detección UV-Vis por arreglo de diodos.',
  },
};

export const EQUIPOS = [
  {
    id: 'agilent-5977', area: 'masas', marca: 'Agilent', modelo: '5977 GC/MSD', tipo: 'GC-MS', clase: 'Cuadrupolar',
    resumen: 'Detector selectivo de masas acoplado a cromatografía de gases, con fuente EI, filtro cuadrupolar hiperbólico de cuarzo y detector de triple eje.',
    entrada: 'Cromatógrafo de gases (columna capilar)', fuente: 'EI 70 eV (CI opcional)', analizador: 'Cuadrupolo hiperbólico de cuarzo',
    detector: 'Dínodo de alta energía + multiplicador de electrones', vacio: 'Turbomolecular (o difusora) + rotativa', rango: '1,6–1050 u',
    resolucion: 'Unitaria', aplicaciones: 'Medio ambiente, alimentos, toxicología, química forense',
    esquema: ['GC', 'EI', 'Q', 'Det'],
  },
  {
    id: 'shimadzu-lcms8060', area: 'masas', marca: 'Shimadzu', modelo: 'LCMS-8060NX', tipo: 'LC-MS/MS', clase: 'Cuadrupolar',
    resumen: 'Triple cuadrupolo de alta sensibilidad para cromatografía líquida, con sonda ESI IonFocus, guías de iones UF-Qarray y celda de colisión UFsweeper III.',
    entrada: 'Cromatógrafo de líquidos (UHPLC)', fuente: 'ESI con unidad IonFocus (APCI, DUIS opcionales)', analizador: 'Q1 · celda de colisión · Q3',
    detector: 'Dínodo de conversión + multiplicador de electrones secundarios', vacio: '4 etapas: rotatoria + turbo de tres entradas', rango: 'm/z 2–2000',
    resolucion: 'Unitaria (< 0,7 u FWHM) · 30 000 u/s', aplicaciones: 'Bioanálisis, farmacia, residuos de pesticidas, clínica',
    esquema: ['LC', 'ESI', 'Q1', 'q2', 'Q3', 'Det'],
  },
  {
    id: 'bruker-microflex', area: 'masas', marca: 'Bruker', modelo: 'microflex LRF', tipo: 'MALDI-TOF', clase: 'Moderno',
    resumen: 'MALDI-TOF de sobremesa con láser de nitrógeno, extracción pulsada retardada, tubo de vuelo vertical y reflector de dos etapas sin rejillas.',
    entrada: 'Placa MALDI (diana de 96 posiciones)', fuente: 'MALDI · láser N₂ 337 nm, 60 Hz', analizador: 'Tiempo de vuelo lineal y con reflectrón',
    detector: 'Placas de microcanales (lineal y de reflexión)', vacio: 'Turbomolecular 70 L/s + bomba de membrana', rango: 'Péptidos y proteínas; en lineal, hasta ≈ 500 kDa en polímeros',
    resolucion: 'Hasta 15 000 (reflectrón)', aplicaciones: 'Identificación microbiana, proteínas, péptidos, polímeros',
    esquema: ['Láser', 'MALDI', 'TOF', 'Det'],
  },
  {
    id: 'sector-doble-enfoque', area: 'masas', marca: 'Modelo didáctico', modelo: 'Sector de doble enfoque', tipo: 'Sector magnético', clase: 'Tradicional',
    resumen: 'GC-HRMS de geometría Nier–Johnson inversa: fuente EI, rendijas ajustables, sector magnético laminado y sector eléctrico. Modelo genérico basado en equipos comerciales como el Thermo DFS y los JEOL de sector.',
    entrada: 'Cromatógrafo de gases (columna capilar)', fuente: 'EI (CI opcional)', analizador: 'Sector magnético + sector eléctrico (ESA)',
    detector: 'Dínodo de conversión + multiplicador de electrones', vacio: 'Turbomoleculares por etapas + rotativa', rango: 'm/z 2–1200 a 5 kV (hasta 6000 a menor tensión)',
    resolucion: '> 60 000 (10 % valle; > 30 000 estática garantizada) · < 2 ppm', aplicaciones: 'Dioxinas y furanos, PCB, contaminantes persistentes, control antidopaje',
    esquema: ['GC', 'EI', 'Imán', 'ESA', 'Det'],
  },
  {
    id: 'bruker-timstof', area: 'masas', marca: 'Bruker', modelo: 'timsTOF Pro', tipo: 'TIMS-QTOF', clase: 'Moderno',
    resumen: 'Q-TOF con movilidad iónica atrapada (TIMS) de doble sección y adquisición PASEF: separa los iones por movilidad, masa y fragmentos en milisegundos.',
    entrada: 'Nano-LC (nanoElute)', fuente: 'CaptiveSpray nanoESI', analizador: 'TIMS doble + cuadrupolo + TOF ortogonal con reflectrón',
    detector: 'Placas de microcanales + digitalizador de 5 GS/s', vacio: 'TIMS a 2–3 mbar; analizador en alto vacío', rango: 'm/z 20–40 000',
    resolucion: '> 35 000 (TOF) · movilidad K/ΔK ≈ 60', aplicaciones: 'Proteómica 4D, lipidómica, metabolómica',
    esquema: ['LC', 'ESI', 'TIMS', 'Q1', 'q2', 'oTOF'],
  },
  {
    id: 'bruker-scimax', area: 'masas', marca: 'Bruker', modelo: 'scimaX MRMS', tipo: 'FT-ICR', clase: 'Moderno',
    resumen: 'Espectrómetro de resonancia magnética de masas (FT-ICR) con imán superconductor de 7 T refrigerado por conducción, sin criógenos líquidos, y celda ParaCell.',
    entrada: 'Infusión directa, LC o MALDI', fuente: 'ESI y MALDI (fuente dual)', analizador: 'Celda ICR ParaCell en imán de 7 T',
    detector: 'Corriente imagen + transformada de Fourier', vacio: 'Ultra alto vacío en la celda (≈10⁻¹⁰ mbar)', rango: 'Típico m/z 100–10 000',
    resolucion: '> 20 000 000 · exactitud 600 ppb', aplicaciones: 'Petroleómica, metabolómica, materia orgánica natural, imagen MALDI',
    esquema: ['ESI', 'Q', 'q2', 'ICR'],
  },
  {
    id: 'agilent-6546', area: 'masas', marca: 'Agilent', modelo: '6546 LC/Q-TOF', tipo: 'LC-QTOF', clase: 'Moderno',
    resumen: 'Q-TOF con fuente Agilent Jet Stream, slicer, tubo de vuelo de baja dilatación en torre vertical y digitalizador de doble ganancia con cinco órdenes de rango dinámico.',
    entrada: 'Cromatógrafo de líquidos (1290 Infinity II)', fuente: 'Dual AJS ESI (Jet Stream)', analizador: 'Cuadrupolo + hexapolo + TOF con espejo de dos etapas',
    detector: 'MCP + centelleador + fotomultiplicador', vacio: '5 etapas: 2 turbos de flujo dividido + primaria', rango: 'm/z 20–10 000',
    resolucion: '> 30 000 (m/z 118) · > 60 000 (m/z 2722) · < 0,8 ppm', aplicaciones: 'Metabolómica, cribado de contaminantes, alimentos, identificación de desconocidos',
    esquema: ['LC', 'ESI', 'Q1', 'q2', 'oTOF'],
  },
  {
    id: 'shimadzu-lcms9050', area: 'masas', marca: 'Shimadzu', modelo: 'LCMS-9050', tipo: 'LC-QTOF', clase: 'Moderno',
    resumen: 'Q-TOF de pie que une la óptica UF de los triple cuadrupolos con un tubo de vuelo termostatizado y un reflectrón iRefTOF; cambia de polaridad en 600 ms con exactitud de ppm.',
    entrada: 'Cromatógrafo de líquidos (Nexera)', fuente: 'ESI calefactada + sub-interfaz de calibrante', analizador: 'Cuadrupolo + UFsweeper III + TOF con reflectrón iRefTOF',
    detector: 'Placas de microcanales (MCP)', vacio: 'Turbomoleculares + rotatoria (configuración aprox.)', rango: 'm/z 10–40 000',
    resolucion: '45 000 FWHM · < 1 ppm · ±2 ppm en 72 h', aplicaciones: 'Cribado de contaminantes, metabolómica, impurezas farmacéuticas, alimentos',
    esquema: ['LC', 'ESI', 'Q1', 'q2', 'oTOF'],
  },
  {
    id: 'agilent-7900', area: 'masas', marca: 'Agilent', modelo: '7900 ICP-MS', tipo: 'ICP-MS', clase: 'Cuadrupolar',
    resumen: 'Espectrómetro de masas elemental con plasma de argón, lente Omega fuera de eje, celda ORS⁴ en modo helio y detector de once órdenes de rango dinámico.',
    entrada: 'Bomba peristáltica + nebulizador (automuestreador SPS 4)', fuente: 'Plasma de argón a 27 MHz (ShieldTorch)', analizador: 'Celda ORS⁴ (He/KED) + cuadrupolo hiperbólico',
    detector: 'Multiplicador de dínodos discretos (pulsos/analógico)', vacio: '3 etapas: rotatoria + turbo de flujo dividido', rango: '2–260 u',
    resolucion: 'Unitaria (0,3–1,0 u) · 11 órdenes de rango dinámico', aplicaciones: 'Metales en aguas y alimentos, clínica, medio ambiente, nanopartículas',
    esquema: ['Neb', 'ICP', 'Conos', 'ORS', 'Q', 'Det'],
  },
  // ——— Espectroscopía ———
  {
    id: 'shimadzu-uv1900', area: 'espectroscopia', marca: 'Shimadzu', modelo: 'UV-1900i', tipo: 'UV-Vis', clase: 'Óptica',
    resumen: 'Espectrofotómetro UV-Vis de doble haz con monocromador Czerny-Turner y red de difracción LO-RAY-LIGH de baja luz parásita; pantalla táctil en color para trabajar sin PC o control con LabSolutions UV-Vis.',
    entrada: 'Cubetas de 10 mm en el compartimento de muestras (dos portacubetas: muestra y referencia; accesorios opcionales)', fuente: 'Lámpara de deuterio (UV) + lámpara halógena de wolframio (visible e IR cercano), con espejo conmutador', analizador: 'Monocromador Czerny-Turner · doble haz',
    detector: 'Fotodiodos de silicio', vacio: 'Sin requisitos especiales; mesa estable y alimentación eléctrica', rango: '190–1100 nm',
    resolucion: 'Ancho de banda espectral 1 nm · luz parásita ≤ 0,5 % a 198 nm', aplicaciones: 'Cuantificación por Beer-Lambert, cinética, control de calidad farmacéutico, ácidos nucleicos y proteínas',
    esquema: ['Lámp', 'Mono', 'Haces', 'Cubeta', 'Det'],
  },
  {
    id: 'shimadzu-irspirit', area: 'espectroscopia', marca: 'Shimadzu', modelo: 'IRSpirit', tipo: 'FTIR', clase: 'Óptica',
    resumen: 'FTIR compacto con interferómetro de Michelson de incidencia de 30° y alineación dinámica, láser de referencia de semiconductor, compartimento de muestra de tamaño estándar y accesorio de reflexión total atenuada QATR-S con prisma de diamante.',
    entrada: 'Accesorio ATR de una reflexión QATR-S (diamante, 45°); pastillas de KBr, celdas y otros accesorios en el compartimento', fuente: 'Fuente cerámica de alta energía', analizador: 'Interferómetro de Michelson sellado (30°) con alineación dinámica; divisor de KBr recubierto de Ge',
    detector: 'DLATGS termostatizado', vacio: 'Interferómetro sellado con gel de sílice; ventanas de KBr (humedad relativa hasta 70 %)', rango: '7800–350 cm⁻¹ (con ATR de diamante, hasta ≈ 400 cm⁻¹)',
    resolucion: '0,9 cm⁻¹ (también 2, 4, 8 y 16 cm⁻¹)', aplicaciones: 'Identificación de compuestos y polímeros, control de materias primas, grupos funcionales',
    esquema: ['IR', 'Interf', 'ATR', 'Det'],
  },
  {
    id: 'bruker-avance400', area: 'espectroscopia', marca: 'Bruker', modelo: 'AVANCE NEO 400', tipo: 'RMN', clase: 'RMN',
    resumen: 'Espectrómetro de RMN de 400 MHz para ¹H con imán superconductor Ascend de 9,4 T (bore estándar de 54 mm, apantallamiento activo) en criostato de helio y nitrógeno líquidos, consola AVANCE NEO con un transceptor por canal y sonda de 5 mm a temperatura ambiente.',
    entrada: 'Tubo de 5 mm con disolvente deuterado; cambiador SampleCase de 24 posiciones (opcional)', fuente: 'Transceptores por canal y amplificadores lineales de RF (pulsos de radiofrecuencia)', analizador: 'Imán superconductor Ascend 400 (9,4 T, NbTi a 4,2 K, bore 54 mm) + sonda de 5 mm',
    detector: 'Bobina de la sonda, preamplificador HPPR/2 y receptor digital (detección en cuadratura)', vacio: 'Helio y nitrógeno líquidos; aire comprimido seco; zona libre de objetos ferromagnéticos (línea de 5 G)', rango: '¹H 400,1 MHz · ¹³C 100,6 MHz · ²H (lock) 61,4 MHz',
    resolucion: 'Líneas de menos de 1 Hz con buen shim', aplicaciones: 'Elucidación estructural, pureza y cuantificación (qNMR), seguimiento de reacciones',
    esquema: ['Consola', 'Sonda', 'ImánSC', 'FID'],
  },
  // ——— Cromatografía ———
  {
    id: 'agilent-7890b', area: 'cromatografia', marca: 'Agilent', modelo: '7890B GC', tipo: 'GC', clase: 'Separación',
    resumen: 'Cromatógrafo de gases con inyector automático 7693A, inyector split/splitless con control electrónico de la neumática (EPC), horno programable hasta 450 °C y detector de ionización de llama (FID).',
    entrada: 'Inyector automático 7693A (torreta de 16 viales) + inyector split/splitless', fuente: 'Helio como gas portador, con control electrónico de la neumática (EPC)', analizador: 'Columna capilar en horno programable',
    detector: 'Detector de ionización de llama (FID)', vacio: 'He (portador); H₂ y aire (llama); N₂ (gas auxiliar); filtros de purificación', rango: 'Horno: de temperatura ambiente + 4 °C a 450 °C',
    resolucion: 'Respuesta del FID lineal en más de siete órdenes de magnitud', aplicaciones: 'Disolventes residuales, ésteres metílicos de ácidos grasos, hidrocarburos, aromas',
    esquema: ['Iny', 'GC', 'FID'],
  },
  {
    id: 'agilent-1260', area: 'cromatografia', marca: 'Agilent', modelo: '1260 Infinity II', tipo: 'HPLC', clase: 'Separación',
    resumen: 'HPLC modular: bandeja de disolventes, bomba cuaternaria con desgasificador, inyector automático de viales con compartimento de columna integrado y detector de arreglo de diodos.',
    entrada: 'Inyector automático Vialsampler: válvula de 6 puertos y 2 posiciones, 0,1–100 µL, 132 viales de 2 mL', fuente: 'Bomba cuaternaria de dos pistones en serie con mezcla a baja presión (MCGV) y desgasificador; hasta 600 bar', analizador: 'Columna de fase reversa en el compartimento de columna integrado, hasta 80 °C',
    detector: 'Detector de arreglo de diodos DAD WR (supuesto): 1024 fotodiodos, lámparas de deuterio y wolframio', vacio: 'Disolventes filtrados; desgasificador de vacío integrado; recipiente de residuos', rango: 'Caudal 0,001–10 mL/min (600 bar hasta 5 mL/min); DAD 190–950 nm',
    resolucion: 'Gradientes de hasta cuatro disolventes; precisión de composición < 0,2 % RSD', aplicaciones: 'Control de calidad farmacéutico, alimentos, impurezas, compuestos no volátiles',
    esquema: ['Bomba', 'Iny', 'LC', 'DAD'],
  },
];

export const equipo = (id) => EQUIPOS.find((e) => e.id === id);

/** Modos de adquisición ("modos de medir") y equipos del catálogo que los realizan. */
export const MODOS = [
  { id: 'scan', nombre: 'Barrido completo (full scan)', grupo: 'MS', desc: 'Registra todas las m/z de un rango. En un cuadrupolo se barren U y V; en un sector, el campo magnético; en TOF y FT-ICR cada pulso o transitorio contiene ya el espectro completo.',
    uso: 'Identificación de desconocidos y búsqueda en bibliotecas.', equipos: ['agilent-5977', 'shimadzu-lcms8060', 'sector-doble-enfoque', 'bruker-microflex', 'bruker-timstof', 'bruker-scimax', 'agilent-6546', 'shimadzu-lcms9050', 'agilent-7900'] },
  { id: 'sim', nombre: 'Iones seleccionados (SIM / MID / salto de picos)', grupo: 'MS', desc: 'El analizador salta entre unas pocas m/z elegidas y dedica a cada una más tiempo de medida, lo que multiplica la sensibilidad. En el sector magnético se denomina MID y se combina con una masa de bloqueo; en ICP-MS, salto de picos entre isótopos.',
    uso: 'Cuantificación de compuestos o elementos conocidos a nivel de traza (dioxinas, plaguicidas, metales).', equipos: ['agilent-5977', 'shimadzu-lcms8060', 'sector-doble-enfoque', 'agilent-7900'] },
  { id: 'mrm', nombre: 'Monitorización de reacciones múltiples (MRM / SRM)', grupo: 'MS/MS', desc: 'Q1 fija el ion precursor, la celda lo fragmenta y Q3 fija un ion producto. Cada pareja precursor → producto es una transición; el equipo alterna entre cientos por segundo.',
    uso: 'Cuantificación selectiva en matrices complejas (bioanálisis, clínica, residuos).', equipos: ['shimadzu-lcms8060'] },
  { id: 'producto', nombre: 'Barrido de iones producto', grupo: 'MS/MS', desc: 'Se selecciona un precursor y se registra el espectro completo de sus fragmentos. En los Q-TOF el TOF registra los fragmentos con masa exacta.',
    uso: 'Elucidación estructural y confirmación de identidad.', equipos: ['shimadzu-lcms8060', 'bruker-timstof', 'bruker-scimax', 'agilent-6546', 'shimadzu-lcms9050'] },
  { id: 'precursor', nombre: 'Iones precursores y pérdida neutra', grupo: 'MS/MS', desc: 'Barren Q1 mientras Q3 queda fijo en un fragmento característico (precursores) o barre con un desfase constante (pérdida neutra). Detectan familias de compuestos con una subestructura común.',
    uso: 'Cribado de clases de compuestos (fosfopéptidos, conjugados, metabolitos).', equipos: ['shimadzu-lcms8060'] },
  { id: 'dda', nombre: 'MS/MS dependiente de datos (DDA / Auto MS/MS / PASEF)', grupo: 'MS/MS', desc: 'El equipo elige en tiempo real los iones más intensos del espectro y los fragmenta. El PASEF lo acelera sincronizando el cuadrupolo con la elución por movilidad iónica.',
    uso: 'Proteómica y metabolómica no dirigidas.', equipos: ['bruker-timstof', 'agilent-6546', 'shimadzu-lcms9050'] },
  { id: 'dia', nombre: 'MS/MS independiente de datos (DIA / All Ions / diaPASEF)', grupo: 'MS/MS', desc: 'Se fragmentan todos los iones, o ventanas amplias de m/z, sin selección previa, y los fragmentos se asignan después por su coelución.',
    uso: 'Cuantificación de muchos analitos sin método específico para cada uno.', equipos: ['bruker-timstof', 'agilent-6546', 'shimadzu-lcms9050'] },
  { id: 'hr', nombre: 'Masa exacta y alta resolución', grupo: 'Alta resolución', desc: 'La m/z se mide con exactitud de ppm o mejor, lo que permite proponer fórmulas moleculares y separar iones de igual masa nominal (dobletes, estructura isotópica fina).',
    uso: 'Fórmulas moleculares, contaminantes persistentes, petroleómica.', equipos: ['sector-doble-enfoque', 'bruker-timstof', 'bruker-scimax', 'agilent-6546', 'shimadzu-lcms9050'] },
  { id: 'movilidad', nombre: 'Movilidad iónica (CCS)', grupo: 'Separación adicional', desc: 'Separa los iones en fase gaseosa por su tamaño y forma antes del análisis de masas y proporciona su sección eficaz de colisión.',
    uso: 'Separación de isómeros y proteómica en cuatro dimensiones.', equipos: ['bruker-timstof'] },
  { id: 'ked', nombre: 'Celda de colisión/reacción (He-KED, H₂)', grupo: 'Elemental', desc: 'En ICP-MS, una celda con helio frena más a los iones poliatómicos (ArO⁺, ArCl⁺, Ar₂⁺) que a los iones atómicos de la misma masa, y una barrera de energía los rechaza. Con H₂ u otros gases se eliminan interferencias por reacción.',
    uso: 'Metales y metaloides (As, Se, Fe, V, Cr) en matrices con cloruros, calcio o sodio.', equipos: ['agilent-7900'] },
  { id: 'tra', nombre: 'Adquisición resuelta en el tiempo (TRA / sp-ICP-MS)', grupo: 'Elemental', desc: 'El detector registra la señal de un isótopo con integraciones muy cortas (0,1 ms). Cada nanopartícula produce un pulso cuya intensidad da su masa; también se usa con ablación láser o con cromatografía para especiación.',
    uso: 'Nanopartículas, especiación de As o Hg, imagen por ablación láser.', equipos: ['agilent-7900'] },
];