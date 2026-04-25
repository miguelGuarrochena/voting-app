import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';

// Página estática server-rendered. Sin client hooks: el copy es informativo
// y no necesita interactividad. Idioma español por defecto (Pickly nace en es-AR);
// si más adelante añadimos i18n a los legales, se mueve a `useLanguage`.
export const metadata: Metadata = {
  title: 'Privacidad',
  description:
    'Cómo Pickly maneja tus datos: qué guardamos, qué no guardamos, y cómo podés borrar tu información.',
};

export default function PrivacyPage() {
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

        <article className="bg-[var(--surface)] rounded-2xl shadow-sm border border-[var(--border)] p-6 sm:p-10 prose-invert">
          <h1 className="text-3xl sm:text-4xl font-bold text-[var(--text)] mb-2">
            Política de privacidad
          </h1>
          <p className="text-sm text-[var(--text-muted)] mb-8">
            Última actualización: 25 de abril de 2026
          </p>

          <Section title="Resumen rápido">
            <p>
              Pickly (operado desde el dominio <strong>letspicky.com</strong>) es
              una herramienta para crear encuestas, rankings, ratings y torneos.
              Está pensada para que la uses con la menor cantidad de datos
              personales posible. No vendemos información, no usamos publicidad
              de terceros y no compartimos tus datos con anunciantes.
            </p>
          </Section>

          <Section title="Qué guardamos cuando creás una encuesta sin cuenta">
            <ul>
              <li>El contenido de la encuesta: título, descripción, opciones y, si subís imagen, esa imagen.</li>
              <li>Un token aleatorio para identificar la encuesta en la URL.</li>
              <li>Fechas de creación, expiración y cierre.</li>
              <li>El alias o nombre que escribís al votar (si aplicás), guardado solo en tu navegador (localStorage) y enviado junto con cada voto para identificar tu respuesta dentro de la encuesta.</li>
            </ul>
            <p>
              No pedimos email ni contraseña para crear ni votar de forma anónima.
              No registramos direcciones IP individuales asociadas a tus votos.
            </p>
          </Section>

          <Section title="Qué guardamos si te creás una cuenta">
            <p>
              Si elegís iniciar sesión (es opcional), usamos{' '}
              <strong>Supabase Auth</strong> para gestionar la autenticación. En
              ese caso almacenamos:
            </p>
            <ul>
              <li>Tu email.</li>
              <li>Si usás email + contraseña: la contraseña hasheada por Supabase. Nunca tenemos acceso a la contraseña en texto plano.</li>
              <li>Si usás Google OAuth: el identificador de Google asociado a tu cuenta y tu email.</li>
              <li>Un identificador interno (UUID) que asocia las encuestas que creés a tu cuenta para sincronizarlas entre dispositivos.</li>
            </ul>
            <p>
              Podés borrar tu cuenta escribiéndonos a{' '}
              <a href="mailto:hola@letspicky.com" className="text-[var(--primary)] hover:underline">
                hola@letspicky.com
              </a>
              . En ese caso eliminamos tus datos de auth y desvinculamos las
              encuestas asociadas (las encuestas pueden quedar como anónimas o
              ser eliminadas, según prefieras).
            </p>
          </Section>

          <Section title="Cookies y almacenamiento local">
            <p>
              Pickly utiliza dos tipos de almacenamiento en tu navegador:
            </p>
            <ul>
              <li>
                <strong>localStorage / sessionStorage</strong>: para guardar tu
                alias, idioma, tema, encuestas creadas localmente y dismisses
                de modales. No se envía a ningún servidor más allá del nuestro.
              </li>
              <li>
                <strong>Cookies de sesión de Supabase Auth</strong>: solo si
                iniciás sesión. Son técnicas/funcionales, necesarias para
                mantener tu sesión iniciada y segura.
              </li>
            </ul>
            <p>
              No usamos cookies de tracking publicitario ni cookies de
              terceros con fines analíticos invasivos.
            </p>
          </Section>

          <Section title="Analítica">
            <p>
              Usamos <strong>Vercel Analytics</strong> para medir tráfico de forma
              agregada y anónima (no almacena cookies de identificación
              persistente y respeta las señales de Do Not Track / GPC del
              navegador). Esa información nos sirve para entender qué páginas
              tienen más uso y mejorar la app.
            </p>
          </Section>

          <Section title="Dónde se guardan los datos">
            <p>
              La base de datos y la autenticación corren en{' '}
              <strong>Supabase</strong>. El hosting es{' '}
              <strong>Vercel</strong>. Ambos pueden alojar datos en regiones de
              EE. UU. o la UE según la configuración del proyecto. Pickly no
              transfiere datos a otros terceros.
            </p>
          </Section>

          <Section title="Borrar una encuesta o tus respuestas">
            <p>
              Si creaste una encuesta, podés borrarla desde el menú (⋮) en la
              página de la encuesta. Eso elimina tanto la encuesta como todas
              las respuestas asociadas de la base de datos.
            </p>
            <p>
              Si querés que borremos una respuesta puntual o no podés acceder
              al borrado, escribinos a{' '}
              <a href="mailto:hola@letspicky.com" className="text-[var(--primary)] hover:underline">
                hola@letspicky.com
              </a>{' '}
              indicando el link de la encuesta.
            </p>
          </Section>

          <Section title="Encuestas que expiran solas">
            <p>
              Por diseño, las encuestas creadas en Pickly tienen una fecha de
              expiración. Pasados <strong>90 días</strong> desde su creación, la
              encuesta y sus respuestas se eliminan automáticamente de nuestra
              base de datos.
            </p>
          </Section>

          <Section title="Menores de edad">
            <p>
              Pickly no está dirigido a menores de 13 años. Si sos padre o tutor
              y creés que un menor a tu cargo nos envió datos personales,
              contactanos para borrarlos.
            </p>
          </Section>

          <Section title="Cambios a esta política">
            <p>
              Podemos actualizar este documento si la app cambia. La fecha de
              "última actualización" arriba refleja la versión vigente.
            </p>
          </Section>

          <Section title="Contacto">
            <p>
              Para cualquier consulta sobre privacidad o datos:{' '}
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
