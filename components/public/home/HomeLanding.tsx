import Image from "next/image";
import Link from "next/link";

import HomeFeaturedCourses from "./HomeFeaturedCourses";
import styles from "./HomeLanding.module.css";

/* =========================================================
   AFRISKILL AI — HOME LANDING
   ========================================================= */

const skills = [
  [
    "01",
    "IA & productivité",
    "Utilisez l’IA pour structurer vos idées et simplifier vos tâches quotidiennes.",
  ],
  [
    "02",
    "Création de contenu",
    "Passez de l’idée à des textes, des visuels et des contenus pour vos projets.",
  ],
  [
    "03",
    "Web & applications",
    "Explorez les outils pour construire et développer vos projets numériques.",
  ],
  [
    "04",
    "Automatisation",
    "Apprenez à relier vos outils et à rendre vos processus plus efficaces.",
  ],
] as const;

const steps = [
  [
    "01",
    "Trouvez votre formation",
    "Consultez le programme et choisissez la formation adaptée à votre objectif.",
  ],
  [
    "02",
    "Validez votre commande",
    "Choisissez votre formation et suivez les étapes du paiement en ligne.",
  ],
  [
    "03",
    "Passez à la pratique",
    "Après confirmation du paiement, accédez aux contenus et ressources de votre formation.",
  ],
] as const;

const questions = [
  [
    "Comment choisir ma formation ?",
    "Consultez la page de chaque formation pour découvrir son programme, sa description et les ressources prévues. Choisissez en fonction de votre objectif et des compétences que vous souhaitez développer.",
  ],
  [
    "Comment accéder aux contenus après mon achat ?",
    "Après confirmation de votre paiement, les informations d’accès aux contenus et ressources de la formation vous sont communiquées. Vérifiez l’adresse e-mail renseignée lors de votre commande.",
  ],
  [
    "Puis-je apprendre à mon rythme ?",
    "Les contenus sont accessibles en ligne. Vous pouvez organiser votre apprentissage selon vos disponibilités et avancer progressivement dans votre formation.",
  ],
] as const;

export default function HomeLanding() {
  return (
    <div className={styles.home}>
      {/* =====================================================
          HERO
          ===================================================== */}

      <section
        className={styles.hero}
        aria-labelledby="home-title"
      >
        <div className={styles.container}>
          <div className={styles.heroGrid}>
            {/* TEXTE HERO */}

            <div className={styles.heroCopy}>
              <p className={styles.eyebrow}>
                <span aria-hidden="true" />
                APPRENDRE. CRÉER. ALLER PLUS LOIN.
              </p>

              <h1 id="home-title">
                Faites de l’IA
                <br />
                votre prochaine
                <br />
                <em>compétence.</em>
              </h1>

              <p className={styles.intro}>
                Des formations pratiques pour maîtriser les
                outils d’intelligence artificielle et donner
                vie à vos projets numériques.
              </p>

              <div className={styles.actions}>
                <Link
                  className={styles.primary}
                  href="/formations"
                >
                  Explorer les formations

                  <span aria-hidden="true">
                    ↗
                  </span>
                </Link>

                <Link
                  className={styles.secondary}
                  href="#comment-ca-marche"
                >
                  Découvrir la méthode

                  <span aria-hidden="true">
                    →
                  </span>
                </Link>
              </div>

              <p className={styles.heroNote}>
                <span>À votre rythme</span>

                <span aria-hidden="true">
                  ·
                </span>

                <span>En ligne</span>

                <span aria-hidden="true">
                  ·
                </span>

                <span>Orienté pratique</span>
              </p>
            </div>

            {/* IMAGE HERO */}

            <div className={styles.visual}>
              <div className={styles.imageFrame}>
                <Image
                  src="/images/accueil.png"
                  alt="Un créateur explore les possibilités de l’intelligence artificielle avec AfriSkill AI"
                  width={1400}
                  height={1100}
                  sizes="(max-width: 600px) 100vw, (max-width: 900px) 90vw, 50vw"
                  priority
                  className={styles.heroImage}
                />
              </div>

              <div className={styles.visualCaption}>
                <span
                  className={styles.captionIcon}
                  aria-hidden="true"
                >
                  ✦
                </span>

                <div>
                  <strong>
                    Vos idées méritent de prendre vie.
                  </strong>

                  <span>
                    Apprenez les outils. Construisez vos projets.
                  </span>
                </div>
              </div>

              <span className={styles.visualLabel}>
                L’AVENIR S’APPREND AUJOURD’HUI
              </span>
            </div>
          </div>

          {/* =================================================
              TRUST BAR
              ================================================= */}

          <div className={styles.trust}>
            <div>
              <span aria-hidden="true">
                ↗
              </span>

              <p>
                <strong>
                  Des compétences concrètes
                </strong>

                <small>
                  Pour vos projets et votre activité
                </small>
              </p>
            </div>

            <div>
              <span aria-hidden="true">
                ◷
              </span>

              <p>
                <strong>
                  Votre rythme, vos objectifs
                </strong>

                <small>
                  Apprenez selon vos disponibilités
                </small>
              </p>
            </div>

            <div>
              <span aria-hidden="true">
                ▤
              </span>

              <p>
                <strong>
                  Des contenus accessibles en ligne
                </strong>

                <small>
                  Retrouvez les ressources de votre formation
                </small>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          FORMATIONS
          ===================================================== */}

      <HomeFeaturedCourses />

      {/* =====================================================
          COMPÉTENCES
          ===================================================== */}

      <section
        className={styles.skillsSection}
        aria-labelledby="skills-title"
      >
        <div className={styles.container}>
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.kicker}>
                DES COMPÉTENCES QUI FONT LA DIFFÉRENCE
              </p>

              <h2 id="skills-title">
                Apprenez aujourd’hui.
                <br />
                Créez de nouvelles possibilités.
              </h2>
            </div>

            <p>
              Choisissez un domaine qui vous inspire et
              développez des compétences utiles, un projet
              à la fois.
            </p>
          </div>

          <div className={styles.skillsGrid}>
            {skills.map(
              ([number, title, text]) => (
                <article
                  key={number}
                  className={styles.skill}
                >
                  <span className={styles.skillNumber}>
                    {number} /
                  </span>

                  <h3>
                    {title}
                  </h3>

                  <p>
                    {text}
                  </p>

                  <Link
                    href="/formations"
                    aria-label={`Explorer les formations : ${title}`}
                  >
                    Explorer le catalogue

                    <span aria-hidden="true">
                      ↗
                    </span>
                  </Link>
                </article>
              ),
            )}
          </div>
        </div>
      </section>

      {/* =====================================================
          COMMENT ÇA MARCHE
          ===================================================== */}

      <section
        id="comment-ca-marche"
        className={styles.method}
        aria-labelledby="method-title"
      >
        <div className={styles.container}>
          <div className={styles.centerHeading}>
            <p className={styles.kicker}>
              UN PARCOURS SIMPLE
            </p>

            <h2 id="method-title">
              De votre envie d’apprendre
              <br />
              à votre premier pas.
            </h2>

            <p>
              Choisissez. Apprenez. Mettez en pratique.
            </p>
          </div>

          <div className={styles.steps}>
            {steps.map(
              ([number, title, text]) => (
                <article key={number}>
                  <span>
                    {number}
                  </span>

                  <h3>
                    {title}
                  </h3>

                  <p>
                    {text}
                  </p>
                </article>
              ),
            )}
          </div>
        </div>
      </section>

      {/* =====================================================
          FAQ
          ===================================================== */}

      <section
        className={styles.faq}
        aria-labelledby="faq-title"
      >
        <div
          className={`${styles.container} ${styles.faqGrid}`}
        >
          <div>
            <p className={styles.kicker}>
              ON VOUS GUIDE
            </p>

            <h2 id="faq-title">
              Avant de
              <br />
              vous lancer.
            </h2>

            <p>
              Les réponses pour commencer votre
              apprentissage sereinement.
            </p>
          </div>

          <div>
            {questions.map(
              ([question, answer]) => (
                <details key={question}>
                  <summary>
                    {question}

                    <span aria-hidden="true">
                      +
                    </span>
                  </summary>

                  <p>
                    {answer}
                  </p>
                </details>
              ),
            )}
          </div>
        </div>
      </section>

      {/* =====================================================
          CTA FINAL
          ===================================================== */}

      <section
        className={styles.finalSection}
        aria-labelledby="final-title"
      >
        <div className={styles.container}>
          <div className={styles.finalBox}>
            <div>
              <p className={styles.eyebrow}>
                VOTRE PROCHAIN PROJET COMMENCE ICI
              </p>

              <h2 id="final-title">
                Une nouvelle compétence.
                <br />
                <em>
                  De nouvelles possibilités.
                </em>
              </h2>

              <p>
                Trouvez la formation qui vous donnera
                les outils pour avancer.
              </p>
            </div>

            <Link
              className={styles.primary}
              href="/formations"
            >
              Choisir ma formation

              <span aria-hidden="true">
                ↗
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* =====================================================
          FOOTER
          ===================================================== */}

      <footer className={styles.footer}>
        <div className={styles.container}>
          <Link
            href="/"
            className={styles.footerBrand}
            aria-label="AfriSkill AI - Accueil"
          >
            AfriSkill{" "}
            <span>
              AI
            </span>
          </Link>

          <p>
            Apprendre. Créer. Aller plus loin.
          </p>

          <Link href="/formations">
            Nos formations ↗
          </Link>
        </div>
      </footer>
    </div>
  );
}