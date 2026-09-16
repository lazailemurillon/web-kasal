document.addEventListener("DOMContentLoaded", function () {

    /*
    ==========================================
    FILTER PANEL
    ==========================================
    */

    const filterButton =
        document.getElementById("filterButton");

    const filterPanel =
        document.getElementById("filterPanel");

    if (filterButton && filterPanel) {

        filterButton.addEventListener("click", function () {
            filterPanel.classList.toggle("active");

        });

    }


    /*
    ==========================================
    LOGIN MODAL
    ==========================================
    */

    const loginModal = document.getElementById("loginModal");
    const closeModal = document.getElementById("closeModal");
    const bookButtons =document.querySelectorAll(".book-now-button");


    /*
    If the user is NOT logged in,
    Django renders the modal.

    Clicking BOOK NOW opens it.
    */

    bookButtons.forEach(function (button) {

        button.addEventListener("click", function () {

            if (loginModal) {

                loginModal.classList.add("active");

            } else {

                /*If the modal doesn't exist,the user is logged in.Send them to the booking page.*/

                const gownId =button.dataset.gownId;
                window.location.href =`/book/${gownId}/`;

            }

        });

    });


    /*
    Close modal
    */

    if (closeModal) {
        closeModal.addEventListener("click", function () {
            loginModal.classList.remove("active");
        });

    }


    /*
    Close when clicking outside modal
    */

    if (loginModal) {
        loginModal.addEventListener("click", function (event) {
            if (event.target === loginModal) {
                loginModal.classList.remove("active");
            }
        });
    }


    /*
    ==========================================
    SEARCH
    ==========================================
    */

    const searchInput = document.getElementById("searchInput");
    const gownCards = document.querySelectorAll(".gown-card");


    if (searchInput) {

        searchInput.addEventListener("input", function () {

            const search = searchInput.value.toLowerCase().trim();


            gownCards.forEach(function (card) {

                const name = card.dataset.name;

                const designer = card.dataset.designer;


                const matches = name.includes(search) || designer.includes(search);


                card.style.display = matches ? "" : "none";
            });

        });

    }


    /*
    ==========================================
    SIZE FILTER BUTTONS
    ==========================================
    */

    const sizeButtons =document.querySelectorAll(".size-options button");


    sizeButtons.forEach(function (button) {

        button.addEventListener("click", function () {
            button.classList.toggle("selected");
            applyFilters();
        });

    });


    /*
    ==========================================
    COLOR / STYLE FILTERS
    ==========================================
    */

    const filterInputs =
        document.querySelectorAll(
            ".color-filter, .style-filter"
        );


    filterInputs.forEach(function (input) {
        input.addEventListener("change", function () {
            applyFilters();

        });

    });


    function applyFilters() {
        const selectedColors =
            Array.from(
                document.querySelectorAll(".color-filter:checked")
            ).map(function (input) {
                return input.value;
            });


        const selectedStyles =
            Array.from(document.querySelectorAll(".style-filter:checked"
                )).map(function (input) {
                return input.value;
            });


        const selectedSizes =
            Array.from(
                document.querySelectorAll(".size-options button.selected"
                )
            ).map(function (button) {
                return button.textContent.trim();
            });


        gownCards.forEach(function (card) {

            const color =card.dataset.color;
            const style =card.dataset.style;
            const size =card.dataset.size;

            const colorMatch = selectedColors.length === 0 || selectedColors.includes(color);
            const styleMatch = selectedStyles.length === 0 || selectedStyles.includes(style);
            const sizeMatch = selectedSizes.length === 0 || selectedSizes.includes(size);
            if ( colorMatch && styleMatch && sizeMatch
            ) {
                card.style.display = "";
            } else {
                card.style.display = "none";
            }

        });

    }

    /*
==========================================
FILTER CATALOG BY AI RESULTS
==========================================
*/

function filterGownCatalog(matchingIds) {

    // Convert all IDs to strings
    const matchingIdStrings = matchingIds.map(function (id) {
        return String(id);
    });


    gownCards.forEach(function (card) {

        const gownId = card.dataset.gownId;


        if (matchingIdStrings.includes(gownId)) {

            card.style.display = "";

        } else {

            card.style.display = "none";

        }

    });

}

    
/*
==========================================
INSPIRATION PHOTO UPLOAD
==========================================
*/

const uploadInspirationButton =document.getElementById("uploadInspirationButton");

const uploadModal =document.getElementById("uploadModal");

const closeUploadModal =document.getElementById("closeUploadModal");

const inspirationPhoto =document.getElementById("inspirationPhoto");

const selectedPhoto =
    document.getElementById("selectedPhoto");

const selectedPhotoName =
    document.getElementById("selectedPhotoName");

const removePhoto =
    document.getElementById("removePhoto");

const findGownsButton =document.getElementById("findGownsButton");


/*
==========================================
OPEN CORRECT MODAL
==========================================
*/

if (uploadInspirationButton) {

    uploadInspirationButton.addEventListener(
        "click",
        function () {

            if (uploadModal) {

                uploadModal.classList.add("active");

            } else if (loginModal) {

                loginModal.classList.add("active");

            }

        }
    );

}


/*
==========================================
CLOSE LOGIN MODAL
==========================================
*/

if (loginModal && closeModal) {

    closeModal.addEventListener(
        "click",
        function () {

            loginModal.classList.remove("active");

        }
    );

}


/*
==========================================
CLOSE LOGIN MODAL
WHEN CLICKING OUTSIDE
==========================================
*/

if (loginModal) {

    loginModal.addEventListener(
        "click",
        function (event) {

            if (event.target === loginModal) {

                loginModal.classList.remove("active");

            }

        }
    );

}


/*
==========================================
CLOSE UPLOAD MODAL
==========================================
*/

if (uploadModal && closeUploadModal) {

    closeUploadModal.addEventListener(
        "click",
        function () {

            uploadModal.classList.remove("active");

        }
    );

}


/*
==========================================
CLOSE UPLOAD MODAL
WHEN CLICKING OUTSIDE
==========================================
*/

if (uploadModal) {

    uploadModal.addEventListener(
        "click",
        function (event) {

            if (event.target === uploadModal) {

                uploadModal.classList.remove("active");

            }

        }
    );

}


/*
==========================================
SELECT INSPIRATION PHOTO
==========================================
*/

if (inspirationPhoto) {

    inspirationPhoto.addEventListener(
        "change",
        function () {

            const file =
                inspirationPhoto.files[0];


            if (!file) {
                return;
            }


            /*
            Make sure selected file is an image.
            */

            if (!file.type.startsWith("image/")) {

                alert(
                    "Please select an image file."
                );

                inspirationPhoto.value = "";

                return;

            }


            /*
            Show selected filename
            instead of a large image preview.
            */

            if (selectedPhotoName) {

                selectedPhotoName.textContent =
                    file.name;

            }


            selectedPhoto.classList.add("active");

            findGownsButton.disabled = false;

        }
    );

}



/*
==========================================
REMOVE PHOTO
==========================================
*/

if (removePhoto) {

    removePhoto.addEventListener(
        "click",
        function () {

            inspirationPhoto.value = "";

            if (selectedPhotoName) {
                selectedPhotoName.textContent = "";
            }

            selectedPhoto.classList.remove("active");

            findGownsButton.disabled = true;

        }
    );

}



/*
==========================================
FIND SIMILAR GOWNS
==========================================
*/

if (findGownsButton) {

    findGownsButton.addEventListener(
        "click",
        async function () {

            // Make sure there is a photo
            if (!inspirationPhoto.files.length) {
                return;
            }

            // Disable button while AI is working
            findGownsButton.disabled = true;

            const originalText = findGownsButton.textContent;

            findGownsButton.textContent = "FINDING SIMILAR GOWNS...";

            // Create form data
            const formData = new FormData();

            formData.append(
                "photo",
                inspirationPhoto.files[0]
            );

            try {

                // Get CSRF token
                const csrfToken = getCookie("csrftoken");

                // Send image to Django
                const response = await fetch(
                    "/api/find-similar-gowns/",
                    {
                        method: "POST",

                        headers: {
                            "X-CSRFToken": csrfToken
                        },

                        body: formData
                    }
                );

                const data = await response.json();

                // Check Django response
                if (!response.ok || !data.success) {

                    throw new Error(
                        data.error || "Something went wrong."
                    );
                }

                console.log(
                    "Similar gown IDs:",
                    data.gown_ids
                );

                console.log(
                    "FashionCLIP results:",
                    data.results
                );

                // Filter catalog
                filterGownCatalog(
                    data.gown_ids
                );

                // Close modal
                if (uploadModal) {
                    uploadModal.classList.remove("active");
                }

            } catch (error) {

                console.error(
                    "Similar gown search failed:",
                    error
                );

                alert(
                    error.message ||
                    "Unable to find similar gowns."
                );

            } finally {

                // Restore button
                findGownsButton.disabled = false;

                findGownsButton.textContent = originalText;
            }
        }
    );

}
/*
==========================================
GET DJANGO CSRF COOKIE
==========================================
*/

function getCookie(name) {

    let cookieValue = null;

    if (document.cookie && document.cookie !== "") {

        const cookies = document.cookie.split(";");

        for (let i = 0; i < cookies.length; i++) {

            const cookie = cookies[i].trim();

            if (
                cookie.substring(
                    0,
                    name.length + 1
                ) === (name + "=")
            ) {

                cookieValue = decodeURIComponent(
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


});
