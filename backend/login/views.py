from django.shortcuts import render
from django.http import JsonResponse
from django.contrib.auth.hashers import check_password
from django.views.decorators.csrf import csrf_exempt
from cadastro.models import notebook_usuario
from dotenv import load_dotenv
import hashlib
import json
import os

load_dotenv()

# Create your views here.

@csrf_exempt
def login(request):
    try:
        if (request.method == "POST"):
            dados = json.loads(request.body)
            email = hashlib.sha256(dados['email'].encode("utf-8")).hexdigest()
            senha = dados['senha']

            try:
                usuario = notebook_usuario.objects.get(email=email)

                if usuario.ativo == True:
                    # Se existir um usuário ele vai fazer a verificação do email e a senha se não vai da erro
                    try:
                        banco = notebook_usuario.objects.get(email=email)

                        if (check_password(senha, banco.senha)):
                            return JsonResponse({"valor": email})
                        
                        else:
                            return JsonResponse({"valor": "", "erro": "Email ou senha incorretos"})

                    except Exception as e:
                        print(e)
                        return JsonResponse({"valor": "", "erro": "Email ou senha incorretos"})
                
                else:
                    print(e)
                    return JsonResponse({"valor": "", "erro": "Email ou senha incorretos"})

            except Exception as e:
                print(e)
                return JsonResponse({"valor": "", "erro": "Email ou senha incorretos"})

        else:
            return JsonResponse({"valor": "", "erro": "a requisção foi usado um metódo que não e aceito"})

    except Exception as e:
        print(e)
        return JsonResponse({"valor": "", "erro": "Ocorreu um erro inesperados"})