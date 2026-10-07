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
const CENTER_NAME = "AM Clinic";
const CITY_NAME = "Torcy";

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

const highlights = [
  {
    title: "1 zone achetée = 1 offerte",
    text: "Vous payez une zone, la seconde est offerte. Offre valable en octobre, places limitées.",
  },
  {
    title: "Aisselles à 9€",
    text: "Testez le laser dès la première séance aisselles, à 9€ seulement.",
  },
  {
    title: "Résultat durable",
    text: "Moins de poils, moins de rasage, peau plus nette séance après séance.",
  },
  {
    title: "On vous rappelle",
    text: "Laissez vos coordonnées, l’équipe AM Clinic à Torcy bloque votre offre.",
  },
];

const faq = [
  {
    question: "1 zone achetée = 1 zone offerte, c’est vrai ?",
    answer:
      "Oui. Pour une zone achetée, une seconde zone vous est offerte. Le détail est validé au centre, selon les zones choisies. Offre octobre, quantité limitée.",
  },
  {
    question: "La première séance aisselles est-elle vraiment à 9€ ?",
    answer:
      "Oui. Vous pouvez tester le laser sur les aisselles dès la première séance, à 9€.",
  },
  {
    question: "Puis-je combiner le 1+1 et les aisselles à 9€ ?",
    answer:
      "Oui. L’offre octobre associe le 1 zone achetée = 1 zone offerte et la première séance aisselles à 9€. On vous confirme les zones au rappel.",
  },
  {
    question: "Combien de séances faut-il prévoir ?",
    answer:
      "Cela dépend de la zone, de la peau et du poil. Le premier rendez-vous sert à estimer le protocole adapté.",
  },
  {
    question: "L’offre est-elle limitée ?",
    answer:
      "Oui. C’est l’offre octobre. Quantité limitée à ce tarif.",
  },
];

const beforeAfter = [
  {
    area: "Aisselles",
    result: "Moins de poils, peau plus nette",
    src: "/before-after-aisselles.jpg",
  },
  {
    area: "Irritations",
    result: "Fini les poils incarnés du rasage",
    src: "/before-after-irritations.jpg",
  },
  {
    area: "Jambe",
    result: "Routine rasage fortement réduite",
    src: "/before-after-jambe.jpg",
  },
  {
    area: "Dos",
    result: "Réduction visible sur grande zone",
    src: "/before-after-dos.jpg",
  },
  {
    area: "Aisselles",
    result: "Zone plus propre, plus homogène",
    src: "/before-after-epaules.jpg",
  },
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
      content_name: "Tunnel laser AM Clinic",
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
      offer: "1 zone achetée = 1 zone offerte + première séance aisselles 9€",
      page: `Laser ${CENTER_NAME} ${CITY_NAME}`,
      source: "am-clinic-torcy-laser",
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
      track("Lead", {
        content_name: "1+1 laser + aisselles 9€",
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
      <header className="site-header" aria-label="AM Clinic">
        <img
          alt="AM Esthetic Clinic"
          className="brand-logo"
          src="/am-clinic-logo.png"
        />
      </header>

      <section className="hero-section" aria-labelledby="page-title">
        <div className="hero-copy">
          <p className="eyebrow">Quantité limitée</p>
          <h1 id="page-title">1 zone achetée = 1 zone offerte</h1>
          <p className="hero-subtitle">1ère séance aisselles 9€</p>
        </div>

        <div
          className="before-after-carousel"
          aria-label="Avant après épilation laser"
        >
          <div className="before-after-track">
            {[...beforeAfter, ...beforeAfter].map((item, index) => (
              <article
                className="before-after-card"
                key={`${item.area}-${index}`}
              >
                <div className="photo-pair">
                  <img
                    alt={`Avant après épilation laser - ${item.area}`}
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
            <p className="offer-ready">Votre offre</p>
            <p className="step-label">2 étapes pour bloquer le tarif</p>
            <h2 id="zone-question">Quelle(s) zone(s) voulez-vous traiter ?</h2>
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
            Je profite de l&apos;offre
          </button>
          <p className="offer-limit">Quantité limitée à ce tarif</p>
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
          <p className="offer-ready">Dernière étape pour le 1+1 et les 9€</p>
          <p className="step-label">On vous rappelle pour bloquer l’offre</p>
          <h2 id="form-title">
            Vos coordonnées pour 1 zone achetée = 1 offerte + aisselles à 9€.
          </h2>

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
              Email (optionnel)
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
              {isSubmitting ? "Envoi en cours..." : "Je profite de l'offre"}
            </button>
            <p className="offer-limit">Quantité limitée à ce tarif</p>
          </form>
        </section>
      )}

      {step === "thanks" && (
        <section className="thanks-panel" aria-labelledby="thanks-title">
          <p className="step-label">Demande reçue</p>
          <h2 id="thanks-title">Merci, votre offre est bien demandée.</h2>
          <p>
            L&apos;équipe AM Clinic à Torcy vous rappelle rapidement pour
            confirmer le 1 zone achetée = 1 zone offerte et la première séance
            aisselles à 9€.
          </p>
        </section>
      )}

      <section className="proof-section" aria-labelledby="offer-title">
        <h2 id="offer-title">Pourquoi ça vaut le coup maintenant</h2>
        <p className="idiag-text">
          Offre octobre uniquement : vous doublez une zone, et vous testez le
          laser dès 9€ sur les aisselles.
        </p>
        <div className="tech-grid">
          {highlights.map((item) => (
            <article className="tech-card" key={item.title}>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
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
