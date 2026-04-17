document.querySelectorAll(".activity-card, .button, .nav-chip").forEach((item) => {
  item.addEventListener("pointerdown", () => {
    item.style.transform = "scale(0.96)";
  });

  const reset = () => {
    item.style.transform = "";
  };

  item.addEventListener("pointerup", reset);
  item.addEventListener("pointerleave", reset);
  item.addEventListener("pointercancel", reset);
});

// Audio labels — speak card title on tap (touch-first devices)
if ("speechSynthesis" in window) {
  document.querySelectorAll(".activity-card").forEach((card) => {
    card.addEventListener("pointerdown", (e) => {
      if (e.pointerType !== "touch") return;
      const titleEl = card.querySelector(".card-title");
      if (!titleEl) return;
      const title = titleEl.textContent.trim();
      if (!title) return;
      window.speechSynthesis.cancel();
      const utt = new SpeechSynthesisUtterance(title);
      utt.rate = 0.9;
      utt.pitch = 1.2;
      utt.volume = 1;
      window.speechSynthesis.speak(utt);
    });
  });
}

// ── Pirouette first-launch experience ─────────────────
if (document.body.classList.contains("page-home")) {
  const overlay     = document.getElementById("meetPirouette");
  const step1       = document.getElementById("mpStep1");
  const step2       = document.getElementById("mpStep2");
  const step3       = document.getElementById("mpStep3");
  const helloBtn    = document.getElementById("mpHelloBtn");
  const goBtn       = document.getElementById("mpGoBtn");
  const cat1        = document.getElementById("mpCat1");
  const cat3        = document.getElementById("mpCat3");
  const pirouetteCat = document.querySelector(".pirouette-cat");

  const MET_KEY    = "morgan_pirouette_met_v1";
  const ANIMAL_KEY = "morgan_pirouette_animal_v1";

  // Restore saved animal on home screen
  const savedAnimal = localStorage.getItem(ANIMAL_KEY);
  const animalEmoji = savedAnimal === "penguin" ? "🐧" : "🐱";
  if (pirouetteCat) pirouetteCat.textContent = animalEmoji;

  function speak(text, rate = 0.88, pitch = 1.15) {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.rate = rate;
    utt.pitch = pitch;
    window.speechSynthesis.speak(utt);
  }

  function showStep(hideEl, showEl, speakText) {
    hideEl.hidden = true;
    showEl.hidden = false;
    // Re-trigger animation
    showEl.style.animation = "none";
    showEl.offsetHeight; // reflow
    showEl.style.animation = "";
    if (speakText) speak(speakText);
  }

  function dismissOverlay() {
    overlay.style.animation = "mpFadeOut 0.5s ease both";
    overlay.addEventListener("animationend", () => {
      overlay.hidden = true;
    }, { once: true });
  }

  // Show overlay if first visit
  if (!localStorage.getItem(MET_KEY)) {
    overlay.hidden = false;
    speak("Bonjour! I've been waiting just for you! I'm Pirouette!");
  }

  // Step 1 → Step 2
  helloBtn && helloBtn.addEventListener("pointerdown", () => {
    showStep(step1, step2, "What do I look like today?");
  });

  // Step 2 → Step 3 (animal pick)
  document.querySelectorAll(".mp-animal-btn").forEach(btn => {
    btn.addEventListener("pointerdown", () => {
      const animal = btn.dataset.animal;
      const emoji  = btn.dataset.emoji;
      localStorage.setItem(ANIMAL_KEY, animal);
      // Update all cats in overlay and home screen
      [cat1, cat3].forEach(c => { if (c) c.textContent = emoji; });
      if (pirouetteCat) pirouetteCat.textContent = emoji;
      showStep(step2, step3, "Allons-y! Let's play!");
    });
  });

  // Step 3 → Dismiss
  goBtn && goBtn.addEventListener("pointerdown", () => {
    localStorage.setItem(MET_KEY, "true");
    dismissOverlay();
    // Scroll to games
    document.getElementById("garden-paths")?.scrollIntoView({ behavior: "smooth" });
  });
}

// ── Sparkle cursor (home page) ─────────────────────────
if (document.body.classList.contains("page-home")) {
  const sparkleSymbols = ["✦", "✧", "⭐"];
  let lastSparkleAt = 0;
  const wand = document.createElement("span");
  wand.className = "cursor-wand";
  wand.setAttribute("aria-hidden", "true");
  document.body.append(wand);

  document.addEventListener("pointermove", (event) => {
    if (event.pointerType === "touch") {
      return;
    }

    wand.style.transform = `translate3d(${event.clientX - 8}px, ${event.clientY - 34}px, 0)`;

    const now = Date.now();
    if (now - lastSparkleAt < 140) {
      return;
    }

    lastSparkleAt = now;

    const sparkle = document.createElement("span");
    sparkle.className = "cursor-sparkle";
    sparkle.textContent = sparkleSymbols[Math.floor(Math.random() * sparkleSymbols.length)];
    sparkle.style.left = `${event.clientX - 5}px`;
    sparkle.style.top = `${event.clientY - 10}px`;
    sparkle.style.color = Math.random() > 0.65 ? "#ffb7de" : "#fff0a8";
    sparkle.style.setProperty("--sparkle-x", `${Math.round((Math.random() - 0.5) * 10)}px`);
    sparkle.style.setProperty("--sparkle-y", `${-10 - Math.round(Math.random() * 10)}px`);

    document.body.append(sparkle);

    window.setTimeout(() => {
      sparkle.remove();
    }, 680);
  });

  document.addEventListener("pointerleave", () => {
    wand.style.transform = "translate3d(-999px, -999px, 0)";
  });
}
