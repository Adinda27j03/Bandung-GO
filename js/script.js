const menu = document.querySelector(".menu-toggle");
const nav = document.querySelector(".navbar");

if (menu && nav) {
  menu.addEventListener("click", () => {
    if (window.innerWidth > 760) return;
    nav.classList.toggle("mobile-open");
    const isOpen = nav.classList.contains("mobile-open");
    menu.textContent = isOpen ? "✕" : "☰";
    menu.setAttribute("aria-expanded", String(isOpen));
  });

  nav.querySelectorAll(".nav-links a").forEach(link => {
    link.addEventListener("click", () => {
      nav.classList.remove("mobile-open");
      menu.textContent = "☰";
      menu.setAttribute("aria-expanded", "false");
    });
  });
}

document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener("click", e => {
    const id = link.getAttribute("href");
    const target = document.querySelector(id);
    if (target) {
      e.preventDefault();
      target.scrollIntoView({behavior:"smooth"});
    }
  });
});