document.querySelectorAll(".activity-card, .button, .nav-chip").forEach((item) => {
  item.addEventListener("pointerdown", () => {
    item.style.transform = "scale(0.98)";
  });

  const reset = () => {
    item.style.transform = "";
  };

  item.addEventListener("pointerup", reset);
  item.addEventListener("pointerleave", reset);
  item.addEventListener("pointercancel", reset);
});

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
