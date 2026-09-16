import numpy as np

from .fashion_api_client import (
    get_fashion_embedding
)


MIN_SIMILARITY = 0.60

FASHION_WEIGHT = 0.85
COLOR_WEIGHT = 0.15


# ============================================================
# COLOR SIMILARITY
# ============================================================

def color_similarity(
    color_a,
    color_b
):

    a = np.asarray(
        color_a,
        dtype=np.float32
    )

    b = np.asarray(
        color_b,
        dtype=np.float32
    )

    # Histogram intersection
    score = np.minimum(
        a,
        b
    ).sum()

    return float(score)


# ============================================================
# FIND SIMILAR GOWNS
# ============================================================

def find_similar_gowns(
    uploaded_file,
    gowns,
    top_k=12
):

    # --------------------------------------------------------
    # SEND USER IMAGE TO FASHIONCLIP API
    # --------------------------------------------------------

    query_result = get_fashion_embedding(
        uploaded_file
    )

    query_embedding = np.asarray(
        query_result["embedding"],
        dtype=np.float32
    )

    query_color = np.asarray(
        query_result["color"],
        dtype=np.float32
    )


    # --------------------------------------------------------
    # COMPARE WITH SAVED GOWN EMBEDDINGS
    # --------------------------------------------------------

    results = []

    for gown in gowns:

        if not gown.fashion_embedding:
            continue

        if not gown.color_histogram:
            continue


        gown_embedding = np.asarray(
            gown.fashion_embedding,
            dtype=np.float32
        )

        gown_color = np.asarray(
            gown.color_histogram,
            dtype=np.float32
        )


        # ----------------------------------------------------
        # FASHIONCLIP SIMILARITY
        # ----------------------------------------------------

        fashion_score = float(
            np.dot(
                query_embedding,
                gown_embedding
            )
        )


        # ----------------------------------------------------
        # COLOR SIMILARITY
        # ----------------------------------------------------

        color_score = color_similarity(
            query_color,
            gown_color
        )


        # ----------------------------------------------------
        # FINAL SCORE
        # ----------------------------------------------------

        final_score = (
            FASHION_WEIGHT * fashion_score
            +
            COLOR_WEIGHT * color_score
        )


        # ----------------------------------------------------
        # THRESHOLD
        # ----------------------------------------------------

        if final_score < MIN_SIMILARITY:
            continue


        results.append(
            {
                "id": gown.id,
                "score": round(
                    final_score,
                    4
                ),
                "fashion_score": round(
                    fashion_score,
                    4
                ),
                "color_score": round(
                    color_score,
                    4
                )
            }
        )


    # --------------------------------------------------------
    # SORT
    # --------------------------------------------------------

    results.sort(
        key=lambda x: x["score"],
        reverse=True
    )


    return results[:top_k]