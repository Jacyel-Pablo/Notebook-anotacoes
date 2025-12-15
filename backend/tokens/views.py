from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt
from django.middleware.csrf import get_token
from django.http import JsonResponse
from jwt import encode, decode, ExpiredSignatureError
import datetime
from datetime import timedelta, timezone
from cadastro.models import notebook_usuario
from dotenv import load_dotenv
import os

load_dotenv()

# Create your views here.

def csrf_token(request):
    try:
        token = get_token(request)
        return JsonResponse({"valor": token})

    except Exception as e:
        print(e)
        return JsonResponse({"valor": "", "erro": "Ocorreu um erro ao enviar o token"})
    
def jwt(request):
    try:
        expiracao = {"exp": datetime.datetime.now(timezone.utc) + timedelta(hours=1)}

        token = encode(expiracao, os.getenv("JWT_KEY"))

        return JsonResponse({"valor": token})

    except Exception as e:
        print(e)
        return JsonResponse({"valor": "", "erro": "Ocorreu um erro no sistema"})
    
@csrf_exempt
def validar_jwt(request):
    try:
        email = request.GET['email']
        usuario = notebook_usuario.objects.get(email=email)

        if usuario.ativo == True:
            try:
                token = request.GET["token"]

                try:
                    decode(token, os.getenv("JWT_KEY"), algorithms=["HS256"])
                    return JsonResponse(True, safe=False)

                except ExpiredSignatureError:
                    return JsonResponse(False, safe=False)

            except Exception as e:
                print(e)
                return JsonResponse(False, safe=False)
            
        else:
            return JsonResponse({"valor": "", "erro": "usuário inválido"})

    except Exception as e:
        print(e)
        return JsonResponse({"valor": "", "erro": "usuário inválido"})
