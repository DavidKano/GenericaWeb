# Registro de Cambios (Changelog) - Connessia

Este archivo registra cronológicamente todas las versiones desplegadas en la plataforma, detallando las funcionalidades añadidas, mejoras y correcciones realizadas.

---

## [v4.1.2] - 2026-06-03
### Añadido
- **Estilo Sombreado para Bloqueos en Calendario (por David)**: Añadido sombreado gris visual para destacar claramente los días y horas bloqueados en el calendario de administración (`AdminDashboard.tsx`).

## [v4.1.1] - 2026-05-29
### Modificado
- **Unificación de Línea en Pie de Página**: Rediseño de ConnessiaFooter para alinear horizontalmente todos los elementos (`powered by`, logotipo, nombre de marca y versión) en una sola línea responsiva fluida, tanto para web como para móviles.
- **Retoque de Cabeceras de Modales**: Retirado el emoji decorativo `✨` al lado del nombre de negocio en la cabecera de los modales de alerta y confirmación.

### Corregido
- **Contraste en Superadmin**: Removida la propiedad `isDark` en el footer de `SuperAdminLayout` para corregir la falta de contraste y permitir que el logotipo, marca y versión de Connessia se visualicen correctamente en color oscuro sobre el fondo claro del panel.

---

## [v4.1.0] - 2026-05-29
### Añadido
- **Plazo de Cancelación Parametrizable**: Añadido selector numérico en Ajustes Generales del administrador (`0` a `720` horas) con traducción dinámica a días/horas.
- **Bloqueo de Cancelación en App**: Los clientes ya no pueden cancelar citas de forma autónoma si queda menos tiempo del plazo mínimo configurado por el gerente.
- **Avisos Visuales Inteligentes**: El botón de cancelar en el perfil de usuario se muestra en gris atenuado y hover ámbar con tooltip de advertencia cuando la cita está fuera del margen de cancelación.
- **Modales Personalizados Premium**: Reemplazo de los diálogos `alert` y `confirm` nativos del navegador por modales estilizados con efecto cristal (glassmorphism) que muestran dinámicamente el nombre real del negocio del superadmin, eliminando el mensaje de la URL en la cabecera.
- **Control de Versión Centralizado**: Creación del archivo `src/version.ts` e integración de la versión en el pie de página de Connessia unificado en una sola línea horizontal para móvil y web.

### Modificado
- **TPV Móvil Responsivo y Simplificado**: Reubicación del botón **"Cierre de Caja Diario"** al pie absoluto de la página en versión móvil mediante reordenación flexible (`display: contents` + Flex `order`). Ocultación de tablas e interfaces de consulta no esenciales en móvil para agilizar el proceso de cobro táctil al 100% de ancho.

---

## [v4.0.0] - Hito de Rediseño Estético Premium & Responsivo Móvil
### Añadido
- **Rediseño Estético Completo (Glassmorphic)**: Renovación estética total en todos los paneles utilizando una paleta de colores curada y armoniosa, efectos de cristal difuminado, sombras premium, bordes curvos y tipografía moderna en Google Fonts.
- **TPV Responsive total**: Reorganización del TPV en una grilla líquida para apilarse de forma táctil en teléfonos móviles, permitiendo cobros instantáneos al 100% de ancho con botones e inputs optimizados.

---

## [v3.0.0] - Hito de Módulo TPV Completo
### Añadido
- **Módulo Terminal de Punto de Venta (TPV)**: Integración de cobros directos de servicios del catálogo y conceptos de venta manuales.
- **Gestión de Caja**: Registro de transacciones del día, métodos de pago diferenciados (Tarjeta / Efectivo), y sistema integrado para **Cierre de Caja Diario** con reportes analíticos para el gerente.
- **Métricas y Estadísticas**: Panel gráfico de análisis de ventas.

---

## [v2.0.0] - Hito de Gestión de Personal y Horarios
### Añadido
- **Control de Personal**: Asignación de citas a miembros individuales del equipo técnico.
- **Horarios y Bloqueos Avanzados**: Configuración de jornadas de trabajo por empleado y bloqueo selectivo de días/horas en el calendario.

---

## [v1.0.0] - Versión Inicial
- Estructura base de la agenda online, reservas de clientes, panel de control de administración y pasarela de cobro rápido.
