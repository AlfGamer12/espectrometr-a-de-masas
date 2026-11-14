// Recursos de consulta del Shimadzu IRSpirit con QATR-S. Enlaces abiertos y comprobados durante la elaboración del modelo (nov. 2026).
export const RECURSOS = [
  {
    grupo: 'Documentación oficial del fabricante',
    items: [
      { titulo: 'IRSpirit-X · página del producto', url: 'https://www.ssi.shimadzu.com/products/ftir/ftir-spectroscopy/irspirit-x/index.html',
        tipo: 'Página', idioma: 'EN', fuente: 'Shimadzu', desc: 'Sucesor del IRSpirit: tamaño, alineación dinámica a 5000 veces/s, intervalos espectrales y protección frente a la humedad.' },
      { titulo: 'IRSpirit-X · características', url: 'https://www.shimadzu.com/an/products/molecular-spectroscopy/ftir/ftir-spectroscopy/irspirit-x/features.html',
        tipo: 'Página', idioma: 'EN', fuente: 'Shimadzu', desc: 'Divisor de KBr, fuente cerámica, DLATGS termostatizado, ventanas de KBr y KRS-5, autodiagnóstico.' },
      { titulo: 'IRSpirit-X · accesorios y opciones', url: 'https://www.ssi.shimadzu.com/products/ftir/ftir-spectroscopy/irspirit-x/option.html',
        tipo: 'Página', idioma: 'EN', fuente: 'Shimadzu', desc: 'QATR-S (45°, diamante, Ge o ZnSe), reflexión difusa DRS-8000A, prensa MHP-1 y deshumidificador.' },
      { titulo: 'IRSpirit-X · folletos y especificaciones', url: 'https://www.ssi.shimadzu.com/products/ftir/ftir-spectroscopy/irspirit-x/spec.html',
        tipo: 'Página', idioma: 'EN', fuente: 'Shimadzu', desc: 'Enlaces a los folletos del IRSpirit-X y de los accesorios FTIR.' },
      { titulo: 'Introducción al accesorio QATR-S', url: 'https://www.shimadzu.com/an/apl/10600/index.html',
        tipo: 'Página', idioma: 'EN', fuente: 'Shimadzu', desc: 'ATR de una reflexión con diamante para el compartimento del IRSpirit; dimensiones del equipo.' },
    ],
  },
  {
    grupo: 'Mantenimiento',
    items: [
      { titulo: 'Cambio del gel de sílice del IRSpirit', url: 'https://shimadzu5270.zendesk.com/hc/en-gb/articles/11144449876509--FTIR-Replacement-of-Silica-Gels-IRSpirit',
        tipo: 'Manual', idioma: 'EN', fuente: 'Shimadzu', desc: 'Ventana de mantenimiento trasera, tapa con cuatro tornillos y tres sobres de gel.' },
      { titulo: 'Indicador de humedad del IRSpirit', url: 'https://shimadzu5270.zendesk.com/hc/en-gb/articles/11144339206301',
        tipo: 'Manual', idioma: 'EN', fuente: 'Shimadzu', desc: 'Piloto HUMIDITY y papel indicador del gel de sílice.' },
      { titulo: 'Inspección periódica del IRSpirit', url: 'https://shimadzu5270.zendesk.com/hc/en-gb/articles/11144219341213',
        tipo: 'Manual', idioma: 'EN', fuente: 'Shimadzu', desc: 'Comprobaciones semanales y cambio del gel de sílice.' },
      { titulo: 'IRSpirit sin uso durante mucho tiempo', url: 'https://shimadzu5270.zendesk.com/hc/en-gb/articles/11144268553757--FTIR-When-not-using-instruments-for-a-long-term-Over-a-Month-If-a-Power-Outage-Occurs-IRSpirit',
        tipo: 'Manual', idioma: 'EN', fuente: 'Shimadzu', desc: 'Ventanas de KBr, deshumidificador y cortes de corriente.' },
    ],
  },
  {
    grupo: 'Fundamentos',
    items: [
      { titulo: 'Fundamentos de la espectroscopía FTIR', url: 'https://www.shimadzu.com/an/ftir/support/ftirtalk/index.html',
        tipo: 'Página', idioma: 'EN', fuente: 'Shimadzu', desc: 'Fuente, interferómetro, detector y transformada de Fourier.' },
      { titulo: 'Transformada de Fourier y apodización', url: 'https://www.shimadzu.com/an/service-support/technical-support/ftir/tips_and_tricks/apodization.html',
        tipo: 'Página', idioma: 'EN', fuente: 'Shimadzu', desc: 'Funciones rectangular, triangular y Happ-Genzel: lóbulos frente a resolución.' },
      { titulo: 'IRSpirit en LabWrench', url: 'https://www.labwrench.com/equipment/32649/shimadzu-irspirit-fourier-transform-infrared-ftir-spectrophotometer',
        tipo: 'Página', idioma: 'EN', fuente: 'LabWrench', desc: 'Ficha del equipo con sus características principales.' },
    ],
  },
];
