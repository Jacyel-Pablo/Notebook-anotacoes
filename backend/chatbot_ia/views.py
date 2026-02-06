from django.shortcuts import render
from django.http import JsonResponse
from cadastro.models import notebook_usuario
from .models import notebook_mensagens_ia
from cryptography.fernet import Fernet
from dotenv import load_dotenv
from openai import OpenAI
import jwt
import os

# Create your views here.

load_dotenv()

f = Fernet(os.getenv("ANOTACAOES_KEY"))

client = OpenAI(
  base_url="https://openrouter.ai/api/v1",
  api_key=os.getenv("KEY_IA")
)

def ia(request):
    if (request.method == "GET"):
        jwt_token = request.META.get("HTTP_AUTHORIZATION").split(" ")[1]
        mensagem = request.GET["msg"]
        mensagem_ia = ""

        try:
            jwt_token = jwt.decode(jwt_token, os.getenv("JWT_KEY"), algorithms=["HS256"])

            notebook_usuario.objects.get(id=jwt_token["id"])

            try:
                while (len(mensagem_ia) == 0):
                    completion = client.chat.completions.create(
                        model=os.getenv("MODELO_IA"),
                        messages=[
                            {
                            "role": "system",
                            "content": os.getenv("CONFIG_IA")
                            },
                            {
                            "role": "user",
                            "content": mensagem
                            }
                        ]
                    )

                    mensagem_ia = completion.choices[0].message.content

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