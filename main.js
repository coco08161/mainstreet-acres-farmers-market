document.documentElement.classList.add("js");

// Mobile menu
const toggle = document.querySelector(".nav-toggle");
const links = document.getElementById("nav-links");
if (toggle && links) {
  toggle.addEventListener("click", () => {
    const open = links.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  });
  links.addEventListener("click", (e) => {
    if (e.target.closest("a")) {
      links.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    }
  });
}

// Footer year
document.querySelectorAll("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));

// Reveal on scroll
const reveals = document.querySelectorAll(".reveal");
if ("IntersectionObserver" in window) {
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          entry.target.style.transitionDelay = `${Math.min(i, 6) * 60}ms`;
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        }
      });
    },
    { rootMargin: "0px 0px -8% 0px" }
  );
  reveals.forEach((el) => io.observe(el));
} else {
  reveals.forEach((el) => el.classList.add("in"));
}

// Vendor application form
const form = document.getElementById("vendor-form");
if (form) {
  const category = document.getElementById("f-category");
  const foodBlock = document.getElementById("food-block");
  const errorEl = document.getElementById("form-error");
  const success = document.getElementById("form-success");

  const syncFood = () => {
    const opt = category.selectedOptions[0];
    foodBlock.classList.toggle("show", !!(opt && opt.hasAttribute("data-food")));
  };
  category.addEventListener("change", syncFood);

  // Preselect the market day from Register links (apply.html?day=Saturday)
  const day = new URLSearchParams(location.search).get("day");
  if (day) {
    const box = form.querySelector(`input[name="Days"][value="${CSS.escape(day)}"]`);
    if (box) box.checked = true;
  }
  form.addEventListener("input", (e) => {
    if (e.target.checkValidity && e.target.checkValidity()) e.target.classList.remove("is-invalid");
  });
  syncFood();

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorEl.textContent = "";

    const firstInvalid = [...form.querySelectorAll("[required]")].find((el) => !el.checkValidity());
    form.querySelectorAll(".is-invalid").forEach((el) => el.classList.remove("is-invalid"));
    form.querySelectorAll("[required]").forEach((el) => {
      if (!el.checkValidity()) el.classList.add("is-invalid");
    });
    if (firstInvalid) {
      errorEl.textContent =
        firstInvalid.type === "checkbox"
          ? "Please check the box to confirm."
          : "Please fill in the highlighted field.";
      firstInvalid.focus();
      return;
    }

    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.firstChild.textContent = "Sending… ";

    // Combine multi-select checkboxes into one line each
    const data = new FormData(form);
    const payload = {};
    for (const [key, value] of data.entries()) {
      payload[key] = payload[key] ? `${payload[key]}, ${value}` : value;
    }

    try {
      const res = await fetch(form.action.replace("formsubmit.co/", "formsubmit.co/ajax/"), {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Bad response");
      form.style.display = "none";
      success.classList.add("show");
      success.scrollIntoView({ behavior: "smooth", block: "center" });
    } catch {
      errorEl.innerHTML =
        'Something went wrong sending your application. Please try again, or email us at <a href="mailto:stephanie@cmgproducts.net">stephanie@cmgproducts.net</a>.';
      btn.disabled = false;
      btn.firstChild.textContent = "Send application ";
    }
  });
}
