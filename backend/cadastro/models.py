from django.db import models
from django.db.models import Model

# Create your models here.

class notebook_usuario(models.Model):
    email = models.CharField(max_length=100, unique=True)
    senha = models.CharField(max_length=100)
    ativo = models.BooleanField(default=False)

    def __str__(self):
        return f"email: {self.email} | senha: {self.senha} | ativo: {self.ativo}"