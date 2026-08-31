# SOS Patitas

Trabajo Final Integrador — Tecnicatura Universitaria en Programación (UTN)

**Alumnas:** Karen Yanet Guardia y Karen Vanessa Ortellado
**Tutor:** Sergio Andrés Antonini
**Repositorio:** https://github.com/kguardia/TIF-Grupo159-GUARDIA-ORTELLADO.git

\---

## Tabla de contenidos

* [Descripción general del proyecto](#descripción-general-del-proyecto)
* [1) Definición de la problemática y propuesta técnica](#1-definición-de-la-problemática-y-propuesta-técnica)

  * [Actividad 1: Identificación del problema y propuesta de solución](#actividad-1-identificación-del-problema-y-propuesta-de-solución)
  * [Funcionalidades del sistema (MVP)](#funcionalidades-del-sistema-mvp)
  * [Alcance y no alcance del proyecto](#alcance-y-no-alcance-del-proyecto)
  * [Requerimientos funcionales](#requerimientos-funcionales)
  * [Requerimientos no funcionales](#requerimientos-no-funcionales)
  * [Actividad 2: Definición del stack tecnológico](#actividad-2-definición-del-stack-tecnológico)
  * [Actividad 3: Refinamiento de propuesta y análisis de viabilidad asistida por IA](#actividad-3-refinamiento-de-propuesta-y-análisis-de-viabilidad-asistida-por-ia)

\---

## Descripción general del proyecto

**Nombre del proyecto:** SOS Patitas

"SOS Patitas" es un portal web que centraliza la publicación, verificación y asistencia de casos de animales en situación de calle en CABA. Cualquier persona puede reportar un caso sin necesidad de registrarse; ese reporte queda oculto hasta que un moderador lo revisa y lo aprueba, evitando que se publiquen estafas o pedidos falsos. Una vez aprobado, el caso es visible públicamente con su ubicación y tipo de urgencia, y queda disponible para que rescatistas, veterinarias, transportistas o donantes puedan actuar. El sistema también ofrece un directorio de veterinarias 24hs y rescatistas por zona, y un registro simple de donaciones asociado a cada caso.

\---

## 1\) Definición de la problemática y propuesta técnica

### Actividad 1: Identificación del problema y propuesta de solución

**¿Qué problema existe?**
La información sobre animales en situación de calle que necesitan asistencia (no solo mascotas perdidas) está dispersa en grupos de Facebook, WhatsApp, publicaciones de Instagram, Tiktok y X. Sin verificación, lo que genera dos fallas: pedidos de ayuda que no llegan a quién puede resolverlos a tiempo, y estafas que usan la excusa de "un animal que necesita plata" algo que erosiona la confianza de quien quiere donar.

**¿Quién lo sufre?**
Quien encuentra un animal y no sabe a quién recurrir; rescatistas y veterinarias que no se enteran a tiempo de casos urgentes; donantes que dejan de aportar por miedo a que sea un fraude; y el animal que pierde tiempo de atención.

**¿Qué valor puede agregar una solución de software?**
Centraliza y verifica: un moderador humano confirma que el caso es real antes de que sea público, algo que ninguna red social hace. Estructura la información (zona, tipo de urgencia, tipo de ayuda necesaria) de forma buscable, cosa que un feed de Instagram no permite.

**¿Quiénes son los actores involucrados en ese proceso?**
Quien publica el caso, el moderador, veterinarias, rescatistas/tránsitos, financiadores de traslado y donantes. El detalle de qué necesita y qué puede hacer cada uno se desarrolla en las tablas de la sección "Identificación de actores y necesidades", más adelante.

**¿Cuál es el problema central? ¿Cuál es su impacto?**
Falta de un canal confiable y centralizado entre "alguien encontró un animal que necesita ayuda" y "alguien puede resolverlo" – impacto medible en animales sin asistencia a tiempo y en fraudes que desincentivan la donación.

**¿Qué valor agregaría una solución tecnológica que no pueda lograrse con las herramientas actuales y convencionales?**
Las diferencias con herramientas actuales: las apps existentes (adoptar.com.ar, MyPets, Animales BA) resuelven reencuentro dueño-mascota; nosotras proponemos una solución que resuelva el rescate y financiamiento verificado de animales sin dueño, es un caso de uso distinto, con la moderación como pieza central.

#### Desarrollo de los temas abordados

**Identificación del problema en un contexto real**
En el caso que proponemos, identificamos el problema como una ineficiencia tolerada cuya información está dispersa y puede centralizarse. Hoy, cuando una persona encuentra un animal en situación de calle que necesita ayuda, no existe un único canal al que recurrir: recorre grupos de Facebook, cuentas de Instagram de rescatistas independientes o cadenas de WhatsApp, sin saber cuáles son confiables. Esta dispersión no es un proceso roto — de hecho 'funciona', en el sentido de que a veces los animales sí reciben ayuda — pero es ineficiente: depende del azar de que la publicación correcta llegue a la persona correcta a tiempo, y no existe ningún filtro que distinga un pedido real de una estafa.

**Problema bien identificado**
Tiene un contexto claro que permite interpretarlo: Rescate y asistencia de animales en situación de calle en CABA (a definir zona inicial), donde la coordinación entre quien encuentra el caso y quien puede resolverlo (veterinaria, rescatista, donante) depende hoy de redes sociales sin estructura ni verificación.

Afecta a personas concretas: vecinos que encuentran animales heridos o abandonados y no saben a quién recurrir; rescatistas y veterinarias que reciben pedidos de ayuda de forma desorganizada, a veces tarde; personas que quieren donar pero desconfían por los casos de estafa que circulan.

Tiene un impacto medible: el impacto se evidenciará durante el relevamiento con actores reales (cantidad de casos publicados por semana en grupos existentes, tiempo promedio de respuesta, porcentaje de publicaciones que se sospechan falsas).

Admite una solución tecnológica: sí — centralización de datos, geolocalización, y un flujo de aprobación (moderación) son problemas clásicamente resueltos con software.

#### Técnicas de relevamiento: actores, flujos de trabajo y necesidades

**Entrevistas y relevamiento**

Realizamos una entrevista con un rescatista independiente de gatos (sin pertenencia a un refugio formal), quien lleva varios años haciendo tránsito y adopción en el conurbano y CABA. De su testimonio surgieron tres hallazgos clave:

* Confirmó el problema de trazabilidad: las publicaciones que circulan en redes sociales suelen ser reposteos de reposteos, lo que obliga a rastrear manualmente el contacto original, y en varios casos derivó en trasladarse a zonas alejadas del conurbano sin conocer la distancia real de antemano.
* Identificó una necesidad que no habíamos contemplado en la propuesta inicial: el financiamiento o la donación del traslado del animal, en casos donde quien lo encuentra no tiene forma de acercarlo a una zona con recursos veterinarios disponibles.
* De forma espontánea, propuso una solución muy cercana al mecanismo de moderación que ya habíamos diseñado: una base de potenciales adoptantes o colaboradores con un 'ranking' o perfil de confianza vinculado a sus redes sociales, que permita distinguir un perfil real de uno falso. Esto valida de forma directa el rol del moderador como verificador de identidad y buena fe, tanto de quien publica como de quien se ofrece a ayudar.

**Análisis del flujo de trabajo actual (situación "as-is")**

A partir del relevamiento, se explicita el flujo de trabajo actualmente implícito en redes sociales:

1. Una persona encuentra un animal en situación de calle.
2. Publica en su cuenta personal, en un grupo de Facebook, o pide a un conocido que lo publique en redes.
3. La publicación puede ser reposteada por terceros, perdiendo el contacto original — quien quiere ayudar debe rastrear manualmente hasta dar con el dato de contacto real.
4. Si hay interesados en ayudar (rescatista, donante, transportista), se coordina por mensaje privado, sin ningún registro ni verificación de que la persona sea quien dice ser.
5. Si el caso requiere trámite de adopción con un grupo de proteccionistas, se agregan pasos manuales adicionales (solicitud de recibo de sueldo, visita domiciliaria), lo cual —según nuestro entrevistado— puede demorar o incluso frenar adopciones legítimas por exceso de exigencia.
6. No queda ningún registro centralizado de qué pasó con el caso después del primer contacto.

**Identificación de actores y necesidades**

A continuación se detallan los actores identificados en el proceso, sus expectativas frente al sistema y las limitaciones que enfrenta cada uno:

|Actor|Qué espera del sistema|Limitación|
|-|-|-|
|Publicante|Publicar rápido y que alguien vea el caso|No siempre conoce recursos disponibles en su zona|
|Moderador|Verificar que el caso y los perfiles sean reales|Cuello de botella; debe balancear seguridad sin excluir gente de buena fe|
|Rescatista/tránsito|Enterarse de casos en su zona y evaluar adoptantes confiables|Necesita filtrar por ubicación y verificar perfiles, sin pedir datos invasivos|
|Financiador de traslado|Ofrecer o costear el transporte cuando la distancia es la barrera, no la plata del veterinario|No siempre está claro que este rol existe como opción separada de "donar plata para el veterinario"|
|Veterinaria|Recibir casos urgentes verificados en su zona|—|
|Donante|Confiar en que su aporte llega al caso real|Necesita ver trazabilidad|

Para dejar explícito qué rol necesita cuenta en el sistema y qué puede hacer cada uno:

|Actor|¿Necesita cuenta?|Qué puede hacer en el sistema|
|-|-|-|
|Publicante|No — deja un contacto obligatorio para validación|Completa el formulario de publicación; consulta el estado de su propio caso con el link recibido|
|Moderador|Sí — rol asignado por un administrador|Ve la cola de casos pendientes; aprueba, rechaza o marca "en revisión"; prioriza "urgencia crítica"; carga el directorio|
|Visitante público|No|Ve el listado/mapa de casos aprobados y el directorio; comparte un caso en redes|
|Rescatista / veterinaria (directorio)|No, en esta versión — lo carga el moderador|Aparece listado como contacto disponible por zona|
|Donante|No|Ve el monto objetivo/recaudado y el alias de donación, asociado al tipo de ayuda que el caso requiere (ej. traslado o atención veterinaria); la donación ocurre fuera del sistema|

**La diferencia entre digitalizar un proceso y agregar un valor real**

En nuestro caso no se trata solo de mover a una web lo que ya pasa en redes sociales — eso sería simplemente digitalizar. El valor real está en: (1) reducir el tiempo y el riesgo de fraude mediante la moderación previa, algo que hoy no existe en ningún canal; (2) habilitar algo antes imposible: un directorio centralizado de recursos por zona que hoy nadie mantiene actualizado en un solo lugar; (3) mejorar la experiencia de forma medible, por ejemplo reduciendo el tiempo entre que se publica un caso y que un rescatista o veterinaria lo ve, comparado con depender del algoritmo de una red social.

**Validación del problema**

*¿El problema está ocurriendo ahora o es hipotético?*
Ocurre ahora — es visible en la cantidad de grupos de Facebook y cuentas de rescate que existen hoy en Buenos Aires, funcionando de forma fragmentada.

*¿Los afectados reconocen el problema como tal?*
Sí, confirmado directamente: el rescatista entrevistado describió la dispersión y falta de trazabilidad como una dificultad recurrente en su experiencia.

*¿Existe alguna solución parcial hoy? ¿Por qué no es suficiente?*
Existen grupos de Facebook y redes sociales, pero según el propio entrevistado, el sistema de republicación en cadena hace perder el contacto original, y no existe mecanismo alguno de verificación de perfiles — lo cual el mismo entrevistado señaló como una carencia, proponiendo espontáneamente algo similar a nuestro sistema de moderación.

*¿La solución propuesta es técnicamente factible en el tiempo con los recursos disponibles?*
Sí, siempre que se acote al MVP definido (ver [Alcance y no alcance del proyecto](#alcance-y-no-alcance-del-proyecto)).

*¿Existe algo similar en el mercado? ¿En qué se diferencia nuestra propuesta?*
Sí existen apps de mascotas perdidas en Argentina (adoptar.com.ar, MyPets, RescatApp, y hasta una oficial del Gobierno de CABA), pero todas resuelven reencuentro dueño-mascota. Ninguna pone el foco en la verificación anti-fraude ni en la trazabilidad de donaciones para casos de animales sin dueño — ese es el diferencial de esta propuesta.

\---

### Funcionalidades del sistema (MVP)

* **Publicaciones de casos (sin registro):** formulario con tipo de animal, descripción, foto(s), ubicación dentro de CABA, nivel de urgencia, tipo de ayuda necesaria (ej.: atención veterinaria, traslado, alimento) y contacto del publicante. El caso queda en estado "pendiente" y no es visible hasta ser revisado.
* **Cola de moderación:** pantalla accesible solo con login de moderador, que lista los casos pendientes ordenables por fecha o urgencia. Permite aprobar, rechazar o marcar "en revisión", y priorizar un caso como "urgencia crítica".
* **Listado y mapa público:** muestra únicamente los casos aprobados, filtrables por zona, urgencia y tipo de ayuda necesaria.
* **Directorio de veterinarias y rescatistas:** cargado por el equipo con datos reales de CABA para la demo, filtrable por zona. No autogestionado por el público en esta versión.
* **Registro de donaciones por caso:** monto objetivo opcional cargado por el moderador, con el alias de donación visible y el monto recaudado actualizado manualmente. No incluye pasarela de pago real integrada en el MVP.
* **Compartir en redes:** genera un enlace directo al caso dentro del portal, con metadatos para que se vea bien al compartirlo en Instagram, Facebook, WhatsApp, Tiktok o X.

### Alcance y no alcance del proyecto

**Alcance (MVP):** publicación de casos sin registro, moderación con aprobación/rechazo, listado y mapa público filtrable, directorio de veterinarias/rescatistas por zona cargado por el equipo, registro manual de donaciones por caso, enlace compartible en redes.

**Fuera de alcance de esta versión:** integración de pasarela de pago real (Mercado Pago), app móvil nativa, verificación automática por IA, autogestión del directorio por veterinarias/rescatistas, sistema de ranking/perfil de confianza para adoptantes.

### Requerimientos funcionales

* **RF01:** cualquier usuario puede publicar un caso sin registrarse, completando el formulario obligatorio.
* **RF02:** un caso publicado no es visible públicamente hasta ser aprobado por un moderador.
* **RF03:** un moderador autenticado puede aprobar, rechazar o marcar "en revisión" un caso.
* **RF04:** un moderador puede marcar un caso como "urgencia crítica" para priorizar su revisión.
* **RF05:** el sistema muestra un listado público filtrable por zona, urgencia y tipo de ayuda, solo con casos aprobados.
* **RF06:** el sistema muestra un directorio de veterinarias 24hs y rescatistas filtrables por zona.
* **RF07:** el sistema permite asociar y actualizar manualmente un monto objetivo/recaudado a cada caso aprobado, diferenciando el tipo de ayuda solicitada (ej. traslado o atención veterinaria) cuando corresponda.
* **RF08:** el sistema genera un enlace compartible por caso, con metadatos visibles en redes sociales.
* **RF09:** un administrador puede dar de alta usuarios con rol moderador.

### Requerimientos no funcionales

* **RNF01 (usabilidad):** el formulario de publicación debe poder completarse desde un celular en pocos minutos, porque muchos casos se reportan desde la calle.
* **RNF02 (seguridad):** solo usuarios con el rol de moderador/administrador acceden al panel de moderación.
* **RNF03 (disponibilidad):** el sistema corre en Railway, aceptando como riesgo conocido la posibilidad de que el servicio "duerma" por inactividad.
* **RNF04 (escalabilidad):** el modelo de datos debe permitir sumar zonas más allá de CABA sin rediseño.
* **RNF05 (mantenibilidad):** el código se organiza por módulos (casos, moderación, directorio, donaciones) para facilitar el trabajo en equipo.

\---

### Actividad 2: Definición del stack tecnológico

#### 1\. Stack por capa

|Capa|Tecnología|
|-|-|
|Frontend|HTML/CSS/JavaScript (vanilla)|
|Backend|NestJS (Node.js/TypeScript)|
|Base de datos|MySQL|
|Despliegue|Railway|

**Repositorio del proyecto:** https://github.com/kguardia/TIF-Grupo159-GUARDIA-ORTELLADO.git

#### 2\. ¿Por qué este stack y no otro?

Porque el equipo actualmente cuenta con experiencia con éstas tecnologías (JS/TS, MySQL Workbench), y el proyecto no presenta ningún requisito técnico que exija salir de ese conocimiento. Elegir tecnología nueva sin necesidad real generaría una competencia entre el tiempo de aprendizaje y el tiempo de desarrollo — justo el riesgo que señala el documento para contextos con fechas de entrega pactadas. Railway, además, resuelve backend + base de datos con configuración mínima, lo cual reduce la complejidad operativa que un equipo estudiantil no necesita asumir en esta etapa.

#### 3\. ¿Escala adecuadamente?

Sí, para el escenario real del proyecto: arranque en CABA, uso académico/piloto, sin miles de usuarios concurrentes. Una arquitectura monolítica (un backend NestJS + una base MySQL) es apropiada — montar algo más complejo sería sobreingeniería, tal como advierte el documento con el ejemplo de microservicios para un negocio familiar. Si el proyecto creciera fuerte (adopción real, más zonas, más tráfico), el camino de escalamiento existe sin rehacer el stack: separar lectura/escritura, agregar caché, o migrar de Railway a un proveedor con más control — pero no es una necesidad actual.

#### 4\. Riesgos y limitaciones

* **Búsqueda geográfica limitada:** con un campo zona simple no hay verdadera proximidad geoespacial. Es una limitación aceptada a cambio de simplicidad — vale la pena dejarla explícita en la justificación para que no parezca una omisión sino una decisión consciente.
* **Railway:** tiene límites de horas/recursos y puede "dormir" el servicio en inactividad. Para una demo de comité no es un problema, pero conviene mencionarlo como riesgo conocido en la entrega.
* **Pasarela de pagos:** el módulo de donaciones va a requerir integrar algo como Mercado Pago. No afecta la elección de stack, pero sí es un riesgo de alcance/tiempo que conviene planificar aparte (sandbox de pruebas, manejo de webhooks).
* **Concentración de responsabilidad en el backend:** al no usar un framework de frontend, toda la lógica de estado (ej. qué ve un moderador vs. un usuario público) recae en JS plano — manejable en este alcance, pero exige disciplina para no desordenar el código a medida que crecen las pantallas.

\---

### Actividad 3: Refinamiento de propuesta y análisis de viabilidad asistida por IA

Para esta actividad utilizamos Claude como IA para el refinamiento de la propuesta y el análisis de viabilidad del proyecto.

#### 1\. Refinamiento de la idea y propuesta de valor

Prompting de rol (poniéndome en el lugar de alguien con experiencia en tech para el sector de bienestar animal): la idea tiene una propuesta de valor clara — la moderación previa como filtro anti-estafa — pero hay puntos ciegos que conviene resolver antes de la entrega:

* **Punto de dolor no visible:** un solo moderador (o un equipo chico) se vuelve cuello de botella si el volumen de casos crece. ¿Qué pasa con un caso urgente (animal atropellado) mientras espera aprobación? Vale la pena definir un SLA de moderación o una categoría de "urgencia crítica" con revisión prioritaria.
* **Otro punto ciego:** el directorio de veterinarias/rescatistas se desactualiza rápido si no hay proceso de mantenimiento (teléfonos que cambian, gente que deja de responder). Es un problema operativo, no técnico.
* **Riesgo en donaciones:** "transparente por caso" es una promesa fuerte — si prometés trazabilidad y no la cumplís totalmente en el MVP, el diferenciador se vuelve vulnerabilidad.

El detalle del MVP propuesto ya quedó reflejado en [Alcance y no alcance del proyecto](#alcance-y-no-alcance-del-proyecto).

#### 2\. Análisis de competencia y diferenciación

Se relevó el panorama real en Argentina/CABA para no partir de supuestos:

|Plataforma|Enfoque|Moderación previa|Casos de urgencia (no solo perdido/encontrado)|Donación transparente por caso|Directorio por zona|
|-|-|-|-|-|-|
|Animales BA (GCBA)|Oficial, reporta mascotas perdidas/encontradas y servicios de bienestar animal por barrio; herramienta gratuita del gobierno porteño|No aplica (no es "caso de ayuda")|No|No|Sí (barrio)|
|DogGo|App estudiantil de búsqueda/rescate con mapa, ubicación de veterinarias y listado de ONGs|No|Parcial|No|Sí|
|My Pets|App nacional de mascotas perdidas/encontradas con geolocalización; conecta con veterinarias, pet shops, refugios y sitios pet friendly|No|No|No|Sí|
|Justicia Animal|Denuncias de maltrato + tablero de perdidos/encontrados, con matching por IA de fotos y ubicación; espacio de adopción responsable|No (denuncia directa)|Sí (maltrato)|No|No|
|Coral / WhyDonate|Crowdfunding para refugios, con causas por caso y trazabilidad de a qué se destina el aporte|No aplica|No|Sí, pero sin el resto del ecosistema (casos + directorio)|No|
|Rescate Mascotero|Directorio informal de rescatistas por zona en CABA|No|No|No|Sí, pero sin publicación de casos|

**Diferenciador validado:** ningún competidor combina las tres cosas que propone este proyecto (moderación previa + casos urgentes geolocalizados + donación trazable por caso). Los oficiales (Animales BA) tienen confianza pero alcance angosto (solo perdido/encontrado). Los informales (grupos de Instagram, Rescate Mascotero) tienen alcance amplio pero cero verificación — que es exactamente el riesgo de estafa que esta propuesta ataca.

**Simulación de escenarios:** si el GCBA ampliara Animales BA a casos de urgencia con verificación, la ventaja defendible no sería la funcionalidad (fácil de copiar) sino la red construida de rescatistas/veterinarias verificados — eso es lo que un organismo público tarda más en construir.

#### 3\. Plan de trabajo

**Objetivo general:** Desarrollar un portal web que permita publicar, moderar y visualizar casos de animales en situación de calle en CABA, con un directorio de veterinarias/rescatistas por zona y un sistema de donaciones trazables por caso.

**Objetivos específicos:**

* Implementar un flujo de publicación de casos con aprobación previa de moderador.
* Implementar un directorio consultable de veterinarias 24hs y rescatistas por zona.
* Implementar un registro de donaciones asociado a cada caso, con monto objetivo/recaudado visible.

**Entregables por etapa:**

|Etapa|Semanas|Entregable|
|-|-|-|
|1|1-2|Modelo de datos (MySQL) + repo estructurado + entorno configurado en Railway|
|2|3-5|API NestJS: CRUD de casos + autenticación y roles (público/moderador/admin)|
|3|6-7|Flujo de moderación + directorio de veterinarias/rescatistas|
|4|8-9|Frontend conectado a la API (listado, mapa, panel de moderación)|
|5|10|Registro de donaciones por caso + pruebas integrales|
|6|11-12|Ajustes, documentación final y demo|

**Riesgos y mitigaciones:**

* **Cuello de botella de moderación:** mitigar definiendo un SLA (ej. revisión en menos de 24hs) y más de un usuario con rol moderador.
* **Directorio desactualizado o vacío al inicio:** mitigar arrancando con datos de ejemplo cargados por el equipo para la demo, y dejando la carga real como tarea post-MVP.
* **Subestimar el módulo de donaciones:** mitigar dejando explícitamente fuera de alcance la pasarela de pago real en esta versión.

**Criterios de éxito del MVP:** un caso puede publicarse, ser aprobado por un moderador, aparecer públicamente con su ubicación, y recibir una donación registrada — de punta a punta, con datos de prueba.

#### 4\. Viabilidad

* **Técnica:** alta. El stack (NestJS, MySQL, JS vanilla, Railway) ya es conocido por el equipo, lo que reduce el riesgo de bloqueo por curva de aprendizaje.
* **Operativa:** media. El mayor riesgo no es técnico sino de contenido: conseguir veterinarias/rescatistas reales que quieran figurar en el directorio lleva tiempo que excede el plazo académico. Recomendación: arrancar con datos de ejemplo y dejar la carga real como tarea de adopción posterior al TFI.
* **Temporal:** viable para esta entrega (documento + repo en 2 días es alcanzable para 2-3 personas). Para el desarrollo completo, el cronograma de 12 semanas planteado es razonable siempre que se respete el "no alcance" definido — si se intenta meter la pasarela de pago real dentro del mismo plazo, el riesgo de incumplir sube bastante.

