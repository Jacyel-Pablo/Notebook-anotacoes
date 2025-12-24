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
        id = request.GET['id']
        expiracao = {"exp": datetime.datetime.now(timezone.utc) + timedelta(hours=1), "id": id}

        token = encode(expiracao, os.getenv("JWT_KEY"))

        return JsonResponse({"valor": token})

    except Exception as e:
        print(e)
        return JsonResponse({"valor": "", "erro": "Ocorreu um erro no sistema"})
    
@csrf_exempt
def validar_jwt(request):
    try:
        token = request.META.get("HTTP_AUTHORIZATION").split(" ")[1]

        try:
            jwt = decode(token, os.getenv("JWT_KEY"), algorithms=["HS256"])

            try:
                usuario = notebook_usuario.objects.get(id=jwt["id"])

                if usuario.ativo == True:
                    return JsonResponse(True, safe=False)
                            
                else:
                    return JsonResponse({"valor": "", "erro": "usuário inválido"})
                
            except Exception as e:
                print(e)
                return JsonResponse({"valor": "", "erro": "usuário inválido"})

        except ExpiredSignatureError:
            return JsonResponse(False, safe=False)

    except Exception as e:
        print(e)
        return JsonResponse(False, safe=False)

    except Exception as e:
        print(e)
        return JsonResponse({"valor": "", "erro": "usuário inválido"})
