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
    if request.method != "POST":
        return JsonResponse({"erro": "Método inválido"})

    try:
        # Extração do Token
        auth_header = request.META.get("HTTP_AUTHORIZATION")

        if not auth_header:
            return JsonResponse({"erro": "Token não fornecido"})
        
        jwt_token = auth_header.split(" ")[1]
        corpo = json.loads(request.body.decode("utf-8"))
        
        # O segredo: Pegar apenas os últimos 4 itens da lista original
        # Se a lista tiver menos de 4, o Python pegará o que estiver disponível.
        historico_bruto = corpo.get("lista_msg", [])
        ultimas_mensagens = historico_bruto[-4:] 
        
        mensagem_atual = corpo.get("msg")

        # Validação do Token
        token_decodificado = jwt.decode(jwt_token, os.getenv("JWT_KEY"), algorithms=["HS256"])
        usuario_id = token_decodificado["id"]
        notebook_usuario.objects.get(id=usuario_id)

        # Montagem da Memória (System Prompt)
        memoria_ia_dados = [
            {"role": "system", "content": os.getenv("CONFIG_IA")}
        ]

        # Adicionando o histórico selecionado
        for msg in ultimas_mensagens:
            memoria_ia_dados.append({"role": "user", "content": msg["mensagem_usuario"]})
            memoria_ia_dados.append({"role": "assistant", "content": msg["mensagem_ia"]})

        # Adicionando a pergunta atual
        memoria_ia_dados.append({"role": "user", "content": mensagem_atual})

        # Chamada para OpenRouter
        completion = client.chat.completions.create(
            model=os.getenv("MODELO_IA"),
            messages=memoria_ia_dados
        )
        
        mensagem_ia = completion.choices[0].message.content

        # Criptografia e Salvamento
        msg_user_enc = f.encrypt(mensagem_atual.encode("utf-8")).decode("utf-8")
        msg_ia_enc = f.encrypt(mensagem_ia.encode("utf-8")).decode("utf-8")

        numero_mensagem_ia_atual = notebook_mensagens_ia.objects.filter(id_usuario=usuario_id)
        numero_mensagem_ia_atual = numero_mensagem_ia_atual.count()

        notebook_mensagens_ia.objects.create(
            id_usuario=usuario_id, 
            numero_mensagem=numero_mensagem_ia_atual + 1,
            mensagem_usuario=msg_user_enc, 
            mensagem_ia=msg_ia_enc
        )

        return JsonResponse({"erro": "", "valor": mensagem_ia})

    except jwt.ExpiredSignatureError:
        return JsonResponse({"erro": "Sessão expirada"})
    
    except Exception as e:
        print(f"Erro: {e}")
        return JsonResponse({"erro": "Ocorreu um erro no processamento"})
    
def pegar_chats_antigo(request):
    if (request.method == "GET"):
        jwt_token = request.META.get("HTTP_AUTHORIZATION").split(" ")[1]

        try:
            jwt_token = jwt.decode(jwt_token, os.getenv("JWT_KEY"), algorithms=["HS256"])

            notebook_usuario.objects.get(id=jwt_token["id"])

            try:
                dados = notebook_mensagens_ia.objects.filter(id_usuario=jwt_token["id"]).values("mensagem_usuario", "mensagem_ia").order_by("numero_mensagem")

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