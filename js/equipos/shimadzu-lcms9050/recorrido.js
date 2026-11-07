// Recorrido guiado del Shimadzu LCMS-9050.
export const RECORRIDO = [
  {
    titulo: 'Un Q-TOF de pie',
    texto: 'El LCMS-9050 combina la interfaz y las guías de iones de los triple cuadrupolos de Shimadzu con un analizador de tiempo de vuelo. Se presenta como un mueble de pie esbelto, junto a la torre del cromatógrafo Nexera.',
    modo: 'equipo', e1: 0, xray: false, foco: ['lc', 'panel_frontal', 'unidad_ionizacion', 'chasis'], resaltar: [],
  },
  {
    titulo: 'Sonda principal y sub-interfaz',
    texto: 'La sonda ESI calefactada ioniza el eluyente. A su lado, una sub-interfaz introduce el calibrante de yoduro sódico sin pasar por la línea de muestra, para corregir el eje de masas sin contaminarla.',
    modo: 'analizador', e2: 0.3, xray: false, foco: ['sonda_esi', 'sub_interfaz', 'bloque_calefactor'], dir: [0.5, 0.45, 1], pad: 1.3,
    resaltar: ['sonda_esi', 'sub_interfaz'],
  },
  {
    titulo: 'De la presión atmosférica al vacío',
    texto: 'La línea de desolvatación lleva los iones a la primera etapa de vacío. La guía UF-Qarray y el UF-Lens, heredados de los triple cuadrupolos, los enfocan mientras la presión desciende por etapas.',
    modo: 'analizador', e2: 0.4, xray: false, foco: ['linea_desolvatacion', 'uf_qarray', 'uf_lens'], dir: [0.4, 0.45, 1], pad: 1.3,
    resaltar: ['linea_desolvatacion', 'uf_qarray', 'uf_lens'],
  },
  {
    titulo: 'Q1 y celda de colisión',
    texto: 'En modo MS el cuadrupolo transmite todo el rango; en MS/MS selecciona un precursor, que se fragmenta con argón en la celda UFsweeper III. La función CE Spread aplica varias energías de colisión en un solo espectro.',
    modo: 'analizador', e2: 0.4, xray: true, foco: ['q1', 'celda_colision'], dir: [0.4, 0.45, 1], pad: 1.2,
    resaltar: ['q1', 'celda_colision', 'celda_multipolo'],
  },
  {
    titulo: 'Acumulación y pulso ortogonal',
    texto: 'UFaccumulation retiene los iones en la celda y los libera en paquetes sincronizados con el acelerador. Este los pulsa hacia el tubo de vuelo mediante una rejilla de alta resistencia (UFgrating) que soporta tensiones de varios kilovoltios.',
    modo: 'analizador', e2: 0.4, xray: true, foco: ['uf_accumulation', 'acelerador'], dir: [0.9, 0.3, 0.7], pad: 1.6,
    resaltar: ['uf_accumulation', 'acelerador'],
  },
  {
    titulo: 'Tubo de vuelo termostatizado',
    texto: 'Los iones descienden por el UF-FlightTube. Una variación de temperatura dilataría el tubo decenas de micrómetros y desplazaría la masa medida; su control térmico activo mantiene la exactitud dentro de ±2 ppm durante 72 horas sin recalibrar.',
    modo: 'analizador', e2: 0.2, xray: true, foco: ['tubo_vuelo', 'acelerador', 'ireftof'], dir: [1, 0.25, 0.7], pad: 1.0,
    resaltar: ['tubo_vuelo'],
  },
  {
    titulo: 'Reflectrón iRefTOF',
    texto: 'En el fondo del tubo, el reflectrón iRefTOF invierte la trayectoria. Sus placas apiladas reproducen un campo eléctrico calculado como ideal, que compensa la dispersión de energía sin perder resolución ni transmisión. Los iones vuelven hacia el detector MCP.',
    modo: 'analizador', e2: 0.3, xray: true, foco: ['ireftof', 'detector_mcp', 'tubo_vuelo'], dir: [1, 0.25, 0.7], pad: 1.0,
    resaltar: ['ireftof', 'detector_mcp'],
  },
  {
    titulo: 'Cambio de polaridad en 600 ms',
    texto: 'Al invertir varios kilovoltios, la alta tensión tarda en estabilizarse. Shimadzu corrige esa deriva con un término que depende del tiempo transcurrido desde el cambio (UFstabilization), lo que permite alternar entre iones positivos y negativos en 600 ms con exactitud de pocos ppm.',
    modo: 'analizador', e2: 0, xray: true, foco: ['acelerador', 'tubo_vuelo', 'ireftof'], dir: [1, 0.3, 0.7], pad: 1.0, resaltar: ['acelerador'],
  },
  {
    titulo: 'Simulación: masa exacta',
    texto: 'El panel muestra el espectro de masas exactas, las referencias de yoduro sódico y el error de masa del pico ampliado. Sin la corrección con calibrante aparece una pequeña deriva; con ella el error queda por debajo de 1 ppm.',
    modo: 'analizador', e2: 0, xray: true, sim: true, foco: ['sonda_esi', 'q1', 'tubo_vuelo'], dir: [0.9, 0.3, 0.7], resaltar: [],
  },
  {
    titulo: 'Vacío y control térmico',
    texto: 'Una bomba turbomolecular de tres entradas, una turbo para el TOF y una bomba rotatoria mantienen el vacío. El control de temperatura del tubo de vuelo debe permanecer conectado incluso con el equipo venteado.',
    modo: 'equipo', e1: 1, xray: false, sim: false, foco: ['camara_vacio', 'bombas_turbo', 'bomba_rotatoria', 'control_termico'],
    resaltar: ['camara_vacio', 'bombas_turbo', 'bomba_rotatoria', 'linea_vacio', 'control_termico'],
  },
];
