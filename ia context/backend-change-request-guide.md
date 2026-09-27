# Wisecore — Guía para pedir cambios a backend

Todo pedido de cambio o reporte de bug dirigido al equipo de backend se escribe como un archivo `.md` en `respuestas/`, siguiendo esta plantilla — no un mensaje de chat, no un artifact suelto sin versionar. El objetivo es que backend pueda implementar sin ida y vuelta: metadata clara, ejemplos con datos reales, prioridad explícita por punto, y un checklist que el propio frontend usa después para validar la entrega.

## 0. Árbol de decisión

```
¿Es un comportamiento roto, reproducible con datos reales de un caso?
├─ SÍ → plantilla de BUG (§4). Prefijo de archivo: bug-
└─ NO — es un contrato/endpoint que el front necesita (nuevo o modificado)
    ├─ ¿Un solo endpoint o una regla puntual?
    │   → plantilla de PEDIDO (§3). Prefijo: backend-
    └─ ¿Varios endpoints/flujos, o un contrato nuevo grande
       (catálogo + resolución + proceso async, etc.)?
        → plantilla de PEDIDO (§3) + "Decisiones ya tomadas" y
          "Riesgos y orden de implementación" (ver spec-data-table-backend.md
          como referencia real). Prefijo: spec-
```

## 1. Ubicación y nombre de archivo

Siempre en `respuestas/`, kebab-case, con uno de estos 3 prefijos (son los que ya conviven hoy en la carpeta):

| Prefijo | Cuándo | Ejemplo real |
|---|---|---|
| `bug-` | Reporte de bug reproducible | `bug-required-answers-pending-secciones-inaccesibles.md` |
| `backend-` | Pedido de feature/cambio chico o mediano | `backend-hijos-carpeta.md`, `backend-arbol-expansion-persistente.md` |
| `spec-` | Contrato grande de un endpoint/recurso nuevo | `spec-data-table-backend.md` |

Un archivo por pedido. No mezclar un bug con un pedido de feature en el mismo documento aunque estén relacionados — son ciclos de vida distintos (un bug se cierra al arreglarse, un pedido puede tener puntos que se entregan en momentos distintos).

## 2. Metadata obligatoria al tope

Una sola línea, siempre las primeras después del título:

```markdown
**Destino:** Backend · **Origen:** Frontend (wisecore-front, <módulo>) · **Fecha:** <fecha> · **Estado:** <estado>
```

- `Origen` nombra el módulo concreto (`canvas de diagramas`, `editor de documentos`, `árbol de conocimiento`), no solo "frontend" — backend puede tener varios frontends.
- `Estado` se omite si el pedido es de una sola vez y ya queda cerrado al escribirlo (la mayoría de los `bug-`). Se incluye cuando el pedido puede evolucionar en el tiempo (`Pendiente` / `Parcial — ver nota` / `Implementado`), como en `backend-arbol-expansion-persistente.md`.

## 3. Plantilla "pedido de feature/cambio"

```markdown
# <Qué se está pidiendo, en una frase>

**Destino:** Backend · **Origen:** ... · **Fecha:** ... [· **Estado:** ...]

## Contexto
Qué existe hoy, por qué molesta o qué necesidad nueva aparece. Si el front
ya resolvió un problema análogo (mismo patrón, otra entidad), citarlo —
ahorra una vuelta de "¿por qué no lo hacen como X?".

## 1. <Título con el campo/endpoint concreto> — <Prioridad>
Explicación corta de qué se pide y por qué.

Request/Response de ejemplo (ver §3.1 — nunca `foo`/`bar`/`123`).

Reglas de negocio como bullets (edge cases, permisos, límites).

## 2. <...> — <Prioridad>
...

## Compatibilidad
Qué sigue funcionando exactamente igual, qué es aditivo, qué es breaking
(si algo lo es, decirlo explícito — no dejar que backend lo descubra solo).

## Checklist de aceptación
- [ ] Afirmación verificable, una por comportamiento nuevo.
```

Con varios endpoints/flujos grandes (variante `spec-`), agregar antes de los puntos numerados una tabla **"Decisiones ya tomadas"** (columna Punto/Decisión — corta la discusión sobre cosas que el frontend ya definió) y, al final, **"Riesgos y orden de implementación"** si hay una secuencia sugerida entre puntos. Ver `spec-data-table-backend.md` §1 y §8 como referencia real de ambas secciones.

### 3.1 Prioridad — etiqueta explícita en cada punto

Cada punto numerado lleva una de estas tres, en el título del punto (`## N. <título> — <Prioridad>`):

| Etiqueta | Significa |
|---|---|
| **Bloqueante** | Sin esto, la función no funciona. |
| **A confirmar** | El contrato ya lo declara o ya debería soportarlo; falta verificar el comportamiento real. |
| **Aditivo — no bloqueante** | Mejora la precisión/UX; el resto puede entregarse sin esto. |

Sin esta etiqueta, backend no tiene forma de priorizar sin preguntar — es la parte que más tiempo ahorra del pedido. Si el frontend ya tiene un fallback para cuando falta un punto (como pasa en `backend-roles-duplicados-diagramas.md` §3), decirlo en "Compatibilidad" — habilita a backend a entregar por partes.

### 3.2 Ejemplos con datos reales

Todo request/response de ejemplo usa ids, nombres y valores que podrían existir en el sistema real (`role_id: "8b1c..."`, `"Historial de cambios"`), nunca placeholders genéricos (`foo`, `bar`, `xxx`, `123`). Un ejemplo con datos reales es el que backend puede pegar directo en un test.

## 4. Plantilla "reporte de bug"

```markdown
# Bug: <código o síntoma> <consecuencia en una frase>

## 1. Resumen
Una o dos frases: qué falla, con qué código/mensaje, qué bloquea.

## 2. Reproducción
Requests reales (ids concretos del caso, no inventados), en orden, cada uno
con su respuesta relevante (resumida si es larga).

## 3. <Causa raíz, si se identificó>
Tabla o contraste entre lo que dicen las distintas fuentes/endpoints
involucrados — el bug casi siempre es una contradicción entre dos partes
del sistema que deberían coincidir y no coinciden. Nombrar el invariante
que se viola explícitamente si se puede.

## 4. Fix esperado
Qué criterio debería aplicar, dónde.

Casos a cubrir en la verificación:
1. El caso reportado → deja de fallar.
2. El caso "opuesto" (lo que sí debía bloquear sigue bloqueando) → regresión cero.
3. Casos límite relevantes (permisos elevados, configuración por defecto, etc.)
```

Ver `bug-required-answers-pending-secciones-inaccesibles.md` como referencia completa real — incluye además una sección "Hallazgo secundario" para un problema relacionado pero distinto encontrado durante la investigación; no forzarlo en el flujo principal del bug, separarlo así.

## 5. Actualizaciones posteriores

Nunca reescribir el pedido original cuando backend entrega parcial, cambia el alcance, o pide algo distinto a cambio. Se agrega un blockquote fechado **arriba del título**, más nuevo primero:

```markdown
> **Nota (2026-09-03):** backend entregó `expanded_folder_ids` según el
> Pedido 1. Frontend reimplementó la feature sobre esa base — ver
> `ia context/persistencia-estado-ui-guide.md` §3. El Pedido 2 sigue sin
> implementarse, no bloqueante.
```

Así el archivo queda como historia completa del intercambio, sin perder el pedido original ni obligar a adivinar qué cambió y cuándo. Ver `backend-arbol-expansion-persistente.md` para dos notas reales de este tipo.

## Errores comunes

- Pedir sin ejemplo de request/response — backend termina adivinando el shape exacto.
- No marcar prioridad por punto — todo se lee como igualmente urgente (o nada lo es).
- Omitir "Compatibilidad" — backend no sabe si puede romper algo existente o no.
- Usar datos inventados (`foo`, `123`) en vez de ids/valores reales del caso.
- Mezclar un bug con un pedido de feature en el mismo archivo.
- Reescribir el pedido original al actualizar el estado, en vez de agregar una nota fechada arriba.
- Escribir el pedido como mensaje de chat o artifact no versionado en vez de archivo en `respuestas/`.

## Checklist final

- [ ] Archivo en `respuestas/` con el prefijo correcto (`bug-` / `backend-` / `spec-`).
- [ ] Metadata completa al tope (Destino, Origen con módulo, Fecha[, Estado]).
- [ ] Cada punto numerado tiene su etiqueta de prioridad (pedidos de feature) o su sección de reproducción/causa/fix (bugs).
- [ ] Al menos un ejemplo de request/response con datos reales por punto que lo amerite.
- [ ] Sección "Compatibilidad" (pedidos) o "casos a cubrir" con no-regresión (bugs).
- [ ] Checklist de aceptación en checkboxes al final.
