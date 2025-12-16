from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.hashers import make_password
from .models import notebook_usuario
from dotenv import load_dotenv
import hashlib
import os
import resend
import json

load_dotenv()

# def enviar_email(email):
#     resend.api_key = os.environ["RESEND_API_KEY"]

#     params = {
#         "from": "notebook-anotacao@resend.dev",
#         "to": [email],
#         "subject": "Ative o seu usuário clique aqui",
#         "html": f'<h1>Ative o seu usuário <a href="https://notebook-anotacao.vercel.app/Ativar_usuario?email={email}">clique aqui</a></h1>',
#     }

#     resend.Emails.send(params)

# Create your views here.

@csrf_exempt
def criar_conta(request):
    try:
        if request.method == "POST":
            dados = json.loads(request.body)
            email = dados['email']
            senha = dados['senha']
            confirmacao = dados['confirma']

            # Verificar tamanho do email e a senha
            if (len(email) < 5 or len(senha) < 5):
                return JsonResponse({"valor": "", "erro": "Email e senha precisam ter no minimo 5 caracteres"})

            # Veificando se a senha e a confirmação da mesma são iguais
            if (senha == confirmacao):
                # Criptografando o email
                email = hashlib.sha256(email.encode("utf-8")).hexdigest()

                # Se de erro significa que não existe um usuário com esse email mas se de funcionar significa que já existe um usuário
                try:
                    notebook_usuario.objects.get(email=email)

                    return JsonResponse({"valor": "", "erro": "Já existe um usuário cadastrado com esse email"})

                except:
                    # Criptografando a senha
                    senha = make_password(senha, os.getenv("SALTOS"))

                    notebook_usuario.objects.create(email=email, senha=senha, ativo=True)

                    # enviar_email(dados['email'])

                    return JsonResponse({"valor": email})
            
            else:
                return JsonResponse({"valor": "", "erro": "As senhas são diferentes"})

        else:
            return JsonResponse({"valor": "", "erro": "Ocorreu um erro metodo de pegar incorreto"})

    except Exception as e:
        print(e)
        return JsonResponse({"valor": "", "erro": "Ocorreu um erro inesperado"})