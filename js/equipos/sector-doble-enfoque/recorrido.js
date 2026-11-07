// Recorrido guiado del espectrómetro de doble enfoque.
export const RECORRIDO = [
  {
    titulo: 'Un analizador tradicional: el sector magnético',
    texto: 'Los primeros espectrómetros de masas (Thomson, Aston, Dempster) separaban los iones con campos magnéticos. Su evolución, el sector de doble enfoque, sigue siendo hoy el método de referencia para dioxinas y otros contaminantes persistentes por su alta resolución y sensibilidad.',
    modo: 'equipo', e1: 0, xray: false, foco: ['gc', 'panel_frontal', 'tapa_analizador', 'chasis'], resaltar: [],
  },
  {
    titulo: 'Consola y analizador',
    texto: 'El analizador descansa sobre una plataforma antivibratoria en la parte superior de la consola. Las bombas, las fuentes de alimentación y la electrónica ocupan el mueble inferior. El conjunto pesa del orden de 900 kg.',
    modo: 'equipo', e1: 1, xray: false, foco: ['analizador', 'chasis', 'bombas_turbo'], resaltar: ['analizador'],
  },
  {
    titulo: 'Fuente de iones y aceleración',
    texto: 'Las moléculas que salen del cromatógrafo se ionizan por impacto electrónico. Toda la fuente está a 5 kV respecto a tierra, de modo que los iones salen con una energía cinética zeV ≈ 5 keV. La entrada de referencia introduce PFK, que proporciona iones de masa exacta conocida.',
    modo: 'analizador', e2: 0.4, xray: false, foco: ['fuente_ei', 'lentes_enfoque', 'rendija_entrada'], dir: [0.5, 0.7, 0.8], pad: 1.4,
    resaltar: ['fuente_ei', 'lentes_enfoque'],
  },
  {
    titulo: 'Rendija de entrada',
    texto: 'La rendija de entrada, de tántalo y anchura variable, define el objeto de la óptica. Junto con la rendija de salida fija la resolución: más estrechas, más resolución y menos transmisión.',
    modo: 'analizador', e2: 0.4, xray: false, foco: ['rendija_entrada', 'lentes_enfoque'], dir: [0.4, 0.8, 0.7], pad: 1.8,
    resaltar: ['rendija_entrada'],
  },
  {
    titulo: 'Sector magnético',
    texto: 'En el imán, los iones describen arcos de radio r = mv/(zeB). Para un campo y una tensión dados solo una m/z sigue la trayectoria central: m/z = B²r²e/2V. Con r = 350 mm y 5 kV, un ion de m/z 322 necesita unos 0,52 T. La culata laminada permite barrer el campo con rapidez.',
    modo: 'analizador', e2: 0.3, xray: true, foco: ['iman', 'tubo_vuelo'], dir: [0.3, 1, 0.5], pad: 1.0,
    resaltar: ['iman'],
  },
  {
    titulo: 'Sector eléctrico',
    texto: 'El analizador electrostático selecciona por energía cinética: r_e = 2V/E, con independencia de la masa. Compensa la dispersión en energía del imán, de modo que los iones de igual m/z convergen en la rendija de salida aunque partan con energías y ángulos ligeramente distintos: es el doble enfoque.',
    modo: 'analizador', e2: 0.3, xray: true, foco: ['esa', 'rendija_intermedia', 'rendija_salida'], dir: [0.3, 1, 0.5], pad: 1.2,
    resaltar: ['esa', 'carcasa_esa', 'carcasa_esa_inf'],
  },
  {
    titulo: 'Detector',
    texto: 'Tras la rendija de salida, los iones se aceleran hacia un dínodo de conversión a alta tensión y las partículas secundarias se amplifican en un multiplicador de electrones situado fuera del eje.',
    modo: 'analizador', e2: 0.5, xray: true, foco: ['dinodo_conversion', 'multiplicador', 'rendija_salida'], dir: [0.4, 0.9, 0.6], pad: 1.8,
    resaltar: ['dinodo_conversion', 'multiplicador'],
  },
  {
    titulo: 'Resolución: el criterio del 10 % de valle',
    texto: 'R = m/Δm. A m/z 28, el CO (27,9949), el N₂ (28,0061) y el C₂H₄ (28,0313) tienen la misma masa nominal. Con rendijas anchas (R ≈ 1000) aparecen como un único pico; con R ≈ 10 000 se separan. La norma EPA 1613 exige R ≥ 10 000 para dioxinas.',
    modo: 'analizador', e2: 0, xray: true, sim: true, foco: ['fuente_ei', 'iman', 'esa', 'multiplicador'], dir: [0.3, 1, 0.5], resaltar: [],
  },
  {
    titulo: 'Detección de iones seleccionados (MID)',
    texto: 'En el análisis de dioxinas el equipo salta entre unas pocas masas exactas (por ejemplo, 319,8965 y 321,8936 para la 2,3,7,8-TCDD y sus análogos marcados con ¹³C) y mide en cada ciclo un ion del PFK como masa de bloqueo. Así alcanza sensibilidades de femtogramos.',
    modo: 'analizador', e2: 0, xray: true, sim: true, foco: ['fuente_ei', 'iman', 'esa', 'multiplicador'], dir: [0.3, 1, 0.5], resaltar: [],
  },
  {
    titulo: 'Vacío y servicios',
    texto: 'Tres bombas turbomoleculares, respaldadas por bombas rotatorias, mantienen el vacío de la fuente, el analizador y el detector. El imán y la electrónica de potencia se refrigeran con agua mediante un enfriador externo.',
    modo: 'equipo', e1: 1, xray: false, sim: false, foco: ['bombas_turbo', 'bombas_rotatorias', 'fuente_iman', 'enfriador'],
    resaltar: ['bombas_turbo', 'bombas_rotatorias', 'lineas_vacio', 'fuente_iman', 'enfriador'],
  },
];
