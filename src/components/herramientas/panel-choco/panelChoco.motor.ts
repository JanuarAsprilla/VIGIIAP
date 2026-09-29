/* eslint-disable */
// @ts-nocheck
// Motor del Panel de Análisis Territorial — Chocó Biogeográfico.
// Portado de dashboard_choco_biogeografico.html conservando su lógica, datos y estructura.
// Cambios respecto al original (por seguridad/aislamiento; ninguno funcional):
//  - Corre dentro de iniciarPanelChoco(): nada queda global (window.* -> W, document acotado a root).
//  - Sin handlers inline (CSP script-src 'self'): data-on-click/change + despachador con lista blanca.
//  - Excel leído con exceljs (SheetJS 0.18 en npm tiene CVEs); solo .xlsx.
//  - Carga de datos solo para roles con permiso (puedeEditar).
import { Chart as ChartBase, registerables } from 'chart.js'
import { leerFilasExcel } from './leerFilasExcel'

ChartBase.register(...registerables)

export function iniciarPanelChoco(root, { puedeEditar }) {
  const W = {}
  const instanciasChart = new Set()
  class Chart extends ChartBase {
    constructor(...args) { super(...args); instanciasChart.add(this) }
  }
  const document = {
    getElementById: (id) => root.querySelector('#' + CSS.escape(id)),
    querySelector: (s) => root.querySelector(s),
    querySelectorAll: (s) => root.querySelectorAll(s),
    createElement: (t) => globalThis.document.createElement(t),
    addEventListener: (t, f, o) => root.addEventListener(t, f, o),
    body: root,
  }
  // ── Script original ──
  
  const PAL_MANGLARES=["#388E3C","#43A047","#00897B","#00838F","#558B2F"];
  
  const PAL=["#ABCD66","#A8A800","#CDCD66","#4C7300","#F5CC28","#898944","#70A800"];
  const C_CC="#E8A020",C_RI="#9B6B9E",C_ST="#A8A8A8";
  const DEPTO_MAP={"Narño":"Nariño","Valle del cauca":"Valle del Cauca","Chocó":"Chocó","Antioquia":"Antioquia","Cauca":"Cauca","Córdoba":"Córdoba","Risaralda":"Risaralda","Nariño":"Nariño"};
  const DEPTO_IDS={"Chocó":"choco","Nariño":"narino","Antioquia":"antioquia","Cauca":"cauca","Valle del Cauca":"valle","Córdoba":"cordoba","Risaralda":"risaralda"};
  
  // ── SIDEBAR NAVIGATION ───────────────────────────────────────────────
  const NOTAS = {
    limites: `<div style="background:#E1F5EE;border:0.5px solid rgba(8,80,65,0.2);border-radius:var(--radius);padding:0.85rem 1.5rem;margin-bottom:0.75rem"><div style="font-size:11px;font-weight:600;color:#085041;margin-bottom:6px;text-transform:uppercase;letter-spacing:0.06em">Sobre este panel</div><p style="font-size:13px;color:#085041;line-height:1.7;margin:0 0 6px">Este panel presenta la distribución territorial del Chocó Biogeográfico, conformado por <strong>7 departamentos</strong> y <strong>93 municipios</strong>.</p><p style="font-size:13px;color:#085041;line-height:1.7;margin:0 0 6px">Se puede consultar el área de cada unidad administrativa, el número de municipios por departamento y su participación porcentual respecto al total del territorio.</p><p style="font-size:13px;color:#085041;line-height:1.6;margin:0"><strong>Nota:</strong> Utilice los filtros para consultar la información al mayor nivel de detalle disponible. Puede seleccionar un departamento y, posteriormente, un municipio. Los indicadores y las visualizaciones se actualizarán automáticamente de acuerdo con la selección realizada.</p></div>`,
    titulacion: `<div style="background:#E1F5EE;border:0.5px solid rgba(8,80,65,0.2);border-radius:var(--radius);padding:0.85rem 1.5rem;margin-bottom:0.75rem"><div style="font-size:11px;font-weight:600;color:#085041;margin-bottom:6px;text-transform:uppercase;letter-spacing:0.06em">Sobre este panel</div><p style="font-size:13px;color:#085041;line-height:1.7;margin:0 0 6px">Este panel presenta el estado de la titulación colectiva en el Chocó Biogeográfico, discriminando entre <strong>Consejos Comunitarios</strong> y <strong>Resguardos Indígenas</strong>, así como el área que aún no cuenta con ninguna figura de titulación colectiva.</p><p style="font-size:13px;color:#085041;line-height:1.7;margin:0 0 6px">Se puede consultar la distribución territorial por departamento y municipio, el número de títulos colectivos activos y las hectáreas asociadas a cada figura.</p><p style="font-size:13px;color:#085041;line-height:1.6;margin:0"><strong>Nota:</strong> Utilice los filtros para consultar la información al mayor nivel de detalle disponible. Puede seleccionar un departamento y, posteriormente, un municipio. Los indicadores y las visualizaciones se actualizarán automáticamente de acuerdo con la selección realizada.</p></div>`,
    cuencas: `<div style="background:#E1F5EE;border:0.5px solid rgba(8,80,65,0.2);border-radius:var(--radius);padding:0.85rem 1.5rem;margin-bottom:0.75rem"><div style="font-size:11px;font-weight:600;color:#085041;margin-bottom:6px;text-transform:uppercase;letter-spacing:0.06em">Sobre este panel</div><p style="font-size:13px;color:#085041;line-height:1.7;margin:0 0 6px">Este panel presenta las cuencas hidrográficas del Chocó Biogeográfico, una de las regiones con mayor riqueza hídrica del planeta.</p><p style="font-size:13px;color:#085041;line-height:1.7;margin:0 0 6px">Se puede consultar la distribución de cuencas y subcuencas por departamento y municipio, su área en hectáreas y su participación porcentual respecto al total del territorio.</p><p style="font-size:13px;color:#085041;line-height:1.6;margin:0"><strong>Nota:</strong> Utilice los filtros para consultar la información al mayor nivel de detalle disponible. Puede seleccionar una cuenca hidrográfica y, posteriormente, una subcuenca. Los indicadores y las visualizaciones se actualizarán automáticamente de acuerdo con la selección realizada.</p></div>`,
    humedales: `<div style="background:#E1F5EE;border:0.5px solid rgba(8,80,65,0.2);border-radius:var(--radius);padding:0.85rem 1.5rem;margin-bottom:0.75rem"><div style="font-size:11px;font-weight:600;color:#085041;margin-bottom:6px;text-transform:uppercase;letter-spacing:0.06em">Sobre este panel</div><p style="font-size:13px;color:#085041;line-height:1.7;margin:0 0 6px">Este panel presenta los humedales del Chocó Biogeográfico, cuerpos de agua de gran importancia ecológica para la regulación hídrica y la biodiversidad.</p><p style="font-size:13px;color:#085041;line-height:1.7;margin:0 0 6px">Se puede consultar su distribución por departamento, su extensión en hectáreas y su proporción frente al área total del territorio.</p><p style="font-size:13px;color:#085041;line-height:1.6;margin:0"><strong>Nota:</strong> Utilice los filtros para consultar la información al mayor nivel de detalle disponible. Puede seleccionar un departamento y, posteriormente, un municipio. Los indicadores y las visualizaciones se actualizarán automáticamente de acuerdo con la selección realizada.</p></div>`,
    runap: `<div style="background:#E1F5EE;border:0.5px solid rgba(8,80,65,0.2);border-radius:var(--radius);padding:0.85rem 1.5rem;margin-bottom:0.75rem"><div style="font-size:11px;font-weight:600;color:#085041;margin-bottom:6px;text-transform:uppercase;letter-spacing:0.06em">Sobre este panel</div><p style="font-size:13px;color:#085041;line-height:1.7;margin:0 0 6px">Este panel presenta las áreas protegidas registradas en el Registro Único Nacional de Áreas Protegidas (RUNAP) y ubicadas en el territorio del Chocó Biogeográfico.</p><p style="font-size:13px;color:#085041;line-height:1.7;margin:0 0 6px">Se puede consultar las diferentes categorías de manejo, su distribución por departamento y las hectáreas bajo protección formal.</p><p style="font-size:13px;color:#085041;line-height:1.6;margin:0"><strong>Nota:</strong> Utilice los filtros para consultar la información al mayor nivel de detalle disponible. Puede seleccionar un departamento y, posteriormente, un municipio. Los indicadores y las visualizaciones se actualizarán automáticamente de acuerdo con la selección realizada.</p></div>`,
    manglares: `<div style="background:#E1F5EE;border:0.5px solid rgba(8,80,65,0.2);border-radius:var(--radius);padding:0.85rem 1.5rem;margin-bottom:0.75rem"><div style="font-size:11px;font-weight:600;color:#085041;margin-bottom:6px;text-transform:uppercase;letter-spacing:0.06em">Sobre este panel</div><p style="font-size:13px;color:#085041;line-height:1.7;margin:0 0 6px">Este panel presenta la distribución de manglares en el Chocó Biogeográfico, ecosistemas costeros de gran valor ecológico y social.</p><p style="font-size:13px;color:#085041;line-height:1.7;margin:0 0 6px">Se puede consultar su extensión por departamento, su área en hectáreas y su participación porcentual respecto al total del territorio.</p><p style="font-size:13px;color:#085041;line-height:1.6;margin:0"><strong>Nota:</strong> Utilice los filtros para consultar la información al mayor nivel de detalle disponible. Puede seleccionar un departamento y, posteriormente, un municipio. Los indicadores y las visualizaciones se actualizarán automáticamente de acuerdo con la selección realizada.</p></div>`,
    paramos: `<div style="background:#E1F5EE;border:0.5px solid rgba(8,80,65,0.2);border-radius:var(--radius);padding:0.85rem 1.5rem;margin-bottom:0.75rem"><div style="font-size:11px;font-weight:600;color:#085041;margin-bottom:6px;text-transform:uppercase;letter-spacing:0.06em">Sobre este panel</div><p style="font-size:13px;color:#085041;line-height:1.7;margin:0 0 6px">Este panel presenta los ecosistemas de páramo del Chocó Biogeográfico, territorios de altura donde nace el agua que alimenta ríos, quebradas y la vida de las comunidades que habitan el territorio.</p><p style="font-size:13px;color:#085041;line-height:1.7;margin:0 0 6px">Se puede consultar la distribución de los páramos por departamento y municipio, su área en hectáreas y su participación porcentual respecto al total del territorio.</p><p style="font-size:13px;color:#085041;line-height:1.6;margin:0"><strong>Nota:</strong> Utilice los filtros para consultar la información al mayor nivel de detalle disponible. Puede seleccionar un departamento y, posteriormente, un municipio. Los indicadores y las visualizaciones se actualizarán automáticamente de acuerdo con la selección realizada.</p></div>`,
    cienagas: `<div style="background:#E1F5EE;border:0.5px solid rgba(8,80,65,0.2);border-radius:var(--radius);padding:0.85rem 1.5rem;margin-bottom:0.75rem"><div style="font-size:11px;font-weight:600;color:#085041;margin-bottom:6px;text-transform:uppercase;letter-spacing:0.06em">Sobre este panel</div><p style="font-size:13px;color:#085041;line-height:1.7;margin:0 0 6px">Este panel presenta la distribución de las ciénagas del Chocó Biogeográfico, comprendida por <strong>2 departamentos</strong> y <strong>15 municipios</strong>.</p><p style="font-size:13px;color:#085041;line-height:1.7;margin:0 0 6px">Se puede consultar el nombre de cada ciénaga, su área en hectáreas y su participación porcentual respecto al total del territorio.</p><p style="font-size:13px;color:#085041;line-height:1.6;margin:0"><strong>Nota:</strong> Utilice los filtros para consultar la información al mayor nivel de detalle disponible. Puede seleccionar un departamento y, posteriormente, un municipio. Los indicadores y las visualizaciones se actualizarán automáticamente de acuerdo con la selección realizada.</p></div>`,
    poblacion: `<div style="background:#E1F5EE;border:0.5px solid rgba(8,80,65,0.2);border-radius:var(--radius);padding:0.85rem 1.5rem;margin-bottom:0.75rem"><div style="font-size:11px;font-weight:600;color:#085041;margin-bottom:6px;text-transform:uppercase;letter-spacing:0.06em">Sobre este panel</div><p style="font-size:13px;color:#085041;line-height:1.7;margin:0 0 6px">Este panel presenta la distribución de la población del Chocó Biogeográfico según el Censo DANE 2018, con datos de género, estructura por edad, grupos étnicos y densidad poblacional.</p><p style="font-size:13px;color:#085041;line-height:1.7;margin:0 0 6px">Se puede consultar la distribución por departamento y municipio, la composición por género, la pirámide poblacional y la presencia de grupos étnicos en el territorio.</p><p style="font-size:13px;color:#085041;line-height:1.6;margin:0"><strong>Nota:</strong> Utilice los filtros para consultar la información al mayor nivel de detalle disponible. Puede seleccionar un departamento y, posteriormente, un municipio. Los indicadores y las visualizaciones se actualizarán automáticamente de acuerdo con la selección realizada.</p></div>`
  };
  
  function setSideCapa(capa) {
    document.getElementById('sel-capa').value = capa;
    document.querySelectorAll('.sidebar-nav .side-item').forEach(b => b.classList.remove('active'));
    const btn = document.getElementById('side-' + capa);
    if(btn) btn.classList.add('active');
    document.getElementById('nota-panel-wrap').innerHTML = NOTAS[capa] || '';
    onCapaChange();
  }
  
  
  const DEFAULT_LIMITES_DEPTOS=[{"id":"choco","name":"Chocó","municipios":31,"area":4842810.1,"pct":42.9},{"id":"narino","name":"Nariño","municipios":22,"area":2143917.9,"pct":19.0},{"id":"antioquia","name":"Antioquia","municipios":16,"area":1740469.4,"pct":15.4},{"id":"cauca","name":"Cauca","municipios":5,"area":1038078.9,"pct":9.2},{"id":"valle","name":"Valle del Cauca","municipios":15,"area":999752.4,"pct":8.8},{"id":"cordoba","name":"Córdoba","municipios":2,"area":424242.1,"pct":3.8},{"id":"risaralda","name":"Risaralda","municipios":2,"area":108846.2,"pct":1.0}];
  const DEFAULT_LIMITES_MUNIS={"choco":[{"name":"Riosucio","area":589609.6},{"name":"El Litoral Del San Juán","area":413615.3},{"name":"Bojayá","area":363317.8},{"name":"Quibdó","area":350865.6},{"name":"Bajo Baudó","area":348219.8},{"name":"Carmen Del Darién","area":318268.7},{"name":"Alto Baudó","area":205187.8},{"name":"Istmina","area":188108.2},{"name":"Medio Atrato","area":181374.9},{"name":"Belén de bajirá","area":171936.1},{"name":"San José Del Palmar","area":158252.4},{"name":"Sipí","area":157745.3},{"name":"Medio Baudó","area":137294.3},{"name":"Juradó","area":129805.4},{"name":"Unguía","area":119123.1},{"name":"Nóvita","area":94567.6},{"name":"Bahía Solano","area":89606.6},{"name":"Lloró","area":84312.3},{"name":"El Carmen","area":83029.4},{"name":"Bagadó","area":80756.9},{"name":"Acandí","area":79852.8},{"name":"Tadó","area":71499.6},{"name":"Nuquí","area":70458.3},{"name":"Rio Quito","area":69936.3},{"name":"Medio San Juan","area":66377.4},{"name":"Condoto","area":46788.6},{"name":"Cértegui","area":42351.4},{"name":"Atrato (Yuto)","area":42173.9},{"name":"El Cantón Del San Pablo","area":38069.3},{"name":"Rio Iró","area":32521.6},{"name":"Unión Panamericana","area":17783.8}],"narino":[{"name":"Tumaco","area":361036.6},{"name":"Barbacoas","area":273590.4},{"name":"El Charco","area":249369.8},{"name":"Magüí","area":181061.1},{"name":"Roberto Payán","area":146003.8},{"name":"Santa Bárbara","area":122612.6},{"name":"Ricaurte","area":105643.7},{"name":"Olaya Herrera","area":100466.7},{"name":"Los Andes","area":83301.3},{"name":"Mosquera","area":76930.8},{"name":"Cumbal","area":66464.4},{"name":"Mallama","area":56981.4},{"name":"Francisco Pizarro","area":52608.3},{"name":"Samaniego","area":44291.6},{"name":"Santa Cruz","area":43458.3},{"name":"La Tola","area":41653.2},{"name":"El Rosario","area":36674.4},{"name":"Cumbitara","area":35555.1},{"name":"Policarpa","area":34445.2},{"name":"La Llanada","area":20504.7},{"name":"Leiva","area":10078.8},{"name":"Sapuyes","area":1185.7}],"antioquia":[{"name":"Turbo","area":288633.8},{"name":"Urrao","area":256385.0},{"name":"Dabeiba","area":195766.9},{"name":"Vigía Del Fuerte","area":166273.0},{"name":"Frontino","area":138445.6},{"name":"Murindó","area":126684.0},{"name":"Mutatá","area":107526.6},{"name":"Necoclí","area":105912.8},{"name":"Ituango","area":82328.8},{"name":"Chigorodó","area":72198.2},{"name":"Apartadó","area":53536.5},{"name":"Carepa","area":38743.5},{"name":"Cañasgordas","area":36483.9},{"name":"Abriaquí","area":29697.4},{"name":"Uramita","area":26593.7},{"name":"San Pedro De Urabá","area":15259.8}],"cauca":[{"name":"López","area":337042.7},{"name":"Guapi","area":257088.7},{"name":"Timbiquí","area":205978.5},{"name":"El Tambo","area":160323.4},{"name":"Argelia","area":77645.5}],"valle":[{"name":"Buenaventura","area":629593.5},{"name":"Dagua","area":91707.3},{"name":"Calima","area":79384.6},{"name":"Bolívar","area":61407.9},{"name":"La Cumbre","area":25555.0},{"name":"El Dovio","area":23602.9},{"name":"El Cairo","area":21423.7},{"name":"Versalles","area":20063.8},{"name":"Restrepo","area":13724.3},{"name":"Argelia","area":9080.6},{"name":"Roldanillo","area":8110.8},{"name":"Vijes","area":6645.9},{"name":"Trujillo","area":4817.0},{"name":"Yotoco","area":3792.4},{"name":"La Unión","area":842.6}],"cordoba":[{"name":"Tierralta","area":390190.4},{"name":"Valencia","area":34051.7}],"risaralda":[{"name":"Pueblo Rico","area":61380.3},{"name":"Mistrató","area":47465.9}]};
  const TOTAL_CC_GLOBAL=183;
  const TOTAL_RI_GLOBAL=243; // 243 resguardos únicos según archivo oficial
  const DEFAULT_TIT_DEPTOS=[{"id": "choco", "name": "Chocó", "municipios": 31, "area": 4370447.1, "pct": 55.0, "cc": 3064147.8, "ri": 1306299.3, "st": 472363.0, "num_cc": 67, "num_ri": 134}, {"id": "narino", "name": "Nariño", "municipios": 22, "area": 1558842, "pct": 19.6, "cc": 1201977, "ri": 356865, "st": 585075.9, "num_cc": 53, "num_ri": 53}, {"id": "antioquia", "name": "Antioquia", "municipios": 16, "area": 578780.4, "pct": 7.3, "cc": 242848.1, "ri": 335932.3, "st": 1161689.0, "num_cc": 12, "num_ri": 38}, {"id": "cauca", "name": "Cauca", "municipios": 5, "area": 821134.2, "pct": 10.3, "cc": 745250.7, "ri": 75883.5, "st": 216944.7, "num_cc": 23, "num_ri": 10}, {"id": "valle", "name": "Valle del Cauca", "municipios": 15, "area": 469551.4, "pct": 5.9, "cc": 443188.4, "ri": 26363, "st": 530201, "num_cc": 45, "num_ri": 22}, {"id": "cordoba", "name": "Córdoba", "municipios": 2, "area": 113712.4, "pct": 1.4, "cc": 0, "ri": 113712.4, "st": 310529.7, "num_cc": 0, "num_ri": 4}, {"id": "risaralda", "name": "Risaralda", "municipios": 2, "area": 40222.6, "pct": 0.5, "cc": 11199.8, "ri": 29022.8, "st": 68623.6, "num_cc": 3, "num_ri": 5}];
  const DEFAULT_TIT_MUNIS={"choco": [{"name": "Riosucio", "area": 530266.7, "cc": 318771.3, "ri": 211495.4, "st": 59342.9, "num_cc": 16, "num_ri": 13, "cc_nombres": [{"nombre": "Consejo Comunitario Bocas De Taparal", "area": 3586.6}, {"nombre": "Consejo Comunitario De Clavellino", "area": 4679.2}, {"nombre": "Consejo Comunitario De Dos Bocas", "area": 5448.7}, {"nombre": "Consejo Comunitario De La Nueva", "area": 15685.6}, {"nombre": "Consejo Comunitario de la Cuenta del Río Cacarica", "area": 104642.5}, {"nombre": "Consejo Comunitario de La Cuenca Del Río Quiparadó", "area": 27633.4}, {"nombre": "Consejo Comunitario de La Cuenca Del Río Salaquí", "area": 58925.3}, {"nombre": "Consejo Comunitario de Los Ríos La Larga Y Tumaradó", "area": 10286.4}, {"nombre": "Consejo Comunitario Pedeguita Y Mancilla", "area": 33608.8}, {"nombre": "Consejo Comunitario del Río Domingodó", "area": 12998.1}, {"nombre": "Consejo Comunitario del Río Jiguamiandó", "area": 0.0}, {"nombre": "Consejo Comunitario de Truando Medio", "area": 35488.7}, {"nombre": "Consejo Comunitario de Cupica", "area": 5336.1}, {"nombre": "Consejo Comunitario General De La Costa Pacífica Del Norte - Los Delfines", "area": 315.1}, {"nombre": "Consejo Comunitario Mayor Del Municipio De Juradó", "area": 135.6}, {"nombre": "Consejo Comunitario Mayor Del Bajo Atrato", "area": 1.0}], "ri_nombres": [{"nombre": "Resguardo Indígena Embera - Katio de Chontadural - Cañero", "area": 3742.2}, {"nombre": "Resguardo Indígena Embera de los Rios Pavarando y Amparrado Medio", "area": 14.8}, {"nombre": "Resguardo Indígena Embera de Jagual Rio Chintado", "area": 18061.3}, {"nombre": "Resguardo Indígena Embera de La Raya", "area": 5037.8}, {"nombre": "Resguardo Indígena Embera y Waunan de \"Nussí Purrú\"", "area": 231.5}, {"nombre": "Resguardo Indígena Embera de Peña Blanca - Rio Truando", "area": 57974.1}, {"nombre": "Resguardo Indígena Embera de Peranchito", "area": 1622.6}, {"nombre": "Resguardo Indígena Embera de Perancho", "area": 899.6}, {"nombre": "Resguardo Indígena Embera del Rio Domingodo", "area": 20.3}, {"nombre": "Resguardo Indígena Embera-Katio y Waunana del Rio Quiparado", "area": 9698.5}, {"nombre": "Resguardo Indígena Embera - Katio de los Ríos Salaqui-Pavarando", "area": 105449.7}, {"nombre": "Resguardo Indígena Embera de Urada Jiguamiando", "area": 3616.9}, {"nombre": "Resguardo Indígena Emebera Yarumal y El Barranco", "area": 5125.9}]}, {"name": "El Litoral Del San Juán", "area": 405150.9, "cc": 314170.8, "ri": 90980.1, "st": 8464.4, "num_cc": 3, "num_ri": 15, "cc_nombres": [{"nombre": "Consejo Comunitario del Medio, Bajo y Zona Costera del Juan \"ACADESAN\"", "area": 307800.3}, {"nombre": "Consejo Comunitario de La Costa - Concosta", "area": 4398.7}, {"nombre": "Consejo Comunitario de la Cuenca Baja Del Rio Calima", "area": 1971.8}], "ri_nombres": [{"nombre": "Resguardo Indígena Waunana de Buenavista", "area": 2459.9}, {"nombre": "Resguardo Indígena Waunana de Cabeceras o Puerto Pizario", "area": 3273.3}, {"nombre": "Resguardo Indígena Waunana Chagpien -  Rio Tordo", "area": 22921.6}, {"nombre": "Resguardo Indígena Waunana del Rio Docordo y  Caseria de la Unión-Balsalito", "area": 4258.3}, {"nombre": "Resguardo Indígena Waunana de Nuevo Pitalito", "area": 999.0}, {"nombre": "Resguardo Indígena Waunana del Rio Orpua", "area": 7528.7}, {"nombre": "Resguardo Indígena Waunana del Rio Pichima", "area": 9165.1}, {"nombre": "Resguardo Indígena Waunana del Rio Taparal", "area": 14191.7}, {"nombre": "Resguardo Indígena Embera Katio de Sanandocito", "area": 35.0}, {"nombre": "Resguardo Indígena Waunana de Santa Maria De Pangala", "area": 9511.5}, {"nombre": "Resguardo Indígena Waunana - Paraje de Tiosilidio", "area": 4520.1}, {"nombre": "Resguardo Indígena Waunana - Paraje de San Antonio de Togorama", "area": 8600.2}, {"nombre": "Resguardo Indígena Waunana de Papayo", "area": 767.9}, {"nombre": "Resguardo Indígena Waunana  de Burujon o La Unión-San Bernardo", "area": 2068.4}, {"nombre": "Resguardo Indígena Waunana de Chachajo", "area": 679.5}]}, {"name": "Bojayá", "area": 359138.0, "cc": 145805.6, "ri": 213332.4, "st": 4179.8, "num_cc": 5, "num_ri": 14, "cc_nombres": [{"nombre": "Consejo Comunitario De Chicao", "area": 1479.3}, {"nombre": "Consejo Comunitario Mayor Del Medio Atrato - Acia", "area": 143253.1}, {"nombre": "Consejo Comunitario del Río Montaño", "area": 731.0}, {"nombre": "Consejo Comunitario de Cupica", "area": 241.9}, {"nombre": "Consejo Comunitario General De La Costa Pacífica Del Norte - Los Delfines", "area": 100.4}], "ri_nombres": [{"nombre": "Resguardo Indígena Embera de Alto Rio Bojaya", "area": 49638.2}, {"nombre": "Resguardo Indígena Embera de Alto Rio Buey", "area": 0.3}, {"nombre": "Resguardo Indígena Embera de Alto Rio Cuia", "area": 23210.4}, {"nombre": "Resguardo Indígena Embera del Alto Rio Tagachi", "area": 180.8}, {"nombre": "Resguardo Indígena Embera Buchado Amparrado", "area": 8458.2}, {"nombre": "Resguardo Indígena Embera Gegenado", "area": 2391.9}, {"nombre": "Resguardo Indígena Embera de Puerto Antioquia", "area": 286.7}, {"nombre": "Resguardo Indígena Embera del Rio Napipi", "area": 21997.5}, {"nombre": "Resguardo Indígena Embera de Opogado Doguado", "area": 27889.9}, {"nombre": "Resguardo Indígena Embera  de Pichicora, Chicue y Punto Alegre", "area": 22681.8}, {"nombre": "Resguardo Indígena Embera del Rio Domingodo", "area": 0.0}, {"nombre": "Resguardo indígena Embera Rios Uva Pogue, Quebrada Taparal", "area": 48143.7}, {"nombre": "Resguardo Indígena Embera de los Rios Valle y Boroboro", "area": 67.5}, {"nombre": "Resguardo Indígena Embera de los Rios Tungina Y Apartado", "area": 8385.4}]}, {"name": "Quibdó", "area": 328716.5, "cc": 234153.2, "ri": 94563.3, "st": 22149.1, "num_cc": 9, "num_ri": 27, "cc_nombres": [{"nombre": "Consejo Comunitario Mayor Del Medio Atrato - Acia", "area": 230332.3}, {"nombre": "Consejo Comunitario Comunidad Negra de San Francisco De Cugucho", "area": 2.3}, {"nombre": "Consejo Comunitario Comunidad Negra de San Isidro", "area": 100.6}, {"nombre": "Consejo Comunitario general del Río Baudó y sus afluentes - Acaba", "area": 159.6}, {"nombre": "Consejo Comunitario de Guayabal", "area": 2767.6}, {"nombre": "Consejo Comunitario de Casimiro", "area": 31.0}, {"nombre": "Consejo Comunitario Mayor De La Organización Campesina Popular Del Alto Atrato  - Cocomopoca", "area": 206.6}, {"nombre": "Consejo Comunitario Santo Domingo", "area": 511.9}, {"nombre": "Consejo Comunitario  de la Comunidad Negra del Corregimiento de la Soledad", "area": 41.4}], "ri_nombres": [{"nombre": "Resguardo Indígena Embera de Alto Rio Bojaya", "area": 132.6}, {"nombre": "Resguardo Indígena Embera de Alto Rio Buey", "area": 13225.5}, {"nombre": "Resguardo Indígena Embera del Alto Rio Tagachi", "area": 21458.5}, {"nombre": "Resguardo Indígena Emebera de los Rios Bete, Auro Bete y Auro del Buey", "area": 11222.3}, {"nombre": "Resguardo Indígena Embera Buchado Amparrado", "area": 40.0}, {"nombre": "Resguardo Indígena Embera de Caimanero de Jampapa", "area": 1757.3}, {"nombre": "Resguardo Indígena Embera Gegenado", "area": 2.8}, {"nombre": "Resguardo Indígena Embera Katio El Dieciocho", "area": 33.9}, {"nombre": "Resguardo Indígena Embera Katio de El Fiera", "area": 137.0}, {"nombre": "Resguardo Indígena Embera-Katio de Playalta, El Veinte y El Noventa", "area": 2317.5}, {"nombre": "Resguardo Indígena Embera El Veintiuno", "area": 238.4}, {"nombre": "Resguardo Indígena Embera Katio de Guarandó Carrizal", "area": 73.2}, {"nombre": "Resguardo Indígena Embera-Chami de La Cristalina", "area": 12514.0}, {"nombre": "Resguardo Indígena Embera de La Lomita", "area": 15.2}, {"nombre": "Resguardo Indígena Embera Miasa De Partado", "area": 16.9}, {"nombre": "Resguardo Indígena Embera de Motordo", "area": 496.8}, {"nombre": "Resguardo Indígena Embera de Mungarado", "area": 534.2}, {"nombre": "Resguardo Indígena Embera de Corede en el Alto del Rio Munguidó", "area": 5640.9}, {"nombre": "Resguardo Indígena Embera de Paina", "area": 31.9}, {"nombre": "Resguardo Indígena Embera de la Quebrada Chique-Rio Tangui", "area": 5.2}, {"nombre": "Resguardo Indígena Embera del Rio Bebara", "area": 2.9}, {"nombre": "Resguardo Indígena Embera del Rio Bebarama", "area": 8146.5}, {"nombre": "Resguardo Indígena Embera del Rio Icho y Quebrada Baratuo", "area": 5245.0}, {"nombre": "Resguardo Indígena del Rio La Playa", "area": 28.3}, {"nombre": "Resguardo Indígena Embera del Rio Negua", "area": 4655.3}, {"nombre": "Resguardo Indígena Embera de los Rios Jurubida, Chori y Alto Baudo", "area": 12.5}, {"nombre": "Resguardo Indígena Embera Paso Rio Salado", "area": 6578.6}]}, {"name": "Bajo Baudó", "area": 340944.9, "cc": 214523.2, "ri": 126421.7, "st": 7274.9, "num_cc": 15, "num_ri": 18, "cc_nombres": [{"nombre": "Consejo Comunitario de Bellavista Dubaza", "area": 1505.0}, {"nombre": "Consejo Comunitario de Puerto Echeverry", "area": 880.4}, {"nombre": "Consejo Comunitario de Río  Pilizá", "area": 18288.6}, {"nombre": "Consejo Comunitario de San Agustín De Terrón", "area": 16660.6}, {"nombre": "Consejo Comunitario de San Andrés De Usaragá", "area": 12791.5}, {"nombre": "Consejo Comunitario Villa María De Purrichá", "area": 22736.4}, {"nombre": "Consejo Comunitario del Medio, Bajo y Zona Costera del Juan \"ACADESAN\"", "area": 1205.3}, {"nombre": "Consejo Comunitario de Cuevita", "area": 15768.1}, {"nombre": "Consejo Comunitario de La Costa - Concosta", "area": 64832.1}, {"nombre": "Consejo Comunitario de Pavasa", "area": 7586.4}, {"nombre": "Consejo Comunitario de Pizarro", "area": 7049.5}, {"nombre": "Consejo Comunitario general del Río Baudó y sus afluentes - Acaba", "area": 16597.1}, {"nombre": "Consejo Comunitario de Virudó", "area": 7071.3}, {"nombre": "Consejo Comunitario General Del Municipío De Nuquí - Los Riscales", "area": 127.0}, {"nombre": "Consejo Comunitario de Sivirú", "area": 21423.9}], "ri_nombres": [{"nombre": "Resguardo Indígena Embera de Bajo Grande", "area": 2424.5}, {"nombre": "Resguardo Indígena Waunana de Bellavista y Union Pitalito", "area": 28624.2}, {"nombre": "Resguardo Indígena Chigorodo Memba", "area": 11.1}, {"nombre": "Resguardo Indígena Embera  de Do Imamma Tuma y Bella Luz", "area": 3029.7}, {"nombre": "Resguardo Indígena Embera de El Piñal", "area": 2909.3}, {"nombre": "Resguardo Indígena Embera La Jagua - Guachal y Agua Clara", "area": 1252.4}, {"nombre": " Resguardo Indígena Waunana de La Union Choco - San Cristobal", "area": 206.9}, {"nombre": "Resguardo Indígena Embera - Eperara de Ordo-Siviru-Aguaclara", "area": 2512.2}, {"nombre": "Resguardo Indígena Waunana de Puado, La Lerma, Matare y Terdo", "area": 47.5}, {"nombre": "Resguardo Indígena Waunan de Puerto Chichiliano", "area": 307.6}, {"nombre": "Resguardo Indígena Waunana del Rio Orpua", "area": 14368.5}, {"nombre": "Resguardo Indígena Embera del Rio Pangui", "area": 1380.3}, {"nombre": "Resguardo Indígena Embera del Rio Pavasa y la Quebrada Jella", "area": 13693.9}, {"nombre": "Resguardo Indígena Embera del Rio Purricha", "area": 12081.7}, {"nombre": "Resguardo Indígena Embera de los Rios Catru, Dubasa, Ankoso", "area": 33710.1}, {"nombre": "Resguardo Indígena Embera del Rio Torreido", "area": 2060.6}, {"nombre": "Resguardo Indígena Embera de Santa Cecilia de la Quebrada Oro Choco", "area": 24.2}, {"nombre": "Resguardo Indígena Waunana de Santa Rosa De Ijua", "area": 7777.0}]}, {"name": "Carmen Del Darién", "area": 314972.2, "cc": 251483.2, "ri": 63489, "st": 3296.5, "num_cc": 16, "num_ri": 7, "cc_nombres": [{"nombre": "Consejo Comunitario Bocas De Taparal", "area": 5939.0}, {"nombre": "Consejo Comunitario De Chicao", "area": 16643.0}, {"nombre": "Consejo Comunitario De Dos Bocas", "area": 3715.0}, {"nombre": "Consejo Comunitario De La Madre", "area": 8180.6}, {"nombre": "Consejo Comunitario Mayor Del Medio Atrato - Acia", "area": 3230.3}, {"nombre": "Consejo Comunitario Comunidad Negra Apartado Buenavista", "area": 19222.7}, {"nombre": "Consejo Comunitario de La Grande", "area": 13252.6}, {"nombre": "Consejo Comunitario Pedeguita Y Mancilla", "area": 8975.4}, {"nombre": "Consejo Comunitario del Río Curvaradó", "area": 31209.7}, {"nombre": "Consejo Comunitario del Río Domingodó", "area": 25793.1}, {"nombre": "Consejo Comunitario del Río Jiguamiandó", "area": 41414.8}, {"nombre": "Consejo Comunitario del Río Montaño", "area": 23512.5}, {"nombre": "Consejo Comunitario de Turriquitadó", "area": 9255.8}, {"nombre": "Consejo Comunitario de Vígia De Curvaradó y Santa Rosa De Limón", "area": 34261.9}, {"nombre": "Consejo Comunitario de Cupica", "area": 6777.6}, {"nombre": "Consejo Comunitario Por El Desarrollo Integral", "area": 99.2}], "ri_nombres": [{"nombre": "Resguardo Indígena Embera Katio del Rio Murindo", "area": 19.9}, {"nombre": "Resguardo Indígena Embera de los Rios Pavarando y Amparrado Medio", "area": 28.0}, {"nombre": "Resguardo Indígena Embera de Jagual Rio Chintado", "area": 22762.0}, {"nombre": "Resguardo Indígena Embera de Mamey De Dipurdu", "area": 205.7}, {"nombre": "Resguardo Indígena Embera de Opogado Doguado", "area": 4.2}, {"nombre": "Resguardo Indígena Embera del Rio Domingodo", "area": 24353.0}, {"nombre": "Resguardo Indígena Embera de Urada Jiguamiando", "area": 16116.2}]}, {"name": "Alto Baudó", "area": 201528.6, "cc": 66731.6, "ri": 134797, "st": 3659.2, "num_cc": 8, "num_ri": 15, "cc_nombres": [{"nombre": "Consejo Comunitario Mayor Del Medio Atrato - Acia", "area": 19.4}, {"nombre": "Consejo Comunitario Comunidad Negra de San Francisco De Cugucho", "area": 8736.4}, {"nombre": "Consejo Comunitario Comunidad Negra de Villa Conto", "area": 46.6}, {"nombre": "Consejo Comunitario de Bellavista Dubaza", "area": 971.7}, {"nombre": "Consejo Comunitario de Puerto Echeverry", "area": 3378.4}, {"nombre": "Consejo Comunitario Mayor Del Cantón De San Pablo \"Acisanp\"", "area": 97.3}, {"nombre": "Consejo Comunitario general del Río Baudó y sus afluentes - Acaba", "area": 53283.4}, {"nombre": "Consejo Comunitario General Del Municipío De Nuquí - Los Riscales", "area": 198.4}], "ri_nombres": [{"nombre": "Resguardo Indígena Embera  Aguaclara Y Bella Luz Del Rio Amporá", "area": 9303.1}, {"nombre": "Resguardo Indígena Embera de Alto Rio Bojaya", "area": 0.2}, {"nombre": "Resguardo Indígena Embera de Alto Rio Buey", "area": 17.4}, {"nombre": "Resguardo Indígena Emebera de los Rios Bete, Auro Bete y Auro del Buey", "area": 20.5}, {"nombre": "Resguardo Indígena Embera de Dearade Biakirude", "area": 6013.1}, {"nombre": "Resguardo Indígena Embera de los Rios Dominic,  Londoño y Apartado", "area": 6629.2}, {"nombre": "Resguardo Indígena Embera Miasa De Partado", "area": 3.5}, {"nombre": "Resguardo Indígena Embera de Corede en el Alto del Rio Munguidó", "area": 0.0}, {"nombre": "Resguardo Indígena Embera de Puerto Alegre y La Divisa", "area": 21609.6}, {"nombre": "Resguardo Indígena Embera de Puerto Libia Tripicay", "area": 2140.2}, {"nombre": "Resguardo Indígena Embera del Rio Pavasa y la Quebrada Jella", "area": 34.9}, {"nombre": "Resguardo Indígena Embera de los Rios Catru, Dubasa, Ankoso", "area": 23210.3}, {"nombre": "Resguardo Indígena Embera de los Rios Jurubida, Chori y Alto Baudo", "area": 65811.6}, {"nombre": "Resguardo Indígena Embera de los Rios Pato y Jengado", "area": 3.5}, {"nombre": "Resguardo Indígena Embera Paso Rio Salado", "area": 0.0}]}, {"name": "Istmina", "area": 185820.4, "cc": 154990.4, "ri": 30830, "st": 2287.8, "num_cc": 9, "num_ri": 8, "cc_nombres": [{"nombre": "Consejo Comunitario del Río Pepe", "area": 90.7}, {"nombre": "Consejo Comunitario del Medio, Bajo y Zona Costera del Juan \"ACADESAN\"", "area": 111291.9}, {"nombre": "Consejo Comunitario de La Costa - Concosta", "area": 126.4}, {"nombre": "Consejo Comunitario Mayor Unión Panamericana \"Cocomaupa\"", "area": 197.4}, {"nombre": "Consejo Comunitario Mayor Del Alto San Juan \"Asocasan\"", "area": 3461.9}, {"nombre": "Consejo Comunitario Mayor Del Cantón De San Pablo \"Acisanp\"", "area": 537.9}, {"nombre": "Consejo Comunitario general del Río Baudó y sus afluentes - Acaba", "area": 1142.6}, {"nombre": "Consejo Comunitario Mayor de Istmina Y Parte Del Medio San Juan", "area": 37518.9}, {"nombre": "Consejo Comunitario Mayor Del Municipio De Condoto", "area": 622.7}], "ri_nombres": [{"nombre": "Resguardo Indígena Embera de Bajo Grande", "area": 2.3}, {"nombre": "Resguardo Indígena Waunana de Bellavista y Union Pitalito", "area": 587.3}, {"nombre": " Resguardo Indígena Waunana de La Union Choco - San Cristobal", "area": 19425.4}, {"nombre": "Resguardo Indígena Waunana de Puado, La Lerma, Matare y Terdo", "area": 10746.3}, {"nombre": "Resguardo Indígena Waunana del Rio Orpua", "area": 51.3}, {"nombre": "Resguardo Indígena Embera Katio de Sanandocito", "area": 4.7}, {"nombre": "Resguardo Indígena Waunana de Santa Rosa De Ijua", "area": 0.5}, {"nombre": "Resguardo Indígena Embera de Sirena Berrecuy", "area": 12.2}]}, {"name": "Medio Atrato", "area": 181329.0, "cc": 134828.4, "ri": 46500.6, "st": 45.9, "num_cc": 1, "num_ri": 10, "cc_nombres": [{"nombre": "Consejo Comunitario Mayor Del Medio Atrato - Acia", "area": 134828.4}], "ri_nombres": [{"nombre": "Resguardo Indígena Embera-Katio de Andabu", "area": 50.8}, {"nombre": "Resguardo Indígena Embera del Alto Rio Tagachi", "area": 5.0}, {"nombre": "Resguardo Indígena Emebera de los Rios Bete, Auro Bete y Auro del Buey", "area": 469.2}, {"nombre": "Resguardo Indígena Embera-Chami de La Cristalina", "area": 6.4}, {"nombre": "Resguardo Indígena Embera de Paina", "area": 2821.6}, {"nombre": "Resguardo Indígena Embera de la Quebrada Chique-Rio Tangui", "area": 2610.4}, {"nombre": "Resguardo Indígena Embera del Rio Ame", "area": 3398.0}, {"nombre": "Resguardo Indígena Embera del Rio Bebara", "area": 37137.6}, {"nombre": "Resguardo Indígena Embera del Rio Bebarama", "area": 0.1}, {"nombre": "Resguardo Indígena Embera Paso Rio Salado", "area": 1.5}]}, {"name": "Belén de bajirá", "area": 127224.3, "cc": 127224.3, "ri": 0, "st": 44711.8, "num_cc": 5, "num_ri": 0, "cc_nombres": [{"nombre": "Consejo Comunitario de la Cuenta del Río Cacarica", "area": 11.4}, {"nombre": "Consejo Comunitario de Los Ríos La Larga Y Tumaradó", "area": 97106.2}, {"nombre": "Consejo Comunitario Pedeguita Y Mancilla", "area": 7321.1}, {"nombre": "Consejo Comunitario del Río Curvaradó", "area": 12139.9}, {"nombre": "Consejo Comunitario del Río Jiguamiandó", "area": 10645.6}], "ri_nombres": []}, {"name": "San José Del Palmar", "area": 83452.4, "cc": 80549, "ri": 2903.4, "st": 74800, "num_cc": 4, "num_ri": 3, "cc_nombres": [{"nombre": "Consejo Comunitario del Medio, Bajo y Zona Costera del Juan \"ACADESAN\"", "area": 11013.8}, {"nombre": "Consejo Comunitario Mayor De Novita", "area": 68117.9}, {"nombre": "Consejo Comunitario Mayor Del Alto San Juan \"Asocasan\"", "area": 15.2}, {"nombre": "Consejo Comunitario Mayor Del Municipio De Condoto", "area": 1402.1}], "ri_nombres": [{"nombre": "Resguardo Indígena Embera de  Alto Bonito Vira Vira", "area": 871.4}, {"nombre": "Resguardo Indígena Embera-Katio (Chami) Cope Del Rio Ingara", "area": 268.5}, {"nombre": "Resguardo Indígena Embera Katio de Sabaletera San Onofre y El Tigre", "area": 1763.4}]}, {"name": "Sipí", "area": 156778.5, "cc": 138677.4, "ri": 18101.1, "st": 966.8, "num_cc": 2, "num_ri": 3, "cc_nombres": [{"nombre": "Consejo Comunitario del Medio, Bajo y Zona Costera del Juan \"ACADESAN\"", "area": 138117.8}, {"nombre": "Consejo Comunitario Mayor De Novita", "area": 559.6}], "ri_nombres": [{"nombre": "Resguardo Indígena Embera Katio de Sanandocito", "area": 7748.3}, {"nombre": "Resguardo Indígena Cañon Del Sanquinini", "area": 6.4}, {"nombre": "Resguardo Indígena Chami - (Eriom Garrapatas)", "area": 10346.4}]}, {"name": "Medio Baudó", "area": 133381.9, "cc": 106574.9, "ri": 26807, "st": 3912.4, "num_cc": 10, "num_ri": 11, "cc_nombres": [{"nombre": "Consejo Comunitario de Bellavista Dubaza", "area": 0.3}, {"nombre": "Consejo Comunitario de Puerto Echeverry", "area": 0.5}, {"nombre": "Consejo Comunitario de Río  Pilizá", "area": 54.9}, {"nombre": "Consejo Comunitario del Río Pepe", "area": 8141.1}, {"nombre": "Consejo Comunitario Villa María De Purrichá", "area": 931.3}, {"nombre": "Consejo Comunitario del Medio, Bajo y Zona Costera del Juan \"ACADESAN\"", "area": 115.5}, {"nombre": "Consejo Comunitario Mayor Del Cantón De San Pablo \"Acisanp\"", "area": 28.5}, {"nombre": "Consejo Comunitario de Pizarro", "area": 0.0}, {"nombre": "Consejo Comunitario general del Río Baudó y sus afluentes - Acaba", "area": 97042.2}, {"nombre": "Consejo Comunitario Mayor de Istmina Y Parte Del Medio San Juan", "area": 260.5}], "ri_nombres": [{"nombre": "Resguardo Indígena Waunana de Bellavista y Union Pitalito", "area": 83.3}, {"nombre": "Resguardo Indígena Chigorodo Memba", "area": 2429.3}, {"nombre": "Resguardo Indígena de Patio Bonito", "area": 838.9}, {"nombre": "Resguardo Indígena Embera de Puerto Libre del Rio Pepe", "area": 2094.5}, {"nombre": "Resguardo Indígena Embera de Pueblito de la Quebrada Querá", "area": 4196.2}, {"nombre": "Resguardo Indígena Embera del Rio Purricha", "area": 5685.0}, {"nombre": "Resguardo Indígena Embera de los Rios Catru, Dubasa, Ankoso", "area": 19.9}, {"nombre": "Resguardo Indígena Embera del Rio Torreido", "area": 4281.0}, {"nombre": "Resguardo Indígena Embera de Santa Cecilia de la Quebrada Oro Choco", "area": 5011.7}, {"nombre": "Resguardo Indígena Embera de Sirena Berrecuy", "area": 1198.8}, {"nombre": "Resguardo Indígena Embera de Trapiche del Rio Pepe", "area": 968.3}]}, {"name": "Juradó", "area": 118423.3, "cc": 72391.9, "ri": 46031.4, "st": 11382.1, "num_cc": 4, "num_ri": 6, "cc_nombres": [{"nombre": "Consejo Comunitario de Truando Medio", "area": 590.8}, {"nombre": "Consejo Comunitario de Cupica", "area": 10552.5}, {"nombre": "Consejo Comunitario General De La Costa Pacífica Del Norte - Los Delfines", "area": 32486.7}, {"nombre": "Consejo Comunitario Mayor Del Municipio De Juradó", "area": 28761.9}], "ri_nombres": [{"nombre": "Resguardo Indígena Embera Guayabal de Partado", "area": 4303.9}, {"nombre": "Resguardo Indígena Katio", "area": 16573.8}, {"nombre": "Resguardo Indígena Embera y Waunan de \"Nussí Purrú\"", "area": 14794.0}, {"nombre": "Resguardo Indígena Embera de Peña Blanca - Rio Truando", "area": 81.9}, {"nombre": "Resguardo Indígena Embera - Katio de los Ríos Salaqui-Pavarando", "area": 248.0}, {"nombre": "Resguardo Indígena Waunana del Rio Curiche", "area": 10029.8}]}, {"name": "Unguía", "area": 40329.6, "cc": 32469.6, "ri": 7860, "st": 78793.5, "num_cc": 3, "num_ri": 5, "cc_nombres": [{"nombre": "Consejo Comunitario Mayor Del Bajo Atrato", "area": 30833.4}, {"nombre": "Consejo Comunitario De La Cuenca Del Río Tolo Y Zona Costera Sur _ Cocomasur", "area": 26.8}, {"nombre": "Consejo Comunitario Mayor de Unguía Darién - COCOMADA", "area": 1609.5}], "ri_nombres": [{"nombre": "Resguardo Indígena de Arquia", "area": 3205.5}, {"nombre": "Resguardo Indígena Cuna del Rio Cuti", "area": 247.1}, {"nombre": "Resguardo Indígena Embera Dobida Dogibi", "area": 3154.1}, {"nombre": "Resguardo Indígena Katio (Rio Tanela)", "area": 992.5}, {"nombre": "Resguardo Indígena Embera Katio de Cuti", "area": 260.9}]}, {"name": "Nóvita", "area": 94259.1, "cc": 93882.1, "ri": 377, "st": 308.5, "num_cc": 3, "num_ri": 1, "cc_nombres": [{"nombre": "Consejo Comunitario del Medio, Bajo y Zona Costera del Juan \"ACADESAN\"", "area": 50314.5}, {"nombre": "Consejo Comunitario Mayor De Novita", "area": 43434.8}, {"nombre": "Consejo Comunitario Mayor Del Municipio De Condoto", "area": 132.8}], "ri_nombres": [{"nombre": "Resguardo Indígena Embera Katio de Sabaletera San Onofre y El Tigre", "area": 377.0}]}, {"name": "Bahía Solano", "area": 81396.3, "cc": 57450.7, "ri": 23945.6, "st": 8210.3, "num_cc": 2, "num_ri": 10, "cc_nombres": [{"nombre": "Consejo Comunitario de Cupica", "area": 17426.6}, {"nombre": "Consejo Comunitario General De La Costa Pacífica Del Norte - Los Delfines", "area": 40024.1}], "ri_nombres": [{"nombre": "Resguardo Indígena Embera de Alto Rio Bojaya", "area": 0.1}, {"nombre": "Resguardo Indígena Embera de Alto Rio Cuia", "area": 32.4}, {"nombre": "Resguardo Indígena Embera del Rio Napipi", "area": 0.3}, {"nombre": "Resguardo Indígena Embera de Opogado Doguado", "area": 39.2}, {"nombre": "Resguardo Indígena Embera  de Pichicora, Chicue y Punto Alegre", "area": 0.1}, {"nombre": "Resguardo Indígena Embera del Rio Domingodo", "area": 27.8}, {"nombre": "Resguardo Indígena Embera de los Rios Jurubida, Chori y Alto Baudo", "area": 47.1}, {"nombre": "Resguardo indígena Embera Rios Uva Pogue, Quebrada Taparal", "area": 147.8}, {"nombre": "Resguardo Indígena Embera de los Rios Valle y Boroboro", "area": 23193.5}, {"nombre": "Resguardo Indígena Embera de Villa Nueva Juna", "area": 457.4}]}, {"name": "Lloró", "area": 69383.4, "cc": 37483.7, "ri": 31899.7, "st": 14928.9, "num_cc": 4, "num_ri": 11, "cc_nombres": [{"nombre": "Consejo Comunitario Mayor Del Medio Atrato - Acia", "area": 767.6}, {"nombre": "Consejo Comunitario de Paimado", "area": 38.9}, {"nombre": "Consejo Comunitario Mayor De La Organización Campesina Popular Del Alto Atrato  - Cocomopoca", "area": 22242.8}, {"nombre": "Consejo Comunitario Integral De Lloro_Cocoillo", "area": 14434.4}], "ri_nombres": [{"nombre": "Resguardo Indígena Embera-Katio Rio Andagueda", "area": 0.0}, {"nombre": "Resguardo Indígena Katio-Embera del Paraje El Doce o Quebrada Borbollon", "area": 0.0}, {"nombre": "Resguardo Indígena Embera-Katio de Playalta, El Veinte y El Noventa", "area": 1893.1}, {"nombre": "Resguardo Indígena Embera Katio de Gegora, Quipara, Murando, Tiravenado y Jiguado", "area": 3673.5}, {"nombre": "Resguardo Indígena Embera de Guadualito", "area": 429.0}, {"nombre": "Resguardo Indígena Embera de Hurtado y Tegavera", "area": 4134.5}, {"nombre": "Resguardo Indígena Embera-Katio de La Puria", "area": 984.0}, {"nombre": "Resguardo Indígena Embera-Catio del Rio Mumbu", "area": 3355.0}, {"nombre": "Resguardo Indígena Embera De Lanas", "area": 7263.6}, {"nombre": "Resguardo Indígena Katio de Tokolloro", "area": 254.0}, {"nombre": "Resguardo Indígena Embera de Wanchirado", "area": 9913.0}]}, {"name": "El Carmen", "area": 16798.5, "cc": 0.3, "ri": 16798.2, "st": 66230.9, "num_cc": 1, "num_ri": 9, "cc_nombres": [{"nombre": "Consejo Comunitario Mayor Del Medio Atrato - Acia", "area": 0.3}], "ri_nombres": [{"nombre": "Resguardo Indígena Embera Katio de Abejero", "area": 223.4}, {"nombre": "Resguardo Indígena Embera Katio El Dieciocho", "area": 879.7}, {"nombre": "Resguardo Indígena Katio-Embera del Paraje El Doce o Quebrada Borbollon", "area": 1134.8}, {"nombre": "Resguardo Indígena Embera Katio de El Fiera", "area": 4308.4}, {"nombre": "Resguardo Indígena Embera-Katio de La Puria", "area": 4253.7}, {"nombre": "Resguardo Indígena del Rio La Playa", "area": 5146.7}, {"nombre": "Resguardo Indígena Embera-Chami de Sabaleta", "area": 661.0}, {"nombre": "Resguardo Indígena Embera De Lanas", "area": 182.3}, {"nombre": "Resguardo Indígena Embera de Wanchirado", "area": 8.3}]}, {"name": "Bagadó", "area": 72397.4, "cc": 22049.8, "ri": 50347.6, "st": 8359.5, "num_cc": 3, "num_ri": 4, "cc_nombres": [{"nombre": "Consejo Comunitario Mayor Del Alto San Juan \"Asocasan\"", "area": 178.2}, {"nombre": "Consejo Comunitario Mayor De La Organización Campesina Popular Del Alto Atrato  - Cocomopoca", "area": 21871.0}, {"nombre": "Consejo Comunitario Integral De Lloro_Cocoillo", "area": 0.7}], "ri_nombres": [{"nombre": "Resguardo Indígena Embera-Katio Rio Andagueda", "area": 50344.1}, {"nombre": "Resguardo Indígena Embera de Wanchirado", "area": 0.8}, {"nombre": "Resguardo Indígena Embera Chami  de Gitó Dokabú", "area": 2.1}, {"nombre": "Resguardo Indígena Unificado Chami", "area": 0.6}]}, {"name": "Acandí", "area": 34652.7, "cc": 29559.9, "ri": 5092.8, "st": 45200.1, "num_cc": 3, "num_ri": 2, "cc_nombres": [{"nombre": "Consejo Comunitario De La Cuenca Del Río Acandí Seco, El Cedro Y Juancho", "area": 5345.6}, {"nombre": "Consejo Comunitario De La Cuenca Del Río Acandí Zona Costera Norte", "area": 11021.0}, {"nombre": "Consejo Comunitario De La Cuenca Del Río Tolo Y Zona Costera Sur _ Cocomasur", "area": 13193.3}], "ri_nombres": [{"nombre": "Resguardo Indígena Embera Katio de Chidima - Tolo", "area": 4487.3}, {"nombre": "Resguardo Indígena Embera Katio de Pescadito", "area": 605.5}]}, {"name": "Tadó", "area": 79279.6, "cc": 60920.3, "ri": 18359.3, "st": 0, "num_cc": 7, "num_ri": 5, "cc_nombres": [{"nombre": "Consejo Comunitario de Cértegui", "area": 78.1}, {"nombre": "Consejo Comunitario Mayor Unión Panamericana \"Cocomaupa\"", "area": 77.5}, {"nombre": "Consejo Comunitario Mayor Del Alto San Juan \"Asocasan\"", "area": 42626.1}, {"nombre": "Consejo Comunitario De La Comunidad Negral Del Municipio De Pueblo Rico Risaralda", "area": 1.9}, {"nombre": "Consejo Comunitario Mayor de Istmina Y Parte Del Medio San Juan", "area": 107.6}, {"nombre": "Consejo Comunitario Mayor Del Municipio De Condoto", "area": 16275.2}, {"nombre": "Consejo Comunitario Mayor De La Organización Campesina Popular Del Alto Atrato  - Cocomopoca", "area": 1753.8}], "ri_nombres": [{"nombre": "Resguardo Indígena Embera de Bochoroma Bochoromacito", "area": 898.6}, {"nombre": "Resguardo Indígena Embera Katio de El Silencio", "area": 60.8}, {"nombre": "Resguardo Indígena Embera de Mondó Mondocito", "area": 1708.2}, {"nombre": "Resguardo Indígena Embera de Tarena", "area": 15691.7}, {"nombre": "Resguardo Indígena Embera Chami  de Gitó Dokabú", "area": 0.0}]}, {"name": "Nuquí", "area": 68528.3, "cc": 36805.3, "ri": 31723, "st": 1930, "num_cc": 2, "num_ri": 6, "cc_nombres": [{"nombre": "Consejo Comunitario de Cuevita", "area": 102.3}, {"nombre": "Consejo Comunitario General Del Municipío De Nuquí - Los Riscales", "area": 36703.0}], "ri_nombres": [{"nombre": "Resguardo Indígena Embera del Rio Nuqui", "area": 9680.9}, {"nombre": "Resguardo Indígena Embera del Rio Pangui", "area": 6557.1}, {"nombre": "Resguardo Indígena Embera del Rio Pavasa y la Quebrada Jella", "area": 47.9}, {"nombre": "Resguardo Indígena Embera de los Rios Catru, Dubasa, Ankoso", "area": 0.0}, {"nombre": "Resguardo Indígena Embera de los Rios Jurubida, Chori y Alto Baudo", "area": 15437.2}, {"nombre": "Resguardo Indígena Embera de Puerto Alegre y La Divisa", "area": 0.0}]}, {"name": "Rio Quito", "area": 65158.5, "cc": 57968.9, "ri": 7189.6, "st": 4777.8, "num_cc": 10, "num_ri": 5, "cc_nombres": [{"nombre": "Consejo Comunitario Mayor Del Medio Atrato - Acia", "area": 589.6}, {"nombre": "Consejo Comunitario Comunidad Negra de San Isidro", "area": 11958.6}, {"nombre": "Consejo Comunitario Comunidad Negra de Villa Conto", "area": 27483.0}, {"nombre": "Consejo Comunitario Mayor Del Cantón De San Pablo \"Acisanp\"", "area": 3475.8}, {"nombre": "Consejo Comunitario de Paimado", "area": 11650.2}, {"nombre": "Consejo Comunitario general del Río Baudó y sus afluentes - Acaba", "area": 721.2}, {"nombre": "Consejo Comunitario Mayor De La Organización Campesina Popular Del Alto Atrato  - Cocomopoca", "area": 1743.8}, {"nombre": "Consejo Comunitario de la Comunidad Negra de La Molana", "area": 4.7}, {"nombre": "Consejo Comunitario Santo Domingo", "area": 195.1}, {"nombre": "Consejo Comunitario  de la Comunidad Negra del Corregimiento de la Soledad", "area": 146.7}], "ri_nombres": [{"nombre": "Resguardo Indígena Embera de Caimanero de Jampapa", "area": 17.9}, {"nombre": "Resguardo Indígena Embera de La Lomita", "area": 979.2}, {"nombre": "Resguardo Indígena Embera Miasa De Partado", "area": 2249.9}, {"nombre": "Resguardo Indígena Embera de los Rios Pato y Jengado", "area": 3129.7}, {"nombre": "Resguardo Indígena Embera de San Jose Amia De Pato", "area": 813.0}]}, {"name": "Medio San Juan", "area": 66101.8, "cc": 64856.9, "ri": 1244.9, "st": 275.6, "num_cc": 4, "num_ri": 2, "cc_nombres": [{"nombre": "Consejo Comunitario del Medio, Bajo y Zona Costera del Juan \"ACADESAN\"", "area": 51239.4}, {"nombre": "Consejo Comunitario Mayor De Novita", "area": 5591.8}, {"nombre": "Consejo Comunitario Mayor de Istmina Y Parte Del Medio San Juan", "area": 6489.5}, {"nombre": "Consejo Comunitario Mayor Del Municipio De Condoto", "area": 1536.2}], "ri_nombres": [{"nombre": "Resguardo Indígena Embera - Chami Peñas Del Olvido", "area": 28.1}, {"nombre": "Resguardo Indígena Waunana de Puado, La Lerma, Matare y Terdo", "area": 1216.9}]}, {"name": "Condoto", "area": 44763.8, "cc": 42576.2, "ri": 2187.6, "st": 2024.8, "num_cc": 2, "num_ri": 2, "cc_nombres": [{"nombre": "Consejo Comunitario Mayor De Novita", "area": 169.3}, {"nombre": "Consejo Comunitario Mayor Del Municipio De Condoto", "area": 42406.9}], "ri_nombres": [{"nombre": "Resguardo Indígena Embera de  Alto Bonito Vira Vira", "area": 2060.9}, {"nombre": "Resguardo Indígena Embera - Chami Peñas Del Olvido", "area": 126.7}]}, {"name": "Cértegui", "area": 42141.5, "cc": 40290.4, "ri": 1851.1, "st": 209.9, "num_cc": 7, "num_ri": 2, "cc_nombres": [{"nombre": "Consejo Comunitario de Cértegui", "area": 23373.2}, {"nombre": "Consejo Comunitario Mayor Unión Panamericana \"Cocomaupa\"", "area": 295.0}, {"nombre": "Consejo Comunitario Mayor Del Alto San Juan \"Asocasan\"", "area": 1878.9}, {"nombre": "Consejo Comunitario Mayor Del Cantón De San Pablo \"Acisanp\"", "area": 1247.7}, {"nombre": "Consejo Comunitario de Paimado", "area": 36.7}, {"nombre": "Consejo Comunitario Mayor De La Organización Campesina Popular Del Alto Atrato  - Cocomopoca", "area": 9188.3}, {"nombre": "Consejo Comunitario Integral De Lloro_Cocoillo", "area": 4270.5}], "ri_nombres": [{"nombre": "Resguardo Indígena Embera Katio de Gegora, Quipara, Murando, Tiravenado y Jiguado", "area": 1.0}, {"nombre": "Resguardo Indígena Embera de Pared y Parecito", "area": 1850.2}]}, {"name": "Atrato (Yuto)", "area": 41495.5, "cc": 41355.7, "ri": 139.8, "st": 678.4, "num_cc": 11, "num_ri": 2, "cc_nombres": [{"nombre": "Consejo Comunitario Mayor Del Medio Atrato - Acia", "area": 15088.4}, {"nombre": "Consejo Comunitario Comunidad Negra de San Isidro", "area": 76.9}, {"nombre": "Consejo Comunitario Comunidad Negra de Villa Conto", "area": 22.0}, {"nombre": "Consejo Comunitario de Cértegui", "area": 26.2}, {"nombre": "Consejo Comunitario Mayor Del Cantón De San Pablo \"Acisanp\"", "area": 62.8}, {"nombre": "Consejo Comunitario de Paimado", "area": 5388.5}, {"nombre": "Consejo Comunitario Mayor De La Organización Campesina Popular Del Alto Atrato  - Cocomopoca", "area": 17080.4}, {"nombre": "Consejo Comunitario Integral De Lloro_Cocoillo", "area": 944.6}, {"nombre": "Consejo Comunitario de la Comunidad Negra de La Molana", "area": 1729.0}, {"nombre": "Consejo Comunitario de la Comunidad Negra de Vuelta Mansa", "area": 127.1}, {"nombre": "Consejo Comunitario Santo Domingo", "area": 809.7}], "ri_nombres": [{"nombre": "Resguardo Indígena Embera-Katio de Playalta, El Veinte y El Noventa", "area": 139.2}, {"nombre": "Resguardo Indígena Katio de Tokolloro", "area": 0.6}]}, {"name": "El Cantón Del San Pablo", "area": 37602.4, "cc": 37602.4, "ri": 0, "st": 466.9, "num_cc": 7, "num_ri": 0, "cc_nombres": [{"nombre": "Consejo Comunitario Comunidad Negra de Villa Conto", "area": 0.1}, {"nombre": "Consejo Comunitario de Cértegui", "area": 14.9}, {"nombre": "Consejo Comunitario Mayor Unión Panamericana \"Cocomaupa\"", "area": 1009.2}, {"nombre": "Consejo Comunitario Mayor Del Cantón De San Pablo \"Acisanp\"", "area": 30611.9}, {"nombre": "Consejo Comunitario de Paimado", "area": 12.0}, {"nombre": "Consejo Comunitario general del Río Baudó y sus afluentes - Acaba", "area": 5952.8}, {"nombre": "Consejo Comunitario Mayor de Istmina Y Parte Del Medio San Juan", "area": 1.6}], "ri_nombres": []}, {"name": "Rio Iró", "area": 32024.3, "cc": 30993.7, "ri": 1030.6, "st": 497.3, "num_cc": 3, "num_ri": 2, "cc_nombres": [{"nombre": "Consejo Comunitario Mayor Del Alto San Juan \"Asocasan\"", "area": 5330.1}, {"nombre": "Consejo Comunitario Mayor de Istmina Y Parte Del Medio San Juan", "area": 32.2}, {"nombre": "Consejo Comunitario Mayor Del Municipio De Condoto", "area": 25631.3}], "ri_nombres": [{"nombre": "Resguardo Indígena Embera de  Alto Bonito Vira Vira", "area": 820.8}, {"nombre": "Resguardo Indígena Muchidó", "area": 209.7}]}, {"name": "Unión Panamericana", "area": 17006.7, "cc": 17006.7, "ri": 0, "st": 777.1, "num_cc": 5, "num_ri": 0, "cc_nombres": [{"nombre": "Consejo Comunitario de Cértegui", "area": 2099.2}, {"nombre": "Consejo Comunitario Mayor Unión Panamericana \"Cocomaupa\"", "area": 13739.2}, {"nombre": "Consejo Comunitario Mayor Del Alto San Juan \"Asocasan\"", "area": 2.5}, {"nombre": "Consejo Comunitario Mayor Del Cantón De San Pablo \"Acisanp\"", "area": 1069.2}, {"nombre": "Consejo Comunitario Mayor de Istmina Y Parte Del Medio San Juan", "area": 96.5}], "ri_nombres": []}], "narino": [{"name": "Tumaco", "area": 256599.8, "cc": 209455.3, "ri": 47144.5, "st": 104436.8, "num_cc": 23, "num_ri": 18, "cc_nombres": [{"nombre": "Consejo Comuntario El Progreso", "area": 0.0}, {"nombre": "Consejo Comunitario  Veredas Unidas: Un Bien Comun", "area": 4617.4}, {"nombre": "Consejo Comunitario del Rio Patía Grande, sus brazos y la ensenada de Tumaco - Acapa", "area": 31139.3}, {"nombre": "Consejo Comunitario Agricultores Del Patía Grande", "area": 0.0}, {"nombre": "Consejo Comunitario Manos Unidas Del Socorro", "area": 2925.2}, {"nombre": "Consejo Comunitario Unión De Cuencas De Isagualpi", "area": 10316.5}, {"nombre": "Consejo Comunitario Imbilpí Del Carmen", "area": 2766.8}, {"nombre": "Consejo Comunitario La Nupa Del Río Caunapí", "area": 176.9}, {"nombre": "Consejo Comunitario del Rio Gualajo", "area": 2594.2}, {"nombre": "Consejo Comunitario Tablon Salado", "area": 3031.5}, {"nombre": "Consejo Comunitario Unión Del Río Chaguí", "area": 23083.6}, {"nombre": "Consejo Comunitario Union Del Rio Rosario", "area": 11259.3}, {"nombre": "Consejo Comunitario Bajo Mira y Frontera", "area": 47327.1}, {"nombre": "Consejo Comunitario El Recuerdo De Nuestros Ancestros Del Río Mejicano", "area": 14341.7}, {"nombre": "Consejo Comunitario unión Bajo Río Guelmambí", "area": 2.9}, {"nombre": "Consejo Comunitario del Rio Tablon Dulce", "area": 1111.1}, {"nombre": "Consejo Comunitario Cortina Verde Mandela", "area": 1664.5}, {"nombre": "Consejo Comunitario La Gran Minga De Los Ríos Inguambí Y Albí", "area": 254.2}, {"nombre": "Consejo Comunitario Rescate Las Varas", "area": 13677.6}, {"nombre": "Consejo Comunitario de La Nueva Reserva Acanure", "area": 4792.5}, {"nombre": "Consejo Comunitario Union Rio Caunapi", "area": 8944.4}, {"nombre": "Consejo Comunitario Alto Mira Y Frontera", "area": 25408.0}, {"nombre": "Consejo Comunitario El Naranjo", "area": 20.6}], "ri_nombres": [{"nombre": "Resguardo Indígena Awa de Chinguirito Mira", "area": 803.6}, {"nombre": "Resguardo Indígena Cuayquer o Awa del Alto Albi", "area": 0.0}, {"nombre": "Resguardo Indígena Awa de El Cedro, Las Peñas, La Brava, Pilví y La Pintada", "area": 5026.5}, {"nombre": "Resguardo Indígena Awa de El Gran Sabalo", "area": 75.3}, {"nombre": "Resguardo Indígena Awa Gran Rosario", "area": 17116.1}, {"nombre": "Resguardo Indígena Awa de Inda Guacaray", "area": 1239.3}, {"nombre": "Resguardo Indígena Awa de Inda Zabaleta", "area": 6564.5}, {"nombre": "Resguardo Indígena Awa de Kejuambi Feliciana", "area": 2166.3}, {"nombre": "Resguardo Indígena Awa de la Turbia", "area": 2804.1}, {"nombre": "Resguardo Indígena Awa de Peña La Alegria", "area": 31.2}, {"nombre": "Resguardo Indígena Awa Piedra Sellada - Quebrada Tronqueria", "area": 1570.1}, {"nombre": "Resguardo Indígena Awa  de Piguambi Palangala", "area": 490.0}, {"nombre": "Resguardo Indígena Awa de Pulgande Campo Alegre", "area": 1074.3}, {"nombre": "Resguardo Indígena Eperara Siapidara de San Agustin La Floresta", "area": 51.3}, {"nombre": "Resguardo Indígena Awa de Santa Rosita", "area": 404.3}, {"nombre": "Resguardo Indígena Awa de Saunde Guiguay", "area": 7357.4}, {"nombre": "Resguardo Indígena Alto Peñalisa", "area": 306.2}, {"nombre": "Resguardo Indígena El Arenal", "area": 64.0}]}, {"name": "Barbacoas", "area": 246486.8, "cc": 104944.5, "ri": 141542.3, "st": 27103.6, "num_cc": 15, "num_ri": 26, "cc_nombres": [{"nombre": "Consejo Comunitario La Amistad", "area": 448.4}, {"nombre": "Consejo Comunitario Manos Unidas Del Socorro", "area": 6840.0}, {"nombre": "Consejo Comunitario Unión De Cuencas De Isagualpi", "area": 0.0}, {"nombre": "Consejo Comunitario Integración De Telembí", "area": 1485.7}, {"nombre": "Consejo Comunitario unión Bajo Río Guelmambí", "area": 9514.2}, {"nombre": "Consejo Comunitario Alejandro Rincon Del Rio Ñambí", "area": 9912.0}, {"nombre": "Consejo Comunitario La Gran Minga De Los Ríos Inguambí Y Albí", "area": 1426.9}, {"nombre": "Consejo Comunitario de la Nueva Alianza", "area": 10384.9}, {"nombre": "Consejo Comunitario de La Gran Unión Del Rio Telpi", "area": 7432.9}, {"nombre": "Consejo Comunitario de La Nueva Reserva Acanure", "area": 7755.7}, {"nombre": "Consejo Comunitario de La Nueva Esperanza", "area": 15015.6}, {"nombre": "Consejo Comunitario Renacer Campesino", "area": 6778.2}, {"nombre": "Consejo Comunitario Brisas Del Alto Telembí", "area": 19267.6}, {"nombre": "Consejo Comunitario El Bien Del Futuro", "area": 3485.5}, {"nombre": "Consejo Comunitario Renacer Telembí", "area": 5196.8}], "ri_nombres": [{"nombre": "Resguardo Indígena Awa Ñambi Piedra Verde", "area": 7376.3}, {"nombre": "Resguardo Indígena Awa de Chagui, Chimbuza, Vegas, San Antonio, Candiyas, Quelbi, Nalbu, Balsal, Bajo Nembiy Chapilal Cimarron", "area": 4013.5}, {"nombre": "Resguardo Indígena Chimbagal", "area": 394.5}, {"nombre": "Resguardo Indígena Awa de Cuaiquer Integrado La Milagrosa", "area": 19.5}, {"nombre": "Resguardo Indígena Cuaiquuier de los parajes Cuambi y Yaslambi", "area": 2546.4}, {"nombre": "Resguardo Indígena Awa Kwaiker de Cuasbi - La Faldada", "area": 1169.8}, {"nombre": "Resguardo Indígena Cuayquer o Awa del Alto Albi", "area": 4369.8}, {"nombre": "Resguardo Indígena Awa de El Gran Sabalo", "area": 42706.1}, {"nombre": "Resguardo Indígena Awa de Gualcalá", "area": 13.4}, {"nombre": "Resguardo Indígena Awa de Guelmambi - Caraño", "area": 2603.3}, {"nombre": "Resguardo Indígena Awa de Honda Rio Guiza", "area": 334.4}, {"nombre": "Resguardo Indígena Awa de Kejuambi Feliciana", "area": 38.7}, {"nombre": "Resguardo Indígena Awa de la Turbia", "area": 25623.9}, {"nombre": "Resguardo Indígena Awa de Nulpe Medio-Alto y Rio San Juan", "area": 1346.7}, {"nombre": "Resguardo Indígena Awa de Nunalbi Alto Ulbi", "area": 9697.0}, {"nombre": "Resguardo Indígena Awa de Palmar Imbi", "area": 3010.2}, {"nombre": "Resguardo Indígena Awa  de Piguambi Palangala", "area": 13.7}, {"nombre": "Resguardo Indígena Awa de Pingullo Sardinero", "area": 8451.7}, {"nombre": "Resguardo Indígena Awa de Pipalta - Palbi - Yaguapi", "area": 2624.1}, {"nombre": "Resguardo Indígena Awa de Planadas De Telembi", "area": 0.6}, {"nombre": "Resguardo Indígena Awa de Ramos - Mongon - Manchuria", "area": 0.2}, {"nombre": "Resguardo Indígena Awa de Saunde Guiguay", "area": 0.2}, {"nombre": "Resguardo Indígena Awa de Tortugaña,Telembi, Punde, Pitadero, Bravo, Tronqueria y Zabaleta", "area": 13968.9}, {"nombre": "Resguardo Indígena Awa de Tronqueria, Pulgande y Palicito", "area": 10586.4}, {"nombre": "Resguardo Indígena Guelmambi El Bombo", "area": 628.1}, {"nombre": "Resguardo Indígena La Montaña", "area": 5.1}]}, {"name": "El Charco", "area": 209680.3, "cc": 204788.2, "ri": 4892.1, "st": 39689.5, "num_cc": 11, "num_ri": 4, "cc_nombres": [{"nombre": "Consejo Comunitario del Alto Guapi", "area": 38.9}, {"nombre": "Consejo Comunitario del Río San Francisco", "area": 848.1}, {"nombre": "Consejo Comunitario El Progreso Del Campo", "area": 3592.6}, {"nombre": "Consejo Comunitario Manos Amigas Del Patía Grande", "area": 1844.1}, {"nombre": "Consejo Comunitario del Río Satinga", "area": 34.4}, {"nombre": "Consejo Comunitario La Esperanza", "area": 609.3}, {"nombre": "Consejo Comunitario Para El Desarrollo Integral de las Comunidades Negras de la Cordillera Occidental de Nariño  \"COPDICONC\"", "area": 80817.1}, {"nombre": "Consejo Comunitario El Progreso Del Río Nerete", "area": 69.4}, {"nombre": "Consejo Comunitario Alto Río Sequihonda", "area": 5383.5}, {"nombre": "Consejo Comunitario De La Cuenca Del Río Iscuandé", "area": 4138.8}, {"nombre": "Consejo Comunitario Pro-Defensa Del Río Tapaje", "area": 107412.2}], "ri_nombres": [{"nombre": "Resguardo Indígena Trua Integrado Del Charco", "area": 3703.6}, {"nombre": "Resguardo Indígena Eperara Siapidara de Maiz Blanco", "area": 143.1}, {"nombre": "Resguardo Indígena Eperara Siapidaara de Morrito", "area": 912.1}, {"nombre": "Resguardo Indígena Eperara - Siapidaara de Quebrada Grande", "area": 133.2}]}, {"name": "Magüí", "area": 168901.9, "cc": 168077.1, "ri": 824.8, "st": 12159.2, "num_cc": 12, "num_ri": 1, "cc_nombres": [{"nombre": "Consejo Comunitario de Unión Patía Viejo", "area": 17839.8}, {"nombre": "Consejo Comunitario La Amistad", "area": 18380.7}, {"nombre": "Consejo Comunitario Manos Amigas Del Patía Grande", "area": 64326.4}, {"nombre": "Consejo Comunitario del Río Satinga", "area": 7.2}, {"nombre": "Consejo Comunitario Catangueros", "area": 0.0}, {"nombre": "Consejo Comunitario Integración De Telembí", "area": 5100.4}, {"nombre": "Consejo Comunitario Pro-Defensa Del Río Tapaje", "area": 36958.8}, {"nombre": "Consejo Comunitario La Voz De Los Negros", "area": 21608.1}, {"nombre": "Consejo Comunitario de la Nueva Alianza", "area": 876.5}, {"nombre": "Consejo Comunitario Brisas Del Alto Telembí", "area": 215.1}, {"nombre": "Consejo Comunitario El Bien Del Futuro", "area": 739.1}, {"nombre": "Consejo Comunitario Renacer Telembí", "area": 2025.1}], "ri_nombres": [{"nombre": "Resguardo Indígena Embera (Eperara-Siapidara) de el Turbio y Bacao (Rio Satinga)", "area": 824.8}]}, {"name": "Roberto Payán", "area": 142950.6, "cc": 141886.9, "ri": 1063.7, "st": 3053.2, "num_cc": 11, "num_ri": 2, "cc_nombres": [{"nombre": "Consejo Comuntario El Progreso", "area": 28071.2}, {"nombre": "Consejo Comunitario de Unión Patía Viejo", "area": 15638.1}, {"nombre": "Consejo Comunitario del Rio Patía Grande, sus brazos y la ensenada de Tumaco - Acapa", "area": 2983.3}, {"nombre": "Consejo Comunitario Agricultores Del Patía Grande", "area": 31853.7}, {"nombre": "Consejo Comunitario Unión De Cuencas De Isagualpi", "area": 24783.4}, {"nombre": "Consejo Comunitario Catangueros", "area": 21850.3}, {"nombre": "Consejo Comunitario Integración De Telembí", "area": 9902.2}, {"nombre": "Consejo Comunitario Unión Del Río Chaguí", "area": 5543.2}, {"nombre": "Consejo Comunitario La Gran Minga De Los Ríos Inguambí Y Albí", "area": 821.9}, {"nombre": "Consejo Comunitario La Voz De Los Negros", "area": 438.8}, {"nombre": "Consejo Comunitario El Bien Del Futuro", "area": 0.9}], "ri_nombres": [{"nombre": "Resguardo Indígena Awa Gran Rosario", "area": 578.2}, {"nombre": "Resguardo Indígena Awa de Saunde Guiguay", "area": 485.5}]}, {"name": "Santa Bárbara", "area": 106734.7, "cc": 106039.9, "ri": 694.8, "st": 15877.9, "num_cc": 8, "num_ri": 2, "cc_nombres": [{"nombre": "Consejo Comunitario del Alto Guapi", "area": 316.4}, {"nombre": "Consejo Comunitario de Unicosta", "area": 15812.5}, {"nombre": "Consejo Comunitario de Guapí Abajo", "area": 178.2}, {"nombre": "Consejo Comunitario Para El Desarrollo Integral de las Comunidades Negras de la Cordillera Occidental de Nariño  \"COPDICONC\"", "area": 13628.0}, {"nombre": "Consejo Comunitario Alto Río Sequihonda", "area": 3957.8}, {"nombre": "Consejo Comunitario de Chanzará", "area": 2534.0}, {"nombre": "Consejo Comunitario De La Cuenca Del Río Iscuandé", "area": 62961.1}, {"nombre": "Consejo Comunitario Pro-Defensa Del Río Tapaje", "area": 6651.9}], "ri_nombres": [{"nombre": "Resguardo Indígena Trua Integrado Del Charco", "area": 49.2}, {"nombre": "Resguardo Indígena Eperara - Siapidaara de Quebrada Grande", "area": 645.7}]}, {"name": "Ricaurte", "area": 87235.4, "cc": 0, "ri": 87235.4, "st": 18408.3, "num_cc": 0, "num_ri": 17, "cc_nombres": [], "ri_nombres": [{"nombre": "Resguardo Indígena Awa de  Alto Cartagena", "area": 4592.1}, {"nombre": "Resguardo Indígena Awa de Chagui, Chimbuza, Vegas, San Antonio, Candiyas, Quelbi, Nalbu, Balsal, Bajo Nembiy Chapilal Cimarron", "area": 496.6}, {"nombre": "Resguardo Indígena Awa de Cuaiquer Integrado La Milagrosa", "area": 4158.5}, {"nombre": "Resguardo Indígena Awa de Cuasbi - Paldubi", "area": 569.2}, {"nombre": "Resguardo Indígena Awa de Cuchilla Palmar", "area": 2782.6}, {"nombre": "Resguardo Indígena Awa El Sande", "area": 816.4}, {"nombre": "Resguardo Indígena Awa de Guadual, Cumbas, Magui, Invina, Arrayan", "area": 6599.4}, {"nombre": "Resguardo Indígena Awa de Gualcalá", "area": 15416.7}, {"nombre": "Resguardo Indígena Awa de Nulpe Medio-Alto y Rio San Juan", "area": 27376.9}, {"nombre": "Resguardo Indígena Awa de Palmar Imbi", "area": 4977.9}, {"nombre": "Resguardo Indígena Awa de Pialapi - Pueblo Viejo - San Miguel - Yare", "area": 5307.8}, {"nombre": "Resguardo Indígena Awa de Pingullo Sardinero", "area": 1757.1}, {"nombre": "Resguardo Indígena Awa de Planadas De Telembi", "area": 2.6}, {"nombre": "Resguardo Indígena Awa de Ramos - Mongon - Manchuria", "area": 4810.3}, {"nombre": "Resguardo Indígena Awa de Tortugaña,Telembi, Punde, Pitadero, Bravo, Tronqueria y Zabaleta", "area": 7454.3}, {"nombre": "Resguardo Indígena Awa de Tronqueria, Pulgande y Palicito", "area": 7.0}, {"nombre": "Resguardo Indígena Integrado Eden Cartagena", "area": 109.9}]}, {"name": "Olaya Herrera", "area": 75071.5, "cc": 64839.6, "ri": 10231.9, "st": 25395.2, "num_cc": 6, "num_ri": 3, "cc_nombres": [{"nombre": "Consejo Comunitario de Unión Patía Viejo", "area": 8101.7}, {"nombre": "Consejo Comunitario El Progreso Del Campo", "area": 274.5}, {"nombre": "Consejo Comunitario del Río Satinga", "area": 19582.9}, {"nombre": "Consejo Comunitario del Río Sanquianga", "area": 26928.0}, {"nombre": "Consejo Comunitario El Progreso Del Río Nerete", "area": 4400.6}, {"nombre": "Consejo Comunitario Gualmar", "area": 5552.0}], "ri_nombres": [{"nombre": "Resguardo Indígena Embera (Eperara - Siapidara) de La Floresta, Sta Rosa y San Francisco", "area": 8537.2}, {"nombre": "Resguardo Indígena Embera (Eperara-Siapidara) de el Turbio y Bacao (Rio Satinga)", "area": 1502.4}, {"nombre": "Resguardo Indígena Eperara Siapidara de Sanquianguita", "area": 192.4}]}, {"name": "Los Andes", "area": 55112, "cc": 55112, "ri": 0, "st": 28189.3, "num_cc": 1, "num_ri": 0, "cc_nombres": [{"nombre": "Consejo Comunitario Brisas Del Alto Telembí", "area": 55112.0}], "ri_nombres": []}, {"name": "Mosquera", "area": 39535.5, "cc": 38692.5, "ri": 843, "st": 37395.3, "num_cc": 6, "num_ri": 1, "cc_nombres": [{"nombre": "Consejo Comuntario El Progreso", "area": 7.2}, {"nombre": "Consejo Comunitario de Unión Patía Viejo", "area": 3.3}, {"nombre": "Consejo Comunitario  Veredas Unidas: Un Bien Comun", "area": 8025.9}, {"nombre": "Consejo Comunitario del Rio Patía Grande, sus brazos y la ensenada de Tumaco - Acapa", "area": 5949.0}, {"nombre": "Consejo Comunitario del Río Sanquianga", "area": 6043.8}, {"nombre": "Consejo Comunitario Odemap Mosquera Sur", "area": 18663.3}], "ri_nombres": [{"nombre": "Resguardo Indígena Eperara Siapidara de Sanquianguita", "area": 843.0}]}, {"name": "Cumbal", "area": 7857.2, "cc": 0, "ri": 7857.2, "st": 58607.2, "num_cc": 0, "num_ri": 1, "cc_nombres": [], "ri_nombres": [{"nombre": "Resguardo Indígena Awa de Nulpe Medio-Alto y Rio San Juan", "area": 7857.2}]}, {"name": "Mallama", "area": 1775, "cc": 0, "ri": 1775, "st": 55206.4, "num_cc": 0, "num_ri": 3, "cc_nombres": [], "ri_nombres": [{"nombre": "Resguardo Indígena Awa de  Alto Cartagena", "area": 0.3}, {"nombre": "Resguardo Indígena Awa de Gualcalá", "area": 1540.8}, {"nombre": "Resguardo Indígena Awa de Tortugaña,Telembi, Punde, Pitadero, Bravo, Tronqueria y Zabaleta", "area": 233.9}]}, {"name": "Francisco Pizarro", "area": 43253.5, "cc": 43253.5, "ri": 0, "st": 9354.8, "num_cc": 2, "num_ri": 0, "cc_nombres": [{"nombre": "Consejo Comuntario El Progreso", "area": 0.0}, {"nombre": "Consejo Comunitario del Rio Patía Grande, sus brazos y la ensenada de Tumaco - Acapa", "area": 43253.5}], "ri_nombres": []}, {"name": "Samaniego", "area": 42111.8, "cc": 28.8, "ri": 42083, "st": 2179.8, "num_cc": 1, "num_ri": 5, "cc_nombres": [{"nombre": "Consejo Comunitario Brisas Del Alto Telembí", "area": 28.8}], "ri_nombres": [{"nombre": "Resguardo Indígena Awa El Sande", "area": 22.9}, {"nombre": "Resguardo Indígena Awa de Planadas De Telembi", "area": 3060.7}, {"nombre": "Resguardo Indígena Awa de Tortugaña,Telembi, Punde, Pitadero, Bravo, Tronqueria y Zabaleta", "area": 2.5}, {"nombre": "Resguardo Indígena Awa de Tronqueria, Pulgande y Palicito", "area": 1.2}, {"nombre": "Resguardo Indígena La Montaña", "area": 38995.7}]}, {"name": "Santa Cruz", "area": 9011.8, "cc": 0, "ri": 9011.8, "st": 34446.5, "num_cc": 0, "num_ri": 4, "cc_nombres": [], "ri_nombres": [{"nombre": "Resguardo Indígena Awa El Sande", "area": 7957.0}, {"nombre": "Resguardo Indígena Awa de Gualcalá", "area": 305.7}, {"nombre": "Resguardo Indígena Awa de Tortugaña,Telembi, Punde, Pitadero, Bravo, Tronqueria y Zabaleta", "area": 432.5}, {"nombre": "Resguardo Indígena La Montaña", "area": 316.6}]}, {"name": "La Tola", "area": 22049, "cc": 20385, "ri": 1664, "st": 19604.2, "num_cc": 7, "num_ri": 2, "cc_nombres": [{"nombre": "Consejo Comunitario de Unión Patía Viejo", "area": 8.8}, {"nombre": "Consejo Comunitario El Progreso Del Campo", "area": 5421.3}, {"nombre": "Consejo Comunitario del Río Satinga", "area": 4866.8}, {"nombre": "Consejo Comunitario La Esperanza", "area": 2862.4}, {"nombre": "Consejo Comunitario El Progreso Del Río Nerete", "area": 6073.3}, {"nombre": "Consejo Comunitario Gualmar", "area": 15.0}, {"nombre": "Consejo Comunitario Pro-Defensa Del Río Tapaje", "area": 1137.5}], "ri_nombres": [{"nombre": "Resguardo Indígena Embera (Eperara-Siapidara) de el Turbio y Bacao (Rio Satinga)", "area": 1622.1}, {"nombre": "Resguardo Indígena Eperara Siapidara  de San Juan de Pampon", "area": 41.9}]}, {"name": "El Rosario", "area": 26468.3, "cc": 26468.3, "ri": 0, "st": 10206.1, "num_cc": 1, "num_ri": 0, "cc_nombres": [{"nombre": "Consejo Comunitario Para El Desarrollo Integral de las Comunidades Negras de la Cordillera Occidental de Nariño  \"COPDICONC\"", "area": 26468.3}], "ri_nombres": []}, {"name": "Cumbitara", "area": 1493.8, "cc": 1493.8, "ri": 0, "st": 34061.3, "num_cc": 2, "num_ri": 0, "cc_nombres": [{"nombre": "Consejo Comunitario Para El Desarrollo Integral de las Comunidades Negras de la Cordillera Occidental de Nariño  \"COPDICONC\"", "area": 1436.3}, {"nombre": "Consejo Comunitario Brisas Del Alto Telembí", "area": 57.4}], "ri_nombres": []}, {"name": "Policarpa", "area": 12116.1, "cc": 12116.1, "ri": 0, "st": 22329.1, "num_cc": 1, "num_ri": 0, "cc_nombres": [{"nombre": "Consejo Comunitario Para El Desarrollo Integral de las Comunidades Negras de la Cordillera Occidental de Nariño  \"COPDICONC\"", "area": 12116.1}], "ri_nombres": []}, {"name": "La Llanada", "area": 4355.0, "cc": 4353.5, "ri": 1.5, "st": 16149.7, "num_cc": 1, "num_ri": 1, "cc_nombres": [{"nombre": "Consejo Comunitario Brisas Del Alto Telembí", "area": 4353.5}], "ri_nombres": [{"nombre": "Resguardo Indígena La Montaña", "area": 1.5}]}, {"name": "Leiva", "area": 42, "cc": 42, "ri": 0, "st": 10036.8, "num_cc": 1, "num_ri": 0, "cc_nombres": [{"nombre": "Consejo Comunitario Para El Desarrollo Integral de las Comunidades Negras de la Cordillera Occidental de Nariño  \"COPDICONC\"", "area": 42.0}], "ri_nombres": []}, {"name": "Sapuyes", "area": 0, "cc": 0, "ri": 0, "st": 1185.7, "num_cc": 0, "num_ri": 0, "cc_nombres": [], "ri_nombres": []}], "antioquia": [{"name": "Turbo", "area": 49762.6, "cc": 42145.8, "ri": 7616.8, "st": 238871.2, "num_cc": 5, "num_ri": 4, "cc_nombres": [{"nombre": "Consejo Comunitario de Bocas De Atrato y Leoncito", "area": 34443.7}, {"nombre": "Consejo Comunitario de Los Mangos", "area": 365.7}, {"nombre": "Consejo Comunitario de Los Ríos La Larga Y Tumaradó", "area": 0.5}, {"nombre": "Consejo Comunitario Manatíes", "area": 4409.8}, {"nombre": "Consejo Comunitario Mayor Del Bajo Atrato", "area": 2926.1}], "ri_nombres": [{"nombre": "Resguardo Indígena Caiman Nuevo", "area": 6771.0}, {"nombre": "Resguardo Indígena Embera de Dokerazavi", "area": 784.6}, {"nombre": "Resguardo Indígena Rio Alto De San Juan", "area": 7.7}, {"nombre": "Resguardo Indígena El Mango del Pueblo Senú", "area": 53.5}]}, {"name": "Urrao", "area": 55047.2, "cc": 17292.2, "ri": 37755, "st": 201337.8, "num_cc": 2, "num_ri": 8, "cc_nombres": [{"nombre": "Consejo Comunitario Mayor Del Medio Atrato - Acia", "area": 9139.1}, {"nombre": "Consejo Comunitario Por La Identidad Cultural", "area": 8153.1}], "ri_nombres": [{"nombre": "Resguardo Indígena Embera-Katio de Andabu", "area": 23502.9}, {"nombre": "Resguardo Indígena Emebra - Katio de Chaquenoda", "area": 0.6}, {"nombre": "Resguardo Indígena Embera de El Salado", "area": 27.9}, {"nombre": "Resguardo Indígena Embera de Guaguando", "area": 49.6}, {"nombre": "Resguardo Indígena Embera-Katio de Majoré- Ambura", "area": 7065.6}, {"nombre": "Resguardo Indígena Murri-pantanos", "area": 2570.9}, {"nombre": "Resguardo Indígena Embera - Katio de Valle De Perdidas", "area": 4434.9}, {"nombre": "Resguardo Indígena Embera del Rio Bebara", "area": 102.7}]}, {"name": "Dabeiba", "area": 78963.3, "cc": 113.9, "ri": 78849.4, "st": 116803.6, "num_cc": 1, "num_ri": 17, "cc_nombres": [{"nombre": "Consejo Comunitario del Río Jiguamiandó", "area": 113.9}], "ri_nombres": [{"nombre": "Resguardo Embera Katio de Cañaverales - Antado", "area": 4975.6}, {"nombre": "Resguardo Indígena Emebra - Katio de Chaquenoda", "area": 798.5}, {"nombre": "Resguardo Indígena Embera - Katio de Chontadural - Cañero", "area": 65.0}, {"nombre": "Resguardo Indígena Embera- Katio de Choromando Alto y Medio", "area": 3059.2}, {"nombre": "Resguardo Indígena Embera de Chuscal y Tuguridocito", "area": 4727.9}, {"nombre": "Resguardo Indígena Embera Drua", "area": 17.1}, {"nombre": "Resguardo Indígena Embera-Katio de Jenaturado", "area": 570.3}, {"nombre": "Resguardo Indígena Embera - Catio de \"El Pital\" - Narikizavi", "area": 276.2}, {"nombre": "Resguardo Indígena Embera Katio del Rio Murindo", "area": 47.9}, {"nombre": "Resguardo Indígena Murri-pantanos", "area": 445.0}, {"nombre": "Resguardo Indígena Embera de los Rios Pavarando y Amparrado Medio", "area": 22071.4}, {"nombre": "Resguardo Indígena Embera - Catio del Rio Chajerado", "area": 797.8}, {"nombre": "Resguardo Indígena Embera Katio de Sever", "area": 10184.0}, {"nombre": "Resguardo Indígena Embera-Katio  de Amparrado Alto Medio", "area": 17411.8}, {"nombre": "Resguardo Indígena Embera Catio de Choromando Bajo y la Lejia \"Monzhomando\"", "area": 187.4}, {"nombre": "Resguardo Indígena Embera de Chimurro y Nendo", "area": 13207.5}, {"nombre": "Resguardo Indígena Embera de Urada Jiguamiando", "area": 6.9}]}, {"name": "Vigía Del Fuerte", "area": 163023.1, "cc": 116470.4, "ri": 46552.7, "st": 3249.9, "num_cc": 2, "num_ri": 8, "cc_nombres": [{"nombre": "Consejo Comunitario Mayor Del Medio Atrato - Acia", "area": 116470.3}, {"nombre": "Consejo Comunitario de Vígia De Curvaradó y Santa Rosa De Limón", "area": 0.2}], "ri_nombres": [{"nombre": "Resguardo Indígena Embera-Katio de Andabu", "area": 5.4}, {"nombre": "Resguardo Indígena Embera de El Salado", "area": 18200.9}, {"nombre": "Resguardo Indígena Embera de Guaguando", "area": 13973.9}, {"nombre": "Resguardo Indígena Embera de los Rios Jengado-Apartado", "area": 5005.6}, {"nombre": "Resguardo Indígena Murri-pantanos", "area": 3557.3}, {"nombre": "Resguardo Indígena Embera - Catio del Rio Chajerado", "area": 196.3}, {"nombre": "Resguardo Indígena Embera del Rio Jarapeto", "area": 5597.5}, {"nombre": "Resguardo Indígena Embera del Rio Bebara", "area": 15.7}]}, {"name": "Frontino", "area": 48123.6, "cc": 4455.5, "ri": 43668.1, "st": 90322, "num_cc": 2, "num_ri": 9, "cc_nombres": [{"nombre": "Consejo Comunitario Mayor Del Medio Atrato - Acia", "area": 2.1}, {"nombre": "Consejo Comunitario Por La Identidad Cultural", "area": 4453.4}], "ri_nombres": [{"nombre": "Resguardo Embera Katio de Cañaverales - Antado", "area": 23.8}, {"nombre": "Resguardo Indígena Emebra - Katio de Chaquenoda", "area": 14370.5}, {"nombre": "Resguardo Indígena Embera de Chuscal y Tuguridocito", "area": 27.1}, {"nombre": "Resguardo Indígena Embera-Katio de Jenaturado", "area": 26.3}, {"nombre": "Resguardo Indígena Murri-pantanos", "area": 24328.8}, {"nombre": "Resguardo Indígena Embera de Nusido", "area": 261.3}, {"nombre": "Resguardo Indígena Embera - Catio del Rio Chajerado", "area": 7.3}, {"nombre": "Resguardo Indígena Embera-Katio  de Amparrado Alto Medio", "area": 362.9}, {"nombre": "Resguardo Indígena Embera - Katio de Valle De Perdidas", "area": 4260.1}]}, {"name": "Murindó", "area": 121603.8, "cc": 62370.3, "ri": 59233.5, "st": 5080.2, "num_cc": 6, "num_ri": 6, "cc_nombres": [{"nombre": "Consejo Comunitario Mayor Del Medio Atrato - Acia", "area": 50604.2}, {"nombre": "Consejo Comunitario de La Grande", "area": 0.1}, {"nombre": "Consejo Comunitario del Río Jiguamiandó", "area": 91.6}, {"nombre": "Consejo Comunitario de Turriquitadó", "area": 33.0}, {"nombre": "Consejo Comunitario de Vígia De Curvaradó y Santa Rosa De Limón", "area": 11.7}, {"nombre": "Consejo Comunitario Por El Desarrollo Integral", "area": 11629.6}], "ri_nombres": [{"nombre": "Resguardo Indígena Embera Katio del Rio Murindo", "area": 18190.9}, {"nombre": "Resguardo Indígena Murri-pantanos", "area": 16.8}, {"nombre": "Resguardo Indígena Embera de los Rios Pavarando y Amparrado Medio", "area": 23.1}, {"nombre": "Resguardo Indígena Embera - Catio del Rio Chajerado", "area": 40903.8}, {"nombre": "Resguardo Indígena Embera-Katio  de Amparrado Alto Medio", "area": 48.3}, {"nombre": "Resguardo Indígena Embera de Urada Jiguamiando", "area": 50.6}]}, {"name": "Mutatá", "area": 40178.3, "cc": 0, "ri": 40178.3, "st": 67348.3, "num_cc": 0, "num_ri": 6, "cc_nombres": [], "ri_nombres": [{"nombre": "Resguardo Indígena Embera - Katio de Chontadural - Cañero", "area": 5330.3}, {"nombre": "Resguardo Indígena Coribi Bedado", "area": 105.6}, {"nombre": "Resguardo Indígena Embera-Katio de Jaikerazavi", "area": 34689.0}, {"nombre": "Resguardo Indígena Embera de los Rios Pavarando y Amparrado Medio", "area": 0.0}, {"nombre": "Resguardo Indígena Embera Katio de Sever", "area": 35.1}, {"nombre": "Resguardo Indígena Yaberarado", "area": 18.3}]}, {"name": "Necoclí", "area": 2318.1, "cc": 0, "ri": 2318.1, "st": 103594.7, "num_cc": 0, "num_ri": 1, "cc_nombres": [], "ri_nombres": [{"nombre": "Resguardo Indígena Caiman Nuevo", "area": 2318.1}]}, {"name": "Ituango", "area": 6323, "cc": 0, "ri": 6323, "st": 76005.8, "num_cc": 0, "num_ri": 2, "cc_nombres": [], "ri_nombres": [{"nombre": "Resguardo Indígena Embera-Katio de Jaikerazavi", "area": 531.9}, {"nombre": "Resguardo Indígena Embera-Katio de Iwagado", "area": 5791.1}]}, {"name": "Chigorodó", "area": 12675, "cc": 0, "ri": 12675, "st": 59523.2, "num_cc": 0, "num_ri": 2, "cc_nombres": [], "ri_nombres": [{"nombre": "Resguardo Indígena Embera-Katio de Polines", "area": 4263.5}, {"nombre": "Resguardo Indígena Yaberarado", "area": 8411.5}]}, {"name": "Apartadó", "area": 529, "cc": 0, "ri": 529, "st": 53007.5, "num_cc": 0, "num_ri": 2, "cc_nombres": [], "ri_nombres": [{"nombre": "Resguardo Indígena Embera Chami y Zenu De La Palma", "area": 327.8}, {"nombre": "Resguardo Indígena Embera-Katio de Las Playas", "area": 201.2}]}, {"name": "Carepa", "area": 0.5, "cc": 0, "ri": 0.5, "st": 38743, "num_cc": 0, "num_ri": 1, "cc_nombres": [], "ri_nombres": [{"nombre": "Resguardo Indígena Embera-Katio de Polines", "area": 0.5}]}, {"name": "Cañasgordas", "area": 0, "cc": 0, "ri": 0, "st": 36483.9, "num_cc": 0, "num_ri": 0, "cc_nombres": [], "ri_nombres": []}, {"name": "Abriaquí", "area": 0, "cc": 0, "ri": 0, "st": 29697.4, "num_cc": 0, "num_ri": 0, "cc_nombres": [], "ri_nombres": []}, {"name": "Uramita", "area": 137.6, "cc": 0, "ri": 137.6, "st": 26456.1, "num_cc": 0, "num_ri": 1, "cc_nombres": [], "ri_nombres": [{"nombre": "Resguardo Indígena Emebera-Katio de Santa Maria -  El Charcon", "area": 137.6}]}, {"name": "San Pedro De Urabá", "area": 95.2, "cc": 0, "ri": 95.2, "st": 15164.6, "num_cc": 0, "num_ri": 1, "cc_nombres": [], "ri_nombres": [{"nombre": "Resguardo Indígena Rio Alto De San Juan", "area": 95.2}]}], "cauca": [{"name": "López", "area": 325100.0, "cc": 296004.6, "ri": 29095.4, "st": 11942.7, "num_cc": 9, "num_ri": 7, "cc_nombres": [{"nombre": "Consejo Comunitario Parte Baja Del Río Saija", "area": 1724.2}, {"nombre": "Consejo Comunitario de la Cuenca Del Río San Bernardo Patía Norte", "area": 951.1}, {"nombre": "Consejo Comunitario El Playon Del Río Siguí", "area": 43045.1}, {"nombre": "Consejo Comunitario Integración Del Río Chuare", "area": 25712.9}, {"nombre": "Consejo Comunitario de San Joc Parte Alta Del Río Micay", "area": 14485.7}, {"nombre": "Consejo Comunitario La Mamuncia, Parte Media Del Río Micay", "area": 34518.1}, {"nombre": "Consejo Comunitario Manglares Del Río Micay", "area": 39103.7}, {"nombre": "Consejo Comunitario del Rio Naya", "area": 136462.1}, {"nombre": "Consejo Comunitario de Comunidades Negras Afrorenacer del Micay", "area": 1.7}], "ri_nombres": [{"nombre": "Resguardo Indígena Eperara-Siapidara de Isla Del Mono", "area": 1387.6}, {"nombre": "Resguardo Indígena Embera La Iguana", "area": 10504.0}, {"nombre": "Resguardo Indígena Eperara Siapadara de Playa Bendita", "area": 4362.9}, {"nombre": "Resguardo Indígena Eperara Siapadara de Playita San Francisco", "area": 3234.9}, {"nombre": "Resguardo Indígena Embera - Cholo Del Rio Guangüi", "area": 127.0}, {"nombre": "Resguardo Indígena Emebera Calle Santa Rosa", "area": 8761.6}, {"nombre": "Resguardo Indígena Embera (Eperara) Rio Naya", "area": 717.4}]}, {"name": "Guapi", "area": 249450.9, "cc": 249405.7, "ri": 45.2, "st": 7637.8, "num_cc": 10, "num_ri": 1, "cc_nombres": [{"nombre": "Consejo Comunitario del Alto Guapi", "area": 92202.6}, {"nombre": "Consejo Comunitario del Rio Napi", "area": 38260.5}, {"nombre": "Consejo Comunitario del Río San Francisco", "area": 23919.6}, {"nombre": "Consejo Comunitario de Unicosta", "area": 0.0}, {"nombre": "Consejo Comunitario de Guapí Abajo", "area": 43961.6}, {"nombre": "Consejo Comunitario Renacer Negro", "area": 3578.7}, {"nombre": "Consejo Comunitario del Río Guajuí", "area": 35786.6}, {"nombre": "Consejo Comunitario Para El Desarrollo Integral de las Comunidades Negras de la Cordillera Occidental de Nariño  \"COPDICONC\"", "area": 476.8}, {"nombre": "Consejo Comunitario de Chanzará", "area": 838.4}, {"nombre": "Consejo Comunitario De La Cuenca Del Río Iscuandé", "area": 10381.0}], "ri_nombres": [{"nombre": "Resguardo Indígena Eperara Siapidara de Nueva Bellavista y Partidero", "area": 45.2}]}, {"name": "Timbiquí", "area": 200160.5, "cc": 153417.5, "ri": 46743, "st": 5818, "num_cc": 12, "num_ri": 6, "cc_nombres": [{"nombre": "Consejo Comunitario del Rio Napi", "area": 1841.7}, {"nombre": "Consejo Comunitario El Cuerval", "area": 5640.4}, {"nombre": "Consejo Comunitario Renacer Negro", "area": 61685.3}, {"nombre": "Consejo Comunitario del Río Guajuí", "area": 1017.5}, {"nombre": "Consejo Comunitario Negros En Acción", "area": 14383.8}, {"nombre": "Consejo Comunitario Negros Unidos", "area": 7359.6}, {"nombre": "Consejo Comunitario Parte Alta Sur Del Río Saija", "area": 20136.7}, {"nombre": "Consejo Comunitario Parte Baja Del Río Saija", "area": 14572.2}, {"nombre": "Consejo Comunitario de la Cuenca Del Río San Bernardo Patía Norte", "area": 25658.2}, {"nombre": "Consejo Comunitario de San Joc Parte Alta Del Río Micay", "area": 0.0}, {"nombre": "Consejo Comunitario La Mamuncia, Parte Media Del Río Micay", "area": 11.1}, {"nombre": "Consejo Comunitario de Comunidades Negras Afrorenacer del Micay", "area": 1111.2}], "ri_nombres": [{"nombre": "Resguardo Indígena Embera Almorzadero, San Isidro y la Nueva Union", "area": 4993.7}, {"nombre": "Resguardo Indígena Embera asentada en la Zona Infi", "area": 4173.2}, {"nombre": "Resguardo Indígena Eperara-Siapidara de Isla Del Mono", "area": 18.1}, {"nombre": "Resguardo Indígena Eperara Siapadara de Playa Bendita", "area": 95.2}, {"nombre": "Resguardo Indígena Embera - Cholo Del Rio Guangüi", "area": 24373.5}, {"nombre": "Resguardo Indígena Emebera Calle Santa Rosa", "area": 13089.2}]}, {"name": "El Tambo", "area": 31120.1, "cc": 31120.1, "ri": 0, "st": 129203.3, "num_cc": 3, "num_ri": 0, "cc_nombres": [{"nombre": "Consejo Comunitario de la Cuenca Del Río San Bernardo Patía Norte", "area": 0.0}, {"nombre": "Consejo Comunitario El Playon Del Río Siguí", "area": 3701.2}, {"nombre": "Consejo Comunitario de Comunidades Negras Afrorenacer del Micay", "area": 27418.9}], "ri_nombres": []}, {"name": "Argelia", "area": 15302.7, "cc": 15302.7, "ri": 0, "st": 62342.8, "num_cc": 5, "num_ri": 0, "cc_nombres": [{"nombre": "Consejo Comunitario del Rio Napi", "area": 8401.6}, {"nombre": "Consejo Comunitario del Río San Francisco", "area": 1756.8}, {"nombre": "Consejo Comunitario Renacer Negro", "area": 5071.0}, {"nombre": "Consejo Comunitario de la Cuenca Del Río San Bernardo Patía Norte", "area": 0.0}, {"nombre": "Consejo Comunitario Para El Desarrollo Integral de las Comunidades Negras de la Cordillera Occidental de Nariño  \"COPDICONC\"", "area": 73.3}], "ri_nombres": []}], "valle": [{"name": "Buenaventura", "area": 440776.6, "cc": 424985.4, "ri": 15791.2, "st": 188816.9, "num_cc": 43, "num_ri": 12, "cc_nombres": [{"nombre": "Consejo Comunitario Comunidad Negra de Bajo Potedó", "area": 2109.5}, {"nombre": "Consejo Comunitario Comunidad Negra Campo Hermoso", "area": 1217.5}, {"nombre": "Consejo Comunitario Comunidad Negra Guadualito", "area": 1090.5}, {"nombre": "Consejo Comunitario Comunidad Negra de Taparal", "area": 1722.6}, {"nombre": "Consejo Comunitario del Río Cajambre", "area": 74179.8}, {"nombre": "Consejo Comunitario del Río Mayorquín y Papayal", "area": 18216.1}, {"nombre": "Consejo Comunitario del Río Raposo", "area": 19801.7}, {"nombre": "Consejo Comunitario del Río Yurumanguí", "area": 52987.2}, {"nombre": "Consejo Comunitario del Medio, Bajo y Zona Costera del Juan \"ACADESAN\"", "area": 10.9}, {"nombre": "Consejo Comunitario de Agua Clara", "area": 12343.9}, {"nombre": "Consejo Comunitario de Brazitos y Amazonas", "area": 4032.0}, {"nombre": "Consejo Comunitario de Guaimía", "area": 1560.3}, {"nombre": "Consejo Comunitario de la Brea", "area": 1478.3}, {"nombre": "Consejo Comunitario de Limones", "area": 1373.4}, {"nombre": "Consejo Comunitario de Llano Bajo", "area": 4985.5}, {"nombre": "Consejo Comunitario Mayor Del Río Anchicaya", "area": 14540.1}, {"nombre": "Consejo Comunitario de la Cuenca Baja Del Rio Calima", "area": 55047.8}, {"nombre": "Consejo Comunitario de Sabaletas", "area": 12364.8}, {"nombre": "Consejo Comunitario de San Marcos", "area": 3700.4}, {"nombre": "Consejo Comunitario de Alto Potedó", "area": 1958.4}, {"nombre": "Consejo Comunitario La Plata - Bahía Málaga", "area": 37991.4}, {"nombre": "Consejo Comunitario de Calle Larga Río Dagua", "area": 1600.8}, {"nombre": "Consejo Comunitario de Citronela - Río Dagua", "area": 1311.0}, {"nombre": "Consejo Comunitario de Zacarias Río Dagua", "area": 1455.7}, {"nombre": "Consejo Comunitario Bazan - La Bocana", "area": 9393.6}, {"nombre": "Consejo Comunitario de Cordoba y San Cipriano", "area": 7312.7}, {"nombre": "Consejo Comunitario Mayor De La Cuenca Media y Alta Del Río Dagua", "area": 5408.0}, {"nombre": "Consejo Comunitario de Cabeceras Río San Juan", "area": 79.1}, {"nombre": "Consejo Comunitario de Cuellar Río San Juan", "area": 365.1}, {"nombre": "Consejo Comunitario de Malaguita Bajo San Juan", "area": 19.0}, {"nombre": "Consejo Comunitario de Bellavista", "area": 283.7}, {"nombre": "Consejo Comunitario de La Esperanza", "area": 1729.5}, {"nombre": "Consejo Comunitario de Caucana", "area": 1078.8}, {"nombre": "Consejo Comunitario de Gamboa", "area": 3037.7}, {"nombre": "Consejo Comunitario de Alto Rio Dagua Pacifico Cimarrones de Cisneros", "area": 2352.9}, {"nombre": "Consejo Comunitario de Puerto España y Miramar", "area": 9898.1}, {"nombre": "Consejo Comunitario de Chucheros Ensenada Del Tigre", "area": 5330.2}, {"nombre": "Consejo Comunitario de La Barra", "area": 3111.3}, {"nombre": "Consejo Comunitario del Rio Naya", "area": 42399.5}, {"nombre": "Consejo Comunutario Juanchaco", "area": 2033.7}, {"nombre": "Consejo Comunutario San Joaquin Aguadulce", "area": 2256.4}, {"nombre": "Consejo Comunitario de la Comunidad Negra de Ladrilleros", "area": 1481.9}, {"nombre": "Consejo Comunitario de la Comunidad Negra de la Vereda La Gloria", "area": 334.7}], "ri_nombres": [{"nombre": "Resguardo Indígena Eperara-Siapidara de Isla Del Mono", "area": 161.8}, {"nombre": "Resguardo Indígena Waunana de Cabeceras o Puerto Pizario", "area": 578.1}, {"nombre": "Resguardo Indígena Waunana de Nuevo Pitalito", "area": 1274.4}, {"nombre": "Resguardo Indígena Waunana de Papayo", "area": 2505.8}, {"nombre": "Resguardo Indígena Waunana  de Burujon o La Unión-San Bernardo", "area": 4892.0}, {"nombre": "Resguardo Indígena Waunana de Chachajo", "area": 1421.5}, {"nombre": "Resguardo Indígena Embera (Eperara Siapidara) Chonara Huena", "area": 461.4}, {"nombre": "Resguardo Indígena Waunana de Guayacan Santa Rosa", "area": 236.9}, {"nombre": "Resguardo Indígena Waunana del Rio Dagua", "area": 52.1}, {"nombre": "Resguardo Indígena Embera (Eperara) Rio Naya", "area": 1715.0}, {"nombre": "Resguardo Indígena Nasa Paez de Yu Yik Kwe", "area": 77.2}, {"nombre": "Resguardo Indígena Cerrito Bongo", "area": 2415.2}]}, {"name": "Dagua", "area": 8752.4, "cc": 5630.6, "ri": 3121.8, "st": 82954.9, "num_cc": 9, "num_ri": 2, "cc_nombres": [{"nombre": "Consejo Comunitario de Agua Clara", "area": 625.0}, {"nombre": "Consejo Comunitario de Limones", "area": 0.4}, {"nombre": "Consejo Comunitario de Llano Bajo", "area": 1.0}, {"nombre": "Consejo Comunitario de Sabaletas", "area": 1.9}, {"nombre": "Consejo Comunitario de San Marcos", "area": 13.6}, {"nombre": "Consejo Comunitario Mayor De La Cuenca Media y Alta Del Río Dagua", "area": 3931.6}, {"nombre": "Consejo Comunitario de Alto Anchicaya", "area": 416.6}, {"nombre": "Consejo Comunitario de Alto Rio Dagua Pacifico Cimarrones de Cisneros", "area": 622.9}, {"nombre": "Consejo Comunitario Afro Zona Rural", "area": 17.6}], "ri_nombres": [{"nombre": "Resguardo Indígena Nasa Embera Chami deLa Delfina", "area": 783.2}, {"nombre": "Resguardo Indígena Nasa Paez de Yu Yik Kwe", "area": 2338.6}]}, {"name": "Calima", "area": 12887.7, "cc": 12566.8, "ri": 320.9, "st": 66496.9, "num_cc": 3, "num_ri": 1, "cc_nombres": [{"nombre": "Consejo Comunitario del Medio, Bajo y Zona Costera del Juan \"ACADESAN\"", "area": 11.5}, {"nombre": "Consejo Comunitario de la Cuenca Baja Del Rio Calima", "area": 12448.7}, {"nombre": "Consejo Comunitario Mayor De La Cuenca Media y Alta Del Río Dagua", "area": 106.6}], "ri_nombres": [{"nombre": "Resguardo Indígena Embera (Chami) Nabera Drua", "area": 320.9}]}, {"name": "Bolívar", "area": 6735.1, "cc": 1.6, "ri": 6733.5, "st": 54672.8, "num_cc": 1, "num_ri": 3, "cc_nombres": [{"nombre": "Consejo Comunitario del Medio, Bajo y Zona Costera del Juan \"ACADESAN\"", "area": 1.6}], "ri_nombres": [{"nombre": "Resguardo Indígena Embera Katio de Sanandocito", "area": 0.0}, {"nombre": "Resguardo Indígena Cañon Del Sanquinini", "area": 2726.9}, {"nombre": "Resguardo Indígena Chami - (Eriom Garrapatas)", "area": 4006.5}]}, {"name": "La Cumbre", "area": 0, "cc": 0, "ri": 0, "st": 25555, "num_cc": 0, "num_ri": 0, "cc_nombres": [], "ri_nombres": []}, {"name": "El Dovio", "area": 110.9, "cc": 0, "ri": 110.9, "st": 23492, "num_cc": 0, "num_ri": 1, "cc_nombres": [], "ri_nombres": [{"nombre": "Resguardo Indígena Dai Umadamia", "area": 110.9}]}, {"name": "El Cairo", "area": 112.5, "cc": 3.9, "ri": 108.6, "st": 21311.2, "num_cc": 1, "num_ri": 1, "cc_nombres": [{"nombre": "Consejo Comunitario del Medio, Bajo y Zona Costera del Juan \"ACADESAN\"", "area": 3.9}], "ri_nombres": [{"nombre": "Resguardo Indígena Embera Chami de Doxura", "area": 108.6}]}, {"name": "Versalles", "area": 0.1, "cc": 0, "ri": 0.1, "st": 20063.7, "num_cc": 0, "num_ri": 1, "cc_nombres": [], "ri_nombres": [{"nombre": "Resguardo Indígena Dai Umadamia", "area": 0.1}]}, {"name": "Restrepo", "area": 37.3, "cc": 0, "ri": 37.3, "st": 13687, "num_cc": 0, "num_ri": 1, "cc_nombres": [], "ri_nombres": [{"nombre": "Resguardo Indígena Embera (Chami) de los Niasa", "area": 37.3}]}, {"name": "Argelia", "area": 90.1, "cc": 0, "ri": 90.1, "st": 8990.5, "num_cc": 0, "num_ri": 1, "cc_nombres": [], "ri_nombres": [{"nombre": "Resguardo Indígena Vania Chami de Argelia", "area": 90.1}]}, {"name": "Roldanillo", "area": 0, "cc": 0, "ri": 0, "st": 8110.8, "num_cc": 0, "num_ri": 0, "cc_nombres": [], "ri_nombres": []}, {"name": "Vijes", "area": 48.7, "cc": 0, "ri": 48.7, "st": 6597.2, "num_cc": 0, "num_ri": 1, "cc_nombres": [], "ri_nombres": [{"nombre": "Resguardo Indígena Embera de Wasiruma", "area": 48.7}]}, {"name": "Trujillo", "area": 0, "cc": 0, "ri": 0, "st": 4817, "num_cc": 0, "num_ri": 0, "cc_nombres": [], "ri_nombres": []}, {"name": "Yotoco", "area": 0, "cc": 0, "ri": 0, "st": 3792.4, "num_cc": 0, "num_ri": 0, "cc_nombres": [], "ri_nombres": []}, {"name": "La Unión", "area": 0, "cc": 0, "ri": 0, "st": 842.6, "num_cc": 0, "num_ri": 0, "cc_nombres": [], "ri_nombres": []}], "cordoba": [{"name": "Tierralta", "area": 113707.8, "cc": 0, "ri": 113707.8, "st": 276482.6, "num_cc": 0, "num_ri": 3, "cc_nombres": [], "ri_nombres": [{"nombre": "Resguardo Indígena Embera-Katio de Jaikerazavi", "area": 163.3}, {"nombre": "Resguardo Indígena Yaberarado", "area": 2665.3}, {"nombre": "Resguardo Indígena Embera-Katio de Iwagado", "area": 110879.1}]}, {"name": "Valencia", "area": 4.7, "cc": 0, "ri": 4.7, "st": 34047, "num_cc": 0, "num_ri": 1, "cc_nombres": [], "ri_nombres": [{"nombre": "Resguardo Indígena Rio Alto De San Juan", "area": 4.7}]}], "risaralda": [{"name": "Pueblo Rico", "area": 20532.1, "cc": 11199.8, "ri": 9332.3, "st": 40848.2, "num_cc": 3, "num_ri": 3, "cc_nombres": [{"nombre": "Consejo Comunitario Mayor Del Alto San Juan \"Asocasan\"", "area": 0.9}, {"nombre": "Consejo Comunitario De La Comunidad Negral Del Municipio De Pueblo Rico Risaralda", "area": 11183.8}, {"nombre": "Consejo Comunitario de Piedra Bachichi", "area": 15.1}], "ri_nombres": [{"nombre": "Resguardo Indígena Embera-Katio Rio Andagueda", "area": 0.0}, {"nombre": "Resguardo Indígena Embera Chami  de Gitó Dokabú", "area": 2454.2}, {"nombre": "Resguardo Indígena Unificado Chami", "area": 6878.1}]}, {"name": "Mistrató", "area": 19690.4, "cc": 0, "ri": 19690.4, "st": 27775.5, "num_cc": 0, "num_ri": 4, "cc_nombres": [], "ri_nombres": [{"nombre": "Resguardo Indígena Embera Chami de Cristiania", "area": 0.0}, {"nombre": "Resguardo Indígena Embera-Katio Rio Andagueda", "area": 4.9}, {"nombre": "Resguardo Indígena Embera-Chami Loma de Citabara, Palestina, Atarralla y La Albania", "area": 276.6}, {"nombre": "Resguardo Indígena Unificado Chami", "area": 19408.9}]}]};
  
  // ── ESTADO REACTIVO ───────────────────────────────────────────────────
  let STATE = {
    limites: { deptos: DEFAULT_LIMITES_DEPTOS, munis: DEFAULT_LIMITES_MUNIS },
    titulacion: { deptos: DEFAULT_TIT_DEPTOS, munis: DEFAULT_TIT_MUNIS }
  };
  
  // Restaurar desde localStorage si existen actualizaciones previas
  // Limpiar localStorage si versión es anterior
  const DATA_VERSION = '2.0';
  if(localStorage.getItem('choco_version') !== DATA_VERSION){
    ['choco_limites','choco_cc_raw','choco_ri_raw','choco_cuencas','choco_cuencas_derivadas'].forEach(k=>localStorage.removeItem(k));
    localStorage.setItem('choco_version', DATA_VERSION);
  }
  
  ['limites','cc_raw','ri_raw','cuencas'].forEach(k=>{
    const saved = localStorage.getItem('choco_'+k);
    if(saved){
      try{
        const d = JSON.parse(saved);
        if(k==='cuencas'){ DATA_OTHER.cuencas={...DATA_OTHER.cuencas,...d}; markLoaded('cuencas'); }
      }catch(e){}
    }
  });
  // Restaurar tablas derivadas de cuencas (desglose por cuenca/subcuenca+depto+municipio)
  {
    const savedDerivadas = localStorage.getItem('choco_cuencas_derivadas');
    if(savedDerivadas){
      try{
        const d = JSON.parse(savedDerivadas);
        if(d.cuencaDeptoAreaRounded) CUENCAS_DEPTOS_AREA = d.cuencaDeptoAreaRounded;
        if(d.cuencaDeptoMunis) CUENCAS_DEPTOS_MUNIS = d.cuencaDeptoMunis;
        if(d.cuencaCounts) CUENCA_COUNTS = d.cuencaCounts;
        if(d.szhDeptoMuniArea) SZH_DEPTOS_MUNIS = d.szhDeptoMuniArea;
        if(d.szhCounts) SZH_COUNTS = d.szhCounts;
      }catch(e){}
    }
  }
  ['limites','cc_raw','ri_raw'].forEach(k=>{
    const saved = localStorage.getItem('choco_'+k);
    if(saved){
      try{
        const d = JSON.parse(saved);
        if(k==='limites'){ STATE.limites=d; markLoaded('limites'); }
        else { W['_'+k]=d; }
      }catch(e){}
    }
  });
  // Si hay CC y RI guardados, recalcular titulación
  if(W._cc_raw && W._ri_raw) recalcTitulacion();
  
  // ── COLUMNAS REQUERIDAS POR CAPA ──────────────────────────────────────
  const COLS_REQ={
    limites:   ['DeptoNom','MpNombre','AreaHa'],
    cc:        ['DeptoNom','MpNombre','Area_ha'],
    ri:        ['DeptoNom','MpNombre','Area_ha'],
    cuencas:   ['DeptoNom','MpNombre','area_ha','nom_zh','nom_szh'],
    humedales: ['DeptoNom','MpNombre','Area_ha'],
    runap:     ['DeptoNom','MpNombre','area_ha'],
    paramos:   ['DeptoNom','MpNombre','Area_ha'],
    cienagas:  ['DeptoNom','MpNombre','Area_ha','NOMBRE_GEOGRAFICO'],
    manglares: ['DeptoNom','MpNombre','Area_ha'],
    poblacion: ['DeptoNom','MpNombre','SEXO_H','SEXO_M','EDAD_0_4','GRUPO_ET_1'],
  };
  
  // ── CARGA DE ARCHIVOS ─────────────────────────────────────────────────
  function loadFile(tipo, input){
    const file = input.files[0];
    if(!file || !puedeEditar) { input.value=''; return; }
    const label = (MC_CAPAS||[]).find(c=>c.id===tipo)?.label || tipo;
    const tLoading = showToast(`Procesando ${label}…`, 'loading', 99999);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const rows = await leerFilasExcel(file);
  
        // Validar columnas requeridas
        const reqs = COLS_REQ[tipo] || [];
        if(rows.length > 0){
          const cols = Object.keys(rows[0]);
          const missing = reqs.filter(r => !cols.includes(r));
          if(missing.length > 0){
            removeToast(tLoading);
            if(W._MC_STATES?.[tipo]) { W._MC_STATES[tipo].loading=false; renderModalCarga(); }
            showToast(`❌ Faltan columnas: ${missing.join(', ')}`, 'error');
            input.value=''; return;
          }
        }
  
        if(tipo==='limites') processLimites(rows);
        else if(tipo==='cc') { W._cc_raw=rows; localStorage.setItem('choco_cc_raw',JSON.stringify(rows)); tryRecalcTit(); }
        else if(tipo==='ri') { W._ri_raw=rows; localStorage.setItem('choco_ri_raw',JSON.stringify(rows)); tryRecalcTit(); }
        else if(tipo==='cuencas') { processCuencas(rows); }
        else if(tipo==='humedales') { processGeneric('humedales', rows, 'Area_ha'); }
        else if(tipo==='runap') { processGeneric('runap', rows, 'area_ha'); }
        else if(tipo==='paramos') { processGeneric('paramos', rows, 'Area_ha'); }
        else if(tipo==='cienagas') { processGeneric('cienagas', rows, 'Area_ha'); }
        else if(tipo==='manglares') { processGeneric('manglares', rows, 'Area_ha'); }
        else if(tipo==='poblacion') { processPoblacion(rows); }
        removeToast(tLoading);
      } catch(err) {
        removeToast(tLoading);
        if(W._MC_STATES?.[tipo]) { W._MC_STATES[tipo].loading=false; renderModalCarga(); }
        showToast('❌ Error al leer el archivo. Verifica que sea un Excel válido.', 'error');
      }
      input.value='';
    };
    reader.onerror = () => {
      removeToast(tLoading);
      showToast('❌ No se pudo leer el archivo.', 'error');
      input.value='';
    };
    reader.readAsArrayBuffer(file);
  }
  
  function normDepto(v){ return DEPTO_MAP[v]||v; }
  
  function processLimites(rows){
    const dm={}, mm={};
    rows.forEach(r=>{
      const dep=normDepto(r.DeptoNom||''), mun=r.MpNombre||'', ha=parseFloat(r.AreaHa)||0;
      const id=DEPTO_IDS[dep];
      if(!id) return;
      if(!dm[id]) dm[id]={id,name:dep,municipios:0,area:0,pct:0};
      dm[id].area+=ha; dm[id].municipios++;
      if(!mm[id]) mm[id]=[];
      mm[id].push({name:mun,area:Math.round(ha*10)/10});
    });
    const total=Object.values(dm).reduce((s,d)=>s+d.area,0);
    const deptos=Object.values(dm).map(d=>({...d,area:Math.round(d.area*10)/10,pct:Math.round(d.area/total*10000)/100}))
      .sort((a,b)=>b.area-a.area);
    Object.keys(mm).forEach(k=>mm[k].sort((a,b)=>b.area-a.area));
    STATE.limites={deptos,munis:mm};
    localStorage.setItem('choco_limites',JSON.stringify(STATE.limites));
    markLoaded('limites');
    showToast('✅ Límites actualizados correctamente');
    render();
  }
  
  function processCuencas(rows){
    const deptoMap={"Narño":"Nariño","Valle del cauca":"Valle del Cauca","Chocó":"Chocó","Antioquia":"Antioquia","Cauca":"Cauca","Córdoba":"Córdoba","Risaralda":"Risaralda","Nariño":"Nariño"};
    const deptoIds={"Chocó":"choco","Nariño":"narino","Antioquia":"antioquia","Cauca":"cauca","Valle del Cauca":"valle","Córdoba":"cordoba","Risaralda":"risaralda"};
  
    // Área por departamento
    const dm={}, mm={}, cuencasMap={};
    // Estructuras derivadas usando la clave RAW de DeptoNom (ej. "Narño", "Valle del cauca"),
    // igual convención que usan CUENCAS_DEPTOS_AREA / CUENCAS_DEPTOS_MUNIS / SZH_DEPTOS_MUNIS
    const cuencaDeptoArea={}, cuencaDeptoMunisSet={}, szhDeptoMuniArea={};
    rows.forEach(r=>{
      const depRaw = r.DeptoNom;
      const dep=deptoMap[depRaw]||depRaw;
      const mun=r.MpNombre||'', ha=parseFloat(r.area_ha)||0;
      const cuenca=r.nom_zh||'Sin nombre';
      const szh=r.nom_szh||'Sin nombre';
      const id=deptoIds[dep]; if(!id) return;
      if(!dm[id]) dm[id]={id,name:dep,municipios:new Set(),area:0,pct:0};
      dm[id].area+=ha; dm[id].municipios.add(mun);
      if(!mm[id]) mm[id]={};
      mm[id][mun]=(mm[id][mun]||0)+ha;
      cuencasMap[cuenca]=(cuencasMap[cuenca]||0)+ha;
  
      // Área por cuenca+depto (clave raw)
      if(!cuencaDeptoArea[cuenca]) cuencaDeptoArea[cuenca]={};
      cuencaDeptoArea[cuenca][depRaw]=(cuencaDeptoArea[cuenca][depRaw]||0)+ha;
  
      // Municipios por cuenca+depto (clave raw)
      if(!cuencaDeptoMunisSet[cuenca]) cuencaDeptoMunisSet[cuenca]={};
      if(!cuencaDeptoMunisSet[cuenca][depRaw]) cuencaDeptoMunisSet[cuenca][depRaw]=new Set();
      cuencaDeptoMunisSet[cuenca][depRaw].add(mun);
  
      // Área por subcuenca+depto+municipio (clave raw)
      if(!szhDeptoMuniArea[szh]) szhDeptoMuniArea[szh]={};
      if(!szhDeptoMuniArea[szh][depRaw]) szhDeptoMuniArea[szh][depRaw]={};
      szhDeptoMuniArea[szh][depRaw][mun]=Math.round(((szhDeptoMuniArea[szh][depRaw][mun]||0)+ha)*10)/10;
    });
  
    const total=Object.values(dm).reduce((s,d)=>s+d.area,0)||1;
    const deptos=Object.values(dm).map(d=>({...d,municipios:d.municipios.size,area:Math.round(d.area*10)/10,pct:Math.round(d.area/total*10000)/100})).sort((a,b)=>b.area-a.area);
    const munis={};
    Object.keys(mm).forEach(id=>{
      munis[id]=Object.entries(mm[id]).map(([name,area])=>({name,area:Math.round(area*10)/10})).sort((a,b)=>b.area-a.area);
    });
    const cuencas=Object.entries(cuencasMap).map(([name,area])=>({name,area:Math.round(area*10)/10,pct:Math.round(area/total*10000)/100})).sort((a,b)=>b.area-a.area);
  
    // Redondear área por cuenca+depto
    const cuencaDeptoAreaRounded={};
    Object.entries(cuencaDeptoArea).forEach(([c,deps])=>{
      cuencaDeptoAreaRounded[c]={};
      Object.entries(deps).forEach(([d,a])=>{ cuencaDeptoAreaRounded[c][d]=Math.round(a*10)/10; });
    });
  
    // Convertir sets de municipios a arrays ordenados
    const cuencaDeptoMunis={};
    Object.entries(cuencaDeptoMunisSet).forEach(([c,deps])=>{
      cuencaDeptoMunis[c]={};
      Object.entries(deps).forEach(([d,set])=>{ cuencaDeptoMunis[c][d]=[...set].sort((a,b)=>a.localeCompare(b,'es')); });
    });
  
    // Conteos por cuenca (deptos/munis)
    const cuencaCounts={};
    Object.entries(cuencaDeptoMunis).forEach(([c,deps])=>{
      const nD=Object.keys(deps).length;
      const nM=Object.values(deps).reduce((s,arr)=>s+arr.length,0);
      cuencaCounts[c]={deptos:nD,munis:nM};
    });
  
    // Conteos por subcuenca (deptos/munis)
    const szhCounts={};
    Object.entries(szhDeptoMuniArea).forEach(([s,deps])=>{
      const nD=Object.keys(deps).length;
      const nM=Object.values(deps).reduce((sum,muniObj)=>sum+Object.keys(muniObj).length,0);
      szhCounts[s]={deptos:nD,munis:nM};
    });
  
    DATA_OTHER.cuencas={...DATA_OTHER.cuencas, deptos, munis, cuencas, real:true};
    // Reasignar las tablas globales derivadas para que TODOS los flujos de filtro
    // (por cuenca, por depto, por subcuenca) usen el archivo recién cargado
    CUENCAS_DEPTOS_AREA = cuencaDeptoAreaRounded;
    CUENCAS_DEPTOS_MUNIS = cuencaDeptoMunis;
    CUENCA_COUNTS = cuencaCounts;
    SZH_DEPTOS_MUNIS = szhDeptoMuniArea;
    SZH_COUNTS = szhCounts;
  
    localStorage.setItem('choco_cuencas', JSON.stringify({deptos,munis,cuencas}));
    localStorage.setItem('choco_cuencas_derivadas', JSON.stringify({
      cuencaDeptoAreaRounded, cuencaDeptoMunis, cuencaCounts, szhDeptoMuniArea, szhCounts
    }));
    markLoaded('cuencas');
    showToast('✅ Cuencas hidrográficas actualizadas');
    if(document.getElementById('sel-capa').value==='cuencas') render();
  }
  
  function processGeneric(capa, rows, areaCol){
    const deptoMapL={"Narño":"Nariño","Valle del cauca":"Valle del Cauca","Chocó":"Chocó","Antioquia":"Antioquia","Cauca":"Cauca","Córdoba":"Córdoba","Risaralda":"Risaralda","Nariño":"Nariño"};
    const deptoIdsL={"Chocó":"choco","Nariño":"narino","Antioquia":"antioquia","Cauca":"cauca","Valle del Cauca":"valle","Córdoba":"cordoba","Risaralda":"risaralda"};
    const dm={}, mm={};
    rows.forEach(r=>{
      const dep=deptoMapL[r.DeptoNom]||r.DeptoNom, mun=r.MpNombre||'', ha=parseFloat(r[areaCol])||0;
      const id=deptoIdsL[dep]; if(!id||!dep) return;
      if(!dm[id]) dm[id]={id,name:dep,municipios:new Set(),area:0,pct:0};
      dm[id].area+=ha; dm[id].municipios.add(mun);
      if(!mm[id]) mm[id]={};
      mm[id][mun]=(mm[id][mun]||0)+ha;
    });
    const total=Object.values(dm).reduce((s,d)=>s+d.area,0)||1;
    const deptos=Object.values(dm).map(d=>({...d,municipios:d.municipios.size,area:Math.round(d.area*10)/10,pct:Math.round(d.area/total*1000)/10})).sort((a,b)=>b.area-a.area);
    const munis={};
    Object.keys(mm).forEach(id=>{
      munis[id]=Object.entries(mm[id]).map(([name,area])=>({name,area:Math.round(area*10)/10})).sort((a,b)=>b.area-a.area);
    });
    DATA_OTHER[capa]={...DATA_OTHER[capa],deptos,munis,real:true};
    localStorage.setItem('choco_'+capa,JSON.stringify({deptos,munis}));
    markLoaded(capa);
    showToast('✅ '+DATA_OTHER[capa].label+' actualizado');
    if(document.getElementById('sel-capa').value===capa) render();
  }
  
  function processPoblacion(rows){
    const deptoMapP={"Narño":"Nariño","Valle del cauca":"Valle del Cauca","Chocó":"Chocó","Antioquia":"Antioquia","Cauca":"Cauca","Córdoba":"Córdoba","Risaralda":"Risaralda","Nariño":"Nariño"};
    const deptoIdsP={"Chocó":"choco","Nariño":"narino","Antioquia":"antioquia","Cauca":"cauca","Valle del Cauca":"valle","Córdoba":"cordoba","Risaralda":"risaralda"};
    const EDAD_COLS=["EDAD_0_4","EDAD_5_9","EDAD_10_14","EDAD_15_19","EDAD_20_24","EDAD_25_29","EDAD_30_34","EDAD_35_39","EDAD_40_44","EDAD_45_49","EDAD_50_54","EDAD_55_59","EDAD_60_64","EDAD_65_69","EDAD_70_74","EDAD_75_79","EDAD_80_84","EDAD_85_89","EDAD_90_94","EDAD_95_99","EDAD_100_O"];
    const EDAD_LABELS=["0-4","5-9","10-14","15-19","20-24","25-29","30-34","35-39","40-44","45-49","50-54","55-59","60-64","65-69","70-74","75-79","80-84","85-89","90-94","95-99","100+"];
  
    // Acumular por depto y municipio
    const dm={}, mm={}, piramideAcc={}, etniaDep={}, etniaMun={};
    EDAD_LABELS.forEach(g=>piramideAcc[g]=0);
  
    rows.forEach(r=>{
      const dep=deptoMapP[r.DeptoNom]||r.DeptoNom||'';
      const mun=r.MpNombre||'';
      const id=deptoIdsP[dep]; if(!id) return;
  
      const h=parseInt(r.SEXO_H)||0, m=parseInt(r.SEXO_M)||0, t=parseInt(r.SEXO_TOTAL)||(h+m);
      if(!dm[id]) dm[id]={id,name:dep,municipios:new Set(),hombres:0,mujeres:0,total:0};
      dm[id].hombres+=h; dm[id].mujeres+=m; dm[id].total+=t; dm[id].municipios.add(mun);
  
      const munKey=id+'|'+mun;
      if(!mm[munKey]) mm[munKey]={name:mun,depId:id,hombres:0,mujeres:0,total:0};
      mm[munKey].hombres+=h; mm[munKey].mujeres+=m; mm[munKey].total+=t;
  
      EDAD_COLS.forEach((col,i)=>{ piramideAcc[EDAD_LABELS[i]]+=(parseInt(r[col])||0); });
  
      // Etnias por depto
      if(!etniaDep[id]) etniaDep[id]={id,name:dep,indigena:0,gitano:0,raizal:0,palenquero:0,negro:0,ninguno:0,noinforma:0};
      etniaDep[id].indigena+=(parseInt(r.GRUPO_ETNI)||0);
      etniaDep[id].gitano+=(parseInt(r.GRUPO_ET_1)||0);
      etniaDep[id].raizal+=(parseInt(r.GRUPO_ET_2)||0);
      etniaDep[id].palenquero+=(parseInt(r.GRUPO_ET_3)||0);
      etniaDep[id].negro+=(parseInt(r.GRUPO_ET_4)||0);
      etniaDep[id].ninguno+=(parseInt(r.GRUPO_ET_5)||0);
      etniaDep[id].noinforma+=(parseInt(r.GRUPO_ET_6)||0);
  
      // Etnias por municipio
      if(!etniaMun[id]) etniaMun[id]={};
      if(!etniaMun[id][mun]) etniaMun[id][mun]={name:mun,indigena:0,gitano:0,raizal:0,palenquero:0,negro:0,ninguno:0,noinforma:0};
      etniaMun[id][mun].indigena+=(parseInt(r.GRUPO_ETNI)||0);
      etniaMun[id][mun].gitano+=(parseInt(r.GRUPO_ET_1)||0);
      etniaMun[id][mun].raizal+=(parseInt(r.GRUPO_ET_2)||0);
      etniaMun[id][mun].palenquero+=(parseInt(r.GRUPO_ET_3)||0);
      etniaMun[id][mun].negro+=(parseInt(r.GRUPO_ET_4)||0);
      etniaMun[id][mun].ninguno+=(parseInt(r.GRUPO_ET_5)||0);
      etniaMun[id][mun].noinforma+=(parseInt(r.GRUPO_ET_6)||0);
    });
  
    const total=Object.values(dm).reduce((s,d)=>s+d.total,0)||1;
    const deptos=Object.values(dm).map(d=>({
      id:d.id,name:d.name,municipios:d.municipios.size,
      hombres:d.hombres,mujeres:d.mujeres,total:d.total,
      pct:Math.round(d.total/total*1000)/10
    })).sort((a,b)=>b.total-a.total);
  
    const munis={};
    Object.keys(deptoIdsP).forEach(dep=>{
      const id=deptoIdsP[dep];
      munis[id]=Object.values(mm).filter(m=>m.depId===id)
        .map(({name,hombres,mujeres,total})=>({name,hombres,mujeres,total}))
        .sort((a,b)=>b.total-a.total);
    });
  
    const piramide=EDAD_LABELS.map(grupo=>({grupo,total:piramideAcc[grupo]}));
    const etnia=Object.values(etniaDep).sort((a,b)=>b.total-a.total);
    const etniaMunis={};
    Object.keys(etniaMun).forEach(id=>{
      etniaMunis[id]=Object.values(etniaMun[id]);
    });
  
    // Reemplazar POB_DATA global
    W.POB_DATA={deptos,munis,piramide,total_h:deptos.reduce((s,d)=>s+d.hombres,0),total_m:deptos.reduce((s,d)=>s+d.mujeres,0),total_pob:total};
    W.ETNIA_DATA=etnia;
    W.ETNIA_MUNIS=etniaMunis;
  
    localStorage.setItem('choco_poblacion',JSON.stringify({deptos,munis,piramide,etnia,etniaMunis,total_h:W.POB_DATA.total_h,total_m:W.POB_DATA.total_m,total_pob:total}));
    markLoaded('poblacion');
    showToast('✅ Población actualizada correctamente');
    if(document.getElementById('sel-capa').value==='poblacion') render();
  }
  
  function tryRecalcTit(){
    if(W._cc_raw && W._ri_raw) recalcTitulacion();
    else showToast('📂 Carga también el otro archivo de titulación para calcular Sin Titulación');
  }
  
  function recalcTitulacion(){
    // Obtener límites actuales por municipio
    const limMuni={};
    STATE.limites.deptos.forEach(d=>{
      (STATE.limites.munis[d.id]||[]).forEach(m=>{ limMuni[d.id+'|'+m.name]=m.area; });
    });
    const limDepto={};
    STATE.limites.deptos.forEach(d=>{ limDepto[d.id]=d.area; });
  
    // CC: AREA_TOTAL por municipio
    const ccMuni={}, ccDepto={};
    (W._cc_raw||[]).forEach(r=>{
      const dep=normDepto(r.DeptoNom||''), mun=r.MpNombre||'', ha=parseFloat(r.Area_ha)||0;
      const id=DEPTO_IDS[dep]; if(!id) return;
      const key=id+'|'+mun;
      ccMuni[key]=(ccMuni[key]||0)+ha;
      ccDepto[id]=(ccDepto[id]||0)+ha;
    });
    // RI: Ha_Total_R por municipio
    const riMuni={}, riDepto={};
    (W._ri_raw||[]).forEach(r=>{
      const dep=normDepto(r.DeptoNom||''), mun=r.MpNombre||'', ha=parseFloat(r.Area_ha)||0;
      const id=DEPTO_IDS[dep]; if(!id) return;
      const key=id+'|'+mun;
      riMuni[key]=(riMuni[key]||0)+ha;
      riDepto[id]=(riDepto[id]||0)+ha;
    });
  
    // Contar títulos únicos por depto usando ID (evita duplicados por municipios cruzados)
    const ccCount={}, riCount={};
    (W._cc_raw||[]).forEach(r=>{
      const dep=normDepto(r.DeptoNom||''), id=DEPTO_IDS[dep]; if(!id) return;
      if(!ccCount[id]) ccCount[id]=new Set();
      ccCount[id].add(r.ID||r.NOMBRE||Math.random());
    });
    (W._ri_raw||[]).forEach(r=>{
      const dep=normDepto(r.DeptoNom||''), id=DEPTO_IDS[dep]; if(!id) return;
      if(!riCount[id]) riCount[id]=new Set();
      riCount[id].add(r.ID||r.NOMBRE||Math.random());
    });
  
    // Construir deptos titulación
    const deptos=STATE.limites.deptos.map(d=>{
      const cc=Math.round((ccDepto[d.id]||0)*10)/10;
      const ri=Math.round((riDepto[d.id]||0)*10)/10;
      const st=Math.max(0,d.area-cc-ri);
      const num_cc=ccCount[d.id]?ccCount[d.id].size:0;
      const num_ri=riCount[d.id]?riCount[d.id].size:0;
      return {...d,cc,ri,st,num_cc,num_ri};
    });
  
    // Construir munis titulación con nombres individuales de CC y RI
    const ccMuniNames={}, riMuniNames={}, ccMuniCount={}, riMuniCount={};
    (W._cc_raw||[]).forEach(r=>{
      const dep=normDepto(r.DeptoNom||''), mun=r.MpNombre||'';
      const id=DEPTO_IDS[dep]; if(!id) return;
      const key=id+'|'+mun;
      if(!ccMuniNames[key]) ccMuniNames[key]=new Map();
      const nombre=r.NOMBRE||r.ID||'Sin nombre';
      const rid=r.ID||nombre;
      if(!ccMuniNames[key].has(rid)) ccMuniNames[key].set(rid,{nombre,area:0});
      ccMuniNames[key].get(rid).area+=parseFloat(r.Area_ha)||0;
      if(!ccMuniCount[key]) ccMuniCount[key]=new Set();
      ccMuniCount[key].add(rid);
    });
    (W._ri_raw||[]).forEach(r=>{
      const dep=normDepto(r.DeptoNom||''), mun=r.MpNombre||'';
      const id=DEPTO_IDS[dep]; if(!id) return;
      const key=id+'|'+mun;
      if(!riMuniNames[key]) riMuniNames[key]=new Map();
      const nombre=r.NOMBRE||r.ID||'Sin nombre';
      const rid=r.ID||nombre;
      if(!riMuniNames[key].has(rid)) riMuniNames[key].set(rid,{nombre,area:0});
      riMuniNames[key].get(rid).area+=parseFloat(r.Area_ha)||0;
      if(!riMuniCount[key]) riMuniCount[key]=new Set();
      riMuniCount[key].add(rid);
    });
  
    const munis={};
    STATE.limites.deptos.forEach(d=>{
      munis[d.id]=(STATE.limites.munis[d.id]||[]).map(m=>{
        const key=d.id+'|'+m.name;
        const cc=Math.round((ccMuni[key]||0)*10)/10;
        const ri=Math.round((riMuni[key]||0)*10)/10;
        const st=Math.max(0,m.area-cc-ri);
        const num_cc=ccMuniCount[key]?ccMuniCount[key].size:0;
        const num_ri=riMuniCount[key]?riMuniCount[key].size:0;
        const cc_nombres=ccMuniNames[key]?[...ccMuniNames[key].values()]:[];
        const ri_nombres=riMuniNames[key]?[...riMuniNames[key].values()]:[];
        return {...m,cc,ri,st,num_cc,num_ri,cc_nombres,ri_nombres};
      });
    });
  
    // Calcular totales globales únicos
    const allCC = new Set((W._cc_raw||[]).map(r=>r.ID||r.NOMBRE));
    const allRI = new Set((W._ri_raw||[]).filter(r=>r.ID).map(r=>r.ID));
    W.TOTAL_CC_GLOBAL = allCC.size;
    W.TOTAL_RI_GLOBAL = allRI.size;
    STATE.titulacion={deptos,munis};
    markLoaded('cc'); markLoaded('ri');
    showToast('✅ Titulación colectiva actualizada');
    if(document.getElementById('sel-capa').value==='titulacion') render();
  }
  
  // ── ORDENAMIENTO TABLA CIÉNAGAS ─────────────────────────────────────
  let _cienSortCol=null, _cienSortAsc=true, _cienLastRows=[], _cienModoMuni=false;
  
  function sortCienagasTable(col){
    if(_cienSortCol===col){_cienSortAsc=!_cienSortAsc;}
    else{_cienSortCol=col;_cienSortAsc=(col==='depto'||col==='muni'||col==='nombre');}
  
    const COLS=['depto','muni','nombre','municipios','cienagas','area','pct'];
    COLS.forEach(c=>{
      const u=document.getElementById('csa-'+c+'-up'),d=document.getElementById('csa-'+c+'-down');
      if(u)u.classList.remove('active'); if(d)d.classList.remove('active');
      const t=document.getElementById('ctip-'+c);
      if(!t)return;
      const isText=(c==='depto'||c==='muni'||c==='nombre');
      if(c===_cienSortCol){
        document.getElementById('csa-'+c+'-'+(_cienSortAsc?'up':'down'))?.classList.add('active');
        t.textContent=_cienSortAsc
          ?(isText?'Ordenado: A→Z. Clic para invertir':'Ordenado: menor→mayor. Clic para invertir')
          :(isText?'Ordenado: Z→A. Clic para invertir':'Ordenado: mayor→menor. Clic para invertir');
      } else {
        t.textContent=isText?'Clic para ordenar A→Z / Z→A':'Clic para ordenar menor→mayor / mayor→menor';
      }
    });
  
    const sorted=[..._cienLastRows].sort((a,b)=>{
      const va=a[col]??0, vb=b[col]??0;
      if(typeof va==='string')return _cienSortAsc?va.localeCompare(vb,'es'):vb.localeCompare(va,'es');
      return _cienSortAsc?va-vb:vb-va;
    });
  
    const fmt1=v=>Number(v).toLocaleString('es-CO',{minimumFractionDigits:1,maximumFractionDigits:1});
    const grandTot=sorted.reduce((s,r)=>s+(r.area||0),0)||1;
  
    if(_cienModoMuni){
      document.getElementById('cienagas-tbody').innerHTML=sorted.map(r=>`<tr>
        <td style="font-weight:500">${r.depto}</td>
        <td style="font-weight:500">${r.muni}</td>
        <td style="${(!r.nombre||r.nombre==='Sin nombre'||r.nombre==='<Null>'||r.nombre==='')?'color:var(--text3);font-style:italic':'font-weight:500'}">${(!r.nombre||r.nombre==='<Null>'||r.nombre==='')?'Sin nombre':r.nombre}</td>
        <td>${fmt1(r.area)} Ha</td>
        <td>${r.pct.toFixed(1)}%</td>
      </tr>`).join('');
    } else {
      const modoTodos=sorted[0]?._modoTodos;
      document.getElementById('cienagas-tbody').innerHTML=sorted.map(r=>`<tr>
        <td style="font-weight:500">${r.depto}</td>
        ${!modoTodos?`<td style="font-weight:500">${r.muni||''}</td>`:''}
        ${modoTodos?`<td>${r.municipios||'—'}</td>`:''}
        <td style="font-weight:500">${r.cienagas||'—'}</td>
        <td>${r.area>0?fmt1(r.area)+' Ha':'—'}</td>
        <td>${r.pct.toFixed(1)}%</td>
      </tr>`).join('');
    }
  }
  
  // ── ORDENAMIENTO TABLA CUENCAS ───────────────────────────────────────
  let _czSortCol=null, _czSortAsc=true, _czLastRows=[], _czModoSub=false;
  
  function sortCuencasTable(col){
    if(_czSortCol===col){_czSortAsc=!_czSortAsc;}
    else{_czSortCol=col;_czSortAsc=(col==='cuenca'||col==='subcuenca');}
  
    const COLS=['cuenca','subcuenca','area','pct'];
    COLS.forEach(c=>{
      const u=document.getElementById('czsa-'+c+'-up'),d=document.getElementById('czsa-'+c+'-down');
      if(u)u.classList.remove('active'); if(d)d.classList.remove('active');
      const t=document.getElementById('cztip-'+c);
      if(!t)return;
      const isText=(c==='cuenca'||c==='subcuenca');
      if(c===_czSortCol){
        document.getElementById('czsa-'+c+'-'+(_czSortAsc?'up':'down'))?.classList.add('active');
        t.textContent=_czSortAsc
          ?(isText?'Ordenado: A→Z. Clic para invertir':'Ordenado: menor→mayor. Clic para invertir')
          :(isText?'Ordenado: Z→A. Clic para invertir':'Ordenado: mayor→menor. Clic para invertir');
      } else {
        t.textContent=isText?'Clic para ordenar A→Z / Z→A':'Clic para ordenar menor→mayor / mayor→menor';
      }
    });
  
    const sorted=[..._czLastRows].sort((a,b)=>{
      const va=a[col]??0, vb=b[col]??0;
      if(typeof va==='string')return _czSortAsc?va.localeCompare(vb,'es'):vb.localeCompare(va,'es');
      return _czSortAsc?va-vb:vb-va;
    });
  
    const fmt=v=>Number(v).toLocaleString('es-CO',{minimumFractionDigits:1,maximumFractionDigits:1});
    const total=sorted.reduce((s,r)=>s+(r.area||0),0);
    const ALLCOLS=['cuenca','subcuenca','depto2','muni2','area','pct'];
    ALLCOLS.forEach(c=>{
      const u=document.getElementById('czsa-'+c+'-up'),d=document.getElementById('czsa-'+c+'-down');
      if(u)u.classList.remove('active'); if(d)d.classList.remove('active');
    });
    if(_czSortCol){
      document.getElementById('czsa-'+_czSortCol+'-'+(_czSortAsc?'up':'down'))?.classList.add('active');
    }
  
    if(_czModoSub){
      document.getElementById('cuencas-tbody').innerHTML=sorted.map(r=>`<tr>
        <td style="font-weight:500">${r.cuenca}</td>
        <td style="font-weight:500">${r.subcuenca||''}</td>
        <td style="font-weight:500">${r.depto||''}</td>
        <td style="font-weight:500">${r.muni||''}</td>
        <td>${fmt(r.area)} Ha</td>
        <td>${r.pct.toFixed(1)}%</td>
      </tr>`).join('') + `<tr style="border-top:1.5px solid var(--border2);background:var(--bg)">
        <td style="font-weight:600;padding:6px 8px;text-align:center">${sorted[0]?.cuenca||''}</td>
        <td style="font-weight:600;padding:6px 8px;text-align:center">Total</td>
        <td style="padding:6px 8px"></td>
        <td style="padding:6px 8px"></td>
        <td style="font-weight:600;padding:6px 8px;text-align:center">${fmt(total)} Ha</td>
        <td style="font-weight:600;padding:6px 8px;text-align:center">100%</td>
      </tr>`;
    } else {
      document.getElementById('cuencas-tbody').innerHTML=sorted.map(r=>`<tr>
        <td style="font-weight:500">${r.cuenca}</td>
        <td>${fmt(r.area)} Ha</td>
        <td>${r.pct.toFixed(1)}%</td>
      </tr>`).join('') + `<tr style="border-top:1.5px solid var(--border2);background:var(--bg)">
        <td style="font-weight:600;padding:6px 8px;text-align:center">Total</td>
        <td style="font-weight:600;padding:6px 8px;text-align:center">${fmt(total)} Ha</td>
        <td style="font-weight:600;padding:6px 8px;text-align:center">100%</td>
      </tr>`;
    }
  }
  
  // ── ORDENAMIENTO TABLA HUMEDALES ────────────────────────────────────
  let _humSortCol=null, _humSortAsc=true, _humLastRows=[];
  
  function sortHumedalTable(col){
    if(_humSortCol===col){_humSortAsc=!_humSortAsc;}
    else{_humSortCol=col;_humSortAsc=(col==='depto'||col==='muni');}
  
    const COLS=['depto','muni','pa','pb','pt','pb2','pm','total','pct'];
    COLS.forEach(c=>{
      const u=document.getElementById('hsa-'+c+'-up'),d=document.getElementById('hsa-'+c+'-down');
      if(u)u.classList.remove('active'); if(d)d.classList.remove('active');
      const t=document.getElementById('htip-'+c);
      if(!t)return;
      const isText=(c==='depto'||c==='muni');
      if(c===_humSortCol){
        document.getElementById('hsa-'+c+'-'+(_humSortAsc?'up':'down'))?.classList.add('active');
        t.textContent=_humSortAsc?(isText?'Ordenado: A→Z. Clic para invertir':'Ordenado: menor→mayor. Clic para invertir'):(isText?'Ordenado: Z→A. Clic para invertir':'Ordenado: mayor→menor. Clic para invertir');
      } else {
        t.textContent=isText?'Clic para ordenar A→Z / Z→A':'Clic para ordenar menor→mayor / mayor→menor';
      }
    });
  
    const sorted=[..._humLastRows].sort((a,b)=>{
      const va=a[col]??0, vb=b[col]??0;
      if(typeof va==='string')return _humSortAsc?va.localeCompare(vb,'es'):vb.localeCompare(va,'es');
      return _humSortAsc?va-vb:vb-va;
    });
  
    const hasMuni = sorted[0]?.muni !== undefined;
    const fmt=v=>v>0?Number(v).toLocaleString('es-CO',{minimumFractionDigits:1,maximumFractionDigits:1})+' Ha':'—';
    document.getElementById('humedal-tbody').innerHTML=sorted.map(r=>`<tr>
      <td style="font-weight:500">${r.depto}</td>
      ${hasMuni?`<td style="font-weight:500">${r.muni}</td>`:''}
      <td>${fmt(r.pa)}</td><td>${fmt(r.pb)}</td><td>${fmt(r.pt)}</td>
      <td>${fmt(r.pb2)}</td><td>${fmt(r.pm)}</td>
      <td style="white-space:nowrap">${fmt(r.total)}</td>
      <td>${r.pct.toFixed(1)}%</td>
    </tr>`).join('');
  }
  
  // ── ORDENAMIENTO TABLA RUNAP ─────────────────────────────────────────
  let _rSortCol=null, _rSortAsc=true, _rLastRows=[];
  
  function sortRunapTable(col){
    if(_rSortCol===col){_rSortAsc=!_rSortAsc;}
    else{_rSortCol=col;_rSortAsc=(col==='depto'||col==='muni');}
    const COLS=['depto','muni','pnn','drmi','rfpn','dnmi','rfpr','pnr','sf','dcs','rnsc','total','pct'];
    COLS.forEach(c=>{
      const u=document.getElementById('rsa-'+c+'-up'),d=document.getElementById('rsa-'+c+'-down');
      if(u)u.classList.remove('active'); if(d)d.classList.remove('active');
      const t=document.getElementById('rtip-'+c); if(!t)return;
      const isText=(c==='depto'||c==='muni');
      if(c===_rSortCol){
        document.getElementById('rsa-'+c+'-'+(_rSortAsc?'up':'down'))?.classList.add('active');
        t.textContent=_rSortAsc?(isText?'Ordenado: A→Z. Clic para invertir':'Ordenado: menor→mayor. Clic para invertir'):(isText?'Ordenado: Z→A. Clic para invertir':'Ordenado: mayor→menor. Clic para invertir');
      } else { t.textContent=isText?'Clic para ordenar A→Z / Z→A':'Clic para ordenar menor→mayor / mayor→menor'; }
    });
    const sorted=[..._rLastRows].sort((a,b)=>{
      const va=a[col]??0,vb=b[col]??0;
      if(typeof va==='string')return _rSortAsc?va.localeCompare(vb,'es'):vb.localeCompare(va,'es');
      return _rSortAsc?va-vb:vb-va;
    });
    const hasMuni=sorted[0]?.muni!==undefined;
    const fmt=v=>v>0?Number(v).toLocaleString('es-CO',{minimumFractionDigits:1,maximumFractionDigits:1})+' Ha':'—';
    document.getElementById('runap-tbody').innerHTML=sorted.map(r=>`<tr>
      <td style="font-weight:500">${r.depto}</td>${hasMuni?`<td style="font-weight:500">${r.muni}</td>`:''}
      <td>${fmt(r.pnn)}</td><td>${fmt(r.drmi)}</td><td>${fmt(r.rfpn)}</td><td>${fmt(r.dnmi)}</td>
      <td>${fmt(r.rfpr)}</td><td>${fmt(r.pnr)}</td><td>${fmt(r.sf)}</td><td>${fmt(r.dcs)}</td>
      <td>${fmt(r.rnsc)}</td><td>${fmt(r.total)}</td><td>${r.pct.toFixed(1)}%</td>
    </tr>`).join('');
  }
  
  // ── ORDENAMIENTO TABLA PÁRAMOS ───────────────────────────────────────
  let _pSortCol=null, _pSortAsc=true, _pLastRows=[], _pModoMuni=false, _pParNames=[];
  
  function sortParamosTable(col){
    if(_pSortCol===col){_pSortAsc=!_pSortAsc;}
    else{_pSortCol=col;_pSortAsc=(col==='depto'||col==='muni');}
  
    const allCols=['depto','muni',..._pParNames.map((_,i)=>'p'+i),'total','pct'];
    allCols.forEach(c=>{
      const u=document.getElementById('psa-'+c+'-up'),d=document.getElementById('psa-'+c+'-down');
      if(u)u.classList.remove('active'); if(d)d.classList.remove('active');
      const t=document.getElementById('ptip-'+c); if(!t)return;
      const isText=(c==='depto'||c==='muni');
      if(c===_pSortCol){
        document.getElementById('psa-'+c+'-'+(_pSortAsc?'up':'down'))?.classList.add('active');
        t.textContent=_pSortAsc?(isText?'Ordenado: A→Z. Clic para invertir':'Ordenado: menor→mayor. Clic para invertir'):(isText?'Ordenado: Z→A. Clic para invertir':'Ordenado: mayor→menor. Clic para invertir');
      } else { t.textContent=isText?'Clic para ordenar A→Z / Z→A':'Clic para ordenar menor→mayor / mayor→menor'; }
    });
  
    const sorted=[..._pLastRows].sort((a,b)=>{
      const va=a[col]??0, vb=b[col]??0;
      if(typeof va==='string')return _pSortAsc?va.localeCompare(vb,'es'):vb.localeCompare(va,'es');
      return _pSortAsc?va-vb:vb-va;
    });
  
    const fmt=v=>v>0?Number(v).toLocaleString('es-CO',{minimumFractionDigits:1,maximumFractionDigits:1})+' Ha':'—';
    document.getElementById('paramos-tbody').innerHTML=sorted.map(r=>`<tr>
      <td style="font-weight:500">${r.depto}</td>
      ${_pModoMuni?`<td style="font-weight:500">${r.muni}</td>`:''}
      ${_pParNames.map((_,i)=>`<td>${fmt(r['p'+i])}</td>`).join('')}
      <td>${fmt(r.total)}</td>
      <td>${r.pct.toFixed(1)}%</td>
    </tr>`).join('');
  }
  
  function onSzhChange(){
    const szh = document.getElementById("sel-szh").value;
    const cuenca = document.getElementById("sel-cuenca").value;
    const selDepto = document.getElementById("sel-depto-cuencas");
    const selMuni = document.getElementById("sel-muni-cuencas");
    const currentDep = selDepto.value;
    const currentMuni = selMuni.value; // preservar municipio actual
  
    selDepto.innerHTML='<option value="todos">Todos los departamentos</option>';
    selMuni.innerHTML='<option value="todos">Todos los municipios</option>';
  
    if(szh !== 'todas'){
      const deptos = Object.keys(SZH_DEPTOS_MUNIS[szh]||{});
      deptos.sort((a,b)=>a.localeCompare(b,'es')).forEach(dep=>{
        const o=document.createElement("option");
        o.value=dep; o.textContent=dep==='Narño'?'Nariño':dep==='Valle del cauca'?'Valle del Cauca':dep;
        selDepto.appendChild(o);
      });
    } else if(cuenca !== 'todas'){
      const deptos = Object.keys(CUENCAS_DEPTOS_MUNIS[cuenca]||{});
      deptos.sort((a,b)=>a.localeCompare(b,'es')).forEach(dep=>{
        const o=document.createElement("option");
        o.value=dep; o.textContent=dep==='Narño'?'Nariño':dep==='Valle del cauca'?'Valle del Cauca':dep;
        selDepto.appendChild(o);
      });
    } else {
      ["Antioquia","Cauca","Chocó","Córdoba","Narño","Risaralda","Valle del cauca"].forEach(dep=>{
        const o=document.createElement("option");
        o.value=dep; o.textContent=dep==='Narño'?'Nariño':dep==='Valle del cauca'?'Valle del Cauca':dep;
        selDepto.appendChild(o);
      });
    }
  
    // Restaurar departamento si sigue disponible
    const deptosOpts = Array.from(selDepto.options).map(o=>o.value);
    selDepto.value = deptosOpts.includes(currentDep) ? currentDep : 'todos';
  
    // Si hay depto seleccionado, poblar municipios y restaurar selección
    if(selDepto.value !== 'todos'){
      const dep = selDepto.value;
      let munis = szh !== 'todas'
        ? Object.keys((SZH_DEPTOS_MUNIS[szh]||{})[dep]||{})
        : cuenca !== 'todas'
          ? (CUENCAS_DEPTOS_MUNIS[cuenca]||{})[dep] || []
          : [];
      [...munis].sort((a,b)=>a.localeCompare(b,'es')).forEach(m=>{
        const o=document.createElement("option"); o.value=m; o.textContent=m;
        selMuni.appendChild(o);
      });
      // Restaurar municipio si sigue disponible
      const muniOpts = Array.from(selMuni.options).map(o=>o.value);
      selMuni.value = muniOpts.includes(currentMuni) ? currentMuni : 'todos';
    }
  
    renderCuencasFiltro();
  }
  
  function markLoaded(tipo){
    // Actualizar estado interno del modal y re-renderizar
    if(W._MC_STATES && W._MC_STATES[tipo]){
      const now=new Date();
      W._MC_STATES[tipo].loaded=true;
      W._MC_STATES[tipo].loading=false;
      W._MC_STATES[tipo].ts=now;
      localStorage.setItem('choco_ts_'+tipo, now.toISOString());
    }
    renderModalCarga();
    actualizarBadge();
    // Compatibilidad con update-bar legacy (oculta)
    const dot=document.getElementById('dot-'+tipo);
    const btn=document.getElementById('btn-'+(tipo==='limites'?'limites':tipo+'-up'));
    if(dot) dot.classList.add('ok');
    if(btn) btn.classList.add('loaded');
    // Agregar ✅ en el selector de capas
    const selCapa=document.getElementById('sel-capa');
    if(selCapa){
      Array.from(selCapa.options).forEach(opt=>{
        if(opt.value===tipo && !opt.text.startsWith('✅')){
          opt.text='✅ '+opt.text;
        }
      });
    }
  }
  
  // ── LÓGICA DEL DASHBOARD ──────────────────────────────────────────────
  
  const CUENCA_DATA=[{"id":"Atrato__Darién","name":"Atrato - Darién","area":3771192.7,"pct":26.9},{"id":"Tapaje__Dagua__Direc","name":"Tapaje - Dagua - Directos","area":2082185.3,"pct":14.9},{"id":"Patía","name":"Patía","area":1872957.7,"pct":13.4},{"id":"San_Juán","name":"San Juán","area":1637944.1,"pct":11.7},{"id":"Cauca","name":"Cauca","area":1108979.4,"pct":7.9},{"id":"Sinú","name":"Sinú","area":846135.4,"pct":6.0},{"id":"Caribe__Litoral","name":"Caribe - Litoral","area":683255.9,"pct":4.9},{"id":"Baudó__Directos_Paci","name":"Baudó - Directos Pacifico","area":596480.9,"pct":4.3},{"id":"Mira","name":"Mira","area":583952.5,"pct":4.2},{"id":"Pacífico__Directos","name":"Pacífico - Directos","area":424455.0,"pct":3.0},{"id":"Bajo_Magdalena_Cauca","name":"Bajo Magdalena- Cauca -San Jorge","area":400545.2,"pct":2.9}];
  const SZH_DATA={"Atrato - Darién": [{"name": "Río Salaquí  y otros directos Bajo Atrato", "area": 583026.9}, {"name": "Río Sucio", "area": 543898.2}, {"name": "Río Murrí", "area": 346163.6}, {"name": "Directos Atrato entre ríos Quito y Bojayá (mi)", "area": 309047.1}, {"name": "Río Murindó - Directos al Atrato", "area": 274633.3}, {"name": "Río Bebaramá y otros Directos Atrato (md)", "area": 260281.3}, {"name": "Directos Bajo Atrato entre río Sucio y desembocadura", "area": 209051.4}, {"name": "Río Quito", "area": 184314.0}, {"name": "Río Bojayá", "area": 182360.2}, {"name": "Alto Atrato", "area": 165134.7}, {"name": "Directos Atrato entre ríos Bebaramá y Murrí (md)", "area": 159761.4}, {"name": "Río Napipí - Río Opogadó", "area": 117412.4}, {"name": "Río Tanela y otros Directos al Atrato", "area": 114769.0}, {"name": "Río Perancho", "area": 110294.0}, {"name": "Río Andagueda", "area": 91174.2}, {"name": "Río Tolo y otros Directos al Caribe", "area": 72231.9}, {"name": "Río Cabi y otros Directos Atrato (md)", "area": 47175.2}], "Caribe - Litoral": [{"name": "Río Mulatos y otros directos al Caribe", "area": 265844.1}, {"name": "Río León", "area": 240310.3}, {"name": "Río San Juan", "area": 15594.8}], "Sinú": [{"name": "Alto Sinú - Urrá", "area": 460803.0}, {"name": "Medio Sinú", "area": 46325.5}], "Bajo Magdalena- Cauca -San Jorge": [{"name": "Alto San Jorge", "area": 178.8}], "Cauca": [{"name": "Rios Pescador - RUT - Chanco - Catarina y Cañaveral", "area": 5554.7}, {"name": "Directos Río Cauca entre Río San Juan y Pto Valdia", "area": 645.1}, {"name": "Rios Arroyohondo - Yumbo - Mulalo - Vijes - Yotoco", "area": 443.5}, {"name": "Río San Juan (Cauca)", "area": 350.0}, {"name": "Río Frío", "area": 286.5}, {"name": "Río Risaralda", "area": 173.5}, {"name": "Río Timba", "area": 129.3}, {"name": "Rio Salado y otros directos Cauca", "area": 78.9}, {"name": "Río Cali", "area": 29.0}, {"name": "Ríos Claro y Jamundí", "area": 18.6}], "Mira": [{"name": "Río Mira", "area": 402486.8}, {"name": "Río Rosario", "area": 85569.0}, {"name": "Río Chagüí", "area": 54592.9}, {"name": "Río San Juan (Frontera Ecuador)", "area": 40438.2}], "Patía": [{"name": "Río Patia Bajo", "area": 467214.3}, {"name": "Río Telembí", "area": 464317.9}, {"name": "Río Patia Medio", "area": 233933.9}, {"name": "Río Guáitara", "area": 642.7}, {"name": "Río Patia Alto", "area": 260.9}], "Tapaje - Dagua - Directos": [{"name": "Río San Juan del Micay", "area": 446825.4}, {"name": "Río Naya - Yurumanguí", "area": 264892.4}, {"name": "Río Guapi", "area": 263453.4}, {"name": "Río Iscuandé", "area": 231394.8}, {"name": "Ríos Cajambre - Mayorquín - Raposo", "area": 203351.0}, {"name": "Dagua - Buenaventura - Bahia Málaga", "area": 193805.5}, {"name": "Río Tapaje", "area": 161163.7}, {"name": "Río Anchicayá", "area": 126788.4}, {"name": "Río Saija", "area": 110112.6}, {"name": "Río Timbiquí", "area": 79609.1}], "San Juán": [{"name": "Ríos Calima y  Bajo San Juan", "area": 353126.7}, {"name": "Río Sipí", "area": 301756.6}, {"name": "Río Tamaná y otros Directos San Juan", "area": 282988.2}, {"name": "Río Capoma y otros directos al San Juan", "area": 242960.6}, {"name": "Río San Juan Alto", "area": 203733.7}, {"name": "Río San Juan Medio", "area": 94108.9}, {"name": "Río Munguidó", "area": 85000.6}, {"name": "Río Cajón", "area": 73596.6}], "Baudó - Directos Pacifico": [{"name": "Río Baudó", "area": 403962.0}, {"name": "Río Docampadó y Directos Pacífico", "area": 192518.9}], "Pacífico - Directos": [{"name": "Directos Pacifico Frontera Panamá", "area": 424455.0}]};
  
  const HUMEDAL_MUNIS={"choco": [{"name": "Carmen Del Darién", "Humedal Permanente Abierto": 14360.2, "Humedal Permanente Bajo Dosel": 78921.9, "Humedal Temporal": 79084.8, "Potencial Bajo": 16.9, "Potencial Medio": 20801.8}, {"name": "Riosucio", "Humedal Permanente Abierto": 9095.1, "Humedal Permanente Bajo Dosel": 69893.1, "Humedal Temporal": 76002.2, "Potencial Bajo": 229.9, "Potencial Medio": 19868.8}, {"name": "Belén de bajirá", "Humedal Permanente Abierto": 2841.3, "Humedal Permanente Bajo Dosel": 27623.6, "Humedal Temporal": 72939.0, "Potencial Bajo": 46.2, "Potencial Medio": 45471.1}, {"name": "El Litoral Del San Juán", "Humedal Permanente Abierto": 21894.5, "Humedal Permanente Bajo Dosel": 1262.9, "Humedal Temporal": 50545.9, "Potencial Bajo": 11799.0, "Potencial Medio": 32412.9}, {"name": "Medio Atrato", "Humedal Permanente Abierto": 7286.0, "Humedal Permanente Bajo Dosel": 5988.5, "Humedal Temporal": 73560.9, "Potencial Bajo": 1601.9, "Potencial Medio": 1443.0}, {"name": "Quibdó", "Humedal Permanente Abierto": 7050.0, "Humedal Permanente Bajo Dosel": 3988.3, "Humedal Temporal": 61424.4, "Potencial Bajo": 606.0, "Potencial Medio": 8314.5}, {"name": "Bajo Baudó", "Humedal Permanente Abierto": 16213.7, "Humedal Permanente Bajo Dosel": 567.2, "Humedal Temporal": 50025.9, "Potencial Bajo": 2696.9, "Potencial Medio": 11453.9}, {"name": "Bojayá", "Humedal Permanente Abierto": 8050.5, "Humedal Permanente Bajo Dosel": 11525.1, "Humedal Temporal": 33413.0, "Potencial Bajo": 9.0, "Potencial Medio": 12554.0}, {"name": "Unguía", "Humedal Permanente Abierto": 5185.7, "Humedal Permanente Bajo Dosel": 6639.8, "Humedal Temporal": 24462.7, "Potencial Bajo": 6907.1, "Potencial Medio": 6569.7}, {"name": "Istmina", "Humedal Permanente Abierto": 3796.9, "Humedal Permanente Bajo Dosel": 186.6, "Humedal Temporal": 22676.6, "Potencial Bajo": 189.1, "Potencial Medio": 8667.1}, {"name": "Medio Baudó", "Humedal Permanente Abierto": 3196.4, "Humedal Permanente Bajo Dosel": 128.1, "Humedal Temporal": 22289.1, "Potencial Bajo": 140.1, "Potencial Medio": 6132.0}, {"name": "Medio San Juan", "Humedal Permanente Abierto": 2895.8, "Humedal Permanente Bajo Dosel": 262.2, "Humedal Temporal": 20179.0, "Potencial Bajo": 220.2, "Potencial Medio": 7769.6}, {"name": "Sipí", "Humedal Permanente Abierto": 4000.9, "Humedal Permanente Bajo Dosel": 492.6, "Humedal Temporal": 12295.8, "Potencial Bajo": 0.0, "Potencial Medio": 11664.7}, {"name": "Nóvita", "Humedal Permanente Abierto": 1579.5, "Humedal Permanente Bajo Dosel": 158.3, "Humedal Temporal": 7116.9, "Potencial Bajo": 111.6, "Potencial Medio": 16837.3}, {"name": "Rio Quito", "Humedal Permanente Abierto": 1424.9, "Humedal Permanente Bajo Dosel": 235.6, "Humedal Temporal": 21925.8, "Potencial Bajo": 14.1, "Potencial Medio": 1660.2}, {"name": "Atrato (Yuto)", "Humedal Permanente Abierto": 1438.0, "Humedal Permanente Bajo Dosel": 13.9, "Humedal Temporal": 14339.1, "Potencial Bajo": 22.9, "Potencial Medio": 5856.1}, {"name": "Alto Baudó", "Humedal Permanente Abierto": 2893.8, "Humedal Permanente Bajo Dosel": 6.8, "Humedal Temporal": 13824.7, "Potencial Bajo": 8.2, "Potencial Medio": 3404.9}, {"name": "El Cantón Del San Pablo", "Humedal Permanente Abierto": 687.9, "Humedal Permanente Bajo Dosel": 29.5, "Humedal Temporal": 18455.0, "Potencial Bajo": 5.7, "Potencial Medio": 428.9}, {"name": "Lloró", "Humedal Permanente Abierto": 1917.5, "Humedal Permanente Bajo Dosel": 9.3, "Humedal Temporal": 7737.5, "Potencial Bajo": 3.0, "Potencial Medio": 7072.2}, {"name": "Unión Panamericana", "Humedal Permanente Abierto": 245.0, "Humedal Permanente Bajo Dosel": 25.3, "Humedal Temporal": 13354.9, "Potencial Bajo": 13.9, "Potencial Medio": 0.0}, {"name": "Juradó", "Humedal Permanente Abierto": 1558.4, "Humedal Permanente Bajo Dosel": 25.6, "Humedal Temporal": 6152.7, "Potencial Bajo": 0.8, "Potencial Medio": 5131.3}, {"name": "Acandí", "Humedal Permanente Abierto": 766.5, "Humedal Permanente Bajo Dosel": 176.0, "Humedal Temporal": 2654.4, "Potencial Bajo": 93.7, "Potencial Medio": 8957.1}, {"name": "Bahía Solano", "Humedal Permanente Abierto": 682.3, "Humedal Permanente Bajo Dosel": 277.0, "Humedal Temporal": 8597.6, "Potencial Bajo": 85.9, "Potencial Medio": 2978.9}, {"name": "Nuquí", "Humedal Permanente Abierto": 4566.8, "Humedal Permanente Bajo Dosel": 22.1, "Humedal Temporal": 1271.3, "Potencial Bajo": 14.0, "Potencial Medio": 3741.1}, {"name": "Condoto", "Humedal Permanente Abierto": 1036.0, "Humedal Permanente Bajo Dosel": 60.8, "Humedal Temporal": 3432.1, "Potencial Bajo": 71.0, "Potencial Medio": 3608.2}, {"name": "Cértegui", "Humedal Permanente Abierto": 659.2, "Humedal Permanente Bajo Dosel": 10.2, "Humedal Temporal": 5724.6, "Potencial Bajo": 50.3, "Potencial Medio": 356.9}, {"name": "El Carmen", "Humedal Permanente Abierto": 1043.1, "Humedal Permanente Bajo Dosel": 0.0, "Humedal Temporal": 256.4, "Potencial Bajo": 0.0, "Potencial Medio": 4199.5}, {"name": "Tadó", "Humedal Permanente Abierto": 1301.3, "Humedal Permanente Bajo Dosel": 2.7, "Humedal Temporal": 1479.8, "Potencial Bajo": 23.1, "Potencial Medio": 1378.8}, {"name": "Rio Iró", "Humedal Permanente Abierto": 489.7, "Humedal Permanente Bajo Dosel": 0.0, "Humedal Temporal": 15.6, "Potencial Bajo": 6.0, "Potencial Medio": 2839.4}, {"name": "Bagadó", "Humedal Permanente Abierto": 872.1, "Humedal Permanente Bajo Dosel": 0.0, "Humedal Temporal": 349.8, "Potencial Bajo": 15.2, "Potencial Medio": 1450.0}, {"name": "San José Del Palmar", "Humedal Permanente Abierto": 1317.3, "Humedal Permanente Bajo Dosel": 0.0, "Humedal Temporal": 1.3, "Potencial Bajo": 6.7, "Potencial Medio": 265.8}], "narino": [{"name": "Tumaco", "Humedal Permanente Abierto": 10256.0, "Humedal Permanente Bajo Dosel": 5998.0, "Humedal Temporal": 108475.0, "Potencial Bajo": 34398.0, "Potencial Medio": 1603.4}, {"name": "Olaya Herrera", "Humedal Permanente Abierto": 13987.9, "Humedal Permanente Bajo Dosel": 16097.6, "Humedal Temporal": 67950.1, "Potencial Bajo": 0.0, "Potencial Medio": 0.0}, {"name": "El Charco", "Humedal Permanente Abierto": 8134.6, "Humedal Permanente Bajo Dosel": 11697.2, "Humedal Temporal": 68673.1, "Potencial Bajo": 693.3, "Potencial Medio": 0.0}, {"name": "Roberto Payán", "Humedal Permanente Abierto": 12615.7, "Humedal Permanente Bajo Dosel": 3225.6, "Humedal Temporal": 60180.9, "Potencial Bajo": 43.1, "Potencial Medio": 358.3}, {"name": "Mosquera", "Humedal Permanente Abierto": 17609.1, "Humedal Permanente Bajo Dosel": 40847.8, "Humedal Temporal": 11620.3, "Potencial Bajo": 0.0, "Potencial Medio": 0.0}, {"name": "Santa Bárbara", "Humedal Permanente Abierto": 6836.8, "Humedal Permanente Bajo Dosel": 10746.5, "Humedal Temporal": 28906.2, "Potencial Bajo": 0.0, "Potencial Medio": 45.5}, {"name": "Magüí", "Humedal Permanente Abierto": 5461.7, "Humedal Permanente Bajo Dosel": 901.5, "Humedal Temporal": 32236.0, "Potencial Bajo": 15.3, "Potencial Medio": 3077.4}, {"name": "La Tola", "Humedal Permanente Abierto": 8165.8, "Humedal Permanente Bajo Dosel": 11297.1, "Humedal Temporal": 21935.4, "Potencial Bajo": 0.0, "Potencial Medio": 0.0}, {"name": "Francisco Pizarro", "Humedal Permanente Abierto": 3431.0, "Humedal Permanente Bajo Dosel": 1303.2, "Humedal Temporal": 31915.3, "Potencial Bajo": 262.9, "Potencial Medio": 476.3}, {"name": "Cumbal", "Humedal Permanente Abierto": 79.6, "Humedal Permanente Bajo Dosel": 0.0, "Humedal Temporal": 461.0, "Potencial Bajo": 7472.8, "Potencial Medio": 0.0}, {"name": "Barbacoas", "Humedal Permanente Abierto": 3051.9, "Humedal Permanente Bajo Dosel": 2.0, "Humedal Temporal": 1829.0, "Potencial Bajo": 41.0, "Potencial Medio": 0.0}, {"name": "Ricaurte", "Humedal Permanente Abierto": 681.6, "Humedal Permanente Bajo Dosel": 0.0, "Humedal Temporal": 27.0, "Potencial Bajo": 25.2, "Potencial Medio": 0.0}, {"name": "Mallama", "Humedal Permanente Abierto": 173.6, "Humedal Permanente Bajo Dosel": 0.0, "Humedal Temporal": 0.0, "Potencial Bajo": 507.2, "Potencial Medio": 0.0}, {"name": "Los Andes", "Humedal Permanente Abierto": 496.9, "Humedal Permanente Bajo Dosel": 0.0, "Humedal Temporal": 5.9, "Potencial Bajo": 0.0, "Potencial Medio": 0.0}, {"name": "Sapuyes", "Humedal Permanente Abierto": 21.6, "Humedal Permanente Bajo Dosel": 0.0, "Humedal Temporal": 0.0, "Potencial Bajo": 390.3, "Potencial Medio": 0.0}, {"name": "Policarpa", "Humedal Permanente Abierto": 277.4, "Humedal Permanente Bajo Dosel": 0.0, "Humedal Temporal": 9.6, "Potencial Bajo": 0.0, "Potencial Medio": 0.0}, {"name": "Cumbitara", "Humedal Permanente Abierto": 238.5, "Humedal Permanente Bajo Dosel": 0.0, "Humedal Temporal": 7.0, "Potencial Bajo": 0.0, "Potencial Medio": 0.0}, {"name": "Santa Cruz", "Humedal Permanente Abierto": 226.0, "Humedal Permanente Bajo Dosel": 0.0, "Humedal Temporal": 0.0, "Potencial Bajo": 1.8, "Potencial Medio": 0.0}, {"name": "Samaniego", "Humedal Permanente Abierto": 219.1, "Humedal Permanente Bajo Dosel": 0.0, "Humedal Temporal": 0.0, "Potencial Bajo": 0.0, "Potencial Medio": 0.0}, {"name": "La Llanada", "Humedal Permanente Abierto": 168.6, "Humedal Permanente Bajo Dosel": 0.0, "Humedal Temporal": 3.5, "Potencial Bajo": 0.0, "Potencial Medio": 0.0}, {"name": "El Rosario", "Humedal Permanente Abierto": 146.9, "Humedal Permanente Bajo Dosel": 0.0, "Humedal Temporal": 0.0, "Potencial Bajo": 0.0, "Potencial Medio": 0.0}, {"name": "Leiva", "Humedal Permanente Abierto": 0.0, "Humedal Permanente Bajo Dosel": 0.0, "Humedal Temporal": 33.5, "Potencial Bajo": 0.0, "Potencial Medio": 0.0}], "antioquia": [{"name": "Turbo", "Humedal Permanente Abierto": 13072.5, "Humedal Permanente Bajo Dosel": 22024.0, "Humedal Temporal": 100891.1, "Potencial Bajo": 7446.9, "Potencial Medio": 40181.4}, {"name": "Vigía Del Fuerte", "Humedal Permanente Abierto": 8199.8, "Humedal Permanente Bajo Dosel": 17504.9, "Humedal Temporal": 54930.3, "Potencial Bajo": 15065.2, "Potencial Medio": 8598.6}, {"name": "Murindó", "Humedal Permanente Abierto": 5280.2, "Humedal Permanente Bajo Dosel": 17643.3, "Humedal Temporal": 41634.7, "Potencial Bajo": 1213.1, "Potencial Medio": 9054.9}, {"name": "Necoclí", "Humedal Permanente Abierto": 1919.6, "Humedal Permanente Bajo Dosel": 1566.1, "Humedal Temporal": 22853.6, "Potencial Bajo": 5489.3, "Potencial Medio": 15771.0}, {"name": "Chigorodó", "Humedal Permanente Abierto": 996.0, "Humedal Permanente Bajo Dosel": 456.4, "Humedal Temporal": 6928.2, "Potencial Bajo": 11170.6, "Potencial Medio": 19952.0}, {"name": "Mutatá", "Humedal Permanente Abierto": 2403.5, "Humedal Permanente Bajo Dosel": 17.8, "Humedal Temporal": 4441.2, "Potencial Bajo": 13853.5, "Potencial Medio": 6301.4}, {"name": "Carepa", "Humedal Permanente Abierto": 329.5, "Humedal Permanente Bajo Dosel": 2875.3, "Humedal Temporal": 10120.9, "Potencial Bajo": 1211.6, "Potencial Medio": 9532.8}, {"name": "Urrao", "Humedal Permanente Abierto": 1195.3, "Humedal Permanente Bajo Dosel": 1.5, "Humedal Temporal": 289.9, "Potencial Bajo": 8704.6, "Potencial Medio": 11359.6}, {"name": "Apartadó", "Humedal Permanente Abierto": 404.7, "Humedal Permanente Bajo Dosel": 134.9, "Humedal Temporal": 3041.3, "Potencial Bajo": 1676.9, "Potencial Medio": 14062.0}, {"name": "Frontino", "Humedal Permanente Abierto": 888.1, "Humedal Permanente Bajo Dosel": 0.0, "Humedal Temporal": 70.5, "Potencial Bajo": 3641.5, "Potencial Medio": 5484.5}, {"name": "Dabeiba", "Humedal Permanente Abierto": 961.7, "Humedal Permanente Bajo Dosel": 0.0, "Humedal Temporal": 0.0, "Potencial Bajo": 4178.7, "Potencial Medio": 1796.8}, {"name": "San Pedro De Urabá", "Humedal Permanente Abierto": 115.9, "Humedal Permanente Bajo Dosel": 0.0, "Humedal Temporal": 15.6, "Potencial Bajo": 3654.5, "Potencial Medio": 1659.4}, {"name": "Abriaquí", "Humedal Permanente Abierto": 0.0, "Humedal Permanente Bajo Dosel": 0.0, "Humedal Temporal": 0.0, "Potencial Bajo": 2201.7, "Potencial Medio": 2478.4}, {"name": "Cañasgordas", "Humedal Permanente Abierto": 1.0, "Humedal Permanente Bajo Dosel": 0.0, "Humedal Temporal": 0.0, "Potencial Bajo": 788.9, "Potencial Medio": 380.4}, {"name": "Ituango", "Humedal Permanente Abierto": 109.1, "Humedal Permanente Bajo Dosel": 0.0, "Humedal Temporal": 0.0, "Potencial Bajo": 122.3, "Potencial Medio": 161.4}, {"name": "Uramita", "Humedal Permanente Abierto": 140.8, "Humedal Permanente Bajo Dosel": 0.0, "Humedal Temporal": 0.0, "Potencial Bajo": 232.5, "Potencial Medio": 0.0}], "cauca": [{"name": "López", "Humedal Permanente Abierto": 7479.8, "Humedal Permanente Bajo Dosel": 10322.7, "Humedal Temporal": 38524.5, "Potencial Bajo": 240.1, "Potencial Medio": 3519.4}, {"name": "Guapi", "Humedal Permanente Abierto": 6407.3, "Humedal Permanente Bajo Dosel": 6253.0, "Humedal Temporal": 27086.4, "Potencial Bajo": 340.4, "Potencial Medio": 12128.2}, {"name": "Timbiquí", "Humedal Permanente Abierto": 5728.1, "Humedal Permanente Bajo Dosel": 10653.3, "Humedal Temporal": 22685.4, "Potencial Bajo": 32.0, "Potencial Medio": 601.2}, {"name": "El Tambo", "Humedal Permanente Abierto": 497.1, "Humedal Permanente Bajo Dosel": 0.0, "Humedal Temporal": 12.5, "Potencial Bajo": 0.0, "Potencial Medio": 0.0}, {"name": "Argelia", "Humedal Permanente Abierto": 188.4, "Humedal Permanente Bajo Dosel": 0.0, "Humedal Temporal": 0.0, "Potencial Bajo": 41.7, "Potencial Medio": 0.0}], "valle": [{"name": "Buenaventura", "Humedal Permanente Abierto": 23759.1, "Humedal Permanente Bajo Dosel": 21658.8, "Humedal Temporal": 46187.2, "Potencial Bajo": 4184.7, "Potencial Medio": 19411.8}, {"name": "Versalles", "Humedal Permanente Abierto": 229.1, "Humedal Permanente Bajo Dosel": 0.0, "Humedal Temporal": 173.0, "Potencial Bajo": 5333.7, "Potencial Medio": 0.0}, {"name": "Calima", "Humedal Permanente Abierto": 2658.5, "Humedal Permanente Bajo Dosel": 1.2, "Humedal Temporal": 478.7, "Potencial Bajo": 903.9, "Potencial Medio": 1593.9}, {"name": "El Dovio", "Humedal Permanente Abierto": 514.8, "Humedal Permanente Bajo Dosel": 0.0, "Humedal Temporal": 334.8, "Potencial Bajo": 2116.8, "Potencial Medio": 0.0}, {"name": "Bolívar", "Humedal Permanente Abierto": 709.9, "Humedal Permanente Bajo Dosel": 0.0, "Humedal Temporal": 519.7, "Potencial Bajo": 31.2, "Potencial Medio": 0.0}, {"name": "La Cumbre", "Humedal Permanente Abierto": 36.3, "Humedal Permanente Bajo Dosel": 0.0, "Humedal Temporal": 51.9, "Potencial Bajo": 12.6, "Potencial Medio": 685.1}, {"name": "Restrepo", "Humedal Permanente Abierto": 0.0, "Humedal Permanente Bajo Dosel": 0.0, "Humedal Temporal": 184.2, "Potencial Bajo": 0.0, "Potencial Medio": 571.1}, {"name": "Roldanillo", "Humedal Permanente Abierto": 9.1, "Humedal Permanente Bajo Dosel": 0.0, "Humedal Temporal": 10.7, "Potencial Bajo": 731.6, "Potencial Medio": 0.0}, {"name": "Argelia", "Humedal Permanente Abierto": 16.2, "Humedal Permanente Bajo Dosel": 0.0, "Humedal Temporal": 0.0, "Potencial Bajo": 728.6, "Potencial Medio": 0.0}, {"name": "El Cairo", "Humedal Permanente Abierto": 200.1, "Humedal Permanente Bajo Dosel": 0.0, "Humedal Temporal": 0.0, "Potencial Bajo": 398.2, "Potencial Medio": 0.0}, {"name": "Dagua", "Humedal Permanente Abierto": 434.7, "Humedal Permanente Bajo Dosel": 0.0, "Humedal Temporal": 0.0, "Potencial Bajo": 0.0, "Potencial Medio": 0.0}, {"name": "Yotoco", "Humedal Permanente Abierto": 62.4, "Humedal Permanente Bajo Dosel": 0.0, "Humedal Temporal": 0.0, "Potencial Bajo": 7.3, "Potencial Medio": 361.9}, {"name": "Vijes", "Humedal Permanente Abierto": 0.0, "Humedal Permanente Bajo Dosel": 0.0, "Humedal Temporal": 0.0, "Potencial Bajo": 0.0, "Potencial Medio": 289.0}, {"name": "La Unión", "Humedal Permanente Abierto": 0.0, "Humedal Permanente Bajo Dosel": 0.0, "Humedal Temporal": 21.8, "Potencial Bajo": 0.0, "Potencial Medio": 0.0}], "cordoba": [{"name": "Tierralta", "Humedal Permanente Abierto": 9496.3, "Humedal Permanente Bajo Dosel": 332.9, "Humedal Temporal": 1362.1, "Potencial Bajo": 9835.2, "Potencial Medio": 7254.3}, {"name": "Valencia", "Humedal Permanente Abierto": 77.7, "Humedal Permanente Bajo Dosel": 5.1, "Humedal Temporal": 478.0, "Potencial Bajo": 1610.1, "Potencial Medio": 2760.9}], "risaralda": [{"name": "Pueblo Rico", "Humedal Permanente Abierto": 282.8, "Humedal Permanente Bajo Dosel": 0.0, "Humedal Temporal": 0.0, "Potencial Bajo": 19.6, "Potencial Medio": 0.0}, {"name": "Mistrató", "Humedal Permanente Abierto": 220.2, "Humedal Permanente Bajo Dosel": 0.0, "Humedal Temporal": 0.0, "Potencial Bajo": 0.0, "Potencial Medio": 0.0}]};
  
  const HUMEDAL_DATA={"deptos": ["Chocó", "Nariño", "Antioquia", "Cauca", "Valle del Cauca", "Córdoba", "Risaralda"], "tipos": [{"nombre": "Humedal Permanente Abierto", "color": "#2685FF", "datos": [130346.1, 92280.3, 36017.6, 20300.6, 28630.2, 9573.9, 502.9]}, {"nombre": "Humedal Permanente Bajo Dosel", "color": "#88BDFF", "datos": [208533.2, 102116.5, 62224.3, 27229.0, 21660.0, 338.0, 0.0]}, {"nombre": "Humedal Temporal", "color": "#88E4FF", "datos": [725588.9, 434268.6, 245217.3, 88308.8, 47962.0, 1840.1, 0.0]}, {"nombre": "Potencial Bajo", "color": "#56B526", "datos": [25008.3, 43851.0, 80651.8, 654.2, 14448.7, 11445.3, 19.6]}, {"nombre": "Potencial Medio", "color": "#26B596", "datos": [263289.6, 5560.9, 146774.7, 16248.7, 22912.9, 10015.2, 0.0]}]};
  
  const RUNAP_DATA={"deptos": ["Valle del Cauca", "Chocó", "Córdoba", "Antioquia", "Nariño", "Cauca", "Risaralda"], "categorias": [{"nombre": "Distritos Nacionales de Manejo Integrado", "datos": [0.0, 0.0, 0.0, 0.0, 10292.7, 0.0, 0.0]}, {"nombre": "Distritos Regionales de Manejo Integrado", "datos": [79846.6, 172144.8, 18.0, 73449.1, 0.0, 0.0, 18543.2]}, {"nombre": "Distritos de Conservación de Suelos", "datos": [10727.4, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]}, {"nombre": "Parque Nacional Natural", "datos": [170495.7, 143051.5, 294951.6, 136123.1, 86067.7, 47003.6, 9948.3]}, {"nombre": "Parques Naturales Regionales", "datos": [37337.1, 130.4, 0.0, 5469.5, 3827.7, 808.2, 182.7]}, {"nombre": "Reserva Natural de la Sociedad Civil", "datos": [2540.1, 1986.3, 0.0, 3400.1, 438.9, 224.3, 0.0]}, {"nombre": "Reservas Forestales Protectoras Nacionales", "datos": [88482.9, 84144.6, 0.0, 68842.0, 6687.4, 0.0, 0.0]}, {"nombre": "Reservas Forestales Protectoras Regionales", "datos": [24488.9, 571.8, 0.0, 0.0, 46.6, 18894.1, 294.8]}, {"nombre": "Santuario de Fauna", "datos": [0.0, 7.2, 0.0, 0.0, 0.0, 0.0, 0.0]}]};
  const RUNAP_MUNIS={"valle": [{"name": "Buenaventura", "Distritos Nacionales de Manejo Integrado": 0, "Distritos Regionales de Manejo Integrado": 18860.6, "Distritos de Conservación de Suelos": 0, "Parque Nacional Natural": 157020.6, "Parques Naturales Regionales": 25209.2, "Reserva Natural de la Sociedad Civil": 0, "Reservas Forestales Protectoras Nacionales": 66615.4, "Reservas Forestales Protectoras Regionales": 0, "Santuario de Fauna": 0}, {"name": "Calima", "Distritos Nacionales de Manejo Integrado": 0, "Distritos Regionales de Manejo Integrado": 18105.7, "Distritos de Conservación de Suelos": 0, "Parque Nacional Natural": 0, "Parques Naturales Regionales": 8530.8, "Reserva Natural de la Sociedad Civil": 566.2, "Reservas Forestales Protectoras Nacionales": 49.0, "Reservas Forestales Protectoras Regionales": 24286.6, "Santuario de Fauna": 0}, {"name": "Dagua", "Distritos Nacionales de Manejo Integrado": 0, "Distritos Regionales de Manejo Integrado": 3249.2, "Distritos de Conservación de Suelos": 1235.8, "Parque Nacional Natural": 13475.1, "Parques Naturales Regionales": 0, "Reserva Natural de la Sociedad Civil": 587.4, "Reservas Forestales Protectoras Nacionales": 21633.0, "Reservas Forestales Protectoras Regionales": 25.3, "Santuario de Fauna": 0}, {"name": "El Cairo", "Distritos Nacionales de Manejo Integrado": 0, "Distritos Regionales de Manejo Integrado": 21286.4, "Distritos de Conservación de Suelos": 0, "Parque Nacional Natural": 0, "Parques Naturales Regionales": 0, "Reserva Natural de la Sociedad Civil": 496.3, "Reservas Forestales Protectoras Nacionales": 0, "Reservas Forestales Protectoras Regionales": 0, "Santuario de Fauna": 0}, {"name": "Versalles", "Distritos Nacionales de Manejo Integrado": 0, "Distritos Regionales de Manejo Integrado": 9290.3, "Distritos de Conservación de Suelos": 0, "Parque Nacional Natural": 0, "Parques Naturales Regionales": 0, "Reserva Natural de la Sociedad Civil": 605.7, "Reservas Forestales Protectoras Nacionales": 0, "Reservas Forestales Protectoras Regionales": 0, "Santuario de Fauna": 0}, {"name": "El Dovio", "Distritos Nacionales de Manejo Integrado": 0, "Distritos Regionales de Manejo Integrado": 9002.7, "Distritos de Conservación de Suelos": 0, "Parque Nacional Natural": 0, "Parques Naturales Regionales": 0, "Reserva Natural de la Sociedad Civil": 88.8, "Reservas Forestales Protectoras Nacionales": 0, "Reservas Forestales Protectoras Regionales": 0, "Santuario de Fauna": 0}, {"name": "La Cumbre", "Distritos Nacionales de Manejo Integrado": 0, "Distritos Regionales de Manejo Integrado": 1.0, "Distritos de Conservación de Suelos": 6184.5, "Parque Nacional Natural": 0, "Parques Naturales Regionales": 0, "Reserva Natural de la Sociedad Civil": 81.5, "Reservas Forestales Protectoras Nacionales": 180.5, "Reservas Forestales Protectoras Regionales": 177.0, "Santuario de Fauna": 0}, {"name": "Restrepo", "Distritos Nacionales de Manejo Integrado": 0, "Distritos Regionales de Manejo Integrado": 0, "Distritos de Conservación de Suelos": 3043.8, "Parque Nacional Natural": 0, "Parques Naturales Regionales": 0, "Reserva Natural de la Sociedad Civil": 16.0, "Reservas Forestales Protectoras Nacionales": 0, "Reservas Forestales Protectoras Regionales": 0, "Santuario de Fauna": 0}, {"name": "Bolívar", "Distritos Nacionales de Manejo Integrado": 0, "Distritos Regionales de Manejo Integrado": 24.6, "Distritos de Conservación de Suelos": 0, "Parque Nacional Natural": 0, "Parques Naturales Regionales": 2752.0, "Reserva Natural de la Sociedad Civil": 65.1, "Reservas Forestales Protectoras Nacionales": 0, "Reservas Forestales Protectoras Regionales": 0, "Santuario de Fauna": 0}, {"name": "Trujillo", "Distritos Nacionales de Manejo Integrado": 0, "Distritos Regionales de Manejo Integrado": 11.0, "Distritos de Conservación de Suelos": 0, "Parque Nacional Natural": 0, "Parques Naturales Regionales": 845.1, "Reserva Natural de la Sociedad Civil": 0, "Reservas Forestales Protectoras Nacionales": 0, "Reservas Forestales Protectoras Regionales": 0, "Santuario de Fauna": 0}, {"name": "Vijes", "Distritos Nacionales de Manejo Integrado": 0, "Distritos Regionales de Manejo Integrado": 0, "Distritos de Conservación de Suelos": 263.3, "Parque Nacional Natural": 0, "Parques Naturales Regionales": 0, "Reserva Natural de la Sociedad Civil": 0, "Reservas Forestales Protectoras Nacionales": 0, "Reservas Forestales Protectoras Regionales": 0, "Santuario de Fauna": 0}, {"name": "Roldanillo", "Distritos Nacionales de Manejo Integrado": 0, "Distritos Regionales de Manejo Integrado": 0.0, "Distritos de Conservación de Suelos": 0, "Parque Nacional Natural": 0, "Parques Naturales Regionales": 0, "Reserva Natural de la Sociedad Civil": 33.1, "Reservas Forestales Protectoras Nacionales": 0, "Reservas Forestales Protectoras Regionales": 0, "Santuario de Fauna": 0}, {"name": "Yotoco", "Distritos Nacionales de Manejo Integrado": 0, "Distritos Regionales de Manejo Integrado": 14.9, "Distritos de Conservación de Suelos": 0, "Parque Nacional Natural": 0, "Parques Naturales Regionales": 0, "Reserva Natural de la Sociedad Civil": 0, "Reservas Forestales Protectoras Nacionales": 4.9, "Reservas Forestales Protectoras Regionales": 0, "Santuario de Fauna": 0}, {"name": "Argelia", "Distritos Nacionales de Manejo Integrado": 0, "Distritos Regionales de Manejo Integrado": 0.1, "Distritos de Conservación de Suelos": 0, "Parque Nacional Natural": 0, "Parques Naturales Regionales": 0, "Reserva Natural de la Sociedad Civil": 0, "Reservas Forestales Protectoras Nacionales": 0, "Reservas Forestales Protectoras Regionales": 0, "Santuario de Fauna": 0}], "cauca": [{"name": "El Tambo", "Distritos Nacionales de Manejo Integrado": 0, "Distritos Regionales de Manejo Integrado": 0, "Distritos de Conservación de Suelos": 0, "Parque Nacional Natural": 46995.3, "Parques Naturales Regionales": 0, "Reserva Natural de la Sociedad Civil": 224.3, "Reservas Forestales Protectoras Nacionales": 0, "Reservas Forestales Protectoras Regionales": 0, "Santuario de Fauna": 0}, {"name": "Timbiquí", "Distritos Nacionales de Manejo Integrado": 0, "Distritos Regionales de Manejo Integrado": 0, "Distritos de Conservación de Suelos": 0, "Parque Nacional Natural": 0, "Parques Naturales Regionales": 803.6, "Reserva Natural de la Sociedad Civil": 0, "Reservas Forestales Protectoras Nacionales": 0, "Reservas Forestales Protectoras Regionales": 7430.3, "Santuario de Fauna": 0}, {"name": "Argelia", "Distritos Nacionales de Manejo Integrado": 0, "Distritos Regionales de Manejo Integrado": 0, "Distritos de Conservación de Suelos": 0, "Parque Nacional Natural": 0, "Parques Naturales Regionales": 0, "Reserva Natural de la Sociedad Civil": 0, "Reservas Forestales Protectoras Nacionales": 0, "Reservas Forestales Protectoras Regionales": 7060.2, "Santuario de Fauna": 0}, {"name": "López", "Distritos Nacionales de Manejo Integrado": 0, "Distritos Regionales de Manejo Integrado": 0.0, "Distritos de Conservación de Suelos": 0, "Parque Nacional Natural": 8.3, "Parques Naturales Regionales": 0, "Reserva Natural de la Sociedad Civil": 0, "Reservas Forestales Protectoras Nacionales": 0, "Reservas Forestales Protectoras Regionales": 4273.3, "Santuario de Fauna": 0}, {"name": "Guapi", "Distritos Nacionales de Manejo Integrado": 0, "Distritos Regionales de Manejo Integrado": 0, "Distritos de Conservación de Suelos": 0, "Parque Nacional Natural": 0, "Parques Naturales Regionales": 4.6, "Reserva Natural de la Sociedad Civil": 0, "Reservas Forestales Protectoras Nacionales": 0, "Reservas Forestales Protectoras Regionales": 130.3, "Santuario de Fauna": 0}], "antioquia": [{"name": "Ituango", "Distritos Nacionales de Manejo Integrado": 0, "Distritos Regionales de Manejo Integrado": 0, "Distritos de Conservación de Suelos": 0, "Parque Nacional Natural": 81742.4, "Parques Naturales Regionales": 0, "Reserva Natural de la Sociedad Civil": 0, "Reservas Forestales Protectoras Nacionales": 0, "Reservas Forestales Protectoras Regionales": 0, "Santuario de Fauna": 0}, {"name": "Frontino", "Distritos Nacionales de Manejo Integrado": 0, "Distritos Regionales de Manejo Integrado": 0, "Distritos de Conservación de Suelos": 0, "Parque Nacional Natural": 21143.9, "Parques Naturales Regionales": 0, "Reserva Natural de la Sociedad Civil": 1445.2, "Reservas Forestales Protectoras Nacionales": 27559.4, "Reservas Forestales Protectoras Regionales": 0, "Santuario de Fauna": 0}, {"name": "Urrao", "Distritos Nacionales de Manejo Integrado": 0, "Distritos Regionales de Manejo Integrado": 188.4, "Distritos de Conservación de Suelos": 0, "Parque Nacional Natural": 6528.7, "Parques Naturales Regionales": 114.1, "Reserva Natural de la Sociedad Civil": 1817.3, "Reservas Forestales Protectoras Nacionales": 29869.3, "Reservas Forestales Protectoras Regionales": 0, "Santuario de Fauna": 0}, {"name": "Turbo", "Distritos Nacionales de Manejo Integrado": 0, "Distritos Regionales de Manejo Integrado": 6099.5, "Distritos de Conservación de Suelos": 0, "Parque Nacional Natural": 13135.7, "Parques Naturales Regionales": 5269.2, "Reserva Natural de la Sociedad Civil": 19.6, "Reservas Forestales Protectoras Nacionales": 11181.0, "Reservas Forestales Protectoras Regionales": 0, "Santuario de Fauna": 0}, {"name": "Necoclí", "Distritos Nacionales de Manejo Integrado": 0, "Distritos Regionales de Manejo Integrado": 25629.5, "Distritos de Conservación de Suelos": 0, "Parque Nacional Natural": 0, "Parques Naturales Regionales": 0, "Reserva Natural de la Sociedad Civil": 4.0, "Reservas Forestales Protectoras Nacionales": 0, "Reservas Forestales Protectoras Regionales": 0, "Santuario de Fauna": 0}, {"name": "Apartadó", "Distritos Nacionales de Manejo Integrado": 0, "Distritos Regionales de Manejo Integrado": 23112.4, "Distritos de Conservación de Suelos": 0, "Parque Nacional Natural": 0, "Parques Naturales Regionales": 0.9, "Reserva Natural de la Sociedad Civil": 86.0, "Reservas Forestales Protectoras Nacionales": 0, "Reservas Forestales Protectoras Regionales": 0, "Santuario de Fauna": 0}, {"name": "Dabeiba", "Distritos Nacionales de Manejo Integrado": 0, "Distritos Regionales de Manejo Integrado": 0, "Distritos de Conservación de Suelos": 0, "Parque Nacional Natural": 10171.6, "Parques Naturales Regionales": 0, "Reserva Natural de la Sociedad Civil": 0, "Reservas Forestales Protectoras Nacionales": 0, "Reservas Forestales Protectoras Regionales": 0, "Santuario de Fauna": 0}, {"name": "Carepa", "Distritos Nacionales de Manejo Integrado": 0, "Distritos Regionales de Manejo Integrado": 9609.1, "Distritos de Conservación de Suelos": 0, "Parque Nacional Natural": 35.2, "Parques Naturales Regionales": 7.3, "Reserva Natural de la Sociedad Civil": 0, "Reservas Forestales Protectoras Nacionales": 0, "Reservas Forestales Protectoras Regionales": 0, "Santuario de Fauna": 0}, {"name": "Abriaquí", "Distritos Nacionales de Manejo Integrado": 0, "Distritos Regionales de Manejo Integrado": 4248.0, "Distritos de Conservación de Suelos": 0, "Parque Nacional Natural": 1121.6, "Parques Naturales Regionales": 78.1, "Reserva Natural de la Sociedad Civil": 0, "Reservas Forestales Protectoras Nacionales": 17.9, "Reservas Forestales Protectoras Regionales": 0, "Santuario de Fauna": 0}, {"name": "Chigorodó", "Distritos Nacionales de Manejo Integrado": 0, "Distritos Regionales de Manejo Integrado": 2894.9, "Distritos de Conservación de Suelos": 0, "Parque Nacional Natural": 134.4, "Parques Naturales Regionales": 0, "Reserva Natural de la Sociedad Civil": 0, "Reservas Forestales Protectoras Nacionales": 41.2, "Reservas Forestales Protectoras Regionales": 0, "Santuario de Fauna": 0}, {"name": "Mutatá", "Distritos Nacionales de Manejo Integrado": 0, "Distritos Regionales de Manejo Integrado": 0, "Distritos de Conservación de Suelos": 0, "Parque Nacional Natural": 2109.6, "Parques Naturales Regionales": 0, "Reserva Natural de la Sociedad Civil": 28.0, "Reservas Forestales Protectoras Nacionales": 173.1, "Reservas Forestales Protectoras Regionales": 0, "Santuario de Fauna": 0}, {"name": "Cañasgordas", "Distritos Nacionales de Manejo Integrado": 0, "Distritos Regionales de Manejo Integrado": 1667.2, "Distritos de Conservación de Suelos": 0, "Parque Nacional Natural": 0, "Parques Naturales Regionales": 0, "Reserva Natural de la Sociedad Civil": 0, "Reservas Forestales Protectoras Nacionales": 0, "Reservas Forestales Protectoras Regionales": 0, "Santuario de Fauna": 0}], "choco": [{"name": "Bajo Baudó", "Distritos Nacionales de Manejo Integrado": 0, "Distritos Regionales de Manejo Integrado": 105910.8, "Distritos de Conservación de Suelos": 0, "Parque Nacional Natural": 0, "Parques Naturales Regionales": 0, "Reserva Natural de la Sociedad Civil": 0, "Reservas Forestales Protectoras Nacionales": 0, "Reservas Forestales Protectoras Regionales": 0, "Santuario de Fauna": 0}, {"name": "Riosucio", "Distritos Nacionales de Manejo Integrado": 0, "Distritos Regionales de Manejo Integrado": 0, "Distritos de Conservación de Suelos": 0, "Parque Nacional Natural": 56700.0, "Parques Naturales Regionales": 0, "Reserva Natural de la Sociedad Civil": 0, "Reservas Forestales Protectoras Nacionales": 0, "Reservas Forestales Protectoras Regionales": 0, "Santuario de Fauna": 0}, {"name": "Unguía", "Distritos Nacionales de Manejo Integrado": 0, "Distritos Regionales de Manejo Integrado": 31117.5, "Distritos de Conservación de Suelos": 0, "Parque Nacional Natural": 814.6, "Parques Naturales Regionales": 0, "Reserva Natural de la Sociedad Civil": 0, "Reservas Forestales Protectoras Nacionales": 20113.8, "Reservas Forestales Protectoras Regionales": 0, "Santuario de Fauna": 0}, {"name": "Acandí", "Distritos Nacionales de Manejo Integrado": 0, "Distritos Regionales de Manejo Integrado": 9377.9, "Distritos de Conservación de Suelos": 0, "Parque Nacional Natural": 0, "Parques Naturales Regionales": 0, "Reserva Natural de la Sociedad Civil": 160.2, "Reservas Forestales Protectoras Nacionales": 36426.4, "Reservas Forestales Protectoras Regionales": 0, "Santuario de Fauna": 7.2}, {"name": "Belén de bajirá", "Distritos Nacionales de Manejo Integrado": 0, "Distritos Regionales de Manejo Integrado": 0, "Distritos de Conservación de Suelos": 0, "Parque Nacional Natural": 7609.1, "Parques Naturales Regionales": 0, "Reserva Natural de la Sociedad Civil": 0, "Reservas Forestales Protectoras Nacionales": 27604.5, "Reservas Forestales Protectoras Regionales": 0, "Santuario de Fauna": 0}, {"name": "San José Del Palmar", "Distritos Nacionales de Manejo Integrado": 0, "Distritos Regionales de Manejo Integrado": 154.6, "Distritos de Conservación de Suelos": 0, "Parque Nacional Natural": 22246.8, "Parques Naturales Regionales": 0, "Reserva Natural de la Sociedad Civil": 35.7, "Reservas Forestales Protectoras Nacionales": 0, "Reservas Forestales Protectoras Regionales": 0, "Santuario de Fauna": 0}, {"name": "Alto Baudó", "Distritos Nacionales de Manejo Integrado": 0, "Distritos Regionales de Manejo Integrado": 0, "Distritos de Conservación de Suelos": 0, "Parque Nacional Natural": 20362.9, "Parques Naturales Regionales": 0, "Reserva Natural de la Sociedad Civil": 0, "Reservas Forestales Protectoras Nacionales": 0, "Reservas Forestales Protectoras Regionales": 0, "Santuario de Fauna": 0}, {"name": "El Carmen", "Distritos Nacionales de Manejo Integrado": 0, "Distritos Regionales de Manejo Integrado": 18025.0, "Distritos de Conservación de Suelos": 0, "Parque Nacional Natural": 0, "Parques Naturales Regionales": 0, "Reserva Natural de la Sociedad Civil": 1790.4, "Reservas Forestales Protectoras Nacionales": 0, "Reservas Forestales Protectoras Regionales": 264.6, "Santuario de Fauna": 0}, {"name": "Bojayá", "Distritos Nacionales de Manejo Integrado": 0, "Distritos Regionales de Manejo Integrado": 0, "Distritos de Conservación de Suelos": 0, "Parque Nacional Natural": 15530.2, "Parques Naturales Regionales": 0, "Reserva Natural de la Sociedad Civil": 0, "Reservas Forestales Protectoras Nacionales": 0, "Reservas Forestales Protectoras Regionales": 0, "Santuario de Fauna": 0}, {"name": "Nuquí", "Distritos Nacionales de Manejo Integrado": 0, "Distritos Regionales de Manejo Integrado": 3696.4, "Distritos de Conservación de Suelos": 0, "Parque Nacional Natural": 7626.8, "Parques Naturales Regionales": 0, "Reserva Natural de la Sociedad Civil": 0, "Reservas Forestales Protectoras Nacionales": 0, "Reservas Forestales Protectoras Regionales": 0, "Santuario de Fauna": 0}, {"name": "Bahía Solano", "Distritos Nacionales de Manejo Integrado": 0, "Distritos Regionales de Manejo Integrado": 0, "Distritos de Conservación de Suelos": 0, "Parque Nacional Natural": 8161.0, "Parques Naturales Regionales": 0, "Reserva Natural de la Sociedad Civil": 0, "Reservas Forestales Protectoras Nacionales": 0, "Reservas Forestales Protectoras Regionales": 0, "Santuario de Fauna": 0}, {"name": "Tadó", "Distritos Nacionales de Manejo Integrado": 0, "Distritos Regionales de Manejo Integrado": 0, "Distritos de Conservación de Suelos": 0, "Parque Nacional Natural": 4000.0, "Parques Naturales Regionales": 0, "Reserva Natural de la Sociedad Civil": 0, "Reservas Forestales Protectoras Nacionales": 0, "Reservas Forestales Protectoras Regionales": 0, "Santuario de Fauna": 0}, {"name": "El Litoral Del San Juán", "Distritos Nacionales de Manejo Integrado": 0, "Distritos Regionales de Manejo Integrado": 3782.8, "Distritos de Conservación de Suelos": 0, "Parque Nacional Natural": 0, "Parques Naturales Regionales": 130.4, "Reserva Natural de la Sociedad Civil": 0, "Reservas Forestales Protectoras Nacionales": 0, "Reservas Forestales Protectoras Regionales": 41.4, "Santuario de Fauna": 0}, {"name": "Bagadó", "Distritos Nacionales de Manejo Integrado": 0, "Distritos Regionales de Manejo Integrado": 0, "Distritos de Conservación de Suelos": 0, "Parque Nacional Natural": 0, "Parques Naturales Regionales": 0, "Reserva Natural de la Sociedad Civil": 0, "Reservas Forestales Protectoras Nacionales": 0, "Reservas Forestales Protectoras Regionales": 265.8, "Santuario de Fauna": 0}, {"name": "Sipí", "Distritos Nacionales de Manejo Integrado": 0, "Distritos Regionales de Manejo Integrado": 76.8, "Distritos de Conservación de Suelos": 0, "Parque Nacional Natural": 0, "Parques Naturales Regionales": 0, "Reserva Natural de la Sociedad Civil": 0, "Reservas Forestales Protectoras Nacionales": 0, "Reservas Forestales Protectoras Regionales": 0, "Santuario de Fauna": 0}, {"name": "Quibdó", "Distritos Nacionales de Manejo Integrado": 0, "Distritos Regionales de Manejo Integrado": 3.0, "Distritos de Conservación de Suelos": 0, "Parque Nacional Natural": 0, "Parques Naturales Regionales": 0, "Reserva Natural de la Sociedad Civil": 0, "Reservas Forestales Protectoras Nacionales": 0, "Reservas Forestales Protectoras Regionales": 0, "Santuario de Fauna": 0}], "narino": [{"name": "Mosquera", "Distritos Nacionales de Manejo Integrado": 0, "Distritos Regionales de Manejo Integrado": 0, "Distritos de Conservación de Suelos": 0, "Parque Nacional Natural": 36644.2, "Parques Naturales Regionales": 0, "Reserva Natural de la Sociedad Civil": 0, "Reservas Forestales Protectoras Nacionales": 0, "Reservas Forestales Protectoras Regionales": 0, "Santuario de Fauna": 0}, {"name": "Olaya Herrera", "Distritos Nacionales de Manejo Integrado": 0, "Distritos Regionales de Manejo Integrado": 0, "Distritos de Conservación de Suelos": 0, "Parque Nacional Natural": 19953.0, "Parques Naturales Regionales": 0, "Reserva Natural de la Sociedad Civil": 0, "Reservas Forestales Protectoras Nacionales": 0, "Reservas Forestales Protectoras Regionales": 0, "Santuario de Fauna": 0}, {"name": "El Charco", "Distritos Nacionales de Manejo Integrado": 0, "Distritos Regionales de Manejo Integrado": 0, "Distritos de Conservación de Suelos": 0, "Parque Nacional Natural": 15081.2, "Parques Naturales Regionales": 0, "Reserva Natural de la Sociedad Civil": 0, "Reservas Forestales Protectoras Nacionales": 0, "Reservas Forestales Protectoras Regionales": 46.6, "Santuario de Fauna": 0}, {"name": "La Tola", "Distritos Nacionales de Manejo Integrado": 0, "Distritos Regionales de Manejo Integrado": 0, "Distritos de Conservación de Suelos": 0, "Parque Nacional Natural": 14389.3, "Parques Naturales Regionales": 0, "Reserva Natural de la Sociedad Civil": 0, "Reservas Forestales Protectoras Nacionales": 0, "Reservas Forestales Protectoras Regionales": 0, "Santuario de Fauna": 0}, {"name": "Tumaco", "Distritos Nacionales de Manejo Integrado": 10292.7, "Distritos Regionales de Manejo Integrado": 0, "Distritos de Conservación de Suelos": 0, "Parque Nacional Natural": 0, "Parques Naturales Regionales": 0, "Reserva Natural de la Sociedad Civil": 284.4, "Reservas Forestales Protectoras Nacionales": 0, "Reservas Forestales Protectoras Regionales": 0, "Santuario de Fauna": 0}, {"name": "Ricaurte", "Distritos Nacionales de Manejo Integrado": 0, "Distritos Regionales de Manejo Integrado": 0, "Distritos de Conservación de Suelos": 0, "Parque Nacional Natural": 0, "Parques Naturales Regionales": 0, "Reserva Natural de la Sociedad Civil": 0, "Reservas Forestales Protectoras Nacionales": 4060.8, "Reservas Forestales Protectoras Regionales": 0, "Santuario de Fauna": 0}, {"name": "Mallama", "Distritos Nacionales de Manejo Integrado": 0, "Distritos Regionales de Manejo Integrado": 0, "Distritos de Conservación de Suelos": 0, "Parque Nacional Natural": 0, "Parques Naturales Regionales": 3218.2, "Reserva Natural de la Sociedad Civil": 0, "Reservas Forestales Protectoras Nacionales": 331.0, "Reservas Forestales Protectoras Regionales": 0, "Santuario de Fauna": 0}, {"name": "Barbacoas", "Distritos Nacionales de Manejo Integrado": 0, "Distritos Regionales de Manejo Integrado": 0, "Distritos de Conservación de Suelos": 0, "Parque Nacional Natural": 0, "Parques Naturales Regionales": 0, "Reserva Natural de la Sociedad Civil": 154.6, "Reservas Forestales Protectoras Nacionales": 2295.6, "Reservas Forestales Protectoras Regionales": 0, "Santuario de Fauna": 0}, {"name": "Sapuyes", "Distritos Nacionales de Manejo Integrado": 0, "Distritos Regionales de Manejo Integrado": 0, "Distritos de Conservación de Suelos": 0, "Parque Nacional Natural": 0, "Parques Naturales Regionales": 609.6, "Reserva Natural de la Sociedad Civil": 0, "Reservas Forestales Protectoras Nacionales": 0, "Reservas Forestales Protectoras Regionales": 0, "Santuario de Fauna": 0}], "cordoba": [{"name": "Tierralta", "Distritos Nacionales de Manejo Integrado": 0, "Distritos Regionales de Manejo Integrado": 18.0, "Distritos de Conservación de Suelos": 0, "Parque Nacional Natural": 294951.6, "Parques Naturales Regionales": 0, "Reserva Natural de la Sociedad Civil": 0, "Reservas Forestales Protectoras Nacionales": 0, "Reservas Forestales Protectoras Regionales": 0, "Santuario de Fauna": 0}, {"name": "Valencia", "Distritos Nacionales de Manejo Integrado": 0, "Distritos Regionales de Manejo Integrado": 0.0, "Distritos de Conservación de Suelos": 0, "Parque Nacional Natural": 0, "Parques Naturales Regionales": 0, "Reserva Natural de la Sociedad Civil": 0, "Reservas Forestales Protectoras Nacionales": 0, "Reservas Forestales Protectoras Regionales": 0, "Santuario de Fauna": 0}], "risaralda": [{"name": "Pueblo Rico", "Distritos Nacionales de Manejo Integrado": 0, "Distritos Regionales de Manejo Integrado": 6293.7, "Distritos de Conservación de Suelos": 0, "Parque Nacional Natural": 9948.3, "Parques Naturales Regionales": 182.7, "Reserva Natural de la Sociedad Civil": 0, "Reservas Forestales Protectoras Nacionales": 0, "Reservas Forestales Protectoras Regionales": 0, "Santuario de Fauna": 0}, {"name": "Mistrató", "Distritos Nacionales de Manejo Integrado": 0, "Distritos Regionales de Manejo Integrado": 12249.5, "Distritos de Conservación de Suelos": 0, "Parque Nacional Natural": 0, "Parques Naturales Regionales": 0, "Reserva Natural de la Sociedad Civil": 0, "Reservas Forestales Protectoras Nacionales": 0, "Reservas Forestales Protectoras Regionales": 294.8, "Santuario de Fauna": 0}]};
  const RUNAP_COLORS=["#2E7D32", "#66BB6A", "#A5D6A7", "#1565C0", "#42A5F5", "#E91E63", "#FF8F00", "#795548", "#9C27B0"];
  const RUNAP_CAT_TOTALS_EXACT={"Distritos Nacionales de Manejo Integrado":10292.7,"Distritos Regionales de Manejo Integrado":344001.7,"Distritos de Conservación de Suelos":10727.4,"Parque Nacional Natural":887641.4,"Parques Naturales Regionales":47755.6,"Reserva Natural de la Sociedad Civil":8589.7,"Reservas Forestales Protectoras Nacionales":248157.0,"Reservas Forestales Protectoras Regionales":44296.1,"Santuario de Fauna":7.2};
  
  const RUNAP_COUNTS={"depto": {"valle": {"counts": {"Distritos Nacionales de Manejo Integrado": 0, "Distritos Regionales de Manejo Integrado": 10, "Distritos de Conservación de Suelos": 1, "Parque Nacional Natural": 2, "Parques Naturales Regionales": 2, "Reserva Natural de la Sociedad Civil": 65, "Reservas Forestales Protectoras Nacionales": 7, "Reservas Forestales Protectoras Regionales": 2, "Santuario de Fauna": 0}, "areas": {"Distritos Nacionales de Manejo Integrado": 0.0, "Distritos Regionales de Manejo Integrado": 79846.6, "Distritos de Conservación de Suelos": 10727.4, "Parque Nacional Natural": 170495.7, "Parques Naturales Regionales": 37337.1, "Reserva Natural de la Sociedad Civil": 2540.1, "Reservas Forestales Protectoras Nacionales": 88482.9, "Reservas Forestales Protectoras Regionales": 24488.9, "Santuario de Fauna": 0.0}}, "choco": {"counts": {"Distritos Nacionales de Manejo Integrado": 0, "Distritos Regionales de Manejo Integrado": 7, "Distritos de Conservación de Suelos": 0, "Parque Nacional Natural": 3, "Parques Naturales Regionales": 1, "Reserva Natural de la Sociedad Civil": 12, "Reservas Forestales Protectoras Nacionales": 2, "Reservas Forestales Protectoras Regionales": 2, "Santuario de Fauna": 1}, "areas": {"Distritos Nacionales de Manejo Integrado": 0.0, "Distritos Regionales de Manejo Integrado": 172144.8, "Distritos de Conservación de Suelos": 0.0, "Parque Nacional Natural": 143051.5, "Parques Naturales Regionales": 130.4, "Reserva Natural de la Sociedad Civil": 1986.3, "Reservas Forestales Protectoras Nacionales": 84144.6, "Reservas Forestales Protectoras Regionales": 571.8, "Santuario de Fauna": 7.2}}, "cordoba": {"counts": {"Distritos Nacionales de Manejo Integrado": 0, "Distritos Regionales de Manejo Integrado": 1, "Distritos de Conservación de Suelos": 0, "Parque Nacional Natural": 1, "Parques Naturales Regionales": 0, "Reserva Natural de la Sociedad Civil": 0, "Reservas Forestales Protectoras Nacionales": 0, "Reservas Forestales Protectoras Regionales": 0, "Santuario de Fauna": 0}, "areas": {"Distritos Nacionales de Manejo Integrado": 0.0, "Distritos Regionales de Manejo Integrado": 18.0, "Distritos de Conservación de Suelos": 0.0, "Parque Nacional Natural": 294951.6, "Parques Naturales Regionales": 0.0, "Reserva Natural de la Sociedad Civil": 0.0, "Reservas Forestales Protectoras Nacionales": 0.0, "Reservas Forestales Protectoras Regionales": 0.0, "Santuario de Fauna": 0.0}}, "antioquia": {"counts": {"Distritos Nacionales de Manejo Integrado": 0, "Distritos Regionales de Manejo Integrado": 6, "Distritos de Conservación de Suelos": 0, "Parque Nacional Natural": 3, "Parques Naturales Regionales": 2, "Reserva Natural de la Sociedad Civil": 10, "Reservas Forestales Protectoras Nacionales": 3, "Reservas Forestales Protectoras Regionales": 0, "Santuario de Fauna": 0}, "areas": {"Distritos Nacionales de Manejo Integrado": 0.0, "Distritos Regionales de Manejo Integrado": 73449.1, "Distritos de Conservación de Suelos": 0.0, "Parque Nacional Natural": 136123.1, "Parques Naturales Regionales": 5469.5, "Reserva Natural de la Sociedad Civil": 3400.1, "Reservas Forestales Protectoras Nacionales": 68842.0, "Reservas Forestales Protectoras Regionales": 0.0, "Santuario de Fauna": 0.0}}, "narino": {"counts": {"Distritos Nacionales de Manejo Integrado": 1, "Distritos Regionales de Manejo Integrado": 0, "Distritos de Conservación de Suelos": 0, "Parque Nacional Natural": 1, "Parques Naturales Regionales": 1, "Reserva Natural de la Sociedad Civil": 3, "Reservas Forestales Protectoras Nacionales": 2, "Reservas Forestales Protectoras Regionales": 1, "Santuario de Fauna": 0}, "areas": {"Distritos Nacionales de Manejo Integrado": 10292.7, "Distritos Regionales de Manejo Integrado": 0.0, "Distritos de Conservación de Suelos": 0.0, "Parque Nacional Natural": 86067.7, "Parques Naturales Regionales": 3827.7, "Reserva Natural de la Sociedad Civil": 438.9, "Reservas Forestales Protectoras Nacionales": 6687.4, "Reservas Forestales Protectoras Regionales": 46.6, "Santuario de Fauna": 0.0}}, "cauca": {"counts": {"Distritos Nacionales de Manejo Integrado": 0, "Distritos Regionales de Manejo Integrado": 1, "Distritos de Conservación de Suelos": 0, "Parque Nacional Natural": 2, "Parques Naturales Regionales": 1, "Reserva Natural de la Sociedad Civil": 2, "Reservas Forestales Protectoras Nacionales": 0, "Reservas Forestales Protectoras Regionales": 2, "Santuario de Fauna": 0}, "areas": {"Distritos Nacionales de Manejo Integrado": 0.0, "Distritos Regionales de Manejo Integrado": 0.0, "Distritos de Conservación de Suelos": 0.0, "Parque Nacional Natural": 47003.6, "Parques Naturales Regionales": 808.2, "Reserva Natural de la Sociedad Civil": 224.3, "Reservas Forestales Protectoras Nacionales": 0.0, "Reservas Forestales Protectoras Regionales": 18894.1, "Santuario de Fauna": 0.0}}, "risaralda": {"counts": {"Distritos Nacionales de Manejo Integrado": 0, "Distritos Regionales de Manejo Integrado": 3, "Distritos de Conservación de Suelos": 0, "Parque Nacional Natural": 1, "Parques Naturales Regionales": 2, "Reserva Natural de la Sociedad Civil": 0, "Reservas Forestales Protectoras Nacionales": 0, "Reservas Forestales Protectoras Regionales": 1, "Santuario de Fauna": 0}, "areas": {"Distritos Nacionales de Manejo Integrado": 0.0, "Distritos Regionales de Manejo Integrado": 18543.2, "Distritos de Conservación de Suelos": 0.0, "Parque Nacional Natural": 9948.3, "Parques Naturales Regionales": 182.7, "Reserva Natural de la Sociedad Civil": 0.0, "Reservas Forestales Protectoras Nacionales": 0.0, "Reservas Forestales Protectoras Regionales": 294.8, "Santuario de Fauna": 0.0}}}, "muni": {"valle": {"Dagua": {"counts": {"Distritos Nacionales de Manejo Integrado": 0, "Distritos Regionales de Manejo Integrado": 2, "Distritos de Conservación de Suelos": 1, "Parque Nacional Natural": 1, "Parques Naturales Regionales": 0, "Reserva Natural de la Sociedad Civil": 11, "Reservas Forestales Protectoras Nacionales": 4, "Reservas Forestales Protectoras Regionales": 2, "Santuario de Fauna": 0}, "areas": {"Distritos Nacionales de Manejo Integrado": 0.0, "Distritos Regionales de Manejo Integrado": 3249.2, "Distritos de Conservación de Suelos": 1235.8, "Parque Nacional Natural": 13475.1, "Parques Naturales Regionales": 0.0, "Reserva Natural de la Sociedad Civil": 587.4, "Reservas Forestales Protectoras Nacionales": 21633.0, "Reservas Forestales Protectoras Regionales": 25.3, "Santuario de Fauna": 0.0}}, "Buenaventura": {"counts": {"Distritos Nacionales de Manejo Integrado": 0, "Distritos Regionales de Manejo Integrado": 3, "Distritos de Conservación de Suelos": 0, "Parque Nacional Natural": 2, "Parques Naturales Regionales": 1, "Reserva Natural de la Sociedad Civil": 0, "Reservas Forestales Protectoras Nacionales": 2, "Reservas Forestales Protectoras Regionales": 0, "Santuario de Fauna": 0}, "areas": {"Distritos Nacionales de Manejo Integrado": 0.0, "Distritos Regionales de Manejo Integrado": 18860.6, "Distritos de Conservación de Suelos": 0.0, "Parque Nacional Natural": 157020.6, "Parques Naturales Regionales": 25209.2, "Reserva Natural de la Sociedad Civil": 0.0, "Reservas Forestales Protectoras Nacionales": 66615.4, "Reservas Forestales Protectoras Regionales": 0.0, "Santuario de Fauna": 0.0}}, "Bolívar": {"counts": {"Distritos Nacionales de Manejo Integrado": 0, "Distritos Regionales de Manejo Integrado": 1, "Distritos de Conservación de Suelos": 0, "Parque Nacional Natural": 0, "Parques Naturales Regionales": 1, "Reserva Natural de la Sociedad Civil": 4, "Reservas Forestales Protectoras Nacionales": 0, "Reservas Forestales Protectoras Regionales": 0, "Santuario de Fauna": 0}, "areas": {"Distritos Nacionales de Manejo Integrado": 0.0, "Distritos Regionales de Manejo Integrado": 24.6, "Distritos de Conservación de Suelos": 0.0, "Parque Nacional Natural": 0.0, "Parques Naturales Regionales": 2752.0, "Reserva Natural de la Sociedad Civil": 65.1, "Reservas Forestales Protectoras Nacionales": 0.0, "Reservas Forestales Protectoras Regionales": 0.0, "Santuario de Fauna": 0.0}}, "El Dovio": {"counts": {"Distritos Nacionales de Manejo Integrado": 0, "Distritos Regionales de Manejo Integrado": 1, "Distritos de Conservación de Suelos": 0, "Parque Nacional Natural": 0, "Parques Naturales Regionales": 0, "Reserva Natural de la Sociedad Civil": 7, "Reservas Forestales Protectoras Nacionales": 0, "Reservas Forestales Protectoras Regionales": 0, "Santuario de Fauna": 0}, "areas": {"Distritos Nacionales de Manejo Integrado": 0.0, "Distritos Regionales de Manejo Integrado": 9002.7, "Distritos de Conservación de Suelos": 0.0, "Parque Nacional Natural": 0.0, "Parques Naturales Regionales": 0.0, "Reserva Natural de la Sociedad Civil": 88.8, "Reservas Forestales Protectoras Nacionales": 0.0, "Reservas Forestales Protectoras Regionales": 0.0, "Santuario de Fauna": 0.0}}, "Calima": {"counts": {"Distritos Nacionales de Manejo Integrado": 0, "Distritos Regionales de Manejo Integrado": 1, "Distritos de Conservación de Suelos": 0, "Parque Nacional Natural": 0, "Parques Naturales Regionales": 1, "Reserva Natural de la Sociedad Civil": 3, "Reservas Forestales Protectoras Nacionales": 1, "Reservas Forestales Protectoras Regionales": 1, "Santuario de Fauna": 0}, "areas": {"Distritos Nacionales de Manejo Integrado": 0.0, "Distritos Regionales de Manejo Integrado": 18105.7, "Distritos de Conservación de Suelos": 0.0, "Parque Nacional Natural": 0.0, "Parques Naturales Regionales": 8530.8, "Reserva Natural de la Sociedad Civil": 566.2, "Reservas Forestales Protectoras Nacionales": 49.0, "Reservas Forestales Protectoras Regionales": 24286.6, "Santuario de Fauna": 0.0}}, "Trujillo": {"counts": {"Distritos Nacionales de Manejo Integrado": 0, "Distritos Regionales de Manejo Integrado": 1, "Distritos de Conservación de Suelos": 0, "Parque Nacional Natural": 0, "Parques Naturales Regionales": 1, "Reserva Natural de la Sociedad Civil": 0, "Reservas Forestales Protectoras Nacionales": 0, "Reservas Forestales Protectoras Regionales": 0, "Santuario de Fauna": 0}, "areas": {"Distritos Nacionales de Manejo Integrado": 0.0, "Distritos Regionales de Manejo Integrado": 11.0, "Distritos de Conservación de Suelos": 0.0, "Parque Nacional Natural": 0.0, "Parques Naturales Regionales": 845.1, "Reserva Natural de la Sociedad Civil": 0.0, "Reservas Forestales Protectoras Nacionales": 0.0, "Reservas Forestales Protectoras Regionales": 0.0, "Santuario de Fauna": 0.0}}, "La Cumbre": {"counts": {"Distritos Nacionales de Manejo Integrado": 0, "Distritos Regionales de Manejo Integrado": 1, "Distritos de Conservación de Suelos": 1, "Parque Nacional Natural": 0, "Parques Naturales Regionales": 0, "Reserva Natural de la Sociedad Civil": 7, "Reservas Forestales Protectoras Nacionales": 3, "Reservas Forestales Protectoras Regionales": 1, "Santuario de Fauna": 0}, "areas": {"Distritos Nacionales de Manejo Integrado": 0.0, "Distritos Regionales de Manejo Integrado": 1.0, "Distritos de Conservación de Suelos": 6184.5, "Parque Nacional Natural": 0.0, "Parques Naturales Regionales": 0.0, "Reserva Natural de la Sociedad Civil": 81.5, "Reservas Forestales Protectoras Nacionales": 180.5, "Reservas Forestales Protectoras Regionales": 177.0, "Santuario de Fauna": 0.0}}, "Yotoco": {"counts": {"Distritos Nacionales de Manejo Integrado": 0, "Distritos Regionales de Manejo Integrado": 1, "Distritos de Conservación de Suelos": 0, "Parque Nacional Natural": 0, "Parques Naturales Regionales": 0, "Reserva Natural de la Sociedad Civil": 0, "Reservas Forestales Protectoras Nacionales": 1, "Reservas Forestales Protectoras Regionales": 0, "Santuario de Fauna": 0}, "areas": {"Distritos Nacionales de Manejo Integrado": 0.0, "Distritos Regionales de Manejo Integrado": 14.9, "Distritos de Conservación de Suelos": 0.0, "Parque Nacional Natural": 0.0, "Parques Naturales Regionales": 0.0, "Reserva Natural de la Sociedad Civil": 0.0, "Reservas Forestales Protectoras Nacionales": 4.9, "Reservas Forestales Protectoras Regionales": 0.0, "Santuario de Fauna": 0.0}}, "Vijes": {"counts": {"Distritos Nacionales de Manejo Integrado": 0, "Distritos Regionales de Manejo Integrado": 0, "Distritos de Conservación de Suelos": 1, "Parque Nacional Natural": 0, "Parques Naturales Regionales": 0, "Reserva Natural de la Sociedad Civil": 0, "Reservas Forestales Protectoras Nacionales": 0, "Reservas Forestales Protectoras Regionales": 0, "Santuario de Fauna": 0}, "areas": {"Distritos Nacionales de Manejo Integrado": 0.0, "Distritos Regionales de Manejo Integrado": 0.0, "Distritos de Conservación de Suelos": 263.3, "Parque Nacional Natural": 0.0, "Parques Naturales Regionales": 0.0, "Reserva Natural de la Sociedad Civil": 0.0, "Reservas Forestales Protectoras Nacionales": 0.0, "Reservas Forestales Protectoras Regionales": 0.0, "Santuario de Fauna": 0.0}}, "Restrepo": {"counts": {"Distritos Nacionales de Manejo Integrado": 0, "Distritos Regionales de Manejo Integrado": 0, "Distritos de Conservación de Suelos": 1, "Parque Nacional Natural": 0, "Parques Naturales Regionales": 0, "Reserva Natural de la Sociedad Civil": 1, "Reservas Forestales Protectoras Nacionales": 0, "Reservas Forestales Protectoras Regionales": 0, "Santuario de Fauna": 0}, "areas": {"Distritos Nacionales de Manejo Integrado": 0.0, "Distritos Regionales de Manejo Integrado": 0.0, "Distritos de Conservación de Suelos": 3043.8, "Parque Nacional Natural": 0.0, "Parques Naturales Regionales": 0.0, "Reserva Natural de la Sociedad Civil": 16.0, "Reservas Forestales Protectoras Nacionales": 0.0, "Reservas Forestales Protectoras Regionales": 0.0, "Santuario de Fauna": 0.0}}, "Versalles": {"counts": {"Distritos Nacionales de Manejo Integrado": 0, "Distritos Regionales de Manejo Integrado": 1, "Distritos de Conservación de Suelos": 0, "Parque Nacional Natural": 0, "Parques Naturales Regionales": 0, "Reserva Natural de la Sociedad Civil": 16, "Reservas Forestales Protectoras Nacionales": 0, "Reservas Forestales Protectoras Regionales": 0, "Santuario de Fauna": 0}, "areas": {"Distritos Nacionales de Manejo Integrado": 0.0, "Distritos Regionales de Manejo Integrado": 9290.3, "Distritos de Conservación de Suelos": 0.0, "Parque Nacional Natural": 0.0, "Parques Naturales Regionales": 0.0, "Reserva Natural de la Sociedad Civil": 605.7, "Reservas Forestales Protectoras Nacionales": 0.0, "Reservas Forestales Protectoras Regionales": 0.0, "Santuario de Fauna": 0.0}}, "Roldanillo": {"counts": {"Distritos Nacionales de Manejo Integrado": 0, "Distritos Regionales de Manejo Integrado": 1, "Distritos de Conservación de Suelos": 0, "Parque Nacional Natural": 0, "Parques Naturales Regionales": 0, "Reserva Natural de la Sociedad Civil": 6, "Reservas Forestales Protectoras Nacionales": 0, "Reservas Forestales Protectoras Regionales": 0, "Santuario de Fauna": 0}, "areas": {"Distritos Nacionales de Manejo Integrado": 0.0, "Distritos Regionales de Manejo Integrado": 0.0, "Distritos de Conservación de Suelos": 0.0, "Parque Nacional Natural": 0.0, "Parques Naturales Regionales": 0.0, "Reserva Natural de la Sociedad Civil": 33.1, "Reservas Forestales Protectoras Nacionales": 0.0, "Reservas Forestales Protectoras Regionales": 0.0, "Santuario de Fauna": 0.0}}, "Argelia": {"counts": {"Distritos Nacionales de Manejo Integrado": 0, "Distritos Regionales de Manejo Integrado": 1, "Distritos de Conservación de Suelos": 0, "Parque Nacional Natural": 0, "Parques Naturales Regionales": 0, "Reserva Natural de la Sociedad Civil": 0, "Reservas Forestales Protectoras Nacionales": 0, "Reservas Forestales Protectoras Regionales": 0, "Santuario de Fauna": 0}, "areas": {"Distritos Nacionales de Manejo Integrado": 0.0, "Distritos Regionales de Manejo Integrado": 0.1, "Distritos de Conservación de Suelos": 0.0, "Parque Nacional Natural": 0.0, "Parques Naturales Regionales": 0.0, "Reserva Natural de la Sociedad Civil": 0.0, "Reservas Forestales Protectoras Nacionales": 0.0, "Reservas Forestales Protectoras Regionales": 0.0, "Santuario de Fauna": 0.0}}, "El Cairo": {"counts": {"Distritos Nacionales de Manejo Integrado": 0, "Distritos Regionales de Manejo Integrado": 1, "Distritos de Conservación de Suelos": 0, "Parque Nacional Natural": 0, "Parques Naturales Regionales": 0, "Reserva Natural de la Sociedad Civil": 20, "Reservas Forestales Protectoras Nacionales": 0, "Reservas Forestales Protectoras Regionales": 0, "Santuario de Fauna": 0}, "areas": {"Distritos Nacionales de Manejo Integrado": 0.0, "Distritos Regionales de Manejo Integrado": 21286.4, "Distritos de Conservación de Suelos": 0.0, "Parque Nacional Natural": 0.0, "Parques Naturales Regionales": 0.0, "Reserva Natural de la Sociedad Civil": 496.3, "Reservas Forestales Protectoras Nacionales": 0.0, "Reservas Forestales Protectoras Regionales": 0.0, "Santuario de Fauna": 0.0}}}, "choco": {"Riosucio": {"counts": {"Distritos Nacionales de Manejo Integrado": 0, "Distritos Regionales de Manejo Integrado": 0, "Distritos de Conservación de Suelos": 0, "Parque Nacional Natural": 1, "Parques Naturales Regionales": 0, "Reserva Natural de la Sociedad Civil": 0, "Reservas Forestales Protectoras Nacionales": 0, "Reservas Forestales Protectoras Regionales": 0, "Santuario de Fauna": 0}, "areas": {"Distritos Nacionales de Manejo Integrado": 0.0, "Distritos Regionales de Manejo Integrado": 0.0, "Distritos de Conservación de Suelos": 0.0, "Parque Nacional Natural": 56700.0, "Parques Naturales Regionales": 0.0, "Reserva Natural de la Sociedad Civil": 0.0, "Reservas Forestales Protectoras Nacionales": 0.0, "Reservas Forestales Protectoras Regionales": 0.0, "Santuario de Fauna": 0.0}}, "Unguía": {"counts": {"Distritos Nacionales de Manejo Integrado": 0, "Distritos Regionales de Manejo Integrado": 1, "Distritos de Conservación de Suelos": 0, "Parque Nacional Natural": 1, "Parques Naturales Regionales": 0, "Reserva Natural de la Sociedad Civil": 0, "Reservas Forestales Protectoras Nacionales": 1, "Reservas Forestales Protectoras Regionales": 0, "Santuario de Fauna": 0}, "areas": {"Distritos Nacionales de Manejo Integrado": 0.0, "Distritos Regionales de Manejo Integrado": 31117.5, "Distritos de Conservación de Suelos": 0.0, "Parque Nacional Natural": 814.6, "Parques Naturales Regionales": 0.0, "Reserva Natural de la Sociedad Civil": 0.0, "Reservas Forestales Protectoras Nacionales": 20113.8, "Reservas Forestales Protectoras Regionales": 0.0, "Santuario de Fauna": 0.0}}, "Belén de bajirá": {"counts": {"Distritos Nacionales de Manejo Integrado": 0, "Distritos Regionales de Manejo Integrado": 0, "Distritos de Conservación de Suelos": 0, "Parque Nacional Natural": 1, "Parques Naturales Regionales": 0, "Reserva Natural de la Sociedad Civil": 0, "Reservas Forestales Protectoras Nacionales": 1, "Reservas Forestales Protectoras Regionales": 0, "Santuario de Fauna": 0}, "areas": {"Distritos Nacionales de Manejo Integrado": 0.0, "Distritos Regionales de Manejo Integrado": 0.0, "Distritos de Conservación de Suelos": 0.0, "Parque Nacional Natural": 7609.1, "Parques Naturales Regionales": 0.0, "Reserva Natural de la Sociedad Civil": 0.0, "Reservas Forestales Protectoras Nacionales": 27604.5, "Reservas Forestales Protectoras Regionales": 0.0, "Santuario de Fauna": 0.0}}, "San José Del Palmar": {"counts": {"Distritos Nacionales de Manejo Integrado": 0, "Distritos Regionales de Manejo Integrado": 1, "Distritos de Conservación de Suelos": 0, "Parque Nacional Natural": 1, "Parques Naturales Regionales": 0, "Reserva Natural de la Sociedad Civil": 2, "Reservas Forestales Protectoras Nacionales": 0, "Reservas Forestales Protectoras Regionales": 0, "Santuario de Fauna": 0}, "areas": {"Distritos Nacionales de Manejo Integrado": 0.0, "Distritos Regionales de Manejo Integrado": 154.6, "Distritos de Conservación de Suelos": 0.0, "Parque Nacional Natural": 22246.8, "Parques Naturales Regionales": 0.0, "Reserva Natural de la Sociedad Civil": 35.7, "Reservas Forestales Protectoras Nacionales": 0.0, "Reservas Forestales Protectoras Regionales": 0.0, "Santuario de Fauna": 0.0}}, "Tadó": {"counts": {"Distritos Nacionales de Manejo Integrado": 0, "Distritos Regionales de Manejo Integrado": 0, "Distritos de Conservación de Suelos": 0, "Parque Nacional Natural": 1, "Parques Naturales Regionales": 0, "Reserva Natural de la Sociedad Civil": 0, "Reservas Forestales Protectoras Nacionales": 0, "Reservas Forestales Protectoras Regionales": 0, "Santuario de Fauna": 0}, "areas": {"Distritos Nacionales de Manejo Integrado": 0.0, "Distritos Regionales de Manejo Integrado": 0.0, "Distritos de Conservación de Suelos": 0.0, "Parque Nacional Natural": 4000.0, "Parques Naturales Regionales": 0.0, "Reserva Natural de la Sociedad Civil": 0.0, "Reservas Forestales Protectoras Nacionales": 0.0, "Reservas Forestales Protectoras Regionales": 0.0, "Santuario de Fauna": 0.0}}, "Nuquí": {"counts": {"Distritos Nacionales de Manejo Integrado": 0, "Distritos Regionales de Manejo Integrado": 2, "Distritos de Conservación de Suelos": 0, "Parque Nacional Natural": 1, "Parques Naturales Regionales": 0, "Reserva Natural de la Sociedad Civil": 0, "Reservas Forestales Protectoras Nacionales": 0, "Reservas Forestales Protectoras Regionales": 0, "Santuario de Fauna": 0}, "areas": {"Distritos Nacionales de Manejo Integrado": 0.0, "Distritos Regionales de Manejo Integrado": 3696.4, "Distritos de Conservación de Suelos": 0.0, "Parque Nacional Natural": 7626.8, "Parques Naturales Regionales": 0.0, "Reserva Natural de la Sociedad Civil": 0.0, "Reservas Forestales Protectoras Nacionales": 0.0, "Reservas Forestales Protectoras Regionales": 0.0, "Santuario de Fauna": 0.0}}, "Alto Baudó": {"counts": {"Distritos Nacionales de Manejo Integrado": 0, "Distritos Regionales de Manejo Integrado": 0, "Distritos de Conservación de Suelos": 0, "Parque Nacional Natural": 1, "Parques Naturales Regionales": 0, "Reserva Natural de la Sociedad Civil": 0, "Reservas Forestales Protectoras Nacionales": 0, "Reservas Forestales Protectoras Regionales": 0, "Santuario de Fauna": 0}, "areas": {"Distritos Nacionales de Manejo Integrado": 0.0, "Distritos Regionales de Manejo Integrado": 0.0, "Distritos de Conservación de Suelos": 0.0, "Parque Nacional Natural": 20362.9, "Parques Naturales Regionales": 0.0, "Reserva Natural de la Sociedad Civil": 0.0, "Reservas Forestales Protectoras Nacionales": 0.0, "Reservas Forestales Protectoras Regionales": 0.0, "Santuario de Fauna": 0.0}}, "Bahía Solano": {"counts": {"Distritos Nacionales de Manejo Integrado": 0, "Distritos Regionales de Manejo Integrado": 0, "Distritos de Conservación de Suelos": 0, "Parque Nacional Natural": 1, "Parques Naturales Regionales": 0, "Reserva Natural de la Sociedad Civil": 0, "Reservas Forestales Protectoras Nacionales": 0, "Reservas Forestales Protectoras Regionales": 0, "Santuario de Fauna": 0}, "areas": {"Distritos Nacionales de Manejo Integrado": 0.0, "Distritos Regionales de Manejo Integrado": 0.0, "Distritos de Conservación de Suelos": 0.0, "Parque Nacional Natural": 8161.0, "Parques Naturales Regionales": 0.0, "Reserva Natural de la Sociedad Civil": 0.0, "Reservas Forestales Protectoras Nacionales": 0.0, "Reservas Forestales Protectoras Regionales": 0.0, "Santuario de Fauna": 0.0}}, "Bojayá": {"counts": {"Distritos Nacionales de Manejo Integrado": 0, "Distritos Regionales de Manejo Integrado": 0, "Distritos de Conservación de Suelos": 0, "Parque Nacional Natural": 1, "Parques Naturales Regionales": 0, "Reserva Natural de la Sociedad Civil": 0, "Reservas Forestales Protectoras Nacionales": 0, "Reservas Forestales Protectoras Regionales": 0, "Santuario de Fauna": 0}, "areas": {"Distritos Nacionales de Manejo Integrado": 0.0, "Distritos Regionales de Manejo Integrado": 0.0, "Distritos de Conservación de Suelos": 0.0, "Parque Nacional Natural": 15530.2, "Parques Naturales Regionales": 0.0, "Reserva Natural de la Sociedad Civil": 0.0, "Reservas Forestales Protectoras Nacionales": 0.0, "Reservas Forestales Protectoras Regionales": 0.0, "Santuario de Fauna": 0.0}}, "Bagadó": {"counts": {"Distritos Nacionales de Manejo Integrado": 0, "Distritos Regionales de Manejo Integrado": 0, "Distritos de Conservación de Suelos": 0, "Parque Nacional Natural": 0, "Parques Naturales Regionales": 0, "Reserva Natural de la Sociedad Civil": 0, "Reservas Forestales Protectoras Nacionales": 0, "Reservas Forestales Protectoras Regionales": 1, "Santuario de Fauna": 0}, "areas": {"Distritos Nacionales de Manejo Integrado": 0.0, "Distritos Regionales de Manejo Integrado": 0.0, "Distritos de Conservación de Suelos": 0.0, "Parque Nacional Natural": 0.0, "Parques Naturales Regionales": 0.0, "Reserva Natural de la Sociedad Civil": 0.0, "Reservas Forestales Protectoras Nacionales": 0.0, "Reservas Forestales Protectoras Regionales": 265.8, "Santuario de Fauna": 0.0}}, "El Carmen": {"counts": {"Distritos Nacionales de Manejo Integrado": 0, "Distritos Regionales de Manejo Integrado": 2, "Distritos de Conservación de Suelos": 0, "Parque Nacional Natural": 0, "Parques Naturales Regionales": 0, "Reserva Natural de la Sociedad Civil": 4, "Reservas Forestales Protectoras Nacionales": 0, "Reservas Forestales Protectoras Regionales": 1, "Santuario de Fauna": 0}, "areas": {"Distritos Nacionales de Manejo Integrado": 0.0, "Distritos Regionales de Manejo Integrado": 18025.0, "Distritos de Conservación de Suelos": 0.0, "Parque Nacional Natural": 0.0, "Parques Naturales Regionales": 0.0, "Reserva Natural de la Sociedad Civil": 1790.4, "Reservas Forestales Protectoras Nacionales": 0.0, "Reservas Forestales Protectoras Regionales": 264.6, "Santuario de Fauna": 0.0}}, "El Litoral Del San Juán": {"counts": {"Distritos Nacionales de Manejo Integrado": 0, "Distritos Regionales de Manejo Integrado": 1, "Distritos de Conservación de Suelos": 0, "Parque Nacional Natural": 0, "Parques Naturales Regionales": 1, "Reserva Natural de la Sociedad Civil": 0, "Reservas Forestales Protectoras Nacionales": 0, "Reservas Forestales Protectoras Regionales": 1, "Santuario de Fauna": 0}, "areas": {"Distritos Nacionales de Manejo Integrado": 0.0, "Distritos Regionales de Manejo Integrado": 3782.8, "Distritos de Conservación de Suelos": 0.0, "Parque Nacional Natural": 0.0, "Parques Naturales Regionales": 130.4, "Reserva Natural de la Sociedad Civil": 0.0, "Reservas Forestales Protectoras Nacionales": 0.0, "Reservas Forestales Protectoras Regionales": 41.4, "Santuario de Fauna": 0.0}}, "Acandí": {"counts": {"Distritos Nacionales de Manejo Integrado": 0, "Distritos Regionales de Manejo Integrado": 1, "Distritos de Conservación de Suelos": 0, "Parque Nacional Natural": 0, "Parques Naturales Regionales": 0, "Reserva Natural de la Sociedad Civil": 6, "Reservas Forestales Protectoras Nacionales": 1, "Reservas Forestales Protectoras Regionales": 0, "Santuario de Fauna": 1}, "areas": {"Distritos Nacionales de Manejo Integrado": 0.0, "Distritos Regionales de Manejo Integrado": 9377.9, "Distritos de Conservación de Suelos": 0.0, "Parque Nacional Natural": 0.0, "Parques Naturales Regionales": 0.0, "Reserva Natural de la Sociedad Civil": 160.2, "Reservas Forestales Protectoras Nacionales": 36426.4, "Reservas Forestales Protectoras Regionales": 0.0, "Santuario de Fauna": 7.2}}, "Quibdó": {"counts": {"Distritos Nacionales de Manejo Integrado": 0, "Distritos Regionales de Manejo Integrado": 1, "Distritos de Conservación de Suelos": 0, "Parque Nacional Natural": 0, "Parques Naturales Regionales": 0, "Reserva Natural de la Sociedad Civil": 0, "Reservas Forestales Protectoras Nacionales": 0, "Reservas Forestales Protectoras Regionales": 0, "Santuario de Fauna": 0}, "areas": {"Distritos Nacionales de Manejo Integrado": 0.0, "Distritos Regionales de Manejo Integrado": 3.0, "Distritos de Conservación de Suelos": 0.0, "Parque Nacional Natural": 0.0, "Parques Naturales Regionales": 0.0, "Reserva Natural de la Sociedad Civil": 0.0, "Reservas Forestales Protectoras Nacionales": 0.0, "Reservas Forestales Protectoras Regionales": 0.0, "Santuario de Fauna": 0.0}}, "Bajo Baudó": {"counts": {"Distritos Nacionales de Manejo Integrado": 0, "Distritos Regionales de Manejo Integrado": 1, "Distritos de Conservación de Suelos": 0, "Parque Nacional Natural": 0, "Parques Naturales Regionales": 0, "Reserva Natural de la Sociedad Civil": 0, "Reservas Forestales Protectoras Nacionales": 0, "Reservas Forestales Protectoras Regionales": 0, "Santuario de Fauna": 0}, "areas": {"Distritos Nacionales de Manejo Integrado": 0.0, "Distritos Regionales de Manejo Integrado": 105910.8, "Distritos de Conservación de Suelos": 0.0, "Parque Nacional Natural": 0.0, "Parques Naturales Regionales": 0.0, "Reserva Natural de la Sociedad Civil": 0.0, "Reservas Forestales Protectoras Nacionales": 0.0, "Reservas Forestales Protectoras Regionales": 0.0, "Santuario de Fauna": 0.0}}, "Sipí": {"counts": {"Distritos Nacionales de Manejo Integrado": 0, "Distritos Regionales de Manejo Integrado": 1, "Distritos de Conservación de Suelos": 0, "Parque Nacional Natural": 0, "Parques Naturales Regionales": 0, "Reserva Natural de la Sociedad Civil": 0, "Reservas Forestales Protectoras Nacionales": 0, "Reservas Forestales Protectoras Regionales": 0, "Santuario de Fauna": 0}, "areas": {"Distritos Nacionales de Manejo Integrado": 0.0, "Distritos Regionales de Manejo Integrado": 76.8, "Distritos de Conservación de Suelos": 0.0, "Parque Nacional Natural": 0.0, "Parques Naturales Regionales": 0.0, "Reserva Natural de la Sociedad Civil": 0.0, "Reservas Forestales Protectoras Nacionales": 0.0, "Reservas Forestales Protectoras Regionales": 0.0, "Santuario de Fauna": 0.0}}}, "cordoba": {"Tierralta": {"counts": {"Distritos Nacionales de Manejo Integrado": 0, "Distritos Regionales de Manejo Integrado": 1, "Distritos de Conservación de Suelos": 0, "Parque Nacional Natural": 1, "Parques Naturales Regionales": 0, "Reserva Natural de la Sociedad Civil": 0, "Reservas Forestales Protectoras Nacionales": 0, "Reservas Forestales Protectoras Regionales": 0, "Santuario de Fauna": 0}, "areas": {"Distritos Nacionales de Manejo Integrado": 0.0, "Distritos Regionales de Manejo Integrado": 18.0, "Distritos de Conservación de Suelos": 0.0, "Parque Nacional Natural": 294951.6, "Parques Naturales Regionales": 0.0, "Reserva Natural de la Sociedad Civil": 0.0, "Reservas Forestales Protectoras Nacionales": 0.0, "Reservas Forestales Protectoras Regionales": 0.0, "Santuario de Fauna": 0.0}}, "Valencia": {"counts": {"Distritos Nacionales de Manejo Integrado": 0, "Distritos Regionales de Manejo Integrado": 1, "Distritos de Conservación de Suelos": 0, "Parque Nacional Natural": 0, "Parques Naturales Regionales": 0, "Reserva Natural de la Sociedad Civil": 0, "Reservas Forestales Protectoras Nacionales": 0, "Reservas Forestales Protectoras Regionales": 0, "Santuario de Fauna": 0}, "areas": {"Distritos Nacionales de Manejo Integrado": 0.0, "Distritos Regionales de Manejo Integrado": 0.0, "Distritos de Conservación de Suelos": 0.0, "Parque Nacional Natural": 0.0, "Parques Naturales Regionales": 0.0, "Reserva Natural de la Sociedad Civil": 0.0, "Reservas Forestales Protectoras Nacionales": 0.0, "Reservas Forestales Protectoras Regionales": 0.0, "Santuario de Fauna": 0.0}}}, "antioquia": {"Urrao": {"counts": {"Distritos Nacionales de Manejo Integrado": 0, "Distritos Regionales de Manejo Integrado": 2, "Distritos de Conservación de Suelos": 0, "Parque Nacional Natural": 1, "Parques Naturales Regionales": 1, "Reserva Natural de la Sociedad Civil": 5, "Reservas Forestales Protectoras Nacionales": 1, "Reservas Forestales Protectoras Regionales": 0, "Santuario de Fauna": 0}, "areas": {"Distritos Nacionales de Manejo Integrado": 0.0, "Distritos Regionales de Manejo Integrado": 188.4, "Distritos de Conservación de Suelos": 0.0, "Parque Nacional Natural": 6528.7, "Parques Naturales Regionales": 114.1, "Reserva Natural de la Sociedad Civil": 1817.3, "Reservas Forestales Protectoras Nacionales": 29869.3, "Reservas Forestales Protectoras Regionales": 0.0, "Santuario de Fauna": 0.0}}, "Abriaquí": {"counts": {"Distritos Nacionales de Manejo Integrado": 0, "Distritos Regionales de Manejo Integrado": 1, "Distritos de Conservación de Suelos": 0, "Parque Nacional Natural": 1, "Parques Naturales Regionales": 1, "Reserva Natural de la Sociedad Civil": 0, "Reservas Forestales Protectoras Nacionales": 1, "Reservas Forestales Protectoras Regionales": 0, "Santuario de Fauna": 0}, "areas": {"Distritos Nacionales de Manejo Integrado": 0.0, "Distritos Regionales de Manejo Integrado": 4248.0, "Distritos de Conservación de Suelos": 0.0, "Parque Nacional Natural": 1121.6, "Parques Naturales Regionales": 78.1, "Reserva Natural de la Sociedad Civil": 0.0, "Reservas Forestales Protectoras Nacionales": 17.9, "Reservas Forestales Protectoras Regionales": 0.0, "Santuario de Fauna": 0.0}}, "Frontino": {"counts": {"Distritos Nacionales de Manejo Integrado": 0, "Distritos Regionales de Manejo Integrado": 0, "Distritos de Conservación de Suelos": 0, "Parque Nacional Natural": 1, "Parques Naturales Regionales": 0, "Reserva Natural de la Sociedad Civil": 1, "Reservas Forestales Protectoras Nacionales": 2, "Reservas Forestales Protectoras Regionales": 0, "Santuario de Fauna": 0}, "areas": {"Distritos Nacionales de Manejo Integrado": 0.0, "Distritos Regionales de Manejo Integrado": 0.0, "Distritos de Conservación de Suelos": 0.0, "Parque Nacional Natural": 21143.9, "Parques Naturales Regionales": 0.0, "Reserva Natural de la Sociedad Civil": 1445.2, "Reservas Forestales Protectoras Nacionales": 27559.4, "Reservas Forestales Protectoras Regionales": 0.0, "Santuario de Fauna": 0.0}}, "Turbo": {"counts": {"Distritos Nacionales de Manejo Integrado": 0, "Distritos Regionales de Manejo Integrado": 2, "Distritos de Conservación de Suelos": 0, "Parque Nacional Natural": 1, "Parques Naturales Regionales": 1, "Reserva Natural de la Sociedad Civil": 1, "Reservas Forestales Protectoras Nacionales": 1, "Reservas Forestales Protectoras Regionales": 0, "Santuario de Fauna": 0}, "areas": {"Distritos Nacionales de Manejo Integrado": 0.0, "Distritos Regionales de Manejo Integrado": 6099.5, "Distritos de Conservación de Suelos": 0.0, "Parque Nacional Natural": 13135.7, "Parques Naturales Regionales": 5269.2, "Reserva Natural de la Sociedad Civil": 19.6, "Reservas Forestales Protectoras Nacionales": 11181.0, "Reservas Forestales Protectoras Regionales": 0.0, "Santuario de Fauna": 0.0}}, "Dabeiba": {"counts": {"Distritos Nacionales de Manejo Integrado": 0, "Distritos Regionales de Manejo Integrado": 0, "Distritos de Conservación de Suelos": 0, "Parque Nacional Natural": 1, "Parques Naturales Regionales": 0, "Reserva Natural de la Sociedad Civil": 0, "Reservas Forestales Protectoras Nacionales": 0, "Reservas Forestales Protectoras Regionales": 0, "Santuario de Fauna": 0}, "areas": {"Distritos Nacionales de Manejo Integrado": 0.0, "Distritos Regionales de Manejo Integrado": 0.0, "Distritos de Conservación de Suelos": 0.0, "Parque Nacional Natural": 10171.6, "Parques Naturales Regionales": 0.0, "Reserva Natural de la Sociedad Civil": 0.0, "Reservas Forestales Protectoras Nacionales": 0.0, "Reservas Forestales Protectoras Regionales": 0.0, "Santuario de Fauna": 0.0}}, "Mutatá": {"counts": {"Distritos Nacionales de Manejo Integrado": 0, "Distritos Regionales de Manejo Integrado": 0, "Distritos de Conservación de Suelos": 0, "Parque Nacional Natural": 1, "Parques Naturales Regionales": 0, "Reserva Natural de la Sociedad Civil": 1, "Reservas Forestales Protectoras Nacionales": 1, "Reservas Forestales Protectoras Regionales": 0, "Santuario de Fauna": 0}, "areas": {"Distritos Nacionales de Manejo Integrado": 0.0, "Distritos Regionales de Manejo Integrado": 0.0, "Distritos de Conservación de Suelos": 0.0, "Parque Nacional Natural": 2109.6, "Parques Naturales Regionales": 0.0, "Reserva Natural de la Sociedad Civil": 28.0, "Reservas Forestales Protectoras Nacionales": 173.1, "Reservas Forestales Protectoras Regionales": 0.0, "Santuario de Fauna": 0.0}}, "Ituango": {"counts": {"Distritos Nacionales de Manejo Integrado": 0, "Distritos Regionales de Manejo Integrado": 0, "Distritos de Conservación de Suelos": 0, "Parque Nacional Natural": 1, "Parques Naturales Regionales": 0, "Reserva Natural de la Sociedad Civil": 0, "Reservas Forestales Protectoras Nacionales": 0, "Reservas Forestales Protectoras Regionales": 0, "Santuario de Fauna": 0}, "areas": {"Distritos Nacionales de Manejo Integrado": 0.0, "Distritos Regionales de Manejo Integrado": 0.0, "Distritos de Conservación de Suelos": 0.0, "Parque Nacional Natural": 81742.4, "Parques Naturales Regionales": 0.0, "Reserva Natural de la Sociedad Civil": 0.0, "Reservas Forestales Protectoras Nacionales": 0.0, "Reservas Forestales Protectoras Regionales": 0.0, "Santuario de Fauna": 0.0}}, "Chigorodó": {"counts": {"Distritos Nacionales de Manejo Integrado": 0, "Distritos Regionales de Manejo Integrado": 1, "Distritos de Conservación de Suelos": 0, "Parque Nacional Natural": 1, "Parques Naturales Regionales": 0, "Reserva Natural de la Sociedad Civil": 0, "Reservas Forestales Protectoras Nacionales": 1, "Reservas Forestales Protectoras Regionales": 0, "Santuario de Fauna": 0}, "areas": {"Distritos Nacionales de Manejo Integrado": 0.0, "Distritos Regionales de Manejo Integrado": 2894.9, "Distritos de Conservación de Suelos": 0.0, "Parque Nacional Natural": 134.4, "Parques Naturales Regionales": 0.0, "Reserva Natural de la Sociedad Civil": 0.0, "Reservas Forestales Protectoras Nacionales": 41.2, "Reservas Forestales Protectoras Regionales": 0.0, "Santuario de Fauna": 0.0}}, "Carepa": {"counts": {"Distritos Nacionales de Manejo Integrado": 0, "Distritos Regionales de Manejo Integrado": 1, "Distritos de Conservación de Suelos": 0, "Parque Nacional Natural": 1, "Parques Naturales Regionales": 1, "Reserva Natural de la Sociedad Civil": 0, "Reservas Forestales Protectoras Nacionales": 0, "Reservas Forestales Protectoras Regionales": 0, "Santuario de Fauna": 0}, "areas": {"Distritos Nacionales de Manejo Integrado": 0.0, "Distritos Regionales de Manejo Integrado": 9609.1, "Distritos de Conservación de Suelos": 0.0, "Parque Nacional Natural": 35.2, "Parques Naturales Regionales": 7.3, "Reserva Natural de la Sociedad Civil": 0.0, "Reservas Forestales Protectoras Nacionales": 0.0, "Reservas Forestales Protectoras Regionales": 0.0, "Santuario de Fauna": 0.0}}, "Cañasgordas": {"counts": {"Distritos Nacionales de Manejo Integrado": 0, "Distritos Regionales de Manejo Integrado": 1, "Distritos de Conservación de Suelos": 0, "Parque Nacional Natural": 0, "Parques Naturales Regionales": 0, "Reserva Natural de la Sociedad Civil": 0, "Reservas Forestales Protectoras Nacionales": 0, "Reservas Forestales Protectoras Regionales": 0, "Santuario de Fauna": 0}, "areas": {"Distritos Nacionales de Manejo Integrado": 0.0, "Distritos Regionales de Manejo Integrado": 1667.2, "Distritos de Conservación de Suelos": 0.0, "Parque Nacional Natural": 0.0, "Parques Naturales Regionales": 0.0, "Reserva Natural de la Sociedad Civil": 0.0, "Reservas Forestales Protectoras Nacionales": 0.0, "Reservas Forestales Protectoras Regionales": 0.0, "Santuario de Fauna": 0.0}}, "Apartadó": {"counts": {"Distritos Nacionales de Manejo Integrado": 0, "Distritos Regionales de Manejo Integrado": 1, "Distritos de Conservación de Suelos": 0, "Parque Nacional Natural": 0, "Parques Naturales Regionales": 1, "Reserva Natural de la Sociedad Civil": 1, "Reservas Forestales Protectoras Nacionales": 0, "Reservas Forestales Protectoras Regionales": 0, "Santuario de Fauna": 0}, "areas": {"Distritos Nacionales de Manejo Integrado": 0.0, "Distritos Regionales de Manejo Integrado": 23112.4, "Distritos de Conservación de Suelos": 0.0, "Parque Nacional Natural": 0.0, "Parques Naturales Regionales": 0.9, "Reserva Natural de la Sociedad Civil": 86.0, "Reservas Forestales Protectoras Nacionales": 0.0, "Reservas Forestales Protectoras Regionales": 0.0, "Santuario de Fauna": 0.0}}, "Necoclí": {"counts": {"Distritos Nacionales de Manejo Integrado": 0, "Distritos Regionales de Manejo Integrado": 1, "Distritos de Conservación de Suelos": 0, "Parque Nacional Natural": 0, "Parques Naturales Regionales": 0, "Reserva Natural de la Sociedad Civil": 1, "Reservas Forestales Protectoras Nacionales": 0, "Reservas Forestales Protectoras Regionales": 0, "Santuario de Fauna": 0}, "areas": {"Distritos Nacionales de Manejo Integrado": 0.0, "Distritos Regionales de Manejo Integrado": 25629.5, "Distritos de Conservación de Suelos": 0.0, "Parque Nacional Natural": 0.0, "Parques Naturales Regionales": 0.0, "Reserva Natural de la Sociedad Civil": 4.0, "Reservas Forestales Protectoras Nacionales": 0.0, "Reservas Forestales Protectoras Regionales": 0.0, "Santuario de Fauna": 0.0}}}, "narino": {"Mosquera": {"counts": {"Distritos Nacionales de Manejo Integrado": 0, "Distritos Regionales de Manejo Integrado": 0, "Distritos de Conservación de Suelos": 0, "Parque Nacional Natural": 1, "Parques Naturales Regionales": 0, "Reserva Natural de la Sociedad Civil": 0, "Reservas Forestales Protectoras Nacionales": 0, "Reservas Forestales Protectoras Regionales": 0, "Santuario de Fauna": 0}, "areas": {"Distritos Nacionales de Manejo Integrado": 0.0, "Distritos Regionales de Manejo Integrado": 0.0, "Distritos de Conservación de Suelos": 0.0, "Parque Nacional Natural": 36644.2, "Parques Naturales Regionales": 0.0, "Reserva Natural de la Sociedad Civil": 0.0, "Reservas Forestales Protectoras Nacionales": 0.0, "Reservas Forestales Protectoras Regionales": 0.0, "Santuario de Fauna": 0.0}}, "Olaya Herrera": {"counts": {"Distritos Nacionales de Manejo Integrado": 0, "Distritos Regionales de Manejo Integrado": 0, "Distritos de Conservación de Suelos": 0, "Parque Nacional Natural": 1, "Parques Naturales Regionales": 0, "Reserva Natural de la Sociedad Civil": 0, "Reservas Forestales Protectoras Nacionales": 0, "Reservas Forestales Protectoras Regionales": 0, "Santuario de Fauna": 0}, "areas": {"Distritos Nacionales de Manejo Integrado": 0.0, "Distritos Regionales de Manejo Integrado": 0.0, "Distritos de Conservación de Suelos": 0.0, "Parque Nacional Natural": 19953.0, "Parques Naturales Regionales": 0.0, "Reserva Natural de la Sociedad Civil": 0.0, "Reservas Forestales Protectoras Nacionales": 0.0, "Reservas Forestales Protectoras Regionales": 0.0, "Santuario de Fauna": 0.0}}, "La Tola": {"counts": {"Distritos Nacionales de Manejo Integrado": 0, "Distritos Regionales de Manejo Integrado": 0, "Distritos de Conservación de Suelos": 0, "Parque Nacional Natural": 1, "Parques Naturales Regionales": 0, "Reserva Natural de la Sociedad Civil": 0, "Reservas Forestales Protectoras Nacionales": 0, "Reservas Forestales Protectoras Regionales": 0, "Santuario de Fauna": 0}, "areas": {"Distritos Nacionales de Manejo Integrado": 0.0, "Distritos Regionales de Manejo Integrado": 0.0, "Distritos de Conservación de Suelos": 0.0, "Parque Nacional Natural": 14389.3, "Parques Naturales Regionales": 0.0, "Reserva Natural de la Sociedad Civil": 0.0, "Reservas Forestales Protectoras Nacionales": 0.0, "Reservas Forestales Protectoras Regionales": 0.0, "Santuario de Fauna": 0.0}}, "El Charco": {"counts": {"Distritos Nacionales de Manejo Integrado": 0, "Distritos Regionales de Manejo Integrado": 0, "Distritos de Conservación de Suelos": 0, "Parque Nacional Natural": 1, "Parques Naturales Regionales": 0, "Reserva Natural de la Sociedad Civil": 0, "Reservas Forestales Protectoras Nacionales": 0, "Reservas Forestales Protectoras Regionales": 1, "Santuario de Fauna": 0}, "areas": {"Distritos Nacionales de Manejo Integrado": 0.0, "Distritos Regionales de Manejo Integrado": 0.0, "Distritos de Conservación de Suelos": 0.0, "Parque Nacional Natural": 15081.2, "Parques Naturales Regionales": 0.0, "Reserva Natural de la Sociedad Civil": 0.0, "Reservas Forestales Protectoras Nacionales": 0.0, "Reservas Forestales Protectoras Regionales": 46.6, "Santuario de Fauna": 0.0}}, "Ricaurte": {"counts": {"Distritos Nacionales de Manejo Integrado": 0, "Distritos Regionales de Manejo Integrado": 0, "Distritos de Conservación de Suelos": 0, "Parque Nacional Natural": 0, "Parques Naturales Regionales": 0, "Reserva Natural de la Sociedad Civil": 0, "Reservas Forestales Protectoras Nacionales": 2, "Reservas Forestales Protectoras Regionales": 0, "Santuario de Fauna": 0}, "areas": {"Distritos Nacionales de Manejo Integrado": 0.0, "Distritos Regionales de Manejo Integrado": 0.0, "Distritos de Conservación de Suelos": 0.0, "Parque Nacional Natural": 0.0, "Parques Naturales Regionales": 0.0, "Reserva Natural de la Sociedad Civil": 0.0, "Reservas Forestales Protectoras Nacionales": 4060.8, "Reservas Forestales Protectoras Regionales": 0.0, "Santuario de Fauna": 0.0}}, "Barbacoas": {"counts": {"Distritos Nacionales de Manejo Integrado": 0, "Distritos Regionales de Manejo Integrado": 0, "Distritos de Conservación de Suelos": 0, "Parque Nacional Natural": 0, "Parques Naturales Regionales": 0, "Reserva Natural de la Sociedad Civil": 3, "Reservas Forestales Protectoras Nacionales": 1, "Reservas Forestales Protectoras Regionales": 0, "Santuario de Fauna": 0}, "areas": {"Distritos Nacionales de Manejo Integrado": 0.0, "Distritos Regionales de Manejo Integrado": 0.0, "Distritos de Conservación de Suelos": 0.0, "Parque Nacional Natural": 0.0, "Parques Naturales Regionales": 0.0, "Reserva Natural de la Sociedad Civil": 154.6, "Reservas Forestales Protectoras Nacionales": 2295.6, "Reservas Forestales Protectoras Regionales": 0.0, "Santuario de Fauna": 0.0}}, "Mallama": {"counts": {"Distritos Nacionales de Manejo Integrado": 0, "Distritos Regionales de Manejo Integrado": 0, "Distritos de Conservación de Suelos": 0, "Parque Nacional Natural": 0, "Parques Naturales Regionales": 1, "Reserva Natural de la Sociedad Civil": 0, "Reservas Forestales Protectoras Nacionales": 1, "Reservas Forestales Protectoras Regionales": 0, "Santuario de Fauna": 0}, "areas": {"Distritos Nacionales de Manejo Integrado": 0.0, "Distritos Regionales de Manejo Integrado": 0.0, "Distritos de Conservación de Suelos": 0.0, "Parque Nacional Natural": 0.0, "Parques Naturales Regionales": 3218.2, "Reserva Natural de la Sociedad Civil": 0.0, "Reservas Forestales Protectoras Nacionales": 331.0, "Reservas Forestales Protectoras Regionales": 0.0, "Santuario de Fauna": 0.0}}, "Sapuyes": {"counts": {"Distritos Nacionales de Manejo Integrado": 0, "Distritos Regionales de Manejo Integrado": 0, "Distritos de Conservación de Suelos": 0, "Parque Nacional Natural": 0, "Parques Naturales Regionales": 1, "Reserva Natural de la Sociedad Civil": 0, "Reservas Forestales Protectoras Nacionales": 0, "Reservas Forestales Protectoras Regionales": 0, "Santuario de Fauna": 0}, "areas": {"Distritos Nacionales de Manejo Integrado": 0.0, "Distritos Regionales de Manejo Integrado": 0.0, "Distritos de Conservación de Suelos": 0.0, "Parque Nacional Natural": 0.0, "Parques Naturales Regionales": 609.6, "Reserva Natural de la Sociedad Civil": 0.0, "Reservas Forestales Protectoras Nacionales": 0.0, "Reservas Forestales Protectoras Regionales": 0.0, "Santuario de Fauna": 0.0}}, "Tumaco": {"counts": {"Distritos Nacionales de Manejo Integrado": 1, "Distritos Regionales de Manejo Integrado": 0, "Distritos de Conservación de Suelos": 0, "Parque Nacional Natural": 0, "Parques Naturales Regionales": 0, "Reserva Natural de la Sociedad Civil": 1, "Reservas Forestales Protectoras Nacionales": 0, "Reservas Forestales Protectoras Regionales": 0, "Santuario de Fauna": 0}, "areas": {"Distritos Nacionales de Manejo Integrado": 10292.7, "Distritos Regionales de Manejo Integrado": 0.0, "Distritos de Conservación de Suelos": 0.0, "Parque Nacional Natural": 0.0, "Parques Naturales Regionales": 0.0, "Reserva Natural de la Sociedad Civil": 284.4, "Reservas Forestales Protectoras Nacionales": 0.0, "Reservas Forestales Protectoras Regionales": 0.0, "Santuario de Fauna": 0.0}}}, "cauca": {"López": {"counts": {"Distritos Nacionales de Manejo Integrado": 0, "Distritos Regionales de Manejo Integrado": 1, "Distritos de Conservación de Suelos": 0, "Parque Nacional Natural": 1, "Parques Naturales Regionales": 0, "Reserva Natural de la Sociedad Civil": 0, "Reservas Forestales Protectoras Nacionales": 0, "Reservas Forestales Protectoras Regionales": 1, "Santuario de Fauna": 0}, "areas": {"Distritos Nacionales de Manejo Integrado": 0.0, "Distritos Regionales de Manejo Integrado": 0.0, "Distritos de Conservación de Suelos": 0.0, "Parque Nacional Natural": 8.3, "Parques Naturales Regionales": 0.0, "Reserva Natural de la Sociedad Civil": 0.0, "Reservas Forestales Protectoras Nacionales": 0.0, "Reservas Forestales Protectoras Regionales": 4273.3, "Santuario de Fauna": 0.0}}, "El Tambo": {"counts": {"Distritos Nacionales de Manejo Integrado": 0, "Distritos Regionales de Manejo Integrado": 0, "Distritos de Conservación de Suelos": 0, "Parque Nacional Natural": 1, "Parques Naturales Regionales": 0, "Reserva Natural de la Sociedad Civil": 2, "Reservas Forestales Protectoras Nacionales": 0, "Reservas Forestales Protectoras Regionales": 0, "Santuario de Fauna": 0}, "areas": {"Distritos Nacionales de Manejo Integrado": 0.0, "Distritos Regionales de Manejo Integrado": 0.0, "Distritos de Conservación de Suelos": 0.0, "Parque Nacional Natural": 46995.3, "Parques Naturales Regionales": 0.0, "Reserva Natural de la Sociedad Civil": 224.3, "Reservas Forestales Protectoras Nacionales": 0.0, "Reservas Forestales Protectoras Regionales": 0.0, "Santuario de Fauna": 0.0}}, "Argelia": {"counts": {"Distritos Nacionales de Manejo Integrado": 0, "Distritos Regionales de Manejo Integrado": 0, "Distritos de Conservación de Suelos": 0, "Parque Nacional Natural": 0, "Parques Naturales Regionales": 0, "Reserva Natural de la Sociedad Civil": 0, "Reservas Forestales Protectoras Nacionales": 0, "Reservas Forestales Protectoras Regionales": 1, "Santuario de Fauna": 0}, "areas": {"Distritos Nacionales de Manejo Integrado": 0.0, "Distritos Regionales de Manejo Integrado": 0.0, "Distritos de Conservación de Suelos": 0.0, "Parque Nacional Natural": 0.0, "Parques Naturales Regionales": 0.0, "Reserva Natural de la Sociedad Civil": 0.0, "Reservas Forestales Protectoras Nacionales": 0.0, "Reservas Forestales Protectoras Regionales": 7060.2, "Santuario de Fauna": 0.0}}, "Guapi": {"counts": {"Distritos Nacionales de Manejo Integrado": 0, "Distritos Regionales de Manejo Integrado": 0, "Distritos de Conservación de Suelos": 0, "Parque Nacional Natural": 0, "Parques Naturales Regionales": 1, "Reserva Natural de la Sociedad Civil": 0, "Reservas Forestales Protectoras Nacionales": 0, "Reservas Forestales Protectoras Regionales": 1, "Santuario de Fauna": 0}, "areas": {"Distritos Nacionales de Manejo Integrado": 0.0, "Distritos Regionales de Manejo Integrado": 0.0, "Distritos de Conservación de Suelos": 0.0, "Parque Nacional Natural": 0.0, "Parques Naturales Regionales": 4.6, "Reserva Natural de la Sociedad Civil": 0.0, "Reservas Forestales Protectoras Nacionales": 0.0, "Reservas Forestales Protectoras Regionales": 130.3, "Santuario de Fauna": 0.0}}, "Timbiquí": {"counts": {"Distritos Nacionales de Manejo Integrado": 0, "Distritos Regionales de Manejo Integrado": 0, "Distritos de Conservación de Suelos": 0, "Parque Nacional Natural": 0, "Parques Naturales Regionales": 1, "Reserva Natural de la Sociedad Civil": 0, "Reservas Forestales Protectoras Nacionales": 0, "Reservas Forestales Protectoras Regionales": 2, "Santuario de Fauna": 0}, "areas": {"Distritos Nacionales de Manejo Integrado": 0.0, "Distritos Regionales de Manejo Integrado": 0.0, "Distritos de Conservación de Suelos": 0.0, "Parque Nacional Natural": 0.0, "Parques Naturales Regionales": 803.6, "Reserva Natural de la Sociedad Civil": 0.0, "Reservas Forestales Protectoras Nacionales": 0.0, "Reservas Forestales Protectoras Regionales": 7430.3, "Santuario de Fauna": 0.0}}}, "risaralda": {"Pueblo Rico": {"counts": {"Distritos Nacionales de Manejo Integrado": 0, "Distritos Regionales de Manejo Integrado": 1, "Distritos de Conservación de Suelos": 0, "Parque Nacional Natural": 1, "Parques Naturales Regionales": 2, "Reserva Natural de la Sociedad Civil": 0, "Reservas Forestales Protectoras Nacionales": 0, "Reservas Forestales Protectoras Regionales": 0, "Santuario de Fauna": 0}, "areas": {"Distritos Nacionales de Manejo Integrado": 0.0, "Distritos Regionales de Manejo Integrado": 6293.7, "Distritos de Conservación de Suelos": 0.0, "Parque Nacional Natural": 9948.3, "Parques Naturales Regionales": 182.7, "Reserva Natural de la Sociedad Civil": 0.0, "Reservas Forestales Protectoras Nacionales": 0.0, "Reservas Forestales Protectoras Regionales": 0.0, "Santuario de Fauna": 0.0}}, "Mistrató": {"counts": {"Distritos Nacionales de Manejo Integrado": 0, "Distritos Regionales de Manejo Integrado": 3, "Distritos de Conservación de Suelos": 0, "Parque Nacional Natural": 0, "Parques Naturales Regionales": 0, "Reserva Natural de la Sociedad Civil": 0, "Reservas Forestales Protectoras Nacionales": 0, "Reservas Forestales Protectoras Regionales": 1, "Santuario de Fauna": 0}, "areas": {"Distritos Nacionales de Manejo Integrado": 0.0, "Distritos Regionales de Manejo Integrado": 12249.5, "Distritos de Conservación de Suelos": 0.0, "Parque Nacional Natural": 0.0, "Parques Naturales Regionales": 0.0, "Reserva Natural de la Sociedad Civil": 0.0, "Reservas Forestales Protectoras Nacionales": 0.0, "Reservas Forestales Protectoras Regionales": 294.8, "Santuario de Fauna": 0.0}}}}};
  const PARAMOS_DATA={"deptos": ["Nariño", "Antioquia", "Chocó", "Cauca", "Valle del Cauca", "Risaralda"], "paramos": [{"nombre": "Cerro Plateado", "datos": [3467.1, 0.0, 0.0, 10906.6, 0.0, 0.0]}, {"nombre": "Chiles Cumbal", "datos": [31159.7, 0.0, 0.0, 0.0, 0.0, 0.0]}, {"nombre": "Citará", "datos": [0.0, 0.0, 3892.4, 0.0, 0.0, 1043.7]}, {"nombre": "El Duende", "datos": [0.0, 0.0, 2665.1, 0.0, 1286.9, 0.0]}, {"nombre": "Farallones de Cali", "datos": [0.0, 0.0, 0.0, 0.0, 1820.5, 0.0]}, {"nombre": "Frontino – Urrao \"Del Sol Las Alegrías", "datos": [0.0, 11528.0, 856.0, 0.0, 0.0, 0.0]}, {"nombre": "Paramillo", "datos": [0.0, 4256.8, 0.0, 0.0, 0.0, 0.0]}, {"nombre": "Tatamá", "datos": [0.0, 0.0, 7560.1, 0.0, 0.0, 1645.7]}]};
  const PARAMOS_MUNIS={"narino": [{"name": "Cumbal", "Cerro Plateado": 0, "Chiles Cumbal": 18065.2, "Citará": 0, "El Duende": 0, "Farallones de Cali": 0, "Frontino – Urrao \"Del Sol Las Alegrías": 0, "Paramillo": 0, "Tatamá": 0}, {"name": "Mallama", "Cerro Plateado": 0, "Chiles Cumbal": 9427.9, "Citará": 0, "El Duende": 0, "Farallones de Cali": 0, "Frontino – Urrao \"Del Sol Las Alegrías": 0, "Paramillo": 0, "Tatamá": 0}, {"name": "El Charco", "Cerro Plateado": 3467.1, "Chiles Cumbal": 0, "Citará": 0, "El Duende": 0, "Farallones de Cali": 0, "Frontino – Urrao \"Del Sol Las Alegrías": 0, "Paramillo": 0, "Tatamá": 0}, {"name": "Santa Cruz", "Cerro Plateado": 0, "Chiles Cumbal": 1340.5, "Citará": 0, "El Duende": 0, "Farallones de Cali": 0, "Frontino – Urrao \"Del Sol Las Alegrías": 0, "Paramillo": 0, "Tatamá": 0}, {"name": "Los Andes", "Cerro Plateado": 0, "Chiles Cumbal": 698.7, "Citará": 0, "El Duende": 0, "Farallones de Cali": 0, "Frontino – Urrao \"Del Sol Las Alegrías": 0, "Paramillo": 0, "Tatamá": 0}, {"name": "Sapuyes", "Cerro Plateado": 0, "Chiles Cumbal": 693.8, "Citará": 0, "El Duende": 0, "Farallones de Cali": 0, "Frontino – Urrao \"Del Sol Las Alegrías": 0, "Paramillo": 0, "Tatamá": 0}, {"name": "La Llanada", "Cerro Plateado": 0, "Chiles Cumbal": 500.4, "Citará": 0, "El Duende": 0, "Farallones de Cali": 0, "Frontino – Urrao \"Del Sol Las Alegrías": 0, "Paramillo": 0, "Tatamá": 0}, {"name": "Cumbitara", "Cerro Plateado": 0, "Chiles Cumbal": 433.2, "Citará": 0, "El Duende": 0, "Farallones de Cali": 0, "Frontino – Urrao \"Del Sol Las Alegrías": 0, "Paramillo": 0, "Tatamá": 0}], "cauca": [{"name": "Argelia", "Cerro Plateado": 5407.9, "Chiles Cumbal": 0, "Citará": 0, "El Duende": 0, "Farallones de Cali": 0, "Frontino – Urrao \"Del Sol Las Alegrías": 0, "Paramillo": 0, "Tatamá": 0}, {"name": "Guapi", "Cerro Plateado": 4700.0, "Chiles Cumbal": 0, "Citará": 0, "El Duende": 0, "Farallones de Cali": 0, "Frontino – Urrao \"Del Sol Las Alegrías": 0, "Paramillo": 0, "Tatamá": 0}, {"name": "Timbiquí", "Cerro Plateado": 575.2, "Chiles Cumbal": 0, "Citará": 0, "El Duende": 0, "Farallones de Cali": 0, "Frontino – Urrao \"Del Sol Las Alegrías": 0, "Paramillo": 0, "Tatamá": 0}, {"name": "El Tambo", "Cerro Plateado": 223.5, "Chiles Cumbal": 0, "Citará": 0, "El Duende": 0, "Farallones de Cali": 0, "Frontino – Urrao \"Del Sol Las Alegrías": 0, "Paramillo": 0, "Tatamá": 0}], "risaralda": [{"name": "Pueblo Rico", "Cerro Plateado": 0, "Chiles Cumbal": 0, "Citará": 0, "El Duende": 0, "Farallones de Cali": 0, "Frontino – Urrao \"Del Sol Las Alegrías": 0, "Paramillo": 0, "Tatamá": 1645.7}, {"name": "Mistrató", "Cerro Plateado": 0, "Chiles Cumbal": 0, "Citará": 1043.7, "El Duende": 0, "Farallones de Cali": 0, "Frontino – Urrao \"Del Sol Las Alegrías": 0, "Paramillo": 0, "Tatamá": 0}], "choco": [{"name": "San José Del Palmar", "Cerro Plateado": 0, "Chiles Cumbal": 0, "Citará": 0, "El Duende": 0, "Farallones de Cali": 0, "Frontino – Urrao \"Del Sol Las Alegrías": 0, "Paramillo": 0, "Tatamá": 6650.5}, {"name": "El Litoral Del San Juán", "Cerro Plateado": 0, "Chiles Cumbal": 0, "Citará": 0, "El Duende": 2665.1, "Farallones de Cali": 0, "Frontino – Urrao \"Del Sol Las Alegrías": 0, "Paramillo": 0, "Tatamá": 0}, {"name": "El Carmen", "Cerro Plateado": 0, "Chiles Cumbal": 0, "Citará": 1745.1, "El Duende": 0, "Farallones de Cali": 0, "Frontino – Urrao \"Del Sol Las Alegrías": 856.0, "Paramillo": 0, "Tatamá": 0}, {"name": "Bagadó", "Cerro Plateado": 0, "Chiles Cumbal": 0, "Citará": 2147.2, "El Duende": 0, "Farallones de Cali": 0, "Frontino – Urrao \"Del Sol Las Alegrías": 0, "Paramillo": 0, "Tatamá": 0}, {"name": "Tadó", "Cerro Plateado": 0, "Chiles Cumbal": 0, "Citará": 0, "El Duende": 0, "Farallones de Cali": 0, "Frontino – Urrao \"Del Sol Las Alegrías": 0, "Paramillo": 0, "Tatamá": 909.7}], "valle": [{"name": "Buenaventura", "Cerro Plateado": 0, "Chiles Cumbal": 0, "Citará": 0, "El Duende": 0, "Farallones de Cali": 1820.5, "Frontino – Urrao \"Del Sol Las Alegrías": 0, "Paramillo": 0, "Tatamá": 0}, {"name": "Calima", "Cerro Plateado": 0, "Chiles Cumbal": 0, "Citará": 0, "El Duende": 1064.4, "Farallones de Cali": 0, "Frontino – Urrao \"Del Sol Las Alegrías": 0, "Paramillo": 0, "Tatamá": 0}, {"name": "Bolívar", "Cerro Plateado": 0, "Chiles Cumbal": 0, "Citará": 0, "El Duende": 180.7, "Farallones de Cali": 0, "Frontino – Urrao \"Del Sol Las Alegrías": 0, "Paramillo": 0, "Tatamá": 0}, {"name": "Trujillo", "Cerro Plateado": 0, "Chiles Cumbal": 0, "Citará": 0, "El Duende": 41.8, "Farallones de Cali": 0, "Frontino – Urrao \"Del Sol Las Alegrías": 0, "Paramillo": 0, "Tatamá": 0}], "antioquia": [{"name": "Urrao", "Cerro Plateado": 0, "Chiles Cumbal": 0, "Citará": 0, "El Duende": 0, "Farallones de Cali": 0, "Frontino – Urrao \"Del Sol Las Alegrías": 9233.7, "Paramillo": 0, "Tatamá": 0}, {"name": "Dabeiba", "Cerro Plateado": 0, "Chiles Cumbal": 0, "Citará": 0, "El Duende": 0, "Farallones de Cali": 0, "Frontino – Urrao \"Del Sol Las Alegrías": 0, "Paramillo": 2626.6, "Tatamá": 0}, {"name": "Abriaquí", "Cerro Plateado": 0, "Chiles Cumbal": 0, "Citará": 0, "El Duende": 0, "Farallones de Cali": 0, "Frontino – Urrao \"Del Sol Las Alegrías": 1619.9, "Paramillo": 0, "Tatamá": 0}, {"name": "Ituango", "Cerro Plateado": 0, "Chiles Cumbal": 0, "Citará": 0, "El Duende": 0, "Farallones de Cali": 0, "Frontino – Urrao \"Del Sol Las Alegrías": 0, "Paramillo": 1585.5, "Tatamá": 0}, {"name": "Frontino", "Cerro Plateado": 0, "Chiles Cumbal": 0, "Citará": 0, "El Duende": 0, "Farallones de Cali": 0, "Frontino – Urrao \"Del Sol Las Alegrías": 588.5, "Paramillo": 0, "Tatamá": 0}, {"name": "Cañasgordas", "Cerro Plateado": 0, "Chiles Cumbal": 0, "Citará": 0, "El Duende": 0, "Farallones de Cali": 0, "Frontino – Urrao \"Del Sol Las Alegrías": 85.9, "Paramillo": 0, "Tatamá": 0}, {"name": "Mutatá", "Cerro Plateado": 0, "Chiles Cumbal": 0, "Citará": 0, "El Duende": 0, "Farallones de Cali": 0, "Frontino – Urrao \"Del Sol Las Alegrías": 0, "Paramillo": 44.7, "Tatamá": 0}]};
  const PARAMOS_COLORS=["#4A148C", "#7B1FA2", "#AB47BC", "#CE93D8", "#1A237E", "#3949AB", "#42A5F5", "#80DEEA"];
  const PAL_CIENAGAS=["#0A4A5E","#1589A8","#2AAAC8","#55C2DC","#97DBF2","#B4E7F8","#CAF0FA","#DFF6FD","#EDF9FE"];
  
  const POB_DATA={deptos:[{"id": "antioquia", "name": "Antioquia", "municipios": 16, "hombres": 334286, "mujeres": 336723, "total": 671009, "pct": 28.4}, {"id": "choco", "name": "Chocó", "municipios": 31, "hombres": 273997, "mujeres": 281903, "total": 555900, "pct": 23.5}, {"id": "valle", "name": "Valle del Cauca", "municipios": 15, "hombres": 238275, "mujeres": 248097, "total": 486372, "pct": 20.6}, {"id": "narino", "name": "Nariño", "municipios": 22, "hombres": 234218, "mujeres": 236350, "total": 470568, "pct": 19.9}, {"id": "cauca", "name": "Cauca", "municipios": 5, "hombres": 57784, "mujeres": 55787, "total": 113571, "pct": 4.8}, {"id": "cordoba", "name": "Córdoba", "municipios": 2, "hombres": 21457, "mujeres": 19590, "total": 41047, "pct": 1.7}, {"id": "risaralda", "name": "Risaralda", "municipios": 2, "hombres": 13834, "mujeres": 13316, "total": 27150, "pct": 1.1}],munis:{"antioquia": [{"name": "Turbo", "hombres": 79730, "mujeres": 82317, "total": 162047}, {"name": "Apartadó", "hombres": 71194, "mujeres": 73557, "total": 144751}, {"name": "Chigorodó", "hombres": 27738, "mujeres": 29395, "total": 57133}, {"name": "Carepa", "hombres": 26934, "mujeres": 27522, "total": 54456}, {"name": "Necoclí", "hombres": 21436, "mujeres": 21558, "total": 42994}, {"name": "Urrao", "hombres": 18382, "mujeres": 18085, "total": 36467}, {"name": "Mutatá", "hombres": 16936, "mujeres": 15505, "total": 32441}, {"name": "Dabeiba", "hombres": 15623, "mujeres": 14805, "total": 30428}, {"name": "Frontino", "hombres": 14219, "mujeres": 13668, "total": 27887}, {"name": "San Pedro De Urabá", "hombres": 13049, "mujeres": 13055, "total": 26104}, {"name": "Cañasgordas", "hombres": 9325, "mujeres": 8793, "total": 18118}, {"name": "Abriaquí", "hombres": 6692, "mujeres": 5869, "total": 12561}, {"name": "Vigía Del Fuerte", "hombres": 4805, "mujeres": 4832, "total": 9637}, {"name": "Uramita", "hombres": 4816, "mujeres": 4444, "total": 9260}, {"name": "Murindó", "hombres": 2496, "mujeres": 2413, "total": 4909}, {"name": "Ituango", "hombres": 911, "mujeres": 905, "total": 1816}], "choco": [{"name": "Quibdó", "hombres": 56915, "mujeres": 66758, "total": 123673}, {"name": "Istmina", "hombres": 16012, "mujeres": 17938, "total": 33950}, {"name": "Belén de bajirá", "hombres": 15563, "mujeres": 13650, "total": 29213}, {"name": "Tadó", "hombres": 14166, "mujeres": 14920, "total": 29086}, {"name": "Riosucio", "hombres": 14581, "mujeres": 12429, "total": 27010}, {"name": "Alto Baudó", "hombres": 12710, "mujeres": 12645, "total": 25355}, {"name": "Bajo Baudó", "hombres": 12070, "mujeres": 11899, "total": 23969}, {"name": "Rio Quito", "hombres": 11038, "mujeres": 12750, "total": 23788}, {"name": "Carmen Del Darién", "hombres": 11672, "mujeres": 10343, "total": 22015}, {"name": "Medio Atrato", "hombres": 7964, "mujeres": 7481, "total": 15445}, {"name": "Bojayá", "hombres": 7584, "mujeres": 7426, "total": 15010}, {"name": "Condoto", "hombres": 6608, "mujeres": 7146, "total": 13754}, {"name": "Unguía", "hombres": 7100, "mujeres": 6647, "total": 13747}, {"name": "Acandí", "hombres": 6836, "mujeres": 6801, "total": 13637}, {"name": "Medio Baudó", "hombres": 6776, "mujeres": 6670, "total": 13446}, {"name": "Medio San Juan", "hombres": 5908, "mujeres": 6119, "total": 12027}, {"name": "El Litoral Del San Juán", "hombres": 6064, "mujeres": 5822, "total": 11886}, {"name": "Bagadó", "hombres": 5401, "mujeres": 5382, "total": 10783}, {"name": "Bahía Solano", "hombres": 5043, "mujeres": 5111, "total": 10154}, {"name": "Sipí", "hombres": 5135, "mujeres": 4753, "total": 9888}, {"name": "Atrato (Yuto)", "hombres": 4812, "mujeres": 4902, "total": 9714}, {"name": "Unión Panamericana", "hombres": 4594, "mujeres": 4886, "total": 9480}, {"name": "Nóvita", "hombres": 4748, "mujeres": 4662, "total": 9410}, {"name": "Lloró", "hombres": 4629, "mujeres": 4460, "total": 9089}, {"name": "El Carmen", "hombres": 4291, "mujeres": 4311, "total": 8602}, {"name": "Rio Iró", "hombres": 3634, "mujeres": 3865, "total": 7499}, {"name": "Cértegui", "hombres": 3051, "mujeres": 3265, "total": 6316}, {"name": "El Cantón Del San Pablo", "hombres": 2784, "mujeres": 2879, "total": 5663}, {"name": "San José Del Palmar", "hombres": 2437, "mujeres": 2284, "total": 4721}, {"name": "Juradó", "hombres": 2107, "mujeres": 2007, "total": 4114}, {"name": "Nuquí", "hombres": 1764, "mujeres": 1692, "total": 3456}], "risaralda": [{"name": "Pueblo Rico", "hombres": 7519, "mujeres": 7333, "total": 14852}, {"name": "Mistrató", "hombres": 6315, "mujeres": 5983, "total": 12298}], "valle": [{"name": "Buenaventura", "hombres": 122885, "mujeres": 137392, "total": 260277}, {"name": "Dagua", "hombres": 24972, "mujeres": 24621, "total": 49593}, {"name": "La Cumbre", "hombres": 17577, "mujeres": 16936, "total": 34513}, {"name": "Calima", "hombres": 13458, "mujeres": 13197, "total": 26655}, {"name": "Restrepo", "hombres": 8469, "mujeres": 8341, "total": 16810}, {"name": "Versalles", "hombres": 7536, "mujeres": 7156, "total": 14692}, {"name": "Roldanillo", "hombres": 7225, "mujeres": 6970, "total": 14195}, {"name": "El Cairo", "hombres": 6405, "mujeres": 5594, "total": 11999}, {"name": "Bolívar", "hombres": 6185, "mujeres": 5785, "total": 11970}, {"name": "El Dovio", "hombres": 5728, "mujeres": 5695, "total": 11423}, {"name": "Vijes", "hombres": 4967, "mujeres": 4580, "total": 9547}, {"name": "Yotoco", "hombres": 3645, "mujeres": 3412, "total": 7057}, {"name": "La Unión", "hombres": 3500, "mujeres": 3325, "total": 6825}, {"name": "Trujillo", "hombres": 3077, "mujeres": 2731, "total": 5808}, {"name": "Argelia", "hombres": 2646, "mujeres": 2362, "total": 5008}], "cordoba": [{"name": "Tierralta", "hombres": 14457, "mujeres": 13336, "total": 27793}, {"name": "Valencia", "hombres": 7000, "mujeres": 6254, "total": 13254}], "cauca": [{"name": "López", "hombres": 13935, "mujeres": 13296, "total": 27231}, {"name": "Argelia", "hombres": 13624, "mujeres": 12702, "total": 26326}, {"name": "Guapi", "hombres": 12041, "mujeres": 12441, "total": 24482}, {"name": "Timbiquí", "hombres": 10919, "mujeres": 10695, "total": 21614}, {"name": "El Tambo", "hombres": 7265, "mujeres": 6653, "total": 13918}], "narino": [{"name": "Tumaco", "hombres": 65917, "mujeres": 72023, "total": 137940}, {"name": "Barbacoas", "hombres": 23260, "mujeres": 23088, "total": 46348}, {"name": "Magüí", "hombres": 16496, "mujeres": 15523, "total": 32019}, {"name": "El Charco", "hombres": 13526, "mujeres": 13016, "total": 26542}, {"name": "Cumbal", "hombres": 12851, "mujeres": 13200, "total": 26051}, {"name": "Ricaurte", "hombres": 13152, "mujeres": 12592, "total": 25744}, {"name": "Olaya Herrera", "hombres": 11374, "mujeres": 11354, "total": 22728}, {"name": "Mallama", "hombres": 10367, "mujeres": 10330, "total": 20697}, {"name": "Samaniego", "hombres": 9034, "mujeres": 8837, "total": 17871}, {"name": "Roberto Payán", "hombres": 8005, "mujeres": 7720, "total": 15725}, {"name": "La Tola", "hombres": 6879, "mujeres": 6606, "total": 13485}, {"name": "Mosquera", "hombres": 5980, "mujeres": 5822, "total": 11802}, {"name": "Santa Cruz", "hombres": 5600, "mujeres": 5385, "total": 10985}, {"name": "Santa Bárbara", "hombres": 5127, "mujeres": 5028, "total": 10155}, {"name": "Policarpa", "hombres": 4094, "mujeres": 4085, "total": 8179}, {"name": "Francisco Pizarro", "hombres": 3720, "mujeres": 3710, "total": 7430}, {"name": "Los Andes", "hombres": 3631, "mujeres": 3506, "total": 7137}, {"name": "Leiva", "hombres": 3688, "mujeres": 3298, "total": 6986}, {"name": "Cumbitara", "hombres": 3389, "mujeres": 3214, "total": 6603}, {"name": "Sapuyes", "hombres": 3055, "mujeres": 3142, "total": 6197}, {"name": "El Rosario", "hombres": 2673, "mujeres": 2478, "total": 5151}, {"name": "La Llanada", "hombres": 2400, "mujeres": 2393, "total": 4793}]},piramide:[{"grupo": "0-4", "total": 217570}, {"grupo": "5-9", "total": 243354}, {"grupo": "10-14", "total": 260397}, {"grupo": "15-19", "total": 242584}, {"grupo": "20-24", "total": 206961}, {"grupo": "25-29", "total": 188006}, {"grupo": "30-34", "total": 169190}, {"grupo": "35-39", "total": 153468}, {"grupo": "40-44", "total": 130367}, {"grupo": "45-49", "total": 117589}, {"grupo": "50-54", "total": 106631}, {"grupo": "55-59", "total": 94007}, {"grupo": "60-64", "total": 73665}, {"grupo": "65-69", "total": 55839}, {"grupo": "70-74", "total": 39089}, {"grupo": "75-79", "total": 30314}, {"grupo": "80-84", "total": 20405}, {"grupo": "85-89", "total": 10154}, {"grupo": "90-94", "total": 4104}, {"grupo": "95-99", "total": 1290}, {"grupo": "100+", "total": 633}]};
  const DATA_OTHER={
    cuencas:{label:"Cuencas hidrográficas",ip:false,real:true,
      deptos:[{"id": "choco", "name": "Chocó", "municipios": 31, "area": 4842810.1, "pct": 42.87}, {"id": "narino", "name": "Nariño", "municipios": 22, "area": 2142355.9, "pct": 18.96}, {"id": "antioquia", "name": "Antioquia", "municipios": 16, "area": 1740469.3, "pct": 15.41}, {"id": "cauca", "name": "Cauca", "municipios": 5, "area": 1038078.9, "pct": 9.19}, {"id": "valle", "name": "Valle del Cauca", "municipios": 15, "area": 999752.4, "pct": 8.85}, {"id": "cordoba", "name": "Córdoba", "municipios": 2, "area": 424242.1, "pct": 3.76}, {"id": "risaralda", "name": "Risaralda", "municipios": 2, "area": 108846.2, "pct": 0.96}],
      munis:{"choco": [{"name": "Riosucio", "area": 589609.6}, {"name": "El Litoral Del San Juán", "area": 413615.3}, {"name": "Bojayá", "area": 363317.8}, {"name": "Quibdó", "area": 350865.6}, {"name": "Bajo Baudó", "area": 348219.8}, {"name": "Carmen Del Darién", "area": 318268.7}, {"name": "Alto Baudó", "area": 205187.8}, {"name": "Istmina", "area": 188108.2}, {"name": "Medio Atrato", "area": 181374.9}, {"name": "Belén de bajirá", "area": 171936.1}, {"name": "San José Del Palmar", "area": 158252.4}, {"name": "Sipí", "area": 157745.3}, {"name": "Medio Baudó", "area": 137294.3}, {"name": "Juradó", "area": 129805.4}, {"name": "Unguía", "area": 119123.1}, {"name": "Nóvita", "area": 94567.6}, {"name": "Bahía Solano", "area": 89606.6}, {"name": "Lloró", "area": 84312.3}, {"name": "El Carmen", "area": 83029.4}, {"name": "Bagadó", "area": 80756.9}, {"name": "Acandí", "area": 79852.8}, {"name": "Tadó", "area": 71499.6}, {"name": "Nuquí", "area": 70458.3}, {"name": "Rio Quito", "area": 69936.3}, {"name": "Medio San Juan", "area": 66377.4}, {"name": "Condoto", "area": 46788.6}, {"name": "Cértegui", "area": 42351.4}, {"name": "Atrato (Yuto)", "area": 42173.9}, {"name": "El Cantón Del San Pablo", "area": 38069.3}, {"name": "Rio Iró", "area": 32521.6}, {"name": "Unión Panamericana", "area": 17783.8}], "risaralda": [{"name": "Pueblo Rico", "area": 61380.3}, {"name": "Mistrató", "area": 47465.9}], "antioquia": [{"name": "Turbo", "area": 288633.7}, {"name": "Urrao", "area": 256385.0}, {"name": "Dabeiba", "area": 195766.9}, {"name": "Vigía Del Fuerte", "area": 166273.0}, {"name": "Frontino", "area": 138445.6}, {"name": "Murindó", "area": 126684.0}, {"name": "Mutatá", "area": 107526.6}, {"name": "Necoclí", "area": 105912.8}, {"name": "Ituango", "area": 82328.8}, {"name": "Chigorodó", "area": 72198.2}, {"name": "Apartadó", "area": 53536.5}, {"name": "Carepa", "area": 38743.5}, {"name": "Cañasgordas", "area": 36483.9}, {"name": "Abriaquí", "area": 29697.4}, {"name": "Uramita", "area": 26593.7}, {"name": "San Pedro De Urabá", "area": 15259.8}], "cordoba": [{"name": "Tierralta", "area": 390190.4}, {"name": "Valencia", "area": 34051.7}], "cauca": [{"name": "López", "area": 337042.7}, {"name": "Guapi", "area": 257088.7}, {"name": "Timbiquí", "area": 205978.5}, {"name": "El Tambo", "area": 160323.4}, {"name": "Argelia", "area": 77645.5}], "valle": [{"name": "Buenaventura", "area": 629593.5}, {"name": "Dagua", "area": 91707.3}, {"name": "Calima", "area": 79384.6}, {"name": "Bolívar", "area": 61407.9}, {"name": "La Cumbre", "area": 25555.0}, {"name": "El Dovio", "area": 23602.9}, {"name": "El Cairo", "area": 21423.7}, {"name": "Versalles", "area": 20063.8}, {"name": "Restrepo", "area": 13724.3}, {"name": "Argelia", "area": 9080.6}, {"name": "Roldanillo", "area": 8110.8}, {"name": "Vijes", "area": 6645.9}, {"name": "Trujillo", "area": 4817.0}, {"name": "Yotoco", "area": 3792.4}, {"name": "La Unión", "area": 842.6}], "narino": [{"name": "Tumaco", "area": 359474.7}, {"name": "Barbacoas", "area": 273590.4}, {"name": "El Charco", "area": 249369.8}, {"name": "Magüí", "area": 181061.1}, {"name": "Roberto Payán", "area": 146003.8}, {"name": "Santa Bárbara", "area": 122612.6}, {"name": "Ricaurte", "area": 105643.7}, {"name": "Olaya Herrera", "area": 100466.7}, {"name": "Los Andes", "area": 83301.3}, {"name": "Mosquera", "area": 76930.8}, {"name": "Cumbal", "area": 66464.4}, {"name": "Mallama", "area": 56981.4}, {"name": "Francisco Pizarro", "area": 52608.3}, {"name": "Samaniego", "area": 44291.6}, {"name": "Santa Cruz", "area": 43458.3}, {"name": "La Tola", "area": 41653.2}, {"name": "El Rosario", "area": 36674.4}, {"name": "Cumbitara", "area": 35555.1}, {"name": "Policarpa", "area": 34445.2}, {"name": "La Llanada", "area": 20504.7}, {"name": "Leiva", "area": 10078.8}, {"name": "Sapuyes", "area": 1185.7}]},
      cuencas:[{"name": "Atrato - Darién", "area": 3770728.7, "pct": 33.38}, {"name": "Tapaje - Dagua - Directos", "area": 2081396.4, "pct": 18.43}, {"name": "San Juán", "area": 1637271.8, "pct": 14.49}, {"name": "Patía", "area": 1166369.6, "pct": 10.33}, {"name": "Baudó - Directos Pacifico", "area": 596480.9, "pct": 5.28}, {"name": "Mira", "area": 583086.9, "pct": 5.16}, {"name": "Caribe - Litoral", "area": 521749.1, "pct": 4.62}, {"name": "Sinú", "area": 507128.5, "pct": 4.49}, {"name": "Pacífico - Directos", "area": 424455.0, "pct": 3.76}, {"name": "Cauca", "area": 7709.2, "pct": 0.07}, {"name": "Bajo Magdalena- Cauca -San Jorge", "area": 178.8, "pct": 0.0}]
    },
    humedales:{label:"Humedales",ip:false,real:true,totalExact:2923819.2,
      deptos:[{"id": "choco", "name": "Chocó", "municipios": 31, "area": 1352766.1, "pct": 46.3}, {"id": "narino", "name": "Nariño", "municipios": 22, "area": 678077.3, "pct": 23.2}, {"id": "antioquia", "name": "Antioquia", "municipios": 16, "area": 570885.7, "pct": 19.5}, {"id": "cauca", "name": "Cauca", "municipios": 5, "area": 152741.3, "pct": 5.2}, {"id": "valle", "name": "Valle del Cauca", "municipios": 14, "area": 135613.8, "pct": 4.6}, {"id": "cordoba", "name": "Córdoba", "municipios": 2, "area": 33212.5, "pct": 1.1}, {"id": "risaralda", "name": "Risaralda", "municipios": 2, "area": 522.6, "pct": 0.0}],
      munis:{"antioquia": [{"name": "Turbo", "area": 183615.9}, {"name": "Vigía Del Fuerte", "area": 104298.7}, {"name": "Murindó", "area": 74826.2}, {"name": "Necoclí", "area": 47599.8}, {"name": "Chigorodó", "area": 39503.2}, {"name": "Mutatá", "area": 27017.4}, {"name": "Carepa", "area": 24070.1}, {"name": "Urrao", "area": 21550.8}, {"name": "Apartadó", "area": 19319.8}, {"name": "Frontino", "area": 10084.6}, {"name": "Dabeiba", "area": 6937.2}, {"name": "San Pedro De Urabá", "area": 5445.4}, {"name": "Abriaquí", "area": 4680.1}, {"name": "Cañasgordas", "area": 1170.4}, {"name": "Ituango", "area": 392.8}, {"name": "Uramita", "area": 373.3}], "choco": [{"name": "Carmen Del Darién", "area": 193185.6}, {"name": "Riosucio", "area": 175089.2}, {"name": "Belén de bajirá", "area": 148921.2}, {"name": "El Litoral Del San Juán", "area": 117915.3}, {"name": "Medio Atrato", "area": 89880.3}, {"name": "Quibdó", "area": 81383.2}, {"name": "Bajo Baudó", "area": 80957.5}, {"name": "Bojayá", "area": 65551.7}, {"name": "Unguía", "area": 49765.0}, {"name": "Istmina", "area": 35516.3}, {"name": "Medio Baudó", "area": 31885.7}, {"name": "Medio San Juan", "area": 31326.8}, {"name": "Sipí", "area": 28454.0}, {"name": "Nóvita", "area": 25803.7}, {"name": "Rio Quito", "area": 25260.7}, {"name": "Atrato (Yuto)", "area": 21669.9}, {"name": "Alto Baudó", "area": 20138.3}, {"name": "El Cantón Del San Pablo", "area": 19607.0}, {"name": "Lloró", "area": 16739.4}, {"name": "Unión Panamericana", "area": 13639.2}, {"name": "Juradó", "area": 12868.9}, {"name": "Acandí", "area": 12647.6}, {"name": "Bahía Solano", "area": 12621.7}, {"name": "Nuquí", "area": 9615.3}, {"name": "Condoto", "area": 8208.1}, {"name": "Cértegui", "area": 6801.2}, {"name": "El Carmen", "area": 5499.0}, {"name": "Tadó", "area": 4185.7}, {"name": "Rio Iró", "area": 3350.7}, {"name": "Bagadó", "area": 2687.1}, {"name": "San José Del Palmar", "area": 1591.0}], "cordoba": [{"name": "Tierralta", "area": 28280.8}, {"name": "Valencia", "area": 4931.7}], "risaralda": [{"name": "Pueblo Rico", "area": 302.4}, {"name": "Mistrató", "area": 220.2}], "valle": [{"name": "Buenaventura", "area": 115201.7}, {"name": "Versalles", "area": 5735.8}, {"name": "Calima", "area": 5636.2}, {"name": "El Dovio", "area": 2966.4}, {"name": "Bolívar", "area": 1260.8}, {"name": "La Cumbre", "area": 785.9}, {"name": "Restrepo", "area": 755.3}, {"name": "Roldanillo", "area": 751.3}, {"name": "Argelia", "area": 744.9}, {"name": "El Cairo", "area": 598.3}, {"name": "Dagua", "area": 434.7}, {"name": "Yotoco", "area": 431.7}, {"name": "Vijes", "area": 289.0}, {"name": "La Unión", "area": 21.8}], "cauca": [{"name": "López", "area": 60086.4}, {"name": "Guapi", "area": 52215.3}, {"name": "Timbiquí", "area": 39700.0}, {"name": "El Tambo", "area": 509.5}, {"name": "Argelia", "area": 230.1}], "narino": [{"name": "Tumaco", "area": 160730.4}, {"name": "Olaya Herrera", "area": 98035.6}, {"name": "El Charco", "area": 89198.2}, {"name": "Roberto Payán", "area": 76423.8}, {"name": "Mosquera", "area": 70077.2}, {"name": "Santa Bárbara", "area": 46534.9}, {"name": "Magüí", "area": 41691.9}, {"name": "La Tola", "area": 41398.3}, {"name": "Francisco Pizarro", "area": 37388.6}, {"name": "Cumbal", "area": 8013.5}, {"name": "Barbacoas", "area": 4923.9}, {"name": "Ricaurte", "area": 733.9}, {"name": "Mallama", "area": 680.8}, {"name": "Los Andes", "area": 502.8}, {"name": "Sapuyes", "area": 411.9}, {"name": "Policarpa", "area": 287.0}, {"name": "Cumbitara", "area": 245.5}, {"name": "Santa Cruz", "area": 227.8}, {"name": "Samaniego", "area": 219.1}, {"name": "La Llanada", "area": 172.0}, {"name": "El Rosario", "area": 146.9}, {"name": "Leiva", "area": 33.5}]}
    },
    runap:{label:"Áreas de conservación (RUNAP)",ip:false,real:true,totalExact:1601468.9,
      deptos:[{"id": "valle", "name": "Valle del Cauca", "municipios": 14, "area": 413918.7, "pct": 25.8}, {"id": "choco", "name": "Chocó", "municipios": 16, "area": 402036.6, "pct": 25.1}, {"id": "cordoba", "name": "Córdoba", "municipios": 2, "area": 294969.6, "pct": 18.4}, {"id": "antioquia", "name": "Antioquia", "municipios": 12, "area": 287283.8, "pct": 17.9}, {"id": "narino", "name": "Nariño", "municipios": 9, "area": 107361.1, "pct": 6.7}, {"id": "cauca", "name": "Cauca", "municipios": 5, "area": 66930.2, "pct": 4.2}, {"id": "risaralda", "name": "Risaralda", "municipios": 2, "area": 28969.0, "pct": 1.8}],
      munis:{"valle": [{"name": "Buenaventura", "area": 267705.7}, {"name": "Calima", "area": 51538.3}, {"name": "Dagua", "area": 40205.9}, {"name": "El Cairo", "area": 21782.8}, {"name": "Versalles", "area": 9896.0}, {"name": "El Dovio", "area": 9091.5}, {"name": "La Cumbre", "area": 6624.4}, {"name": "Restrepo", "area": 3059.8}, {"name": "Bolívar", "area": 2841.8}, {"name": "Trujillo", "area": 856.1}, {"name": "Vijes", "area": 263.3}, {"name": "Roldanillo", "area": 33.1}, {"name": "Yotoco", "area": 19.9}, {"name": "Argelia", "area": 0.1}], "cauca": [{"name": "El Tambo", "area": 47219.5}, {"name": "Timbiquí", "area": 8233.9}, {"name": "Argelia", "area": 7060.2}, {"name": "López", "area": 4281.6}, {"name": "Guapi", "area": 134.9}], "antioquia": [{"name": "Ituango", "area": 81742.4}, {"name": "Frontino", "area": 50148.5}, {"name": "Urrao", "area": 38517.8}, {"name": "Turbo", "area": 35705.0}, {"name": "Necoclí", "area": 25633.5}, {"name": "Apartadó", "area": 23199.3}, {"name": "Dabeiba", "area": 10171.6}, {"name": "Carepa", "area": 9651.6}, {"name": "Abriaquí", "area": 5465.7}, {"name": "Chigorodó", "area": 3070.4}, {"name": "Mutatá", "area": 2310.7}, {"name": "Cañasgordas", "area": 1667.2}], "choco": [{"name": "Bajo Baudó", "area": 105910.8}, {"name": "Riosucio", "area": 56700.0}, {"name": "Unguía", "area": 52046.0}, {"name": "Acandí", "area": 45971.7}, {"name": "Belén de bajirá", "area": 35213.6}, {"name": "San José Del Palmar", "area": 22437.1}, {"name": "Alto Baudó", "area": 20362.9}, {"name": "El Carmen", "area": 20080.1}, {"name": "Bojayá", "area": 15530.2}, {"name": "Nuquí", "area": 11323.2}, {"name": "Bahía Solano", "area": 8161.0}, {"name": "Tadó", "area": 4000.0}, {"name": "El Litoral Del San Juán", "area": 3954.5}, {"name": "Bagadó", "area": 265.8}, {"name": "Sipí", "area": 76.8}, {"name": "Quibdó", "area": 3.0}], "narino": [{"name": "Mosquera", "area": 36644.2}, {"name": "Olaya Herrera", "area": 19953.0}, {"name": "El Charco", "area": 15127.7}, {"name": "La Tola", "area": 14389.3}, {"name": "Tumaco", "area": 10577.1}, {"name": "Ricaurte", "area": 4060.8}, {"name": "Mallama", "area": 3549.2}, {"name": "Barbacoas", "area": 2450.2}, {"name": "Sapuyes", "area": 609.6}], "cordoba": [{"name": "Tierralta", "area": 294969.6}, {"name": "Valencia", "area": 0.0}], "risaralda": [{"name": "Pueblo Rico", "area": 16424.7}, {"name": "Mistrató", "area": 12544.3}]}
    },
    manglares:{label:"Manglares",ip:false,real:true,
      deptos:[{"id": "narino", "name": "Nariño", "municipios": 7, "area": 104184.4, "pct": 51.1}, {"id": "choco", "name": "Chocó", "municipios": 7, "area": 37418.4, "pct": 18.3}, {"id": "valle", "name": "Valle del Cauca", "municipios": 1, "area": 37285.2, "pct": 18.3}, {"id": "cauca", "name": "Cauca", "municipios": 3, "area": 19618.1, "pct": 9.6}, {"id": "antioquia", "name": "Antioquia", "municipios": 2, "area": 5409.7, "pct": 2.7}],
      munis:{"antioquia": [{"name": "Turbo", "area": 4957.7}, {"name": "Necoclí", "area": 452.1}], "choco": [{"name": "Bajo Baudó", "area": 22359.9}, {"name": "El Litoral Del San Juán", "area": 10669.8}, {"name": "Nuquí", "area": 2251.6}, {"name": "Juradó", "area": 1503.3}, {"name": "Bahía Solano", "area": 448.9}, {"name": "Unguía", "area": 153.5}, {"name": "Acandí", "area": 31.3}], "valle": [{"name": "Buenaventura", "area": 37285.2}], "cauca": [{"name": "Timbiquí", "area": 8509.2}, {"name": "López", "area": 5867.8}, {"name": "Guapi", "area": 5241.0}], "narino": [{"name": "Tumaco", "area": 31583.3}, {"name": "Mosquera", "area": 26566.0}, {"name": "El Charco", "area": 10830.4}, {"name": "Olaya Herrera", "area": 10562.0}, {"name": "La Tola", "area": 10356.9}, {"name": "Santa Bárbara", "area": 9076.7}, {"name": "Francisco Pizarro", "area": 5209.0}]}
    },
    paramos:{label:"Páramos",ip:false,real:true,totalExact:82088.6,
      deptos:[{"id": "narino", "name": "Nariño", "municipios": 8, "area": 34626.8, "pct": 42.2}, {"id": "antioquia", "name": "Antioquia", "municipios": 7, "area": 15784.9, "pct": 19.2}, {"id": "choco", "name": "Chocó", "municipios": 5, "area": 14973.6, "pct": 18.2}, {"id": "cauca", "name": "Cauca", "municipios": 4, "area": 10906.6, "pct": 13.3}, {"id": "valle", "name": "Valle del Cauca", "municipios": 4, "area": 3107.4, "pct": 3.8}, {"id": "risaralda", "name": "Risaralda", "municipios": 2, "area": 2689.4, "pct": 3.3}],
      munis:{"narino": [{"name": "Cumbal", "Cerro Plateado": 0, "Chiles Cumbal": 18065.2, "Citará": 0, "El Duende": 0, "Farallones de Cali": 0, "Frontino – Urrao \"Del Sol Las Alegrías": 0, "Paramillo": 0, "Tatamá": 0, "area": 18065.2}, {"name": "Mallama", "Cerro Plateado": 0, "Chiles Cumbal": 9427.9, "Citará": 0, "El Duende": 0, "Farallones de Cali": 0, "Frontino – Urrao \"Del Sol Las Alegrías": 0, "Paramillo": 0, "Tatamá": 0, "area": 9427.9}, {"name": "El Charco", "Cerro Plateado": 3467.1, "Chiles Cumbal": 0, "Citará": 0, "El Duende": 0, "Farallones de Cali": 0, "Frontino – Urrao \"Del Sol Las Alegrías": 0, "Paramillo": 0, "Tatamá": 0, "area": 3467.1}, {"name": "Santa Cruz", "Cerro Plateado": 0, "Chiles Cumbal": 1340.5, "Citará": 0, "El Duende": 0, "Farallones de Cali": 0, "Frontino – Urrao \"Del Sol Las Alegrías": 0, "Paramillo": 0, "Tatamá": 0, "area": 1340.5}, {"name": "Los Andes", "Cerro Plateado": 0, "Chiles Cumbal": 698.7, "Citará": 0, "El Duende": 0, "Farallones de Cali": 0, "Frontino – Urrao \"Del Sol Las Alegrías": 0, "Paramillo": 0, "Tatamá": 0, "area": 698.7}, {"name": "Sapuyes", "Cerro Plateado": 0, "Chiles Cumbal": 693.8, "Citará": 0, "El Duende": 0, "Farallones de Cali": 0, "Frontino – Urrao \"Del Sol Las Alegrías": 0, "Paramillo": 0, "Tatamá": 0, "area": 693.8}, {"name": "La Llanada", "Cerro Plateado": 0, "Chiles Cumbal": 500.4, "Citará": 0, "El Duende": 0, "Farallones de Cali": 0, "Frontino – Urrao \"Del Sol Las Alegrías": 0, "Paramillo": 0, "Tatamá": 0, "area": 500.4}, {"name": "Cumbitara", "Cerro Plateado": 0, "Chiles Cumbal": 433.2, "Citará": 0, "El Duende": 0, "Farallones de Cali": 0, "Frontino – Urrao \"Del Sol Las Alegrías": 0, "Paramillo": 0, "Tatamá": 0, "area": 433.2}], "cauca": [{"name": "Argelia", "Cerro Plateado": 5407.9, "Chiles Cumbal": 0, "Citará": 0, "El Duende": 0, "Farallones de Cali": 0, "Frontino – Urrao \"Del Sol Las Alegrías": 0, "Paramillo": 0, "Tatamá": 0, "area": 5407.9}, {"name": "Guapi", "Cerro Plateado": 4700.0, "Chiles Cumbal": 0, "Citará": 0, "El Duende": 0, "Farallones de Cali": 0, "Frontino – Urrao \"Del Sol Las Alegrías": 0, "Paramillo": 0, "Tatamá": 0, "area": 4700.0}, {"name": "Timbiquí", "Cerro Plateado": 575.2, "Chiles Cumbal": 0, "Citará": 0, "El Duende": 0, "Farallones de Cali": 0, "Frontino – Urrao \"Del Sol Las Alegrías": 0, "Paramillo": 0, "Tatamá": 0, "area": 575.2}, {"name": "El Tambo", "Cerro Plateado": 223.5, "Chiles Cumbal": 0, "Citará": 0, "El Duende": 0, "Farallones de Cali": 0, "Frontino – Urrao \"Del Sol Las Alegrías": 0, "Paramillo": 0, "Tatamá": 0, "area": 223.5}], "risaralda": [{"name": "Pueblo Rico", "Cerro Plateado": 0, "Chiles Cumbal": 0, "Citará": 0, "El Duende": 0, "Farallones de Cali": 0, "Frontino – Urrao \"Del Sol Las Alegrías": 0, "Paramillo": 0, "Tatamá": 1645.7, "area": 1645.7}, {"name": "Mistrató", "Cerro Plateado": 0, "Chiles Cumbal": 0, "Citará": 1043.7, "El Duende": 0, "Farallones de Cali": 0, "Frontino – Urrao \"Del Sol Las Alegrías": 0, "Paramillo": 0, "Tatamá": 0, "area": 1043.7}], "choco": [{"name": "San José Del Palmar", "Cerro Plateado": 0, "Chiles Cumbal": 0, "Citará": 0, "El Duende": 0, "Farallones de Cali": 0, "Frontino – Urrao \"Del Sol Las Alegrías": 0, "Paramillo": 0, "Tatamá": 6650.5, "area": 6650.5}, {"name": "El Litoral Del San Juán", "Cerro Plateado": 0, "Chiles Cumbal": 0, "Citará": 0, "El Duende": 2665.1, "Farallones de Cali": 0, "Frontino – Urrao \"Del Sol Las Alegrías": 0, "Paramillo": 0, "Tatamá": 0, "area": 2665.1}, {"name": "El Carmen", "Cerro Plateado": 0, "Chiles Cumbal": 0, "Citará": 1745.1, "El Duende": 0, "Farallones de Cali": 0, "Frontino – Urrao \"Del Sol Las Alegrías": 856.0, "Paramillo": 0, "Tatamá": 0, "area": 2601.1}, {"name": "Bagadó", "Cerro Plateado": 0, "Chiles Cumbal": 0, "Citará": 2147.2, "El Duende": 0, "Farallones de Cali": 0, "Frontino – Urrao \"Del Sol Las Alegrías": 0, "Paramillo": 0, "Tatamá": 0, "area": 2147.2}, {"name": "Tadó", "Cerro Plateado": 0, "Chiles Cumbal": 0, "Citará": 0, "El Duende": 0, "Farallones de Cali": 0, "Frontino – Urrao \"Del Sol Las Alegrías": 0, "Paramillo": 0, "Tatamá": 909.7, "area": 909.7}], "valle": [{"name": "Buenaventura", "Cerro Plateado": 0, "Chiles Cumbal": 0, "Citará": 0, "El Duende": 0, "Farallones de Cali": 1820.5, "Frontino – Urrao \"Del Sol Las Alegrías": 0, "Paramillo": 0, "Tatamá": 0, "area": 1820.5}, {"name": "Calima", "Cerro Plateado": 0, "Chiles Cumbal": 0, "Citará": 0, "El Duende": 1064.4, "Farallones de Cali": 0, "Frontino – Urrao \"Del Sol Las Alegrías": 0, "Paramillo": 0, "Tatamá": 0, "area": 1064.4}, {"name": "Bolívar", "Cerro Plateado": 0, "Chiles Cumbal": 0, "Citará": 0, "El Duende": 180.7, "Farallones de Cali": 0, "Frontino – Urrao \"Del Sol Las Alegrías": 0, "Paramillo": 0, "Tatamá": 0, "area": 180.7}, {"name": "Trujillo", "Cerro Plateado": 0, "Chiles Cumbal": 0, "Citará": 0, "El Duende": 41.8, "Farallones de Cali": 0, "Frontino – Urrao \"Del Sol Las Alegrías": 0, "Paramillo": 0, "Tatamá": 0, "area": 41.8}], "antioquia": [{"name": "Urrao", "Cerro Plateado": 0, "Chiles Cumbal": 0, "Citará": 0, "El Duende": 0, "Farallones de Cali": 0, "Frontino – Urrao \"Del Sol Las Alegrías": 9233.7, "Paramillo": 0, "Tatamá": 0, "area": 9233.7}, {"name": "Dabeiba", "Cerro Plateado": 0, "Chiles Cumbal": 0, "Citará": 0, "El Duende": 0, "Farallones de Cali": 0, "Frontino – Urrao \"Del Sol Las Alegrías": 0, "Paramillo": 2626.6, "Tatamá": 0, "area": 2626.6}, {"name": "Abriaquí", "Cerro Plateado": 0, "Chiles Cumbal": 0, "Citará": 0, "El Duende": 0, "Farallones de Cali": 0, "Frontino – Urrao \"Del Sol Las Alegrías": 1619.9, "Paramillo": 0, "Tatamá": 0, "area": 1619.9}, {"name": "Ituango", "Cerro Plateado": 0, "Chiles Cumbal": 0, "Citará": 0, "El Duende": 0, "Farallones de Cali": 0, "Frontino – Urrao \"Del Sol Las Alegrías": 0, "Paramillo": 1585.5, "Tatamá": 0, "area": 1585.5}, {"name": "Frontino", "Cerro Plateado": 0, "Chiles Cumbal": 0, "Citará": 0, "El Duende": 0, "Farallones de Cali": 0, "Frontino – Urrao \"Del Sol Las Alegrías": 588.5, "Paramillo": 0, "Tatamá": 0, "area": 588.5}, {"name": "Cañasgordas", "Cerro Plateado": 0, "Chiles Cumbal": 0, "Citará": 0, "El Duende": 0, "Farallones de Cali": 0, "Frontino – Urrao \"Del Sol Las Alegrías": 85.9, "Paramillo": 0, "Tatamá": 0, "area": 85.9}, {"name": "Mutatá", "Cerro Plateado": 0, "Chiles Cumbal": 0, "Citará": 0, "El Duende": 0, "Farallones de Cali": 0, "Frontino – Urrao \"Del Sol Las Alegrías": 0, "Paramillo": 44.7, "Tatamá": 0, "area": 44.7}]}
    },
    precipitacion:{label:"Precipitación media anual (mm)",ip:true,deptos:[{id:"choco",name:"Chocó",municipios:31,area:9480,pct:0},{id:"narino",name:"Nariño",municipios:22,area:4200,pct:0},{id:"antioquia",name:"Antioquia",municipios:16,area:3800,pct:0},{id:"cauca",name:"Cauca",municipios:5,area:3200,pct:0},{id:"valle",name:"Valle del Cauca",municipios:14,area:2800,pct:0},{id:"cordoba",name:"Córdoba",municipios:2,area:2200,pct:0},{id:"risaralda",name:"Risaralda",municipios:2,area:2600,pct:0}]},
    cienagas:{label:"Ciénagas",ip:false,real:true,
      deptos:[{"id": "choco", "name": "Chocó", "municipios": 10, "area": 22255.0, "pct": 66.1, "cienagas": 345}, {"id": "antioquia", "name": "Antioquia", "municipios": 5, "area": 11417.0, "pct": 33.9, "cienagas": 184}],
      munis:{"antioquia": [{"name": "Murindó", "area": 3980.2, "cienagas": 24}, {"name": "Turbo", "area": 3175.2, "cienagas": 31}, {"name": "Vigía Del Fuerte", "area": 2969.6, "cienagas": 120}, {"name": "Necoclí", "area": 1276.4, "cienagas": 7}, {"name": "Mutatá", "area": 15.7, "cienagas": 2}], "choco": [{"name": "Carmen Del Darién", "area": 9658.8, "cienagas": 51}, {"name": "Unguía", "area": 3307.7, "cienagas": 6}, {"name": "Riosucio", "area": 2825.3, "cienagas": 43}, {"name": "Bojayá", "area": 2790.2, "cienagas": 70}, {"name": "Medio Atrato", "area": 2701.4, "cienagas": 100}, {"name": "Quibdó", "area": 917.8, "cienagas": 66}, {"name": "Belén de bajirá", "area": 32.0, "cienagas": 4}, {"name": "Nóvita", "area": 12.5, "cienagas": 2}, {"name": "El Litoral Del San Juán", "area": 8.0, "cienagas": 2}, {"name": "Medio Baudó", "area": 1.3, "cienagas": 1}]}
    }
  };
  
  let charts={}, tipoActivo="todos";
  const fmt=n=>n>0?Number(n).toLocaleString("es-CO",{minimumFractionDigits:1,maximumFractionDigits:1}):"—";
  const destroyChart=id=>{ if(charts[id]){charts[id].destroy();delete charts[id];} };
  
  function getCapaData(){
    const c=document.getElementById("sel-capa").value;
    if(c==='limites') return {deptos:STATE.limites.deptos,munis:STATE.limites.munis,ip:false};
    if(c==='titulacion') return {deptos:STATE.titulacion.deptos,munis:STATE.titulacion.munis,ip:false,isTit:true};
    const d = DATA_OTHER[c];
    return {...d, munis: d.munis||null};
  }
  
  function getRows(){
    const d=getCapaData(), dep=document.getElementById("sel-depto").value;
    return dep==='todos'?d.deptos:d.deptos.filter(x=>x.id===dep);
  }
  function getMuniRows(){
    const d=getCapaData(), dep=document.getElementById("sel-depto").value, mun=document.getElementById("sel-muni").value;
    if(dep==='todos'||!d.munis||!d.munis[dep]) return null;
    const list=d.munis[dep];
    return mun!=='todos'?list.filter(m=>m.name===mun):list;
  }
  
  function onCapaChange(){
    const c=document.getElementById("sel-capa").value;
    const esTit=c==='titulacion';
    const esCuencas=c==='cuencas';
  
    // Mostrar/ocultar controles
    document.getElementById("controls-cuencas").style.display=esCuencas?'grid':'none';
    const esRunap=c==='runap';
    const runapCatGroup=document.getElementById("runap-cat-group");
    const mainCtrlBar=document.querySelector(".controls-bar:not(#controls-cuencas)");
    if(runapCatGroup){
      runapCatGroup.style.display=esRunap?'block':'none';
      if(mainCtrlBar) mainCtrlBar.style.gridTemplateColumns=esRunap?'1fr 1fr 1fr':'1fr 1fr';
      if(esRunap){
        const selCat=document.getElementById("sel-runap-cat");
        if(selCat) selCat.value='todas';
        // Córdoba no tiene áreas RUNAP — ocultarla del selector
        const selDepto=document.getElementById("sel-depto");
        Array.from(selDepto.options).forEach(o=>{
          if(o.value==='cordoba') o.style.display='none';
        });
        if(selDepto.value==='cordoba') selDepto.value='todos';
      } else {
        // Restaurar Córdoba al salir del panel RUNAP
        const selDepto=document.getElementById("sel-depto");
        Array.from(selDepto.options).forEach(o=>{
          if(o.value==='cordoba') o.style.display='';
        });
      }
    }
    // Ocultar depto/muni cuando es cuencas
    const ctrlBar=document.querySelector(".controls-bar");
    const selDeptoGroup=document.getElementById("sel-depto").closest(".ctrl-group");
    const selMuniGroup=document.getElementById("sel-muni").closest(".ctrl-group");
    selDeptoGroup.style.display=esCuencas?'none':'block';
    selMuniGroup.style.display=esCuencas?'none':'block';
  
    document.getElementById("seccion-titulacion").style.display=esTit?'block':'none';
    // Sync sidebar active state
    document.querySelectorAll('.sidebar-nav .side-item').forEach(b => b.classList.remove('active'));
    const activeBtn = document.getElementById('side-' + c);
    if(activeBtn) activeBtn.classList.add('active');
    // Update nota
    document.getElementById('nota-panel-wrap').innerHTML = NOTAS[c] || '';
    document.getElementById("metrics-tit-wrap").style.display=esTit?'block':'none';
    document.getElementById("seccion-tabla-general").style.display=(esCuencas||esTit)?'none':'block';
    const esParamos=c==='paramos';
    const paramoCatGroup=document.getElementById("paramo-cat-group");
    if(paramoCatGroup){
      paramoCatGroup.style.display=esParamos?'block':'none';
      if(mainCtrlBar) mainCtrlBar.style.gridTemplateColumns=(esRunap||esParamos)?'1fr 1fr 1fr':'1fr 1fr';
      if(esParamos){
        const selCat=document.getElementById("sel-paramo-cat");
        if(selCat) selCat.value='todos';
      }
    }
    const esCienagas=c==='cienagas';
    const esPoblacion=c==='poblacion';
    document.getElementById("seccion-poblacion").style.display=esPoblacion?'block':'none';
    if(esPoblacion){
      document.getElementById("seccion-tabla-general").style.display='none';
      document.getElementById("metrics-row").style.display='none';
      document.getElementById("seccion-graficos-generales").style.display='none';
    }
    document.getElementById("seccion-graficos-generales").style.display=(esTit||esCuencas||esCienagas||esPoblacion)?'none':'block';
    // Ocultar gráficos generales en humedales, runap y paramos
    const chBarCard = document.getElementById("ch-bar")?.closest(".chart-card");
    if(chBarCard) chBarCard.style.display = (c==='humedales'||c==='runap'||c==='paramos') ? 'none' : '';
    const chPieCard = document.getElementById("ch-pie")?.closest(".chart-card");
    if(chPieCard) chPieCard.style.display = (c==='humedales'||c==='runap'||c==='paramos') ? 'none' : '';
    const chMunisCard = document.getElementById("ch-munis")?.closest(".chart-card");
    if(chMunisCard) chMunisCard.style.display = (c==='humedales'||c==='runap'||c==='paramos') ? 'none' : '';
    document.getElementById("seccion-cuencas").style.display=esCuencas?'block':'none';
    document.getElementById("seccion-cienagas").style.display=esCienagas?'block':'none';
    if(esCienagas||esPoblacion||esCuencas) {
      document.getElementById("seccion-tabla-general").style.display='none';
      document.getElementById("metrics-row").style.display='none';
    } else {
      document.getElementById("metrics-row").style.display='';
    }
  
    // Filtrar selector de departamentos según capa
    const capaDeptos={cienagas:['todos','choco','antioquia'],manglares:['todos','narino','choco','valle','cauca','antioquia'],paramos:['todos','narino','antioquia','cauca','risaralda','choco','valle']};
    const allowed=capaDeptos[c]||null;
    const selDep=document.getElementById("sel-depto");
    Array.from(selDep.options).forEach(opt=>{opt.style.display=(!allowed||allowed.includes(opt.value))?'':'none';});
    if(allowed&&!allowed.includes(selDep.value)){selDep.value='todos'; document.getElementById("sel-muni").innerHTML='<option value="todos">Todos los municipios</option>';}
    document.getElementById("seccion-paramos").style.display=esParamos?'block':'none';
    if(esParamos) document.getElementById("seccion-tabla-general").style.display='none';
    const esHumedales=c==='humedales';
    document.getElementById("seccion-runap").style.display=esRunap?'block':'none';
    if(esRunap) document.getElementById("seccion-tabla-general").style.display='none';
    document.getElementById("seccion-humedales").style.display=esHumedales?'block':'none';
    if(esHumedales) document.getElementById("seccion-tabla-general").style.display='none';
  
    // Poblar selector de cuencas
    if(esCuencas){
      const selC=document.getElementById("sel-cuenca");
      if(selC.options.length===1){
        CUENCA_DATA.forEach(c=>{
          const o=document.createElement("option");
          o.value=c.name; o.textContent=c.name;
          selC.appendChild(o);
        });
      }
    }
    render();
  }
  
  function onDeptoChangeCuencas(){
    const dep = document.getElementById("sel-depto-cuencas").value;
    const cuenca = document.getElementById("sel-cuenca").value;
    const selMuni = document.getElementById("sel-muni-cuencas");
    const selCuenca = document.getElementById("sel-cuenca");
    const selSzh = document.getElementById("sel-szh");
    const currentSzh = selSzh.value; // preservar subcuenca actual
  
    selMuni.innerHTML = '<option value="todos">Todos los municipios</option>';
  
    if(dep !== 'todos'){
      if(cuenca === 'todas'){
        const origOnchange = selCuenca.onchange;
        selCuenca.onchange = null;
        const currentCuenca = selCuenca.value;
        selCuenca.innerHTML = '<option value="todas">Todas las cuencas</option>';
        Object.entries(CUENCAS_DEPTOS_MUNIS).forEach(([c, deptos])=>{
          if(deptos[dep]){
            const o = document.createElement("option");
            o.value = c; o.textContent = c;
            selCuenca.appendChild(o);
          }
        });
        const opts = Array.from(selCuenca.options).map(o=>o.value);
        selCuenca.value = opts.includes(currentCuenca) ? currentCuenca : 'todas';
        selCuenca.onchange = origOnchange;
        // Sin cuenca seleccionada: no poblar subcuencas
        selSzh.innerHTML = '<option value="todas">Todas las subcuencas</option>';
      } else {
        // Flujo: Cuenca → Departamento → filtrar subcuencas del depto en esa cuenca
        selSzh.innerHTML = '<option value="todas">Todas las subcuencas</option>';
        const szhsEnCuenca = SZH_DATA[cuenca]||[];
        szhsEnCuenca.filter(s=>(SZH_DEPTOS_MUNIS[s.name]||{})[dep]).forEach(s=>{
          const o = document.createElement("option"); o.value=s.name; o.textContent=s.name;
          selSzh.appendChild(o);
        });
        // Restaurar subcuenca si sigue disponible
        const szhOpts = Array.from(selSzh.options).map(o=>o.value);
        selSzh.value = szhOpts.includes(currentSzh) ? currentSzh : 'todas';
      }
  
      // Poblar municipios según depto + cuenca + szh actual
      const szhActual = selSzh.value;
      let munis = [];
      if(szhActual !== 'todas'){
        munis = Object.keys((SZH_DEPTOS_MUNIS[szhActual]||{})[dep]||{});
      } else if(cuenca !== 'todas'){
        munis = (CUENCAS_DEPTOS_MUNIS[cuenca]||{})[dep] || [];
      } else {
        munis = Object.values(CUENCAS_DEPTOS_MUNIS).reduce((acc,d)=>{
          (d[dep]||[]).forEach(m=>{ if(!acc.includes(m)) acc.push(m); });
          return acc;
        },[]);
      }
      [...munis].sort((a,b)=>a.localeCompare(b,'es')).forEach(m=>{
        const o = document.createElement("option");
        o.value = m; o.textContent = m;
        selMuni.appendChild(o);
      });
    } else {
      // Restaurar cuencas completas
      const origOnchange = selCuenca.onchange;
      selCuenca.onchange = null;
      const currentCuenca = selCuenca.value;
      selCuenca.innerHTML = '<option value="todas">Todas las cuencas</option>';
      Object.keys(CUENCAS_DEPTOS_MUNIS).forEach(c=>{
        const o = document.createElement("option"); o.value=c; o.textContent=c;
        selCuenca.appendChild(o);
      });
      selCuenca.value = Array.from(selCuenca.options).map(o=>o.value).includes(currentCuenca) ? currentCuenca : 'todas';
      selCuenca.onchange = origOnchange;
    }
  
    renderCuencasFiltro();
  }
  
  let CUENCAS_DEPTOS_MUNIS = {
    "Atrato - Darién": {Antioquia:["Abriaquí","Cañasgordas","Dabeiba","Frontino","Ituango","Murindó","Mutatá","Turbo","Uramita","Urrao","Vigía Del Fuerte"],Chocó:["Acandí","Alto Baudó","Atrato (Yuto)","Bagadó","Bahía Solano","Belén de bajirá","Bojayá","Carmen Del Darién","Cértegui","El Cantón Del San Pablo","El Carmen","Istmina","Juradó","Lloró","Medio Atrato","Medio Baudó","Quibdó","Rio Quito","Riosucio","Tadó","Unguía","Unión Panamericana"],Risaralda:["Mistrató","Pueblo Rico"]},
    "Bajo Magdalena- Cauca -San Jorge": {Antioquia:["Ituango"],Córdoba:["Tierralta"]},
    "Baudó - Directos Pacifico": {Chocó:["Alto Baudó","Bahía Solano","Bajo Baudó","Bojayá","El Cantón Del San Pablo","El Litoral Del San Juán","Istmina","Medio Baudó","Nuquí","Quibdó","Rio Quito"]},
    "Caribe - Litoral": {Antioquia:["Apartadó","Carepa","Chigorodó","Ituango","Mutatá","Necoclí","San Pedro De Urabá","Turbo"],Chocó:["Belén de bajirá"],Córdoba:["Tierralta","Valencia"]},
    "Cauca": {Antioquia:["Abriaquí","Cañasgordas","Dabeiba","Ituango","Uramita","Urrao"],Cauca:["El Tambo","López"],Chocó:["Bagadó","El Carmen","El Litoral Del San Juán","San José Del Palmar"],Risaralda:["Mistrató","Pueblo Rico"],'Valle del cauca':["Argelia","Bolívar","Buenaventura","Calima","Dagua","El Cairo","El Dovio","La Cumbre","La Unión","Roldanillo","Trujillo","Versalles","Vijes","Yotoco"]},
    "Mira": {Narño:["Barbacoas","Cumbal","Mallama","Ricaurte","Roberto Payán","Santa Cruz","Sapuyes","Tumaco"]},
    "Pacífico - Directos": {Chocó:["Alto Baudó","Bahía Solano","Bajo Baudó","Bojayá","Carmen Del Darién","Juradó","Medio Baudó","Nuquí","Riosucio"]},
    "Patía": {Cauca:["Argelia","El Tambo"],Narño:["Barbacoas","Cumbal","Cumbitara","El Charco","El Rosario","Francisco Pizarro","La Llanada","La Tola","Leiva","Los Andes","Magüí","Mallama","Mosquera","Olaya Herrera","Policarpa","Ricaurte","Roberto Payán","Samaniego","Santa Bárbara","Santa Cruz","Sapuyes","Tumaco"]},
    "San Juán": {Chocó:["Bagadó","Bajo Baudó","Condoto","Cértegui","El Litoral Del San Juán","Istmina","Medio Baudó","Medio San Juan","Nóvita","Rio Iró","San José Del Palmar","Sipí","Tadó","Unión Panamericana"],Risaralda:["Mistrató","Pueblo Rico"],'Valle del cauca':["Argelia","Bolívar","Buenaventura","Calima","Dagua","El Cairo","El Dovio","La Cumbre","La Unión","Restrepo","Roldanillo","Trujillo","Versalles","Yotoco"]},
    "Sinú": {Antioquia:["Apartadó","Carepa","Chigorodó","Dabeiba","Ituango","Mutatá","San Pedro De Urabá","Turbo"],Córdoba:["Tierralta","Valencia"]},
    "Tapaje - Dagua - Directos": {Cauca:["Argelia","El Tambo","Guapi","López","Timbiquí"],Narño:["El Charco","El Rosario","La Tola","Leiva","Magüí","Santa Bárbara"],'Valle del cauca':["Buenaventura","Calima","Dagua","La Cumbre","Restrepo","Vijes","Yotoco"]}
  };
  
  let SZH_DEPTOS_MUNIS = {"Alto Atrato":{"Antioquia":{"Urrao":26.5},"Chocó":{"Cértegui":3753.3,"Bagadó":123.8,"Atrato (Yuto)":79.0,"Lloró":76553.2,"El Carmen":82698.7,"Quibdó":1900.2}},"Alto San Jorge":{"Antioquia":{"Ituango":31.8},"Córdoba":{"Tierralta":147.0}},"Alto Sinú - Urrá":{"Antioquia":{"Dabeiba":87.5,"Mutatá":1746.6,"Ituango":81568.2,"Chigorodó":53.1,"Carepa":17.0,"Apartadó":62.6,"Turbo":30.7,"San Pedro De Urabá":74.5},"Córdoba":{"Tierralta":364474.8,"Valencia":12688.1}},"Dagua - Buenaventura - Bahia Málaga":{"Valle del cauca":{"Vijes":6590.7,"La Cumbre":25406.3,"Restrepo":13639.0,"Dagua":65336.9,"Calima":108.5,"Buenaventura":80492.8,"Yotoco":2231.2}},"Directos Atrato entre ríos Bebaramá y Murrí (md)":{"Antioquia":{"Urrao":46873.6,"Vigía Del Fuerte":108827.8},"Chocó":{"Medio Atrato":3904.2,"Quibdó":81.2,"Bojayá":74.7}},"Directos Atrato entre ríos Quito y Bojayá (mi)":{"Antioquia":{"Vigía Del Fuerte":158.8},"Chocó":{"Rio Quito":477.9,"Alto Baudó":42.8,"Medio Atrato":74203.6,"Quibdó":169778.7,"Bojayá":64385.4}},"Directos Bajo Atrato entre río Sucio y desembocadura":{"Antioquia":{"Mutatá":295.0,"Turbo":98359.9},"Chocó":{"Riosucio":19926.7,"Unguía":11983.9,"Belén de bajirá":78485.9}},"Directos Pacifico Frontera Panamá":{"Chocó":{"Medio Baudó":6511.8,"Bajo Baudó":125927.2,"Nuquí":69475.7,"Alto Baudó":507.4,"Bahía Solano":88424.3,"Bojayá":372.0,"Carmen Del Darién":331.8,"Juradó":129043.7,"Riosucio":3861.1}},"Directos Río Cauca entre Río San Juan y Pto Valdia":{"Antioquia":{"Urrao":403.4,"Abriaquí":36.9,"Cañasgordas":151.6,"Uramita":3.9,"Dabeiba":42.3,"Ituango":7.1}},"Medio Sinú":{"Antioquia":{"San Pedro De Urabá":24.9},"Córdoba":{"Tierralta":25073.8,"Valencia":21226.8}},"Rio Salado y otros directos Cauca":{"Cauca":{"El Tambo":37.5,"López":41.4}},"Rios Arroyohondo - Yumbo - Mulalo - Vijes - Yotoco":{"Valle del cauca":{"Vijes":55.2,"La Cumbre":132.2,"Calima":183.1,"Yotoco":73.0}},"Rios Pescador - RUT - Chanco - Catarina y Cañaveral":{"Chocó":{"San José Del Palmar":107.2},"Valle del cauca":{"Argelia":97.3,"El Cairo":21.3,"Trujillo":10.1,"Bolívar":3660.1,"Roldanillo":1601.7,"La Unión":14.7,"El Dovio":2.8,"Versalles":39.4}},"Río Anchicayá":{"Valle del cauca":{"Dagua":26306.9,"Buenaventura":100481.5}},"Río Andagueda":{"Chocó":{"Tadó":50.4,"Cértegui":8344.5,"Bagadó":80404.0,"Lloró":2298.7,"El Carmen":11.0},"Risaralda":{"Pueblo Rico":33.5,"Mistrató":32.0}},"Río Baudó":{"Chocó":{"Istmina":330.9,"Medio Baudó":130291.9,"El Cantón Del San Pablo":6455.7,"Bajo Baudó":61123.5,"Rio Quito":249.0,"Nuquí":982.7,"Alto Baudó":203819.6,"Quibdó":391.4,"Bahía Solano":48.3,"Bojayá":269.2}},"Río Bebaramá y otros Directos Atrato (md)":{"Antioquia":{"Urrao":161.0,"Vigía Del Fuerte":102.6},"Chocó":{"Lloró":136.2,"El Carmen":70.2,"Medio Atrato":103267.1,"Quibdó":156544.1}},"Río Bojayá":{"Antioquia":{"Vigía Del Fuerte":4.7},"Chocó":{"Alto Baudó":56.6,"Quibdó":221.3,"Bahía Solano":392.6,"Bojayá":181685.1}},"Río Cabi y otros Directos Atrato (md)":{"Chocó":{"Rio Quito":27.0,"Atrato (Yuto)":24009.3,"Lloró":2385.7,"Quibdó":20753.2}},"Río Cajón":{"Chocó":{"Sipí":466.7,"Nóvita":62193.7,"Medio San Juan":10936.2}},"Río Cali":{"Valle del cauca":{"La Cumbre":0.7,"Dagua":17.6,"Buenaventura":10.7}},"Río Capoma y otros directos al San Juan":{"Chocó":{"El Litoral Del San Juán":149698.3,"Sipí":1308.4,"Medio San Juan":22939.4,"Istmina":68968.7},"Valle del cauca":{"Calima":7.2,"Bolívar":38.7}},"Río Chagüí":{"Narño":{"Tumaco":52648.6,"Roberto Payán":1944.3}},"Río Docampadó y Directos Pacífico":{"Chocó":{"El Litoral Del San Juán":30358.9,"Istmina":1534.6,"Medio Baudó":117.2,"Bajo Baudó":160508.2}},"Río Frío":{"Chocó":{"El Litoral Del San Juán":37.6},"Valle del cauca":{"Calima":229.4,"Trujillo":15.2,"Bolívar":4.3}},"Río Guapi":{"Cauca":{"Argelia":24.0,"Guapi":253742.2,"Timbiquí":8644.4},"Narño":{"Santa Bárbara":919.3,"El Charco":123.5}},"Río Guáitara":{"Narño":{"Cumbal":109.9,"Sapuyes":230.1,"Mallama":241.1,"Santa Cruz":49.2,"Samaniego":10.7,"La Llanada":1.6}},"Río Iscuandé":{"Cauca":{"Argelia":9.5,"Guapi":678.4},"Narño":{"El Rosario":176.2,"Magüí":5277.1,"Leiva":0.5,"Santa Bárbara":109471.3,"El Charco":115781.6}},"Río León":{"Antioquia":{"Mutatá":45340.6,"Ituango":1.9,"Chigorodó":72145.0,"Carepa":38680.2,"Apartadó":36865.8,"Turbo":46745.2},"Chocó":{"Belén de bajirá":121.9},"Córdoba":{"Tierralta":409.5}},"Río Mira":{"Narño":{"Cumbal":39677.3,"Sapuyes":955.6,"Mallama":37347.6,"Santa Cruz":41.9,"Ricaurte":62795.3,"Barbacoas":97851.6,"Tumaco":163817.6}},"Río Mulatos y otros directos al Caribe":{"Antioquia":{"Carepa":46.4,"Apartadó":16608.0,"Turbo":142707.0,"San Pedro De Urabá":427.7,"Necoclí":105912.9},"Córdoba":{"Tierralta":85.4,"Valencia":56.8}},"Río Munguidó":{"Chocó":{"El Litoral Del San Juán":84783.2},"Valle del cauca":{"Calima":97.6,"Buenaventura":119.9}},"Río Murindó - Directos al Atrato":{"Antioquia":{"Vigía Del Fuerte":23457.4,"Frontino":2.1,"Murindó":126390.6,"Dabeiba":417.9},"Chocó":{"Bojayá":99.9,"Carmen Del Darién":109715.8,"Riosucio":0.0,"Belén de bajirá":14549.6}},"Río Murrí":{"Antioquia":{"Urrao":208804.4,"Abriaquí":30.0,"Vigía Del Fuerte":33646.2,"Frontino":101918.0,"Murindó":196.1,"Dabeiba":1511.7},"Chocó":{"El Carmen":17.8,"Quibdó":35.9,"Bojayá":3.3}},"Río Napipí - Río Opogadó":{"Antioquia":{"Vigía Del Fuerte":71.5},"Chocó":{"Bahía Solano":165.8,"Bojayá":113117.1,"Carmen Del Darién":4058.0}},"Río Naya - Yurumanguí":{"Cauca":{"López":138247.8},"Valle del cauca":{"Buenaventura":126644.6}},"Río Patia Alto":{"Cauca":{"Argelia":120.2,"El Tambo":32.9},"Narño":{"Policarpa":23.4,"El Rosario":18.0,"Leiva":19.2,"El Charco":47.1}},"Río Patia Bajo":{"Narño":{"Tumaco":38423.1,"Magüí":27331.7,"Roberto Payán":110635.8,"Francisco Pizarro":52608.3,"Mosquera":76930.8,"Olaya Herrera":100466.7,"La Tola":40244.8,"El Charco":20573.1}},"Río Patia Medio":{"Narño":{"La Llanada":14.6,"Barbacoas":358.0,"Los Andes":7470.1,"Policarpa":34421.8,"Cumbitara":35424.3,"El Rosario":36480.1,"Magüí":95407.5,"Leiva":10059.0,"Roberto Payán":640.0,"Santa Bárbara":5.7,"El Charco":13652.7}},"Río Perancho":{"Chocó":{"Riosucio":110275.7,"Belén de bajirá":18.4}},"Río Quito":{"Chocó":{"Istmina":16971.0,"Medio Baudó":53.0,"Unión Panamericana":13963.1,"Tadó":62.9,"Cértegui":29516.6,"El Cantón Del San Pablo":31613.7,"Bagadó":6.0,"Rio Quito":69182.5,"Atrato (Yuto)":18085.6,"Lloró":2938.5,"Alto Baudó":761.5,"Quibdó":1159.7}},"Río Risaralda":{"Chocó":{"San José Del Palmar":20.5},"Risaralda":{"Pueblo Rico":74.4,"Mistrató":78.7}},"Río Rosario":{"Narño":{"Tumaco":85569.0}},"Río Saija":{"Cauca":{"Argelia":4.3,"El Tambo":70.8,"Timbiquí":109897.5,"López":140.1}},"Río Salaquí  y otros directos Bajo Atrato":{"Antioquia":{"Vigía Del Fuerte":4.1},"Chocó":{"Bahía Solano":575.6,"Bojayá":3311.2,"Carmen Del Darién":158996.8,"Juradó":761.6,"Riosucio":419311.3,"Belén de bajirá":66.3}},"Río San Juan":{"Antioquia":{"Turbo":782.0,"San Pedro De Urabá":14732.7},"Córdoba":{"Valencia":80.0}},"Río San Juan (Cauca)":{"Antioquia":{"Urrao":59.8},"Chocó":{"Bagadó":30.0,"El Carmen":231.6},"Risaralda":{"Mistrató":28.7}},"Río San Juan (Frontera Ecuador)":{"Narño":{"Cumbal":26677.2,"Ricaurte":7252.0,"Barbacoas":6501.0,"Tumaco":8.0}},"Río San Juan Alto":{"Chocó":{"Medio San Juan":591.6,"San José Del Palmar":118.0,"Condoto":41.7,"Rio Iró":6669.7,"Istmina":11659.6,"Unión Panamericana":3820.7,"Tadó":71327.2,"Cértegui":737.0,"Bagadó":193.0},"Risaralda":{"Pueblo Rico":61248.7,"Mistrató":47326.6}},"Río San Juan Medio":{"Chocó":{"Medio San Juan":10466.9,"Istmina":82742.5,"Medio Baudó":320.4,"Bajo Baudó":579.1}},"Río San Juan del Micay":{"Cauca":{"Argelia":77474.9,"Guapi":52.8,"El Tambo":160182.2,"Timbiquí":10455.4,"López":198520.9},"Narño":{"El Charco":139.2}},"Río Sipí":{"Chocó":{"El Litoral Del San Juán":66.6,"Sipí":155943.7,"Nóvita":381.7,"Medio San Juan":1302.6,"San José Del Palmar":180.6,"Istmina":89.7},"Valle del cauca":{"Trujillo":4791.7,"Bolívar":57704.9,"Roldanillo":6509.1,"La Unión":827.9,"El Dovio":23600.1,"Versalles":20024.3,"Argelia":8983.3,"El Cairo":21350.4}},"Río Sucio":{"Antioquia":{"Frontino":36525.6,"Murindó":97.3,"Dabeiba":193707.6,"Mutatá":60144.3,"Ituango":719.7,"Urrao":56.2,"Abriaquí":29630.5,"Cañasgordas":36332.3,"Uramita":26589.8},"Chocó":{"Carmen Del Darién":45166.4,"Riosucio":36234.8,"Belén de bajirá":78693.9}},"Río Tamaná y otros Directos San Juan":{"Chocó":{"Sipí":26.6,"Nóvita":31992.2,"Medio San Juan":20140.8,"San José Del Palmar":157826.1,"Condoto":46746.9,"Rio Iró":25851.9,"Istmina":268.8,"Tadó":59.1},"Risaralda":{"Pueblo Rico":23.7},"Valle del cauca":{"El Cairo":52.0}},"Río Tanela y otros Directos al Atrato":{"Antioquia":{"Turbo":8.9},"Chocó":{"Unguía":103864.9,"Acandí":10895.2}},"Río Tapaje":{"Narño":{"Magüí":48486.6,"Santa Bárbara":12216.2,"La Tola":1408.4,"El Charco":99052.6}},"Río Telembí":{"Narño":{"Mallama":19392.6,"Santa Cruz":43367.2,"Ricaurte":35596.4,"Samaniego":44280.9,"La Llanada":20488.5,"Barbacoas":168879.8,"Los Andes":75831.2,"Cumbitara":130.8,"Tumaco":19008.4,"Magüí":4558.3,"Roberto Payán":32783.8}},"Río Timba":{"Cauca":{"López":92.5},"Valle del cauca":{"Buenaventura":36.8}},"Río Timbiquí":{"Cauca":{"Argelia":12.6,"Guapi":2615.2,"Timbiquí":76981.3}},"Río Tolo y otros Directos al Caribe":{"Chocó":{"Unguía":3274.3,"Acandí":68957.6}},"Ríos Cajambre - Mayorquín - Raposo":{"Valle del cauca":{"Buenaventura":203351.0}},"Ríos Calima y  Bajo San Juan":{"Chocó":{"El Litoral Del San Juán":148670.6,"Istmina":5542.5,"Bajo Baudó":81.8},"Valle del cauca":{"Buenaventura":118437.7,"La Cumbre":15.8,"Restrepo":85.3,"Dagua":45.8,"Calima":78758.9,"Yotoco":1488.2}},"Ríos Claro y Jamundí":{"Valle del cauca":{"Buenaventura":18.5}}};
  
  let CUENCA_COUNTS={"Atrato - Darién":{deptos:3,munis:35},"Bajo Magdalena- Cauca -San Jorge":{deptos:2,munis:2},"Baudó - Directos Pacifico":{deptos:1,munis:11},"Caribe - Litoral":{deptos:3,munis:11},"Cauca":{deptos:5,munis:28},"Mira":{deptos:1,munis:8},"Pacífico - Directos":{deptos:1,munis:9},"Patía":{deptos:2,munis:24},"San Juán":{deptos:3,munis:30},"Sinú":{deptos:2,munis:10},"Tapaje - Dagua - Directos":{deptos:3,munis:18}};
  let SZH_COUNTS={"Alto Atrato":{deptos:2,munis:7},"Alto San Jorge":{deptos:2,munis:2},"Alto Sinú - Urrá":{deptos:2,munis:10},"Dagua - Buenaventura - Bahia Málaga":{deptos:1,munis:7},"Directos Atrato entre ríos Bebaramá y Murrí (md)":{deptos:2,munis:5},"Directos Atrato entre ríos Quito y Bojayá (mi)":{deptos:2,munis:6},"Directos Bajo Atrato entre río Sucio y desembocadura":{deptos:2,munis:5},"Directos Pacifico Frontera Panamá":{deptos:1,munis:9},"Directos Río Cauca entre Río San Juan y Pto Valdia":{deptos:1,munis:6},"Medio Sinú":{deptos:2,munis:3},"Rio Salado y otros directos Cauca":{deptos:1,munis:2},"Rios Arroyohondo - Yumbo - Mulalo - Vijes - Yotoco":{deptos:1,munis:4},"Rios Pescador - RUT - Chanco - Catarina y Cañaveral":{deptos:2,munis:9},"Río Anchicayá":{deptos:1,munis:2},"Río Andagueda":{deptos:2,munis:7},"Río Baudó":{deptos:1,munis:10},"Río Bebaramá y otros Directos Atrato (md)":{deptos:2,munis:6},"Río Bojayá":{deptos:2,munis:5},"Río Cabi y otros Directos Atrato (md)":{deptos:1,munis:4},"Río Cajón":{deptos:1,munis:3},"Río Cali":{deptos:1,munis:3},"Río Capoma y otros directos al San Juan":{deptos:2,munis:6},"Río Chagüí":{deptos:1,munis:2},"Río Docampadó y Directos Pacífico":{deptos:1,munis:4},"Río Frío":{deptos:2,munis:4},"Río Guapi":{deptos:2,munis:5},"Río Guáitara":{deptos:1,munis:6},"Río Iscuandé":{deptos:2,munis:7},"Río León":{deptos:3,munis:8},"Río Mira":{deptos:1,munis:7},"Río Mulatos y otros directos al Caribe":{deptos:2,munis:7},"Río Munguidó":{deptos:2,munis:3},"Río Murindó - Directos al Atrato":{deptos:2,munis:8},"Río Murrí":{deptos:2,munis:9},"Río Napipí - Río Opogadó":{deptos:2,munis:4},"Río Naya - Yurumanguí":{deptos:2,munis:2},"Río Patia Alto":{deptos:2,munis:6},"Río Patia Bajo":{deptos:1,munis:8},"Río Patia Medio":{deptos:1,munis:11},"Río Perancho":{deptos:1,munis:2},"Río Quito":{deptos:1,munis:12},"Río Risaralda":{deptos:2,munis:3},"Río Rosario":{deptos:1,munis:1},"Río Saija":{deptos:1,munis:4},"Río Salaquí  y otros directos Bajo Atrato":{deptos:2,munis:7},"Río San Juan":{deptos:2,munis:3},"Río San Juan (Cauca)":{deptos:3,munis:4},"Río San Juan (Frontera Ecuador)":{deptos:1,munis:4},"Río San Juan Alto":{deptos:2,munis:11},"Río San Juan Medio":{deptos:1,munis:4},"Río San Juan del Micay":{deptos:2,munis:6},"Río Sipí":{deptos:2,munis:14},"Río Sucio":{deptos:2,munis:12},"Río Tamaná y otros Directos San Juan":{deptos:3,munis:10},"Río Tanela y otros Directos al Atrato":{deptos:2,munis:3},"Río Tapaje":{deptos:1,munis:4},"Río Telembí":{deptos:1,munis:11},"Río Timba":{deptos:2,munis:2},"Río Timbiquí":{deptos:1,munis:3},"Río Tolo y otros Directos al Caribe":{deptos:1,munis:2},"Ríos Cajambre - Mayorquín - Raposo":{deptos:1,munis:1},"Ríos Calima y  Bajo San Juan":{deptos:2,munis:9},"Ríos Claro y Jamundí":{deptos:1,munis:1}};
  let CUENCAS_DEPTOS_AREA = {
    "Atrato - Darién": {Antioquia:1135071.9, Chocó:2635591.3, Risaralda:65.5},
    "Bajo Magdalena- Cauca -San Jorge": {Antioquia:31.8, Córdoba:147.0},
    "Baudó - Directos Pacifico": {Chocó:596480.9},
    "Caribe - Litoral": {Antioquia:520995.5, Chocó:121.9, Córdoba:631.7},
    "Cauca": {Antioquia:704.9, Cauca:171.4, Chocó:426.9, Risaralda:181.7, 'Valle del cauca':6224.2},
    "Mira": {Narño:583086.9},
    "Pacífico - Directos": {Chocó:424455.0},
    "Patía": {Cauca:153.2, Narño:1166216.4},
    "San Juán": {Chocó:1185734.1, Risaralda:108599.0, 'Valle del cauca':342938.8},
    "Sinú": {Antioquia:83665.0, Córdoba:423463.5},
    "Tapaje - Dagua - Directos": {Cauca:1037754.3, Narño:393052.6, 'Valle del cauca':650589.5}
  };
  
  const CUENCA_DEP_MUNIS={"Atrato - Darién":{"Chocó":12,"Antioquia":4},"Caribe - Litoral":{"Antioquia":3,"Córdoba":1},"Sinú":{"Antioquia":1,"Córdoba":1},"Bajo Magdalena- Cauca -San Jorge":{"Antioquia":1},"Cauca":{"Cauca":2,"Valle del cauca":6,"Chocó":1,"Risaralda":1,"Antioquia":2},"Mira":{"Narño":3},"Patía":{"Narño":5},"Tapaje - Dagua - Directos":{"Narño":2,"Cauca":2,"Valle del cauca":3},"San Juán":{"Chocó":2,"Valle del cauca":4},"Baudó - Directos Pacifico":{"Chocó":2},"Pacífico - Directos":{"Chocó":1}};
  
  function onMuniChangeCuencas(){
    const muni = document.getElementById("sel-muni-cuencas").value;
    const dep = document.getElementById("sel-depto-cuencas").value;
    const cuenca = document.getElementById("sel-cuenca").value;
    const szh = document.getElementById("sel-szh").value;
    const selCuenca = document.getElementById("sel-cuenca");
    const selSzh = document.getElementById("sel-szh");
  
    // Flujo: Cuenca → Subcuenca → Departamento → Municipio (preservar szh)
    if(cuenca !== 'todas' && szh !== 'todas'){
      renderCuencasFiltro();
      return;
    }
  
    // Flujo: Cuenca → Departamento → Municipio → Subcuenca
    if(cuenca !== 'todas' && dep !== 'todos' && muni !== 'todos'){
      // Filtrar subcuencas que tienen este municipio en este depto
      selSzh.innerHTML = '<option value="todas">Todas las subcuencas</option>';
      const szhsEnCuenca = SZH_DATA[cuenca]||[];
      szhsEnCuenca.forEach(s=>{
        if(((SZH_DEPTOS_MUNIS[s.name]||{})[dep]||{})[muni]){
          const o = document.createElement("option"); o.value=s.name; o.textContent=s.name;
          selSzh.appendChild(o);
        }
      });
      renderCuencasFiltro();
      return;
    }
  
    // Si ya hay cuenca o subcuenca seleccionada (otros flujos), solo renderizar
    if(szh !== 'todas'){
      renderCuencasFiltro();
      return;
    }
  
    if(muni !== 'todos' && dep !== 'todos'){
      // Flujo 3: Municipio → filtrar cuencas y subcuencas disponibles
      const origOnchange = selCuenca.onchange;
      selCuenca.onchange = null;
      const currentCuenca = selCuenca.value;
      selCuenca.innerHTML = '<option value="todas">Todas las cuencas</option>';
      Object.entries(CUENCAS_DEPTOS_MUNIS).forEach(([c, deptos])=>{
        if((deptos[dep]||[]).includes(muni)){
          const o = document.createElement("option"); o.value=c; o.textContent=c;
          selCuenca.appendChild(o);
        }
      });
      const cuencaOpts = Array.from(selCuenca.options).map(o=>o.value);
      selCuenca.value = cuencaOpts.includes(currentCuenca) ? currentCuenca : 'todas';
      selCuenca.onchange = origOnchange;
  
      // Filtrar subcuencas que tienen este municipio
      const cuencaSel = selCuenca.value;
      selSzh.innerHTML = '<option value="todas">Todas las subcuencas</option>';
      const szhsToSearch = cuencaSel !== 'todas' ? (SZH_DATA[cuencaSel]||[]).map(s=>s.name) : Object.keys(SZH_DEPTOS_MUNIS);
      szhsToSearch.forEach(szhName=>{
        if(((SZH_DEPTOS_MUNIS[szhName]||{})[dep]||{})[muni]){
          const o = document.createElement("option"); o.value=szhName; o.textContent=szhName;
          selSzh.appendChild(o);
        }
      });
    } else if(muni === 'todos'){
      // Restaurar cuencas y subcuencas según depto
      onDeptoChangeCuencas();
      return;
    }
    renderCuencasFiltro();
  }
  
  function onCuencaChange(){
    const cuenca=document.getElementById("sel-cuenca").value;
    const selDepto=document.getElementById("sel-depto-cuencas");
    const selMuni=document.getElementById("sel-muni-cuencas");
    const currentDep = selDepto.value;
    const currentMuni = selMuni.value; // preservar municipio actual
  
    // Resetear subcuencas (no el departamento ni el municipio)
    document.getElementById("sel-szh").innerHTML='<option value="todas">Todas las subcuencas</option>';
  
    // Poblar subcuencas filtradas por cuenca (y por depto/muni si hay seleccionados)
    if(cuenca!=='todas' && SZH_DATA[cuenca]){
      SZH_DATA[cuenca].forEach(s=>{
        if(currentDep!=='todos' && !(SZH_DEPTOS_MUNIS[s.name]||{})[currentDep]) return;
        if(currentMuni!=='todos' && !((SZH_DEPTOS_MUNIS[s.name]||{})[currentDep]||{})[currentMuni]) return;
        const o=document.createElement("option");
        o.value=s.name; o.textContent=s.name;
        document.getElementById("sel-szh").appendChild(o);
      });
    }
  
    // Poblar departamentos según cuenca, preservando selección
    const allDeptos = ["Antioquia","Cauca","Chocó","Córdoba","Narño","Risaralda","Valle del cauca"];
    const deptos = cuenca==='todas' ? allDeptos : Object.keys(CUENCAS_DEPTOS_MUNIS[cuenca]||{});
    selDepto.innerHTML='<option value="todos">Todos los departamentos</option>';
    deptos.sort((a,b)=>a.localeCompare(b,'es')).forEach(dep=>{
      const o=document.createElement("option");
      o.value=dep; o.textContent=dep==='Narño'?'Nariño':dep==='Valle del cauca'?'Valle del Cauca':dep;
      selDepto.appendChild(o);
    });
    const deptosOpts = Array.from(selDepto.options).map(o=>o.value);
    selDepto.value = deptosOpts.includes(currentDep) ? currentDep : 'todos';
  
    // Repoblar municipios preservando selección si sigue disponible
    selMuni.innerHTML='<option value="todos">Todos los municipios</option>';
    const depActual = selDepto.value;
    if(depActual !== 'todos'){
      let munis = cuenca !== 'todas'
        ? (CUENCAS_DEPTOS_MUNIS[cuenca]||{})[depActual] || []
        : Object.values(CUENCAS_DEPTOS_MUNIS).reduce((acc,d)=>{
            (d[depActual]||[]).forEach(m=>{ if(!acc.includes(m)) acc.push(m); });
            return acc;
          },[]);
      [...munis].sort((a,b)=>a.localeCompare(b,'es')).forEach(m=>{
        const o=document.createElement("option"); o.value=m; o.textContent=m;
        selMuni.appendChild(o);
      });
      // Restaurar municipio si sigue disponible en la nueva cuenca
      const muniOpts = Array.from(selMuni.options).map(o=>o.value);
      selMuni.value = muniOpts.includes(currentMuni) ? currentMuni : 'todos';
    }
  
    renderCuencasFiltro();
  }
  
  function renderCuencasFiltro(){
    const cuenca=document.getElementById("sel-cuenca").value;
    const szh=document.getElementById("sel-szh").value;
    const d=DATA_OTHER.cuencas;
    const depCuencaSel = document.getElementById("sel-depto-cuencas")?.value||'todos';
    const muniCuencaSel = document.getElementById("sel-muni-cuencas")?.value||'todos';
    const isFiltradoPorDepto = depCuencaSel !== 'todos';
    const isFiltradoPorMuni = muniCuencaSel !== 'todos';
  
    // Filtrar cuencas para gráficos
    const cuencasDisponibles = (d.cuencas && d.cuencas.length) ? d.cuencas : CUENCA_DATA;
    let filteredCuencas = cuenca==='todas' ? cuencasDisponibles :
      cuencasDisponibles.filter(c=>c.name===cuenca);
  
    // Calcular área total según filtro activo
    let totalArea;
    if(cuenca==='todas'){
      if(isFiltradoPorMuni && isFiltradoPorDepto){
        // Solo área del municipio en todas las subcuencas
        totalArea = Object.values(SZH_DEPTOS_MUNIS)
          .reduce((s,deps)=>s+((deps[depCuencaSel]||{})[muniCuencaSel]||0),0);
      } else if(isFiltradoPorDepto){
        // Solo área del departamento en todas las subcuencas
        totalArea = Object.values(SZH_DEPTOS_MUNIS)
          .reduce((s,deps)=>s+Object.values(deps[depCuencaSel]||{}).reduce((ss,v)=>ss+v,0),0);
      } else {
        totalArea = filteredCuencas.reduce((s,c)=>s+c.area,0);
      }
    } else if(szh!=='todas'){
      const szhItem = (SZH_DATA[cuenca]||[]).find(s=>s.name===szh);
      const szhAreaTotal = szhItem ? szhItem.area : 0;
      // Si hay municipio seleccionado, usar área específica del municipio
      if(muniCuencaSel!=='todos' && depCuencaSel!=='todos'){
        totalArea = ((SZH_DEPTOS_MUNIS[szh]||{})[depCuencaSel]||{})[muniCuencaSel] || szhAreaTotal;
      } else if(depCuencaSel!=='todos'){
        // Suma de municipios del departamento en esa subcuenca
        totalArea = Object.values((SZH_DEPTOS_MUNIS[szh]||{})[depCuencaSel]||{}).reduce((s,v)=>s+v,0) || szhAreaTotal;
      } else {
        totalArea = szhAreaTotal;
      }
    } else if(depCuencaSel!=='todos'){
      // Sin subcuenca pero con depto: suma de áreas de municipios en ese depto
      if(cuenca !== 'todas'){
        // Con cuenca seleccionada: solo subcuencas de esa cuenca
        totalArea = Object.entries(SZH_DEPTOS_MUNIS)
          .filter(([szhName])=>(SZH_DATA[cuenca]||[]).some(s=>s.name===szhName))
          .reduce((s,[szhName,deps])=>s+Object.values(deps[depCuencaSel]||{}).reduce((ss,v)=>ss+v,0),0)
          || (SZH_DATA[cuenca]||[]).reduce((s,x)=>s+x.area,0);
      } else {
        // Sin cuenca: suma de todos los municipios del depto en todas las subcuencas
        totalArea = Object.values(SZH_DEPTOS_MUNIS)
          .reduce((s,deps)=>s+Object.values(deps[depCuencaSel]||{}).reduce((ss,v)=>ss+v,0),0);
      }
    } else {
      totalArea = (SZH_DATA[cuenca]||[]).reduce((s,x)=>s+x.area,0);
    }
  
    const DEPTOS_CUENCA = {
      "Atrato - Darién":                  "Antioquia · Chocó",
      "Bajo Magdalena- Cauca -San Jorge":  "Antioquia · Córdoba",
      "Baudó - Directos Pacifico":         "Chocó",
      "Caribe - Litoral":                  "Antioquia",
      "Cauca":                             "Antioquia · Caldas · Cauca · Risaralda · Valle del Cauca",
      "Mira":                              "Nariño",
      "Pacífico - Directos":               "Chocó",
      "Patía":                             "Cauca · Nariño",
      "San Juán":                          "Chocó · Risaralda · Valle del Cauca",
      "Sinú":                              "Antioquia · Córdoba",
      "Tapaje - Dagua - Directos":         "Cauca · Nariño · Valle del Cauca"
    };
    const deptosTexto = cuenca==='todas'
      ? "Antioquia · Cauca · Chocó · Córdoba · Nariño · Risaralda · Valle del Cauca"
      : (DEPTOS_CUENCA[cuenca] || "—");
    const deptosCount = deptosTexto==='—' ? 0 : deptosTexto.split('·').length;
    const deptosSub = deptosCount + (deptosCount===1?' departamento':' departamentos') + (cuenca!=='todas'?' · '+cuenca:'');
  
    // Calcular valores de departamento y municipio seleccionados
    const depCuencaLabel = depCuencaSel==='todos'?'Todos los deptos':depCuencaSel;
    const muniCuencaLabel = muniCuencaSel==='todos'?'Todos los munis':muniCuencaSel;
  
    // Fila 1 — contenedor exclusivo del panel cuencas (5 tarjetas)
    const row1 = document.getElementById("cuencas-kpi-row1");
    if(row1){
      row1.style.gridTemplateColumns='repeat(5,1fr)';
  
      // Calcular valores KPI según filtros activos
      let kpiCuencas, kpiSubcuencas, kpiDeptos, kpiMunis, kpiSub_cuencas, kpiSub_deptos, kpiSub_munis;
  
      if(isFiltradoPorMuni){
        // Municipio seleccionado
        const cuencasConMuni = Object.entries(CUENCAS_DEPTOS_MUNIS)
          .filter(([c,d])=>(d[depCuencaSel]||[]).includes(muniCuencaSel)).length;
        const szhsConMuni = Object.entries(SZH_DEPTOS_MUNIS)
          .filter(([s,d])=>((d[depCuencaSel]||{})[muniCuencaSel]||0)>0).length;
        kpiCuencas = cuenca!=='todas' ? 1 : cuencasConMuni;
        kpiSubcuencas = szh!=='todas' ? 1 : szhsConMuni;
        kpiDeptos = 1;
        kpiMunis = 1;
        kpiSub_cuencas='en selección'; kpiSub_deptos='seleccionado'; kpiSub_munis='seleccionado';
      } else if(isFiltradoPorDepto){
        // Departamento seleccionado (sin municipio)
        const cuencasDepto = Object.entries(CUENCAS_DEPTOS_MUNIS).filter(([c,d])=>d[depCuencaSel]).map(([c])=>c);
        const cuencasEnSel = cuenca!=='todas' ? (cuencasDepto.includes(cuenca)?1:0) : cuencasDepto.length;
        const szhsDepto = Object.entries(SZH_DEPTOS_MUNIS).filter(([s,d])=>d[depCuencaSel]);
        const szhsEnSel = szh!=='todas' ? 1 : (cuenca!=='todas'
          ? szhsDepto.filter(([s])=>(SZH_DATA[cuenca]||[]).some(x=>x.name===s)).length
          : szhsDepto.length);
        // Municipios: filtrar por cuenca y subcuenca si están seleccionadas
        const munisDepto = new Set();
        if(szh!=='todas'){
          // Solo municipios del depto en esa subcuenca
          Object.keys((SZH_DEPTOS_MUNIS[szh]||{})[depCuencaSel]||{}).forEach(m=>munisDepto.add(m));
        } else if(cuenca!=='todas'){
          // Solo municipios del depto en esa cuenca
          (CUENCAS_DEPTOS_MUNIS[cuenca]||{})[depCuencaSel]?.forEach(m=>munisDepto.add(m));
        } else {
          Object.values(CUENCAS_DEPTOS_MUNIS).forEach(d=>(d[depCuencaSel]||[]).forEach(m=>munisDepto.add(m)));
        }
        kpiCuencas = cuencasEnSel;
        kpiSubcuencas = szhsEnSel;
        kpiDeptos = 1;
        kpiMunis = munisDepto.size;
        kpiSub_cuencas='en '+depCuencaSel; kpiSub_deptos='seleccionado'; kpiSub_munis='incluidos';
      } else {
        // Sin filtro de depto
        kpiCuencas = filteredCuencas.length;
        kpiSubcuencas = cuenca==='todas' ? Object.values(SZH_DATA).flat().length : szh!=='todas' ? 1 : (SZH_DATA[cuenca]||[]).length;
        kpiDeptos = szh!=='todas' ? (SZH_COUNTS[szh]?.deptos||'—') : cuenca!=='todas' ? (CUENCA_COUNTS[cuenca]?.deptos||'—') : (d.deptos ? d.deptos.length : 7);
        kpiMunis = szh!=='todas' ? (SZH_COUNTS[szh]?.munis||'—') : cuenca!=='todas' ? (CUENCA_COUNTS[cuenca]?.munis||'—') : (d.deptos ? d.deptos.reduce((s,dep)=>s+(dep.municipios||0),0) : 45);
        kpiSub_cuencas='hidrográficas'; kpiSub_deptos='en análisis'; kpiSub_munis='incluidos';
      }
  
      row1.innerHTML=`
      <div class="metric-card"><div class="mc-label">Cuencas</div><div class="mc-value">${kpiCuencas}</div><div class="mc-sub">${kpiSub_cuencas}</div></div>
      <div class="metric-card"><div class="mc-label">Subcuencas</div><div class="mc-value">${kpiSubcuencas}</div><div class="mc-sub">en selección</div></div>
      <div class="metric-card"><div class="mc-label">Departamentos</div><div class="mc-value">${kpiDeptos}</div><div class="mc-sub">${kpiSub_deptos}</div></div>
      <div class="metric-card"><div class="mc-label">Municipios</div><div class="mc-value">${kpiMunis}</div><div class="mc-sub">${kpiSub_munis}</div></div>
      <div class="metric-card"><div class="mc-label">Área total</div><div class="mc-value">${totalArea.toLocaleString("es-CO",{minimumFractionDigits:1,maximumFractionDigits:1})} Ha</div><div class="mc-sub">hectáreas</div></div>
    `;
    }
  
    // Fila 2 — Departamentos que comprende
    const row2 = document.getElementById("cuencas-kpi-row2");
    if(row2) row2.innerHTML=`
      <div class="metric-card" style="border-left:4px solid #1565C0">
        <div class="mc-label">Departamentos que comprende</div>
        <div class="mc-value" style="font-size:14px;color:#1565C0">${deptosTexto}</div>
        <div class="mc-sub">${deptosSub}</div>
      </div>
    `;
  
    // Si hay subcuenca seleccionada, mostrar datos de subcuenca
    let tableCuencas = filteredCuencas;
    let chartCuencas = filteredCuencas;
  
    if(cuenca!=='todas' && szh!=='todas'){
      const szhItem = (SZH_DATA[cuenca]||[]).filter(s=>s.name===szh);
      const tot = (SZH_DATA[cuenca]||[]).reduce((s,x)=>s+x.area,0)||1;
      tableCuencas = szhItem.map(s=>({name:s.name, area:s.area, pct:Math.round(s.area/tot*1000)/10}));
      chartCuencas = tableCuencas;
    } else if(cuenca!=='todas'){
      let szhs = SZH_DATA[cuenca]||[];
      if(isFiltradoPorDepto && isFiltradoPorMuni){
        // Filtrar subcuencas que tienen ese municipio en ese depto, usar área del municipio
        szhs = szhs.filter(s=>((SZH_DEPTOS_MUNIS[s.name]||{})[depCuencaSel]||{})[muniCuencaSel]>0);
        const tot = szhs.reduce((s,x)=>s+x.area,0)||1;
        tableCuencas = szhs.map(s=>{
          const areaM = ((SZH_DEPTOS_MUNIS[s.name]||{})[depCuencaSel]||{})[muniCuencaSel]||0;
          return {name:s.name, area:areaM, pct:Math.round(areaM/tot*1000)/10};
        });
      } else if(isFiltradoPorDepto){
        szhs = szhs.filter(s=>(SZH_DEPTOS_MUNIS[s.name]||{})[depCuencaSel]);
        const tot = szhs.reduce((s,x)=>s+x.area,0)||1;
        tableCuencas = szhs.map(s=>{
          const areaDeptoRaw = (SZH_DEPTOS_MUNIS[s.name]||{})[depCuencaSel];
          const areaDepto = areaDeptoRaw ? Object.values(areaDeptoRaw).reduce((a,v)=>a+v,0) : s.area;
          return {name:s.name, area:areaDepto, pct:Math.round(areaDepto/tot*1000)/10};
        });
      } else {
        const tot = szhs.reduce((s,x)=>s+x.area,0)||1;
        tableCuencas = szhs.map(s=>({name:s.name,area:s.area,pct:Math.round(s.area/tot*1000)/10}));
      }
      chartCuencas = tableCuencas;
    }
  
    // Actualizar título del gráfico
    const barTitle = document.getElementById("cuencas-bar-title");
    if(barTitle) barTitle.textContent = cuenca!=='todas' ? "Área por subcuenca hidrográfica (Ha)" : "Área por cuenca hidrográfica (Ha)";
  
    // Si hay departamento seleccionado y estamos en vista de todas las cuencas,
    // filtrar para mostrar solo las cuencas de ese departamento con el área de ese depto
    if(isFiltradoPorDepto && cuenca==='todas'){    const CUENCAS_DEPTOS_MAP = CUENCAS_DEPTOS_AREA;
      const deptoLabel = depCuencaSel; // ya viene como nombre: "Antioquia", "Cauca", etc.
      const cuencasDepto = chartCuencas
        .filter(c=>(CUENCAS_DEPTOS_MAP[c.name]||{})[deptoLabel]>0)
        .map(c=>{
          const areaDepto=(CUENCAS_DEPTOS_MAP[c.name]||{})[deptoLabel]||0;
          const tot=Object.values(CUENCAS_DEPTOS_MAP[c.name]||{}).reduce((s,v)=>s+v,0)||1;
          return {...c, area:areaDepto, pct:Math.round(areaDepto/tot*1000)/10, _deptoFilter:deptoLabel};
        })
        .filter(c=>c.area>0)
        .sort((a,b)=>b.area-a.area);
      chartCuencas = cuencasDepto;
      tableCuencas = cuencasDepto;
    }
  
    // Si hay municipio seleccionado y no hay cuenca, filtrar gráfico por municipio
    if(isFiltradoPorMuni && cuenca==='todas' && isFiltradoPorDepto){
      const cuencasConMuni = Object.entries(CUENCAS_DEPTOS_MUNIS)
        .filter(([c, deptos])=>(deptos[depCuencaSel]||[]).includes(muniCuencaSel))
        .map(([c])=>c);
      chartCuencas = chartCuencas.filter(c=>cuencasConMuni.includes(c.name));
      tableCuencas = chartCuencas;
    }
  
    renderCuencas({...d, cuencas:chartCuencas, deptoFilter: isFiltradoPorDepto && cuenca==='todas' ? depCuencaSel : null});
  
    // Tabla
    const tbody = document.getElementById("cuencas-tbody");
    const thCuenca = document.getElementById("th-cuenca-col");
    const thSubcuenca = document.getElementById("th-subcuenca-col");
    const thDepto2 = document.getElementById("th-depto-cuenca-col");
    const thMuni2 = document.getElementById("th-muni-cuenca-col");
    const isFiltradoPorCuenca = cuenca !== 'todas';
  
    // Controlar columnas
    if(thSubcuenca) thSubcuenca.style.display = isFiltradoPorCuenca ? '' : (isFiltradoPorDepto ? '' : 'none');
    if(thDepto2) thDepto2.style.display = (isFiltradoPorCuenca || isFiltradoPorDepto) ? '' : 'none';
    if(thMuni2) thMuni2.style.display = (isFiltradoPorCuenca || isFiltradoPorDepto) ? '' : 'none';  if(thCuenca){ thCuenca.style.width = (isFiltradoPorCuenca || isFiltradoPorDepto) ? '20%' : '40%'; }
  
    // Limpiar tbody antes de renderizar
    if(tbody) tbody.innerHTML = '';
  
    if(tbody){
      if(isFiltradoPorCuenca){
        // Modo subcuencas: Cuenca | Subcuenca | Depto | Municipio | Área | %
        const todasSZH = SZH_DATA[cuenca] || [];
        const subcuencas = szh!=='todas' ? todasSZH.filter(s=>s.name===szh) : todasSZH;
        const totalSZH = todasSZH.reduce((s,c)=>s+c.area,0)||1;
  
        // Obtener deptos/munis por subcuenca
        const getDeptos = (szhName) => Object.keys(SZH_DEPTOS_MUNIS[szhName]||{});
        const getMunis = (szhName, dep) => Object.keys((SZH_DEPTOS_MUNIS[szhName]||{})[dep]||{});
        const getMuniArea = (szhName, dep, muni) => ((SZH_DEPTOS_MUNIS[szhName]||{})[dep]||{})[muni]||0;
  
        // Expandir filas por depto/municipio si hay filtros
        let rows = [];
        // Deptos válidos para esta cuenca (para filtrar cuando no hay depto seleccionado)
        const deptosValidosCuenca = cuenca !== 'todas' ? Object.keys(CUENCAS_DEPTOS_MUNIS[cuenca]||{}) : null;
  
        subcuencas.forEach(s=>{
          const deptos = isFiltradoPorDepto ? [depCuencaSel] : getDeptos(s.name);
          if(deptos.length === 0){
            if(!isFiltradoPorDepto) rows.push({cuenca, subcuenca:s.name, depto:'—', muni:'—', area:s.area, pct:s.area/totalSZH*100});
          } else {
            deptos.forEach(dep=>{
              // Si no hay filtro de depto, excluir deptos que no pertenecen a esta cuenca
              if(!isFiltradoPorDepto && deptosValidosCuenca && !deptosValidosCuenca.includes(dep)) return;
              if(isFiltradoPorMuni){
                const muniArea = getMuniArea(s.name, dep, muniCuencaSel);
                if(muniArea > 0){
                  rows.push({cuenca, subcuenca:s.name, depto:dep==='Narño'?'Nariño':dep==='Valle del cauca'?'Valle del Cauca':dep, muni:muniCuencaSel, area:muniArea, pct:muniArea/totalSZH*100});
                }
              } else {
                const munis = getMunis(s.name, dep);
                if(munis.length === 0){
                  if(!isFiltradoPorDepto) rows.push({cuenca, subcuenca:s.name, depto:dep==='Narño'?'Nariño':dep==='Valle del cauca'?'Valle del Cauca':dep, muni:'—', area:s.area, pct:s.area/totalSZH*100});
                } else {
                  munis.forEach(m=>{
                    const muniAreaRaw = (SZH_DEPTOS_MUNIS[s.name]||{})[dep]?.[m];
                    const muniArea = muniAreaRaw !== undefined ? muniAreaRaw : s.area;
                    rows.push({cuenca, subcuenca:s.name, depto:dep==='Narño'?'Nariño':dep==='Valle del cauca'?'Valle del Cauca':dep, muni:m, area:muniArea, pct:muniArea/totalSZH*100});
                  });
                }
              }
            });
          }
        });
  
        _czModoSub=true;
        _czLastRows=rows;
        _czSortCol=null; _czSortAsc=true;
        ['cuenca','subcuenca','depto2','muni2','area','pct'].forEach(c=>{
          const u=document.getElementById('czsa-'+c+'-up'),d=document.getElementById('czsa-'+c+'-down');
          if(u)u.classList.remove('active'); if(d)d.classList.remove('active');
          const t=document.getElementById('cztip-'+c);
          if(t)t.textContent=(c==='cuenca'||c==='subcuenca'||c==='depto2'||c==='muni2')?'Clic para ordenar A→Z / Z→A':'Clic para ordenar menor→mayor / mayor→menor';
        });
        // Usar suma de filas filtradas como total (no el área bruta de las subcuencas)
        const totalFila = rows.reduce((s,r)=>s+r.area,0) || subcuencas.reduce((s,c)=>s+c.area,0);
        tbody.innerHTML = rows.map(r=>`<tr>
          <td style="font-weight:500">${r.cuenca}</td>
          <td style="font-weight:500">${r.subcuenca}</td>
          <td style="font-weight:500">${r.depto}</td>
          <td style="font-weight:500">${r.muni}</td>
          <td>${r.area.toLocaleString("es-CO",{minimumFractionDigits:1,maximumFractionDigits:1})} Ha</td>
          <td>${(r.area/totalFila*100).toFixed(1)}%</td>
        </tr>`).join("") + `<tr style="border-top:1.5px solid var(--border2);background:var(--bg)">
          <td style="font-weight:600;padding:6px 8px;text-align:center;vertical-align:middle">Total</td>
          <td style="font-weight:600;padding:6px 8px;text-align:center;vertical-align:middle">${rows.length} registros</td>
          <td style="font-weight:600;padding:6px 8px;text-align:center;vertical-align:middle"></td>
          <td style="font-weight:600;padding:6px 8px;text-align:center;vertical-align:middle"></td>
          <td style="font-weight:600;padding:6px 8px;text-align:center;vertical-align:middle">${totalFila.toLocaleString("es-CO",{minimumFractionDigits:1,maximumFractionDigits:1})} Ha</td>
          <td style="font-weight:600;padding:6px 8px;text-align:center;vertical-align:middle">100%</td>
        </tr>`;
      } else {
        // Modo cuencas: si hay depto, expandir por subcuenca/municipio
        _czModoSub = isFiltradoPorDepto;
        const totalC = tableCuencas.reduce((s,c)=>s+c.area,0)||1;
  
        if(isFiltradoPorDepto){
          // Expandir filas: Cuenca | Subcuenca | Depto | Municipio | Área | %
          let rows = [];
          tableCuencas.forEach(c=>{
            const szhs = SZH_DATA[c.name] || [];
            szhs.forEach(s=>{
              const depData = (SZH_DEPTOS_MUNIS[s.name]||{});
              const muniData = depData[depCuencaSel] || {};
              let munis = Object.keys(muniData);
              // Si hay municipio seleccionado, filtrar solo ese municipio
              if(isFiltradoPorMuni) munis = munis.filter(m=>m===muniCuencaSel);
              if(munis.length > 0){
                munis.forEach(m=>{
                  const mArea = muniData[m]||0;
                  rows.push({cuenca:c.name, subcuenca:s.name, depto:depCuencaSel==='Narño'?'Nariño':depCuencaSel==='Valle del cauca'?'Valle del Cauca':depCuencaSel, muni:m, area:mArea, pct:mArea/totalC*100});
                });
              }
            });
          });
  
          _czLastRows = rows;
          _czSortCol=null; _czSortAsc=true;
          ['cuenca','subcuenca','depto2','muni2','area','pct'].forEach(c=>{
            const u=document.getElementById('czsa-'+c+'-up'),d=document.getElementById('czsa-'+c+'-down');
            if(u)u.classList.remove('active'); if(d)d.classList.remove('active');
          });
          const totFila = rows.reduce((s,r)=>s+r.area,0)||1;
          // Recalcular pct sobre el total real de las filas
          rows.forEach(r=>r.pct=r.area/totFila*100);
          _czLastRows = rows;
          tbody.innerHTML = rows.map(r=>`<tr>
            <td style="font-weight:500">${r.cuenca}</td>
            <td style="font-weight:500">${r.subcuenca}</td>
            <td>${r.depto}</td>
            <td>${r.muni}</td>
            <td>${r.area.toLocaleString("es-CO",{minimumFractionDigits:1,maximumFractionDigits:1})} Ha</td>
            <td>${r.pct.toFixed(1)}%</td>
          </tr>`).join("") + `<tr style="border-top:1.5px solid var(--border2);background:var(--bg)">
            <td style="font-weight:600;padding:6px 8px;text-align:center">Total</td>
            <td style="font-weight:600;padding:6px 8px;text-align:center">${rows.length} registros</td>
            <td style="padding:6px 8px"></td>
            <td style="padding:6px 8px"></td>
            <td style="font-weight:600;padding:6px 8px;text-align:center">${totFila.toLocaleString("es-CO",{minimumFractionDigits:1,maximumFractionDigits:1})} Ha</td>
            <td style="font-weight:600;padding:6px 8px;text-align:center">100%</td>
          </tr>`;
        } else {
          // Sin filtro de depto: solo Cuenca | Área | %
          _czLastRows=tableCuencas.map(c=>({cuenca:c.name,area:c.area,pct:c.area/totalC*100}));
          _czSortCol=null; _czSortAsc=true;
          ['cuenca','subcuenca','area','pct'].forEach(c=>{
            const u=document.getElementById('czsa-'+c+'-up'),d=document.getElementById('czsa-'+c+'-down');
            if(u)u.classList.remove('active'); if(d)d.classList.remove('active');
            const t=document.getElementById('cztip-'+c);
            if(t)t.textContent=(c==='cuenca'||c==='subcuenca')?'Clic para ordenar A→Z / Z→A':'Clic para ordenar menor→mayor / mayor→menor';
          });
          tbody.innerHTML = tableCuencas.map(c=>`<tr>
            <td style="font-weight:500">${c.name}</td>
            <td>${c.area.toLocaleString("es-CO",{minimumFractionDigits:1,maximumFractionDigits:1})} Ha</td>
            <td>${(c.area/totalC*100).toFixed(1)}%</td>
          </tr>`).join("") + `<tr style="border-top:1.5px solid var(--border2);background:var(--bg)">
            <td style="font-weight:600;padding:6px 8px;text-align:center">Total (${tableCuencas.length} registros)</td>
            <td style="font-weight:600;padding:6px 8px;text-align:center">${totalC.toLocaleString("es-CO",{minimumFractionDigits:1,maximumFractionDigits:1})} Ha</td>
            <td style="font-weight:600;padding:6px 8px;text-align:center">100%</td>
          </tr>`;
        }
      }
    }
  }
  
  function onRunapCatChange(){
    const catSel = document.getElementById("sel-runap-cat").value;
    const depSel = document.getElementById("sel-depto").value;
    const muniSel = document.getElementById("sel-muni").value;
    const selDepto = document.getElementById("sel-depto");
    const selMuni = document.getElementById("sel-muni");
    const currentMuni = selMuni.value; // preservar municipio actual
  
    // Reiniciar municipio
    selMuni.innerHTML='<option value="todos">Todos los municipios</option>';
  
    // Filtrar departamentos según categoría
    const deptosTodos = ['antioquia','cauca','choco','cordoba','narino','risaralda','valle'];
    const deptoNombres = {antioquia:'Antioquia',cauca:'Cauca',choco:'Chocó',cordoba:'Córdoba',narino:'Nariño',risaralda:'Risaralda',valle:'Valle del Cauca'};
    const DEPTOS_IDS = {Antioquia:'antioquia',Chocó:'choco','Valle del Cauca':'valle',Nariño:'narino',Cauca:'cauca',Risaralda:'risaralda',Córdoba:'cordoba'};
  
    let deptosConCat = deptosTodos;
    if(catSel !== 'todas'){
      const cat = RUNAP_DATA.categorias.find(c=>c.nombre===catSel);
      if(cat){
        deptosConCat = RUNAP_DATA.deptos
          .filter((_,i)=>(cat.datos[i]||0)>0)
          .map(d=>DEPTOS_IDS[d])
          .filter(Boolean);
      }
    }
  
    const currentDepto = selDepto.value;
    // Desconectar temporalmente el onchange para evitar que se dispare al reconstruir el select
    const origOnchange = selDepto.onchange;
    selDepto.onchange = null;
    selDepto.innerHTML='<option value="todos">Todos los departamentos</option>';
    deptosTodos.forEach(id=>{
      if(deptosConCat.includes(id)){
        const o=document.createElement("option");
        o.value=id; o.textContent=deptoNombres[id];
        selDepto.appendChild(o);
      }
    });
    if(!deptosConCat.includes(currentDepto)) selDepto.value='todos';
    else selDepto.value=currentDepto;
    // Restaurar onchange
    selDepto.onchange = origOnchange;
  
    // Actualizar municipios según depto + categoría activa
    const dep2 = document.getElementById("sel-depto").value;
    if(dep2 !== 'todos'){
      const selMuni2 = document.getElementById("sel-muni");
      selMuni2.innerHTML='<option value="todos">Todos los municipios</option>';
      const todosMunis2 = RUNAP_MUNIS[dep2] || [];
      const munisFiltered = catSel!=='todas' ? todosMunis2.filter(m=>(m[catSel]||0)>0) : todosMunis2;
      [...munisFiltered].sort((a,b)=>a.name.localeCompare(b.name,'es')).forEach(m=>{
        const o=document.createElement("option");
        o.value=m.name; o.textContent=m.name;
        selMuni2.appendChild(o);
      });
      // Restaurar municipio si sigue disponible
      const muniOpts=Array.from(selMuni2.options).map(o=>o.value);
      if(muniOpts.includes(currentMuni)) selMuni2.value=currentMuni;
    }
  
    // Renderizar la tabla/gráficas ya con depto y municipio restaurados
    renderRunap();
  
    // Actualizar KPIs filtrados por categoría
    if(catSel !== 'todas'){
      const cat = RUNAP_DATA.categorias.find(c=>c.nombre===catSel);
      if(cat){
        const dep2 = document.getElementById("sel-depto").value;
        const muni2 = document.getElementById("sel-muni").value;
        let nD,nM,aT,mN,mP;
        if(dep2==='todos'){
          const dCat=RUNAP_DATA.deptos.filter((_,i)=>(cat.datos[i]||0)>0);
          nD=dCat.length;
          nM=dCat.reduce((s,dn)=>{const did=DEPTOS_IDS[dn];return s+(RUNAP_MUNIS[did]||[]).filter(m=>(m[cat.nombre]||0)>0).length;},0);
          aT=(typeof RUNAP_CAT_TOTALS_EXACT!=='undefined' && RUNAP_CAT_TOTALS_EXACT[cat.nombre]!==undefined) ? RUNAP_CAT_TOTALS_EXACT[cat.nombre] : cat.datos.reduce((s,v)=>s+v,0);
          let mx=0,mxD='—';
          dCat.forEach(dn=>{const idx=RUNAP_DATA.deptos.indexOf(dn);const a=cat.datos[idx]||0;if(a>mx){mx=a;mxD=dn;}});
          mN=mxD; mP=aT>0?(mx/aT*100).toFixed(1)+'% del total':'';
        } else {
          const ms=(RUNAP_MUNIS[dep2]||[]);
          const mc=muni2!=='todos'?ms.filter(m=>m.name===muni2&&(m[cat.nombre]||0)>0):ms.filter(m=>(m[cat.nombre]||0)>0);
          nD=1;nM=mc.length;aT=mc.reduce((s,m)=>s+(m[cat.nombre]||0),0);
          const my=mc.length?mc.reduce((a,b)=>(b[cat.nombre]||0)>(a[cat.nombre]||0)?b:a):{};
          mN=my.name||'—'; mP=aT>0&&my.name?((my[cat.nombre]||0)/aT*100).toFixed(1)+'% del total':'';
        }
        document.getElementById("metrics-row").innerHTML=`
          <div class="metric-card"><div class="mc-label">Departamentos</div><div class="mc-value">${nD}</div><div class="mc-sub">en análisis</div></div>
          <div class="metric-card"><div class="mc-label">Municipios</div><div class="mc-value">${nM}</div><div class="mc-sub">incluidos</div></div>
          <div class="metric-card"><div class="mc-label">Área total</div><div class="mc-value">${Number(aT).toLocaleString("es-CO",{minimumFractionDigits:1,maximumFractionDigits:1})} Ha</div><div class="mc-sub">hectáreas</div></div>
          <div class="metric-card"><div class="mc-label">Mayor extensión</div><div class="mc-value" style="font-size:16px">${mN}</div><div class="mc-sub">${mP}</div></div>
        `;
      }
    } else {
      // Restaurar KPIs generales llamando render()
      render();
    }
  }
  
  function onMuniChange(){
    const capa = document.getElementById("sel-capa").value;
    const dep = document.getElementById("sel-depto").value;
    const muni = document.getElementById("sel-muni").value;
  
    if(capa==='runap' && dep!=='todos' && muni!=='todos'){    const selCat = document.getElementById("sel-runap-cat");
      const currentCat = selCat?.value || 'todas';
      const muniData = (RUNAP_MUNIS[dep]||[]).find(m=>m.name===muni);
  
      if(selCat && muniData){
        const origOnchange = selCat.onchange;
        selCat.onchange = null;
  
        // Mostrar solo categorías que tiene este municipio
        Array.from(selCat.options).forEach(o=>{
          if(o.value==='todas'){ o.style.display=''; return; }
          const hasData = (muniData[o.value]||0) > 0;
          o.style.display = hasData ? '' : 'none';
        });
  
        // Si la categoría actual no está en este municipio, resetear
        if(currentCat!=='todas' && !(muniData[currentCat]||0>0)){
          selCat.value='todas';
        }
  
        selCat.onchange = origOnchange;
      }
    } else if(capa==='paramos' && dep!=='todos' && muni!=='todos'){
      // Flujo 3: Municipio → filtrar complejos disponibles en ese municipio
      const selCat=document.getElementById("sel-paramo-cat");
      const muniData=(PARAMOS_MUNIS[dep]||[]).find(m=>m.name===muni);
      if(selCat && muniData){
        const origOnchange=selCat.onchange;
        selCat.onchange=null;
        const currentCat=selCat.value;
        Array.from(selCat.options).forEach(o=>{
          if(o.value==='todos'){o.style.display='';return;}
          o.style.display=(muniData[o.value]||0)>0?'':'none';
        });
        if(currentCat!=='todos'&&!(muniData[currentCat]||0)>0) selCat.value='todos';
        selCat.onchange=origOnchange;
      }
    } else if(capa==='paramos' && muni==='todos'){
      // Restaurar complejos según departamento
      const selCat=document.getElementById("sel-paramo-cat");
      if(selCat){
        const origOnchange=selCat.onchange;
        selCat.onchange=null;
        const depIdx=dep==='todos'?-1:PARAMOS_DATA.deptos.indexOf({antioquia:'Antioquia',cauca:'Cauca',choco:'Chocó',narino:'Nariño',risaralda:'Risaralda',valle:'Valle del Cauca'}[dep]);
        Array.from(selCat.options).forEach(o=>{
          if(o.value==='todos'){o.style.display='';return;}
          if(dep==='todos'){o.style.display='';return;}
          const p=PARAMOS_DATA.paramos.find(pp=>pp.nombre===o.value);
          o.style.display=(p&&depIdx>=0&&(p.datos[depIdx]||0)>0)?'':'none';
        });
        selCat.onchange=origOnchange;
      }
    } else if(capa==='runap' && muni==='todos'){
      // Al volver a todos los municipios, restaurar categorías según departamento
      const selCat = document.getElementById("sel-runap-cat");
      if(selCat){
        const origOnchange = selCat.onchange;
        selCat.onchange = null;
        const depIdx = dep==='todos' ? -1 : RUNAP_DATA.deptos.indexOf(
          {antioquia:'Antioquia',choco:'Chocó',valle:'Valle del Cauca',narino:'Nariño',cauca:'Cauca',risaralda:'Risaralda',cordoba:'Córdoba'}[dep]
        );
        Array.from(selCat.options).forEach(o=>{
          if(o.value==='todas'){ o.style.display=''; return; }
          if(dep==='todos'){ o.style.display=''; return; }
          const cat=RUNAP_DATA.categorias.find(c=>c.nombre===o.value);
          o.style.display = (cat && depIdx>=0 && (cat.datos[depIdx]||0)>0) ? '' : 'none';
        });
        selCat.onchange = origOnchange;
      }
    }
  
    render();
  }
  
  function onDeptoChange(){
    const dep=document.getElementById("sel-depto").value;
    const capa=document.getElementById("sel-capa").value;
    const sel=document.getElementById("sel-muni");
    sel.innerHTML='<option value="todos">Todos los municipios</option>';
  
    // Si es RUNAP, filtrar el selector de categorías según el departamento
    if(capa==='runap'){    const selCat=document.getElementById("sel-runap-cat");
      const currentCat=selCat?.value||'todas';
      const DEPTOS_IDS={Antioquia:'antioquia',Chocó:'choco','Valle del Cauca':'valle',Nariño:'narino',Cauca:'cauca',Risaralda:'risaralda',Córdoba:'cordoba'};
  
      if(selCat){
        // Reconstruir opciones de categoría según departamento
        const depIdx = dep==='todos' ? -1 : RUNAP_DATA.deptos.indexOf(
          {antioquia:'Antioquia',choco:'Chocó',valle:'Valle del Cauca',narino:'Nariño',cauca:'Cauca',risaralda:'Risaralda',cordoba:'Córdoba'}[dep]
        );
  
        // Deshabilitar onchange temporalmente
        const origOnchange = selCat.onchange;
        selCat.onchange = null;
  
        Array.from(selCat.options).forEach(o=>{
          if(o.value==='todas'){ o.style.display=''; return; }
          if(dep==='todos'){ o.style.display=''; return; }
          const cat=RUNAP_DATA.categorias.find(c=>c.nombre===o.value);
          const hasData = cat && depIdx>=0 && (cat.datos[depIdx]||0)>0;
          o.style.display = hasData ? '' : 'none';
        });
  
        // Si la categoría actual ya no está disponible, resetear
        if(currentCat!=='todas'){
          const cat=RUNAP_DATA.categorias.find(c=>c.nombre===currentCat);
          const depIdx2 = dep==='todos' ? 0 : RUNAP_DATA.deptos.indexOf(
            {antioquia:'Antioquia',choco:'Chocó',valle:'Valle del Cauca',narino:'Nariño',cauca:'Cauca',risaralda:'Risaralda',cordoba:'Córdoba'}[dep]
          );
          const hasData = cat && (dep==='todos' || (cat.datos[depIdx2]||0)>0);
          if(!hasData) selCat.value='todas';
        }
  
        selCat.onchange = origOnchange;
      }
  
      // Filtrar municipios según categoría activa
      const catSel = selCat?.value || 'todas';
      const todosMunis = RUNAP_MUNIS[dep] || [];
      const munis = catSel!=='todas' ? todosMunis.filter(m=>(m[catSel]||0)>0) : todosMunis;
      if(dep!=='todos' && munis.length){
        const munisSorted=[...munis].sort((a,b)=>a.name.localeCompare(b.name,'es'));
        munisSorted.forEach(m=>{
          const o=document.createElement("option");
          o.value=m.name; o.textContent=m.name;
          sel.appendChild(o);
        });
      }
      render();
      return;
    }
  
    // Obtener munis según capa activa
    let munis = null;
    if(capa==='poblacion'){
      munis = POB_DATA.munis[dep] || null;
    } else if(capa==='cienagas'){
      munis = DATA_OTHER.cienagas.munis ? DATA_OTHER.cienagas.munis[dep] : null;
    } else if(capa==='paramos'){
      // Flujo 2: Departamento → filtrar complejos disponibles en ese depto
      const selCat=document.getElementById("sel-paramo-cat");
      if(selCat){
        const origOnchange=selCat.onchange;
        selCat.onchange=null;
        const currentCat=selCat.value;
        const depIdx=dep==='todos'?-1:PARAMOS_DATA.deptos.indexOf(
          {antioquia:'Antioquia',cauca:'Cauca',choco:'Chocó',narino:'Nariño',risaralda:'Risaralda',valle:'Valle del Cauca'}[dep]
        );
        Array.from(selCat.options).forEach(o=>{
          if(o.value==='todos'){o.style.display='';return;}
          if(dep==='todos'){o.style.display='';return;}
          const p=PARAMOS_DATA.paramos.find(pp=>pp.nombre===o.value);
          o.style.display=(p&&depIdx>=0&&(p.datos[depIdx]||0)>0)?'':'none';
        });
        if(currentCat!=='todos'){
          const p=PARAMOS_DATA.paramos.find(pp=>pp.nombre===currentCat);
          const depIdx2=dep==='todos'?0:PARAMOS_DATA.deptos.indexOf({antioquia:'Antioquia',cauca:'Cauca',choco:'Chocó',narino:'Nariño',risaralda:'Risaralda',valle:'Valle del Cauca'}[dep]);
          if(!p||(dep!=='todos'&&!(p.datos[depIdx2]||0)>0)) selCat.value='todos';
        }
        selCat.onchange=origOnchange;
      }
      // Filtrar municipios según complejo activo
      const catSel=document.getElementById("sel-paramo-cat")?.value||'todos';
      const todosMunis=PARAMOS_MUNIS[dep]||[];
      munis=catSel!=='todos'?todosMunis.filter(m=>(m[catSel]||0)>0):todosMunis;
    } else {
      const d=getCapaData();
      munis = d.munis ? d.munis[dep] : null;
    }
  
    if(dep!=='todos' && munis){
      const munisSorted = [...munis].sort((a,b)=>a.name.localeCompare(b.name,'es'));
      munisSorted.forEach(m=>{
        const o=document.createElement("option");
        o.value=m.name; o.textContent=m.name;
        sel.appendChild(o);
      });
    }
    render();
  }
  function setTipo(t){
    tipoActivo=t;
    ["todos","cc","ri","st"].forEach(x=>document.getElementById("btn-"+x).className="tipo-btn"+(x===t?" active-"+x:""));
    renderTitulacion(getRows());
  }
  
  function render(){
    const _capaSel = document.getElementById("sel-capa").value;
    // Si es población o ciénagas, delegar a su propio render
    if(_capaSel==='poblacion'){ renderPoblacion(); return; }
    if(_capaSel==='cienagas'){ renderCienagas(); return; }
    const _PAL = _capaSel==='manglares' ? PAL_MANGLARES : PAL;
    const d=getCapaData(), rows=getRows(), muniRows=getMuniRows(), ip=d.ip;
  
    // KPI cards: usar datos del municipio si hay uno seleccionado
    const depSel  = document.getElementById("sel-depto").value;
    const muniSel = document.getElementById("sel-muni").value;
    const isMuniSelected = muniSel !== 'todos';
    const kpiRows = (isMuniSelected && muniRows && muniRows.length) ? muniRows : rows;
  
    const _runapCatSel = _capaSel==='runap' ? (document.getElementById("sel-runap-cat")?.value||'todas') : 'todas';
    const totArea  = (_capaSel==='runap' && depSel==='todos' && _runapCatSel!=='todas' && typeof RUNAP_CAT_TOTALS_EXACT!=='undefined' && RUNAP_CAT_TOTALS_EXACT[_runapCatSel]!==undefined) ? RUNAP_CAT_TOTALS_EXACT[_runapCatSel]
      : (depSel==='todos' && d.totalExact!==undefined) ? d.totalExact : kpiRows.reduce((s,r)=>s+r.area,0);
    const totMunis = isMuniSelected ? 1 : rows.reduce((s,r)=>s+r.municipios,0);
    const maxD     = kpiRows.reduce((a,b)=>a.area>b.area?a:b, kpiRows[0]||{name:"—",pct:0,area:0});
    const numDeptos = isMuniSelected ? (depSel==='todos' ? rows.filter(r=>r.area>0).length : 1) : rows.filter(r=>r.area>0).length;
  
    let maxPct = 0;
    if(isMuniSelected && depSel!=='todos'){
      const depData = (d.munis||{})[depSel]||[];
      const depTotal = depData.reduce((s,m)=>s+m.area,0)||1;
      maxPct = totArea/depTotal*100;
    } else { maxPct = maxD.pct||0; }
  
    const barTitle = isMuniSelected
      ? "Área del municipio seleccionado (Ha)"
      : (depSel!=='todos' ? "Área por municipio (Ha)" : "Área por departamento (Ha)");
  
    document.getElementById("metrics-row").innerHTML=`
      <div class="metric-card"><div class="mc-label">Departamentos</div><div class="mc-value" id="kpi-gen-deptos">${numDeptos}</div><div class="mc-sub" id="kpi-gen-deptos-sub">en análisis</div></div>
      <div class="metric-card"><div class="mc-label">Municipios</div><div class="mc-value" id="kpi-gen-munis">${totMunis}</div><div class="mc-sub" id="kpi-gen-munis-sub">${isMuniSelected?'seleccionado':'incluidos'}</div></div>
      ${_capaSel==='titulacion'?`<div class="metric-card"><div class="mc-label">Área total de titulación colectiva</div><div class="mc-value">${Number(kpiRows.reduce((s,r)=>s+(r.cc||0),0)+kpiRows.reduce((s,r)=>s+(r.ri||0),0)).toLocaleString("es-CO",{minimumFractionDigits:1,maximumFractionDigits:1})} Ha</div><div class="mc-sub">CC + Resguardos Indígenas</div></div>`:''}
      ${_capaSel!=='titulacion'?`<div class="metric-card"><div class="mc-label">${ip?"Precip. máx.":"Área total"}</div><div class="mc-value" id="kpi-gen-area">${ip?maxD.area+" mm":totArea.toLocaleString("es-CO",{minimumFractionDigits:1,maximumFractionDigits:1})+" Ha"}</div><div class="mc-sub">${ip?maxD.name:"hectáreas"}</div></div>`:''}
      ${_capaSel==='paramos'?`<div class="metric-card" style="border-left:4px solid #4A148C"><div class="mc-label">Total páramos</div><div class="mc-value" style="color:#4A148C" id="paramos-total-count">—</div><div class="mc-sub" id="paramos-total-ha"></div></div>`:_capaSel==='titulacion'?(()=>{
        const totST=kpiRows.reduce((s,r)=>s+(r.st||0),0);
        const totTerr=kpiRows.reduce((s,r)=>s+(r.cc||0)+(r.ri||0)+(r.st||0),0)||1;
        return `<div class="metric-card"><div class="mc-label">Área sin titulación colectiva</div><div class="mc-value" style="font-size:18px;white-space:nowrap">${Number(totST).toLocaleString("es-CO",{minimumFractionDigits:1,maximumFractionDigits:1})} Ha</div><div class="mc-sub">${(totST/totTerr*100).toFixed(1)}% del área</div></div>`;
      })():`<div class="metric-card"><div class="mc-label">Mayor extensión</div><div class="mc-value" style="font-size:16px">${muniRows&&muniRows.length?muniRows.reduce((a,b)=>a.area>b.area?a:b,muniRows[0]).name:(maxD.name||"—")}</div><div class="mc-sub">${ip?"":maxPct.toFixed(1)+"% del total"}</div></div>`}
    `;
  
    const chartRows=muniRows||rows;
    const labels=chartRows.map(r=>(r.name||"").length>14?(r.name||"").substring(0,13)+"…":r.name);
    document.getElementById("ch-bar-title").textContent=ip?"Precipitación media anual (mm)":barTitle;
    document.getElementById("leg-bar").innerHTML=labels.map((l,i)=>`<span><span class="ldot" style="background:${_PAL[i%_PAL.length]}"></span>${l}</span>`).join("");
  
    destroyChart("bar");
    charts["bar"]=new Chart(document.getElementById("ch-bar"),{
      type:"bar",data:{labels,datasets:[{data:chartRows.map(r=>r.area),backgroundColor:chartRows.map((_,i)=>_PAL[i%_PAL.length]),borderRadius:5,borderSkipped:false}]},
      options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>ip?c.raw+" mm":c.raw.toLocaleString("es-CO")+" Ha"}}},
        scales:{x:{grid:{display:false},ticks:{font:{size:11},autoSkip:chartRows.length>10,maxRotation:45}},
                y:{grid:{color:"rgba(0,0,0,0.05)"},ticks:{font:{size:11},callback:v=>v>=1e6?(v/1e6).toFixed(1)+"M":v>=1000?(v/1000).toFixed(0)+"k":v}}}}
    });
  
    destroyChart("pie");
    if(!ip){
      const tot=chartRows.reduce((s,r)=>s+r.area,0)||1;
      const pcts=chartRows.filter(r=>r.area>0).map(r=>Math.round(r.area/tot*1000)/10);
      const lbls=chartRows.filter(r=>r.area>0).map((r,i)=>r.name+" "+pcts[i]+"%");
      const cols=chartRows.filter(r=>r.area>0).map((_,i)=>_PAL[i%_PAL.length]);
      document.getElementById("leg-pie").innerHTML=lbls.map((l,i)=>`<span><span class="ldot" style="background:${cols[i]};border-radius:50%"></span>${l}</span>`).join("");
      charts["pie"]=new Chart(document.getElementById("ch-pie"),{type:"doughnut",data:{labels:lbls,datasets:[{data:pcts,backgroundColor:cols,borderWidth:2,borderColor:"#fff",hoverOffset:6}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},cutout:"60%"}});
    } else document.getElementById("leg-pie").innerHTML="";
  
    destroyChart("munis");
    charts["munis"]=new Chart(document.getElementById("ch-munis"),{
      type:"bar",data:{labels,datasets:[{data:chartRows.map(r=>r.municipios||1),backgroundColor:chartRows.map((_,i)=>_PAL[i%_PAL.length]),borderRadius:5,borderSkipped:false}]},
      options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},
        scales:{x:{grid:{display:false},ticks:{font:{size:11},autoSkip:chartRows.length>10,maxRotation:45}},y:{grid:{color:"rgba(0,0,0,0.05)"},ticks:{font:{size:11}}}}}
    });
  
    if(d.isTit){
      const depSelTit=document.getElementById("sel-depto").value;
      const muniSelTit2=document.getElementById("sel-muni").value;
      if(depSelTit!=='todos' && STATE.titulacion.munis && STATE.titulacion.munis[depSelTit]){
        let titMuniRows = STATE.titulacion.munis[depSelTit];
        if(muniSelTit2!=='todos') titMuniRows = titMuniRows.filter(m=>m.name===muniSelTit2);
        renderTitulacion(rows, titMuniRows);
      } else {
        renderTitulacion(rows, null);
      }
    }
    if(document.getElementById("sel-capa").value==='cuencas'){ renderCuencasFiltro(); return; }
    if(document.getElementById("sel-capa").value==='humedales') renderHumedales();
    if(document.getElementById("sel-capa").value==='runap') renderRunap();
    if(document.getElementById("sel-capa").value==='paramos') renderParamos();
    if(document.getElementById("sel-capa").value==='cienagas') renderCienagas();
    if(document.getElementById("sel-capa").value==='poblacion') renderPoblacion();
  
    // Sobreescribir KPIs para RUNAP con filtro de categoría (después de renderRunap)
    if(_capaSel==='runap'){
      const _catSel=document.getElementById("sel-runap-cat")?.value||'todas';
      if(_catSel!=='todas'){
        const DEPTOS_IDS={Antioquia:'antioquia',Chocó:'choco','Valle del Cauca':'valle',Nariño:'narino',Cauca:'cauca',Risaralda:'risaralda',Córdoba:'cordoba'};
        const cat=RUNAP_DATA.categorias.find(c=>c.nombre===_catSel);
        if(cat){
          let nD,nM,aT,mN,mP;
          if(depSel==='todos'){
            const dCat=RUNAP_DATA.deptos.filter((_,i)=>(cat.datos[i]||0)>0);
            nD=dCat.length;
            nM=dCat.reduce((s,dn)=>{const did=DEPTOS_IDS[dn];return s+(RUNAP_MUNIS[did]||[]).filter(m=>(m[cat.nombre]||0)>0).length;},0);
            aT=cat.datos.reduce((s,v)=>s+v,0);
            let mx=0,mxD='—';
            dCat.forEach(dn=>{const idx=RUNAP_DATA.deptos.indexOf(dn);const a=cat.datos[idx]||0;if(a>mx){mx=a;mxD=dn;}});
            mN=mxD; mP=aT>0?(mx/aT*100).toFixed(1)+'% del total':'';
          } else {
            const ms=(RUNAP_MUNIS[depSel]||[]);
            const mc=muniSel!=='todos'?ms.filter(m=>m.name===muniSel&&(m[cat.nombre]||0)>0):ms.filter(m=>(m[cat.nombre]||0)>0);
            nD=1;nM=mc.length;aT=mc.reduce((s,m)=>s+(m[cat.nombre]||0),0);
            const my=mc.length?mc.reduce((a,b)=>(b[cat.nombre]||0)>(a[cat.nombre]||0)?b:a):{};
            mN=my.name||'—'; mP=aT>0&&my.name?((my[cat.nombre]||0)/aT*100).toFixed(1)+'% del total':'';
          }
          document.getElementById("metrics-row").innerHTML=`
            <div class="metric-card"><div class="mc-label">Departamentos</div><div class="mc-value">${nD}</div><div class="mc-sub">en análisis</div></div>
            <div class="metric-card"><div class="mc-label">Municipios</div><div class="mc-value">${nM}</div><div class="mc-sub">incluidos</div></div>
            <div class="metric-card"><div class="mc-label">Área total</div><div class="mc-value">${Number(aT).toLocaleString("es-CO",{minimumFractionDigits:1,maximumFractionDigits:1})} Ha</div><div class="mc-sub">hectáreas</div></div>
            <div class="metric-card"><div class="mc-label">Mayor extensión</div><div class="mc-value" style="font-size:16px">${mN}</div><div class="mc-sub">${mP}</div></div>
          `;
        }
      }
    }
  
    // Sobreescribir KPIs (Departamentos/Municipios/Área total) para Páramos con filtro de complejo activo
    if(_capaSel==='paramos'){
      const _catSelP=document.getElementById("sel-paramo-cat")?.value||'todos';
      if(_catSelP!=='todos'){
        const DEPTO_IDS_P={Antioquia:'antioquia',Cauca:'cauca',Chocó:'choco',Nariño:'narino',Risaralda:'risaralda','Valle del Cauca':'valle'};
        const paramo=PARAMOS_DATA.paramos.find(p=>p.nombre===_catSelP);
        if(paramo){
          let nDp,nMp,aTp;
          if(depSel==='todos'){
            const dCatP=PARAMOS_DATA.deptos.filter((_,i)=>(paramo.datos[i]||0)>0);
            nDp=dCatP.length;
            nMp=dCatP.reduce((s,dn)=>{const did=DEPTO_IDS_P[dn];return s+(PARAMOS_MUNIS[did]||[]).filter(m=>(m[paramo.nombre]||0)>0).length;},0);
            aTp=paramo.datos.reduce((s,v)=>s+v,0);
          } else {
            const ms=(PARAMOS_MUNIS[depSel]||[]);
            const mcP=muniSel!=='todos'?ms.filter(m=>m.name===muniSel&&(m[paramo.nombre]||0)>0):ms.filter(m=>(m[paramo.nombre]||0)>0);
            nDp=1;nMp=mcP.length;aTp=mcP.reduce((s,m)=>s+(m[paramo.nombre]||0),0);
          }
          const elD=document.getElementById("kpi-gen-deptos"), elM=document.getElementById("kpi-gen-munis"), elA=document.getElementById("kpi-gen-area");
          const elMsub=document.getElementById("kpi-gen-munis-sub");
          if(elD) elD.textContent=nDp;
          if(elM) elM.textContent=nMp;
          if(elMsub) elMsub.textContent='incluidos';
          if(elA) elA.textContent=Number(aTp).toLocaleString("es-CO",{minimumFractionDigits:1,maximumFractionDigits:1})+" Ha";
        }
      }
    }
  
    const tblRows=muniRows||rows, isMuni=!!muniRows;
    const totalAreaTbl = tblRows.reduce((s,r)=>s+r.area,0)||1;
  
    // Mostrar columna Municipio solo cuando hay departamento seleccionado
    const genDepSel = document.getElementById("sel-depto").value;
    const showGenMuniCol = genDepSel !== 'todos';
  
    // Título dinámico según capa activa
    const _capaLabel = {"limites":"", "manglares":" — manglares", "paramos":" — páramos", "precipitacion":" — precipitación"}[_capaSel] || "";
    document.getElementById("tbl-gen-title").textContent = showGenMuniCol ? "Detalle por municipio"+_capaLabel : "Detalle por departamento"+_capaLabel;
  
    // Mapa de nombre de departamento por id
    const genDeptoNames = {"choco":"Chocó","narino":"Nariño","antioquia":"Antioquia","cauca":"Cauca","valle":"Valle del Cauca","cordoba":"Córdoba","risaralda":"Risaralda"};
  
    _genLastRows = tblRows.map(r=>({
      name: showGenMuniCol?(genDeptoNames[genDepSel]||genDepSel):r.name,
      muni: showGenMuniCol?r.name:undefined,
      municipios: showGenMuniCol?undefined:r.municipios,
      area: r.area,
      pct: ip?null:(r.area/totalAreaTbl*100)
    }));
    _genSortCol=null; _genSortAsc=true;
  
    // Regenerar thead con anchos en cada <th> (mismo enfoque que Páramos)
    const colKeys=_buildGenHead(showGenMuniCol);
  
    const fmtA2=v=>v!=null&&!isNaN(v)&&v>0?v.toLocaleString("es-CO",{minimumFractionDigits:1,maximumFractionDigits:1})+" Ha":"—";
    document.getElementById("tbl-gen-body").innerHTML=tblRows.map(r=>`<tr>
      ${colKeys.map(k=>{
        if(k==='name')       return `<td style="font-weight:500">${showGenMuniCol?(genDeptoNames[genDepSel]||genDepSel):r.name}</td>`;
        if(k==='muni')       return `<td style="font-weight:500">${r.name}</td>`;
        if(k==='municipios') return `<td>${r.municipios??'—'}</td>`;
        if(k==='area')       return `<td>${ip?r.area+" mm":fmtA2(r.area)}</td>`;
        if(k==='pct')        return `<td>${ip?"—":(r.area/totalAreaTbl*100).toFixed(1)+"%"}</td>`;
        return '<td>—</td>';
      }).join('')}
    </tr>`).join("");
  
    // Fila de totales
    const tfoot = document.getElementById("tbl-gen-foot");
    if(tfoot && !ip){
      const totMunis = showGenMuniCol ? "" : tblRows.reduce((s,r)=>s+(r.municipios||0),0);
      let totArea = tblRows.reduce((s,r)=>s+(r.area||0),0);
      if(showGenMuniCol && muniSel==='todos'){
        const deptoRef = (d.deptos||[]).find(x=>x.id===genDepSel);
        if(deptoRef) totArea = deptoRef.area;
      }
      tfoot.innerHTML=`<tr style="border-top:1.5px solid var(--border2);background:var(--bg)">
        <td style="font-weight:600;padding:6px 8px;text-align:center;vertical-align:middle">Total</td>
        ${showGenMuniCol?`<td style="font-weight:600;padding:6px 8px;text-align:center;vertical-align:middle">${tblRows.length} registros</td>`:`<td style="font-weight:600;padding:6px 8px;text-align:center;vertical-align:middle">${totMunis}</td>`}
        <td style="font-weight:600;padding:6px 8px;text-align:center;vertical-align:middle">${totArea>0?totArea.toLocaleString("es-CO",{minimumFractionDigits:1,maximumFractionDigits:1})+" Ha":"—"}</td>
        <td style="font-weight:600;padding:6px 8px;text-align:center;vertical-align:middle">100%</td>
      </tr>`;
    } else if(tfoot) {
      tfoot.innerHTML='';
    }
  }
  
  function renderTitulacion(rows, muniRows){
    const visCC=tipoActivo==="todos"||tipoActivo==="cc";
    const visRI=tipoActivo==="todos"||tipoActivo==="ri";
    const visST=tipoActivo==="todos"||tipoActivo==="st";
  
    // Usar datos del municipio si está seleccionado
    const dep=document.getElementById("sel-depto").value;
    const muniSelTit=document.getElementById("sel-muni").value;
    const isMuniSelTit = muniSelTit !== 'todos';
    const isDepSelTit = dep !== 'todos';
    // Para KPIs: municipio específico > departamento > global
    const kpiRows = (isMuniSelTit && muniRows && muniRows.length) ? muniRows : rows;
    // Para gráfico de barras: si hay depto seleccionado mostrar sus municipios
    const chartBarRows = (isDepSelTit && muniRows && muniRows.length)
      ? (isMuniSelTit ? muniRows : muniRows)
      : rows;
  
    const totCC=kpiRows.reduce((s,r)=>s+(r.cc||0),0);
    const totRI=kpiRows.reduce((s,r)=>s+(r.ri||0),0);
    const totST=kpiRows.reduce((s,r)=>s+(r.st||0),0);
    const grand=totCC+totRI+totST||1;
    const pCC=Math.round(totCC/grand*1000)/10,pRI=Math.round(totRI/grand*1000)/10,pST=Math.round(totST/grand*1000)/10;
  
    const totNumCC=kpiRows.reduce((s,r)=>s+(r.num_cc||0),0);
    const totNumRI=kpiRows.reduce((s,r)=>s+(r.num_ri||0),0);
    // Total global solo cuando no hay ningún filtro activo
    const dispCC = (!isMuniSelTit && dep==='todos') ? TOTAL_CC_GLOBAL : totNumCC;
    const dispRI = (!isMuniSelTit && dep==='todos') ? TOTAL_RI_GLOBAL : totNumRI;
    document.getElementById("metrics-tit").innerHTML=`
      <div class="metric-card">
        <div class="mc-label">N° Consejos comunitarios</div>
        <div class="mc-value" style="color:#B87A10">${dispCC}</div>
        <div class="mc-sub">títulos colectivos</div>
      </div>
      <div class="metric-card">
        <div class="mc-label">Área consejos comunitarios</div>
        <div class="mc-value" style="font-size:20px;white-space:nowrap;color:#B87A10">${totCC.toLocaleString("es-CO",{minimumFractionDigits:1,maximumFractionDigits:1})} Ha</div>
        <div class="mc-sub">${pCC}% del área</div>
      </div>
      <div class="metric-card">
        <div class="mc-label">N° Resguardos indígenas</div>
        <div class="mc-value" style="color:#6B3B6E">${dispRI}</div>
        <div class="mc-sub">títulos colectivos</div>
      </div>
      <div class="metric-card">
        <div class="mc-label">Área resguardos indígenas</div>
        <div class="mc-value" style="font-size:20px;white-space:nowrap;color:#6B3B6E">${totRI.toLocaleString("es-CO",{minimumFractionDigits:1,maximumFractionDigits:1})} Ha</div>
        <div class="mc-sub">${pRI}% del área</div>
      </div>
  
    `;
  
    // Dona distribución
    if(charts["tit-dist"]) charts["tit-dist"].destroy();
    if(document.getElementById("ch-tit-dist")) charts["tit-dist"]=new Chart(document.getElementById("ch-tit-dist"),{type:"doughnut",data:{labels:["Consejos comunitarios","Resguardos indígenas","Sin titulación colectiva"],datasets:[{data:[pCC,pRI,pST],backgroundColor:["#E8A020","#9B6B9E","#A8A8A8"],borderWidth:2,borderColor:"#fff",hoverOffset:6}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{backgroundColor:"rgba(0,0,0,0.82)",titleColor:"#fff",bodyColor:"#fff",callbacks:{label:c=>` ${c.label}: ${c.raw.toFixed(1)}%`}}},cutout:"62%"}});
  
    // Actualizar tarjetas de íconos
    const fmtTit=v=>Number(v).toLocaleString("es-CO",{minimumFractionDigits:1,maximumFractionDigits:1});
    const grandTotTit=totCC+totRI+totST||1;
    const elCC=document.getElementById("tit-icon-cc-pct"); if(elCC) elCC.textContent=(totCC/grandTotTit*100).toFixed(1)+"%";
    const elCCha=document.getElementById("tit-icon-cc-ha"); if(elCCha) elCCha.textContent=fmtTit(totCC)+" Ha";
    const elRI=document.getElementById("tit-icon-ri-pct"); if(elRI) elRI.textContent=(totRI/grandTotTit*100).toFixed(1)+"%";
    const elRIha=document.getElementById("tit-icon-ri-ha"); if(elRIha) elRIha.textContent=fmtTit(totRI)+" Ha";
    const elST=document.getElementById("tit-icon-st-pct"); if(elST) elST.textContent=(totST/grandTotTit*100).toFixed(1)+"%";
    const elSTha=document.getElementById("tit-icon-st-ha"); if(elSTha) elSTha.textContent=fmtTit(totST)+" Ha";
    // Gráficas también usan chartBarRows (municipios si hay depto seleccionado)
    const labels=chartBarRows.map(r=>r.name.length>13?r.name.substring(0,12)+"…":r.name);
    const datasets=[];
    if(visCC) datasets.push({label:"Consejos comunitarios",data:chartBarRows.map(r=>r.cc||0),backgroundColor:C_CC,borderRadius:4,borderSkipped:false});
    if(visRI) datasets.push({label:"Resguardos indígenas",data:chartBarRows.map(r=>r.ri||0),backgroundColor:C_RI,borderRadius:4,borderSkipped:false});
    if(visST) datasets.push({label:"Sin titulación colectiva",data:chartBarRows.map(r=>r.st||0),backgroundColor:C_ST,borderRadius:4,borderSkipped:false});
  
    document.getElementById("leg-tit-bar").innerHTML=datasets.map(d=>`<span><span class="ldot" style="background:${d.backgroundColor}"></span>${d.label}</span>`).join("");
    destroyChart("tit-bar");
    document.getElementById("tit-bar-title").textContent = isMuniSelTit ? "Área titulada por municipio" : isDepSelTit ? "Área titulada por municipio" : "Área titulada por departamento";
    document.getElementById("tit-pie-title").textContent = isMuniSelTit ? "Porcentaje de área titulada por municipio" : isDepSelTit ? "Porcentaje de área titulada por municipio" : "Porcentaje de área titulada por departamento";
    // Ajustar alto del gráfico según número de barras
    const titBarEl = document.getElementById("ch-tit-bar");
    if(titBarEl) {
      const titBarRows = chartBarRows || rows;
      const titBarHeight = isDepSelTit
        ? Math.max(300, titBarRows.length * 22)
        : Math.max(320, titBarRows.length * 30 + 60);
      titBarEl.parentElement.style.height = titBarHeight + "px";
    }
  
    charts["tit-bar"]=new Chart(document.getElementById("ch-tit-bar"),{
      type:"bar",
      data:{labels,datasets},
      options:{
        indexAxis:"y",
        responsive:true,maintainAspectRatio:false,
        interaction:{mode:"index",axis:"y",intersect:false},
        plugins:{
          legend:{display:false},
          tooltip:{
            callbacks:{
              title: items => items[0].label,
              label: c => {
                const haVal = Number(c.raw).toLocaleString("es-CO",{minimumFractionDigits:1,maximumFractionDigits:1});
                return " "+c.dataset.label+": "+haVal+" Ha";
              },
              footer: lines => {
                const idx = lines[0].dataIndex;
                const ccRow = datasets.find(d=>d.label==="Consejos comunitarios");
                const riRow = datasets.find(d=>d.label==="Resguardos indígenas");
                const ccHa = ccRow ? (ccRow.data[idx]||0) : 0;
                const riHa = riRow ? (riRow.data[idx]||0) : 0;
                const total = ccHa + riHa;
                return "Total titulación colectiva: "+total.toLocaleString("es-CO",{minimumFractionDigits:1,maximumFractionDigits:1})+" Ha";
              }
            },
            backgroundColor:"rgba(0,0,0,0.8)",
            titleColor:"#fff",
            bodyColor:"#fff",
            footerColor:"#fff",
            titleFont:{size:13,weight:"600"},
            bodyFont:{size:12},
            footerFont:{size:13,weight:"600"},
            footerMarginTop:8,
            padding:10,
            cornerRadius:4,
            boxWidth:10,
            boxHeight:10,
            usePointStyle:false
          }
        },
        scales:{
          x:{stacked:true,grid:{color:"rgba(0,0,0,0.05)"},ticks:{font:{size:11},callback:v=>v>=1e6?(v/1e6).toFixed(1)+"M":v>=1000?(v/1000).toFixed(0)+"k":v}},
          y:{stacked:true,grid:{display:false},ticks:{font:{size:11},autoSkip:false}}
        }
      }
    });
  
    destroyChart("tit-pie");
    const pd=[],pl=[],pc=[];
    if(visCC&&totCC>0){pd.push(pCC);pl.push("Consejos comunitarios "+pCC+"%");pc.push(C_CC);}
    if(visRI&&totRI>0){pd.push(pRI);pl.push("Resguardos indígenas "+pRI+"%");pc.push(C_RI);}
    if(visST&&totST>0){pd.push(pST);pl.push("Sin titulación colectiva "+pST+"%");pc.push(C_ST);}
    // leyenda pie titulación eliminada
    charts["tit-pie"]=new Chart(document.getElementById("ch-tit-pie"),{type:"doughnut",data:{labels:pl,datasets:[{data:pd,backgroundColor:pc,borderWidth:2,borderColor:"#fff",hoverOffset:6}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},cutout:"60%"}});
  
    // Gráfico barras — Área total titulación colectiva (CC + RI)
    const tblRows = muniRows || rows;
    const grandTot=tblRows.reduce((s,r)=>s+(r.cc||0)+(r.ri||0),0)||1;
  
    // Mapear municipio → nombre de departamento para la columna Departamento
    const deptoLabelMap = {"choco":"Chocó","narino":"Nariño","antioquia":"Antioquia","cauca":"Cauca","valle":"Valle del Cauca","cordoba":"Córdoba","risaralda":"Risaralda"};
    const depSelForTbl = document.getElementById("sel-depto").value;
    const muniSelForTbl = document.getElementById("sel-muni").value;
    // Construir mapa municipio→depto recorriendo STATE.titulacion.munis
    const muniToDepto = {};
    if(STATE.titulacion.munis){
      Object.keys(STATE.titulacion.munis).forEach(depId=>{
        (STATE.titulacion.munis[depId]||[]).forEach(m=>{ muniToDepto[m.name] = deptoLabelMap[depId]||depId; });
      });
    }
  
    // Columna Municipio solo visible cuando hay un departamento seleccionado
    const showMuniCol = depSelForTbl !== 'todos';
    const showNombresCol = muniSelForTbl !== 'todos'; // Vista con nombres individuales
    document.getElementById("tit-col-depto").style.display = "";
    document.getElementById("tit-col-header").style.display = showMuniCol ? "" : "none";
  
    // Cambiar encabezados según la vista
    const thCC = document.getElementById("tit-th-cc");
    const thRI = document.getElementById("tit-th-ri");
    if(thCC) thCC.textContent = showNombresCol ? "Nombre Consejo Comunitario" : "N° Consejos Comunitarios";
    if(thRI) thRI.textContent = showNombresCol ? "Nombre Resguardo Indígena" : "N° Resguardos Indígenas";
  
    const TIT_COLS = ['depto','muni','num_cc','cc','num_ri','ri','st','tot','pct'];
    _titLastRows = tblRows.map(r=>{
      const tot=(r.cc||0)+(r.ri||0);
      const deptoLabel=muniToDepto[r.name]||(depSelForTbl!=="todos"?deptoLabelMap[depSelForTbl]||depSelForTbl:r.name);
      return {depto:deptoLabel,muni:r.name,num_cc:r.num_cc,cc:r.cc||0,num_ri:r.num_ri,ri:r.ri||0,st:r.st||0,tot,pct:tot/grandTot*100,visCC,visRI,visST,showMuniCol,cc_nombres:r.cc_nombres||[],ri_nombres:r.ri_nombres||[]};
    });
    _titSortCol=null; _titSortAsc=true;
    TIT_COLS.forEach(c=>{
      const u=document.getElementById('tsa-'+c+'-up'),d=document.getElementById('tsa-'+c+'-down');
      if(u)u.classList.remove('active'); if(d)d.classList.remove('active');
      const t=document.getElementById('ttip-'+c);
      if(t)t.textContent=(c==='depto'||c==='muni')?'Clic para ordenar A→Z / Z→A':'Clic para ordenar menor→mayor / mayor→menor';
    });
  
    // Vista con nombres individuales cuando hay municipio seleccionado
    let _titDisplayedRowCount = tblRows.length;
    if(showNombresCol && tblRows.length===1){
      const r=tblRows[0];
      const deptoLabel=muniToDepto[r.name]||(depSelForTbl!=="todos"?deptoLabelMap[depSelForTbl]||depSelForTbl:r.name);
      const ccNombres=r.cc_nombres||[];
      const riNombres=r.ri_nombres||[];
      const grandTotNom=(r.cc||0)+(r.ri||0)||1;
      const filas=[];
      if(visCC) ccNombres.forEach(cc=>{
        filas.push(`<tr>
          <td style="font-weight:500">${deptoLabel}</td>
          <td style="font-weight:500">${r.name}</td>
          <td style="font-weight:500;color:#B87A10">${cc.nombre}</td>
          <td>${cc.area>0?cc.area.toLocaleString("es-CO",{minimumFractionDigits:1,maximumFractionDigits:1})+" Ha":"—"}</td>
          <td>—</td>
          <td>—</td>
          <td>—</td>
          <td>${cc.area>0?cc.area.toLocaleString("es-CO",{minimumFractionDigits:1,maximumFractionDigits:1})+" Ha":"—"}</td>
          <td>${grandTotNom>0?(cc.area/grandTotNom*100).toFixed(1)+"%":"—"}</td>
        </tr>`);
      });
      if(visRI) riNombres.forEach(ri=>{
        filas.push(`<tr>
          <td style="font-weight:500">${deptoLabel}</td>
          <td style="font-weight:500">${r.name}</td>
          <td>—</td>
          <td>—</td>
          <td style="font-weight:500;color:#6B3B6E">${ri.nombre}</td>
          <td>${ri.area>0?ri.area.toLocaleString("es-CO",{minimumFractionDigits:1,maximumFractionDigits:1})+" Ha":"—"}</td>
          <td>—</td>
          <td>${ri.area>0?ri.area.toLocaleString("es-CO",{minimumFractionDigits:1,maximumFractionDigits:1})+" Ha":"—"}</td>
          <td>${grandTotNom>0?(ri.area/grandTotNom*100).toFixed(1)+"%":"—"}</td>
        </tr>`);
      });
      document.getElementById("tit-tbody").innerHTML=filas.join("");
      _titDisplayedRowCount = filas.length;
    } else {
    document.getElementById("tit-tbody").innerHTML=tblRows.map(r=>{
      const tot=(r.cc||0)+(r.ri||0);
      const deptoLabel = muniToDepto[r.name] || (depSelForTbl!=="todos" ? deptoLabelMap[depSelForTbl]||depSelForTbl : r.name);
      return `<tr>
        <td style="font-weight:500">${deptoLabel}</td>${showMuniCol ? `<td style="font-weight:500">${r.name}</td>` : ""}
        <td style="text-align:center">${visCC?(r.num_cc!==undefined?r.num_cc:"—"):"—"}</td>
        <td>${visCC?(fmt(r.cc||0)!=="—"?fmt(r.cc||0)+" Ha":"—"):"—"}</td>
        <td style="text-align:center">${visRI?(r.num_ri!==undefined?r.num_ri:"—"):"—"}</td>
        <td>${visRI?(fmt(r.ri||0)!=="—"?fmt(r.ri||0)+" Ha":"—"):"—"}</td>
        <td>${visST?(fmt(r.st||0)!=="—"?fmt(r.st||0)+" Ha":"—"):"—"}</td>
        <td style="white-space:nowrap">${fmt(tot)!=="—"?fmt(tot)+" Ha":"—"}</td>
        <td>${(tot/grandTot*100).toFixed(1)}%</td>
      </tr>`;
    }).join("");
    } // fin else vista agrupada
    const tfoot = document.getElementById("tit-tfoot");
    if(tfoot){
      const totCC = visCC ? tblRows.reduce((s,r)=>s+(r.cc||0),0) : null;
      const totRI = visRI ? tblRows.reduce((s,r)=>s+(r.ri||0),0) : null;
      const totST = visST ? tblRows.reduce((s,r)=>s+(r.st||0),0) : null;
      const totTotal = tblRows.reduce((s,r)=>s+(r.cc||0)+(r.ri||0),0);
      const totNumCCFoot = visCC ? tblRows.reduce((s,r)=>s+(r.num_cc||0),0) : null;
      const totNumRIFoot = visRI ? tblRows.reduce((s,r)=>s+(r.num_ri||0),0) : null;
      tfoot.innerHTML=`<tr style="border-top:1.5px solid var(--border2);background:var(--bg)">
        <td style="font-weight:600;padding:6px 8px;text-align:center;vertical-align:middle">Total</td>
        ${showMuniCol?`<td style="font-weight:600;padding:6px 8px;text-align:center;vertical-align:middle">${_titDisplayedRowCount} registros</td>`:''}
        <td style="font-weight:600;padding:6px 8px;text-align:center;vertical-align:middle">${totNumCCFoot!==null?totNumCCFoot+(!showMuniCol?'<span style="color:#0F6E56;font-weight:700">*</span>':''):"—"}</td>
        <td style="font-weight:600;padding:6px 8px;text-align:center;vertical-align:middle">${totCC!==null?fmt(totCC)+" Ha":"—"}</td>
        <td style="font-weight:600;padding:6px 8px;text-align:center;vertical-align:middle">${totNumRIFoot!==null?totNumRIFoot+(!showMuniCol?'<span style="color:#0F6E56;font-weight:700">*</span>':''):"—"}</td>
        <td style="font-weight:600;padding:6px 8px;text-align:center;vertical-align:middle">${totRI!==null?fmt(totRI)+" Ha":"—"}</td>
        <td style="font-weight:600;padding:6px 8px;text-align:center;vertical-align:middle">${totST!==null?fmt(totST)+" Ha":"—"}</td>
        <td style="font-weight:600;padding:6px 8px;text-align:center;vertical-align:middle">${fmt(totTotal)} Ha</td>
        <td style="font-weight:600;padding:6px 8px;text-align:center;vertical-align:middle">100%</td>
      </tr>`;
    }
  
    renderRanking();
  }
  
  function setRankFiltro(dep, btn) {}
  
  function renderRanking() {
    const dep = document.getElementById("sel-depto").value;
    const DEPTO_LABEL = {choco:"Chocó",narino:"Nariño",antioquia:"Antioquia",cauca:"Cauca",valle:"Valle del Cauca",cordoba:"Córdoba",risaralda:"Risaralda"};
    const munis = STATE.titulacion.munis || {};
    const keys = dep === "todos" ? Object.keys(munis) : [dep];
    let all = [];
    keys.forEach(k => {
      (munis[k]||[]).forEach(m => {
        const tot = (m.cc||0)+(m.ri||0);
        if(tot>0) all.push({name:m.name, depto:DEPTO_LABEL[k]||k, cc:m.cc||0, ri:m.ri||0, total:tot});
      });
    });
    all.sort((a,b)=>b.total-a.total);
    const top = all.slice(0,10);
    const maxVal = top[0]?.total||1;
    const fmtR = v => v>=1e6?(v/1e6).toFixed(2)+"M Ha":v>=1e3?Math.round(v/1e3)+"k Ha":v.toFixed(0)+" Ha";
    const fmtRd = v => v.toLocaleString("es-CO",{minimumFractionDigits:1,maximumFractionDigits:1})+" Ha";
    const el = document.getElementById("ranking-munis");
    if(!el) return;
  
    // Tooltip estilo Chart.js nativo
    let tip = document.getElementById("rank-tooltip");
    if(!tip){
      tip = document.createElement("div");
      tip.id = "rank-tooltip";
      tip.style.cssText = "position:fixed;display:none;background:rgba(0,0,0,0.8);border-radius:4px;padding:10px;font-size:12px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;pointer-events:none;z-index:999;color:#fff;min-width:180px";
      document.body.appendChild(tip);
    }
  
    el.innerHTML = top.map((m,i)=>`
      <div class="rank-item" data-cc="${m.cc}" data-ri="${m.ri}" data-total="${m.total}" data-name="${m.name}" data-depto="${m.depto}"
        style="display:flex;align-items:center;gap:8px;margin-bottom:8px;cursor:default">
        <div style="font-size:11px;color:var(--text3);width:16px;text-align:right;flex-shrink:0">${i+1}</div>
        <div style="flex:1;min-width:0">
          <div style="display:flex;justify-content:space-between;margin-bottom:3px">
            <span style="font-size:12px;font-weight:500;color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:130px" title="${m.name}">${m.name}</span>
            <span style="font-size:11px;color:var(--text3);flex-shrink:0;margin-left:4px">${fmtR(m.total)}</span>
          </div>
          <div style="height:8px;background:var(--gris-light);border-radius:3px;overflow:hidden;display:flex">
            ${m.cc>0?`<div style="width:${(m.cc/maxVal*100).toFixed(1)}%;background:#E8A020;border-radius:3px 0 0 3px"></div>`:""}
            ${m.ri>0?`<div style="width:${(m.ri/maxVal*100).toFixed(1)}%;background:#9B6B9E"></div>`:""}
          </div>
        </div>
      </div>`).join("");
  
    el.querySelectorAll(".rank-item").forEach(row => {
      row.addEventListener("mousemove", e => {
        const cc = parseFloat(row.dataset.cc);
        const ri = parseFloat(row.dataset.ri);
        const total = parseFloat(row.dataset.total);
        const lines = [];
        lines.push(`<div style="font-size:13px;font-weight:600;margin-bottom:6px">${row.dataset.name}</div>`);
        if(cc>0) lines.push(`<div style="display:flex;align-items:center;gap:6px;margin-bottom:3px;font-size:12px"><span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:#E8A020;flex-shrink:0"></span><span>Consejos comunitarios: ${fmtRd(cc)}</span></div>`);
        if(ri>0) lines.push(`<div style="display:flex;align-items:center;gap:6px;margin-bottom:3px;font-size:12px"><span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:#9B6B9E;flex-shrink:0"></span><span>Resguardos indígenas: ${fmtRd(ri)}</span></div>`);
        lines.push(`<div style="font-size:13px;font-weight:600;margin-top:8px;padding-top:6px;border-top:1px solid rgba(255,255,255,0.25)">Total titulación colectiva: ${fmtRd(total)}</div>`);
        tip.innerHTML = lines.join("");
        tip.style.display = "block";
        tip.style.left = (e.clientX + 14) + "px";
        tip.style.top = (e.clientY - 10) + "px";
      });
      row.addEventListener("mouseleave", () => { tip.style.display = "none"; });
    });
  }
  
  const PAL_CUENCAS=["#864B66","#A0A0A0","#FDFD36","#A4572B","#6B3F8C","#F787C2","#5BB558","#9AE600","#9D57A8","#FD8205","#5D4037"];
  
  function renderCuencas(d){
    const cuencas = (d.cuencas||[]).slice().sort((a,b)=>b.area-a.area);
    const deptoFilter = d.deptoFilter||null;
    destroyChart("cuencas-bar");
    destroyChart("cuencas-pie");
    if(!cuencas.length) return;
  
    const CUENCAS_DEPTOS = CUENCAS_DEPTOS_AREA;
  
    const DEPTOS_LIST = ['Antioquia','Cauca','Chocó','Córdoba','Narño','Risaralda','Valle del cauca'];
    const DEPTOS_COLORS = ['#2a78d6','#1baf7a','#eda100','#4a3aa7','#e34948','#e87ba4','#008300'];
  
    const labels = cuencas.map(c=>c.name);
    const vals   = cuencas.map(c=>c.area);
    const pcts   = cuencas.map(c=>c.pct);
    const cols   = cuencas.map((_,i)=>PAL_CUENCAS[i%PAL_CUENCAS.length]);
  
    // Modo subcuencas si ninguna cuenca tiene datos en CUENCAS_DEPTOS
    const isModoSubcuencas = !cuencas.some(c=>CUENCAS_DEPTOS[c.name]);
  
    let stackedDatasets;
    if(deptoFilter){
      // Modo departamento: una sola serie con el color del departamento
      const depIdx = DEPTOS_LIST.indexOf(deptoFilter);
      const depColor = depIdx>=0 ? DEPTOS_COLORS[depIdx] : '#085041';
      stackedDatasets = [{
        label: deptoFilter,
        data: cuencas.map(c=>c.area),
        backgroundColor: depColor,
        borderWidth:0, borderRadius:2, borderSkipped:false
      }];
    } else if(isModoSubcuencas){
      stackedDatasets = cuencas.map((c,i)=>({
        label:c.name,
        data:cuencas.map((_,j)=>j===i?c.area:0),
        backgroundColor:DEPTOS_COLORS[i%DEPTOS_COLORS.length],
        borderWidth:0, borderRadius:2, borderSkipped:false
      }));
    } else {
      stackedDatasets = DEPTOS_LIST.map((dep,i)=>({
        label:dep,
        data:cuencas.map(c=>(CUENCAS_DEPTOS[c.name]||{})[dep]||0),
        backgroundColor:DEPTOS_COLORS[i],
        borderWidth:0, borderRadius:2, borderSkipped:false
      })).filter(ds=>ds.data.some(v=>v>0));
    }
  
    const legBar = document.getElementById("leg-cuencas-bar");
    if(legBar) legBar.innerHTML = (isModoSubcuencas||deptoFilter) ? '' : stackedDatasets.map(ds=>`<span><span class="ldot" style="background:${ds.backgroundColor};border-radius:2px"></span>${ds.label}</span>`).join("");
  
    // Altura dinámica según número de cuencas/subcuencas
    const cuencasWrap = document.getElementById("ch-cuencas-bar-wrap");
    if(cuencasWrap) cuencasWrap.style.height = Math.max(240, cuencas.length * 30 + 60) + "px";
  
    if(charts["cuencas-bar"]) charts["cuencas-bar"].destroy();
    charts["cuencas-bar"] = new Chart(document.getElementById("ch-cuencas-bar"),{
      type:"bar",
      data:{labels, datasets:stackedDatasets},
      options:{
        indexAxis:"y", responsive:true, maintainAspectRatio:false,
        interaction:{mode:"index", axis:"y", intersect:false},
        plugins:{
          legend:{display:false},
          tooltip:{
            backgroundColor:"rgba(0,0,0,0.82)",
            titleColor:"#fff", bodyColor:"#fff", footerColor:"#fff",
            titleFont:{size:13,weight:"600"}, bodyFont:{size:12},
            footerFont:{size:13,weight:"600"}, footerMarginTop:8,
            padding:10, cornerRadius:4,
            callbacks:{
              title:items=>items[0].label,
              label:c=>c.raw>0?` ${c.dataset.label}: ${Number(c.raw).toLocaleString("es-CO",{minimumFractionDigits:1,maximumFractionDigits:1})} Ha`:"",
              footer:items=>"Total: "+Number(items.reduce((s,c)=>s+c.raw,0)).toLocaleString("es-CO",{minimumFractionDigits:1,maximumFractionDigits:1})+" Ha"
            }
          }
        },
        scales:{
          x:{stacked:true, grid:{color:"rgba(0,0,0,0.05)"}, ticks:{font:{size:10}, callback:v=>v>=1e6?(v/1e6).toFixed(1)+"M":v>=1000?(v/1000).toFixed(0)+"k":v}},
          y:{stacked:true, grid:{display:false}, ticks:{font:{size:11}}}
        }
      }
    });
  
    const PAL_PIE = ['#004D40','#00695C','#00796B','#00897B','#26a69a','#4db6ac','#80cbc4','#a7d8d3','#b2dfdb','#ccebe8','#e0f2f1'];
    const legPie = document.getElementById("leg-cuencas-pie");
    legPie.innerHTML = labels.map((l,i)=>{
      const pct=(vals[i]/vals.reduce((s,v)=>s+v,0)*100).toFixed(1);
      return `<span><span class="ldot" style="background:${PAL_PIE[i]};border-radius:2px"></span>${l} ${pct}%</span>`;
    }).join("");
  
    if(charts["cuencas-pie"]) charts["cuencas-pie"].destroy();
    charts["cuencas-pie"] = new Chart(document.getElementById("ch-cuencas-pie"),{
      type:"doughnut",
      data:{
        labels:labels,
        datasets:[{
          data:vals,
          backgroundColor:PAL_PIE.slice(0,labels.length),
          borderWidth:2, borderColor:"#fff", hoverOffset:6
        }]
      },
      options:{
        responsive:true, maintainAspectRatio:false,
        plugins:{
          legend:{display:false},
          tooltip:{
            backgroundColor:"rgba(0,0,0,0.82)",
            titleColor:"#fff", bodyColor:"#fff", footerColor:"#fff",
            titleFont:{size:13,weight:"600"}, bodyFont:{size:12},
            footerFont:{size:13,weight:"600"}, footerMarginTop:8,
            padding:10, cornerRadius:4,
            callbacks:{
              title:items=>items[0].label,
              label:c=>" "+Number(c.raw).toLocaleString("es-CO",{minimumFractionDigits:1,maximumFractionDigits:1})+" Ha",
              footer:()=>"Total cuencas: "+Number(vals.reduce((s,v)=>s+v,0)).toLocaleString("es-CO",{minimumFractionDigits:1,maximumFractionDigits:1})+" Ha"
            }
          }
        },
        cutout:"60%"
      }
    });
  
  }
  
  function renderHumedales(){
    const dep = document.getElementById("sel-depto").value;
    let deptos = HUMEDAL_DATA.deptos;
    let datos = HUMEDAL_DATA.tipos.map(t=>({...t}));
  
    if(dep !== 'todos'){
      const muniSel2 = document.getElementById("sel-muni").value;
      const muniData = HUMEDAL_MUNIS[dep] || [];
      const tipos5 = ["Humedal Permanente Abierto","Humedal Permanente Bajo Dosel","Humedal Temporal","Potencial Bajo","Potencial Medio"];
      let filteredMunis = muniSel2!=='todos' ? muniData.filter(m=>m.name===muniSel2) : muniData;
      filteredMunis = filteredMunis.filter(m=>tipos5.reduce((s,t)=>s+(m[t]||0),0)>0);
      filteredMunis = filteredMunis.sort((a,b)=>tipos5.reduce((s,t)=>s+(b[t]||0),0)-tipos5.reduce((s,t)=>s+(a[t]||0),0));
      deptos = filteredMunis.map(m=>m.name);
      datos = HUMEDAL_DATA.tipos.map((t,i)=>({...t, datos:filteredMunis.map(m=>m[tipos5[i]]||0)}));
    } else {
      // Sin filtro: ordenar departamentos de mayor a menor
      const tipos5 = ["Humedal Permanente Abierto","Humedal Permanente Bajo Dosel","Humedal Temporal","Potencial Bajo","Potencial Medio"];
      const totales = deptos.map((_,i)=>datos.reduce((s,t)=>s+(t.datos[i]||0),0));
      const order = totales.map((_,i)=>i).sort((a,b)=>totales[b]-totales[a]);
      deptos = order.map(i=>deptos[i]);
      datos = datos.map(t=>({...t, datos:order.map(i=>t.datos[i])}));
    }
  
    // Leyenda barras
    document.getElementById("leg-humedal").innerHTML = HUMEDAL_DATA.tipos.map(t=>
      `<span><span class="ldot" style="background:${t.color}"></span>${t.nombre}</span>`
    ).join("");
  
    // Altura dinámica: cada barra necesita ~22px para no quedar cortada/comprimida
    const humedalWrap = document.getElementById("ch-humedal-wrap");
    if(humedalWrap) humedalWrap.style.height = Math.max(300, deptos.length*22) + "px";
  
    // Gráfico barras
    if(W._chartHumedal){ W._chartHumedal.destroy(); }
    W._chartHumedal = new Chart(document.getElementById("ch-humedal"),{
      type:"bar",
      data:{
        labels: deptos,
        datasets: datos.map(t=>({
          label: t.nombre,
          data: t.datos,
          backgroundColor: t.color,
          borderRadius: 3,
          borderSkipped: false
        }))
      },
      options:{
        indexAxis:"y",
        responsive:true, maintainAspectRatio:false,
        interaction:{mode:"index", axis:"y", intersect:false},
        plugins:{
          legend:{display:false},
          tooltip:{
            backgroundColor:"rgba(0,0,0,0.8)",
            titleColor:"#fff",
            bodyColor:"#fff",
            footerColor:"#fff",
            titleFont:{size:13,weight:"600"},
            bodyFont:{size:12},
            footerFont:{size:13,weight:"600"},
            footerMarginTop:8,
            padding:10,
            cornerRadius:4,
            callbacks:{
              title: items => items[0].label,
              label: c => " "+c.dataset.label+": "+Number(c.raw).toLocaleString("es-CO",{minimumFractionDigits:1,maximumFractionDigits:1})+" Ha",
              footer: items => {
                const total = items.reduce((s,c)=>s+c.raw,0);
                return "Total humedales: "+total.toLocaleString("es-CO",{minimumFractionDigits:1,maximumFractionDigits:1})+" Ha";
              }
            }
          }
        },
        scales:{
          x:{stacked:true, grid:{color:"rgba(0,0,0,0.05)"}, ticks:{font:{size:11}, callback:v=>v>=1e6?(v/1e6).toFixed(1)+"M":v>=1000?(v/1000).toFixed(0)+"k":v}},
          y:{stacked:true, grid:{display:false}, ticks:{font:{size:11}}}
        }
      }
    });
  
    // Dona por tipo de humedal
    const totalesTipo = datos.map(t=>t.datos.reduce((s,v)=>s+v,0));
    const totalGen = totalesTipo.reduce((s,v)=>s+v,0)||1;
    const pctsTipo = totalesTipo.map(v=>Math.round(v/totalGen*1000)/10);
    const pieLabels = datos.map((t,i)=>t.nombre+" "+pctsTipo[i]+"%");
    const pieColors = datos.map(t=>t.color);
  
    document.getElementById("leg-humedal-pie").innerHTML = datos.map((t,i)=>
      `<span><span class="ldot" style="background:${t.color};border-radius:50%"></span>${t.nombre} ${pctsTipo[i]}%</span>`
    ).join("");
  
    if(W._chartHumedalPie){ W._chartHumedalPie.destroy(); }
    W._chartHumedalPie = new Chart(document.getElementById("ch-humedal-pie"),{
      type:"doughnut",
      data:{labels:pieLabels, datasets:[{data:pctsTipo, backgroundColor:pieColors, borderWidth:2, borderColor:"#fff",hoverOffset:6}]},
      options:{responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}}, cutout:"58%"}
    });
  
    // Tabla de detalle — deptos o municipios según filtro
    const tbody = document.getElementById("humedal-tbody");
    if(tbody){
      const depNames = {"choco":"Chocó","narino":"Nariño","antioquia":"Antioquia","cauca":"Cauca","valle":"Valle del Cauca","cordoba":"Córdoba","risaralda":"Risaralda"};
      const tipos5 = ["Humedal Permanente Abierto","Humedal Permanente Bajo Dosel","Humedal Temporal","Potencial Bajo","Potencial Medio"];
  
      const muniSel = document.getElementById("sel-muni").value;
      if(dep !== 'todos' && HUMEDAL_MUNIS[dep]){
        // Mostrar municipios del departamento — filtrar si hay municipio seleccionado
        let munis = HUMEDAL_MUNIS[dep];
        if(muniSel !== 'todos') munis = munis.filter(m=>m.name===muniSel);
        const grandTotal = munis.reduce((s,m)=>s+tipos5.reduce((ss,t)=>ss+(m[t]||0),0),0)||1;
        // Mostrar columna Municipio, ocultar Departamento como único
        document.getElementById("humedal-col-muni").style.display = "";
        document.getElementById("humedal-tbl-title").textContent = "Detalle — humedales por municipio";
        const depLabel = depNames[dep]||dep;
        _humSortCol=null; _humSortAsc=true;
        _humLastRows = munis.filter(m=>tipos5.reduce((s,t)=>s+(m[t]||0),0)>0).map(m=>{
          const vals=tipos5.map(t=>m[t]||0);
          const tot=vals.reduce((s,v)=>s+v,0);
          return {depto:depLabel,muni:m.name,pa:vals[0],pb:vals[1],pt:vals[2],pb2:vals[3],pm:vals[4],total:tot,pct:tot/grandTotal*100};
        });
        tbody.innerHTML = munis.map(m=>{
          const vals = tipos5.map(t=>m[t]||0);
          const tot = vals.reduce((s,v)=>s+v,0);
          if(tot===0) return '';
          return `<tr>
            <td style="font-weight:500">${depLabel}</td>
            <td style="font-weight:500">${m.name}</td>
            ${vals.map(v=>v>0?`<td>${Number(v).toLocaleString("es-CO",{minimumFractionDigits:1,maximumFractionDigits:1})} Ha</td>`:`<td>—</td>`).join("")}
            <td style="white-space:nowrap">${Number(tot).toLocaleString("es-CO",{minimumFractionDigits:1,maximumFractionDigits:1})} Ha</td>
            <td>${(tot/grandTotal*100).toFixed(1)}%</td>
          </tr>`;
        }).join("");
        // Totales modo municipio
        const tfoot1 = document.getElementById("humedal-tfoot");
        if(tfoot1){
          const deptoDisplayName = depNames[dep]||dep;
          const deptoIdxHD = HUMEDAL_DATA.deptos.indexOf(deptoDisplayName);
          const totVals = (muniSel==='todos' && deptoIdxHD>=0)
            ? tipos5.map(t=>{ const tObj=HUMEDAL_DATA.tipos.find(tt=>tt.nombre===t); return tObj ? (tObj.datos[deptoIdxHD]||0) : 0; })
            : tipos5.map(t=>munis.reduce((s,m)=>s+(m[t]||0),0));
          const totTotal = totVals.reduce((s,v)=>s+v,0);
          tfoot1.innerHTML=`<tr style="border-top:1.5px solid var(--border2);background:var(--bg)">
            <td style="font-weight:600;padding:6px 8px;text-align:center;vertical-align:middle">Total</td>
            <td style="font-weight:600;padding:6px 8px;text-align:center;vertical-align:middle">${munis.length} registros</td>
            ${totVals.map(v=>`<td style="font-weight:600;padding:6px 8px;text-align:center;vertical-align:middle">${v>0?Number(v).toLocaleString("es-CO",{minimumFractionDigits:1,maximumFractionDigits:1})+" Ha":"—"}</td>`).join("")}
            <td style="font-weight:600;padding:6px 8px;text-align:center;vertical-align:middle">${Number(totTotal).toLocaleString("es-CO",{minimumFractionDigits:1,maximumFractionDigits:1})} Ha</td>
            <td style="font-weight:600;padding:6px 8px;text-align:center;vertical-align:middle">100%</td>
          </tr>`;
        }
      } else {
        // Mostrar todos los departamentos
        document.getElementById("humedal-col-muni").style.display = "none";
        document.getElementById("humedal-tbl-title").textContent = "Detalle — humedales por departamento";
        const grandTotal = datos[0].datos.reduce((s,_,i)=>s+datos.reduce((ss,t)=>ss+t.datos[i],0),0)||1;
        _humSortCol=null; _humSortAsc=true;
        _humLastRows = deptos.map((d,i)=>{
          const vals=datos.map(t=>t.datos[i]||0);
          const tot=vals.reduce((s,v)=>s+v,0);
          return {depto:d,pa:vals[0],pb:vals[1],pt:vals[2],pb2:vals[3],pm:vals[4],total:tot,pct:tot/grandTotal*100};
        });
        tbody.innerHTML = deptos.map((d,i)=>{
          const vals = datos.map(t=>t.datos[i]||0);
          const tot = vals.reduce((s,v)=>s+v,0);
          return `<tr>
            <td style="font-weight:500">${d}</td>
            ${vals.map(v=>v>0?`<td>${Number(v).toLocaleString("es-CO",{minimumFractionDigits:1,maximumFractionDigits:1})} Ha</td>`:`<td>—</td>`).join("")}
            <td style="white-space:nowrap">${Number(tot).toLocaleString("es-CO",{minimumFractionDigits:1,maximumFractionDigits:1})} Ha</td>
            <td>${(tot/grandTotal*100).toFixed(1)}%</td>
          </tr>`;
        }).join("");
        // Totales modo departamento
        const tfoot2 = document.getElementById("humedal-tfoot");
        if(tfoot2){
          const totVals = tipos5.map((_,ti)=>datos[ti]?datos[ti].datos.reduce((s,v)=>s+v,0):0);
          const totTotal = (DATA_OTHER.humedales.totalExact!==undefined) ? DATA_OTHER.humedales.totalExact : totVals.reduce((s,v)=>s+v,0);
          tfoot2.innerHTML=`<tr style="border-top:1.5px solid var(--border2);background:var(--bg)">
            <td style="font-weight:600;padding:6px 8px;text-align:center;vertical-align:middle">Total</td>
            ${totVals.map(v=>`<td style="font-weight:600;padding:6px 8px;text-align:center;vertical-align:middle">${v>0?Number(v).toLocaleString("es-CO",{minimumFractionDigits:1,maximumFractionDigits:1})+" Ha":"—"}</td>`).join("")}
            <td style="font-weight:600;padding:6px 8px;text-align:center;vertical-align:middle">${Number(totTotal).toLocaleString("es-CO",{minimumFractionDigits:1,maximumFractionDigits:1})} Ha</td>
            <td style="font-weight:600;padding:6px 8px;text-align:center;vertical-align:middle">100%</td>
          </tr>`;
        }
      }
    }
  }
  
  function getRunapCounts(dep, muni){
    if(dep==='todos') {
      // Sumar áreas por depto (fallback), pero preferir el total exacto por categoría cuando exista
      const all={counts:{},areas:{},isGlobal:true};
      Object.values(RUNAP_COUNTS.depto).forEach(d=>{
        Object.keys(d.areas).forEach(c=>{
          all.areas[c]=Math.round(((all.areas[c]||0)+d.areas[c])*10)/10;
        });
      });
      Object.keys(RUNAP_CAT_TOTALS_EXACT).forEach(cat=>{
        all.areas[cat]=RUNAP_CAT_TOTALS_EXACT[cat];
      });
      // Conteos: deduplicar por nombre de área (un área que cruza varios deptos cuenta 1 sola vez)
      const uniqueByCat = {};
      RUNAP_DETAIL.forEach(r=>{
        uniqueByCat[r.cat] = uniqueByCat[r.cat] || new Set();
        uniqueByCat[r.cat].add(r.nombre);
      });
      Object.keys(uniqueByCat).forEach(cat=>{
        all.counts[cat] = uniqueByCat[cat].size;
      });
      return all;
    }
    if(muni && muni!=='todos' && RUNAP_COUNTS.muni[dep] && RUNAP_COUNTS.muni[dep][muni]){
      return RUNAP_COUNTS.muni[dep][muni];
    }
    return RUNAP_COUNTS.depto[dep] || {counts:{},areas:{}};
  }
  
  function fmtHa(v){ return v>0?Number(v).toLocaleString("es-CO",{minimumFractionDigits:1,maximumFractionDigits:1})+" Ha":"—"; }
  
  function updateRunapCards(dep, muni, catSel){
    catSel = catSel || document.getElementById("sel-runap-cat")?.value || 'todas';
    const d = getRunapCounts(dep, muni);
    const c = d.counts, a = d.areas;
    const pnn = (c['Parque Nacional Natural']||0);
    const pnr = (c['Parques Naturales Regionales']||0);
    const dni = (c['Distritos Nacionales de Manejo Integrado']||0);
    const dri = (c['Distritos Regionales de Manejo Integrado']||0);
    const rfn = (c['Reservas Forestales Protectoras Nacionales']||0);
    const rfr = (c['Reservas Forestales Protectoras Regionales']||0);
    const dcs = (c['Distritos de Conservación de Suelos']||0);
    const sf  = (c['Santuario de Fauna']||0);
    const sff = (c['Santuario de Fauna y Flora']||0);
    const rnsc= (c['Reserva Natural de la Sociedad Civil']||0);
    const total = pnn+pnr+dni+dri+rfn+rfr+dcs+sf+sff+rnsc;
    const apnn=(a['Parque Nacional Natural']||0)+(a['Parques Naturales Regionales']||0);
    const admi=(a['Distritos Nacionales de Manejo Integrado']||0)+(a['Distritos Regionales de Manejo Integrado']||0);
    const arfp=(a['Reservas Forestales Protectoras Nacionales']||0)+(a['Reservas Forestales Protectoras Regionales']||0);
    const adcs=(a['Distritos de Conservación de Suelos']||0);
    const asant=(a['Santuario de Fauna']||0)+(a['Santuario de Fauna y Flora']||0);
    const arnsc=(a['Reserva Natural de la Sociedad Civil']||0);
  
    // Cuando hay filtro de categoría, mostrar solo esa categoría y poner las demás en 0
    const isCatFilter = catSel !== 'todas';
  
    // Valores filtrados según categoría
    const v_total   = isCatFilter ? 1 : total;
    const v_pnn     = isCatFilter ? (catSel==='Parque Nacional Natural'?pnn:0) : pnn;
    const v_pnr     = isCatFilter ? (catSel==='Parques Naturales Regionales'?pnr:0) : pnr;
    const v_dni     = isCatFilter ? (catSel==='Distritos Nacionales de Manejo Integrado'?dni:0) : dni;
    const v_dri     = isCatFilter ? (catSel==='Distritos Regionales de Manejo Integrado'?dri:0) : dri;
    const v_rfn     = isCatFilter ? (catSel==='Reservas Forestales Protectoras Nacionales'?rfn:0) : rfn;
    const v_rfr     = isCatFilter ? (catSel==='Reservas Forestales Protectoras Regionales'?rfr:0) : rfr;
    const v_dcs     = isCatFilter ? (catSel==='Distritos de Conservación de Suelos'?dcs:0) : dcs;
    const v_sf      = isCatFilter ? (catSel==='Santuario de Fauna'?sf:0) : sf;
    const v_sff     = isCatFilter ? 0 : sff;
    const v_rnsc    = isCatFilter ? (catSel==='Reserva Natural de la Sociedad Civil'?rnsc:0) : rnsc;
  
    const v_apnn    = isCatFilter ? (catSel==='Parque Nacional Natural'?(a['Parque Nacional Natural']||0):catSel==='Parques Naturales Regionales'?(a['Parques Naturales Regionales']||0):0) : apnn;
    const v_admi    = isCatFilter ? (catSel==='Distritos Nacionales de Manejo Integrado'?(a['Distritos Nacionales de Manejo Integrado']||0):catSel==='Distritos Regionales de Manejo Integrado'?(a['Distritos Regionales de Manejo Integrado']||0):0) : admi;
    const v_arfp    = isCatFilter ? (catSel==='Reservas Forestales Protectoras Nacionales'?(a['Reservas Forestales Protectoras Nacionales']||0):catSel==='Reservas Forestales Protectoras Regionales'?(a['Reservas Forestales Protectoras Regionales']||0):0) : arfp;
    const v_adcs    = isCatFilter ? (catSel==='Distritos de Conservación de Suelos'?adcs:0) : adcs;
    const v_asant   = isCatFilter ? (catSel==='Santuario de Fauna'?(a['Santuario de Fauna']||0):0) : asant;
    const v_arnsc   = isCatFilter ? (catSel==='Reserva Natural de la Sociedad Civil'?arnsc:0) : arnsc;
  
    // Nombres dinámicos de KPIs según categoría seleccionada
    const lbl_parques = isCatFilter && catSel==='Parque Nacional Natural' ? 'Parque Nacional Natural'
      : isCatFilter && catSel==='Parques Naturales Regionales' ? 'Parques Naturales Regionales'
      : 'Parques Natural';
    const lbl_dmi = isCatFilter && catSel==='Distritos Nacionales de Manejo Integrado' ? 'Dist. Nacional Manejo Integrado'
      : isCatFilter && catSel==='Distritos Regionales de Manejo Integrado' ? 'Dist. Regional Manejo Integrado'
      : 'Distrito de Manejo Integrado';
    const lbl_rfp = isCatFilter && catSel==='Reservas Forestales Protectoras Nacionales' ? 'Res. Forestal Protectora Nac.'
      : isCatFilter && catSel==='Reservas Forestales Protectoras Regionales' ? 'Res. Forestal Protectora Reg.'
      : 'Reserva Forestal Protectora';
  
    document.getElementById("runap-cards").innerHTML=`
      <div class="metric-card" style="border-left:4px solid #1B5E20">
        <div class="mc-label">Total áreas de conservación</div>
        <div class="mc-value" style="font-size:26px;color:#1B5E20">${v_total}</div>
        <div class="mc-sub">${d.isGlobal&&!isCatFilter?"inscritas en el RUNAP":"en la selección"}</div>
      </div>
      <div class="metric-card" style="border-left:4px solid #2E7D32">
        <div class="mc-label">${lbl_parques}</div>
        <div class="mc-value" style="color:#2E7D32">${isCatFilter?(catSel==='Parque Nacional Natural'?v_pnn:catSel==='Parques Naturales Regionales'?v_pnr:0):v_pnn+v_pnr}</div>
        ${isCatFilter?`<div style="font-size:12px;color:var(--text3);margin-top:4px">&nbsp;</div>`:`<div style="font-size:12px;color:var(--text3);margin-top:4px">• Nacional: <strong>${v_pnn}</strong> &nbsp;• Regional: <strong>${v_pnr}</strong></div>`}
        <div class="mc-sub">${fmtHa(v_apnn)}</div>
      </div>
      <div class="metric-card" style="border-left:4px solid #1565C0">
        <div class="mc-label">${lbl_dmi}</div>
        <div class="mc-value" style="color:#1565C0">${isCatFilter?(catSel==='Distritos Nacionales de Manejo Integrado'?v_dni:catSel==='Distritos Regionales de Manejo Integrado'?v_dri:0):v_dni+v_dri}</div>
        ${isCatFilter?`<div style="font-size:12px;color:var(--text3);margin-top:4px">&nbsp;</div>`:`<div style="font-size:12px;color:var(--text3);margin-top:4px">• Nacional: <strong>${v_dni}</strong> &nbsp;• Regional: <strong>${v_dri}</strong></div>`}
        <div class="mc-sub">${fmtHa(v_admi)}</div>
      </div>
      <div class="metric-card" style="border-left:4px solid #E91E63">
        <div class="mc-label">${lbl_rfp}</div>
        <div class="mc-value" style="color:#C2185B">${isCatFilter?(catSel==='Reservas Forestales Protectoras Nacionales'?v_rfn:catSel==='Reservas Forestales Protectoras Regionales'?v_rfr:0):v_rfn+v_rfr}</div>
        ${isCatFilter?`<div style="font-size:12px;color:var(--text3);margin-top:4px">&nbsp;</div>`:`<div style="font-size:12px;color:var(--text3);margin-top:4px">• Nacional: <strong>${v_rfn}</strong> &nbsp;• Regional: <strong>${v_rfr}</strong></div>`}
        <div class="mc-sub">${fmtHa(v_arfp)}</div>
      </div>
      <div class="metric-card" style="border-left:4px solid #795548">
        <div class="mc-label">Dist. Conservación Suelos</div>
        <div class="mc-value" style="color:#4E342E">${isCatFilter?(catSel==='Distritos de Conservación de Suelos'?v_dcs:0):v_dcs}</div>
        <div style="font-size:12px;color:var(--text3);margin-top:4px">&nbsp;</div>
        <div class="mc-sub">${fmtHa(v_adcs)}</div>
      </div>
      <div class="metric-card" style="border-left:4px solid #FF8F00">
        <div class="mc-label">Santuario</div>
        <div class="mc-value" style="color:#E65100">${isCatFilter?(catSel==='Santuario de Fauna'?v_sf:0):v_sf+v_sff}</div>
        ${isCatFilter?`<div style="font-size:12px;color:var(--text3);margin-top:4px">&nbsp;</div>`:`<div style="font-size:12px;color:var(--text3);margin-top:4px">• Fauna: <strong>${v_sf}</strong> &nbsp;• Fauna y Flora: <strong>${v_sff}</strong></div>`}
        <div class="mc-sub">${fmtHa(v_asant)}</div>
      </div>
      <div class="metric-card" style="border-left:4px solid #9C27B0">
        <div class="mc-label">Res. Nat. Sociedad Civil</div>
        <div class="mc-value" style="color:#6A1B9A">${isCatFilter?(catSel==='Reserva Natural de la Sociedad Civil'?v_rnsc:0):v_rnsc}</div>
        <div style="font-size:12px;color:var(--text3);margin-top:4px">&nbsp;</div>
        <div class="mc-sub">${fmtHa(v_arnsc)}</div>
      </div>
    `;
  }
  
  const RUNAP_DETALLE=[{"cat": "Distritos Nacionales de Manejo Integrado", "nombre": "Cabo Manglares Bajo Mira y Frontera", "dep": "Narño", "mun": "Tumaco", "area": 10292.7}, {"cat": "Distritos Regionales de Manejo Integrado", "nombre": "Alto Calima", "dep": "Valle del cauca", "mun": "Calima", "area": 18105.7}, {"cat": "Distritos Regionales de Manejo Integrado", "nombre": "Alto Calima", "dep": "Valle del cauca", "mun": "La Cumbre", "area": 1.0}, {"cat": "Distritos Regionales de Manejo Integrado", "nombre": "Alto del Insor", "dep": "Antioquia", "mun": "Abriaquí", "area": 4248.0}, {"cat": "Distritos Regionales de Manejo Integrado", "nombre": "Alto del Insor", "dep": "Antioquia", "mun": "Cañasgordas", "area": 1667.2}, {"cat": "Distritos Regionales de Manejo Integrado", "nombre": "Arrayanal", "dep": "Risaralda", "mun": "Mistrató", "area": 4.7}, {"cat": "Distritos Regionales de Manejo Integrado", "nombre": "BRUT Nativos", "dep": "Valle del cauca", "mun": "Roldanillo", "area": 0.0}, {"cat": "Distritos Regionales de Manejo Integrado", "nombre": "Cuchilla Cerro Plateado Alto San Jose", "dep": "Antioquia", "mun": "Urrao", "area": 187.9}, {"cat": "Distritos Regionales de Manejo Integrado", "nombre": "Cuchilla Cerro Plateado Alto San Jose", "dep": "Chocó", "mun": "El Carmen", "area": 42.6}, {"cat": "Distritos Regionales de Manejo Integrado", "nombre": "Cuchilla Del San Juan", "dep": "Risaralda", "mun": "Mistrató", "area": 12244.2}, {"cat": "Distritos Regionales de Manejo Integrado", "nombre": "Cuchilla Del San Juan", "dep": "Risaralda", "mun": "Pueblo Rico", "area": 6293.7}, {"cat": "Distritos Regionales de Manejo Integrado", "nombre": "Cuchilla Jardin Tamesis", "dep": "Risaralda", "mun": "Mistrató", "area": 0.6}, {"cat": "Distritos Regionales de Manejo Integrado", "nombre": "Cuenca  Alta del Río Atrato", "dep": "Antioquia", "mun": "Urrao", "area": 0.5}, {"cat": "Distritos Regionales de Manejo Integrado", "nombre": "Cuenca  Alta del Río Atrato", "dep": "Chocó", "mun": "El Carmen", "area": 17982.5}, {"cat": "Distritos Regionales de Manejo Integrado", "nombre": "Cuenca  Alta del Río Atrato", "dep": "Chocó", "mun": "Quibdó", "area": 3.0}, {"cat": "Distritos Regionales de Manejo Integrado", "nombre": "El Chilcal", "dep": "Valle del cauca", "mun": "Dagua", "area": 914.9}, {"cat": "Distritos Regionales de Manejo Integrado", "nombre": "En el Territorio Colectivo del Consejo Comunitario de la Comunidad Negra de la Plata", "dep": "Valle del cauca", "mun": "Buenaventura", "area": 6802.0}, {"cat": "Distritos Regionales de Manejo Integrado", "nombre": "Encanto de los Manglares del Bajo Baudó", "dep": "Chocó", "mun": "Bajo Baudó", "area": 105910.8}, {"cat": "Distritos Regionales de Manejo Integrado", "nombre": "Encanto de los Manglares del Bajo Baudó", "dep": "Chocó", "mun": "El Litoral Del San Juán", "area": 3782.8}, {"cat": "Distritos Regionales de Manejo Integrado", "nombre": "Encanto de los Manglares del Bajo Baudó", "dep": "Chocó", "mun": "Nuquí", "area": 55.6}, {"cat": "Distritos Regionales de Manejo Integrado", "nombre": "Enclave Subxerofitico de Atuncela", "dep": "Valle del cauca", "mun": "Dagua", "area": 2334.4}, {"cat": "Distritos Regionales de Manejo Integrado", "nombre": "Ensenada de Rionegro, los Bajos Aledaños, las Ciénagas de Marimonda y el Salado", "dep": "Antioquia", "mun": "Necoclí", "area": 25629.5}, {"cat": "Distritos Regionales de Manejo Integrado", "nombre": "Golfo de Tribugá Cabo Corrientes", "dep": "Chocó", "mun": "Nuquí", "area": 3640.9}, {"cat": "Distritos Regionales de Manejo Integrado", "nombre": "Guacas", "dep": "Valle del cauca", "mun": "Bolívar", "area": 24.6}, {"cat": "Distritos Regionales de Manejo Integrado", "nombre": "Guacas", "dep": "Valle del cauca", "mun": "Trujillo", "area": 11.0}, {"cat": "Distritos Regionales de Manejo Integrado", "nombre": "HATOVIEJO", "dep": "Valle del cauca", "mun": "Yotoco", "area": 14.9}, {"cat": "Distritos Regionales de Manejo Integrado", "nombre": "Isla Ají", "dep": "Cauca", "mun": "López", "area": 0.0}, {"cat": "Distritos Regionales de Manejo Integrado", "nombre": "Isla Ají", "dep": "Valle del cauca", "mun": "Buenaventura", "area": 9589.1}, {"cat": "Distritos Regionales de Manejo Integrado", "nombre": "Lago Azul los Manatìes", "dep": "Antioquia", "mun": "Turbo", "area": 57.3}, {"cat": "Distritos Regionales de Manejo Integrado", "nombre": "Lago Azul los Manatìes", "dep": "Chocó", "mun": "Unguía", "area": 31117.5}, {"cat": "Distritos Regionales de Manejo Integrado", "nombre": "Serranía de Abibe", "dep": "Antioquia", "mun": "Apartadó", "area": 23112.4}, {"cat": "Distritos Regionales de Manejo Integrado", "nombre": "Serranía de Abibe", "dep": "Antioquia", "mun": "Carepa", "area": 9609.1}, {"cat": "Distritos Regionales de Manejo Integrado", "nombre": "Serranía de Abibe", "dep": "Antioquia", "mun": "Chigorodó", "area": 2894.9}, {"cat": "Distritos Regionales de Manejo Integrado", "nombre": "Serranía de Abibe", "dep": "Antioquia", "mun": "Turbo", "area": 6042.2}, {"cat": "Distritos Regionales de Manejo Integrado", "nombre": "Serranía de Abibe", "dep": "Córdoba", "mun": "Tierralta", "area": 18.0}, {"cat": "Distritos Regionales de Manejo Integrado", "nombre": "Serranía de Abibe", "dep": "Córdoba", "mun": "Valencia", "area": 0.0}, {"cat": "Distritos Regionales de Manejo Integrado", "nombre": "Serranía de Los Paraguas", "dep": "Chocó", "mun": "San José Del Palmar", "area": 154.6}, {"cat": "Distritos Regionales de Manejo Integrado", "nombre": "Serranía de Los Paraguas", "dep": "Chocó", "mun": "Sipí", "area": 76.8}, {"cat": "Distritos Regionales de Manejo Integrado", "nombre": "Serranía de Los Paraguas", "dep": "Valle del cauca", "mun": "Argelia", "area": 0.1}, {"cat": "Distritos Regionales de Manejo Integrado", "nombre": "Serranía de Los Paraguas", "dep": "Valle del cauca", "mun": "El Cairo", "area": 21286.4}, {"cat": "Distritos Regionales de Manejo Integrado", "nombre": "Serranía de Los Paraguas", "dep": "Valle del cauca", "mun": "El Dovio", "area": 9002.7}, {"cat": "Distritos Regionales de Manejo Integrado", "nombre": "Serranía de Los Paraguas", "dep": "Valle del cauca", "mun": "Versalles", "area": 9290.3}, {"cat": "Distritos Regionales de Manejo Integrado", "nombre": "de la Playona y la Loma de Caleta", "dep": "Chocó", "mun": "Acandí", "area": 9377.9}, {"cat": "Distritos Regionales de Manejo Integrado", "nombre": "de la Vereda Gamboa", "dep": "Valle del cauca", "mun": "Buenaventura", "area": 2469.4}, {"cat": "Distritos de Conservación de Suelos", "nombre": "Cañón de Río Grande", "dep": "Valle del cauca", "mun": "Dagua", "area": 1235.8}, {"cat": "Distritos de Conservación de Suelos", "nombre": "Cañón de Río Grande", "dep": "Valle del cauca", "mun": "La Cumbre", "area": 6184.5}, {"cat": "Distritos de Conservación de Suelos", "nombre": "Cañón de Río Grande", "dep": "Valle del cauca", "mun": "Restrepo", "area": 3043.8}, {"cat": "Distritos de Conservación de Suelos", "nombre": "Cañón de Río Grande", "dep": "Valle del cauca", "mun": "Vijes", "area": 263.3}, {"cat": "Parque Nacional Natural", "nombre": "Farallones de Cali", "dep": "Cauca", "mun": "López", "area": 8.3}, {"cat": "Parque Nacional Natural", "nombre": "Farallones de Cali", "dep": "Valle del cauca", "mun": "Buenaventura", "area": 156518.5}, {"cat": "Parque Nacional Natural", "nombre": "Farallones de Cali", "dep": "Valle del cauca", "mun": "Dagua", "area": 13475.1}, {"cat": "Parque Nacional Natural", "nombre": "Las Orquídeas", "dep": "Antioquia", "mun": "Abriaquí", "area": 1121.6}, {"cat": "Parque Nacional Natural", "nombre": "Las Orquídeas", "dep": "Antioquia", "mun": "Frontino", "area": 21143.9}, {"cat": "Parque Nacional Natural", "nombre": "Las Orquídeas", "dep": "Antioquia", "mun": "Urrao", "area": 6528.7}, {"cat": "Parque Nacional Natural", "nombre": "Los Katíos", "dep": "Antioquia", "mun": "Turbo", "area": 13135.7}, {"cat": "Parque Nacional Natural", "nombre": "Los Katíos", "dep": "Chocó", "mun": "Belén de bajirá", "area": 7609.1}, {"cat": "Parque Nacional Natural", "nombre": "Los Katíos", "dep": "Chocó", "mun": "Riosucio", "area": 56700.0}, {"cat": "Parque Nacional Natural", "nombre": "Los Katíos", "dep": "Chocó", "mun": "Unguía", "area": 814.6}, {"cat": "Parque Nacional Natural", "nombre": "Munchique", "dep": "Cauca", "mun": "El Tambo", "area": 46995.3}, {"cat": "Parque Nacional Natural", "nombre": "Paramillo", "dep": "Antioquia", "mun": "Carepa", "area": 35.2}, {"cat": "Parque Nacional Natural", "nombre": "Paramillo", "dep": "Antioquia", "mun": "Chigorodó", "area": 134.4}, {"cat": "Parque Nacional Natural", "nombre": "Paramillo", "dep": "Antioquia", "mun": "Dabeiba", "area": 10171.6}, {"cat": "Parque Nacional Natural", "nombre": "Paramillo", "dep": "Antioquia", "mun": "Ituango", "area": 81742.4}, {"cat": "Parque Nacional Natural", "nombre": "Paramillo", "dep": "Antioquia", "mun": "Mutatá", "area": 2109.6}, {"cat": "Parque Nacional Natural", "nombre": "Paramillo", "dep": "Córdoba", "mun": "Tierralta", "area": 294951.6}, {"cat": "Parque Nacional Natural", "nombre": "Sanquianga", "dep": "Narño", "mun": "El Charco", "area": 15081.2}, {"cat": "Parque Nacional Natural", "nombre": "Sanquianga", "dep": "Narño", "mun": "La Tola", "area": 14389.3}, {"cat": "Parque Nacional Natural", "nombre": "Sanquianga", "dep": "Narño", "mun": "Mosquera", "area": 36644.2}, {"cat": "Parque Nacional Natural", "nombre": "Sanquianga", "dep": "Narño", "mun": "Olaya Herrera", "area": 19953.0}, {"cat": "Parque Nacional Natural", "nombre": "Tatamá", "dep": "Chocó", "mun": "San José Del Palmar", "area": 22246.8}, {"cat": "Parque Nacional Natural", "nombre": "Tatamá", "dep": "Chocó", "mun": "Tadó", "area": 4000.0}, {"cat": "Parque Nacional Natural", "nombre": "Tatamá", "dep": "Risaralda", "mun": "Pueblo Rico", "area": 9948.3}, {"cat": "Parque Nacional Natural", "nombre": "Uramba Bahía Málaga", "dep": "Valle del cauca", "mun": "Buenaventura", "area": 502.1}, {"cat": "Parque Nacional Natural", "nombre": "Utria", "dep": "Chocó", "mun": "Alto Baudó", "area": 20362.9}, {"cat": "Parque Nacional Natural", "nombre": "Utria", "dep": "Chocó", "mun": "Bahía Solano", "area": 8161.0}, {"cat": "Parque Nacional Natural", "nombre": "Utria", "dep": "Chocó", "mun": "Bojayá", "area": 15530.2}, {"cat": "Parque Nacional Natural", "nombre": "Utria", "dep": "Chocó", "mun": "Nuquí", "area": 7626.8}, {"cat": "Parques Naturales Regionales", "nombre": "Corredor de las Alegrias", "dep": "Antioquia", "mun": "Abriaquí", "area": 78.1}, {"cat": "Parques Naturales Regionales", "nombre": "Corredor de las Alegrias", "dep": "Antioquia", "mun": "Urrao", "area": 114.1}, {"cat": "Parques Naturales Regionales", "nombre": "El Comedero", "dep": "Cauca", "mun": "Guapi", "area": 4.6}, {"cat": "Parques Naturales Regionales", "nombre": "El Comedero", "dep": "Cauca", "mun": "Timbiquí", "area": 803.6}, {"cat": "Parques Naturales Regionales", "nombre": "Humedales entre los Ríos Leon y Suriquí", "dep": "Antioquia", "mun": "Apartadó", "area": 0.9}, {"cat": "Parques Naturales Regionales", "nombre": "Humedales entre los Ríos Leon y Suriquí", "dep": "Antioquia", "mun": "Carepa", "area": 7.3}, {"cat": "Parques Naturales Regionales", "nombre": "Humedales entre los Ríos Leon y Suriquí", "dep": "Antioquia", "mun": "Turbo", "area": 5269.2}, {"cat": "Parques Naturales Regionales", "nombre": "La Sierpe", "dep": "Valle del cauca", "mun": "Buenaventura", "area": 25209.2}, {"cat": "Parques Naturales Regionales", "nombre": "Páramo del Duende", "dep": "Chocó", "mun": "El Litoral Del San Juán", "area": 130.4}, {"cat": "Parques Naturales Regionales", "nombre": "Páramo del Duende", "dep": "Valle del cauca", "mun": "Bolívar", "area": 2752.0}, {"cat": "Parques Naturales Regionales", "nombre": "Páramo del Duende", "dep": "Valle del cauca", "mun": "Calima", "area": 8530.8}, {"cat": "Parques Naturales Regionales", "nombre": "Páramo del Duende", "dep": "Valle del cauca", "mun": "Trujillo", "area": 845.1}, {"cat": "Parques Naturales Regionales", "nombre": "Ríonegro", "dep": "Risaralda", "mun": "Pueblo Rico", "area": 182.7}, {"cat": "Parques Naturales Regionales", "nombre": "Santa Emilia", "dep": "Risaralda", "mun": "Pueblo Rico", "area": 0.0}, {"cat": "Parques Naturales Regionales", "nombre": "Volcán Azufral Chaitan", "dep": "Narño", "mun": "Mallama", "area": 3218.2}, {"cat": "Parques Naturales Regionales", "nombre": "Volcán Azufral Chaitan", "dep": "Narño", "mun": "Sapuyes", "area": 609.6}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "Aguapanela", "dep": "Chocó", "mun": "Acandí", "area": 2.6}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "Altamira", "dep": "Valle del cauca", "mun": "El Cairo", "area": 53.4}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "Altomira", "dep": "Valle del cauca", "mun": "El Cairo", "area": 19.1}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "Amigos del Bosque", "dep": "Chocó", "mun": "Acandí", "area": 20.5}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "Bellavista", "dep": "Valle del cauca", "mun": "Bolívar", "area": 29.9}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "Bellavista", "dep": "Valle del cauca", "mun": "El Cairo", "area": 13.7}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "Bermejal", "dep": "Valle del cauca", "mun": "Versalles", "area": 11.9}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "Biotopo Selva Humeda", "dep": "Narño", "mun": "Barbacoas", "area": 74.8}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "Biotopo Selva Humeda", "dep": "Narño", "mun": "Tumaco", "area": 284.4}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "Buenavista", "dep": "Valle del cauca", "mun": "Roldanillo", "area": 4.0}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "Buenos Aires de Apartadó", "dep": "Antioquia", "mun": "Apartadó", "area": 86.0}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "Colibrí del Sol", "dep": "Antioquia", "mun": "Urrao", "area": 165.2}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "De Las Aves Colibrí Del Sol", "dep": "Antioquia", "mun": "Urrao", "area": 1330.3}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "De Las Aves El Pangan", "dep": "Narño", "mun": "Barbacoas", "area": 50.3}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "De Las Mirabilis Swarovscki", "dep": "Cauca", "mun": "El Tambo", "area": 157.1}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "Dinaboy", "dep": "Valle del cauca", "mun": "Dagua", "area": 212.8}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "Dos Quebradas", "dep": "Valle del cauca", "mun": "El Cairo", "area": 5.4}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "EL Tesoro", "dep": "Valle del cauca", "mun": "Versalles", "area": 10.3}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "El Arrayán", "dep": "Valle del cauca", "mun": "Versalles", "area": 15.1}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "El Carare", "dep": "Valle del cauca", "mun": "Dagua", "area": 13.6}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "El Carare II", "dep": "Valle del cauca", "mun": "Dagua", "area": 11.9}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "El Cedral", "dep": "Valle del cauca", "mun": "Versalles", "area": 57.2}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "El Cedro", "dep": "Chocó", "mun": "El Carmen", "area": 69.7}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "El Edén", "dep": "Valle del cauca", "mun": "La Cumbre", "area": 1.0}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "El Flamenco", "dep": "Valle del cauca", "mun": "El Dovio", "area": 23.6}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "El Horizonte", "dep": "Valle del cauca", "mun": "Bolívar", "area": 0.0}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "El Horizonte", "dep": "Valle del cauca", "mun": "Roldanillo", "area": 12.0}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "El Laguito", "dep": "Valle del cauca", "mun": "El Cairo", "area": 6.6}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "El Manantial", "dep": "Valle del cauca", "mun": "El Cairo", "area": 11.1}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "El Porvenir", "dep": "Valle del cauca", "mun": "Versalles", "area": 1.4}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "El Raudal", "dep": "Antioquia", "mun": "Mutatá", "area": 28.0}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "El Recreo", "dep": "Valle del cauca", "mun": "El Cairo", "area": 5.0}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "El Retiro", "dep": "Valle del cauca", "mun": "Versalles", "area": 193.0}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "El Silencio", "dep": "Valle del cauca", "mun": "Versalles", "area": 26.3}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "El Tesoro", "dep": "Valle del cauca", "mun": "Dagua", "area": 14.3}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "El Vergel", "dep": "Valle del cauca", "mun": "El Cairo", "area": 16.2}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "El Vergel", "dep": "Valle del cauca", "mun": "El Dovio", "area": 3.5}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "Esparta", "dep": "Valle del cauca", "mun": "La Cumbre", "area": 24.4}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "Himalaya", "dep": "Valle del cauca", "mun": "La Cumbre", "area": 28.7}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "Inka Anam", "dep": "Valle del cauca", "mun": "El Cairo", "area": 4.9}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "Jurásico", "dep": "Valle del cauca", "mun": "Dagua", "area": 24.7}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "La Bretaña", "dep": "Valle del cauca", "mun": "El Cairo", "area": 13.3}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "La Cabaña", "dep": "Valle del cauca", "mun": "El Cairo", "area": 0.4}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "La Cabaña", "dep": "Valle del cauca", "mun": "Versalles", "area": 13.0}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "La Cascada", "dep": "Valle del cauca", "mun": "El Cairo", "area": 48.5}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "La Esneda", "dep": "Valle del cauca", "mun": "El Dovio", "area": 2.1}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "La Esperanza", "dep": "Valle del cauca", "mun": "El Cairo", "area": 87.7}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "La Esperanza", "dep": "Valle del cauca", "mun": "La Cumbre", "area": 7.8}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "La Ilusión", "dep": "Valle del cauca", "mun": "El Cairo", "area": 8.1}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "La India", "dep": "Valle del cauca", "mun": "El Dovio", "area": 31.5}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "La Luisa", "dep": "Valle del cauca", "mun": "Roldanillo", "area": 9.3}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "La Paila", "dep": "Valle del cauca", "mun": "El Cairo", "area": 13.4}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "La Paila", "dep": "Valle del cauca", "mun": "Versalles", "area": 136.8}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "La Parcela 2", "dep": "Valle del cauca", "mun": "Versalles", "area": 25.0}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "La Parcela 9", "dep": "Valle del cauca", "mun": "Versalles", "area": 7.2}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "La Paz", "dep": "Valle del cauca", "mun": "La Cumbre", "area": 10.0}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "La Pradera", "dep": "Valle del cauca", "mun": "Bolívar", "area": 7.0}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "La Reforestación", "dep": "Valle del cauca", "mun": "El Dovio", "area": 13.4}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "La Rivera", "dep": "Antioquia", "mun": "Turbo", "area": 19.6}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "La Rivera", "dep": "Valle del cauca", "mun": "Bolívar", "area": 28.2}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "La Sirena", "dep": "Chocó", "mun": "El Carmen", "area": 69.0}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "La Siria", "dep": "Chocó", "mun": "San José Del Palmar", "area": 33.2}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "La Suiza", "dep": "Valle del cauca", "mun": "Versalles", "area": 60.8}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "La Trinidad", "dep": "Valle del cauca", "mun": "Roldanillo", "area": 0.0}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "La Vega", "dep": "Valle del cauca", "mun": "Dagua", "area": 17.5}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "La Vega", "dep": "Valle del cauca", "mun": "La Cumbre", "area": 0.5}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "La Violeta", "dep": "Antioquia", "mun": "Urrao", "area": 0.4}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "La Vuelta", "dep": "Valle del cauca", "mun": "Versalles", "area": 12.0}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "Las 3R´s", "dep": "Valle del cauca", "mun": "Restrepo", "area": 16.0}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "Las Brisas", "dep": "Antioquia", "mun": "Urrao", "area": 14.0}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "Las Golondrinas", "dep": "Valle del cauca", "mun": "El Cairo", "area": 0.3}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "Las Golondrinas", "dep": "Valle del cauca", "mun": "Versalles", "area": 31.9}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "Las Nieves El Guadual", "dep": "Valle del cauca", "mun": "El Dovio", "area": 3.8}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "Las Palmeras", "dep": "Valle del cauca", "mun": "Calima", "area": 246.6}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "Las Tángaras", "dep": "Chocó", "mun": "El Carmen", "area": 1618.1}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "Los Andes", "dep": "Valle del cauca", "mun": "Roldanillo", "area": 4.5}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "Los Volcanes", "dep": "Valle del cauca", "mun": "Dagua", "area": 27.1}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "Maindes", "dep": "Narño", "mun": "Barbacoas", "area": 29.5}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "Masada", "dep": "Valle del cauca", "mun": "La Cumbre", "area": 9.0}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "Matilde Montañez ? Páramo Del Sol", "dep": "Antioquia", "mun": "Urrao", "area": 307.5}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "Montes de la Esperanza", "dep": "Chocó", "mun": "Acandí", "area": 96.9}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "Montevideo", "dep": "Valle del cauca", "mun": "El Cairo", "area": 46.7}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "Moralba", "dep": "Valle del cauca", "mun": "Calima", "area": 291.8}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "Patio Bonito", "dep": "Valle del cauca", "mun": "El Cairo", "area": 16.9}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "Patio Bonito", "dep": "Valle del cauca", "mun": "Versalles", "area": 3.8}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "Peñas Blancas", "dep": "Valle del cauca", "mun": "El Cairo", "area": 75.9}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "Peñas Blancas", "dep": "Valle del cauca", "mun": "Versalles", "area": 0.0}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "Potosí", "dep": "Valle del cauca", "mun": "Roldanillo", "area": 3.3}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "Rayuela", "dep": "Antioquia", "mun": "Necoclí", "area": 4.0}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "Reserva Integral y Ecoaldea Sasardí", "dep": "Chocó", "mun": "Acandí", "area": 27.5}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "Reserva Integral y Ecoaldea Sasardí II", "dep": "Chocó", "mun": "Acandí", "area": 8.0}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "Reserva Natural Comunitaria Galapagos", "dep": "Chocó", "mun": "San José Del Palmar", "area": 2.5}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "Reserva Natural Comunitaria Galapagos", "dep": "Valle del cauca", "mun": "El Cairo", "area": 49.7}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "Reserva Natural Musinga", "dep": "Antioquia", "mun": "Frontino", "area": 1445.2}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "Reserva Natural Verdeagua", "dep": "Chocó", "mun": "El Carmen", "area": 33.5}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "Rondalla", "dep": "Valle del cauca", "mun": "Calima", "area": 27.7}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "San Alfonso", "dep": "Valle del cauca", "mun": "Dagua", "area": 197.2}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "San Antonio", "dep": "Valle del cauca", "mun": "Dagua", "area": 49.0}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "San Rafael", "dep": "Valle del cauca", "mun": "Dagua", "area": 11.9}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "Tacarcuna", "dep": "Chocó", "mun": "Acandí", "area": 4.6}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "Tierrablanca No 4", "dep": "Valle del cauca", "mun": "Dagua", "area": 7.5}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "Valparaíso", "dep": "Cauca", "mun": "El Tambo", "area": 67.2}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "Villa María y La Marina", "dep": "Valle del cauca", "mun": "El Dovio", "area": 11.0}, {"cat": "Reservas Forestales Protectoras Nacionales", "nombre": "Carauta", "dep": "Antioquia", "mun": "Frontino", "area": 27555.3}, {"cat": "Reservas Forestales Protectoras Nacionales", "nombre": "Cuenca Alta del Río Nembí", "dep": "Narño", "mun": "Barbacoas", "area": 2295.6}, {"cat": "Reservas Forestales Protectoras Nacionales", "nombre": "Cuenca Alta del Río Nembí", "dep": "Narño", "mun": "Ricaurte", "area": 191.9}, {"cat": "Reservas Forestales Protectoras Nacionales", "nombre": "Darién", "dep": "Chocó", "mun": "Acandí", "area": 36426.4}, {"cat": "Reservas Forestales Protectoras Nacionales", "nombre": "Darién", "dep": "Chocó", "mun": "Unguía", "area": 20113.8}, {"cat": "Reservas Forestales Protectoras Nacionales", "nombre": "De Urrao", "dep": "Antioquia", "mun": "Abriaquí", "area": 17.9}, {"cat": "Reservas Forestales Protectoras Nacionales", "nombre": "De Urrao", "dep": "Antioquia", "mun": "Frontino", "area": 4.1}, {"cat": "Reservas Forestales Protectoras Nacionales", "nombre": "De Urrao", "dep": "Antioquia", "mun": "Urrao", "area": 29869.3}, {"cat": "Reservas Forestales Protectoras Nacionales", "nombre": "De la Cuenca Hidrográfica de los Ríos Escalerete y San Cipriano", "dep": "Valle del cauca", "mun": "Buenaventura", "area": 5572.1}, {"cat": "Reservas Forestales Protectoras Nacionales", "nombre": "El Cerro Dapa Carisucio", "dep": "Valle del cauca", "mun": "La Cumbre", "area": 19.6}, {"cat": "Reservas Forestales Protectoras Nacionales", "nombre": "La Elvira", "dep": "Valle del cauca", "mun": "Dagua", "area": 5.8}, {"cat": "Reservas Forestales Protectoras Nacionales", "nombre": "La Elvira", "dep": "Valle del cauca", "mun": "La Cumbre", "area": 9.3}, {"cat": "Reservas Forestales Protectoras Nacionales", "nombre": "La Planada", "dep": "Narño", "mun": "Mallama", "area": 331.0}, {"cat": "Reservas Forestales Protectoras Nacionales", "nombre": "La Planada", "dep": "Narño", "mun": "Ricaurte", "area": 3868.9}, {"cat": "Reservas Forestales Protectoras Nacionales", "nombre": "Río Anchicayá", "dep": "Valle del cauca", "mun": "Buenaventura", "area": 61043.2}, {"cat": "Reservas Forestales Protectoras Nacionales", "nombre": "Río Anchicayá", "dep": "Valle del cauca", "mun": "Dagua", "area": 12818.4}, {"cat": "Reservas Forestales Protectoras Nacionales", "nombre": "Río Cali", "dep": "Valle del cauca", "mun": "Dagua", "area": 13.7}, {"cat": "Reservas Forestales Protectoras Nacionales", "nombre": "Río Dagua", "dep": "Valle del cauca", "mun": "Calima", "area": 49.0}, {"cat": "Reservas Forestales Protectoras Nacionales", "nombre": "Río Dagua", "dep": "Valle del cauca", "mun": "Dagua", "area": 8795.1}, {"cat": "Reservas Forestales Protectoras Nacionales", "nombre": "Río Dagua", "dep": "Valle del cauca", "mun": "La Cumbre", "area": 151.7}, {"cat": "Reservas Forestales Protectoras Nacionales", "nombre": "Ríos Tumaradocito y León", "dep": "Antioquia", "mun": "Chigorodó", "area": 41.2}, {"cat": "Reservas Forestales Protectoras Nacionales", "nombre": "Ríos Tumaradocito y León", "dep": "Antioquia", "mun": "Mutatá", "area": 173.1}, {"cat": "Reservas Forestales Protectoras Nacionales", "nombre": "Ríos Tumaradocito y León", "dep": "Antioquia", "mun": "Turbo", "area": 11181.0}, {"cat": "Reservas Forestales Protectoras Nacionales", "nombre": "Ríos Tumaradocito y León", "dep": "Chocó", "mun": "Belén de bajirá", "area": 27604.5}, {"cat": "Reservas Forestales Protectoras Nacionales", "nombre": "Yotoco", "dep": "Valle del cauca", "mun": "Yotoco", "area": 4.9}, {"cat": "Reservas Forestales Protectoras Regionales", "nombre": "De Bitaco", "dep": "Valle del cauca", "mun": "Dagua", "area": 14.2}, {"cat": "Reservas Forestales Protectoras Regionales", "nombre": "De Bitaco", "dep": "Valle del cauca", "mun": "La Cumbre", "area": 177.0}, {"cat": "Reservas Forestales Protectoras Regionales", "nombre": "Farallones del Citará", "dep": "Chocó", "mun": "Bagadó", "area": 265.8}, {"cat": "Reservas Forestales Protectoras Regionales", "nombre": "Farallones del Citará", "dep": "Chocó", "mun": "El Carmen", "area": 264.6}, {"cat": "Reservas Forestales Protectoras Regionales", "nombre": "Farallones del Citará", "dep": "Risaralda", "mun": "Mistrató", "area": 294.8}, {"cat": "Reservas Forestales Protectoras Regionales", "nombre": "K´õk´õiEujã , Calle Santa Rosa Timbiqui Cauca", "dep": "Cauca", "mun": "López", "area": 4273.3}, {"cat": "Reservas Forestales Protectoras Regionales", "nombre": "K´õk´õiEujã , Calle Santa Rosa Timbiqui Cauca", "dep": "Cauca", "mun": "Timbiquí", "area": 7379.9}, {"cat": "Reservas Forestales Protectoras Regionales", "nombre": "Río Bravo", "dep": "Chocó", "mun": "El Litoral Del San Juán", "area": 41.4}, {"cat": "Reservas Forestales Protectoras Regionales", "nombre": "Río Bravo", "dep": "Valle del cauca", "mun": "Calima", "area": 24286.6}, {"cat": "Reservas Forestales Protectoras Regionales", "nombre": "Río Bravo", "dep": "Valle del cauca", "mun": "Dagua", "area": 11.1}, {"cat": "Reservas Forestales Protectoras Regionales", "nombre": "Serrania del Pinche", "dep": "Cauca", "mun": "Argelia", "area": 7060.2}, {"cat": "Reservas Forestales Protectoras Regionales", "nombre": "Serrania del Pinche", "dep": "Cauca", "mun": "Guapi", "area": 130.3}, {"cat": "Reservas Forestales Protectoras Regionales", "nombre": "Serrania del Pinche", "dep": "Cauca", "mun": "Timbiquí", "area": 50.4}, {"cat": "Reservas Forestales Protectoras Regionales", "nombre": "Serrania del Pinche", "dep": "Narño", "mun": "El Charco", "area": 46.6}, {"cat": "Santuario de Fauna", "nombre": "Acandí Playón y Playona", "dep": "Chocó", "mun": "Acandí", "area": 7.2}];
  const RUNAP_DETAIL=[{"cat": "Distritos Nacionales de Manejo Integrado", "nombre": "Cabo Manglares Bajo Mira y Frontera", "dep": "Narño", "mun": "Tumaco", "area": 10292.7, "dep_id": "narino"}, {"cat": "Distritos Regionales de Manejo Integrado", "nombre": "Alto Calima", "dep": "Valle del cauca", "mun": "Calima", "area": 18105.7, "dep_id": "valle"}, {"cat": "Distritos Regionales de Manejo Integrado", "nombre": "Alto Calima", "dep": "Valle del cauca", "mun": "La Cumbre", "area": 1.0, "dep_id": "valle"}, {"cat": "Distritos Regionales de Manejo Integrado", "nombre": "Alto del Insor", "dep": "Antioquia", "mun": "Abriaquí", "area": 4248.0, "dep_id": "antioquia"}, {"cat": "Distritos Regionales de Manejo Integrado", "nombre": "Alto del Insor", "dep": "Antioquia", "mun": "Cañasgordas", "area": 1667.2, "dep_id": "antioquia"}, {"cat": "Distritos Regionales de Manejo Integrado", "nombre": "Arrayanal", "dep": "Risaralda", "mun": "Mistrató", "area": 4.7, "dep_id": "risaralda"}, {"cat": "Distritos Regionales de Manejo Integrado", "nombre": "BRUT Nativos", "dep": "Valle del cauca", "mun": "Roldanillo", "area": 0.0, "dep_id": "valle"}, {"cat": "Distritos Regionales de Manejo Integrado", "nombre": "Cuchilla Cerro Plateado Alto San Jose", "dep": "Antioquia", "mun": "Urrao", "area": 187.9, "dep_id": "antioquia"}, {"cat": "Distritos Regionales de Manejo Integrado", "nombre": "Cuchilla Cerro Plateado Alto San Jose", "dep": "Chocó", "mun": "El Carmen", "area": 42.6, "dep_id": "choco"}, {"cat": "Distritos Regionales de Manejo Integrado", "nombre": "Cuchilla Del San Juan", "dep": "Risaralda", "mun": "Mistrató", "area": 12244.2, "dep_id": "risaralda"}, {"cat": "Distritos Regionales de Manejo Integrado", "nombre": "Cuchilla Del San Juan", "dep": "Risaralda", "mun": "Pueblo Rico", "area": 6293.7, "dep_id": "risaralda"}, {"cat": "Distritos Regionales de Manejo Integrado", "nombre": "Cuchilla Jardin Tamesis", "dep": "Risaralda", "mun": "Mistrató", "area": 0.6, "dep_id": "risaralda"}, {"cat": "Distritos Regionales de Manejo Integrado", "nombre": "Cuenca  Alta del Río Atrato", "dep": "Antioquia", "mun": "Urrao", "area": 0.5, "dep_id": "antioquia"}, {"cat": "Distritos Regionales de Manejo Integrado", "nombre": "Cuenca  Alta del Río Atrato", "dep": "Chocó", "mun": "El Carmen", "area": 17982.5, "dep_id": "choco"}, {"cat": "Distritos Regionales de Manejo Integrado", "nombre": "Cuenca  Alta del Río Atrato", "dep": "Chocó", "mun": "Quibdó", "area": 3.0, "dep_id": "choco"}, {"cat": "Distritos Regionales de Manejo Integrado", "nombre": "El Chilcal", "dep": "Valle del cauca", "mun": "Dagua", "area": 914.9, "dep_id": "valle"}, {"cat": "Distritos Regionales de Manejo Integrado", "nombre": "En el Territorio Colectivo del Consejo Comunitario de la Comunidad Negra de la Plata", "dep": "Valle del cauca", "mun": "Buenaventura", "area": 6802.0, "dep_id": "valle"}, {"cat": "Distritos Regionales de Manejo Integrado", "nombre": "Encanto de los Manglares del Bajo Baudó", "dep": "Chocó", "mun": "Bajo Baudó", "area": 105910.8, "dep_id": "choco"}, {"cat": "Distritos Regionales de Manejo Integrado", "nombre": "Encanto de los Manglares del Bajo Baudó", "dep": "Chocó", "mun": "El Litoral Del San Juán", "area": 3782.8, "dep_id": "choco"}, {"cat": "Distritos Regionales de Manejo Integrado", "nombre": "Encanto de los Manglares del Bajo Baudó", "dep": "Chocó", "mun": "Nuquí", "area": 55.6, "dep_id": "choco"}, {"cat": "Distritos Regionales de Manejo Integrado", "nombre": "Enclave Subxerofitico de Atuncela", "dep": "Valle del cauca", "mun": "Dagua", "area": 2334.4, "dep_id": "valle"}, {"cat": "Distritos Regionales de Manejo Integrado", "nombre": "Ensenada de Rionegro, los Bajos Aledaños, las Ciénagas de Marimonda y el Salado", "dep": "Antioquia", "mun": "Necoclí", "area": 25629.5, "dep_id": "antioquia"}, {"cat": "Distritos Regionales de Manejo Integrado", "nombre": "Golfo de Tribugá Cabo Corrientes", "dep": "Chocó", "mun": "Nuquí", "area": 3640.9, "dep_id": "choco"}, {"cat": "Distritos Regionales de Manejo Integrado", "nombre": "Guacas", "dep": "Valle del cauca", "mun": "Bolívar", "area": 24.6, "dep_id": "valle"}, {"cat": "Distritos Regionales de Manejo Integrado", "nombre": "Guacas", "dep": "Valle del cauca", "mun": "Trujillo", "area": 11.0, "dep_id": "valle"}, {"cat": "Distritos Regionales de Manejo Integrado", "nombre": "HATOVIEJO", "dep": "Valle del cauca", "mun": "Yotoco", "area": 14.9, "dep_id": "valle"}, {"cat": "Distritos Regionales de Manejo Integrado", "nombre": "Isla Ají", "dep": "Cauca", "mun": "López", "area": 0.0, "dep_id": "cauca"}, {"cat": "Distritos Regionales de Manejo Integrado", "nombre": "Isla Ají", "dep": "Valle del cauca", "mun": "Buenaventura", "area": 9589.1, "dep_id": "valle"}, {"cat": "Distritos Regionales de Manejo Integrado", "nombre": "Lago Azul los Manatìes", "dep": "Antioquia", "mun": "Turbo", "area": 57.3, "dep_id": "antioquia"}, {"cat": "Distritos Regionales de Manejo Integrado", "nombre": "Lago Azul los Manatìes", "dep": "Chocó", "mun": "Unguía", "area": 31117.5, "dep_id": "choco"}, {"cat": "Distritos Regionales de Manejo Integrado", "nombre": "Serranía de Abibe", "dep": "Antioquia", "mun": "Apartadó", "area": 23112.4, "dep_id": "antioquia"}, {"cat": "Distritos Regionales de Manejo Integrado", "nombre": "Serranía de Abibe", "dep": "Antioquia", "mun": "Carepa", "area": 9609.1, "dep_id": "antioquia"}, {"cat": "Distritos Regionales de Manejo Integrado", "nombre": "Serranía de Abibe", "dep": "Antioquia", "mun": "Chigorodó", "area": 2894.9, "dep_id": "antioquia"}, {"cat": "Distritos Regionales de Manejo Integrado", "nombre": "Serranía de Abibe", "dep": "Antioquia", "mun": "Turbo", "area": 6042.2, "dep_id": "antioquia"}, {"cat": "Distritos Regionales de Manejo Integrado", "nombre": "Serranía de Abibe", "dep": "Córdoba", "mun": "Tierralta", "area": 18.0, "dep_id": "cordoba"}, {"cat": "Distritos Regionales de Manejo Integrado", "nombre": "Serranía de Abibe", "dep": "Córdoba", "mun": "Valencia", "area": 0.0, "dep_id": "cordoba"}, {"cat": "Distritos Regionales de Manejo Integrado", "nombre": "Serranía de Los Paraguas", "dep": "Chocó", "mun": "San José Del Palmar", "area": 154.6, "dep_id": "choco"}, {"cat": "Distritos Regionales de Manejo Integrado", "nombre": "Serranía de Los Paraguas", "dep": "Chocó", "mun": "Sipí", "area": 76.8, "dep_id": "choco"}, {"cat": "Distritos Regionales de Manejo Integrado", "nombre": "Serranía de Los Paraguas", "dep": "Valle del cauca", "mun": "Argelia", "area": 0.1, "dep_id": "valle"}, {"cat": "Distritos Regionales de Manejo Integrado", "nombre": "Serranía de Los Paraguas", "dep": "Valle del cauca", "mun": "El Cairo", "area": 21286.4, "dep_id": "valle"}, {"cat": "Distritos Regionales de Manejo Integrado", "nombre": "Serranía de Los Paraguas", "dep": "Valle del cauca", "mun": "El Dovio", "area": 9002.7, "dep_id": "valle"}, {"cat": "Distritos Regionales de Manejo Integrado", "nombre": "Serranía de Los Paraguas", "dep": "Valle del cauca", "mun": "Versalles", "area": 9290.3, "dep_id": "valle"}, {"cat": "Distritos Regionales de Manejo Integrado", "nombre": "de la Playona y la Loma de Caleta", "dep": "Chocó", "mun": "Acandí", "area": 9377.9, "dep_id": "choco"}, {"cat": "Distritos Regionales de Manejo Integrado", "nombre": "de la Vereda Gamboa", "dep": "Valle del cauca", "mun": "Buenaventura", "area": 2469.4, "dep_id": "valle"}, {"cat": "Distritos de Conservación de Suelos", "nombre": "Cañón de Río Grande", "dep": "Valle del cauca", "mun": "Dagua", "area": 1235.8, "dep_id": "valle"}, {"cat": "Distritos de Conservación de Suelos", "nombre": "Cañón de Río Grande", "dep": "Valle del cauca", "mun": "La Cumbre", "area": 6184.5, "dep_id": "valle"}, {"cat": "Distritos de Conservación de Suelos", "nombre": "Cañón de Río Grande", "dep": "Valle del cauca", "mun": "Restrepo", "area": 3043.8, "dep_id": "valle"}, {"cat": "Distritos de Conservación de Suelos", "nombre": "Cañón de Río Grande", "dep": "Valle del cauca", "mun": "Vijes", "area": 263.3, "dep_id": "valle"}, {"cat": "Parque Nacional Natural", "nombre": "Farallones de Cali", "dep": "Cauca", "mun": "López", "area": 8.3, "dep_id": "cauca"}, {"cat": "Parque Nacional Natural", "nombre": "Farallones de Cali", "dep": "Valle del cauca", "mun": "Buenaventura", "area": 156518.5, "dep_id": "valle"}, {"cat": "Parque Nacional Natural", "nombre": "Farallones de Cali", "dep": "Valle del cauca", "mun": "Dagua", "area": 13475.1, "dep_id": "valle"}, {"cat": "Parque Nacional Natural", "nombre": "Las Orquídeas", "dep": "Antioquia", "mun": "Abriaquí", "area": 1121.6, "dep_id": "antioquia"}, {"cat": "Parque Nacional Natural", "nombre": "Las Orquídeas", "dep": "Antioquia", "mun": "Frontino", "area": 21143.9, "dep_id": "antioquia"}, {"cat": "Parque Nacional Natural", "nombre": "Las Orquídeas", "dep": "Antioquia", "mun": "Urrao", "area": 6528.7, "dep_id": "antioquia"}, {"cat": "Parque Nacional Natural", "nombre": "Los Katíos", "dep": "Antioquia", "mun": "Turbo", "area": 13135.7, "dep_id": "antioquia"}, {"cat": "Parque Nacional Natural", "nombre": "Los Katíos", "dep": "Chocó", "mun": "Belén de bajirá", "area": 7609.1, "dep_id": "choco"}, {"cat": "Parque Nacional Natural", "nombre": "Los Katíos", "dep": "Chocó", "mun": "Riosucio", "area": 56700.0, "dep_id": "choco"}, {"cat": "Parque Nacional Natural", "nombre": "Los Katíos", "dep": "Chocó", "mun": "Unguía", "area": 814.6, "dep_id": "choco"}, {"cat": "Parque Nacional Natural", "nombre": "Munchique", "dep": "Cauca", "mun": "El Tambo", "area": 46995.3, "dep_id": "cauca"}, {"cat": "Parque Nacional Natural", "nombre": "Paramillo", "dep": "Antioquia", "mun": "Carepa", "area": 35.2, "dep_id": "antioquia"}, {"cat": "Parque Nacional Natural", "nombre": "Paramillo", "dep": "Antioquia", "mun": "Chigorodó", "area": 134.4, "dep_id": "antioquia"}, {"cat": "Parque Nacional Natural", "nombre": "Paramillo", "dep": "Antioquia", "mun": "Dabeiba", "area": 10171.6, "dep_id": "antioquia"}, {"cat": "Parque Nacional Natural", "nombre": "Paramillo", "dep": "Antioquia", "mun": "Ituango", "area": 81742.4, "dep_id": "antioquia"}, {"cat": "Parque Nacional Natural", "nombre": "Paramillo", "dep": "Antioquia", "mun": "Mutatá", "area": 2109.6, "dep_id": "antioquia"}, {"cat": "Parque Nacional Natural", "nombre": "Paramillo", "dep": "Córdoba", "mun": "Tierralta", "area": 294951.6, "dep_id": "cordoba"}, {"cat": "Parque Nacional Natural", "nombre": "Sanquianga", "dep": "Narño", "mun": "El Charco", "area": 15081.2, "dep_id": "narino"}, {"cat": "Parque Nacional Natural", "nombre": "Sanquianga", "dep": "Narño", "mun": "La Tola", "area": 14389.3, "dep_id": "narino"}, {"cat": "Parque Nacional Natural", "nombre": "Sanquianga", "dep": "Narño", "mun": "Mosquera", "area": 36644.2, "dep_id": "narino"}, {"cat": "Parque Nacional Natural", "nombre": "Sanquianga", "dep": "Narño", "mun": "Olaya Herrera", "area": 19953.0, "dep_id": "narino"}, {"cat": "Parque Nacional Natural", "nombre": "Tatamá", "dep": "Chocó", "mun": "San José Del Palmar", "area": 22246.8, "dep_id": "choco"}, {"cat": "Parque Nacional Natural", "nombre": "Tatamá", "dep": "Chocó", "mun": "Tadó", "area": 4000.0, "dep_id": "choco"}, {"cat": "Parque Nacional Natural", "nombre": "Tatamá", "dep": "Risaralda", "mun": "Pueblo Rico", "area": 9948.3, "dep_id": "risaralda"}, {"cat": "Parque Nacional Natural", "nombre": "Uramba Bahía Málaga", "dep": "Valle del cauca", "mun": "Buenaventura", "area": 502.1, "dep_id": "valle"}, {"cat": "Parque Nacional Natural", "nombre": "Utria", "dep": "Chocó", "mun": "Alto Baudó", "area": 20362.9, "dep_id": "choco"}, {"cat": "Parque Nacional Natural", "nombre": "Utria", "dep": "Chocó", "mun": "Bahía Solano", "area": 8161.0, "dep_id": "choco"}, {"cat": "Parque Nacional Natural", "nombre": "Utria", "dep": "Chocó", "mun": "Bojayá", "area": 15530.2, "dep_id": "choco"}, {"cat": "Parque Nacional Natural", "nombre": "Utria", "dep": "Chocó", "mun": "Nuquí", "area": 7626.8, "dep_id": "choco"}, {"cat": "Parques Naturales Regionales", "nombre": "Corredor de las Alegrias", "dep": "Antioquia", "mun": "Abriaquí", "area": 78.1, "dep_id": "antioquia"}, {"cat": "Parques Naturales Regionales", "nombre": "Corredor de las Alegrias", "dep": "Antioquia", "mun": "Urrao", "area": 114.1, "dep_id": "antioquia"}, {"cat": "Parques Naturales Regionales", "nombre": "El Comedero", "dep": "Cauca", "mun": "Guapi", "area": 4.6, "dep_id": "cauca"}, {"cat": "Parques Naturales Regionales", "nombre": "El Comedero", "dep": "Cauca", "mun": "Timbiquí", "area": 803.6, "dep_id": "cauca"}, {"cat": "Parques Naturales Regionales", "nombre": "Humedales entre los Ríos Leon y Suriquí", "dep": "Antioquia", "mun": "Apartadó", "area": 0.9, "dep_id": "antioquia"}, {"cat": "Parques Naturales Regionales", "nombre": "Humedales entre los Ríos Leon y Suriquí", "dep": "Antioquia", "mun": "Carepa", "area": 7.3, "dep_id": "antioquia"}, {"cat": "Parques Naturales Regionales", "nombre": "Humedales entre los Ríos Leon y Suriquí", "dep": "Antioquia", "mun": "Turbo", "area": 5269.2, "dep_id": "antioquia"}, {"cat": "Parques Naturales Regionales", "nombre": "La Sierpe", "dep": "Valle del cauca", "mun": "Buenaventura", "area": 25209.2, "dep_id": "valle"}, {"cat": "Parques Naturales Regionales", "nombre": "Páramo del Duende", "dep": "Chocó", "mun": "El Litoral Del San Juán", "area": 130.4, "dep_id": "choco"}, {"cat": "Parques Naturales Regionales", "nombre": "Páramo del Duende", "dep": "Valle del cauca", "mun": "Bolívar", "area": 2752.0, "dep_id": "valle"}, {"cat": "Parques Naturales Regionales", "nombre": "Páramo del Duende", "dep": "Valle del cauca", "mun": "Calima", "area": 8530.8, "dep_id": "valle"}, {"cat": "Parques Naturales Regionales", "nombre": "Páramo del Duende", "dep": "Valle del cauca", "mun": "Trujillo", "area": 845.1, "dep_id": "valle"}, {"cat": "Parques Naturales Regionales", "nombre": "Ríonegro", "dep": "Risaralda", "mun": "Pueblo Rico", "area": 182.7, "dep_id": "risaralda"}, {"cat": "Parques Naturales Regionales", "nombre": "Santa Emilia", "dep": "Risaralda", "mun": "Pueblo Rico", "area": 0.0, "dep_id": "risaralda"}, {"cat": "Parques Naturales Regionales", "nombre": "Volcán Azufral Chaitan", "dep": "Narño", "mun": "Mallama", "area": 3218.2, "dep_id": "narino"}, {"cat": "Parques Naturales Regionales", "nombre": "Volcán Azufral Chaitan", "dep": "Narño", "mun": "Sapuyes", "area": 609.6, "dep_id": "narino"}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "Aguapanela", "dep": "Chocó", "mun": "Acandí", "area": 2.6, "dep_id": "choco"}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "Altamira", "dep": "Valle del cauca", "mun": "El Cairo", "area": 53.4, "dep_id": "valle"}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "Altomira", "dep": "Valle del cauca", "mun": "El Cairo", "area": 19.1, "dep_id": "valle"}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "Amigos del Bosque", "dep": "Chocó", "mun": "Acandí", "area": 20.5, "dep_id": "choco"}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "Bellavista", "dep": "Valle del cauca", "mun": "Bolívar", "area": 29.9, "dep_id": "valle"}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "Bellavista", "dep": "Valle del cauca", "mun": "El Cairo", "area": 13.7, "dep_id": "valle"}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "Bermejal", "dep": "Valle del cauca", "mun": "Versalles", "area": 11.9, "dep_id": "valle"}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "Biotopo Selva Humeda", "dep": "Narño", "mun": "Barbacoas", "area": 74.8, "dep_id": "narino"}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "Biotopo Selva Humeda", "dep": "Narño", "mun": "Tumaco", "area": 284.4, "dep_id": "narino"}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "Buenavista", "dep": "Valle del cauca", "mun": "Roldanillo", "area": 4.0, "dep_id": "valle"}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "Buenos Aires de Apartadó", "dep": "Antioquia", "mun": "Apartadó", "area": 86.0, "dep_id": "antioquia"}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "Colibrí del Sol", "dep": "Antioquia", "mun": "Urrao", "area": 165.2, "dep_id": "antioquia"}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "De Las Aves Colibrí Del Sol", "dep": "Antioquia", "mun": "Urrao", "area": 1330.3, "dep_id": "antioquia"}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "De Las Aves El Pangan", "dep": "Narño", "mun": "Barbacoas", "area": 50.3, "dep_id": "narino"}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "De Las Mirabilis Swarovscki", "dep": "Cauca", "mun": "El Tambo", "area": 157.1, "dep_id": "cauca"}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "Dinaboy", "dep": "Valle del cauca", "mun": "Dagua", "area": 212.8, "dep_id": "valle"}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "Dos Quebradas", "dep": "Valle del cauca", "mun": "El Cairo", "area": 5.4, "dep_id": "valle"}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "EL Tesoro", "dep": "Valle del cauca", "mun": "Versalles", "area": 10.3, "dep_id": "valle"}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "El Arrayán", "dep": "Valle del cauca", "mun": "Versalles", "area": 15.1, "dep_id": "valle"}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "El Carare", "dep": "Valle del cauca", "mun": "Dagua", "area": 13.6, "dep_id": "valle"}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "El Carare II", "dep": "Valle del cauca", "mun": "Dagua", "area": 11.9, "dep_id": "valle"}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "El Cedral", "dep": "Valle del cauca", "mun": "Versalles", "area": 57.2, "dep_id": "valle"}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "El Cedro", "dep": "Chocó", "mun": "El Carmen", "area": 69.7, "dep_id": "choco"}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "El Edén", "dep": "Valle del cauca", "mun": "La Cumbre", "area": 1.0, "dep_id": "valle"}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "El Flamenco", "dep": "Valle del cauca", "mun": "El Dovio", "area": 23.6, "dep_id": "valle"}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "El Horizonte", "dep": "Valle del cauca", "mun": "Bolívar", "area": 0.0, "dep_id": "valle"}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "El Horizonte", "dep": "Valle del cauca", "mun": "Roldanillo", "area": 12.0, "dep_id": "valle"}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "El Laguito", "dep": "Valle del cauca", "mun": "El Cairo", "area": 6.6, "dep_id": "valle"}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "El Manantial", "dep": "Valle del cauca", "mun": "El Cairo", "area": 11.1, "dep_id": "valle"}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "El Porvenir", "dep": "Valle del cauca", "mun": "Versalles", "area": 1.4, "dep_id": "valle"}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "El Raudal", "dep": "Antioquia", "mun": "Mutatá", "area": 28.0, "dep_id": "antioquia"}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "El Recreo", "dep": "Valle del cauca", "mun": "El Cairo", "area": 5.0, "dep_id": "valle"}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "El Retiro", "dep": "Valle del cauca", "mun": "Versalles", "area": 193.0, "dep_id": "valle"}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "El Silencio", "dep": "Valle del cauca", "mun": "Versalles", "area": 26.3, "dep_id": "valle"}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "El Tesoro", "dep": "Valle del cauca", "mun": "Dagua", "area": 14.3, "dep_id": "valle"}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "El Vergel", "dep": "Valle del cauca", "mun": "El Cairo", "area": 16.2, "dep_id": "valle"}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "El Vergel", "dep": "Valle del cauca", "mun": "El Dovio", "area": 3.5, "dep_id": "valle"}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "Esparta", "dep": "Valle del cauca", "mun": "La Cumbre", "area": 24.4, "dep_id": "valle"}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "Himalaya", "dep": "Valle del cauca", "mun": "La Cumbre", "area": 28.7, "dep_id": "valle"}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "Inka Anam", "dep": "Valle del cauca", "mun": "El Cairo", "area": 4.9, "dep_id": "valle"}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "Jurásico", "dep": "Valle del cauca", "mun": "Dagua", "area": 24.7, "dep_id": "valle"}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "La Bretaña", "dep": "Valle del cauca", "mun": "El Cairo", "area": 13.3, "dep_id": "valle"}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "La Cabaña", "dep": "Valle del cauca", "mun": "El Cairo", "area": 0.4, "dep_id": "valle"}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "La Cabaña", "dep": "Valle del cauca", "mun": "Versalles", "area": 13.0, "dep_id": "valle"}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "La Cascada", "dep": "Valle del cauca", "mun": "El Cairo", "area": 48.5, "dep_id": "valle"}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "La Esneda", "dep": "Valle del cauca", "mun": "El Dovio", "area": 2.1, "dep_id": "valle"}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "La Esperanza", "dep": "Valle del cauca", "mun": "El Cairo", "area": 87.7, "dep_id": "valle"}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "La Esperanza", "dep": "Valle del cauca", "mun": "La Cumbre", "area": 7.8, "dep_id": "valle"}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "La Ilusión", "dep": "Valle del cauca", "mun": "El Cairo", "area": 8.1, "dep_id": "valle"}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "La India", "dep": "Valle del cauca", "mun": "El Dovio", "area": 31.5, "dep_id": "valle"}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "La Luisa", "dep": "Valle del cauca", "mun": "Roldanillo", "area": 9.3, "dep_id": "valle"}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "La Paila", "dep": "Valle del cauca", "mun": "El Cairo", "area": 13.4, "dep_id": "valle"}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "La Paila", "dep": "Valle del cauca", "mun": "Versalles", "area": 136.8, "dep_id": "valle"}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "La Parcela 2", "dep": "Valle del cauca", "mun": "Versalles", "area": 25.0, "dep_id": "valle"}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "La Parcela 9", "dep": "Valle del cauca", "mun": "Versalles", "area": 7.2, "dep_id": "valle"}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "La Paz", "dep": "Valle del cauca", "mun": "La Cumbre", "area": 10.0, "dep_id": "valle"}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "La Pradera", "dep": "Valle del cauca", "mun": "Bolívar", "area": 7.0, "dep_id": "valle"}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "La Reforestación", "dep": "Valle del cauca", "mun": "El Dovio", "area": 13.4, "dep_id": "valle"}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "La Rivera", "dep": "Antioquia", "mun": "Turbo", "area": 19.6, "dep_id": "antioquia"}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "La Rivera", "dep": "Valle del cauca", "mun": "Bolívar", "area": 28.2, "dep_id": "valle"}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "La Sirena", "dep": "Chocó", "mun": "El Carmen", "area": 69.0, "dep_id": "choco"}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "La Siria", "dep": "Chocó", "mun": "San José Del Palmar", "area": 33.2, "dep_id": "choco"}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "La Suiza", "dep": "Valle del cauca", "mun": "Versalles", "area": 60.8, "dep_id": "valle"}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "La Trinidad", "dep": "Valle del cauca", "mun": "Roldanillo", "area": 0.0, "dep_id": "valle"}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "La Vega", "dep": "Valle del cauca", "mun": "Dagua", "area": 17.5, "dep_id": "valle"}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "La Vega", "dep": "Valle del cauca", "mun": "La Cumbre", "area": 0.5, "dep_id": "valle"}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "La Violeta", "dep": "Antioquia", "mun": "Urrao", "area": 0.4, "dep_id": "antioquia"}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "La Vuelta", "dep": "Valle del cauca", "mun": "Versalles", "area": 12.0, "dep_id": "valle"}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "Las 3R´s", "dep": "Valle del cauca", "mun": "Restrepo", "area": 16.0, "dep_id": "valle"}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "Las Brisas", "dep": "Antioquia", "mun": "Urrao", "area": 14.0, "dep_id": "antioquia"}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "Las Golondrinas", "dep": "Valle del cauca", "mun": "El Cairo", "area": 0.3, "dep_id": "valle"}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "Las Golondrinas", "dep": "Valle del cauca", "mun": "Versalles", "area": 31.9, "dep_id": "valle"}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "Las Nieves El Guadual", "dep": "Valle del cauca", "mun": "El Dovio", "area": 3.8, "dep_id": "valle"}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "Las Palmeras", "dep": "Valle del cauca", "mun": "Calima", "area": 246.6, "dep_id": "valle"}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "Las Tángaras", "dep": "Chocó", "mun": "El Carmen", "area": 1618.1, "dep_id": "choco"}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "Los Andes", "dep": "Valle del cauca", "mun": "Roldanillo", "area": 4.5, "dep_id": "valle"}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "Los Volcanes", "dep": "Valle del cauca", "mun": "Dagua", "area": 27.1, "dep_id": "valle"}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "Maindes", "dep": "Narño", "mun": "Barbacoas", "area": 29.5, "dep_id": "narino"}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "Masada", "dep": "Valle del cauca", "mun": "La Cumbre", "area": 9.0, "dep_id": "valle"}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "Matilde Montañez ? Páramo Del Sol", "dep": "Antioquia", "mun": "Urrao", "area": 307.5, "dep_id": "antioquia"}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "Montes de la Esperanza", "dep": "Chocó", "mun": "Acandí", "area": 96.9, "dep_id": "choco"}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "Montevideo", "dep": "Valle del cauca", "mun": "El Cairo", "area": 46.7, "dep_id": "valle"}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "Moralba", "dep": "Valle del cauca", "mun": "Calima", "area": 291.8, "dep_id": "valle"}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "Patio Bonito", "dep": "Valle del cauca", "mun": "El Cairo", "area": 16.9, "dep_id": "valle"}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "Patio Bonito", "dep": "Valle del cauca", "mun": "Versalles", "area": 3.8, "dep_id": "valle"}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "Peñas Blancas", "dep": "Valle del cauca", "mun": "El Cairo", "area": 75.9, "dep_id": "valle"}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "Peñas Blancas", "dep": "Valle del cauca", "mun": "Versalles", "area": 0.0, "dep_id": "valle"}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "Potosí", "dep": "Valle del cauca", "mun": "Roldanillo", "area": 3.3, "dep_id": "valle"}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "Rayuela", "dep": "Antioquia", "mun": "Necoclí", "area": 4.0, "dep_id": "antioquia"}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "Reserva Integral y Ecoaldea Sasardí", "dep": "Chocó", "mun": "Acandí", "area": 27.5, "dep_id": "choco"}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "Reserva Integral y Ecoaldea Sasardí II", "dep": "Chocó", "mun": "Acandí", "area": 8.0, "dep_id": "choco"}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "Reserva Natural Comunitaria Galapagos", "dep": "Chocó", "mun": "San José Del Palmar", "area": 2.5, "dep_id": "choco"}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "Reserva Natural Comunitaria Galapagos", "dep": "Valle del cauca", "mun": "El Cairo", "area": 49.7, "dep_id": "valle"}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "Reserva Natural Musinga", "dep": "Antioquia", "mun": "Frontino", "area": 1445.2, "dep_id": "antioquia"}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "Reserva Natural Verdeagua", "dep": "Chocó", "mun": "El Carmen", "area": 33.5, "dep_id": "choco"}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "Rondalla", "dep": "Valle del cauca", "mun": "Calima", "area": 27.7, "dep_id": "valle"}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "San Alfonso", "dep": "Valle del cauca", "mun": "Dagua", "area": 197.2, "dep_id": "valle"}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "San Antonio", "dep": "Valle del cauca", "mun": "Dagua", "area": 49.0, "dep_id": "valle"}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "San Rafael", "dep": "Valle del cauca", "mun": "Dagua", "area": 11.9, "dep_id": "valle"}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "Tacarcuna", "dep": "Chocó", "mun": "Acandí", "area": 4.6, "dep_id": "choco"}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "Tierrablanca No 4", "dep": "Valle del cauca", "mun": "Dagua", "area": 7.5, "dep_id": "valle"}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "Valparaíso", "dep": "Cauca", "mun": "El Tambo", "area": 67.2, "dep_id": "cauca"}, {"cat": "Reserva Natural de la Sociedad Civil", "nombre": "Villa María y La Marina", "dep": "Valle del cauca", "mun": "El Dovio", "area": 11.0, "dep_id": "valle"}, {"cat": "Reservas Forestales Protectoras Nacionales", "nombre": "Carauta", "dep": "Antioquia", "mun": "Frontino", "area": 27555.3, "dep_id": "antioquia"}, {"cat": "Reservas Forestales Protectoras Nacionales", "nombre": "Cuenca Alta del Río Nembí", "dep": "Narño", "mun": "Barbacoas", "area": 2295.6, "dep_id": "narino"}, {"cat": "Reservas Forestales Protectoras Nacionales", "nombre": "Cuenca Alta del Río Nembí", "dep": "Narño", "mun": "Ricaurte", "area": 191.9, "dep_id": "narino"}, {"cat": "Reservas Forestales Protectoras Nacionales", "nombre": "Darién", "dep": "Chocó", "mun": "Acandí", "area": 36426.4, "dep_id": "choco"}, {"cat": "Reservas Forestales Protectoras Nacionales", "nombre": "Darién", "dep": "Chocó", "mun": "Unguía", "area": 20113.8, "dep_id": "choco"}, {"cat": "Reservas Forestales Protectoras Nacionales", "nombre": "De Urrao", "dep": "Antioquia", "mun": "Abriaquí", "area": 17.9, "dep_id": "antioquia"}, {"cat": "Reservas Forestales Protectoras Nacionales", "nombre": "De Urrao", "dep": "Antioquia", "mun": "Frontino", "area": 4.1, "dep_id": "antioquia"}, {"cat": "Reservas Forestales Protectoras Nacionales", "nombre": "De Urrao", "dep": "Antioquia", "mun": "Urrao", "area": 29869.3, "dep_id": "antioquia"}, {"cat": "Reservas Forestales Protectoras Nacionales", "nombre": "De la Cuenca Hidrográfica de los Ríos Escalerete y San Cipriano", "dep": "Valle del cauca", "mun": "Buenaventura", "area": 5572.1, "dep_id": "valle"}, {"cat": "Reservas Forestales Protectoras Nacionales", "nombre": "El Cerro Dapa Carisucio", "dep": "Valle del cauca", "mun": "La Cumbre", "area": 19.6, "dep_id": "valle"}, {"cat": "Reservas Forestales Protectoras Nacionales", "nombre": "La Elvira", "dep": "Valle del cauca", "mun": "Dagua", "area": 5.8, "dep_id": "valle"}, {"cat": "Reservas Forestales Protectoras Nacionales", "nombre": "La Elvira", "dep": "Valle del cauca", "mun": "La Cumbre", "area": 9.3, "dep_id": "valle"}, {"cat": "Reservas Forestales Protectoras Nacionales", "nombre": "La Planada", "dep": "Narño", "mun": "Mallama", "area": 331.0, "dep_id": "narino"}, {"cat": "Reservas Forestales Protectoras Nacionales", "nombre": "La Planada", "dep": "Narño", "mun": "Ricaurte", "area": 3868.9, "dep_id": "narino"}, {"cat": "Reservas Forestales Protectoras Nacionales", "nombre": "Río Anchicayá", "dep": "Valle del cauca", "mun": "Buenaventura", "area": 61043.2, "dep_id": "valle"}, {"cat": "Reservas Forestales Protectoras Nacionales", "nombre": "Río Anchicayá", "dep": "Valle del cauca", "mun": "Dagua", "area": 12818.4, "dep_id": "valle"}, {"cat": "Reservas Forestales Protectoras Nacionales", "nombre": "Río Cali", "dep": "Valle del cauca", "mun": "Dagua", "area": 13.7, "dep_id": "valle"}, {"cat": "Reservas Forestales Protectoras Nacionales", "nombre": "Río Dagua", "dep": "Valle del cauca", "mun": "Calima", "area": 49.0, "dep_id": "valle"}, {"cat": "Reservas Forestales Protectoras Nacionales", "nombre": "Río Dagua", "dep": "Valle del cauca", "mun": "Dagua", "area": 8795.1, "dep_id": "valle"}, {"cat": "Reservas Forestales Protectoras Nacionales", "nombre": "Río Dagua", "dep": "Valle del cauca", "mun": "La Cumbre", "area": 151.7, "dep_id": "valle"}, {"cat": "Reservas Forestales Protectoras Nacionales", "nombre": "Ríos Tumaradocito y León", "dep": "Antioquia", "mun": "Chigorodó", "area": 41.2, "dep_id": "antioquia"}, {"cat": "Reservas Forestales Protectoras Nacionales", "nombre": "Ríos Tumaradocito y León", "dep": "Antioquia", "mun": "Mutatá", "area": 173.1, "dep_id": "antioquia"}, {"cat": "Reservas Forestales Protectoras Nacionales", "nombre": "Ríos Tumaradocito y León", "dep": "Antioquia", "mun": "Turbo", "area": 11181.0, "dep_id": "antioquia"}, {"cat": "Reservas Forestales Protectoras Nacionales", "nombre": "Ríos Tumaradocito y León", "dep": "Chocó", "mun": "Belén de bajirá", "area": 27604.5, "dep_id": "choco"}, {"cat": "Reservas Forestales Protectoras Nacionales", "nombre": "Yotoco", "dep": "Valle del cauca", "mun": "Yotoco", "area": 4.9, "dep_id": "valle"}, {"cat": "Reservas Forestales Protectoras Regionales", "nombre": "De Bitaco", "dep": "Valle del cauca", "mun": "Dagua", "area": 14.2, "dep_id": "valle"}, {"cat": "Reservas Forestales Protectoras Regionales", "nombre": "De Bitaco", "dep": "Valle del cauca", "mun": "La Cumbre", "area": 177.0, "dep_id": "valle"}, {"cat": "Reservas Forestales Protectoras Regionales", "nombre": "Farallones del Citará", "dep": "Chocó", "mun": "Bagadó", "area": 265.8, "dep_id": "choco"}, {"cat": "Reservas Forestales Protectoras Regionales", "nombre": "Farallones del Citará", "dep": "Chocó", "mun": "El Carmen", "area": 264.6, "dep_id": "choco"}, {"cat": "Reservas Forestales Protectoras Regionales", "nombre": "Farallones del Citará", "dep": "Risaralda", "mun": "Mistrató", "area": 294.8, "dep_id": "risaralda"}, {"cat": "Reservas Forestales Protectoras Regionales", "nombre": "K´õk´õiEujã , Calle Santa Rosa Timbiqui Cauca", "dep": "Cauca", "mun": "López", "area": 4273.3, "dep_id": "cauca"}, {"cat": "Reservas Forestales Protectoras Regionales", "nombre": "K´õk´õiEujã , Calle Santa Rosa Timbiqui Cauca", "dep": "Cauca", "mun": "Timbiquí", "area": 7379.9, "dep_id": "cauca"}, {"cat": "Reservas Forestales Protectoras Regionales", "nombre": "Río Bravo", "dep": "Chocó", "mun": "El Litoral Del San Juán", "area": 41.4, "dep_id": "choco"}, {"cat": "Reservas Forestales Protectoras Regionales", "nombre": "Río Bravo", "dep": "Valle del cauca", "mun": "Calima", "area": 24286.6, "dep_id": "valle"}, {"cat": "Reservas Forestales Protectoras Regionales", "nombre": "Río Bravo", "dep": "Valle del cauca", "mun": "Dagua", "area": 11.1, "dep_id": "valle"}, {"cat": "Reservas Forestales Protectoras Regionales", "nombre": "Serrania del Pinche", "dep": "Cauca", "mun": "Argelia", "area": 7060.2, "dep_id": "cauca"}, {"cat": "Reservas Forestales Protectoras Regionales", "nombre": "Serrania del Pinche", "dep": "Cauca", "mun": "Guapi", "area": 130.3, "dep_id": "cauca"}, {"cat": "Reservas Forestales Protectoras Regionales", "nombre": "Serrania del Pinche", "dep": "Cauca", "mun": "Timbiquí", "area": 50.4, "dep_id": "cauca"}, {"cat": "Reservas Forestales Protectoras Regionales", "nombre": "Serrania del Pinche", "dep": "Narño", "mun": "El Charco", "area": 46.6, "dep_id": "narino"}, {"cat": "Santuario de Fauna", "nombre": "Acandí Playón y Playona", "dep": "Chocó", "mun": "Acandí", "area": 7.2, "dep_id": "choco"}];
  
  let _rdLastRows=[], _rdSortCol=null, _rdSortAsc=true;
  
  function renderRunapDetail(){
    const dep    = document.getElementById("sel-depto").value;
    const muni   = document.getElementById("sel-muni").value;
    const catSel = document.getElementById("sel-runap-cat")?.value||'todas';
    const DEPTO_LABELS = {antioquia:'Antioquia',choco:'Chocó',valle:'Valle del Cauca',narino:'Nariño',cauca:'Cauca',risaralda:'Risaralda',cordoba:'Córdoba'};
  
    // Filtrar registros
    let rows = RUNAP_DETAIL.filter(r=>{
      if(dep!=='todos' && r.dep_id!==dep) return false;
      if(muni!=='todos' && r.mun!==muni) return false;
      if(catSel!=='todas' && r.cat!==catSel) return false;
      return true;
    });
  
    const grandTot = rows.filter(r=>r.dep).reduce((s,r)=>s+r.area,0)||1;
    _rdLastRows = rows.map(r=>({...r, pct:r.area/grandTot*100}));
    _rdSortCol=null; _rdSortAsc=true;
  
    const fmtHa2 = v=>v>0?Number(v).toLocaleString("es-CO",{minimumFractionDigits:1,maximumFractionDigits:1})+" Ha":"—";
  
    const tbody = document.getElementById("runap-detail-tbody");
    if(tbody) tbody.innerHTML=_rdLastRows.map(r=>`<tr>
      <td>${r.cat||'—'}</td>
      <td style="font-weight:500">${r.nombre||'—'}</td>
      <td>${r.dep||'—'}</td>
      <td>${r.mun||'—'}</td>
      <td>${r.dep?fmtHa2(r.area):'—'}</td>
      <td>${r.dep?r.pct.toFixed(1)+'%':'—'}</td>
    </tr>`).join("");
  
    const tfoot = document.getElementById("runap-detail-tfoot");
    let totArea = rows.filter(r=>r.dep).reduce((s,r)=>s+r.area,0);
    if(dep==='todos'){
      // Usar el área agregada por departamento (más precisa que sumar filas individuales ya redondeadas)
      const gc = getRunapCounts('todos');
      if(catSel!=='todas'){
        if(gc.areas[catSel]!==undefined) totArea = gc.areas[catSel];
      } else {
        totArea = DATA_OTHER.runap.totalExact!==undefined ? DATA_OTHER.runap.totalExact : Object.values(gc.areas).reduce((s,v)=>s+v,0);
      }
    }
    if(tfoot) tfoot.innerHTML=`<tr style="border-top:1.5px solid var(--border2);background:var(--bg)">
      <td style="font-weight:600;padding:6px 8px;text-align:center;vertical-align:middle">Total</td>
      <td style="font-weight:600;padding:6px 8px;text-align:center;vertical-align:middle">${rows.length} registros</td>
      <td style="padding:6px 8px"></td>
      <td style="padding:6px 8px"></td>
      <td style="font-weight:600;padding:6px 8px;text-align:center;vertical-align:middle">${fmtHa2(totArea)}</td>
      <td style="font-weight:600;padding:6px 8px;text-align:center;vertical-align:middle">100%</td>
    </tr>`;
  
    // Reset sort arrows
    ['cat','nombre','dep','mun','area','pct'].forEach(k=>{
      const u=document.getElementById('rdsa-'+k+'-up');
      const d=document.getElementById('rdsa-'+k+'-down');
      if(u) u.classList.remove('active');
      if(d) d.classList.remove('active');
    });
  }
  
  function sortRunapDetail(col){
    if(_rdSortCol===col) _rdSortAsc=!_rdSortAsc;
    else { _rdSortCol=col; _rdSortAsc=col==='area'||col==='pct'?false:true; }
  
    const sorted=[..._rdLastRows].sort((a,b)=>{
      const va=a[col]||0, vb=b[col]||0;
      if(typeof va==='string') return _rdSortAsc?va.localeCompare(vb,'es'):vb.localeCompare(va,'es');
      return _rdSortAsc?va-vb:vb-va;
    });
  
    const fmtHa2=v=>v>0?Number(v).toLocaleString("es-CO",{minimumFractionDigits:1,maximumFractionDigits:1})+" Ha":"—";
    const tbody=document.getElementById("runap-detail-tbody");
    if(tbody) tbody.innerHTML=sorted.map(r=>`<tr>
      <td>${r.cat||'—'}</td>
      <td style="font-weight:500">${r.nombre||'—'}</td>
      <td>${r.dep||'—'}</td>
      <td>${r.mun||'—'}</td>
      <td>${r.dep?fmtHa2(r.area):'—'}</td>
      <td>${r.dep?r.pct.toFixed(1)+'%':'—'}</td>
    </tr>`).join("");
  
    ['cat','nombre','dep','mun','area','pct'].forEach(k=>{
      const u=document.getElementById('rdsa-'+k+'-up');
      const d=document.getElementById('rdsa-'+k+'-down');
      if(u) u.classList.remove('active');
      if(d) d.classList.remove('active');
    });
    const upEl=document.getElementById('rdsa-'+col+'-up');
    const dnEl=document.getElementById('rdsa-'+col+'-down');
    if(_rdSortAsc && upEl) upEl.classList.add('active');
    if(!_rdSortAsc && dnEl) dnEl.classList.add('active');
  }
  
  function renderRunap(){
    const dep = document.getElementById("sel-depto").value;
    const muniSel = document.getElementById("sel-muni").value;
    const catSel = document.getElementById("sel-runap-cat")?.value || 'todas';
    updateRunapCards(dep, muniSel);
    const cats = RUNAP_DATA.categorias;
    let deptos = RUNAP_DATA.deptos;
    let datos = cats.map(c=>({...c}));
  
    // Filtrar por categoría si hay una seleccionada
    if(catSel !== 'todas'){
      datos = datos.filter(c=>c.nombre === catSel);
    }
  
    if(dep !== 'todos'){
      const depNames={"choco":"Chocó","narino":"Nariño","antioquia":"Antioquia","cauca":"Cauca","valle":"Valle del Cauca","cordoba":"Córdoba","risaralda":"Risaralda"};
      const muniSel2 = document.getElementById("sel-muni").value;
      const muniData = RUNAP_MUNIS[dep] || [];
      let filteredMunis = muniSel2!=='todos' ? muniData.filter(m=>m.name===muniSel2) : muniData;
  
      // Si hay filtro de categoría, mostrar solo municipios que tienen esa categoría
      if(catSel !== 'todas'){
        filteredMunis = filteredMunis.filter(m=>(m[catSel]||0)>0);
      }
  
      // Ordenar de mayor a menor por área total
      filteredMunis = [...filteredMunis].sort((a,b)=>{
        const totA = datos.reduce((s,c)=>s+(a[c.nombre]||0),0);
        const totB = datos.reduce((s,c)=>s+(b[c.nombre]||0),0);
        return totB-totA;
      });
  
      deptos = filteredMunis.map(m=>m.name);
      datos = datos.map(c=>({...c, datos:filteredMunis.map(m=>m[c.nombre]||0)}));
    }
  
    // Leyenda
    document.getElementById("leg-runap").innerHTML=cats.map((c,i)=>
      `<span><span class="ldot" style="background:${RUNAP_COLORS[i%RUNAP_COLORS.length]}"></span>${c.nombre}</span>`
    ).join("");
  
    // Barras horizontales
    if(W._chartRunap){W._chartRunap.destroy();}
    W._chartRunap=new Chart(document.getElementById("ch-runap"),{
      type:"bar",
      data:{labels:deptos, datasets:datos.map((c,i)=>({
        label:c.nombre, data:c.datos,
        backgroundColor:RUNAP_COLORS[i%RUNAP_COLORS.length],
        borderRadius:3, borderSkipped:false
      }))},
      options:{indexAxis:"y",responsive:true,maintainAspectRatio:false,
        interaction:{mode:"index",axis:"y",intersect:false},
        plugins:{legend:{display:false},tooltip:{
          backgroundColor:"rgba(0,0,0,0.8)",
          titleColor:"#fff",bodyColor:"#fff",footerColor:"#fff",
          titleFont:{size:13,weight:"600"},bodyFont:{size:12},
          footerFont:{size:13,weight:"600"},footerMarginTop:8,
          padding:10,cornerRadius:4,
          callbacks:{
            title:items=>items[0].label,
            label:c=>" "+c.dataset.label+": "+Number(c.raw).toLocaleString("es-CO",{minimumFractionDigits:1,maximumFractionDigits:1})+" Ha",
            footer:items=>{
              const total=items.reduce((s,c)=>s+c.raw,0);
              return "Total RUNAP: "+total.toLocaleString("es-CO",{minimumFractionDigits:1,maximumFractionDigits:1})+" Ha";
            }
          }
        }},
        scales:{x:{stacked:true,grid:{color:"rgba(0,0,0,0.05)"},ticks:{font:{size:11},callback:v=>v>=1e6?(v/1e6).toFixed(1)+"M":v>=1000?(v/1000).toFixed(0)+"k":v}},
                y:{stacked:true,grid:{display:false},ticks:{font:{size:11}}}}}
    });
  
    // Dona
    const totsCat=datos.map(c=>c.datos.reduce((s,v)=>s+v,0));
    const totGen=totsCat.reduce((s,v)=>s+v,0)||1;
    const pcts=totsCat.map(v=>Math.round(v/totGen*1000)/10);
    document.getElementById("leg-runap-pie").innerHTML=cats.map((c,i)=>
      `<span><span class="ldot" style="background:${RUNAP_COLORS[i%RUNAP_COLORS.length]};border-radius:50%"></span>${c.nombre} ${pcts[i]}%</span>`
    ).join("");
    if(W._chartRunapPie){W._chartRunapPie.destroy();}
    W._chartRunapPie=new Chart(document.getElementById("ch-runap-pie"),{
      type:"doughnut",
      data:{labels:cats.map((c,i)=>c.nombre+" "+pcts[i]+"%"),datasets:[{data:pcts,backgroundColor:RUNAP_COLORS,borderWidth:2,borderColor:"#fff",hoverOffset:6}]},
      options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},cutout:"58%"}
    });
  
    // Restaurar visibilidad de todas las columnas siempre
    const CAT_TH_MAP = {
      'Parque Nacional Natural':'pnn',
      'Distritos Regionales de Manejo Integrado':'drmi',
      'Reservas Forestales Protectoras Nacionales':'rfpn',
      'Distritos Nacionales de Manejo Integrado':'dnmi',
      'Reservas Forestales Protectoras Regionales':'rfpr',
      'Parques Naturales Regionales':'pnr',
      'Santuario de Fauna':'sf',
      'Distritos de Conservación de Suelos':'dcs',
      'Reserva Natural de la Sociedad Civil':'rnsc'
    };
    const allThIds = ['pnn','drmi','rfpn','dnmi','rfpr','pnr','sf','dcs','rnsc'];
    allThIds.forEach(id=>{
      const th = document.getElementById('rth-'+id);
      if(th) th.style.display = '';
    });
  
    // Tabla
    const tbody=document.getElementById("runap-tbody");
    if(tbody){
      let tblRows;
      if(dep!=='todos' && RUNAP_MUNIS[dep]){
        let munis=RUNAP_MUNIS[dep];
        if(muniSel!=='todos') munis=munis.filter(m=>m.name===muniSel);
        const grandTot = catSel==='todas'
          ? munis.reduce((s,m)=>s+cats.reduce((ss,c)=>ss+(m[c.nombre]||0),0),0)||1
          : munis.reduce((s,m)=>s+(m[catSel]||0),0)||1;
        const runapDepNames={"choco":"Chocó","narino":"Nariño","antioquia":"Antioquia","cauca":"Cauca","valle":"Valle del Cauca","cordoba":"Córdoba","risaralda":"Risaralda"};
        document.getElementById("runap-col-muni").style.display = "";
        document.getElementById("runap-tbl-title").textContent = "Detalle — áreas de conservación por municipio";
        const runapDepLabel = runapDepNames[dep]||dep;
        const filtMunis = munis.filter(m=>cats.reduce((s,c)=>s+(m[c.nombre]||0),0)>0);
        _rSortCol=null; _rSortAsc=true;
        _rLastRows=filtMunis.map(m=>{
          const vals=cats.map(c=>m[c.nombre]||0); const tot=vals.reduce((s,v)=>s+v,0);
          return {depto:runapDepLabel,muni:m.name,pnn:vals[0],drmi:vals[1],rfpn:vals[2],dnmi:vals[3],rfpr:vals[4],pnr:vals[5],sf:vals[6],dcs:vals[7],rnsc:vals[8],total:tot,pct:tot/grandTot*100};
        });
        const catIdxMuni = catSel==='todas' ? -1 : cats.findIndex(c=>c.nombre===catSel);
        tbody.innerHTML=filtMunis.map(m=>{
          const allVals=cats.map(c=>m[c.nombre]||0);
          const tot=catSel==='todas'?allVals.reduce((s,v)=>s+v,0):(allVals[catIdxMuni]||0);
          if(tot===0 && catSel!=='todas') return '';
          if(catSel==='todas' && tot===0) return '';
          const cellsHTML=allVals.map((v,ci)=>{
            if(catSel!=='todas' && ci!==catIdxMuni) return `<td>—</td>`;
            return v>0?`<td>${Number(v).toLocaleString("es-CO",{minimumFractionDigits:1,maximumFractionDigits:1})} Ha</td>`:`<td>—</td>`;
          }).join("");
          return `<tr><td style="font-weight:500">${runapDepLabel}</td>
            <td style="font-weight:500">${m.name}</td>
            ${cellsHTML}
            <td style="white-space:nowrap">${Number(tot).toLocaleString("es-CO",{minimumFractionDigits:1,maximumFractionDigits:1})} Ha</td>
            <td>${(tot/grandTot*100).toFixed(1)}%</td></tr>`;
        }).join("");
        const tfoot1=document.getElementById("runap-tfoot");
        if(tfoot1){
          const totVals=cats.map(c=>{
            if(catSel!=='todas' && c.nombre!==catSel) return 0;
            return filtMunis.reduce((s,m)=>s+(m[c.nombre]||0),0);
          });
          const totT=totVals.reduce((s,v)=>s+v,0);
          tfoot1.innerHTML=`<tr style="border-top:1.5px solid var(--border2);background:var(--bg)"><td style="font-weight:600;padding:6px 8px;text-align:center;vertical-align:middle">Total</td><td style="font-weight:600;padding:6px 8px;text-align:center;vertical-align:middle"></td>${totVals.map(v=>`<td style="font-weight:600;padding:6px 8px;text-align:center;vertical-align:middle">${v>0?Number(v).toLocaleString("es-CO",{minimumFractionDigits:1,maximumFractionDigits:1})+" Ha":"—"}</td>`).join("")}<td style="font-weight:600;padding:6px 8px;text-align:center;vertical-align:middle">${Number(totT).toLocaleString("es-CO",{minimumFractionDigits:1,maximumFractionDigits:1})} Ha</td><td style="font-weight:600;padding:6px 8px;text-align:center;vertical-align:middle">100%</td></tr>`;
        }    } else {
        document.getElementById("runap-col-muni").style.display = "none";
        document.getElementById("runap-tbl-title").textContent = "Detalle — áreas de conservación por departamento";
        const catIdxG=catSel==='todas'?-1:cats.findIndex(c=>c.nombre===catSel);
        const grandTot=catSel==='todas'
          ? (datos[0]?.datos.reduce((s,_,i)=>s+datos.reduce((ss,c)=>ss+c.datos[i],0),0)||1)
          : (cats[catIdxG]?.datos.reduce((s,v)=>s+v,0)||1);
        _rSortCol=null; _rSortAsc=true;
  
        // Filtrar filas: si hay categoría, excluir deptos con valor 0
        const deptosFiltered = catSel==='todas'
          ? deptos
          : deptos.filter((_,i)=>datos.reduce((s,c)=>s+(c.datos[i]||0),0)>0);
        const idxMap = deptosFiltered.map(d=>deptos.indexOf(d));
  
        _rLastRows=deptosFiltered.map((d,ii)=>{
          const i=idxMap[ii];
          const vals=datos.map(c=>c.datos[i]||0); const tot=vals.reduce((s,v)=>s+v,0);
          return {depto:d,pnn:vals[0],drmi:vals[1],rfpn:vals[2],dnmi:vals[3],rfpr:vals[4],pnr:vals[5],sf:vals[6],dcs:vals[7],rnsc:vals[8],total:tot,pct:tot/grandTot*100};
        });
        tbody.innerHTML=deptosFiltered.map((d,ii)=>{
          const i=idxMap[ii];
          // Usar cats (todas las categorías) para generar 9 columnas siempre
          const allVals=cats.map(c=>c.datos[i]||0);
          const catIdx=catSel==='todas'?-1:cats.findIndex(c=>c.nombre===catSel);
          const tot=catSel==='todas'?allVals.reduce((s,v)=>s+v,0):(allVals[catIdx]||0);
          const cellsHTML=allVals.map((v,ci)=>{
            if(catSel!=='todas' && ci!==catIdx) return `<td>—</td>`;
            return v>0?`<td>${Number(v).toLocaleString("es-CO",{minimumFractionDigits:1,maximumFractionDigits:1})} Ha</td>`:`<td>—</td>`;
          }).join("");
          return `<tr><td style="font-weight:500">${d}</td>
            ${cellsHTML}
            <td style="white-space:nowrap">${Number(tot).toLocaleString("es-CO",{minimumFractionDigits:1,maximumFractionDigits:1})} Ha</td>
            <td>${(tot/grandTot*100).toFixed(1)}%</td></tr>`;
        }).join("");
        const tfoot2=document.getElementById("runap-tfoot");
        if(tfoot2){
          // Construir totales usando cats (9 columnas) con datos correctamente mapeados
          const totVals=cats.map(c=>{
            const dataEntry=datos.find(d=>d.nombre===c.nombre);
            return dataEntry ? dataEntry.datos.reduce((s,v)=>s+v,0) : 0;
          });
          const totT=totVals.reduce((s,v)=>s+v,0);
          tfoot2.innerHTML=`<tr style="border-top:1.5px solid var(--border2);background:var(--bg)"><td style="font-weight:600;padding:6px 8px;text-align:center;vertical-align:middle">Total</td>${totVals.map(v=>`<td style="font-weight:600;padding:6px 8px;text-align:center;vertical-align:middle">${v>0?Number(v).toLocaleString("es-CO",{minimumFractionDigits:1,maximumFractionDigits:1})+" Ha":"—"}</td>`).join("")}<td style="font-weight:600;padding:6px 8px;text-align:center;vertical-align:middle">${Number(totT).toLocaleString("es-CO",{minimumFractionDigits:1,maximumFractionDigits:1})} Ha</td><td style="font-weight:600;padding:6px 8px;text-align:center;vertical-align:middle">100%</td></tr>`;
        }
      }
    }
    renderRunapDetail();
  }
  
  const PARAMOS_DETAIL=[{"nombre": "Cerro Plateado", "dep": "Cauca", "dep_id": "cauca", "mun": "Argelia", "area": 5407.9}, {"nombre": "Cerro Plateado", "dep": "Cauca", "dep_id": "cauca", "mun": "El Tambo", "area": 223.5}, {"nombre": "Cerro Plateado", "dep": "Cauca", "dep_id": "cauca", "mun": "Guapi", "area": 4700.0}, {"nombre": "Cerro Plateado", "dep": "Cauca", "dep_id": "cauca", "mun": "Timbiquí", "area": 575.2}, {"nombre": "Cerro Plateado", "dep": "Nariño", "dep_id": "narino", "mun": "El Charco", "area": 3467.1}, {"nombre": "Chiles Cumbal", "dep": "Nariño", "dep_id": "narino", "mun": "Cumbal", "area": 18065.2}, {"nombre": "Chiles Cumbal", "dep": "Nariño", "dep_id": "narino", "mun": "Cumbitara", "area": 433.2}, {"nombre": "Chiles Cumbal", "dep": "Nariño", "dep_id": "narino", "mun": "La Llanada", "area": 500.4}, {"nombre": "Chiles Cumbal", "dep": "Nariño", "dep_id": "narino", "mun": "Los Andes", "area": 698.7}, {"nombre": "Chiles Cumbal", "dep": "Nariño", "dep_id": "narino", "mun": "Mallama", "area": 9427.9}, {"nombre": "Chiles Cumbal", "dep": "Nariño", "dep_id": "narino", "mun": "Santa Cruz", "area": 1340.5}, {"nombre": "Chiles Cumbal", "dep": "Nariño", "dep_id": "narino", "mun": "Sapuyes", "area": 693.8}, {"nombre": "Citará", "dep": "Chocó", "dep_id": "choco", "mun": "Bagadó", "area": 2147.2}, {"nombre": "Citará", "dep": "Chocó", "dep_id": "choco", "mun": "El Carmen", "area": 1745.1}, {"nombre": "Citará", "dep": "Risaralda", "dep_id": "risaralda", "mun": "Mistrató", "area": 1043.7}, {"nombre": "El Duende", "dep": "Chocó", "dep_id": "choco", "mun": "El Litoral Del San Juán", "area": 2665.1}, {"nombre": "El Duende", "dep": "Valle del Cauca", "dep_id": "valle", "mun": "Bolívar", "area": 180.7}, {"nombre": "El Duende", "dep": "Valle del Cauca", "dep_id": "valle", "mun": "Calima", "area": 1064.4}, {"nombre": "El Duende", "dep": "Valle del Cauca", "dep_id": "valle", "mun": "Trujillo", "area": 41.8}, {"nombre": "Farallones de Cali", "dep": "Valle del Cauca", "dep_id": "valle", "mun": "Buenaventura", "area": 1820.5}, {"nombre": "Frontino – Urrao \"Del Sol Las Alegrías", "dep": "Antioquia", "dep_id": "antioquia", "mun": "Abriaquí", "area": 1619.9}, {"nombre": "Frontino – Urrao \"Del Sol Las Alegrías", "dep": "Antioquia", "dep_id": "antioquia", "mun": "Cañasgordas", "area": 85.9}, {"nombre": "Frontino – Urrao \"Del Sol Las Alegrías", "dep": "Antioquia", "dep_id": "antioquia", "mun": "Frontino", "area": 588.5}, {"nombre": "Frontino – Urrao \"Del Sol Las Alegrías", "dep": "Antioquia", "dep_id": "antioquia", "mun": "Urrao", "area": 9233.7}, {"nombre": "Frontino – Urrao \"Del Sol Las Alegrías", "dep": "Chocó", "dep_id": "choco", "mun": "El Carmen", "area": 856.0}, {"nombre": "Paramillo", "dep": "Antioquia", "dep_id": "antioquia", "mun": "Dabeiba", "area": 2626.6}, {"nombre": "Paramillo", "dep": "Antioquia", "dep_id": "antioquia", "mun": "Ituango", "area": 1585.5}, {"nombre": "Paramillo", "dep": "Antioquia", "dep_id": "antioquia", "mun": "Mutatá", "area": 44.7}, {"nombre": "Tatamá", "dep": "Chocó", "dep_id": "choco", "mun": "San José Del Palmar", "area": 6650.5}, {"nombre": "Tatamá", "dep": "Chocó", "dep_id": "choco", "mun": "Tadó", "area": 909.7}, {"nombre": "Tatamá", "dep": "Risaralda", "dep_id": "risaralda", "mun": "Pueblo Rico", "area": 1645.7}];
  
  let _pdLastRows=[], _pdSortCol=null, _pdSortAsc=true;
  
  function renderParamosDetail(){
    const dep    = document.getElementById("sel-depto").value;
    const muni   = document.getElementById("sel-muni").value;
    const catSel = document.getElementById("sel-paramo-cat")?.value||'todos';
  
    let rows = PARAMOS_DETAIL.filter(r=>{
      if(dep!=='todos' && r.dep_id!==dep) return false;
      if(muni!=='todos' && r.mun!==muni) return false;
      if(catSel!=='todos' && r.nombre!==catSel) return false;
      return true;
    });
  
    const grandTot = rows.reduce((s,r)=>s+r.area,0)||1;
    _pdLastRows = rows.map(r=>({...r, pct:r.area/grandTot*100}));
    _pdSortCol=null; _pdSortAsc=true;
  
    const fmtA = v=>Number(v).toLocaleString("es-CO",{minimumFractionDigits:1,maximumFractionDigits:1})+" Ha";
  
    const tbody = document.getElementById("paramos-detail-tbody");
    if(tbody) tbody.innerHTML=_pdLastRows.map(r=>`<tr>
      <td style="font-weight:500">${r.nombre}</td>
      <td>${r.dep}</td>
      <td>${r.mun}</td>
      <td>${fmtA(r.area)}</td>
      <td>${r.pct.toFixed(1)}%</td>
    </tr>`).join("");
  
    const totArea = rows.reduce((s,r)=>s+r.area,0);
    const tfoot = document.getElementById("paramos-detail-tfoot");
    if(tfoot) tfoot.innerHTML=`<tr style="border-top:1.5px solid var(--border2);background:var(--bg)">
      <td style="font-weight:600;padding:6px 8px;text-align:center;vertical-align:middle">Total</td>
      <td style="font-weight:600;padding:6px 8px;text-align:center;vertical-align:middle">${rows.length} registros</td>
      <td style="padding:6px 8px"></td>
      <td style="font-weight:600;padding:6px 8px;text-align:center;vertical-align:middle">${fmtA(totArea)}</td>
      <td style="font-weight:600;padding:6px 8px;text-align:center;vertical-align:middle">100%</td>
    </tr>`;
  
    ['nombre','dep','mun','area','pct'].forEach(k=>{
      const u=document.getElementById('pdsa-'+k+'-up');
      const d=document.getElementById('pdsa-'+k+'-down');
      if(u) u.classList.remove('active');
      if(d) d.classList.remove('active');
    });
  }
  
  function sortParamosDetail(col){
    if(_pdSortCol===col) _pdSortAsc=!_pdSortAsc;
    else { _pdSortCol=col; _pdSortAsc=col==='area'||col==='pct'?false:true; }
  
    const sorted=[..._pdLastRows].sort((a,b)=>{
      const va=a[col]||0, vb=b[col]||0;
      if(typeof va==='string') return _pdSortAsc?va.localeCompare(vb,'es'):vb.localeCompare(va,'es');
      return _pdSortAsc?va-vb:vb-va;
    });
  
    const fmtA=v=>Number(v).toLocaleString("es-CO",{minimumFractionDigits:1,maximumFractionDigits:1})+" Ha";
    const tbody=document.getElementById("paramos-detail-tbody");
    if(tbody) tbody.innerHTML=sorted.map(r=>`<tr>
      <td style="font-weight:500">${r.nombre}</td>
      <td>${r.dep}</td>
      <td>${r.mun}</td>
      <td>${fmtA(r.area)}</td>
      <td>${r.pct.toFixed(1)}%</td>
    </tr>`).join("");
  
    ['nombre','dep','mun','area','pct'].forEach(k=>{
      const u=document.getElementById('pdsa-'+k+'-up');
      const d=document.getElementById('pdsa-'+k+'-down');
      if(u) u.classList.remove('active');
      if(d) d.classList.remove('active');
    });
    const upEl=document.getElementById('pdsa-'+col+'-up');
    const dnEl=document.getElementById('pdsa-'+col+'-down');
    if(_pdSortAsc && upEl) upEl.classList.add('active');
    if(!_pdSortAsc && dnEl) dnEl.classList.add('active');
  }
  
  function onParamoCatChange(){
    const catSel = document.getElementById("sel-paramo-cat").value;
    const selMuni = document.getElementById("sel-muni");
    const selDepto = document.getElementById("sel-depto");
    const deptoNombres={antioquia:'Antioquia',cauca:'Cauca',choco:'Chocó',narino:'Nariño',risaralda:'Risaralda',valle:'Valle del Cauca'};
    const DEPTO_IDS={Antioquia:'antioquia',Cauca:'cauca',Chocó:'choco',Nariño:'narino',Risaralda:'risaralda','Valle del Cauca':'valle'};
    const deptosTodos=['antioquia','cauca','choco','narino','risaralda','valle'];
  
    const currentMuni = selMuni.value; // preservar municipio actual
    selMuni.innerHTML='<option value="todos">Todos los municipios</option>';
  
    const origOnchange=selDepto.onchange;
    selDepto.onchange=null;
    const currentDep=selDepto.value;
    selDepto.innerHTML='<option value="todos">Todos los departamentos</option>';
  
    if(catSel!=='todos'){
      const paramoCat=PARAMOS_DATA.paramos.find(p=>p.nombre===catSel);
      if(paramoCat){
        PARAMOS_DATA.deptos.forEach((dname,i)=>{
          if((paramoCat.datos[i]||0)>0){
            const did=DEPTO_IDS[dname];
            if(did){ const o=document.createElement("option"); o.value=did; o.textContent=deptoNombres[did]; selDepto.appendChild(o); }
          }
        });
      }
    } else {
      deptosTodos.forEach(id=>{ const o=document.createElement("option"); o.value=id; o.textContent=deptoNombres[id]; selDepto.appendChild(o); });
    }
  
    const opts=Array.from(selDepto.options).map(o=>o.value);
    selDepto.value=opts.includes(currentDep)?currentDep:'todos';
    selDepto.onchange=origOnchange;
  
    // Flujo 1: si hay depto seleccionado, filtrar municipios
    const dep2=selDepto.value;
    if(dep2!=='todos'){
      const munis=(PARAMOS_MUNIS[dep2]||[]).filter(m=>catSel==='todos'||(m[catSel]||0)>0);
      [...munis].sort((a,b)=>a.name.localeCompare(b.name,'es')).forEach(m=>{
        const o=document.createElement("option"); o.value=m.name; o.textContent=m.name; selMuni.appendChild(o);
      });
      // Restaurar municipio si sigue disponible con el nuevo complejo/departamento
      const muniOpts=Array.from(selMuni.options).map(o=>o.value);
      if(muniOpts.includes(currentMuni)) selMuni.value=currentMuni;
    }
  
    render();
  }
  
  
  function renderParamos(){
    const dep = document.getElementById("sel-depto").value;
    const muniSel = document.getElementById("sel-muni").value;
    const catSel = document.getElementById("sel-paramo-cat")?.value || 'todos';
    const pdata = PARAMOS_DATA;
    let deptos = pdata.deptos;
    let datos = pdata.paramos.map(p=>({...p}));
  
    // Filtrar por complejo paramuno si hay uno seleccionado
    if(catSel !== 'todos'){
      datos = datos.filter(p=>p.nombre===catSel);
    }
  
    if(dep !== 'todos'){
      const depNames={"choco":"Chocó","narino":"Nariño","antioquia":"Antioquia","cauca":"Cauca","valle":"Valle del Cauca","cordoba":"Córdoba","risaralda":"Risaralda"};
      const dname=depNames[dep];
  
      if(muniSel === 'todos' && PARAMOS_MUNIS[dep]){
        // Mostrar municipios del departamento ordenados por área total de mayor a menor
        const munis = PARAMOS_MUNIS[dep];
        // Filtrar municipios que tienen el complejo seleccionado
        const munisFiltered = catSel!=='todos' ? munis.filter(m=>(m[catSel]||0)>0) : munis;
        const munisSorted = [...munisFiltered].sort((a,b)=>{
          const totA = datos.reduce((s,p)=>s+(a[p.nombre]||0),0);
          const totB = datos.reduce((s,p)=>s+(b[p.nombre]||0),0);
          return totB-totA;
        });
        deptos = munisSorted.map(m=>m.name);
        datos = datos.map(p=>({...p, datos:munisSorted.map(m=>m[p.nombre]||0)}));
      } else {
        // Municipio específico seleccionado
        const idx=pdata.deptos.indexOf(dname);
        if(idx>-1){
          deptos=[dname];
          datos=datos.map(p=>({...p,datos:[p.datos[idx]]}));
        }
      }
    }
  
    // Filtrar por municipio si está seleccionado
    if(muniSel !== 'todos' && PARAMOS_MUNIS[dep]){
      const muniData = PARAMOS_MUNIS[dep].filter(m=>m.name===muniSel);
      if(muniData.length){
        deptos=[muniSel];
        datos=pdata.paramos.map(p=>({...p,datos:[muniData[0][p.nombre]||0]}));
      }
    }
  
    // Filtrar páramos con área > 0
    const activeDatos = datos.filter(p=>p.datos.reduce((s,v)=>s+v,0)>0);
  
    // Actualizar tarjeta métrica
    const totalParamosCount = activeDatos.length;
    const totalParamosHa = activeDatos.reduce((s,p)=>s+p.datos.reduce((ss,v)=>ss+v,0),0);
    const countEl = document.getElementById("paramos-total-count");
    const haEl = document.getElementById("paramos-total-ha");
    if(countEl) countEl.textContent = totalParamosCount;
    if(haEl) haEl.textContent = Number(totalParamosHa).toLocaleString("es-CO",{minimumFractionDigits:1,maximumFractionDigits:1})+" Ha";
    const activeColors = activeDatos.map(p=>PARAMOS_COLORS[pdata.paramos.findIndex(x=>x.nombre===p.nombre)%PARAMOS_COLORS.length]);
  
    // Leyenda
    document.getElementById("leg-paramos").innerHTML = activeDatos.map((p,i)=>
      `<span><span class="ldot" style="background:${activeColors[i]}"></span>${p.nombre}</span>`
    ).join("");
  
    // Barras horizontales apiladas
    if(W._chartParamos){W._chartParamos.destroy();}
    W._chartParamos = new Chart(document.getElementById("ch-paramos-bar"),{
      type:"bar",
      data:{labels:deptos, datasets:activeDatos.map((p,i)=>({
        label:p.nombre, data:p.datos,
        backgroundColor:activeColors[i], borderRadius:3, borderSkipped:false
      }))},
      options:{indexAxis:"y",responsive:true,maintainAspectRatio:false,
        interaction:{mode:"index",axis:"y",intersect:false},
        plugins:{legend:{display:false},tooltip:{
          backgroundColor:"rgba(0,0,0,0.8)",
          titleColor:"#fff",bodyColor:"#fff",footerColor:"#fff",
          titleFont:{size:13,weight:"600"},bodyFont:{size:12},
          footerFont:{size:13,weight:"600"},footerMarginTop:8,
          padding:10,cornerRadius:4,
          callbacks:{
            title:items=>items[0].label,
            label:c=>" "+c.dataset.label+": "+Number(c.raw).toLocaleString("es-CO",{minimumFractionDigits:1,maximumFractionDigits:1})+" Ha",
            footer:items=>{
              const total=items.reduce((s,c)=>s+c.raw,0);
              return "Total páramos: "+total.toLocaleString("es-CO",{minimumFractionDigits:1,maximumFractionDigits:1})+" Ha";
            }
          }
        }},
        scales:{x:{stacked:true,grid:{color:"rgba(0,0,0,0.05)"},ticks:{font:{size:11},callback:v=>v>=1000?(v/1000).toFixed(0)+"k":v}},
                y:{stacked:true,grid:{display:false},ticks:{font:{size:11}}}}}
    });
  
    // Dona
    const tots=activeDatos.map(p=>p.datos.reduce((s,v)=>s+v,0));
    const totGen=tots.reduce((s,v)=>s+v,0)||1;
    const pcts=tots.map(v=>Math.round(v/totGen*1000)/10);
    document.getElementById("leg-paramos-pie").innerHTML=activeDatos.map((p,i)=>
      `<span><span class="ldot" style="background:${activeColors[i]};border-radius:50%"></span>${p.nombre} ${pcts[i]}%</span>`
    ).join("");
    if(W._chartParamosPie){W._chartParamosPie.destroy();}
    W._chartParamosPie=new Chart(document.getElementById("ch-paramos-pie"),{
      type:"doughnut",
      data:{labels:activeDatos.map((p,i)=>p.nombre+" "+pcts[i]+"%"),datasets:[{data:pcts,backgroundColor:activeColors,borderWidth:2,borderColor:"#fff",hoverOffset:6}]},
      options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},cutout:"58%"}
    });
  
    // Tabla
    const tbody=document.getElementById("paramos-tbody");
    const thead=document.getElementById("paramos-thead");
    const parNames=activeDatos.map(p=>p.nombre);
    const paramDepNames={"choco":"Chocó","narino":"Nariño","antioquia":"Antioquia","cauca":"Cauca","valle":"Valle del Cauca","cordoba":"Córdoba","risaralda":"Risaralda"};
    const showParamMuniCol = dep !== 'todos';
  
    // Resetear sort
    _pSortCol=null; _pSortAsc=true;
  
    const mkTh=(col,label,isText,w='')=>`<th style="position:relative${w?';width:'+w:''}">
      <div class="th-inner" data-on-click="sortParamosTable('${col}')"><span class="th-label">${label}</span><div class="sort-btn"><div class="sort-arrow up" id="psa-${col}-up"></div><div class="sort-arrow down" id="psa-${col}-down"></div></div></div>
      <div class="col-tip" id="ptip-${col}">${isText?'Clic para ordenar A→Z / Z→A':'Clic para ordenar menor→mayor / mayor→menor'}</div>
    </th>`;
  
    if(showParamMuniCol){
      thead.innerHTML=`<tr style="vertical-align:middle">${mkTh('depto','Departamento',true,'14%')}${mkTh('muni','Municipio',true,'14%')}${parNames.map((n,i)=>mkTh('p'+i,n+' (Ha)',false)).join("")}${mkTh('total','Total (Ha)',false,'9%')}${mkTh('pct','%',false,'5%')}</tr>`;
      document.getElementById("paramos-tbl-title").textContent = "Detalle — páramos por municipio";
    } else {
      thead.innerHTML=`<tr style="vertical-align:middle">${mkTh('depto','Departamento',true,'16%')}${parNames.map((n,i)=>mkTh('p'+i,n+' (Ha)',false)).join("")}${mkTh('total','Total (Ha)',false,'9%')}${mkTh('pct','%',false,'5%')}</tr>`;
      document.getElementById("paramos-tbl-title").textContent = "Detalle — páramos por departamento";
    }
  
    if(dep!=='todos' && PARAMOS_MUNIS[dep]){
      let munis=PARAMOS_MUNIS[dep];
      if(muniSel!=='todos') munis=munis.filter(m=>m.name===muniSel);
      const grandTot=munis.reduce((s,m)=>s+parNames.reduce((ss,p)=>ss+(m[p]||0),0),0)||1;
      const paramDepLabel = paramDepNames[dep]||dep;
      _pModoMuni=true; _pParNames=parNames; _pSortCol=null; _pSortAsc=true;
      _pLastRows=munis.filter(m=>parNames.reduce((s,p)=>s+(m[p]||0),0)>0).map(m=>{
        const vals=parNames.map(p=>m[p]||0); const tot=vals.reduce((s,v)=>s+v,0);
        const r={depto:paramDepLabel,muni:m.name,total:tot,pct:tot/grandTot*100};
        vals.forEach((v,i)=>r['p'+i]=v); return r;
      });
      tbody.innerHTML=munis.map(m=>{
        const vals=parNames.map(p=>m[p]||0);
        const tot=vals.reduce((s,v)=>s+v,0);
        if(tot===0) return '';
        return `<tr><td style="font-weight:500">${paramDepLabel}</td>
          <td style="font-weight:500">${m.name}</td>
          ${vals.map(v=>v>0?`<td>${Number(v).toLocaleString("es-CO",{minimumFractionDigits:1,maximumFractionDigits:1})} Ha</td>`:`<td>—</td>`).join("")}
          <td style="white-space:nowrap">${Number(tot).toLocaleString("es-CO",{minimumFractionDigits:1,maximumFractionDigits:1})} Ha</td>
          <td>${(tot/grandTot*100).toFixed(1)}%</td></tr>`;
      }).join("");
      const ptfoot1=document.getElementById("paramos-tfoot");
      if(ptfoot1){
        const totVals=parNames.map(p=>munis.reduce((s,m)=>s+(m[p]||0),0));
        let totT=totVals.reduce((s,v)=>s+v,0);
        if(muniSel==='todos' && catSel==='todos'){
          const deptoRefP = (DATA_OTHER.paramos.deptos||[]).find(x=>x.id===dep);
          if(deptoRefP) totT = deptoRefP.area;
        }
        ptfoot1.innerHTML=`<tr style="border-top:1.5px solid var(--border2);background:var(--bg)">
          <td style="font-weight:600;padding:6px 8px;text-align:center;vertical-align:middle">${paramDepLabel}</td>
          <td style="font-weight:600;padding:6px 8px;text-align:center;vertical-align:middle">Total</td>
          ${totVals.map(v=>`<td style="font-weight:600;padding:6px 8px;text-align:center;vertical-align:middle">${v>0?Number(v).toLocaleString("es-CO",{minimumFractionDigits:1,maximumFractionDigits:1})+" Ha":"—"}</td>`).join("")}
          <td style="font-weight:600;padding:6px 8px;text-align:center;vertical-align:middle">${Number(totT).toLocaleString("es-CO",{minimumFractionDigits:1,maximumFractionDigits:1})} Ha</td>
          <td style="font-weight:600;padding:6px 8px;text-align:center;vertical-align:middle">100%</td>
        </tr>`;
      }
    } else {
      const grandTot=activeDatos[0]?activeDatos[0].datos.reduce((s,_,i)=>s+activeDatos.reduce((ss,p)=>ss+p.datos[i],0),0)||1:1;
      _pModoMuni=false; _pParNames=parNames; _pSortCol=null; _pSortAsc=true;
      _pLastRows=deptos.map((d,i)=>{
        const vals=activeDatos.map(p=>p.datos[i]||0); const tot=vals.reduce((s,v)=>s+v,0);
        if(tot===0) return null;
        const r={depto:d,total:tot,pct:tot/grandTot*100};
        vals.forEach((v,j)=>r['p'+j]=v); return r;
      }).filter(Boolean);
      tbody.innerHTML=deptos.map((d,i)=>{
        const vals=activeDatos.map(p=>p.datos[i]||0);
        const tot=vals.reduce((s,v)=>s+v,0);
        if(tot===0) return '';
        return `<tr><td style="font-weight:500">${d}</td>
          ${vals.map(v=>v>0?`<td>${Number(v).toLocaleString("es-CO",{minimumFractionDigits:1,maximumFractionDigits:1})} Ha</td>`:`<td>—</td>`).join("")}
          <td style="white-space:nowrap">${Number(tot).toLocaleString("es-CO",{minimumFractionDigits:1,maximumFractionDigits:1})} Ha</td>
          <td>${(tot/grandTot*100).toFixed(1)}%</td></tr>`;
      }).join("");
      const ptfoot2=document.getElementById("paramos-tfoot");
      if(ptfoot2){
        const totVals=activeDatos.map(p=>p.datos.reduce((s,v)=>s+v,0));
        let totT=totVals.reduce((s,v)=>s+v,0);
        if(catSel==='todos'){
          totT = (DATA_OTHER.paramos.deptos||[]).reduce((s,x)=>s+x.area,0);
        }
        ptfoot2.innerHTML=`<tr style="border-top:1.5px solid var(--border2);background:var(--bg)">
          <td style="font-weight:600;padding:6px 8px;text-align:center;vertical-align:middle">Total</td>
          ${totVals.map(v=>`<td style="font-weight:600;padding:6px 8px;text-align:center;vertical-align:middle">${v>0?Number(v).toLocaleString("es-CO",{minimumFractionDigits:1,maximumFractionDigits:1})+" Ha":"—"}</td>`).join("")}
          <td style="font-weight:600;padding:6px 8px;text-align:center;vertical-align:middle">${Number(totT).toLocaleString("es-CO",{minimumFractionDigits:1,maximumFractionDigits:1})} Ha</td>
          <td style="font-weight:600;padding:6px 8px;text-align:center;vertical-align:middle">100%</td>
        </tr>`;
      }
    }
    renderParamosDetail();
  }
  
  const CIENAGAS_DATA = {
    antioquia: {
      'Necoclí': [
        {n:"Ciénaga Marimonda", a:1019.2},
        {n:"Sin nombre", a:220.9},
        {n:"Sin nombre", a:20.7},
        {n:"Sin nombre", a:8.6},
        {n:"Sin nombre", a:3.6},
        {n:"Ciénaga del Volcán", a:3.1},
        {n:"Cienaga del Río Negro", a:0.3},
      ],
      'Vigía Del Fuerte': [
        {n:"Ciénaga de Los Platillos", a:566.0},
        {n:"Ciénaga Grande Chicaravia", a:371.5},
        {n:"Ciénaga Despencita", a:158.9},
        {n:"Ciénaga El Muerto", a:125.3},
        {n:"Ciénaga de Los Platillos", a:104.0},
        {n:"Ciénaga El Garzón", a:87.9},
        {n:"Ciénaga El Espinal", a:78.3},
        {n:"Sin nombre", a:76.2},
        {n:"Ciénaga Despencita", a:76.1},
        {n:"Sin nombre", a:75.2},
        {n:"Ciénega Los Pozos", a:70.9},
        {n:"Sin nombre", a:68.1},
        {n:"Ciénaga El Espinal", a:65.8},
        {n:"Ciénaga Bernal", a:63.0},
        {n:"Ciénaga Ñarangué", a:54.1},
        {n:"Sin nombre", a:50.3},
        {n:"Ciénaga Pone la Olla", a:49.9},
        {n:"Ciénaga El Guaco", a:46.0},
        {n:"Ciénaga El Perro", a:42.7},
        {n:"Ciénaga Sabanazo", a:41.3},
        {n:"Sin nombre", a:40.1},
        {n:"Ciénaga Simón", a:35.0},
        {n:"Sin nombre", a:30.5},
        {n:"Ciénaga El Callejón", a:29.2},
        {n:"Ciénaga Redondita", a:29.0},
        {n:"Ciénaga de Los Platillos", a:28.4},
        {n:"Sin nombre", a:24.7},
        {n:"Sin nombre", a:20.4},
        {n:"Sin nombre", a:19.8},
        {n:"Sin nombre", a:18.3},
        {n:"Ciénaga Pone la Olla", a:18.2},
        {n:"Ciénaga de Los Platillos", a:15.5},
        {n:"Sin nombre", a:14.8},
        {n:"Ciénaga de Los Platillos", a:14.0},
        {n:"Ciénagas Juan Ignacio", a:13.3},
        {n:"Ciénaga El Cucho", a:12.9},
        {n:"Sin nombre", a:12.9},
        {n:"Sin nombre", a:12.8},
        {n:"Ciénaga Rujero", a:9.9},
        {n:"Sin nombre", a:9.5},
        {n:"Ciénaga La Garcita", a:9.0},
        {n:"Sin nombre", a:9.0},
        {n:"Ciénaga La Compañía", a:8.5},
        {n:"Sin nombre", a:8.3},
        {n:"Ciénaga Valencia", a:8.2},
        {n:"Ciénaga Palo Blanco", a:7.5},
        {n:"Sin nombre", a:7.2},
        {n:"Ciénagas Juan Ignacio", a:7.1},
        {n:"Sin nombre", a:7.0},
        {n:"Ciénaga de Los Platillos", a:6.8},
        {n:"Ciénagas Juan Ignacio", a:6.7},
        {n:"Ciénaga Barrancón", a:6.6},
        {n:"Sin nombre", a:6.6},
        {n:"Sin nombre", a:6.6},
        {n:"Sin nombre", a:6.5},
        {n:"Sin nombre", a:6.1},
        {n:"Sin nombre", a:5.9},
        {n:"Sin nombre", a:5.9},
        {n:"Ciénaga Los Ranchos", a:5.6},
        {n:"Ciénaga Agua Fría", a:5.4},
        {n:"Ciénaga Murrapal", a:5.4},
        {n:"Ciénaga de Los Platillos", a:5.3},
        {n:"Ciénaga Despensa Grande", a:5.1},
        {n:"Sin nombre", a:4.9},
        {n:"Sin nombre", a:4.8},
        {n:"Ciénaga de Los Platillos", a:4.8},
        {n:"Sin nombre", a:4.7},
        {n:"Ciénaga Los Ranchos", a:4.6},
        {n:"Sin nombre", a:4.2},
        {n:"Sin nombre", a:4.2},
        {n:"Sin nombre", a:4.1},
        {n:"Ciénaga de Bartolo", a:4.0},
        {n:"Ciénaga Huesito", a:3.9},
        {n:"Sin nombre", a:3.8},
        {n:"Ciénagas Juan Ignacio", a:3.8},
        {n:"Sin nombre", a:3.8},
        {n:"Ciénaga Caimanero", a:3.8},
        {n:"Sin nombre", a:3.8},
        {n:"Sin nombre", a:3.7},
        {n:"Ciénaga Murrapalito", a:3.6},
        {n:"Sin nombre", a:3.6},
        {n:"Sin nombre", a:3.3},
        {n:"Sin nombre", a:3.0},
        {n:"Ciénagas Juan Ignacio", a:3.0},
        {n:"Sin nombre", a:2.9},
        {n:"Sin nombre", a:2.8},
        {n:"Sin nombre", a:2.6},
        {n:"Sin nombre", a:2.5},
        {n:"Sin nombre", a:2.4},
        {n:"Sin nombre", a:2.2},
        {n:"Sin nombre", a:2.2},
        {n:"Sin nombre", a:2.2},
        {n:"Ciénaga La Sucia", a:2.1},
        {n:"Sin nombre", a:2.1},
        {n:"Sin nombre", a:1.8},
        {n:"Sin nombre", a:1.8},
        {n:"Sin nombre", a:1.7},
        {n:"Sin nombre", a:1.5},
        {n:"Poza La Despencita", a:1.5},
        {n:"Sin nombre", a:1.4},
        {n:"Poza Redondita", a:1.3},
        {n:"Ciénaga Loma Alta", a:1.3},
        {n:"Sin nombre", a:1.3},
        {n:"Poza La Matilde", a:1.2},
        {n:"Sin nombre", a:1.1},
        {n:"Sin nombre", a:0.9},
        {n:"Sin nombre", a:0.8},
        {n:"Sin nombre", a:0.8},
        {n:"Sin nombre", a:0.8},
        {n:"Sin nombre", a:0.8},
        {n:"Sin nombre", a:0.8},
        {n:"Sin nombre", a:0.8},
        {n:"Sin nombre", a:0.6},
        {n:"Sin nombre", a:0.6},
        {n:"Sin nombre", a:0.5},
        {n:"Sin nombre", a:0.5},
        {n:"Sin nombre", a:0.5},
        {n:"Sin nombre", a:0.5},
        {n:"Sin nombre", a:0.5},
        {n:"Sin nombre", a:0.5},
      ],
      'Murindó': [
        {n:"Ciénaga Tadía", a:2307.8},
        {n:"Ciénaga Arrastradero", a:342.4},
        {n:"Ciénaga Rojeradó", a:258.2},
        {n:"Ciénaga Quesada", a:196.7},
        {n:"Sin nombre", a:138.2},
        {n:"Ciénaga Tigre", a:89.2},
        {n:"Sin nombre", a:89.2},
        {n:"Ciénaga de Los Platillos", a:79.7},
        {n:"Ciénaga de Los Platillos", a:70.4},
        {n:"Sin nombre", a:64.5},
        {n:"Ciénaga de Los Platillos", a:51.2},
        {n:"Sin nombre", a:46.3},
        {n:"Ciénaga de Los Platillos", a:44.7},
        {n:"Ciénaga de Los Platillos", a:40.4},
        {n:"Sin nombre", a:30.5},
        {n:"Sin nombre", a:26.5},
        {n:"Sin nombre", a:25.6},
        {n:"Sin nombre", a:19.1},
        {n:"Ciénaga de Los Platillos", a:18.0},
        {n:"Ciénaga de la Deja", a:16.5},
        {n:"Ciénaga de Los Platillos", a:11.3},
        {n:"Sin nombre", a:7.6},
        {n:"Sin nombre", a:6.1},
        {n:"Sin nombre", a:0.3},
      ],
      'Turbo': [
        {n:"Ciénaga La Reina", a:1554.9},
        {n:"Ciénaga La Úlima", a:546.2},
        {n:"Ciénaga La Primera", a:331.5},
        {n:"Ciénaga Cienaguita", a:124.8},
        {n:"Ciénaga de Matuntugo", a:68.4},
        {n:"Sin nombre", a:60.3},
        {n:"Sin nombre", a:55.7},
        {n:"Ciénaga de Matuntugo", a:55.4},
        {n:"Sin nombre", a:51.4},
        {n:"Sin nombre", a:37.4},
        {n:"Ciénaga de Las Trozas", a:31.9},
        {n:"Cienaga Poza de Lubi", a:30.6},
        {n:"Sin nombre", a:26.8},
        {n:"Sin nombre", a:26.5},
        {n:"Sin nombre", a:19.2},
        {n:"Ciénaga de Maquilón", a:18.6},
        {n:"Sin nombre", a:17.4},
        {n:"Cienaga Poza de Ruíz", a:17.0},
        {n:"Ciénaga de Matuntugo", a:14.0},
        {n:"Sin nombre", a:13.5},
        {n:"Sin nombre", a:12.2},
        {n:"Sin nombre", a:11.8},
        {n:"Sin nombre", a:10.5},
        {n:"Sin nombre", a:7.0},
        {n:"Sin nombre", a:5.6},
        {n:"Sin nombre", a:5.5},
        {n:"Sin nombre", a:5.5},
        {n:"Sin nombre", a:5.4},
        {n:"Sin nombre", a:4.9},
        {n:"Sin nombre", a:3.5},
        {n:"Ciénaga La Lebranchera", a:1.9},
      ],
      'Mutatá': [
        {n:"Ciénaga Palo de Agua", a:7.9},
        {n:"Ciénaga Palo de Agua", a:7.8},
      ]
    },
    choco: {
      'Riosucio': [
        {n:"Ciénaga de Pedega", a:507.8},
        {n:"Ciénaga de La Honda", a:341.0},
        {n:"Ciénaga La Grande", a:270.0},
        {n:"Ciénaga La Rica", a:226.7},
        {n:"Ciénaga Perancho (Ciénaga Escondida de Perancho)", a:199.2},
        {n:"Sin nombre", a:177.2},
        {n:"Sin nombre", a:151.3},
        {n:"Ciénaga Carvajal", a:135.4},
        {n:"Ciénaga de Pedeguita", a:120.5},
        {n:"Sin nombre", a:108.9},
        {n:"Ciénaga de Sánchez", a:100.8},
        {n:"Ciénaga Perancho", a:81.2},
        {n:"Ciénaga de Pedeguita", a:51.5},
        {n:"Ciénaga Mazamorra", a:45.4},
        {n:"Sin nombre", a:43.1},
        {n:"Ciénaga El Tigre", a:40.1},
        {n:"Ciénaga El Encanto", a:36.0},
        {n:"Sin nombre", a:20.7},
        {n:"Sin nombre", a:19.0},
        {n:"Ciénaga La Poza", a:18.4},
        {n:"Sin nombre", a:14.8},
        {n:"Ciénaga Sicuela", a:13.3},
        {n:"Sin nombre", a:11.0},
        {n:"Sin nombre", a:10.2},
        {n:"Sin nombre", a:9.6},
        {n:"Ciénaga Cacariquita", a:9.4},
        {n:"Poza La Garzonera", a:8.6},
        {n:"Sin nombre", a:7.8},
        {n:"Sin nombre", a:7.2},
        {n:"Sin nombre", a:6.0},
        {n:"Sin nombre", a:5.4},
        {n:"Sin nombre", a:4.5},
        {n:"Sin nombre", a:4.4},
        {n:"Sin nombre", a:4.2},
        {n:"Sin nombre", a:2.7},
        {n:"Sin nombre", a:2.3},
        {n:"Sin nombre", a:2.1},
        {n:"Sin nombre", a:2.1},
        {n:"Sin nombre", a:2.0},
        {n:"Sin nombre", a:1.4},
        {n:"Sin nombre", a:1.4},
        {n:"Sin nombre", a:0.9},
        {n:"Ciénaga de Pedeguita", a:0.0},
      ],
      'Belén de bajirá': [
        {n:"Ciénaga La Úlima", a:21.1},
        {n:"Sin nombre", a:5.1},
        {n:"Sin nombre", a:3.5},
        {n:"Sin nombre", a:2.3},
      ],
      'Bojayá': [
        {n:"Ciénaga de Bojayá", a:851.8},
        {n:"Ciénaga Napipicito", a:412.1},
        {n:"Ciénaga Muriel", a:260.6},
        {n:"Ciénaga Yarumal", a:236.4},
        {n:"Ciénaga La Corona", a:155.1},
        {n:"Ciénaga del Medio", a:136.5},
        {n:"Ciénaga La Redonda", a:119.9},
        {n:"Ciénaga Vueltamansa", a:83.1},
        {n:"Sin nombre", a:73.9},
        {n:"Sin nombre", a:65.7},
        {n:"Ciénaga Garzoncito", a:47.8},
        {n:"Ciénaga Murielito", a:38.3},
        {n:"Ciénaga Yarumal", a:38.1},
        {n:"Sin nombre", a:23.9},
        {n:"Ciénaga El Rincón", a:22.3},
        {n:"Sin nombre", a:20.9},
        {n:"Sin nombre", a:18.1},
        {n:"Sin nombre", a:13.2},
        {n:"Ciénaga Derramadero", a:12.4},
        {n:"Ciénaga de Barranca", a:9.3},
        {n:"Sin nombre", a:8.2},
        {n:"Sin nombre", a:8.0},
        {n:"Sin nombre", a:7.6},
        {n:"Sin nombre", a:7.4},
        {n:"Sin nombre", a:7.4},
        {n:"Sin nombre", a:6.9},
        {n:"Ciénaga Gerujamía", a:5.8},
        {n:"Sin nombre", a:5.4},
        {n:"Sin nombre", a:5.4},
        {n:"Sin nombre", a:5.1},
        {n:"Ciénaga del Ahogado", a:4.9},
        {n:"Sin nombre", a:4.6},
        {n:"Sin nombre", a:4.4},
        {n:"Ciénaga Gerujamía", a:4.4},
        {n:"Ciénaga Pedro", a:4.3},
        {n:"Sin nombre", a:3.1},
        {n:"Sin nombre", a:3.1},
        {n:"Ciénega Calderón", a:3.0},
        {n:"Ciénaga El Tranquero", a:3.0},
        {n:"Sin nombre", a:2.9},
        {n:"Sin nombre", a:2.9},
        {n:"Sin nombre", a:2.8},
        {n:"Ciénaga El Caimito", a:2.7},
        {n:"Sin nombre", a:2.3},
        {n:"Sin nombre", a:2.3},
        {n:"Sin nombre", a:2.2},
        {n:"Sin nombre", a:2.0},
        {n:"Sin nombre", a:1.9},
        {n:"Sin nombre", a:1.9},
        {n:"Sin nombre", a:1.7},
        {n:"Sin nombre", a:1.7},
        {n:"Sin nombre", a:1.7},
        {n:"Sin nombre", a:1.6},
        {n:"Sin nombre", a:1.6},
        {n:"Sin nombre", a:1.5},
        {n:"Sin nombre", a:1.5},
        {n:"Sin nombre", a:1.5},
        {n:"Sin nombre", a:1.3},
        {n:"Sin nombre", a:1.3},
        {n:"Sin nombre", a:1.3},
        {n:"Sin nombre", a:1.3},
        {n:"Sin nombre", a:1.1},
        {n:"Sin nombre", a:1.0},
        {n:"Sin nombre", a:0.9},
        {n:"Sin nombre", a:0.7},
        {n:"Sin nombre", a:0.7},
        {n:"Sin nombre", a:0.7},
        {n:"Sin nombre", a:0.7},
        {n:"Sin nombre", a:0.5},
        {n:"Sin nombre", a:0.4},
      ],
      'Quibdó': [
        {n:"Ciénaga Ipurrú", a:320.7},
        {n:"Ciénaga La Retirada", a:56.0},
        {n:"Ciénaga El Cabezal", a:49.0},
        {n:"Ciénaga Santa Bárbara", a:41.3},
        {n:"Ciénaga La Larga", a:39.3},
        {n:"Ciénaga Bebareño", a:30.3},
        {n:"Ciénaga Quitasola", a:29.4},
        {n:"Ciénaga El Tigre", a:25.0},
        {n:"Ciénaga El Pozo", a:23.1},
        {n:"Ciénaga La Grande", a:20.9},
        {n:"Ciénaga Santa Bárbara", a:17.7},
        {n:"Sin nombre", a:15.1},
        {n:"Ciénaga La Corona", a:14.2},
        {n:"Ciénaga La Grande", a:13.8},
        {n:"Ciénaga Las Lomas", a:12.6},
        {n:"Sin nombre", a:12.5},
        {n:"Ciénaga La Negra", a:11.8},
        {n:"Sin nombre", a:9.1},
        {n:"Ciénaga Santa Bárbara", a:8.6},
        {n:"Ciénaga Achuarrá", a:8.0},
        {n:"Ciénaga El Guamal", a:7.8},
        {n:"Sin nombre", a:7.5},
        {n:"Sin nombre", a:7.4},
        {n:"Ciénaga Sol de Villa", a:7.2},
        {n:"Ciénaga Grande", a:6.9},
        {n:"Sin nombre", a:6.6},
        {n:"Ciénaga La Grande", a:6.1},
        {n:"Ciénaga La Sucia", a:5.8},
        {n:"Sin nombre", a:5.7},
        {n:"Ciénaga Morrocó", a:5.5},
        {n:"Ciénaga La Grande", a:5.0},
        {n:"Sin nombre", a:5.0},
        {n:"Sin nombre", a:5.0},
        {n:"Ciénaga Plaza Seca", a:4.6},
        {n:"Sin nombre", a:4.1},
        {n:"Ciénaga Canturron", a:3.8},
        {n:"Ciénaga Juan Pablo", a:3.7},
        {n:"Ciénagas Doña María", a:3.7},
        {n:"Ciénaga La Rinconera", a:3.6},
        {n:"Ciénaga Santa Bárbara", a:3.6},
        {n:"Ciénaga Juan Pablito", a:3.4},
        {n:"Ciénaga Las Mellizas", a:3.4},
        {n:"Ciénaga Las Mellizas", a:3.2},
        {n:"Ciénaga Grande", a:3.1},
        {n:"Sin nombre", a:3.1},
        {n:"Sin nombre", a:3.1},
        {n:"Sin nombre", a:2.9},
        {n:"Sin nombre", a:2.9},
        {n:"Ciénaga Cienaguita", a:2.8},
        {n:"Ciénaga Quitasolito", a:2.5},
        {n:"Sin nombre", a:2.4},
        {n:"Sin nombre", a:2.3},
        {n:"Sin nombre", a:2.2},
        {n:"Ciénaga El Palmar", a:1.6},
        {n:"Ciénaga Difunto Manuel", a:1.6},
        {n:"Ciénaga La Redonda", a:1.4},
        {n:"Sin nombre", a:1.4},
        {n:"Ciénaga El Desemboque", a:1.2},
        {n:"Poza Lejiada", a:1.1},
        {n:"Sin nombre", a:1.0},
        {n:"Ciénaga La Escondida", a:0.9},
        {n:"Sin nombre", a:0.8},
        {n:"Ciénaga Cayetana", a:0.8},
        {n:"Ciénaga Los Pozos", a:0.6},
        {n:"Ciénaga Quitasol", a:0.5},
        {n:"Ciénaga El Ovejal", a:0.5},
      ],
      'Medio Atrato': [
        {n:"Ciénaga Achuarrá", a:259.8},
        {n:"Ciénaga Aguaclara", a:247.9},
        {n:"Ciénaga de Remolino", a:238.4},
        {n:"Sin nombre", a:212.3},
        {n:"Ciénaga Santa Rosa", a:132.3},
        {n:"Ciénaga de Beté", a:121.1},
        {n:"Ciénaga Cumbi", a:108.9},
        {n:"Ciénaga Quesada", a:100.9},
        {n:"Sin nombre", a:90.9},
        {n:"Ciénaga Ogodó", a:80.3},
        {n:"Sin nombre", a:70.8},
        {n:"Ciénaga Grande", a:67.1},
        {n:"Ciénaga La Honda", a:61.1},
        {n:"Sin nombre", a:52.3},
        {n:"Ciénaga Baudocito", a:47.0},
        {n:"Ciénaga Cavasé", a:40.7},
        {n:"Ciénaga Tumaradó", a:37.7},
        {n:"Sin nombre", a:37.2},
        {n:"Sin nombre", a:30.0},
        {n:"Ciénaga Tumaradó", a:28.5},
        {n:"Ciénaga Cumbi", a:28.2},
        {n:"Sin nombre", a:28.1},
        {n:"Sin nombre", a:27.6},
        {n:"Sin nombre", a:27.0},
        {n:"Sin nombre", a:23.0},
        {n:"Sin nombre", a:21.7},
        {n:"Ciénaga Punecito", a:19.4},
        {n:"Poza Combimboza", a:19.0},
        {n:"Sin nombre", a:17.7},
        {n:"Sin nombre", a:17.1},
        {n:"Sin nombre", a:16.8},
        {n:"Sin nombre", a:15.2},
        {n:"Poza Combimboza", a:13.9},
        {n:"Ciénaga Curazao de Abajo", a:12.9},
        {n:"Ciénaga Honda", a:12.3},
        {n:"Ciénaga La Larga", a:12.1},
        {n:"Ciénaga Curazao del Medio", a:11.8},
        {n:"Ciénaga Los Cacaos", a:11.4},
        {n:"Sin nombre", a:10.2},
        {n:"Sin nombre", a:9.8},
        {n:"Ciénaga Las Mujeres", a:9.6},
        {n:"Sin nombre", a:9.6},
        {n:"Sin nombre", a:9.2},
        {n:"Sin nombre", a:9.1},
        {n:"Sin nombre", a:9.0},
        {n:"Ciénaga Paloblanco", a:9.0},
        {n:"Sin nombre", a:8.7},
        {n:"Sin nombre", a:8.6},
        {n:"Sin nombre", a:8.5},
        {n:"Ciénaga La Islita", a:8.2},
        {n:"Sin nombre", a:8.1},
        {n:"Sin nombre", a:7.8},
        {n:"Sin nombre", a:7.6},
        {n:"Sin nombre", a:7.2},
        {n:"Sin nombre", a:6.9},
        {n:"Sin nombre", a:6.7},
        {n:"Sin nombre", a:6.2},
        {n:"Ciénaga La Matamba", a:5.9},
        {n:"Sin nombre", a:5.5},
        {n:"Ciénaga La Sucia", a:5.4},
        {n:"Sin nombre", a:5.4},
        {n:"Sin nombre", a:5.4},
        {n:"Sin nombre", a:5.3},
        {n:"Sin nombre", a:5.0},
        {n:"Sin nombre", a:4.8},
        {n:"Sin nombre", a:4.7},
        {n:"Sin nombre", a:4.7},
        {n:"Sin nombre", a:4.7},
        {n:"Ciénaga Arena", a:4.5},
        {n:"Sin nombre", a:4.1},
        {n:"Sin nombre", a:4.0},
        {n:"Ciénaga Caimanero", a:3.9},
        {n:"Sin nombre", a:3.9},
        {n:"Sin nombre", a:3.8},
        {n:"Sin nombre", a:3.5},
        {n:"Ciénaga Caño Ciego", a:3.4},
        {n:"Sin nombre", a:3.2},
        {n:"Sin nombre", a:3.0},
        {n:"Ciénaga Los Garzones", a:3.0},
        {n:"Sin nombre", a:2.9},
        {n:"Sin nombre", a:2.9},
        {n:"Ciénaga Los Calaos", a:2.8},
        {n:"Ciénaga Curazadito", a:2.7},
        {n:"Sin nombre", a:2.5},
        {n:"Sin nombre", a:2.5},
        {n:"Sin nombre", a:2.5},
        {n:"Sin nombre", a:2.4},
        {n:"Sin nombre", a:2.4},
        {n:"Ciénaga La Redondita", a:2.1},
        {n:"Sin nombre", a:2.1},
        {n:"Sin nombre", a:2.1},
        {n:"Ciénaga Tortuguera", a:2.0},
        {n:"Sin nombre", a:2.0},
        {n:"Sin nombre", a:1.9},
        {n:"Ciénaga Ñangavení", a:1.8},
        {n:"Sin nombre", a:1.6},
        {n:"Sin nombre", a:1.4},
        {n:"Sin nombre", a:1.4},
        {n:"Sin nombre", a:1.3},
        {n:"Sin nombre", a:0.9},
      ],
      'Unguía': [
        {n:"Ciénaga de Unguía", a:2002.3},
        {n:"Ciénaga de Marriaga", a:964.8},
        {n:"Ciénaga del Limón", a:118.9},
        {n:"Ciénagas de Los Hornos", a:115.5},
        {n:"Ciénaga Ciega", a:87.6},
        {n:"Sin nombre", a:18.7},
      ],
      'Carmen Del Darién': [
        {n:"Ciénaga De Montaño", a:2036.0},
        {n:"Ciénaga El Limón", a:954.0},
        {n:"Ciénaga La Grande", a:737.8},
        {n:"Ciénaga El Burro", a:607.9},
        {n:"Ciénaga de Las Mujeres", a:551.7},
        {n:"Sin nombre", a:461.6},
        {n:"Ciénaga de Corrales", a:434.7},
        {n:"Ciénaga de Corrales", a:428.1},
        {n:"Ciénaga De Mate", a:416.9},
        {n:"Ciénaga Tapada", a:390.5},
        {n:"Ciénaga La Grande", a:377.2},
        {n:"Ciénaga De Reyes", a:352.5},
        {n:"Ciénaga El Callejón", a:276.1},
        {n:"Ciénaga Quintasolal", a:273.1},
        {n:"Sin nombre", a:187.9},
        {n:"Ciénaga de Los Medios", a:151.8},
        {n:"Ciénaga San Alejandro", a:149.9},
        {n:"Ciénaga El Limón", a:120.0},
        {n:"Ciénaga La Grande", a:64.0},
        {n:"Sin nombre", a:57.4},
        {n:"Sin nombre", a:46.8},
        {n:"Ciénaga El Tigre", a:46.2},
        {n:"Sin nombre", a:43.5},
        {n:"Sin nombre", a:37.4},
        {n:"Ciénaga de Marmoleio", a:37.2},
        {n:"Sin nombre", a:36.2},
        {n:"Ciénaga La Grande", a:29.4},
        {n:"Sin nombre", a:26.3},
        {n:"Sin nombre", a:25.1},
        {n:"Sin nombre", a:23.2},
        {n:"Sin nombre", a:22.8},
        {n:"Ciénaga Curvaradocito", a:21.8},
        {n:"Ciénaga de Marmolejo", a:19.1},
        {n:"Ciénaga La Tapada", a:19.0},
        {n:"Sin nombre", a:18.3},
        {n:"Sin nombre", a:18.2},
        {n:"Sin nombre", a:18.0},
        {n:"Sin nombre", a:17.2},
        {n:"Sin nombre", a:16.7},
        {n:"Sin nombre", a:16.2},
        {n:"Sin nombre", a:16.2},
        {n:"Sin nombre", a:11.3},
        {n:"Sin nombre", a:8.6},
        {n:"Ciénaga del Lobo", a:8.4},
        {n:"Sin nombre", a:8.2},
        {n:"Sin nombre", a:8.0},
        {n:"Sin nombre", a:7.8},
        {n:"Ciénaga Juacho", a:7.6},
        {n:"Sin nombre", a:7.3},
        {n:"Sin nombre", a:3.9},
        {n:"Ciénaga de Los Platillos", a:3.8},
      ],
      'Medio Baudó': [
        {n:"Ciénaga Dubacita", a:1.3},
      ],
      'Nóvita': [
        {n:"Ciénaga Daiguí", a:9.8},
        {n:"Sin nombre", a:2.6},
      ],
      'El Litoral Del San Juán': [
        {n:"Sin nombre", a:4.9},
        {n:"Sin nombre", a:3.0},
      ]
    }
  };
  
  
  function renderCienagas(){
    const dep=document.getElementById("sel-depto").value;
    const muniSel=document.getElementById("sel-muni").value;
    const d=DATA_OTHER.cienagas;
  
    let rows=dep==='todos'?d.deptos:d.deptos.filter(r=>r.id===dep);
    let muniRows=null;
    if(dep!=='todos'&&d.munis&&d.munis[dep]){
      muniRows=d.munis[dep];
      if(muniSel!=='todos') muniRows=muniRows.filter(m=>m.name===muniSel);
    }
  
    const tblRows=muniRows||rows;
    const totalHa=tblRows.reduce((s,r)=>s+(r.area||0),0);
    const totalC = muniSel!=='todos'
      ? (CIENAGAS_DATA[dep]?.[muniSel]?.length || tblRows.reduce((s,r)=>s+(r.cienagas||0),0))
      : dep==='todos' ? d.deptos.reduce((s,r)=>s+(r.cienagas||0),0) : rows.reduce((s,r)=>s+(r.cienagas||0),0);
    const totalMunis=muniSel!=='todos'?1:(dep==='todos'?d.deptos.reduce((s,r)=>s+(r.municipios||0),0):rows.reduce((s,r)=>s+(r.municipios||0),0));
    const mayorRows = muniRows && muniRows.length ? muniRows : (dep!=='todos' && d.munis && d.munis[dep] ? d.munis[dep] : rows);
    const mayor=mayorRows.length>0?mayorRows.reduce((a,b)=>a.area>b.area?a:b,mayorRows[0]):{name:'—',pct:0};
  
    const el=id=>document.getElementById(id);
  
    // Tarjetas KPI
    if(el("cienagas-deptos")) el("cienagas-deptos").textContent=rows.length;
    if(el("cienagas-munis")) el("cienagas-munis").textContent=totalMunis;
    if(el("cienagas-ha")) el("cienagas-ha").textContent=Number(totalHa).toLocaleString("es-CO",{minimumFractionDigits:1,maximumFractionDigits:1})+" Ha";
    if(el("cienagas-mayor")) el("cienagas-mayor").textContent=mayor.name||"—";
    if(el("cienagas-mayor-pct")) el("cienagas-mayor-pct").textContent=(mayor.pct||0).toFixed(1)+"% del total";
    if(el("cienagas-count")) el("cienagas-count").textContent=totalC;
    if(el("cienagas-count-ha")) el("cienagas-count-ha").textContent=Number(totalHa).toLocaleString("es-CO",{minimumFractionDigits:1,maximumFractionDigits:1})+" Ha";
  
    // Datos para gráficos: municipios si hay filtro, deptos si es todos
    const chartData = muniRows || (dep!=='todos' && d.munis && d.munis[dep] ? d.munis[dep] : rows);
    const labels=chartData.map(r=>r.name);
    const vals=chartData.map(r=>r.area||0);
    const bgC=chartData.map((_,i)=>PAL_CIENAGAS[i%PAL_CIENAGAS.length]);
  
    // Leyenda barras
    if(el("leg-cienagas-bar")) el("leg-cienagas-bar").innerHTML=chartData.map((r,i)=>`<span><span class="ldot" style="background:${bgC[i]}"></span>${r.name}</span>`).join("");
  
    // Gráfico 1: Área por municipio/depto
    if(W._chartCienagasBar){W._chartCienagasBar.destroy();}
    if(el("ch-cienagas-bar")) W._chartCienagasBar=new Chart(el("ch-cienagas-bar"),{
      type:"bar",
      data:{labels,datasets:[{data:vals,backgroundColor:bgC,borderRadius:5,borderSkipped:false}]},
      options:{responsive:true,maintainAspectRatio:false,
        plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>c.label+": "+Number(c.raw).toLocaleString("es-CO",{minimumFractionDigits:1,maximumFractionDigits:1})+" Ha"}}},
        scales:{x:{grid:{color:"rgba(0,0,0,0.05)"},ticks:{font:{size:10},maxRotation:45}},y:{grid:{display:false},ticks:{font:{size:11},callback:v=>v>=1000?(v/1000).toFixed(0)+"k":v}}}
      }
    });
  
    // Gráfico 2: Dona distribución porcentual
    const totPie=vals.reduce((s,v)=>s+v,0)||1;
    const pctsPie=vals.map(v=>Math.round(v/totPie*1000)/10);
    if(el("leg-cienagas-pie")) el("leg-cienagas-pie").innerHTML=chartData.map((r,i)=>`<span><span class="ldot" style="background:${bgC[i]};border-radius:50%"></span>${r.name} ${pctsPie[i]}%</span>`).join("");
    if(W._chartCienagarPie){W._chartCienagarPie.destroy();}
    if(el("ch-cienagas-pie")) W._chartCienagarPie=new Chart(el("ch-cienagas-pie"),{
      type:"doughnut",
      data:{labels:chartData.map((r,i)=>r.name+" "+pctsPie[i]+"%"),datasets:[{data:pctsPie,backgroundColor:bgC,borderWidth:2,borderColor:"#fff",hoverOffset:6}]},
      options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},cutout:"58%"}
    });
  
    // Gráfico 3: Número de municipios (solo cuando vista es por departamento)
    const munLabels=rows.map(r=>r.name);
    const munVals=rows.map(r=>r.municipios||0);
    const munColors=rows.map((_,i)=>PAL_CIENAGAS[i%PAL_CIENAGAS.length]);
    if(W._chartCienagasMunis){W._chartCienagasMunis.destroy();}
    if(el("ch-cienagas-munis")) W._chartCienagasMunis=new Chart(el("ch-cienagas-munis"),{
      type:"bar",
      data:{labels:munLabels,datasets:[{data:munVals,backgroundColor:munColors,borderRadius:5,borderSkipped:false}]},
      options:{responsive:true,maintainAspectRatio:false,
        plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>c.label+": "+c.raw+" municipios"}}},
        scales:{x:{grid:{color:"rgba(0,0,0,0.05)"},ticks:{font:{size:11}}},y:{grid:{display:false},ticks:{font:{size:11},stepSize:1}}}
      }
    });
  
    // Tabla detalle
    const tbody=el("cienagas-tbody");
    const tblTitle=el("cienagas-tbl-title");
    const depNames={"choco":"Chocó","antioquia":"Antioquia","narino":"Nariño","cauca":"Cauca","valle":"Valle del Cauca","cordoba":"Córdoba","risaralda":"Risaralda"};
    const depLabel = dep!=='todos' ? depNames[dep]||dep : null;
  
    // Determinar modo: todos / depto / muni
    const modoMuni = !!muniRows && muniSel!=='todos';
    const modoDepto = dep!=='todos' && !modoMuni;
    const modoTodos = dep==='todos';
  
    if(tblTitle) tblTitle.textContent = modoMuni ? "Detalle por ciénaga" : modoDepto ? "Detalle por municipio" : "Detalle por departamento";
  
    // Controlar columnas visibles
    const thMuni      = document.getElementById("th-cienagas-muni");
    const thNombre    = document.getElementById("th-cienagas-nombre");
    const thMuniCount = document.getElementById("th-cienagas-munis-count");
    const thCount     = document.getElementById("th-cienagas-count");
    if(thMuni)      thMuni.style.display      = modoTodos ? 'none' : '';
    if(thNombre)    thNombre.style.display    = modoMuni  ? '' : 'none';
    if(thMuniCount) thMuniCount.style.display = modoTodos ? '' : 'none';
    if(thCount)     thCount.style.display     = modoMuni  ? 'none' : '';
  
    const grandTot=tblRows.reduce((s,r)=>s+(r.area||0),0)||1;
    const fmt1 = v => Number(v).toLocaleString("es-CO",{minimumFractionDigits:1,maximumFractionDigits:1});
  
    if(modoMuni){
      // Modo municipio: mostrar ciénagas individuales del Excel
      const cienagas = (CIENAGAS_DATA[dep] && CIENAGAS_DATA[dep][muniSel]) || muniRows.map(r=>({n:r.name,a:r.area}));
      const grandTotC = cienagas.reduce((s,r)=>s+r.a,0)||1;
  
      // Guardar filas para ordenamiento
      _cienModoMuni=true;
      _cienLastRows=cienagas.map(r=>({depto:depLabel||'—',muni:muniSel,nombre:r.n,area:r.a,pct:r.a/grandTotC*100}));
      _cienSortCol=null; _cienSortAsc=true;
      ['depto','muni','nombre','municipios','cienagas','area','pct'].forEach(c=>{
        const u=document.getElementById('csa-'+c+'-up'),d=document.getElementById('csa-'+c+'-down');
        if(u)u.classList.remove('active'); if(d)d.classList.remove('active');
        const t=document.getElementById('ctip-'+c);
        if(t)t.textContent=(c==='depto'||c==='muni'||c==='nombre')?'Clic para ordenar A→Z / Z→A':'Clic para ordenar menor→mayor / mayor→menor';
      });
      if(tbody) tbody.innerHTML = cienagas.map(r=>`<tr>
        <td style="font-weight:500">${depLabel||"—"}</td>
        <td style="font-weight:500">${muniSel}</td>
        <td style="${(!r.n||r.n==='Sin nombre'||r.n==='<Null>'||r.n==='')?'color:var(--text3);font-style:italic':'font-weight:500'}">${(!r.n||r.n==='<Null>'||r.n==='')?'Sin nombre':r.n}</td>
        <td>${fmt1(r.a)} Ha</td>
        <td style="text-align:right">${(r.a/grandTotC*100).toFixed(1)}%</td>
      </tr>`).join("");
      const totAreaC = cienagas.reduce((s,r)=>s+r.a,0);
      if(el("cienagas-tfoot")) el("cienagas-tfoot").innerHTML=`<tr style="border-top:1px solid var(--border2);background:var(--bg)">
        <td style="font-weight:600;padding:6px 8px;text-align:center;vertical-align:middle">Total</td>
        <td style="font-weight:600;padding:6px 8px;text-align:center;vertical-align:middle">${cienagas.length} registros</td>
        <td style="font-weight:600;padding:6px 8px;text-align:center;vertical-align:middle"></td>
        <td style="font-weight:600;padding:6px 8px;text-align:center;vertical-align:middle">${fmt1(totAreaC)} Ha</td>
        <td style="font-weight:600;padding:6px 8px;text-align:center;vertical-align:middle;text-align:right">100%</td>
      </tr>`;
    } else {
      // Guardar filas para ordenamiento
      _cienModoMuni=false;
      _cienLastRows=tblRows.map(r=>({
        depto:modoDepto?(depLabel||'—'):r.name, muni:modoDepto?r.name:'',
        municipios:r.municipios, cienagas:r.cienagas, area:r.area,
        pct:(r.area/grandTot*100), _modoTodos:modoTodos, _modoDepto:modoDepto
      }));
      _cienSortCol=null; _cienSortAsc=true;
      ['depto','muni','nombre','municipios','cienagas','area','pct'].forEach(c=>{
        const u=document.getElementById('csa-'+c+'-up'),d=document.getElementById('csa-'+c+'-down');
        if(u)u.classList.remove('active'); if(d)d.classList.remove('active');
        const t=document.getElementById('ctip-'+c);
        if(t)t.textContent=(c==='depto'||c==='muni'||c==='nombre')?'Clic para ordenar A→Z / Z→A':'Clic para ordenar menor→mayor / mayor→menor';
      });
  
      if(tbody) tbody.innerHTML=tblRows.map(r=>`<tr>
        <td style="font-weight:500">${modoDepto?(depLabel||"—"):r.name}</td>
        ${!modoTodos?`<td style="font-weight:500">${modoDepto?r.name:"—"}</td>`:''}
        ${modoTodos?`<td>${r.municipios||"—"}</td>`:''}
        <td style="font-weight:500">${r.cienagas||"—"}</td>
        <td>${r.area>0?fmt1(r.area)+" Ha":"—"}</td>
        <td>${(r.area/grandTot*100).toFixed(1)}%</td>
      </tr>`).join("");
      const totMunis = tblRows.reduce((s,r)=>s+(r.municipios||0),0);
      const totArea = tblRows.reduce((s,r)=>s+(r.area||0),0);
      if(el("cienagas-tfoot")) el("cienagas-tfoot").innerHTML=`<tr style="border-top:1px solid var(--border2);background:var(--bg);font-weight:600">
        <td style="font-weight:600">Total</td>
        ${!modoTodos?`<td style="font-weight:600">${tblRows.length} registros</td>`:''}
        ${modoTodos?`<td style="font-weight:600">${totMunis}</td>`:''}
        <td style="font-weight:600">${totalC}</td>
        <td style="font-weight:600">${fmt1(totArea)} Ha</td>
        <td style="font-weight:600">100%</td>
      </tr>`;
    }
  }
  
  // ── Datos de grupos étnicos por defecto (Censo DANE 2018) ─────────────────
  // Se inicializan aquí para estar disponibles desde el primer render
  W.ETNIA_DATA = W.ETNIA_DATA || [
    {id:'antioquia', name:'Antioquia',      indigena:32586,  gitano:34,  raizal:69,  palenquero:48,  negro:228455,  ninguno:403081, noinforma:6736},
    {id:'choco', name:'Chocó',      indigena:89238,  gitano:42,  raizal:141,  palenquero:159,  negro:400373,  ninguno:33712, noinforma:32235},
    {id:'valle', name:'Valle del Cauca',      indigena:13195,  gitano:20,  raizal:57,  palenquero:36,  negro:232771,  ninguno:235018, noinforma:5275},
    {id:'narino', name:'Nariño',      indigena:112881,  gitano:19,  raizal:84,  palenquero:107,  negro:259281,  ninguno:80513, noinforma:17683},
    {id:'cauca', name:'Cauca',      indigena:10513,  gitano:5,  raizal:20,  palenquero:30,  negro:59057,  ninguno:40487, noinforma:3459},
    {id:'cordoba', name:'Córdoba',      indigena:7160,  gitano:0,  raizal:10,  palenquero:2,  negro:3786,  ninguno:29837, noinforma:252},
    {id:'risaralda', name:'Risaralda',      indigena:15718,  gitano:3,  raizal:2,  palenquero:0,  negro:1989,  ninguno:8974, noinforma:464},
  ];
  
    W.ETNIA_MUNIS = W.ETNIA_MUNIS || {
      antioquia:[
        {name:'Abriaquí',indigena:20,gitano:2,raizal:0,palenquero:0,negro:71,ninguno:12400,noinforma:68},
        {name:'Apartadó',indigena:1353,gitano:4,raizal:33,palenquero:8,negro:52737,ninguno:89763,noinforma:853},
        {name:'Cañasgordas',indigena:3,gitano:1,raizal:1,palenquero:0,negro:54,ninguno:17951,noinforma:108},
        {name:'Carepa',indigena:245,gitano:1,raizal:2,palenquero:1,negro:16014,ninguno:37858,noinforma:335},
        {name:'Chigorodó',indigena:2376,gitano:1,raizal:2,palenquero:3,negro:27811,ninguno:26670,noinforma:270},
        {name:'Dabeiba',indigena:6491,gitano:0,raizal:0,palenquero:0,negro:604,ninguno:23059,noinforma:274},
        {name:'Frontino',indigena:6118,gitano:0,raizal:1,palenquero:0,negro:122,ninguno:21337,noinforma:309},
        {name:'Murindó',indigena:1927,gitano:0,raizal:1,palenquero:3,negro:2657,ninguno:51,noinforma:270},
        {name:'Mutatá',indigena:3379,gitano:0,raizal:3,palenquero:10,negro:12537,ninguno:13939,noinforma:2573},
        {name:'Necoclí',indigena:2799,gitano:1,raizal:1,palenquero:9,negro:19893,ninguno:20167,noinforma:124},
        {name:'San Pedro De Urabá',indigena:501,gitano:16,raizal:0,palenquero:1,negro:2822,ninguno:22661,noinforma:103},
        {name:'Turbo',indigena:3929,gitano:8,raizal:15,palenquero:7,negro:82842,ninguno:74610,noinforma:636},
        {name:'Uramita',indigena:214,gitano:0,raizal:0,palenquero:0,negro:54,ninguno:8967,noinforma:25},
        {name:'Urrao',indigena:1727,gitano:0,raizal:6,palenquero:2,negro:2106,ninguno:32319,noinforma:307},
        {name:'Vigía Del Fuerte',indigena:1077,gitano:0,raizal:4,palenquero:4,negro:8031,ninguno:59,noinforma:462},
        {name:'Ituango',indigena:427,gitano:0,raizal:0,palenquero:0,negro:100,ninguno:1270,noinforma:19},
      ],
      choco:[
        {name:'Carmen Del Darién',indigena:2842,gitano:0,raizal:7,palenquero:2,negro:16568,ninguno:800,noinforma:1796},
        {name:'Bojayá',indigena:4075,gitano:0,raizal:0,palenquero:3,negro:8499,ninguno:352,noinforma:2081},
        {name:'Quibdó',indigena:6017,gitano:1,raizal:47,palenquero:19,negro:111974,ninguno:3400,noinforma:2215},
        {name:'Rio Quito',indigena:1110,gitano:0,raizal:2,palenquero:2,negro:20660,ninguno:658,noinforma:1356},
        {name:'Atrato (Yuto)',indigena:354,gitano:0,raizal:0,palenquero:1,negro:8970,ninguno:238,noinforma:151},
        {name:'Acandí',indigena:381,gitano:1,raizal:5,palenquero:4,negro:11629,ninguno:1233,noinforma:384},
        {name:'Alto Baudó',indigena:13619,gitano:1,raizal:3,palenquero:13,negro:8593,ninguno:241,noinforma:2885},
        {name:'Bagadó',indigena:6217,gitano:0,raizal:1,palenquero:1,negro:3833,ninguno:50,noinforma:681},
        {name:'Bahía Solano',indigena:1311,gitano:0,raizal:0,palenquero:1,negro:8532,ninguno:228,noinforma:82},
        {name:'El Cantón Del San Pablo',indigena:201,gitano:0,raizal:0,palenquero:6,negro:4954,ninguno:46,noinforma:456},
        {name:'Cértegui',indigena:761,gitano:1,raizal:3,palenquero:4,negro:5152,ninguno:62,noinforma:333},
        {name:'El Carmen',indigena:2530,gitano:0,raizal:0,palenquero:1,negro:513,ninguno:5156,noinforma:402},
        {name:'Istmina',indigena:2631,gitano:1,raizal:23,palenquero:13,negro:29486,ninguno:812,noinforma:984},
        {name:'Lloró',indigena:1860,gitano:0,raizal:2,palenquero:1,negro:5383,ninguno:69,noinforma:1774},
        {name:'Medio Baudó',indigena:3425,gitano:0,raizal:0,palenquero:7,negro:8639,ninguno:209,noinforma:1166},
        {name:'Nuquí',indigena:1533,gitano:0,raizal:0,palenquero:4,negro:1623,ninguno:35,noinforma:261},
        {name:'Rio Iró',indigena:492,gitano:3,raizal:2,palenquero:1,negro:6686,ninguno:54,noinforma:261},
        {name:'Riosucio',indigena:3503,gitano:0,raizal:1,palenquero:4,negro:21224,ninguno:906,noinforma:1372},
        {name:'San José Del Palmar',indigena:485,gitano:0,raizal:0,palenquero:1,negro:1091,ninguno:2967,noinforma:177},
        {name:'Tadó',indigena:8506,gitano:29,raizal:6,palenquero:6,negro:16110,ninguno:2781,noinforma:1648},
        {name:'Unguía',indigena:1126,gitano:2,raizal:7,palenquero:6,negro:10660,ninguno:976,noinforma:970},
        {name:'Unión Panamericana',indigena:364,gitano:0,raizal:1,palenquero:2,negro:8471,ninguno:504,noinforma:138},
        {name:'Belén de bajirá',indigena:803,gitano:0,raizal:2,palenquero:11,negro:19286,ninguno:5418,noinforma:3693},
        {name:'Medio Atrato',indigena:2791,gitano:1,raizal:4,palenquero:9,negro:10405,ninguno:480,noinforma:1755},
        {name:'Bajo Baudó',indigena:9864,gitano:0,raizal:0,palenquero:1,negro:12442,ninguno:74,noinforma:1588},
        {name:'Condoto',indigena:449,gitano:0,raizal:22,palenquero:4,negro:12199,ninguno:231,noinforma:849},
        {name:'Juradó',indigena:1813,gitano:0,raizal:1,palenquero:1,negro:1755,ninguno:17,noinforma:527},
        {name:'Nóvita',indigena:267,gitano:0,raizal:1,palenquero:7,negro:8642,ninguno:96,noinforma:397},
        {name:'Sipí',indigena:1988,gitano:0,raizal:0,palenquero:6,negro:2266,ninguno:5468,noinforma:160},
        {name:'El Litoral Del San Juán',indigena:6588,gitano:0,raizal:0,palenquero:3,negro:4269,ninguno:56,noinforma:970},
        {name:'Medio San Juan',indigena:1332,gitano:2,raizal:1,palenquero:15,negro:9859,ninguno:95,noinforma:723},
      ],
      valle:[
        {name:'El Cairo',indigena:191,gitano:0,raizal:0,palenquero:0,negro:293,ninguno:11436,noinforma:79},
        {name:'El Dovio',indigena:970,gitano:0,raizal:0,palenquero:1,negro:53,ninguno:10343,noinforma:56},
        {name:'Versalles',indigena:767,gitano:0,raizal:3,palenquero:0,negro:91,ninguno:13740,noinforma:91},
        {name:'Bolívar',indigena:1971,gitano:0,raizal:0,palenquero:0,negro:31,ninguno:9845,noinforma:123},
        {name:'Roldanillo',indigena:1172,gitano:0,raizal:0,palenquero:0,negro:37,ninguno:12875,noinforma:111},
        {name:'La Unión',indigena:126,gitano:0,raizal:3,palenquero:0,negro:41,ninguno:6604,noinforma:51},
        {name:'Argelia',indigena:322,gitano:0,raizal:0,palenquero:0,negro:57,ninguno:4594,noinforma:35},
        {name:'Buenaventura',indigena:4003,gitano:13,raizal:48,palenquero:33,negro:222460,ninguno:29844,noinforma:3876},
        {name:'Calima',indigena:365,gitano:2,raizal:0,palenquero:0,negro:299,ninguno:25865,noinforma:124},
        {name:'Dagua',indigena:1401,gitano:2,raizal:1,palenquero:2,negro:8480,ninguno:39362,noinforma:345},
        {name:'La Cumbre',indigena:643,gitano:1,raizal:2,palenquero:0,negro:624,ninguno:33046,noinforma:197},
        {name:'Restrepo',indigena:366,gitano:1,raizal:0,palenquero:0,negro:147,ninguno:16202,noinforma:94},
        {name:'Vijes',indigena:278,gitano:1,raizal:0,palenquero:0,negro:96,ninguno:9109,noinforma:63},
        {name:'Yotoco',indigena:96,gitano:0,raizal:0,palenquero:0,negro:21,ninguno:6926,noinforma:14},
        {name:'Trujillo',indigena:524,gitano:0,raizal:0,palenquero:0,negro:41,ninguno:5227,noinforma:16},
      ],
      narino:[
        {name:'Barbacoas',indigena:17940,gitano:0,raizal:11,palenquero:15,negro:21932,ninguno:2744,noinforma:3706},
        {name:'Cumbitara',indigena:25,gitano:0,raizal:0,palenquero:2,negro:917,ninguno:5578,noinforma:81},
        {name:'El Charco',indigena:951,gitano:2,raizal:4,palenquero:9,negro:19105,ninguno:5108,noinforma:1363},
        {name:'La Tola',indigena:824,gitano:0,raizal:3,palenquero:7,negro:11909,ninguno:77,noinforma:665},
        {name:'Magüí',indigena:466,gitano:2,raizal:9,palenquero:19,negro:27749,ninguno:2036,noinforma:1738},
        {name:'Mallama',indigena:13791,gitano:0,raizal:0,palenquero:0,negro:110,ninguno:6509,noinforma:287},
        {name:'Mosquera',indigena:17,gitano:1,raizal:2,palenquero:5,negro:11387,ninguno:85,noinforma:305},
        {name:'Olaya Herrera',indigena:968,gitano:0,raizal:2,palenquero:6,negro:20930,ninguno:196,noinforma:626},
        {name:'Francisco Pizarro',indigena:38,gitano:0,raizal:1,palenquero:7,negro:6380,ninguno:776,noinforma:228},
        {name:'Policarpa',indigena:7,gitano:0,raizal:0,palenquero:0,negro:762,ninguno:7367,noinforma:43},
        {name:'Ricaurte',indigena:18744,gitano:0,raizal:2,palenquero:0,negro:1647,ninguno:4420,noinforma:931},
        {name:'Roberto Payán',indigena:114,gitano:3,raizal:2,palenquero:15,negro:13522,ninguno:69,noinforma:2000},
        {name:'Santa Bárbara',indigena:597,gitano:1,raizal:1,palenquero:1,negro:8722,ninguno:85,noinforma:748},
        {name:'Tumaco',indigena:13704,gitano:10,raizal:37,palenquero:21,negro:113514,ninguno:6363,noinforma:4291},
        {name:'Cumbal',indigena:25855,gitano:0,raizal:2,palenquero:0,negro:3,ninguno:141,noinforma:50},
        {name:'El Rosario',indigena:3,gitano:0,raizal:0,palenquero:0,negro:33,ninguno:5070,noinforma:45},
        {name:'Leiva',indigena:1,gitano:0,raizal:0,palenquero:0,negro:85,ninguno:6862,noinforma:38},
        {name:'La Llanada',indigena:515,gitano:0,raizal:4,palenquero:0,negro:230,ninguno:3956,noinforma:88},
        {name:'Los Andes',indigena:24,gitano:0,raizal:4,palenquero:0,negro:239,ninguno:6807,noinforma:63},
        {name:'Sapuyes',indigena:2078,gitano:0,raizal:0,palenquero:0,negro:1,ninguno:4108,noinforma:10},
        {name:'Santa Cruz',indigena:8473,gitano:0,raizal:0,palenquero:0,negro:9,ninguno:2312,noinforma:191},
        {name:'Samaniego',indigena:7746,gitano:0,raizal:0,palenquero:0,negro:95,ninguno:9844,noinforma:186},
      ],
      cauca:[
        {name:'Argelia',indigena:46,gitano:0,raizal:0,palenquero:2,negro:356,ninguno:25836,noinforma:86},
        {name:'Guapi',indigena:239,gitano:1,raizal:7,palenquero:9,negro:23475,ninguno:239,noinforma:512},
        {name:'López',indigena:6349,gitano:1,raizal:2,palenquero:10,negro:16525,ninguno:2437,noinforma:1907},
        {name:'Timbiquí',indigena:3372,gitano:2,raizal:11,palenquero:8,negro:17244,ninguno:136,noinforma:841},
        {name:'El Tambo',indigena:507,gitano:1,raizal:0,palenquero:1,negro:1457,ninguno:11839,noinforma:113},
      ],
      cordoba:[
        {name:'Valencia',indigena:155,gitano:0,raizal:1,palenquero:0,negro:1659,ninguno:11410,noinforma:29},
        {name:'Tierralta',indigena:7005,gitano:0,raizal:9,palenquero:2,negro:2127,ninguno:18427,noinforma:223},
      ],
      risaralda:[
        {name:'Pueblo Rico',indigena:7623,gitano:1,raizal:1,palenquero:0,negro:1983,ninguno:4931,noinforma:313},
        {name:'Mistrató',indigena:8095,gitano:2,raizal:1,palenquero:0,negro:6,ninguno:4043,noinforma:151},
      ]
    };
  
  function renderPoblacion(){
    const dep=document.getElementById("sel-depto").value;
    const muniSel=document.getElementById("sel-muni").value;
  
    // Datos según filtro
    let rows=dep==='todos'?POB_DATA.deptos:POB_DATA.deptos.filter(r=>r.id===dep);
    let muniRows=null;
    if(dep!=='todos'&&POB_DATA.munis[dep]){
      muniRows=POB_DATA.munis[dep];
      if(muniSel!=='todos') muniRows=muniRows.filter(m=>m.name===muniSel);
    }
    const tblRows=muniRows||rows;
  
    // etniaDatos y etniaMuniDatos se rellenan más abajo, después de W.ETNIA_DATA/W.ETNIA_MUNIS
    // tblRowsConEtnia se construye justo antes de usarse en la tabla
    const totalH=tblRows.reduce((s,r)=>s+(r.hombres||0),0);
    const totalM=tblRows.reduce((s,r)=>s+(r.mujeres||0),0);
    const totalP=totalH+totalM;
    const mayorRows = muniRows && muniRows.length ? muniRows : rows;
    const mayor=mayorRows.length>0?mayorRows.reduce((a,b)=>a.total>b.total?a:b,mayorRows[0]):{name:'—',pct:0};
  
    const el=id=>document.getElementById(id);
    const fmtN=n=>Number(n).toLocaleString("es-CO");
  
    // Tarjetas
    if(el("pob-total")) el("pob-total").textContent=fmtN(totalP);
    if(el("pob-hombres")) el("pob-hombres").textContent=fmtN(totalH);
    if(el("pob-mujeres")) el("pob-mujeres").textContent=fmtN(totalM);
    if(el("pob-pct-h")) el("pob-pct-h").textContent=(totalH/totalP*100).toFixed(1)+"% del total";
    if(el("pob-pct-m")) el("pob-pct-m").textContent=(totalM/totalP*100).toFixed(1)+"% del total";
    if(el("pob-mayor")) el("pob-mayor").textContent=mayor.name||"—";
    if(el("pob-mayor-pct")) el("pob-mayor-pct").textContent=(mayor.pct||0).toFixed(1)+"% del total";
  
    // Gráfico barras — municipios si hay depto seleccionado, deptos si es todos
    const colors_pob=["#1A237E","#283593","#303F9F","#3949AB","#3F51B5","#5C6BC0","#7986CB"];
    const barDataRaw = muniRows || (dep!=='todos' && POB_DATA.munis[dep] ? POB_DATA.munis[dep] : rows);
    // Ordenar de mayor a menor cuando hay municipios (no en vista general de deptos)
    const barData = dep!=='todos' && muniSel==='todos'
      ? [...barDataRaw].sort((a,b)=>(b.total||0)-(a.total||0))
      : barDataRaw;
    const barLabels=barData.map(r=>r.name);
    const barVals=barData.map(r=>r.total||0);
    const barColors=barData.map((_,i)=>colors_pob[i%colors_pob.length]);
    if(el("leg-pob-bar")) el("leg-pob-bar").innerHTML=barData.map((r,i)=>`<span><span class="ldot" style="background:${barColors[i]}"></span>${r.name}</span>`).join("");
    if(W._chartPobBar){W._chartPobBar.destroy();}
    const barTitle = dep==='todos' ? "Población por departamento" : (muniSel!=='todos' ? "Municipio seleccionado" : "Población por municipio");
    const barTitleEl = el("ch-pob-bar")?.closest('.chart-card')?.querySelector('h3');
    if(barTitleEl) barTitleEl.textContent = barTitle;
    if(el("ch-pob-bar")) W._chartPobBar=new Chart(el("ch-pob-bar"),{
      type:"bar",
      data:{labels:barLabels,datasets:[{data:barVals,backgroundColor:barColors,borderRadius:5,borderSkipped:false}]},
      options:{responsive:true,maintainAspectRatio:false,
        plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>c.label+": "+fmtN(c.raw)+" hab."}}},
        scales:{x:{grid:{color:"rgba(0,0,0,0.05)"},ticks:{font:{size:10},maxRotation:45}},y:{grid:{display:false},ticks:{font:{size:11},callback:v=>v>=1000?(v/1000).toFixed(0)+"k":v}}}
      }
    });
  
    // Siluetas género
    const elHP = el("pob-hombres-pct"); if(elHP) elHP.textContent = (totalH/totalP*100).toFixed(1)+"%";
    const elHN = el("pob-hombres-n"); if(elHN) elHN.textContent = fmtN(totalH)+" personas";
    const elMP = el("pob-mujeres-pct"); if(elMP) elMP.textContent = (totalM/totalP*100).toFixed(1)+"%";
    const elMN = el("pob-mujeres-n"); if(elMN) elMN.textContent = fmtN(totalM)+" personas";
    // Pirámide poblacional — degradado índigo claro → oscuro
    const pir=POB_DATA.piramide;
    const pirLabels=pir.map(p=>p.grupo);
    const pirVals=pir.map(p=>p.total);
    const pirColors = pirLabels.map((_,i) => {
      const t = i / (pirLabels.length - 1);
      const r = Math.round(121 + (26  - 121) * t);
      const g = Math.round(134 + (35  - 134) * t);
      const b = Math.round(203 + (126 - 203) * t);
      return `rgb(${r},${g},${b})`;
    });
    if(W._chartPiramide){W._chartPiramide.destroy();}
    if(el("ch-piramide")) W._chartPiramide=new Chart(el("ch-piramide"),{
      type:"bar",
      data:{labels:pirLabels,datasets:[{label:"Población",data:pirVals,backgroundColor:pirColors,borderRadius:4,barThickness:10}]},
      options:{responsive:true,maintainAspectRatio:false,indexAxis:"y",
        plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>"Grupo "+c.label+": "+fmtN(c.raw)+" hab."}}},
        scales:{x:{grid:{color:"rgba(0,0,0,0.05)"},ticks:{font:{size:10},callback:v=>v>=1000?(v/1000).toFixed(0)+"k":v}},y:{grid:{display:false},ticks:{font:{size:10}}}}
      }
    });
  
    // Tabla
    const tbody=el("pob-tbody");
    const tblTitle=el("pob-tbl-title");
    const isMuni=!!muniRows;
    if(tblTitle) tblTitle.textContent=isMuni?"Detalle por municipio":"Detalle por departamento";
    const grandTot=tblRows.reduce((s,r)=>s+(r.total||0),0)||1;
  
    const deptoNames={"choco":"Chocó","narino":"Nariño","antioquia":"Antioquia","cauca":"Cauca","valle":"Valle del Cauca","cordoba":"Córdoba","risaralda":"Risaralda"};
    const depSel=document.getElementById("sel-depto")?.value||'todos';
    const depName=deptoNames[depSel]||depSel;
  
    // Función para obtener datos de etnia de una fila
    const getEtnia=(r)=>{
      const eD=W.ETNIA_DATA||[];
      const eM=W.ETNIA_MUNIS||{};
      if(dep==='todos'||!muniRows){
        return eD.find(e=>e.id===r.id)||{};
      } else {
        return (eM[dep]||[]).find(m=>m.name===r.name)||{};
      }
    };
  
    _pobLastRows=tblRows.map(r=>{
      const et=getEtnia(r);
      return {...r, pct:(r.total||0)/grandTot*100, _isMuni:isMuni, depto:isMuni?depName:r.name,
        indigena:et.indigena||0, gitano:et.gitano||0, raizal:et.raizal||0, palenquero:et.palenquero||0,
        negro:et.negro||0, ninguno:et.ninguno||0, noinforma:et.noinforma||0
      };
    });
    _pobSortCol=null; _pobSortAsc=true;
  
    // Regenerar thead dinámico con columna Municipio cuando hay depto seleccionado
    const {cols:pobCols}=_buildPobHead(isMuni);
    const pobColKeys=pobCols.map(c=>c.key);
  
    const fmtNp=n=>Number(n).toLocaleString("es-CO");
    if(tbody) tbody.innerHTML=tblRows.map(r=>{
      const et=getEtnia(r);
      return `<tr>
      ${pobColKeys.map(k=>{
        if(k==='depto')      return `<td style="font-weight:500">${depName}</td>`;
        if(k==='name')       return `<td style="font-weight:500">${r.name}</td>`;
        if(k==='municipios') return `<td>${r.municipios||'—'}</td>`;
        if(k==='hombres')    return `<td>${fmtNp(r.hombres||0)}</td>`;
        if(k==='mujeres')    return `<td>${fmtNp(r.mujeres||0)}</td>`;
        if(k==='total')      return `<td>${fmtNp(r.total||0)}</td>`;
        if(k==='indigena')   return `<td>${fmtNp(et.indigena||0)}</td>`;
        if(k==='gitano')     return `<td>${fmtNp(et.gitano||0)}</td>`;
        if(k==='raizal')     return `<td>${fmtNp(et.raizal||0)}</td>`;
        if(k==='palenquero') return `<td>${fmtNp(et.palenquero||0)}</td>`;
        if(k==='negro')      return `<td>${fmtNp(et.negro||0)}</td>`;
        if(k==='ninguno')    return `<td>${fmtNp(et.ninguno||0)}</td>`;
        if(k==='noinforma')  return `<td>${(et.noinforma||0)>0?fmtNp(et.noinforma):'—'}</td>`;
        if(k==='pct')        return `<td>${((r.total||0)/grandTot*100).toFixed(1)}%</td>`;
        return '<td>—</td>';
      }).join('')}
    </tr>`;}).join("");
  
    // ── Densidad poblacional ─────────────────────────────────────
    const AREA_KM2 = {antioquia:17405,choco:48428,valle:11115,narino:21439,cauca:10381,cordoba:4242,risaralda:1088};
    // Área por municipio en km² (AreaHa/100)
    const AREA_MUNI_KM2 = {
      'Abriaquí':1.66,'Apartadó':607,'Carepa':374,'Cañasgordas':534,'Chigorodó':678,'Dabeiba':2640,'Frontino':1461,'Ituango':4144,'Murindó':3491,'Mutatá':1462,'Necoclí':1540,'San Pedro De Urabá':597,'Turbo':3055,'Uramita':384,'Urrao':2661,'Vigía Del Fuerte':769,
      'Argelia':900,'El Tambo':1010,'Guapi':2688,'López De Micay':2169,'Timbiquí':1843,
      'Acandí':914,'Alto Baudó':2427,'Atrato':503,'Bagadó':813,'Bahía Solano':1106,'Bajo Baudó':2415,'Bojayá':3022,'Carmen Del Darién':3498,'Condoto':299,'Cértegui':311,'El Cantón Del San Pablo':524,'El Carmen De Atrato':793,'El Litoral Del San Juan':2157,'Istmina':1063,'Juradó':964,'Lloró':1191,'Medio Atrato':1827,'Medio Baudó':1650,'Medio San Juan':534,'Nuquí':1126,'Nóvita':734,'Quibdó':3023,'Riosucio':7135,'Río Iró':453,'Río Quito':1044,'San José Del Palmar':700,'Sipí':734,'Tadó':1217,'Unguía':1729,'Unión Panamericana':379,
      'Tierralta':3093,'Valencia':1256,
      'Barbacoas':3584,'Cumbal':622,'Cumbitara':422,'El Charco':1483,'El Rosario':265,'Francisco Pizarro':612,'La Llanada':175,'La Tola':383,'Leiva':261,'Los Andes':345,'Magüí':2688,'Mallama':637,'Mosquera':1125,'Olaya Herrera':877,'Policarpa':559,'Ricaurte':1673,'Roberto Payán':1347,'Samaniego':639,'San Andrés De Tumaco':3760,'Santa Bárbara':851,'Santacruz':560,'Sapuyes':131,
      'Mistrató':618,'Pueblo Rico':438,
      'Argelia Valle':266,'Bolívar':1093,'Buenaventura':6078,'Calima':755,'Dagua':1261,'El Cairo':306,'El Dovio':376,'La Cumbre':362,'La Unión':239,'Restrepo':265,'Roldanillo':234,'Trujillo':341,'Versalles':260,'Vijes':155,'Yotoco':271
    };
  
    // Determinar qué datos usar según el filtro
    const densDepSel = dep;
    const densMuniSel = muniSel;
    let densSource, densTitle, densUseRows;
  
    if(densMuniSel !== 'todos' && muniRows && muniRows.length) {
      // Municipio específico seleccionado
      densSource = muniRows;
      densTitle = "Densidad — municipio seleccionado";
      densUseRows = muniRows.map(r => ({
        ...r, id: r.id||r.name,
        dens: parseFloat((r.total / (AREA_MUNI_KM2[r.name] || 1)).toFixed(1))
      }));
    } else if(densDepSel !== 'todos' && muniRows && muniRows.length) {
      // Departamento seleccionado → mostrar municipios
      densTitle = "Densidad por municipio (hab/km²)";
      densUseRows = muniRows.map(r => ({
        ...r,
        dens: parseFloat((r.total / (AREA_MUNI_KM2[r.name] || 1)).toFixed(1))
      })).sort((a,b)=>b.dens-a.dens);
    } else {
      // Todos los departamentos
      densTitle = "Densidad por departamento (hab/km²)";
      densUseRows = [...rows].map(r=>({...r, dens: parseFloat((r.total/(AREA_KM2[r.id]||1)).toFixed(1))}))
        .sort((a,b)=>b.dens-a.dens);
    }
  
    // Actualizar título del gráfico
    const densTitleEl = el("ch-dens-bar")?.closest('.chart-card')?.querySelector('h3');
    if(densTitleEl) densTitleEl.textContent = densTitle;
  
    // Actualizar KPIs densidad
    const mayorDens = densUseRows[0];
    const menorDens = densUseRows[densUseRows.length-1];
    const totalPobDens = densUseRows.reduce((s,r)=>s+(r.total||0),0);
    const totalAreaDens = densUseRows.reduce((s,r)=>s+(AREA_KM2[r.id]||AREA_MUNI_KM2[r.name]||0),0);
    const densTotal = totalAreaDens > 0 ? (totalPobDens/totalAreaDens).toFixed(1).replace(".",",") : "—";
    const contexto = densDepSel==='todos' ? "Chocó Biogeográfico" : (densMuniSel!=='todos' ? densMuniSel : mayorDens?.name||densDepSel);
  
    if(el("pob-dens-total")) el("pob-dens-total").textContent = densTotal+" hab/km²";
    if(el("pob-dens-total-sub")) el("pob-dens-total-sub").textContent = contexto;
    if(el("pob-area-total")) el("pob-area-total").textContent = totalAreaDens.toLocaleString("es-CO")+" km²";
    if(el("pob-area-total-sub")) el("pob-area-total-sub").textContent = (totalAreaDens*100).toLocaleString("es-CO")+" Ha";
    if(el("pob-dens-mayor")) el("pob-dens-mayor").textContent = mayorDens?.name||"—";
    if(el("pob-dens-mayor-val")) el("pob-dens-mayor-val").textContent = mayorDens ? mayorDens.dens.toFixed(1).replace(".",",")+" hab/km²" : "—";
    if(el("pob-dens-menor")) el("pob-dens-menor").textContent = menorDens?.name||"—";
    if(el("pob-dens-menor-val")) el("pob-dens-menor-val").textContent = menorDens ? menorDens.dens.toFixed(1).replace(".",",")+" hab/km²" : "—";
  
    const PAL_DENS = ["#1A237E","#283593","#303F9F","#3949AB","#3F51B5","#5C6BC0","#7986CB"];
    const densColors = densUseRows.map((_,i)=>PAL_DENS[i%PAL_DENS.length]);
    const densTotalVal = densUseRows.reduce((s,r)=>s+r.dens,0)||1;
  
    if(el("leg-dens-dona")) el("leg-dens-dona").innerHTML = densUseRows.map((r,i)=>
      `<span><span class="ldot" style="background:${densColors[i]}"></span>${r.name.length>12?r.name.slice(0,11)+"…":r.name} ${(r.dens/densTotalVal*100).toFixed(1)}%</span>`).join("");
  
    // Ajustar alto del gráfico de densidad según número de filas
    const densBarEl = el("ch-dens-bar");
    if(densBarEl) {
      const densHeight = densDepSel !== 'todos' 
        ? Math.max(200, densUseRows.length * 20 + 40)
        : Math.max(240, densUseRows.length * 30 + 60);
      densBarEl.parentElement.style.height = densHeight + "px";
    }
  
    if(W._chartDensBar){W._chartDensBar.destroy();}
    if(el("ch-dens-bar")) W._chartDensBar = new Chart(el("ch-dens-bar"),{
      type:"bar",
      data:{labels:densUseRows.map(r=>r.name.length>14?r.name.slice(0,13)+"…":r.name), datasets:[{data:densUseRows.map(r=>r.dens), backgroundColor:densColors, borderRadius:4, borderSkipped:false}]},
      options:{
        indexAxis:"y", responsive:true, maintainAspectRatio:false,
        plugins:{legend:{display:false}, tooltip:{
          backgroundColor:"rgba(0,0,0,0.8)",titleColor:"#fff",bodyColor:"#fff",
          titleFont:{size:13,weight:"600"},bodyFont:{size:12},padding:10,cornerRadius:4,
          footerColor:"#fff",footerFont:{size:11,weight:"400"},footerMarginTop:6,
          callbacks:{
            title:i=>densUseRows[i[0].dataIndex]?.name||i[0].label,
            label:c=>` ${c.raw.toFixed(1).replace(".",",")} hab/km²`,
            footer:i=>{const r=densUseRows[i[0].dataIndex];return r?`Población: ${fmtN(r.total)} hab.`:"";}
          }
        }},
        scales:{
          x:{grid:{color:"rgba(0,0,0,0.05)"},ticks:{font:{size:10},callback:v=>v+" hab/km²"}},
          y:{grid:{display:false},ticks:{font:{size:10},autoSkip:false}}
        }
      }
    });
  
    if(W._chartDensDona){W._chartDensDona.destroy();}
    if(el("ch-dens-dona")) W._chartDensDona = new Chart(el("ch-dens-dona"),{
      type:"doughnut",
      data:{labels:densUseRows.map(r=>r.name), datasets:[{data:densUseRows.map(r=>r.dens), backgroundColor:densColors, borderWidth:2, borderColor:"#fff", hoverOffset:6}]},
      options:{
        responsive:true, maintainAspectRatio:false,
        plugins:{legend:{display:false}, tooltip:{
          backgroundColor:"rgba(0,0,0,0.8)",titleColor:"#fff",bodyColor:"#fff",
          titleFont:{size:13,weight:"600"},bodyFont:{size:12},padding:10,cornerRadius:4,
          callbacks:{label:c=>`${c.label}: ${c.raw.toFixed(1).replace(".",",")} hab/km² (${(c.raw/densTotalVal*100).toFixed(1)}%)`}
        }}
      }
    });
  
    const ETNIA_KEYS  = ['indigena','gitano','raizal','palenquero','negro','ninguno','noinforma'];
    // Inicializar globals para que getEtnia() los encuentre
    const ETNIA_LABS  = ['Indígena','Gitano o Rom *','Raizal *','Palenquero *','Negro','Ningún grupo étnico','No informa'];
    const ETNIA_PALS  = ['#827717','#7B1FA2','#00838F','#E65100','#2E7D32','#78909C','#B0BEC5'];
  
    // Filtrar según depto y municipio
    let etniaSrc, etniaTituloBar, etniaTituloDona;
    if(muniSel !== 'todos' && dep !== 'todos') {
      // Municipio específico
      const muniData = (W.ETNIA_MUNIS[dep]||[]).filter(r=>r.name===muniSel);
      etniaSrc = muniData.length ? muniData : (W.ETNIA_MUNIS[dep]||[]);
      etniaTituloBar = `Grupos étnicos — ${muniSel}`;
      etniaTituloDona = `Distribución total — ${muniSel}`;
    } else if(dep !== 'todos') {
      // Departamento seleccionado → todos sus municipios
      etniaSrc = W.ETNIA_MUNIS[dep] || W.ETNIA_DATA.filter(r=>r.id===dep);
      const depName = W.ETNIA_DATA.find(r=>r.id===dep)?.name || dep;
      etniaTituloBar = `Grupos étnicos por municipio — ${depName}`;
      etniaTituloDona = `Distribución total — ${depName}`;
    } else {
      // Todos los departamentos
      etniaSrc = W.ETNIA_DATA;
      etniaTituloBar = "Grupos étnicos por departamento";
      etniaTituloDona = "Distribución total — Chocó Biogeográfico";
    }
  
    // Nueva tabla: Detalle por grupo étnico (respeta filtro depto/muni de la parte superior)
    {
      const etniaTheadEl = el("pob-etnia-thead");
      const etniaTbodyEl = el("pob-etnia-tbody");
      const etniaTfootEl = el("pob-etnia-tfoot");
      if(etniaTheadEl && etniaTbodyEl){
        const showMuniColEtnia = dep !== 'todos';
        const ETNIA_LABS_TBL = ['Indígena','Gitano o Rom','Raizal','Palenquero','Negro/Afro','Ningún grupo étnico','No informa'];
        etniaTheadEl.innerHTML = `<tr>
          <th>Departamento</th>
          ${showMuniColEtnia?'<th>Municipio</th>':''}
          ${ETNIA_LABS_TBL.map(l=>`<th>${l}</th>`).join('')}
          <th>% del total</th>
        </tr>`;
        const depNameMapEtnia = {}; W.ETNIA_DATA.forEach(d=>depNameMapEtnia[d.id]=d.name);
        let etniaRowsTbl;
        if(dep === 'todos'){
          etniaRowsTbl = W.ETNIA_DATA.map(d=>({depto:d.name, muni:null, ...d}));
        } else {
          const depNameEtnia = depNameMapEtnia[dep]||dep;
          const munisEtnia = (W.ETNIA_MUNIS[dep]||[]);
          const filteredEtnia = muniSel!=='todos' ? munisEtnia.filter(m=>m.name===muniSel) : munisEtnia;
          etniaRowsTbl = filteredEtnia.map(m=>({depto:depNameEtnia, muni:m.name, ...m}));
        }
        const etniaGrandTotalRows = etniaRowsTbl.reduce((s,r)=>s+ETNIA_KEYS.reduce((ss,k)=>ss+(r[k]||0),0),0)||1;
        etniaTbodyEl.innerHTML = etniaRowsTbl.map(r=>{
          const rowTotal = ETNIA_KEYS.reduce((s,k)=>s+(r[k]||0),0);
          return `<tr>
          <td style="font-weight:500">${r.depto}</td>
          ${showMuniColEtnia?`<td style="font-weight:500">${r.muni}</td>`:''}
          ${ETNIA_KEYS.map(k=>`<td>${fmtN(r[k]||0)}</td>`).join('')}
          <td>${(rowTotal/etniaGrandTotalRows*100).toFixed(1)}%</td>
        </tr>`;}).join('');
  
        const etniaTotals = {}; ETNIA_KEYS.forEach(k=>etniaTotals[k]=etniaRowsTbl.reduce((s,r)=>s+(r[k]||0),0));
        if(etniaTfootEl){
          etniaTfootEl.innerHTML = `<tr style="border-top:1.5px solid var(--border2);background:var(--bg)">
              <td style="font-weight:600;padding:6px 8px;text-align:center;vertical-align:middle">Total</td>
              ${showMuniColEtnia?`<td style="font-weight:600;padding:6px 8px;text-align:center;vertical-align:middle">${etniaRowsTbl.length} registros</td>`:''}
              ${ETNIA_KEYS.map(k=>`<td style="font-weight:600;padding:6px 8px;text-align:center;vertical-align:middle">${fmtN(etniaTotals[k])}</td>`).join('')}
              <td style="font-weight:600;padding:6px 8px;text-align:center;vertical-align:middle">100%</td>
            </tr>`;
        }
      }
    }
  
    // Actualizar títulos
    const etniaTitleBar = el("ch-etnia-bar")?.closest('.chart-card')?.querySelector('h3');
    const etniaTitleDona = el("ch-etnia-dona")?.closest('.chart-card')?.querySelector('h3');
    if(etniaTitleBar) etniaTitleBar.textContent = etniaTituloBar;
    if(etniaTitleDona) etniaTitleDona.textContent = etniaTituloDona;
  
    // Totales para dona
    const etniaTotales = ETNIA_KEYS.map(k=>etniaSrc.reduce((s,r)=>s+(r[k]||0),0));
    const etniaTotalPob = etniaTotales.reduce((s,v)=>s+v,0)||1;
  
    // Leyenda dona
    const legDona = document.getElementById("leg-etnia-dona");
    if(legDona) legDona.innerHTML = ETNIA_LABS.map((l,i)=>
      `<span><span class="ldot" style="background:${ETNIA_PALS[i]}"></span>${l}</span>`).join("");
  
    if(el("ch-etnia-dona")){
      if(W._chartEtniaDona) W._chartEtniaDona.destroy();
      W._chartEtniaDona = new Chart(el("ch-etnia-dona"),{
        type:"doughnut",
        data:{labels:ETNIA_LABS, datasets:[{data:etniaTotales, backgroundColor:ETNIA_PALS, borderWidth:2, borderColor:"#fff", hoverOffset:6}]},
        options:{
          responsive:true, maintainAspectRatio:false,
          plugins:{
            legend:{display:false},
            tooltip:{callbacks:{label:c=>{
              const pct=(c.raw/etniaTotalPob*100).toFixed(1);
              return c.label+": "+fmtN(c.raw)+" hab. ("+pct+"%)";
            }}}
          }
        }
      });
    }
  
    // Barras apiladas por departamento
    const legBar = document.getElementById("leg-etnia-bar");
    if(legBar) legBar.innerHTML = ETNIA_LABS.map((l,i)=>
      `<span><span class="ldot" style="background:${ETNIA_PALS[i]}"></span>${l}</span>`).join("");
  
    if(el("ch-etnia-bar")){
      if(W._chartEtniaBar) W._chartEtniaBar.destroy();
      // Ajustar alto y grosor según nivel de filtro
      const etniaBarEl = el("ch-etnia-bar");
      const etniaBarHeight = dep !== 'todos'
        ? Math.max(200, etniaSrc.length * 20 + 40)
        : Math.max(280, etniaSrc.length * 36 + 40);
      etniaBarEl.parentElement.style.height = etniaBarHeight + "px";
      const etniaBarThickness = dep !== 'todos' ? 12 : undefined;
  
      // Ordenar de mayor a menor por población total
      const etniaSrcSorted = [...etniaSrc].sort((a,b)=>{
        const totA = ETNIA_KEYS.reduce((s,k)=>s+(a[k]||0),0);
        const totB = ETNIA_KEYS.reduce((s,k)=>s+(b[k]||0),0);
        return totB - totA;
      });
      const eBarLabels = etniaSrcSorted.map(r=>r.name.length>13?r.name.substring(0,12)+"…":r.name);
      const eBarDatasets = ETNIA_KEYS.map((k,i)=>({
        label:ETNIA_LABS[i],
        data:etniaSrcSorted.map(r=>r[k]||0),
        backgroundColor:ETNIA_PALS[i],
        borderRadius:3, borderSkipped:false,
        ...(etniaBarThickness ? {barThickness: etniaBarThickness} : {})
      }));
      W._chartEtniaBar = new Chart(el("ch-etnia-bar"),{
        type:"bar",
        data:{labels:eBarLabels, datasets:eBarDatasets},
        options:{
          indexAxis:"y", responsive:true, maintainAspectRatio:false,
          interaction:{mode:"index", axis:"y", intersect:false},
          plugins:{
            legend:{display:false},
            tooltip:{
              backgroundColor:"rgba(0,0,0,0.8)", titleColor:"#fff", bodyColor:"#fff",
              titleFont:{size:13,weight:"600"}, bodyFont:{size:12}, padding:10, cornerRadius:4,
              callbacks:{
                title: items=>items[0].label,
                label: c=>" "+c.dataset.label+": "+fmtN(c.raw)+" hab.",
                footer: items=>{
                  const tot=items.reduce((s,c)=>s+c.raw,0);
                  return "Total: "+fmtN(tot)+" hab.";
                }
              },
              footerColor:"#fff", footerFont:{size:13,weight:"600"}, footerMarginTop:8
            }
          },
          scales:{
            x:{stacked:true, grid:{color:"rgba(0,0,0,0.05)"}, ticks:{font:{size:11}, callback:v=>v>=1e6?(v/1e6).toFixed(1)+"M":v>=1e3?(v/1e3).toFixed(0)+"k":v}},
            y:{stacked:true, grid:{display:false}, ticks:{font:{size:11}, autoSkip:false}}
          }
        }
      });
    }
  }
  
  function showToast(msg, tipo='success', dur){
    const area=document.getElementById('toast-area');
    const t=document.createElement('div');
    const icons={success:'✅',loading:'⟳',error:'❌'};
    const durations={success:3500,loading:2500,error:5000};
    t.className='toast t-'+tipo;
    const iconHtml=tipo==='loading'
      ? `<span class="t-spin" aria-hidden="true">⟳</span>`
      : `<span aria-hidden="true">${icons[tipo]||'ℹ'}</span>`;
    t.innerHTML=`${iconHtml}<span>${msg}</span>`;
    area.appendChild(t);
    requestAnimationFrame(()=>requestAnimationFrame(()=>t.classList.add('show')));
    const ms=dur||(durations[tipo]||3500);
    setTimeout(()=>{
      t.classList.remove('show');
      setTimeout(()=>t.remove(), 350);
    }, ms);
    return t; // permite removerlo manualmente (ej. loading)
  }
  function removeToast(t){ if(t){ t.classList.remove('show'); setTimeout(()=>t.remove(),350); } }
  
  // Marcar datos que ya vienen embebidos como cargados
  // ── ORDENAMIENTO TABLA GENERAL ───────────────────────────────────────
  let _genSortCol=null, _genSortAsc=true, _genLastRows=[];
  let _titSortCol=null, _titSortAsc=true, _titLastRows=[];
  let _pobSortCol=null, _pobSortAsc=true, _pobLastRows=[];
  
  function _buildPobHead(isMuni){
    const deptoNames={"choco":"Chocó","narino":"Nariño","antioquia":"Antioquia","cauca":"Cauca","valle":"Valle del Cauca","cordoba":"Córdoba","risaralda":"Risaralda"};
    const depSel=document.getElementById("sel-depto")?.value||'todos';
    const depName=deptoNames[depSel]||depSel;
  
    const etniaCols = [
      {key:'indigena',   label:'Indígena',            w:'7%',  type:'num'},
      {key:'gitano',     label:'Gitano o Rom',         w:'7%',  type:'num'},
      {key:'raizal',     label:'Raizal',               w:'7%',  type:'num'},
      {key:'palenquero', label:'Palenquero',           w:'7%',  type:'num'},
      {key:'negro',      label:'Negro / Afro',         w:'8%',  type:'num'},
      {key:'ninguno',    label:'Ningún grupo étnico',  w:'9%',  type:'num'},
      {key:'noinforma',  label:'No informa',           w:'7%',  type:'num'},
    ];
  
    const cols = isMuni
      ? [
          {key:'depto',      label:'Departamento', w:'10%', type:'str'},
          {key:'name',       label:'Municipio',    w:'10%', type:'str'},
          {key:'hombres',    label:'Hombres',      w:'8%',  type:'num'},
          {key:'mujeres',    label:'Mujeres',      w:'8%',  type:'num'},
          {key:'total',      label:'Total',        w:'8%',  type:'num'},
          ...etniaCols,
          {key:'pct',        label:'% del Total',  w:'6%',  type:'num'},
        ]
      : [
          {key:'name',       label:'Departamento', w:'10%', type:'str'},
          {key:'municipios', label:'Municipios',   w:'7%',  type:'num'},
          {key:'hombres',    label:'Hombres',      w:'8%',  type:'num'},
          {key:'mujeres',    label:'Mujeres',      w:'8%',  type:'num'},
          {key:'total',      label:'Total',        w:'8%',  type:'num'},
          ...etniaCols,
          {key:'pct',        label:'% del Total',  w:'6%',  type:'num'},
        ];
  
    const _pobThead=document.getElementById('pob-thead'); if(_pobThead) _pobThead.innerHTML=`<tr style="vertical-align:middle">${
      cols.map(c=>`<th style="position:relative;width:${c.w}">
        <div class="th-inner" data-on-click="sortPobTable('${c.key}')">
          <span class="th-label">${c.label}</span>
          <div class="sort-btn">
            <div class="sort-arrow up"   id="psa-${c.key}-up"></div>
            <div class="sort-arrow down" id="psa-${c.key}-down"></div>
          </div>
        </div>
        <div class="col-tip" id="ptip-${c.key}">
          ${c.type==='str'?'Clic para ordenar A→Z / Z→A':'Clic para ordenar menor→mayor / mayor→menor'}
        </div>
      </th>`).join('')
    }</tr>`;
    return {cols, depName};
  }
  
  function sortPobTable(col){
    if(_pobSortCol===col){_pobSortAsc=!_pobSortAsc;}
    else{_pobSortCol=col;_pobSortAsc=(col==='name'||col==='depto');}
  
    const fmtN=n=>Number(n).toLocaleString("es-CO");
    const isMuni=!!(_pobLastRows[0]?._isMuni);
    const {cols, depName}=_buildPobHead(isMuni);
    const colKeys=cols.map(c=>c.key);
  
    colKeys.forEach(c=>{
      const u=document.getElementById('psa-'+c+'-up'),d=document.getElementById('psa-'+c+'-down');
      if(u)u.classList.remove('active'); if(d)d.classList.remove('active');
      const t=document.getElementById('ptip-'+c);
      if(!t)return;
      if(c===_pobSortCol){
        document.getElementById('psa-'+c+'-'+(_pobSortAsc?'up':'down'))?.classList.add('active');
        const isStr=(c==='name'||c==='depto');
        t.textContent=_pobSortAsc
          ?(isStr?'Ordenado: A→Z. Clic para invertir':'Ordenado: menor→mayor. Clic para invertir')
          :(isStr?'Ordenado: Z→A. Clic para invertir':'Ordenado: mayor→menor. Clic para invertir');
      } else {
        t.textContent=(c==='name'||c==='depto')?'Clic para ordenar A→Z / Z→A':'Clic para ordenar menor→mayor / mayor→menor';
      }
    });
  
    const sorted=[..._pobLastRows].sort((a,b)=>{
      const va=a[col]??0, vb=b[col]??0;
      if(typeof va==='string')return _pobSortAsc?va.localeCompare(vb,'es'):vb.localeCompare(va,'es');
      return _pobSortAsc?va-vb:vb-va;
    });
  
    document.getElementById('pob-tbody').innerHTML=sorted.map(r=>`<tr>
      ${colKeys.map(k=>{
        if(k==='depto')      return `<td style="font-weight:500">${depName}</td>`;
        if(k==='name')       return `<td style="font-weight:500">${r.name}</td>`;
        if(k==='municipios') return `<td>${r.municipios||'—'}</td>`;
        if(k==='hombres')    return `<td>${fmtN(r.hombres||0)}</td>`;
        if(k==='mujeres')    return `<td>${fmtN(r.mujeres||0)}</td>`;
        if(k==='total')      return `<td>${fmtN(r.total||0)}</td>`;
        if(k==='indigena')   return `<td>${fmtN(r.indigena||0)}</td>`;
        if(k==='gitano')     return `<td>${fmtN(r.gitano||0)}</td>`;
        if(k==='raizal')     return `<td>${fmtN(r.raizal||0)}</td>`;
        if(k==='palenquero') return `<td>${fmtN(r.palenquero||0)}</td>`;
        if(k==='negro')      return `<td>${fmtN(r.negro||0)}</td>`;
        if(k==='ninguno')    return `<td>${fmtN(r.ninguno||0)}</td>`;
        if(k==='noinforma')  return `<td>${r.noinforma>0?fmtN(r.noinforma):'—'}</td>`;
        if(k==='pct')        return `<td>${(r.pct||0).toFixed(1)}%</td>`;
        return '<td>—</td>';
      }).join('')}
    </tr>`).join('');
  }
  
  function sortTitTable(col){
    if(_titSortCol===col){_titSortAsc=!_titSortAsc;}
    else{_titSortCol=col;_titSortAsc=(col==='depto'||col==='muni');}
  
    const TIT_COLS=['depto','muni','num_cc','cc','num_ri','ri','st','tot','pct'];
    TIT_COLS.forEach(c=>{
      const u=document.getElementById('tsa-'+c+'-up'),d=document.getElementById('tsa-'+c+'-down');
      if(u)u.classList.remove('active'); if(d)d.classList.remove('active');
      const t=document.getElementById('ttip-'+c);
      if(!t)return;
      if(c===_titSortCol){
        document.getElementById('tsa-'+c+'-'+(_titSortAsc?'up':'down'))?.classList.add('active');
        t.textContent=_titSortAsc
          ?((c==='depto'||c==='muni')?'Ordenado: A→Z. Clic para invertir':'Ordenado: menor→mayor. Clic para invertir')
          :((c==='depto'||c==='muni')?'Ordenado: Z→A. Clic para invertir':'Ordenado: mayor→menor. Clic para invertir');
      } else {
        t.textContent=(c==='depto'||c==='muni')?'Clic para ordenar A→Z / Z→A':'Clic para ordenar menor→mayor / mayor→menor';
      }
    });
  
    const sorted=[..._titLastRows].sort((a,b)=>{
      const va=a[col]??0, vb=b[col]??0;
      if(typeof va==='string')return _titSortAsc?va.localeCompare(vb,'es'):vb.localeCompare(va,'es');
      return _titSortAsc?va-vb:vb-va;
    });
  
    const fmtT=v=>v>0?Number(v).toLocaleString('es-CO',{minimumFractionDigits:1,maximumFractionDigits:1})+' Ha':'—';
    const showMuniCol=sorted[0]?.showMuniCol;
    const visCC=sorted[0]?.visCC, visRI=sorted[0]?.visRI, visST=sorted[0]?.visST;
    document.getElementById('tit-tbody').innerHTML=sorted.map(r=>`<tr>
      <td style="font-weight:500">${r.depto}</td>${showMuniCol?`<td style="font-weight:500">${r.muni}</td>`:''}
      <td style="text-align:center">${visCC?(r.num_cc!==undefined?r.num_cc:'—'):'—'}</td>
      <td>${visCC?fmtT(r.cc):'—'}</td>
      <td style="text-align:center">${visRI?(r.num_ri!==undefined?r.num_ri:'—'):'—'}</td>
      <td>${visRI?fmtT(r.ri):'—'}</td>
      <td>${visST?fmtT(r.st):'—'}</td>
      <td style="white-space:nowrap">${fmtT(r.tot)}</td>
      <td>${r.pct.toFixed(1)}%</td>
    </tr>`).join('');
  }
  
  function _buildGenHead(showMuniCol){
    const cols = showMuniCol
      ? [
          {key:'name',      label:'Departamento', w:'25%', sort:true, type:'str'},
          {key:'muni',      label:'Municipio',    w:'25%', sort:true, type:'str'},
          {key:'area',      label:'Área (Ha)',     w:'25%', sort:true, type:'num'},
          {key:'pct',       label:'% del total',  w:'25%', sort:true, type:'num'},
        ]
      : [
          {key:'name',      label:'Departamento', w:'25%', sort:true, type:'str'},
          {key:'municipios',label:'Municipios',   w:'25%', sort:true, type:'num'},
          {key:'area',      label:'Área (Ha)',     w:'25%', sort:true, type:'num'},
          {key:'pct',       label:'% del total',  w:'25%', sort:true, type:'num'},
        ];
  
    document.getElementById('tbl-gen-head').innerHTML = `<tr style="vertical-align:middle">${
      cols.map(c=>`<th style="position:relative;width:${c.w}">
        <div class="th-inner" data-on-click="sortGenTable('${c.key}')">
          <span class="th-label">${c.label}</span>
          <div class="sort-btn">
            <div class="sort-arrow up"  id="sa-${c.key}-up"></div>
            <div class="sort-arrow down" id="sa-${c.key}-down"></div>
          </div>
        </div>
        <div class="col-tip" id="tip-${c.key}">
          ${c.type==='str'?'Clic para ordenar A→Z / Z→A':'Clic para ordenar menor→mayor / mayor→menor'}
        </div>
      </th>`).join('')
    }</tr>`;
    return cols.map(c=>c.key);
  }
  
  function sortGenTable(col){
    if(_genSortCol===col){_genSortAsc=!_genSortAsc;}
    else{_genSortCol=col;_genSortAsc=(col==='name'||col==='muni');}
  
    const showMuniCol=!!(_genLastRows[0]?.muni!==undefined);
    const colKeys=_buildGenHead(showMuniCol);
  
    colKeys.forEach(c=>{
      const u=document.getElementById('sa-'+c+'-up'),d=document.getElementById('sa-'+c+'-down');
      if(u)u.classList.remove('active'); if(d)d.classList.remove('active');
      const t=document.getElementById('tip-'+c);
      if(!t)return;
      if(c===_genSortCol){
        document.getElementById('sa-'+c+'-'+(_genSortAsc?'up':'down'))?.classList.add('active');
        const asc=(c==='name'||c==='muni');
        t.textContent=_genSortAsc
          ?(asc?'Ordenado: A→Z. Clic para invertir':'Ordenado: menor→mayor. Clic para invertir')
          :(asc?'Ordenado: Z→A. Clic para invertir':'Ordenado: mayor→menor. Clic para invertir');
      } else {
        t.textContent=(c==='name'||c==='muni')?'Clic para ordenar A→Z / Z→A':'Clic para ordenar menor→mayor / mayor→menor';
      }
    });
  
    const sorted=[..._genLastRows].sort((a,b)=>{
      const va=a[col]??0, vb=b[col]??0;
      if(typeof va==='string')return _genSortAsc?va.localeCompare(vb,'es'):vb.localeCompare(va,'es');
      return _genSortAsc?va-vb:vb-va;
    });
  
    const fmtA=v=>v!=null&&!isNaN(v)&&v>0?Number(v).toLocaleString('es-CO',{minimumFractionDigits:1,maximumFractionDigits:1})+' Ha':'—';
    document.getElementById('tbl-gen-body').innerHTML=sorted.map(r=>`<tr>
      ${colKeys.map(k=>{
        if(k==='name')    return `<td style="font-weight:500">${r.name||'—'}</td>`;
        if(k==='muni')    return `<td style="font-weight:500">${r.muni||'—'}</td>`;
        if(k==='municipios') return `<td>${r.municipios??'—'}</td>`;
        if(k==='area')    return `<td>${fmtA(r.area)}</td>`;
        if(k==='pct')     return `<td>${r.pct!=null?r.pct.toFixed(1)+'%':'—'}</td>`;
        return '<td>—</td>';
      }).join('')}
    </tr>`).join('');
  }
  
  // ── MODAL CARGA DE DATOS ────────────────────────────────────────────────
  const MC_CAPAS=[
    {id:'limites',   label:'Límites',            dot:'#0F6E56', chips:['DeptoNom','MpNombre','AreaHa'],                                  accept:'.xls,.xlsx'},
    {id:'cc',        label:'Cons. Com.',          dot:'#E8A020', chips:['DeptoNom','MpNombre','Area_ha'],  opt:['ID','NOMBRE'],         accept:'.xls,.xlsx'},
    {id:'ri',        label:'Resg. Ind.',          dot:'#9B6B9E', chips:['DeptoNom','MpNombre','Area_ha'],  opt:['ID','NOMBRE'],         accept:'.xls,.xlsx'},
    {id:'cuencas',   label:'Cuencas',             dot:'#1565C0', chips:['DeptoNom','MpNombre','area_ha','nom_zh','nom_szh'],               accept:'.xls,.xlsx'},
    {id:'humedales', label:'Humedales',           dot:'#00838F', chips:['DeptoNom','MpNombre','Area_ha'],                                  accept:'.xls,.xlsx'},
    {id:'runap',     label:'RUNAP',               dot:'#2E7D32', chips:['DeptoNom','MpNombre','area_ha'],                                  accept:'.xls,.xlsx'},
    {id:'paramos',   label:'Páramos',             dot:'#4A148C', chips:['DeptoNom','MpNombre','Area_ha'],                                  accept:'.xls,.xlsx'},
    {id:'manglares', label:'Manglares',           dot:'#388E3C', chips:['DeptoNom','MpNombre','Area_ha'],                                  accept:'.xls,.xlsx'},
    {id:'poblacion', label:'Población',           dot:'#880E4F', chips:['DeptoNom','MpNombre','SEXO_H','SEXO_M','EDAD_0_4…','GRUPO_ET_1…'], accept:'.xls,.xlsx'},
    {id:'cienagas',  label:'Ciénagas',            dot:'#0A4A5E', chips:['DeptoNom','MpNombre','Area_ha','NOMBRE_GEOGRAFICO'],                       accept:'.xls,.xlsx'},
  ];
  
  // Estado inicial — precargados desde localStorage y datos embebidos
  W._MC_STATES={};
  const _MC_LS_MAP={limites:'choco_limites',cc:'choco_cc_raw',ri:'choco_ri_raw',cuencas:'choco_cuencas',humedales:'choco_humedales',runap:'choco_runap',paramos:'choco_paramos',manglares:'choco_manglares',poblacion:'choco_poblacion',cienagas:'choco_cienagas'};
  MC_CAPAS.forEach(c=>{
    const enLS=!!localStorage.getItem(_MC_LS_MAP[c.id]);
    // cuencas, humedales, runap, paramos, manglares, cienagas tienen datos embebidos (real:true)
    const embebido=['cuencas','humedales','runap','paramos','manglares','cienagas'].includes(c.id);
    const savedTs=localStorage.getItem('choco_ts_'+c.id);
    const tsVal=savedTs?new Date(savedTs):(enLS||embebido?'datos base':null);
    W._MC_STATES[c.id]={loaded:enLS||embebido, ts:tsVal, loading:false};
  });
  // limites, cc, ri, poblacion siempre vienen precargados (datos embebidos)
  ['limites','cc','ri','poblacion'].forEach(id=>{ W._MC_STATES[id].loaded=true; W._MC_STATES[id].ts='datos base'; });
  
  function actualizarBadge(){
    const n=MC_CAPAS.filter(c=>!W._MC_STATES[c.id].loaded).length;
    const b=document.getElementById('badge-pendiente');
    if(!b) return;
    b.textContent=n;
    b.className='pending-badge'+(n===0?' hidden':'');
  }
  
  function abrirModalCarga(){
    if(!puedeEditar) return;
    renderModalCarga();
    document.getElementById('modal-carga-overlay').classList.add('open');
  }
  
  function cerrarModalCarga(){
    document.getElementById('modal-carga-overlay').classList.remove('open');
  }
  
  function fmtMcTs(ts){
    if(!ts||ts==='datos base') return null;
    if(ts==='hace un momento') return ts;
    const d = ts instanceof Date ? ts : new Date(ts);
    if(isNaN(d)) return ts;
    const diff=Math.floor((Date.now()-d)/1000);
    if(diff<120) return 'hace un momento';
    if(diff<3600) return `hace ${Math.floor(diff/60)} min`;
    if(diff<86400) return `hace ${Math.floor(diff/3600)} h`;
    const dias=Math.floor(diff/86400);
    if(dias===1) return 'hace 1 día';
    if(dias<7) return `hace ${dias} días`;
    return d.toLocaleDateString('es-CO',{day:'numeric',month:'short',year:'numeric'});
  }
  
  function mcRowHtml(c){
    const s=W._MC_STATES[c.id];
    const isLoading=s.loading;
    const isFresh=s.ts==='hace un momento';
    const barCls=isLoading?'mc-bar-load':s.loaded?'mc-bar-ok':'mc-bar-pend';
    const ts=fmtMcTs(s.ts);
    let actionHtml, tsHtml='';
    if(isLoading){
      actionHtml=`<div class="mc-action loading"><span class="mc-spin">↻</span> Procesando…</div>`;
      tsHtml=`<div class="mc-ts">leyendo archivo</div>`;
    } else if(s.loaded){
      actionHtml=`<div class="mc-action ok">↑ Actualizar</div>`;
      tsHtml=ts?`<div class="mc-ts${isFresh?' fresh':''}">${ts}</div>`:'';
    } else {
      actionHtml=`<div class="mc-action pend">↑ Cargar archivo</div>`;
      tsHtml=`<div class="mc-ts pend">sin cargar</div>`;
    }
    const chips=(c.chips||[]).map(ch=>`<span class="mc-chip req">${ch}</span>`).join('');
    const opts=(c.opt||[]).map(ch=>`<span class="mc-chip opt">${ch}</span>`).join('');
    return `<div class="mc-row" data-on-click="dispararCarga('${c.id}')">
      <div class="mc-state-bar ${barCls}"></div>
      <div class="mc-info">
        <div class="mc-name-row"><span class="mc-dot" style="background:${c.dot}"></span><span class="mc-name">${c.label}</span></div>
        <div class="mc-chips">${chips}${opts}</div>
      </div>
      <div class="mc-right">${actionHtml}${tsHtml}</div>
    </div>`;
  }
  
  function renderModalCarga(){
    const body=document.getElementById('modal-carga-body');
    if(!body) return;
    const pending=MC_CAPAS.filter(c=>!W._MC_STATES[c.id].loaded);
    const loaded=MC_CAPAS.filter(c=>W._MC_STATES[c.id].loaded);
    let html='';
    if(pending.length){
      html+=`<div class="mc-section-label">Pendientes</div>`;
      html+=pending.map(c=>mcRowHtml(c)).join('<div class="mc-divider"></div>');
    }
    if(loaded.length){
      html+=`<div class="mc-section-label" style="margin-top:4px">Cargados</div>`;
      html+=loaded.map(c=>mcRowHtml(c)).join('<div class="mc-divider"></div>');
    }
    body.innerHTML=html;
  }
  
  function dispararCarga(id){
    if(W._MC_STATES[id].loading) return;
    document.getElementById('inp-'+id).click();
  }
  
  // Override markLoaded para que muestre el spinner mientras se procesa el archivo
  const _origLoadFile=loadFile;
  // Mostrar spinner al seleccionar archivo (antes de procesar)
  document.addEventListener('change',function(e){
    if(!e.target.classList.contains('file-input')&&e.target.tagName!=='INPUT') return;
    const id=e.target.id.replace('inp-','');
    if(W._MC_STATES[id]){
      W._MC_STATES[id].loading=true;
      renderModalCarga();
    }
  });
  
  // Inicializar badge al cargar
  actualizarBadge();
  // ─────────────────────────────────────────────────────────────────────────
  
  markLoaded('limites'); markLoaded('cc'); markLoaded('ri');
  document.getElementById('nota-panel-wrap').innerHTML = NOTAS['limites'] || '';
  onCapaChange();
  

  function abrirSelector(id) { const el = document.getElementById(id); if (el) el.click() }

  // Lista blanca: solo estas funciones pueden dispararse desde el DOM.
  const ACCIONES = { abrirModalCarga, cerrarModalCarga, dispararCarga, loadFile, onCapaChange, onCuencaChange, onDeptoChange, onDeptoChangeCuencas, onMuniChange, onMuniChangeCuencas, onParamoCatChange, onRunapCatChange, onSzhChange, setSideCapa, setTipo, sortCienagasTable, sortCuencasTable, sortGenTable, sortHumedalTable, sortParamosDetail, sortParamosTable, sortPobTable, sortRunapDetail, sortRunapTable, sortTitTable, abrirSelector }
  const despachar = (tipo) => (e) => {
    const el = e.target.closest && e.target.closest('[data-on-' + tipo + ']')
    if (!el || !root.contains(el)) return
    if (el.hasAttribute('data-solo-fondo') && e.target !== el) return
    const m = /^(\w+)\((.*)\)$/.exec(el.getAttribute('data-on-' + tipo))
    const fn = m && Object.prototype.hasOwnProperty.call(ACCIONES, m[1]) ? ACCIONES[m[1]] : null
    if (!fn) return
    const args = m[2].trim() === '' ? [] : m[2].split(',').map((a) => {
      const v = a.trim()
      return v === 'this' ? el : v.replace(/^['"]|['"]$/g, '')
    })
    fn(...args)
  }
  const onClick = despachar('click')
  const onChange = despachar('change')
  root.addEventListener('click', onClick)
  root.addEventListener('change', onChange)

  return function destruir() {
    root.removeEventListener('click', onClick)
    root.removeEventListener('change', onChange)
    instanciasChart.forEach((c) => { try { c.destroy() } catch {} })
    instanciasChart.clear()
  }
}
