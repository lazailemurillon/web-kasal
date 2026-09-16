import requests

from django.conf import settings


def get_fashion_embedding(uploaded_file):

    api_url = settings.FASHION_API_URL

    if not api_url:
        raise RuntimeError(
            "FASHION_API_URL is not configured."
        )

    uploaded_file.seek(0)

    response = requests.post(
        f"{api_url}/embed",
        files={
            "file": (
                uploaded_file.name,
                uploaded_file,
                uploaded_file.content_type
            )
        },
        timeout=180
    )

    response.raise_for_status()

    return response.json()