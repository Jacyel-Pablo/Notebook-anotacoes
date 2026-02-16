from django.db import models
from cadastro.models import notebook_usuario
import uuid

# Create your models here.

class notebook_topicos(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    id_usuario = models.ForeignKey(notebook_usuario, on_delete=models.CASCADE, default="")
    nome_topico = models.CharField(max_length=2000)

    def __str__(self):
        return f"nome do tópico: {self.nome_topico}"