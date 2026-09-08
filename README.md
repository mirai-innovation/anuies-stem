# Reto ANUIES4MX 2026 · Mujeres en STEM

Plataforma de postulación y evaluación de la convocatoria **Negocios del Futuro con Tecnologías Emergentes**, organizada por ANUIES y Mirai Innovation Research Institute. Programa intensivo de cinco días en el Centro de Capacitación ANUIES de Valle de Bravo (13–18 dic 2026) que cierra con Demo Day.

La interfaz es una implementación fiel del diseño aprobado en [`design/Plataforma ANUIES4MX.dc.html`](design/), que se conserva en el repositorio como referencia.

---

## Stack

| Pieza | Elección |
|---|---|
| App | Next.js 15 (App Router), React 19, TypeScript |
| Estilos | Tailwind CSS 4 con los tokens del diseño en `src/app/globals.css` |
| Base de datos | MongoDB Atlas + Prisma |
| Sesión | Auth.js v5, credenciales, cookie httpOnly, `argon2id` |
| Archivos | AWS S3 con POST y GET firmados |
| IA | API de OpenAI (`gpt-4o-mini` por defecto) |
| Correo | SMTP de Gmail vía nodemailer |

## Cómo correrlo

Requisitos: Node 20 o superior.

```bash
npm install
cp .env.example .env    # y llena los valores
npm run db:push         # aplica el esquema a MongoDB
npm run db:seed         # datos de prueba
npm run dev
```

Abre <http://localhost:3000>.

### Credenciales de prueba

| Rol | Correo | Contraseña |
|---|---|---|
| Administración | `admin@anuies4mx.test` | `Admin2026!` |
| ANUIES (solo lectura) | `anuies@anuies4mx.test` | `Anuies2026!` |
| Aplicante (enviada) | `aplicante@anuies4mx.test` | `Aplicante2026!` |
| Aplicante (borrador) | `alejandra.miranda@anuies4mx.test` | `Aplicante2026!` |

Todas las cuentas del seed usan el dominio **`.test`**, reservado por RFC 2606 y que ningún servidor de correo resuelve. Es deliberado: probar el envío masivo de resultados con direcciones en dominios institucionales reales mandaría correo a buzones de personas ajenas al proyecto. El correo institucional realista de cada aplicante se conserva en su ficha, que es donde se muestra.

### Sin MongoDB a la mano

`npm run db:local` levanta un replica set efímero en `localhost:27017` y escribe la cadena de conexión en pantalla. Sirve para desarrollar sin Atlas; los datos viven en `.mongo-local/`.

## Variables de entorno

```
DATABASE_URL           Cadena de conexión de MongoDB
AUTH_SECRET            openssl rand -base64 32
AUTH_URL               URL pública de la app
EDICION                Clave de la edición (2026)

AWS_REGION             Región del bucket
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
AWS_BUCKET_NAME
S3_PREFIJO             Prefijo dentro del bucket
S3_URL_MINUTOS         Vigencia de las URLs de lectura (5)

OPENAI_API_KEY
OPENAI_MODELO          gpt-4o-mini
TRANSCRIPCION_ACTIVA   0 | 1 (ver «Transcripción del video»)

EMAIL_USER             Cuenta SMTP de Gmail
EMAIL_PASS             Contraseña de aplicación
CORREO_REMITENTE       "Reto ANUIES4MX <...>"
FRONTEND_URL           Base para los enlaces de los correos
```

### CORS del bucket

El navegador sube directo a S3, así que el bucket necesita permitir `POST` desde el origen de la app:

```json
[{
  "AllowedOrigins": ["https://tu-dominio.vercel.app", "http://localhost:3000"],
  "AllowedMethods": ["GET", "POST", "PUT", "HEAD"],
  "AllowedHeaders": ["*"],
  "ExposeHeaders": ["ETag"]
}]
```

## Las vistas

| Ruta | Rol | Qué hace |
|---|---|---|
| `/login` | — | Acceso; el rol de la cuenta define a dónde entra |
| `/registro` | — | Alta de aplicante con verificación de correo |
| `/dashboard` | aplicante | Avance, cronología, siguiente acción |
| `/aplicacion/datos` | aplicante | Paso 1, con autoguardado |
| `/aplicacion/videos` | aplicante | Paso 2, propuesta subida y presentación grabada |
| `/aplicacion/revision` | aplicante | Paso 3, checklist y envío |
| `/resultado` | aplicante | Dictamen, puntaje por criterio, retroalimentación |
| `/confirmacion` | aplicante | Confirmar o declinar el lugar |
| `/expediente` | aplicante | Etapa final, bloqueada hasta la publicación de resultados |
| `/aplicaciones` | ANUIES | Lista con filtros, paginación y CSV |
| `/aplicaciones/:id` | ANUIES | Detalle completo, sin IA ni captura |
| `/admin` | admin | KPIs, avance, ejecutar IA, publicar resultados |
| `/admin/aplicaciones` | admin | Lista con columna de score IA |
| `/admin/aplicaciones/:id` | admin | Detalle, panel de IA y captura de evaluación |
| `/admin/equipos` | admin | Equipos del Demo Day |
| `/admin/usuarios` | admin | Cuentas y roles |

## Cómo se postula

La postulación son **tres pasos**: datos, videos y envío. No se piden documentos para postular.

Los **cinco documentos oficiales se integran después**, en `/expediente`, y solo los entregan las aplicantes que recibieron dictamen favorable. La etapa aparece bloqueada en el tablero desde el principio —con la lista a la vista, para que nadie se lleve una sorpresa— y se habilita al publicar resultados. Pedir cinco constancias por adelantado a cientos de estudiantes, cuando la mayoría no será seleccionada, carga de trámites a quienes no los van a necesitar y a las áreas escolares que los emiten.

Los dos videos son obligatorios y evalúan cosas distintas, así que se piden en este orden:

1. **Presentación** (hasta 60 s): quién es, qué estudia y por qué quiere participar. **No es sobre la propuesta**: aquí se evalúa la motivación. Se graba en el momento con la cámara; va primero porque es el más fácil de hacer y rompe el hielo antes del que sí se califica a fondo.
2. **Propuesta** (hasta 90 s): la idea de negocio, con los componentes que pide la convocatoria. Admite las dos vías —grabar con la cámara o subir un archivo— porque hay quien quiere editarlo con apoyos visuales y quien prefiere resolverlo frente a la cámara; obligar a una sola forma penalizaría a alguien por algo que no tiene que ver con la calidad de su idea.

Cada video muestra en pantalla, punto por punto, qué debe incluir. Una sola línea de ayuda no alcanza para explicarlo, y de eso depende que el video sirva para evaluar.

**La tecnología emergente no se le pregunta a la aplicante.** La clasifica la evaluación por IA a partir de la propuesta escrita, entre las cinco de la convocatoria. Se hace así porque de ese dato dependen el filtro de la lista, el conteo del panel y la sugerencia de equipos del Demo Day: quitarlo del formulario sin más habría dejado esas tres cosas vacías.

## Decisiones que conviene conocer

**Las fechas viven en la base, no en el código.** El cierre de recepción, la publicación de resultados y la ventana de confirmación son campos de la colección `Edicion`. Sin esto no habría forma de probar los estados «post-cierre» o «resultados publicados» sin mover el reloj del servidor, y *Publicar resultados* sería un despliegue en vez de un cambio de dato auditable.

**El rol se relee en cada petición.** La sesión es un JWT, así que el rol viaja firmado dentro del token. Si se confiara en él, un cambio de rol —o dar de baja una cuenta— no surtiría efecto hasta que el token expirara. `sesionActual()` consulta la base y manda el rol vigente.

**Los archivos se suben con POST firmado, no con PUT firmado.** Se probaron ambos: una URL `PUT` firmada acepta cualquier `Content-Type` y cualquier tamaño, porque esos valores no forman parte de la firma; una URL emitida para «un PDF de 10 MB» servía igual para depositar un ejecutable de un giga. El POST firmado lleva condiciones de política (`content-length-range` y `eq $Content-Type`) que S3 evalúa **antes** de aceptar los bytes. Además, el servidor vuelve a verificar el objeto ya subido y lo borra si no cumple.

**La duración del video subido se lee del archivo.** El navegador informa la duración, pero el límite de 90 segundos es una regla de la convocatoria: si solo se validara en el cliente, bastaría con editar la petición. `src/lib/video.ts` recorre los átomos del contenedor MP4/MOV por rangos —sin descargar los 500 MB— y lee `mvhd`. Se contrastó contra `ffprobe`: 47.42 s → 48 y 876.18 s → 876. Se trunca en lugar de redondear, lo que concede una tolerancia de hasta un segundo, porque un video «de 90 segundos» suele medir 90.03 por el borde de cuadro.

**La del video grabado es la excepción, y conviene saberlo.** `MediaRecorder` produce un WebM «en vivo» sin duración en la cabecera: no hay nada que leer en el servidor. Para ese video se acepta la cifra que reporta el navegador, que además detiene la grabación por su cuenta al llegar a 60 s. El tipo y el peso sí quedan impuestos por la política del POST firmado —se verificó que un WebM contra una firma de MP4 recibe 403— y se vuelven a comprobar sobre el objeto ya subido. Es una garantía más débil que la del video de propuesta, y es proporcionada: el de presentación es recomendado y no se califica.

**Las verificaciones de requisitos las calcula el código, no el modelo.** El modelo solo emite juicio: resumen y puntaje por criterio con justificación. Las verificaciones son hechos comprobables contra la base, y pedirle a un modelo que los «verifique» produciría afirmaciones seguras sobre cosas que no puede consultar. La única que no se puede automatizar —contrastar el promedio declarado contra el PDF de la relación de estudios— aparece marcada como pendiente de revisión humana en vez de darse por buena.

**El score de IA nunca sustituye al humano.** No entra en el cálculo del puntaje del comité y no es visible para los roles `applicant` ni `anuies`; para ANUIES ni siquiera se consulta.

**La CURP no se exporta en el CSV.** Un CSV se reenvía por correo y termina en carpetas compartidas. El dato sigue disponible en el detalle, que exige sesión.

**La sugerencia de equipos es determinista.** El diseño rotula ese botón como «con IA», pero lo que hace —y lo que pide el brief— es una agrupación automática: junta por tecnología emergente y reparte universidades para que un equipo no salga entero de la misma institución. Es reproducible y el administrador puede explicar por qué quedó así.

## Transcripción del video

La evaluación por IA usa la transcripción del video de propuesta cuando está disponible. El endpoint de audio de OpenAI topa en 25 MB y los videos llegan a 500, así que hace falta extraer la pista de audio, y en una función serverless no hay `ffmpeg`.

Con `TRANSCRIPCION_ACTIVA=0` (valor por defecto) la IA evalúa sobre la propuesta escrita y los metadatos, y lo **declara** en la justificación del criterio de video en vez de inventar una observación. Para activarla hace falta añadir el trabajo de extracción (Vercel Sandbox con `ffmpeg`, o un worker aparte) que llene `Video.transcripcion`.

## Modelo de datos

Criterio: lo que es propiedad exclusiva de una aplicación y está acotado en número (5 documentos, 2 videos, 1 confirmación) va **embebido**; lo que el panel consulta cruzando aplicaciones vive en su propia colección.

```
Edicion         fechas y parámetros de la convocatoria (un registro)
Universidad     catálogo ANUIES
User            cuentas y rol
Token           verificación de correo y recuperación (se guarda el hash)
Application     postulación · embebe datos, académicos, propuesta,
                documentos[], videos[], confirmación
Evaluation      evaluación humana · única por (aplicación, evaluador)
AiEvaluation    evaluación por IA · una por aplicación, solo admin
Team            equipos del Demo Day
AuditLog        bitácora
Contador        folios consecutivos
```

MongoDB no tiene migraciones: el esquema se aplica con `npm run db:push`, que también crea los índices —incluido el único `(applicationId, evaluatorId)`, que es lo que impone en la base la regla de una evaluación por evaluador.

## Comandos

```bash
npm run dev        # desarrollo
npm run build      # compilación de producción
npm run typecheck  # tsc --noEmit
npm run db:push    # aplica el esquema
npm run db:seed    # datos de prueba (borra y vuelve a sembrar)
npm run db:local   # MongoDB efímero para desarrollo sin Atlas
```

## Pendientes conocidos

- Los documentos y videos del seed apuntan a objetos que no existen en S3; las rutas de archivo devuelven un 404 explicativo en vez del XML de error de AWS.
- La grabación con cámara exige HTTPS o `localhost`; los navegadores no dan acceso a la cámara en conexiones sin cifrar. En Vercel esto no es problema.
- El trabajo de transcripción está diseñado pero no implementado (ver arriba).
- El recordatorio de confirmación existe como plantilla; falta el disparador programado que lo envíe durante la ventana del 24 al 30 de noviembre.

---

## Despliegue en Vercel

El repositorio es `rafaelhernandezrios/anuies-stem`.

1. En <https://vercel.com/new>, importa el repositorio. Next.js se detecta solo; no hace falta tocar los comandos de compilación.
2. Carga las variables de entorno de la sección anterior en **Settings → Environment Variables**, para *Production*, *Preview* y *Development*.
   - `AUTH_SECRET`: genera uno nuevo con `openssl rand -base64 32`. **No reutilices el de desarrollo.**
   - `AUTH_URL` y `FRONTEND_URL`: la URL del despliegue, por ejemplo `https://anuies-stem.vercel.app`. Si importaste por error el archivo de entorno de desarrollo, estas dos quedan apuntando a `localhost` y los enlaces de los correos no llevan a ninguna parte. La app se defiende —en Vercel ignora un `FRONTEND_URL` local y usa el dominio del despliegue— pero conviene dejarlas bien puestas, sobre todo si más adelante hay dominio propio.
3. Despliega. El `build` corre `prisma generate` antes que `next build`, así que el cliente de Prisma se genera en Vercel sin pasos extra.
4. **Añade el dominio de Vercel al CORS del bucket de S3** (ver arriba). Sin esto, las subidas fallan en producción aunque funcionen en local.
5. En MongoDB Atlas, **Network Access**: las funciones de Vercel salen por IPs que cambian, así que hay que permitir `0.0.0.0/0` o contratar direcciones fijas. Es la parte más fácil de olvidar.
6. Con la app ya desplegada, siembra la base una vez desde tu equipo apuntando `DATABASE_URL` a la base de producción:

   ```bash
   npm run db:push && npm run db:seed
   ```

   `db:seed` **borra todas las colecciones** antes de sembrar. Contra producción, córrelo solo la primera vez.

### Antes de abrirlo a las aplicantes

- Cambia las claves de AWS, OpenAI y la contraseña de aplicación de Gmail por unas nuevas, con permisos acotados a este proyecto.
- Da a las credenciales de AWS acceso únicamente al prefijo `anuies-stem/` del bucket, no al bucket completo.
- Considera mover el bucket a una región cercana a México (`us-east-1` o `mx-central-1`). Con el bucket en Sídney, una aplicante en Guadalajara manda 500 MB al otro lado del Pacífico.
- Borra las cuentas del seed: son de prueba y su contraseña está en este archivo.
