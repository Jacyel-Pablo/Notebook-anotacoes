from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt
from django.middleware.csrf import get_token
from django.http import JsonResponse
from django_ratelimit.decorators import ratelimit
from jwt import encode, decode, ExpiredSignatureError
import datetime
from datetime import timedelta, timezone
from cadastro.models import notebook_usuario
from dotenv import load_dotenv
import os

load_dotenv()

# Create your views here.

@ratelimit(key='ip', rate='3/m', block=True)
def csrf_token(request):
    try:
        token = get_token(request)

        resp = JsonResponse({"valor": token})
        resp.status_code = 200
        return resp

    except Exception as e:
        print(e)
        resp = JsonResponse({"valor": "", "erro": "Ocorreu um erro ao enviar o token"})
        resp.status_code = 404
        return resp
    
@ratelimit(key='ip', rate='3/m', block=True)
def jwt(request):
    try:
        id = request.GET['id']
        expiracao = {"exp": datetime.datetime.now(timezone.utc) + timedelta(hours=1), "id": id}

        token = encode(expiracao, os.getenv("JWT_KEY"))

        res = JsonResponse({"valor": token})
        res.status_code = 200
        return res

    except Exception as e:
        print(e)
        res = JsonResponse({"valor": "", "erro": "Ocorreu um erro no sistema"})
        res.status_code = 404
        return res
    
@csrf_exempt
@ratelimit(key='ip', rate='10/m', block=True)
def validar_jwt(request):
    try:
        token = request.META.get("HTTP_AUTHORIZATION").split(" ")[1]

        try:
            jwt = decode(token, os.getenv("JWT_KEY"), algorithms=["HS256"])

            return JsonResponse(True, safe=False)

        except ExpiredSignatureError:
            return JsonResponse(False, safe=False)

    except Exception as e:
        print(e)
        return JsonResponse(False, safe=False)
