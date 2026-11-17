# Kylobyte

App mobile para el local: **vender, stock y service** en pocos toques.
Pensada para usarla con una mano atras del mostrador, sin formularios largos
y sin tener que cargar clientes.

Next.js 15 + Tailwind. Se despliega en Vercel sin configuracion.

## Las 5 pantallas

| Pestaña | Para que sirve |
| --- | --- |
| **Vender** | Buscas o escaneas el producto, toca y va al ticket. "Cobrar" pide el medio de pago y listo: queda la venta y se descuenta el stock. Tambien se puede vender algo suelto que no este cargado. |
| **Stock** | Buscador, filtro por categoria y +/− para ajustar. Tocando el producto se edita precio, costo, codigo o se borra. El boton + carga uno nuevo. |
| **Service** | Equipos en reparacion: entra, se marca listo y se entrega (cobrado o debiendo). Guarda que se cobra, cuanto costo el repuesto y cuanto le toca a Facu. |
| **Caja** | Lo que entro hoy / 7 dias / 30 dias: ventas, service, ganancia (ya sin la parte de Facu) y medios de pago. Tocando una venta se ve el detalle y se puede borrar devolviendo el stock. |
| **A comprar** | La lista para el proveedor, separada en repuestos y productos. Al terminar la compra, los productos se suman al stock y los repuestos salen de la lista. |

## Lo que se carga de cada cosa

Un producto necesita nombre y **costo** — el costo es lo unico obligatorio
ademas del nombre, porque es con lo que se calcula la ganancia. Precio, codigo
y categoria son opcionales. Un equipo de service necesita solo el equipo.
Nada de clientes, fichas ni numeros de orden.

Si vendes algo que no estaba cargado, la app lo crea sola en el stock (en cero)
con el precio y el costo que pusiste, asi la proxima vez ya esta.

## La parte de Facu

En la ficha del equipo, **Para Facu** admite un porcentaje de la ganancia o un
monto fijo, y queda en blanco cuando no le toca nada. La ficha muestra al
instante cuanto se lleva y cuanto queda para el local, y una vez entregado el
equipo hay un interruptor **Ya le pague a Facu**.

En Caja la ganancia es lo que queda para el local (la parte de Facu ya
descontada), con una linea que aclara cuanto le corresponde y otra que avisa
cuanto se le debe.

## Repuestos y productos en la lista de compra

Cada cosa anotada es **repuesto** (va a una reparacion) o **producto** (es para
vender). Al terminar la compra los productos se suman al stock y los repuestos
simplemente salen de la lista, porque no son mercaderia.

## Codigo de barras

En Chrome de Android aparece el boton de la camara al lado del buscador: lee el
codigo y agrega el producto al ticket. Si el codigo no existe todavia, desde
Stock abre la ficha para cargarlo. En los navegadores que no lo soportan el
boton no se muestra y se busca escribiendo (tambien sirve un lector USB).

## Catalogo del Excel

La primera vez, en Stock aparece **Importar el catalogo del Excel**: carga los
productos de la planilla KYLOBYTE con precio, costo y codigo. Solo agrega lo que
falta, nunca pisa lo que ya este cargado.

## Tema claro y oscuro

Arranca con el tema del celular. Con el boton de sol/luna del encabezado se
cambia a mano y esa eleccion queda guardada en ese dispositivo.

## Donde se guardan los datos

- **Sin configurar nada**: en el propio telefono (`localStorage`). Funciona al
  instante, pero cada dispositivo tiene su propia informacion.
- **Con una base de datos Postgres** (variable `DATABASE_URL`): todo queda en la
  nube y se comparte entre los telefonos del local. Las tablas se crean solas.

La app muestra en que modo esta con la etiqueta de arriba a la derecha:
"Este equipo" o "Nube".

## Deploy en Vercel

### Opcion A — desde la terminal

```bash
npx vercel --prod
```

### Opcion B — desde GitHub

1. Subir el repositorio a GitHub.
2. En [vercel.com/new](https://vercel.com/new), importar el repo.
3. Deploy. Cada `git push` vuelve a desplegar solo.

### Base de datos compartida (recomendado si son varios)

1. En el proyecto de Vercel: **Storage** → **Create Database** → **Neon (Postgres)**.
2. Vercel agrega solo la variable `DATABASE_URL`.
3. **Redeploy** (Deployments → ... → Redeploy).

### Instalarla en el telefono (PWA)

- **Android / Chrome**: al abrir la URL aparece el aviso "Instalar en el telefono".
- **iPhone / Safari**: boton **Compartir** → **Agregar a inicio**.

Queda como una app: icono propio, pantalla completa y abre aunque no haya señal.
Los iconos se generan con `node scripts/make-icons.mjs`.

## Desarrollo local

```bash
npm install && npm run dev
```

Abre en http://localhost:3000. Sin `DATABASE_URL` arranca en modo local.
Para probar contra Postgres, crear un `.env.local` con `DATABASE_URL=...`.
