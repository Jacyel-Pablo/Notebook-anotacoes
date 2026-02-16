from django.shortcuts import render
from django.http import JsonResponse
from cryptography.fernet import Fernet
from anotacao.models import notebook_anotacoes
from cadastro.models import notebook_usuario
from .models import notebook_topicos
import json
import os
import jwt

# Create your views here.

f = Fernet(os.getenv("ANOTACAOES_KEY"))

def criarTopico(request):
    if request.method == "POST":
        try:
            jwt_token = request.META.get("HTTP_AUTHORIZATION").split(" ")[1]
            jwt_token = jwt.decode(jwt_token, os.getenv("JWT_KEY"), algorithms=["HS256"])

            try:
                corpo = json.loads(request.body)
                topico = corpo["topico"]

                if len(topico) < 5:
                    return JsonResponse({"erro": "O tópico precisa ter no minimo 5 caracteres"})

                topico = f.encrypt(topico.encode("utf-8"))
                topico = str(topico)[2:len(str(topico)) - 1]

                if len(topico) >= 2000:
                    return JsonResponse({"erro": "A quantidade de caracteres e muito grande, tente escrever um tópico menor"})
                
                try:
                    usuario = notebook_usuario.objects.get(id=jwt_token["id"])

                    topico_gerado = notebook_topicos.objects.create(id_usuario=usuario, nome_topico=topico)

                    return JsonResponse({"erro": "", "valor": topico_gerado.id})

                except Exception as e:
                    print(e)

                    return JsonResponse({"erro": "Ocorreu um erro ao tentar criar um tópico"})

            except Exception as e:
                print(e)

                return JsonResponse({"erro": "Ocorreu um erro ao tentar pegar o tópico enviado"})

        except Exception as e:
            print(e)
            
            return JsonResponse({"erro": "Usuário inválido"})

    else:
        return JsonResponse({"erro": "Método de request inválido"})
    
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

                return JsonResponse({"erro": "", "valor": list(topicos)})

            except Exception as e:
                print(e)

                return JsonResponse({"erro": "Ocorreu um erro ao tentar lista os tópicos"})

        except Exception as e:
            print(e)
            
            return JsonResponse({"erro": "Usuário inválido"})

    else:
        return JsonResponse({"erro": "Método de request inválido"})
    
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

                return JsonResponse({"erro": ""})

            except Exception as e:
                print(e)

                return JsonResponse({"erro": "Ocorreu um erro ao tentar apagar o tópicos especificado"})

        except Exception as e:
            print(e)
            
            return JsonResponse({"erro": "Usuário inválido"})

    else:
        return JsonResponse({"erro": "Método de request inválido"})
    
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
                    return JsonResponse({"erro": "O novo nome precisa ter no minimo 5 caracteres"})

                novoNomeEncrypt = f.encrypt(novoNome.encode("utf-8"))
                novoNomeEncrypt = str(novoNomeEncrypt)[2:len(str(novoNomeEncrypt)) - 1]

                topico = notebook_topicos.objects.get(id=idTopico)
                topico.nome_topico = novoNomeEncrypt
                topico.save()

                return JsonResponse({"erro": ""})

            except Exception as e:
                print(e)

                return JsonResponse({"erro": "Ocorreu um erro ao tentar atualizar o tópicos especificado"})

        except Exception as e:
            print(e)
            
            return JsonResponse({"erro": "Usuário inválido"})

    else:
        return JsonResponse({"erro": "Método de request inválido"})