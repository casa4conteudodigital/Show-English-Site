"use client";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { questions } from "../lib/faq";
import { usePreferences } from "./Preferences";
export default function FAQ() {
  const [index, setIndex] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [restart, setRestart] = useState(0);
  const { t, settings } = usePreferences();
  useEffect(() => {
    if (settings.motion || hovered) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % questions.length);
    }, 6500);
    return () => window.clearInterval(timer);
  }, [hovered, restart, settings.motion]);
  return (
    <div
      className="faq-react"
      aria-label={t("Dúvidas frequentes")}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="carousel-window">
        <div
          className="carousel-track"
          style={{ transform: `translateX(-${index * 100}%)` }}
          aria-live="off"
        >
          {questions.map((question) => (
            <article className="carousel-slide" key={question.question}>
              <span className="carousel-category">{t(question.category)}</span>
              <h3 className="carousel-question">{t(question.question)}</h3>
              <div
                className="carousel-answer"
                dangerouslySetInnerHTML={{ __html: t(question.answer) }}
              />
              <p className="carousel-prompt">{t(question.prompt)}</p>
            </article>
          ))}
        </div>
      </div>
      <button
        className="carousel-arrow carousel-prev"
        type="button"
        aria-label={t("Dúvida anterior")}
        onClick={() => {
          setIndex((current) => (current + questions.length - 1) % questions.length)
          setRestart((current) => current + 1);
        }}
      >
        <ChevronLeft size={25} aria-hidden="true" />
      </button>
      <button
        className="carousel-arrow carousel-next"
        type="button"
        aria-label={t("Próxima dúvida")}
        onClick={() => {
          setIndex((current) => (current + 1) % questions.length);
          setRestart((current) => current + 1);
        }}
      >
        <ChevronRight size={25} aria-hidden="true" />
      </button>
      <div className="carousel-dots" aria-label={t("Dúvidas frequentes")}>
        {questions.map((question, slideIndex) => (
          <button
            className={index === slideIndex ? "carousel-dot active" : "carousel-dot"}
            type="button"
            key={question.question}
            aria-label={`${slideIndex + 1} / ${questions.length}`}
            aria-current={index === slideIndex ? "true" : undefined}
            onClick={() => {
              setIndex(slideIndex);
              setRestart((current) => current + 1);
            }}
          />
        ))}
      </div>
      <div className="faq-controls">
        <span>
          {index + 1} / {questions.length}
        </span>
      </div>
    </div>
  );
}
