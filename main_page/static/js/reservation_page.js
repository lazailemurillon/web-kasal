// ========================================
// RESERVATION PAGE JAVASCRIPT
// ========================================


document.addEventListener("DOMContentLoaded", function () {


    // ========================================
    // LOGOUT CONFIRMATION
    // ========================================

    const logoutButton =
        document.getElementById("logout-button");


    if (logoutButton) {

        logoutButton.addEventListener(
            "click",
            function (event) {

                const answer = confirm(
                    "Are you sure you want to logout?"
                );


                if (!answer) {

                    event.preventDefault();

                }

            }
        );

    }



    // ========================================
    // CANCEL RESERVATION BUTTONS
    // ========================================

    const cancelButtons =
        document.querySelectorAll(
            ".cancel-reservation"
        );


    cancelButtons.forEach(function (button) {


        button.addEventListener(
            "click",
            function () {


                const reservationId =
                    this.dataset.reservationId;


                // --------------------------------
                // CONFIRM
                // --------------------------------

                const answer = confirm(
                    "Are you sure you want to cancel this reservation?"
                );


                if (!answer) {

                    return;

                }


                // --------------------------------
                // SEND CANCEL REQUEST
                // --------------------------------

                cancelReservation(
                    reservationId,
                    this
                );


            }
        );

    });

});



// ========================================
// CANCEL RESERVATION
// ========================================

function cancelReservation(
    reservationId,
    button
) {

    button.disabled = true;
    button.textContent = "CANCELLING...";

    const csrfToken = getCookie("csrftoken");

    fetch(
        `/reservations/cancel/${reservationId}/`,
        {
            method: "POST",

            headers: {
                "X-CSRFToken": csrfToken,
                "X-Requested-With": "XMLHttpRequest"
            }
        }
    )

    .then(function(response) {

        if (!response.ok) {
            throw new Error(
                "Server returned " + response.status
            );
        }

        return response.json();

    })

    .then(function(data) {

        if (data.success) {

            alert(
                "Your reservation has been cancelled."
            );

            window.location.reload();

        } else {

            alert(
                data.error ||
                "Unable to cancel reservation."
            );

            button.disabled = false;
            button.textContent = "CANCEL";
        }

    })

    .catch(function(error) {

        console.error(
            "Cancellation error:",
            error
        );

        alert(
            "Something went wrong. Please try again."
        );

        button.disabled = false;
        button.textContent = "CANCEL";

    });
}




// ========================================
// GET CSRF COOKIE
// ========================================

function getCookie(name) {


    let cookieValue = null;


    if (
        document.cookie &&
        document.cookie !== ""
    ) {


        const cookies =
            document.cookie.split(";");


        for (
            let i = 0;
            i < cookies.length;
            i++
        ) {


            const cookie =
                cookies[i].trim();


            if (
                cookie.substring(
                    0,
                    name.length + 1
                ) === name + "="
            ) {


                cookieValue =
                    decodeURIComponent(
                        cookie.substring(
                            name.length + 1
                        )
                    );


                break;

            }

        }

    }


    return cookieValue;

}
