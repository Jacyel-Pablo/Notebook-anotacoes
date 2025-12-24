from django.shortcuts import render
from django.http import JsonResponse
from cryptography.fernet import Fernet
from dotenv import load_dotenv
from .models import notebook_anotacoes
from cadastro.models import notebook_usuario
from django.views.decorators.csrf import csrf_exempt, csrf_protect
from jwt import decode, InvalidIssuerError
import hashlib
import json
import os

load_dotenv()

f = Fernet(os.getenv("ANOTACAOES_KEY"))

# Create your views here.

def enviar_anotacao(request):
    try:
        dados = json.loads(request.body)
        token_jwt = request.META.get("HTTP_AUTHORIZATION").split(" ")[1]
        jwt = decode(token_jwt, os.getenv("JWT_KEY"), algorithms=["HS256"])

        try:
            usuario = notebook_usuario.objects.get(id=jwt["id"])

            if usuario.ativo == True:
                try:
                    if request.method == "POST":
                        anotacao = f.encrypt(dados["anotacao"].encode("utf-8"))
                        # Tirando o b'' de bytes para ficar mas facil descriptografa depois
                        anotacao = str(anotacao)[2:len(str(anotacao)) - 1]

                        # Verifica se o usuário existe
                        try:
                            db_anotacaoes = notebook_anotacoes.objects.create(
                                usuario=usuario,
                                anotacao=anotacao

                            )

                            # Vamos descriptografa a anotação
                            descript = f.decrypt(db_anotacaoes.anotacao).decode("utf-8")
                            descript = str(descript)

                            # # Adicionado dado a uma lista
                            dados_anotacao = {"id": db_anotacaoes.id, "anotacao": descript, "data": db_anotacaoes.data}
                            
                            return JsonResponse({"valor": True, "dados": dados_anotacao})

                        except:
                            return JsonResponse({"valor": "", "erro": "Ocorreu um erro ao tentar criar uma anotação"})

                    return JsonResponse({"valor": "", "erro": "Ocorreu um erro ao tentar enviar a anotação"})
                
                except Exception as e:
                    print(e)
                    return JsonResponse({"valor": "", "erro": "Ocorreu um erro inesperado ao tentar enviar a anotação"})

            else:
                return JsonResponse({"valor": "", "erro": "usuário inválido"})
            
        except Exception as e:
            print(e)
            return JsonResponse({"valor": "", "erro": "usuário inválido"})

    except InvalidIssuerError as e:
        print(e)
        return JsonResponse({"valor": "", "erro": "Ocorreu um erro o token de login e inválido"})

def pegar_anotacao(request):
    try:
        token_jwt = request.META.get("HTTP_AUTHORIZATION").split(" ")[1]
        jwt = decode(token_jwt, os.getenv("JWT_KEY"), algorithms=["HS256"])

        try:
            dados_anotacao = []

            db_dados = notebook_anotacoes.objects.filter(usuario__id=jwt["id"])

            try:
                usuario = notebook_usuario.objects.get(id=jwt["id"])

                if usuario.ativo == True:
                    for i in db_dados:
                        # Vamos descriptografa a mensagem            
                        descript = f.decrypt(i.anotacao).decode("utf-8")
                        descript = str(descript)

                        # Adicionado dado a lista

                        dados_anotacao.append({"id": i.id, "anotacao": descript, "data": i.data})

                    return JsonResponse({"valor": True, "dados": dados_anotacao})
                
                else:
                    return JsonResponse({"valor": "", "erro": "usuário inválido"})
                
            except Exception as e:
                print(e)
                return JsonResponse({"valor": "", "erro": "usuário inválido"})
        
        except Exception as e:
            print(e)
            return JsonResponse({"valor": "", "erro": "Ocorreu um erro a tentar pegar as anotações"})

    except InvalidIssuerError as e:
        print(e)
        return JsonResponse({"valor": "", "erro": "Ocorreu um erro o token de login e inválido"})

def apagar_anotacao(request):
    try:
        dados = json.loads(request.body)
        token_jwt = request.META.get("HTTP_AUTHORIZATION").split(" ")[1]
        jwt = decode(token_jwt, os.getenv("JWT_KEY"), algorithms=["HS256"])

        try:
            usuario = notebook_usuario.objects.get(id=jwt["id"])

            if usuario.ativo == True:
                try:
                    if request.method == "DELETE":
                        id = dados["id_anotacao"]
                        notebook_anotacoes.objects.filter(id=id).delete()

                        return JsonResponse({"valor": True})

                    return JsonResponse({"valor": "", "erro": "Ocorreu um erro metódo utilizdado está incorreto"})
                
                except Exception as e:
                    print(e)
                    return JsonResponse({"valor": "", "erro": "Ocorreu um erro inesperado"})

            else:
                return JsonResponse({"valor": "", "erro": "usuário inválido"})

        except Exception as e:
            print(e)
            return JsonResponse({"valor": "", "erro": "usuário inválido"})

    except InvalidIssuerError as e:
        print(e)
        return JsonResponse({"valor": "", "erro": "Ocorreu um erro o token de login e inválido"})
