-- Ejecutar este código en el SQL Editor de Supabase
CREATE TABLE IF NOT EXISTS reparticiones (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  fecha date NOT NULL DEFAULT CURRENT_DATE,
  monto_total numeric NOT NULL,
  monto_renata numeric NOT NULL,
  monto_rodrigo numeric NOT NULL,
  notas text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Si la seguridad de nivel de fila (RLS) está activada, habilitarla para que cualquiera (o los autenticados) puedan leer y escribir
ALTER TABLE reparticiones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir todo a usuarios autenticados" ON reparticiones
  FOR ALL
  TO authenticated
  USING (true);
