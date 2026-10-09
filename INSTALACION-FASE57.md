# Domus Salud — Fase 5.7

## Cambio realizado
Se actualiza la sección **3. Antecedentes mórbidos / Tratamiento** del formulario inicial enviado al paciente.

- Se eliminan los radios Sí/No por antecedente.
- Se eliminan las observaciones individuales por antecedente.
- Los antecedentes pasan a selección múltiple mediante casillas.
- Se agrega un único campo **Observaciones** al final de la sección.
- El campo Observaciones tiene un máximo de 2000 caracteres.
- Se mantiene compatibilidad con la ficha clínica general existente.

## Supabase
No requiere ejecutar SQL adicional. Los datos continúan almacenándose mediante la estructura de estado existente.

## Validación
Suite existente: 85/85 pruebas aprobadas.
