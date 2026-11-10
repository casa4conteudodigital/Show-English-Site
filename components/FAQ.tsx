"use client";
import { useState } from "react";
import { questions } from "../lib/faq";
import { usePreferences } from "./Preferences";
export default function FAQ() {
  const [index, setIndex] = useState(0);
  const { t } = usePreferences();
  const q = questions[index];
  return (
    <div className="faq-react" aria-label={t("Dúvidas frequentes")}>
      <div aria-live="polite">
        <span className="carousel-category">{t(q.category)}</span>
        <h3>{t(q.question)}</h3>
        <p
          className="faq-answer"
          dangerouslySetInnerHTML={{ __html: t(q.answer) }}
        />
        <p>{t(q.prompt)}</p>
      </div>
      <div className="faq-controls">
        <button
          className="icon-button"
          aria-label={t("Dúvida anterior")}
          onClick={() =>
            setIndex((index + questions.length - 1) % questions.length)
          }
        >
          ←
        </button>
        <span>
          {index + 1} / {questions.length}
        </span>
        <button
          className="icon-button"
          aria-label={t("Próxima dúvida")}
          onClick={() => setIndex((index + 1) % questions.length)}
        >
          →
        </button>
      </div>
    </div>
  );
}
