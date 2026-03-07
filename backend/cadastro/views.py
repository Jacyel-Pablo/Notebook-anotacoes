from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.hashers import make_password
from .models import notebook_usuario
from chatbot_ia.models import notebook_mensagens_ia
from topicos.models import notebook_topicos
from jwt import decode
from dotenv import load_dotenv
import hashlib
import os
import json

load_dotenv()

@csrf_exempt
def criar_conta(request):
    try:
        if request.method == "POST":
            dados = json.loads(request.body)
            nome = dados['nome']
            senha = dados['senha']
            confirmacao = dados['confirma']

            # Verificar tamanho do email e a senha
            if (len(nome) < 5 or len(senha) < 5):
                res = JsonResponse({"valor": "", "erro": "Email e senha precisam ter no minimo 5 caracteres"})
                res.status_code = 500
                return 

            # Veificando se a senha e a confirmação da mesma são iguais
            if (senha == confirmacao):
                # Criptografando o email
                nome = hashlib.sha256(nome.encode("utf-8")).hexdigest()

                # Se de erro significa que não existe um usuário com esse email mas se de funcionar significa que já existe um usuário
                try:
                    notebook_usuario.objects.get(nome=nome)

                    res = JsonResponse({"valor": "", "erro": "Já existe um usuário cadastrado com esse email"})
                    res.status_code = 500

                    return res

                except:
                    # Criptografando a senha
                    senha = make_password(senha, os.getenv("SALTOS"))

                    notebook_usuario.objects.create(nome=nome, senha=senha)

                    # enviar_email(dados['email'])

                    res = JsonResponse({"valor": nome})
                    res.status_code = 201

                    return res
            
            else:
                res = JsonResponse({"valor": "", "erro": "As senhas são diferentes"})
                res.status_code = 500

                return res

        else:
            res = JsonResponse({"valor": "", "erro": "Ocorreu um erro metodo de pegar incorreto"})
            res.status_code = 500
            return res

    except Exception as e:
        print(e)

        res = JsonResponse({"valor": "", "erro": "Ocorreu um erro inesperado"})
        res.status_code = 500
        return res
    
def apagar_usuario(request):
    if request.method == "DELETE":
        try:
            token_jwt = request.META.get("HTTP_AUTHORIZATION").split(" ")[1]
            jwt = decode(token_jwt, os.getenv("JWT_KEY"), algorithms=["HS256"])
            
            try:
                usuario_id = jwt["id"]

                try:
                    notebook_usuario.objects.get(id=usuario_id).delete()

                    notebook_mensagens_ia.objects.filter(id_usuario=usuario_id).delete()

                    notebook_topicos.objects.filter(id_usuario=usuario_id)

                    res = JsonResponse({"valor": ""})
                    res.status_code = 201

                    return res

                except:
                    res = JsonResponse({"valor": "", "erro": "Usuário inválido"})
                    res.status_code = 500

                    return res

            except:
                res = JsonResponse({"valor": "", "erro": "Usuário inválido"})
                res.status_code = 500

                return res

        except:
            res = JsonResponse({"valor": "", "erro": "JWT inválido tentar fazer login novamente"})
            res.status_code = 500

            return res

    else:
        res = JsonResponse({"valor": "", "erro": "Método utilizado está incorreto"})
        res.status_code = 500
        
        return res