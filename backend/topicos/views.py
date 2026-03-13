from django.shortcuts import render
from django.http import JsonResponse
from django_ratelimit.decorators import ratelimit
from cryptography.fernet import Fernet
from anotacao.models import notebook_anotacoes
from cadastro.models import notebook_usuario
from .models import notebook_topicos
import json
import os
import jwt

# Create your views here.

f = Fernet(os.getenv("ANOTACAOES_KEY"))

@ratelimit(key='ip', rate='8/m', block=True)
def criarTopico(request):
    if request.method == "POST":
        try:
            jwt_token = request.META.get("HTTP_AUTHORIZATION").split(" ")[1]
            jwt_token = jwt.decode(jwt_token, os.getenv("JWT_KEY"), algorithms=["HS256"])

            try:
                corpo = json.loads(request.body)
                topico = corpo["topico"]

                if len(topico) < 5:
                    res = JsonResponse({"erro": "O tópico precisa ter no minimo 5 caracteres"})
                    res.status_code = 400

                    return res

                topico = f.encrypt(topico.encode("utf-8"))
                topico = str(topico)[2:len(str(topico)) - 1]

                if len(topico) >= 2000:
                    res = JsonResponse({"erro": "A quantidade de caracteres e muito grande, tente escrever um tópico menor"})
                    res.status_code = 400

                    return res
                
                try:
                    usuario = notebook_usuario.objects.get(id=jwt_token["id"])

                    topico_gerado = notebook_topicos.objects.create(id_usuario=usuario, nome_topico=topico)

                    res = JsonResponse({"erro": "", "valor": topico_gerado.id})
                    res.status_code = 201

                    return res

                except Exception as e:
                    print(e)

                    res = JsonResponse({"erro": "Ocorreu um erro ao tentar criar um tópico"})
                    res.status_code = 500

                    return res

            except Exception as e:
                print(e)

                res = JsonResponse({"erro": "Ocorreu um erro ao tentar pegar o tópico enviado"})
                res.status_code = 400

                return res

        except Exception as e:
            print(e)

            res = JsonResponse({"erro": "Usuário inválido"})
            res.status_code = 401
            
            return res

    else:
        res = JsonResponse({"erro": "Método de request inválido"})
        res.status_code = 405

        return res
    
@ratelimit(key='ip', rate='10/m', block=True)
def pegarTopicos(request):
    if request.method == "GET":
        try:
            jwt_token = request.META.get("HTTP_AUTHORIZATION").split(" ")[1]
            jwt_token = jwt.decode(jwt_token, os.getenv("JWT_KEY"), algorithms=["HS256"])

            try:
                usuario = notebook_usuario.objects.get(id=jwt_token["id"])

                topicos = notebook_topicos.objects.filter(id_usuario=usuario).values("id", "nome_topico")

                for i in range(len(topicos)):
                    topicos[i]["nome_topico"] = f.decrypt(topicos[i]["nome_topico"]).decode("utf-8")

                res = JsonResponse({"erro": "", "valor": list(topicos)})
                res.status_code = 200
                return res

            except Exception as e:
                print(e)

                res = JsonResponse({"erro": "Ocorreu um erro ao tentar lista os tópicos"})
                res.status_code = 500
                return res

        except Exception as e:
            print(e)
            
            res = JsonResponse({"erro": "Usuário inválido"})
            res.status_code = 401
            return res

    else:
        res = JsonResponse({"erro": "Método de request inválido"})
        res.status_code = 405
        return 
    
@ratelimit(key='ip', rate='10/m', block=True)
def apagarTopico(request):
    if request.method == "DELETE":
        try:
            jwt_token = request.META.get("HTTP_AUTHORIZATION").split(" ")[1]
            jwt_token = jwt.decode(jwt_token, os.getenv("JWT_KEY"), algorithms=["HS256"])

            try:
                corpo = json.loads(request.body)

                idTopico = corpo["id_topico"]

                usuario = notebook_usuario.objects.get(id=jwt_token["id"])

                # Apagar todas as anotações das anotações que estão relacionadas ao tópico
                notebook_anotacoes.objects.filter(id_topicos=idTopico, usuario=usuario).delete()

                # Apagar o tópico em sí
                notebook_topicos.objects.filter(id=idTopico, id_usuario=usuario).delete()

                res = JsonResponse({"erro": ""})
                res.status_code = 200
                return res

            except Exception as e:
                print(e)

                res = JsonResponse({"erro": "Ocorreu um erro ao tentar apagar o tópicos especificado"})
                res.status_code = 500
                return res

        except Exception as e:
            print(e)
            
            res = JsonResponse({"erro": "Usuário inválido"})
            res.status_code = 401
            return res

    else:
        res = JsonResponse({"erro": "Método de request inválido"})
        res.status_code = 405
        return 
    
@ratelimit(key='ip', rate='5/m', block=True)
def atualizarTopico(request):
    if request.method == "PATCH":
        try:
            jwt_token = request.META.get("HTTP_AUTHORIZATION").split(" ")[1]
            jwt_token = jwt.decode(jwt_token, os.getenv("JWT_KEY"), algorithms=["HS256"])

            try:
                corpo = json.loads(request.body)

                idTopico = corpo["id_topico"]
                novoNome = corpo["novo_nome"]
                
                if len(novoNome) < 5:
                    res = JsonResponse({"erro": "O novo nome precisa ter no minimo 5 caracteres"})
                    res.status_code = 500

                    return res

                novoNomeEncrypt = f.encrypt(novoNome.encode("utf-8"))
                novoNomeEncrypt = str(novoNomeEncrypt)[2:len(str(novoNomeEncrypt)) - 1]

                topico = notebook_topicos.objects.get(id=idTopico)
                topico.nome_topico = novoNomeEncrypt
                topico.save()

                res = JsonResponse({"erro": ""})
                res.status_code = 200
                return res

            except Exception as e:
                print(e)

                res = JsonResponse({"erro": "Ocorreu um erro ao tentar atualizar o tópicos especificado"})
                res.status_code = 500
                return res

        except Exception as e:
            print(e)

            res = JsonResponse({"erro": "Usuário inválido"})
            res.status_code = 401
            return res

    else:
        res = JsonResponse({"erro": "Método de request inválido"})
        res.status_code = 405
        return res