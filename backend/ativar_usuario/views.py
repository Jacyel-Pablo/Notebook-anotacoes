from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from cadastro.models import notebook_usuario
import hashlib

# Create your views here.

@csrf_exempt
def ativar_usuario(request):
    try:
        email = hashlib.sha256(request.GET["email"].encode()).hexdigest()

        notebook_usuario.objects.filter(email=email).update(ativo=True)

        return JsonResponse(True, safe=False)

    except Exception as e:
        print(e)
        return JsonResponse("Ocorreu um erro inesperado", safe=False)
