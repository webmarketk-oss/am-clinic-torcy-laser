"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    _fbq?: unknown;
  }
}

const LEAD_WEBHOOK_URL = process.env.NEXT_PUBLIC_LEAD_WEBHOOK_URL;
const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;
const CENTER_NAME = process.env.NEXT_PUBLIC_CENTER_NAME || "Dépil Tech";
const CITY_NAME = process.env.NEXT_PUBLIC_CITY_NAME || "Marseille 6";

const zones = [
  "Aisselles",
  "Maillot",
  "Jambes complètes",
  "Demi-jambes",
  "Bras",
  "Visage",
  "Dos / torse",
  "Plusieurs zones",
];

const faq = [
  {
    question: "Le test est-il vraiment offert ?",
    answer:
      "Oui. Le test permet de vérifier la réaction de la peau avant de démarrer un protocole complet.",
  },
  {
    question: "Combien de séances faut-il prévoir ?",
    answer:
      "Cela dépend de la zone, du type de peau et du poil. Le bilan sert justement à estimer le protocole adapté.",
  },
  {
    question: "Puis-je traiter plusieurs zones ?",
    answer:
      "Oui, vous pouvez cocher plusieurs zones. L'équipe vous proposera ensuite l'offre la plus adaptée.",
  },
  {
    question: "L'épilation définitive convient-elle à tout le monde ?",
    answer:
      "Certaines situations demandent un avis préalable. Le bilan permet de vérifier les indications et contre-indications.",
  },
];

const beforeAfter = [
  {
    area: "Irritations",
    result: "Peau plus nette après protocole",
    src: "/before-after-irritations.jpg",
  },
  {
    area: "Aisselles",
    result: "Moins de poils visibles au quotidien",
    src: "/before-after-aisselles.jpg",
  },
  {
    area: "Dos",
    result: "Réduction visible sur grande zone",
    src: "/before-after-dos.jpg",
  },
  {
    area: "Aisselles",
    result: "Zone plus propre et plus homogène",
    src: "/before-after-epaules.jpg",
  },
  {
    area: "Jambe",
    result: "Routine rasage fortement réduite",
    src: "/before-after-jambe.jpg",
  },
];

const reviewFrames = [
  { name: "Melanie Sauze", src: "/review-melanie-sauze.jpg" },
  { name: "Samuel Gomes", src: "/review-samuel-gomes.jpg" },
  { name: "Kenza Kenza", src: "/review-kenza-kenza.jpg" },
];

function track(eventName: string, params?: Record<string, unknown>) {
  window.fbq?.("track", eventName, params);
}

function getTrackingParams() {
  if (typeof window === "undefined") return {};
  const params = new URLSearchParams(window.location.search);
  return {
    utm_source: params.get("utm_source") ?? "",
    utm_medium: params.get("utm_medium") ?? "",
    utm_campaign: params.get("utm_campaign") ?? "",
    utm_content: params.get("utm_content") ?? "",
    utm_term: params.get("utm_term") ?? "",
    fbclid: params.get("fbclid") ?? "",
    meta_campaign_id: params.get("campaign_id") ?? "",
    meta_adset_id: params.get("adset_id") ?? "",
    meta_ad_id: params.get("ad_id") ?? "",
  };
}

export default function Home() {
  const [selectedZones, setSelectedZones] = useState<string[]>([]);
  const [step, setStep] = useState<"intro" | "form" | "thanks">("intro");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [messageOptIn, setMessageOptIn] = useState("oui");
  const trackingParams = useMemo(getTrackingParams, []);

  useEffect(() => {
    if (!META_PIXEL_ID || typeof window === "undefined" || window.fbq) return;

    const fbq = function (...args: unknown[]) {
      (
        fbq as unknown as {
          callMethod?: (...items: unknown[]) => void;
          queue: unknown[];
        }
      ).callMethod
        ? (
            fbq as unknown as { callMethod: (...items: unknown[]) => void }
          ).callMethod(...args)
        : (fbq as unknown as { queue: unknown[] }).queue.push(args);
    } as Window["fbq"] & { queue: unknown[]; loaded: boolean; version: string };

    fbq.queue = [];
    fbq.loaded = true;
    fbq.version = "2.0";
    window.fbq = fbq;
    window._fbq = fbq;

    const script = document.createElement("script");
    script.async = true;
    script.src = "https://connect.facebook.net/en_US/fbevents.js";
    document.head.appendChild(script);
    window.fbq("init", META_PIXEL_ID);
    track("PageView");
    track("ViewContent", {
      center: CITY_NAME,
      content_name: "Tunnel épilation définitive Dépil Tech",
    });
  }, []);

  function toggleZone(zone: string) {
    setSelectedZones((current) =>
      current.includes(zone)
        ? current.filter((item) => item !== zone)
        : [...current, zone],
    );
  }

  function openForm() {
    if (selectedZones.length === 0) return;
    track("CustomizeProduct", { center: CITY_NAME, zones: selectedZones });
    setStep("form");
  }

  async function submitLead(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const payload = {
      full_name: String(data.get("full_name") ?? ""),
      phone: String(data.get("phone") ?? ""),
      email: String(data.get("email") ?? ""),
      message_opt_in: messageOptIn,
      zones: selectedZones,
      center: CITY_NAME,
      center_display_name: `${CENTER_NAME} ${CITY_NAME}`,
      offer: "Bilan laser offert + test offert + jusqu'à -30%",
      page: `Épilation définitive ${CENTER_NAME} ${CITY_NAME}`,
      source: "depil-tech-marseille-6",
      submitted_at: new Date().toISOString(),
      page_url: typeof window !== "undefined" ? window.location.href : "",
      ...trackingParams,
    };

    setIsSubmitting(true);
    try {
      if (LEAD_WEBHOOK_URL) {
        await fetch(LEAD_WEBHOOK_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      const nameParts = payload.full_name.trim().split(/\s+/).filter(Boolean);
      const prenom = nameParts[0] ?? "";
      const nom = nameParts.slice(1).join(" ");
      try {
        await fetch(
          "https://www.bookeai.fr/api/leads?center=depil-tech-marseille-6-prefecture&source=landing",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              first_name: prenom,
              last_name: nom,
              email: payload.email,
              phone: payload.phone,
              offre: "Épilation laser Marseille 6",
              commentaire: `Zones à traiter : ${selectedZones.join(", ") || "non précisé"}`,
            }),
          },
        );
      } catch {
        // Bookea ne doit pas bloquer la demande Marseille 6.
      }

      track("Lead", {
        content_name: "Bilan laser offert",
        center: CITY_NAME,
        zones: selectedZones.join(", "),
      });
      setStep("thanks");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="site-shell">
      <header className="site-header" aria-label="Dépil Tech">
        <img
          alt="Dépil Tech"
          className="brand-logo"
          src="/depil-tech-logo.png"
        />
      </header>

      <section className="hero-section" aria-labelledby="page-title">
        <div className="hero-copy">
          <p className="eyebrow">Jusqu&apos;à -30% cette semaine</p>
          <h1 id="page-title">2 étapes pour demander votre offre</h1>
          <p className="hero-subtitle">Test offert avant de commencer</p>
          <p className="hero-city">Marseille 6</p>
          <div className="trust-row" aria-label="Éléments de confiance">
            <span>Test offert</span>
            <span>Jusqu&apos;à -30%</span>
            <span>Bilan personnalisé</span>
            <span>Réponse rapide</span>
          </div>
        </div>

        <div
          className="before-after-carousel"
          aria-label="Avant après épilation définitive"
        >
          <div className="before-after-track">
            {[...beforeAfter, ...beforeAfter].map((item, index) => (
              <article
                className="before-after-card"
                key={`${item.area}-${index}`}
              >
                <div className="photo-pair">
                  <img
                    alt={`Avant après épilation définitive - ${item.area}`}
                    decoding="async"
                    fetchPriority={index === 0 ? "high" : "auto"}
                    height={465}
                    loading={index === 0 ? "eager" : "lazy"}
                    src={item.src}
                    width={720}
                  />
                  <span className="before-badge">Avant</span>
                  <span className="after-badge">Après</span>
                </div>
                <strong>{item.area}</strong>
                <p>{item.result}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {step === "intro" && (
        <section className="quiz-panel" aria-labelledby="zone-question">
          <div>
            <p className="offer-ready">Votre offre est presque prête</p>
            <p className="step-label">
              2 étapes pour demander votre séance TEST OFFERTE et votre offre
              jusqu&apos;à -30%
            </p>
            <h2 id="zone-question">Quelle(s) zone(s) souhaitez-vous traiter ?</h2>
            <p className="helper-text">
              Vous pouvez cocher plusieurs zones si vous souhaitez une offre
              groupée.
            </p>
          </div>

          <div className="zone-grid">
            {zones.map((zone) => {
              const isSelected = selectedZones.includes(zone);
              return (
                <button
                  aria-pressed={isSelected}
                  className={`zone-option ${isSelected ? "selected" : ""}`}
                  key={zone}
                  onClick={() => toggleZone(zone)}
                  type="button"
                >
                  <span className="checkmark" aria-hidden="true">
                    {isSelected ? "✓" : ""}
                  </span>
                  {zone}
                </button>
              );
            })}
          </div>

          <button
            className="primary-action"
            disabled={selectedZones.length === 0}
            onClick={openForm}
            type="button"
          >
            Voir mon offre
          </button>
        </section>
      )}

      {step === "form" && (
        <section className="form-panel" aria-labelledby="form-title">
          <button
            className="back-button"
            onClick={() => setStep("intro")}
            type="button"
          >
            Retour
          </button>
          <p className="offer-ready">Votre offre est presque prête</p>
          <p className="step-label">Dernière étape</p>
          <h2 id="form-title">
            Remplissez vos coordonnées pour accéder à votre offre jusqu&apos;à
            -30%.
          </h2>
          <p className="helper-text">
            Zone(s) à traiter : {selectedZones.join(", ")}
          </p>

          <form className="lead-form" onSubmit={submitLead}>
            <label>
              Prénom et nom
              <input name="full_name" placeholder="Votre nom complet" required />
            </label>
            <label>
              Téléphone
              <input
                inputMode="tel"
                name="phone"
                placeholder="06 00 00 00 00"
                required
                type="tel"
              />
            </label>
            <label>
              Email
              <input
                inputMode="email"
                name="email"
                placeholder="vous@email.com"
                type="email"
              />
            </label>

            <fieldset className="message-consent">
              <legend>
                Pouvons-nous vous contacter par message pour valider votre
                offre ?
              </legend>
              <label>
                <input
                  checked={messageOptIn === "oui"}
                  name="message_opt_in"
                  onChange={() => setMessageOptIn("oui")}
                  type="radio"
                  value="oui"
                />
                Oui
              </label>
              <label>
                <input
                  checked={messageOptIn === "non"}
                  name="message_opt_in"
                  onChange={() => setMessageOptIn("non")}
                  type="radio"
                  value="non"
                />
                Non
              </label>
            </fieldset>

            <button
              className="primary-action"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? "Envoi en cours..." : "Je profite de mon offre"}
            </button>
          </form>
        </section>
      )}

      {step === "thanks" && (
        <section className="thanks-panel" aria-labelledby="thanks-title">
          <p className="step-label">Demande reçue</p>
          <h2 id="thanks-title">Merci, votre demande est bien prise en compte.</h2>
          <p>
            Une personne de l&apos;équipe Dépil Tech à Marseille 6 vous
            contactera rapidement pour valider votre offre et confirmer votre
            créneau.
          </p>
        </section>
      )}

      <section className="proof-section" aria-labelledby="proof-title">
        <h2 id="proof-title">Ce que nos clients disent de nous</h2>
        <div className="review-grid">
          {reviewFrames.map((review) => (
            <figure className="review-frame" key={review.name}>
              <img
                alt={`Avis Google de ${review.name}`}
                decoding="async"
                height={270}
                loading="lazy"
                src={review.src}
                width={760}
              />
              <figcaption>Avis Google vérifié</figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="faq-section" aria-labelledby="faq-title">
        <h2 id="faq-title">Questions fréquentes</h2>
        <div className="faq-list">
          {faq.map((item) => (
            <details key={item.question}>
              <summary>{item.question}</summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </div>
      </section>
    </main>
  );
}

