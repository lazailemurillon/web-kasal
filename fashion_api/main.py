import numpy as np

from io import BytesIO

from PIL import Image

from fastapi import FastAPI, File, UploadFile

from fashion_clip.fashion_clip import FashionCLIP


app = FastAPI(
    title="Kasal Avenue FashionCLIP API"
)


fclip = None


@app.on_event("startup")
async def startup_event():

    global fclip

    print("================================")
    print("STARTING FASHIONCLIP LOAD")
    print("================================")

    fclip = FashionCLIP("fashion-clip")

    print("================================")
    print("FASHIONCLIP LOADED")
    print("================================")


def normalize_embedding(embedding):

    embedding = np.asarray(
        embedding,
        dtype=np.float32
    )

    norm = np.linalg.norm(embedding)

    if norm == 0:

        return embedding

    return embedding / norm


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


@app.get("/")
def health_check():

    return {
        "status": "ok",
        "service": "fashionclip-api"
    }


@app.post("/embed")
async def create_embedding(
    file: UploadFile = File(...)
):

    global fclip

    if fclip is None:

        return {
            "error": "FashionCLIP model is still loading."
        }

    image_bytes = await file.read()

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