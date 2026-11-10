"use client";
import { usePreferences } from "./Preferences";
import FAQ from "./FAQ";
export default function Home() {
  const { t } = usePreferences();
  return (
    <>
      <main id="conteudo">
        <section className="hero" id="inicio">
          <div className="container hero-grid">
            <div className="hero-copy">
              <span className="eyebrow">
                {t("SHOW ENGLISH • AO VIVO • CONVERSAÇÃO")}
              </span>

              <h1>
                {t("Você trava na hora de falar inglês?")}
                <span>{t("Aqui, você fala desde a primeira aula!")}</span>
              </h1>

              <a
                href="https://wa.me/5511967398084"
                target="_blank"
                rel="noopener"
                className="button button-whatsapp hero-whatsapp-button"
              >
                <img src="/assets/whatsapp1.png" alt="" aria-hidden="true" />
                {t("FALAR NO WHATSAPP")}
              </a>

              <div className="hero-buttons">
                <a href="#planos" className="button button-primary">
                  {t("PREÇOS ACESSÍVEIS")}
                </a>
                <a
                  href="#duvidas-frequentes"
                  className="button button-secondary"
                >
                  {t("DÚVIDAS FREQUENTES")}
                </a>
              </div>
            </div>

            <div className="hero-image-area">
              <div className="hero-image-frame explanation-hero-frame">
                <video
                  className="hero-image hero-video"
                  playsInline
                  controls
                  aria-label={t("Vídeo promocional do Show English")}
                >
                  <source src="/videos/explicacao.mp4" type="video/mp4" />
                  {t("Seu navegador não suporta vídeos em HTML5.")}
                </video>
                <div className="image-socials" aria-hidden="false">
                  <a
                    href="https://www.instagram.com/showenglishoficial/"
                    target="_blank"
                    rel="noopener"
                    aria-label="Instagram"
                    className="social-link"
                  >
                    <img src="/assets/instagram (2).png" alt="Instagram" />
                  </a>
                  <a
                    href="https://www.facebook.com/ShowEnglishOficial/"
                    target="_blank"
                    rel="noopener"
                    aria-label="Facebook"
                    className="social-link"
                  >
                    <img src="/assets/social.png" alt="Facebook" />
                  </a>
                  <a
                    href="https://www.tiktok.com/@showenglishoficial"
                    target="_blank"
                    rel="noopener"
                    aria-label="TikTok"
                    className="social-link"
                  >
                    <img src="/assets/tiktok (1).png" alt="TikTok" />
                  </a>
                  <a
                    href="https://youtube.com/@showenglishoficial"
                    target="_blank"
                    rel="noopener"
                    aria-label="YouTube"
                    className="social-link"
                  >
                    <img src="/assets/youtube.png" alt="YouTube" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          className="explanation-video-section"
          aria-label={t("Explicação do Show English")}
        >
          <div className="container">
            <div className="explanation-video-frame lidi-video-frame">
              <video
                className="explanation-video"
                controls
                preload="metadata"
                aria-label={t("Vídeo de explicação do Show English")}
              >
                <source
                  src="/videos/Nova Publi Lidi Lisboa e Vinny.mp4"
                  type="video/mp4"
                />
                {t("Seu navegador não suporta vídeos em HTML5.")}
              </video>
            </div>
            <a
              href="https://wa.me/5511967398084"
              target="_blank"
              rel="noopener"
              className="button button-whatsapp explanation-whatsapp-button"
            >
              <img src="/assets/whatsapp1.png" alt="" aria-hidden="true" />
              {t("Clique aqui e fale no Whatsapp!")}
            </a>
          </div>
        </section>

        <section className="transition-band" aria-label={t("Resumo do método")}>
          <div className="container transition-box">
            <div>
              <span className="section-label">
                {t("O QUE VAI MUDAR NA SUA VIDA")}
              </span>
              <h2>
                {t(
                  "Você aprende a falar inglês com clareza, segurança e prática real.",
                )}
              </h2>
            </div>
            <p>
              {t(
                "Sem medo de errar, sem aula chata e sem ficar travado na hora de falar.",
              )}
            </p>
          </div>
        </section>

        <section className="challenge-section" id="duvidas-frequentes">
          <div className="container">
            <div className="section-heading center">
              <span className="section-label">{t("DÚVIDAS FREQUENTES")}</span>
              <h2>
                {t("Antes de começar, veja as")}{" "}
                <span>{t("dúvidas mais comuns.")}</span>
              </h2>
              <p>
                {t(
                  "Respostas rápidas para você entender como funciona o Show English e começar com mais segurança.",
                )}
              </p>
            </div>

            <FAQ />

            <div className="challenge-cta">
              <p>
                {t(
                  "Ficou com alguma dúvida específica? Fale diretamente com a equipe do Show English.",
                )}
              </p>
              <a
                href="https://wa.me/5511967398084"
                target="_blank"
                rel="noopener"
                className="button button-whatsapp"
              >
                {t("FALAR NO WHATSAPP")}
              </a>
            </div>
          </div>
        </section>

        <section className="section" id="como-funciona">
          <div className="container">
            <div className="section-heading">
              <h2>{t("Aqui você vai falar inglês porque:")}</h2>
            </div>

            <div className="steps-grid">
              <article className="step-card">
                <span className="step-number">{t("01")}</span>
                <h3>{t("Aulas AO VIVO")}</h3>
                <p>
                  {t("Aulas divertidas e interativas de segunda a sábado.")}
                </p>
              </article>
              <article className="step-card">
                <span className="step-number">{t("02")}</span>
                <h3>{t("Interação real")}</h3>
                <p>
                  {t(
                    "O professor interage com o aluno para que ele fale inglês.",
                  )}
                </p>
              </article>
              <article className="step-card">
                <span className="step-number">{t("03")}</span>
                <h3>{t("Pronúncia")}</h3>
                <p>
                  {t(
                    "Técnicas exclusivas a partir do português para você pronunciar inglês!",
                  )}
                </p>
              </article>
              <article className="step-card">
                <span className="step-number">{t("04")}</span>
                <h3>{t("Música")}</h3>
                <p>{t("Para relaxar, aula com música na sexta-feira.")}</p>
              </article>
              <article className="step-card">
                <span className="step-number">{t("05")}</span>
                <h3>{t("Tire dúvidas")}</h3>
                <p>
                  {t("Revisão e plantão de dúvidas de 2 horas aos sábados.")}
                </p>
              </article>
            </div>
          </div>
        </section>

        <section className="schedule-section" id="programacao">
          <div className="container schedule-grid">
            <div className="schedule-intro">
              <span className="section-label light">{t("PROGRAMAÇÃO")}</span>
              <h2>{t("Inglês toda semana.")}</h2>
              <p>
                {t(
                  "Quanto mais contato você tem com o idioma, mais natural ele se torna.",
                )}
              </p>
            </div>

            <article className="schedule-card">
              <span className="schedule-day">{t("SEGUNDA A SEXTA")}</span>
              <strong className="schedule-time">{t("20h30")}</strong>
              <p>{t("Aulas ao vivo de inglês.")}</p>
              <span className="schedule-platform">{t("Google Meet")}</span>
            </article>

            <article className="schedule-card">
              <span className="schedule-day">{t("SÁBADO")}</span>
              <strong className="schedule-time">{t("14:30h")}</strong>
              <p>{t("Revisão e plantão tira-dúvidas.")}</p>
              <span className="schedule-platform">
                {t("Prática + revisão")}
              </span>
            </article>
          </div>
        </section>

        <section className="teacher-section" id="professor">
          <div className="container teacher-grid">
            <div className="teacher-photo-container">
              <img
                src="/assets/teachervinny.jpg"
                alt={t("Professor Show English")}
                className="teacher-photo"
              />
              <div className="teacher-photo-detail"></div>
              <div className="image-socials" aria-hidden="false">
                <a
                  href="https://www.instagram.com/showenglishoficial/"
                  target="_blank"
                  rel="noopener"
                  aria-label="Instagram"
                  className="social-link"
                >
                  <img src="/assets/instagram (2).png" alt="Instagram" />
                </a>
                <a
                  href="https://www.facebook.com/ShowEnglishOficial/"
                  target="_blank"
                  rel="noopener"
                  aria-label="Facebook"
                  className="social-link"
                >
                  <img src="/assets/social.png" alt="Facebook" />
                </a>
                <a
                  href="https://www.tiktok.com/@showenglishoficial"
                  target="_blank"
                  rel="noopener"
                  aria-label="TikTok"
                  className="social-link"
                >
                  <img src="/assets/tiktok (1).png" alt="TikTok" />
                </a>
                <a
                  href="https://youtube.com/@showenglishoficial"
                  target="_blank"
                  rel="noopener"
                  aria-label="YouTube"
                  className="social-link"
                >
                  <img src="/assets/youtube.png" alt="YouTube" />
                </a>
              </div>
            </div>

            <div className="teacher-content">
              <span className="section-label">{t("SEU PROFESSOR")}</span>
              <h2>{t("Teacher Vinny")}</h2>
              <p>
                {t(
                  "Vinny Puttini tem muita experiência com idiomas, como professor, tradutor e escritor.",
                )}
              </p>
              <p>
                {t(
                  "Formado em Linguística pela USP, tem mestrado em Educação e Cultura. Seu mentor em Nova York foi o jornalista Eugene Lambinus.",
                )}
              </p>

              <div className="teacher-features">
                <div>
                  <span>{t("✓")}</span>
                  {t("Foco em conversação")}
                </div>
                <div>
                  <span>{t("✓")}</span>
                  {t("Didática direta e acessível")}
                </div>
                <div>
                  <span>{t("✓")}</span>
                  {t("Acompanhamento nas aulas")}
                </div>
                <div>
                  <span>{t("✓")}</span>
                  {t("Inglês aplicado à vida real")}
                </div>
              </div>

              <a
                href="https://wa.me/5511967398084"
                target="_blank"
                rel="noopener"
                className="button button-primary"
              >
                {t("QUERO CONHECER O CURSO")}
              </a>
            </div>
          </div>
        </section>

        <section className="testimonials-section" id="depoimentos">
          <div className="container">
            <div className="section-heading center">
              <span className="section-label">{t("QUEM JÁ PARTICIPA")}</span>
              <h2>{t("Veja o que nossos alunos dizem.")}</h2>
            </div>

            <div className="video-testimonials">
              <article className="video-card">
                <div className="video-wrapper">
                  <video id="studentVideo" controls preload="auto">
                    <source
                      src="/videos/depoimentosawesome.mp4"
                      type="video/mp4"
                    />
                    {t("Seu navegador não suporta vídeo.")}
                  </video>
                </div>
                <div className="video-info">
                  <strong>{t("Alunos Show English")}</strong>
                  <span>{t("Experiência com as aulas")}</span>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section className="plans-section" id="planos">
          <div className="container">
            <div className="section-heading center">
              <span className="section-label">{t("ESCOLHA SEU PLANO")}</span>
              <h2>{t("FALE INGLÊS HOJE!!!")}</h2>
            </div>

            <div className="plans-grid">
              <article className="plan-card">
                <span className="plan-name">{t("PLANO MENSAL")}</span>
                <div className="plan-price">
                  <span>{t("R$")}</span>
                  <strong>{t("109")}</strong>
                  <small>{t(",00/mês")}</small>
                </div>
                <ul>
                  <li>{t("✓ Aulas ao vivo")}</li>
                  <li>{t("✓ Segunda a sexta")}</li>
                  <li>{t("✓ Google Meet")}</li>
                  <li>{t("✓ Material de apoio")}</li>
                  <li>{t("✓ Aulas gravadas")}</li>
                  <li>{t("✓ Plantão aos sábados")}</li>
                </ul>
                <a
                  href="https://wa.me/5511967398084"
                  className="button button-plan"
                  target="_blank"
                  rel="noopener"
                >
                  {t("QUERO O MENSAL")}
                </a>
              </article>

              <article className="plan-card featured">
                <span className="plan-badge">
                  {t("MELHOR CUSTO-BENEFÍCIO")}
                </span>
                <span className="plan-name">{t("PLANO TRIMESTRAL")}</span>
                <div className="plan-price">
                  <span>{t("R$")}</span>
                  <strong>{t("79")}</strong>
                  <small>{t(",00/mês")}</small>
                </div>
                <p className="plan-equivalent">
                  {t("valor mensal no plano trimestral")}
                </p>
                <ul>
                  <li>{t("✓ Aulas ao vivo")}</li>
                  <li>{t("✓ Segunda a sexta")}</li>
                  <li>{t("✓ Google Meet")}</li>
                  <li>{t("✓ Material de apoio")}</li>
                  <li>{t("✓ Aulas gravadas")}</li>
                  <li>{t("✓ Plantão aos sábados")}</li>
                </ul>
                <a
                  href="https://wa.me/5511967398084"
                  className="button button-primary"
                  target="_blank"
                  rel="noopener"
                >
                  {t("QUERO O TRIMESTRAL")}
                </a>
              </article>
            </div>
          </div>
        </section>

        <section className="youtube-section">
          <div className="container youtube-box">
            <div>
              <span className="section-label">
                {t("AULAS GRÁTIS NO YOUTUBE")}
              </span>
              <h2>{t("QUER AULAS AO VIVO GRÁTIS?")}</h2>
              <p>
                {t(
                  "Inscreva-se no canal e assista às aulas do Show English pelo tempo que quiser! Depois, matricule-se para ter aulas interativas, materiais e mentorias com nossos professores.",
                )}
              </p>
            </div>

            <a
              href="https://youtube.com/@showenglishoficial"
              target="_blank"
              rel="noopener"
              className="button button-youtube"
            >
              {t("▶ INSCREVA-SE NO CANAL")}
            </a>
          </div>
        </section>

        <section className="final-cta">
          <div className="container final-cta-content">
            <span>{t("SUA PRÓXIMA CONVERSA PODE SER EM INGLÊS.")}</span>
            <h2>{t("Com os nossos Teachers, você consegue!")}</h2>
            <a
              href="https://wa.me/5511967398084"
              target="_blank"
              rel="noopener"
              className="button button-whatsapp"
            >
              {t("CHAME AGORA NO WHATSAPP")}
            </a>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="container footer-simple">
          <div className="footer-brand">
            <img
              src="/assets/new-logo-show-english.png"
              alt="Show English"
              className="footer-logo"
            />
          </div>

          <p className="footer-copyright">
            {t("© Show English. Todos os direitos reservados.")}
          </p>

          <div
            className="footer-socials"
            aria-label={t("Redes sociais do Show English")}
          >
            <a
              href="https://www.instagram.com/showenglishoficial/"
              target="_blank"
              rel="noopener"
              aria-label="Instagram"
              className="social-link"
            >
              <img src="/assets/instagram (2).png" alt="Instagram" />
            </a>
            <a
              href="https://www.facebook.com/ShowEnglishOficial/"
              target="_blank"
              rel="noopener"
              aria-label="Facebook"
              className="social-link"
            >
              <img src="/assets/social.png" alt="Facebook" />
            </a>
            <a
              href="https://www.tiktok.com/@showenglishoficial"
              target="_blank"
              rel="noopener"
              aria-label="TikTok"
              className="social-link"
            >
              <img src="/assets/tiktok (1).png" alt="TikTok" />
            </a>
            <a
              href="https://youtube.com/@showenglishoficial"
              target="_blank"
              rel="noopener"
              aria-label="YouTube"
              className="social-link"
            >
              <img src="/assets/youtube.png" alt="YouTube" />
            </a>
          </div>
        </div>
      </footer>
    </>
  );
}
