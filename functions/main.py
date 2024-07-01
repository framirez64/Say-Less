# Welcome to Cloud Functions for Firebase for Python!
# To get started, simply uncomment the below code or create your own.
# Deploy with `firebase deploy`

from firebase_functions import https_fn
from firebase_admin import initialize_app
import firebase_admin
from firebase_admin import credentials

cred = credentials.Certificate("say-less-forked-3c4d4-firebase-adminsdk-g80n9-487b1aaa65.json")
firebase_admin.initialize_app(cred)

initialize_app()

@https_fn.on_request()
def on_request_example(req: https_fn.Request) -> https_fn.Response:
    return https_fn.Response("Hello world!")