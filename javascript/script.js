/* SHOW ENGLISH - SCRIPT.JS */

const frequentQuestions = [
  {
    category: "COMEÇANDO DO ZERO",
    question: "Posso fazer o curso mesmo sem saber nada de inglês?",
    answer: "O curso é pensado para quem não sabe nada, para quem já sabe um pouco e para quem se atrapalha na hora de falar!",
    prompt: "Você começa do seu nível e evolui com prática constante."
  },
  {
    category: "CONVERSAÇÃO",
    question: "Eu vou falar inglês desde o início?",
    answer: `Vai sim! Olhe como:<br><br>Primeiro o texto <b>"Rice or beans?"</b><br>Depois a pronúncia <b>"Ráis ór bíns?"</b><br>E depois a tradução <b>"Arroz ou feijão?"</b><br><br>Tudo AO VIVO com o professor!`,
    prompt: "Texto + pronúncia + tradução para facilitar a fala desde o início."
  },
  {
    category: "PRONÚNCIA",
    question: "E se eu tiver vergonha ou dificuldade para pronunciar?",
    answer: "Você recebe orientação de pronúncia com técnicas que partem do português para facilitar os sons do inglês.",
    prompt: "Você pratica sem pressão com ajuda do professor."
  },
  {
    category: "AULAS AO VIVO",
    question: "Quanto tempo dura cada aula?",
    answer: "As aulas de segunda a sexta duram 30 minutos, com uma super revisão e plantão de dúvidas de 2 horas aos sábados.",
    prompt: "Uma rotina dinâmica a cada dia da semana e revisão completa  no sábado."
  },
  {
    category: "FALTOU À AULA?",
    question: "O que acontece se eu perder uma aula?",
    answer: "A aula da semana é um tema que é desenvolvido em todas as aulas, o mesmo. O tema só muda de uma semana pra outra, de qualquer maneira, todas as aulas são gravadas e ficam disponíveis no Youtube.",
    prompt: "Você pode rever o conteúdo sempre que precisar."
  },
  {
    category: "MÉTODO",
    question: "Qual o método do curso?",
    answer: "O método é simples, fácil e divertido: você assiste ao vídeo, repete as frases, pratica perguntas e respostas e, com o professor, cria suas próprias frases em conversação.",
    prompt: "Prática, repetição e conversação desde a primeira aula."
  },
  {
    category: "SEXTA-FEIRA",
    question: "Tem alguma aula diferente durante a semana?",
    answer: "Tem sim, aulas com músicas, com teatro e cenas de filmes e séries às sextas-feiras.",
    prompt: "Uma sexta-feira mais leve, divertida e dinâmica."
  },
  {
    category: "MATERIAL",
    question: "O curso oferece material de apoio?",
    answer: "Sim! Você acessa as aulas gravadas, o vídeo, os pdf's e lições e vídeos no Whatsapp.",
    prompt: "Conteúdo para praticar fora da aula."
  },
  {
    category: "PREÇOS ACESSÍVEIS",
    question: "Um curso tão bom assim é caro?",
    answer: `Nosso curso foi pensado para ter um preço muito abaixo do mercado e manter a qualidade das melhores escolas de idiomas. Confira na nossa sessão <a href="#planos">"Preços acessíveis"</a>.`,
    prompt: "Veja os planos e escolha a opção que cabe no seu orçamento."
  },
  {
    category: "AULAS GRÁTIS",
    question: "Posso conhecer o Show English antes de me matricular?",
    answer: "Sim. Você pode assistir às aulas ao vivo gratuitas no YouTube e conhecer a metodologia antes de entrar no curso interativo até quando quiser!",
    prompt: "Conheça a metodologia antes de se matricular."
  }
];

function gtag_report_conversion(url) {
  if (typeof window.gtag !== 'function') return false;

  const callback = function () {
    if (typeof url !== 'undefined' && url) {
      window.open(url, '_blank', 'noopener');
    }
  };

  window.gtag('event', 'conversion', {
    'send_to': 'AW-17833711571/LuSZCOnmluocENOv47dC',
    'event_callback': callback
  });

  return false;
}

const whatsappLinks = document.querySelectorAll('a[href*="wa.me"], a[href*="wa.link"], a[href*="api.whatsapp.com"]');
whatsappLinks.forEach(link => {
  link.addEventListener('click', function (event) {
    event.preventDefault();
    const url = link.getAttribute('href');
    gtag_report_conversion(url);
  }, { passive: false });
});

const carouselTrack = document.getElementById("carouselTrack");
const carouselDots = document.getElementById("carouselDots");
const carouselPrev = document.getElementById("carouselPrev");
const carouselNext = document.getElementById("carouselNext");
const carousel = document.getElementById("faqCarousel");

let currentSlide = 0;
let autoplayTimer;

function createCarouselSlides() {
  frequentQuestions.forEach((item, index) => {
    const slide = document.createElement("article");
    slide.className = "carousel-slide";
    slide.innerHTML = `
      <span class="carousel-category">${item.category}</span>
      <div class="carousel-question">${item.question}</div>
      <strong class="carousel-answer">${item.answer}</strong>
      <div class="carousel-prompt">${item.prompt}</div>
    `;
    carouselTrack.appendChild(slide);

    const dot = document.createElement("button");
    dot.className = "carousel-dot";
    dot.setAttribute("aria-label", `Ir para dúvida ${index + 1}`);
    dot.addEventListener("click", () => {
      goToSlide(index);
      restartAutoplay();
    });
    carouselDots.appendChild(dot);
  });

  updateCarousel();
}

function updateCarousel() {
  carouselTrack.style.transform = `translateX(-${currentSlide * 100}%)`;
  document.querySelectorAll(".carousel-dot").forEach((dot, index) => {
    dot.classList.toggle("active", index === currentSlide);
  });
}

function goToSlide(index) {
  currentSlide = index;
  if (currentSlide >= frequentQuestions.length) currentSlide = 0;
  if (currentSlide < 0) currentSlide = frequentQuestions.length - 1;
  updateCarousel();
}

function nextSlide() { goToSlide(currentSlide + 1); }
function previousSlide() { goToSlide(currentSlide - 1); }

function startAutoplay() {
  stopAutoplay();
  autoplayTimer = setInterval(nextSlide, 6500);
}

function stopAutoplay() {
  if (autoplayTimer) clearInterval(autoplayTimer);
}

function restartAutoplay() { startAutoplay(); }

carouselNext.addEventListener("click", () => {
  nextSlide();
  restartAutoplay();
});

carouselPrev.addEventListener("click", () => {
  previousSlide();
  restartAutoplay();
});

carousel.addEventListener("mouseenter", stopAutoplay);
carousel.addEventListener("mouseleave", startAutoplay);

let touchStartX = 0;
let touchEndX = 0;

carousel.addEventListener("touchstart", event => {
  touchStartX = event.changedTouches[0].screenX;
}, { passive: true });

carousel.addEventListener("touchend", event => {
  touchEndX = event.changedTouches[0].screenX;
  handleSwipe();
}, { passive: true });

function handleSwipe() {
  const difference = touchStartX - touchEndX;
  if (Math.abs(difference) < 50) return;
  if (difference > 0) nextSlide();
  else previousSlide();
  restartAutoplay();
}

document.addEventListener("keydown", event => {
  if (event.key === "ArrowRight") {
    nextSlide();
    restartAutoplay();
  }
  if (event.key === "ArrowLeft") {
    previousSlide();
    restartAutoplay();
  }
});

const mobileMenuButton = document.getElementById("mobileMenuButton");
const mainNav = document.getElementById("mainNav");
const studentVideo = document.getElementById("studentVideo");
const studentVideoCover = document.querySelector(".video-cover");

if (studentVideo && studentVideoCover) {
  const hideVideoCover = () => {
    studentVideoCover.classList.add("hidden");
  };

  const showVideoCover = () => {
    studentVideoCover.classList.remove("hidden");
  };

  studentVideoCover.addEventListener("click", async () => {
    hideVideoCover();
    studentVideo.muted = false;
    try {
      await studentVideo.play();
    } catch (error) {
      console.warn("Não foi possível iniciar o vídeo ao clicar na capa:", error);
      showVideoCover();
    }
  });

  studentVideo.addEventListener("play", hideVideoCover);
  studentVideo.addEventListener("pause", () => {
    if (studentVideo.ended) {
      showVideoCover();
    }
  });
  studentVideo.addEventListener("ended", showVideoCover);
}

mobileMenuButton.addEventListener("click", () => {
  const active = mainNav.classList.toggle("active");
  mobileMenuButton.setAttribute("aria-expanded", String(active));
});

mainNav.querySelectorAll("a").forEach(link => {
  link.addEventListener("click", () => {
    mainNav.classList.remove("active");
    mobileMenuButton.setAttribute("aria-expanded", "false");
  });
});

createCarouselSlides();
startAutoplay();
