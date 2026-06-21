from django.db import models
from django.contrib.auth.models import User

class Event(models.Model):
    creator = models.ForeignKey(
    User,
    on_delete=models.CASCADE,
    related_name='events'
)
    title = models.CharField(max_length=200)
    description = models.TextField()
    date = models.DateField()
    time = models.TimeField()
    venue = models.CharField(max_length=255)
    capacity = models.IntegerField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)
class Registration(models.Model):
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE
    )

    event = models.ForeignKey(
        Event,
        on_delete=models.CASCADE
    )

    registered_at = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return self.title