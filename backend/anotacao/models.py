from django.db import models
from cadastro.models import notebook_usuario
import uuid

# Create your models here.

class notebook_anotacoes(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    usuario = models.ForeignKey(notebook_usuario, on_delete=models.CASCADE)
    anotacao = models.CharField(max_length=900)
    data = models.DateField(auto_now_add=True)

    def __str__(self):
        return f"id: {self.id} | usuario: {self.usuario} | anotacao: {self.anotacao} | data: {self.data}"
