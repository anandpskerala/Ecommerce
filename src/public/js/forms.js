const form = document.getElementById('auth-form');
const timerElement = document.getElementById("timer");
const resendBtn = document.getElementById("resendBtn");
const submitBtn = document.getElementById("submitBtn");

const validationRules = {
    required: value => value.trim() !== '' || 'This field is required.',
    min: (value, param) => value.length >= param || `Minimum ${param} characters required.`,
    email: value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) || 'Invalid email address.',
    uppercase: value => /[A-Z]/.test(value) || 'Must contain at least one uppercase letter.',
    number: value => /\d/.test(value) || 'Must contain at least one number.',
    phonenumber: value => value === '' || /^\+?\d+$/.test(value) || 'Must contain only phone numbers.',
    match: (value, fieldId) => {
        const targetField = document.getElementById(fieldId);
        return value === targetField.value || 'Password does not match.';
    },
};

const handleValidation = (input) => {
    if (!input.dataset.validate) {
        return true;
    }
    const rules = input.dataset.validate.split('|');
    const errorSpan = input.nextElementSibling;
    const value = input.value.trim();

    for (const rule of rules) {
        const [ruleName, param] = rule.split(':');
        const validation = validationRules[ruleName](value, param);
        if (validation !== true) {
            input.style.borderColor = "var(--red)";
            if (errorSpan) {
                errorSpan.textContent = validation;
            }
            return false;
        }
    }
    input.style.borderColor = 'var(--light-grey)';
    if (errorSpan) {
        errorSpan.textContent = '';
    }
    return true;
};

if (form) {
    Array.from(form.elements).forEach(input => {
        if (input.type !== 'submit') {
            if (input.className == "otp-box") {
                input.addEventListener("keyup", (event) => {
                    if (event.keyCode === 13 || input.value.length == 1) {
                        if (input.nextElementSibling &&  input.nextElementSibling.type === "text") {
                            input.nextElementSibling.focus()
                        }
                    }
                });
            } else {
                input.addEventListener('input', () => handleValidation(input));
            }
            
        }
    });


    form.addEventListener('submit', (event) => {
        event.preventDefault();
        let isValid = true;
        let otp = ""
        Array.from(form.elements).forEach(input => {
        if (input.type !== 'submit') {
            if (input.className == "otp-box") {
                otp += input.value;
            }
            if (!handleValidation(input)) {
                isValid = false;
            }
            }
        });

        if (isValid) {
            if (otp != "") {
                const otp_input = document.createElement("input");
                otp_input.type = "hidden";
                otp_input.name = "otp";
                otp_input.value = otp;
                otp_input.className = "otp-box"
                form.appendChild(otp_input);
            }

            form.submit();
            form.reset();
        }
    });
}

function startTimer(remainingTime) {

    const interval = setInterval(() => {
        const minutes = Math.floor(remainingTime / 60);
        const seconds = remainingTime % 60;
        timerElement.textContent = `OTP valid for: ${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

        remainingTime--;

        if (remainingTime < 0) {
            clearInterval(interval);
            timerElement.textContent = "OTP expired.";
            submitBtn.disabled = true;
            resendBtn.disabled = false;
            resendBtn.classList.add("active");
        }
    }, 1000);
}

if (resendBtn) {
    resendBtn.addEventListener("click", async () => {
        alert("OTP has been resent!");
        const emailElement = document.getElementById("email");
        if (emailElement) {
            const email = emailElement.value;
            let req = await fetch("/user/send-otp", {
                method: "POST",
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    email
                })
            })
        } else {
            window.location.href = "/forgot-password";
        }
        submitBtn.disabled = false;
        resendBtn.disabled = true;
        resendBtn.classList.remove("active");
        startTimer(120); 
    });
}


if (timerElement) {
    startTimer(120);
}