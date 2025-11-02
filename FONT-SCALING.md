# 📐 Sistema di Font Scaling Dinamico

## 🎯 Panoramica

Il sistema implementa un font scaling **fluido e responsivo** che si adatta automaticamente alla risoluzione dello schermo dell'utente, garantendo leggibilità ottimale su tutti i dispositivi.

## 🔧 Come Funziona

### 1. Scaling Automatico con `clamp()`

Il sistema usa la funzione CSS `clamp(min, preferred, max)` per creare font size fluidi:

```css
font-size: clamp(min-size, calc-preferred-size, max-size);
```

Questo permette al testo di scalare proporzionalmente alla larghezza del viewport (vw) mantenendo limiti minimi e massimi.

### 2. Breakpoint Responsivi

Il sistema è ottimizzato per diverse risoluzioni:

| Risoluzione | Breakpoint | Font Size Base | Descrizione |
|------------|-----------|----------------|-------------|
| **Mobile** | < 640px | 0.8rem - 1rem | Font compatti per mobile |
| **Tablet** | 640px - 1023px | 0.9rem - 1.1rem | Scaling intermedio |
| **Desktop** | 1024px - 1535px | 1rem - 1.15rem | Font standard |
| **Large Desktop** | 1536px - 1919px | 1.05rem - 1.2rem | Scaling ampio |
| **XL Desktop** | 1920px - 2559px | 1.1rem - 1.25rem | Ottimizzato per schermi grandi |
| **Ultra Wide** | ≥ 2560px | 1.15rem - 1.35rem | Massimo scaling |

### 3. Variabili CSS Disponibili

Il sistema espone variabili CSS per diverse tipologie di testo:

```css
--font-size-xs: clamp(0.7rem, 0.65rem + 0.25vw, 0.85rem);    /* Extra small */
--font-size-sm: clamp(0.8rem, 0.75rem + 0.35vw, 1rem);       /* Small */
--font-size-base: clamp(0.875rem, 0.7rem + 0.6vw, 1.125rem); /* Base */
--font-size-md: clamp(0.95rem, 0.85rem + 0.5vw, 1.2rem);     /* Medium */
--font-size-lg: clamp(1.15rem, 1rem + 0.7vw, 1.5rem);        /* Large */
--font-size-xl: clamp(1.35rem, 1.15rem + 1vw, 1.875rem);     /* Extra large */
--font-size-2xl: clamp(1.6rem, 1.3rem + 1.5vw, 2.25rem);     /* 2X large */
--font-size-3xl: clamp(2rem, 1.5rem + 2.5vw, 3rem);          /* 3X large */
--font-size-4xl: clamp(2.5rem, 2rem + 3vw, 4rem);            /* 4X large */
```

## 🎨 Utilizzo

### Metodo 1: Utility Classes CSS

Usa le classi predefinite nei tuoi componenti:

```jsx
<h1 className="text-fluid-3xl">Titolo Principale</h1>
<h2 className="text-fluid-2xl">Sottotitolo</h2>
<p className="text-fluid-base">Testo normale del paragrafo</p>
<span className="text-fluid-xs">Testo molto piccolo</span>
```

**Classi disponibili:**
- `.text-fluid-xs` - Extra small
- `.text-fluid-sm` - Small
- `.text-fluid-base` - Base (default)
- `.text-fluid-md` - Medium
- `.text-fluid-lg` - Large
- `.text-fluid-xl` - Extra large
- `.text-fluid-2xl` - 2X large
- `.text-fluid-3xl` - 3X large
- `.text-fluid-4xl` - 4X large

### Metodo 2: Variabili CSS Dirette

Usa le variabili CSS in stili inline o file CSS:

```css
.my-component {
  font-size: var(--font-size-lg);
}
```

```jsx
<div style={{ fontSize: 'var(--font-size-xl)' }}>
  Testo grande
</div>
```

### Metodo 3: Hook React (Avanzato)

Per controllo programmatico dinamico:

```tsx
import { useDynamicFontSize, useScreenResolution } from '@/hooks/useDynamicFontSize';

function MyComponent() {
  const { fontScale, width } = useDynamicFontSize();
  const { width: screenWidth, height: screenHeight } = useScreenResolution();
  
  return (
    <div>
      <p>Font scale corrente: {fontScale}</p>
      <p>Larghezza schermo: {width}px</p>
      <p>Risoluzione: {screenWidth}x{screenHeight}</p>
    </div>
  );
}
```

## 📊 Esempi Pratici

### Esempio 1: Card con Scaling Adattivo

```jsx
<div className="card">
  <h3 className="text-fluid-xl">Titolo Card</h3>
  <p className="text-fluid-base">
    Descrizione con font size adattivo automaticamente.
  </p>
  <span className="text-fluid-sm">Metadata piccola</span>
</div>
```

### Esempio 2: Hero Section

```jsx
<section className="hero">
  <h1 className="text-fluid-4xl font-bold">
    Budget Hub
  </h1>
  <p className="text-fluid-lg">
    Controllo end-to-end del budget Digimax
  </p>
</section>
```

### Esempio 3: Tabella Responsiva

```jsx
<table>
  <thead>
    <tr className="text-fluid-sm">
      <th>Campagna</th>
      <th>Budget</th>
    </tr>
  </thead>
  <tbody className="text-fluid-base">
    {/* Righe tabella */}
  </tbody>
</table>
```

## 🎯 Best Practices

### 1. **Usa Sempre le Utility Classes**
   - ✅ Preferisci `.text-fluid-*` invece di font size fissi
   - ❌ Evita `text-sm`, `text-base` di Tailwind per testo principale

### 2. **Mantieni Gerarchia Visiva**
   ```jsx
   <h1 className="text-fluid-3xl">Titolo Principale</h1>
   <h2 className="text-fluid-2xl">Sottotitolo</h2>
   <h3 className="text-fluid-xl">Heading 3</h3>
   <p className="text-fluid-base">Testo corpo</p>
   <span className="text-fluid-sm">Metadata</span>
   ```

### 3. **Test su Diverse Risoluzioni**
   - 📱 Mobile: 375px - 640px
   - 📱 Tablet: 768px - 1024px
   - 💻 Desktop: 1440px - 1920px
   - 🖥️ Ultra Wide: 2560px+

### 4. **Considera il Contesto**
   - Dashboard cards: `text-fluid-base`
   - Tabelle header: `text-fluid-sm`
   - Modali title: `text-fluid-xl`
   - Button labels: `text-fluid-sm` o `text-fluid-base`

## 🚀 Performance

### Vantaggi del Sistema

1. **Zero JavaScript Runtime** - Tutto CSS puro
2. **Smooth Scaling** - Transizioni fluide tra risoluzioni
3. **Accessibilità** - Rispetta le preferenze utente
4. **Maintenance** - Variabili centralizzate

### Misurazione

Il sistema scala automaticamente senza impatto sulle performance:

- **FCP**: Nessun impatto
- **LCP**: Nessun impatto
- **CLS**: 0 (nessun layout shift)

## 🔍 Debug & Testing

### Visualizza Font Size Corrente

```jsx
// In console del browser
console.log(getComputedStyle(document.documentElement).fontSize);

// Mostra tutte le variabili
const root = document.documentElement;
console.log({
  base: getComputedStyle(root).getPropertyValue('--font-size-base'),
  lg: getComputedStyle(root).getPropertyValue('--font-size-lg'),
  xl: getComputedStyle(root).getPropertyValue('--font-size-xl')
});
```

### Test Responsive

```bash
# Nel browser DevTools
1. Apri DevTools (F12)
2. Toggle Device Toolbar (Ctrl+Shift+M)
3. Seleziona diverse risoluzioni
4. Osserva il font scaling in tempo reale
```

## 📝 Modifiche Future

### Come Aggiustare il Scaling

Per modificare l'intensità dello scaling, edita `/src/app/globals.css`:

```css
/* Aumenta lo scaling */
--font-size-base: clamp(0.875rem, 0.7rem + 0.8vw, 1.25rem); /* +0.2vw */

/* Riduci lo scaling */
--font-size-base: clamp(0.875rem, 0.7rem + 0.4vw, 1.125rem); /* -0.2vw */
```

### Aggiungi Nuove Variabili

```css
:root {
  /* Aggiungi nuova variabile personalizzata */
  --font-size-custom: clamp(minSize, preferredSize, maxSize);
}

/* Utility class */
.text-fluid-custom {
  font-size: var(--font-size-custom) !important;
}
```

## 🎓 Risorse

- [CSS clamp() - MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/clamp)
- [CSS Custom Properties - MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/--*)
- [Responsive Typography](https://web.dev/responsive-web-design-basics/)

---

**Ultima modifica:** Novembre 2024  
**Versione:** 1.0.0

