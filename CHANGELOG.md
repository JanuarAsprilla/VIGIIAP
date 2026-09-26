# Changelog

Todos los cambios notables de este proyecto se documentan en este archivo.

El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/).
El historial completo previo a esta fecha está disponible en `git log`; este
archivo empieza a trackear desde acá en adelante.

## [1.7.0](https://github.com/JanuarAsprilla/VIGIIAP/compare/v1.6.0...v1.7.0) (2026-09-26)


### Features

* administrar visibilidad publico/usuarios de cada herramienta ([fbd21dd](https://github.com/JanuarAsprilla/VIGIIAP/commit/fbd21ddd17a1e95db98837d7cddb823a02226c27))
* agrupa Herramientas por tag + completa campos de remitente en Configuración ([#219](https://github.com/JanuarAsprilla/VIGIIAP/issues/219)) ([02f315b](https://github.com/JanuarAsprilla/VIGIIAP/commit/02f315ba278c7949d8b9bce1a7109c4b5bc3b6ea))
* analítica de uso anónima tipo Google Analytics en Actividad ([#208](https://github.com/JanuarAsprilla/VIGIIAP/issues/208)) ([4149fd1](https://github.com/JanuarAsprilla/VIGIIAP/commit/4149fd1c9767e59e9598cca02d7623d9be5e7546))
* bloquea el panel admin hasta activar 2FA cuando el super_admin lo exige ([#202](https://github.com/JanuarAsprilla/VIGIIAP/issues/202)) ([9e501b5](https://github.com/JanuarAsprilla/VIGIIAP/commit/9e501b5a5e9432c450da674930a3b2afbb5aaf06))
* búsqueda global real y tolerante a errores de tipeo en el Command Palette ([#166](https://github.com/JanuarAsprilla/VIGIIAP/issues/166)) ([65b84c5](https://github.com/JanuarAsprilla/VIGIIAP/commit/65b84c5b6497ed91dbb3b7e9fbc931f0f639fa76))
* catálogo de tipos de notificación y preferencias por usuario (Fases 2-3) ([#167](https://github.com/JanuarAsprilla/VIGIIAP/issues/167)) ([4068a61](https://github.com/JanuarAsprilla/VIGIIAP/commit/4068a619f6d63f11c88e8108eb88266d817c6ae4))
* el Conversor de Coordenadas convierte muchas coordenadas a la vez ([#200](https://github.com/JanuarAsprilla/VIGIIAP/issues/200)) ([8048fc7](https://github.com/JanuarAsprilla/VIGIIAP/commit/8048fc7666dd220333d41d1bb42c29aebc61c37f))
* exportar Actividad a Excel con marca institucional y el registro completo ([#173](https://github.com/JanuarAsprilla/VIGIIAP/issues/173)) ([a854603](https://github.com/JanuarAsprilla/VIGIIAP/commit/a854603a3e5dd9a2e12593e8bb95a6893c245199))
* exportar reportes a Excel con identidad institucional en vez de CSV plano ([#172](https://github.com/JanuarAsprilla/VIGIIAP/issues/172)) ([b30aa92](https://github.com/JanuarAsprilla/VIGIIAP/commit/b30aa920a69f2233799a733d99c65022c2e3cbaa))
* filtro por módulo y nombre unificado de categoría en todos los formularios ([#169](https://github.com/JanuarAsprilla/VIGIIAP/issues/169)) ([c4fa57a](https://github.com/JanuarAsprilla/VIGIIAP/commit/c4fa57a477999e2145ea62fa4c3da3f86126d97f))
* filtros de seguridad reales en Registro de Actividad (fechas, búsqueda, módulos) ([#189](https://github.com/JanuarAsprilla/VIGIIAP/issues/189)) ([fdf75ba](https://github.com/JanuarAsprilla/VIGIIAP/commit/fdf75bac393bebced313b1b805ecc5419c1418cf))
* formulario de conexión con tipo propio/externo ([#170](https://github.com/JanuarAsprilla/VIGIIAP/issues/170)) ([113c2cc](https://github.com/JanuarAsprilla/VIGIIAP/commit/113c2ccd7d290ef447b9d31207feddaa4180debb))
* fusiona Reportes en Actividad (3 pestañas) + gráfica de series de tiempo ([#213](https://github.com/JanuarAsprilla/VIGIIAP/issues/213)) ([50e7344](https://github.com/JanuarAsprilla/VIGIIAP/commit/50e734466d1b895bf879926ac3d3ecd652e5707c))
* gráfica de tendencia grande en Analítica de Uso ([#220](https://github.com/JanuarAsprilla/VIGIIAP/issues/220)) ([ab50fe8](https://github.com/JanuarAsprilla/VIGIIAP/commit/ab50fe8e9a16eb4021e4d112c30180fde658b284))
* gráficos y robustez en Errores + filtro de acción en Auditoría ([#218](https://github.com/JanuarAsprilla/VIGIIAP/issues/218)) ([0a3a704](https://github.com/JanuarAsprilla/VIGIIAP/commit/0a3a7048ffbc755047383a2874f6efaf1925b01a))
* hace visible y funcional el estado de los errores (no solo un badge) ([#226](https://github.com/JanuarAsprilla/VIGIIAP/issues/226)) ([0412f3c](https://github.com/JanuarAsprilla/VIGIIAP/commit/0412f3cb30f9a33cc2587905432970fbc3492b79))
* Herramientas consume el catálogo real del backend (admin/herramientas) ([3676fcf](https://github.com/JanuarAsprilla/VIGIIAP/commit/3676fcf7a9be740f6d7448eb252a9ed48ff68b8b))
* integra el Validador de Coordenadas de Eddy Chaverra (IIAP) a Herramientas ([#206](https://github.com/JanuarAsprilla/VIGIIAP/issues/206)) ([3882306](https://github.com/JanuarAsprilla/VIGIIAP/commit/388230627bc48a75ea4c2e18f6dee1e041782432))
* metadatos técnicos opcionales en el formulario de Mapas (EPSG/escala/fuente/área) ([#197](https://github.com/JanuarAsprilla/VIGIIAP/issues/197)) ([9f8282e](https://github.com/JanuarAsprilla/VIGIIAP/commit/9f8282ec1d2d77791cadb611105d164af644cb83))
* Panel Chocó Biogeográfico + limpieza y administración real de Herramientas ([6677bcd](https://github.com/JanuarAsprilla/VIGIIAP/commit/6677bcddae8da9002326b13b0e60ea6eed545188))
* pantalla real de mantenimiento y sección Seguridad en Configuración ([#203](https://github.com/JanuarAsprilla/VIGIIAP/issues/203)) ([1dbd6e1](https://github.com/JanuarAsprilla/VIGIIAP/commit/1dbd6e1c4d3612ac4dd6c72ee422c3326b0bd215))
* permite marcar cada error como pendiente/revisando/resuelto ([#225](https://github.com/JanuarAsprilla/VIGIIAP/issues/225)) ([b635091](https://github.com/JanuarAsprilla/VIGIIAP/commit/b6350912f2fb4a5fdc74cdc888be8a6a8b6de183))
* persistir preferencia de tema por usuario ([#164](https://github.com/JanuarAsprilla/VIGIIAP/issues/164)) ([82d0f5e](https://github.com/JanuarAsprilla/VIGIIAP/commit/82d0f5e843511cf510f2db59e776ae4f7094217f))
* portar Panel de Análisis Territorial Chocó Biogeográfico a Herramientas ([1a55df2](https://github.com/JanuarAsprilla/VIGIIAP/commit/1a55df29b6f7f4ce7980e3321e50aeab9ecb28a7))
* rediseña las tarjetas de Geovisores al mismo lenguaje visual de Mapas ([#188](https://github.com/JanuarAsprilla/VIGIIAP/issues/188)) ([9cb3a4c](https://github.com/JanuarAsprilla/VIGIIAP/commit/9cb3a4c440890bba7af08207691f8838b799101b))
* rediseñar el módulo de Errores con tarjetas y resumen accionable ([#171](https://github.com/JanuarAsprilla/VIGIIAP/issues/171)) ([fd74380](https://github.com/JanuarAsprilla/VIGIIAP/commit/fd743803390e2beb6ecaa4c30531040725a4547f))
* rediseño estructural del Dashboard — Tráfico y Uso + Salud del Sistema ([#221](https://github.com/JanuarAsprilla/VIGIIAP/issues/221)) ([e278832](https://github.com/JanuarAsprilla/VIGIIAP/commit/e2788329e1db3d3ca4b81be6338bd5d1b1ba5fbd))
* rediseño visual de la pestaña Reportes -- gráfico de módulos y comparación con período anterior ([#222](https://github.com/JanuarAsprilla/VIGIIAP/issues/222)) ([34b79de](https://github.com/JanuarAsprilla/VIGIIAP/commit/34b79de48198f6aadb5117f09a6f4ec81e8bed50))
* resumen y gráficos de Errores reflejan solo lo activo, no el historial ([#227](https://github.com/JanuarAsprilla/VIGIIAP/issues/227)) ([371b4cc](https://github.com/JanuarAsprilla/VIGIIAP/commit/371b4ccdba8f5b0594a20e4971d653a2f23340fc))
* sistema editorial de tipografía + MetricPanel en todo el panel admin ([#224](https://github.com/JanuarAsprilla/VIGIIAP/issues/224)) ([d7badeb](https://github.com/JanuarAsprilla/VIGIIAP/commit/d7badebb020d095b9173f34fd66809ac789d1ec3))
* subir miniatura de geovisor arrastrando una imagen (antes URL a mano) ([#168](https://github.com/JanuarAsprilla/VIGIIAP/issues/168)) ([712d260](https://github.com/JanuarAsprilla/VIGIIAP/commit/712d26069cccdd1e33e03e4b0fe3eddf9ae571d5))


### Bug Fixes

* "Quitar" miniatura de geovisor tampoco borraba nada (mismo bug que mapas) ([#186](https://github.com/JanuarAsprilla/VIGIIAP/issues/186)) ([8249db3](https://github.com/JanuarAsprilla/VIGIIAP/commit/8249db383cc0accb7e3dc14caee2c9ca77500903))
* "Quitar" miniatura no borraba nada + filtro de columnas para mapas ([#182](https://github.com/JanuarAsprilla/VIGIIAP/issues/182)) ([b0273df](https://github.com/JanuarAsprilla/VIGIIAP/commit/b0273dfe999edb125623a35439fd9da506da2c4f))
* agrega semántica ARIA de combobox y aria-hidden al logo del footer ([#211](https://github.com/JanuarAsprilla/VIGIIAP/issues/211)) ([4694adf](https://github.com/JanuarAsprilla/VIGIIAP/commit/4694adf18d92866e9e41fdba0f6b62f39f98d2b8))
* botones de acción en tarjeta pública de mapas no resaltaban ([#180](https://github.com/JanuarAsprilla/VIGIIAP/issues/180)) ([d9297fd](https://github.com/JanuarAsprilla/VIGIIAP/commit/d9297fd02de1c70f29433860c35b51e06894764e))
* corregir etiquetas y quitar tilt/inline en el panel Chocó Biogeográfico ([630a864](https://github.com/JanuarAsprilla/VIGIIAP/commit/630a864e33a465a123321ba65bfcd997dbcf61b1))
* corrige contraste de texto inactivo en sidebar y barra de pestañas ([#209](https://github.com/JanuarAsprilla/VIGIIAP/issues/209)) ([00a08de](https://github.com/JanuarAsprilla/VIGIIAP/commit/00a08de5c44ed12d94207cb746165efd4b25b3af))
* el aviso de bienvenida aparecía en cada carga de página, no una sola vez ([#185](https://github.com/JanuarAsprilla/VIGIIAP/issues/185)) ([0cbc070](https://github.com/JanuarAsprilla/VIGIIAP/commit/0cbc070018f9d62f85451ae75cf88a50b4a074ee))
* el checkbox "Publicar en el portal público" no hacía nada al guardar ([#184](https://github.com/JanuarAsprilla/VIGIIAP/issues/184)) ([cab3ce4](https://github.com/JanuarAsprilla/VIGIIAP/commit/cab3ce4a8e08c8913a7ac88c46fe287179ab0b97))
* el healthcheck del deploy usaba localhost en vez de 127.0.0.1 ([#216](https://github.com/JanuarAsprilla/VIGIIAP/issues/216)) ([28995ef](https://github.com/JanuarAsprilla/VIGIIAP/commit/28995efead15f73e8d0da7fcd020ec6e8d1f4233))
* eleva el tope de líneas del conversor de coordenadas en lote a 50.000 ([#201](https://github.com/JanuarAsprilla/VIGIIAP/issues/201)) ([35a5909](https://github.com/JanuarAsprilla/VIGIIAP/commit/35a5909a50cdd499a233bb29706e0ff78d665e02))
* filtro de categoría de mapas no consumía las categorías reales ([#183](https://github.com/JanuarAsprilla/VIGIIAP/issues/183)) ([6248f31](https://github.com/JanuarAsprilla/VIGIIAP/commit/6248f3199d36b51f10cf2ec2670f4398f241c974))
* filtro por módulo, edición de módulos y checkboxes en vez de pills ([#177](https://github.com/JanuarAsprilla/VIGIIAP/issues/177)) ([1ea25e8](https://github.com/JanuarAsprilla/VIGIIAP/commit/1ea25e8d6222f7612b7dec9a6943355bd92faa2e))
* guardar un mapa fallaba (PUT vs PATCH) y las miniaturas se recortaban ([#181](https://github.com/JanuarAsprilla/VIGIIAP/issues/181)) ([50feb46](https://github.com/JanuarAsprilla/VIGIIAP/commit/50feb466fb167fa8667c70da0bb8ba1fd6b7f89f))
* las tarjetas de geovisores quedaban invisibles en el panel admin ([#196](https://github.com/JanuarAsprilla/VIGIIAP/issues/196)) ([705f75e](https://github.com/JanuarAsprilla/VIGIIAP/commit/705f75ee85d0d4f9b5e6ec2cc03c91d366ec605a))
* ocultar "Resumen del Sistema" para público/visitante en Herramientas ([a3dc663](https://github.com/JanuarAsprilla/VIGIIAP/commit/a3dc663f74ea754f3ec353fb6e287287014ec3e7))
* quita el tilt 3D de la tarjeta del Conversor de Coordenadas ([#207](https://github.com/JanuarAsprilla/VIGIIAP/issues/207)) ([d8a467c](https://github.com/JanuarAsprilla/VIGIIAP/commit/d8a467c07b6f41743247f701cd62b7453c3df6f1))
* recupera la página en blanco cuando falla el primer render de React ([#205](https://github.com/JanuarAsprilla/VIGIIAP/issues/205)) ([e5c97f8](https://github.com/JanuarAsprilla/VIGIIAP/commit/e5c97f87d9dbff449b860cc96c9b528c6b0fda7e))
* respeta prefers-reduced-motion en Card3D y en todas las animaciones de Framer Motion ([#210](https://github.com/JanuarAsprilla/VIGIIAP/issues/210)) ([a96e39d](https://github.com/JanuarAsprilla/VIGIIAP/commit/a96e39d8c606a51f2e2b7b9b392ec36615922724))
* retirar herramientas vaporware/maqueta de la Caja de Herramientas ([4938c8d](https://github.com/JanuarAsprilla/VIGIIAP/commit/4938c8d3cc0da9e397c75b49d528b889a20c6684))
* Salud del Sistema del Dashboard ignora errores ya marcados como Resuelto ([#228](https://github.com/JanuarAsprilla/VIGIIAP/issues/228)) ([97779a5](https://github.com/JanuarAsprilla/VIGIIAP/commit/97779a5a2f1f40dc8a6e5be648483f3035b64c0a))
* **seguridad:** deja de exponer URLs prefirmadas de S3/MinIO al descargar adjuntos ([#204](https://github.com/JanuarAsprilla/VIGIIAP/issues/204)) ([a2cfc9a](https://github.com/JanuarAsprilla/VIGIIAP/commit/a2cfc9a8f8b2b0a8585057f33fd85ba89a619826))
* un deploy dejaba la app rota para pestañas ya abiertas (chunk viejo 404) ([#198](https://github.com/JanuarAsprilla/VIGIIAP/issues/198)) ([e2051c3](https://github.com/JanuarAsprilla/VIGIIAP/commit/e2051c3f94b65982b9b97628f9d38656b8ce2bc7))
* un modelo 3D que falla al cargar tumbaba toda la página de inicio ([#195](https://github.com/JanuarAsprilla/VIGIIAP/issues/195)) ([08ffcbd](https://github.com/JanuarAsprilla/VIGIIAP/commit/08ffcbd18b5c0fd42335f5397de8d8c2f467c005))
* vista previa de documentos y mapas PDF mostraba "Archivo no disponible" ([#179](https://github.com/JanuarAsprilla/VIGIIAP/issues/179)) ([a6d000d](https://github.com/JanuarAsprilla/VIGIIAP/commit/a6d000d4aab64e81304fc890f992c26f017b28b5))


### Performance Improvements

* carga exceljs bajo demanda en PanelChoco y Validador de Coordenadas ([#212](https://github.com/JanuarAsprilla/VIGIIAP/issues/212)) ([ba83a1d](https://github.com/JanuarAsprilla/VIGIIAP/commit/ba83a1db14a433356758da4e5ef33387acf974ee))
* difiere la carga del hero 3D de Home hasta acercarse por scroll ([#223](https://github.com/JanuarAsprilla/VIGIIAP/issues/223)) ([d06e7ad](https://github.com/JanuarAsprilla/VIGIIAP/commit/d06e7adca866fb05c0bdee84d4470b3d1887bd32))

## [1.6.0](https://github.com/JanuarAsprilla/VIGIIAP/compare/v1.5.0...v1.6.0) (2026-09-19)


### Features

* notificaciones reales para todos los usuarios (Fase 1) ([#162](https://github.com/JanuarAsprilla/VIGIIAP/issues/162)) ([d96f5c1](https://github.com/JanuarAsprilla/VIGIIAP/commit/d96f5c1a7c7bfb303ce8ae16046390a6a05a7d01))

## [1.5.0](https://github.com/JanuarAsprilla/VIGIIAP/compare/v1.4.0...v1.5.0) (2026-09-19)


### Features

* agrega buscador y filtro por categoría a la lista de geovisores ([#154](https://github.com/JanuarAsprilla/VIGIIAP/issues/154)) ([fc3fba1](https://github.com/JanuarAsprilla/VIGIIAP/commit/fc3fba1230112883a719ac5b95c150c228b75928))
* agrega geovisores a Papelera con purga permanente ([#160](https://github.com/JanuarAsprilla/VIGIIAP/issues/160)) ([c4d6734](https://github.com/JanuarAsprilla/VIGIIAP/commit/c4d67344734a96b7443a961e067059c8cc3dc78c))
* conteo cruzado de categorías (documentos + mapas + geovisores) ([#159](https://github.com/JanuarAsprilla/VIGIIAP/issues/159)) ([c304cd1](https://github.com/JanuarAsprilla/VIGIIAP/commit/c304cd1d81942bdd1eef232782bd0ac6cb0c3752))
* Términos de Uso editable desde el panel + corrige centrado ([#161](https://github.com/JanuarAsprilla/VIGIIAP/issues/161)) ([7e4439f](https://github.com/JanuarAsprilla/VIGIIAP/commit/7e4439f5d6cf939c7926367c768606091d78837e))


### Bug Fixes

* corrige codificación y formato de los CSV exportables del admin ([#155](https://github.com/JanuarAsprilla/VIGIIAP/issues/155)) ([c3886ab](https://github.com/JanuarAsprilla/VIGIIAP/commit/c3886abc8e5490465730dd7506677f8bee632961))
* corrige ReferenceError al calcular el área de un punto en el geovisor ([#156](https://github.com/JanuarAsprilla/VIGIIAP/issues/156)) ([327fa9a](https://github.com/JanuarAsprilla/VIGIIAP/commit/327fa9ad90bdc377876fd98d179667304376f27c))
* no cerrar sesión ante errores transitorios (429, 5xx) en /auth/me ([#152](https://github.com/JanuarAsprilla/VIGIIAP/issues/152)) ([d3f918c](https://github.com/JanuarAsprilla/VIGIIAP/commit/d3f918c81a8ffcb31b3f5d16ad5b876a98a1dff8))
* quita los botones de redes sociales placeholder del footer ([#157](https://github.com/JanuarAsprilla/VIGIIAP/issues/157)) ([d3fba82](https://github.com/JanuarAsprilla/VIGIIAP/commit/d3fba82de7e01d7b6538fd9c948bc99f1a76f83f))

## [1.4.0](https://github.com/JanuarAsprilla/VIGIIAP/compare/v1.3.0...v1.4.0) (2026-09-19)


### Features

* unificar categorías compartidas entre documentos, mapas y geovisores ([5797006](https://github.com/JanuarAsprilla/VIGIIAP/commit/5797006a32f9a47f783588aa670b480c8bf16489))
* unificar categorías compartidas entre documentos, mapas y geovisores ([d92e253](https://github.com/JanuarAsprilla/VIGIIAP/commit/d92e253fe7f7a1ff711c5db7628b8d5e857ed179))


### Bug Fixes

* no sobrecargar GeoServer con todas las capas de un workspace en el constructor de geovisores ([690b60f](https://github.com/JanuarAsprilla/VIGIIAP/commit/690b60f17e0ee69a14e99485fb82a00d4b6bed7b))
* no sobrecargar GeoServer con todas las capas de un workspace en el constructor de geovisores ([b2fc6d8](https://github.com/JanuarAsprilla/VIGIIAP/commit/b2fc6d827748f3897c99094103ad27e856dfe043))
* recarga automática cuando falla la carga del bundle principal ([#148](https://github.com/JanuarAsprilla/VIGIIAP/issues/148)) ([f23a9bc](https://github.com/JanuarAsprilla/VIGIIAP/commit/f23a9bcdf555e26363faa026f96d5e9ebae01900))

## [1.3.0](https://github.com/JanuarAsprilla/VIGIIAP/compare/v1.2.0...v1.3.0) (2026-09-19)


### Features

* picker de capas individuales (reconstruido sobre el mapa en vivo) ([43db376](https://github.com/JanuarAsprilla/VIGIIAP/commit/43db376c9d0d6bd1391992eccabbb003e6eac61e))
* picker de capas individuales en el formulario de geovisores ([6bde80a](https://github.com/JanuarAsprilla/VIGIIAP/commit/6bde80aeb494a2b15c7a4f6470f6493a4ead02e5))
* separar Política de Privacidad de Términos de Uso en su propia URL ([#145](https://github.com/JanuarAsprilla/VIGIIAP/issues/145)) ([31e7588](https://github.com/JanuarAsprilla/VIGIIAP/commit/31e7588f28da52e3b78bdbfcf8bc06d25e50fe16))


### Bug Fixes

* exponer nombre y propósito de la app a crawlers sin JavaScript ([#146](https://github.com/JanuarAsprilla/VIGIIAP/issues/146)) ([b10fa09](https://github.com/JanuarAsprilla/VIGIIAP/commit/b10fa0991a65876e9a2ee35fc2270172fc6180a4))
* panel de bienvenida ya no bloquea la página de fondo ([#143](https://github.com/JanuarAsprilla/VIGIIAP/issues/143)) ([1c39146](https://github.com/JanuarAsprilla/VIGIIAP/commit/1c391468bad95bf40137f7f43222f95c524763d9))

## [1.2.0](https://github.com/JanuarAsprilla/VIGIIAP/compare/v1.1.0...v1.2.0) (2026-09-18)


### Features

* deltas reales en las tarjetas KPI del dashboard admin ([2322592](https://github.com/JanuarAsprilla/VIGIIAP/commit/23225925ef07ae599ad488a48cc11ef410f08d74))


### Bug Fixes

* logout redundante, caché de admins desactualizada, footer en modo oscuro ([764ba3e](https://github.com/JanuarAsprilla/VIGIIAP/commit/764ba3e68b8da7f3e020854baf16a0dc049049c9))
* quitar tarjeta de usuario redundante en AdminSidebar ([f1f7d46](https://github.com/JanuarAsprilla/VIGIIAP/commit/f1f7d466a0248337ef66eea7605d6b24e3edb8c0))
* three production bugs from user report (redundant logout, stale admin cache, footer dark mode) ([884e976](https://github.com/JanuarAsprilla/VIGIIAP/commit/884e9766260a8f366a0c265daa7e36a3d36ad12d))

## [1.1.0](https://github.com/JanuarAsprilla/VIGIIAP/compare/v1.0.0...v1.1.0) (2026-09-18)


### Features

* abrir Mapas, Documentos, Geovisor y Herramientas al público ([#119](https://github.com/JanuarAsprilla/VIGIIAP/issues/119)) ([1d35d7c](https://github.com/JanuarAsprilla/VIGIIAP/commit/1d35d7c97958bfdb1770a62d3038511d59ebe0e9))
* agregar renombrar categoría en el panel de administración ([bc41045](https://github.com/JanuarAsprilla/VIGIIAP/commit/bc41045627a04bbc3dcfda7040a89883207a01af))
* agregar renombrar categoría en el panel de administración ([251cd91](https://github.com/JanuarAsprilla/VIGIIAP/commit/251cd914e961ce6548627ba63c97a868af432689))
* area de interes y medicion en el visor de geovisores ([#126](https://github.com/JanuarAsprilla/VIGIIAP/issues/126)) ([15c6ca7](https://github.com/JanuarAsprilla/VIGIIAP/commit/15c6ca7d040dd1b50953b33fbf7f1d7b877257dc))
* aviso de bienvenida antes de la primera interacción ([#106](https://github.com/JanuarAsprilla/VIGIIAP/issues/106)) ([488818c](https://github.com/JanuarAsprilla/VIGIIAP/commit/488818c9537253904f7bb4c38b1a93426ce34dde))
* constructor visual de geovisores con mapa en vivo ([5fdcc9c](https://github.com/JanuarAsprilla/VIGIIAP/commit/5fdcc9c0dc6ffd44cdf6198a142eb05efbf7e99b))
* constructor visual de geovisores con mapa en vivo ([0b4103a](https://github.com/JanuarAsprilla/VIGIIAP/commit/0b4103a6c0ff66fe01c3ed0a7a2d7d0b3f7c0a69))
* login con Google/Microsoft funcional + alerta de completar perfil ([#122](https://github.com/JanuarAsprilla/VIGIIAP/issues/122)) ([8e17eaa](https://github.com/JanuarAsprilla/VIGIIAP/commit/8e17eaaa857ad190cd91e0d2bf85149d9416aacf))
* logo institucional real del IIAP en el sidebar ([#108](https://github.com/JanuarAsprilla/VIGIIAP/issues/108)) ([021639c](https://github.com/JanuarAsprilla/VIGIIAP/commit/021639cedb6459011905dd4545030a772a40e18a))
* navegación responsiva unificada tablet/teléfono + pulido liquid glass ([#111](https://github.com/JanuarAsprilla/VIGIIAP/issues/111)) ([3cb4c43](https://github.com/JanuarAsprilla/VIGIIAP/commit/3cb4c4398f045b047805cbbfe7eec1fe17524664))
* panel de login anclado con Liquid Glass, reemplaza /login ([#118](https://github.com/JanuarAsprilla/VIGIIAP/issues/118)) ([18c9259](https://github.com/JanuarAsprilla/VIGIIAP/commit/18c9259895cc5d5f4b6f4a404dc23602b374e0e7))
* panel SMTP en Configuración + correo de prueba (solo super_admin) ([#109](https://github.com/JanuarAsprilla/VIGIIAP/issues/109)) ([d1951e0](https://github.com/JanuarAsprilla/VIGIIAP/commit/d1951e04d49fc1433554518dfa19bedd3ede3aaa))
* paneles centrados para recuperar contraseña/solicitar acceso + rediseño del menú de perfil ([#121](https://github.com/JanuarAsprilla/VIGIIAP/issues/121)) ([28d9a9f](https://github.com/JanuarAsprilla/VIGIIAP/commit/28d9a9f5e905680f0f97cf304ad9efbf0df82883))
* popup por capa al hacer clic en el mapa ([#127](https://github.com/JanuarAsprilla/VIGIIAP/issues/127)) ([4fdba88](https://github.com/JanuarAsprilla/VIGIIAP/commit/4fdba885fe467a269ccd6e196130b7b26e181ce3))
* renombra el modulo Geovisor a Geovisores y elimina el mockup sin datos reales ([6599a73](https://github.com/JanuarAsprilla/VIGIIAP/commit/6599a73764708bed9e0be5fa3e7e337961d8c5cf))
* sección Ajustes Avanzados en Configuración (CORS/rate limit/correo respaldo) ([#110](https://github.com/JanuarAsprilla/VIGIIAP/issues/110)) ([52f44d4](https://github.com/JanuarAsprilla/VIGIIAP/commit/52f44d4e637cf90ba965804f56f64e58e2b99fd9))
* selector de perfil de acceso en "Completar Perfil" (login OAuth) ([#136](https://github.com/JanuarAsprilla/VIGIIAP/issues/136)) ([a8f5f98](https://github.com/JanuarAsprilla/VIGIIAP/commit/a8f5f98a7b06c7cf1a486ccb96de848e3e818969))
* separar administradores de usuarios y permisos por módulo ([216f4a2](https://github.com/JanuarAsprilla/VIGIIAP/commit/216f4a2453b273eda718fb9fdfa9b7f6e154bbac))
* separar administradores de usuarios y permisos por módulo ([2f35122](https://github.com/JanuarAsprilla/VIGIIAP/commit/2f351228f6cfb934caf5553922af74d469671a88))


### Bug Fixes

* 2FA force-logout bug + restore welcome step before login ([#128](https://github.com/JanuarAsprilla/VIGIIAP/issues/128)) ([68de1d8](https://github.com/JanuarAsprilla/VIGIIAP/commit/68de1d82e0bc065579aba4abd40f4559a0be25a2))
* center the welcome panel and lock body scroll on all auth overlays ([#131](https://github.com/JanuarAsprilla/VIGIIAP/issues/131)) ([65696a5](https://github.com/JanuarAsprilla/VIGIIAP/commit/65696a5da894e9fd5e60174f061ff4f5caddef4f))
* consistencia visual — altura sidebar/topbar, fondo Home, cursor botones ([#105](https://github.com/JanuarAsprilla/VIGIIAP/issues/105)) ([b55ffe6](https://github.com/JanuarAsprilla/VIGIIAP/commit/b55ffe655e2dfcd2f8b67fc0a1ced56ec4bfad7c))
* el blur del panel de login cubre toda la página, no solo el TopBar ([#125](https://github.com/JanuarAsprilla/VIGIIAP/issues/125)) ([65f3ddf](https://github.com/JanuarAsprilla/VIGIIAP/commit/65f3ddf297d84c2115291664520d934ef62ad701))
* la config remota nunca sincronizaba en Configuración ni en Términos ([#112](https://github.com/JanuarAsprilla/VIGIIAP/issues/112)) ([a8b22a5](https://github.com/JanuarAsprilla/VIGIIAP/commit/a8b22a50c2feba4df3528d8417ee1f622b03cdfe))
* recover cleanly when a 2FA setup QR expires ([#129](https://github.com/JanuarAsprilla/VIGIIAP/issues/129)) ([9a45b74](https://github.com/JanuarAsprilla/VIGIIAP/commit/9a45b7451e183297f6011031ee1564089b1763f5))

## 1.0.0 (2026-09-10)


### Features

* activa cookie HttpOnly — USE_COOKIE_AUTH=true (backend PR [#10](https://github.com/JanuarAsprilla/VIGIIAP/issues/10) listo) ([32cfcb9](https://github.com/JanuarAsprilla/VIGIIAP/commit/32cfcb9c0e962a2430b41dbb0be61bda90d0bbe3))
* **admin:** reestructura notificaciones y agrega reportes bajo demanda ([#79](https://github.com/JanuarAsprilla/VIGIIAP/issues/79)) ([c4eaa5c](https://github.com/JanuarAsprilla/VIGIIAP/commit/c4eaa5ce5073ea6826644d9cc87547e421706ba6))
* **admin:** verificación email, reset password y admin CRUD funcional ([cb9a52b](https://github.com/JanuarAsprilla/VIGIIAP/commit/cb9a52b5503275dcd52134b9062bb3e4f664ce3f))
* agregar Dockerfile para despliegue propio (servidor IIAP) ([#101](https://github.com/JanuarAsprilla/VIGIIAP/issues/101)) ([60bdca1](https://github.com/JanuarAsprilla/VIGIIAP/commit/60bdca1352c07401b5ee96c59c8a58929e7bb7cf))
* agregar widget de thumbnail al formulario de mapas ([b461123](https://github.com/JanuarAsprilla/VIGIIAP/commit/b461123c85bf899ba9c489d6da603b61b9e1a285))
* alinear paleta de UI con el Manual de Identidad Visual IIAP ([#33](https://github.com/JanuarAsprilla/VIGIIAP/issues/33)) ([5507f69](https://github.com/JanuarAsprilla/VIGIIAP/commit/5507f69a8d6d6f7bed971f19c4c65e0ebb4751ed))
* añadir presentación 3D scroll-driven a Home ([31cdc48](https://github.com/JanuarAsprilla/VIGIIAP/commit/31cdc4808c9ea441262c2f85f3198130669589b4))
* animaciones 3D premium + rediseño visual completo ([2110bd7](https://github.com/JanuarAsprilla/VIGIIAP/commit/2110bd733de8dc20497aa796822cac028483499e))
* **api:** fallback a /api/v1 en cliente axios y documentos.utils ([0ac6784](https://github.com/JanuarAsprilla/VIGIIAP/commit/0ac67849e0949468566233b56e1a13e02f0a57de))
* **auth+perfil:** 2FA UI, sesiones activas, contraseña expirada, HTTP 429 ([e0d0b1d](https://github.com/JanuarAsprilla/VIGIIAP/commit/e0d0b1d09c8029569a2a8d7ea341a0e5da02a294))
* **auth:** dropdown por rol + TopBar condicional para no verificados ([b6ad386](https://github.com/JanuarAsprilla/VIGIIAP/commit/b6ad38607a45f39f66ff4a2f94aacc850f2deec3))
* boom visual — Three.js globe, GSAP ScrollTrigger, Lenis smooth scroll, nuevo favicon ([551af89](https://github.com/JanuarAsprilla/VIGIIAP/commit/551af89c80072351b2d0f72d819cf298a543eba1))
* buscador dinámico global, funciones TopBar/Sidebar y SearchContext ([3b66d14](https://github.com/JanuarAsprilla/VIGIIAP/commit/3b66d1461ad15cdbcda1f0161e862ca5ed10438b))
* carrusel infinito en MarqueeStrip con CSS keyframes ([d0b6a77](https://github.com/JanuarAsprilla/VIGIIAP/commit/d0b6a774f87378f53d48a58d02b0634823b5e6e0))
* **ci+e2e:** agrega job E2E a CI y corrige containerRef sin tipo ([5c06fcd](https://github.com/JanuarAsprilla/VIGIIAP/commit/5c06fcd7daeeda06a45fede4f08e71df144acd4a))
* **ci+perf+seo+pwa:** CI completo, lazy images, robots/sitemap, manifest PWA ([72e30ea](https://github.com/JanuarAsprilla/VIGIIAP/commit/72e30ea3b5ac281edf742d659469a9320a1cfde3))
* combobox de categorías libre en GestionDocumentos ([9ab3df8](https://github.com/JanuarAsprilla/VIGIIAP/commit/9ab3df81c736908109e4e26ecbce0b74ff27a67d))
* combobox de categorías/temáticas en GestionMapas y GestionNoticias ([a6eabc9](https://github.com/JanuarAsprilla/VIGIIAP/commit/a6eabc9afd51494bb40efa723f710f73c3a137ef))
* command palette (Cmd+K), skeleton loaders y UIContext enterprise ([aee5821](https://github.com/JanuarAsprilla/VIGIIAP/commit/aee58213a8c3172e8820126058d60e803b693862))
* completar módulo mapas — quitar escala/department, rediseñar cards, sincronizar categorías ([baf12f4](https://github.com/JanuarAsprilla/VIGIIAP/commit/baf12f4677ccb20807e24125537fa391dcda8832))
* complete solicitudes admin panel with toasts and loading states ([2036d2b](https://github.com/JanuarAsprilla/VIGIIAP/commit/2036d2bef165aa2f254fcdf5d6b7813b8f5bf1b0))
* conectar filtros y paginación real en módulo Mapas ([5e0cda0](https://github.com/JanuarAsprilla/VIGIIAP/commit/5e0cda0f9c5ca7415daf2ebda6717b5fd9097aa0))
* configurar React Router v6 con rutas independientes por módulo y lazy loading ([e6d2a99](https://github.com/JanuarAsprilla/VIGIIAP/commit/e6d2a99c461110eddba459c5f3f2405d1573bde2))
* diseño 3D en todo el sitio con Framer Motion + renombrado a VIGIA-IIAP ([bb445b0](https://github.com/JanuarAsprilla/VIGIIAP/commit/bb445b05b1239df5d1f60cdc1493a902fd3895b5))
* diseño cinematic completo — dark flow unificado en Home y mobile nav ([37aa4bf](https://github.com/JanuarAsprilla/VIGIIAP/commit/37aa4bfd187216b5e0ee360a6da86c09be3eb2a2))
* diseño cinematic unificado — sidebar dark, topbar glass, mapa Chocó ([926b749](https://github.com/JanuarAsprilla/VIGIIAP/commit/926b7496a12cc261b2af8e112ca468962aa682cb))
* diseño sustancialmente mejorado — gradient text fix, easing Emil, grain overlay, tokens premium, active states ([9eaca15](https://github.com/JanuarAsprilla/VIGIIAP/commit/9eaca15351ff72557227924b13e1b2dd401f7843))
* **documentos:** conecta el campo resumen — existía en el backend pero nunca se usaba ([#63](https://github.com/JanuarAsprilla/VIGIIAP/issues/63)) ([7b15075](https://github.com/JanuarAsprilla/VIGIIAP/commit/7b15075c5e55f0d70d5bfc1f6d9531b462648750))
* dual-tema completo — toggle visible + todas las secciones tokenizadas ([ea439dd](https://github.com/JanuarAsprilla/VIGIIAP/commit/ea439dde0ef04face7aa24e94e66c35c12a7f4b1))
* ecosistema auth rediseñado con layout split-panel 3D ([f605592](https://github.com/JanuarAsprilla/VIGIIAP/commit/f605592bc95f30e0d323ed5003ff13a1d5c98751))
* editorial Home redesign — bento, marquee, stats, magazine news ([cda2510](https://github.com/JanuarAsprilla/VIGIIAP/commit/cda25105837444b4d2df9e92570866a0049315cc))
* elimina módulo noticias del frontend ([e5745e9](https://github.com/JanuarAsprilla/VIGIIAP/commit/e5745e905a0391a653541f5b6c83c03082abe24e))
* Fase 1 frontend completa — VIGIIAP v1.0 ([2152a05](https://github.com/JanuarAsprilla/VIGIIAP/commit/2152a0557613034786af1be8476e3832da929bfa))
* file upload (dropzone) en Documentos y Mapas admin ([d34c5b6](https://github.com/JanuarAsprilla/VIGIIAP/commit/d34c5b69a4df6a955202e084282efdbcffcf7878))
* filtros, ordenamiento y vista previa funcionales en módulo Documentos ([66e359b](https://github.com/JanuarAsprilla/VIGIIAP/commit/66e359bca016edaa642774dd63ce9ac6579ca38d))
* **fonts:** [@fontsource](https://github.com/fontsource) self-hosted + CSP actualizado — elimina Google CDN ([872cd33](https://github.com/JanuarAsprilla/VIGIIAP/commit/872cd33ee2df02ed17c0763bcdc4b8ddd4744f04))
* **frontend:** performance, tipado Three.js, PWA icons y tests de componente ([0f77177](https://github.com/JanuarAsprilla/VIGIIAP/commit/0f771778762ef0241cecefd80327c9ca6a8d7d0a))
* **frontend:** tracking de descargas + toggles activo/publicado ([62cfe16](https://github.com/JanuarAsprilla/VIGIIAP/commit/62cfe165eeb2405f03d8c01ded3f4fa33509b83d))
* funcionalidad completa módulo Solicitudes ([c0d7e4f](https://github.com/JanuarAsprilla/VIGIIAP/commit/c0d7e4f98bc1bcdaca4fcf9ea002c46e3961affb))
* Geovisor funcional + Home mejorada ([5a40b7b](https://github.com/JanuarAsprilla/VIGIIAP/commit/5a40b7bc78b083d957a812a447392186e71d4bad))
* globo 3D mejorado, hero con texto descriptivo y control de acceso por rol ([c289c13](https://github.com/JanuarAsprilla/VIGIIAP/commit/c289c13dba41908590988a3e5809c1b4a417f906))
* herramientas funcionales + modal solicitud + fix placeholder Documentos ([03b8a6a](https://github.com/JanuarAsprilla/VIGIIAP/commit/03b8a6a44574e9e6f7ea0646044dd598d0c205a7))
* **home:** landing page cinematográfica con scrollytelling ([9cb5fea](https://github.com/JanuarAsprilla/VIGIIAP/commit/9cb5feaa159b7c53b318ffb900915fb1c2b0873a))
* implementar Footer institucional con links de navegación, contacto y redes sociales ([3fee43d](https://github.com/JanuarAsprilla/VIGIIAP/commit/3fee43d65b046d90b0b8ac569841ff7e7960b627))
* implementar módulo Documentos con acordeones, tabla de archivos, búsqueda y CTA soporte ([b22b8e8](https://github.com/JanuarAsprilla/VIGIIAP/commit/b22b8e8a81e87f802e21fbd7667b0c7c80c475cd))
* implementar módulo Herramientas con calculadora de áreas, generador de buffers, conversor de coordenadas y analizador de superposición ([304dc9b](https://github.com/JanuarAsprilla/VIGIIAP/commit/304dc9b74e2861190c12c9001d14781ce3ebd0f3))
* implementar módulo Mapas con filtros avanzados, chips removibles, grid de cards y paginación ([961317e](https://github.com/JanuarAsprilla/VIGIIAP/commit/961317ea118db344a3c1e3f1711a7c1d707978e9))
* implementar módulo Solicitudes con tabla de trámites, estados, formulario, file upload y KPIs ([7465f22](https://github.com/JanuarAsprilla/VIGIIAP/commit/7465f229bc93f16be8a39a351446f6d098f3b88e))
* implementar Navbar responsive con scroll effects, navegación activa animada y menú móvil ([df54375](https://github.com/JanuarAsprilla/VIGIIAP/commit/df543759d084a493dd3398c7d1da9e05230d177f))
* implementar Preloader animado con logo SVG, barra de progreso y fade-out ([1492b9b](https://github.com/JanuarAsprilla/VIGIIAP/commit/1492b9b4b132d9783460a019045387e41bdb2800))
* implementar sistema de autenticación UI con Login, solicitud de acceso, AuthContext y componentes condicionales ([2dfd099](https://github.com/JanuarAsprilla/VIGIIAP/commit/2dfd0993b29e88d5fd2030cfb6aea5d8c6d7370c))
* inicializar proyecto con Vite, React, Tailwind CSS v4 y design tokens VIGIIAP ([b6e0210](https://github.com/JanuarAsprilla/VIGIIAP/commit/b6e0210e24f34dbd621b087154587dbdf5be2cb1))
* integración completa frontend-backend (Block D) ([4b2f102](https://github.com/JanuarAsprilla/VIGIIAP/commit/4b2f1023325a0803ec06651d23495822371d1338))
* KPI visitantes, flujo solicitudes completo y colores estado ([35143ce](https://github.com/JanuarAsprilla/VIGIIAP/commit/35143cedf257b41ab051193efb0f588347c55896))
* **legal:** política de tratamiento de datos real y editable (Ley 1581 de 2012) ([#50](https://github.com/JanuarAsprilla/VIGIIAP/issues/50)) ([a1b1a64](https://github.com/JanuarAsprilla/VIGIIAP/commit/a1b1a64743ce5bd6c8dcfe0e6d8f8372b3321352))
* login dual — modo institucional y modo visitante ([458127a](https://github.com/JanuarAsprilla/VIGIIAP/commit/458127aa878f3a805f39cffaba8c9a60dcb3b93c))
* mejoras funcionales en 4 módulos ([2c9239a](https://github.com/JanuarAsprilla/VIGIIAP/commit/2c9239a2b7cdad87518b87b272950048a07ca748))
* merge activación cookie HttpOnly ([0cde0d2](https://github.com/JanuarAsprilla/VIGIIAP/commit/0cde0d21155070333741058c90553f4fc1a6118f))
* merge diseño sustancialmente mejorado ([f38fc15](https://github.com/JanuarAsprilla/VIGIIAP/commit/f38fc15cf18c112b00a1d135c4a406d8e82ccea3))
* modal de confirmación y limpieza automática en nueva solicitud ([df5b0f9](https://github.com/JanuarAsprilla/VIGIIAP/commit/df5b0f9bfa6d3e900f41b8b87b676bac5f03dd69))
* modal soporte documental y 3 herramientas nuevas ([ead83de](https://github.com/JanuarAsprilla/VIGIIAP/commit/ead83dea5723e890c6a05968be945e2f202dc753))
* módulo documentos — tipos Word/Excel, íconos por categoría, descarga funcional, tamaño de archivo ([a763851](https://github.com/JanuarAsprilla/VIGIIAP/commit/a763851364afe97a8ad61a6363107800e48a4303))
* **nav:** elevación visual Sidebar + TopBar ([d005f47](https://github.com/JanuarAsprilla/VIGIIAP/commit/d005f47617e52f060b2e3acdaaa0c5d559683a18))
* notificaciones admin — usuarios pendientes, solicitudes y noticias ([dd9a88d](https://github.com/JanuarAsprilla/VIGIIAP/commit/dd9a88dc86d5f6eb7aaf2f9698a8abb22e6dbf11))
* página 404, perfil de usuario y link Mi Perfil en dropdown ([d958e78](https://github.com/JanuarAsprilla/VIGIIAP/commit/d958e787249c425e502b128d5762cdfd2d1b98ac))
* página de Gestión de Categorías — CRUD con thumbnails, sidebar y rutas ([2d343fb](https://github.com/JanuarAsprilla/VIGIIAP/commit/2d343fb56ccf9ef1987cc07442b038eb642a342e))
* **pagination:** paginación real en 3 módulos admin — elimina limit:500 ([6f8943d](https://github.com/JanuarAsprilla/VIGIIAP/commit/6f8943d0f57f472810bff974f748eeeaec6b3b31))
* panel de administración para el registro propio de errores ([#84](https://github.com/JanuarAsprilla/VIGIIAP/issues/84)) ([07e14d1](https://github.com/JanuarAsprilla/VIGIIAP/commit/07e14d1cbe7071acbadfa6ef8ab7ebec2dfd6fcd))
* **perfil,mapas:** foto de perfil funcional, quita 3D de Cuenta de Usuario, rediseña tarjetas de Mapas ([#55](https://github.com/JanuarAsprilla/VIGIIAP/issues/55)) ([781c3c3](https://github.com/JanuarAsprilla/VIGIIAP/commit/781c3c3e5640caad41f07d252978c321d2094fd2))
* pintar Chocó Biogeográfico en globo 3D ([e7930cb](https://github.com/JanuarAsprilla/VIGIIAP/commit/e7930cb57064a340c1d66ea80e552d174737b417))
* preloader 3D profesional — globe wireframe + orbit + HUD ([51a4f53](https://github.com/JanuarAsprilla/VIGIIAP/commit/51a4f53a6ec32aeb9e3034badf23ead10ece034a))
* pulir auth condicional, dropdown perfil, recuperar password, quitar estado del sistema, crear páginas de recursos ([fb4007f](https://github.com/JanuarAsprilla/VIGIIAP/commit/fb4007f4c7786616537d824c337e995110444333))
* rediseño cinematic completo — dual-tema (claro por defecto / oscuro toggle) ([6c95dc0](https://github.com/JanuarAsprilla/VIGIIAP/commit/6c95dc03476c9709eca7b4ac50a1777081278f7c))
* rediseño de tarjetas de categorías en módulo Documentos ([047e164](https://github.com/JanuarAsprilla/VIGIIAP/commit/047e164427220f1a65741a98e661d17ef102b835))
* rediseño Home — presentación VIGIIAP, 6 módulos prominentes, noticias desde API ([b642ec9](https://github.com/JanuarAsprilla/VIGIIAP/commit/b642ec91d607101a8034a72a4948117f1a61e448))
* reemplazar Playfair Display por Source Serif 4 en tipografia display ([#91](https://github.com/JanuarAsprilla/VIGIIAP/issues/91)) ([986ebb7](https://github.com/JanuarAsprilla/VIGIIAP/commit/986ebb789e49c188e29e066d3ff5b12cf14389ad))
* **registro:** validación fuerte de contraseña, confirmación y pantalla de éxito correcta ([3fd9f63](https://github.com/JanuarAsprilla/VIGIIAP/commit/3fd9f632fb4cfe05ba06bfc5b87e6cda4e27ff02))
* roles Técnico SIG y Funcionario Institucional en frontend ([5e0ff84](https://github.com/JanuarAsprilla/VIGIIAP/commit/5e0ff84c42e774f4dfd9f0647ab9ee6587e4eb19))
* seguridad, renombrado VIGI-IIAP, mejoras UI y validaciones ([b01611b](https://github.com/JanuarAsprilla/VIGIIAP/commit/b01611b712141014854af93233cf809d5a0f5269))
* Sentry monitoring, focus traps, a11y completions, security DRY ([c93d14d](https://github.com/JanuarAsprilla/VIGIIAP/commit/c93d14d8ca7df0e47e70086dc270e0f6d9613afd))
* sidebar rediseño + sistema de animaciones 3D premium ([3b21ed9](https://github.com/JanuarAsprilla/VIGIIAP/commit/3b21ed9cf64ced31cf1bff5ed8b2c228d1f4a015))
* **sidebar:** role-based access control for visitante and unauthenticated users ([ed9bad5](https://github.com/JanuarAsprilla/VIGIIAP/commit/ed9bad520ea01531ad0fea576db1f6937adb4730))
* sistema de vidrio líquido (Apple) en Sidebar/TopBar/Home + rediseño 404 ([#35](https://github.com/JanuarAsprilla/VIGIIAP/issues/35)) ([e55768c](https://github.com/JanuarAsprilla/VIGIIAP/commit/e55768cf8f55df95a95eec710833f921bdb4ae8c))
* **solicitudes:** mejoras UX + acciones válidas por estado + días pendiente ([#6](https://github.com/JanuarAsprilla/VIGIIAP/issues/6)) ([e99c73c](https://github.com/JanuarAsprilla/VIGIIAP/commit/e99c73c8b243dfd07a0f6e2f063e4191287df028))
* **solicitudes:** upload real de archivos + panel admin + hooks archivos ([#7](https://github.com/JanuarAsprilla/VIGIIAP/issues/7)) ([b0af2cb](https://github.com/JanuarAsprilla/VIGIIAP/commit/b0af2cb4266631fafa4be046a8f878a549399d7e))
* toast de descarga en Documentos y upload de thumbnail en GestionNoticias ([d428027](https://github.com/JanuarAsprilla/VIGIIAP/commit/d428027eb8147c6db94dcc50586711a4505608d7))
* toasts de confirmación en panel de usuarios ([f8a1ee6](https://github.com/JanuarAsprilla/VIGIIAP/commit/f8a1ee6c19b4123e70a598407777b882fd214a87))
* toasts, mis solicitudes, invite/drawer usuarios y filtro fechas actividad ([67366f3](https://github.com/JanuarAsprilla/VIGIIAP/commit/67366f36a55d4a4acddf7b788a4bfae57bb8b323))
* **tooling:** Dependabot + Husky + lint-staged ([f92e3d7](https://github.com/JanuarAsprilla/VIGIIAP/commit/f92e3d785a7cd991f772200501d60373d17bd6db))
* topbar — mejoras UX y fix campana notificaciones ([56b0743](https://github.com/JanuarAsprilla/VIGIIAP/commit/56b07430948d7029331681daa3897d792bcff7ed))
* **typescript+security:** migración completa a TypeScript + seguridad producción ([19ecb76](https://github.com/JanuarAsprilla/VIGIIAP/commit/19ecb7672baa7312508ca8b942845a734b801f9d))
* **typescript:** hooks tipados con generics — 1566→703 errores (-55%) ([289ff2a](https://github.com/JanuarAsprilla/VIGIIAP/commit/289ff2a293cf91ac433ebf85c66eab1fcdd2fc29))
* **typescript:** strict mode completo — 0 errores en 1568→0 reducción final ([82b26d5](https://github.com/JanuarAsprilla/VIGIIAP/commit/82b26d584e04108f17be1443ee99f90fc7a9aa3e))
* **typescript:** strict mode completo — 0 errores TS en todo el codebase ([20a44b1](https://github.com/JanuarAsprilla/VIGIIAP/commit/20a44b17f0f6add536b59167eb35a5c2f65acb0a))
* **ui:** PaginationBar reutilizable + paginación en 4 módulos admin ([4e9ca5c](https://github.com/JanuarAsprilla/VIGIIAP/commit/4e9ca5c2bfbc7254a9a415a603e2099ed60fc548))
* **ux:** elevación visual — counters animados, empty states, status borders, tabs ([0ac7838](https://github.com/JanuarAsprilla/VIGIIAP/commit/0ac78384219d2772a2983052e37ba87e1dd9b81d))
* VIG-008 panel de administración completo con RBAC ([ffda670](https://github.com/JanuarAsprilla/VIGIIAP/commit/ffda67005665080d2f1c1878c1c405c1a59ec404))
* vista previa, visibilidad en mapas y PreviewModal mejorado ([5237ab8](https://github.com/JanuarAsprilla/VIGIIAP/commit/5237ab889d6974ab86139c98cd5e949c5a3c2ba7))


### Bug Fixes

* 3 bugs frontend — Link SPA, BottomTabs auth, notifPrefs persistentes ([2d803aa](https://github.com/JanuarAsprilla/VIGIIAP/commit/2d803aa5add06995861045f103101ab3f0229116))
* **3d:** muestra la escena cinematográfica en todos los tamaños de pantalla ([#45](https://github.com/JanuarAsprilla/VIGIIAP/issues/45)) ([91fcd91](https://github.com/JanuarAsprilla/VIGIIAP/commit/91fcd91b4c9a35d98b6989d4a0df09fce3be9e28))
* **a11y+assets:** labels completos en 7 formularios + og-image + apple-touch-icon ([e6adad2](https://github.com/JanuarAsprilla/VIGIIAP/commit/e6adad2c20cd4d45dfbeb1249532e8cf3d3f6d09))
* **a11y+tests:** labels htmlFor en 13 formularios + tests mutations 94% cobertura ([d7cd79f](https://github.com/JanuarAsprilla/VIGIIAP/commit/d7cd79f1aaf47ee9cd7ccf2092e8938b88975ae0))
* **a11y:** accesibilidad WCAG 2.1 AA + UX — focus traps, aria, errores visibles ([912bc51](https://github.com/JanuarAsprilla/VIGIIAP/commit/912bc51e6a1f77c5708212b1722ef6a4f466a9f9))
* **admin,ui:** corrige lista vacía en Gestión de Admins y liquid glass demasiado transparente ([#56](https://github.com/JanuarAsprilla/VIGIIAP/issues/56)) ([600c02c](https://github.com/JanuarAsprilla/VIGIIAP/commit/600c02cb0262b93541c58b50f4b6c9b6e5991b27))
* **admin:** audita panel de administración — quita tilt 3D de tablas, agrega Papelera y restringe Mantenimiento a super_admin ([#51](https://github.com/JanuarAsprilla/VIGIIAP/issues/51)) ([81ef4fc](https://github.com/JanuarAsprilla/VIGIIAP/commit/81ef4fc7d1db895d88798f3af79264efe10d035d))
* **admin:** corrige bugs P0-P2 del Dashboard y agrega días pendiente ([#54](https://github.com/JanuarAsprilla/VIGIIAP/issues/54)) ([8b070cb](https://github.com/JanuarAsprilla/VIGIIAP/commit/8b070cba5ad12555622db377c503f9876b50f085))
* **admin:** isError + reintentar en GestionMapas y GestionDocumentos ([a9ef9ff](https://github.com/JanuarAsprilla/VIGIIAP/commit/a9ef9ffd2b7706526de5b21d4be258af8c3babf1))
* **admin:** último bg-primary-50 fijo en AdminSidebar — barrido final de modo oscuro ([#53](https://github.com/JanuarAsprilla/VIGIIAP/issues/53)) ([9e7bc03](https://github.com/JanuarAsprilla/VIGIIAP/commit/9e7bc03b8d50a33b135259afc2c6f4384389b561))
* audit exhaustivo — lint 0 errores, WCAG 2.1 AA, 123 tests, UX fixes ([#9](https://github.com/JanuarAsprilla/VIGIIAP/issues/9)) ([8e472db](https://github.com/JanuarAsprilla/VIGIIAP/commit/8e472dbd7777a20fd917fc60c6833acfc2b4aad7))
* **audit:** lint 0 errores, OG tags, Sentry replay, api limpio, tests hooks ([92d0bdd](https://github.com/JanuarAsprilla/VIGIIAP/commit/92d0bddd1c087134b24d00a56614825400ea50f7))
* **audit:** seguridad, accesibilidad y código muerto ([79c74e4](https://github.com/JanuarAsprilla/VIGIIAP/commit/79c74e44f6e08b0cc5adfeee00b89af67c79d1ac))
* **auth:** conecta el panel de stats del login a datos reales ([#44](https://github.com/JanuarAsprilla/VIGIIAP/issues/44)) ([531ac55](https://github.com/JanuarAsprilla/VIGIIAP/commit/531ac5514dc9ec142d6e0ca3fd53bae74fe94375))
* bg-white fijo en el resto del área autenticada (modo oscuro) ([#90](https://github.com/JanuarAsprilla/VIGIIAP/issues/90)) ([c3a8edb](https://github.com/JanuarAsprilla/VIGIIAP/commit/c3a8edb18501e9b26ebfcf19b7d4f85b71f037cd))
* blindar CSP, allowlist de URLs y dependencias con vulnerabilidades ([#92](https://github.com/JanuarAsprilla/VIGIIAP/issues/92)) ([eddb5cc](https://github.com/JanuarAsprilla/VIGIIAP/commit/eddb5ccf20d8905c80a08645cbe18230b5186e33))
* boton de revocar sesion sin nombre accesible + test fragil ([#99](https://github.com/JanuarAsprilla/VIGIIAP/issues/99)) ([dd55499](https://github.com/JanuarAsprilla/VIGIIAP/commit/dd554996b025034db8bf3c41d194152027957076))
* **build:** npm ci en script build — garantiza instalación limpia en Render aunque el cache esté stale ([dbc66ec](https://github.com/JanuarAsprilla/VIGIIAP/commit/dbc66ec27a6ba6345e21ff90ed967b6e01b9a0ac))
* **ci:** agrega pull-requests:read al job de escaneo de secretos ([7801910](https://github.com/JanuarAsprilla/VIGIIAP/commit/7801910fa07de8392aa4a40fbfa17d04d6b68478))
* **ci:** elimina tests .jsx duplicados — se mantienen solo los .tsx migrados ([caa1341](https://github.com/JanuarAsprilla/VIGIIAP/commit/caa1341e2825320676c8e59cc7e1190d39e8eca1))
* **cleanup:** elimina rastros de Noticias en tipos, constantes e imports ([df1119c](https://github.com/JanuarAsprilla/VIGIIAP/commit/df1119c4be93ae05843b159874dcc2947ff648ee))
* cobertura de tests real — era 8.69%, se reportaba como 98.84% ([#67](https://github.com/JanuarAsprilla/VIGIIAP/issues/67)) ([#68](https://github.com/JanuarAsprilla/VIGIIAP/issues/68)) ([7e32dfe](https://github.com/JanuarAsprilla/VIGIIAP/commit/7e32dfecf4d686e018a518223a0c52e9f8621df3))
* command palette usa noticias reales de la API en lugar de ALL_NEWS estático ([ee40e91](https://github.com/JanuarAsprilla/VIGIIAP/commit/ee40e913b923467be19a65236eb697bc5e45f24e))
* comprehensive audit — auth race, a11y, UX, bugs, security config ([80745da](https://github.com/JanuarAsprilla/VIGIIAP/commit/80745da465b716e0bcd15ae5104f992f0e8bc7dd))
* Content-Type FormData, categorías sincronizadas, campos vestigiales noticias eliminados ([1f05073](https://github.com/JanuarAsprilla/VIGIIAP/commit/1f050730f985b530784318474df3749e7356a456))
* contraste WCAG AA — token text-muted, marquee, CTA y eyebrows admin ([#89](https://github.com/JanuarAsprilla/VIGIIAP/issues/89)) ([4e0df7b](https://github.com/JanuarAsprilla/VIGIIAP/commit/4e0df7bcec3031a5b0ed193386c3f25f7969e2e8))
* correcciones de seguridad — CVEs axios, headers producción, CRLF/CSV, noreferrer, env gitignore ([e7962df](https://github.com/JanuarAsprilla/VIGIIAP/commit/e7962dfcc8867968b8bde2c7e6fa668155956514))
* corregir bug ícono Geovisor, detección de formato y wiring onFormatDetect ([0d02aef](https://github.com/JanuarAsprilla/VIGIIAP/commit/0d02aefc8fc3d75d8fa27e2890060a7f21081feb))
* corregir modelo de acceso por rol — público puede ver mapas/documentos/solicitudes ([b178293](https://github.com/JanuarAsprilla/VIGIIAP/commit/b17829354469f3e25284414d5f3618365c37c641))
* corregir ReferenceError 'q is not defined' en Home.jsx ([a0ebdf7](https://github.com/JanuarAsprilla/VIGIIAP/commit/a0ebdf7b022541f279784db0b5abb96e73e4dc5e))
* crash Herramientas, ErrorBoundary global y dependencia corrupta ([dc2b765](https://github.com/JanuarAsprilla/VIGIIAP/commit/dc2b765126d88e07f1cec794ab53832d70cbaf61))
* **deploy:** CSP con URLs reales de producción en Render ([5faea08](https://github.com/JanuarAsprilla/VIGIIAP/commit/5faea0839b374a89f48bc186dd08afdb8854212f))
* **deploy:** CSP connect-src + envVars en render.yaml + .env.example completo ([bd48803](https://github.com/JanuarAsprilla/VIGIIAP/commit/bd4880337623e465927d957e6797b918b53fae89))
* **deps:** agrega @fontsource/playfair-display y @fontsource/source-sans-3 a dependencies — faltaban en package.json ([a5ce185](https://github.com/JanuarAsprilla/VIGIIAP/commit/a5ce185490b48c49179c974e315f837952af7e71))
* **deps:** parche CVEs HIGH en dependencias del frontend ([#26](https://github.com/JanuarAsprilla/VIGIIAP/issues/26)) ([f4a4690](https://github.com/JanuarAsprilla/VIGIIAP/commit/f4a469022e697c18a6deb34c87c114340724f4e4))
* desbordamiento horizontal en mobile por el fondo compartido del Hero ([#87](https://github.com/JanuarAsprilla/VIGIIAP/issues/87)) ([3bd125a](https://github.com/JanuarAsprilla/VIGIIAP/commit/3bd125af26a444cd3f09398eb264d0c790b476c3))
* descarga de documentos usa título + extensión como nombre de archivo ([e7ea291](https://github.com/JanuarAsprilla/VIGIIAP/commit/e7ea29151c244cfa80947ba44139b6e173cbba9a))
* descarga forzada via fetch+blob para PDF e imagen (evita restricción cross-origin) ([1a0cbf0](https://github.com/JanuarAsprilla/VIGIIAP/commit/1a0cbf0b75646a8640e21fb45ae46f3d38734d15))
* **design:** hallmark audit corrections — stripe 2px, hero-grain, tabular nums, gap anim, stamp ([3ab1a07](https://github.com/JanuarAsprilla/VIGIIAP/commit/3ab1a0753f6a2548034bdd342399434a4bf9ec06))
* estabiliza E2E de rutas protegidas contra latencia real de Render ([#83](https://github.com/JanuarAsprilla/VIGIIAP/issues/83)) ([6750a91](https://github.com/JanuarAsprilla/VIGIIAP/commit/6750a91bd8a39391bee9a0891f425be2df2fcea9))
* estados solicitudes diferenciados, sparkline real y edición de perfil ([eab4a1e](https://github.com/JanuarAsprilla/VIGIIAP/commit/eab4a1e2323b1e9f7ac98a2903b17a434f3ab561))
* fondo compartido real entre las 2 primeras secciones de Home ([#86](https://github.com/JanuarAsprilla/VIGIIAP/issues/86)) ([fb0df88](https://github.com/JanuarAsprilla/VIGIIAP/commit/fb0df883855247e6e8e4b9e543788a9ef4402ca5))
* fondo continuo y scroll-parallax entre las 2 primeras secciones de Home ([#85](https://github.com/JanuarAsprilla/VIGIIAP/issues/85)) ([b2d6241](https://github.com/JanuarAsprilla/VIGIIAP/commit/b2d6241fdc7e7af61d06e275f7464af9b40ac5b9))
* **frontend:** hallazgos de auditoría — tipos mutation, debounce, email regex y localStorage ([57a24df](https://github.com/JanuarAsprilla/VIGIIAP/commit/57a24dfa3ec8083f9ce3a0a9fd8ae19c8bed1e20))
* **front:** gating RBAC en Usuarios y Perfil + corrige tipos de ProfileDropdown ([8460c89](https://github.com/JanuarAsprilla/VIGIIAP/commit/8460c89153d6ef652521b1b3df7a321b2966557e))
* guard map download buttons against frustration-click race ([#64](https://github.com/JanuarAsprilla/VIGIIAP/issues/64)) ([8f76613](https://github.com/JanuarAsprilla/VIGIIAP/commit/8f766132406fa9fe4176b00853652be4f7724f37))
* **hero:** separa PlatformIntroSection del Hero — fondo atmosférico CSS ([6b686ea](https://github.com/JanuarAsprilla/VIGIIAP/commit/6b686eae7277ff5ef73e49967269d235744a3090))
* **home:** ajuste de alturas y proporciones en todas las secciones ([523864b](https://github.com/JanuarAsprilla/VIGIIAP/commit/523864b3f2b0ac480abe60f62bda01fc3791f613))
* **home:** replace GSAP ScrollTrigger with Framer Motion whileInView for module/stat cards ([7f94ef1](https://github.com/JanuarAsprilla/VIGIIAP/commit/7f94ef10828b186b63aa61e3f8d848f06909b0f4))
* limpieza imports, paginación condensada, ResumenActividad real, labels audit ([5a60074](https://github.com/JanuarAsprilla/VIGIIAP/commit/5a600745bf2cd77f614b7ff0b918cc7784ecc72f))
* Map shadowing en CommandPalette y r=undefined en SVG pulse rings ([d9380b1](https://github.com/JanuarAsprilla/VIGIIAP/commit/d9380b1f24241e8139db43ebd1f8bb5eec92a276))
* mejorar centrado y espaciado del hero en Home ([b5d9162](https://github.com/JanuarAsprilla/VIGIIAP/commit/b5d9162e181c67a47857887c77e428f529fce8bf))
* merge correcciones de seguridad desde worktree-security-fixes ([8d9f32e](https://github.com/JanuarAsprilla/VIGIIAP/commit/8d9f32e20f2b6f45fdf79f69d7531b88c66955df))
* modo oscuro roto en todas las pantallas de login/auth ([#88](https://github.com/JanuarAsprilla/VIGIIAP/issues/88)) ([cf9326e](https://github.com/JanuarAsprilla/VIGIIAP/commit/cf9326eea5443f37e5883ec2f1aea2bb72cdb833))
* **modules:** Geovisor description Chocó Biogeográfico (no Pacífico colombiano) ([9cb5fea](https://github.com/JanuarAsprilla/VIGIIAP/commit/9cb5feaa159b7c53b318ffb900915fb1c2b0873a))
* motivo opcional, activar usuario con botón dedicado, rol editable por separado ([03f005c](https://github.com/JanuarAsprilla/VIGIIAP/commit/03f005ca11bda9e9a89c9771101d9b0aee4836d3))
* nombre completo VIGI-IIAP corregido en footer, home y configuración ([a28d0f8](https://github.com/JanuarAsprilla/VIGIIAP/commit/a28d0f8a33e95640bf0a5ccb92d8471742bb4d87))
* Noticias paginación enviaba offset pero backend espera page ([4697926](https://github.com/JanuarAsprilla/VIGIIAP/commit/46979269a691bc6479b717ccc4ad39ecaa251211))
* notificaciones — link en noticias y enabled correcto en TopBar ([c89f1bf](https://github.com/JanuarAsprilla/VIGIIAP/commit/c89f1bfc28c4b07777c65bf2947f961cb0d04a1f))
* panel admin noticias y mapas ahora solicitan todos los registros (incluye borradores e inactivos) ([75d61b7](https://github.com/JanuarAsprilla/VIGIIAP/commit/75d61b736e48f64f59a13c334e9159ecd083bd11))
* **perf:** anima la barra de progreso del preloader con transform en vez de width ([#47](https://github.com/JanuarAsprilla/VIGIIAP/issues/47)) ([0ef312e](https://github.com/JanuarAsprilla/VIGIIAP/commit/0ef312e73636b7f296cdf65858836e32019eb27f))
* **perfil:** corrige flujo de 2FA — llamaba a rutas y campos que no existen ([#62](https://github.com/JanuarAsprilla/VIGIIAP/issues/62)) ([9892a49](https://github.com/JanuarAsprilla/VIGIIAP/commit/9892a495dd75d57e5a5cd99738bc8395206c6ded))
* **perfil:** corrige modo oscuro roto en toda la página de Cuenta de Usuario ([#52](https://github.com/JanuarAsprilla/VIGIIAP/issues/52)) ([7d8bd0e](https://github.com/JanuarAsprilla/VIGIIAP/commit/7d8bd0e59d35702e298ed4baf3d73b54425a672e))
* preloader global una sola vez, ajustar tipografía legible, actualizar formatos de mapas a PDF/IMG/Geovisor ([9103df3](https://github.com/JanuarAsprilla/VIGIIAP/commit/9103df38b25c201b595bd4633ed89309392258e3))
* **qa:** 3 bugs reales encontrados en testing E2E de producción ([#78](https://github.com/JanuarAsprilla/VIGIIAP/issues/78)) ([49fbb72](https://github.com/JanuarAsprilla/VIGIIAP/commit/49fbb72c57d1c2a66c0dec347059eae4eb6b587b))
* reconcilia tests tras cherry-pick de develop sobre main ([549a617](https://github.com/JanuarAsprilla/VIGIIAP/commit/549a617e2f8999a8cf1352fa730bab7036c6c375))
* reemplazar ADMIN_ACTIVITY_LOG estático por audit log real en Dashboard ([00c9d9f](https://github.com/JanuarAsprilla/VIGIIAP/commit/00c9d9fff4a52a020188c2b8a76a58f820e50bb0))
* reemplazar constante ALL_NEWS por API real y mejorar manejo de errores de auth ([bac9fa3](https://github.com/JanuarAsprilla/VIGIIAP/commit/bac9fa3fcb3ac2b53620add1a300caf66f727009))
* refactoring ([029bbad](https://github.com/JanuarAsprilla/VIGIIAP/commit/029bbaddb4ca78313b09422b74a1f9f860ab1137))
* refactoring site ([3125d57](https://github.com/JanuarAsprilla/VIGIIAP/commit/3125d57c364d2e3706a5083a51be7f8b803720ba))
* render.yaml con rewrite SPA para rutas como /verificar-email/:token ([29f2e8f](https://github.com/JanuarAsprilla/VIGIIAP/commit/29f2e8f73a8713f0b441bd6f304f22f4d4674de9))
* **resilience:** retry exponencial, Sentry en mutaciones y limit explícito en GestionMapas ([8b92e7d](https://github.com/JanuarAsprilla/VIGIIAP/commit/8b92e7d93cb5af676ee9f872932dd777a8d53fcd))
* resolver deuda técnica frontend — notificaciones y usuario WelcomeStrip ([c98c518](https://github.com/JanuarAsprilla/VIGIIAP/commit/c98c518144c5bcd26fe102c56f592233f180bef5))
* rojos, naranjas y amarillos — GestionDocumentos edit, Actividad labels, Noticias paginación, Mapas thumbnail ([4c13298](https://github.com/JanuarAsprilla/VIGIIAP/commit/4c13298021bb92ca091140d84f48e4e29b00d503))
* **router:** añade ruta /cambiar-password-expirada que faltó en el merge ([7e1c269](https://github.com/JanuarAsprilla/VIGIIAP/commit/7e1c26919bac34eac42b0762f8ae7e871421da71))
* security, performance, and accessibility hardening ([bf2ad36](https://github.com/JanuarAsprilla/VIGIIAP/commit/bf2ad36be7d099241fe9a6571f7ad774500266e7))
* **security:** endurece CI/CD y cabeceras de seguridad ([#48](https://github.com/JanuarAsprilla/VIGIIAP/issues/48)) ([c3c3022](https://github.com/JanuarAsprilla/VIGIIAP/commit/c3c3022e2b289edac9ed6b7da976dc7c0e4a2495))
* **security:** envía token CSRF en peticiones mutantes autenticadas por cookie ([#49](https://github.com/JanuarAsprilla/VIGIIAP/issues/49)) ([669d212](https://github.com/JanuarAsprilla/VIGIIAP/commit/669d212537bc1fdcd26313c3cda50ee9cce5a895))
* **security:** roles consistentes — RequireVerified + ROLES importados ([eabed4e](https://github.com/JanuarAsprilla/VIGIIAP/commit/eabed4e9646de1c08c6f0fe814dfa781e3bf6f75))
* solicitudes envían value en vez de label + mapa de tipos legibles ([def4b2e](https://github.com/JanuarAsprilla/VIGIIAP/commit/def4b2ecf602c6c1d1a9ebcbb8e5969fcbb8ab9c))
* SPA routing en Render, botones Descargar/Visualizar en tarjetas de mapas ([03aaaec](https://github.com/JanuarAsprilla/VIGIIAP/commit/03aaaec6bf25970ec07f8ea4d5578a60bc9792d9))
* **test:** waitFor en isError test para evitar timing flakiness ([9cb5fea](https://github.com/JanuarAsprilla/VIGIIAP/commit/9cb5feaa159b7c53b318ffb900915fb1c2b0873a))
* timeout sin límite en uploads FormData, thumbnail hasta 50 MB ([6acb578](https://github.com/JanuarAsprilla/VIGIIAP/commit/6acb578b21baef8ddf65f4cfc7066df5d03e3077))
* title de página actualizado al nombre completo VIGI-IIAP ([4b96742](https://github.com/JanuarAsprilla/VIGIIAP/commit/4b967422feaac4023bbbbfa8632b063b3e9bf96f))
* **types:** corrige MapaVisibilidad + isAdmin desde context en TopBar ([8ad4c75](https://github.com/JanuarAsprilla/VIGIIAP/commit/8ad4c7551e7eb1ac1ab98ab85102107ff3f7f1f5))
* **types:** elimina 374 errores de TypeScript, deja lint en cero y consolida dependencias ([#32](https://github.com/JanuarAsprilla/VIGIIAP/issues/32)) ([95f0457](https://github.com/JanuarAsprilla/VIGIIAP/commit/95f0457f48f1474f519c0a39615c3aad4b8808c1))
* **types:** noImplicitAny:true — 503 errores TypeScript a cero ([4928a2c](https://github.com/JanuarAsprilla/VIGIIAP/commit/4928a2c55de795902f2e01611b78344b35e69f42))
* **ui:** Geovisor/ForWhom claro-oscuro, redundancias nav, sesión y stats reales ([#37](https://github.com/JanuarAsprilla/VIGIIAP/issues/37)) ([ac1e1b5](https://github.com/JanuarAsprilla/VIGIIAP/commit/ac1e1b50d6cefae878f1dd1f17372f429a532e2e))
* **ui:** Panel Admin/Cerrar Sesión más visibles + modo oscuro en AdminSidebar ([#46](https://github.com/JanuarAsprilla/VIGIIAP/issues/46)) ([73bb371](https://github.com/JanuarAsprilla/VIGIIAP/commit/73bb37120ea086ce285f092b136da11b75e2a566))
* **ui:** reduce aún más el largo de InstitutionalRevealSection ([#43](https://github.com/JanuarAsprilla/VIGIIAP/issues/43)) ([5262fdd](https://github.com/JanuarAsprilla/VIGIIAP/commit/5262fdd6eb0f8f8fcf298e758e9faf772fd2ac11))
* **ui:** vidrio líquido realmente visible + Hero claro/oscuro ([#36](https://github.com/JanuarAsprilla/VIGIIAP/issues/36)) ([74d5ddd](https://github.com/JanuarAsprilla/VIGIIAP/commit/74d5ddd7d3663b9ce0806b10c2121c3e2ad06c98))
* usuarios con 2FA no podían completar login — ruta /verificar-2fa faltante ([#82](https://github.com/JanuarAsprilla/VIGIIAP/issues/82)) ([eb625a7](https://github.com/JanuarAsprilla/VIGIIAP/commit/eb625a77f709b5bf0cbe4aa1315b86931e69319b))
* **visual:** reorganiza layout tras eliminar Noticias ([545f3e9](https://github.com/JanuarAsprilla/VIGIIAP/commit/545f3e967536be5d3c1ba2d9ff3cf8e0ca4026e4))
* WCAG labels en 13 formularios + 156 tests + 94% cobertura ([#10](https://github.com/JanuarAsprilla/VIGIIAP/issues/10)) ([ffca853](https://github.com/JanuarAsprilla/VIGIIAP/commit/ffca8536a91f35372e490536b08a4037c8fde210))
* wire 3 critical broken features (password strength, config save, approval buttons) ([f36ecdd](https://github.com/JanuarAsprilla/VIGIIAP/commit/f36ecdd5d15f148b5003651768eb2bd0659d6718))


### Performance Improvements

* **observability+virtualization:** web-vitals → Sentry + GestionMapas virtualizada ([65a88f6](https://github.com/JanuarAsprilla/VIGIIAP/commit/65a88f67db53bb56dfb161973dfe9f8b3e4a4671))
* precarga de fuentes criticas, limpieza de assets y lazy-load en admin ([#98](https://github.com/JanuarAsprilla/VIGIIAP/issues/98)) ([5f67290](https://github.com/JanuarAsprilla/VIGIIAP/commit/5f67290d9dfc7f7b012cc856e5726685e98eab13))

## [Unreleased]

### Seguridad
- El repositorio pasa a privado (frontend y backend).
- El pipeline de CI ya no expone secrets ni la URL del backend de producción
  a workflows disparados por `pull_request` — solo en `push` a `develop`/`main`.

### Corregido
- La sesión ya no se cerraba a la fuerza cada 15 minutos: el cliente axios
  ahora implementa refresh silencioso contra el backend.
- El gráfico "Distribución de Roles" del dashboard admin omitía Técnico SIG
  y Funcionario Institucional.
- El botón de descarga de mapas ya no dispara descargas duplicadas con
  doble clic.
- La barra de progreso del preloader volvía a animar `width` en vez de
  `transform` (regresión de un fix anterior).
- Un usuario `super_admin` no veía las estadísticas de administrador en
  Herramientas — el chequeo solo reconocía `admin_sig`.

### Rendimiento
- Los chunks de Three.js (886 KB) y Leaflet (163 KB) se precargaban en
  todas las páginas pese a cargarse de forma diferida (`React.lazy()`);
  ahora solo se piden cuando corresponde (Home, Mapas/Geovisor).

### Tests
- Cobertura de tests real corregida: `vitest.config.ts` no instrumentaba
  la mayoría del código fuente, así que el 98.84% reportado medía casi
  nada. Cobertura real actual: ~80% statements / ~78% branches / ~82% líneas.
- `e2e/authenticated.spec.ts` (flujos con sesión iniciada: dashboard,
  panel admin, mapas, documentos, solicitudes) conectado al pipeline de
  CI — antes solo corrían los tests públicos y de login.

### Quitado
- Documentación interna de auditoría y de proceso de desarrollo asistido
  por IA que no debía quedar en el repositorio.
