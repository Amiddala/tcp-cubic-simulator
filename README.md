# TCP CUBIC — Simulador de Control de Congestión

Simulador interactivo de TCP CUBIC corriendo completamente en el navegador, sin servidor. Construido con HTML, JavaScript vanilla y Chart.js.

---

## ¿Qué es este proyecto?

Es una página web estática que simula cómo el algoritmo **TCP CUBIC** controla la ventana de congestión (`cwnd`) durante una transmisión de datos. El objetivo es visualizar en tiempo real cómo TCP reacciona ante la congestión en la red: crece lento al inicio, acelera siguiendo una curva cúbica, y cae bruscamente cuando detecta pérdida de paquetes.

Fue construido como ejercicio académico para la materia de PROGRAMACION WEB, siguiendo el requerimiento de simular el mecanismo de control de congestión **TCP CUBIC** usando únicamente JavaScript del lado del cliente.

---

## ¿Cómo funciona?

El simulador pasa por tres fases:

**1. Slow Start**
La ventana de congestión (`cwnd`) se duplica cada tick hasta alcanzar el umbral `ssthresh`. Es el arranque agresivo inicial.

**2. CUBIC**
Una vez superado el umbral, `cwnd` crece siguiendo la función cúbica:

```
cwnd = C * (t - K)³ + wMax
```

Donde:
- `C = 0.4` → constante de escala de CUBIC
- `K` → tiempo estimado para recuperar `wMax` tras una pérdida
- `wMax` → ventana máxima antes de la última pérdida
- `t` → tiempo transcurrido desde la última pérdida (en segundos)

**3. Recovery**
Cuando `inFlight > bandwidth * 2` (saturación del canal), se detecta pérdida:
- `wMax` guarda el valor actual de `cwnd`
- `ssthresh` se reduce al 70% (`cwnd * BETA`, donde `BETA = 0.7`)
- `cwnd` vuelve a 1
- `K` se recalcula: `K = ((wMax * (1 - BETA)) / C) ^ (1/3)`
- El siguiente tick entra en Slow Start nuevamente

---

## Archivos

```
index.html   → Interfaz: sliders, botones y canvas del gráfico
cubic.js     → Lógica de simulación: CUBIC, Slow Start, pérdidas, Chart.js
```

---

## Controles

| Control | Descripción |
|---|---|
| RTT (ms) | Latencia simulada del canal (afecta la escala de tiempo de CUBIC) |
| Pérdida (%) | Probabilidad de pérdida manual (slider visual, la pérdida real se detecta por saturación) |
| Velocidad (ms) | Intervalo entre ticks — más bajo = más rápido |
| Iniciar / Pausar / Reiniciar | Control de la simulación |
| Pérdida (botón) | Fuerza una pérdida manual instantánea |

---

## Dependencias

Solo una librería externa, cargada desde CDN:

```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js"></script>
```

No requiere Node.js, npm, ni servidor. Se abre directo en el navegador.

---

## Problema encontrado y solución

### Bug: las pérdidas no se veían en la gráfica

**Problema:** Al correr la simulación durante muchos ticks, la gráfica acumulaba cientos de puntos. Chart.js los comprimía todos en el ancho fijo del canvas, haciendo que cada caída brusca de `cwnd` (de 32 → 1) quedara aplastada en un solo píxel, prácticamente invisible.

**Solución:** Se implementó una **ventana deslizante de 80 ticks** en la función `step()`. Cada vez que se agrega un nuevo punto, si el historial supera 80 entradas, se elimina el más antiguo con `.shift()`:

```js
// Ventana deslizante: limita la gráfica a los últimos 80 ticks para que
// los picos de pérdida (caídas de cwnd) no se aplanen visualmente
if (chart.data.labels.length > 80) {
  chart.data.labels.shift();
  chart.data.datasets.forEach((d) => d.data.shift());
}
```

Con esto, la gráfica siempre muestra solo los últimos 80 ticks, cada caída ocupa espacio suficiente y las pérdidas son claramente visibles.

Adicionalmente se eliminó un `console.log(losses)` que había quedado en `forceLoss()` del código de desarrollo.

---

## Cómo correr

1. Clonar o descargar el repositorio
2. Abrir `index.html` en cualquier navegador moderno
3. Presionar **Iniciar**