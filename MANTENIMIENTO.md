# Mantenimiento de Pokémon TCG Tracker

Notas para no olvidar cómo se actualiza y se trabaja en el proyecto.

## Trabajar en local

Postgres.app tiene que estar encendido.

```bash
# Terminal 1: backend
cd ~/Desktop/pokemon-tracker/server
npm run dev

# Terminal 2: frontend
cd ~/Desktop/pokemon-tracker/client
npm run dev
```

La app queda en http://localhost:5173

## Cuando cambie el meta (nueva expansión, rotación)

Todos los comandos se corren en la carpeta `server`.

```bash
cd ~/Desktop/pokemon-tracker/server
npm run meta:sync        # 1. trae los decks nuevos de Limitless a la BD local
npm run seed:export      # 2. actualiza db/seed.sql
npm run pokedex:build    # 3. descarga los Pokémon nuevos y avisa si falta algún ícono

cd ..
git add .
git commit -m "Actualizar meta"
git push                 # 4. sube todo; Render despliega solo

cd server
export NEON_URL='CADENA_DE_NEON_CON_verify-full'
DATABASE_URL="$NEON_URL" node scripts/sync-meta.js   # 5. actualiza los decks en Neon
```

- La cadena de Neon se copia en neon.com → proyecto → **Connect**. Hay que cambiarle `sslmode=require` por `sslmode=verify-full`.
- Si cambia el formato después de una rotación, revisar la línea `const FORMAT = ...` en `server/scripts/sync-meta.js`.
- `meta:sync` también recalcula los matchups del meta (tabla `meta_matchups`). Conviene correrlo cada semana, aunque no cambie el meta, para tener datos frescos.

## Subir cambios a producción

```bash
cd ~/Desktop/pokemon-tracker
git add .
git status --short       # revisar que NO aparezca ningún .env
git commit -m "Describe el cambio"
git push                 # Render despliega solo
```

Si algo sale mal en producción: Render → **Events** → **Rollback** en el último despliegue que funcionaba.

## Cambios en la base de datos

Los cambios van en `server/db/schema.sql`. Render los aplica solo al arrancar.

| Cambio | Cómo |
| --- | --- |
| Tabla nueva | `CREATE TABLE IF NOT EXISTS ...` |
| Columna nueva | `ALTER TABLE ... ADD COLUMN IF NOT EXISTS ...` (con `DEFAULT` si es `NOT NULL`) |
| Borrar o renombrar | Hacer primero una copia de seguridad en Neon (crear una rama) |

## Comandos de `server`

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | Enciende el backend en local |
| `npm run db:setup` | Crea las tablas y carga los decks iniciales |
| `npm run meta:sync` | Trae los decks del meta y recalcula los matchups desde Limitless |
| `npm run seed:export` | Genera `db/seed.sql` desde la BD |
| `npm run pokedex:build` | Descarga los sprites de todos los Pokémon |

## Recordatorios de seguridad

- Nunca subir archivos `.env` ni pegar la cadena de Neon en un chat.
- Si una contraseña se expone, cambiarla de inmediato en Neon y actualizar `DATABASE_URL` en Render.