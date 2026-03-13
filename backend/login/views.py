from django.shortcuts import render
from django.http import JsonResponse
from django.contrib.auth.hashers import check_password
from django.views.decorators.csrf import csrf_exempt
from django_ratelimit.decorators import ratelimit
from cadastro.models import notebook_usuario
from dotenv import load_dotenv
import hashlib
import json

load_dotenv()

# Create your views here.

@csrf_exempt
@ratelimit(key='ip', rate='4/m', block=True)
def login(request):
    try:
        if (request.method == "POST"):
            dados = json.loads(request.body)
            nome = hashlib.sha256(dados['nome'].encode("utf-8")).hexdigest()
            senha = dados['senha']

            # Se existir um usuário ele vai fazer a verificação do email e a senha se não vai da erro
            try:
                banco = notebook_usuario.objects.get(nome=nome)

                id = banco.id

                if (check_password(senha, banco.senha)):
                    res = JsonResponse({"valor": id})
                    res.status_code = 200
                    return res
                
                else:
                    res = JsonResponse({"valor": "", "erro": "Email ou senha incorretos"})
                    res.status_code = 404
                    return res

            except Exception as e:
                print(e)
                res = JsonResponse({"valor": "", "erro": "Email ou senha incorretos"})
                res.status_code = 404
                return res

        else:
            res = JsonResponse({"valor": "", "erro": "a requisção foi usado um metódo que não e aceito"})
            res.status_code = 405
            return res

    except Exception as e:
        print(e)
        res = JsonResponse({"valor": "", "erro": "Ocorreu um erro inesperados"})
        res.status_code = 404
        return res