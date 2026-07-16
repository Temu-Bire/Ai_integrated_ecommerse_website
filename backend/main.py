from fastapi import FastAPI

app = FastAPI(
    title="X Electronics API",
    version="1.0.0"
)

@app.get("/")
def root():
    return {
        "message": "Welcome to X Electronics API"
    }