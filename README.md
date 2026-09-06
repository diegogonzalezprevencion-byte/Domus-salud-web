# Domus Salud — Supabase centralizado

Esta versión cambia la lógica de datos de la web-app para que la información operativa deje de depender del `localStorage` del computador.

## Qué queda centralizado en Supabase

- Pacientes registrados.
- Profesionales habilitados.
- Asignación de pacientes a profesionales.
- Evoluciones clínicas.
- Formularios previos enviados por pacientes.
- Testimonios.
- Equipo directivo.
- Imágenes de slides modificadas desde administrador.
- Métricas básicas.

## Qué ya no se usa como base de datos

- `localStorage` del navegador.

Solo se usa `sessionStorage` para mantener la sesión temporal abierta mientras se navega.

## Paso obligatorio en Supabase

Ejecutar el archivo:

```text
supabase/centralizacion-supabase-app-state.sql
```

Ruta:

```text
Supabase → SQL Editor → New query → pegar código → Run
```

## Después de subir a GitHub

1. Subir el ZIP descomprimido al repositorio.
2. Esperar redeploy en Vercel.
3. Entrar desde un computador y crear un paciente de prueba.
4. Entrar desde otro computador o navegador incógnito.
5. Iniciar sesión como administrador.
6. El paciente creado debe aparecer igual.

## Nota importante de seguridad

Esta versión centraliza datos en Supabase para eliminar la dependencia del computador local. Antes de usar datos reales de pacientes, se recomienda una siguiente etapa de seguridad: migrar los accesos de profesionales a Supabase Auth y cerrar las políticas RLS por rol profesional/administrador.
