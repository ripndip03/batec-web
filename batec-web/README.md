# BATEC — web oficial

Next.js (App Router) + TypeScript + Tailwind CSS v4. Independiente de Shopify, preparada para Vercel.

**Estado:** Fase 2 — homepage navegable. Todo lo que espera un asset o un dato real está marcado como *pending* en la interfaz y como `null` en los datos. Nada se inventa.

> Nota: este proyecto se escribió en un entorno sin acceso al registro de npm, así que **no se ha ejecutado `npm install` ni `next build`**. El primer paso en tu máquina es instalar y compilar; cualquier error de tipos que aparezca se corrige en la siguiente iteración.

## Arrancar

```bash
npm install
cp .env.example .env.local   # NEXT_PUBLIC_SHOW_DRAFTS=true para revisar el diseño con marcadores
npm run dev                  # http://localhost:3000
npm run build && npm start   # comprobación de producción
```

## Estructura

```
src/
  app/
    page.tsx                 Homepage (composición de secciones)
    layout.tsx               Fuentes, metadatos SEO, header y footer
    globals.css              Tokens de marca (@theme) y utilidades
    api/newsletter/route.ts  Alta newsletter: validación + consentimiento; 501 hasta elegir proveedor
    shop, drops, about, contact, legal/[slug]   Páginas provisionales (Fases 3–4)
  components/
    SiteHeader, SiteFooter, Newsletter, ProductCard, Countdown, PageStub
    ui.tsx                   Logo (slot), Pending, HeartShape, TeeSilhouette, SectionHead
    home/                    Hero, Ticker, FirstHeartbeat, ShopTheDrop, BatecWorld, CampaignEditorial, NextDrop
  lib/
    types.ts                 Modelo de dominio (Product, Variant, Drop, Money…)
    catalog.ts               Melted Heart Tee y sus 10 colorways (sin precio/stock/fotos hasta confirmarlos)
    drops.ts                 DROP 001 y DROP 002 (sin nombre ni fecha)
    site.ts                  Datos de marca, contacto, redes, navegación
```

## Cómo añadir los materiales reales

| Material | Dónde | Qué cambiar |
|---|---|---|
| Logotipo oficial (SVG) | `public/brand/batec-logo.svg` | `site.logo.src` en `lib/site.ts` |
| ™ junto al logo | — | `site.trademark = "TM"` (nunca ®) |
| Foto / vídeo de campaña del hero | `public/campaign/` | `heroMedia` en `components/home/Hero.tsx` |
| Fotos frontal y trasera por variante | `public/products/melted-heart-tee/<slug>/` | `images` de la variante en `lib/catalog.ts` |
| Precio, tallas, stock | — | `price` (céntimos), `sizes`, `availability`, `published: true` |
| Composición, gramaje, cuidados | — | `composition`, `weight`, `care` del producto |
| Fotos editoriales | `public/campaign/` | `image` de cada toma en `CampaignEditorial.tsx` |
| Fecha del próximo drop | — | `launchAt` del DROP 002 en `lib/drops.ts` (activa la cuenta atrás) |
| Email, Instagram, TikTok | — | `site.contact`, `site.social` |

Una variante solo aparece en producción cuando tiene fotos, precio, tallas y disponibilidad y `published: true`.

## Accesibilidad y rendimiento incluidos

- Navegación por teclado, foco visible, enlace "skip to content", menú móvil con Escape.
- Animaciones (latido a 72 BPM, línea de ECG, ticker) desactivadas con `prefers-reduced-motion`.
- Botón explícito frente/espalda en las tarjetas para pantallas táctiles (sin hover).
- `next/font` autoaloja las fuentes; `next/image` con AVIF/WebP; cabeceras de seguridad básicas.

## Recomendación de stack para vender (Fase 4)

Pensada para una marca que empieza: casi todo coste es variable, sin cuotas fijas altas. **Precios aproximados; verificar en cada proveedor antes de contratar.**

| Pieza | Propuesta | Por qué | Coste orientativo |
|---|---|---|---|
| Hosting | Vercel | Despliegue nativo de Next.js. El plan gratuito (Hobby) es para uso no comercial; una tienda necesita el plan Pro | ~20 USD/mes por miembro |
| Pagos | Stripe Checkout (página alojada por Stripe) | Los datos de tarjeta nunca pasan por nuestro servidor; incluye Apple/Google Pay, códigos promocionales y cálculo de impuestos | Sin cuota fija; comisión por transacción (en tarjetas europeas estándar, del orden del 1,5 % + 0,25 €) |
| Base de datos, cuentas | Supabase (Postgres + Auth) | Productos, inventario, pedidos y cuentas de usuario; capa gratuita suficiente al principio | 0 € al inicio; ~25 USD/mes al crecer |
| Emails transaccionales | Resend o Brevo | Confirmaciones de pedido y newsletter | Capa gratuita al inicio |
| Dominio | p. ej. batec.xxx | — | ~10–40 €/año según extensión |

Alternativa si se prefiere no programar el backend: un motor headless como Medusa (open source, autoalojado) o un SaaS headless, a cambio de más coste o mantenimiento.

## Pendiente de recibir

Logotipos oficiales · fotos frontal/trasera por variante · fotos de campaña · precios · tallas y stock · composición/gramaje/cuidados · email oficial · URLs de Instagram y TikTok · proveedor de newsletter · datos legales de la empresa · dominio.
