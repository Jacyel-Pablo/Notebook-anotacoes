from django.db import models
from django.db.models import Model
import uuid

# Create your models here.

class notebook_usuario(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.CharField(max_length=800, unique=True)
    senha = models.CharField(max_length=800)
    ativo = models.BooleanField(default=False)

    def __str__(self):
        return f"id: {self.id} | email: {self.email} | senha: {self.senha} | ativo: {self.ativo}"