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
