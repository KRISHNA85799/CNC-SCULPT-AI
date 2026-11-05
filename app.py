from io import BytesIO
import os

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import FileResponse, Response
from fastapi.staticfiles import StaticFiles
from PIL import Image
from transformers import pipeline

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

app = FastAPI(title="CNC Sculpt AI")

print("Loading AI Model...")
depth_model = pipeline(
    "depth-estimation",
    model="depth-anything/Depth-Anything-V2-Small-hf",
    device=-1,  # CPU mode for standard cloud hosting
)
print("AI MODEL READY!")


@app.get("/health")
def health():
    return {"status": "ok", "message": "CNC Sculpt AI is running"}


@app.get("/")
def home():
    return FileResponse(os.path.join(BASE_DIR, "index.html"))


@app.post("/generate-depth")
async def generate_depth(file: UploadFile = File(...)):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Please upload an image file.")

    try:
        image_data = await file.read()
        image = Image.open(BytesIO(image_data)).convert("RGB")
        result = depth_model(image)
        depth_image = result["depth"]

        output = BytesIO()
        depth_image.save(output, format="PNG")
        return Response(content=output.getvalue(), media_type="image/png")
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Depth generation failed: {exc}")


# Serve CSS and JavaScript from the same domain as the API.
app.mount("/", StaticFiles(directory=BASE_DIR), name="static")
