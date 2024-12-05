let slideIndex = 1;
showSlides(slideIndex);

function plusSlides(n) {
    showSlides(slideIndex += n);
}

function currentSlide(n) {
    showSlides(slideIndex = n);
}

function showSlides(n) {
    const slides = document.querySelectorAll(".slides");
    const dots = document.querySelectorAll(".dot");

    if (n > slides.length) slideIndex = 1;
    if (n < 1) slideIndex = slides.length;

    slides.forEach((slide, index) => {
        slide.style.display = index + 1 === slideIndex ? "block" : "none";
    });

    dots.forEach((dot, index) => {
        dot.className = dot.className.replace(" active", "");
        if (index + 1 === slideIndex) {
            dot.className += " active";
        }
    });
}

const zoomWrappers = document.querySelectorAll(".zoom-wrapper");

zoomWrappers.forEach(wrapper => {
    const img = wrapper.querySelector("img");

    wrapper.addEventListener("mousemove", (e) => {
        const rect = wrapper.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;

        img.style.transformOrigin = `${x * 100}% ${y * 100}%`;
    });

    wrapper.addEventListener("mouseenter", () => {
        img.classList.add("zoomed");
    });

    wrapper.addEventListener("mouseleave", () => {
        img.classList.remove("zoomed");
    });
});