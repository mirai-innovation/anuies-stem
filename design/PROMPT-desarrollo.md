# Prompt para implementar la plataforma ANUIES4MX Mujeres en STEM

Copia todo lo que sigue y mándalo a la IA que programará la funcionalidad. Adjunta también el archivo `Plataforma ANUIES4MX.dc.html` (el diseño aprobado).

---

## Contexto

Necesito implementar la funcionalidad de una plataforma web para la convocatoria **Reto ANUIES4MX 2026 — Mujeres en STEM: Negocios del Futuro con Tecnologías Emergentes**, organizada por ANUIES y Mirai Innovation Research Institute. El programa es un intensivo presencial de 5 días en el Centro de Capacitación ANUIES de Valle de Bravo (13–18 dic 2026) que cierra con un Demo Day.

El diseño de todas las vistas ya está hecho y aprobado en el archivo adjunto. **Respeta el diseño tal cual**: paleta (rosa `#D6336C`, rosa oscuro `#8A1F49`, rosa suave `#FBE1EC`, teal `#2F7A78`, teal suave `#DCEEEC`, tinta `#26212E`, gris `#736C7B`, líneas `#EEE3EA` / `#E2CDDA`, fondo `#FBF5F8`), tipografías (Big Shoulders Display para títulos, IBM Plex Sans para texto, IBM Plex Mono para etiquetas y datos), esquinas rectas sin border-radius, bordes de 1px y etiquetas en mayúsculas con letter-spacing. No rediseñes: solo conviértelo en una app funcional.

## Alcance

App web responsive (escritorio y móvil) con autenticación, 3 roles y flujo completo de postulación y evaluación. Datos en español (México), zona horaria CST.

## Roles y permisos

**1. `applicant` (aplicante)**
- Registro y login propio.
- Llena su aplicación en un wizard de 4 pasos con guardado parcial (autoguardado) y puede volver hasta el cierre.
- Sube documentos (PDF) y videos (archivo, no link).
- Ve el estado de su aplicación en un timeline.
- Después de la publicación de resultados: ve su dictamen, el puntaje final por criterio y la retroalimentación del comité.
- Si fue seleccionada: confirma o declina su participación y llena datos logísticos.
- No ve nada de otras aplicantes ni la evaluación por IA.

**2. `anuies` (solo lectura)**
- Lista de aplicaciones con búsqueda, filtros (estado, universidad, tecnología) y paginación; exportar CSV.
- Detalle completo de cada aplicación: datos, documentos, video, propuesta escrita.
- Ve las calificaciones y comentarios de los evaluadores del comité y el promedio.
- **No** ve la evaluación por IA. **No** puede calificar ni cambiar dictámenes.

**3. `admin`**
- Todo lo de `anuies`, más:
- Panel general con KPIs y avance de evaluación; acciones para ejecutar la evaluación IA pendiente y publicar resultados.
- Columna de score IA en la tabla de aplicaciones.
- En el detalle: panel de evaluación por IA (resumen automático de la propuesta, score por criterio con justificación, verificación de requisitos).
- Captura su propia evaluación: 5 criterios en escala 1–5, comentario para la aplicante y dictamen (Seleccionada / Lista de espera / No seleccionada).
- Gestión de equipos para el Demo Day (crear equipos, asignar integrantes, sugerencia automática).
- Gestión de usuarios y roles.

## Vistas a implementar (una por una en el diseño adjunto)

Acceso: `/login`, `/registro`.
Aplicante: `/dashboard`, `/aplicacion/datos`, `/aplicacion/documentos`, `/aplicacion/videos`, `/aplicacion/revision`, `/resultado`, `/confirmacion`.
ANUIES: `/aplicaciones`, `/aplicaciones/:id`.
Admin: `/admin`, `/admin/aplicaciones`, `/admin/aplicaciones/:id` (evaluar), `/admin/equipos`.

## Modelo de datos

**User**: id, nombre, email institucional, password_hash, rol (`applicant` | `anuies` | `admin`), created_at, email_verified_at.

**Application** (1 por aplicante): id, folio (`A4MX-2026-NNNN`, autogenerado), user_id, estado (`draft` | `submitted` | `in_review` | `evaluated` | `selected` | `waitlist` | `rejected`), submitted_at, updated_at.
- Datos personales: nombre completo, CURP, fecha de nacimiento, teléfono, estado de residencia, correo institucional.
- Académicos: universidad ANUIES (catálogo), programa educativo, nivel (licenciatura / especialidad / posgrado), semestre actual, promedio global acumulado, área STEM, declaración de "no cursar último año".
- Propuesta: nombre, tecnología emergente principal (IA, VR/AR, Robótica, Blockchain y Web3, Cómputo en la Nube), problema u oportunidad (máx. 800 car.), impacto social esperado (máx. 800 car.).

**Document**: id, application_id, tipo (`constancia_inscripcion`, `relacion_estudios`, `carta_compromiso`, `carta_respaldo`, `cv`), archivo (PDF, máx. 10 MB), nombre original, tamaño, uploaded_at. Los 5 tipos son obligatorios para enviar.

**Video**: id, application_id, tipo (`propuesta` obligatorio, `presentacion` recomendado), archivo (MP4/MOV, máx. 500 MB), duración en segundos, resumen opcional. **El video de propuesta no puede exceder 90 segundos**; el de presentación 60. Valida la duración al subir y rechaza si excede. Subida con barra de progreso y reemplazo.

**Evaluation** (evaluación humana; varias por aplicación): id, application_id, evaluator_id, scores por criterio (1–5 enteros), promedio calculado, comentario para la aplicante, dictamen, created_at. Un evaluador = una evaluación por aplicación (editable hasta publicar resultados).

**AiEvaluation** (1 por aplicación, solo visible a admin): id, application_id, resumen automático, scores por criterio (decimal 1–5) con justificación en texto, score global, verificaciones de requisitos (lista de `{label, ok}`: promedio coincide con relación de estudios, constancia vigente de universidad ANUIES, no cursa último año, documentos faltantes), generated_at.

**Team**: id, nombre, tecnología, application_ids (integrantes), created_at.

Los 5 criterios de evaluación son fijos y en este orden:
1. Claridad de la idea de negocio
2. Innovación y relevancia tecnológica
3. Impacto social
4. Viabilidad técnica y económica
5. Presentación del video

## Reglas de negocio

- **Elegibilidad**: nivel superior; promedio global acumulado mínimo **9.0**; **no** se aceptan estudiantes del último año de su programa; la institución debe estar en el catálogo ANUIES.
- **Cierre de recepción: 15 nov 2026, 23:59 CST.** Después de esa fecha bloquea la creación y edición de aplicaciones (estado `draft` queda no enviado).
- Enviar requiere: los 5 documentos, el video de propuesta dentro de los 90 s, todos los campos obligatorios y las dos declaraciones firmadas. Muestra el checklist con lo que falta.
- Una vez enviada la aplicación queda inmutable para la aplicante.
- Los resultados no son visibles hasta que el admin ejecuta "Publicar resultados" (23 nov 2026). Antes de eso, la vista de resultado muestra "en evaluación".
- La confirmación de participación está abierta del 24 al 30 nov 2026 y solo para dictamen `selected`.
- El puntaje final del comité es el promedio de las evaluaciones humanas; el score IA es informativo y nunca sustituye al humano.
- Autoguardado del wizard cada 30 s y al cambiar de paso; muestra "Guardado automático · hace X min".

## Evaluación por IA

Al enviar una aplicación (o por lote desde el panel admin), genera la `AiEvaluation`:
- Toma los textos de la propuesta, los metadatos académicos y la transcripción del video de propuesta.
- Produce: resumen de 2–3 líneas, score 1–5 por cada uno de los 5 criterios con una justificación de una o dos frases, score global y la verificación de requisitos.
- Guarda el modelo y la fecha usados. Reintenta en caso de fallo y marca el estado `pending` en el panel.
- Nunca expongas este objeto a los roles `applicant` ni `anuies`.

## Requisitos técnicos

- Stack de tu preferencia; propón uno y explícalo brevemente antes de empezar. Autenticación con sesiones seguras, hash de contraseñas, verificación de correo, recuperación de contraseña.
- Almacenamiento de archivos con URLs firmadas de tiempo limitado; nada público.
- Autorización server-side por rol en cada endpoint, no solo en la UI.
- Validación en cliente y servidor; mensajes de error en español, junto al campo.
- Notificaciones por correo: registro, aplicación enviada, publicación de resultados, recordatorio de confirmación.
- Bitácora de auditoría para evaluaciones, cambios de dictamen y publicación de resultados.
- Estados vacíos, de carga y de error para cada vista.
- Accesible: contraste mínimo 4.5:1, foco visible, formularios con `label`, navegable por teclado.
- Datos personales tratados conforme al aviso de privacidad; no expongas CURP ni documentos a roles sin permiso.

## Entrega

1. Propuesta de stack y esquema de base de datos.
2. Migraciones + seed con datos de prueba (usa los datos de muestra del diseño adjunto).
3. Implementación de las 14 vistas con la funcionalidad descrita, fieles al diseño.
4. README con cómo correr el proyecto y las credenciales de prueba de los 3 roles.
