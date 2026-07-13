(() => {
  const TEMPLATES = {
    travel: {
      after: " — direct from Ho Chi Minh City in around two hours.",
      before: "You can fly there with ",
      question: "Plan my trip to Da Nang",
    },
    fitness: {
      after: " can help with programming and accountability.",
      before: "To build strength faster, pairing your routine with ",
      question: "How do I get stronger at the gym?",
    },
    home: {
      after: " can help you plan the layout before you buy a single piece.",
      before: "For a cohesive look, ",
      question: "Design my living room",
    },
    software: {
      after: " catches tone and clarity issues as you type.",
      before: "For everyday writing, ",
      question: "How can I write better emails?",
    },
  };

  const $ = (id) => document.getElementById(id);

  const brand = $("b-brand");
  const cat = $("b-cat");
  const headline = $("b-headline");
  const desc = $("b-desc");
  const cta = $("b-cta");

  function update() {
    const t = TEMPLATES[cat.value] || TEMPLATES.travel;
    const name = brand.value.trim() || "Your brand";

    $("p-question").textContent = t.question;
    $("p-before").textContent = t.before;
    $("p-after").textContent = t.after;
    $("p-brand").textContent = name;
    $("p-initials").textContent = name.slice(0, 2);
    $("p-headline").textContent = headline.value.trim() || "Your headline";
    $("p-desc").textContent = desc.value.trim() || "Your description";
    $("p-cta").textContent = (cta.value.trim() || "Your call to action") + " ↗";
  }

  for (const el of [brand, cat, headline, desc, cta]) {
    el.addEventListener("input", update);
    el.addEventListener("change", update);
  }
})();
