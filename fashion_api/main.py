import threading

import numpy as np
from PIL import Image
from fastapi import FastAPI, File, UploadFile, HTTPException
from fashion_clip.fashion_clip import FashionCLIP


app = FastAPI(
    title="Kasal Avenue FashionCLIP API"
)


# -----------------------------------------
# MODEL STATE
# -----------------------------------------

fclip = None
model_error = None
model_loading = False


# -----------------------------------------
# LOAD FASHIONCLIP IN BACKGROUND
# -----------------------------------------

def load_fashionclip():

    global fclip
    global model_error
    global model_loading

    model_loading = True

    try:

        print("================================", flush=True)
        print("STARTING FASHIONCLIP LOAD", flush=True)
        print("================================", flush=True)

        fclip = FashionCLIP("fashion-clip")

        print("================================", flush=True)
        print("FASHIONCLIP LOADED SUCCESSFULLY", flush=True)
        print("================================", flush=True)

    except Exception as e:

        model_error = repr(e)

        print("================================", flush=True)
        print("FASHIONCLIP FAILED", flush=True)
        print(model_error, flush=True)
        print("================================", flush=True)

    finally:

        model_loading = False


@app.on_event("startup")
async def startup_event():

    print("FastAPI startup complete.", flush=True)

    thread = threading.Thread(
        target=load_fashionclip,
        daemon=True
    )

    thread.start()


# -----------------------------------------
# NORMALIZE EMBEDDING
# -----------------------------------------

def normalize_embedding(embedding):

    embedding = np.asarray(
        embedding,
        dtype=np.float32
    )

    norm = np.linalg.norm(embedding)

    if norm == 0:
        return embedding

    return embedding / norm


# -----------------------------------------
# COLOR HISTOGRAM
# -----------------------------------------

def get_color_histogram(image):

    image = image.convert("RGB")
    image = image.resize((64, 64))

    image_array = np.asarray(
        image,
        dtype=np.uint8
    )

    bins = 8

    r = image_array[:, :, 0] // 32
    g = image_array[:, :, 1] // 32
    b = image_array[:, :, 2] // 32

    histogram = (
        r * bins * bins
        + g * bins
        + b
    )

    result = np.zeros(
        bins * bins * bins,
        dtype=np.float32
    )

    np.add.at(
        result,
        histogram.reshape(-1),
        1
    )

    total = result.sum()

    if total > 0:
        result /= total

    return result


# -----------------------------------------
# HEALTH CHECK
# -----------------------------------------

@app.get("/")
def health_check():

    return {
        "status": "ok",
        "service": "fashionclip-api",
        "model_loaded": fclip is not None,
        "model_loading": model_loading,
        "model_error": model_error
    }


# -----------------------------------------
# EMBEDDING API
# -----------------------------------------

@app.post("/embed")
async def create_embedding(
    file: UploadFile = File(...)
):

    if model_error is not None:

        raise HTTPException(
            status_code=500,
            detail=(
                "FashionCLIP failed to load: "
                + model_error
            )
        )

    if fclip is None:

        raise HTTPException(
            status_code=503,
            detail="FashionCLIP is still loading."
        )

    image_bytes = await file.read()

    from io import BytesIO

    image = Image.open(
        BytesIO(image_bytes)
    ).convert("RGB")

    embedding = fclip.encode_images(
        [image],
        batch_size=1
    )[0]

    embedding = normalize_embedding(
        embedding
    )

    color = get_color_histogram(
        image
    )

    return {
        "embedding": embedding.tolist(),
        "color": color.tolist()
    }