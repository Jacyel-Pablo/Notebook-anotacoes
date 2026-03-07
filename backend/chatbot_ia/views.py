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
    
    tools = [
        {
            "type": "function",
            "function": {
                "name": "sair",
                "description": "Encerra a sessão atual do usuário e sai do app, apagando os tokens de acesso do navegador",
                "parameters": {
                    "type": "object",
                    "properties": {}, # Sem parâmetros necessários para logout
                    "required": []
                },
            }
        },
        {
            "type": "function",
            "function": {
                "name": "criar_anotacao",
                "description": "Cria uma nova anotação ou nota para o usuário.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "conteudo": {
                            "type": "string",
                            "description": "O texto da anotação que o usuário deseja salvar."
                        },
                    },
                    "required": ["conteudo"]
                },
            },
        },
        {
            "type": "function",
            "function": {
                "name": "criar_topico",
                "description": "Cria um nome para um novo tópico, onde o usuário pode adicionar novas anotações",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "conteudo": {
                            "type": "string",
                            "description": "Você deve colocar o nome do novo tópico de acordo com o tema que o usuário ter solicita"
                        },
                    },
                    "required": ["conteudo"]
                },
            },
        },
        {
            "type": "function",
            "function": {
                "name": "apagar_conta",
                "description": "Apagar a conta do usuário definitivamente do servidor sem meios de recuperação",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "conteudo": {
                            "type": "string",
                            "description": "Você deve excluir a conta do usuário quando ele solicita mas antés peça uma confirmação pois essa ação não pode se desfeita"
                        },
                    },
                    "required": ["conteudo"]
                },
            },
        }
    ]

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
            messages=memoria_ia_dados,
            tools=tools,
            tool_choice="auto"
        )
        
        response_message = completion.choices[0].message
        mensagem_ia_texto = response_message.content or "" 
        funcao_atual = ""

        # Criptografia e Salvamento
        msg_user_enc = f.encrypt(mensagem_atual.encode("utf-8")).decode("utf-8")

        numero_mensagem_ia_atual = notebook_mensagens_ia.objects.filter(id_usuario=usuario_id)
        numero_mensagem_ia_atual = numero_mensagem_ia_atual.count()

        funcao_atual = ""
        conteudo = ""

        # Verifica se a Iamai chamou alguma ferramenta
        if response_message.tool_calls:
            # Adicionamos a intenção da IA na memória isso é usar uma ferramenta
            memoria_ia_dados.append(response_message)

            for tool_call in response_message.tool_calls:
                match (tool_call.function.name):
                    case "sair":
                        funcao_atual = "sair"

                        if (len(mensagem_ia_texto) == 0):
                            mensagem_ia_texto = "Sessão fechada com sucesso senhor(a)"

                    case "criar_anotacao":
                        funcao_atual = "criar_anotacao"
                        conteudo = json.loads(tool_call.function.arguments)["conteudo"]

                        if (len(mensagem_ia_texto) == 0):
                            mensagem_ia_texto = "Anotação criada com sucesso senhor(a)"

                    case "criar_topico":
                        funcao_atual = "criar_topico"
                        conteudo = json.loads(tool_call.function.arguments)["conteudo"]

                        if (len(mensagem_ia_texto) == 0):
                            mensagem_ia_texto = "Tópico criado com sucesso senhor(a)"

                    case "apagar_conta":
                        funcao_atual = "apagar_conta"
                        conteudo = json.loads(tool_call.function.arguments)["conteudo"]

                        if (len(mensagem_ia_texto) == 0):
                            mensagem_ia_texto = "Usuário apagador com sucesso senhor(a)"

                # Definimos o que o SISTEMA vai dizer para a IA
                resultado_sistema = f"Tarefa '{tool_call.function.name}' executada com sucesso."

                # Adicionamos a resposta da ferramenta na memória
                memoria_ia_dados.append({
                    "role": "tool",
                    "tool_call_id": tool_call.id,
                    "name": tool_call.function.name,
                    "content": resultado_sistema
                })

                # SEGUNDA CHAMADA: A IA agora comenta a mudança
                segunda_completion = client.chat.completions.create(
                    model=os.getenv("MODELO_IA"),
                    messages=memoria_ia_dados
                )

                # Pegar a mensagem da IA
                mensagem_ia_texto = segunda_completion.choices[0].message.content
                
        # Force um fallback caso tudo falhe
        if len(mensagem_ia_texto) == 0:
            mensagem_ia_texto = "Ocorreu um erro"

        # Criptografa a mensagem da ia
        msg_ia_enc = f.encrypt(mensagem_ia_texto.encode("utf-8")).decode("utf-8")

        # Guardando dados no banco
        notebook_mensagens_ia.objects.create(
            id_usuario=usuario_id, 
            numero_mensagem=numero_mensagem_ia_atual + 1,
            mensagem_usuario=msg_user_enc, 
            mensagem_ia=msg_ia_enc
        )

        res = JsonResponse({"erro": "", "valor": mensagem_ia_texto, "funcao_atual": funcao_atual, "conteudo": conteudo})
        res.status_code = 200

        return res

    except jwt.ExpiredSignatureError:
        res = JsonResponse({"erro": "Sessão expirada"})
        res.status_code = 401

        return JsonResponse({"erro": "Sessão expirada"})
    
    except Exception as e:
        print(f"Erro: {e}")

        res = JsonResponse({"erro": "Ocorreu um erro no processamento"})
        res.status_code = 500

        return res
    
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

                res = JsonResponse({"erro": "", "valor": dados_decrypted})
                res.status_code = 200
                return res

            except Exception as e:
                print(e)

                res = JsonResponse({"erro": "Ocorreu um erro ao tentar pegar as mensagens"})
                res.status_code = 500
                return

        except Exception as e:
            print(e)

            res = JsonResponse({"erro": "jwt inválido ou usuário"})
            res.status_code = 401
            return res

    else:
        res = JsonResponse({"erro": "Método inválido"})
        res.status_code = 405
        return res
    
def limpar_historico_chat(request):
    if (request.method == "DELETE"):
        jwt_token = request.META.get("HTTP_AUTHORIZATION").split(" ")[1]

        try:
            jwt_token = jwt.decode(jwt_token, os.getenv("JWT_KEY"), algorithms=["HS256"])

            notebook_usuario.objects.get(id=jwt_token["id"])

            try:
                notebook_mensagens_ia.objects.filter(id_usuario=jwt_token["id"]).delete()

                res = JsonResponse({"erro": ""})
                res.status_code = 200

                return res

            except Exception as e:
                print(e)

                res = JsonResponse({"erro": "Ocorreu um erro ao tentar apagar o histórico"})
                res.status_code = 500

                return res

        except Exception as e:
            print(e)

            res = JsonResponse({"erro": "jwt inválido ou usuário"})
            res.status_code = 401

            return res

    else:
        res = JsonResponse({"erro": "Método inválido"})
        res.status_code = 405

        return res