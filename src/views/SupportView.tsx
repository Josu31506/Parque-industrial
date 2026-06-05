import { useState } from 'react';
import styles from './SupportView.module.css';

const faqs = [
  {
    question: 'Como realizo un pedido?',
    answer: 'Elige un producto, agregalo al carrito e inicia sesion para confirmar la compra simulada.',
  },
  {
    question: 'Como hago seguimiento a mi pedido?',
    answer: 'Entra a Mis pedidos y presiona Ver seguimiento para revisar el estado actual.',
  },
  {
    question: 'Que pasa si mi producto llega con danos?',
    answer: 'Comunicate con soporte para registrar el caso y coordinar la revision con la productora.',
  },
  {
    question: 'Puedo cambiar o devolver un producto?',
    answer: 'Si el producto no corresponde a lo solicitado, soporte te orientara con los pasos de cambio o devolucion.',
  },
  {
    question: 'Como contacto a una productora?',
    answer: 'Desde el detalle del producto puedes abrir el perfil de la productora asociada.',
  },
  {
    question: 'Que significa que un producto sea sostenible?',
    answer: 'Indica que usa materiales responsables, procesos de bajo impacto o reutilizacion de recursos.',
  },
];

export default function SupportView() {
  const [openQuestion, setOpenQuestion] = useState(faqs[0].question);

  return (
    <main className={styles.page}>
      <section className={`${styles.content} container`}>
        <div className={styles.heading}>
          <h1>Atencion al cliente</h1>
          <p>Estamos aqui para ayudarte antes, durante y despues de tu compra.</p>
        </div>

        <div className={styles.grid}>
          <section className={styles.card}>
            <h2>Preguntas frecuentes</h2>
            <div className={styles.faqList}>
              {faqs.map((faq) => {
                const isOpen = openQuestion === faq.question;

                return (
                  <article className={styles.faqItem} key={faq.question}>
                    <button
                      type="button"
                      onClick={() => setOpenQuestion(isOpen ? '' : faq.question)}
                      aria-expanded={isOpen}
                    >
                      <span>{faq.question}</span>
                      <strong>{isOpen ? '−' : '+'}</strong>
                    </button>
                    {isOpen && <p>{faq.answer}</p>}
                  </article>
                );
              })}
            </div>
          </section>

          <aside className={styles.side}>
            <section className={styles.card}>
              <h2>Cambios y devoluciones</h2>
              <p>
                Si tu producto presenta problemas o no corresponde a lo solicitado,
                comunicate con soporte para revisar el caso y coordinar los siguientes pasos.
              </p>
            </section>

            <section className={styles.card}>
              <h2>Garantia</h2>
              <p>
                Los productos cuentan con respaldo del productor. La plataforma busca
                asegurar una compra clara, confiable y bien acompanada.
              </p>
            </section>

            <section className={styles.card}>
              <h2>Contacto</h2>
              <div className={styles.contactRows}>
                <span>soporte@parqueindustrial.pe</span>
                <span>Lunes a sabado, 9:00 a.m. - 6:00 p.m.</span>
              </div>
              <button className="primaryButton" type="button">
                Enviar consulta
              </button>
            </section>
          </aside>
        </div>
      </section>
    </main>
  );
}
