const menu = document.querySelector(".menu-toggle");
const nav = document.querySelector(".navbar");

if (menu) {
  menu.addEventListener("click", () => {
    nav.classList.toggle("mobile-open");
    const links = nav.querySelector(".nav-links");
    const about = nav.querySelector(".nav-about");
    if (window.innerWidth <= 760) {
      const open = nav.classList.contains("mobile-open");
      if (links) links.style.display = open ? "flex" : "";
      if (about) about.style.display = open ? "block" : "";
    }
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
