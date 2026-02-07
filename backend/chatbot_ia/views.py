from django.shortcuts import render
from django.http import JsonResponse
from cadastro.models import notebook_usuario
from .models import notebook_mensagens_ia
from cryptography.fernet import Fernet
from dotenv import load_dotenv
from openai import OpenAI
import jwt
import json
import os

# Create your views here.

load_dotenv()

f = Fernet(os.getenv("ANOTACAOES_KEY"))

client = OpenAI(
  base_url="https://openrouter.ai/api/v1",
  api_key=os.getenv("KEY_IA")
)

def ia(request):
    if (request.method == "POST"):
        jwt_token = request.META.get("HTTP_AUTHORIZATION").split(" ")[1]
        mensagem_ia = ""

        corpo = json.loads(request.body.decode("utf-8"))
        historico_msg = list(reversed(corpo["lista_msg"]))
        mensagem = corpo["msg"]

        try:
            jwt_token = jwt.decode(jwt_token, os.getenv("JWT_KEY"), algorithms=["HS256"])

            notebook_usuario.objects.get(id=jwt_token["id"])

            # Configurando a ia para lembrar o hisorico de conversas com o usuário
            memoria_ia_dados = [
                {
                    "role": "system",
                    "content": os.getenv("CONFIG_IA")
                },
            ]

            for i in range(len(historico_msg)):
                if i <= 4:
                    memoria_ia_dados.append({"role": "user", "content": historico_msg[i]["mensagem_usuario"]})
                    memoria_ia_dados.append({"role": "assistant", "content": historico_msg[i]["mensagem_ia"]})

                else:
                    break

            memoria_ia_dados.append({"role": "user", "content": mensagem})

            # Enviando os dados para ia
            try:
                while (len(mensagem_ia) == 0):
                    completion = client.chat.completions.create(
                        model=os.getenv("MODELO_IA"),
                        messages=memoria_ia_dados
                    )

                    mensagem_ia = completion.choices[0].message.content

                # Cripthogranfando e guadando dados no banco de dados
                mensagem_usuario = f.encrypt(mensagem.encode("utf-8"))
                mensagem_usuario = str(mensagem_usuario)[2:len(str(mensagem_usuario)) - 1]

                mensagem_ia_copy = f.encrypt(mensagem_ia.encode("utf-8"))
                mensagem_ia_copy = str(mensagem_ia_copy)[2:len(str(mensagem_ia_copy)) - 1]

                notebook_mensagens_ia.objects.create(id_usuario=jwt_token["id"], mensagem_usuario=mensagem_usuario, mensagem_ia=mensagem_ia_copy)

                return JsonResponse({"erro": "", "valor": mensagem_ia})

            except Exception as e:
                print(e)
                return JsonResponse({"erro": "Ocorreu um erro ao tentar gerar o texto"})

        except Exception as e:
            print(e)
            return JsonResponse({"erro": "jwt inválido ou usuário"})

    else:
        return JsonResponse({"erro": "Método inválido"})
    
def pegar_chats_antigo(request):
    if (request.method == "GET"):
        jwt_token = request.META.get("HTTP_AUTHORIZATION").split(" ")[1]

        try:
            jwt_token = jwt.decode(jwt_token, os.getenv("JWT_KEY"), algorithms=["HS256"])

            notebook_usuario.objects.get(id=jwt_token["id"])

            try:
                dados = notebook_mensagens_ia.objects.filter(id_usuario=jwt_token["id"]).values("mensagem_usuario", "mensagem_ia")

                dados_decrypted = []

                for i in list(dados):
                    # Vamos descriptografa a mensagem 
                    mensagem_usuario = f.decrypt(i["mensagem_usuario"]).decode("utf-8")
                    mensagem_usuario = str(mensagem_usuario)

                    mensagem_ia = f.decrypt(i["mensagem_ia"]).decode("utf-8")
                    mensagem_ia = str(mensagem_ia)

                    # Adicionado dado a lista

                    dados_decrypted.append({"mensagem_usuario": mensagem_usuario, "mensagem_ia": mensagem_ia})

                return JsonResponse({"erro": "", "valor": dados_decrypted})

            except Exception as e:
                print(e)
                return JsonResponse({"erro": "Ocorreu um erro ao tentar pegar as mensagens"})

        except Exception as e:
            print(e)
            return JsonResponse({"erro": "jwt inválido ou usuário"})

    else:
        return JsonResponse({"erro": "Método inválido"})
    
def limpar_historico_chat(request):
    if (request.method == "DELETE"):
        jwt_token = request.META.get("HTTP_AUTHORIZATION").split(" ")[1]

        try:
            jwt_token = jwt.decode(jwt_token, os.getenv("JWT_KEY"), algorithms=["HS256"])

            notebook_usuario.objects.get(id=jwt_token["id"])

            try:
                notebook_mensagens_ia.objects.filter(id_usuario=jwt_token["id"]).delete()

                return JsonResponse({"erro": ""})

            except Exception as e:
                print(e)
                return JsonResponse({"erro": "Ocorreu um erro ao tentar apagar o histórico"})

        except Exception as e:
            print(e)
            return JsonResponse({"erro": "jwt inválido ou usuário"})

    else:
        return JsonResponse({"erro": "Método inválido"})