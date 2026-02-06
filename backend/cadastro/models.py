from django.db import models
from django.db.models import Model
import uuid

# Create your models here.

class notebook_usuario(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    nome = models.CharField(max_length=800, unique=True)
    senha = models.CharField(max_length=800)

    def __str__(self):
        return f"id: {self.id} | email: {self.nome} | senha: {self.senha}"