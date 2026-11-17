import type { Product } from "./types";

/**
 * Catalogo inicial tomado del Excel KYLOBYTE (hoja Stock) para no tener que
 * cargar todo a mano. Se importa desde Stock y solo agrega lo que falta.
 */
export type CatalogEntry = Pick<Product, "name" | "category" | "qty" | "cost" | "price" | "barcode">;

export const CATALOG: CatalogEntry[] = [
  {"name":"Redmi Buds 6","category":"Auriculares inalambricos","qty":1,"cost":22700,"price":45000,"barcode":"57679-CEAGDF6TA06734"},
  {"name":"Groove Splash parlante portatil","category":"Parlante portatil","qty":2,"cost":41000,"price":70000,"barcode":"INC2503711780"},
  {"name":"Joystick PC ARIES","category":"","qty":0,"cost":null,"price":null,"barcode":"T'TGP500250600175"},
  {"name":"COMBO REVOLUTION KCK-2705 T+M 8M INALAM. NEGRO","category":"Oficina","qty":1,"cost":29343,"price":45000,"barcode":"INC2301900045"},
  {"name":"TECLADO FSPRO RGB GS-530 MECANICO S-RED NEGRO","category":"Perifericos","qty":1,"cost":37413,"price":55000,"barcode":"812366026583"},
  {"name":"RECEPTOR NW150US NANO WIFI 150MBPS USB MERCUSYS","category":"Receptor","qty":5,"cost":5762,"price":15000,"barcode":"6957939000325"},
  {"name":"RECEPTOR MA12N NANO N300 WIFI 300MBPS USB MERCUSYS","category":"Receptor","qty":4,"cost":7991,"price":20000,"barcode":"6957939002039"},
  {"name":"MICRO SD 32GB ULTRA SDSQUNR-GN3MA 100MBS SANDISK","category":"Almacenamiento","qty":1,"cost":18934,"price":30000,"barcode":"619659184377"},
  {"name":"TECLADO NAXOS T-TGK310BG SP RAINBOW NEGRO/GRIS T","category":"Perifericos","qty":1,"cost":39407,"price":70000,"barcode":"6950376726834"},
  {"name":"MOUSE XTM-M520SG GHOST SPIDER 2400DPI XTECH","category":"Perifericos","qty":1,"cost":20127,"price":40000,"barcode":"XTMM520SG231202468"},
  {"name":"MOUSE XTM-M520SM SPIDER MAN 2400DPI XTECH","category":"Perifericos","qty":2,"cost":27177,"price":45000,"barcode":"798302231450"},
  {"name":"CAMARA IP MC230 INTERNA AI DETECTION 3K 5MP MERCUSYS","category":"Mercusys","qty":2,"cost":41699,"price":60000,"barcode":"6957939004798"},
  {"name":"EXTENSOR DE RANGO MW300RE 300MBPS 3 ANT. MERCUSYS","category":"Mercusys","qty":2,"cost":17678,"price":35000,"barcode":"6957939005689"},
  {"name":"JOYSTICK SCORPION GX-23UV PC/PS3/PS4/NS/NSL/A RGB","category":"Genius","qty":1,"cost":28825,"price":60000,"barcode":"4710268263937"},
  {"name":"JOYSTICK SCORPION GX-21UV PC/PS3/PS4/NS/NSL/A VIBRACION","category":"Genius","qty":1,"cost":27820,"price":50000,"barcode":"4710268264026"},
  {"name":"MOUSE XTM-M340BP BLACK PANTER 1600DPI XTECH","category":"","qty":1,"cost":null,"price":20000,"barcode":"798302231597"},
  {"name":"MOUSE XTM-M340CA CAPITAN AMERICA 1600DPI XTECH","category":"","qty":1,"cost":null,"price":20000,"barcode":"798302231610"},
  {"name":"MOUSE XTM-M340IM IRON MAN 1600DPI XTECH","category":"","qty":1,"cost":null,"price":20000,"barcode":"798302231603"},
  {"name":"MOUSE XTM-D340MK MICKEY MOUSE 1600DPI XTECH","category":"","qty":1,"cost":null,"price":20000,"barcode":"798302231375"},
  {"name":"MOUSE XTM-D340MM MINNIE MOUSE 1600DPI XTECH","category":"","qty":1,"cost":null,"price":20000,"barcode":"798302231627"},
  {"name":"MOUSE FORGE GM300 RGB 72000DPI USB NEGRO MSI","category":"","qty":1,"cost":null,"price":40000,"barcode":"4711377175487"},
  {"name":"MOUSE MICRO TRAVELER V2 ROJO GENIUS","category":"","qty":1,"cost":null,"price":15000,"barcode":"4710268228691"},
  {"name":"MOUSE MICRO TRAVELER V2 NEGRO GENIUS","category":"","qty":1,"cost":null,"price":15000,"barcode":"4710268227885"},
  {"name":"CAMARA WEB C270 HD 720 3M LOGITECH","category":"","qty":1,"cost":null,"price":50000,"barcode":"097855070739"},
  {"name":"MOUSE PAD NM-PADXL 70CMX30CM NEGRO NETMAK","category":"","qty":1,"cost":null,"price":15000,"barcode":"700306605540"},
  {"name":"MICROFONO CORBATERO","category":"","qty":0,"cost":13000,"price":25000,"barcode":"mcchino"},
  {"name":"Cable Puxida","category":"","qty":31,"cost":1500,"price":4000,"barcode":"cbpuxida"},
  {"name":"Cargador Puxida","category":"","qty":0,"cost":3500,"price":8000,"barcode":"crpuxida"},
  {"name":"Mouse Havit Tri-Mode MS969SE","category":"","qty":1,"cost":18000,"price":35000,"barcode":"mousehavits969"},
  {"name":"Templado PUXIDA","category":"","qty":98,"cost":900,"price":8000,"barcode":"templado"},
  {"name":"RECEPTOR BLUETOOTH MERCUSYS","category":"","qty":3,"cost":6700,"price":20000,"barcode":"6957939002176"},
];
