document.addEventListener("DOMContentLoaded", function () {

    const bookingDate =
        document.getElementById("bookingDate");

    const timeButtons =
        document.querySelectorAll(".time-button");

    const selectedTime =
        document.getElementById("selectedTime");

    const reserveButton =
        document.getElementById("reserveButton");


    let selectedDate = false;
    let selectedTimeSlot = false;


    /*
    ==========================================
    DATE
    ==========================================
    */

    if (bookingDate) {

        bookingDate.addEventListener(
            "change",
            function () {

                const date =
                    new Date(
                        bookingDate.value + "T00:00:00"
                    );

                /*
                Sunday = 0
                */

                if (date.getDay() === 0) {

                    alert(
                        "We are closed on Sundays."
                    );

                    bookingDate.value = "";

                    selectedDate = false;

                    updateButton();

                    return;
                }


                selectedDate =
                    bookingDate.value !== "";

                updateButton();

            }
        );

    }


    /*
    ==========================================
    TIME SLOTS
    ==========================================
    */

    timeButtons.forEach(function (button) {

        button.addEventListener(
            "click",
            function () {

                /*
                Remove previous selection
                */

                timeButtons.forEach(
                    function (item) {

                        item.classList.remove(
                            "selected"
                        );

                    }
                );


                /*
                Select clicked time
                */

                button.classList.add(
                    "selected"
                );


                selectedTimeSlot =
                    button.dataset.time;


                selectedTime.value =
                    selectedTimeSlot;


                updateButton();

            }
        );

    });


    /*
    ==========================================
    BOOK BUTTON
    ==========================================
    */

    function updateButton() {

        if (
            selectedDate &&
            selectedTimeSlot
        ) {

            reserveButton.disabled = false;

            reserveButton.textContent =
                "CONFIRM RESERVATION";

        } else {

            reserveButton.disabled = true;

            reserveButton.textContent =
                "CHOOSE A DATE AND TIME FIRST";

        }

    }

});