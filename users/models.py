from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    # можно будет расширить поля позже
    pass

    def __str__(self):
        return self.email or self.username