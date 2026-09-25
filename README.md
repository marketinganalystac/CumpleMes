# Seguimiento de niños

App (Vite + JS) para calcular la edad, agendar visitas y dar seguimiento de estimulación. Datos en Supabase, despliegue en Vercel.

## 1. Supabase
1. Crea un proyecto en supabase.com.
2. En **SQL Editor**, pega y ejecuta `supabase/schema.sql` (crea las tablas con RLS: cada usuario solo ve sus datos).
3. En **Project Settings > API**, copia la *Project URL* y la clave *anon public*. No uses la `service_role` en el frontend.
4. En **Authentication > Providers > Email**, deja el correo activo. Para probar rápido puedes desactivar "Confirm email".

## 2. Local
```bash
cp .env.example .env   # pega tu URL y anon key
npm install
npm run dev
```

## 3. Git
```bash
git remote add origin https://github.com/TU-USUARIO/seguimiento-ninos.git
git push -u origin main
```

## 4. Vercel
1. **Add New > Project** e importa el repositorio (detecta Vite solo).
2. En **Environment Variables** agrega `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.
3. Deploy. Luego, en Supabase **Authentication > URL Configuration**, pon el dominio de Vercel como *Site URL* (y en *Redirect URLs*).

## 5. Descargar el registro
Dentro de la app, el botón **Descargar registro** exporta un CSV (compatible con Excel) con las mismas columnas de la *Tabla de Registro de Visitas*: N.º de Cupo, Nombre del Niño, Fecha de Nacimiento, Fecha de visita, Meses cumplidos, Módulo, Semana, Días Cumplidos y Hora de visita. Los meses, la semana y los días se calculan con la fecha de visita de cada niño (o con hoy si no tiene visita registrada).
