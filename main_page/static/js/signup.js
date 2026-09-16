document.addEventListener("DOMContentLoaded", function () {


    /*
    ==========================================
    ELEMENTS
    ==========================================
    */

    const welcomeStep =
        document.getElementById("welcomeStep");

    const customerStep =
        document.getElementById("customerStep");

    const staffStep =
        document.getElementById("staffStep");


    const customerOption =
        document.getElementById("customerOption");

    const staffOption =
        document.getElementById("staffOption");


    const backButton =
        document.getElementById("backButton");


    /*
    ==========================================
    SHOW CUSTOMER SIGNUP
    ==========================================
    */

    if (customerOption) {

        customerOption.addEventListener(
            "click",
            function () {

                welcomeStep.classList.remove("active");

                staffStep.classList.remove("active");

                customerStep.classList.add("active");

            }
        );

    }


    /*
    ==========================================
    SHOW STAFF SIGNUP
    ==========================================
    */

    if (staffOption) {

        staffOption.addEventListener(
            "click",
            function () {

                welcomeStep.classList.remove("active");

                customerStep.classList.remove("active");

                staffStep.classList.add("active");

            }
        );

    }


    /*
    ==========================================
    BACK BUTTON
    ==========================================
    */

    if (backButton) {

        backButton.addEventListener(
            "click",
            function () {

                /*
                ==========================================
                IF CUSTOMER OR STAFF FORM IS OPEN
                GO BACK TO ACCOUNT TYPE SELECTION
                ==========================================
                */

                if (
                    customerStep.classList.contains("active") ||
                    staffStep.classList.contains("active")
                ) {

                    customerStep.classList.remove("active");

                    staffStep.classList.remove("active");

                    welcomeStep.classList.add("active");

                    return;
                }


                /*
                ==========================================
                IF WELCOME SCREEN IS OPEN
                GO BACK TO MAIN PAGE
                ==========================================
                */

                const homeUrl =
                    backButton.dataset.homeUrl;

                window.location.href = homeUrl;

            }
        );

    }


    /*
    ==========================================
    PASSWORD VALIDATION
    ==========================================
    */

    const signupForms =
        document.querySelectorAll(".signup-form");


    signupForms.forEach(function (form) {

        form.addEventListener(
            "submit",
            function (event) {

                const password =
                    form.querySelector(
                        'input[name="password"]'
                    );

                const confirmPassword =
                    form.querySelector(
                        'input[name="confirm_password"]'
                    );


                if (
                    password &&
                    confirmPassword &&
                    password.value !== confirmPassword.value
                ) {

                    event.preventDefault();

                    alert(
                        "Passwords do not match."
                    );

                }

            }
        );

    });

});