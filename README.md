# Repuestos

App mobile para el control de repuestos del servicio tecnico: stock, busqueda y
—lo principal— la **lista de repuestos a comprar** para ir al proveedor con todo anotado.

Next.js 15 + Tailwind. Se despliega en Vercel sin configuracion.

## Las 3 pantallas

| Pestaña | Para que sirve |
| --- | --- |
| **A comprar** | Anotas lo que falta (ej: "Modulo A25") en 2 toques. Avisa si ya hay stock de eso. Boton para compartir la lista por WhatsApp. Lo que marcas como comprado se pasa al stock de una vez. |
| **Stock** | Buscador y filtro por categoria. Sumas o restas unidades con +/-. Tocando el repuesto podes editarlo, borrarlo o mandarlo a la lista de compra. |
| **Agregar** | Alta de repuesto: nombre, categoria, cantidad y precio opcional. Si ya existe, suma al existente en vez de duplicarlo. |

## Tema claro y oscuro

Arranca con el tema del celular. Con el boton de sol/luna del encabezado lo cambias a mano
y esa eleccion queda guardada en ese dispositivo.

## Donde se guardan los datos

- **Sin configurar nada**: en el propio telefono (`localStorage`). Funciona al instante,
  pero cada dispositivo tiene su propia lista.
- **Con una base de datos Postgres** (variable `DATABASE_URL`): los datos quedan en la nube
  y se comparten entre todos los dispositivos. Las tablas se crean solas la primera vez.

La app muestra en que modo esta con la etiqueta de arriba a la derecha: "Este equipo" o "Nube".

## Deploy en Vercel

### Opcion A — desde la terminal (lo mas rapido)

```bash
cd repuestos && npx vercel --prod
```

La primera vez pide iniciar sesion y confirmar el proyecto (aceptar todo con Enter).
Al terminar imprime la URL publica.

### Opcion B — desde GitHub

1. Subir el repositorio a GitHub.
2. En [vercel.com/new](https://vercel.com/new), importar el repo.
3. En **Root Directory** elegir `repuestos`.
4. Deploy. Cada `git push` vuelve a desplegar solo.

### Base de datos compartida (opcional, recomendado si son varios)

1. En el proyecto de Vercel: pestaña **Storage** → **Create Database** → **Neon (Postgres)**.
2. Vercel agrega solo la variable `DATABASE_URL` al proyecto.
3. **Redeploy** (pestaña Deployments → ... → Redeploy).

Listo: la app pasa a modo "Nube" y crea las tablas en el primer uso.

### Instalarla en el telefono (PWA)

- **Android / Chrome**: al abrir la URL aparece un aviso "Instalar en el telefono" con el boton
  **Instalar**. Tambien sale solo el cartel del navegador.
- **iPhone / Safari**: boton **Compartir** → **Agregar a inicio**.

Queda como una app: icono propio, pantalla completa sin barra del navegador y abre aunque
no haya señal (el service worker guarda las pantallas; el stock y la lista siempre se piden frescos).

Los iconos se generan con `node scripts/make-icons.mjs` a partir del dibujo de `public/icon.svg`.

## Desarrollo local

```bash
cd repuestos && npm install && npm run dev
```

Abre en http://localhost:3000. Sin `DATABASE_URL` arranca en modo local.
Para probar contra Postgres, crear un archivo `.env.local` con `DATABASE_URL=...`.
