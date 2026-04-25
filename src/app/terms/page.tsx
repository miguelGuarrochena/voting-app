import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';

export const metadata: Metadata = {
  title: 'Términos',
  description:
    'Términos y condiciones de uso de Pickly: qué se permite, qué no, y los límites de responsabilidad.',
};

export default function TermsPage() {
  return (
    <PageLayout className="pb-24 md:pb-16">
      <div className="max-w-3xl mx-auto px-1 sm:px-2 pt-6 sm:pt-10">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Home</span>
        </Link>

        <article className="bg-[var(--surface)] rounded-2xl shadow-sm border border-[var(--border)] p-6 sm:p-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-[var(--text)] mb-2">
            Términos y condiciones
          </h1>
          <p className="text-sm text-[var(--text-muted)] mb-8">
            Última actualización: 25 de abril de 2026
          </p>

          <Section title="1. Aceptación">
            <p>
              Al usar Pickly aceptás estos términos. Si no estás de acuerdo, por
              favor no uses el servicio.
            </p>
          </Section>

          <Section title="2. Qué es Pickly">
            <p>
              Pickly es una herramienta gratuita para crear encuestas, rankings,
              ratings y torneos de votación, y compartir el link con quienes
              quieras. Está disponible "tal cual" — hacemos lo posible por
              mantenerla disponible y con buena experiencia, pero sin garantías
              expresas de uptime ni continuidad.
            </p>
          </Section>

          <Section title="3. Tu cuenta (opcional)">
            <p>
              Podés usar Pickly sin cuenta. Si decidís crearte una, sos
              responsable de la seguridad de tu contraseña (si elegís ese
              método) y de toda actividad realizada desde esa cuenta.
            </p>
          </Section>

          <Section title="4. Uso aceptable">
            <p>
              No usés Pickly para:
            </p>
            <ul>
              <li>Crear encuestas con contenido ilegal, violento, sexual con menores, hostigador o que viole derechos de terceros.</li>
              <li>Suplantar a otra persona o atribuir falsamente declaraciones a personas reales.</li>
              <li>Distribuir malware, phishing o cualquier código malicioso.</li>
              <li>Realizar scraping masivo, spam o intentos de saturar la plataforma.</li>
              <li>Burlar mecanismos anti-fraude para inflar votos.</li>
            </ul>
            <p>
              Nos reservamos el derecho de eliminar contenido que viole estas
              reglas y/o suspender cuentas que las incumplan reiteradamente.
            </p>
          </Section>

          <Section title="5. Tu contenido">
            <p>
              Lo que escribís y subís sigue siendo tuyo. Al crear una encuesta,
              nos otorgás una licencia limitada y no exclusiva para almacenar,
              procesar y mostrar ese contenido a quienes accedan al link, con
              el único fin de operar el servicio.
            </p>
            <p>
              Vos sos responsable del contenido que publiques. Antes de subir
              imágenes verificá que tengas los derechos para usarlas.
            </p>
          </Section>

          <Section title="6. Encuestas anónimas y borrado">
            <p>
              Las encuestas creadas sin cuenta se administran únicamente desde
              el dispositivo donde fueron creadas (token guardado localmente).
              Si perdés ese dispositivo o limpias el almacenamiento del
              navegador, podés perder la posibilidad de gestionar la encuesta.
              Esto está expresamente comunicado al momento de crear sin cuenta.
            </p>
            <p>
              Las encuestas y sus respuestas se eliminan automáticamente a los
              90 días de su creación.
            </p>
          </Section>

          <Section title="7. Disponibilidad y cambios">
            <p>
              Podemos modificar, suspender o discontinuar funcionalidades en
              cualquier momento. Vamos a tratar de avisar con anticipación
              cuando los cambios sean significativos, pero no es obligatorio.
            </p>
          </Section>

          <Section title="8. Limitación de responsabilidad">
            <p>
              Hasta donde la ley lo permita, Pickly y sus operadores no son
              responsables por daños indirectos, incidentales o consecuentes
              derivados del uso del servicio (incluyendo pérdida de datos,
              encuestas borradas, indisponibilidad temporal, etc.).
            </p>
          </Section>

          <Section title="9. Privacidad">
            <p>
              El tratamiento de datos personales se rige por nuestra{' '}
              <Link href="/privacy" className="text-[var(--primary)] hover:underline">
                política de privacidad
              </Link>
              .
            </p>
          </Section>

          <Section title="10. Ley aplicable">
            <p>
              Estos términos se rigen por las leyes argentinas. Cualquier
              disputa se resolverá en los tribunales con jurisdicción en
              Argentina, salvo que la ley aplicable disponga otra cosa.
            </p>
          </Section>

          <Section title="11. Contacto">
            <p>
              Para cualquier consulta sobre estos términos, escribinos a{' '}
              <a href="mailto:hola@letspicky.com" className="text-[var(--primary)] hover:underline">
                hola@letspicky.com
              </a>
              .
            </p>
          </Section>
        </article>
      </div>
    </PageLayout>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-7">
      <h2 className="text-xl sm:text-2xl font-semibold text-[var(--text)] mb-3">
        {title}
      </h2>
      <div className="text-[var(--text-muted)] leading-relaxed space-y-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_strong]:text-[var(--text)]">
        {children}
      </div>
    </section>
  );
}
