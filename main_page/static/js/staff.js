/* ============================================================
   CSRF COOKIE
============================================================ */

function getCookie(name) {
    let cookieValue = null;

    if (document.cookie && document.cookie !== "") {
        const cookies = document.cookie.split(";");

        for (let cookie of cookies) {
            cookie = cookie.trim();

            if (cookie.startsWith(name + "=")) {
                cookieValue = decodeURIComponent(
                    cookie.substring(name.length + 1)
                );
                break;
            }
        }
    }

    return cookieValue;
}


/* ============================================================
   HELPER FUNCTIONS
============================================================ */

function openModal(id) {
    const modal = document.getElementById(id);

    if (modal) {
        modal.classList.add("active");
        document.body.style.overflow = "hidden";
    }
}


function closeModal(id) {
    const modal = document.getElementById(id);

    if (modal) {
        modal.classList.remove("active");
        document.body.style.overflow = "";
    }
}


/* ============================================================
   NAVIGATION TABS
============================================================ */

const navTabs = document.querySelectorAll(".nav-tab");

navTabs.forEach((tab) => {
    tab.addEventListener("click", () => {

        const target = tab.dataset.tab;

        navTabs.forEach((item) => {
            item.classList.remove("active");
        });

        tab.classList.add("active");

        document.querySelectorAll(".tab-content").forEach((section) => {
            section.classList.remove("active");
        });

        const targetSection = document.getElementById(
            `${target}-tab`
        );

        if (targetSection) {
            targetSection.classList.add("active");
        }
    });
});


/* ============================================================
   CLOSE BUTTONS
============================================================ */

document.querySelectorAll("[data-close]").forEach((button) => {

    button.addEventListener("click", () => {
        closeModal(button.dataset.close);
    });

});


/* ============================================================
   CLOSE MODAL WHEN CLICKING OUTSIDE
============================================================ */

document.querySelectorAll(".modal-overlay").forEach((overlay) => {

    overlay.addEventListener("click", (event) => {

        if (event.target === overlay) {

            overlay.classList.remove("active");
            document.body.style.overflow = "";

        }

    });

});


/* ============================================================
   ESCAPE KEY
============================================================ */

document.addEventListener("keydown", (event) => {

    if (event.key === "Escape") {

        document
            .querySelectorAll(".modal-overlay.active")
            .forEach((modal) => {
                modal.classList.remove("active");
            });

        document.body.style.overflow = "";
    }

});


/* ============================================================
   ============================================================
   RESERVATION EDIT
   ============================================================
============================================================ */

const reservationEditButtons =
    document.querySelectorAll(".edit-reservation");


reservationEditButtons.forEach((button) => {

    button.addEventListener("click", () => {

        const data = button.dataset;

        /*
         * IMPORTANT:
         * data-id must contain the DATABASE ID.
         */

        const reservationId = data.id;
        const reference = data.reference || data.id;
        const customer = data.customer || "";
        const gown = data.gown || "";
        const status = data.status || "";
        const prep = data.prep || "";


        /* -----------------------------------------
           CHECK DATABASE ID
        ----------------------------------------- */

        if (!reservationId) {

            console.error(
                "Reservation database ID is missing.",
                data
            );

            alert("Reservation ID is missing.");

            return;
        }


        /* -----------------------------------------
           RESERVATION REFERENCE
        ----------------------------------------- */

        const referenceElement =
            document.getElementById("reservation-ref");


        if (referenceElement) {

            /*
             * Show the human-readable reference.
             */
            referenceElement.textContent = reference;

            /*
             * Store the actual DATABASE ID.
             * Save function will use this.
             */
            referenceElement.dataset.id =
                reservationId;
        }


        /* -----------------------------------------
           CUSTOMER
        ----------------------------------------- */

        const customerElement =
            document.getElementById(
                "reservation-customer"
            );

        if (customerElement) {
            customerElement.textContent = customer;
        }


        /* -----------------------------------------
           GOWN
        ----------------------------------------- */

        const gownElement =
            document.getElementById(
                "reservation-gown"
            );

        if (gownElement) {
            gownElement.textContent = gown;
        }


        /* -----------------------------------------
           STATUS
        ----------------------------------------- */

        const statusElement =
            document.getElementById(
                "reservation-status"
            );

        if (statusElement) {
            statusElement.value = status;
        }


        /* -----------------------------------------
           PREPARATION
        ----------------------------------------- */

        const prepElement =
            document.getElementById(
                "reservation-prep"
            );

        if (prepElement) {
            prepElement.value = prep;
        }


        /* -----------------------------------------
           OPEN MODAL
        ----------------------------------------- */

        openModal("reservation-modal");

    });

});


/* ============================================================
   SAVE RESERVATION
============================================================ */

const saveReservation =
    document.getElementById("save-reservation");


if (saveReservation) {

    saveReservation.addEventListener("click", async () => {

        /* -----------------------------------------
           GET ELEMENTS
        ----------------------------------------- */

        const referenceElement =
            document.getElementById("reservation-ref");

        const statusElement =
            document.getElementById("reservation-status");

        const prepElement =
            document.getElementById("reservation-prep");


        if (!referenceElement) {

            alert(
                "Reservation reference element was not found."
            );

            return;
        }


        if (!statusElement) {

            alert(
                "Reservation status field was not found."
            );

            return;
        }


        if (!prepElement) {

            alert(
                "Reservation preparation field was not found."
            );

            return;
        }


        /* -----------------------------------------
           GET DATABASE ID
        ----------------------------------------- */

        const reservationId =
            referenceElement.dataset.id;


        console.log(
            "Saving reservation ID:",
            reservationId
        );


        /* -----------------------------------------
           VALIDATE ID
        ----------------------------------------- */

        if (!reservationId) {

            alert(
                "Reservation ID was not found."
            );

            console.error(
                "reservation-ref is missing data-id:",
                referenceElement
            );

            return;
        }


        /* -----------------------------------------
           GET NEW VALUES
        ----------------------------------------- */

        const newStatus =
            statusElement.value;

        const newPrep =
            prepElement.value;


        console.log(
            "New reservation status:",
            newStatus
        );

        console.log(
            "New reservation preparation:",
            newPrep
        );


        /* -----------------------------------------
           CREATE FORMDATA
        ----------------------------------------- */

        const formData =
            new FormData();


        formData.append(
            "status",
            newStatus
        );


        formData.append(
            "prep",
            newPrep
        );


        /* -----------------------------------------
           CSRF
        ----------------------------------------- */

        const csrfToken =
            getCookie("csrftoken");


        if (!csrfToken) {

            console.error(
                "CSRF token was not found."
            );

            alert(
                "Security token is missing. Please refresh the page and try again."
            );

            return;
        }


        /* -----------------------------------------
           DISABLE BUTTON
        ----------------------------------------- */

        saveReservation.disabled = true;

        saveReservation.textContent =
            "Saving...";


        try {

            /* -----------------------------------------
               SEND REQUEST
            ----------------------------------------- */

            const response =
                await fetch(
                    `/staff/reservations/${reservationId}/update/`,
                    {
                        method: "POST",

                        headers: {
                            "X-CSRFToken":
                                csrfToken,

                            "X-Requested-With":
                                "XMLHttpRequest"
                        },

                        body: formData
                    }
                );


            /* -----------------------------------------
               READ RESPONSE
            ----------------------------------------- */

            let data;

            try {

                data =
                    await response.json();

            } catch (jsonError) {

                console.error(
                    "Server did not return JSON.",
                    jsonError
                );

                throw new Error(
                    "The server returned an invalid response."
                );
            }


            console.log(
                "Reservation update response:",
                data
            );


            /* -----------------------------------------
               SERVER ERROR
            ----------------------------------------- */

            if (!response.ok) {

                throw new Error(
                    data.error ||
                    `Server error (${response.status}).`
                );
            }


            /* -----------------------------------------
               APPLICATION ERROR
            ----------------------------------------- */

            if (!data.success) {

                throw new Error(
                    data.error ||
                    "Unable to update reservation."
                );
            }


            /* -----------------------------------------
               SUCCESS
            ----------------------------------------- */

            alert(
                "Reservation updated successfully. The customer has been notified by email."
            );


            /* -----------------------------------------
               CLOSE MODAL
            ----------------------------------------- */

            closeModal(
                "reservation-modal"
            );


            /* -----------------------------------------
               REFRESH PAGE
            ----------------------------------------- */

            window.location.reload();


        } catch (error) {

            console.error(
                "Reservation update error:",
                error
            );


            alert(
                error.message ||
                "Something went wrong while updating the reservation."
            );


        } finally {

            saveReservation.disabled =
                false;

            saveReservation.textContent =
                "Save Changes";

        }

    });

}


/* ============================================================
   RESERVATION SEARCH
============================================================ */

const customerSearch =
    document.getElementById(
        "customer-search"
    );


const gownReservationSearch =
    document.getElementById(
        "reservation-gown-search"
    );


function filterReservations() {

    const customerValue =
        customerSearch
            ? customerSearch.value
                .trim()
                .toLowerCase()
            : "";


    const gownValue =
        gownReservationSearch
            ? gownReservationSearch.value
                .trim()
                .toLowerCase()
            : "";


    document
        .querySelectorAll(".reservation-row")
        .forEach((row) => {

            const customer =
                (
                    row.dataset.customer ||
                    ""
                ).toLowerCase();


            const gown =
                (
                    row.dataset.gown ||
                    ""
                ).toLowerCase();


            const customerMatch =
                customer.includes(
                    customerValue
                );


            const gownMatch =
                gown.includes(
                    gownValue
                );


            row.style.display =
                customerMatch &&
                gownMatch
                    ? ""
                    : "none";

        });

}


if (customerSearch) {

    customerSearch.addEventListener(
        "input",
        filterReservations
    );

}


if (gownReservationSearch) {

    gownReservationSearch.addEventListener(
        "input",
        filterReservations
    );

}


/* ============================================================
   RESERVATION STATUS FILTER
============================================================ */

const reservationStatusFilters =
    document.querySelectorAll(
        ".reservation-status-filter"
    );


reservationStatusFilters.forEach((checkbox) => {

    checkbox.addEventListener("change", () => {

        const selectedStatuses =
            Array.from(
                reservationStatusFilters
            )
            .filter(
                (item) => item.checked
            )
            .map(
                (item) => item.value
            );


        document
            .querySelectorAll(".reservation-row")
            .forEach((row) => {

                if (
                    selectedStatuses.length === 0
                ) {

                    row.style.display = "";

                    return;
                }


                row.style.display =
                    selectedStatuses.includes(
                        row.dataset.status
                    )
                        ? ""
                        : "none";

            });

    });

});


/* ============================================================
   GOWN SEARCH
============================================================ */

const gownSearch =
    document.getElementById(
        "gown-search"
    );


if (gownSearch) {

    gownSearch.addEventListener(
        "input",
        () => {

            const search =
                gownSearch.value
                    .trim()
                    .toLowerCase();


            document
                .querySelectorAll(".gown-card")
                .forEach((card) => {

                    const name =
                        (
                            card.dataset.gownName ||
                            ""
                        ).toLowerCase();


                    card.style.display =
                        name.includes(search)
                            ? ""
                            : "none";

                });

        }
    );

}


/* ============================================================
   GOWN EDIT
============================================================ */

const gownEditButtons =
    document.querySelectorAll(
        ".edit-gown"
    );


gownEditButtons.forEach((button) => {

    button.addEventListener("click", () => {

        const data =
            button.dataset;


        const modalTitle =
            document.getElementById(
                "gown-modal-title"
            );


        const nameInput =
            document.getElementById(
                "gown-name"
            );


        const priceInput =
            document.getElementById(
                "gown-price"
            );


        const colorInput =
            document.getElementById(
                "gown-color"
            );


        const styleInput =
            document.getElementById(
                "gown-style"
            );


        const sizeInput =
            document.getElementById(
                "gown-size"
            );


        const saveButton =
            document.getElementById(
                "save-gown"
            );


        if (
            !modalTitle ||
            !nameInput ||
            !priceInput ||
            !colorInput ||
            !styleInput ||
            !sizeInput ||
            !saveButton
        ) {

            console.error(
                "One or more gown edit fields are missing."
            );

            return;
        }


        modalTitle.textContent =
            data.name || "Edit Gown";


        nameInput.value =
            data.name || "";


        priceInput.value =
            data.price || "";


        colorInput.value =
            data.color || "";


        styleInput.value =
            data.style || "";


        sizeInput.value =
            data.size || "";


        saveButton.dataset.id =
            data.id || "";


        openModal(
            "gown-modal"
        );

    });

});


/* ============================================================
   COLOR PICKER
============================================================ */

const colorPicker =
    document.getElementById(
        "gown-color-picker"
    );


const colorHex =
    document.getElementById(
        "gown-color-hex"
    );


if (
    colorPicker &&
    colorHex
) {

    colorPicker.addEventListener(
        "input",
        () => {

            colorHex.value =
                colorPicker.value;

        }
    );


    colorHex.addEventListener(
        "input",
        () => {

            const value =
                colorHex.value.trim();


            if (
                /^#[0-9A-Fa-f]{6}$/.test(
                    value
                )
            ) {

                colorPicker.value =
                    value;

            }

        }
    );

}


/* ============================================================
   SAVE GOWN
============================================================ */

const saveGown =
    document.getElementById(
        "save-gown"
    );


if (saveGown) {

    saveGown.addEventListener(
        "click",
        async () => {

            const id =
                saveGown.dataset.id;


            const name =
                document.getElementById(
                    "gown-name"
                ).value.trim();


            const price =
                document.getElementById(
                    "gown-price"
                ).value.trim();


            const color =
                document.getElementById(
                    "gown-color"
                ).value;


            const style =
                document.getElementById(
                    "gown-style"
                ).value;


            const size =
                document.getElementById(
                    "gown-size"
                ).value;


            const imageInput =
                document.getElementById(
                    "gown-image"
                );


            if (!id) {

                alert(
                    "Gown ID is missing."
                );

                return;
            }


            if (!name) {

                alert(
                    "Gown name is required."
                );

                return;
            }


            if (!price) {

                alert(
                    "Gown price is required."
                );

                return;
            }


            const formData =
                new FormData();


            formData.append(
                "name",
                name
            );


            formData.append(
                "price",
                price
            );


            formData.append(
                "color",
                color
            );


            formData.append(
                "style",
                style
            );


            formData.append(
                "size",
                size
            );


            if (
                imageInput &&
                imageInput.files.length > 0
            ) {

                formData.append(
                    "image",
                    imageInput.files[0]
                );

            }


            try {

                saveGown.disabled =
                    true;

                saveGown.textContent =
                    "SAVING...";


                const response =
                    await fetch(
                        `/staff/gowns/${id}/update/`,
                        {
                            method: "POST",

                            headers: {
                                "X-CSRFToken":
                                    getCookie(
                                        "csrftoken"
                                    )
                            },

                            body: formData
                        }
                    );


                const data =
                    await response.json();


                if (
                    !response.ok ||
                    !data.success
                ) {

                    throw new Error(
                        data.error ||
                        "Unable to update gown."
                    );

                }


                const gown =
                    data.gown;


                const editButton =
                    document.querySelector(
                        `.edit-gown[data-id="${id}"]`
                    );


                const card =
                    editButton
                        ? editButton.closest(
                            ".gown-card"
                        )
                        : null;


                if (card) {

                    card.dataset.gownName =
                        gown.name;

                    card.dataset.color =
                        gown.color;

                    card.dataset.style =
                        gown.style;

                    card.dataset.size =
                        gown.size;


                    const nameElement =
                        card.querySelector("h3");


                    if (nameElement) {

                        nameElement.textContent =
                            gown.name;

                    }


                    const priceElement =
                        card.querySelector(
                            ".gown-price"
                        );


                    if (priceElement) {

                        priceElement.textContent =
                            "$" + gown.price;

                    }


                    const tags =
                        card.querySelector(
                            ".gown-tags"
                        );


                    if (tags) {

                        tags.innerHTML = `
                            <span>${gown.color_display}</span>
                            <span>${gown.style_display}</span>
                            <span>${gown.size}</span>
                        `;

                    }


                    editButton.dataset.name =
                        gown.name;


                    editButton.dataset.price =
                        gown.price;


                    editButton.dataset.color =
                        gown.color;


                    editButton.dataset.style =
                        gown.style;


                    editButton.dataset.size =
                        gown.size;


                    if (gown.image) {

                        const imageContainer =
                            card.querySelector(
                                ".gown-image-container"
                            );


                        if (imageContainer) {

                            const existingImage =
                                imageContainer.querySelector(
                                    ".gown-image"
                                );


                            if (existingImage) {

                                existingImage.src =
                                    gown.image +
                                    "?t=" +
                                    Date.now();


                                existingImage.alt =
                                    gown.name;

                            }

                        }

                    }

                }


                closeModal(
                    "gown-modal"
                );


            } catch (error) {

                console.error(
                    "Update gown error:",
                    error
                );


                alert(
                    error.message ||
                    "Something went wrong while updating the gown."
                );


            } finally {

                saveGown.disabled =
                    false;

                saveGown.textContent =
                    "Save Changes";

            }

        }
    );

}


/* ============================================================
   DELETE GOWN
============================================================ */

const gownDeleteButtons =
    document.querySelectorAll(
        ".delete-gown"
    );


gownDeleteButtons.forEach((button) => {

    button.addEventListener(
        "click",
        async () => {

            const gownId =
                button.dataset.id;


            const gownName =
                button.dataset.name ||
                "this gown";


            if (!gownId) {

                alert(
                    "Gown ID is missing."
                );

                return;
            }


            const confirmed =
                window.confirm(
                    `Are you sure you want to delete "${gownName}"? This action cannot be undone.`
                );


            if (!confirmed) {
                return;
            }


            try {

                button.disabled =
                    true;


                const response =
                    await fetch(
                        `/staff/gowns/${gownId}/delete/`,
                        {
                            method: "POST",

                            headers: {
                                "X-CSRFToken":
                                    getCookie(
                                        "csrftoken"
                                    ),

                                "X-Requested-With":
                                    "XMLHttpRequest"
                            }
                        }
                    );


                const data =
                    await response.json();


                if (
                    !response.ok ||
                    !data.success
                ) {

                    throw new Error(
                        data.error ||
                        "Unable to delete gown."
                    );

                }


                const card =
                    button.closest(
                        ".gown-card"
                    );


                if (card) {
                    card.remove();
                }


                if (
                    typeof filterGowns ===
                    "function"
                ) {

                    filterGowns();

                }


            } catch (error) {

                console.error(
                    "Delete gown error:",
                    error
                );


                alert(
                    error.message ||
                    "Something went wrong while deleting the gown."
                );


                button.disabled =
                    false;

            }

        }
    );

});


/* ============================================================
   ADD NEW GOWN
============================================================ */

const addGownButton =
    document.getElementById(
        "add-gown-btn"
    );


if (addGownButton) {

    addGownButton.addEventListener(
        "click",
        () => {

            openModal(
                "add-gown-modal"
            );

        }
    );

}


/* ============================================================
   CREATE GOWN
============================================================ */

const createGown =
    document.getElementById(
        "create-gown"
    );


if (createGown) {

    createGown.addEventListener(
        "click",
        async () => {

            const name =
                document.getElementById(
                    "new-gown-name"
                ).value.trim();


            const price =
                document.getElementById(
                    "new-gown-price"
                ).value.trim();


            const color =
                document.getElementById(
                    "new-gown-color"
                ).value;


            const style =
                document.getElementById(
                    "new-gown-style"
                ).value;


            const size =
                document.getElementById(
                    "new-gown-size"
                ).value;


            const imageInput =
                document.getElementById(
                    "new-gown-image"
                );


            const image =
                imageInput
                    ? imageInput.files[0]
                    : null;


            if (!name) {

                alert(
                    "Please enter the gown name."
                );

                return;
            }


            if (!price) {

                alert(
                    "Please enter the gown price."
                );

                return;
            }


            if (!image) {

                alert(
                    "Please select a gown image."
                );

                return;
            }


            const formData =
                new FormData();


            formData.append(
                "name",
                name
            );


            formData.append(
                "price",
                price
            );


            formData.append(
                "color",
                color
            );


            formData.append(
                "style",
                style
            );


            formData.append(
                "size",
                size
            );


            formData.append(
                "image",
                image
            );


            try {

                createGown.disabled =
                    true;

                createGown.textContent =
                    "ADDING...";


                const response =
                    await fetch(
                        "/staff/gowns/create/",
                        {
                            method: "POST",

                            headers: {
                                "X-CSRFToken":
                                    getCookie(
                                        "csrftoken"
                                    )
                            },

                            body: formData
                        }
                    );


                const data =
                    await response.json();


                if (
                    !response.ok ||
                    !data.success
                ) {

                    throw new Error(
                        data.error ||
                        "Failed to add gown."
                    );

                }


                const gown =
                    data.gown;


                const gownGrid =
                    document.getElementById(
                        "gown-grid"
                    );


                if (gownGrid) {

                    const card =
                        document.createElement(
                            "article"
                        );


                    card.className =
                        "gown-card";


                    card.dataset.gownName =
                        gown.name;


                    card.dataset.color =
                        gown.color;


                    card.dataset.style =
                        gown.style;


                    card.dataset.size =
                        gown.size;


                    let imageHTML = "";


                    if (gown.image) {

                        imageHTML = `
                            <img
                                src="${gown.image}?t=${Date.now()}"
                                alt="${gown.name}"
                                class="gown-image"
                            >
                        `;

                    } else {

                        imageHTML = `
                            <div class="sample-gown-image">
                                <div class="sample-gown-silhouette">
                                    ✧
                                </div>
                            </div>
                        `;

                    }


                    card.innerHTML = `

                        <div class="gown-image-container">
                            ${imageHTML}
                        </div>

                        <div class="gown-card-info">

                            <h3>${gown.name}</h3>

                            <div class="gown-tags">
                                <span>
                                    ${gown.color_display}
                                </span>

                                <span>
                                    ${gown.style_display}
                                </span>

                                <span>
                                    ${gown.size}
                                </span>
                            </div>

                            <div class="gown-card-bottom">

                                <span class="gown-price">
                                    $${gown.price}
                                </span>

                                <div class="gown-actions">

                                    <button
                                        class="icon-btn edit-gown"
                                        title="Edit"
                                        data-id="${gown.id}"
                                        data-name="${gown.name}"
                                        data-price="${gown.price}"
                                        data-color="${gown.color}"
                                        data-style="${gown.style}"
                                        data-size="${gown.size}"
                                    >
                                        ✎
                                    </button>

                                    <button
                                        class="icon-btn delete-gown"
                                        title="Delete"
                                        data-id="${gown.id}"
                                        data-name="${gown.name}"
                                    >
                                        ♜
                                    </button>

                                </div>

                            </div>

                        </div>
                    `;


                    gownGrid.appendChild(
                        card
                    );

                }


                /* -----------------------------------------
                   RESET FORM
                ----------------------------------------- */

                document.getElementById(
                    "new-gown-name"
                ).value = "";


                document.getElementById(
                    "new-gown-price"
                ).value = "";


                if (imageInput) {
                    imageInput.value = "";
                }


                closeModal(
                    "add-gown-modal"
                );


                if (
                    typeof filterGowns ===
                    "function"
                ) {

                    filterGowns();

                }


                alert(
                    "Gown added successfully."
                );


            } catch (error) {

                console.error(
                    "Create gown error:",
                    error
                );


                alert(
                    error.message ||
                    "Something went wrong while adding the gown."
                );


            } finally {

                createGown.disabled =
                    false;

                createGown.textContent =
                    "Add Gown";

            }

        }
    );

}


/* ============================================================
   STAFF EDIT
============================================================ */

const staffEditButtons =
    document.querySelectorAll(
        ".edit-staff"
    );


staffEditButtons.forEach((button) => {

    button.addEventListener(
        "click",
        () => {

            const data =
                button.dataset;


            const nameInput =
                document.getElementById(
                    "staff-name"
                );


            const emailInput =
                document.getElementById(
                    "staff-email"
                );


            const statusInput =
                document.getElementById(
                    "staff-status"
                );


            const saveButton =
                document.getElementById(
                    "save-staff"
                );


            const deleteButton =
                document.getElementById(
                    "delete-staff"
                );


            if (
                !nameInput ||
                !emailInput ||
                !statusInput
            ) {

                console.error(
                    "Staff modal fields are missing."
                );

                return;
            }


            nameInput.value =
                data.name || "";


            emailInput.value =
                data.email || "";


            statusInput.value =
                data.status || "Pending";


            if (saveButton) {

                saveButton.dataset.id =
                    data.id || "";

            }


            if (deleteButton) {

                deleteButton.dataset.id =
                    data.id || "";

                deleteButton.dataset.name =
                    data.name || "";

            }


            openModal(
                "staff-modal"
            );

        }
    );

});


/* ============================================================
   SAVE STAFF
============================================================ */

const saveStaff =
    document.getElementById(
        "save-staff"
    );


if (saveStaff) {

    saveStaff.addEventListener(
        "click",
        async () => {

            const id =
                saveStaff.dataset.id;


            const name =
                document.getElementById(
                    "staff-name"
                ).value.trim();


            const email =
                document.getElementById(
                    "staff-email"
                ).value.trim();


            const status =
                document.getElementById(
                    "staff-status"
                ).value;


            if (!id) {

                alert(
                    "Staff member ID is missing."
                );

                return;
            }


            if (!name || !email) {

                alert(
                    "Name and email are required."
                );

                return;
            }


            const formData =
                new FormData();


            formData.append(
                "name",
                name
            );


            formData.append(
                "email",
                email
            );


            formData.append(
                "status",
                status
            );


            try {

                const response =
                    await fetch(
                        `/staff/${id}/update/`,
                        {
                            method: "POST",

                            headers: {
                                "X-CSRFToken":
                                    getCookie(
                                        "csrftoken"
                                    )
                            },

                            body: formData
                        }
                    );


                const data =
                    await response.json();


                if (
                    !response.ok ||
                    !data.success
                ) {

                    throw new Error(
                        data.error ||
                        "Unable to update staff member."
                    );

                }


                const button =
                    document.querySelector(
                        `.edit-staff[data-id="${id}"]`
                    );


                const row =
                    button?.closest(
                        ".staff-row"
                    );


                if (row) {

                    row.dataset.name =
                        data.staff.name.toLowerCase();


                    row.dataset.email =
                        data.staff.email.toLowerCase();


                    row.dataset.status =
                        data.staff.status;


                    const nameCell =
                        row.querySelector(
                            ".staff-name"
                        );


                    if (nameCell) {

                        nameCell.textContent =
                            data.staff.name;

                    }


                    const emailCell =
                        row.querySelector(
                            ".staff-email"
                        );


                    if (emailCell) {

                        emailCell.textContent =
                            data.staff.email;

                    }


                    const statusBadge =
                        row.querySelector(
                            ".status-badge"
                        );


                    if (statusBadge) {

                        statusBadge.textContent =
                            data.staff.status_display;


                        statusBadge.className =
                            "status-badge " +
                            data.staff.status;

                    }


                    button.dataset.name =
                        data.staff.name;


                    button.dataset.email =
                        data.staff.email;


                    button.dataset.status =
                        data.staff.status;

                }


                closeModal(
                    "staff-modal"
                );


            } catch (error) {

                console.error(
                    "Save staff error:",
                    error
                );


                alert(
                    error.message ||
                    "Something went wrong while saving."
                );

            }

        }
    );

}


/* ============================================================
   DELETE STAFF
============================================================ */

const deleteStaff =
    document.getElementById(
        "delete-staff"
    );


if (deleteStaff) {

    deleteStaff.addEventListener(
        "click",
        async () => {

            const id =
                deleteStaff.dataset.id;


            const name =
                deleteStaff.dataset.name ||
                "this staff member";


            if (!id) {

                alert(
                    "Staff member ID is missing."
                );

                return;
            }


            const confirmed =
                window.confirm(
                    `Are you sure you want to delete staff member "${name}"? This action cannot be undone.`
                );


            if (!confirmed) {
                return;
            }


            try {

                const response =
                    await fetch(
                        `/staff/${id}/delete/`,
                        {
                            method: "POST",

                            headers: {
                                "X-CSRFToken":
                                    getCookie(
                                        "csrftoken"
                                    )
                            }
                        }
                    );


                const data =
                    await response.json();


                if (
                    !response.ok ||
                    !data.success
                ) {

                    throw new Error(
                        data.error ||
                        "Unable to delete staff member."
                    );

                }


                const button =
                    document.querySelector(
                        `.edit-staff[data-id="${id}"]`
                    );


                const row =
                    button?.closest(
                        ".staff-row"
                    );


                if (row) {
                    row.remove();
                }


                closeModal(
                    "staff-modal"
                );


            } catch (error) {

                console.error(
                    "Delete staff error:",
                    error
                );


                alert(
                    error.message ||
                    "Something went wrong while deleting."
                );

            }

        }
    );

}


/* ============================================================
   STAFF SEARCH
============================================================ */

const staffSearch =
    document.getElementById(
        "staff-search"
    );


if (staffSearch) {

    staffSearch.addEventListener(
        "input",
        () => {

            const search =
                staffSearch.value
                    .trim()
                    .toLowerCase();


            document
                .querySelectorAll(".staff-row")
                .forEach((row) => {

                    const name =
                        (
                            row.dataset.name ||
                            ""
                        ).toLowerCase();


                    const email =
                        (
                            row.dataset.email ||
                            ""
                        ).toLowerCase();


                    row.style.display =
                        name.includes(search) ||
                        email.includes(search)
                            ? ""
                            : "none";

                });

        }
    );

}


/* ============================================================
   GOWN FILTERS
============================================================ */

const gownCards =
    document.querySelectorAll(
        ".gown-card"
    );


const gownSearchInput =
    document.getElementById(
        "gown-search"
    );


const colorFilters =
    document.querySelectorAll(
        ".color-filter"
    );


const styleFilters =
    document.querySelectorAll(
        ".style-filter"
    );


const sizeFilters =
    document.querySelectorAll(
        ".size-filters button"
    );


const recordCount =
    document.querySelector(
        ".record-count"
    );


const totalGownCount =
    document.getElementById(
        "total-gown-count"
    );


function filterGowns() {

    const search =
        gownSearchInput
            ? gownSearchInput.value
                .trim()
                .toLowerCase()
            : "";


    const activeColor =
        document.querySelector(
            ".color-filter.active"
        )?.dataset.color ||
        "all";


    const activeStyle =
        document.querySelector(
            ".style-filter.active"
        )?.dataset.style ||
        "all";


    const selectedSizes =
        Array.from(
            sizeFilters
        )
        .filter(
            (button) =>
                button.classList.contains(
                    "active"
                )
        )
        .map(
            (button) =>
                button.dataset.size
        );


    let visibleCount = 0;


    gownCards.forEach((card) => {

        const name =
            (
                card.dataset.gownName ||
                ""
            ).toLowerCase();


        const color =
            card.dataset.color ||
            "";


        const style =
            card.dataset.style ||
            "";


        const size =
            card.dataset.size ||
            "";


        const searchMatch =
            name.includes(search);


        const colorMatch =
            activeColor === "all" ||
            color === activeColor;


        const styleMatch =
            activeStyle === "all" ||
            style === activeStyle;


        const sizeMatch =
            selectedSizes.length === 0 ||
            selectedSizes.includes(size);


        const shouldShow =
            searchMatch &&
            colorMatch &&
            styleMatch &&
            sizeMatch;


        if (shouldShow) {

            card.style.display = "";

            visibleCount++;

        } else {

            card.style.display =
                "none";

        }

    });


    if (recordCount) {

        recordCount.textContent =
            visibleCount;

    }


    if (totalGownCount) {

        totalGownCount.textContent =
            gownCards.length;

    }

}


/* ============================================================
   GOWN SEARCH
============================================================ */

if (gownSearchInput) {

    gownSearchInput.addEventListener(
        "input",
        filterGowns
    );

}


/* ============================================================
   COLOR FILTER
============================================================ */

colorFilters.forEach((filter) => {

    filter.addEventListener(
        "click",
        () => {

            colorFilters.forEach(
                (item) => {
                    item.classList.remove(
                        "active"
                    );
                }
            );


            filter.classList.add(
                "active"
            );


            filterGowns();

        }
    );

});


/* ============================================================
   STYLE FILTER
============================================================ */

styleFilters.forEach((filter) => {

    filter.addEventListener(
        "click",
        () => {

            styleFilters.forEach(
                (item) => {
                    item.classList.remove(
                        "active"
                    );
                }
            );


            filter.classList.add(
                "active"
            );


            filterGowns();

        }
    );

});


/* ============================================================
   SIZE FILTER
============================================================ */

sizeFilters.forEach((button) => {

    button.addEventListener(
        "click",
        () => {

            button.classList.toggle(
                "active"
            );


            filterGowns();

        }
    );

});


/* ============================================================
   INITIALIZE GOWN FILTERS
============================================================ */

filterGowns();
