from django.db import models
import uuid

# Create your models here.

class notebook_mensagens_ia(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    id_usuario = models.CharField(max_length=20000, default="")
    numero_mensagem = models.IntegerField(default="0")
    mensagem_usuario = models.CharField(max_length=20000)
    mensagem_ia = models.CharField(max_length=20000)

    def __str__(self):
        return f"id do usuário: {self.id_usuario} | mensagem do usuário: {self.mensagem_usuario} | mensagem ia: {self.mensagem_ia}"